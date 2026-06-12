const STATE_MOTIONS = {
  Idle: "idle", Move: "move", Guard: "guard", GuardCounterWindow: "guard",
  Hitstun: "hit", KneelDown: "kneel", AirDamaged: "air", Down: "down",
  Stunned: "stunned", Dead: "dead"
};

const DEFAULT_STATE_STYLE = {
  moveSpeed: 8,
  idleBob: .026,
  idleLean: .015,
  idleArmSpread: .08,
  idleLegSpread: .06,
  moveBob: .06,
  moveLean: -.12,
  moveTwist: .1,
  moveStride: .72,
  moveArmSwing: .62,
  guardLean: .08,
  guardTwist: .04,
  guardLeftArmX: -1.12,
  guardLeftArmZ: -.4,
  guardRightArmX: -.25,
  guardRightArmZ: -.12
};

export class ScriptMotionPlayer {
  constructor(rig, visualRoot, attackSpecs, motionController, resolveMotionController) {
    this.rig = rig;
    this.visualRoot = visualRoot;
    this.attackSpecs = attackSpecs;
    this.motionController = motionController;
    this.resolveMotionController = resolveMotionController || (() => motionController);
    this.stateStyle = { ...DEFAULT_STATE_STYLE, ...motionController.stateStyle };
    this.baseVisualY = visualRoot.position.y;
    this.basePositions = new Map(MOTION_BONES.map((name) => [name, rig.getBone(name).position.clone()]));
    this.time = Math.random() * 10;
    this.pickupRemaining = 0;
  }

  playPickup() {
    this.pickupRemaining = .28;
  }

  update(snapshot, delta) {
    this.time += delta;
    this.pickupRemaining = Math.max(0, this.pickupRemaining - delta);
    this.resetPose();
    const state = snapshot?.state || "Idle";
    if (snapshot?.activeActionId && state.startsWith("Attack")) this.applyAttack(snapshot);
    else this.applyState(STATE_MOTIONS[state] || "idle", snapshot);
    if (this.pickupRemaining > 0) this.applyPickupOverlay();
  }

  resetPose() {
    this.visualRoot.position.set(0, this.baseVisualY, 0);
    this.visualRoot.rotation.set(0, 0, 0);
    for (const name of MOTION_BONES) {
      const bone = this.rig.getBone(name);
      bone.rotation.set(0, 0, 0);
      bone.position.copy(this.basePositions.get(name));
    }
  }

