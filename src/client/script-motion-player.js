const STATE_MOTIONS = {
  Idle: "idle",
  Move: "move",
  Guard: "guard",
  GuardCounterWindow: "guard",
  Hitstun: "hit",
  KneelDown: "down",
  AirDamaged: "hit",
  Down: "down",
  Stunned: "hit",
  Dead: "dead"
};

export class ScriptMotionPlayer {
  constructor(rig, visualRoot, attackSpecs) {
    this.rig = rig;
    this.visualRoot = visualRoot;
    this.attackSpecs = attackSpecs;
    this.baseVisualY = visualRoot.position.y;
    this.time = Math.random() * 10;
    this.pickupRemaining = 0;
    this.lastActionKey = null;
  }

  playPickup() {
    this.pickupRemaining = .28;
  }

  update(snapshot, delta, elapsed) {
    this.time += delta;
    this.pickupRemaining = Math.max(0, this.pickupRemaining - delta);
    this.resetPose();

    const state = snapshot?.state || "Idle";
    const actionKey = snapshot?.activeActionId && snapshot?.actionStartedFrame != null
      ? `${snapshot.activeActionId}:${snapshot.actionStartedFrame}`
      : null;
    if (actionKey !== this.lastActionKey) this.lastActionKey = actionKey;

    if (snapshot?.activeActionId && state.startsWith("Attack")) {
      this.applyAttack(snapshot);
    } else {
      this.applyState(STATE_MOTIONS[state] || "idle", elapsed);
    }
    if (this.pickupRemaining > 0) this.applyPickupOverlay();
  }

  resetPose() {
    this.visualRoot.position.set(0, this.baseVisualY, 0);
    this.visualRoot.rotation.set(0, 0, 0);
    const chest = this.rig.getBone("chest");
    const head = this.rig.getBone("head");
    const leftArm = this.rig.getBone("leftUpperArm");
    const rightArm = this.rig.getBone("rightUpperArm");
    const leftLeg = this.rig.getBone("leftUpperLeg");
    const rightLeg = this.rig.getBone("rightUpperLeg");
    chest.position.y = 1.18;
    chest.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    leftArm.rotation.set(0, 0, 0);
    rightArm.rotation.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
  }

  applyState(motionId, elapsed) {
    const chest = this.rig.getBone("chest");
    const leftArm = this.rig.getBone("leftUpperArm");
    const rightArm = this.rig.getBone("rightUpperArm");
    const leftLeg = this.rig.getBone("leftUpperLeg");
    const rightLeg = this.rig.getBone("rightUpperLeg");
    const phase = this.time * (motionId === "move" ? 9 : 2.3);

    if (motionId === "idle") {
      chest.position.y += Math.sin(phase) * .025;
      leftArm.rotation.z = -.08 + Math.sin(phase) * .025;
      rightArm.rotation.z = .08 - Math.sin(phase) * .025;
    } else if (motionId === "move") {
      chest.position.y += Math.abs(Math.sin(phase)) * .055;
      leftLeg.rotation.x = Math.sin(phase) * .62;
      rightLeg.rotation.x = -Math.sin(phase) * .62;
      leftArm.rotation.x = -Math.sin(phase) * .38;
      rightArm.rotation.x = Math.sin(phase) * .38;
    } else if (motionId === "guard") {
      leftArm.rotation.x = -1.05;
      leftArm.rotation.z = -.35;
      chest.rotation.x = .08;
    } else if (motionId === "hit") {
      chest.rotation.x = -.22;
      chest.rotation.z = Math.sin(elapsed * 35) * .08;
      leftArm.rotation.z = -.65;
      rightArm.rotation.z = .65;
    } else if (motionId === "down") {
      chest.rotation.z = 1.15;
      chest.position.y = .65;
    } else if (motionId === "dead") {
      chest.rotation.z = 1.52;
      chest.position.y = .45;
    }
  }

