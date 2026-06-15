import { motionController } from "./motions.js";
export const visual = {
  palette: { cloth: 0x174f89, clothDark: 0x0b2d52, metal: 0x9aa7b2, metalDark: 0x35414b, plume: 0x1768b1, glow: 0x54b9ff },
  motionController,
  scriptModel: {
    proportions: { shoulderWidth: 1.08, torsoHeight: 1.02, torsoDepth: 1.08, legLength: .94, headScale: 1.02, limbWidth: 1 },
    upperArmMaterial: "metal",
    motionController
  }
};
