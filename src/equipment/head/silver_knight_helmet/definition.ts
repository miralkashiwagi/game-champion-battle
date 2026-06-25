import type { EquipmentDefinition } from "../../../shared/character-types.ts";
import { EQUIPMENT_ID } from "./id.ts";

export const definition = {
  id: EQUIPMENT_ID,
  slot: "head",
  ui: { name: "Silver Knight Helmet", badge: "GLB", accentColor: "#328fd1" },
  skill: { slot: "head", skillId: "silver_headbutt", id: "silver_headbutt", motionId: "silver_headbutt", name: "Headbutt", description: "命中した相手を気絶させる", damage: 10, range: 96, startupFrames: 18, activeFrames: 4, recoveryFrames: 6, effect: "stun", guardPierce: false, cooldownMs: 5000, startReady: true }
} satisfies EquipmentDefinition<typeof EQUIPMENT_ID>;
