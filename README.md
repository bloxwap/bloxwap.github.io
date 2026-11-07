# bloxwap.github.io

Root GitHub Pages site for Bloxwap's open-source projects. GitHub Actions on the org Mac minis generates package-owned assets, validates the site, and deploys the tested `main` artifact.

- [bloxwap/chart](https://github.com/bloxwap/chart) — Chart SDK, docs at https://bloxwap.github.io/chart/
- [bloxwap/hyperliquid](https://github.com/bloxwap/hyperliquid) — Hyperliquid SDK, docs at https://bloxwap.github.io/hyperliquid/
- [bloxwap/agent-cli](https://github.com/bloxwap/agent-cli) — Hyperliquid trading tools for agents, docs at https://bloxwap.github.io/agent-cli/
- [bloxwap/smart-solana](https://github.com/bloxwap/smart-solana) — adaptive Solana JSON-RPC transport, docs at https://bloxwap.github.io/smart-solana/
- [bloxwap/smart-hyperevm](https://github.com/bloxwap/smart-hyperevm) — latency-aware HyperEVM viem transport, docs at https://bloxwap.github.io/smart-hyperevm/
- [bloxwap/hig](https://github.com/bloxwap/hig) — Bloxwap Human Interface Guidelines and design system, docs at https://bloxwap.github.io/hig/
- [bloxwap/sfx](https://github.com/bloxwap/sfx) — interface sound effects, sound board and docs at https://bloxwap.github.io/sfx/
- [bloxwap/haptic](https://github.com/bloxwap/haptic) — haptic feedback for React, docs at https://bloxwap.github.io/haptic/
- [bloxwap/font](https://github.com/bloxwap/font) — Sans, Mono, and Pixel typefaces, type tester and docs at https://bloxwap.github.io/font/
- [bloxwap/screensaver](https://github.com/bloxwap/screensaver) — Bitcoin, Solana, Ethereum, and Hyperliquid screensavers for Mac, Windows, and Linux, with downloads and live browser previews at https://bloxwap.github.io/screensaver/

## Design system

The pages follow the [Bloxwap HIG](https://github.com/bloxwap/hig) plain-CSS path (bloxwap/hig#61):

- `styles.css` uses only `--hig-*` roles (colour, type, space, radius, motion, density). It defines no values of its own; `npm run check` fails on literal colours (hex, colour functions, and named colours anywhere in a value, shorthands included, outside `var(--hig-*)`), type, spacing, radius, durations or `px` heights. `scripts/check.test.mjs` (`npm run test:check`, also part of `npm run check`) plants literals to prove each rule fails.
- The nav and footer lockups are sized in `rem`, so they scale with root text; `npm run test:e2e` checks they double at 200% text.
- `assets/hig/tokens.css` is `@bloxwap/hig/tokens/css`, and `icon.svg` is the approved mark `@bloxwap/hig/tokens/mark.svg`, both generated from the exact npm `@bloxwap/hig@0.2.0` release. [`docs/hig-release.json`](docs/hig-release.json) and `package-lock.json` pin its registry URL and integrity hash. CI installs that same release from `bun.lock`. Both lockfiles also pin `@bloxwap/chart` 0.3.0, the one required peer of `@bloxwap/hig`. This site does not import it.
- `assets/font/` holds the Latin Bloxwap Sans and Mono faces from `@bloxwap/font` 0.1.2 (pinned in `package-lock.json`) and their `@font-face` rules.
- `lockup.svg` is the supplied Bloxwap lockup, verbatim from bloxwap/font `apps/docs/public/logos/bloxwap-lockup.svg`; `npm run check` verifies its hash.
- `og/home.png` is rendered from `scripts/og-card.html` with `npm run og`.

Never edit `assets/hig/`, `assets/font/`, `assets/provenance.json` or `icon.svg` by hand. `npm run build` (also available as `npm run sync:hig`) generates these ignored outputs from the locked packages. CI checks their bytes, tests the resulting site and uploads that same directory for Pages deployment. The generated assets and vendored candidate tarballs are no longer committed; all three copied-asset drift exceptions are retired (#25). HIG 0.2.0 is one package; the unpublished `@bloxwap/hig-*` 0.1 packages 404 on npm. The 0.2.0 registry release has no GitHub `v0.2.0` tag and no npm provenance attestation. Its token CSS and mark match the source commit in `docs/hig-release.json`.

## Develop

```sh
npm ci
npm run build        # generate CSS, fonts, approved mark and asset hashes
npm run dev          # http://localhost:3900
npm run check        # literal/role, page, brand and OG checks plus planted-literal tests; verifies the generated assets
npm run drift        # scoped HIG drift check from a HIG checkout pinned to the published source commit
npx playwright install chromium
npm run test:e2e     # fonts, roles, keyboard focus, 320px/390px and 200% text reflow, SDK links, OG card
```

CI (`site` in `.github/workflows/ci.yml`) runs on self-hosted Apple Silicon Mac minis (`runs-on: [self-hosted, macOS, ARM64]`). See [docs/ci-runners.md](docs/ci-runners.md) for the runner labels and tools. The `deploy` job publishes Pages after CI on pushes to `main` and manual runs on `main`. The repository Pages source must be **GitHub Actions** in **Settings → Pages**, as described in the runner docs.

## Upgrading HIG

1. Update the exact `@bloxwap/hig` version in `package.json`. Refresh both lockfiles (`bun install` for `bun.lock`, `npm install` for `package-lock.json`) without changing other dependencies. CI installs from `bun.lock`; `scripts/sync-hig.mjs` checks `package-lock.json`.
2. Update `docs/hig-release.json` with the reviewed source commit, registry URL and integrity from the lockfile. Check out that commit in `.hig` if a local drift checkout already exists. If the npm release has no GitHub tag, pin the commit whose `@bloxwap/hig/tokens/css` and mark match the tarball.
3. Run `npm run build`, `npm run check`, `npm run drift` and `npm run test:e2e`, and update the bloxwap.github.io row in bloxwap/hig `planning/adoption.json`.

The earlier registry migration onto `@bloxwap/hig-tokens@0.1.0` is recorded in [docs/hig-registry-verification.json](docs/hig-registry-verification.json). Fonts and the approved mark kept the same bytes through that migration; homepage and developer-page screenshots at 1440px and 390px were byte-identical.

Rollback: revert the adopting PR.
