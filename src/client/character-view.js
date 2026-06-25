import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { COMMON_BAREHAND_COMBO, COMMON_GUARD_COUNTER, COMMON_WAKE_UP_ATTACK } from "../characters/common.ts";
import { CHARACTER_REGISTRY } from "../characters/registry.ts";
import { EQUIPMENT_REGISTRY } from "../equipment/registry.ts";
import { ScriptRigAdapter } from "./script-rig-adapter.js";
import { ScriptMotionPlayer } from "./script-motion-player.js";
import { VrmaCharacterMotionPlayer } from "./vrma-character-motion-player.js";
import { getVrmaMotionSet } from "./vrma-motion-registry.js";

const EQUIPMENT_SLOTS = ["cloak", "head", "armor", "weapon"];
const SLOT_SOCKETS = {
  cloak: "back",
  head: "headAccessory",
  armor: "chestArmor",
  weapon: "rightHandGrip"
};

const SHARED_FALLBACK_PALETTE = {
  cloth: 0x777b80, clothDark: 0x464a4f, metal: 0xa5a9ad,
  metalDark: 0x3c4146, plume: 0x777b80, glow: 0xffffff
};

const SHARED_FALLBACK_MODEL = {
  proportions: { shoulderWidth: 1, torsoHeight: 1.04, torsoDepth: 1, legLength: 1.1, headScale: 1, limbWidth: 1 },
  upperArmMaterial: "cloth"
};
const MODEL_DISPLAY_SCALE = 1;
const SCRIPT_MODEL_BASE_SCALE = .895;
const VRM_RIGHT_HAND_GRIP_ROTATION = [0, 0, -Math.PI / 2];
const VRM_LEFT_HAND_GRIP_ROTATION = [0, 0, Math.PI / 2];
const GUARD_EFFECT_STATES = new Set(["Guard", "GuardCounterWindow"]);
const DISABLED_EFFECT_STATES = new Set(["Stunned"]);

export const MODEL_CONTRACT = Object.freeze({
  renderer: "script",
  frontAxis: "+Z",
  humanoidBones: [
    "hips", "spine", "chest", "head", "leftShoulder", "rightShoulder",
    "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm", "leftHand", "rightHand",
    "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot"
  ],
  attachmentSockets: ["headAccessory", "chestArmor", "back", "leftHandGrip", "rightHandGrip"],
  stateMotions: ["idle", "move", "dash", "jump", "guard", "hit", "down", "getUp", "dead", "pickup"]
});

export class ProceduralCharacterView {
  constructor(characterId) {
    this.characterId = characterId;
    this.registration = CHARACTER_REGISTRY[characterId];
    this.visual = this.registration.visual;
    this.profile = this.registration.definition.visualProfile;
    this.scriptModel = this.visual.scriptModel || SHARED_FALLBACK_MODEL;
    this.palette = this.profile.renderer === "vrm" ? SHARED_FALLBACK_PALETTE : this.visual.palette;
    this.root = new THREE.Group();
    this.root.name = `${characterId}-game-root`;
    this.root.userData.modelType = "script";
    this.root.userData.contract = MODEL_CONTRACT;
    this.visualRoot = new THREE.Group();
    this.visualRoot.name = `${characterId}-visual-root`;
    this.root.add(this.visualRoot);
    this.equipment = new Map();
    this.lastEquipment = null;
    this.hiddenItemIds = new Set();
    this.build();
    if (this.profile.renderer === "vrm" && typeof window !== "undefined") this.loadVrm();
  }

