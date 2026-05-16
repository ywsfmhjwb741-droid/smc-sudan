// ============================================================
// SMC Sudan MOBA Community - Shared Types
// ============================================================

// ─── Rank System ─────────────────────────────────────────────

export type RankTier =
  | "Warrior"
  | "Elite"
  | "Master"
  | "Grandmaster"
  | "Epic"
  | "Legend"
  | "Mythic"
  | "MythicHonor"
  | "MythicGlory"
  | "MythicImmortal";

export type RankDivision = "I" | "II" | "III" | "IV" | "V";

export interface RankInfo {
  tier: RankTier;
  division: RankDivision | null;
  stars: number;
  points: number;
  leaderboardWeight: number;
}

// ─── Player Types ─────────────────────────────────────────────

export interface Player {
  id: string;
  mlbbId: string;
  serverId: string | null;
  username: string;
  avatarUrl: string | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date | null;
  syncStatus: SyncStatus;
  reliabilityScore: number;
}

export interface PlayerStats {
  id: string;
  playerId: string;
  season: string;
  rank: RankInfo;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  mvpCount: number;
  recordedAt: Date;
}

export interface HeroStats {
  id: string;
  playerId: string;
  heroId: string;
  heroName: string;
  heroRole: HeroRole;
  matches: number;
  wins: number;
  winRate: number;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
  season: string;
}

export type HeroRole =
  | "Tank"
  | "Fighter"
  | "Assassin"
  | "Mage"
  | "Marksman"
  | "Support";

// ─── Leaderboard Types ────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  avatarUrl: string | null;
  rankInfo: RankInfo;
  winRate: number;
  totalMatches: number;
  region: string | null;
  lastSyncAt: Date | null;
}

export interface LeaderboardFilter {
  region?: string;
  heroId?: string;
  season?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedLeaderboard {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cachedAt: Date;
}

// ─── Sync System Types ────────────────────────────────────────

export type SyncStatus =
  | "pending"
  | "syncing"
  | "success"
  | "failed"
  | "stale";

export type SyncPriority = "high" | "medium" | "low";

export interface SyncJob {
  id: string;
  playerId: string;
  priority: SyncPriority;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  status: SyncStatus;
  error: string | null;
}

export interface SyncLog {
  id: string;
  playerId: string;
  source: DataSource;
  status: SyncStatus;
  duration: number;
  error: string | null;
  createdAt: Date;
}

// ─── Data Source Types ────────────────────────────────────────

export type DataSource = "mlbb-api" | "scraper" | "puppeteer" | "selenium";

export type CircuitBreakerState = "closed" | "open" | "half-open";

export interface SourceHealth {
  source: DataSource;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureAt: Date | null;
  lastSuccessAt: Date | null;
  reliabilityScore: number;
  avgResponseTime: number;
}

export interface FetchResult<T> {
  data: T | null;
  source: DataSource;
  cached: boolean;
  duration: number;
  error: FetchError | null;
}

export interface FetchError {
  code: string;
  message: string;
  source: DataSource;
  retryable: boolean;
}

// ─── Season Types ─────────────────────────────────────────────

export interface Season {
  id: string;
  name: string;
  slug: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

// ─── Snapshot Types ───────────────────────────────────────────

export interface StatSnapshot {
  id: string;
  playerId: string;
  seasonId: string;
  rank: RankInfo;
  totalMatches: number;
  winRate: number;
  snapshotAt: Date;
  isDifferential: boolean;
}

// ─── Admin Types ──────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: AdminRole;
  createdAt: Date;
}

export type AdminRole = "super_admin" | "admin" | "moderator";

// ─── Monitoring Types ─────────────────────────────────────────

export interface MonitoringMetric {
  id: string;
  metricName: string;
  value: number;
  labels: Record<string, string>;
  recordedAt: Date;
}

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

// ─── API Response Types ───────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ─── MLBB Raw Data Types ──────────────────────────────────────

export interface MlbbRawProfile {
  userId: string;
  serverId: string;
  nickname: string;
  avatar: string;
  level: number;
  region: string;
}

export interface MlbbRawRank {
  rankId: number;
  rankName: string;
  rankIcon: string;
  stars: number;
  points: number;
  season: string;
}

export interface MlbbRawHeroStats {
  heroId: number;
  heroName: string;
  matches: number;
  wins: number;
  kda: string;
  mvp: number;
}
