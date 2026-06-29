import { EQUIPMENT_VRMA_CLIPS, VRMA_FALLBACK_REASONS } from "../../vrma.ts";
import { definition } from "./definition.ts";
import type { ScriptMotionBones, ScriptMotionController, VrmaMotionMap } from "../../../shared/character-types.ts";

const SILVER_SLASH_VRMA_SECONDS = 3.792;
const silverSlashActionSeconds = (definition.skill.startupFrames + definition.skill.activeFrames + definition.skill.recoveryFrames) / 60;

export const vrmaMotions = {
  silver_combo_1: EQUIPMENT_VRMA_CLIPS.slashToLeft({ interruptibleAfter: .42 }),
  silver_combo_2: EQUIPMENT_VRMA_CLIPS.slashToRight({ interruptibleAfter: .42 }),
  silver_combo_3: EQUIPMENT_VRMA_CLIPS.slashToLeft({ interruptibleAfter: .45 }),
  silver_combo_4: EQUIPMENT_VRMA_CLIPS.slashUp({ interruptibleAfter: .48, fallbackReason: VRMA_FALLBACK_REASONS.slash }),
  silver_slash: EQUIPMENT_VRMA_CLIPS.threeSlash({
    interruptibleAfter: silverSlashActionSeconds,
    playbackRate: SILVER_SLASH_VRMA_SECONDS / silverSlashActionSeconds
  }),
  silver_thrust: EQUIPMENT_VRMA_CLIPS.thrust({ interruptibleAfter: .52 })
} satisfies VrmaMotionMap;

export const motionController = {
  stateStyle: {},
  applyAttack({ id, phase, bones: b, visualRoot }) {
    const windup = phase.windup;
    const strike = phase.strike;
    const impact = phase.impact;
    const follow = phase.followThrough;
    b.leftLeg.rotation.z = -.14;
    b.rightLeg.rotation.z = .14;

    if (id === "silver_thrust") {
      applyChargedThrust(b, windup, strike, impact, follow);
      visualRoot.position.z = .06 * windup + .48 * strike + .08 * impact - .04 * follow;
      visualRoot.rotation.x = -.04 * windup - .06 * strike;
      return;
    }

    if (id === "silver_slash") {
      applyTripleSlash(b, windup, strike, impact, follow);
      const slashDrive = Math.max(
        segmentPulse(strike, 0, .34),
        segmentPulse(strike, .28, .68),
        segmentPulse(strike, .62, 1)
      );
      visualRoot.position.z = .06 * windup + .42 * strike + .05 * slashDrive;
      visualRoot.rotation.y = Math.sin(strike * Math.PI * 3) * (.18 + .16 * slashDrive);
      return;
    }

    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    applyComboSlash(b, step, windup, strike, impact);
    visualRoot.position.z = (step === 4 ? .22 : .11) * strike + .05 * impact;
    visualRoot.rotation.y = (step % 2 === 0 ? -.06 : .06) * strike;
  }
} satisfies ScriptMotionController;

