import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={metal:0x9aa7b2,glow:0x54b9ff};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const plateGroup=new THREE.Group(); const plate=new THREE.Mesh(new THREE.BoxGeometry(.52,.46,.2),material(p.metal,.82,.42)); plate.position.set(0,.015,.22); plate.rotation.x=-.08; const ridge=new THREE.Mesh(new THREE.BoxGeometry(.075,.38,.028),material(p.glow,.55,.25)); ridge.position.set(0,.015,.335); plateGroup.add(plate,ridge); return [{socket:"chestArmor",object:plateGroup}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.BoxGeometry(.46,.4,.2),material(0x2783cb,.55,.34)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
