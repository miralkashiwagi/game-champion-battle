import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  syal_spiral_kick: EQUIPMENT_VRMA_CLIPS.slashUp({ interruptibleAfter: .45, actionFrames: 21, fallbackReason: VRMA_FALLBACK_REASONS.kick })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    b.hips.position.y += .04 * impact - .03 * windup;
    b.hips.rotation.y = -.36 * windup - .72 * strike;
    b.hips.rotation.z = -.16 * impact;
    visualRoot.rotation.y = strike * 1.75;
    visualRoot.position.y += .035 * impact;
    b.chest.rotation.x = .08 * impact;
    b.chest.rotation.y = .58 * windup - 1.18 * strike;
    b.chest.rotation.z = -.16 * impact;
    b.head.rotation.z = .08 * impact;
    b.rightLeg.rotation.x = -.38 * windup - 1.52 * strike;
    b.rightLeg.rotation.z = -.22 * windup - .86 * strike;
    b.leftLeg.rotation.x = .22 * windup + .18 * impact;
    b.leftArm.rotation.z = -.7 - .1 * follow;
    b.rightArm.rotation.z = .7 + .14 * impact;
    b.leftLowerArm.rotation.z = -.48 - .08 * follow;
    b.rightLowerArm.rotation.z = .48 + .08 * follow;
    b.rightLowerLeg.rotation.x = .42 * strike + .22 * impact;
    b.leftLowerLeg.rotation.x = .28 * impact;
    b.rightFoot.rotation.x = -.32 * strike - .14 * impact;
    b.leftFoot.rotation.x = -.1 * impact;
  }
} satisfies ScriptMotionController;
