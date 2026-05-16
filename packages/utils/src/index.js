"use strict";
// ============================================================
// SMC Sudan MOBA Community - Shared Utilities
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLeaderboardWeight = calculateLeaderboardWeight;
exports.parseRankString = parseRankString;
exports.calculateWinRate = calculateWinRate;
exports.formatWinRate = formatWinRate;
exports.calculateKda = calculateKda;
exports.formatKda = formatKda;
exports.calculateSyncPriority = calculateSyncPriority;
exports.getNextSyncDelay = getNextSyncDelay;
exports.formatDuration = formatDuration;
exports.calculateReliabilityScore = calculateReliabilityScore;
exports.getPaginationMeta = getPaginationMeta;
exports.getExponentialBackoffDelay = getExponentialBackoffDelay;
exports.generateSlug = generateSlug;
exports.safeJsonParse = safeJsonParse;
// ─── Rank Weight Calculation ──────────────────────────────────
const TIER_BASE_WEIGHTS = {
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
const DIVISION_WEIGHTS = {
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
function calculateLeaderboardWeight(rank) {
    const tierBase = TIER_BASE_WEIGHTS[rank.tier];
    const divisionBonus = rank.division ? DIVISION_WEIGHTS[rank.division] : 0;
    const starsBonus = rank.stars * 10;
    const pointsBonus = rank.points;
    return tierBase + divisionBonus + starsBonus + pointsBonus;
}
/**
 * Parses a rank string like "Mythic 500" or "Legend I 4★" into RankInfo.
 */
function parseRankString(rankStr) {
    if (!rankStr)
        return null;
    const mythicMatch = rankStr.match(/Mythic(?:\s+(Honor|Glory|Immortal))?\s*(\d+)?/i);
    if (mythicMatch) {
        const variant = mythicMatch[1]?.toLowerCase();
        const points = parseInt(mythicMatch[2] ?? "0", 10);
        let tier = "Mythic";
        if (variant === "honor")
            tier = "MythicHonor";
        if (variant === "glory")
            tier = "MythicGlory";
        if (variant === "immortal")
            tier = "MythicImmortal";
        const info = { tier, division: null, stars: 0, points, leaderboardWeight: 0 };
        info.leaderboardWeight = calculateLeaderboardWeight(info);
        return info;
    }
    const tieredMatch = rankStr.match(/(Warrior|Elite|Master|Grandmaster|Epic|Legend)\s*(I{1,3}|IV|V)?\s*(\d+)?/i);
    if (tieredMatch) {
        const tierRaw = tieredMatch[1];
        const divisionRaw = (tieredMatch[2]?.toUpperCase() ?? null);
        const stars = parseInt(tieredMatch[3] ?? "0", 10);
        const info = {
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
function calculateWinRate(wins, total) {
    if (total === 0)
        return 0;
    return Math.round((wins / total) * 10000) / 100;
}
function formatWinRate(winRate) {
    return `${winRate.toFixed(1)}%`;
}
// ─── KDA Utilities ────────────────────────────────────────────
function calculateKda(kills, deaths, assists) {
    if (deaths === 0)
        return kills + assists;
    return Math.round(((kills + assists) / deaths) * 100) / 100;
}
function formatKda(kda) {
    return kda.toFixed(2);
}
// ─── Sync Priority Calculation ────────────────────────────────
function calculateSyncPriority(leaderboardWeight, lastSyncAt) {
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
function getNextSyncDelay(priority) {
    const delays = {
        high: 2 * 60 * 60 * 1000, // 2 hours
        medium: 6 * 60 * 60 * 1000, // 6 hours
        low: 24 * 60 * 60 * 1000, // 24 hours
    };
    return delays[priority];
}
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
// ─── Reliability Score ────────────────────────────────────────
function calculateReliabilityScore(successCount, failureCount) {
    const total = successCount + failureCount;
    if (total === 0)
        return 100;
    return Math.round((successCount / total) * 100);
}
// ─── Pagination Utilities ─────────────────────────────────────
function getPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}
// ─── Exponential Backoff ──────────────────────────────────────
function getExponentialBackoffDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * delay * 0.1;
    return Math.floor(delay + jitter);
}
// ─── Slug Generation ──────────────────────────────────────────
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}
// ─── Safe JSON Parse ──────────────────────────────────────────
function safeJsonParse(json) {
    try {
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=index.js.map