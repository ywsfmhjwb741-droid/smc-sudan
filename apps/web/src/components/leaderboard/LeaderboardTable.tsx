"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Crown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { RankBadge } from "@/components/shared/RankBadge";
import { WinRateBadge } from "@/components/shared/WinRateBadge";
import type { LeaderboardEntry } from "@smc/types";

interface LeaderboardTableProps {
  search: string;
  region: string;
  page: number;
  onPageChange: (page: number) => void;
}

// Mock data for demonstration
const mockEntries: LeaderboardEntry[] = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  playerId: `player-${i + 1}`,
  username: [
    "ShadowKiller_SD",
    "NileMaster",
    "KhartoumKing",
    "DesertStorm",
    "SudanPride",
    "BladeRunner_SD",
    "MythicHunter",
    "GrandMasterSD",
    "LegendaryOne",
    "EpicWarrior",
  ][i % 10] ?? `Player${i + 1}`,
  avatarUrl: null,
  rankInfo: {
    tier: i === 0
      ? "MythicImmortal"
      : i === 1
      ? "MythicGlory"
      : i === 2
      ? "MythicHonor"
      : i < 5
      ? "Mythic"
      : i < 10
      ? "Legend"
      : "Epic",
    division: null,
    stars: 0,
    points: 9500 - i * 300,
    leaderboardWeight: 9500 - i * 300,
  },
  winRate: 65 - i * 1.5,
  totalMatches: 800 - i * 25,
  region: i % 3 === 0 ? "Khartoum" : i % 3 === 1 ? "Omdurman" : "Port Sudan",
  lastSyncAt: new Date(Date.now() - i * 30 * 60000),
}));

const RANK_MEDAL_COLORS = [
  "text-gold-400",
  "text-gray-300",
  "text-amber-600",
];

export function LeaderboardTable({
  search,
  region,
  page,
  onPageChange,
}: LeaderboardTableProps) {
  const isLoading = false;
  const entries = mockEntries.filter(
    (e) =>
      (!search || e.username.toLowerCase().includes(search.toLowerCase())) &&
      (!region || e.region === region)
  );
  const totalPages = 5;

  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="card mb-1 px-4 py-3">
        <div className="grid grid-cols-[3rem_1fr_auto_auto_auto_auto] gap-4 items-center text-text-muted text-xs font-medium uppercase tracking-wider">
          <span className="text-center">#</span>
          <span>Player</span>
          <span className="hidden md:block">Rank</span>
          <span className="hidden md:block">Win Rate</span>
          <span className="hidden lg:block">Matches</span>
          <span className="hidden lg:block">Region</span>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, idx) => (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link href={`/players/${entry.playerId}`}>
                <div
                  className={clsx(
                    "grid grid-cols-[3rem_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 rounded-lg border transition-all duration-150 cursor-pointer",
                    entry.rank <= 3
                      ? "bg-bg-card border-bg-border hover:border-brand-500/30"
                      : "border-transparent hover:bg-bg-card hover:border-bg-border",
                    entry.rankInfo.tier === "MythicImmortal" && "rank-glow-mythic-immortal",
                    entry.rankInfo.tier === "MythicGlory" && "rank-glow-mythic-glory",
                    entry.rankInfo.tier === "MythicHonor" && "rank-glow-mythic-honor"
                  )}
                >
                  {/* Rank Number */}
                  <div className="flex items-center justify-center">
                    {entry.rank <= 3 ? (
                      <Crown
                        className={clsx(
                          "w-5 h-5",
                          RANK_MEDAL_COLORS[entry.rank - 1]
                        )}
                      />
                    ) : (
                      <span className="text-text-muted text-sm font-mono">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-bg-tertiary border border-bg-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {entry.avatarUrl ? (
                        <Image
                          src={entry.avatarUrl}
                          alt={entry.username}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-text-muted text-xs font-bold">
                          {entry.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-text-primary font-medium text-sm truncate">
                        {entry.username}
                      </p>
                      <p className="text-text-muted text-xs">
                        ID: {entry.playerId.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* Rank Badge */}
                  <div className="hidden md:block">
                    <RankBadge rankInfo={entry.rankInfo} />
                  </div>

                  {/* Win Rate */}
                  <div className="hidden md:block">
                    <WinRateBadge winRate={entry.winRate} />
                  </div>

                  {/* Matches */}
                  <div className="hidden lg:block text-right">
                    <span className="text-text-secondary text-sm font-mono">
                      {entry.totalMatches.toLocaleString()}
                    </span>
                  </div>

                  {/* Region */}
                  <div className="hidden lg:block">
                    <span className="badge bg-bg-tertiary text-text-muted border border-bg-border">
                      {entry.region}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-bg-border">
        <p className="text-text-muted text-sm">
          Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, entries.length)} of{" "}
          {entries.length} players
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-bg-border text-text-secondary hover:text-text-primary hover:border-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-text-secondary text-sm px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-bg-border text-text-secondary hover:text-text-primary hover:border-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
