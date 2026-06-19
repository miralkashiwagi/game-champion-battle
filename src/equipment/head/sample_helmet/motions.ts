import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  syal_windwall: EQUIPMENT_VRMA_CLIPS.headbutt({ interruptibleAfter: .2, fallbackReason: VRMA_FALLBACK_REASONS.head })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    visualRoot.rotation.y = strike * Math.PI * 1.8;
    visualRoot.position.z = .04 * impact;
    b.hips.rotation.x = -.04 * windup;
    b.chest.rotation.x = -.1 * windup + .08 * impact;
    b.chest.rotation.y = .2 * windup - .38 * strike;
    b.head.rotation.x = .08 * impact;
    b.leftArm.rotation.z = -.9 - .08 * impact;
    b.rightArm.rotation.z = .9 + .08 * impact;
    b.leftLowerArm.rotation.z = -.5 - .12 * impact;
    b.rightLowerArm.rotation.z = .5 + .12 * impact;
    b.leftLeg.rotation.z = -.18;
    b.rightLeg.rotation.z = .18;
    b.leftLowerLeg.rotation.x = .14 * impact;
    b.rightLowerLeg.rotation.x = .14 * impact;
  }
} satisfies ScriptMotionController;
