import type { AttackSpec } from "../shared/character-types.ts";

export const BAREHAND_COMBO: AttackSpec[] = [1, 2, 3].map((step) => ({
  id: `barehand_${step}`,
  motionId: `barehand_${step}`,
  name: `Barehand ${step}`,
  damage: 4,
  range: 58,
  startupFrames: 10,
  activeFrames: 6,
  recoveryFrames: 12,
  effect: "hitstun",
  guardPierce: false
}));

export const BAREHAND_HOLD_ATTACK: AttackSpec = {
  id: "barehand_hold", motionId: "barehand_hold", name: "Heavy Punch",
  damage: 8, range: 62, startupFrames: 24, activeFrames: 6, recoveryFrames: 18,
  effect: "kneel", guardPierce: false
};
