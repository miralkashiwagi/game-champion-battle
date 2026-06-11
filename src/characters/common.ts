import type { AttackSpec } from "../shared/character-types.ts";

export const BAREHAND_COMBO: AttackSpec[] = [1, 2, 3].map((step) => ({
  id: `barehand_${step}`,
  name: `Barehand ${step}`,
  damage: 4,
  range: 58,
  startupFrames: 5,
  activeFrames: 4,
  recoveryFrames: 7,
  effect: "hitstun",
  guardPierce: false
}));
