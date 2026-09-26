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

- `pnpm test` / `pnpm coverage` — Vitest, four projects:
  - `core` (Node): utilities, validators, source hygiene and logical-CSS guards
  - `react` (jsdom, React 19) and `react18` (the same tests against React 18.3, installed by
    the `test/react18` workspace package)
  - `browser`: real-layout tests in the installed Edge via Playwright
    (`PUI_BROWSER_CHANNEL=chrome` to use Chrome; no browser download needed)
  - run one with `pnpm vitest run --project react`
- Coverage thresholds: 100% for `src/core/**`, 90% for `src/react/**`.
- `pnpm dev` — playground (every component, RTL and LTR side by side) on port 5199.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check` (everything).
- Installs: pnpm may need `--config.confirm-modules-purge=false` when run non-interactively.

## Rules that are easy to break

- CSS: logical properties only (`margin-inline-start`, `inset-inline-end`, …); never
  `left`/`right`/`margin-left`/`padding-right`/`border-left`/`text-align: left`.
- `src/core` must not import React or use Node APIs.
- Components import core via `@amirjaz/persian-ui/core`, never relative paths into
  `src/core` (keeps a single copy in consumers' bundles).
- Never put real national IDs, Sheba numbers or other personal data in tests or docs;
  generate them from the checksum algorithms (`test/generators.ts`).
- Calendar day arithmetic works on day numbers or UTC, never `Date` + 24h.
- Write invisible characters (ZWNJ, bidi marks, NBSP…) as `\u` escapes; in tests build them
  from code points (`test/chars.ts`). `test/source-hygiene.test.ts` fails on raw ones.
- Keyboard handlers read the direction at event time with `getDirection(event.currentTarget)`.
- Components must render on the server (no `window`/`document` during render):
  `src/react/ssr.test.tsx` checks this.
- TypeScript is pinned to 6.0.x on purpose (tsup can't build declarations with TS 7).
