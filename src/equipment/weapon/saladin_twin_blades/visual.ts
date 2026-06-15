

import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const rightBlade=makeBlade(.9,0xd6d9d7,0xc99a3d,true); const leftBlade=makeBlade(.9,0xd6d9d7,0xc99a3d,true); return [{socket:"rightHandGrip",object:rightBlade,position:[.02,.1,.14],rotation:[-.05,0,-.38],scale:2},{socket:"leftHandGrip",object:leftBlade,position:[-.02,.1,.14],rotation:[-.05,0,.38],scale:2}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const m=material(0xc3433d,.55,.34); for(const side of [-1,1]){const blade=new THREE.Mesh(new THREE.BoxGeometry(.08,.72,.07),m); blade.position.x=side*.12; blade.rotation.z=side*.28; root.add(blade);} mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
