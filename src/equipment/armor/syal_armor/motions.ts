import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    b.hips.position.y += .05 * impact - .02 * windup;
    b.hips.rotation.y = -.3 * windup - .82 * strike;
    b.hips.rotation.z = -.2 * impact;
    visualRoot.rotation.y = strike * 1.95;
    visualRoot.position.y += .045 * impact;
    b.chest.rotation.x = .1 * impact;
    b.chest.rotation.y = .48 * windup - 1.28 * strike;
    b.chest.rotation.z = -.2 * impact;
    b.head.rotation.z = .1 * impact;
    b.rightLeg.rotation.x = -.32 * windup - 1.58 * strike;
    b.rightLeg.rotation.z = -.18 * windup - .92 * strike;
    b.leftLeg.rotation.x = .2 * windup + .24 * impact;
    b.leftArm.rotation.z = -.62 - .12 * follow;
    b.rightArm.rotation.z = .78 + .18 * impact;
    b.leftLowerArm.rotation.z = -.42 - .12 * follow;
    b.rightLowerArm.rotation.z = .56 + .1 * follow;
    b.rightLowerLeg.rotation.x = .46 * strike + .26 * impact;
    b.leftLowerLeg.rotation.x = .32 * impact;
    b.rightFoot.rotation.x = -.34 * strike - .18 * impact;
    b.leftFoot.rotation.x = -.14 * impact;
  }
} satisfies ScriptMotionController;
