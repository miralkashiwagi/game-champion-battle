import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  silver_hard_guard: EQUIPMENT_VRMA_CLIPS.block({ loop: true, fallbackReason: VRMA_FALLBACK_REASONS.passive })
} satisfies VrmaMotionMap;

export const motionController={stateStyle:{},applyAttack(){}} satisfies ScriptMotionController;
