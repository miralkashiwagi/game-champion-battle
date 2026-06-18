const STATE_MOTIONS = {
  Idle: "idle", Move: "move", Dash: "dash", Jump: "jump", Guard: "guard", GuardCounterWindow: "guard",
  Hitstun: "hit", KneelDown: "kneel", AirDamaged: "air", Down: "down",
  Stunned: "stunned", Dead: "dead"
};

const DEFAULT_STATE_STYLE = {
  moveSpeed: 8,
  idleBob: .026,
  idleLean: .015,
  idleArmSpread: .68,
  idleLegSpread: .06,
  moveBob: .06,
  moveLean: -.12,
  moveTwist: .1,
  moveStride: .72,
  moveArmSwing: .62,
  guardLean: .08,
  guardTwist: .04,
  guardLeftArmX: -1.12,
  guardLeftArmZ: -.78,
  guardRightArmX: -.25,
  guardRightArmZ: .38,
  transitionBlend: .075,
  attackSway: .045,
  equipmentLag: .08
};

export class ScriptMotionPlayer {
  constructor(rig, visualRoot, attackSpecs, motionController, resolveMotionController) {
    this.rig = rig;
    this.visualRoot = visualRoot;
    this.attackSpecs = attackSpecs;
    this.motionController = motionController;
    this.resolveMotionController = resolveMotionController || (() => motionController);
    this.stateStyle = { ...DEFAULT_STATE_STYLE, ...(motionController?.stateStyle || {}) };
    this.baseVisualY = visualRoot.position.y;
    this.basePositions = new Map(MOTION_BONES.map((name) => [name, rig.getBone(name).position.clone()]));
    this.time = Math.random() * 10;
    this.pickupRemaining = 0;
    this.motionKey = null;
    this.lastPose = null;
    this.transition = null;
  }

  playPickup() {
    this.pickupRemaining = .28;
  }

  update(snapshot, delta) {
    this.time += delta;
    this.pickupRemaining = Math.max(0, this.pickupRemaining - delta);
    const state = snapshot?.state || "Idle";
    const motionId = snapshot?.activeActionId && state.startsWith("Attack")
      ? `attack:${snapshot.activeActionId}`
      : `state:${STATE_MOTIONS[state] || "idle"}`;
    this.beginTransition(motionId);
    this.resetPose();
    if (snapshot?.activeActionId && state.startsWith("Attack")) this.applyAttack(snapshot);
    else this.applyState(STATE_MOTIONS[state] || "idle", snapshot);
    this.applyHumanoidArmBalance();
    this.applyTransition(delta);
    if (this.pickupRemaining > 0) this.applyPickupOverlay();
    this.lastPose = this.capturePose();
  }

