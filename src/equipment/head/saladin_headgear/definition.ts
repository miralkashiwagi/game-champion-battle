import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "saladin_headgear",
  slot: "head",
  ui: { name: "Saladin Headgear", badge: "SH", accentColor: "#c84840" },
  skill: { slot: "head", skillId: "saladin_windwall", id: "saladin_windwall", motionId: "saladin_windwall", name: "Windwall", description: "被撃中にも使える緊急防御", damage: 0, range: 138, startupFrames: 1, activeFrames: 1, recoveryFrames: 8, effect: "hitstun", guardPierce: true, cooldownMs: 20000, startReady: true, usableWhileHit: true }
} satisfies EquipmentDefinition<"saladin_headgear">;
