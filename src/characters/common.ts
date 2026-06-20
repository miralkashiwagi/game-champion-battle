import type { AttackSpec } from "../shared/character-types.ts";

export const COMMON_BAREHAND_COMBO: AttackSpec[] = [1, 2, 3].map((step) => ({
  id: `barehand_${step}`,
  motionId: `barehand_${step}`,
  name: `Barehand ${step}`,
  damage: 4,
  range: 87,
  startupFrames: 10,
  activeFrames: 6,
  recoveryFrames: 12,
  effect: "hitstun",
  guardPierce: false
}));

export const COMMON_GUARD_COUNTER: AttackSpec = {
  id: "common_guard_counter",
  motionId: "common_guard_counter",
  name: "Guard Counter",
  damage: 9,
  range: 84,
  startupFrames: 8,
  activeFrames: 6,
  recoveryFrames: 14,
  effect: "air",
  guardPierce: false
};

export const COMMON_WAKE_UP_ATTACK: AttackSpec = {
  id: "common_wake_up_attack",
  motionId: "common_wake_up_attack",
  name: "Wake Up Attack",
  damage: 5,
  range: 78,
  startupFrames: 8,
  activeFrames: 5,
  recoveryFrames: 12,
  effect: "hitstun",
  guardPierce: false,
  invulnerable: true
};
