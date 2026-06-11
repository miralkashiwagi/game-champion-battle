import { CHARACTER_REGISTRY } from "../characters/registry.ts";
import type { CharacterDefinition, SkillSpec } from "./character-types.ts";
import type { CharacterId, EquipmentItem, EquipmentSlot } from "./types.ts";

export type { AttackSpec, CharacterDefinition, SkillSpec } from "./character-types.ts";

export const CHARACTER_SPECS = Object.fromEntries(
  Object.entries(CHARACTER_REGISTRY).map(([id, registration]) => [id, registration.definition])
) as Record<CharacterId, CharacterDefinition>;

export function createEquipment(characterId: CharacterId, ownerPlayerId: string): Record<EquipmentSlot, EquipmentItem> {
  const spec = CHARACTER_SPECS[characterId];
  return Object.fromEntries(
    (["cloak", "head", "armor", "weapon"] as EquipmentSlot[]).map((slot) => {
      const skill = spec.skills[slot];
      const item: EquipmentItem = {
        id: `${ownerPlayerId}_${characterId}_${slot}_${crypto.randomUUID()}`,
        ownerPlayerId,
        originCharacterId: characterId,
        slot,
        skillId: skill.skillId,
        cooldownRemainingMs: skill.startReady ? 0 : skill.cooldownMs,
        cooldownMs: skill.cooldownMs,
        guardPierce: skill.guardPierce
      };
      if (slot === "weapon") {
        item.normalAttackSetId = `${characterId}_combo`;
        item.holdAttackId = `${characterId}_hold`;
      }
      return [slot, item];
    })
  ) as Record<EquipmentSlot, EquipmentItem>;
}

export function attackForEquipment(item: EquipmentItem): SkillSpec | undefined {
  if (!item.skillId) return undefined;
  return Object.values(CHARACTER_SPECS[item.originCharacterId].skills).find((skill) => skill.skillId === item.skillId);
}
