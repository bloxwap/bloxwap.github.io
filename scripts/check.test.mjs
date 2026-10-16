// Planted-literal tests for scripts/check.mjs (bloxwap.github.io#27). Runs the real check against a copy of
// styles.css with one declaration appended, via CHECK_STYLES. Node built-ins only: npm run test:check
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const styles = readFileSync(join(root, 'styles.css'), 'utf8');

/** Runs scripts/check.mjs with `extra` appended to styles.css; returns {status, output}. */
function check(extra) {
  const dir = mkdtempSync(join(tmpdir(), 'check-'));
  try {
    const file = join(dir, 'styles.css');
    writeFileSync(file, `${styles}\n${extra}\n`);
    const run = spawnSync(process.execPath, [join(root, 'scripts/check.mjs')], {cwd: root, encoding: 'utf8', env: {...process.env, CHECK_STYLES: file}});
    return {status: run.status, output: `${run.stdout}${run.stderr}`};
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

test('the committed styles.css passes', () => {
  const {status, output} = check('');
  assert.equal(status, 0, output);
});

for (const [planted, word] of [
  ['.x{border:1px solid black}', 'black'],
  ['.x{box-shadow:0 0 0 1px black}', 'black'],
  ['.x{outline:2px dashed Red}', 'Red'],
  ['.x{background:var(--hig-surface) url("a.png") no-repeat rebeccapurple}', 'rebeccapurple'],
  ['.x{text-shadow:1px 1px 0 white, 0 0 2px var(--hig-focus)}', 'white'],
  ['.x{border-block-end:thin solid canvastext}', 'canvastext'],
  ['@media (max-width: 480px) { .x { box-shadow: inset 0 0 0 1px navy; } }', 'navy'],
]) {
  test(`fails on ${planted}`, () => {
    const {status, output} = check(planted);
    assert.equal(status, 1, output);
    assert.match(output, new RegExp(`named colour "${word}"`));
  });
}

for (const allowed of [
  '.x{border:1px solid var(--hig-border)}',
  '.x{box-shadow:0 0 0 1px currentcolor, 0 0 0 2px transparent}',
  '.x{list-style:url("/black.svg") inside}',
  '.x{font-family:"Gold Sans", var(--hig-font-sans)}',
  '.x{transition:background var(--hig-motion-duration-fast) var(--hig-motion-easing-standard)}',
]) {
  test(`allows ${allowed}`, () => {
    const {status, output} = check(allowed);
    assert.equal(status, 0, output);
  });
}

test('fails on a px lockup height', () => {
  const {status, output} = check('.brand img { height: 28px; }');
  assert.equal(status, 1, output);
  assert.match(output, /height: 28px — use a --hig-\* size \(or rem\) role/);
});
