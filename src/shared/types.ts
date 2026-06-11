export type CharacterId = "silver_knight" | "saladin";
export type PlayerSide = "p1" | "p2";
export type EquipmentSlot = "cloak" | "head" | "armor" | "weapon";
export type Facing = -1 | 1;
export type MatchPhase = "waiting" | "countdown" | "playing" | "finished";
export type CharacterState =
  | "Idle"
  | "Move"
  | "AttackStartup"
  | "AttackActive"
  | "AttackRecovery"
  | "Guard"
  | "GuardCounterWindow"
  | "Hitstun"
  | "KneelDown"
  | "AirDamaged"
  | "Down"
  | "Stunned"
  | "Dead";

export type SkillId =
  | "silver_body_charge"
  | "silver_headbutt"
  | "silver_hard_guard"
  | "silver_slash"
  | "saladin_spin"
  | "saladin_windwall"
  | "saladin_spiral_kick"
  | "saladin_lunar_slash";

export interface Vec2 {
  x: number;
  y: number;
}

export interface InputState {
  frame: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  guard: boolean;
  pickup: boolean;
  skills: Partial<Record<EquipmentSlot, boolean>>;
}

export interface ClientHello {
  type: "client.hello";
  playerId: string;
  cp: number;
  characterId: CharacterId;
}

export interface ClientInput {
  type: "client.input";
  input: InputState;
}

export interface ClientPing {
  type: "client.ping";
  now: number;
}

export type ClientMessage = ClientHello | ClientInput | ClientPing;

export interface EquipmentItem {
  id: string;
  ownerPlayerId: string;
  originCharacterId: CharacterId;
  slot: EquipmentSlot;
  skillId?: SkillId;
  normalAttackSetId?: string;
  holdAttackId?: string;
  cooldownRemainingMs: number;
  cooldownMs: number;
  guardPierce: boolean;
}

export type EquipmentSlots = Record<EquipmentSlot, EquipmentItem | null>;

export interface FieldItem {
  id: string;
  item: EquipmentItem;
  position: Vec2;
  droppedFrame: number;
  lockOwnerUntilFrame: number;
  lockOpponentUntilFrame: number;
}

export interface PlayerSnapshot {
  side: PlayerSide;
  playerId: string;
  characterId: CharacterId;
  cp: number;
  hp: number;
  position: Vec2;
  velocity: Vec2;
  facing: Facing;
  state: CharacterState;
  stateTimer: number;
  equipment: EquipmentSlots;
  equippedCount: number;
  comboStep: number;
  attackName: string | null;
  guardUntilFrame: number;
}

export interface MatchSnapshot {
  type: "server.snapshot";
  frame: number;
  phase: MatchPhase;
  timeRemainingMs: number;
  players: PlayerSnapshot[];
  fieldItems: FieldItem[];
  localSide?: PlayerSide;
  result?: MatchResult;
}

export interface MatchEvent {
  type: "server.event";
  frame: number;
  kind:
    | "joined"
    | "ready"
    | "hit"
    | "blocked"
    | "purged"
    | "pickup"
    | "swap"
    | "dead"
    | "result"
    | "info";
  message: string;
}

export interface ServerPong {
  type: "server.pong";
  now: number;
}

export interface MatchResult {
  winner: PlayerSide | "draw";
  reason: "death" | "simultaneous_death" | "timeout_hp" | "timeout_equipment" | "timeout_draw" | "disconnect";
  cpDelta: Record<PlayerSide, number>;
}

export type ServerMessage = MatchSnapshot | MatchEvent | ServerPong;

export interface JoinRequest {
  playerId: string;
  cp: number;
  characterId: CharacterId;
}

export interface Env {
  MATCH_OBJECT: DurableObjectNamespace;
  ASSETS: Fetcher;
}
