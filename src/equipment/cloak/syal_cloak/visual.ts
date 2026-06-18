import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={clothDark:0x07080b,metal:0xf2c230};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const collar=new THREE.Mesh(new THREE.TorusGeometry(.22,.034,5,14,Math.PI*1.45),material(p.metal,.5,.48)); collar.rotation.set(Math.PI/2,0,-.7); collar.position.set(0,.1,-.045); group.add(collar); for(const side of [-1,1]){const cape=new THREE.Mesh(new THREE.PlaneGeometry(.27,.78),material(p.clothDark,.92)); cape.position.set(side*.145,-.32,-.055); cape.rotation.set(.08,side*-.04,side*-.05); const trim=new THREE.Mesh(new THREE.BoxGeometry(.034,.78,.014),material(p.metal,.48,.42)); trim.position.set(side*.29,-.32,-.046); trim.rotation.z=side*-.05; group.add(cape,trim);} return [{socket:"back",object:group,position:[0,.015,-.06]}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.PlaneGeometry(.54,.76),material(0x07080b,.72,.28)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
