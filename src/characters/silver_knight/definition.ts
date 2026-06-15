import type { CharacterDefinition } from "../../shared/character-types.ts";
import { BAREHAND_COMBO, BAREHAND_HOLD_ATTACK } from "../common.ts";

export const definition = {
  id: "silver_knight",
  collision: { halfWidth: 48, height: 96 },
  visualProfile: { renderer: "script", scale: 1, groundOffset: 0 },
  ui: { name: "Silver Knight", type: "近距離・バランス型", detail: "堅実な剣技と防御を備えた、攻守の均衡に優れる騎士。", normal: "剣による4連撃。最終段で相手を打ち上げる。", badge: "SK", accentColor: "#328fd1" },
  initialEquipment: { cloak: "silver_knight_cloak", head: "silver_knight_helmet", armor: "silver_knight_armor", weapon: "silver_knight_sword" },
  barehandCombo: BAREHAND_COMBO,
  barehandHoldAttack: BAREHAND_HOLD_ATTACK,
  guardCounter: { id: "silver_guard_counter", motionId: "silver_guard_counter", name: "Guard Counter", damage: 10, range: 82, startupFrames: 1, activeFrames: 6, recoveryFrames: 6, effect: "air", guardPierce: false }
} satisfies CharacterDefinition<"silver_knight">;
