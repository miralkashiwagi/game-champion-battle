import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  saladin_spiral_kick: EQUIPMENT_VRMA_CLIPS.slashUp({ interruptibleAfter: .45, actionFrames: 21, fallbackReason: VRMA_FALLBACK_REASONS.kick })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    b.hips.position.y += .025 * impact - .04 * windup;
    b.hips.rotation.y = -.48 * windup - .64 * strike;
    b.hips.rotation.z = -.1 * impact;
    visualRoot.rotation.y = strike * 1.55;
    visualRoot.position.z = .05 * impact;
    b.chest.rotation.x = -.04 * windup + .06 * follow;
    b.chest.rotation.y = .64 * windup - 1.04 * strike;
    b.chest.rotation.z = -.1 * impact;
    b.rightLeg.rotation.x = -.46 * windup - 1.42 * strike;
    b.rightLeg.rotation.z = -.28 * windup - .78 * strike;
    b.leftLeg.rotation.x = .26 * windup + .14 * impact;
    b.leftArm.rotation.z = -.76 - .06 * follow;
    b.rightArm.rotation.z = .64 + .12 * impact;
    b.leftLowerArm.rotation.z = -.52 - .06 * follow;
    b.rightLowerArm.rotation.z = .44 + .08 * follow;
    b.rightLowerLeg.rotation.x = .38 * strike + .18 * impact;
    b.leftLowerLeg.rotation.x = .24 * impact;
    b.rightFoot.rotation.x = -.3 * strike - .1 * impact;
    b.leftFoot.rotation.x = -.08 * impact;
  }
} satisfies ScriptMotionController;
