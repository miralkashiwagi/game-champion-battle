import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "saladin_headgear",
  slot: "head",
  ui: { name: "Saladin Headgear", badge: "SH", accentColor: "#c84840" },
  skill: { slot: "head", skillId: "saladin_headbutt", id: "saladin_headbutt", motionId: "saladin_headbutt", name: "Headbutt", description: "命中した相手を気絶させる", damage: 10, range: 64, startupFrames: 18, activeFrames: 4, recoveryFrames: 6, effect: "stun", guardPierce: false, cooldownMs: 5000, startReady: true }
} satisfies EquipmentDefinition<"saladin_headgear">;
