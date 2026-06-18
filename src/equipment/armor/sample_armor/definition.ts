import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "sample_armor",
  slot: "armor",
  ui: { name: "Sample Armor", badge: "GLB", accentColor: "#d3ad27" },
  skill: { slot: "armor", skillId: "syal_spiral_kick", id: "syal_spiral_kick", motionId: "syal_spiral_kick", name: "Spiral Kick", description: "ガードを崩す回転蹴り", damage: 14, range: 111, startupFrames: 6, activeFrames: 5, recoveryFrames: 10, effect: "air", guardPierce: true, cooldownMs: 10000, startReady: true }
} satisfies EquipmentDefinition<"sample_armor">;
