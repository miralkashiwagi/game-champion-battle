import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

await mkdir("dist/client", { recursive: true });
await rm("dist/client/src", { recursive: true, force: true });
await cp("public", "dist/client", { recursive: true });
await mkdir("dist/client/characters/syal", { recursive: true });
await cp("src/characters/syal/syal.vrm", "dist/client/characters/syal/syal.vrm");

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
