import type { EquipmentBehaviorHooks } from "../../../shared/character-types.ts";
export const behavior: EquipmentBehaviorHooks = { afterHitReceived({ attack, attacker, defender, groundY }) { if (defender.position.y >= groundY && attack.damage > 0) attacker.velocity.x = -attacker.facing * 7; } };

