// ============================================================
// Redis Cache Service - Stale-while-revalidate + TTL
// ============================================================

import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { safeJsonParse } from "@smc/utils";

export const CACHE_TTL = {
  PLAYER_PROFILE: 900,       // 15 minutes
  HERO_STATS: 1800,          // 30 minutes
  LEADERBOARD: 300,          // 5 minutes
  SOURCE_HEALTH: 60,         // 1 minute
  QUEUE_METRICS: 30,         // 30 seconds
} as const;

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readonly keyPrefix = "smc:";

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: config.get<string>("REDIS_HOST", "localhost"),
      port: config.get<number>("REDIS_PORT", 6379),
      password: config.get<string>("REDIS_PASSWORD"),
      db: config.get<number>("REDIS_DB", 0),
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on("error", (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.redis.on("connect", () => {
      this.logger.log("Redis connected");
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.buildKey(key));
      if (!value) return null;
      return safeJsonParse<T>(value);
    } catch (err) {
      this.logger.warn(`Cache GET error for key ${key}: ${String(err)}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(this.buildKey(key), ttlSeconds, serialized);
    } catch (err) {
      this.logger.warn(`Cache SET error for key ${key}: ${String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(this.buildKey(key));
    } catch (err) {
      this.logger.warn(`Cache DEL error for key ${key}: ${String(err)}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Cache DEL pattern error for ${pattern}: ${String(err)}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.buildKey(key));
      return result === 1;
    } catch {
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.buildKey(key));
    } catch {
      return -1;
    }
  }

  // Stale-while-revalidate: return stale data immediately, refresh in background
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    staleSeconds = 60
  ): Promise<T> {
    const cached = await this.get<{ data: T; expiresAt: number }>(key);

    if (cached) {
      const isStale = Date.now() > cached.expiresAt - staleSeconds * 1000;
      if (isStale) {
        // Refresh in background, return stale data immediately
        void this.refreshCache(key, fetcher, ttlSeconds);
      }
      return cached.data;
    }

    const fresh = await fetcher();
    await this.set(
      key,
      { data: fresh, expiresAt: Date.now() + ttlSeconds * 1000 },
      ttlSeconds + staleSeconds
    );
    return fresh;
  }

  private async refreshCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const fresh = await fetcher();
      await this.set(
        key,
        { data: fresh, expiresAt: Date.now() + ttlSeconds * 1000 },
        ttlSeconds + 60
      );
    } catch (err) {
      this.logger.warn(`Background cache refresh failed for ${key}: ${String(err)}`);
    }
  }

  // Leaderboard-specific: Redis sorted set operations
  async leaderboardAdd(
    leaderboardKey: string,
    playerId: string,
    score: number
  ): Promise<void> {
    await this.redis.zadd(this.buildKey(leaderboardKey), score, playerId);
  }

  async leaderboardGetRange(
    leaderboardKey: string,
    start: number,
    end: number
  ): Promise<Array<{ member: string; score: number }>> {
    const results = await this.redis.zrevrangebyscore(
      this.buildKey(leaderboardKey),
      "+inf",
      "-inf",
      "WITHSCORES",
      "LIMIT",
      start,
      end - start + 1
    );

    const entries: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({
        member: results[i] as string,
        score: parseFloat(results[i + 1] as string),
      });
    }
    return entries;
  }

  async leaderboardCount(leaderboardKey: string): Promise<number> {
    return this.redis.zcard(this.buildKey(leaderboardKey));
  }

  async leaderboardGetRank(
    leaderboardKey: string,
    playerId: string
  ): Promise<number | null> {
    const rank = await this.redis.zrevrank(
      this.buildKey(leaderboardKey),
      playerId
    );
    return rank !== null ? rank + 1 : null;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  getClient(): Redis {
    return this.redis;
  }
}
