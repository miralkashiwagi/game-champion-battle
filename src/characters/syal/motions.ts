import type { ScriptMotionController } from "../../shared/character-types.ts";

export const motionController = {
  stateStyle: { moveSpeed: 11, idleBob: .018, idleLean: -.055, idleArmSpread: .68, idleLegSpread: .035, moveBob: .045, moveLean: -.12, moveTwist: .08, moveStride: .82, moveArmSwing: .48, guardLean: -.14, guardTwist: -.12, guardLeftArmX: -.68, guardLeftArmZ: -.82, guardRightArmX: -.52, guardRightArmZ: .58 },
  applyAttack({ phase, bones: b, visualRoot }) {
    const windup=phase.pose; const strike=phase.strike;
    b.chest.rotation.x=-.12; b.leftLeg.rotation.z=-.1; b.rightLeg.rotation.z=.1;
    b.chest.rotation.y=-.62*(strike-windup*.6); b.leftArm.rotation.x=.45*strike; b.rightArm.rotation.x=-1.15*strike;
    b.leftArm.rotation.z=-.5; b.rightArm.rotation.z=.5; b.leftLowerArm.rotation.z=-.42-.28*strike; b.rightLowerArm.rotation.z=.42;
    b.leftLeg.rotation.x=-.28*strike; b.rightLeg.rotation.x=.26*strike; b.leftLowerLeg.rotation.x=.3*strike; b.rightLowerLeg.rotation.x=.42*strike;
    visualRoot.position.z=.28*strike;
  }
} satisfies ScriptMotionController;
