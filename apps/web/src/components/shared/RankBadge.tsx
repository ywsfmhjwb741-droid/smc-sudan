import { clsx } from "clsx";
import type { RankInfo, RankTier } from "@smc/types";

const RANK_COLORS: Record<RankTier, string> = {
  Warrior: "text-rank-warrior",
  Elite: "text-rank-elite",
  Master: "text-rank-master",
  Grandmaster: "text-rank-grandmaster",
  Epic: "text-rank-epic",
  Legend: "text-rank-legend",
  Mythic: "text-rank-mythic",
  MythicHonor: "text-rank-mythicHonor",
  MythicGlory: "text-rank-mythicGlory",
  MythicImmortal: "text-rank-mythicImmortal",
};

const RANK_BG: Record<RankTier, string> = {
  Warrior: "bg-gray-500/10",
  Elite: "bg-emerald-500/10",
  Master: "bg-blue-500/10",
  Grandmaster: "bg-purple-500/10",
  Epic: "bg-pink-500/10",
  Legend: "bg-yellow-500/10",
  Mythic: "bg-red-500/10",
  MythicHonor: "bg-orange-500/10",
  MythicGlory: "bg-fuchsia-500/10",
  MythicImmortal: "bg-cyan-500/10",
};

interface RankBadgeProps {
  rankInfo: RankInfo;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rankInfo, size = "sm" }: RankBadgeProps) {
  const { tier, division, stars, points } = rankInfo;
  const colorClass = RANK_COLORS[tier];
  const bgClass = RANK_BG[tier];

  const isMythicVariant = tier.startsWith("Mythic");
  const displayText = isMythicVariant
    ? `${formatTier(tier)} ${points > 0 ? points : ""}`
    : `${formatTier(tier)}${division ? ` ${division}` : ""}${stars > 0 ? ` ${"★".repeat(stars)}` : ""}`;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap",
        bgClass,
        colorClass,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-1.5 text-base"
      )}
    >
      {displayText.trim()}
    </span>
  );
}

function formatTier(tier: RankTier): string {
  switch (tier) {
    case "MythicHonor": return "Mythic Honor";
    case "MythicGlory": return "Mythic Glory";
    case "MythicImmortal": return "Mythic Immortal";
    default: return tier;
  }
}