  beginTransition(motionId) {
    if (motionId === this.motionKey) return;
    const duration = Math.max(0, this.stateStyle.transitionBlend ?? DEFAULT_STATE_STYLE.transitionBlend);
    if (this.lastPose && duration > 0) {
      this.transition = { from: this.lastPose, elapsed: 0, duration };
    } else {
      this.transition = null;
    }
    this.motionKey = motionId;
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
    const phase = this.time * (motionId === "move" || motionId === "dash" ? style.moveSpeed : 2.3);
    if (motionId === "idle") {
      b.hips.position.y += Math.sin(phase) * style.idleBob;
      b.chest.rotation.x = style.idleLean;
      b.spine.rotation.y = Math.sin(phase * .5) * .018;
      b.head.rotation.y = -b.spine.rotation.y * .65;
      b.leftShoulder.rotation.z = -.025;
      b.rightShoulder.rotation.z = .025;
      b.leftArm.rotation.z = -style.idleArmSpread;
      b.rightArm.rotation.z = style.idleArmSpread;
      b.leftLowerArm.rotation.z = -.28;
      b.rightLowerArm.rotation.z = .28;
      b.leftLeg.rotation.z = -style.idleLegSpread;
      b.rightLeg.rotation.z = style.idleLegSpread;
    } else if (motionId === "move") {
      const stride = Math.sin(phase);
      const leftPlant = Math.max(0, -stride);
      const rightPlant = Math.max(0, stride);
      const planted = Math.max(leftPlant, rightPlant);
      const cadence = Math.cos(phase * 2);
      b.hips.position.y += (1 - Math.abs(stride)) * style.moveBob;
      b.hips.position.x += stride * .018;
      b.hips.position.z += planted * .012;
      b.spine.position.y -= planted * .01;
      b.hips.rotation.y = stride * style.moveTwist;
      b.hips.rotation.z = stride * .025;
      b.spine.rotation.x = style.moveLean * .42 - planted * .018;
      b.spine.rotation.y = -stride * style.moveTwist * .62;
      b.chest.rotation.x = style.moveLean - planted * .025;
      b.chest.rotation.y = -stride * style.moveTwist;
      b.chest.rotation.z = -stride * .018 + cadence * .008;
      b.head.rotation.x = -style.moveLean * .28 + cadence * .012;
      b.head.rotation.y = stride * style.moveTwist * .35;
      b.leftShoulder.rotation.y = stride * .08;
      b.rightShoulder.rotation.y = stride * .08;
      b.leftShoulder.rotation.z = -.08 - leftPlant * .08;
      b.rightShoulder.rotation.z = .08 + rightPlant * .08;
      b.leftLeg.rotation.x = stride * style.moveStride;
      b.rightLeg.rotation.x = -stride * style.moveStride;
      b.leftLowerLeg.rotation.x = leftPlant * 1.05 + rightPlant * .16;
      b.rightLowerLeg.rotation.x = rightPlant * 1.05 + leftPlant * .16;
      b.leftFoot.rotation.x = -leftPlant * .48 + rightPlant * .16;
      b.rightFoot.rotation.x = -rightPlant * .48 + leftPlant * .16;
      b.leftArm.rotation.x = -stride * style.moveArmSwing;
      b.rightArm.rotation.x = stride * style.moveArmSwing;
      b.leftArm.rotation.z = -.46 - leftPlant * .08;
      b.rightArm.rotation.z = .46 + rightPlant * .08;
      b.leftLowerArm.rotation.z = -.42 - rightPlant * .32;
      b.rightLowerArm.rotation.z = .42 + leftPlant * .32;
    } else if (motionId === "dash") {
      const stride = Math.sin(phase * 1.35);
      const leftPlant = Math.max(0, -stride);
      const rightPlant = Math.max(0, stride);
      const planted = Math.max(leftPlant, rightPlant);
      b.hips.position.y += (1 - Math.abs(stride)) * style.moveBob * .65;
      b.hips.position.z += .04 + planted * .025;
      b.spine.position.y -= planted * .016;
      b.hips.rotation.x = -.18 - planted * .035;
      b.hips.rotation.y = stride * style.moveTwist * .72;
      b.spine.rotation.x = -.2 - planted * .035;
      b.spine.rotation.y = -stride * style.moveTwist * .45;
      b.chest.rotation.x = -.36 - planted * .04;
      b.chest.rotation.y = -stride * style.moveTwist * .55;
      b.head.rotation.x = .1;
      b.leftShoulder.rotation.y = stride * .1;
      b.rightShoulder.rotation.y = stride * .1;
      b.leftShoulder.rotation.z = -.1 - leftPlant * .1;
      b.rightShoulder.rotation.z = .1 + rightPlant * .1;
      b.leftLeg.rotation.x = stride * .92;
      b.rightLeg.rotation.x = -stride * .92;
      b.leftLowerLeg.rotation.x = leftPlant * 1.22 + rightPlant * .2;
      b.rightLowerLeg.rotation.x = rightPlant * 1.22 + leftPlant * .2;
      b.leftFoot.rotation.x = -leftPlant * .56 + rightPlant * .18;
      b.rightFoot.rotation.x = -rightPlant * .56 + leftPlant * .18;
      b.leftArm.rotation.x = -stride * .78 - .18;
      b.rightArm.rotation.x = stride * .78 - .18;
      b.leftArm.rotation.z = -.52 - leftPlant * .08;
      b.rightArm.rotation.z = .52 + rightPlant * .08;
      b.leftLowerArm.rotation.z = -.5 - rightPlant * .28;
      b.rightLowerArm.rotation.z = .5 + leftPlant * .28;
    } else if (motionId === "jump") {
      const verticalVelocity = snapshot?.velocity?.y || 0;
      const rising = clamp01(-verticalVelocity / 10.5);
      const falling = clamp01(verticalVelocity / 10);
      b.hips.position.y += .04 + rising * .05;
      b.hips.rotation.x = -.08 - rising * .1 + falling * .08;
      b.spine.rotation.x = -.08 - rising * .08 + falling * .1;
      b.chest.rotation.x = -.16 - rising * .12 + falling * .16;
      b.head.rotation.x = .08 + rising * .06 - falling * .04;
      b.leftShoulder.rotation.z = -.18;
      b.rightShoulder.rotation.z = .18;
      b.leftArm.rotation.x = -.28 - rising * .18 + falling * .24;
      b.rightArm.rotation.x = .28 + rising * .18 - falling * .24;
      b.leftArm.rotation.z = -.62;
      b.rightArm.rotation.z = .62;
      b.leftLowerArm.rotation.z = -.42;
      b.rightLowerArm.rotation.z = .42;
      b.leftLeg.rotation.x = .34 + rising * .26 - falling * .12;
      b.rightLeg.rotation.x = -.26 - rising * .18 + falling * .22;
      b.leftLowerLeg.rotation.x = .78 + rising * .18;
      b.rightLowerLeg.rotation.x = .42 + falling * .2;
      b.leftFoot.rotation.x = -.28;
      b.rightFoot.rotation.x = -.2;
    } else if (motionId === "guard") {
      b.chest.rotation.x = style.guardLean;
      b.chest.rotation.y = style.guardTwist;
      b.leftShoulder.rotation.y = -.16;
      b.rightShoulder.rotation.y = .12;
      b.leftShoulder.rotation.z = -.2;
      b.rightShoulder.rotation.z = .14;
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
      b.leftShoulder.rotation.z = -.22;
      b.rightShoulder.rotation.z = .22;
      b.leftArm.rotation.x = .28;
      b.rightArm.rotation.x = -.22;
      b.leftArm.rotation.z = -.74;
      b.rightArm.rotation.z = .74;
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
      b.leftShoulder.rotation.z = -.2;
      b.rightShoulder.rotation.z = .2;
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
      b.leftShoulder.rotation.z = -.26;
      b.rightShoulder.rotation.z = .26;
      b.leftArm.rotation.x = .42 + flutter * .12;
      b.rightArm.rotation.x = -.3 - flutter * .1;
      b.leftArm.rotation.z = -.86;
      b.rightArm.rotation.z = .82;
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
      b.leftShoulder.rotation.z = -.18;
      b.rightShoulder.rotation.z = .18;
      b.leftArm.rotation.z = -.7;
      b.rightArm.rotation.z = .7;
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
      b.leftShoulder.rotation.z = -.14;
      b.rightShoulder.rotation.z = .14;
      b.leftArm.rotation.z = -.62;
      b.rightArm.rotation.z = .64;
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
      applyPunch(rigBones, id, phase, this.visualRoot);
      this.applyAttackOverlay(phase);
      return;
    }
    if (id === "common_guard_counter") {
      applyGuardCounter(rigBones, phase, this.visualRoot);
      this.applyAttackOverlay(phase);
      return;
    }
    const motionController = this.resolveMotionController(id) || this.motionController;
    motionController.applyAttack({ id, phase, bones: rigBones, visualRoot: this.visualRoot });
    this.applyAttackOverlay(phase);
  }

