import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "saladin_armor",
  slot: "armor",
  ui: { name: "Saladin Armor", badge: "SA", accentColor: "#c84840" },
  skill: { slot: "armor", skillId: "saladin_spiral_kick", id: "saladin_spiral_kick", motionId: "saladin_spiral_kick", name: "Spiral Kick", description: "ガードを崩す回転蹴り", damage: 14, range: 74, startupFrames: 6, activeFrames: 5, recoveryFrames: 10, effect: "air", guardPierce: true, cooldownMs: 10000, startReady: true }
} satisfies EquipmentDefinition<"saladin_armor">;
