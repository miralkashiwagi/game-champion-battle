import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "silver_knight_sword",
  slot: "weapon",
  ui: { name: "Silver Sword", badge: "SW", accentColor: "#328fd1" },
  skill: { slot: "weapon", skillId: "silver_slash", id: "silver_slash", motionId: "silver_slash", name: "Slash", description: "無敵を伴うガード貫通斬撃", damage: 18, range: 108, startupFrames: 1, activeFrames: 10, recoveryFrames: 14, effect: "air", guardPierce: true, invulnerable: true, cooldownMs: 20000, startReady: false },
  combo: [1, 2, 3, 4].map((step) => ({ id: `silver_combo_${step}`, motionId: `silver_combo_${step}`, name: `Silver Combo ${step}`, damage: 8, range: 78, startupFrames: 3, activeFrames: 3, recoveryFrames: 4, effect: step === 4 ? "air" as const : "hitstun" as const, guardPierce: false })),
  holdAttack: { id: "silver_thrust", motionId: "silver_thrust", name: "Thrust", damage: 10, range: 92, startupFrames: 18, activeFrames: 5, recoveryFrames: 18, effect: "kneel", guardPierce: false }
} satisfies EquipmentDefinition<"silver_knight_sword">;
