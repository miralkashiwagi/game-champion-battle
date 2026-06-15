import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController={stateStyle:{},applyAttack({phase,bones:b,visualRoot}){const windup=phase.pose,strike=phase.strike;b.hips.rotation.x=.12*windup;b.chest.position.y-=.18*windup;b.chest.rotation.x=.38*windup-.58*strike;b.leftArm.rotation.x=-.78;b.rightArm.rotation.x=-.88;b.leftLowerArm.rotation.z=-.52;b.rightLowerArm.rotation.z=.52;b.leftLowerLeg.rotation.x=.3*strike;visualRoot.position.z=.32*strike;}} satisfies ScriptMotionController;
