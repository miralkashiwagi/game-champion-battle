import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "silver_knight_cloak",
  slot: "cloak",
  ui: { name: "Silver Cloak", badge: "SC", accentColor: "#328fd1" },
  skill: { slot: "cloak", skillId: "silver_body_charge", id: "silver_body_charge", motionId: "silver_body_charge", name: "Body Charge", description: "前進しながら相手を打ち上げる", damage: 14, range: 168, startupFrames: 24, activeFrames: 12, recoveryFrames: 18, effect: "air", movement: 220, guardPierce: false, cooldownMs: 0, startReady: true }
} satisfies EquipmentDefinition<"silver_knight_cloak">;