  build() {
    const p = this.palette;
    const shape = this.scriptModel.proportions;
    const cloth = material(p.cloth, .68);
    const clothDark = material(p.clothDark, .72);
    const steel = material(p.metal, .84, .34);
    const darkSteel = material(p.metalDark, .92, .28);
    const leather = material(0x3d3028, .8);

    const hips = new THREE.Group();
    hips.position.y = 1.08 * shape.legLength;
    const spine = new THREE.Group();
    spine.position.y = .08;
    const chest = new THREE.Group();
    chest.position.y = .24 * shape.torsoHeight;
    hips.add(spine);
    spine.add(chest);
    this.modelRoot = new THREE.Group();
    this.modelRoot.name = `${this.characterId}-script-model-root`;
    this.modelRoot.scale.setScalar(SCRIPT_MODEL_BASE_SCALE);
    this.visualRoot.add(this.modelRoot);
    this.modelRoot.add(hips);
    const torso = mesh(new THREE.CylinderGeometry(.42 * shape.shoulderWidth, .52 * shape.shoulderWidth, .82 * shape.torsoHeight, 6), cloth);
    torso.scale.z = .7 * shape.torsoDepth;
    chest.add(torso);
    const belt = mesh(new THREE.BoxGeometry(.82, .12, .48), leather);
    belt.position.y = -.4;
    chest.add(belt);

    const head = new THREE.Group();
    head.position.y = .72 * shape.torsoHeight;
    head.scale.setScalar(shape.headScale);
    chest.add(head);
    const upperArmMaterial = this.scriptModel.upperArmMaterial === "cloth" ? cloth : steel;
    const leftShoulder = new THREE.Group();
    const rightShoulder = new THREE.Group();
    leftShoulder.position.set(-.42 * shape.shoulderWidth, .25, 0);
    rightShoulder.position.set(.42 * shape.shoulderWidth, .25, 0);
    chest.add(leftShoulder, rightShoulder);
    const leftArm = makeLimb(upperArmMaterial, clothDark, -1, shape.limbWidth);
    const rightArm = makeLimb(upperArmMaterial, clothDark, 1, shape.limbWidth);
    leftArm.upper.position.x = -.08 * shape.shoulderWidth;
    rightArm.upper.position.x = .08 * shape.shoulderWidth;
    leftShoulder.add(leftArm.upper);
    rightShoulder.add(rightArm.upper);
    const leftLeg = makeLeg(darkSteel, clothDark, shape.limbWidth, shape.legLength);
    const rightLeg = makeLeg(darkSteel, clothDark, shape.limbWidth, shape.legLength);
    leftLeg.upper.position.set(-.23, 0, 0);
    rightLeg.upper.position.set(.23, 0, 0);
    hips.add(leftLeg.upper, rightLeg.upper);

    const sockets = {
      headAccessory: socket("head-accessory", head),
      chestArmor: socket("chest-armor", chest),
      back: socket("back", chest),
      leftHandGrip: socket("left-hand-grip", leftArm.hand),
      rightHandGrip: socket("right-hand-grip", rightArm.hand)
    };
    this.rig = new ScriptRigAdapter({
      hips,
      spine,
      chest,
      head,
      leftShoulder,
      rightShoulder,
      leftUpperArm: leftArm.upper,
      rightUpperArm: rightArm.upper,
      leftLowerArm: leftArm.lower,
      rightLowerArm: rightArm.lower,
      leftHand: leftArm.hand,
      rightHand: rightArm.hand,
      leftUpperLeg: leftLeg.upper,
      rightUpperLeg: rightLeg.upper,
      leftLowerLeg: leftLeg.lower,
      rightLowerLeg: rightLeg.lower,
      leftFoot: leftLeg.foot,
      rightFoot: rightLeg.foot
    }, sockets);
    this.visualRoot.scale.setScalar(getDisplayScale(this.profile));
    this.visualRoot.position.y = this.profile.groundOffset;
    this.motionPlayer = new ScriptMotionPlayer(
      this.rig,
      this.visualRoot,
      collectAttackSpecs(),
      this.visual.motionController,
      resolveMotionController
    );
    this.buildStateEffects();
    this.buildCollisionVisuals();

  }

  buildStateEffects() {
    this.guardEffect = createGuardShieldEffect();
    this.root.add(this.guardEffect);

    this.disabledEffect = createDisabledStarsEffect();
    this.root.add(this.disabledEffect);
  }

