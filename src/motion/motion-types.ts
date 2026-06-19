import type { MotionId } from "../shared/character-types.ts";

export type MotionLayer = "base" | "upperBody" | "additive";
export type RootMotionMode = "none" | "inPlace" | "gameplay" | "clip";

export interface CharacterMotionClip {
  url: string;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
  layer: MotionLayer;
  rootMotion?: RootMotionMode;
  lockInput?: boolean;
  lockFacing?: boolean;
  speedScaleByVelocity?: boolean;
  interruptibleAfter?: number;
  hitFrames?: [number, number] | number[];
  weight?: number;
  fallbackFor?: MotionId[];
  fallbackReason?: string;
}

export interface CharacterMotionSet {
  modelType: "vrm1";
  defaultState: string;
  clips: Record<string, CharacterMotionClip>;
  transitions?: Record<string, Record<string, number>>;
  additiveProcedural?: {
    lookAt?: boolean;
    blink?: boolean;
    breathing?: boolean;
    footLock?: boolean;
    weaponSocket?: "rightHand" | "leftHand" | "none";
  };
}
