import { motionController } from "./motions.ts";
import type { CharacterVisualFactory } from "../../shared/character-types.ts";

export const visual = {
  palette: { cloth: 0x174f89, clothDark: 0x0b2d52, metal: 0x9aa7b2, metalDark: 0x35414b, plume: 0x1768b1, glow: 0x54b9ff },
  motionController
} satisfies CharacterVisualFactory;
