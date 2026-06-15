import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "silver_knight_sword",
  slot: "weapon",
  ui: { name: "Silver Sword", badge: "SW", accentColor: "#328fd1" },
  skill: { slot: "weapon", skillId: "silver_slash", id: "silver_slash", motionId: "silver_slash", name: "Slash", description: "無敵を伴うガード貫通斬撃", damage: 18, range: 108, startupFrames: 10, activeFrames: 10, recoveryFrames: 18, effect: "air", guardPierce: true, invulnerable: true, cooldownMs: 20000, startReady: false },
  combo: [1, 2, 3, 4].map((step) => ({ id: `silver_combo_${step}`, motionId: `silver_combo_${step}`, name: `Silver Combo ${step}`, damage: 8, range: 78, startupFrames: step === 4 ? 10 : 9, activeFrames: 5, recoveryFrames: step === 4 ? 14 : 10, effect: step === 4 ? "air" as const : "hitstun" as const, guardPierce: false })),
  holdAttack: { id: "silver_thrust", motionId: "silver_thrust", name: "Thrust", damage: 10, range: 92, startupFrames: 24, activeFrames: 6, recoveryFrames: 20, effect: "kneel", guardPierce: false }
} satisfies EquipmentDefinition<"silver_knight_sword">;
