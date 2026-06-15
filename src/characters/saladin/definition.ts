import type { CharacterDefinition } from "../../shared/character-types.ts";
import { BAREHAND_COMBO, BAREHAND_HOLD_ATTACK } from "../common.ts";

export const definition = {
  id: "saladin",
  collision: { halfWidth: 39, height: 102 },
  visualProfile: { renderer: "script", scale: 1, groundOffset: 0 },
  ui: { name: "Saladin", type: "近距離・攻撃型", detail: "機動力と連続攻撃に優れ、素早い切り返しを得意とする戦士。", normal: "双剣による4連撃。前進しながら間合いを詰める。", badge: "SA", accentColor: "#c84840" },
  initialEquipment: { cloak: "saladin_cloak", head: "saladin_headgear", armor: "saladin_armor", weapon: "saladin_twin_blades" },
  barehandCombo: BAREHAND_COMBO,
  barehandHoldAttack: BAREHAND_HOLD_ATTACK,
  guardCounter: { id: "saladin_guard_counter", motionId: "saladin_guard_counter", name: "Passing Counter", damage: 9, range: 88, startupFrames: 8, activeFrames: 6, recoveryFrames: 16, effect: "air", movement: 70, guardPierce: false }
} satisfies CharacterDefinition<"saladin">;
