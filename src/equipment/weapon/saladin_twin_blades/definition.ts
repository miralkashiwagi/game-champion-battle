import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "saladin_twin_blades",
  slot: "weapon",
  ui: { name: "Saladin Twin Blades", badge: "ST", accentColor: "#c84840" },
  skill: { slot: "weapon", skillId: "saladin_lunar_slash", id: "saladin_lunar_slash", motionId: "saladin_lunar_slash", name: "Lunar Slash", description: "突進して相手を気絶させる", damage: 16, range: 104, startupFrames: 3, activeFrames: 14, recoveryFrames: 18, effect: "stun", movement: 160, guardPierce: false, cooldownMs: 10000, startReady: true },
  combo: [1, 2, 3, 4].map((step) => ({ id: `saladin_combo_${step}`, motionId: `saladin_combo_${step}`, name: `Twin Slash ${step}`, damage: step === 4 ? 9 : 7, range: 74, startupFrames: step === 4 ? 4 : 3, activeFrames: 2, recoveryFrames: step === 4 ? 8 : step === 3 ? 4 : 3, effect: step === 4 ? "air" as const : "hitstun" as const, guardPierce: false, movement: step === 4 ? 26 : 14 })),
  holdAttack: { id: "saladin_forward_cut", motionId: "saladin_forward_cut", name: "Forward Cut", damage: 9, range: 86, startupFrames: 4, activeFrames: 6, recoveryFrames: 10, effect: "hitstun", movement: 88, guardPierce: false }
} satisfies EquipmentDefinition<"saladin_twin_blades">;