  applyAttackOverlay(phase) {
    const style = this.stateStyle;
    const lag = phase.followThrough * (style.equipmentLag ?? DEFAULT_STATE_STYLE.equipmentLag);
    const sway = Math.sin(phase.progress * Math.PI * 2) * phase.followThrough * (style.attackSway ?? DEFAULT_STATE_STYLE.attackSway);
    const b = getRigBones(this.rig);
    this.visualRoot.rotation.z += sway * .35;
    b.chest.rotation.z += sway;
    b.leftShoulder.rotation.z -= lag * .28;
    b.rightShoulder.rotation.z += lag * .28;
    b.leftLowerArm.rotation.x += lag * .18;
    b.rightLowerArm.rotation.x += lag * .18;
  }

  applyHumanoidArmBalance() {
    const b = getRigBones(this.rig);
    distributeArmToShoulder(b.leftShoulder, b.leftArm, b.leftLowerArm, -1);
    distributeArmToShoulder(b.rightShoulder, b.rightArm, b.rightLowerArm, 1);
  }

  applyPickupOverlay() {
    const lift = Math.sin((1 - this.pickupRemaining / .28) * Math.PI);
    const settle = Math.sin((1 - this.pickupRemaining / .28) * Math.PI * 2) * (1 - this.pickupRemaining / .28);
    this.rig.getBone("leftUpperArm").rotation.x -= lift * .55;
    this.rig.getBone("rightUpperArm").rotation.x -= lift * .55;
    this.rig.getBone("leftLowerArm").rotation.z -= lift * .18;
    this.rig.getBone("rightLowerArm").rotation.z += lift * .18;
    this.rig.getBone("chest").rotation.z += settle * .035;
  }

