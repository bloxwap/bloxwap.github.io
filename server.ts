import { join, normalize } from "node:path";

const root = import.meta.dir;

Bun.serve({
  port: 3900,
  async fetch(req) {
    const path = normalize(decodeURIComponent(new URL(req.url).pathname));
    if (path.includes("..")) return new Response(null, { status: 400 });

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
