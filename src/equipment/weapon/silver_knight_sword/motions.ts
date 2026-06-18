import type { ScriptMotionBones, ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.leftLeg.rotation.z = -.14;
    b.rightLeg.rotation.z = .14;

    if (id === "silver_thrust") {
      applyChargedThrust(b, windup, strike);
      visualRoot.position.z = .06 * windup + .32 * strike;
      return;
    }

    if (id === "silver_slash") {
      applyTripleSlash(b, windup, strike);
      visualRoot.position.z = .08 * windup + .3 * strike;
      visualRoot.rotation.y = Math.sin(strike * Math.PI * 3) * .24;
      return;
    }

    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    applyComboSlash(b, step, windup, strike);
    visualRoot.position.z = (step === 4 ? .16 : .08) * strike;
  }
} satisfies ScriptMotionController;

function applyComboSlash(b: ScriptMotionBones, step: number, windup: number, strike: number): void {
  b.leftArm.rotation.x = -.95;
  b.leftArm.rotation.z = -.42;
  b.leftLowerArm.rotation.z = -.72;
  b.rightLowerArm.rotation.z = .22 + .28 * windup;
  b.leftFoot.rotation.x = -.1 * strike;
  b.rightFoot.rotation.x = -.14 * strike;

  if (step === 1) {
    b.chest.rotation.x = -.08;
    b.chest.rotation.y = -.34 * windup + .56 * strike;
    b.rightArm.rotation.x = -.42 * windup - 1.26 * strike;
    b.rightArm.rotation.z = -.72 + .22 * windup;
    b.rightLowerArm.rotation.z = .2 + .4 * strike;
    b.leftLeg.rotation.x = -.12 * strike;
    b.rightLeg.rotation.x = .2 * strike;
    b.rightLowerLeg.rotation.x = .42 * strike;
    return;
  }

  if (step === 2) {
    b.chest.rotation.x = -.06;
    b.chest.rotation.y = .34 * windup - .62 * strike;
    b.rightArm.rotation.x = .46 * windup - 1.12 * strike;
    b.rightArm.rotation.z = .64 - .28 * strike;
    b.rightLowerArm.rotation.z = .42 + .28 * strike;
    b.leftLeg.rotation.x = .16 * strike;
    b.rightLeg.rotation.x = -.14 * strike;
    b.leftLowerLeg.rotation.x = .34 * strike;
    return;
  }

  if (step === 3) {
    b.hips.position.y -= .08 * windup + .04 * strike;
    b.chest.rotation.x = .14 * windup - .16 * strike;
    b.chest.rotation.y = -.36 * windup + .5 * strike;
    b.rightArm.rotation.x = .62 * windup - .86 * strike;
    b.rightArm.rotation.z = -.88 + .34 * strike;
    b.rightLowerArm.rotation.z = .48 + .24 * strike;
    b.leftLeg.rotation.x = .32 * windup - .14 * strike;
    b.rightLeg.rotation.x = -.2 * windup + .16 * strike;
    b.leftLowerLeg.rotation.x = .56 * windup + .18 * strike;
    b.rightLowerLeg.rotation.x = .34 * windup + .16 * strike;
    return;
  }

  b.hips.position.y -= .03 * windup;
  b.chest.rotation.x = .16 * windup - .34 * strike;
  b.chest.rotation.y = .22 * windup + .54 * strike;
  b.rightArm.rotation.x = -.58 * windup - 1.34 * strike;
  b.rightArm.rotation.z = -.96 * strike;
  b.rightLowerArm.rotation.z = .28 + .44 * strike;
  b.leftLeg.rotation.x = -.16 * strike;
  b.rightLeg.rotation.x = .22 * strike;
  b.leftLowerLeg.rotation.x = .26 * strike;
  b.rightLowerLeg.rotation.x = .44 * strike;
}

function applyChargedThrust(b: ScriptMotionBones, windup: number, strike: number): void {
  b.hips.position.y -= .1 * windup + .06 * strike;
  b.hips.rotation.x = .06 * windup - .03 * strike;
  b.chest.rotation.x = .16 * windup - .28 * strike;
  b.chest.rotation.y = -.38 * windup + .18 * strike;
  b.head.rotation.x = -.06 * windup + .08 * strike;
  b.rightArm.rotation.x = .18 * windup - 1.28 * strike;
  b.rightArm.rotation.z = -.46 * windup - .22 * strike;
  b.rightLowerArm.rotation.z = .24 * windup + .08 * strike;
  b.leftArm.rotation.x = -.92;
  b.leftArm.rotation.z = -.48;
  b.leftLowerArm.rotation.z = -.72;
  b.leftLeg.rotation.x = .46 * windup - .32 * strike;
  b.rightLeg.rotation.x = -.26 * windup + .18 * strike;
  b.leftLowerLeg.rotation.x = .68 * windup + .32 * strike;
  b.rightLowerLeg.rotation.x = .28 * windup + .22 * strike;
  b.leftFoot.rotation.x = -.3 * windup - .08 * strike;
  b.rightFoot.rotation.x = -.16 * windup - .1 * strike;
}

function applyTripleSlash(b: ScriptMotionBones, windup: number, strike: number): void {
  const first = segmentPulse(strike, 0, .38);
  const second = segmentPulse(strike, .28, .72);
  const third = segmentPulse(strike, .62, 1);
  const drive = Math.max(first, second, third);

  b.hips.position.y -= .04 * windup;
  b.chest.rotation.x = -.14 * windup - .08 * drive;
  b.chest.rotation.y = -.46 * windup + .7 * first - .76 * second + .6 * third;
  b.rightArm.rotation.x = -.28 * windup - 1.28 * first - .84 * second - 1.38 * third;
  b.rightArm.rotation.z = -.86 * first + .82 * second - 1.02 * third;
  b.rightLowerArm.rotation.z = .34 + .3 * first + .18 * second + .36 * third;
  b.leftArm.rotation.x = -.9 + .12 * drive;
  b.leftArm.rotation.z = -.5 - .12 * drive;
  b.leftLowerArm.rotation.z = -.72;
  b.leftLeg.rotation.x = -.18 * first + .16 * second - .1 * third;
  b.rightLeg.rotation.x = .22 * first - .16 * second + .22 * third;
  b.leftLowerLeg.rotation.x = .26 * first + .32 * third;
  b.rightLowerLeg.rotation.x = .32 * second + .4 * third;
  b.leftFoot.rotation.x = -.12 * drive;
  b.rightFoot.rotation.x = -.16 * drive;
}

function segmentPulse(value: number, start: number, end: number): number {
  if (value <= start || value >= end) return 0;
  const t = (value - start) / (end - start);
  return Math.sin(t * Math.PI);
}
