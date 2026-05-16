"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Users, Zap, Shield, TrendingUp, Star } from "lucide-react";
import { RegisterPlayerModal } from "@/components/player/RegisterPlayerModal";
import { useState } from "react";

const stats = [
  { label: "Registered Players", value: "2,400+", icon: Users },
  { label: "Matches Tracked", value: "180K+", icon: Shield },
  { label: "Daily Syncs", value: "12K+", icon: Zap },
  { label: "Active Seasons", value: "3", icon: Trophy },
];

const features = [
  {
    icon: Trophy,
    title: "Live Leaderboards",
    description:
      "Real-time rankings updated every 5 minutes. Filter by region, hero, and season.",
    color: "text-gold-400",
    bg: "bg-gold-500/10",
  },
  {
    icon: TrendingUp,
    title: "Rank Progression",
    description:
      "Track your rank history with detailed charts showing your climb over time.",
    color: "text-brand-400",
    bg: "bg-brand-500/10",
  },
  {
    icon: Shield,
    title: "Hero Analytics",
    description:
      "Deep dive into your hero pool with win rates, KDA, and performance trends.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Auto-Sync Engine",
    description:
      "Adaptive sync engine keeps your stats fresh. Top players sync every 2 hours.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Star,
    title: "Profile Cards",
    description:
      "Generate shareable rank cards to flex your achievements on social media.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Users,
    title: "Community Rankings",
    description:
      "Compete with the best MLBB players across Sudan in seasonal tournaments.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

export default function HomePage() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sudan&apos;s #1 MLBB Tracking Platform
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-text-primary">SMC Sudan</span>
              <br />
              <span className="gradient-text">MOBA Community</span>
            </h1>

            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Track your MLBB rank, analyze hero performance, and compete on
              Sudan&apos;s most advanced esports leaderboard platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowRegister(true)}
                className="btn-primary text-lg px-8 py-3"
              >
                Register Your MLBB ID
              </motion.button>
              <Link href="/leaderboard">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary text-lg px-8 py-3"
                >
                  View Leaderboard
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="card p-4 text-center"
              >
                <stat.icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                <div className="font-display text-2xl font-bold text-text-primary">
                  {stat.value}
                </div>
                <div className="text-text-muted text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-bold text-text-primary mb-4">
            Built for Serious Players
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Production-grade infrastructure powering Sudan&apos;s most reliable
            MLBB stat tracking experience.
          </p>
          <div className="glow-line mt-8 max-w-xs mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="card-hover p-6"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/50 via-brand-900/30 to-brand-950/50" />
        <div className="absolute inset-0 bg-glow-brand" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-text-primary mb-4">
              Ready to Climb the Ranks?
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              Join thousands of Sudanese MLBB players tracking their journey to
              Mythic Immortal.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowRegister(true)}
              className="btn-primary text-lg px-10 py-4"
            >
              Get Started — It&apos;s Free
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Register Modal */}
      {showRegister && (
        <RegisterPlayerModal onClose={() => setShowRegister(false)} />
      )}
    </>
  );
}
