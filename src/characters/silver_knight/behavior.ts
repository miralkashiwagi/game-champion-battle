import type { CharacterBehaviorHooks } from "../../shared/character-types.ts";

export const behavior: CharacterBehaviorHooks = {
  afterHitReceived({ attack, attacker, defender, groundY }) {
    if (defender.position.y >= groundY && attack.damage > 0) attacker.velocity.x = -attacker.facing * 7;
  }
};
