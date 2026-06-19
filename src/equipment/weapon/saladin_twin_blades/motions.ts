import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import type { ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

export const vrmaMotions = {
  saladin_combo_1: EQUIPMENT_VRMA_CLIPS.slashToLeft({ interruptibleAfter: .4, playbackRate: 1.55, alignEndWithAction: true, actionDurationSeconds: 22 / 60 }),
  saladin_combo_2: EQUIPMENT_VRMA_CLIPS.slashToRight({ interruptibleAfter: .4, playbackRate: 1.55, alignEndWithAction: true, actionDurationSeconds: 22 / 60 }),
  saladin_combo_3: EQUIPMENT_VRMA_CLIPS.slashUp({ interruptibleAfter: .44, playbackRate: 1.45, alignEndWithAction: true, actionDurationSeconds: 23 / 60 }),
  saladin_combo_4: EQUIPMENT_VRMA_CLIPS.slashToLeft({ interruptibleAfter: .48, playbackRate: 1.45, alignEndWithAction: true, actionDurationSeconds: 31 / 60, fallbackReason: VRMA_FALLBACK_REASONS.slash }),
  saladin_lunar_slash: EQUIPMENT_VRMA_CLIPS.slashToLeft({ interruptibleAfter: .58, playbackRate: 1.25, alignEndWithAction: true, actionDurationSeconds: 44 / 60, fallbackReason: VRMA_FALLBACK_REASONS.thrust }),
  saladin_forward_cut: EQUIPMENT_VRMA_CLIPS.slashToRight({ interruptibleAfter: .5, playbackRate: 1.35, alignEndWithAction: true, actionDurationSeconds: 36 / 60, fallbackReason: VRMA_FALLBACK_REASONS.thrust })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const follow = phase.followThrough;
    const impact = phase.impact;
    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    const reverse = step % 2 === 0;
    const crossing = id === "saladin_lunar_slash" || id === "saladin_forward_cut";
    const side = reverse ? -1 : 1;

    b.hips.position.y -= .05 * windup + .04 * impact;
    b.hips.rotation.y = side * (.18 * windup - .3 * strike);
    b.chest.rotation.x = -.16 - .1 * windup + .04 * follow;
    b.chest.rotation.y = side * (.58 * strike - .38 * windup - .18 * follow);
    b.chest.rotation.z = side * (.05 * windup + .08 * impact);
    b.head.rotation.y = -b.chest.rotation.y * .32;

    b.leftShoulder.rotation.y = reverse ? .08 * strike : -.12 * windup - .18 * strike;
    b.rightShoulder.rotation.y = reverse ? -.12 * windup - .18 * strike : .08 * strike;
    b.leftShoulder.rotation.z = -.18 - (reverse ? .08 * impact : .18 * strike);
    b.rightShoulder.rotation.z = .18 + (reverse ? .18 * strike : .08 * impact);
    b.leftArm.rotation.x = reverse ? -.18 * windup + .42 * strike : -.82 * windup - 1.16 * strike;
    b.rightArm.rotation.x = reverse ? -.82 * windup - 1.16 * strike : -.18 * windup + .42 * strike;
    b.leftArm.rotation.z = -.5 - (reverse ? .18 * impact : .08 * follow);
    b.rightArm.rotation.z = .5 + (reverse ? .08 * follow : .18 * impact);
    b.leftLowerArm.rotation.z = -.42 - (reverse ? .22 * follow : .34 * impact);
    b.rightLowerArm.rotation.z = .42 + (reverse ? .34 * impact : .22 * follow);

    b.leftLeg.rotation.x = -.24 * strike - .08 * windup;
    b.rightLeg.rotation.x = .22 * strike + .06 * windup;
    b.leftLowerLeg.rotation.x = .26 * strike + .16 * impact;
    b.rightLowerLeg.rotation.x = .36 * strike + .18 * impact;
    b.leftFoot.rotation.x = -.14 * strike - .08 * impact;
    b.rightFoot.rotation.x = -.18 * strike - .1 * impact;

    visualRoot.position.z = (crossing ? .3 : .13) * strike + .04 * impact;
    visualRoot.rotation.y = side * (id === "saladin_lunar_slash" ? .36 * strike : .12 * follow);
  }
} satisfies ScriptMotionController;
