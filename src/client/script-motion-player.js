const STATE_MOTIONS = {
  Idle: "idle", Move: "move", Guard: "guard", GuardCounterWindow: "guard",
  Hitstun: "hit", KneelDown: "kneel", AirDamaged: "air", Down: "down",
  Stunned: "stunned", Dead: "dead"
};

export class ScriptMotionPlayer {
  constructor(characterId, rig, visualRoot, attackSpecs) {
    this.characterId = characterId;
    this.rig = rig;
    this.visualRoot = visualRoot;
    this.attackSpecs = attackSpecs;
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
    const b = bones(this.rig);
    const agile = this.characterId === "saladin";
    const phase = this.time * (motionId === "move" ? (agile ? 11 : 8) : 2.3);
    if (motionId === "idle") {
      b.chest.position.y += Math.sin(phase) * (agile ? .018 : .026);
      b.chest.rotation.x = agile ? -.055 : .015;
      b.leftArm.rotation.z = agile ? -.16 : -.08;
      b.rightArm.rotation.z = agile ? .16 : .08;
      b.leftLeg.rotation.z = agile ? -.035 : -.06;
      b.rightLeg.rotation.z = agile ? .035 : .06;
    } else if (motionId === "move") {
      const stride = Math.sin(phase);
      b.chest.position.y += Math.abs(stride) * (agile ? .045 : .06);
      b.chest.rotation.x = agile ? -.12 : .04;
      b.chest.rotation.y = stride * (agile ? .08 : .035);
      b.leftLeg.rotation.x = stride * (agile ? .82 : .58);
      b.rightLeg.rotation.x = -stride * (agile ? .82 : .58);
      b.leftArm.rotation.x = -stride * (agile ? .48 : .3);
      b.rightArm.rotation.x = stride * (agile ? .48 : .3);
    } else if (motionId === "guard") {
      b.chest.rotation.x = agile ? -.14 : .08;
      b.chest.rotation.y = agile ? -.12 : .04;
      b.leftArm.rotation.x = agile ? -.72 : -1.12;
      b.leftArm.rotation.z = agile ? -.62 : -.4;
      b.rightArm.rotation.x = agile ? -.58 : -.25;
      b.rightArm.rotation.z = agile ? .42 : -.12;
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
    const spec = this.attackSpecs.get(id);
    const phase = attackPhase(snapshot, spec);
    const b = bones(this.rig);
    if (id.startsWith("barehand_")) return this.punch(b, id, phase);
    if (this.characterId === "silver_knight") this.silverAttack(b, id, phase);
    else this.saladinAttack(b, id, phase);
  }

  silverAttack(b, id, phase) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.leftLeg.rotation.z = -.14;
    b.rightLeg.rotation.z = .14;
    if (id === "silver_body_charge") {
      b.chest.position.y -= .18 * windup;
      b.chest.rotation.x = .38 * windup - .58 * strike;
      b.leftArm.rotation.x = -.78;
      b.rightArm.rotation.x = -.88;
      this.visualRoot.position.z = .32 * strike;
      return;
    }
    if (id === "silver_thrust") {
      b.chest.rotation.y = -.42 * windup + .46 * strike;
      b.rightArm.rotation.x = -.35 - 1.25 * strike;
      b.rightArm.rotation.z = -.34;
      b.leftArm.rotation.x = -1.02;
      this.visualRoot.position.z = .2 * strike;
      return;
    }
    if (id === "silver_headbutt") {
      b.chest.position.y -= .1 * windup;
      b.chest.rotation.x = .24 * windup - .62 * strike;
      b.head.rotation.x = -.18 * windup + .38 * strike;
      this.visualRoot.position.z = .14 * strike;
      return;
    }
    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    const reverse = step % 2 === 0;
    const rising = step === 4 || id === "silver_guard_counter";
    b.chest.rotation.y = (reverse ? -.5 : .5) * (strike - windup * .55);
    b.rightArm.rotation.x = (reverse ? -1.15 : 1.2) * strike + (reverse ? .55 : -.55) * windup;
    b.rightArm.rotation.z = rising ? -.95 * strike : -.52;
    b.leftArm.rotation.x = -1.02;
    b.leftLeg.rotation.x = -.18 * strike;
    b.rightLeg.rotation.x = .16 * strike;
    if (id === "silver_slash") this.visualRoot.rotation.y = strike * .35;
  }

