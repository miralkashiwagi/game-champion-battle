import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    visualRoot.rotation.y = strike * Math.PI * 2.05;
    b.hips.rotation.y = -.18 * windup + .34 * strike;
    b.chest.rotation.x = -.08 * windup;
    b.chest.rotation.y = .28 * windup - .52 * strike;
    b.head.rotation.y = -b.chest.rotation.y * .45;
    b.leftArm.rotation.z = -.95 - .12 * impact;
    b.rightArm.rotation.z = .95 + .12 * impact;
    b.leftLowerArm.rotation.z = -.55 - .1 * impact;
    b.rightLowerArm.rotation.z = .55 + .1 * impact;
    b.leftLeg.rotation.z = -.18;
    b.rightLeg.rotation.z = .18;
    b.leftLowerLeg.rotation.x = .18 * impact;
    b.rightLowerLeg.rotation.x = .16 * impact;
  }
} satisfies ScriptMotionController;
