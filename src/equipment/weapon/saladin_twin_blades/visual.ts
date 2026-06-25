

import type { Mesh, Object3D } from "three";
import { EQUIPMENT_ID } from "./id.ts";
import type { EquipmentAttachment, EquipmentModelVisual, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const MODEL_URL = `/equipment/weapon/${EQUIPMENT_ID}/model.glb`;
const modelForwardGripRotation = [Math.PI / 2, 0, 1] as [number, number, number];
const rightHandGripRotation = [-1.5, 0, Math.PI - .3] as [number, number, number];
const leftHandGripRotation = [-1.5, 0, -Math.PI + .3] as [number, number, number];
const attachedModel = {
  url: MODEL_URL,
  position: [0, .26, -.1],
  rotation: modelForwardGripRotation,
  scale: .54
} satisfies EquipmentModelVisual;
const fieldModel = {
  url: MODEL_URL,
  position: [0, -.34, 0],
  rotation: modelForwardGripRotation,
  scale: .54
} satisfies EquipmentModelVisual;

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const rightBlade=makeBlade(.9,0xd6d9d7,0xc99a3d,true); const leftBlade=makeBlade(.9,0xd6d9d7,0xc99a3d,true); return [{socket:"rightHandGrip",object:rightBlade,model:attachedModel,position:[.02,.1,.14],rotation:rightHandGripRotation},{socket:"leftHandGrip",object:leftBlade,model:attachedModel,position:[-.02,.1,.14],rotation:leftHandGripRotation}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const m=material(0xc3433d,.55,.34); for(const side of [-1,1]){const blade=new THREE.Mesh(new THREE.BoxGeometry(.08,.72,.07),m); blade.position.x=side*.12; blade.rotation.z=side*.28; root.add(blade);} mark(root); return root; },
  fieldModel
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
