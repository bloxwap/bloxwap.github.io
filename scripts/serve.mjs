// Local preview of the static site, matching GitHub Pages: directory index.html, 404.html fallback.
//   node scripts/serve.mjs [--root <dir>] [--port <n>]   (PORT also works; default 3900)
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {dirname, extname, join, normalize, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const TYPES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'};

export function serve({root = join(dirname(fileURLToPath(import.meta.url)), '..'), port = 3900} = {}) {
  root = resolve(root);
  const file = async path => { try { const s = await stat(path); return s.isFile() ? path : null; } catch { return null; } };
  const server = createServer(async (req, res) => {
    let path;
    try { path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch { res.writeHead(400).end(); return; }
    const target = resolve(join(root, path));
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(400).end(); return; }
    const found = path.endsWith('/') ? await file(join(target, 'index.html')) : (await file(target)) ?? await file(join(target, 'index.html'));
    const status = found ? 200 : 404;
    const body = await readFile(found ?? join(root, '404.html'));
    res.writeHead(status, {'content-type': (found ? TYPES[extname(found)] : TYPES['.html']) ?? 'application/octet-stream', 'content-length': body.length});
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  return new Promise(done => server.listen(port, '127.0.0.1', () => done(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = name => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
  const port = Number(arg('--port') ?? process.env.PORT ?? 3900);
  await serve({root: arg('--root'), port});
  console.log(`http://localhost:${port}`);
}
