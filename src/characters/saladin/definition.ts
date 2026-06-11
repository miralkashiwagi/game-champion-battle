import type { CharacterDefinition } from "../../shared/character-types.ts";
import { BAREHAND_COMBO } from "../common.ts";

export const definition = {
  id: "saladin",
  collision: { halfWidth: 39, height: 102 },
  visualProfile: { renderer: "script", scale: 1, groundOffset: 0 },
  ui: {
    name: "Saladin",
    type: "近距離・攻撃型",
    detail: "機動力と連続攻撃に優れ、素早い切り返しを得意とする戦士。",
    normal: "双剣による4連撃。前進しながら間合いを詰める。",
    badge: "SA",
    accentColor: "#c84840"
  },
  combo: [1, 2, 3, 4].map((step) => ({
    id: `saladin_combo_${step}`,
    motionId: `saladin_combo_${step}`,
    name: `Twin Slash ${step}`,
    damage: step === 4 ? 9 : 7,
    range: 74,
    startupFrames: step === 4 ? 4 : 3,
    activeFrames: 2,
    recoveryFrames: step === 4 ? 8 : step === 3 ? 4 : 3,
    effect: step === 4 ? "air" as const : "hitstun" as const,
    guardPierce: false,
    movement: step === 4 ? 26 : 14
  })),
  barehandCombo: BAREHAND_COMBO,
  holdAttack: { id: "saladin_forward_cut", motionId: "saladin_forward_cut", name: "Forward Cut", damage: 9, range: 86, startupFrames: 4, activeFrames: 6, recoveryFrames: 10, effect: "hitstun", movement: 88, guardPierce: false },
  guardCounter: { id: "saladin_guard_counter", motionId: "saladin_guard_counter", name: "Passing Counter", damage: 9, range: 88, startupFrames: 3, activeFrames: 5, recoveryFrames: 12, effect: "air", movement: 70, guardPierce: false },
  skills: {
    cloak: { slot: "cloak", skillId: "saladin_spin", id: "saladin_spin", motionId: "saladin_spin", name: "Spin Slash", description: "周囲を斬り払い相手を打ち上げる", damage: 13, range: 86, startupFrames: 12, activeFrames: 8, recoveryFrames: 12, effect: "air", guardPierce: false, cooldownMs: 5000, startReady: true },
    head: { slot: "head", skillId: "saladin_windwall", id: "saladin_windwall", motionId: "saladin_windwall", name: "Windwall", description: "被撃中にも使える緊急防御", damage: 0, range: 92, startupFrames: 1, activeFrames: 1, recoveryFrames: 8, effect: "hitstun", guardPierce: true, cooldownMs: 20000, startReady: true, usableWhileHit: true },
    armor: { slot: "armor", skillId: "saladin_spiral_kick", id: "saladin_spiral_kick", motionId: "saladin_spiral_kick", name: "Spiral Kick", description: "ガードを崩す回転蹴り", damage: 14, range: 74, startupFrames: 6, activeFrames: 5, recoveryFrames: 10, effect: "air", guardPierce: true, cooldownMs: 10000, startReady: true },
    weapon: { slot: "weapon", skillId: "saladin_lunar_slash", id: "saladin_lunar_slash", motionId: "saladin_lunar_slash", name: "Lunar Slash", description: "突進して相手を気絶させる", damage: 16, range: 104, startupFrames: 3, activeFrames: 14, recoveryFrames: 18, effect: "stun", movement: 160, guardPierce: false, cooldownMs: 10000, startReady: true }
  }
} satisfies CharacterDefinition<"saladin">;
