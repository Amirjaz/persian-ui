# persian-ui — working agreements

Persian-first React library published as `@amirjaz/persian-ui`. The approved v1 design
lives in `docs/DESIGN.md`; follow it, and ask the maintainer before changing it.

## Workflow

- Work in phases: (1) core utils + validators, (2) components, (3) build config + docs.
  Each phase is fully tested before moving on; show the test output at the end of each
  phase and commit with a clear message.
- When a design decision has real tradeoffs, stop and ask (offer options with a
  recommended one) instead of picking silently. Don't add scope beyond `docs/DESIGN.md`.
- No GitHub push and no npm publish unless asked.

## Commands

- `pnpm test` / `pnpm coverage` — Vitest (coverage thresholds: 100% for `src/core/**`).
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check` (everything).

## Rules that are easy to break

- CSS: logical properties only (`margin-inline-start`, `inset-inline-end`, …); never
  `left`/`right`/`margin-left`/`padding-right`/`border-left`/`text-align: left`.
- `src/core` must not import React or use Node APIs.
- Components import core via `@amirjaz/persian-ui/core`, never relative paths into
  `src/core` (keeps a single copy in consumers' bundles).
- Never put real national IDs, Sheba numbers or other personal data in tests or docs;
  generate them from the checksum algorithms (`test/generators.ts`).
- Calendar day arithmetic works on day numbers or UTC, never `Date` + 24h.
- TypeScript is pinned to 6.0.x on purpose (tsup can't build declarations with TS 7).
