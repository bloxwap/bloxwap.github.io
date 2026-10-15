// Static checks for the hand-written site (Node built-ins only):
//  - styles.css uses only HIG colour roles: no hex, rgb/hsl/oklch/color() literals or named colours.
//  - every same-site href/src in the HTML pages resolves to a file here or to a project site path.
//  - with --live, every project-site link (chart, hyperliquid, sfx, haptic, font) answers 200 on bloxwap.github.io.
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pages=['index.html','404.html','developers/index.html','privacy/index.html'];
const projects=/^\/(chart|hyperliquid|sfx|haptic|font)(\/|$)/;
const problems=[];

const css=readFileSync(join(root,'styles.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
for(const m of css.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(|:\s*(?:black|white|red|green|blue|gray|grey)\b/gi))problems.push(`styles.css: colour literal "${m[0]}" (use a --hig-* role)`);
for(const m of css.matchAll(/var\((--[a-z0-9-]+)/gi))if(!/^--hig-/.test(m[1])&&!new RegExp(`${m[1]}\\s*:`).test(css))problems.push(`styles.css: ${m[1]} is not defined`);

const live=new Set();
for(const page of pages){
  const html=readFileSync(join(root,page),'utf8');
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(?:https?:|mailto:|#)/.test(url))continue;
    const path=new URL(url,`https://bloxwap.github.io/${page}`).pathname;
    if(projects.test(path)){live.add(path);continue;}
    const file=join(root,decodeURIComponent(path));
    const ok=existsSync(file)&&(statSync(file).isFile()||existsSync(join(file,'index.html')));
    if(!ok)problems.push(`${page}: ${url} does not resolve to a file`);
  }
}
if(process.argv.includes('--live')){
  for(const path of [...live].sort()){
    const status=(await fetch(`https://bloxwap.github.io${path}`,{method:'HEAD'})).status;
    console.log(`${status} ${path}`);if(status!==200)problems.push(`${path}: HTTP ${status}`);
  }
}
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log(`Site check passed: ${pages.length} pages, styles.css colours are HIG roles only, ${live.size} project-site links${process.argv.includes('--live')?' answer 200':''}.`);
