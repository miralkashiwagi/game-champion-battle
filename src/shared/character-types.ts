export type EquipmentSlot = "cloak" | "head" | "armor" | "weapon";
export type MotionId = string;
export type HumanoidBoneName = "hips" | "chest" | "head" | "leftUpperArm" | "rightUpperArm" | "leftUpperLeg" | "rightUpperLeg";
export type AttachmentSocket = "headAccessory" | "chestArmor" | "back" | "leftHandGrip" | "rightHandGrip";
type CharacterState =
  | "Idle" | "Move" | "AttackStartup" | "AttackActive" | "AttackRecovery" | "Guard"
  | "GuardCounterWindow" | "Hitstun" | "KneelDown" | "AirDamaged" | "Down" | "Stunned" | "Dead";
type Facing = -1 | 1;
interface Vec2 { x: number; y: number; }

export interface AttackSpec {
  id: string;
  motionId: MotionId;
  name: string;
  damage: number;
  range: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  effect: "hitstun" | "kneel" | "air" | "down" | "stun";
  guardPierce: boolean;
  movement?: number;
  invulnerable?: boolean;
}

export interface CharacterVisualProfile {
  renderer: "script";
  scale: number;
  groundOffset: number;
  proportions: {
    shoulderWidth: number;
    torsoHeight: number;
    torsoDepth: number;
    legLength: number;
    headScale: number;
  };
  collision: {
    halfWidth: number;
    height: number;
  };
}

export interface CharacterRig<Node = unknown> {
  getBone(name: HumanoidBoneName): Node | null;
  getSocket(name: AttachmentSocket): Node | null;
}

export interface EquipmentAttachment<Node = unknown> {
  socket: AttachmentSocket;
  object: Node;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface EquipmentVisualDefinition<Node = unknown> {
  attachments: EquipmentAttachment<Node>[];
  motions?: { equipped?: MotionId; drop?: MotionId; pickup?: MotionId };
}

export interface SkillSpec extends AttackSpec {
  slot: EquipmentSlot;
  skillId: string;
  description: string;
  cooldownMs: number;
  startReady: boolean;
  passive?: boolean;
  usableWhileHit?: boolean;
}

export interface CharacterUiDefinition {
  name: string;
  type: string;
  detail: string;
  normal: string;
  badge: string;
  accentColor: string;
}

export interface CharacterDefinition<Id extends string = string> {
  id: Id;
  visualProfile: CharacterVisualProfile;
  ui: CharacterUiDefinition;
  combo: AttackSpec[];
  barehandCombo: AttackSpec[];
  holdAttack: AttackSpec;
  guardCounter: AttackSpec;
  skills: Record<EquipmentSlot, SkillSpec>;
}

export interface CharacterBehaviorPlayer {
  state: CharacterState;
  stateTimer: number;
  velocity: Vec2;
  position: Vec2;
  facing: Facing;
  equipment: Record<EquipmentSlot, { originCharacterId: string; skillId?: string } | null>;
}

export interface SkillUseContext {
  skill: SkillSpec;
  player: CharacterBehaviorPlayer;
  opponent: CharacterBehaviorPlayer;
}

export interface HitReceivedContext {
  attack: AttackSpec;
  attacker: CharacterBehaviorPlayer;
  defender: CharacterBehaviorPlayer;
  groundY: number;
}

export interface CharacterBehaviorHooks {
  beforeSkill?: (context: SkillUseContext) => void;
  afterHitReceived?: (context: HitReceivedContext) => void;
}

export interface CharacterVisualFactory {
  palette: Record<string, number> & { glow: number };
  createEquipment: (slot: EquipmentSlot, context: unknown) => EquipmentVisualDefinition;
  createFieldItem: (slot: EquipmentSlot, context: unknown) => unknown;
}

export interface CharacterRegistration<Id extends string = string> {
  definition: CharacterDefinition<Id>;
  behavior: CharacterBehaviorHooks;
  visual: CharacterVisualFactory;
}
