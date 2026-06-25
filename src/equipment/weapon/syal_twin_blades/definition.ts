import type { EquipmentDefinition } from "../../../shared/character-types.ts";
import { EQUIPMENT_ID } from "./id.ts";

export const definition = {
  id: EQUIPMENT_ID,
  slot: "weapon",
  ui: { name: "Syal Twin Blades", badge: "ST", accentColor: "#d3ad27" },
  skill: { slot: "weapon", skillId: "syal_lunar_slash", id: "syal_lunar_slash", motionId: "syal_lunar_slash", name: "Lunar Slash", description: "突進して相手を気絶させる", damage: 16, range: 156, startupFrames: 10, activeFrames: 14, recoveryFrames: 20, effect: "stun", movement: 160, guardPierce: false, cooldownMs: 10000, startReady: true },
  combo: [1, 2, 3, 4].map((step) => ({ id: `syal_combo_${step}`, motionId: `syal_combo_${step}`, name: `Twin Slash ${step}`, damage: step === 4 ? 9 : 7, range: 111, startupFrames: step === 4 ? 10 : 8, activeFrames: 5, recoveryFrames: step === 4 ? 16 : step === 3 ? 10 : 9, effect: step === 4 ? "air" as const : "hitstun" as const, guardPierce: false, movement: step === 4 ? 26 : 14 })),
  holdAttack: { id: "syal_forward_cut", motionId: "syal_forward_cut", name: "Forward Cut", damage: 9, range: 129, startupFrames: 12, activeFrames: 8, recoveryFrames: 16, effect: "hitstun", movement: 88, guardPierce: false }
} satisfies EquipmentDefinition<typeof EQUIPMENT_ID>;
