import type { ScriptMotionController } from "../../../shared/character-types.ts";

export const motionController={stateStyle:{},applyAttack({phase,bones:b,visualRoot}){const windup=phase.pose,strike=phase.strike;b.chest.position.y-=.1*windup;b.chest.rotation.x=.24*windup-.62*strike;b.head.rotation.x=-.18*windup+.38*strike;b.leftLowerArm.rotation.z=-.48;b.rightLowerArm.rotation.z=.48;b.leftLowerLeg.rotation.x=.38*strike;b.rightLowerLeg.rotation.x=.24*strike;visualRoot.position.z=.14*strike;}} satisfies ScriptMotionController;
