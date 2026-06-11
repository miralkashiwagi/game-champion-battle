import * as THREE from "../../public/vendor/three.module.min.js";
import { CHARACTER_REGISTRY } from "../characters/registry.ts";

const STATE_POSES = {
  Idle: "idle", Move: "move", AttackStartup: "attack", AttackActive: "attack", AttackRecovery: "attack",
  Guard: "guard", GuardCounterWindow: "guard", Hitstun: "hit", KneelDown: "down", AirDamaged: "hit",
  Down: "down", Stunned: "hit", Dead: "dead"
};

export const MODEL_CONTRACT = Object.freeze({
  animationClips: ["idle", "move", "attack", "guard", "hit", "down", "dead"],
  attachmentPoints: ["cloak", "head", "armor", "weapon"]
});

export class ProceduralCharacterView {
  constructor(characterId) {
    this.characterId = characterId;
    this.visual = CHARACTER_REGISTRY[characterId].visual;
    this.palette = this.visual.palette;
    this.root = new THREE.Group();
    this.root.name = `${characterId}-procedural`;
    this.root.userData.modelType = "procedural";
    this.root.userData.contract = MODEL_CONTRACT;
    this.parts = {};
    this.equipment = {};
    this.lastState = "Idle";
    this.time = Math.random() * 10;
    this.build();
  }

