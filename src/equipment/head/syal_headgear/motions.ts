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
    const follow = phase.followThrough;
    visualRoot.rotation.y = strike * Math.PI * 2.3;
    visualRoot.position.y += .025 * impact;
    b.hips.rotation.y = .2 * windup - .46 * strike;
    b.hips.position.y += .02 * impact;
    b.chest.rotation.x = .06 * impact;
    b.chest.rotation.y = -.32 * windup + .66 * strike;
    b.head.rotation.y = -b.chest.rotation.y * .34;
    b.head.rotation.z = -.08 * impact;
    b.leftArm.rotation.z = -.82 - .22 * impact;
    b.rightArm.rotation.z = .88 + .16 * follow;
    b.leftLowerArm.rotation.z = -.48 - .18 * impact;
    b.rightLowerArm.rotation.z = .5 + .14 * follow;
    b.leftLeg.rotation.z = -.16;
    b.rightLeg.rotation.z = .16;
    b.leftLowerLeg.rotation.x = .24 * impact;
    b.rightLowerLeg.rotation.x = .2 * impact;
  }
} satisfies ScriptMotionController;
