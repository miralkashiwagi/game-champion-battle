import type { CharacterDefinition } from "../../shared/character-types.ts";
import { BAREHAND_COMBO } from "../common.ts";

export const definition = {
  id: "silver_knight",
  collision: { halfWidth: 48, height: 96 },
  visualProfile: { renderer: "script", scale: 1, groundOffset: 0 },
  ui: {
    name: "Silver Knight",
    type: "近距離・バランス型",
    detail: "堅実な剣技と防御を備えた、攻守の均衡に優れる騎士。",
    normal: "剣による4連撃。最終段で相手を打ち上げる。",
    badge: "SK",
    accentColor: "#328fd1"
  },
  combo: [1, 2, 3, 4].map((step) => ({
    id: `silver_combo_${step}`,
    motionId: `silver_combo_${step}`,
    name: `Silver Combo ${step}`,
    damage: 8,
    range: 78,
    startupFrames: 3,
    activeFrames: 3,
    recoveryFrames: 4,
    effect: step === 4 ? "air" as const : "hitstun" as const,
    guardPierce: false
  })),
  barehandCombo: BAREHAND_COMBO,
  holdAttack: { id: "silver_thrust", motionId: "silver_thrust", name: "Thrust", damage: 10, range: 92, startupFrames: 18, activeFrames: 5, recoveryFrames: 18, effect: "kneel", guardPierce: false },
  guardCounter: { id: "silver_guard_counter", motionId: "silver_guard_counter", name: "Guard Counter", damage: 10, range: 82, startupFrames: 1, activeFrames: 6, recoveryFrames: 6, effect: "air", guardPierce: false },
  skills: {
    cloak: { slot: "cloak", skillId: "silver_body_charge", id: "silver_body_charge", motionId: "silver_body_charge", name: "Body Charge", description: "前進しながら相手を打ち上げる", damage: 14, range: 112, startupFrames: 24, activeFrames: 12, recoveryFrames: 18, effect: "air", movement: 220, guardPierce: false, cooldownMs: 0, startReady: true },
    head: { slot: "head", skillId: "silver_headbutt", id: "silver_headbutt", motionId: "silver_headbutt", name: "Headbutt", description: "命中した相手を気絶させる", damage: 10, range: 64, startupFrames: 18, activeFrames: 4, recoveryFrames: 6, effect: "stun", guardPierce: false, cooldownMs: 5000, startReady: true },
    armor: { slot: "armor", skillId: "silver_hard_guard", id: "silver_hard_guard", motionId: "silver_hard_guard", name: "Hard Guard", description: "通常攻撃への防御を強化する", damage: 0, range: 0, startupFrames: 0, activeFrames: 0, recoveryFrames: 0, effect: "hitstun", guardPierce: false, cooldownMs: 0, startReady: true, passive: true },
    weapon: { slot: "weapon", skillId: "silver_slash", id: "silver_slash", motionId: "silver_slash", name: "Slash", description: "無敵を伴うガード貫通斬撃", damage: 18, range: 108, startupFrames: 1, activeFrames: 10, recoveryFrames: 14, effect: "air", guardPierce: true, invulnerable: true, cooldownMs: 20000, startReady: false }
  }
} satisfies CharacterDefinition<"silver_knight">;
