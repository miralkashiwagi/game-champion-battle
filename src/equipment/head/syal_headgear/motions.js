export const motionController={stateStyle:{},applyAttack({phase,bones:b,visualRoot}){const strike=phase.strike;visualRoot.rotation.y=strike*Math.PI*2;b.leftArm.rotation.z=-.95;b.rightArm.rotation.z=.95;b.leftLowerArm.rotation.z=-.55;b.rightLowerArm.rotation.z=.55;b.leftLeg.rotation.z=-.18;b.rightLeg.rotation.z=.18;}};

