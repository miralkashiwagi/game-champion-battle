import { motionController } from "./motions.js";

const palette = {
  cloth: 0x111318,
  clothDark: 0x07080b,
  metal: 0xf2c230,
  metalDark: 0x2a2517,
  plume: 0xffd84a,
  glow: 0xffd84a
};

export const visual = {
  palette,
  motionController,
  createEquipment(slot, context) {
    return createSyalEquipment(slot, context);
  },
  createFieldItem(slot, context) {
    return createSyalFieldItem(slot, context);
  }
};

function createSyalEquipment(slot, { THREE, material }) {
  const attachments = [];
  if (slot === "cloak") {
    const group = new THREE.Group();
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.16, .025, 5, 14, Math.PI * 1.45), material(palette.metal, .5, .48));
    collar.rotation.set(Math.PI / 2, 0, -.7);
    collar.position.set(0, .08, -.04);
    group.add(collar);
    for (const side of [-1, 1]) {
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(.19, .58), material(palette.clothDark, .92));
      cape.position.set(side * .105, -.24, -.045);
      cape.rotation.set(.08, side * -.04, side * -.05);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(.025, .58, .012), material(palette.metal, .48, .42));
      trim.position.set(side * .205, -.24, -.038);
      trim.rotation.z = side * -.05;
      group.add(cape, trim);
    }
    attachments.push({ socket: "back", object: group, position: [0, .02, -.08] });
  } else if (slot === "head") {
    const group = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(.16, .018, 5, 18, Math.PI * 1.45), material(palette.clothDark, .6, .3));
    band.rotation.set(Math.PI / 2, 0, -.7);
    band.position.set(0, -.035, -.015);
    const leftGuard = new THREE.Mesh(new THREE.BoxGeometry(.035, .115, .045), material(palette.metal, .46, .5));
    leftGuard.position.set(-.165, -.07, 0);
    leftGuard.rotation.z = -.15;
    const rightGuard = leftGuard.clone();
    rightGuard.position.x = .165;
    rightGuard.rotation.z = .15;
    group.add(band, leftGuard, rightGuard);
    attachments.push({ socket: "headAccessory", object: group, position: [0, -.04, .015] });
  } else if (slot === "armor") {
    const group = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(.38, .36, .055), material(palette.clothDark, .7, .28));
    plate.position.set(0, -.04, .075);
    const center = new THREE.Mesh(new THREE.BoxGeometry(.055, .29, .018), material(palette.metal, .46, .5));
    center.position.set(0, -.04, .11);
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(.36, .035, .018), material(palette.metal, .46, .5));
    topTrim.position.set(0, .125, .11);
    group.add(plate, center, topTrim);
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(.16, .055, .16), material(palette.metalDark, .65, .42));
      shoulder.position.set(side * .27, .13, .025);
      shoulder.rotation.z = side * -.12;
      const edge = new THREE.Mesh(new THREE.BoxGeometry(.16, .018, .17), material(palette.metal, .44, .5));
      edge.position.set(side * .27, .158, .025);
      edge.rotation.z = side * -.12;
      group.add(shoulder, edge);
    }
    attachments.push({ socket: "chestArmor", object: group, position: [0, 0, .02] });
  } else {
    const rightBlade = makeSyalBlade(THREE, material, 1);
    const leftBlade = makeSyalBlade(THREE, material, -1);
    attachments.push(
      { socket: "rightHandGrip", object: rightBlade, position: [0, -.015, .015], rotation: [0, 0, -.12], scale: .58 },
      { socket: "leftHandGrip", object: leftBlade, position: [0, -.015, .015], rotation: [0, 0, .12], scale: .58 }
    );
  }
  markShadows(attachments);
  return { attachments, motions: { drop: "item_drop", pickup: "item_pickup" } };
}

function makeSyalBlade(THREE, material, side) {
  const weapon = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.075, .68, .045), material(palette.metal, .36, .6));
  blade.position.y = -.36;
  blade.rotation.z = side * -.035;
  const darkCore = new THREE.Mesh(new THREE.BoxGeometry(.025, .62, .052), material(palette.clothDark, .52, .35));
  darkCore.position.set(side * -.012, -.33, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 4), material(palette.metal, .36, .6));
  tip.position.y = -.77;
  tip.rotation.z = Math.PI;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(.22, .045, .07), material(palette.clothDark, .56, .4));
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .2, 6), material(palette.metalDark, .7, .28));
  grip.position.y = .12;
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), material(palette.metal, .4, .55));
  pommel.position.y = .24;
  weapon.add(blade, darkCore, tip, guard, grip, pommel);
  return weapon;
}

function createSyalFieldItem(slot, { THREE, material }) {
  const group = new THREE.Group();
  const yellow = material(palette.metal, .42, .5);
  const black = material(palette.clothDark, .72, .28);
  let item;
  if (slot === "weapon") {
    for (const side of [-1, 1]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(.055, .52, .04), yellow);
      blade.position.set(side * .08, 0, 0);
      blade.rotation.z = side * .18;
      group.add(blade);
    }
  } else if (slot === "head") {
    item = new THREE.Mesh(new THREE.TorusGeometry(.15, .025, 5, 16, Math.PI * 1.5), yellow);
  } else if (slot === "armor") {
    item = new THREE.Mesh(new THREE.BoxGeometry(.36, .3, .08), black);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.05, .28, .09), yellow);
    group.add(stripe);
  } else {
    item = new THREE.Mesh(new THREE.PlaneGeometry(.4, .58), black);
  }
  if (item) group.add(item);
  group.traverse((child) => {
    if (child.isMesh) child.castShadow = true;
  });
  return group;
}

function markShadows(attachments) {
  for (const { object } of attachments) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
}
