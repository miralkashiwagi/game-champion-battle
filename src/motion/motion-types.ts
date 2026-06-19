import type { VrmaMotionClipDefinition, VrmaMotionLayer, VrmaRootMotionMode } from "../shared/character-types.ts";

export type MotionLayer = VrmaMotionLayer;
export type RootMotionMode = VrmaRootMotionMode;
export type CharacterMotionClip = VrmaMotionClipDefinition;

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
