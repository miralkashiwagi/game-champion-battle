import { motionController } from "./motions.ts";
import type { CharacterVisualFactory } from "../../shared/character-types.ts";

export const visual = {
  palette: { cloth: 0x111318, clothDark: 0x07080b, metal: 0xf2c230, metalDark: 0x2a2517, plume: 0xffd84a, glow: 0xffd84a },
  motionController
} satisfies CharacterVisualFactory;
