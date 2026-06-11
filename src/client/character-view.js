import * as THREE from "../../public/vendor/three.module.min.js";

const PALETTES = {
  silver_knight: {
    cloth: 0x174f89,
    clothDark: 0x0b2d52,
    metal: 0x9aa7b2,
    metalDark: 0x35414b,
    plume: 0x1768b1,
    glow: 0x54b9ff
  },
  saladin: {
    cloth: 0x8f2928,
    clothDark: 0x471718,
    metal: 0x85898b,
    metalDark: 0x292e31,
    plume: 0xd13b34,
    glow: 0xff665d
  }
};

const STATE_POSES = {
  Idle: "idle",
  Move: "move",
  AttackStartup: "attack",
  AttackActive: "attack",
  AttackRecovery: "attack",
  Guard: "guard",
  GuardCounterWindow: "guard",
  Hitstun: "hit",
  KneelDown: "down",
  AirDamaged: "hit",
  Down: "down",
  Stunned: "hit",
  Dead: "dead"
};

export const MODEL_CONTRACT = Object.freeze({
  animationClips: ["idle", "move", "attack", "guard", "hit", "down", "dead"],
  attachmentPoints: ["cloak", "head", "armor", "weapon"]
});

export class ProceduralCharacterView {
  constructor(characterId) {
    this.characterId = characterId;
    this.palette = PALETTES[characterId];
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

    const breastplate = mesh(new THREE.BoxGeometry(.62, .58, .24), steel);
    breastplate.position.set(0, .03, .32);
    breastplate.rotation.x = -.08;
    this.parts.body.add(breastplate);
    this.equipment.armor = breastplate;

    const belt = mesh(new THREE.BoxGeometry(.82, .12, .48), leather);
    belt.position.y = -.4;
    this.parts.body.add(belt);

    this.parts.head = new THREE.Group();
    this.parts.head.position.y = .72;
    this.parts.body.add(this.parts.head);
    const helmet = mesh(new THREE.CylinderGeometry(.32, .38, .42, 6), darkSteel);
    this.parts.head.add(helmet);
    const visor = mesh(new THREE.BoxGeometry(.62, .12, .13), steel);
    visor.position.set(0, -.03, .32);
    this.parts.head.add(visor);
    const eye = mesh(new THREE.BoxGeometry(.42, .045, .025), material(0x11171c, .5));
    eye.position.set(0, -.035, .395);
    this.parts.head.add(eye);
    const plume = mesh(new THREE.ConeGeometry(.12, .48, 5), material(p.plume, .7));
    plume.position.set(0, .38, -.05);
    plume.rotation.z = -.35;
    this.parts.head.add(plume);
    this.equipment.head = this.parts.head;

    const cape = mesh(new THREE.PlaneGeometry(.84, 1.18), material(p.clothDark, .88));
    cape.position.set(0, -.06, -.36);
    cape.rotation.x = .13;
    this.parts.body.add(cape);
    this.equipment.cloak = cape;

    this.parts.leftArm = this.makeLimb(steel, clothDark, -1);
    this.parts.rightArm = this.makeLimb(steel, clothDark, 1);
    this.parts.leftArm.position.set(-.5, .25, 0);
    this.parts.rightArm.position.set(.5, .25, 0);
    this.parts.body.add(this.parts.leftArm, this.parts.rightArm);

    this.parts.leftLeg = this.makeLeg(darkSteel, clothDark);
    this.parts.rightLeg = this.makeLeg(darkSteel, clothDark);
    this.parts.leftLeg.position.set(-.23, -.38, 0);
    this.parts.rightLeg.position.set(.23, -.38, 0);
    this.parts.body.add(this.parts.leftLeg, this.parts.rightLeg);

    const shield = new THREE.Group();
    const shieldFace = mesh(new THREE.CylinderGeometry(.42, .42, .12, 6), darkSteel);
    shieldFace.rotation.x = Math.PI / 2;
    shield.add(shieldFace);
    const shieldMark = mesh(new THREE.BoxGeometry(.08, .58, .04), material(p.glow, .45));
    shieldMark.position.z = .09;
    shield.add(shieldMark);
    shield.position.set(-.06, -.35, .2);
    shield.rotation.set(.25, .35, .05);
    this.parts.leftArm.add(shield);
    this.parts.shield = shield;

    const weapon = new THREE.Group();
    const blade = mesh(new THREE.BoxGeometry(.1, 1.25, .07), steel);
    blade.position.y = -.62;
    blade.rotation.z = -.03;
    const tip = mesh(new THREE.ConeGeometry(.075, .28, 4), steel);
    tip.position.y = -1.38;
    tip.rotation.z = Math.PI;
    const guard = mesh(new THREE.BoxGeometry(.44, .08, .09), material(0xc3a554, .62));
    guard.position.y = .04;
    weapon.add(blade, tip, guard);
    weapon.position.set(.02, -.5, .14);
    weapon.rotation.set(-.05, 0, -.26);
    this.parts.rightArm.add(weapon);
    this.parts.weapon = weapon;
    this.equipment.weapon = weapon;

    const shadow = mesh(new THREE.CircleGeometry(.72, 24), new THREE.MeshBasicMaterial({ color: 0x05080b, transparent: true, opacity: .32, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .015;
    this.root.add(shadow);
  }

  makeLimb(upperMaterial, lowerMaterial, side) {
    const pivot = new THREE.Group();
    const upper = mesh(new THREE.CylinderGeometry(.13, .17, .55, 6), upperMaterial);
    upper.position.y = -.25;
    upper.rotation.z = side * -.08;
    const glove = mesh(new THREE.SphereGeometry(.15, 6, 5), lowerMaterial);
    glove.position.y = -.58;
    pivot.add(upper, glove);
    return pivot;
  }

  makeLeg(armorMaterial, clothMaterial) {
    const pivot = new THREE.Group();
    const thigh = mesh(new THREE.CylinderGeometry(.15, .18, .58, 6), clothMaterial);
    thigh.position.y = -.28;
    const boot = mesh(new THREE.BoxGeometry(.28, .54, .34), armorMaterial);
    boot.position.set(0, -.75, .06);
    pivot.add(thigh, boot);
    return pivot;
  }

  setEquipment(equipment) {
    for (const slot of MODEL_CONTRACT.attachmentPoints) {
      if (!this.equipment[slot]) continue;
      this.equipment[slot].visible = Boolean(equipment?.[slot]);
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
      const strike = snapshot?.state === "AttackStartup" ? -.75 : snapshot?.state === "AttackActive" ? 1.2 : .35;
      this.parts.body.rotation.y = strike * .18;
      this.parts.rightArm.rotation.x = strike;
      this.parts.rightArm.rotation.z = -.55;
    } else if (pose === "guard") {
      this.parts.leftArm.rotation.x = -1.05;
      this.parts.leftArm.rotation.z = -.35;
      this.parts.body.rotation.x = .08;
    } else if (pose === "hit") {
      this.parts.body.rotation.x = -.22;
      this.parts.body.rotation.z = Math.sin(elapsed * 35) * .08;
      this.parts.leftArm.rotation.z = -.65;
      this.parts.rightArm.rotation.z = .65;
    } else if (pose === "down") {
      this.parts.body.rotation.z = 1.15;
      this.parts.body.position.y = .65;
    } else if (pose === "dead") {
      this.parts.body.rotation.z = 1.52;
      this.parts.body.position.y = .45;
    }
    this.lastState = state;
  }

  dispose() {
    this.root.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
      else object.material?.dispose();
    });
    this.root.removeFromParent();
  }
}

export class GlbCharacterView {
  constructor() {
    throw new Error("GLB model support is reserved by MODEL_CONTRACT and is not enabled in this build.");
  }
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