  applyAttack(snapshot) {
    const id = snapshot.activeActionId;
    const spec = this.attackSpecs.get(id);
    const elapsedFrames = Math.max(0, (snapshot.snapshotFrame ?? snapshot.actionStartedFrame) - snapshot.actionStartedFrame);
    const total = Math.max(1, (spec?.startupFrames || 1) + (spec?.activeFrames || 1) + (spec?.recoveryFrames || 1));
    const progress = Math.min(1, elapsedFrames / total);
    const strike = snapshot.state === "AttackStartup"
      ? -smooth(progress * 2.2)
      : snapshot.state === "AttackActive"
        ? 1
        : 1 - smooth(progress);
    const chest = this.rig.getBone("chest");
    const leftArm = this.rig.getBone("leftUpperArm");
    const rightArm = this.rig.getBone("rightUpperArm");
    const leftLeg = this.rig.getBone("leftUpperLeg");
    const rightLeg = this.rig.getBone("rightUpperLeg");

    if (id.startsWith("barehand_")) {
      const left = id.endsWith("_2");
      const arm = left ? leftArm : rightArm;
      arm.rotation.x = -1.25 * strike;
      arm.rotation.z = (left ? .35 : -.35) * Math.abs(strike);
      chest.rotation.y = (left ? -.18 : .18) * strike;
      return;
    }

    if (id === "silver_thrust" || id === "silver_body_charge") {
      rightArm.rotation.x = -1.45;
      rightArm.rotation.z = -.18;
      chest.rotation.x = -.16;
      this.visualRoot.position.x = Math.max(0, strike) * .16;
      return;
    }
    if (id === "silver_headbutt") {
      chest.rotation.x = -.45 * strike;
      this.rig.getBone("head").rotation.x = .28 * strike;
      return;
    }
    if (id.startsWith("silver_")) {
      const reverse = id.endsWith("_2") || id === "silver_guard_counter";
      rightArm.rotation.x = strike * (reverse ? -1.05 : 1.25);
      rightArm.rotation.z = -.58;
      chest.rotation.y = strike * (reverse ? -.28 : .28);
      if (id.endsWith("_4") || id === "silver_slash") rightArm.rotation.z -= Math.max(0, strike) * .55;
      return;
    }

    if (id === "saladin_spiral_kick") {
      chest.rotation.y = strike * 1.2;
      rightLeg.rotation.x = -Math.max(0, strike) * 1.25;
      rightLeg.rotation.z = -.55;
      return;
    }
    if (id === "saladin_windwall") {
      leftArm.rotation.z = -.9;
      rightArm.rotation.z = .9;
      chest.rotation.y = Math.sin(progress * Math.PI * 4) * .25;
      return;
    }
    if (id === "saladin_spin") {
      this.visualRoot.rotation.y = Math.max(0, progress - .2) * Math.PI * 2;
      leftArm.rotation.z = -.8;
      rightArm.rotation.z = .8;
      return;
    }
    if (id.startsWith("saladin_")) {
      const reverse = id.endsWith("_2") || id.endsWith("_4") || id === "saladin_guard_counter";
      leftArm.rotation.x = strike * (reverse ? 1.05 : -.9);
      rightArm.rotation.x = strike * (reverse ? -1.05 : .9);
      leftArm.rotation.z = -.42;
      rightArm.rotation.z = .42;
      chest.rotation.y = strike * (reverse ? -.35 : .35);
      this.visualRoot.position.x = Math.max(0, strike) * .08;
      return;
    }

    rightArm.rotation.x = strike;
    rightArm.rotation.z = -.55;
    chest.rotation.y = strike * .18;
  }

  applyPickupOverlay() {
    const progress = 1 - this.pickupRemaining / .28;
    const lift = Math.sin(progress * Math.PI);
    this.rig.getBone("leftUpperArm").rotation.x -= lift * .55;
    this.rig.getBone("rightUpperArm").rotation.x -= lift * .55;
  }
}

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}
