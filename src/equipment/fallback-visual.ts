import type { Group, Mesh, Object3D } from "three";
import type { EquipmentSlot, EquipmentVisualContext } from "../shared/character-types.ts";

export function createFallbackEquipment(slot: EquipmentSlot, context: EquipmentVisualContext): Group {
  const { THREE, material } = context;
  const root = new THREE.Group();
  const metal = material(0x858b92, .78, .28);
  const dark = material(0x34383d, .82, .2);

  if (slot === "head") {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(.31, 8, 5, 0, Math.PI * 2, 0, Math.PI * .62), metal);
    shell.scale.y = .88;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.3, .035, 5, 12), dark);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -.085;
    root.add(shell, rim);
  } else if (slot === "armor") {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(.58, .52, .12), metal);
    plate.position.z = .12;
    const center = new THREE.Mesh(new THREE.BoxGeometry(.08, .4, .035), dark);
    center.position.z = .2;
    root.add(plate, center);
  } else {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .3), metal);
    root.add(marker);
  }

  mark(root);
  root.userData.isEquipmentFallback = true;
  root.userData.equipmentSlot = slot;
  return root;
}

function mark(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
}
