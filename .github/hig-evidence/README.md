# HIG adoption evidence (bloxwap/hig#61)

Captured on 2026-10-15 with Playwright Chromium from `bun run server.ts`. Run: `node .github/hig-evidence/shoot.mjs http://localhost:3900 <out> <label>`. The "before" set is `main` at fa58ff9. The "after" set is this branch, pinned to HIG `0.1.0-candidate.sha19c75619` (bloxwap/hig@19c75619).

| Check | Before | After |
| --- | --- | --- |
| `styles.css` colour literals | 9 (6 hex, 2 P3 overrides, 1 hover hex) | 0; every colour is a `--hig-*` role |
| HIG drift check (`copied-palette`) | fails | passes (6 files, 0 exceptions) |
| Body/heading font | `ui-rounded`/system | Bloxwap Sans; Bloxwap Mono for eyebrow and code |
| Keyboard focus ring (Tab order: brand, cards…) | UA default, `rgb(16,16,16)` 1px on a near-black background (not visible) | 2px `--hig-focus` with a 2px offset |
| 320px reflow (WCAG 1.4.10) | horizontal scroll on home and developers (`minmax(320px)` cards) | no overflow on all 4 pages |
| 640px (1280px at 200% zoom) | no overflow | no overflow |
| Developer portal | Chart, Hyperliquid and SFX only | adds Haptic and Font; all 26 project-site links return 200 (`check-site.mjs --live`) |
| OG card | Chart and Hyperliquid only, older type | rendered from HIG roles, Bloxwap Sans/Mono and the lockup; names all five projects |

## Byte report (decoded bytes, home page, desktop)

| Resource | Before | After | Note |
| --- | ---: | ---: | --- |
| HTML | 10,908 | 11,056 | two extra `<link>`s |
| `styles.css` | 3,368 | 4,263 | |
| `assets/hig/tokens.css` | — | 2,975 | pinned copy |
| `/font/bloxwap-font.css` | — | 53,384 | shared with the bloxwap.github.io/font/ site (same URL, same cache) |
| Fonts | 0 | 592,796 | Bloxwap Sans and Mono latin variable woff2. Shared cache with /font/. Script companions load only through unicode-range. |
| Images | 13,313 | 13,313 | unchanged lockup |
| `og/home.png` | 63,839 | 46,258 | |

The developers page HTML grows from 7,056 to 9,111 bytes with the Haptic and Font sections.