  saladinAttack(b, id, phase) {
    const windup = phase.pose;
    const strike = phase.strike;
    b.chest.rotation.x = -.12;
    b.leftLeg.rotation.z = -.1;
    b.rightLeg.rotation.z = .1;
    if (id === "saladin_spiral_kick") {
      this.visualRoot.rotation.y = strike * 1.6;
      b.chest.rotation.y = .55 * windup - 1.1 * strike;
      b.rightLeg.rotation.x = -1.48 * strike;
      b.rightLeg.rotation.z = -.82 * strike;
      b.leftArm.rotation.z = -.7;
      b.rightArm.rotation.z = .7;
      return;
    }
    if (id === "saladin_windwall") {
      this.visualRoot.rotation.y = strike * Math.PI * 2;
      b.leftArm.rotation.z = -.95;
      b.rightArm.rotation.z = .95;
      b.leftLeg.rotation.z = -.18;
      b.rightLeg.rotation.z = .18;
      return;
    }
    if (id === "saladin_spin") {
      this.visualRoot.rotation.y = strike * Math.PI * 2;
      b.leftArm.rotation.x = -1.05;
      b.rightArm.rotation.x = 1.05;
      b.leftArm.rotation.z = -.68;
      b.rightArm.rotation.z = .68;
      b.chest.position.y -= .08 * windup;
      return;
    }
    const step = Number(id.match(/_(\d)$/)?.[1] || 1);
    const reverse = step % 2 === 0 || id === "saladin_guard_counter";
    const crossing = id === "saladin_lunar_slash" || id === "saladin_forward_cut" || id === "saladin_guard_counter";
    b.chest.rotation.y = (reverse ? -.62 : .62) * (strike - windup * .6);
    b.leftArm.rotation.x = (reverse ? .45 : -1.15) * strike;
    b.rightArm.rotation.x = (reverse ? -1.15 : .45) * strike;
    b.leftArm.rotation.z = -.5;
    b.rightArm.rotation.z = .5;
    b.leftLeg.rotation.x = -.28 * strike;
    b.rightLeg.rotation.x = .26 * strike;
    this.visualRoot.position.z = (crossing ? .28 : .1) * strike;
    if (id === "saladin_lunar_slash") this.visualRoot.rotation.y = strike * .22 * (reverse ? -1 : 1);
  }

  punch(b, id, phase) {
    const left = id.endsWith("_2");
    const arm = left ? b.leftArm : b.rightArm;
    arm.rotation.x = -1.3 * phase.strike;
    arm.rotation.z = (left ? .35 : -.35) * phase.pose;
    b.chest.rotation.y = (left ? -.22 : .22) * phase.strike;
  }

  applyPickupOverlay() {
    const lift = Math.sin((1 - this.pickupRemaining / .28) * Math.PI);
    this.rig.getBone("leftUpperArm").rotation.x -= lift * .55;
    this.rig.getBone("rightUpperArm").rotation.x -= lift * .55;
  }
}

function bones(rig) {
  return {
    chest: rig.getBone("chest"), head: rig.getBone("head"),
    leftArm: rig.getBone("leftUpperArm"), rightArm: rig.getBone("rightUpperArm"),
    leftLeg: rig.getBone("leftUpperLeg"), rightLeg: rig.getBone("rightUpperLeg")
  };
}

function attackPhase(snapshot, spec) {
  const elapsed = Math.max(0, (snapshot.snapshotFrame ?? snapshot.actionStartedFrame) - snapshot.actionStartedFrame);
  const startup = Math.max(1, spec?.startupFrames || 1);
  const active = Math.max(1, spec?.activeFrames || 1);
  const recovery = Math.max(1, spec?.recoveryFrames || 1);
  if (elapsed < startup) return { pose: smooth(elapsed / startup), strike: 0 };
  if (elapsed < startup + active) return { pose: 1, strike: smooth((elapsed - startup) / Math.max(1, active * .45)) };
  const release = 1 - smooth((elapsed - startup - active) / recovery);
  return { pose: release, strike: release };
}

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}
