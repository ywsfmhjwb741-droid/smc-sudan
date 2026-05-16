// ============================================================
// SMC Sudan MOBA Community - Production Database Schema
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "syncing",
  "success",
  "failed",
  "stale",
]);

export const syncPriorityEnum = pgEnum("sync_priority", [
  "high",
  "medium",
  "low",
]);

export const dataSourceEnum = pgEnum("data_source", [
  "mlbb-api",
  "scraper",
  "puppeteer",
  "selenium",
]);

export const circuitBreakerStateEnum = pgEnum("circuit_breaker_state", [
  "closed",
  "open",
  "half-open",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",
  "admin",
  "moderator",
]);

export const rankTierEnum = pgEnum("rank_tier", [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "MythicHonor",
  "MythicGlory",
  "MythicImmortal",
]);

export const heroRoleEnum = pgEnum("hero_role", [
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
]);

// ─── Admin Users ──────────────────────────────────────────────

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: adminRoleEnum("role").notNull().default("moderator"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("admin_users_email_idx").on(t.email),
    usernameIdx: uniqueIndex("admin_users_username_idx").on(t.username),
  })
);

// ─── Seasons ──────────────────────────────────────────────────

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("seasons_slug_idx").on(t.slug),
    activeIdx: index("seasons_active_idx").on(t.isActive),
  })
);

// ─── Players ──────────────────────────────────────────────────

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mlbbId: varchar("mlbb_id", { length: 50 }).notNull(),
    serverId: varchar("server_id", { length: 50 }),
    username: varchar("username", { length: 100 }).notNull(),
    avatarUrl: text("avatar_url"),
    region: varchar("region", { length: 50 }),
    level: integer("level"),
    syncStatus: syncStatusEnum("sync_status").notNull().default("pending"),
    reliabilityScore: real("reliability_score").notNull().default(100),
    lastSyncAt: timestamp("last_sync_at"),
    nextSyncAt: timestamp("next_sync_at"),
    syncPriority: syncPriorityEnum("sync_priority").notNull().default("medium"),
    isActive: boolean("is_active").notNull().default(true),
    isBanned: boolean("is_banned").notNull().default(false),
    banReason: text("ban_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    mlbbIdIdx: uniqueIndex("players_mlbb_id_idx").on(t.mlbbId, t.serverId),
    syncStatusIdx: index("players_sync_status_idx").on(t.syncStatus),
    nextSyncIdx: index("players_next_sync_idx").on(t.nextSyncAt),
    regionIdx: index("players_region_idx").on(t.region),
    usernameIdx: index("players_username_idx").on(t.username),
  })
);

// ─── Player Stats ─────────────────────────────────────────────

export const playerStats = pgTable(
  "player_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").references(() => seasons.id),

    // Rank fields - stored deterministically
    rankTier: rankTierEnum("rank_tier").notNull().default("Warrior"),
    rankDivision: varchar("rank_division", { length: 5 }),
    rankStars: smallint("rank_stars").notNull().default(0),
    rankPoints: integer("rank_points").notNull().default(0),
    leaderboardWeight: integer("leaderboard_weight").notNull().default(0),

    // Match statistics
    totalMatches: integer("total_matches").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    winRate: real("win_rate").notNull().default(0),
    mvpCount: integer("mvp_count").notNull().default(0),

    // Timestamps
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    playerSeasonIdx: uniqueIndex("player_stats_player_season_idx").on(
      t.playerId,
      t.seasonId
    ),
    leaderboardWeightIdx: index("player_stats_leaderboard_weight_idx").on(
      t.leaderboardWeight
    ),
    rankTierIdx: index("player_stats_rank_tier_idx").on(t.rankTier),
  })
);

// ─── Hero Stats ───────────────────────────────────────────────

export const heroStats = pgTable(
  "hero_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").references(() => seasons.id),
    heroId: varchar("hero_id", { length: 50 }).notNull(),
    heroName: varchar("hero_name", { length: 100 }).notNull(),
    heroRole: heroRoleEnum("hero_role"),
    matches: integer("matches").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    winRate: real("win_rate").notNull().default(0),
    kda: real("kda").notNull().default(0),
    kills: integer("kills").notNull().default(0),
    deaths: integer("deaths").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    mvpCount: integer("mvp_count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    playerHeroSeasonIdx: uniqueIndex("hero_stats_player_hero_season_idx").on(
      t.playerId,
      t.heroId,
      t.seasonId
    ),
    heroIdIdx: index("hero_stats_hero_id_idx").on(t.heroId),
    winRateIdx: index("hero_stats_win_rate_idx").on(t.winRate),
  })
);

// ─── Stat Snapshots ───────────────────────────────────────────

export const statSnapshots = pgTable(
  "stat_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").references(() => seasons.id),

    // Snapshot rank data
    rankTier: rankTierEnum("rank_tier").notNull(),
    rankDivision: varchar("rank_division", { length: 5 }),
    rankStars: smallint("rank_stars").notNull().default(0),
    rankPoints: integer("rank_points").notNull().default(0),
    leaderboardWeight: integer("leaderboard_weight").notNull().default(0),

    // Snapshot stats
    totalMatches: integer("total_matches").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    winRate: real("win_rate").notNull().default(0),

    // Differential snapshot optimization
    isDifferential: boolean("is_differential").notNull().default(false),
    diffFromSnapshotId: uuid("diff_from_snapshot_id"),

    snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
  },
  (t) => ({
    playerSnapshotIdx: index("stat_snapshots_player_idx").on(t.playerId),
    snapshotAtIdx: index("stat_snapshots_at_idx").on(t.snapshotAt),
    playerSeasonIdx: index("stat_snapshots_player_season_idx").on(
      t.playerId,
      t.seasonId
    ),
  })
);

