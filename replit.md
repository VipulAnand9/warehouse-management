# Shelfwise Warehouse Management

A warehouse MVP for small teams to review stock, manage products, and record inventory changes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/warehouse-management/src/App.tsx` — app routes, authenticated shell, dashboard, inventory, and stock screens
- `artifacts/warehouse-management/src/data/inventory.ts` — demo products, browser persistence, and inventory change helpers
- `artifacts/warehouse-management/src/index.css` — Shelfwise visual theme and responsive layout
- `artifacts/api-server/src/app.ts` — shared API server with Clerk proxy/middleware wiring

## Architecture decisions

- Inventory is a browser-persisted demo for the first MVP; changes are not shared across devices or accounts.
- Authentication uses Replit-managed Clerk email/password sign-in.
- The app no longer exposes self-service sign-up. Production worker-only access still requires Invite only in Publishing and inviting the intended staff.

## Product

Shelfwise provides a public introduction and Clerk sign-in, then a dashboard for product totals, available units, low-stock items, and recent activity. Signed-in users can search, view, add, edit, and delete products, and record received or removed stock.

## User preferences

- Build incrementally as an MVP, prioritizing login, dashboard, inventory, then stock management.
- Keep the interface intuitive for non-technical users and avoid unnecessary complexity.

## Gotchas

- Replit-managed Clerk supports email/password sign-in; username-based sign-in requires a different Clerk configuration.
- Google SSO is configured in the Replit Auth pane, not by the app's React components.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
