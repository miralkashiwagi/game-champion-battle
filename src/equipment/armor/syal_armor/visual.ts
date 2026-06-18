import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={clothDark:0x07080b,metal:0xf2c230,metalDark:0x2a2517};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const plate=new THREE.Mesh(new THREE.BoxGeometry(.52,.48,.075),material(p.clothDark,.7,.28)); plate.position.set(0,-.035,.085); const center=new THREE.Mesh(new THREE.BoxGeometry(.075,.39,.024),material(p.metal,.46,.5)); center.position.set(0,-.035,.13); const topTrim=new THREE.Mesh(new THREE.BoxGeometry(.49,.048,.024),material(p.metal,.46,.5)); topTrim.position.set(0,.175,.13); group.add(plate,center,topTrim); for(const side of [-1,1]){const shoulder=new THREE.Mesh(new THREE.BoxGeometry(.23,.08,.22),material(p.metalDark,.65,.42)); shoulder.position.set(side*.36,.18,.03); shoulder.rotation.z=side*-.12; const edge=new THREE.Mesh(new THREE.BoxGeometry(.23,.026,.23),material(p.metal,.44,.5)); edge.position.set(side*.36,.218,.03); edge.rotation.z=side*-.12; group.add(shoulder,edge);} return [{socket:"chestArmor",object:group,position:[0,0,.025]}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.BoxGeometry(.5,.42,.11),material(0x07080b,.72,.28)); root.add(item); mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
