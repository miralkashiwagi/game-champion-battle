import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMAnimationLoaderPlugin } from "@pixiv/three-vrm-animation";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const assets = [
  "public/assets/motions/air/jump-end.vrma",
  "public/assets/motions/air/jump-loop.vrma",
  "public/assets/motions/air/jump-start.vrma",
  "public/assets/motions/combat/block.vrma",
  "public/assets/motions/combat/headbutt.vrma",
  "public/assets/motions/combat/punch-01.vrma",
  "public/assets/motions/combat/punch-02.vrma",
  "public/assets/motions/combat/punch-03.vrma",
  "public/assets/motions/combat/slash-to-left.vrma",
  "public/assets/motions/combat/slash-to-right.vrma",
  "public/assets/motions/combat/slash-up.vrma",
  "public/assets/motions/common/idle.vrma",
  "public/assets/motions/common/run.vrma",
  "public/assets/motions/common/turn.vrma",
  "public/assets/motions/common/walk.vrma",
  "public/assets/motions/reaction/crumple-stun.vrma",
  "public/assets/motions/reaction/dizzy.vrma",
  "public/assets/motions/reaction/get-up.vrma",
  "public/assets/motions/reaction/hit.vrma",
  "public/assets/motions/reaction/knockdown.vrma"
];

const idealMissing = [
  "common/walk-backward.vrma",
  "common/strafe-left.vrma",
  "common/strafe-right.vrma",
  "combat/thrust.vrma",
  "reaction/death.vrma"
];

let failed = false;

for (const asset of assets) {
  const absolute = join(root, asset);
  try {
    const data = await readFile(absolute);
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const gltf = await loader.parseAsync(buffer, `${dirname(absolute)}/`);
    const animation = gltf.userData.vrmAnimations?.[0];
    if (!animation) {
      console.error(`[VRMA] Missing VRMAnimation: ${asset}`);
      failed = true;
      continue;
    }
    if (!(animation.duration > 0)) {
      console.error(`[VRMA] Zero duration: ${asset}`);
      failed = true;
    }
    const translations = [...animation.humanoidTracks.translation.keys()];
    const nonHipsTranslations = translations.filter((name) => name !== "hips");
    if (nonHipsTranslations.length > 0) {
      console.warn(`[VRMA] Non-hips translation tracks in ${asset}: ${nonHipsTranslations.join(", ")}`);
    }
    console.log(`[VRMA] OK ${asset} (${animation.duration.toFixed(3)}s)`);
  } catch (error) {
    console.error(`[VRMA] Failed ${asset}`, error);
    failed = true;
  }
}

for (const missing of idealMissing) {
  console.warn(`[VRMA] Optional ideal clip is not present yet: public/assets/motions/${missing}`);
}

if (failed) process.exitCode = 1;
