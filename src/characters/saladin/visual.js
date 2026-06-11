export const visual = {
  palette: { cloth: 0x8f2928, clothDark: 0x471718, metal: 0x85898b, metalDark: 0x292e31, plume: 0xd13b34, glow: 0xff665d },
  createEquipment(slot, { THREE, parts, material, makeBlade }) {
    const p = visual.palette;
    const group = new THREE.Group();
    if (slot === "cloak") {
      for (const side of [-1, 1]) { const tail = new THREE.Mesh(new THREE.PlaneGeometry(.36, 1.28), material(p.clothDark, .9)); tail.position.set(side * .22, -.14, -.37); tail.rotation.set(.13, 0, side * -.1); group.add(tail); }
      const clasp = new THREE.Mesh(new THREE.TorusGeometry(.18, .04, 5, 12), material(0xd6ad55, .52, .44)); clasp.position.set(0, .38, -.4); group.add(clasp); parts.body.add(group);
    } else if (slot === "head") {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), material(p.cloth, .78)); cap.scale.y = .78;
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(.34, .075, 5, 14), material(0xd2aa58, .7, .12)); wrap.rotation.x = Math.PI / 2; wrap.position.y = -.04;
      const veil = new THREE.Mesh(new THREE.PlaneGeometry(.56, .48), material(p.clothDark, .9)); veil.position.set(0, -.18, -.26); veil.rotation.x = .12;
      const face = new THREE.Mesh(new THREE.BoxGeometry(.38, .055, .03), material(0x201617, .5)); face.position.set(0, -.09, .335); group.add(cap, wrap, veil, face); parts.head.add(group);
    } else if (slot === "armor") {
      const vest = new THREE.Mesh(new THREE.CylinderGeometry(.39, .47, .68, 8), material(p.cloth, .7)); vest.scale.z = .68; vest.position.y = .01;
      const sash = new THREE.Mesh(new THREE.BoxGeometry(.68, .14, .36), material(0xd1a64e, .7, .18)); sash.position.set(0, -.2, .25); sash.rotation.z = -.18;
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(.88, .12, .4), material(p.metalDark, .82, .28)); shoulder.position.set(0, .28, .04); group.add(vest, sash, shoulder); parts.body.add(group);
    } else {
      const rightBlade = makeBlade(.9, 0xd6d9d7, 0xc99a3d, true); rightBlade.position.set(.02, -.48, .14); rightBlade.rotation.set(-.05, 0, -.38);
      const leftBlade = makeBlade(.9, 0xd6d9d7, 0xc99a3d, true); leftBlade.position.set(-.02, -.48, .14); leftBlade.rotation.set(-.05, 0, .38);
      parts.rightArm.add(rightBlade); parts.leftArm.add(leftBlade); group.userData.linkedParts = [rightBlade, leftBlade]; parts.body.add(group);
    }
    group.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    return group;
  },
  createFieldItem(slot, { THREE, material }) {
    const group = new THREE.Group(); const itemMaterial = material(0xc3433d, .55, .34);
    if (slot === "weapon") {
      for (const side of [-1, 1]) { const blade = new THREE.Mesh(new THREE.BoxGeometry(.08, .72, .07), itemMaterial); blade.position.x = side * .12; blade.rotation.z = side * .28; blade.castShadow = true; group.add(blade); }
      return group;
    }
    let item;
    if (slot === "head") item = new THREE.Mesh(new THREE.SphereGeometry(.29, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), itemMaterial);
    else if (slot === "armor") item = new THREE.Mesh(new THREE.CylinderGeometry(.25, .34, .5, 8), itemMaterial);
    else item = new THREE.Mesh(new THREE.ConeGeometry(.34, .82, 4, 1, true), itemMaterial);
    item.castShadow = true; group.add(item); return group;
  }
};
