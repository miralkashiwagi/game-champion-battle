import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  syal_spin: EQUIPMENT_VRMA_CLIPS.slashUp({ interruptibleAfter: .48, playbackRate: 1.45, alignEndWithAction: true, actionDurationSeconds: 32 / 60, fallbackReason: VRMA_FALLBACK_REASONS.slash })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    const lift = Math.max(impact, follow * .5);
    visualRoot.rotation.y = strike * Math.PI * 2.35;
    visualRoot.position.y += .04 * lift;
    visualRoot.position.z = .06 * impact;
    b.hips.position.y += .035 * lift - .02 * windup;
    b.hips.rotation.y = .28 * windup - .58 * strike;
    b.chest.position.y -= .05 * windup;
    b.chest.rotation.x = .06 * lift;
    b.chest.rotation.y = -.42 * windup + .64 * strike;
    b.chest.rotation.z = .14 * impact;
    b.leftArm.rotation.x = -1.02 - .1 * follow;
    b.rightArm.rotation.x = 1.08 + .18 * impact;
    b.leftArm.rotation.z = -.58 - .22 * impact;
    b.rightArm.rotation.z = .78 + .12 * follow;
    b.leftLowerArm.rotation.z = -.32 - .24 * impact;
    b.rightLowerArm.rotation.z = .38 + .2 * follow;
    b.leftLeg.rotation.x = -.1 * strike + .18 * lift;
    b.rightLeg.rotation.x = .14 * strike - .1 * lift;
    b.leftLowerLeg.rotation.x = .26 * lift;
    b.rightLowerLeg.rotation.x = .22 * lift;
  }
} satisfies ScriptMotionController;
