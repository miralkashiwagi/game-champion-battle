import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.pose;
    const strike = phase.strike;

    b.hips.position.y -= .04 * windup;
    b.chest.position.y -= .04 * windup;
    b.chest.rotation.x = .28 * windup - .72 * strike;
    b.head.rotation.x = -.24 * windup + .52 * strike;
    b.leftArm.rotation.x = -.32;
    b.rightArm.rotation.x = -.32;
    b.leftArm.rotation.z = -.46 - .18 * strike;
    b.rightArm.rotation.z = .46 + .18 * strike;
    b.leftLowerArm.rotation.z = -.34;
    b.rightLowerArm.rotation.z = .34;
    b.leftLeg.rotation.x = .18 * windup - .08 * strike;
    b.rightLeg.rotation.x = -.12 * windup + .14 * strike;
    b.leftLowerLeg.rotation.x = .32 * windup + .18 * strike;
    b.rightLowerLeg.rotation.x = .2 * windup + .24 * strike;
    b.leftFoot.rotation.x = -.12 * strike;
    b.rightFoot.rotation.x = -.14 * strike;
    visualRoot.position.z = .04 * windup + .2 * strike;
  }
} satisfies ScriptMotionController;
