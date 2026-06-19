import { build } from "esbuild";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import { extname } from "node:path";

await mkdir("dist/client", { recursive: true });
await rm("dist/client/src", { recursive: true, force: true });
await cp("public", "dist/client", { recursive: true });
await mkdir("dist/client/characters/silver_knight", { recursive: true });
await cp("src/characters/silver_knight/silver_knight.vrm", "dist/client/characters/silver_knight/silver_knight.vrm");
await mkdir("dist/client/characters/syal", { recursive: true });
await cp("src/characters/syal/syal.vrm", "dist/client/characters/syal/syal.vrm");
await mkdir("dist/client/characters/saladin", { recursive: true });
await cp("src/characters/saladin/saladin.vrm", "dist/client/characters/saladin/saladin.vrm");
await cp("src/equipment", "dist/client/equipment", {
  recursive: true,
  filter: async (source) => (await stat(source)).isDirectory() || extname(source) === ".glb"
});

await build({
  entryPoints: ["src/client/app.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "dist/client/app.js",
  minify: false,
  sourcemap: true
});

console.log("Built Three.js client assets in dist/client");
