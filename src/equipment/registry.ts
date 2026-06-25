import { registration as silverKnightCloak } from "./cloak/silver_knight_cloak/index.ts";
import { registration as saladinCloak } from "./cloak/saladin_cloak/index.ts";
import { registration as syalCloak } from "./cloak/syal_cloak/index.ts";
import { registration as silverKnightHelmet } from "./head/silver_knight_helmet/index.ts";
import { registration as oldSilverKnightHelmet } from "./head/old_silver_knight_helmet/index.ts";
import { registration as saladinHeadgear } from "./head/saladin_headgear/index.ts";
import { registration as syalHeadgear } from "./head/syal_headgear/index.ts";
import { registration as silverKnightArmor } from "./armor/silver_knight_armor/index.ts";
import { registration as saladinArmor } from "./armor/saladin_armor/index.ts";
import { registration as syalArmor } from "./armor/syal_armor/index.ts";
import { registration as sampleArmor } from "./armor/sample_armor/index.ts";
import { registration as silverKnightSword } from "./weapon/silver_knight_sword/index.ts";
import { registration as saladinTwinBlades } from "./weapon/saladin_twin_blades/index.ts";
import { registration as syalTwinBlades } from "./weapon/syal_twin_blades/index.ts";
import type { EquipmentRegistration } from "../shared/character-types.ts";

const registrations = {
  silver_knight_cloak: silverKnightCloak, silver_knight_helmet: silverKnightHelmet, old_silver_knight_helmet: oldSilverKnightHelmet,
  silver_knight_armor: silverKnightArmor, silver_knight_sword: silverKnightSword,
  saladin_cloak: saladinCloak, saladin_headgear: saladinHeadgear,
  saladin_armor: saladinArmor, saladin_twin_blades: saladinTwinBlades,
  syal_cloak: syalCloak, syal_headgear: syalHeadgear,
  syal_armor: syalArmor, sample_armor: sampleArmor, syal_twin_blades: syalTwinBlades
} as const;

export type RegisteredEquipmentId = keyof typeof registrations;
export const EQUIPMENT_REGISTRY: Record<RegisteredEquipmentId, EquipmentRegistration> = registrations;
export const EQUIPMENT_IDS = Object.keys(EQUIPMENT_REGISTRY) as RegisteredEquipmentId[];
export const EQUIPMENT_LIST = EQUIPMENT_IDS.map((id) => EQUIPMENT_REGISTRY[id]);

export function getEquipmentRegistration(id: RegisteredEquipmentId): EquipmentRegistration {
  const registration = EQUIPMENT_REGISTRY[id];
  if (!registration) throw new Error(`Unknown equipmentId: ${id}`);
  return registration;
}
