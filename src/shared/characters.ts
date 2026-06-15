import { CHARACTER_REGISTRY } from "../characters/registry.ts";
import { EQUIPMENT_REGISTRY, getEquipmentRegistration } from "../equipment/registry.ts";
import type { CharacterDefinition, SkillSpec } from "./character-types.ts";
import type { CharacterId, EquipmentId, EquipmentItem, EquipmentSlot } from "./types.ts";

export type { AttackSpec, CharacterDefinition, SkillSpec } from "./character-types.ts";

export const CHARACTER_SPECS = Object.fromEntries(
  Object.entries(CHARACTER_REGISTRY).map(([id, registration]) => [id, registration.definition])
) as Record<CharacterId, CharacterDefinition>;

export function createEquipment(characterId: CharacterId, ownerPlayerId: string): Record<EquipmentSlot, EquipmentItem> {
  const initial = CHARACTER_SPECS[characterId].initialEquipment;
  return Object.fromEntries((Object.entries(initial) as [EquipmentSlot, EquipmentId][]).map(([slot, equipmentId]) => {
    const registration = getEquipmentRegistration(equipmentId);
    if (registration.definition.slot !== slot) throw new Error(`Equipment ${equipmentId} cannot be assigned to ${slot}`);
    const skill = registration.definition.skill;
    return [slot, {
      id: `${ownerPlayerId}_${equipmentId}_${crypto.randomUUID()}`,
      ownerPlayerId,
      equipmentId,
      slot,
      cooldownRemainingMs: skill.startReady ? 0 : skill.cooldownMs
    }];
  })) as Record<EquipmentSlot, EquipmentItem>;
}

export function attackForEquipment(item: EquipmentItem): SkillSpec {
  return EQUIPMENT_REGISTRY[item.equipmentId].definition.skill;
}