  buildCollisionVisuals() {
    const collision = this.registration.definition.collision;
    const worldWidth = collision.halfWidth / 78;
    const worldHeight = collision.height / 78;
    const cyan = new THREE.MeshBasicMaterial({ color: 0x2de7ff, transparent: true, opacity: .2, depthWrite: false, depthTest: false, wireframe: false });
    const orange = new THREE.MeshBasicMaterial({ color: 0xff8a28, transparent: true, opacity: .34, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    this.hitboxMaterials = [orange];
    this.hurtboxView = new THREE.Group();
    this.hurtboxView.name = `${this.characterId}-hurtbox`;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(worldWidth, Math.max(.25, worldHeight - worldWidth * 2), 5, 10), cyan);
    body.position.y = worldHeight * .52;
    const head = new THREE.Mesh(new THREE.SphereGeometry(worldWidth * .66, 10, 7), cyan.clone());
    head.position.y = worldHeight * .94;
    this.hurtboxView.add(body, head);
    this.hurtboxView.renderOrder = 20;
    this.hurtboxView.visible = false;
    this.root.add(this.hurtboxView);

    this.hitboxView = new THREE.Group();
    this.hitboxView.name = `${this.characterId}-hitbox`;
    const sweep = new THREE.Mesh(new THREE.TorusGeometry(.86, .075, 6, 24, Math.PI * 1.25), orange);
    sweep.rotation.x = Math.PI / 2;
    sweep.rotation.z = -.62;
    sweep.position.set(0, 1.25, .5);
    const thrustMaterial = orange.clone();
    this.hitboxMaterials.push(thrustMaterial);
    const thrust = new THREE.Mesh(new THREE.CapsuleGeometry(.11, 1.2, 4, 8), thrustMaterial);
    thrust.rotation.x = Math.PI / 2;
    thrust.position.set(0, 1.2, .72);
    this.hitboxView.add(sweep, thrust);
    this.hitboxView.renderOrder = 21;
    this.hitboxSweep = sweep;
    this.hitboxThrust = thrust;
    this.hitboxView.visible = false;
    this.root.add(this.hitboxView);
  }

  setCollisionDebug(visible) {
    this.collisionDebug = visible;
    this.hurtboxView.visible = visible;
    for (const hitboxMaterial of this.hitboxMaterials) hitboxMaterial.opacity = visible ? .44 : .2;
  }

  setEquipment(equipment, hiddenItemIds = new Set()) {
    this.lastEquipment = equipment;
    this.hiddenItemIds = hiddenItemIds;
    for (const slot of EQUIPMENT_SLOTS) {
      const item = equipment?.[slot] || null;
      const current = this.equipment.get(slot);
      const itemKey = item ? (item.id || `${item.equipmentId}:showcase`) : null;
      const equipmentId = item?.equipmentId;
      if (!item) {
        if (current) this.removeEquipment(slot);
        continue;
      }
      if (!current || current.itemKey !== itemKey || current.equipmentId !== equipmentId) {
        this.removeEquipment(slot);
        this.addEquipment(slot, itemKey, equipmentId);
      }
      const mounted = this.equipment.get(slot);
      const visible = !item.id || !hiddenItemIds.has(item.id);
      for (const object of mounted?.objects || []) object.visible = visible;
    }
  }

  addEquipment(slot, itemKey, equipmentId) {
    const registration = EQUIPMENT_REGISTRY[equipmentId];
    if (!registration) throw new Error(`Unknown equipmentId: ${equipmentId}`);
    const definition = registration.visual.createAttachments({ THREE, material, makeBlade });
    const objects = [];
    for (const attachment of definition.attachments) {
      const target = this.rig.getSocket(attachment.socket);
      if (!target || !attachment.object) continue;
      const object = attachment.object;
      if (attachment.position) object.position.fromArray(attachment.position);
      if (attachment.rotation) object.rotation.fromArray(attachment.rotation);
      if (attachment.scale != null) object.scale.setScalar(attachment.scale);
      target.add(object);
      objects.push(object);
    }
    const mounted = { itemKey, equipmentId, objects, motions: definition.motions || {} };
    this.equipment.set(slot, mounted);
    for (const attachment of definition.attachments) {
      if (!attachment.model || !objects.includes(attachment.object)) continue;
      loadEquipmentModel(attachment.object, attachment.model, () => this.equipment.get(slot) === mounted);
    }
  }

  removeEquipment(slot) {
    const mounted = this.equipment.get(slot);
    if (!mounted) return;
    for (const object of mounted.objects) {
      object.removeFromParent();
      disposeGroup(object);
    }
    this.equipment.delete(slot);
  }

  getSocketWorldPosition(slot, target = new THREE.Vector3()) {
    this.root.updateWorldMatrix(true, true);
    return this.rig.getSocket(SLOT_SOCKETS[slot])?.getWorldPosition(target) || this.root.getWorldPosition(target);
  }

  playPickup() {
    this.motionPlayer.playPickup();
  }

  setAppearance({ side, highlighted = false } = {}) {
    this.root.userData.side = side;
    this.root.traverse((object) => {
      if (!object.isMesh || !object.material?.emissive) return;
      object.material.emissive.setHex(highlighted ? this.palette.glow : 0x000000);
      object.material.emissiveIntensity = highlighted ? .08 : 0;
    });
  }

  update(snapshot, delta, elapsed) {
    this.root.position.y = Math.max(0, snapshot?.worldY || 0);
    if (snapshot?.facing != null) {
      this.root.rotation.y = snapshot.facing === -1 ? -Math.PI / 2 : Math.PI / 2;
    }
    this.motionPlayer.update(snapshot, delta, elapsed);
    if (this.vrm && this.motionPlayer?.kind !== "vrma") this.vrm.update(delta);
    const attacking = snapshot?.state === "AttackActive" && snapshot?.activeActionId;
    const thrusting = /thrust|charge|headbutt|forward_cut|guard_counter|lunar/.test(snapshot?.activeActionId || "");
    this.hitboxView.visible = Boolean(this.collisionDebug && attacking);
    this.hitboxSweep.visible = !thrusting;
    this.hitboxThrust.visible = thrusting;
    this.updateStateEffects(snapshot, elapsed);
  }

  updateStateEffects(snapshot, elapsed) {
    const state = snapshot?.state;
    const guarding = GUARD_EFFECT_STATES.has(state);
    this.guardEffect.visible = guarding;
    if (guarding) {
      const pulse = .5 + Math.sin(elapsed * 9) * .5;
      this.guardEffect.scale.setScalar(1 + pulse * .035);
      this.guardEffect.rotation.y = Math.sin(elapsed * 5) * .08;
      for (const object of this.guardEffect.children) {
        if (object.material) object.material.opacity = object.userData.baseOpacity + pulse * object.userData.pulseOpacity;
      }
    }

    const disabled = DISABLED_EFFECT_STATES.has(state);
    this.disabledEffect.visible = disabled;
    if (disabled) {
      this.disabledEffect.rotation.y = elapsed * 3.8;
      for (const [index, star] of this.disabledEffect.children.entries()) {
        star.position.y = star.userData.baseY + Math.sin(elapsed * 5.5 + index * 1.7) * .035;
        star.rotation.z = -this.disabledEffect.rotation.y + elapsed * 2 + index * .4;
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.motionPlayer?.dispose?.();
    for (const slot of [...this.equipment.keys()]) this.removeEquipment(slot);
    disposeGroup(this.root);
    this.root.removeFromParent();
  }

  async loadVrm() {
    try {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      const gltf = await loader.loadAsync(this.profile.url);
      if (this.disposed) {
        disposeGroup(gltf.scene);
        return;
      }
      const vrm = gltf.userData.vrm;
      if (!vrm) throw new Error(`VRM data was not found: ${this.profile.url}`);
      this.installVrm(vrm);
    } catch (error) {
      this.root.userData.vrmLoadError = error;
    }
  }

  installVrm(vrm) {
    for (const slot of [...this.equipment.keys()]) this.removeEquipment(slot);
    const fallbackRoot = this.visualRoot;
    const visualRoot = new THREE.Group();
    visualRoot.name = `${this.characterId}-vrm-visual-root`;
    visualRoot.scale.setScalar(getDisplayScale(this.profile));
    visualRoot.position.y = this.profile.groundOffset;
    visualRoot.add(vrm.scene);
    this.root.add(visualRoot);

    const rig = createVrmRig(vrm);
    if (!rig) {
      visualRoot.removeFromParent();
      disposeGroup(visualRoot);
      throw new Error(`VRM humanoid contract is incomplete: ${this.profile.url}`);
    }
    this.visualRoot = visualRoot;
    this.rig = rig;
    this.vrm = vrm;
    this.motionPlayer?.dispose?.();
    this.motionPlayer = new VrmaCharacterMotionPlayer(vrm, getVrmaMotionSet());
    fallbackRoot.removeFromParent();
    disposeGroup(fallbackRoot);
    this.root.userData.modelType = "vrm";
    this.root.userData.vrmLoaded = true;
    if (this.lastEquipment) this.setEquipment(this.lastEquipment, this.hiddenItemIds);
  }
}

export function createFieldItemView(equipmentId) {
  const registration = EQUIPMENT_REGISTRY[equipmentId];
  if (!registration) throw new Error(`Unknown equipmentId: ${equipmentId}`);
  const root = registration.visual.createFieldItem({ THREE, material });
  const slot = registration.definition.slot;
  root.userData.slot = slot;
  root.userData.equipmentId = equipmentId;
  if (registration.visual.fieldModel && typeof window !== "undefined") {
    loadEquipmentModel(root, registration.visual.fieldModel, () => Boolean(root.parent));
  }
  return root;
}

async function loadEquipmentModel(container, model, isCurrent) {
  if (typeof window === "undefined") return;
  try {
    const gltf = await new GLTFLoader().loadAsync(model.url);
    if (!isCurrent()) {
      disposeGroup(gltf.scene);
      return;
    }
    const loaded = gltf.scene;
    if (model.position) loaded.position.fromArray(model.position);
    if (model.rotation) loaded.rotation.fromArray(model.rotation);
    if (model.scale != null) loaded.scale.setScalar(model.scale);
    loaded.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    for (const child of [...container.children]) {
      child.removeFromParent();
      disposeGroup(child);
    }
    container.add(loaded);
    container.userData.modelLoaded = true;
  } catch (error) {
    container.userData.modelLoadError = error;
  }
}

function collectAttackSpecs() {
  const specs = new Map();
  for (const attack of [...COMMON_BAREHAND_COMBO, COMMON_GUARD_COUNTER, COMMON_WAKE_UP_ATTACK]) specs.set(attack.motionId, attack);
  for (const registration of Object.values(EQUIPMENT_REGISTRY)) {
    const definition = registration.definition;
    for (const attack of [...(definition.combo || []), ...(definition.holdAttack ? [definition.holdAttack] : []), definition.skill]) specs.set(attack.motionId, attack);
  }
  return specs;
}

function resolveMotionController(motionId) {
  for (const registration of Object.values(EQUIPMENT_REGISTRY)) {
    const definition = registration.definition;
    const attacks = [...(definition.combo || []), ...(definition.holdAttack ? [definition.holdAttack] : []), definition.skill];
    if (attacks.some((attack) => attack.motionId === motionId)) return registration.motionController;
  }
  return null;
}

function getDisplayScale(profile) {
  return profile.scale * MODEL_DISPLAY_SCALE;
}

function createVrmRig(vrm) {
  const boneNames = MODEL_CONTRACT.humanoidBones;
  const bones = Object.fromEntries(boneNames.map((name) => [name, vrm.humanoid.getNormalizedBoneNode(name)]));
  if (Object.values(bones).some((bone) => !bone)) return null;
  const sockets = {
    headAccessory: socket("head-accessory", bones.head, [0, .12, 0]),
    chestArmor: socket("chest-armor", bones.chest, [0, 0, .08]),
    back: socket("back", bones.chest, [0, 0, -.1]),
    leftHandGrip: socket("left-hand-grip", vrm.humanoid.getNormalizedBoneNode("leftHand") || bones.leftUpperArm, [0, 0, 0], VRM_LEFT_HAND_GRIP_ROTATION),
    rightHandGrip: socket("right-hand-grip", vrm.humanoid.getNormalizedBoneNode("rightHand") || bones.rightUpperArm, [0, 0, 0], VRM_RIGHT_HAND_GRIP_ROTATION)
  };
  return new ScriptRigAdapter(bones, sockets);
}

function socket(name, parent, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const result = new THREE.Group();
  result.name = name;
  result.position.fromArray(position);
  result.rotation.fromArray(rotation);
  parent.add(result);
  return result;
}

function makeBlade(length, bladeColor, guardColor, curved) {
  const weapon = new THREE.Group();
  const blade = mesh(new THREE.BoxGeometry(curved ? .09 : .11, length, .065), material(bladeColor, .72, .52));
  blade.position.y = -length / 2;
  blade.rotation.z = curved ? -.08 : 0;
  const tip = mesh(new THREE.ConeGeometry(curved ? .065 : .08, .24, 4), material(bladeColor, .72, .52));
  tip.position.y = -length - .1;
  tip.rotation.z = Math.PI;
  const guard = mesh(new THREE.BoxGeometry(curved ? .32 : .46, .075, .09), material(guardColor, .62, .3));
  weapon.add(blade, tip, guard);
  return weapon;
}

function makeLimb(upperMaterial, lowerMaterial, side, widthScale = 1) {
  const upperPivot = new THREE.Group();
  const upper = mesh(new THREE.CylinderGeometry(.13, .17, .55, 6), upperMaterial);
  upper.scale.x = upper.scale.z = widthScale;
  upper.position.y = -.25;
  upper.rotation.z = side * -.08;
  const lowerPivot = new THREE.Group();
  lowerPivot.position.y = -.5;
  const forearm = mesh(new THREE.CylinderGeometry(.105, .13, .46, 6), lowerMaterial);
  forearm.scale.x = forearm.scale.z = widthScale;
  forearm.position.y = -.22;
  const hand = new THREE.Group();
  hand.position.y = -.46;
  const glove = mesh(new THREE.SphereGeometry(.15, 6, 5), lowerMaterial);
  hand.add(glove);
  lowerPivot.add(forearm, hand);
  upperPivot.add(upper, lowerPivot);
  return { upper: upperPivot, lower: lowerPivot, hand };
}

function makeLeg(armorMaterial, clothMaterial, widthScale = 1, lengthScale = 1) {
  const upperLength = .54 * lengthScale;
  const lowerLength = .46 * lengthScale;
  const upperPivot = new THREE.Group();
  const thigh = mesh(new THREE.CylinderGeometry(.15, .18, upperLength, 6), clothMaterial);
  thigh.scale.x = thigh.scale.z = widthScale;
  thigh.position.y = -upperLength / 2;
  const lowerPivot = new THREE.Group();
  lowerPivot.position.y = -upperLength;
  const shin = mesh(new THREE.CylinderGeometry(.12, .145, lowerLength, 6), armorMaterial);
  shin.scale.x = shin.scale.z = widthScale;
  shin.position.y = -lowerLength / 2;
  const foot = new THREE.Group();
  foot.position.y = -lowerLength;
  const boot = mesh(new THREE.BoxGeometry(.28, .18, .42), armorMaterial);
  boot.scale.x = widthScale;
  boot.position.set(0, -.04, .09);
  foot.add(boot);
  lowerPivot.add(shin, foot);
  upperPivot.add(thigh, lowerPivot);
  return { upper: upperPivot, lower: lowerPivot, foot };
}

function material(color, roughness = .78, metalness = .12) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide });
}