  applyState(motionId, snapshot = {}) {
    const b = getRigBones(this.rig);
    const style = this.stateStyle;
    const phase = this.time * (motionId === "move" ? style.moveSpeed : 2.3);
    if (motionId === "idle") {
      b.hips.position.y += Math.sin(phase) * style.idleBob;
      b.chest.rotation.x = style.idleLean;
      b.spine.rotation.y = Math.sin(phase * .5) * .018;
      b.head.rotation.y = -b.spine.rotation.y * .65;
      b.leftShoulder.rotation.z = -.025;
      b.rightShoulder.rotation.z = .025;
      b.leftArm.rotation.z = -style.idleArmSpread;
      b.rightArm.rotation.z = style.idleArmSpread;
      b.leftLowerArm.rotation.z = -.08;
      b.rightLowerArm.rotation.z = .08;
      b.leftLeg.rotation.z = -style.idleLegSpread;
      b.rightLeg.rotation.z = style.idleLegSpread;
    } else if (motionId === "move") {
      const stride = Math.sin(phase);
      const leftPlant = Math.max(0, -stride);
      const rightPlant = Math.max(0, stride);
      const cadence = Math.cos(phase * 2);
      b.hips.position.y += (1 - Math.abs(stride)) * style.moveBob;
      b.hips.position.x += stride * .018;
      b.hips.rotation.y = stride * style.moveTwist;
      b.hips.rotation.z = stride * .025;
      b.spine.rotation.x = style.moveLean * .42;
      b.spine.rotation.y = -stride * style.moveTwist * .62;
      b.chest.rotation.x = style.moveLean;
      b.chest.rotation.y = -stride * style.moveTwist;
      b.chest.rotation.z = -stride * .018;
      b.head.rotation.x = -style.moveLean * .28 + cadence * .012;
      b.head.rotation.y = stride * style.moveTwist * .35;
      b.leftShoulder.rotation.y = stride * .08;
      b.rightShoulder.rotation.y = stride * .08;
      b.leftLeg.rotation.x = stride * style.moveStride;
      b.rightLeg.rotation.x = -stride * style.moveStride;
      b.leftLowerLeg.rotation.x = leftPlant * 1.05 + rightPlant * .16;
      b.rightLowerLeg.rotation.x = rightPlant * 1.05 + leftPlant * .16;
      b.leftFoot.rotation.x = -leftPlant * .48 + rightPlant * .16;
      b.rightFoot.rotation.x = -rightPlant * .48 + leftPlant * .16;
      b.leftArm.rotation.x = -stride * style.moveArmSwing;
      b.rightArm.rotation.x = stride * style.moveArmSwing;
      b.leftArm.rotation.z = -.08;
      b.rightArm.rotation.z = .08;
      b.leftLowerArm.rotation.z = -.42 - rightPlant * .32;
      b.rightLowerArm.rotation.z = .42 + leftPlant * .32;
    } else if (motionId === "guard") {
      b.chest.rotation.x = style.guardLean;
      b.chest.rotation.y = style.guardTwist;
      b.leftArm.rotation.x = style.guardLeftArmX;
      b.leftArm.rotation.z = style.guardLeftArmZ;
      b.rightArm.rotation.x = style.guardRightArmX;
      b.rightArm.rotation.z = style.guardRightArmZ;
      b.leftLowerArm.rotation.z = -.42;
      b.rightLowerArm.rotation.z = .42;
      b.leftLeg.rotation.z = -.14;
      b.rightLeg.rotation.z = .14;
    } else if (motionId === "hit") {
      const recoil = .82 + Math.sin(this.time * 30) * .08;
      b.hips.rotation.x = -.12;
      b.spine.rotation.x = -.18 * recoil;
      b.chest.rotation.x = -.34 * recoil;
      b.chest.rotation.z = Math.sin(this.time * 34) * .06;
      b.head.rotation.x = .18;
      b.leftShoulder.rotation.z = -.12;
      b.rightShoulder.rotation.z = .12;
      b.leftArm.rotation.x = .28;
      b.rightArm.rotation.x = -.22;
      b.leftArm.rotation.z = -.52;
      b.rightArm.rotation.z = .52;
      b.leftLowerArm.rotation.z = -.48;
      b.rightLowerArm.rotation.z = .48;
      b.leftLeg.rotation.x = -.12;
      b.rightLeg.rotation.x = .16;
      b.leftLowerLeg.rotation.x = .28;
    } else if (motionId === "kneel") {
      b.hips.position.y -= .24;
      b.hips.rotation.x = .12;
      b.spine.rotation.x = .2;
      b.chest.rotation.x = .26;
      b.head.rotation.x = -.12;
      b.leftLeg.rotation.x = .86;
      b.leftLowerLeg.rotation.x = 1.18;
      b.leftFoot.rotation.x = -.52;
      b.rightLeg.rotation.x = -.28;
      b.rightLowerLeg.rotation.x = .72;
      b.rightFoot.rotation.x = -.3;
      b.leftArm.rotation.x = -.28;
      b.rightArm.rotation.x = -.42;
      b.leftLowerArm.rotation.z = -.62;
      b.rightLowerArm.rotation.z = .62;
    } else if (motionId === "air") {
      const verticalVelocity = snapshot?.velocity?.y || 0;
      const rising = clamp01(-verticalVelocity / 7.5);
      const falling = clamp01(verticalVelocity / 8);
      const float = 1 - Math.max(rising, falling);
      const flutter = Math.sin(this.time * 7);
      b.hips.position.y += float * .035;
      b.hips.rotation.x = -.16 - rising * .18 + falling * .08;
      b.hips.rotation.z = -.08 + flutter * .025;
      b.spine.rotation.x = -.24 - rising * .16 + falling * .12;
      b.spine.rotation.y = flutter * .06;
      b.chest.rotation.x = -.32 - rising * .2 + falling * .16;
      b.chest.rotation.z = -.14 + flutter * .045;
      b.head.rotation.x = .2 + rising * .1;
      b.head.rotation.z = .08 - flutter * .025;
      b.leftShoulder.rotation.z = -.16;
      b.rightShoulder.rotation.z = .16;
      b.leftArm.rotation.x = .42 + flutter * .12;
      b.rightArm.rotation.x = -.3 - flutter * .1;
      b.leftArm.rotation.z = -.72;
      b.rightArm.rotation.z = .68;
      b.leftLowerArm.rotation.z = -.72;
      b.rightLowerArm.rotation.z = .68;
      b.leftLeg.rotation.x = .56 - falling * .2;
      b.rightLeg.rotation.x = -.22 + rising * .18;
      b.leftLowerLeg.rotation.x = .92 - falling * .18;
      b.rightLowerLeg.rotation.x = .66 + float * .18;
      b.leftFoot.rotation.x = -.38 + falling * .2;
      b.rightFoot.rotation.x = -.28 + falling * .18;
    } else if (motionId === "stunned") {
      b.chest.rotation.z = Math.sin(this.time * 9) * .12;
      b.head.rotation.z = -b.chest.rotation.z * 1.8;
      b.leftArm.rotation.z = -.5;
      b.rightArm.rotation.z = .5;
    } else if (motionId === "down" || motionId === "dead") {
      const dead = motionId === "dead";
      b.hips.position.y -= dead ? .72 : .62;
      b.hips.rotation.z = dead ? 1.48 : 1.3;
      b.hips.rotation.x = .08;
      b.spine.rotation.x = dead ? -.08 : .18;
      b.chest.rotation.z = dead ? .08 : .16;
      b.head.rotation.z = dead ? -.12 : -.2;
      b.leftArm.rotation.x = dead ? .18 : -.22;
      b.rightArm.rotation.x = dead ? -.16 : .3;
      b.leftArm.rotation.z = -.38;
      b.rightArm.rotation.z = .42;
      b.leftLowerArm.rotation.z = -.62;
      b.rightLowerArm.rotation.z = .58;
      b.leftLeg.rotation.x = .42;
      b.rightLeg.rotation.x = -.3;
      b.leftLowerLeg.rotation.x = .78;
      b.rightLowerLeg.rotation.x = .48;
      b.leftFoot.rotation.x = -.28;
      b.rightFoot.rotation.x = -.18;
    }
  }

