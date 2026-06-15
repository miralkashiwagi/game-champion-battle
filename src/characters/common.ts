import type { AttackSpec } from "../shared/character-types.ts";

export const BAREHAND_COMBO: AttackSpec[] = [1, 2, 3].map((step) => ({
  id: `barehand_${step}`,
  motionId: `barehand_${step}`,
  name: `Barehand ${step}`,
  damage: 4,
  range: 58,
  startupFrames: 5,
  activeFrames: 4,
  recoveryFrames: 7,
  effect: "hitstun",
  guardPierce: false
}));

export const BAREHAND_HOLD_ATTACK: AttackSpec = {
  id: "barehand_hold", motionId: "barehand_hold", name: "Heavy Punch",
  damage: 8, range: 62, startupFrames: 18, activeFrames: 4, recoveryFrames: 14,
  effect: "kneel", guardPierce: false
};
