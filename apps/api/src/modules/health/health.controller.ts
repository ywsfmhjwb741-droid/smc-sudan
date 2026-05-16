import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from "@nestjs/terminus";
import { CacheService } from "../../cache/cache.service";
import { SyncQueueService } from "../../queue/sync.processor";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly cache: CacheService,
    private readonly syncQueue: SyncQueueService
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const [redisOk, queueMetrics] = await Promise.all([
      this.cache.ping(),
      this.syncQueue.getQueueMetrics(),
    ]);

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisOk ? "healthy" : "unhealthy",
        queue: {
          status: "healthy",
          metrics: queueMetrics,
        },
      },
    };
  }

  @Get("ready")
  async readiness() {
    const redisOk = await this.cache.ping();
    return {
      ready: redisOk,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("live")
  liveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