  applyAttack(snapshot) {
    const id = snapshot.activeActionId;
    const phase = getAttackPhase(snapshot, this.attackSpecs.get(id));
    const rigBones = getRigBones(this.rig);
    if (id.startsWith("barehand_")) {
      applyPunch(rigBones, id, phase);
      return;
    }
    const motionController = this.resolveMotionController(id) || this.motionController;
    motionController.applyAttack({ id, phase, bones: rigBones, visualRoot: this.visualRoot });
  }

  applyPickupOverlay() {
    const lift = Math.sin((1 - this.pickupRemaining / .28) * Math.PI);
    this.rig.getBone("leftUpperArm").rotation.x -= lift * .55;
    this.rig.getBone("rightUpperArm").rotation.x -= lift * .55;
  }
}

export function getRigBones(rig) {
  return {
    hips: rig.getBone("hips"), spine: rig.getBone("spine"), chest: rig.getBone("chest"), head: rig.getBone("head"),
    leftShoulder: rig.getBone("leftShoulder"), rightShoulder: rig.getBone("rightShoulder"),
    leftArm: rig.getBone("leftUpperArm"), rightArm: rig.getBone("rightUpperArm"),
    leftLowerArm: rig.getBone("leftLowerArm"), rightLowerArm: rig.getBone("rightLowerArm"),
    leftHand: rig.getBone("leftHand"), rightHand: rig.getBone("rightHand"),
    leftLeg: rig.getBone("leftUpperLeg"), rightLeg: rig.getBone("rightUpperLeg"),
    leftLowerLeg: rig.getBone("leftLowerLeg"), rightLowerLeg: rig.getBone("rightLowerLeg"),
    leftFoot: rig.getBone("leftFoot"), rightFoot: rig.getBone("rightFoot")
  };
}

const MOTION_BONES = [
  "hips", "spine", "chest", "head", "leftShoulder", "rightShoulder",
  "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm", "leftHand", "rightHand",
  "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot"
];

export function getAttackPhase(snapshot, spec) {
  const elapsed = Math.max(0, (snapshot.snapshotFrame ?? snapshot.actionStartedFrame) - snapshot.actionStartedFrame);
  const startup = Math.max(1, spec?.startupFrames || 1);
  const active = Math.max(1, spec?.activeFrames || 1);
  const recovery = Math.max(1, spec?.recoveryFrames || 1);
  if (elapsed < startup) return { pose: smooth(elapsed / startup), strike: 0 };
  if (elapsed < startup + active) return { pose: 1, strike: smooth((elapsed - startup) / Math.max(1, active * .45)) };
  const release = 1 - smooth((elapsed - startup - active) / recovery);
  return { pose: release, strike: release };
}

function applyPunch(bones, id, phase) {
  const left = id.endsWith("_2");
  const arm = left ? bones.leftArm : bones.rightArm;
  arm.rotation.x = -1.3 * phase.strike;
  arm.rotation.z = (left ? .35 : -.35) * phase.pose;
  bones.chest.rotation.y = (left ? -.22 : .22) * phase.strike;
}

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