// ─── Rank History ─────────────────────────────────────────────

export const rankHistory = pgTable(
  "rank_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").references(() => seasons.id),

    fromTier: rankTierEnum("from_tier"),
    fromDivision: varchar("from_division", { length: 5 }),
    fromStars: smallint("from_stars"),
    fromWeight: integer("from_weight"),

    toTier: rankTierEnum("to_tier").notNull(),
    toDivision: varchar("to_division", { length: 5 }),
    toStars: smallint("to_stars").notNull().default(0),
    toWeight: integer("to_weight").notNull().default(0),

    changeType: varchar("change_type", { length: 20 }).notNull(), // "promotion" | "demotion" | "points_change"
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (t) => ({
    playerRankIdx: index("rank_history_player_idx").on(t.playerId),
    recordedAtIdx: index("rank_history_recorded_at_idx").on(t.recordedAt),
  })
);

// ─── Sync Queue ───────────────────────────────────────────────

export const syncQueue = pgTable(
  "sync_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    priority: syncPriorityEnum("priority").notNull().default("medium"),
    status: syncStatusEnum("status").notNull().default("pending"),
    attempts: smallint("attempts").notNull().default(0),
    maxAttempts: smallint("max_attempts").notNull().default(3),
    scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    error: text("error"),
    bullJobId: varchar("bull_job_id", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("sync_queue_status_idx").on(t.status),
    scheduledAtIdx: index("sync_queue_scheduled_at_idx").on(t.scheduledAt),
    playerIdx: index("sync_queue_player_idx").on(t.playerId),
  })
);

// ─── Sync Logs ────────────────────────────────────────────────

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    source: dataSourceEnum("source").notNull(),
    status: syncStatusEnum("status").notNull(),
    duration: integer("duration"), // milliseconds
    error: text("error"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    playerLogIdx: index("sync_logs_player_idx").on(t.playerId),
    createdAtIdx: index("sync_logs_created_at_idx").on(t.createdAt),
    statusIdx: index("sync_logs_status_idx").on(t.status),
  })
);

// ─── Leaderboard Snapshots ────────────────────────────────────

export const leaderboardSnapshots = pgTable(
  "leaderboard_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").references(() => seasons.id),
    region: varchar("region", { length: 50 }),
    snapshotData: jsonb("snapshot_data").notNull(), // Serialized leaderboard entries
    totalPlayers: integer("total_players").notNull().default(0),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => ({
    seasonRegionIdx: index("leaderboard_snapshots_season_region_idx").on(
      t.seasonId,
      t.region
    ),
    generatedAtIdx: index("leaderboard_snapshots_generated_at_idx").on(
      t.generatedAt
    ),
  })
);

// ─── Data Reliability ─────────────────────────────────────────

export const dataReliability = pgTable(
  "data_reliability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: dataSourceEnum("source").notNull(),
    circuitState: circuitBreakerStateEnum("circuit_state")
      .notNull()
      .default("closed"),
    failureCount: integer("failure_count").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    lastFailureAt: timestamp("last_failure_at"),
    lastSuccessAt: timestamp("last_success_at"),
    avgResponseTime: real("avg_response_time").notNull().default(0),
    reliabilityScore: real("reliability_score").notNull().default(100),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    sourceIdx: uniqueIndex("data_reliability_source_idx").on(t.source),
  })
);

// ─── Monitoring Metrics ───────────────────────────────────────

export const monitoringMetrics = pgTable(
  "monitoring_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metricName: varchar("metric_name", { length: 100 }).notNull(),
    value: real("value").notNull(),
    labels: jsonb("labels"),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (t) => ({
    metricNameIdx: index("monitoring_metrics_name_idx").on(t.metricName),
    recordedAtIdx: index("monitoring_metrics_recorded_at_idx").on(t.recordedAt),
  })
);

// ─── Relations ────────────────────────────────────────────────

export const playersRelations = relations(players, ({ many }) => ({
  stats: many(playerStats),
  heroStats: many(heroStats),
  snapshots: many(statSnapshots),
  rankHistory: many(rankHistory),
  syncQueue: many(syncQueue),
  syncLogs: many(syncLogs),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
  season: one(seasons, {
    fields: [playerStats.seasonId],
    references: [seasons.id],
  }),
}));

export const heroStatsRelations = relations(heroStats, ({ one }) => ({
  player: one(players, {
    fields: [heroStats.playerId],
    references: [players.id],
  }),
  season: one(seasons, {
    fields: [heroStats.seasonId],
    references: [seasons.id],
  }),
}));

export const statSnapshotsRelations = relations(statSnapshots, ({ one }) => ({
  player: one(players, {
    fields: [statSnapshots.playerId],
    references: [players.id],
  }),
  season: one(seasons, {
    fields: [statSnapshots.seasonId],
    references: [seasons.id],
  }),
}));

export const rankHistoryRelations = relations(rankHistory, ({ one }) => ({
  player: one(players, {
    fields: [rankHistory.playerId],
    references: [players.id],
  }),
}));

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  player: one(players, {
    fields: [syncQueue.playerId],
    references: [players.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  player: one(players, {
    fields: [syncLogs.playerId],
    references: [players.id],
  }),
}));
