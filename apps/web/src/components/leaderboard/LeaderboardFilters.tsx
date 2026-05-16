"use client";

import { Filter } from "lucide-react";

const REGIONS = [
  "All Regions",
  "Khartoum",
  "Omdurman",
  "Port Sudan",
  "Kassala",
  "Atbara",
  "Wad Madani",
];

interface LeaderboardFiltersProps {
  region: string;
  onRegionChange: (region: string) => void;
}

export function LeaderboardFilters({
  region,
  onRegionChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value === "All Regions" ? "" : e.target.value)}
          className="input-field pl-9 pr-8 appearance-none cursor-pointer min-w-[160px]"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r === "All Regions" ? "" : r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
