# Motiq

Autonomous Customer Intelligence platform for B2B SaaS — AI agents monitor customer feedback 24/7, triage signals, detect patterns, and alert the right people.

## Commands

```bash
bun run dev              # Start full stack (web + api) via Turborepo
bun run dev:web          # Frontend only (TanStack Start)
bun run dev:api          # API only (Hono on Bun)
bun run fix              # Auto-fix lint/format (Ultracite/Biome)
bun run check            # Check lint/format
bun run check-types      # TypeScript type checking
bun run build            # Build all apps/packages

# Database (Drizzle ORM + Neon)
bun run --filter @motiq/db db:push       # Push schema
bun run --filter @motiq/db db:generate   # Generate migrations
bun run --filter @motiq/db db:migrate    # Apply migrations
```

## Critical Rules

- **Env vars**: Always use `@motiq/env/api` or `@motiq/env/web` — never `process.env` or `import.meta.env` directly.
- **Commits**: Conventional Commits format, enforced by commitlint via lefthook.
- **Lint**: Run `bun run fix` before committing. Semicolons `asNeeded`. `routeTree.gen.ts` is excluded.
- **UI package**: `@motiq/ui` is the only package that requires building (`tsdown`). All other internal packages export raw TypeScript.

## Detailed Docs

- [Architecture](.claude/architecture.md) — Apps, packages, key patterns, CSS/styling
- [Product Vision](.claude/product-vision.md) — Target customer, three-layer architecture, roadmap, design philosophy
