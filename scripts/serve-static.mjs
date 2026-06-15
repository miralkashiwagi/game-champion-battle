import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve("dist/client");
const port = Number(process.env.PORT || 8788);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".vrm": "model/gltf-binary"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://local");
    const target = resolve(join(root, url.pathname === "/" ? "index.html" : url.pathname));
    if (!target.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(target).catch(() => readFile(join(root, "index.html")));
    res.writeHead(200, { "content-type": mime[extname(target)] ?? "text/html; charset=utf-8" });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(error));
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static preview: http://127.0.0.1:${port}`);
});
