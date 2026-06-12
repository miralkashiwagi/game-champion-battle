export const motionController = {
  stateStyle: {},
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.leftLeg.rotation.z = -.14;
    b.rightLeg.rotation.z = .14;
    if (id === "silver_body_charge") {
      b.hips.rotation.x = .12 * windup;
      b.chest.position.y -= .18 * windup;
      b.chest.rotation.x = .38 * windup - .58 * strike;
      b.leftArm.rotation.x = -.78;
      b.rightArm.rotation.x = -.88;
      b.leftLowerArm.rotation.z = -.52;
      b.rightLowerArm.rotation.z = .52;
      b.leftLowerLeg.rotation.x = .3 * strike;
      visualRoot.position.z = .32 * strike;
      return;
    }
    if (id === "silver_thrust") {
      b.chest.rotation.y = -.42 * windup + .46 * strike;
      b.rightArm.rotation.x = -.35 - 1.25 * strike;
      b.rightArm.rotation.z = -.34;
      b.rightLowerArm.rotation.z = .16 * windup;
      b.leftArm.rotation.x = -1.02;
      b.leftLowerArm.rotation.z = -.72;
      b.leftLeg.rotation.x = -.2 * strike;
      b.rightLowerLeg.rotation.x = .42 * strike;
      visualRoot.position.z = .2 * strike;
      return;
    }
    if (id === "silver_headbutt") {
      b.chest.position.y -= .1 * windup;
      b.chest.rotation.x = .24 * windup - .62 * strike;
      b.head.rotation.x = -.18 * windup + .38 * strike;
      b.leftLowerArm.rotation.z = -.48;
      b.rightLowerArm.rotation.z = .48;
      b.leftLowerLeg.rotation.x = .38 * strike;
      b.rightLowerLeg.rotation.x = .24 * strike;
      visualRoot.position.z = .14 * strike;
      return;
    }
    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    const reverse = step % 2 === 0;
    const rising = step === 4 || id === "silver_guard_counter";
    b.chest.rotation.y = (reverse ? -.5 : .5) * (strike - windup * .55);
    b.rightArm.rotation.x = (reverse ? -1.15 : 1.2) * strike + (reverse ? .55 : -.55) * windup;
    b.rightArm.rotation.z = rising ? -.95 * strike : -.52;
    b.rightLowerArm.rotation.z = .28 + .34 * windup;
    b.leftArm.rotation.x = -1.02;
    b.leftLowerArm.rotation.z = -.72;
    b.leftLeg.rotation.x = -.18 * strike;
    b.rightLeg.rotation.x = .16 * strike;
    b.leftLowerLeg.rotation.x = .22 * strike;
    b.rightLowerLeg.rotation.x = .38 * strike;
    if (id === "silver_slash") visualRoot.rotation.y = strike * .35;
  }
};