  applyTransition(delta) {
    if (!this.transition) return;
    this.transition.elapsed += delta;
    const alpha = smooth(this.transition.elapsed / this.transition.duration);
    const current = this.capturePose();
    this.blendFrom(this.transition.from, current, alpha);
    if (alpha >= 1) this.transition = null;
  }

  capturePose() {
    const bones = Object.fromEntries(MOTION_BONES.map((name) => {
      const bone = this.rig.getBone(name);
      return [name, {
        position: { x: bone.position.x, y: bone.position.y, z: bone.position.z },
        rotation: { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z }
      }];
    }));
    return {
      visualRoot: {
        position: { x: this.visualRoot.position.x, y: this.visualRoot.position.y, z: this.visualRoot.position.z },
        rotation: { x: this.visualRoot.rotation.x, y: this.visualRoot.rotation.y, z: this.visualRoot.rotation.z }
      },
      bones
    };
  }

  blendFrom(from, to, alpha) {
    setTransform(this.visualRoot, from.visualRoot, to.visualRoot, alpha);
    for (const name of MOTION_BONES) setTransform(this.rig.getBone(name), from.bones[name], to.bones[name], alpha);
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
  const total = startup + active + recovery;
  const progress = clamp01(elapsed / total);
  const windup = elapsed < startup ? smooth(elapsed / startup) : 1 - smooth((elapsed - startup) / Math.max(1, active + recovery));
  const activeElapsed = elapsed - startup;
  const strike = elapsed < startup ? 0 : elapsed < startup + active ? smooth(activeElapsed / Math.max(1, active * .45)) : 1 - smooth((elapsed - startup - active) / recovery);
  const impact = elapsed < startup || elapsed >= startup + active ? 0 : pulse(activeElapsed / active, .12, .58);
  const followThrough = elapsed < startup ? 0 : elapsed < startup + active ? smooth(activeElapsed / active) : 1 - smooth((elapsed - startup - active) / recovery);
  const recover = elapsed < startup + active ? 0 : smooth((elapsed - startup - active) / recovery);
  if (elapsed < startup) return { pose: smooth(elapsed / startup), strike: 0, windup, impact, followThrough, recover, progress };
  if (elapsed < startup + active) return { pose: 1, strike, windup, impact, followThrough, recover, progress };
  const release = 1 - smooth((elapsed - startup - active) / recovery);
  return { pose: release, strike: release, windup, impact, followThrough, recover, progress };
}

function applyPunch(bones, id, phase, visualRoot) {
  const step = Number(id.match(/_(\d)$/)?.[1] || 1);
  const left = step !== 2;
  const cross = step === 2;
  const hook = step === 3;
  const side = left ? -1 : 1;
  const leadShoulder = left ? bones.leftShoulder : bones.rightShoulder;
  const rearShoulder = left ? bones.rightShoulder : bones.leftShoulder;
  const leadArm = left ? bones.leftArm : bones.rightArm;
  const rearArm = left ? bones.rightArm : bones.leftArm;
  const leadLowerArm = left ? bones.leftLowerArm : bones.rightLowerArm;
  const rearLowerArm = left ? bones.rightLowerArm : bones.leftLowerArm;
  const leadLeg = left ? bones.leftLeg : bones.rightLeg;
  const rearLeg = left ? bones.rightLeg : bones.leftLeg;
  const leadLowerLeg = left ? bones.leftLowerLeg : bones.rightLowerLeg;
  const rearLowerLeg = left ? bones.rightLowerLeg : bones.leftLowerLeg;
  const leadFoot = left ? bones.leftFoot : bones.rightFoot;
  const rearFoot = left ? bones.rightFoot : bones.leftFoot;
  const windup = phase.windup;
  const strike = phase.strike;
  const impact = phase.impact;
  const follow = phase.followThrough;
  const cover = 1 - phase.recover;
  const leadBend = left ? -1 : 1;
  const rearBend = -leadBend;
  const leadGuardBend = .72 * (1 - strike) + .14 * strike;
  const rearGuardBend = .76 * cover;

  if (hook) {
    visualRoot.position.z = .05 * windup + .16 * impact;
    bones.hips.position.y -= .035 * windup + .02 * impact;
    bones.hips.rotation.y = .2 * windup - .46 * strike;
    bones.hips.rotation.z = -.08 * impact;
    bones.chest.rotation.x = -.03 * windup;
    bones.chest.rotation.y = .32 * windup - .72 * strike;
    bones.chest.rotation.z = -.18 * impact;
    bones.head.rotation.y = -bones.chest.rotation.y * .24;
    bones.head.rotation.z = .08 * impact;

    leadShoulder.rotation.y = -.3 * windup - .28 * strike;
    leadShoulder.rotation.z = -.32 - .18 * windup - .34 * impact;
    leadShoulder.rotation.x = .08 + .08 * impact;
    leadArm.rotation.x = -.9 * windup - .58 * strike;
    leadArm.rotation.y = -.34 * strike;
    leadArm.rotation.z = -.68 * windup - .92 * cover;
    leadLowerArm.rotation.x = .1 * impact;
    leadLowerArm.rotation.z = leadBend * (.88 + .08 * windup);
    bones.leftHand.rotation.y = -.18 * strike;
    bones.leftHand.rotation.z = -.28 * impact;

    rearShoulder.rotation.y = .12 * cover;
    rearShoulder.rotation.z = .24 + .16 * windup;
    rearArm.rotation.x = -.82 * cover - .12 * windup;
    rearArm.rotation.z = .8 * cover;
    rearLowerArm.rotation.z = rearBend * rearGuardBend;

    leadLeg.rotation.x = -.18 * strike;
    rearLeg.rotation.x = .22 * windup + .08 * impact;
    leadLowerLeg.rotation.x = .22 * impact;
    rearLowerLeg.rotation.x = .2 * windup;
    leadFoot.rotation.x = -.16 * impact;
    rearFoot.rotation.x = -.08 * windup;
    return;
  }

  if (cross) {
    visualRoot.position.z = .06 * windup + .22 * strike + .04 * impact;
    bones.hips.position.y -= .03 * windup + .02 * impact;
    bones.hips.rotation.y = .24 * windup - .54 * strike;
    bones.chest.rotation.x = -.04 * windup - .02 * impact;
    bones.chest.rotation.y = .34 * windup - .78 * strike;
    bones.chest.rotation.z = .08 * impact;
    bones.head.rotation.y = -bones.chest.rotation.y * .22;

    leadShoulder.rotation.y = -.34 * windup - .34 * strike;
    leadShoulder.rotation.z = .22 + .16 * windup + .3 * impact;
    leadShoulder.rotation.x = .08 * impact;
    leadArm.rotation.x = -.96 * windup - 1.02 * strike;
    leadArm.rotation.y = .08 * strike;
    leadArm.rotation.z = .48 * windup - .34 * strike;
    leadLowerArm.rotation.z = leadBend * leadGuardBend;
    bones.rightHand.rotation.z = .26 * impact;

    rearShoulder.rotation.y = -.14 * cover;
    rearShoulder.rotation.z = -.22 - .16 * cover;
    rearArm.rotation.x = -.82 * cover;
    rearArm.rotation.z = -.84 * cover;
    rearLowerArm.rotation.z = rearBend * rearGuardBend;

    leadLeg.rotation.x = -.16 * strike - .06 * impact;
    rearLeg.rotation.x = .28 * windup + .12 * strike;
    leadLowerLeg.rotation.x = .2 * strike;
    rearLowerLeg.rotation.x = .22 * windup + .12 * impact;
    leadFoot.rotation.x = -.14 * impact;
    rearFoot.rotation.x = -.16 * strike;
    return;
  }

  visualRoot.position.z = .04 * windup + .14 * strike + .02 * impact;
  bones.hips.position.y -= .018 * windup;
  bones.hips.rotation.y = -.08 * windup + .18 * strike;
  bones.chest.rotation.x = -.02 * windup;
  bones.chest.rotation.y = -.14 * windup + .32 * strike;
  bones.chest.rotation.z = -.05 * impact;
  bones.head.rotation.y = -bones.chest.rotation.y * .25;

  leadShoulder.rotation.y = -.28 * windup - .2 * strike;
  leadShoulder.rotation.z = -.22 - .16 * windup - .28 * impact;
  leadShoulder.rotation.x = .06 * impact;
  leadArm.rotation.x = -.92 * windup - .9 * strike;
  leadArm.rotation.y = -.04 * strike;
  leadArm.rotation.z = -.54 * windup - .28 * strike;
  leadLowerArm.rotation.z = leadBend * leadGuardBend;
  bones.leftHand.rotation.z = -.2 * impact;

  rearShoulder.rotation.y = .12 * cover;
  rearShoulder.rotation.z = .24 + .14 * cover;
  rearArm.rotation.x = -.82 * cover;
  rearArm.rotation.z = .78 * cover;
  rearLowerArm.rotation.z = rearBend * rearGuardBend;

  leadLeg.rotation.x = -.1 * strike;
  rearLeg.rotation.x = .16 * windup + .06 * impact;
  leadLowerLeg.rotation.x = .14 * impact;
  rearLowerLeg.rotation.x = .16 * windup;
  leadFoot.rotation.x = -.1 * impact;
  rearFoot.rotation.x = -.08 * windup;
}

function applyGuardCounter(bones, phase, visualRoot) {
  const windup = phase.pose;
  const strike = phase.strike;
  bones.hips.rotation.y = .18 * strike;
  bones.chest.rotation.x = -.08;
  bones.chest.rotation.y = .42 * strike - .2 * windup;
  bones.leftShoulder.rotation.y = -.08;
  bones.rightShoulder.rotation.y = .16 * strike;
  bones.leftShoulder.rotation.z = -.2;
  bones.rightShoulder.rotation.z = .18 + .1 * strike;
  bones.leftArm.rotation.x = -.52;
  bones.leftArm.rotation.z = -.72;
  bones.rightArm.rotation.x = -.18 - .68 * strike;
  bones.rightArm.rotation.z = .42 - .16 * strike;
  bones.leftLowerArm.rotation.z = -.62;
  bones.rightLowerArm.rotation.z = .34 + .24 * strike;
  bones.leftLeg.rotation.x = -.16 * strike;
  bones.rightLeg.rotation.x = .18 * strike;
  bones.leftLowerLeg.rotation.x = .24 * strike;
  bones.rightLowerLeg.rotation.x = .34 * strike;
  visualRoot.position.z = .18 * strike;
}

function distributeArmToShoulder(shoulder, arm, lowerArm, side) {
  const armForward = arm.rotation.x;
  const armSpread = arm.rotation.z;
  shoulder.rotation.y += armForward * .16;
  shoulder.rotation.z += armSpread * .24;
  shoulder.rotation.x += Math.abs(armSpread) * .035;
  arm.rotation.x *= .82;
  arm.rotation.z *= .74;
  lowerArm.rotation.z += side * Math.max(.08, Math.abs(armForward) * .08 + Math.abs(armSpread) * .06);
}

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function pulse(value, start, end) {
  if (value <= start || value >= end) return 0;
  const t = (value - start) / (end - start);
  return Math.sin(t * Math.PI);
}

function setTransform(object, from, to, alpha) {
  object.position.set(
    mix(from.position.x, to.position.x, alpha),
    mix(from.position.y, to.position.y, alpha),
    mix(from.position.z, to.position.z, alpha)
  );
  object.rotation.set(
    mix(from.rotation.x, to.rotation.x, alpha),
    mix(from.rotation.y, to.rotation.y, alpha),
    mix(from.rotation.z, to.rotation.z, alpha)
  );
}

function mix(from, to, alpha) {
  return from + (to - from) * alpha;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
