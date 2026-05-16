// ============================================================
// SMC Sudan MOBA Community - Shared Utilities
// ============================================================

import type { RankTier, RankDivision, RankInfo } from "@smc/types";

// ─── Rank Weight Calculation ──────────────────────────────────

const TIER_BASE_WEIGHTS: Record<RankTier, number> = {
  Warrior: 0,
  Elite: 1000,
  Master: 2000,
  Grandmaster: 3000,
  Epic: 4000,
  Legend: 5000,
  Mythic: 6000,
  MythicHonor: 7000,
  MythicGlory: 8000,
  MythicImmortal: 9000,
};

const DIVISION_WEIGHTS: Record<NonNullable<RankDivision>, number> = {
  V: 0,
  IV: 100,
  III: 200,
  II: 300,
  I: 400,
};

/**
 * Calculates a deterministic leaderboard weight from rank info.
 * Higher weight = higher rank on leaderboard.
 */
export function calculateLeaderboardWeight(rank: RankInfo): number {
  const tierBase = TIER_BASE_WEIGHTS[rank.tier];
  const divisionBonus = rank.division ? DIVISION_WEIGHTS[rank.division] : 0;
  const starsBonus = rank.stars * 10;
  const pointsBonus = rank.points;
  return tierBase + divisionBonus + starsBonus + pointsBonus;
}

/**
 * Parses a rank string like "Mythic 500" or "Legend I 4★" into RankInfo.
 */
export function parseRankString(rankStr: string): RankInfo | null {
  if (!rankStr) return null;

  const mythicMatch = rankStr.match(/Mythic(?:\s+(Honor|Glory|Immortal))?\s*(\d+)?/i);
  if (mythicMatch) {
    const variant = mythicMatch[1]?.toLowerCase();
    const points = parseInt(mythicMatch[2] ?? "0", 10);
    let tier: RankTier = "Mythic";
    if (variant === "honor") tier = "MythicHonor";
    if (variant === "glory") tier = "MythicGlory";
    if (variant === "immortal") tier = "MythicImmortal";
    const info: RankInfo = { tier, division: null, stars: 0, points, leaderboardWeight: 0 };
    info.leaderboardWeight = calculateLeaderboardWeight(info);
    return info;
  }

  const tieredMatch = rankStr.match(
    /(Warrior|Elite|Master|Grandmaster|Epic|Legend)\s*(I{1,3}|IV|V)?\s*(\d+)?/i
  );
  if (tieredMatch) {
    const tierRaw = tieredMatch[1] as RankTier;
    const divisionRaw = (tieredMatch[2]?.toUpperCase() ?? null) as RankDivision | null;
    const stars = parseInt(tieredMatch[3] ?? "0", 10);
    const info: RankInfo = {
      tier: tierRaw,
      division: divisionRaw,
      stars,
      points: 0,
      leaderboardWeight: 0,
    };
    info.leaderboardWeight = calculateLeaderboardWeight(info);
    return info;
  }

  return null;
}

// ─── Win Rate Utilities ───────────────────────────────────────

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 10000) / 100;
}

export function formatWinRate(winRate: number): string {
  return `${winRate.toFixed(1)}%`;
}

// ─── KDA Utilities ────────────────────────────────────────────

export function calculateKda(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / deaths) * 100) / 100;
}

export function formatKda(kda: number): string {
  return kda.toFixed(2);
}

// ─── Sync Priority Calculation ────────────────────────────────

export function calculateSyncPriority(
  leaderboardWeight: number,
  lastSyncAt: Date | null
): "high" | "medium" | "low" {
  const hoursSinceSync = lastSyncAt
    ? (Date.now() - lastSyncAt.getTime()) / (1000 * 60 * 60)
    : Infinity;

  // Top players (high weight) sync more frequently
  if (leaderboardWeight >= 7000) {
    return hoursSinceSync >= 2 ? "high" : "medium";
  }
  if (leaderboardWeight >= 4000) {
    return hoursSinceSync >= 6 ? "high" : "low";
  }
  return hoursSinceSync >= 24 ? "medium" : "low";
}

// ─── Time Utilities ───────────────────────────────────────────

export function getNextSyncDelay(
  priority: "high" | "medium" | "low"
): number {
  const delays = {
    high: 2 * 60 * 60 * 1000,    // 2 hours
    medium: 6 * 60 * 60 * 1000,  // 6 hours
    low: 24 * 60 * 60 * 1000,    // 24 hours
  };
  return delays[priority];
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ─── Reliability Score ────────────────────────────────────────

export function calculateReliabilityScore(
  successCount: number,
  failureCount: number
): number {
  const total = successCount + failureCount;
  if (total === 0) return 100;
  return Math.round((successCount / total) * 100);
}

// ─── Pagination Utilities ─────────────────────────────────────

export function getPaginationMeta(
  total: number,
  page: number,
  limit: number
): { totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } {
  const totalPages = Math.ceil(total / limit);
  return {
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ─── Exponential Backoff ──────────────────────────────────────

export function getExponentialBackoffDelay(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * delay * 0.1;
  return Math.floor(delay + jitter);
}

// ─── Slug Generation ──────────────────────────────────────────

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ─── Safe JSON Parse ──────────────────────────────────────────

export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
