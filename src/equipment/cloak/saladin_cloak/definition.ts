import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "saladin_cloak",
  slot: "cloak",
  ui: { name: "Saladin Cloak", badge: "SC", accentColor: "#c84840" },
  skill: { slot: "cloak", skillId: "saladin_spin", id: "saladin_spin", motionId: "saladin_spin", name: "Spin Slash", description: "周囲を斬り払い相手を打ち上げる", damage: 13, range: 86, startupFrames: 12, activeFrames: 8, recoveryFrames: 12, effect: "air", guardPierce: false, cooldownMs: 5000, startReady: true }
} satisfies EquipmentDefinition<"saladin_cloak">;
