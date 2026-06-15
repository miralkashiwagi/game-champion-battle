export const motionController={stateStyle:{},applyAttack({phase,bones:b,visualRoot}){const windup=phase.pose,strike=phase.strike;visualRoot.rotation.y=strike*Math.PI*2;b.leftArm.rotation.x=-1.05;b.rightArm.rotation.x=1.05;b.leftArm.rotation.z=-.68;b.rightArm.rotation.z=.68;b.leftLowerArm.rotation.z=-.34;b.rightLowerArm.rotation.z=.34;b.chest.position.y-=.08*windup;}};

