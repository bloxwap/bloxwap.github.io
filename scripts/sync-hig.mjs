// Copies the HIG token stylesheet into assets/hig/ from a pinned HIG source, checked against hig.lock.json.
//
//   node scripts/sync-hig.mjs --hig <bloxwap/hig checkout at the locked commit>   # write
//   node scripts/sync-hig.mjs --tarball <bloxwap-hig-tokens-*.tgz>                # write from the packed candidate
//   node scripts/sync-hig.mjs --hig .hig --check                                  # CI: committed copy must match
//
// This site has no build step, so the copy is committed. Never edit assets/hig/ by hand: change the lock
// (commit, tarball hash, file hash) and re-run this script. Node built-ins only.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(readFileSync(join(root,'hig.lock.json'),'utf8'));
const argv=process.argv.slice(2);
const arg=name=>{const i=argv.indexOf(name);return i>=0?argv[i+1]:undefined;};
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{console.error(message);process.exit(1);};

function readSource(file){
  const hig=arg('--hig'),tarball=arg('--tarball');
  if(tarball){
    const bytes=readFileSync(tarball);
    if(sha256(bytes)!==lock.tarball.sha256)fail(`${tarball}: sha256 ${sha256(bytes)} does not match hig.lock.json tarball.sha256 ${lock.tarball.sha256}`);
    return execFileSync('tar',['-xOzf',tarball,file.tarballPath]);
  }
  if(hig){
    const head=execFileSync('git',['-C',hig,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    if(head!==lock.commit)fail(`${hig} is at ${head}; hig.lock.json pins ${lock.commit}`);
    return readFileSync(join(hig,file.source));
  }
  fail('Pass --hig <checkout> or --tarball <tgz>.');
}

const header=file=>`/* @bloxwap/hig-tokens ${lock.version} (${file.tarballPath}), bloxwap/hig@${lock.commit}.\n   Copied by scripts/sync-hig.mjs and checked in CI against hig.lock.json. Do not edit. */\n`;
let stale=0;
for(const [target,file] of Object.entries(lock.files)){
  const source=readSource(file);
  if(sha256(source)!==file.sha256)fail(`${file.source}: sha256 ${sha256(source)} does not match hig.lock.json (${file.sha256})`);
  const expected=header(file)+source.toString('utf8'),path=join(root,target);
  if(argv.includes('--check')){
    if(!existsSync(path)||readFileSync(path,'utf8')!==expected){console.error(`${target} is stale or edited; run node scripts/sync-hig.mjs --hig <checkout>`);stale++;}
    else console.log(`${target}: matches ${lock.version} (sha256 ${file.sha256})`);
  }else{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,expected);console.log(`${target}: written from ${lock.version}`);}
}
if(stale)process.exit(1);
