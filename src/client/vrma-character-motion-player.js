import { MotionStateMachine } from "./motion-state-machine.js";
import { VrmaMotionPlayer } from "./vrma-motion-player.js";

export class VrmaCharacterMotionPlayer {
  constructor(vrm, motionSet) {
    this.kind = "vrma";
    this.motionSet = motionSet;
    this.vrmaPlayer = new VrmaMotionPlayer(vrm, motionSet);
    this.stateMachine = new MotionStateMachine(motionSet, this.vrmaPlayer);
  }

  update(snapshot, delta, elapsed) {
    this.stateMachine.update(snapshot, elapsed);
    this.vrmaPlayer.update(delta);
  }

  playPickup() {
    this.vrmaPlayer.playPickup();
  }

  dispose() {
    this.vrmaPlayer.dispose();
  }
}