function applyComboSlash(b: ScriptMotionBones, step: number, windup: number, strike: number, impact: number): void {
  b.leftShoulder.rotation.y = -.12;
  b.rightShoulder.rotation.y = -.18 * windup - .12 * strike;
  b.leftShoulder.rotation.z = -.22;
  b.rightShoulder.rotation.z = .18 + .18 * impact;
  b.leftArm.rotation.x = -.72;
  b.leftArm.rotation.z = -.68;
  b.leftLowerArm.rotation.z = -.78;
  b.rightLowerArm.rotation.z = .22 + .28 * windup;
  b.leftFoot.rotation.x = -.1 * strike;
  b.rightFoot.rotation.x = -.14 * strike;

  if (step === 1) {
    b.hips.rotation.y = -.16 * windup + .24 * strike;
    b.chest.rotation.x = -.1 - .04 * impact;
    b.chest.rotation.y = -.56 * windup + .78 * strike;
    b.head.rotation.y = -.16 * windup + .12 * strike;
    b.rightArm.rotation.x = -.22 * windup - 1.18 * strike;
    b.rightArm.rotation.z = .36 * windup - .92 * strike;
    b.rightLowerArm.rotation.z = .18 + .48 * strike;
    b.leftLeg.rotation.x = -.18 * strike - .08 * impact;
    b.rightLeg.rotation.x = .3 * strike + .04 * impact;
    b.rightLowerLeg.rotation.x = .5 * strike + .12 * impact;
    return;
  }

  if (step === 2) {
    b.hips.rotation.y = .12 * windup - .18 * strike;
    b.chest.rotation.x = -.08;
    b.chest.rotation.y = .48 * windup - .78 * strike;
    b.head.rotation.y = .14 * windup - .1 * strike;
    b.rightShoulder.rotation.y = .2 * windup - .2 * strike;
    b.rightShoulder.rotation.z = .34 + .14 * impact;
    b.rightArm.rotation.x = .42 * windup - 1.02 * strike;
    b.rightArm.rotation.z = .86 - .5 * strike;
    b.rightLowerArm.rotation.z = .48 + .32 * strike;
    b.leftLeg.rotation.x = .22 * strike;
    b.rightLeg.rotation.x = -.18 * strike;
    b.leftLowerLeg.rotation.x = .42 * strike;
    return;
  }

  if (step === 3) {
    b.hips.position.y -= .11 * windup + .05 * strike;
    b.hips.rotation.x = .04 * windup;
    b.hips.rotation.y = -.18 * windup + .18 * strike;
    b.chest.rotation.x = .18 * windup - .2 * strike;
    b.chest.rotation.y = -.46 * windup + .64 * strike;
    b.head.rotation.x = -.06 * windup + .08 * strike;
    b.rightShoulder.rotation.y = .16 * windup - .1 * strike;
    b.rightArm.rotation.x = .58 * windup - .82 * strike;
    b.rightArm.rotation.z = -.98 + .42 * strike;
    b.rightLowerArm.rotation.z = .56 + .28 * strike;
    b.leftLeg.rotation.x = .42 * windup - .18 * strike;
    b.rightLeg.rotation.x = -.26 * windup + .18 * strike;
    b.leftLowerLeg.rotation.x = .68 * windup + .2 * strike;
    b.rightLowerLeg.rotation.x = .42 * windup + .18 * strike;
    return;
  }

  b.hips.position.y -= .06 * windup - .05 * impact;
  b.hips.rotation.x = -.06 * impact;
  b.hips.rotation.y = .16 * windup + .26 * strike;
  b.chest.rotation.x = .24 * windup - .48 * strike - .1 * impact;
  b.chest.rotation.y = .28 * windup + .7 * strike;
  b.head.rotation.x = .08 * windup - .1 * strike;
  b.rightShoulder.rotation.y = -.28 * windup - .18 * strike;
  b.rightShoulder.rotation.z = .26 + .26 * impact;
  b.rightArm.rotation.x = -.54 * windup - 1.28 * strike;
  b.rightArm.rotation.z = -.96 * strike;
  b.rightLowerArm.rotation.z = .3 + .58 * strike;
  b.leftLeg.rotation.x = -.2 * strike - .08 * impact;
  b.rightLeg.rotation.x = .3 * strike + .08 * impact;
  b.leftLowerLeg.rotation.x = .34 * strike;
  b.rightLowerLeg.rotation.x = .58 * strike;
}

