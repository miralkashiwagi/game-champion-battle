import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={clothDark:0x07080b,metal:0xf2c230};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const band=new THREE.Mesh(new THREE.TorusGeometry(.16,.018,5,18,Math.PI*1.45),material(p.clothDark,.6,.3)); band.rotation.set(Math.PI/2,0,-.7); band.position.set(0,-.035,-.015); const leftGuard=new THREE.Mesh(new THREE.BoxGeometry(.035,.115,.045),material(p.metal,.46,.5)); leftGuard.position.set(-.165,-.07,0); leftGuard.rotation.z=-.15; const rightGuard=leftGuard.clone(); rightGuard.position.x=.165; rightGuard.rotation.z=.15; group.add(band,leftGuard,rightGuard); return [{socket:"headAccessory",object:group,position:[0,-.04,.015]}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.TorusGeometry(.15,.025,5,16,Math.PI*1.5),material(0xf2c230,.42,.5)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
