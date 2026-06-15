import { motionController } from "./motions.js";
export const visual = {
  palette: { cloth: 0x8f2928, clothDark: 0x471718, metal: 0x85898b, metalDark: 0x292e31, plume: 0xd13b34, glow: 0xff665d },
  motionController,
  scriptModel: {
    proportions: { shoulderWidth: .9, torsoHeight: 1.04, torsoDepth: .82, legLength: 1.1, headScale: .96, limbWidth: .9 },
    upperArmMaterial: "cloth",
    motionController
  }
};
