import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "silver_knight_helmet",
  slot: "head",
  ui: { name: "Silver Helmet", badge: "SH", accentColor: "#328fd1" },
  skill: { slot: "head", skillId: "silver_headbutt", id: "silver_headbutt", motionId: "silver_headbutt", name: "Headbutt", description: "命中した相手を気絶させる", damage: 10, range: 96, startupFrames: 18, activeFrames: 4, recoveryFrames: 6, effect: "stun", guardPierce: false, cooldownMs: 5000, startReady: true }
} satisfies EquipmentDefinition<"silver_knight_helmet">;
