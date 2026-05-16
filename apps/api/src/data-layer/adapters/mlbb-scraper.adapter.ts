// ============================================================
// MLBB Scraper Adapter - HTTP scraping fallback
// Priority: 2
// ============================================================

import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";
import type {
  MlbbRawProfile,
  MlbbRawRank,
  MlbbRawHeroStats,
  FetchError,
} from "@smc/types";
import type { MlbbPlayerData } from "./mlbb-api.adapter";

export class MlbbScraperAdapter {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });
  }

  async fetchPlayerData(
    mlbbId: string,
    serverId?: string
  ): Promise<{ data: MlbbPlayerData | null; error: FetchError | null }> {
    try {
      // Try third-party MLBB stat sites
      const sources = [
        () => this.scrapeFromMlbbProfile(mlbbId, serverId),
        () => this.scrapeFromThirdParty(mlbbId, serverId),
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result.data) return result;
        } catch {
          continue;
        }
      }

      return {
        data: null,
        error: {
          code: "SCRAPE_ALL_FAILED",
          message: "All scraping sources failed",
          source: "scraper",
          retryable: true,
        },
      };
    } catch (err) {
      return {
        data: null,
        error: {
          code: "SCRAPE_ERROR",
          message: String(err),
          source: "scraper",
          retryable: true,
        },
      };
    }
  }

  private async scrapeFromMlbbProfile(
    mlbbId: string,
    serverId?: string
  ): Promise<{ data: MlbbPlayerData | null; error: FetchError | null }> {
    const url = `https://m.mobilelegends.com/en/rank?userid=${mlbbId}&zoneid=${serverId ?? ""}`;
    const response = await this.client.get<string>(url);
    const $ = cheerio.load(response.data);

    const nickname = $(".user-name, .player-name, [class*='nickname']")
      .first()
      .text()
      .trim();
    const avatarUrl =
      $(".user-avatar img, .player-avatar img").first().attr("src") ?? "";
    const rankText = $(".rank-name, [class*='rank']").first().text().trim();

    if (!nickname) {
      return {
        data: null,
        error: {
          code: "PLAYER_NOT_FOUND",
          message: "Could not find player data in scraped page",
          source: "scraper",
          retryable: false,
        },
      };
    }

    const profile: MlbbRawProfile = {
      userId: mlbbId,
      serverId: serverId ?? "",
      nickname,
      avatar: avatarUrl,
      level: 1,
      region: "unknown",
    };

    const rank: MlbbRawRank = {
      rankId: 0,
      rankName: rankText || "Warrior",
      rankIcon: "",
      stars: 0,
      points: 0,
      season: "current",
    };

    return {
      data: { profile, rank, heroStats: [] },
      error: null,
    };
  }

  private async scrapeFromThirdParty(
    mlbbId: string,
    serverId?: string
  ): Promise<{ data: MlbbPlayerData | null; error: FetchError | null }> {
    // Third-party MLBB stat tracker
    const url = `https://mlbb.fandom.com/wiki/Special:Search?query=${mlbbId}`;

    try {
      await this.client.get<string>(url);
      // Parse third-party data - structure varies by site
      // Return placeholder if parsing fails
      return {
        data: null,
        error: {
          code: "THIRD_PARTY_PARSE_FAILED",
          message: "Could not parse third-party data",
          source: "scraper",
          retryable: false,
        },
      };
    } catch {
      return {
        data: null,
        error: {
          code: "THIRD_PARTY_FETCH_FAILED",
          message: "Third-party fetch failed",
          source: "scraper",
          retryable: true,
        },
      };
    }
  }

  // Utility: extract hero stats from HTML table
  extractHeroStatsFromTable(html: string): MlbbRawHeroStats[] {
    const $ = cheerio.load(html);
    const heroes: MlbbRawHeroStats[] = [];

    $("table.hero-stats tr, .hero-list-item").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 4) {
        const heroName = $(cells[0]).text().trim();
        const matches = parseInt($(cells[1]).text().trim(), 10) || 0;
        const wins = parseInt($(cells[2]).text().trim(), 10) || 0;
        const kda = $(cells[3]).text().trim() || "0/0/0";

        if (heroName) {
          heroes.push({
            heroId: 0,
            heroName,
            matches,
            wins,
            kda,
            mvp: 0,
          });
        }
      }
    });

    return heroes;
  }
}
