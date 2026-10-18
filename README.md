# bloxwap.github.io

Root GitHub Pages site for Bloxwap's open-source projects. Pages serves `main` as-is, with no build step.

- [bloxwap/chart](https://github.com/bloxwap/chart) — Chart SDK, docs at https://bloxwap.github.io/chart/
- [bloxwap/hyperliquid](https://github.com/bloxwap/hyperliquid) — Hyperliquid SDK, docs at https://bloxwap.github.io/hyperliquid/
- [bloxwap/sfx](https://github.com/bloxwap/sfx) — interface sound effects, sound board and docs at https://bloxwap.github.io/sfx/
- [bloxwap/haptic](https://github.com/bloxwap/haptic) — haptic feedback for React, docs at https://bloxwap.github.io/haptic/
- [bloxwap/font](https://github.com/bloxwap/font) — Sans, Mono, and Pixel typefaces, type tester and docs at https://bloxwap.github.io/font/

## Design system

The pages follow the [Bloxwap HIG](https://github.com/bloxwap/hig) plain-CSS path (bloxwap/hig#61):

- `styles.css` uses only `--hig-*` roles (colour, type, space, radius, motion, density). It defines no values of its own; `npm run check` fails on literal colours (hex, colour functions, and named colours anywhere in a value, shorthands included, outside `var(--hig-*)`), type, spacing, radius, durations or `px` heights. `scripts/check.test.mjs` (`npm run test:check`, also part of `npm run check`) plants literals to prove each rule fails.
- The nav and footer lockups are sized in `rem`, so they scale with root text; `npm run test:e2e` checks they double at 200% text.
- `assets/hig/tokens.css` is `@bloxwap/hig-tokens/css`, and `icon.svg` is the approved mark `@bloxwap/hig-tokens/mark.svg`, both from the checksummed candidate tarball in `vendor/bloxwap-hig/` (HIG is not on npm yet, bloxwap/hig#56).
- `assets/font/` holds the Latin Bloxwap Sans and Mono faces from `@bloxwap/font` 0.1.2 (pinned in `package-lock.json`) and their `@font-face` rules.
- `lockup.svg` is the supplied Bloxwap lockup, verbatim from bloxwap/font `apps/docs/public/logos/bloxwap-lockup.svg`; `npm run check` verifies its hash.
- `og/home.png` is rendered from `scripts/og-card.html` with `npm run og`.

Never edit `assets/hig/`, `assets/font/`, `assets/provenance.json` or `icon.svg` by hand. They are written by `npm run sync:hig`, and CI fails if they differ from the pinned packages. Generated copies are committed because Pages has no build step; bloxwap/bloxwap.github.io#25 tracks removing them.

## Develop

```sh
npm ci
npm run dev          # http://localhost:3900
npm run check        # literal/role, page, brand and OG checks plus planted-literal tests; verifies the committed copies
npm run drift        # scoped HIG drift check from a HIG checkout pinned to the vendored commit
npx playwright install chromium
npm run test:e2e     # fonts, roles, keyboard focus, 320px/390px and 200% text reflow, SDK links, OG card
```

CI (`site` in `.github/workflows/ci.yml`) runs on self-hosted Apple Silicon Mac minis (`runs-on: [self-hosted, macOS, ARM64]`). See [docs/ci-runners.md](docs/ci-runners.md) for the runner labels and tools. GitHub Pages still publishes `main` as-is.

## Upgrading HIG

1. In a bloxwap/hig checkout at a reviewed commit, run `npm ci && npm run generate:fonts && npm run build && npm run release:dry-run -- --channel candidate` (no publish, tag or release).
2. Replace the tarball in `vendor/bloxwap-hig/`, update `SHA256SUMS`, `provenance.json` and the `file:` dependency, then run `npm install`.
3. Run `npm run sync:hig`, `npm run check`, `npm run drift` and `npm run test:e2e`, and update the bloxwap.github.io row in bloxwap/hig `planning/adoption.json`.

Rollback: revert the adopting PR.
