import type { ScriptMotionController, ScriptMotionBones } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.leftLeg.rotation.z = -.1;
    b.rightLeg.rotation.z = .1;

    if (id === "saladin_charged_thrust") {
      applyChargedThrust(b, windup, strike);
      visualRoot.position.z = .08 * windup + .38 * strike;
      return;
    }

    if (id === "saladin_slash") {
      applyTripleSlash(b, windup, strike);
      visualRoot.position.z = .1 * windup + .34 * strike;
      visualRoot.rotation.y = Math.sin(strike * Math.PI * 3) * .28;
      return;
    }

    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    applyComboSlash(b, step, windup, strike);
    visualRoot.position.z = (step === 4 ? .18 : .11) * strike;
  }
} satisfies ScriptMotionController;

function applyComboSlash(b: ScriptMotionBones, step: number, windup: number, strike: number): void {
  b.leftLowerArm.rotation.z = -.34;
  b.rightLowerArm.rotation.z = .34;
  b.leftFoot.rotation.x = -.12 * strike;
  b.rightFoot.rotation.x = -.16 * strike;

  if (step === 1) {
    b.chest.rotation.x = -.1;
    b.chest.rotation.y = -.34 * windup + .58 * strike;
    b.rightArm.rotation.x = -.35 * windup - 1.22 * strike;
    b.rightArm.rotation.z = -.7 + .28 * windup;
    b.rightLowerArm.rotation.z = .18 + .42 * strike;
    b.leftArm.rotation.x = -.2 - .28 * strike;
    b.leftArm.rotation.z = -.46;
    b.leftLeg.rotation.x = -.12 * strike;
    b.rightLeg.rotation.x = .2 * strike;
    b.rightLowerLeg.rotation.x = .42 * strike;
    return;
  }

  if (step === 2) {
    b.chest.rotation.x = -.08;
    b.chest.rotation.y = .36 * windup - .64 * strike;
    b.leftArm.rotation.x = -.38 * windup - 1.16 * strike;
    b.leftArm.rotation.z = .72 - .26 * windup;
    b.leftLowerArm.rotation.z = -.18 - .46 * strike;
    b.rightArm.rotation.x = -.18 - .26 * strike;
    b.rightArm.rotation.z = .48;
    b.leftLeg.rotation.x = .18 * strike;
    b.rightLeg.rotation.x = -.14 * strike;
    b.leftLowerLeg.rotation.x = .38 * strike;
    return;
  }

  if (step === 3) {
    b.hips.position.y -= .08 * windup + .06 * strike;
    b.chest.rotation.x = .16 * windup - .18 * strike;
    b.chest.rotation.y = -.42 * windup + .5 * strike;
    b.leftArm.rotation.x = .46 * windup - .86 * strike;
    b.rightArm.rotation.x = .36 * windup - .92 * strike;
    b.leftArm.rotation.z = -.74 + .34 * strike;
    b.rightArm.rotation.z = .74 - .34 * strike;
    b.leftLowerArm.rotation.z = -.56 - .2 * strike;
    b.rightLowerArm.rotation.z = .56 + .2 * strike;
    b.leftLeg.rotation.x = .34 * windup - .16 * strike;
    b.rightLeg.rotation.x = -.22 * windup + .18 * strike;
    b.leftLowerLeg.rotation.x = .58 * windup + .18 * strike;
    b.rightLowerLeg.rotation.x = .36 * windup + .18 * strike;
    return;
  }

  b.hips.position.y -= .04 * windup;
  b.chest.rotation.x = .2 * windup - .32 * strike;
  b.chest.rotation.y = .2 * windup + .5 * strike;
  b.leftArm.rotation.x = -.62 * windup - 1.22 * strike;
  b.rightArm.rotation.x = -.62 * windup - 1.22 * strike;
  b.leftArm.rotation.z = -.86 + .22 * strike;
  b.rightArm.rotation.z = .86 - .22 * strike;
  b.leftLowerArm.rotation.z = -.7;
  b.rightLowerArm.rotation.z = .7;
  b.leftLeg.rotation.x = -.18 * strike;
  b.rightLeg.rotation.x = .24 * strike;
  b.leftLowerLeg.rotation.x = .3 * strike;
  b.rightLowerLeg.rotation.x = .46 * strike;
}

function applyChargedThrust(b: ScriptMotionBones, windup: number, strike: number): void {
  b.hips.position.y -= .12 * windup + .08 * strike;
  b.hips.rotation.x = .08 * windup - .04 * strike;
  b.chest.rotation.x = .18 * windup - .3 * strike;
  b.chest.rotation.y = -.3 * windup + .12 * strike;
  b.head.rotation.x = -.08 * windup + .1 * strike;
  b.leftArm.rotation.x = .2 * windup - 1.22 * strike;
  b.rightArm.rotation.x = .2 * windup - 1.22 * strike;
  b.leftArm.rotation.z = -.72 * windup - .18 * strike;
  b.rightArm.rotation.z = .72 * windup + .18 * strike;
  b.leftLowerArm.rotation.z = -.42 * windup - .08 * strike;
  b.rightLowerArm.rotation.z = .42 * windup + .08 * strike;
  b.leftLeg.rotation.x = .48 * windup - .34 * strike;
  b.rightLeg.rotation.x = -.28 * windup + .2 * strike;
  b.leftLowerLeg.rotation.x = .72 * windup + .34 * strike;
  b.rightLowerLeg.rotation.x = .3 * windup + .22 * strike;
  b.leftFoot.rotation.x = -.34 * windup - .08 * strike;
  b.rightFoot.rotation.x = -.18 * windup - .12 * strike;
}

function applyTripleSlash(b: ScriptMotionBones, windup: number, strike: number): void {
  const first = segmentPulse(strike, 0, .38);
  const second = segmentPulse(strike, .28, .72);
  const third = segmentPulse(strike, .62, 1);
  const drive = Math.max(first, second, third);

  b.hips.position.y -= .05 * windup;
  b.chest.rotation.x = -.16 * windup - .1 * drive;
  b.chest.rotation.y = -.48 * windup + .72 * first - .78 * second + .58 * third;
  b.leftArm.rotation.x = -.26 * windup - .35 * first - 1.24 * second - .95 * third;
  b.rightArm.rotation.x = -.26 * windup - 1.24 * first - .35 * second - .95 * third;
  b.leftArm.rotation.z = -.62 * first + .72 * second - .92 * third;
  b.rightArm.rotation.z = -.72 * first + .62 * second + .92 * third;
  b.leftLowerArm.rotation.z = -.36 - .28 * second - .22 * third;
  b.rightLowerArm.rotation.z = .36 + .28 * first + .22 * third;
  b.leftLeg.rotation.x = -.2 * first + .18 * second - .1 * third;
  b.rightLeg.rotation.x = .24 * first - .18 * second + .22 * third;
  b.leftLowerLeg.rotation.x = .28 * first + .34 * third;
  b.rightLowerLeg.rotation.x = .34 * second + .42 * third;
  b.leftFoot.rotation.x = -.14 * drive;
  b.rightFoot.rotation.x = -.18 * drive;
}

function segmentPulse(value: number, start: number, end: number): number {
  if (value <= start || value >= end) return 0;
  const t = (value - start) / (end - start);
  return Math.sin(t * Math.PI);
}
