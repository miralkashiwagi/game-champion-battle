import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist/client", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await cp("public", "dist/client", { recursive: true });
await cp("src/client", "dist/client/src/client", { recursive: true });
await cp("src/shared", "dist/client/src/shared", { recursive: true });

console.log("Built static client assets in dist/client");
