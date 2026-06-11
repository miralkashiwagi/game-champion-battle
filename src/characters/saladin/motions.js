export const motionController = {
  stateStyle: {
    moveSpeed: 11,
    idleBob: .018,
    idleLean: -.055,
    idleArmSpread: .16,
    idleLegSpread: .035,
    moveBob: .045,
    moveLean: -.12,
    moveTwist: .08,
    moveStride: .82,
    moveArmSwing: .48,
    guardLean: -.14,
    guardTwist: -.12,
    guardLeftArmX: -.72,
    guardLeftArmZ: -.62,
    guardRightArmX: -.58,
    guardRightArmZ: .42
  },
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.chest.rotation.x = -.12;
    b.leftLeg.rotation.z = -.1;
    b.rightLeg.rotation.z = .1;
    if (id === "saladin_spiral_kick") {
      visualRoot.rotation.y = strike * 1.6;
      b.chest.rotation.y = .55 * windup - 1.1 * strike;
      b.rightLeg.rotation.x = -1.48 * strike;
      b.rightLeg.rotation.z = -.82 * strike;
      b.leftArm.rotation.z = -.7;
      b.rightArm.rotation.z = .7;
      return;
    }
    if (id === "saladin_windwall") {
      visualRoot.rotation.y = strike * Math.PI * 2;
      b.leftArm.rotation.z = -.95;
      b.rightArm.rotation.z = .95;
      b.leftLeg.rotation.z = -.18;
      b.rightLeg.rotation.z = .18;
      return;
    }
    if (id === "saladin_spin") {
      visualRoot.rotation.y = strike * Math.PI * 2;
      b.leftArm.rotation.x = -1.05;
      b.rightArm.rotation.x = 1.05;
      b.leftArm.rotation.z = -.68;
      b.rightArm.rotation.z = .68;
      b.chest.position.y -= .08 * windup;
      return;
    }
    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    const reverse = step % 2 === 0 || id === "saladin_guard_counter";
    const crossing = id === "saladin_lunar_slash" || id === "saladin_forward_cut" || id === "saladin_guard_counter";
    b.chest.rotation.y = (reverse ? -.62 : .62) * (strike - windup * .6);
    b.leftArm.rotation.x = (reverse ? .45 : -1.15) * strike;
    b.rightArm.rotation.x = (reverse ? -1.15 : .45) * strike;
    b.leftArm.rotation.z = -.5;
    b.rightArm.rotation.z = .5;
    b.leftLeg.rotation.x = -.28 * strike;
    b.rightLeg.rotation.x = .26 * strike;
    visualRoot.position.z = (crossing ? .28 : .1) * strike;
    if (id === "saladin_lunar_slash") visualRoot.rotation.y = strike * .22 * (reverse ? -1 : 1);
  }
};
