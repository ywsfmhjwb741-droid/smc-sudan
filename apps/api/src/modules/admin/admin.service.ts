import { Injectable, Inject } from "@nestjs/common";
import { eq, desc, count } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema";
import { DATABASE_TOKEN } from "../../database/database.module";
import { SyncQueueService } from "../../queue/sync.processor";
import { PlayersService } from "../players/players.service";
import { UnifiedFetcher } from "../../data-layer/fetcher/unified-fetcher";

type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Db,
    private readonly syncQueue: SyncQueueService,
    private readonly playersService: PlayersService,
    private readonly fetcher: UnifiedFetcher
  ) {}

  async getDashboardStats() {
    const [playerCount, failedSyncs, recentLogs, queueMetrics, sourceHealth] =
      await Promise.all([
        this.db.select({ count: count() }).from(schema.players),
        this.db
          .select({ count: count() })
          .from(schema.syncLogs)
          .where(eq(schema.syncLogs.status, "failed")),
        this.db
          .select()
          .from(schema.syncLogs)
          .orderBy(desc(schema.syncLogs.createdAt))
          .limit(20),
        this.syncQueue.getQueueMetrics(),
        this.fetcher.getSourceHealthMetrics(),
      ]);

    return {
      totalPlayers: playerCount[0]?.count ?? 0,
      failedSyncs: failedSyncs[0]?.count ?? 0,
      recentLogs,
      queueMetrics,
      sourceHealth,
    };
  }

  async forceSyncPlayer(playerId: string): Promise<void> {
    await this.playersService.syncPlayer(playerId);
  }

  async banPlayer(playerId: string, reason: string): Promise<void> {
    await this.db
      .update(schema.players)
      .set({ isBanned: true, banReason: reason, updatedAt: new Date() })
      .where(eq(schema.players.id, playerId));
  }

  async unbanPlayer(playerId: string): Promise<void> {
    await this.db
      .update(schema.players)
      .set({ isBanned: false, banReason: null, updatedAt: new Date() })
      .where(eq(schema.players.id, playerId));
  }

  async getFailedSyncJobs() {
    return this.syncQueue.getFailedJobs(50);
  }

  async retryFailedJob(jobId: string): Promise<void> {
    await this.syncQueue.retryFailedJob(jobId);
  }

  async pauseSyncQueue(): Promise<void> {
    await this.syncQueue.pauseQueue();
  }

  async resumeSyncQueue(): Promise<void> {
    await this.syncQueue.resumeQueue();
  }
}
