export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;
export const MATCH_TIME_MS = 180_000;
export const INITIAL_HP = 100;
export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 540;
export const GROUND_Y = 430;
export const PLAYER_WIDTH = 44;
export const PLAYER_HEIGHT = 92;
export const MOVE_SPEED = 4.1;
export const JUMP_SPEED = -10.5;
export const GRAVITY = 0.58;
export const PICKUP_RADIUS = 58;
export const DROP_ORDER = ["cloak", "head", "armor", "weapon"] as const;
export const OWNER_PICKUP_LOCK_FRAMES = 30;
export const OPPONENT_PICKUP_LOCK_FRAMES = 15;
export const DEFAULT_INPUT = {
  frame: 0,
  left: false,
  right: false,
  up: false,
  down: false,
  attack: false,
  guard: false,
  pickup: false,
  skills: {}
};
