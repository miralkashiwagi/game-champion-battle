const p={clothDark:0x07080b,metal:0xf2c230,metalDark:0x2a2517};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const make=(side)=>{const weapon=new THREE.Group(); const blade=new THREE.Mesh(new THREE.BoxGeometry(.075,.68,.045),material(p.metal,.36,.6)); blade.position.y=-.36; blade.rotation.z=side*-.035; const core=new THREE.Mesh(new THREE.BoxGeometry(.025,.62,.052),material(p.clothDark,.52,.35)); core.position.set(side*-.012,-.33,0); const tip=new THREE.Mesh(new THREE.ConeGeometry(.045,.16,4),material(p.metal,.36,.6)); tip.position.y=-.77; tip.rotation.z=Math.PI; const guard=new THREE.Mesh(new THREE.BoxGeometry(.22,.045,.07),material(p.clothDark,.56,.4)); const grip=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.2,6),material(p.metalDark,.7,.28)); grip.position.y=.12; const pommel=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),material(p.metal,.4,.55)); pommel.position.y=.24; weapon.add(blade,core,tip,guard,grip,pommel); return weapon;}; return [{socket:"rightHandGrip",object:make(1),position:[0,-.015,.015],rotation:[0,0,-.12],scale:.58},{socket:"leftHandGrip",object:make(-1),position:[0,-.015,.015],rotation:[0,0,.12],scale:.58}];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const m=material(0xf2c230,.42,.5); for(const side of [-1,1]){const blade=new THREE.Mesh(new THREE.BoxGeometry(.055,.52,.04),m); blade.position.x=side*.08; blade.rotation.z=side*.18; root.add(blade);} mark(root); return root; }
};

function mark(root){root.traverse((child)=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}});}

