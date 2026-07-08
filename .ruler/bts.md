# Motiq — Project Structure & Rules

## Architecture

Turborepo monorepo with Bun workspaces. Two apps consume shared packages.

### Apps

- **`apps/web/`** — Frontend: TanStack Start (SSR) + React 19 + TanStack Router + Tailwind v4. Uses React Compiler via babel plugin. Vite proxies `/api` requests to the API server. Routes are file-based in `src/routes/`, auto-generated into `routeTree.gen.ts`. Path alias `@/` maps to `src/`. Deployed to Vercel via Nitro.
- **`apps/api/`** — Backend: Hono server running on Bun. Mounts Better Auth at `/api/auth/*`, tRPC at `/trpc/*`, and custom routes (e.g., `/api/chat` for AI streaming). Dev mode uses `bun run --hot`. Deployed to Vercel via Hono preset.

### Packages (Shared Logic)

- **`@motiq/trpc`** — tRPC router definitions, procedures (`publicProcedure`/`protectedProcedure`), and context. Routers live in `src/routers/`. The `appRouter` type is exported as `AppRouter` for end-to-end type safety.
- **`@motiq/db`** — Drizzle ORM setup with Neon serverless PostgreSQL. Schema files in `src/schema/` (auth tables, data tables). Exports `db` instance and schema via subpath exports.
- **`@motiq/auth`** — Better Auth configuration with Drizzle adapter and Polar payments plugin. Exports the `auth` instance.
- **`@motiq/env`** — Type-safe env vars via `@t3-oss/env-core`. Two entrypoints: `@motiq/env/api` (server vars) and `@motiq/env/web` (VITE_-prefixed client vars). Never use `process.env` or `import.meta.env` directly.
- **`@motiq/ui`** — Shared component library (shadcn/ui + Radix). Built with tsdown for CSS isolation. Import components via `@motiq/ui/button`, `@motiq/ui/components/sonner`, etc. Global CSS lives in `packages/ui/src/styles/globals.css`.
- **`@motiq/ai`** — AI SDK integration (Vercel AI SDK + Google). Exports chat logic and tool definitions.
- **`@motiq/cache`** — Upstash Redis client.
- **`@motiq/mail`** — Email sending via Resend with React Email templates.
- **`@motiq/ts-config`** — Shared TypeScript configs (`base`, `hono-framework`, `react-library`).

---

## Commands

### Development
- `bun run dev` — Start full stack (web + api) via Turborepo
- `bun run dev:web` — Start only the frontend
- `bun run dev:api` — Start only the API

### Code Quality (Ultracite wraps Biome)
- `bun run fix` — Auto-fix lint/format issues
- `bun run check` — Check lint/format without fixing
- `bun run check-types` — TypeScript type checking across monorepo

### Database (Drizzle ORM + Neon PostgreSQL)
- `bun run --filter @motiq/db db:push` — Push schema to database
- `bun run --filter @motiq/db db:generate` — Generate migrations
- `bun run --filter @motiq/db db:migrate` — Apply migrations
- `bun run --filter @motiq/db db:studio` — Open Drizzle Studio

### Build
- `bun run build` — Build all apps/packages via Turborepo

---

## Key Patterns

