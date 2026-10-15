import { join, normalize } from "node:path";

const root = import.meta.dir;
// Project sites (chart, hyperliquid, sfx, haptic, font) deploy from their own repositories. Local preview
// fetches them from the live origin so cards and the Bloxwap Font stylesheet (/font/bloxwap-font.css) work.
const projects = /^\/(chart|hyperliquid|sfx|haptic|font)(\/|$)/;
const origin = "https://bloxwap.github.io";

Bun.serve({
  port: 3900,
  async fetch(req) {
    const url = new URL(req.url);
    const path = normalize(decodeURIComponent(url.pathname));
    if (path.includes("..")) return new Response(null, { status: 400 });
    if (projects.test(path)) {
      // fetch() decodes the body, so pass on only the status and content type, not content-encoding.
      const upstream = await fetch(origin + url.pathname + url.search);
      const type = upstream.headers.get("content-type") ?? "application/octet-stream";
      return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: { "content-type": type } });
    }

    const candidates = path.endsWith("/")
      ? [path + "index.html"]
      : [path, path + "/index.html"];

    for (const candidate of candidates) {
      const file = Bun.file(join(root, candidate));
      if (await file.exists()) return new Response(file);
    }
    return new Response(Bun.file(join(root, "404.html")), { status: 404 });
  },
});

console.log("http://localhost:3900");
