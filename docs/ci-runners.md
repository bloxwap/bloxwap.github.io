# CI runners

The first-party `site` and `deploy` jobs in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) run on the org Apple Silicon Mac minis:

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

Jobs stay queued until a runner with all three labels is online. Workflows do not call `apt`, `sudo`, or `playwright install --with-deps` (that flag installs Linux packages). Shell used by CI is POSIX / BSD-portable and writes scratch files under `$RUNNER_TEMP` (exported as `TMPDIR` via `$GITHUB_ENV`).

## Caching

Use Bun's local on-disk package cache; do not enable remote Actions caches. CI installs from `bun.lock` with `bun install --frozen-lockfile`. Keep `package-lock.json` as well: `scripts/sync-hig.mjs` reads it to verify the reviewed registry releases. Dependency updates must keep both lockfiles in sync.

## Pages deployment

Pages now deploys from Actions on the minis. The `site` job runs `bun install --frozen-lockfile` and `bun run build` to generate package-owned tokens, fonts and the approved mark, then validates the generated files and runs browser tests. On pushes to `main` and manual `workflow_dispatch` runs on `main`, it uploads that tested site as the Pages artifact. After `site` succeeds, `deploy` publishes that artifact without rebuilding it. Pull requests never deploy. The publish directory keeps `.nojekyll` and excludes only `.git`, `.github`, `node_modules`, `.hig`, `test-results`, and `playwright-report`.

The repository's Pages source must be set to **GitHub Actions** under **Settings → Pages → Build and deployment → Source**, replacing **Deploy from a branch**. Alternatively, run:

```sh
gh api -X PUT repos/bloxwap/bloxwap.github.io/pages -f build_type=workflow
```

Deployments are serialized without cancellation. Only pull request CI runs cancel older runs for the same pull request.

## Prerequisites on each Mac mini

Install these on the machine (or confirm they are already present). Do not rely on the workflow to `brew install` or elevate privileges.

| Tool | Why |
| --- | --- |
| GitHub Actions runner | Registered with the default labels `self-hosted`, `macOS`, and `ARM64` |
| Xcode Command Line Tools | Provides `git` for `actions/checkout` |
| `bash` and `/bin/sh` | Workflow `run:` steps (macOS ships both; bash 3.2 is enough) |
| `rsync`, GNU `tar` (`gtar`) | Prepares the publish directory and packages the Pages artifact on macOS |
| `curl`, `tar`, `sed`, `shasum` | Stock macOS. Not invoked by this workflow today; keep them for BSD-portable scripts |
| Outbound HTTPS | `github.com` (this repo and `bloxwap/hig`), the npm registry, and Playwright's browser CDN |

Node.js 22.22.0 is **not** a machine prerequisite. `actions/setup-node` downloads the `darwin-arm64` distribution into the runner tool cache.

Bun 1.4.2 is installed by the SHA-pinned `oven-sh/setup-bun` action.

### Playwright

`bun run test:e2e` launches Chromium. The workflow installs it with:

```sh
bunx playwright install chromium
```

Browsers reuse Playwright's default `~/Library/Caches/ms-playwright` directory, which persists between jobs on the minis. There is no `--with-deps` and no `apt`/`sudo`.

### Not required

- Docker or container actions
- GNU `sed` / GNU `grep` / `jq`
- PulseAudio, `xvfb`, or other Linux desktop packages
- Preinstalled `node_modules` (the `site` job runs `bun install --frozen-lockfile`; Bun's local package cache is enough — do not restore GitHub's remote `actions/cache`)

## Operator notes

- Give the runner enough free disk for `bun install --frozen-lockfile`, a HIG checkout into `.hig`, and a Chromium download.
- Headless Chromium on macOS does not need the Accessibility TCC prompt that headed browsers do.
- Fork pull requests on a public repository should stay on GitHub-hosted runners or a dedicated untrusted pool if org policy forbids self-hosted runners on forks. This workflow does not special-case forks.

## Jobs

| Workflow | Job | Runner |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | `site` | self-hosted Mac mini |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | `deploy` | self-hosted Mac mini |
