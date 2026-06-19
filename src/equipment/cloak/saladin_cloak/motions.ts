import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  saladin_spin: EQUIPMENT_VRMA_CLIPS.slashUp({ interruptibleAfter: .48, fallbackReason: VRMA_FALLBACK_REASONS.slash })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    visualRoot.rotation.y = strike * Math.PI * 2 + follow * .22;
    visualRoot.position.z = .08 * impact;
    b.hips.rotation.y = -.24 * windup + .42 * strike;
    b.hips.position.y -= .03 * windup;
    b.chest.position.y -= .08 * windup;
    b.chest.rotation.x = -.08 * windup + .1 * follow;
    b.chest.rotation.y = .34 * windup - .52 * strike;
    b.leftArm.rotation.x = -1.05 - .18 * impact;
    b.rightArm.rotation.x = 1.05 + .12 * follow;
    b.leftArm.rotation.z = -.68 - .12 * follow;
    b.rightArm.rotation.z = .68 + .16 * impact;
    b.leftLowerArm.rotation.z = -.34 - .2 * impact;
    b.rightLowerArm.rotation.z = .34 + .16 * follow;
    b.leftLeg.rotation.x = -.16 * strike;
    b.rightLeg.rotation.x = .18 * strike;
    b.leftLowerLeg.rotation.x = .22 * impact;
    b.rightLowerLeg.rotation.x = .18 * impact;
  }
} satisfies ScriptMotionController;
