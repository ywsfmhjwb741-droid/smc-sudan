# SMC Sudan MOBA Community

**Sudan's premier MLBB leaderboard and player tracking platform.**

A production-grade esports analytics platform built with enterprise-level architecture, comparable in quality to OP.GG and Tracker.gg.

---

## Architecture Overview

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React, TypeScript, TailwindCSS, Framer Motion |
| Backend | NestJS, TypeScript, tRPC, Zod |
| Database | PostgreSQL 16, Drizzle ORM |
| Cache & Queue | Redis 7, BullMQ |
| Infrastructure | Docker, Docker Compose, Turborepo Monorepo, Nginx |

---

## Monorepo Structure

```
smc-sudan/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utilities
├── nginx/            # Reverse proxy configuration
├── docker-compose.yml
└── turbo.json
```

---

## Key Systems

### Data Acquisition Layer

MLBB has no official public API. The platform implements a resilient multi-source data layer with automatic fallback:

1. **Primary:** Reverse-engineered MLBB API endpoints (`mlbb-api.adapter.ts`)
2. **Secondary:** HTTP scraping with Cheerio (`mlbb-scraper.adapter.ts`)
3. **Tertiary:** Puppeteer headless browser (configured, not default)
4. **Last resort:** Selenium (architecture prepared)

Each source is protected by a **Circuit Breaker** pattern that automatically opens when failure thresholds are exceeded and transitions to half-open for recovery testing.

### Sync Engine

Built on **BullMQ** with adaptive scheduling:

| Player Tier | Sync Frequency |
|---|---|
| Top players (Mythic+) | Every 2–4 hours |
| Active players | Every 6–12 hours |
| Inactive players | Every 24 hours |

Features include batch processing, dead-letter queues, exponential backoff, and concurrency control.

### Cache Architecture

Redis-backed caching with stale-while-revalidate:

| Resource | TTL |
|---|---|
| Player profile | 15 minutes |
| Hero stats | 30 minutes |
| Leaderboard | 5 minutes |

The leaderboard also uses Redis Sorted Sets for O(log N) rank lookups.

### Rank System

Ranks are stored deterministically with a computed `leaderboardWeight` field enabling consistent sorting without ambiguity:

```
leaderboardWeight = tierBase + divisionBonus + starsBonus + rankPoints
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Development Setup

```bash
# Clone and install
git clone <repo>
cd smc-sudan
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker compose -f docker-compose.dev.yml up -d

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Run database migrations
pnpm db:push

# Start development servers
pnpm dev
```

The web app runs on `http://localhost:3000` and the API on `http://localhost:3001`.

### Production Deployment

```bash
# Configure environment
cp .env.example .env
# Edit .env with production values

# Build and start all services
docker compose up -d --build

# Run migrations
docker compose exec api pnpm db:migrate
```

---

## Database Schema

The production schema includes 13 tables with proper indexing:

| Table | Purpose |
|---|---|
| `players` | Core player records |
| `player_stats` | Rank and match statistics per season |
| `hero_stats` | Per-hero performance data |
| `stat_snapshots` | Historical snapshots with differential compression |
| `rank_history` | Rank change events |
| `seasons` | Season management |
| `sync_queue` | Sync job tracking |
| `sync_logs` | Sync audit trail |
| `leaderboard_snapshots` | Precomputed leaderboard cache |
| `data_reliability` | Circuit breaker state persistence |
| `monitoring_metrics` | Observability metrics |
| `admin_users` | Admin panel access |

---

## Admin Dashboard

Access the admin panel at `/admin` to:

- Monitor queue health and metrics
- Inspect failed syncs and retry them
- View data source circuit breaker states
- Force-sync individual players
- Manage seasons and player moderation

---

## Observability

The platform is prepared for:

- **Prometheus** metrics export
- **Grafana** dashboards
- Structured JSON logging via Winston
- Health check endpoints at `/api/v1/health`

---

## Environment Variables

See `.env.example` for the complete list of required environment variables.

---

## License

Built for the SMC Sudan MOBA Community. Not affiliated with Moonton or Mobile Legends: Bang Bang.
