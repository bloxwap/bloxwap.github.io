# bloxwap.github.io

Root GitHub Pages site for Bloxwap's open-source projects.

- [bloxwap/chart](https://github.com/bloxwap/chart) — Chart SDK, docs at https://bloxwap.github.io/chart/
- [bloxwap/hyperliquid](https://github.com/bloxwap/hyperliquid) — Hyperliquid SDK, docs at https://bloxwap.github.io/hyperliquid/
- [bloxwap/font](https://github.com/bloxwap/font) — Sans, Mono, and Pixel typefaces, type tester and docs at https://bloxwap.github.io/font/

## Design tokens and brand (Bloxwap HIG)

The site follows the [Bloxwap HIG](https://github.com/bloxwap/hig) plain-CSS path: `styles.css` uses only the semantic `--hig-*` roles, and type is Bloxwap Sans and Mono.

- `assets/hig/tokens.css` is `@bloxwap/hig-tokens/css`, copied by `scripts/sync-hig.mjs` from the HIG commit and file hash pinned in `hig.lock.json`. There is no build step, so the copy is committed. Don't edit it by hand. To upgrade, change the lock and run `node scripts/sync-hig.mjs --hig <bloxwap/hig checkout>` (or `--tarball <bloxwap-hig-tokens-*.tgz>`).
- Fonts load from `/font/bloxwap-font.css`, the stylesheet that [bloxwap/font](https://github.com/bloxwap/font) (`@bloxwap/font`) publishes on this origin. No font files are committed here.
- `icon.svg` is the approved HIG mark (`@bloxwap/hig-tokens/mark.svg`, SHA-256 `a1f1cea3…`). `og/home.png` is rendered from `scripts/og/home.html` by `scripts/render-og.mjs`.
- CI (`.github/workflows/hig.yml`) checks that the token copy matches the lock, runs the HIG scoped drift check (`hig-drift.json`) from the same pinned commit, and runs `scripts/check-site.mjs`: no colour literals in `styles.css`, and every local link resolves. Run `node scripts/check-site.mjs --live` to also confirm that the project-site links answer 200.

Local preview: `bun run dev` serves the site on port 3900 and proxies the project paths (`/chart/`, `/hyperliquid/`, `/sfx/`, `/haptic/`, `/font/`) to the live origin.
