import type { EquipmentBehaviorHooks } from "../../../shared/character-types.ts";
export const behavior: EquipmentBehaviorHooks = { beforeSkill({ player, opponent }) { player.state = "Idle"; player.stateTimer = 0; opponent.state = "Hitstun"; opponent.stateTimer = 6; } };