  build() {
    const p = this.palette;
    const cloth = material(p.cloth, .68);
    const clothDark = material(p.clothDark, .72);
    const steel = material(p.metal, .84, .34);
    const darkSteel = material(p.metalDark, .92, .28);
    const leather = material(0x3d3028, .8);

    this.parts.body = new THREE.Group();
    this.parts.body.position.y = 1.18;
    this.root.add(this.parts.body);
    const torso = mesh(new THREE.CylinderGeometry(.42, .52, .82, 6), cloth);
    torso.scale.z = .7;
    this.parts.body.add(torso);
    const belt = mesh(new THREE.BoxGeometry(.82, .12, .48), leather);
    belt.position.y = -.4;
    this.parts.body.add(belt);

    this.parts.head = new THREE.Group();
    this.parts.head.position.y = .72;
    this.parts.body.add(this.parts.head);
    this.parts.leftArm = makeLimb(steel, clothDark, -1);
    this.parts.rightArm = makeLimb(steel, clothDark, 1);
    this.parts.leftArm.position.set(-.5, .25, 0);
    this.parts.rightArm.position.set(.5, .25, 0);
    this.parts.body.add(this.parts.leftArm, this.parts.rightArm);
    this.parts.leftLeg = makeLeg(darkSteel, clothDark);
    this.parts.rightLeg = makeLeg(darkSteel, clothDark);
    this.parts.leftLeg.position.set(-.23, -.38, 0);
    this.parts.rightLeg.position.set(.23, -.38, 0);
    this.parts.body.add(this.parts.leftLeg, this.parts.rightLeg);

    this.buildEquipmentVariants();
    const shadow = mesh(new THREE.CircleGeometry(.72, 24), new THREE.MeshBasicMaterial({ color: 0x05080b, transparent: true, opacity: .32, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .015;
    this.root.add(shadow);
  }

  buildEquipmentVariants() {
    this.equipment = Object.fromEntries(MODEL_CONTRACT.attachmentPoints.map((slot) => [slot, {}]));
    for (const [characterId, registration] of Object.entries(CHARACTER_REGISTRY)) {
      for (const slot of MODEL_CONTRACT.attachmentPoints) {
        const context = { THREE, parts: this.parts, material, makeBlade };
        this.equipment[slot][characterId] = registration.visual.createEquipment(slot, context);
      }
    }
  }

  setEquipment(equipment) {
    for (const slot of MODEL_CONTRACT.attachmentPoints) {
      const item = equipment?.[slot];
      const originCharacterId = item?.originCharacterId || this.characterId;
      for (const [variantId, variant] of Object.entries(this.equipment[slot])) {
        const visible = Boolean(item) && variantId === originCharacterId;
        variant.visible = visible;
        for (const linkedPart of variant.userData.linkedParts || []) linkedPart.visible = visible;
      }
    }
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
    this.time += delta;
    const state = snapshot?.state || "Idle";
    const pose = STATE_POSES[state] || "idle";
    const phase = this.time * (pose === "move" ? 9 : 2.3);
    this.root.position.y = Math.max(0, snapshot?.worldY || 0);
    this.root.rotation.y = snapshot?.facing === -1 ? -Math.PI / 2 : Math.PI / 2;
    this.parts.body.rotation.set(0, 0, 0);
    this.parts.leftArm.rotation.set(0, 0, 0);
    this.parts.rightArm.rotation.set(0, 0, 0);
    this.parts.leftLeg.rotation.x = 0;
    this.parts.rightLeg.rotation.x = 0;
    this.parts.head.rotation.set(0, 0, 0);

    if (pose === "idle") {
      this.parts.body.position.y = 1.18 + Math.sin(phase) * .025;
      this.parts.leftArm.rotation.z = -.08 + Math.sin(phase) * .025;
      this.parts.rightArm.rotation.z = .08 - Math.sin(phase) * .025;
    } else if (pose === "move") {
      this.parts.body.position.y = 1.18 + Math.abs(Math.sin(phase)) * .055;
      this.parts.leftLeg.rotation.x = Math.sin(phase) * .62;
      this.parts.rightLeg.rotation.x = -Math.sin(phase) * .62;
      this.parts.leftArm.rotation.x = -Math.sin(phase) * .38;
      this.parts.rightArm.rotation.x = Math.sin(phase) * .38;
    } else if (pose === "attack") {
      const strike = state === "AttackStartup" ? -.75 : state === "AttackActive" ? 1.2 : .35;
      this.parts.body.rotation.y = strike * .18;
      this.parts.rightArm.rotation.x = strike;
      this.parts.rightArm.rotation.z = -.55;
    } else if (pose === "guard") {
      this.parts.leftArm.rotation.x = -1.05; this.parts.leftArm.rotation.z = -.35; this.parts.body.rotation.x = .08;
    } else if (pose === "hit") {
      this.parts.body.rotation.x = -.22; this.parts.body.rotation.z = Math.sin(elapsed * 35) * .08;
      this.parts.leftArm.rotation.z = -.65; this.parts.rightArm.rotation.z = .65;
    } else if (pose === "down") {
      this.parts.body.rotation.z = 1.15; this.parts.body.position.y = .65;
    } else if (pose === "dead") {
      this.parts.body.rotation.z = 1.52; this.parts.body.position.y = .45;
    }
    this.lastState = state;
  }

  dispose() {
    disposeGroup(this.root);
    this.root.removeFromParent();
  }
}

export function createFieldItemView(slot, characterId) {
  return CHARACTER_REGISTRY[characterId].visual.createFieldItem(slot, { THREE, material });
}

export class GlbCharacterView {
  constructor() { throw new Error("GLB model support is reserved by MODEL_CONTRACT and is not enabled in this build."); }
}

function makeBlade(length, bladeColor, guardColor, curved) {
  const weapon = new THREE.Group();
  const blade = mesh(new THREE.BoxGeometry(curved ? .09 : .11, length, .065), material(bladeColor, .72, .52));
  blade.position.y = -length / 2; blade.rotation.z = curved ? -.08 : 0;
  const tip = mesh(new THREE.ConeGeometry(curved ? .065 : .08, .24, 4), material(bladeColor, .72, .52));
  tip.position.y = -length - .1; tip.rotation.z = Math.PI;
  const guard = mesh(new THREE.BoxGeometry(curved ? .32 : .46, .075, .09), material(guardColor, .62, .3));
  weapon.add(blade, tip, guard); return weapon;
}

function makeLimb(upperMaterial, lowerMaterial, side) {
  const pivot = new THREE.Group();
  const upper = mesh(new THREE.CylinderGeometry(.13, .17, .55, 6), upperMaterial); upper.position.y = -.25; upper.rotation.z = side * -.08;
  const glove = mesh(new THREE.SphereGeometry(.15, 6, 5), lowerMaterial); glove.position.y = -.58;
  pivot.add(upper, glove); return pivot;
}

function makeLeg(armorMaterial, clothMaterial) {
  const pivot = new THREE.Group();
  const thigh = mesh(new THREE.CylinderGeometry(.15, .18, .58, 6), clothMaterial); thigh.position.y = -.28;
  const boot = mesh(new THREE.BoxGeometry(.28, .54, .34), armorMaterial); boot.position.set(0, -.75, .06);
  pivot.add(thigh, boot); return pivot;
}

function material(color, roughness = .78, metalness = .12) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide });
}

function mesh(geometry, meshMaterial) {
  const result = new THREE.Mesh(geometry, meshMaterial); result.castShadow = true; result.receiveShadow = true; return result;
}

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
    else object.material?.dispose?.();
  });
}
