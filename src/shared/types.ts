import type { RegisteredCharacterId } from "../characters/registry.ts";
import type { EquipmentSlot as CharacterEquipmentSlot } from "./character-types.ts";

export type CharacterId = RegisteredCharacterId;
export type PlayerSide = "p1" | "p2";
export type EquipmentSlot = CharacterEquipmentSlot;
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

export type SkillId = string;

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

export interface ClientRematch {
  type: "client.rematch";
}

export interface ClientLeave {
  type: "client.leave";
}

export type ClientMessage = ClientHello | ClientInput | ClientPing | ClientRematch | ClientLeave;

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
  activeActionId: string | null;
  actionStartedFrame: number | null;
  guardUntilFrame: number;
}

export interface MatchSnapshot {
  type: "server.snapshot";
  frame: number;
  phase: MatchPhase;
  timeRemainingMs: number;
  players: PlayerSnapshot[];
  fieldItems: FieldItem[];
  matchId?: string;
  roundId?: number;
  localSide?: PlayerSide;
  result?: MatchResult;
}

export interface MatchFoundMessage {
  type: "server.match_found";
  matchId: string;
  wsPath: string;
}

export interface MatchSearchMessage {
  type: "server.match_search";
  minCp: number;
  maxCp: number;
  waitedMs: number;
}

export interface RematchStatusMessage {
  type: "server.rematch_status";
  deadline: number;
  requestedPlayerIds: string[];
}

export interface RematchUnavailableMessage {
  type: "server.rematch_unavailable";
  message: string;
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

export type ServerMessage =
  | MatchSnapshot
  | MatchEvent
  | ServerPong
  | MatchFoundMessage
  | MatchSearchMessage
  | RematchStatusMessage
  | RematchUnavailableMessage;

export interface MatchPlayer {
  playerId: string;
  cp: number;
  characterId: CharacterId;
}

export interface JoinRequest {
  playerId: string;
  cp: number;
  characterId: CharacterId;
}

export interface Env {
  MATCH_OBJECT: DurableObjectNamespace;
  MATCHMAKER_OBJECT: DurableObjectNamespace;
  ASSETS: Fetcher;
}
