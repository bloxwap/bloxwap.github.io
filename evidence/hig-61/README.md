# HIG adoption evidence (bloxwap/hig#61)

All results here are **automated / browser** (Playwright 1.56.1, Chromium 141.0.7390.37, headless, macOS, 1x device scale), served locally by `scripts/serve.mjs`. No physical-device claims. Before is `main` at fa58ff9; after is this branch with `@bloxwap/hig-tokens` 0.1.0-candidate.sha872906a9 (bloxwap/hig@872906a) and `@bloxwap/font` 0.1.2.

Regenerate with `node scripts/evidence.mjs --root <checkout> --label before|after --out evidence/hig-61`. macOS renders text a little differently from Linux; these PNGs are review screenshots, not visual baselines.

## Screenshots

| Page | Before | After |
| --- | --- | --- |
| Home, 1440px | [before-home-desktop.png](before-home-desktop.png) | [after-home-desktop.png](after-home-desktop.png) |
| Home, 390px | [before-home-390.png](before-home-390.png) | [after-home-390.png](after-home-390.png) |
| Developers, 1440px | [before-developers-desktop.png](before-developers-desktop.png) | [after-developers-desktop.png](after-developers-desktop.png) |
| Developers, 390px | [before-developers-390.png](before-developers-390.png) | [after-developers-390.png](after-developers-390.png) |
| OG card, 1200x630 | [before-og.png](before-og.png) | [after-og.png](after-og.png) |

## Byte report

Bytes each page requests from this origin on a cold load (from [before-bytes.json](before-bytes.json) and [after-bytes.json](after-bytes.json)). Transfer is gzip -9 for text and raw for WOFF2/PNG; GitHub Pages' own compression may differ slightly.

| Page | Requests | Raw before | Raw after | Transfer before | Transfer after |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 3 → 7 | 27,589 | 629,088 | 8,178 | 603,056 |
| `/developers/` | 3 → 7 | 23,737 | 627,891 | 7,822 | 603,394 |
| `/privacy/` | 3 → 7 | 21,388 | 623,409 | 7,243 | 602,222 |
| 404 | 3 → 7 | 19,188 | 620,562 | 6,440 | 601,305 |

By file (raw / transfer):

| File | Before | After |
| --- | ---: | ---: |
| `styles.css` | 3,368 / 1,157 | 5,359 / 1,436 |
| `assets/hig/tokens.css` (HIG roles) | — | 5,003 / 1,183 |
| `assets/font/bloxwap-font.css` | — | 1,327 / 521 |
| `assets/font/BloxwapSans-Variable.woff2` | — | 310,848 |
| `assets/font/BloxwapMono-Variable.woff2` | — | 281,948 |
| `lockup.svg` | 13,313 / 4,300 | 13,313 / 4,300 (unchanged) |
| `index.html` | 10,908 / 2,721 | 11,290 / 2,820 |
| `developers/index.html` | 7,056 / 2,365 | 10,093 / 3,158 (adds Haptic and Font) |

The increase is almost entirely the two brand faces (592,796 B). Before, the site used system fonts (`ui-rounded, system-ui`). The faces are the unmodified Latin variable files from `@bloxwap/font` 0.1.2 with `font-display: swap`. They load once and are cached for every page, and Sans is preloaded. CSS grows by 8,321 B raw (1,983 B gzip) for the token roles and font rules.

## Browser checks (`npm run test:e2e`)

| Check | Before (`main`) | After |
| --- | --- | --- |
| HIG roles resolve, Bloxwap Sans and Mono load, no failed requests (4 pages) | fail: no roles or brand faces | pass |
| Every link reachable by Tab in document order with the HIG focus ring (2px solid `--hig-focus`) | fail: browser default `auto` outline | pass |
| No horizontal scrolling at 320px | **fail on `/` and `/developers/`**: `minmax(320px, 1fr)` cards overflow (17 and 38 elements) | pass |
| No horizontal scrolling at 390px | pass | pass |
| No horizontal scrolling at 1280px with 200% root text | pass | pass |
| Home links to the five SDK docs sites | pass | pass |
| Developer portal covers the five SDKs | fail: Haptic and Font missing | pass |
| 404 CTA uses `--hig-action`/`--hig-onAction` at the 48px comfortable control height | fail | pass |
| OG card: `og:image` is `/og/home.png` (1200x630) with dimensions, alt and `twitter:card` on every indexed page | fail: `/privacy/` used `/chart/og/home.png`; `/developers/` and `/privacy/` had no dimensions or card | pass |

Before: 13 failed, 11 passed. After: 24 passed.

Live SDK docs links checked with `curl` on 2026-10-15: `/chart/`, `/hyperliquid/`, `/sfx/`, `/haptic/`, `/font/` and their `/docs/` pages, plus every new Haptic/Font card target, return 200.

## Scoped drift (`npm run drift`, bloxwap/hig@872906a `scripts/drift.mjs`)

Same `hig-drift.json` scope on both trees:

- Before: `styles.css: copied-palette`, a hard-coded Bloxwap brand colour.
- After: `Scoped anti-drift: passed (15 files, 3 dated exceptions)`. The exceptions cover the verified package copies in `assets/hig/tokens.css` and `assets/font/`, which are needed because Pages has no build step. They expire 2027-01-15 and are tracked in bloxwap/hig#56 and bloxwap/bloxwap.github.io#25.
