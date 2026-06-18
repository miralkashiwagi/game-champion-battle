import type * as THREE from "three";

export type EquipmentSlot = "cloak" | "head" | "armor" | "weapon";
export type MotionId = string;
export type HumanoidBoneName =
  | "hips" | "spine" | "chest" | "head"
  | "leftShoulder" | "rightShoulder"
  | "leftUpperArm" | "rightUpperArm" | "leftLowerArm" | "rightLowerArm" | "leftHand" | "rightHand"
  | "leftUpperLeg" | "rightUpperLeg" | "leftLowerLeg" | "rightLowerLeg" | "leftFoot" | "rightFoot";
export type AttachmentSocket = "headAccessory" | "chestArmor" | "back" | "leftHandGrip" | "rightHandGrip";
type CharacterState =
  | "Idle" | "Move" | "Dash" | "Jump" | "AttackStartup" | "AttackActive" | "AttackRecovery" | "Guard"
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

export interface EquipmentAttachment<Node = THREE.Object3D> {
  socket: AttachmentSocket;
  object: Node;
  model?: EquipmentModelVisual;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface EquipmentModelVisual {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface EquipmentVisualDefinition<Node = THREE.Object3D> {
  attachments: EquipmentAttachment<Node>[];
  motions?: { equipped?: MotionId; drop?: MotionId; pickup?: MotionId };
}

export interface EquipmentUiDefinition {
  name: string;
  badge: string;
  accentColor: string;
}

export interface ScriptMotionPhase {
  pose: number;
  strike: number;
}

export interface ScriptMotionBones {
  hips: THREE.Object3D;
  spine: THREE.Object3D;
  chest: THREE.Object3D;
  head: THREE.Object3D;
  leftShoulder: THREE.Object3D;
  rightShoulder: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLowerArm: THREE.Object3D;
  rightLowerArm: THREE.Object3D;
  leftHand: THREE.Object3D;
  rightHand: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftLowerLeg: THREE.Object3D;
  rightLowerLeg: THREE.Object3D;
  leftFoot: THREE.Object3D;
  rightFoot: THREE.Object3D;
}

export interface ScriptAttackMotionContext {
  id: MotionId;
  phase: ScriptMotionPhase;
  bones: ScriptMotionBones;
  visualRoot: THREE.Object3D;
}

export interface ScriptMotionController {
  stateStyle: Record<string, number>;
  applyAttack: (context: ScriptAttackMotionContext) => void;
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

export type EquipmentMaterialFactory = (
  color: number,
  roughness?: number,
  metalness?: number
) => THREE.MeshStandardMaterial;

export type EquipmentBladeFactory = (
  length: number,
  bladeColor: number,
  guardColor: number,
  curved: boolean
) => THREE.Group;

export interface EquipmentVisualContext {
  THREE: typeof THREE;
  material: EquipmentMaterialFactory;
}

export interface EquipmentAttachmentVisualContext extends EquipmentVisualContext {
  makeBlade: EquipmentBladeFactory;
}

export interface EquipmentVisualFactory {
  createAttachments: (context: EquipmentAttachmentVisualContext) => EquipmentVisualDefinition;
  createFieldItem: (context: EquipmentVisualContext) => THREE.Group;
  fieldModel?: EquipmentModelVisual;
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
