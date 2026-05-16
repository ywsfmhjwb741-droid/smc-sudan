// ============================================================
// Unified Fetcher - Multi-source with automatic fallback
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import type {
  DataSource,
  FetchResult,
  FetchError,
  MlbbRawProfile,
  MlbbRawRank,
  MlbbRawHeroStats,
} from "@smc/types";
import { getExponentialBackoffDelay } from "@smc/utils";
import { MlbbApiAdapter } from "../adapters/mlbb-api.adapter";
import { MlbbScraperAdapter } from "../adapters/mlbb-scraper.adapter";
import { CircuitBreaker } from "../circuit-breaker";
import { CacheService } from "../../cache/cache.service";

export interface UnifiedPlayerData {
  profile: MlbbRawProfile;
  rank: MlbbRawRank;
  heroStats: MlbbRawHeroStats[];
}

@Injectable()
export class UnifiedFetcher {
  private readonly logger = new Logger(UnifiedFetcher.name);

  private readonly circuitBreakers = new Map<DataSource, CircuitBreaker>([
    ["mlbb-api", new CircuitBreaker("mlbb-api", { failureThreshold: 5, recoveryTimeout: 60000 })],
    ["scraper", new CircuitBreaker("scraper", { failureThreshold: 8, recoveryTimeout: 120000 })],
    ["puppeteer", new CircuitBreaker("puppeteer", { failureThreshold: 3, recoveryTimeout: 300000 })],
  ]);

  private readonly adapters: Array<{
    source: DataSource;
    fetch: (id: string, serverId?: string) => Promise<{ data: UnifiedPlayerData | null; error: FetchError | null }>;
  }>;

  constructor(
    private readonly mlbbApi: MlbbApiAdapter,
    private readonly scraper: MlbbScraperAdapter,
    private readonly cache: CacheService
  ) {
    this.adapters = [
      {
        source: "mlbb-api",
        fetch: (id, serverId) => this.mlbbApi.fetchPlayerData(id, serverId),
      },
      {
        source: "scraper",
        fetch: (id, serverId) => this.scraper.fetchPlayerData(id, serverId),
      },
    ];
  }

  async fetchPlayer(
    mlbbId: string,
    serverId?: string
  ): Promise<FetchResult<UnifiedPlayerData>> {
    const cacheKey = `player:${mlbbId}:${serverId ?? "default"}`;
    const startTime = Date.now();

    // Check cache first
    const cached = await this.cache.get<UnifiedPlayerData>(cacheKey);
    if (cached) {
      return {
        data: cached,
        source: "mlbb-api",
        cached: true,
        duration: Date.now() - startTime,
        error: null,
      };
    }

    // Try each adapter in priority order
    for (const adapter of this.adapters) {
      const breaker = this.circuitBreakers.get(adapter.source);

      if (!breaker?.isAvailable) {
        this.logger.warn(
          `Circuit breaker OPEN for source: ${adapter.source}, skipping`
        );
        continue;
      }

      const result = await this.fetchWithRetry(
        adapter.source,
        () => adapter.fetch(mlbbId, serverId),
        3
      );

      if (result.data) {
        breaker.recordSuccess();

        // Cache the result
        await this.cache.set(cacheKey, result.data, 900); // 15 min TTL

        return {
          data: result.data,
          source: adapter.source,
          cached: false,
          duration: Date.now() - startTime,
          error: null,
        };
      } else {
        breaker.recordFailure();
        this.logger.warn(
          `Source ${adapter.source} failed: ${result.error?.message}`
        );
      }
    }

    return {
      data: null,
      source: "mlbb-api",
      cached: false,
      duration: Date.now() - startTime,
      error: {
        code: "ALL_SOURCES_FAILED",
        message: "All data sources exhausted without success",
        source: "mlbb-api",
        retryable: true,
      },
    };
  }

  private async fetchWithRetry<T>(
    source: DataSource,
    fn: () => Promise<{ data: T | null; error: FetchError | null }>,
    maxRetries: number
  ): Promise<{ data: T | null; error: FetchError | null }> {
    let lastError: FetchError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = getExponentialBackoffDelay(attempt - 1, 1000, 10000);
        this.logger.debug(
          `Retry ${attempt}/${maxRetries} for ${source} after ${delay}ms`
        );
        await this.sleep(delay);
      }

      try {
        const result = await fn();
        if (result.data) return result;
        lastError = result.error;

        // Don't retry non-retryable errors
        if (result.error && !result.error.retryable) {
          return result;
        }
      } catch (err) {
        lastError = {
          code: "UNEXPECTED_ERROR",
          message: String(err),
          source,
          retryable: true,
        };
      }
    }

    return { data: null, error: lastError };
  }

  getSourceHealthMetrics() {
    const metrics: Record<string, ReturnType<CircuitBreaker["getMetrics"]>> = {};
    for (const [source, breaker] of this.circuitBreakers) {
      metrics[source] = breaker.getMetrics();
    }
    return metrics;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
