import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const recover = phase.recover;
    const brace = Math.max(windup, impact);

    b.hips.position.y -= .08 * windup + .04 * impact;
    b.hips.position.z += .02 * strike;
    b.hips.rotation.x = .08 * windup - .06 * strike;
    b.spine.rotation.x = .14 * windup - .18 * strike;
    b.chest.position.y -= .05 * windup;
    b.chest.rotation.x = .46 * windup - .96 * strike + .16 * recover;
    b.chest.rotation.y = -.08 * windup + .06 * strike;
    b.head.rotation.x = -.42 * windup + .78 * strike - .1 * recover;
    b.head.rotation.y = .05 * impact;
    b.leftShoulder.rotation.z = -.16 - .08 * brace;
    b.rightShoulder.rotation.z = .16 + .08 * brace;
    b.leftArm.rotation.x = -.42 - .12 * windup + .24 * strike;
    b.rightArm.rotation.x = -.42 - .12 * windup + .24 * strike;
    b.leftArm.rotation.z = -.58 - .26 * strike;
    b.rightArm.rotation.z = .58 + .26 * strike;
    b.leftLowerArm.rotation.z = -.44 - .16 * brace;
    b.rightLowerArm.rotation.z = .44 + .16 * brace;
    b.leftLeg.rotation.x = .3 * windup - .14 * strike;
    b.rightLeg.rotation.x = -.22 * windup + .24 * strike;
    b.leftLowerLeg.rotation.x = .48 * windup + .22 * strike + .12 * impact;
    b.rightLowerLeg.rotation.x = .32 * windup + .3 * strike + .14 * impact;
    b.leftFoot.rotation.x = -.16 * strike;
    b.rightFoot.rotation.x = -.18 * strike;
    visualRoot.position.z = .04 * windup + .32 * strike + .06 * impact;
    visualRoot.rotation.x = -.06 * strike;
  }
} satisfies ScriptMotionController;
