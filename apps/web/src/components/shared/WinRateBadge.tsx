import { clsx } from "clsx";

interface WinRateBadgeProps {
  winRate: number;
}

export function WinRateBadge({ winRate }: WinRateBadgeProps) {
  const color =
    winRate >= 60
      ? "text-emerald-400"
      : winRate >= 50
      ? "text-text-secondary"
      : "text-red-400";

  return (
    <span className={clsx("text-sm font-mono font-medium", color)}>
      {winRate.toFixed(1)}%
    </span>
  );
}
