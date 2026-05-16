// ============================================================
// Sync Scheduler - Adaptive cron-based sync orchestration
// ============================================================

import { Injectable, Logger, Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { eq, lte, and, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema";
import { DATABASE_TOKEN } from "../../database/database.module";
import { SyncQueueService } from "../../queue/sync.processor";
import { PlayersService } from "../players/players.service";
import { LeaderboardService } from "../leaderboard/leaderboard.service";

type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Db,
    private readonly syncQueue: SyncQueueService,
    private readonly playersService: PlayersService,
    private readonly leaderboardService: LeaderboardService
  ) {}

  // Run every 15 minutes: enqueue players due for sync
  @Cron("*/15 * * * *")
  async scheduleDueSyncs(): Promise<void> {
    this.logger.debug("Running scheduled sync check...");

    const now = new Date();

    const duePlayers = await this.db
      .select({
        id: schema.players.id,
        mlbbId: schema.players.mlbbId,
        serverId: schema.players.serverId,
        syncPriority: schema.players.syncPriority,
      })
      .from(schema.players)
      .where(
        and(
          eq(schema.players.isActive, true),
          eq(schema.players.isBanned, false),
          lte(schema.players.nextSyncAt, now)
        )
      )
      .limit(100);

    if (duePlayers.length === 0) {
      this.logger.debug("No players due for sync");
      return;
    }

    await this.syncQueue.enqueueBatch(
      duePlayers.map((p) => ({
        playerId: p.id,
        mlbbId: p.mlbbId,
        priority: p.syncPriority,
        serverId: p.serverId ?? undefined,
      }))
    );

    this.logger.log(`Enqueued ${duePlayers.length} players for sync`);
  }

  // Rebuild leaderboard cache every 5 minutes
  @Cron("*/5 * * * *")
  async rebuildLeaderboardCache(): Promise<void> {
    try {
      await this.leaderboardService.rebuildRedisLeaderboard();
    } catch (err) {
      this.logger.error(`Leaderboard rebuild failed: ${String(err)}`);
    }
  }

  // Save leaderboard snapshot daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async saveLeaderboardSnapshot(): Promise<void> {
    try {
      await this.leaderboardService.saveLeaderboardSnapshot();
      this.logger.log("Daily leaderboard snapshot saved");
    } catch (err) {
      this.logger.error(`Snapshot save failed: ${String(err)}`);
    }
  }

  // Clean old sync logs weekly
  @Cron(CronExpression.EVERY_WEEK)
  async cleanOldSyncLogs(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.db
      .delete(schema.syncLogs)
      .where(lte(schema.syncLogs.createdAt, thirtyDaysAgo));

    this.logger.log(`Cleaned old sync logs`);
  }
}
