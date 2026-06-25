import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={cloth:0x8f2928,clothDark:0x471718};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const cap=new THREE.Mesh(new THREE.SphereGeometry(.34,10,6,0,Math.PI*2,0,Math.PI/2),material(p.cloth,.78)); cap.scale.y=.78; const wrap=new THREE.Mesh(new THREE.TorusGeometry(.34,.075,5,14),material(0xd2aa58,.7,.12)); wrap.rotation.x=Math.PI/2; wrap.position.y=-.04; const veil=new THREE.Mesh(new THREE.PlaneGeometry(.56,.48),material(p.clothDark,.9)); veil.position.set(0,-.18,-.26); veil.rotation.x=.12; const face=new THREE.Mesh(new THREE.BoxGeometry(.38,.055,.03),material(0x201617,.5)); face.position.set(0,-.09,.335); group.add(cap,wrap,veil,face); return [{socket:"headAccessory",object:group}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.SphereGeometry(.29,10,6,0,Math.PI*2,0,Math.PI/2),material(0xc3433d,.55,.34)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
