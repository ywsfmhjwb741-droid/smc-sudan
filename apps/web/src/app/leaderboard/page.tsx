"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Search, Filter, RefreshCw } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";

export default function LeaderboardPage() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [page, setPage] = useState(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Leaderboard
            </h1>
            <p className="text-text-muted text-sm">
              Top MLBB players in Sudan — updated every 5 minutes
            </p>
          </div>
        </div>
        <div className="glow-line mt-4" />
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search player by username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-10"
          />
        </div>
        <LeaderboardFilters
          region={region}
          onRegionChange={(r) => {
            setRegion(r);
            setPage(1);
          }}
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <LeaderboardTable
          search={search}
          region={region}
          page={page}
          onPageChange={setPage}
        />
      </motion.div>
    </div>
  );
}
