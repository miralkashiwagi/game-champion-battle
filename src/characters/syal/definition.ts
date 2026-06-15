import type { CharacterDefinition } from "../../shared/character-types.ts";
import { BAREHAND_COMBO, BAREHAND_HOLD_ATTACK } from "../common.ts";

export const definition = {
  id: "syal",
  collision: { halfWidth: 39, height: 102 },
  visualProfile: { renderer: "vrm", url: "/characters/syal/syal.vrm", scale: 1.5, groundOffset: 0, fallback: "shared-script" },
  ui: { name: "Syal", type: "近距離・攻撃型", detail: "機動力と連続攻撃に優れ、素早い切り返しを得意とする戦士。", normal: "双剣による4連撃。前進しながら間合いを詰める。", badge: "SY", accentColor: "#c84840" },
  initialEquipment: { cloak: "syal_cloak", head: "sample_helmet", armor: "syal_armor", weapon: "syal_twin_blades" },
  barehandCombo: BAREHAND_COMBO,
  barehandHoldAttack: BAREHAND_HOLD_ATTACK,
  guardCounter: { id: "syal_guard_counter", motionId: "syal_guard_counter", name: "Passing Counter", damage: 9, range: 88, startupFrames: 3, activeFrames: 5, recoveryFrames: 12, effect: "air", movement: 70, guardPierce: false }
} satisfies CharacterDefinition<"syal">;
