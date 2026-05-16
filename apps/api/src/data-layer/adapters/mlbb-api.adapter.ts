// ============================================================
// MLBB API Adapter - Reverse-engineered MLBB endpoints
// Priority: 1 (highest)
// ============================================================

import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  MlbbRawProfile,
  MlbbRawRank,
  MlbbRawHeroStats,
  FetchError,
} from "@smc/types";

export interface MlbbApiAdapterConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  userAgent: string;
}

const DEFAULT_CONFIG: MlbbApiAdapterConfig = {
  baseUrl: "https://m.mobilelegends.com",
  timeout: 10000,
  maxRetries: 3,
  userAgent:
    "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
};

export interface MlbbPlayerData {
  profile: MlbbRawProfile;
  rank: MlbbRawRank;
  heroStats: MlbbRawHeroStats[];
}

export class MlbbApiAdapter {
  private readonly client: AxiosInstance;
  private readonly config: MlbbApiAdapterConfig;

  constructor(config: Partial<MlbbApiAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        "User-Agent": this.config.userAgent,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Referer: "https://m.mobilelegends.com/",
      },
    });
  }

  async fetchPlayerData(
    mlbbId: string,
    serverId?: string
  ): Promise<{ data: MlbbPlayerData | null; error: FetchError | null }> {
    try {
      const [profileResult, rankResult, heroResult] = await Promise.allSettled([
        this.fetchProfile(mlbbId, serverId),
        this.fetchRank(mlbbId, serverId),
        this.fetchHeroStats(mlbbId, serverId),
      ]);

      if (profileResult.status === "rejected") {
        return {
          data: null,
          error: {
            code: "PROFILE_FETCH_FAILED",
            message: String(profileResult.reason),
            source: "mlbb-api",
            retryable: true,
          },
        };
      }

      const profile = profileResult.value;
      const rank = rankResult.status === "fulfilled" ? rankResult.value : null;
      const heroStats =
        heroResult.status === "fulfilled" ? heroResult.value : [];

      if (!profile) {
        return {
          data: null,
          error: {
            code: "PLAYER_NOT_FOUND",
            message: `Player ${mlbbId} not found`,
            source: "mlbb-api",
            retryable: false,
          },
        };
      }

      return {
        data: {
          profile,
          rank: rank ?? this.getDefaultRank(),
          heroStats,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: this.normalizeError(err),
      };
    }
  }

  private async fetchProfile(
    mlbbId: string,
    serverId?: string
  ): Promise<MlbbRawProfile | null> {
    // Attempt multiple known MLBB API endpoints
    const endpoints = [
      `/api/user/profile?userId=${mlbbId}&serverId=${serverId ?? ""}`,
      `/rank/api/user?uid=${mlbbId}&zone=${serverId ?? ""}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.client.get<{
          code: number;
          data: {
            user_id?: string;
            nickname?: string;
            head_url?: string;
            level?: number;
            region?: string;
          };
        }>(endpoint);

        if (response.data?.code === 0 && response.data?.data) {
          const raw = response.data.data;
          return {
            userId: mlbbId,
            serverId: serverId ?? "",
            nickname: raw.nickname ?? `Player_${mlbbId}`,
            avatar: raw.head_url ?? "",
            level: raw.level ?? 1,
            region: raw.region ?? "unknown",
          };
        }
      } catch {
        // Try next endpoint
        continue;
      }
    }

    return null;
  }

  private async fetchRank(
    mlbbId: string,
    serverId?: string
  ): Promise<MlbbRawRank | null> {
    try {
      const response = await this.client.get<{
        code: number;
        data: {
          rank_id?: number;
          rank_name?: string;
          rank_icon?: string;
          stars?: number;
          points?: number;
          season?: string;
        };
      }>(`/rank/api/rank?uid=${mlbbId}&zone=${serverId ?? ""}`);

      if (response.data?.code === 0 && response.data?.data) {
        const raw = response.data.data;
        return {
          rankId: raw.rank_id ?? 0,
          rankName: raw.rank_name ?? "Warrior",
          rankIcon: raw.rank_icon ?? "",
          stars: raw.stars ?? 0,
          points: raw.points ?? 0,
          season: raw.season ?? "current",
        };
      }
    } catch {
      // Fall through to return null
    }

    return null;
  }

  private async fetchHeroStats(
    mlbbId: string,
    serverId?: string
  ): Promise<MlbbRawHeroStats[]> {
    try {
      const response = await this.client.get<{
        code: number;
        data: Array<{
          hero_id?: number;
          hero_name?: string;
          match_count?: number;
          win_count?: number;
          kda?: string;
          mvp?: number;
        }>;
      }>(`/rank/api/hero?uid=${mlbbId}&zone=${serverId ?? ""}`);

      if (response.data?.code === 0 && Array.isArray(response.data?.data)) {
        return response.data.data.map((h) => ({
          heroId: h.hero_id ?? 0,
          heroName: h.hero_name ?? "Unknown",
          matches: h.match_count ?? 0,
          wins: h.win_count ?? 0,
          kda: h.kda ?? "0/0/0",
          mvp: h.mvp ?? 0,
        }));
      }
    } catch {
      // Fall through
    }

    return [];
  }

  private getDefaultRank(): MlbbRawRank {
    return {
      rankId: 1,
      rankName: "Warrior V",
      rankIcon: "",
      stars: 0,
      points: 0,
      season: "current",
    };
  }

  private normalizeError(err: unknown): FetchError {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const retryable = !status || status >= 500 || status === 429;
      return {
        code: `HTTP_${status ?? "UNKNOWN"}`,
        message: err.message,
        source: "mlbb-api",
        retryable,
      };
    }
    return {
      code: "UNKNOWN_ERROR",
      message: String(err),
      source: "mlbb-api",
      retryable: true,
    };
  }
}
