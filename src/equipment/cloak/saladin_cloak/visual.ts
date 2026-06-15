import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={clothDark:0x471718};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); for(const side of [-1,1]){const tail=new THREE.Mesh(new THREE.PlaneGeometry(.36,1.28),material(p.clothDark,.9)); tail.position.set(side*.22,-.14,-.37); tail.rotation.set(.13,0,side*-.1); group.add(tail);} const clasp=new THREE.Mesh(new THREE.TorusGeometry(.18,.04,5,12),material(0xd6ad55,.52,.44)); clasp.position.set(0,.38,-.4); group.add(clasp); return [{socket:"back",object:group}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.ConeGeometry(.34,.82,4,1,true),material(0xc3433d,.55,.34)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
