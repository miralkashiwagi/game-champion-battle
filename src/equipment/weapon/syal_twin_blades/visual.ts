import type { Mesh, Object3D } from "three";
import type { EquipmentAttachment, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const p={clothDark:0x07080b,metal:0xf2c230,metalDark:0x2a2517};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const make=(side: number)=>{const weapon=new THREE.Group(); const blade=new THREE.Mesh(new THREE.BoxGeometry(.09,.78,.052),material(p.metal,.36,.6)); blade.position.y=-.41; blade.rotation.z=side*-.035; const core=new THREE.Mesh(new THREE.BoxGeometry(.032,.72,.06),material(p.clothDark,.52,.35)); core.position.set(side*-.014,-.38,0); const tip=new THREE.Mesh(new THREE.ConeGeometry(.055,.19,4),material(p.metal,.36,.6)); tip.position.y=-.875; tip.rotation.z=Math.PI; const guard=new THREE.Mesh(new THREE.BoxGeometry(.28,.055,.085),material(p.clothDark,.56,.4)); const grip=new THREE.Mesh(new THREE.CylinderGeometry(.043,.043,.26,6),material(p.metalDark,.7,.28)); grip.position.y=.15; const pommel=new THREE.Mesh(new THREE.SphereGeometry(.065,6,4),material(p.metal,.4,.55)); pommel.position.y=.3; weapon.add(blade,core,tip,guard,grip,pommel); return weapon;}; return [{socket:"rightHandGrip",object:make(1),position:[0,-.02,.02],rotation:[0,0,-.12]},{socket:"leftHandGrip",object:make(-1),position:[0,-.02,.02],rotation:[0,0,.12]}] satisfies EquipmentAttachment[];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const m=material(0xf2c230,.42,.5); for(const side of [-1,1]){const blade=new THREE.Mesh(new THREE.BoxGeometry(.07,.66,.048),m); blade.position.x=side*.105; blade.rotation.z=side*.18; root.add(blade);} mark(root); return root; }
} satisfies EquipmentVisualFactory;

function mark(root: Object3D){root.traverse((child)=>{const mesh=child as Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});}