function applyChargedThrust(b: ScriptMotionBones, windup: number, strike: number, impact: number, follow: number): void {
  const brace = Math.max(windup, impact);
  b.hips.position.y -= .2 * windup + .08 * strike + .05 * impact;
  b.hips.position.z += .03 * strike;
  b.hips.rotation.x = .12 * windup - .08 * strike;
  b.spine.rotation.x = .1 * windup - .14 * strike;
  b.chest.rotation.x = .32 * windup - .52 * strike + .12 * follow;
  b.chest.rotation.y = -.52 * windup + .18 * strike;
  b.head.rotation.x = -.12 * windup + .14 * strike;
  b.rightShoulder.rotation.y = -.28 * windup - .24 * strike;
  b.rightShoulder.rotation.z = .2 + .22 * impact;
  b.leftShoulder.rotation.y = -.1 * brace;
  b.leftShoulder.rotation.z = -.26 - .08 * impact;
  b.rightArm.rotation.x = .24 * windup - 1.24 * strike;
  b.rightArm.rotation.z = -.42 * windup - .42 * strike;
  b.rightLowerArm.rotation.z = .34 * windup + .18 * strike + .12 * impact;
  b.leftArm.rotation.x = -.74 - .22 * strike;
  b.leftArm.rotation.z = -.78 - .1 * impact;
  b.leftLowerArm.rotation.z = -.8 - .08 * strike;
  b.leftLeg.rotation.x = .64 * windup - .44 * strike - .12 * impact;
  b.rightLeg.rotation.x = -.34 * windup + .24 * strike;
  b.leftLowerLeg.rotation.x = .92 * windup + .44 * strike;
  b.rightLowerLeg.rotation.x = .38 * windup + .28 * strike;
  b.leftFoot.rotation.x = -.38 * windup - .12 * strike;
  b.rightFoot.rotation.x = -.22 * windup - .12 * strike;
}

function applyTripleSlash(b: ScriptMotionBones, windup: number, strike: number, impact: number, follow: number): void {
  const first = segmentPulse(strike, 0, .34);
  const second = segmentPulse(strike, .28, .68);
  const third = segmentPulse(strike, .62, 1);
  const drive = Math.max(first, second, third);

  b.hips.position.y -= .08 * windup + .05 * impact + .03 * drive;
  b.hips.rotation.x = -.04 * drive + .04 * follow;
  b.hips.rotation.y = -.18 * windup + .22 * first - .24 * second + .2 * third;
  b.spine.rotation.y = -.2 * windup + .18 * first - .22 * second + .18 * third;
  b.chest.rotation.x = -.18 * windup - .12 * drive + .08 * follow;
  b.chest.rotation.y = -.58 * windup + .92 * first - .98 * second + .84 * third;
  b.head.rotation.y = -.16 * windup + .12 * first - .1 * second + .1 * third;
  b.rightShoulder.rotation.y = -.22 * windup - .14 * drive;
  b.rightShoulder.rotation.z = .2 + .26 * impact;
  b.leftShoulder.rotation.y = .08 * drive;
  b.leftShoulder.rotation.z = -.22 - .12 * drive;
  b.rightArm.rotation.x = -.28 * windup - 1.2 * first - .88 * second - 1.26 * third;
  b.rightArm.rotation.z = -.92 * first + .88 * second - 1.02 * third;
  b.rightLowerArm.rotation.z = .36 + .38 * first + .24 * second + .44 * third;
  b.leftArm.rotation.x = -.72 + .12 * drive;
  b.leftArm.rotation.z = -.78 - .12 * drive;
  b.leftLowerArm.rotation.z = -.78 - .06 * drive;
  b.leftLeg.rotation.x = -.24 * first + .18 * second - .14 * third;
  b.rightLeg.rotation.x = .28 * first - .22 * second + .28 * third;
  b.leftLowerLeg.rotation.x = .34 * first + .14 * second + .4 * third;
  b.rightLowerLeg.rotation.x = .12 * first + .4 * second + .48 * third;
  b.leftFoot.rotation.x = -.16 * drive;
  b.rightFoot.rotation.x = -.2 * drive;
}

function segmentPulse(value: number, start: number, end: number): number {
  if (value <= start || value >= end) return 0;
  const t = (value - start) / (end - start);
  return Math.sin(t * Math.PI);
}
