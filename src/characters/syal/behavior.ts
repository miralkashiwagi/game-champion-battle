import type { CharacterBehaviorHooks } from "../../shared/character-types.ts";

export const behavior: CharacterBehaviorHooks = {
  beforeSkill({ skill, player, opponent }) {
    if (skill.skillId !== "syal_windwall") return;
    player.state = "Idle";
    player.stateTimer = 0;
    opponent.state = "Hitstun";
    opponent.stateTimer = 6;
  }
};
