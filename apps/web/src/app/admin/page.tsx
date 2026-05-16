"use client";

import { motion } from "framer-motion";
import {
  Users,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Database,
  Server,
} from "lucide-react";

const queueStats = {
  waiting: 12,
  active: 5,
  completed: 8420,
  failed: 23,
  delayed: 8,
};

const sourceHealth = [
  { source: "mlbb-api", state: "closed", reliability: 94, avgResponse: 820 },
  { source: "scraper", state: "closed", reliability: 78, avgResponse: 2100 },
  { source: "puppeteer", state: "open", reliability: 45, avgResponse: 8500 },
];

const recentSyncs = [
  { player: "ShadowKiller_SD", status: "success", source: "mlbb-api", duration: 780, time: "2m ago" },
  { player: "NileMaster", status: "success", source: "mlbb-api", duration: 920, time: "3m ago" },
  { player: "KhartoumKing", status: "failed", source: "scraper", duration: 5200, time: "5m ago" },
  { player: "DesertStorm", status: "success", source: "mlbb-api", duration: 650, time: "7m ago" },
  { player: "SudanPride", status: "success", source: "scraper", duration: 1800, time: "9m ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-1">
          Admin Dashboard
        </h1>
        <p className="text-text-muted text-sm">
          System health, queue monitoring, and player management
        </p>
        <div className="glow-line mt-4" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Players", value: "2,412", icon: Users, color: "text-brand-400", bg: "bg-brand-500/10" },
          { label: "Queue Active", value: queueStats.active, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Failed Syncs", value: queueStats.failed, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Completed Today", value: "1,240", icon: CheckCircle, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className={`font-display text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            <p className="text-text-muted text-xs mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Queue Metrics */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400" />
              Sync Queue
            </h2>
            <button className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(queueStats).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-text-secondary text-sm capitalize">{key}</span>
                <span className={`font-mono text-sm font-medium ${
                  key === "failed" ? "text-red-400" :
                  key === "active" ? "text-emerald-400" :
                  key === "completed" ? "text-brand-400" :
                  "text-text-secondary"
                }`}>
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Health */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-brand-400" />
            Data Source Health
          </h2>
          <div className="space-y-4">
            {sourceHealth.map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      source.state === "closed" ? "bg-emerald-400" :
                      source.state === "open" ? "bg-red-400" :
                      "bg-yellow-400"
                    }`} />
                    <span className="text-text-primary text-sm font-medium">
                      {source.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{source.avgResponse}ms</span>
                    <span className={source.reliability >= 80 ? "text-emerald-400" : "text-red-400"}>
                      {source.reliability}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      source.reliability >= 80 ? "bg-emerald-500" :
                      source.reliability >= 60 ? "bg-yellow-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${source.reliability}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sync Logs */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-brand-400" />
          Recent Sync Activity
        </h2>
        <div className="space-y-2">
          {recentSyncs.map((sync, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                sync.status === "success" ? "bg-emerald-400" : "bg-red-400"
              }`} />
              <span className="text-text-primary text-sm font-medium flex-1">
                {sync.player}
              </span>
              <span className="text-text-muted text-xs hidden md:block">
                {sync.source}
              </span>
              <span className="text-text-muted text-xs hidden md:block font-mono">
                {sync.duration}ms
              </span>
              <span className="text-text-muted text-xs">{sync.time}</span>
              <span className={`badge ${
                sync.status === "success"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {sync.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
