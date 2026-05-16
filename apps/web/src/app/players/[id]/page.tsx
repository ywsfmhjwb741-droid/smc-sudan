"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Shield, TrendingUp, Sword, Clock } from "lucide-react";
import Link from "next/link";
import { RankBadge } from "@/components/shared/RankBadge";
import { WinRateBadge } from "@/components/shared/WinRateBadge";
import type { RankInfo } from "@smc/types";

// Mock player data
const mockPlayer = {
  id: "player-1",
  username: "ShadowKiller_SD",
  mlbbId: "123456789",
  region: "Khartoum",
  level: 150,
  lastSyncAt: new Date(Date.now() - 30 * 60000),
  syncStatus: "success" as const,
  rankInfo: {
    tier: "MythicImmortal" as const,
    division: null,
    stars: 0,
    points: 9500,
    leaderboardWeight: 9500,
  } satisfies RankInfo,
  totalMatches: 800,
  wins: 520,
  winRate: 65.0,
  mvpCount: 245,
  heroStats: [
    { heroName: "Fanny", role: "Assassin", matches: 120, wins: 84, winRate: 70, kda: 4.2 },
    { heroName: "Chou", role: "Fighter", matches: 95, wins: 62, winRate: 65.3, kda: 3.8 },
    { heroName: "Ling", role: "Assassin", matches: 80, wins: 50, winRate: 62.5, kda: 3.5 },
    { heroName: "Gusion", role: "Mage", matches: 70, wins: 42, winRate: 60.0, kda: 3.1 },
    { heroName: "Lancelot", role: "Assassin", matches: 65, wins: 38, winRate: 58.5, kda: 2.9 },
  ],
};

export default function PlayerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const player = mockPlayer;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6 rank-glow-mythic-immortal"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-bg-tertiary border-2 border-cyan-500/30 flex items-center justify-center text-2xl font-bold text-text-primary">
            {player.username.slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-display text-3xl font-bold text-text-primary">
                {player.username}
              </h1>
              <RankBadge rankInfo={player.rankInfo} size="md" />
            </div>
            <div className="flex items-center gap-4 text-text-muted text-sm flex-wrap">
              <span>ID: {player.mlbbId}</span>
              <span>•</span>
              <span>{player.region}</span>
              <span>•</span>
              <span>Level {player.level}</span>
            </div>
          </div>

          {/* Sync Status */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced
            </div>
            <span className="text-text-muted text-xs">
              {Math.floor((Date.now() - player.lastSyncAt.getTime()) / 60000)}m ago
            </span>
            <button className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: "Total Matches", value: player.totalMatches.toLocaleString(), icon: Shield, color: "text-brand-400" },
          { label: "Wins", value: player.wins.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Win Rate", value: `${player.winRate.toFixed(1)}%`, icon: TrendingUp, color: player.winRate >= 60 ? "text-emerald-400" : "text-text-secondary" },
          { label: "MVP Count", value: player.mvpCount.toLocaleString(), icon: Sword, color: "text-gold-400" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-text-muted text-xs">{stat.label}</span>
            </div>
            <p className={`font-display text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Hero Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Sword className="w-5 h-5 text-brand-400" />
          Hero Statistics
        </h2>

        <div className="space-y-3">
          {player.heroStats.map((hero, idx) => (
            <div
              key={hero.heroName}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <span className="text-text-muted text-sm font-mono w-6 text-center">
                {idx + 1}
              </span>
              <div className="w-9 h-9 rounded-lg bg-bg-tertiary border border-bg-border flex items-center justify-center text-xs font-bold text-text-secondary">
                {hero.heroName.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm">{hero.heroName}</p>
                <p className="text-text-muted text-xs">{hero.role}</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-text-secondary text-sm">{hero.matches} games</p>
              </div>
              <div className="text-right">
                <WinRateBadge winRate={hero.winRate} />
              </div>
              <div className="text-right hidden md:block">
                <span className="text-text-muted text-xs">KDA </span>
                <span className="text-text-secondary text-sm font-mono">{hero.kda}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
