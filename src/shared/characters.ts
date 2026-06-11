import type { CharacterId, EquipmentItem, EquipmentSlot, SkillId } from "./types.ts";

export interface AttackSpec {
  id: string;
  name: string;
  damage: number;
  range: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  effect: "hitstun" | "kneel" | "air" | "down" | "stun";
  guardPierce: boolean;
  movement?: number;
  invulnerable?: boolean;
}

export interface SkillSpec extends AttackSpec {
  slot: EquipmentSlot;
  skillId: SkillId;
  cooldownMs: number;
  startReady: boolean;
  passive?: boolean;
  usableWhileHit?: boolean;
}

export interface CharacterSpec {
  id: CharacterId;
  name: string;
  type: string;
  color: string;
  detail: string;
  combo: AttackSpec[];
  barehandCombo: AttackSpec[];
  holdAttack: AttackSpec;
  guardCounter: AttackSpec;
  skills: Record<EquipmentSlot, SkillSpec>;
}

const barehandCombo: AttackSpec[] = [1, 2, 3].map((step) => ({
  id: `barehand_${step}`,
  name: `Barehand ${step}`,
  damage: 4,
  range: 58,
  startupFrames: 5,
  activeFrames: 4,
  recoveryFrames: 7,
  effect: step === 3 ? "hitstun" : "hitstun",
  guardPierce: false
}));

export const CHARACTER_SPECS: Record<CharacterId, CharacterSpec> = {
  silver_knight: {
    id: "silver_knight",
    name: "Silver Knight",
    type: "近距離・バランス型",
    color: "#d8dde7",
    detail: "素直な通常攻撃、防御、浮かせ始動を持つ標準キャラクター。",
    combo: [1, 2, 3, 4].map((step) => ({
      id: `silver_combo_${step}`,
      name: `Silver Combo ${step}`,
      damage: 8,
      range: 78,
      startupFrames: 3,
      activeFrames: 3,
      recoveryFrames: 4,
      effect: step === 4 ? "air" : "hitstun",
      guardPierce: false
    })),
    barehandCombo,
    holdAttack: {
      id: "silver_thrust",
      name: "Thrust",
      damage: 10,
      range: 92,
      startupFrames: 18,
      activeFrames: 5,
      recoveryFrames: 18,
      effect: "kneel",
      guardPierce: false
    },
    guardCounter: {
      id: "silver_guard_counter",
      name: "Guard Counter",
      damage: 10,
      range: 82,
      startupFrames: 1,
      activeFrames: 6,
      recoveryFrames: 6,
      effect: "air",
      guardPierce: false
    },
    skills: {
      cloak: {
        slot: "cloak",
        skillId: "silver_body_charge",
        id: "silver_body_charge",
        name: "Body Charge",
        damage: 14,
        range: 112,
        startupFrames: 24,
        activeFrames: 12,
        recoveryFrames: 18,
        effect: "air",
        movement: 220,
        guardPierce: false,
        cooldownMs: 0,
        startReady: true
      },
      head: {
        slot: "head",
        skillId: "silver_headbutt",
        id: "silver_headbutt",
        name: "Headbutt",
        damage: 10,
        range: 64,
        startupFrames: 18,
        activeFrames: 4,
        recoveryFrames: 6,
        effect: "stun",
        guardPierce: false,
        cooldownMs: 5000,
        startReady: true
      },
      armor: {
        slot: "armor",
        skillId: "silver_hard_guard",
        id: "silver_hard_guard",
        name: "Hard Guard",
        damage: 0,
        range: 0,
        startupFrames: 0,
        activeFrames: 0,
        recoveryFrames: 0,
        effect: "hitstun",
        guardPierce: false,
        cooldownMs: 0,
        startReady: true,
        passive: true
      },
      weapon: {
        slot: "weapon",
        skillId: "silver_slash",
        id: "silver_slash",
        name: "Slash",
        damage: 18,
        range: 108,
        startupFrames: 1,
        activeFrames: 10,
        recoveryFrames: 14,
        effect: "air",
        guardPierce: true,
        invulnerable: true,
        cooldownMs: 20000,
        startReady: false
      }
    }
  },
  saladin: {
    id: "saladin",
    name: "Saladin",
    type: "近距離・攻撃型",
    color: "#d4b36a",
    detail: "機動力と切り返しに優れ、スワップ時にも扱いやすい攻撃型。",
    combo: [1, 2, 3, 4].map((step) => ({
      id: `saladin_combo_${step}`,
      name: `Twin Slash ${step}`,
      damage: step === 4 ? 9 : 7,
      range: 74,
      startupFrames: step === 4 ? 4 : 3,
      activeFrames: 2,
      recoveryFrames: step === 4 ? 8 : step === 3 ? 4 : 3,
      effect: step === 4 ? "air" : "hitstun",
      guardPierce: false,
      movement: step === 4 ? 26 : 14
    })),
    barehandCombo,
    holdAttack: {
      id: "saladin_forward_cut",
      name: "Forward Cut",
      damage: 9,
      range: 86,
      startupFrames: 4,
      activeFrames: 6,
      recoveryFrames: 10,
      effect: "hitstun",
      movement: 88,
      guardPierce: false
    },
    guardCounter: {
      id: "saladin_guard_counter",
      name: "Passing Counter",
      damage: 9,
      range: 88,
      startupFrames: 3,
      activeFrames: 5,
      recoveryFrames: 12,
      effect: "air",
      movement: 70,
      guardPierce: false
    },
    skills: {
      cloak: {
        slot: "cloak",
        skillId: "saladin_spin",
        id: "saladin_spin",
        name: "Spin Slash",
        damage: 13,
        range: 86,
        startupFrames: 12,
        activeFrames: 8,
        recoveryFrames: 12,
        effect: "air",
        guardPierce: false,
        cooldownMs: 5000,
        startReady: true
      },
      head: {
        slot: "head",
        skillId: "saladin_windwall",
        id: "saladin_windwall",
        name: "Windwall",
        damage: 0,
        range: 92,
        startupFrames: 1,
        activeFrames: 1,
        recoveryFrames: 8,
        effect: "hitstun",
        guardPierce: true,
        cooldownMs: 20000,
        startReady: true,
        usableWhileHit: true
      },
      armor: {
        slot: "armor",
        skillId: "saladin_spiral_kick",
        id: "saladin_spiral_kick",
        name: "Spiral Kick",
        damage: 14,
        range: 74,
        startupFrames: 6,
        activeFrames: 5,
        recoveryFrames: 10,
        effect: "air",
        guardPierce: true,
        cooldownMs: 10000,
        startReady: true
      },
      weapon: {
        slot: "weapon",
        skillId: "saladin_lunar_slash",
        id: "saladin_lunar_slash",
        name: "Lunar Slash",
        damage: 16,
        range: 104,
        startupFrames: 3,
        activeFrames: 14,
        recoveryFrames: 18,
        effect: "stun",
        movement: 160,
        guardPierce: false,
        cooldownMs: 10000,
        startReady: true
      }
    }
  }
};

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

export function attackForEquipment(item: EquipmentItem): AttackSpec | undefined {
  const spec = CHARACTER_SPECS[item.originCharacterId];
  if (!item.skillId) return undefined;
  return Object.values(spec.skills).find((skill) => skill.skillId === item.skillId);
}
