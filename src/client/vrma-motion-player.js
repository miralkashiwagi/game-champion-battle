import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMAnimationLoaderPlugin, VRMLookAtQuaternionProxy, createVRMAnimationClip } from "@pixiv/three-vrm-animation";

export class VrmaMotionPlayer {
  constructor(vrm, motionSet) {
    this.vrm = vrm;
    this.motionSet = motionSet;
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    this.actions = new Map();
    this.currentBase = null;
    this.loading = typeof window === "undefined" ? Promise.resolve() : this.loadMotionSet(motionSet);

    if (vrm.lookAt && !vrm.scene.children.some((child) => child instanceof VRMLookAtQuaternionProxy)) {
      const proxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
      proxy.name = "VRMLookAtQuaternionProxy";
      vrm.scene.add(proxy);
    }
  }

  async loadMotionSet(motionSet) {
    const entries = Object.entries(motionSet.clips);
    await Promise.all(entries.map(([name, config]) => this.loadClip(name, config)));
    if (this.actions.has(motionSet.defaultState)) this.play(motionSet.defaultState, 0, { restart: true });
    else console.warn(`[VRMA] Default state not loaded: ${motionSet.defaultState}`);
  }

  async loadClip(name, config) {
    try {
      const gltf = await this.loader.loadAsync(config.url);
      const vrmAnimation = gltf.userData.vrmAnimations?.[0];
      if (!vrmAnimation) {
        console.warn(`[VRMA] No VRMAnimation found: ${config.url}`);
        return;
      }
      const clip = createInPlaceClip(createVRMAnimationClip(vrmAnimation, this.vrm), config);
      const action = this.mixer.clipAction(clip);
      action.loop = config.loop ? THREE.LoopRepeat : THREE.LoopOnce;
      action.clampWhenFinished = !config.loop;
      action.enabled = true;
      action.setEffectiveWeight(config.weight ?? 1);
      action.setEffectiveTimeScale(config.playbackRate ?? 1);
      this.actions.set(name, { action, config });
    } catch (error) {
      console.warn(`[VRMA] Failed to load ${name}: ${config.url}`, error);
    }
  }

  play(name, fadeSeconds = .15, { restart = false } = {}) {
    const next = this.actions.get(name);
    if (!next) {
      if (this.motionSet.clips[name]) return;
      console.warn(`[VRMA] Motion not registered: ${name}`);
      return;
    }
    if (!restart && this.currentBase === name) return;

    const current = this.currentBase ? this.actions.get(this.currentBase) : null;
    next.action.reset();
    next.action.enabled = true;
    next.action.setEffectiveWeight(next.config.weight ?? 1);
    next.action.setEffectiveTimeScale(next.config.playbackRate ?? 1);
    next.action.fadeIn(fadeSeconds);
    next.action.play();
    if (current && current.action !== next.action) current.action.fadeOut(fadeSeconds);
    this.currentBase = name;
  }

  update(deltaSeconds) {
    this.mixer.update(deltaSeconds);
    this.vrm.update(deltaSeconds);
  }

  playPickup() {
    this.play("getUp", .08, { restart: true });
  }

  stopAll() {
    for (const { action } of this.actions.values()) action.stop();
    this.currentBase = null;
  }

  dispose() {
    this.stopAll();
    this.mixer.stopAllAction();
    this.actions.clear();
  }
}

export function createInPlaceClip(clip, config = {}) {
  if (config.rootMotion === "clip") return clip;
  let changed = false;
  const tracks = clip.tracks.flatMap((track) => {
    if (!track.name.endsWith(".position")) return [track];
    changed = true;
    if (config.rootMotion === "none") return [];
    return [createVerticalPoseTrack(track)];
  });
  if (!changed) return clip;
  return new THREE.AnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
}

function createVerticalPoseTrack(track) {
  if (!(track instanceof THREE.VectorKeyframeTrack)) return track;
  const values = track.values.slice();
  const baseX = values[0] ?? 0;
  const baseZ = values[2] ?? 0;
  for (let index = 0; index < values.length; index += 3) {
    values[index] = baseX;
    values[index + 2] = baseZ;
  }
  return new THREE.VectorKeyframeTrack(track.name, track.times.slice(), values, track.getInterpolation());
}
