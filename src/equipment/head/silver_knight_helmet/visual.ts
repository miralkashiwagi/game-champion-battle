import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={metal:0x9aa7b2,metalDark:0x35414b,plume:0x1768b1};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const helmet=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.43,6),material(p.metalDark,.9,.3)); const visor=new THREE.Mesh(new THREE.BoxGeometry(.64,.14,.14),material(p.metal,.8,.38)); visor.position.set(0,-.03,.32); const eye=new THREE.Mesh(new THREE.BoxGeometry(.43,.045,.025),material(0x10171d,.5)); eye.position.set(0,-.035,.405); const crest=new THREE.Mesh(new THREE.BoxGeometry(.09,.5,.28),material(p.plume,.68)); crest.position.set(0,.34,-.03); crest.rotation.z=-.18; group.add(helmet,visor,eye,crest); return [{socket:"headAccessory",object:group}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,.36,6),material(0x2783cb,.55,.34)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