function mesh(geometry, meshMaterial) {
  const result = new THREE.Mesh(geometry, meshMaterial);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function createGuardShieldEffect() {
  const group = new THREE.Group();
  group.name = "guard-shield-effect";
  group.position.set(0, 1.18, .22);
  group.visible = false;

  const shieldSurface = new THREE.Mesh(
    new THREE.SphereGeometry(.92, 28, 14, Math.PI / 4, Math.PI / 2, .12, Math.PI - .24),
    new THREE.MeshBasicMaterial({
      color: 0x3aa8ff,
      transparent: true,
      opacity: .2,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
  );
  shieldSurface.userData.baseOpacity = .18;
  shieldSurface.userData.pulseOpacity = .08;
  shieldSurface.renderOrder = 12;

  const shieldRibs = new THREE.Mesh(
    new THREE.SphereGeometry(.925, 10, 6, Math.PI / 4, Math.PI / 2, .12, Math.PI - .24),
    new THREE.MeshBasicMaterial({
      color: 0x9edcff,
      transparent: true,
      opacity: .32,
      depthWrite: false,
      wireframe: true,
      blending: THREE.AdditiveBlending
    })
  );
  shieldRibs.userData.baseOpacity = .28;
  shieldRibs.userData.pulseOpacity = .12;
  shieldRibs.renderOrder = 13;
  group.add(shieldSurface, shieldRibs);
  return group;
}

function createDisabledStarsEffect() {
  const group = new THREE.Group();
  group.name = "disabled-stars-effect";
  group.position.set(0, 2.32, 0);
  group.visible = false;
  const starGeometry = createStarGeometry(.13, .055, 5);
  const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe35a,
    transparent: true,
    opacity: .95,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (let index = 0; index < 3; index += 1) {
    const angle = index / 3 * Math.PI * 2;
    const star = new THREE.Mesh(starGeometry, starMaterial.clone());
    star.position.set(Math.cos(angle) * .34, index === 1 ? .08 : 0, Math.sin(angle) * .34);
    star.rotation.y = Math.PI / 2 - angle;
    star.userData.baseY = star.position.y;
    star.renderOrder = 14;
    group.add(star);
  }
  return group;
}

function createStarGeometry(outerRadius, innerRadius, points) {
  const shape = new THREE.Shape();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = Math.PI / 2 + index / (points * 2) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
    else object.material?.dispose?.();
  });
}
