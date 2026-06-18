import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    b.hips.position.y -= .05 * windup;
    b.hips.rotation.x = .16 * windup - .08 * strike;
    b.chest.position.y -= .2 * windup + .03 * impact;
    b.chest.rotation.x = .42 * windup - .64 * strike + .12 * follow;
    b.chest.rotation.z = .12 * impact;
    b.head.rotation.x = -.1 * windup + .16 * strike;
    b.leftArm.rotation.x = -.78 - .18 * follow;
    b.rightArm.rotation.x = -.88 - .22 * follow;
    b.leftArm.rotation.z = -.28 - .14 * impact;
    b.rightArm.rotation.z = .28 + .14 * impact;
    b.leftLowerArm.rotation.z = -.52 - .12 * follow;
    b.rightLowerArm.rotation.z = .52 + .12 * follow;
    b.leftLeg.rotation.x = .22 * windup - .16 * strike;
    b.rightLeg.rotation.x = -.14 * windup + .2 * strike;
    b.leftLowerLeg.rotation.x = .3 * strike + .16 * impact;
    b.rightLowerLeg.rotation.x = .22 * strike;
    visualRoot.position.z = .34 * strike + .06 * impact;
  }
} satisfies ScriptMotionController;
