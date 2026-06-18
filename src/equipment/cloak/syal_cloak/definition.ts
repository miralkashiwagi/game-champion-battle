import type { EquipmentDefinition } from "../../../shared/character-types.ts";

export const definition = {
  id: "syal_cloak",
  slot: "cloak",
  ui: { name: "Syal Cloak", badge: "SC", accentColor: "#d3ad27" },
  skill: { slot: "cloak", skillId: "syal_spin", id: "syal_spin", motionId: "syal_spin", name: "Spin Slash", description: "周囲を斬り払い相手を打ち上げる", damage: 13, range: 129, startupFrames: 12, activeFrames: 8, recoveryFrames: 12, effect: "air", guardPierce: false, cooldownMs: 5000, startReady: true }
} satisfies EquipmentDefinition<"syal_cloak">;
