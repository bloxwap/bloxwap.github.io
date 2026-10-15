# Vendored HIG candidate package

`bloxwap-hig-tokens-0.1.0-candidate.sha872906a9.tgz` is the unmodified `npm pack` output of the HIG release **dry run**, not a registry package. HIG has no npm release yet (bloxwap/hig#56).

- Source: [bloxwap/hig@872906a](https://github.com/bloxwap/hig/tree/872906a9071469af8714b3b6fb5cc7bd64d2d6f3) (0.1.0 candidate), recorded in `provenance.json`
- Produced with: `npm ci && npm run generate:fonts && npm run build && npm run release:dry-run -- --channel candidate`
- Only `@bloxwap/hig-tokens` is needed: this site is plain HTML and CSS and uses no HIG components.
- `SHA256SUMS` and the `package-lock.json` integrity are verified by `npm run sync:hig` and `npm run check`.

`scripts/sync-hig.mjs` copies `dist/tokens.css` and `assets/bloxwap-icon.svg` out of this package. When HIG publishes, replace the `file:` dependency with the registry version and delete this folder.
