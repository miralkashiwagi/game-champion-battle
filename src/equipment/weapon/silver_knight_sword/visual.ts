import type { Mesh, Object3D } from "three";
import { EQUIPMENT_ID } from "./id.ts";
import type { EquipmentAttachment, EquipmentModelVisual, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={metal:0x9aa7b2};
const handForwardGripRotation = [-1.5, 0, Math.PI - .3] as [number, number, number];
const MODEL_URL = `/equipment/weapon/${EQUIPMENT_ID}/model.glb`;
const modelForwardGripRotation = [Math.PI / 2, 0, 1] as [number, number, number];
const attachedModel = {
  url: MODEL_URL,
  position: [0, .26, -.1],
  rotation: modelForwardGripRotation,
  scale: .58
} satisfies EquipmentModelVisual;
const fieldModel = {
  url: MODEL_URL,
  position: [0, -.36, 0],
  rotation: modelForwardGripRotation,
  scale: .58
} satisfies EquipmentModelVisual;

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const sword=makeBlade(.98,p.metal,0xc7a553,false); return [{socket:"rightHandGrip",object:sword,model:attachedModel,position:[.015,.065,.105],rotation:handForwardGripRotation}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.BoxGeometry(.1,.74,.08),material(0x2783cb,.55,.34)); root.add(item); mark(root); return root; },
  fieldModel
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
