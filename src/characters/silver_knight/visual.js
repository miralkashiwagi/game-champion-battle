export const visual = {
  palette: { cloth: 0x174f89, clothDark: 0x0b2d52, metal: 0x9aa7b2, metalDark: 0x35414b, plume: 0x1768b1, glow: 0x54b9ff },
  createEquipment(slot, { THREE, parts, material, makeBlade }) {
    const p = visual.palette;
    const group = new THREE.Group();
    if (slot === "cloak") {
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(.9, .92), material(p.clothDark, .9));
      cape.position.set(0, -.02, -.36); cape.rotation.x = .13; group.add(cape); parts.body.add(group);
    } else if (slot === "head") {
      const helmet = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, .43, 6), material(p.metalDark, .9, .3));
      const visor = new THREE.Mesh(new THREE.BoxGeometry(.64, .14, .14), material(p.metal, .8, .38)); visor.position.set(0, -.03, .32);
      const eye = new THREE.Mesh(new THREE.BoxGeometry(.43, .045, .025), material(0x10171d, .5)); eye.position.set(0, -.035, .405);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(.09, .5, .28), material(p.plume, .68)); crest.position.set(0, .34, -.03); crest.rotation.z = -.18;
      group.add(helmet, visor, eye, crest); parts.head.add(group);
    } else if (slot === "armor") {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(.72, .64, .29), material(p.metal, .82, .42)); plate.position.set(0, .03, .31); plate.rotation.x = -.08;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(.1, .54, .035), material(p.glow, .55, .25)); ridge.position.set(0, .03, .475); group.add(plate, ridge);
      const shield = new THREE.Group(); const face = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .13, 6), material(p.metalDark, .9, .34)); face.rotation.x = Math.PI / 2;
      const mark = new THREE.Mesh(new THREE.BoxGeometry(.1, .72, .045), material(p.glow, .45)); mark.position.z = .1; shield.add(face, mark); shield.position.set(-.06, -.36, .2); shield.rotation.set(.25, .35, .05);
      parts.leftArm.add(shield); group.userData.linkedParts = [shield]; parts.body.add(group);
    } else {
      const sword = makeBlade(1.34, p.metal, 0xc7a553, false); sword.position.set(.02, -.5, .14); sword.rotation.set(-.05, 0, -.22);
      parts.rightArm.add(sword); group.userData.linkedParts = [sword]; parts.body.add(group);
    }
    group.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    return group;
  },
  createFieldItem(slot, { THREE, material }) {
    const group = new THREE.Group(); let item;
    if (slot === "weapon") item = new THREE.Mesh(new THREE.BoxGeometry(.13, 1, .1), material(0x2783cb, .55, .34));
    else if (slot === "head") item = new THREE.Mesh(new THREE.CylinderGeometry(.24, .3, .36, 6), material(0x2783cb, .55, .34));
    else if (slot === "armor") item = new THREE.Mesh(new THREE.BoxGeometry(.62, .54, .28), material(0x2783cb, .55, .34));
    else item = new THREE.Mesh(new THREE.BoxGeometry(.62, .7, .05), material(0x2783cb, .55, .34));
    item.castShadow = true; group.add(item); return group;
  }
};
