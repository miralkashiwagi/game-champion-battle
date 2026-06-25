import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={metal:0x9aa7b2,metalDark:0x35414b,plume:0x1768b1};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const helmet=new THREE.Mesh(new THREE.CylinderGeometry(.24,.29,.32,6),material(p.metalDark,.9,.3)); const visor=new THREE.Mesh(new THREE.BoxGeometry(.46,.1,.1),material(p.metal,.8,.38)); visor.position.set(0,-.02,.24); const eye=new THREE.Mesh(new THREE.BoxGeometry(.31,.034,.02),material(0x10171d,.5)); eye.position.set(0,-.024,.305); const crest=new THREE.Mesh(new THREE.BoxGeometry(.065,.36,.2),material(p.plume,.68)); crest.position.set(0,.25,-.02); crest.rotation.z=-.18; group.add(helmet,visor,eye,crest); return [{socket:"headAccessory",object:group,position:[0,-.01,0]}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.CylinderGeometry(.18,.23,.27,6),material(0x2783cb,.55,.34)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
