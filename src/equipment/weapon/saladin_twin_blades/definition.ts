import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "saladin_twin_blades",
  slot: "weapon",
  ui: { name: "Saladin Twin Blades", badge: "ST", accentColor: "#c84840" },
  skill: { slot: "weapon", skillId: "saladin_slash", id: "saladin_slash", motionId: "saladin_slash", name: "Slash", description: "防御不能の3連撃", damage: 6, range: 104, startupFrames: 10, activeFrames: 18, recoveryFrames: 20, effect: "hitstun", movement: 120, guardPierce: true, hitCount: 3, cooldownMs: 10000, startReady: true },
  combo: [1, 2, 3, 4].map((step) => ({ id: `saladin_combo_${step}`, motionId: `saladin_combo_${step}`, name: `Twin Slash ${step}`, damage: step === 4 ? 9 : 7, range: 74, startupFrames: step === 4 ? 10 : 8, activeFrames: 5, recoveryFrames: step === 4 ? 16 : step === 3 ? 10 : 9, effect: step === 4 ? "air" as const : "hitstun" as const, guardPierce: false, movement: step === 4 ? 26 : 14 })),
  holdAttack: { id: "saladin_charged_thrust", motionId: "saladin_charged_thrust", name: "Charged Thrust", damage: 10, range: 92, startupFrames: 24, activeFrames: 6, recoveryFrames: 20, effect: "kneel", movement: 88, guardPierce: false }
} satisfies EquipmentDefinition<"saladin_twin_blades">;
