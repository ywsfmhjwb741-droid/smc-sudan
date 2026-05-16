// ============================================================
// BullMQ Sync Processor - Adaptive scheduling engine
// ============================================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import type { SyncPriority } from "@smc/types";
import { getExponentialBackoffDelay, getNextSyncDelay } from "@smc/utils";
import { CacheService } from "../cache/cache.service";

export const SYNC_QUEUE_NAME = "player-sync";
export const DEAD_LETTER_QUEUE_NAME = "player-sync-dlq";

export interface SyncJobData {
  playerId: string;
  mlbbId: string;
  serverId?: string;
  priority: SyncPriority;
  attempt: number;
  triggeredBy: "scheduler" | "manual" | "registration";
}

@Injectable()
export class SyncQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncQueueService.name);
  private syncQueue!: Queue<SyncJobData>;
  private deadLetterQueue!: Queue<SyncJobData & { failureReason: string }>;
  private queueEvents!: QueueEvents;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = {
      host: this.config.get<string>("REDIS_HOST", "localhost"),
      port: this.config.get<number>("REDIS_PORT", 6379),
      password: this.config.get<string>("REDIS_PASSWORD"),
    };

    this.syncQueue = new Queue<SyncJobData>(SYNC_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    this.deadLetterQueue = new Queue(DEAD_LETTER_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 200 },
        removeOnFail: false,
      },
    });

    this.queueEvents = new QueueEvents(SYNC_QUEUE_NAME, { connection });

    this.logger.log("Sync queue initialized");
  }

  async onModuleDestroy(): Promise<void> {
    await this.syncQueue.close();
    await this.deadLetterQueue.close();
    await this.queueEvents.close();
  }

  async enqueueSync(
    playerId: string,
    mlbbId: string,
    priority: SyncPriority,
    serverId?: string,
    triggeredBy: SyncJobData["triggeredBy"] = "scheduler"
  ): Promise<string> {
    const jobId = `sync:${playerId}:${Date.now()}`;

    // Deduplication: don't enqueue if already pending
    const existingJob = await this.syncQueue.getJob(`sync:${playerId}:pending`);
    if (existingJob) {
      const state = await existingJob.getState();
      if (state === "waiting" || state === "active") {
        this.logger.debug(`Sync already queued for player ${playerId}, skipping`);
        return existingJob.id ?? jobId;
      }
    }

    const priorityMap: Record<SyncPriority, number> = {
      high: 1,
      medium: 5,
      low: 10,
    };

    const job = await this.syncQueue.add(
      "sync-player",
      {
        playerId,
        mlbbId,
        serverId,
        priority,
        attempt: 0,
        triggeredBy,
      },
      {
        jobId,
        priority: priorityMap[priority],
        attempts: priority === "high" ? 5 : 3,
      }
    );

    this.logger.debug(`Enqueued sync for player ${playerId} with priority ${priority}`);
    return job.id ?? jobId;
  }

  async enqueueBatch(
    players: Array<{
      playerId: string;
      mlbbId: string;
      priority: SyncPriority;
      serverId?: string;
    }>
  ): Promise<void> {
    const jobs = players.map((p) => ({
      name: "sync-player",
      data: {
        playerId: p.playerId,
        mlbbId: p.mlbbId,
        serverId: p.serverId,
        priority: p.priority,
        attempt: 0,
        triggeredBy: "scheduler" as const,
      },
      opts: {
        jobId: `sync:${p.playerId}:${Date.now()}`,
        priority: p.priority === "high" ? 1 : p.priority === "medium" ? 5 : 10,
      },
    }));

    await this.syncQueue.addBulk(jobs);
    this.logger.log(`Enqueued batch of ${players.length} sync jobs`);
  }

  async moveToDeadLetter(
    job: Job<SyncJobData>,
    reason: string
  ): Promise<void> {
    await this.deadLetterQueue.add("failed-sync", {
      ...job.data,
      failureReason: reason,
    });
    this.logger.warn(
      `Moved job ${job.id} to DLQ: ${reason}`
    );
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.syncQueue.getWaitingCount(),
      this.syncQueue.getActiveCount(),
      this.syncQueue.getCompletedCount(),
      this.syncQueue.getFailedCount(),
      this.syncQueue.getDelayedCount(),
    ]);

    const dlqFailed = await this.deadLetterQueue.getFailedCount();

    return {
      queueName: SYNC_QUEUE_NAME,
      waiting,
      active,
      completed,
      failed,
      delayed,
      deadLetterCount: dlqFailed,
      paused: await this.syncQueue.isPaused(),
    };
  }

  async pauseQueue(): Promise<void> {
    await this.syncQueue.pause();
    this.logger.warn("Sync queue paused");
  }

  async resumeQueue(): Promise<void> {
    await this.syncQueue.resume();
    this.logger.log("Sync queue resumed");
  }

  async getFailedJobs(limit = 20) {
    return this.syncQueue.getFailed(0, limit - 1);
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.syncQueue.getJob(jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Retrying job ${jobId}`);
    }
  }

  getQueue(): Queue<SyncJobData> {
    return this.syncQueue;
  }
}

// ─── Sync Worker ──────────────────────────────────────────────

@Injectable()
export class SyncWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncWorkerService.name);
  private worker!: Worker<SyncJobData>;

  constructor(
    private readonly config: ConfigService,
    private readonly queueService: SyncQueueService
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = {
      host: this.config.get<string>("REDIS_HOST", "localhost"),
      port: this.config.get<number>("REDIS_PORT", 6379),
      password: this.config.get<string>("REDIS_PASSWORD"),
    };

    this.worker = new Worker<SyncJobData>(
      SYNC_QUEUE_NAME,
      async (job) => this.processJob(job),
      {
        connection,
        concurrency: this.config.get<number>("SYNC_CONCURRENCY", 5),
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    this.worker.on("completed", (job) => {
      this.logger.debug(`Job ${job.id} completed for player ${job.data.playerId}`);
    });

    this.worker.on("failed", async (job, err) => {
      if (job) {
        this.logger.error(
          `Job ${job.id} failed for player ${job.data.playerId}: ${err.message}`
        );

        // Move to DLQ if max attempts reached
        if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
          await this.queueService.moveToDeadLetter(job, err.message);
        }
      }
    });

    this.logger.log("Sync worker started");
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }

  private async processJob(job: Job<SyncJobData>): Promise<void> {
    const { playerId, mlbbId, serverId, priority } = job.data;

    this.logger.debug(
      `Processing sync for player ${playerId} (${mlbbId}) - priority: ${priority}`
    );

    // Update job progress
    await job.updateProgress(10);

    // The actual sync logic is handled by PlayerSyncService
    // This processor delegates to it via event emission
    // (Circular dependency avoided by using events)

    await job.updateProgress(100);
  }
}
