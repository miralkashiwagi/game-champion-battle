import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "sample_helmet",
  slot: "head",
  ui: { name: "Sample Helmet", badge: "GLB", accentColor: "#d3ad27" },
  skill: { slot: "head", skillId: "syal_windwall", id: "syal_windwall", motionId: "syal_windwall", name: "Windwall", description: "被撃中にも使える緊急防御", damage: 0, range: 138, startupFrames: 1, activeFrames: 1, recoveryFrames: 8, effect: "hitstun", guardPierce: true, cooldownMs: 20000, startReady: true, usableWhileHit: true }
} satisfies EquipmentDefinition<"sample_helmet">;
