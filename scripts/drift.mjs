// Scoped HIG anti-drift check (docs/governance/new-repository.md step 3), run from a HIG checkout
// pinned to the same commit as the vendored tarball. CI checks it out into .hig; locally this
// script clones it there on first use.
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const {commit, source} = JSON.parse(readFileSync(join(root, 'vendor/bloxwap-hig/provenance.json'), 'utf8'));
const hig = join(root, '.hig');
const git = (...args) => execFileSync('git', args, {cwd: hig, encoding: 'utf8'}).trim();
if (!existsSync(join(hig, '.git'))) {
  execFileSync('git', ['clone', '--quiet', '--filter=blob:none', '--no-checkout', source, hig], {stdio: 'inherit'});
  git('checkout', '--quiet', commit);
}
const head = git('rev-parse', 'HEAD');
if (head !== commit) { console.error(`drift: .hig is at ${head}; expected the vendored HIG commit ${commit}`); process.exit(1); }
execFileSync(process.execPath, [join(hig, 'scripts/drift.mjs'), '--root', root, '--config', join(root, 'hig-drift.json')], {stdio: 'inherit'});
