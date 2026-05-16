// ============================================================
// Players Service - Core player management
// ============================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { eq, desc, and, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema";
import { DATABASE_TOKEN } from "../../database/database.module";
import { UnifiedFetcher } from "../../data-layer/fetcher/unified-fetcher";
import { CacheService, CACHE_TTL } from "../../cache/cache.service";
import { SyncQueueService } from "../../queue/sync.processor";
import {
  calculateLeaderboardWeight,
  calculateWinRate,
  calculateSyncPriority,
  parseRankString,
} from "@smc/utils";
import type { Player, PlayerStats } from "@smc/types";

type Db = NodePgDatabase<typeof schema>;

export interface RegisterPlayerDto {
  mlbbId: string;
  serverId?: string;
}

export interface PlayerProfileResponse {
  player: typeof schema.players.$inferSelect;
  stats: typeof schema.playerStats.$inferSelect | null;
  heroStats: (typeof schema.heroStats.$inferSelect)[];
  rankHistory: (typeof schema.rankHistory.$inferSelect)[];
  recentSnapshots: (typeof schema.statSnapshots.$inferSelect)[];
}

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Db,
    private readonly fetcher: UnifiedFetcher,
    private readonly cache: CacheService,
    private readonly syncQueue: SyncQueueService
  ) {}

  async registerPlayer(dto: RegisterPlayerDto): Promise<typeof schema.players.$inferSelect> {
    const { mlbbId, serverId } = dto;

    // Check if already registered
    const existing = await this.db
      .select()
      .from(schema.players)
      .where(
        and(
          eq(schema.players.mlbbId, mlbbId),
          serverId ? eq(schema.players.serverId, serverId) : sql`${schema.players.serverId} IS NULL`
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      throw new ConflictException(
        `Player with MLBB ID ${mlbbId} is already registered`
      );
    }

    // Fetch player data from MLBB
    this.logger.log(`Fetching MLBB data for player ${mlbbId}`);
    const fetchResult = await this.fetcher.fetchPlayer(mlbbId, serverId);

    if (!fetchResult.data) {
      throw new NotFoundException(
        `Could not find MLBB player with ID ${mlbbId}. Please verify your ID and server.`
      );
    }

    const { profile, rank } = fetchResult.data;

    // Parse rank
    const rankInfo = parseRankString(rank.rankName) ?? {
      tier: "Warrior" as const,
      division: "V" as const,
      stars: 0,
      points: 0,
      leaderboardWeight: 0,
    };

    rankInfo.leaderboardWeight = calculateLeaderboardWeight(rankInfo);

    // Get active season
    const activeSeason = await this.db
      .select()
      .from(schema.seasons)
      .where(eq(schema.seasons.isActive, true))
      .limit(1);

    const seasonId = activeSeason[0]?.id ?? null;

    // Create player record
    const [newPlayer] = await this.db
      .insert(schema.players)
      .values({
        mlbbId,
        serverId: serverId ?? null,
        username: profile.nickname,
        avatarUrl: profile.avatar || null,
        region: profile.region || null,
        level: profile.level,
        syncStatus: "success",
        lastSyncAt: new Date(),
        syncPriority: "medium",
      })
      .returning();

    if (!newPlayer) {
      throw new Error("Failed to create player record");
    }

    // Create initial stats
    await this.db.insert(schema.playerStats).values({
      playerId: newPlayer.id,
      seasonId,
      rankTier: rankInfo.tier,
      rankDivision: rankInfo.division,
      rankStars: rankInfo.stars,
      rankPoints: rankInfo.points,
      leaderboardWeight: rankInfo.leaderboardWeight,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      mvpCount: 0,
    });

    // Create initial snapshot
    await this.db.insert(schema.statSnapshots).values({
      playerId: newPlayer.id,
      seasonId,
      rankTier: rankInfo.tier,
      rankDivision: rankInfo.division,
      rankStars: rankInfo.stars,
      rankPoints: rankInfo.points,
      leaderboardWeight: rankInfo.leaderboardWeight,
      totalMatches: 0,
      wins: 0,
      winRate: 0,
      isDifferential: false,
    });

    // Schedule first sync
    await this.syncQueue.enqueueSync(
      newPlayer.id,
      mlbbId,
      "high",
      serverId,
      "registration"
    );

    this.logger.log(`Player ${mlbbId} registered successfully as ${newPlayer.id}`);
    return newPlayer;
  }

  async getPlayerProfile(playerId: string): Promise<PlayerProfileResponse> {
    const cacheKey = `profile:${playerId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const player = await this.db
          .select()
          .from(schema.players)
          .where(eq(schema.players.id, playerId))
          .limit(1);

        if (!player[0]) {
          throw new NotFoundException(`Player ${playerId} not found`);
        }

        const [stats, heroStatsData, rankHistoryData, snapshots] =
          await Promise.all([
            this.db
              .select()
              .from(schema.playerStats)
              .where(eq(schema.playerStats.playerId, playerId))
              .orderBy(desc(schema.playerStats.updatedAt))
              .limit(1),
            this.db
              .select()
              .from(schema.heroStats)
              .where(eq(schema.heroStats.playerId, playerId))
              .orderBy(desc(schema.heroStats.matches))
              .limit(20),
            this.db
              .select()
              .from(schema.rankHistory)
              .where(eq(schema.rankHistory.playerId, playerId))
              .orderBy(desc(schema.rankHistory.recordedAt))
              .limit(30),
            this.db
              .select()
              .from(schema.statSnapshots)
              .where(eq(schema.statSnapshots.playerId, playerId))
              .orderBy(desc(schema.statSnapshots.snapshotAt))
              .limit(30),
          ]);

        return {
          player: player[0],
          stats: stats[0] ?? null,
          heroStats: heroStatsData,
          rankHistory: rankHistoryData,
          recentSnapshots: snapshots,
        };
      },
      CACHE_TTL.PLAYER_PROFILE
    );
  }

  async syncPlayer(playerId: string): Promise<void> {
    const player = await this.db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .limit(1);

    if (!player[0]) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const p = player[0];

    // Fetch fresh data
    const fetchResult = await this.fetcher.fetchPlayer(
      p.mlbbId,
      p.serverId ?? undefined
    );

    if (!fetchResult.data) {
      // Log failure
      await this.db.insert(schema.syncLogs).values({
        playerId,
        source: fetchResult.source,
        status: "failed",
        duration: fetchResult.duration,
        error: fetchResult.error?.message ?? "Unknown error",
      });

      await this.db
        .update(schema.players)
        .set({ syncStatus: "failed", updatedAt: new Date() })
        .where(eq(schema.players.id, playerId));

      return;
    }

    const { profile, rank, heroStats: heroStatsData } = fetchResult.data;
    const rankInfo = parseRankString(rank.rankName) ?? {
      tier: "Warrior" as const,
      division: "V" as const,
      stars: 0,
      points: 0,
      leaderboardWeight: 0,
    };
    rankInfo.leaderboardWeight = calculateLeaderboardWeight(rankInfo);

    const activeSeason = await this.db
      .select()
      .from(schema.seasons)
      .where(eq(schema.seasons.isActive, true))
      .limit(1);
    const seasonId = activeSeason[0]?.id ?? null;

    // Update player
    await this.db
      .update(schema.players)
      .set({
        username: profile.nickname,
        avatarUrl: profile.avatar || null,
        syncStatus: "success",
        lastSyncAt: new Date(),
        nextSyncAt: new Date(
          Date.now() + getNextSyncDelayFromWeight(rankInfo.leaderboardWeight)
        ),
        updatedAt: new Date(),
      })
      .where(eq(schema.players.id, playerId));

    // Upsert stats
    await this.db
      .insert(schema.playerStats)
      .values({
        playerId,
        seasonId,
        rankTier: rankInfo.tier,
        rankDivision: rankInfo.division,
        rankStars: rankInfo.stars,
        rankPoints: rankInfo.points,
        leaderboardWeight: rankInfo.leaderboardWeight,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        mvpCount: 0,
      })
      .onConflictDoUpdate({
        target: [schema.playerStats.playerId, schema.playerStats.seasonId],
        set: {
          rankTier: rankInfo.tier,
          rankDivision: rankInfo.division,
          rankStars: rankInfo.stars,
          rankPoints: rankInfo.points,
          leaderboardWeight: rankInfo.leaderboardWeight,
          updatedAt: new Date(),
        },
      });

    // Upsert hero stats
    if (heroStatsData.length > 0) {
      for (const hero of heroStatsData) {
        const [k, d, a] = (hero.kda ?? "0/0/0").split("/").map(Number);
        const winRate = calculateWinRate(hero.wins, hero.matches);

        await this.db
          .insert(schema.heroStats)
          .values({
            playerId,
            seasonId,
            heroId: String(hero.heroId),
            heroName: hero.heroName,
            matches: hero.matches,
            wins: hero.wins,
            winRate,
            kda: k && d ? (k + (a ?? 0)) / d : 0,
            kills: k ?? 0,
            deaths: d ?? 0,
            assists: a ?? 0,
            mvpCount: hero.mvp,
          })
          .onConflictDoUpdate({
            target: [
              schema.heroStats.playerId,
              schema.heroStats.heroId,
              schema.heroStats.seasonId,
            ],
            set: {
              matches: hero.matches,
              wins: hero.wins,
              winRate,
              updatedAt: new Date(),
            },
          });
      }
    }

    // Create snapshot
    await this.db.insert(schema.statSnapshots).values({
      playerId,
      seasonId,
      rankTier: rankInfo.tier,
      rankDivision: rankInfo.division,
      rankStars: rankInfo.stars,
      rankPoints: rankInfo.points,
      leaderboardWeight: rankInfo.leaderboardWeight,
      totalMatches: 0,
      wins: 0,
      winRate: 0,
      isDifferential: false,
    });

    // Log success
    await this.db.insert(schema.syncLogs).values({
      playerId,
      source: fetchResult.source,
      status: "success",
      duration: fetchResult.duration,
    });

    // Invalidate cache
    await this.cache.del(`profile:${playerId}`);

    this.logger.log(`Player ${playerId} synced successfully`);
  }

  async searchPlayers(query: string, limit = 10) {
    return this.db
      .select()
      .from(schema.players)
      .where(
        sql`${schema.players.username} ILIKE ${"%" + query + "%"}`
      )
      .limit(limit);
  }
}

function getNextSyncDelayFromWeight(weight: number): number {
  if (weight >= 7000) return 2 * 60 * 60 * 1000;   // 2 hours
  if (weight >= 4000) return 6 * 60 * 60 * 1000;   // 6 hours
  return 24 * 60 * 60 * 1000;                        // 24 hours
}
