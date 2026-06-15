export type EquipmentSlot = "cloak" | "head" | "armor" | "weapon";
export type MotionId = string;
export type HumanoidBoneName =
  | "hips" | "spine" | "chest" | "head"
  | "leftShoulder" | "rightShoulder"
  | "leftUpperArm" | "rightUpperArm" | "leftLowerArm" | "rightLowerArm" | "leftHand" | "rightHand"
  | "leftUpperLeg" | "rightUpperLeg" | "leftLowerLeg" | "rightLowerLeg" | "leftFoot" | "rightFoot";
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

export interface ScriptCharacterVisualProfile {
  renderer: "script";
  scale: number;
  groundOffset: number;
}

export interface VrmCharacterVisualProfile {
  renderer: "vrm";
  url: string;
  scale: number;
  groundOffset: number;
  fallback: "shared-script";
}

export type CharacterVisualProfile = ScriptCharacterVisualProfile | VrmCharacterVisualProfile;

export interface CharacterCollisionDefinition {
  halfWidth: number;
  height: number;
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

export interface EquipmentUiDefinition {
  name: string;
  badge: string;
  accentColor: string;
}

export interface ScriptMotionController {
  stateStyle: Record<string, number>;
  applyAttack: (context: unknown) => void;
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
  collision: CharacterCollisionDefinition;
  visualProfile: CharacterVisualProfile;
  ui: CharacterUiDefinition;
  initialEquipment: Record<EquipmentSlot, string>;
  barehandCombo: AttackSpec[];
  barehandHoldAttack: AttackSpec;
  guardCounter: AttackSpec;
}

export interface CharacterBehaviorPlayer {
  state: CharacterState;
  stateTimer: number;
  velocity: Vec2;
  position: Vec2;
  facing: Facing;
  equipment: Record<EquipmentSlot, { equipmentId: string } | null>;
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
  scriptModel?: {
    proportions: {
      shoulderWidth: number;
      torsoHeight: number;
      torsoDepth: number;
      legLength: number;
      headScale: number;
      limbWidth: number;
    };
    upperArmMaterial: "cloth" | "metal";
    motionController: ScriptMotionController;
  };
  motionController: ScriptMotionController;
}

export interface EquipmentDefinition<Id extends string = string> {
  id: Id;
  slot: EquipmentSlot;
  ui: EquipmentUiDefinition;
  skill: SkillSpec;
  combo?: AttackSpec[];
  holdAttack?: AttackSpec;
}

export interface EquipmentBehaviorHooks {
  beforeSkill?: (context: SkillUseContext) => void;
  afterHitReceived?: (context: HitReceivedContext) => void;
}

export interface EquipmentVisualFactory {
  createAttachments: (context: unknown) => EquipmentVisualDefinition;
  createFieldItem: (context: unknown) => unknown;
}

export interface EquipmentRegistration<Id extends string = string> {
  definition: EquipmentDefinition<Id>;
  behavior: EquipmentBehaviorHooks;
  visual: EquipmentVisualFactory;
  motionController: ScriptMotionController;
}

export interface CharacterRegistration<Id extends string = string> {
  definition: CharacterDefinition<Id>;
  behavior: CharacterBehaviorHooks;
  visual: CharacterVisualFactory;
}
