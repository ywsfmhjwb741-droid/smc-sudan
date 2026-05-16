import type { RankInfo } from "@smc/types";
/**
 * Calculates a deterministic leaderboard weight from rank info.
 * Higher weight = higher rank on leaderboard.
 */
export declare function calculateLeaderboardWeight(rank: RankInfo): number;
/**
 * Parses a rank string like "Mythic 500" or "Legend I 4★" into RankInfo.
 */
export declare function parseRankString(rankStr: string): RankInfo | null;
export declare function calculateWinRate(wins: number, total: number): number;
export declare function formatWinRate(winRate: number): string;
export declare function calculateKda(kills: number, deaths: number, assists: number): number;
export declare function formatKda(kda: number): string;
export declare function calculateSyncPriority(leaderboardWeight: number, lastSyncAt: Date | null): "high" | "medium" | "low";
export declare function getNextSyncDelay(priority: "high" | "medium" | "low"): number;
export declare function formatDuration(ms: number): string;
export declare function calculateReliabilityScore(successCount: number, failureCount: number): number;
export declare function getPaginationMeta(total: number, page: number, limit: number): {
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};
export declare function getExponentialBackoffDelay(attempt: number, baseDelay?: number, maxDelay?: number): number;
export declare function generateSlug(text: string): string;
export declare function safeJsonParse<T>(json: string): T | null;
//# sourceMappingURL=index.d.ts.map