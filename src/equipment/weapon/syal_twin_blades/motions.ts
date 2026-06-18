import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController = {
  stateStyle: {},
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const follow = phase.followThrough;
    const impact = phase.impact;
    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    const reverse = step % 2 === 0;
    const crossing = id === "syal_lunar_slash" || id === "syal_forward_cut";
    const side = reverse ? -1 : 1;
    const lift = Math.max(impact, follow * .55);

    b.hips.position.y += .045 * lift - .025 * windup;
    b.hips.rotation.y = side * (.34 * strike - .16 * windup);
    b.hips.rotation.z = side * .12 * impact;
    b.chest.rotation.x = -.08 - .06 * windup + .1 * lift;
    b.chest.rotation.y = side * (.74 * strike - .32 * windup);
    b.chest.rotation.z = side * (.18 * impact + .08 * follow);
    b.head.rotation.y = -b.chest.rotation.y * .26;
    b.head.rotation.z = -b.chest.rotation.z * .42;

    b.leftShoulder.rotation.y = reverse ? .14 * strike : -.1 * windup - .24 * strike;
    b.rightShoulder.rotation.y = reverse ? -.1 * windup - .24 * strike : .14 * strike;
    b.leftShoulder.rotation.z = -.16 - (reverse ? .08 * follow : .24 * impact);
    b.rightShoulder.rotation.z = .16 + (reverse ? .24 * impact : .08 * follow);
    b.leftArm.rotation.x = reverse ? .64 * strike - .2 * windup : -.52 * windup - 1.28 * strike;
    b.rightArm.rotation.x = reverse ? -.52 * windup - 1.28 * strike : .64 * strike - .2 * windup;
    b.leftArm.rotation.z = -.42 - (reverse ? .1 * follow : .28 * impact);
    b.rightArm.rotation.z = .42 + (reverse ? .28 * impact : .1 * follow);
    b.leftLowerArm.rotation.z = -.36 - (reverse ? .2 * follow : .42 * impact);
    b.rightLowerArm.rotation.z = .36 + (reverse ? .42 * impact : .2 * follow);

    b.leftLeg.rotation.x = -.18 * strike + .14 * lift;
    b.rightLeg.rotation.x = .24 * strike - .1 * lift;
    b.leftLowerLeg.rotation.x = .22 * strike + .36 * lift;
    b.rightLowerLeg.rotation.x = .28 * strike + .24 * lift;
    b.leftFoot.rotation.x = -.12 * strike - .18 * lift;
    b.rightFoot.rotation.x = -.16 * strike - .12 * lift;

    visualRoot.position.z = (crossing ? .26 : .09) * strike + .08 * impact;
    visualRoot.position.y += .035 * lift;
    visualRoot.rotation.y = side * (id === "syal_lunar_slash" ? .54 * strike : .18 * follow);
  }
} satisfies ScriptMotionController;