- **All packages are built with tsdown** to `dist/` — exports point to compiled `.mjs` files with `.d.mts` type declarations. This is required for Vercel deployment (Node.js can't run raw TypeScript at runtime). DTS generation is skipped on Vercel (`dts: !process.env.VERCEL`).
- **Dependency versions** are managed via the `catalog:` protocol in root `package.json`.
- **tRPC data flow**: `apps/api` → mounts `appRouter` from `@motiq/trpc/routers` → `apps/web` consumes via `@trpc/tanstack-react-query` with superjson transformer. The tRPC client is configured in `apps/web/src/router.tsx` and the `useTRPC` hook is created in `apps/web/src/utils/trpc.ts`.
- **Auth flow**: API handles auth via Better Auth middleware. Web app uses `authClient` from `@/lib/auth-client` for client-side auth and `authMiddleware` in `@/middleware/auth.ts` for server function protection.
- **Commit messages** follow Conventional Commits (enforced by commitlint via lefthook pre-commit hook). Lefthook also auto-runs `ultracite fix` on staged files.

## CSS & Styling

- **Tailwind v4** with CSS-first configuration — there is no `tailwind.config.js`. Config is in the CSS file.
- In CSS files, place `@import` statements for external resources (Google Fonts, etc.) **before** framework/Tailwind imports to avoid build errors.
- shadcn/ui components are installed into `packages/ui/`, not the web app. The shadcn config (`components.json`) is at `apps/web/` and points aliases to `@motiq/ui`.

---

## Product Vision

Motiq is an **Autonomous Customer Intelligence** platform for B2B SaaS teams. AI agents monitor all customer feedback 24/7 — triaging signals, detecting patterns, and alerting the right people before small issues become churn.

**One-liner:** Stop Missing Critical Customer Signals.

### Target Customer

VP of Customer Success, Head of Product, and Support/CS Managers at B2B SaaS companies (50–500 employees) overwhelmed by feedback volume scattered across multiple channels.

### Three-Layer Architecture

**Layer 1 — Connect (Universal Intake)**
Connects to all customer feedback sources: Zendesk, Freshdesk, Typeform, Google Forms, Gong/Chorus call recordings, product analytics events, social mentions, email inboxes (support@, feedback@). Auto-syncs every 5 minutes, no code required.

**Layer 2 — Monitor (Autonomous Agents)**
Four specialized AI agents run 24/7:
- **Triage Agent:** Classifies every piece of feedback (Bug / Feature Request / Complaint / Question) and assigns priority (Critical → Low) based on customer tier, sentiment, and estimated revenue impact.
- **Pattern Detection Agent:** Detects spikes, clusters, and trends across all sources.
- **Risk Agent:** Monitors churn signals, escalation situations, and competitive threats.
- **Intelligence Agent:** Generates insights, quantifies business impact, and makes prioritization recommendations.

**Layer 3 — Act (Autonomous Actions)**
Auto-routes tickets to the right team, creates Jira issues with full context, sends Slack escalations for critical signals, drafts proactive CSM outreach for churn risks, delivers role-based daily digests.

### Future Roadmap (post product-market fit)

- **Proactive Resolution at Scale** — AI agents that don't just detect and alert, but resolve issues autonomously. Not generic chatbot resolution (commodity), but intelligence-informed batch actions: e.g., detect a billing complaint pattern across 30 enterprise accounts → auto-adjust invoices + notify all 30 CSMs with full context. The differentiator is resolving proactively and at scale because Motiq understands the full panorama, unlike ticket-by-ticket reactive tools.
- **Contextual Intelligence Chat** — A chat interface (not a support chatbot) where teams can query Motiq's intelligence layer in natural language. Ask "what are the top churn risks this week?", "show me the trend for billing complaints in Q4", "which feature requests have the highest revenue impact?" — and get answers grounded in real aggregated customer data, not generic AI responses. Beyond querying, the chat also provides actionable recommendations: "how can we reduce billing complaints?" → suggests process changes, identifies root causes, and recommends specific actions based on patterns detected across all customer signals.

### Design Philosophy

- **Intelligent Minimalism** — Linear/Raycast aesthetic. No clutter. Signals are the hero.
- **Proactive over Reactive** — The platform watches and pushes; users don't pull reports.
- **Trust** — Every AI alert links to source feedback so teams can verify before acting.

---

## Biome / Ultracite

- Semicolons: `asNeeded` (omit where possible)
- `noUndeclaredEnvVars` rule is set to `error`
- `routeTree.gen.ts` is excluded from linting
- Run `bun run fix` before committing
