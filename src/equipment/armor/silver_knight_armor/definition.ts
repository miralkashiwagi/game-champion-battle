import type { EquipmentDefinition } from "../../../shared/character-types.ts";
import { EQUIPMENT_ID } from "./id.ts";

export const definition = {
  id: EQUIPMENT_ID,
  slot: "armor",
  ui: { name: "Silver Armor", badge: "SA", accentColor: "#328fd1" },
  skill: { slot: "armor", skillId: "silver_hard_guard", id: "silver_hard_guard", motionId: "silver_hard_guard", name: "Hard Guard", description: "通常攻撃への防御を強化する", damage: 0, range: 0, startupFrames: 0, activeFrames: 0, recoveryFrames: 0, effect: "hitstun", guardPierce: false, cooldownMs: 0, startReady: true, passive: true }
} satisfies EquipmentDefinition<typeof EQUIPMENT_ID>;
