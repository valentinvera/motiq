# Motiq

**Autonomous Customer Intelligence for B2B SaaS teams.**

Stop missing critical customer signals. Motiq deploys AI agents that monitor all your customer feedback 24/7 — triaging signals, detecting patterns, and alerting the right people before small issues become churn.

## Tech Stack

- **Runtime** — Bun
- **Monorepo** — Turborepo + Bun workspaces
- **Frontend** — TanStack Start (SSR) + React 19 + TanStack Router + Tailwind v4
- **Backend** — Hono
- **API Layer** — tRPC (end-to-end type-safe)
- **Database** — PostgreSQL (Neon) + Drizzle ORM
- **Auth** — Better Auth + Polar (payments)
- **AI** — Vercel AI SDK + Google
- **UI** — shadcn/ui + Radix
- **Code Quality** — Biome (via Ultracite) + Lefthook

## Getting Started

Install dependencies:

```bash
bun i
```

### Database Setup

This project uses PostgreSQL (Neon) with Drizzle ORM.

1. Set up a PostgreSQL database.
2. Update your `apps/api/.env` file with your connection details.
3. Push the schema:

```bash
bun run --filter @motiq/db db:push
```

### Development

```bash
bun run dev        # Start full stack (web + api)
bun run dev:web    # Start only the frontend
bun run dev:api    # Start only the API
```

- Web app: [http://localhost:8080](http://localhost:8080)
- API: [http://localhost:4040](http://localhost:4040)

## Project Structure

```
motiq/
├── apps/
│   ├── web/              # Frontend (TanStack Start + React 19)
│   └── api/              # Backend API (Hono + Bun)
├── packages/
│   ├── ai/               # AI SDK integration (Google)
│   ├── auth/             # Authentication (Better Auth + Polar)
│   ├── cache/            # Caching (Upstash Redis)
│   ├── db/               # Database schema & Drizzle ORM
│   ├── env/              # Type-safe environment variables
│   ├── mail/             # Transactional email (Plunk + React Email)
│   ├── trpc/             # tRPC routers, procedures & context
│   ├── ts-config/        # Shared TypeScript configs
│   └── ui/               # Shared UI component library (shadcn/ui)
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps and packages |
| `bun run dev:web` | Start only the web app |
| `bun run dev:api` | Start only the API |
| `bun run check-types` | TypeScript type checking across monorepo |
| `bun run check` | Run Biome linting and formatting check |
| `bun run fix` | Auto-fix linting and formatting issues |
| `bun run --filter @motiq/db db:push` | Push schema to database |
| `bun run --filter @motiq/db db:generate` | Generate migrations |
| `bun run --filter @motiq/db db:migrate` | Apply migrations |
| `bun run --filter @motiq/db db:studio` | Open Drizzle Studio |
