export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b }) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.leftLeg.rotation.z = -.14;
    b.rightLeg.rotation.z = .14;
    b.chest.rotation.y = -.5 * (strike - windup * .55);
    b.rightArm.rotation.x = -1.15 * strike + .55 * windup;
    b.rightArm.rotation.z = -.95 * strike;
    b.rightLowerArm.rotation.z = .28 + .34 * windup;
    b.leftArm.rotation.x = -1.02;
    b.leftLowerArm.rotation.z = -.72;
    b.leftLowerLeg.rotation.x = .22 * strike;
    b.rightLowerLeg.rotation.x = .38 * strike;
  }
};
