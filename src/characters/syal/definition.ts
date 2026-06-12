import type { CharacterDefinition } from "../../shared/character-types.ts";
import { BAREHAND_COMBO } from "../common.ts";

export const definition = {
  id: "syal",
  collision: { halfWidth: 39, height: 102 },
  visualProfile: { renderer: "vrm", url: "/characters/syal/syal.vrm", scale: 1.5, groundOffset: 0, fallback: "shared-script" },
  ui: {
    name: "Syal",
    type: "近距離・攻撃型",
    detail: "機動力と連続攻撃に優れ、素早い切り返しを得意とする戦士。",
    normal: "双剣による4連撃。前進しながら間合いを詰める。",
    badge: "SY",
    accentColor: "#c84840"
  },
  combo: [1, 2, 3, 4].map((step) => ({
    id: `syal_combo_${step}`,
    motionId: `syal_combo_${step}`,
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
  holdAttack: { id: "syal_forward_cut", motionId: "syal_forward_cut", name: "Forward Cut", damage: 9, range: 86, startupFrames: 4, activeFrames: 6, recoveryFrames: 10, effect: "hitstun", movement: 88, guardPierce: false },
  guardCounter: { id: "syal_guard_counter", motionId: "syal_guard_counter", name: "Passing Counter", damage: 9, range: 88, startupFrames: 3, activeFrames: 5, recoveryFrames: 12, effect: "air", movement: 70, guardPierce: false },
  skills: {
    cloak: { slot: "cloak", skillId: "syal_spin", id: "syal_spin", motionId: "syal_spin", name: "Spin Slash", description: "周囲を斬り払い相手を打ち上げる", damage: 13, range: 86, startupFrames: 12, activeFrames: 8, recoveryFrames: 12, effect: "air", guardPierce: false, cooldownMs: 5000, startReady: true },
    head: { slot: "head", skillId: "syal_windwall", id: "syal_windwall", motionId: "syal_windwall", name: "Windwall", description: "被撃中にも使える緊急防御", damage: 0, range: 92, startupFrames: 1, activeFrames: 1, recoveryFrames: 8, effect: "hitstun", guardPierce: true, cooldownMs: 20000, startReady: true, usableWhileHit: true },
    armor: { slot: "armor", skillId: "syal_spiral_kick", id: "syal_spiral_kick", motionId: "syal_spiral_kick", name: "Spiral Kick", description: "ガードを崩す回転蹴り", damage: 14, range: 74, startupFrames: 6, activeFrames: 5, recoveryFrames: 10, effect: "air", guardPierce: true, cooldownMs: 10000, startReady: true },
    weapon: { slot: "weapon", skillId: "syal_lunar_slash", id: "syal_lunar_slash", motionId: "syal_lunar_slash", name: "Lunar Slash", description: "突進して相手を気絶させる", damage: 16, range: 104, startupFrames: 3, activeFrames: 14, recoveryFrames: 18, effect: "stun", movement: 160, guardPierce: false, cooldownMs: 10000, startReady: true }
  }
} satisfies CharacterDefinition<"syal">;
