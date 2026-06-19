const STATE_TO_MOTION = {
  Idle: "idle",
  Move: "move",
  Dash: "dash",
  Guard: "guard",
  GuardCounterWindow: "guard",
  Hitstun: "hit",
  KneelDown: "kneel",
  AirDamaged: "air",
  Down: "down",
  Stunned: "stunned",
  Dead: "dead"
};

export class MotionStateMachine {
  constructor(motionSet, player) {
    this.motionSet = motionSet;
    this.player = player;
    this.state = motionSet.defaultState;
    this.lockedUntil = 0;
    this.lastActionKey = null;
  }

  update(snapshot = {}, elapsed = 0) {
    const selected = this.selectState(snapshot);
    const actionKey = snapshot.activeActionId
      ? `${snapshot.activeActionId}:${snapshot.actionStartedFrame ?? 0}`
      : null;
    const isActionRestart = Boolean(actionKey && actionKey !== this.lastActionKey);

    if (!isActionRestart && elapsed < this.lockedUntil && selected.priority <= 4) return;
    if (!isActionRestart && selected.name === this.state) return;

    const previous = this.state;
    this.state = selected.name;
    this.lastActionKey = actionKey;
    const fade = this.motionSet.transitions?.[previous]?.[selected.name]
      ?? this.motionSet.clips[selected.name]?.fadeIn
      ?? .15;
    this.player.play(selected.name, fade, { restart: isActionRestart });

    const clip = this.motionSet.clips[selected.name];
    this.lockedUntil = clip?.interruptibleAfter != null ? elapsed + clip.interruptibleAfter : 0;
  }

  selectState(snapshot) {
    if (snapshot.state === "Dead") return { name: "dead", priority: 10 };
    if (snapshot.state === "Down") return { name: "down", priority: 9 };
    if (snapshot.state === "Stunned") return { name: "stunned", priority: 8 };
    if (["Hitstun", "KneelDown", "AirDamaged"].includes(snapshot.state)) {
      return { name: STATE_TO_MOTION[snapshot.state] || "hit", priority: 8 };
    }
    if (snapshot.activeActionId && snapshot.state?.startsWith?.("Attack")) {
      return { name: this.motionSet.clips[snapshot.activeActionId] ? snapshot.activeActionId : "guard", priority: 7 };
    }
    if (snapshot.state === "Jump") {
      const worldY = snapshot.worldY || 0;
      const velocityY = snapshot.velocity?.y || 0;
      if (worldY <= .02 && velocityY < 0) return { name: "jumpStart", priority: 6 };
      return { name: "jumpLoop", priority: 6 };
    }
    if (snapshot.state === "Dash") return { name: "dash", priority: 5 };
    if (snapshot.state === "Move") return { name: "move", priority: 4 };
    if (snapshot.state === "Guard" || snapshot.state === "GuardCounterWindow") return { name: "guard", priority: 4 };
    return { name: "idle", priority: 1 };
  }
}
