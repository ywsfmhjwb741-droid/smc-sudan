// ============================================================
// Leaderboard Service - Precomputed rankings with Redis cache
// ============================================================

import { Injectable, Logger, Inject } from "@nestjs/common";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema";
import { DATABASE_TOKEN } from "../../database/database.module";
import { CacheService, CACHE_TTL } from "../../cache/cache.service";
import type { LeaderboardFilter, PaginatedLeaderboard, LeaderboardEntry } from "@smc/types";

type Db = NodePgDatabase<typeof schema>;

const LEADERBOARD_REDIS_KEY = "leaderboard:global";

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Db,
    private readonly cache: CacheService
  ) {}

  async getLeaderboard(filter: LeaderboardFilter): Promise<PaginatedLeaderboard> {
    const { page = 1, limit = 50, search, region, season } = filter;
    const cacheKey = `leaderboard:${JSON.stringify(filter)}`;

    return this.cache.getOrSet(
      cacheKey,
      () => this.computeLeaderboard(filter),
      CACHE_TTL.LEADERBOARD
    );
  }

  private async computeLeaderboard(filter: LeaderboardFilter): Promise<PaginatedLeaderboard> {
    const { page = 1, limit = 50, search, region } = filter;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [
      eq(schema.players.isActive, true),
      eq(schema.players.isBanned, false),
    ];

    if (region) {
      conditions.push(eq(schema.players.region, region));
    }

    if (search) {
      conditions.push(ilike(schema.players.username, `%${search}%`));
    }

    // Join players with their stats
    const [entries, countResult] = await Promise.all([
      this.db
        .select({
          playerId: schema.players.id,
          username: schema.players.username,
          avatarUrl: schema.players.avatarUrl,
          region: schema.players.region,
          lastSyncAt: schema.players.lastSyncAt,
          rankTier: schema.playerStats.rankTier,
          rankDivision: schema.playerStats.rankDivision,
          rankStars: schema.playerStats.rankStars,
          rankPoints: schema.playerStats.rankPoints,
          leaderboardWeight: schema.playerStats.leaderboardWeight,
          winRate: schema.playerStats.winRate,
          totalMatches: schema.playerStats.totalMatches,
        })
        .from(schema.players)
        .innerJoin(
          schema.playerStats,
          eq(schema.players.id, schema.playerStats.playerId)
        )
        .where(and(...conditions))
        .orderBy(desc(schema.playerStats.leaderboardWeight))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.players)
        .innerJoin(
          schema.playerStats,
          eq(schema.players.id, schema.playerStats.playerId)
        )
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const leaderboardEntries: LeaderboardEntry[] = entries.map((e, idx) => ({
      rank: offset + idx + 1,
      playerId: e.playerId,
      username: e.username,
      avatarUrl: e.avatarUrl,
      rankInfo: {
        tier: e.rankTier,
        division: (e.rankDivision as LeaderboardEntry["rankInfo"]["division"]) ?? null,
        stars: e.rankStars ?? 0,
        points: e.rankPoints ?? 0,
        leaderboardWeight: e.leaderboardWeight ?? 0,
      },
      winRate: e.winRate ?? 0,
      totalMatches: e.totalMatches ?? 0,
      region: e.region,
      lastSyncAt: e.lastSyncAt,
    }));

    return {
      entries: leaderboardEntries,
      total,
      page,
      limit,
      totalPages,
      cachedAt: new Date(),
    };
  }

  // Rebuild Redis sorted set leaderboard for O(log N) rank lookups
  async rebuildRedisLeaderboard(): Promise<void> {
    this.logger.log("Rebuilding Redis leaderboard...");

    const allPlayers = await this.db
      .select({
        playerId: schema.players.id,
        leaderboardWeight: schema.playerStats.leaderboardWeight,
      })
      .from(schema.players)
      .innerJoin(
        schema.playerStats,
        eq(schema.players.id, schema.playerStats.playerId)
      )
      .where(
        and(
          eq(schema.players.isActive, true),
          eq(schema.players.isBanned, false)
        )
      );

    // Clear and rebuild
    await this.cache.delPattern(`${LEADERBOARD_REDIS_KEY}*`);

    for (const player of allPlayers) {
      await this.cache.leaderboardAdd(
        LEADERBOARD_REDIS_KEY,
        player.playerId,
        player.leaderboardWeight ?? 0
      );
    }

    this.logger.log(`Redis leaderboard rebuilt with ${allPlayers.length} players`);
  }

  async getPlayerRank(playerId: string): Promise<number | null> {
    return this.cache.leaderboardGetRank(LEADERBOARD_REDIS_KEY, playerId);
  }

  async saveLeaderboardSnapshot(seasonId?: string): Promise<void> {
    const snapshot = await this.computeLeaderboard({ page: 1, limit: 1000 });

    await this.db.insert(schema.leaderboardSnapshots).values({
      seasonId: seasonId ?? null,
      snapshotData: snapshot,
      totalPlayers: snapshot.total,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    this.logger.log(`Leaderboard snapshot saved with ${snapshot.total} players`);
  }
}
