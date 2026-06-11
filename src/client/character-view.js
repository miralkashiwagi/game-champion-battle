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

    const belt = mesh(new THREE.BoxGeometry(.82, .12, .48), leather);
    belt.position.y = -.4;
    this.parts.body.add(belt);

    this.parts.head = new THREE.Group();
    this.parts.head.position.y = .72;
    this.parts.body.add(this.parts.head);
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

    this.buildEquipmentVariants();

    const shadow = mesh(new THREE.CircleGeometry(.72, 24), new THREE.MeshBasicMaterial({ color: 0x05080b, transparent: true, opacity: .32, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .015;
    this.root.add(shadow);
  }

  buildEquipmentVariants() {
    this.equipment = Object.fromEntries(MODEL_CONTRACT.attachmentPoints.map((slot) => [slot, {}]));
    for (const characterId of Object.keys(PALETTES)) {
      const palette = PALETTES[characterId];
      this.equipment.cloak[characterId] = this.makeCloak(characterId, palette);
      this.equipment.head[characterId] = this.makeHeadgear(characterId, palette);
      this.equipment.armor[characterId] = this.makeArmor(characterId, palette);
      this.equipment.weapon[characterId] = this.makeWeapon(characterId, palette);
    }
  }

  makeCloak(characterId, palette) {
    const group = new THREE.Group();
    if (characterId === "silver_knight") {
      const cape = mesh(new THREE.PlaneGeometry(.9, .92), material(palette.clothDark, .9));
      cape.position.set(0, -.02, -.36);
      cape.rotation.x = .13;
      group.add(cape);
    } else {
      for (const side of [-1, 1]) {
        const tail = mesh(new THREE.PlaneGeometry(.36, 1.28), material(palette.clothDark, .9));
        tail.position.set(side * .22, -.14, -.37);
        tail.rotation.set(.13, 0, side * -.1);
        group.add(tail);
      }
      const clasp = mesh(new THREE.TorusGeometry(.18, .04, 5, 12), material(0xd6ad55, .52, .44));
      clasp.position.set(0, .38, -.4);
      group.add(clasp);
    }
    this.parts.body.add(group);
    return group;
  }

  makeHeadgear(characterId, palette) {
    const group = new THREE.Group();
    if (characterId === "silver_knight") {
      const helmet = mesh(new THREE.CylinderGeometry(.32, .38, .43, 6), material(palette.metalDark, .9, .3));
      const visor = mesh(new THREE.BoxGeometry(.64, .14, .14), material(palette.metal, .8, .38));
      visor.position.set(0, -.03, .32);
      const eye = mesh(new THREE.BoxGeometry(.43, .045, .025), material(0x10171d, .5));
      eye.position.set(0, -.035, .405);
      const crest = mesh(new THREE.BoxGeometry(.09, .5, .28), material(palette.plume, .68));
      crest.position.set(0, .34, -.03);
      crest.rotation.z = -.18;
      group.add(helmet, visor, eye, crest);
    } else {
      const cap = mesh(new THREE.SphereGeometry(.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), material(palette.cloth, .78));
      cap.scale.y = .78;
      const wrap = mesh(new THREE.TorusGeometry(.34, .075, 5, 14), material(0xd2aa58, .7, .12));
      wrap.rotation.x = Math.PI / 2;
      wrap.position.y = -.04;
      const veil = mesh(new THREE.PlaneGeometry(.56, .48), material(palette.clothDark, .9));
      veil.position.set(0, -.18, -.26);
      veil.rotation.x = .12;
      const face = mesh(new THREE.BoxGeometry(.38, .055, .03), material(0x201617, .5));
      face.position.set(0, -.09, .335);
      group.add(cap, wrap, veil, face);
    }
    this.parts.head.add(group);
    return group;
  }

  makeArmor(characterId, palette) {
    const group = new THREE.Group();
    if (characterId === "silver_knight") {
      const plate = mesh(new THREE.BoxGeometry(.72, .64, .29), material(palette.metal, .82, .42));
      plate.position.set(0, .03, .31);
      plate.rotation.x = -.08;
      const ridge = mesh(new THREE.BoxGeometry(.1, .54, .035), material(palette.glow, .55, .25));
      ridge.position.set(0, .03, .475);
      group.add(plate, ridge);

      const shield = new THREE.Group();
      const face = mesh(new THREE.CylinderGeometry(.48, .48, .13, 6), material(palette.metalDark, .9, .34));
      face.rotation.x = Math.PI / 2;
      const mark = mesh(new THREE.BoxGeometry(.1, .72, .045), material(palette.glow, .45));
      mark.position.z = .1;
      shield.add(face, mark);
      shield.position.set(-.06, -.36, .2);
      shield.rotation.set(.25, .35, .05);
      this.parts.leftArm.add(shield);
      group.userData.linkedParts = [shield];
    } else {
      const vest = mesh(new THREE.CylinderGeometry(.39, .47, .68, 8), material(palette.cloth, .7));
      vest.scale.z = .68;
      vest.position.y = .01;
      const sash = mesh(new THREE.BoxGeometry(.68, .14, .36), material(0xd1a64e, .7, .18));
      sash.position.set(0, -.2, .25);
      sash.rotation.z = -.18;
      const shoulder = mesh(new THREE.BoxGeometry(.88, .12, .4), material(palette.metalDark, .82, .28));
      shoulder.position.set(0, .28, .04);
      group.add(vest, sash, shoulder);
    }
    this.parts.body.add(group);
    return group;
  }

  makeWeapon(characterId, palette) {
    const group = new THREE.Group();
    if (characterId === "silver_knight") {
      const sword = this.makeBlade(1.34, palette.metal, 0xc7a553, false);
      sword.position.set(.02, -.5, .14);
      sword.rotation.set(-.05, 0, -.22);
      this.parts.rightArm.add(sword);
      group.userData.linkedParts = [sword];
    } else {
      const rightBlade = this.makeBlade(.9, 0xd6d9d7, 0xc99a3d, true);
      rightBlade.position.set(.02, -.48, .14);
      rightBlade.rotation.set(-.05, 0, -.38);
      const leftBlade = this.makeBlade(.9, 0xd6d9d7, 0xc99a3d, true);
      leftBlade.position.set(-.02, -.48, .14);
      leftBlade.rotation.set(-.05, 0, .38);
      this.parts.rightArm.add(rightBlade);
      this.parts.leftArm.add(leftBlade);
      group.userData.linkedParts = [rightBlade, leftBlade];
    }
    this.parts.body.add(group);
    return group;
  }

  makeBlade(length, bladeColor, guardColor, curved) {
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
