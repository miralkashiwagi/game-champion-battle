import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={clothDark:0x07080b,metal:0xf2c230};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const collar=new THREE.Mesh(new THREE.TorusGeometry(.16,.025,5,14,Math.PI*1.45),material(p.metal,.5,.48)); collar.rotation.set(Math.PI/2,0,-.7); collar.position.set(0,.08,-.04); group.add(collar); for(const side of [-1,1]){const cape=new THREE.Mesh(new THREE.PlaneGeometry(.19,.58),material(p.clothDark,.92)); cape.position.set(side*.105,-.24,-.045); cape.rotation.set(.08,side*-.04,side*-.05); const trim=new THREE.Mesh(new THREE.BoxGeometry(.025,.58,.012),material(p.metal,.48,.42)); trim.position.set(side*.205,-.24,-.038); trim.rotation.z=side*-.05; group.add(cape,trim);} return [{socket:"back",object:group,position:[0,.02,-.08]}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.PlaneGeometry(.4,.58),material(0x07080b,.72,.28)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
