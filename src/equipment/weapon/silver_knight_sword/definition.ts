import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "silver_knight_sword",
  slot: "weapon",
  ui: { name: "Silver Sword", badge: "SW", accentColor: "#328fd1" },
  skill: { slot: "weapon", skillId: "silver_slash", id: "silver_slash", motionId: "silver_slash", name: "Slash", description: "防御不能の3連撃", damage: 6, range: 104, startupFrames: 10, activeFrames: 18, recoveryFrames: 20, effect: "hitstun", movement: 120, guardPierce: true, hitCount: 3, cooldownMs: 10000, startReady: true },
  combo: [1, 2, 3, 4].map((step) => ({ id: `silver_combo_${step}`, motionId: `silver_combo_${step}`, name: `Silver Combo ${step}`, damage: 8, range: 78, startupFrames: step === 4 ? 10 : 9, activeFrames: 5, recoveryFrames: step === 4 ? 14 : 10, effect: step === 4 ? "air" as const : "hitstun" as const, guardPierce: false })),
  holdAttack: { id: "silver_thrust", motionId: "silver_thrust", name: "Charged Thrust", damage: 10, range: 92, startupFrames: 24, activeFrames: 6, recoveryFrames: 20, effect: "kneel", guardPierce: false }
} satisfies EquipmentDefinition<"silver_knight_sword">;
