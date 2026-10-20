# CI runners

The first-party `site` job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on the org Apple Silicon Mac minis:

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

Jobs stay queued until a runner with all three labels is online. Workflows do not call `apt`, `sudo`, or `playwright install --with-deps` (that flag installs Linux packages). Shell used by CI is POSIX / BSD-portable and writes scratch files under `$RUNNER_TEMP` (exported as `TMPDIR` and `PLAYWRIGHT_BROWSERS_PATH` via `$GITHUB_ENV`).

## Caching

Do **not** set `cache: npm` (or `package-manager-cache: true` on setup-node v5+) on these runners. The minis already keep `~/.npm` on disk (`/Users/admin/.npm`), so `npm ci` is about a second. GitHub's remote Actions cache for this lockfile is ~883 MB and crosses the WAN at a few MB/s; restore plus save was ~217s p50 in the Oct 17–20 window and 717s on the first mini save.

## Not migrated

GitHub Pages for this repository is still the built-in **Deploy from a branch** flow (`main` `/`, `build_type: legacy`). The GitHub-managed `pages-build-deployment` workflow is not a file in this repo, runs on GitHub-hosted runners, and cannot select a Mac mini.

To run deploy on the minis instead: **Settings → Pages → Build and deployment → Source: GitHub Actions** (today it is **Deploy from a branch**). Then add a first-party workflow with `actions/upload-pages-artifact` and `actions/deploy-pages` on `[self-hosted, macOS, ARM64]`, triggered on `push` to `main` only — do not upload the Pages artifact on pull requests. Do not flip that setting until that workflow exists; `actions/deploy-pages` fails while the source is still branch-based. Pages itself has no build step (`https://bloxwap.github.io/` publishes `main` as-is).

## Prerequisites on each Mac mini

Install these on the machine (or confirm they are already present). Do not rely on the workflow to `brew install` or elevate privileges.

| Tool | Why |
| --- | --- |
| GitHub Actions runner | Registered with the default labels `self-hosted`, `macOS`, and `ARM64` |
| Xcode Command Line Tools | Provides `git` for `actions/checkout` |
| `bash` and `/bin/sh` | Workflow `run:` steps (macOS ships both; bash 3.2 is enough) |
| `curl`, `tar`, `sed`, `shasum` | Stock macOS. Not invoked by this workflow today; keep them for BSD-portable scripts |
| Outbound HTTPS | `github.com` (this repo and `bloxwap/hig`), the npm registry, and Playwright's browser CDN |

Node.js 22.22.0 is **not** a machine prerequisite. `actions/setup-node` downloads the `darwin-arm64` distribution into the runner tool cache.

### Playwright

`npm run test:e2e` launches Chromium. The workflow installs it with:

```sh
npx playwright install chromium
```

Browsers go to `$RUNNER_TEMP/ms-playwright` (`PLAYWRIGHT_BROWSERS_PATH`). There is no `--with-deps` and no `apt`/`sudo`. Chromium's macOS libraries ship with the OS.

### Not required

- Docker or container actions
- GNU `sed` / GNU `grep` / `jq`
- Homebrew `gnu-tar` (`gtar`) — this repo does not upload a Pages artifact
- PulseAudio, `xvfb`, or other Linux desktop packages
- Preinstalled `node_modules` (each job runs `npm ci`; the machine npm cache at `~/.npm` is enough — do not restore GitHub's remote `actions/cache`)
- GitHub Pages deploy from Actions (still the built-in branch publisher until the Pages source is switched; see **Not migrated**)

## Operator notes

- Give the runner enough free disk for `npm ci`, a HIG checkout into `.hig`, and a Chromium download.
- Headless Chromium on macOS does not need the Accessibility TCC prompt that headed browsers do.
- Fork pull requests on a public repository should stay on GitHub-hosted runners or a dedicated untrusted pool if org policy forbids self-hosted runners on forks. This workflow does not special-case forks.

## Jobs

| Workflow | Job | Runner |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | `site` | self-hosted Mac mini |
| GitHub Pages (`pages-build-deployment`) | deploy | GitHub-hosted (legacy branch publish; not selectable) |
