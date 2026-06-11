import * as THREE from "../../public/vendor/three.module.min.js";
import { CHARACTER_REGISTRY } from "../characters/registry.ts";
import { ScriptRigAdapter } from "./script-rig-adapter.js";
import { ScriptMotionPlayer } from "./script-motion-player.js";

const EQUIPMENT_SLOTS = ["cloak", "head", "armor", "weapon"];
const SLOT_SOCKETS = {
  cloak: "back",
  head: "headAccessory",
  armor: "chestArmor",
  weapon: "rightHandGrip"
};

export const MODEL_CONTRACT = Object.freeze({
  renderer: "script",
  humanoidBones: ["hips", "chest", "head", "leftUpperArm", "rightUpperArm", "leftUpperLeg", "rightUpperLeg"],
  attachmentSockets: ["headAccessory", "chestArmor", "back", "leftHandGrip", "rightHandGrip"],
  stateMotions: ["idle", "move", "guard", "hit", "down", "dead", "pickup"]
});

export class ProceduralCharacterView {
  constructor(characterId) {
    this.characterId = characterId;
    this.registration = CHARACTER_REGISTRY[characterId];
    this.visual = this.registration.visual;
    this.palette = this.visual.palette;
    this.profile = this.registration.definition.visualProfile;
    this.root = new THREE.Group();
    this.root.name = `${characterId}-game-root`;
    this.root.userData.modelType = "script";
    this.root.userData.contract = MODEL_CONTRACT;
    this.visualRoot = new THREE.Group();
    this.visualRoot.name = `${characterId}-visual-root`;
    this.root.add(this.visualRoot);
    this.equipment = new Map();
    this.build();
  }

  build() {
    const p = this.palette;
    const cloth = material(p.cloth, .68);
    const clothDark = material(p.clothDark, .72);
    const steel = material(p.metal, .84, .34);
    const darkSteel = material(p.metalDark, .92, .28);
    const leather = material(0x3d3028, .8);

    const hips = new THREE.Group();
    const chest = new THREE.Group();
    chest.position.y = 1.18;
    hips.add(chest);
    this.visualRoot.add(hips);
    const torso = mesh(new THREE.CylinderGeometry(.42, .52, .82, 6), cloth);
    torso.scale.z = .7;
    chest.add(torso);
    const belt = mesh(new THREE.BoxGeometry(.82, .12, .48), leather);
    belt.position.y = -.4;
    chest.add(belt);

    const head = new THREE.Group();
    head.position.y = .72;
    chest.add(head);
    const leftArm = makeLimb(steel, clothDark, -1);
    const rightArm = makeLimb(steel, clothDark, 1);
    leftArm.position.set(-.5, .25, 0);
    rightArm.position.set(.5, .25, 0);
    chest.add(leftArm, rightArm);
    const leftLeg = makeLeg(darkSteel, clothDark);
    const rightLeg = makeLeg(darkSteel, clothDark);
    leftLeg.position.set(-.23, -.38, 0);
    rightLeg.position.set(.23, -.38, 0);
    chest.add(leftLeg, rightLeg);

    const sockets = {
      headAccessory: socket("head-accessory", head),
      chestArmor: socket("chest-armor", chest),
      back: socket("back", chest),
      leftHandGrip: socket("left-hand-grip", leftArm, [0, -.58, 0]),
      rightHandGrip: socket("right-hand-grip", rightArm, [0, -.58, 0])
    };
    this.rig = new ScriptRigAdapter({
      hips,
      chest,
      head,
      leftUpperArm: leftArm,
      rightUpperArm: rightArm,
      leftUpperLeg: leftLeg,
      rightUpperLeg: rightLeg
    }, sockets);
    this.visualRoot.scale.setScalar(this.profile.scale);
    this.visualRoot.position.y = this.profile.groundOffset;
    this.motionPlayer = new ScriptMotionPlayer(this.rig, this.visualRoot, collectAttackSpecs());

    const shadow = mesh(new THREE.CircleGeometry(.72, 24), new THREE.MeshBasicMaterial({ color: 0x05080b, transparent: true, opacity: .32, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .015;
    this.root.add(shadow);
  }

  setEquipment(equipment, hiddenItemIds = new Set()) {
    for (const slot of EQUIPMENT_SLOTS) {
      const item = equipment?.[slot] || null;
      const current = this.equipment.get(slot);
      const itemKey = item ? (item.id || `${this.characterId}:${slot}:showcase`) : null;
      const originCharacterId = item?.originCharacterId || this.characterId;
      if (!item) {
        if (current) this.removeEquipment(slot);
        continue;
      }
      if (!current || current.itemKey !== itemKey || current.originCharacterId !== originCharacterId) {
        this.removeEquipment(slot);
        this.addEquipment(slot, itemKey, originCharacterId);
      }
      const mounted = this.equipment.get(slot);
      const visible = !item.id || !hiddenItemIds.has(item.id);
      for (const object of mounted?.objects || []) object.visible = visible;
    }
  }

  addEquipment(slot, itemKey, originCharacterId) {
    const factory = CHARACTER_REGISTRY[originCharacterId]?.visual;
    if (!factory) return;
    const definition = factory.createEquipment(slot, { THREE, material, makeBlade });
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
    this.equipment.set(slot, { itemKey, originCharacterId, objects, motions: definition.motions || {} });
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
    this.root.rotation.y = snapshot?.facing === -1 ? -Math.PI / 2 : Math.PI / 2;
    this.motionPlayer.update(snapshot, delta, elapsed);
  }

  dispose() {
    for (const slot of [...this.equipment.keys()]) this.removeEquipment(slot);
    disposeGroup(this.root);
    this.root.removeFromParent();
  }
}

export function createFieldItemView(slot, characterId) {
  const root = CHARACTER_REGISTRY[characterId].visual.createFieldItem(slot, { THREE, material });
  root.userData.slot = slot;
  root.userData.originCharacterId = characterId;
  return root;
}

function collectAttackSpecs() {
  const specs = new Map();
  for (const registration of Object.values(CHARACTER_REGISTRY)) {
    const definition = registration.definition;
    for (const attack of [...definition.combo, ...definition.barehandCombo, definition.holdAttack, definition.guardCounter, ...Object.values(definition.skills)]) {
      specs.set(attack.motionId, attack);
    }
  }
  return specs;
}

function socket(name, parent, position = [0, 0, 0]) {
  const result = new THREE.Group();
  result.name = name;
  result.position.fromArray(position);
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

function makeLimb(upperMaterial, lowerMaterial, side) {
  const pivot = new THREE.Group();
  const upper = mesh(new THREE.CylinderGeometry(.13, .17, .55, 6), upperMaterial);
  upper.position.y = -.25;
  upper.rotation.z = side * -.08;
  const glove = mesh(new THREE.SphereGeometry(.15, 6, 5), lowerMaterial);
  glove.position.y = -.58;
  pivot.add(upper, glove);
  return pivot;
}

function makeLeg(armorMaterial, clothMaterial) {
  const pivot = new THREE.Group();
  const thigh = mesh(new THREE.CylinderGeometry(.15, .18, .58, 6), clothMaterial);
  thigh.position.y = -.28;
  const boot = mesh(new THREE.BoxGeometry(.28, .54, .34), armorMaterial);
  boot.position.set(0, -.75, .06);
  pivot.add(thigh, boot);
  return pivot;
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

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
    else object.material?.dispose?.();
  });
}
