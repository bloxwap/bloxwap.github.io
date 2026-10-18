// Static checks for the HIG adoption (bloxwap/hig#61). Node built-ins only.
//   - styles.css takes every colour, type, space, radius and motion value from a --hig-* role
//     defined in the copied @bloxwap/hig-tokens CSS, and defines no custom properties of its own.
//   - every page loads the font, token and site stylesheets in that order, uses the approved mark
//     and lockup, has a complete OG card, and links only to files that exist (or to the SDK sites).
//   - the brand lockup is the supplied artwork, byte for byte.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const errors = [];
const error = message => errors.push(message);

// ---- styles.css -----------------------------------------------------------------------------
const tokens = read('assets/hig/tokens.css');
const roles = new Set([...tokens.matchAll(/(--hig-[\w-]+)\s*:/g)].map(m => m[1]));
// CHECK_STYLES checks another stylesheet in place of styles.css (scripts/check.test.mjs plants literals with it).
const stylesheet = process.env.CHECK_STYLES ?? join(root, 'styles.css');
const css = readFileSync(stylesheet, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

if (/#[0-9a-f]{3,8}\b/i.test(css)) error('styles.css: hex colour literal');
if (/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(css)) error('styles.css: colour function literal');
for (const [, name] of css.matchAll(/(--[\w-]+)\s*:/g)) error(`styles.css: defines ${name}; roles come from @bloxwap/hig-tokens/css`);
for (const [, name] of css.matchAll(/var\(\s*(--[\w-]+)/g)) if (!roles.has(name)) error(`styles.css: ${name} is not a role in @bloxwap/hig-tokens/css`);

const LITERAL = /(?<![\w-])-?\d*\.?\d+(?:px|rem|em|ch|pt|ms|s|%)?(?![\w-])/; // a bare number or length
const role = value => value.replace(/var\(--hig-[\w-]+\)/g, '');
// CSS Color 4 named and system colours, plus the deprecated system colours except `background` (a property name that
// transition values list). transparent and currentcolor stay allowed.
const NAMED_COLOURS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown
  burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
  darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue
  darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite
  forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey
  lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
  magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered
  orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow
  springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen
  accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext graytext highlight
  highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext
  activeborder activecaption appworkspace buttonhighlight buttonshadow captiontext inactiveborder inactivecaption
  inactivecaptiontext infobackground infotext menu menutext scrollbar threeddarkshadow threedface threedhighlight
  threedlightshadow threedshadow window windowframe windowtext`.split(/\s+/).filter(Boolean));
/** Named colour keywords in a declaration value, excluding function names, var(--hig-*), strings and url(). */
const namedColours = value => [...role(value).replace(/"[^"]*"|'[^']*'|url\([^)]*\)/gi, '').matchAll(/(?<![\w-])[a-z]+(?![\w-]|\()/gi)]
  .map(m => m[0]).filter(word => NAMED_COLOURS.has(word.toLowerCase()));
const rules = [
  // [property pattern, what must hold after removing var(--hig-*) references]
  [/^(?:color|background|background-color|border-color|outline-color|text-decoration-color|fill|stroke)$/, v => /^(?:\s|transparent|currentcolor|inherit|color-mix\(in srgb,|\d+%|,|\))*$/i.test(role(v)), 'colour'],
  [/^(?:font|font-size|line-height|font-weight|font-family)$/, v => /var\(--hig-/.test(v) && !LITERAL.test(role(v).replace(/\//g, ' ')), 'type'],
  [/^(?:margin|padding|gap|row-gap|column-gap)(?:-[\w-]+)?$/, v => role(v).split(/\s+/).every(part => ['', '0', 'auto'].includes(part)), 'space'],
  [/^border(?:-[\w-]+)?-radius$/, v => role(v).trim() === '', 'radius'],
  [/^(?:transition|transition-duration|animation-duration)$/, v => !/\d(?:ms|s)\b/.test(role(v)), 'motion'],
  // Heights scale with root text (the lockup at 200% text, bloxwap.github.io#27): rem, a role or a viewport unit, never px.
  [/^(?:height|min-height|max-height|block-size|min-block-size|max-block-size)$/, v => !/\dpx\b/.test(role(v)), 'size (or rem)'],
];
for (const [, body] of css.matchAll(/\{([^{}]*)\}/g)) {
  for (const decl of body.split(';')) {
    const at = decl.indexOf(':');
    if (at < 0) continue;
    const property = decl.slice(0, at).trim(), value = decl.slice(at + 1).trim();
    for (const word of namedColours(value)) error(`styles.css: ${property}: ${value} — named colour "${word}"; use a --hig-* colour role`);
    for (const [pattern, ok, kind] of rules) if (pattern.test(property) && !ok(value)) error(`styles.css: ${property}: ${value} — use a --hig-* ${kind} role`);
  }
}

// ---- pages --------------------------------------------------------------------------------------
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {cwd: root, encoding: 'utf8'}).split('\n').filter(Boolean);
const pages = tracked.filter(path => path.endsWith('.html') && !path.startsWith('node_modules/') && !path.startsWith('scripts/') && !path.startsWith('tests/'));
const SDK_SITES = ['/chart/', '/hyperliquid/', '/sfx/', '/haptic/', '/font/']; // separate Pages repositories on this origin
const STYLESHEETS = ['/assets/font/bloxwap-font.css', '/assets/hig/tokens.css', '/styles.css'];
const exists = path => { const target = join(root, path); return existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html'))); };

for (const page of pages) {
  const html = read(page);
  const sheets = [...html.matchAll(/<link rel="stylesheet" href="([^"?#]+)/g)].map(m => m[1]);
  if (JSON.stringify(sheets) !== JSON.stringify(STYLESHEETS)) error(`${page}: stylesheets must be ${STYLESHEETS.join(', ')} in that order (found ${sheets.join(', ') || 'none'})`);
  if (!html.includes('<link rel="preload" href="/assets/font/BloxwapSans-Variable.woff2" as="font" type="font/woff2" crossorigin />')) error(`${page}: preload the Bloxwap Sans face`);
  if (/<style[\s>]|\sstyle="/i.test(html)) error(`${page}: inline styles bypass the HIG roles`);
  if (!html.includes('<link rel="icon" href="/icon.svg" type="image/svg+xml" />')) error(`${page}: favicon must be the approved mark /icon.svg`);
  for (const [, src] of html.matchAll(/<img [^>]*src="([^"]+)"/g)) if (src.split('?')[0] !== '/lockup.svg') error(`${page}: unexpected brand image ${src}`);
  if (page !== '404.html') {
    for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) if (!html.includes(`<meta property="${tag}" `)) error(`${page}: missing ${tag}`);
    if (!html.includes('<meta property="og:image" content="https://bloxwap.github.io/og/home.png" />')) error(`${page}: og:image must be the site card https://bloxwap.github.io/og/home.png`);
    if (!html.includes('<meta name="twitter:card" content="summary_large_image" />')) error(`${page}: missing twitter:card`);
  }
  for (const [, url] of html.matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
    if (SDK_SITES.some(prefix => url.startsWith(prefix))) continue;
    if (!exists(url)) error(`${page}: ${url} does not exist in this repository`);
  }
}
for (const [page, required] of [['index.html', SDK_SITES], ['developers/index.html', SDK_SITES]]) {
  const html = read(page);
  for (const site of required) if (!html.includes(`href="${site}`)) error(`${page}: no link to the ${site} SDK docs site`);
}

// ---- brand and OG assets --------------------------------------------------------------------
// Supplied lockup artwork, verbatim from bloxwap/font apps/docs/public/logos/bloxwap-lockup.svg at
// 40f2d08998e61362ed7f5198f6d51b5f3987e572 (the Font docs source HIG copies its approved mark from).
// HIG ships only the mark (@bloxwap/hig-tokens/mark.svg, copied to /icon.svg by sync-hig).
const LOCKUP_SHA256 = '7073de7703f5d5e02cd9903927d855733419ec5f661493e1d6f59a043c3890c3';
if (createHash('sha256').update(readFileSync(join(root, 'lockup.svg'))).digest('hex') !== LOCKUP_SHA256) error('lockup.svg differs from the supplied Bloxwap lockup');
const png = readFileSync(join(root, 'og/home.png'));
if (png.toString('latin1', 1, 4) !== 'PNG' || png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) error('og/home.png must be a 1200x630 PNG');

if (errors.length) { console.error(`check: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`); process.exit(1); }
console.log(`check: styles.css uses ${new Set([...css.matchAll(/var\((--hig-[\w-]+)/g)].map(m => m[1])).size} HIG roles and no literals; ${pages.length} pages, brand assets and OG card verified`);
