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
  moveLean: .04,
  moveTwist: .035,
  moveStride: .58,
  moveArmSwing: .3,
  guardLean: .08,
  guardTwist: .04,
  guardLeftArmX: -1.12,
  guardLeftArmZ: -.4,
  guardRightArmX: -.25,
  guardRightArmZ: -.12
};

export class ScriptMotionPlayer {
  constructor(rig, visualRoot, attackSpecs, motionController) {
    this.rig = rig;
    this.visualRoot = visualRoot;
    this.attackSpecs = attackSpecs;
    this.motionController = motionController;
    this.stateStyle = { ...DEFAULT_STATE_STYLE, ...motionController.stateStyle };
    this.baseVisualY = visualRoot.position.y;
    this.baseChestY = rig.getBone("chest").position.y;
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
    else this.applyState(STATE_MOTIONS[state] || "idle");
    if (this.pickupRemaining > 0) this.applyPickupOverlay();
  }

  resetPose() {
    this.visualRoot.position.set(0, this.baseVisualY, 0);
    this.visualRoot.rotation.set(0, 0, 0);
    for (const name of ["chest", "head", "leftUpperArm", "rightUpperArm", "leftUpperLeg", "rightUpperLeg"]) {
      this.rig.getBone(name).rotation.set(0, 0, 0);
    }
    this.rig.getBone("chest").position.y = this.baseChestY;
  }

  applyState(motionId) {
    const b = getRigBones(this.rig);
    const style = this.stateStyle;
    const phase = this.time * (motionId === "move" ? style.moveSpeed : 2.3);
    if (motionId === "idle") {
      b.chest.position.y += Math.sin(phase) * style.idleBob;
      b.chest.rotation.x = style.idleLean;
      b.leftArm.rotation.z = -style.idleArmSpread;
      b.rightArm.rotation.z = style.idleArmSpread;
      b.leftLeg.rotation.z = -style.idleLegSpread;
      b.rightLeg.rotation.z = style.idleLegSpread;
    } else if (motionId === "move") {
      const stride = Math.sin(phase);
      b.chest.position.y += Math.abs(stride) * style.moveBob;
      b.chest.rotation.x = style.moveLean;
      b.chest.rotation.y = stride * style.moveTwist;
      b.leftLeg.rotation.x = stride * style.moveStride;
      b.rightLeg.rotation.x = -stride * style.moveStride;
      b.leftArm.rotation.x = -stride * style.moveArmSwing;
      b.rightArm.rotation.x = stride * style.moveArmSwing;
    } else if (motionId === "guard") {
      b.chest.rotation.x = style.guardLean;
      b.chest.rotation.y = style.guardTwist;
      b.leftArm.rotation.x = style.guardLeftArmX;
      b.leftArm.rotation.z = style.guardLeftArmZ;
      b.rightArm.rotation.x = style.guardRightArmX;
      b.rightArm.rotation.z = style.guardRightArmZ;
      b.leftLeg.rotation.z = -.14;
      b.rightLeg.rotation.z = .14;
    } else if (motionId === "hit") {
      b.chest.rotation.x = -.32;
      b.chest.rotation.z = Math.sin(this.time * 34) * .08;
      b.leftArm.rotation.z = -.7;
      b.rightArm.rotation.z = .7;
    } else if (motionId === "kneel") {
      b.chest.position.y -= .35;
      b.chest.rotation.x = .22;
      b.leftLeg.rotation.x = 1.05;
      b.rightLeg.rotation.x = -.3;
    } else if (motionId === "air") {
      b.chest.rotation.z = -.28;
      b.leftLeg.rotation.x = .55;
      b.rightLeg.rotation.x = -.5;
      b.leftArm.rotation.z = -.8;
      b.rightArm.rotation.z = .75;
    } else if (motionId === "stunned") {
      b.chest.rotation.z = Math.sin(this.time * 9) * .12;
      b.head.rotation.z = -b.chest.rotation.z * 1.8;
      b.leftArm.rotation.z = -.5;
      b.rightArm.rotation.z = .5;
    } else if (motionId === "down" || motionId === "dead") {
      b.chest.rotation.z = motionId === "dead" ? 1.52 : 1.22;
      b.chest.position.y = motionId === "dead" ? .43 : .62;
      b.leftLeg.rotation.x = .28;
      b.rightLeg.rotation.x = -.2;
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
    this.motionController.applyAttack({ id, phase, bones: rigBones, visualRoot: this.visualRoot });
  }

  applyPickupOverlay() {
    const lift = Math.sin((1 - this.pickupRemaining / .28) * Math.PI);
    this.rig.getBone("leftUpperArm").rotation.x -= lift * .55;
    this.rig.getBone("rightUpperArm").rotation.x -= lift * .55;
  }
}

export function getRigBones(rig) {
  return {
    chest: rig.getBone("chest"), head: rig.getBone("head"),
    leftArm: rig.getBone("leftUpperArm"), rightArm: rig.getBone("rightUpperArm"),
    leftLeg: rig.getBone("leftUpperLeg"), rightLeg: rig.getBone("rightUpperLeg")
  };
}

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
