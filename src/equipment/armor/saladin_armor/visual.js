const p={cloth:0x8f2928,metalDark:0x292e31};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const vest=new THREE.Mesh(new THREE.CylinderGeometry(.39,.47,.68,8),material(p.cloth,.7)); vest.scale.z=.68; vest.position.y=.01; const sash=new THREE.Mesh(new THREE.BoxGeometry(.68,.14,.36),material(0xd1a64e,.7,.18)); sash.position.set(0,-.2,.25); sash.rotation.z=-.18; const shoulder=new THREE.Mesh(new THREE.BoxGeometry(.88,.12,.4),material(p.metalDark,.82,.28)); shoulder.position.set(0,.28,.04); group.add(vest,sash,shoulder); return [{socket:"chestArmor",object:group}];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.CylinderGeometry(.25,.34,.5,8),material(0xc3433d,.55,.34)); root.add(item); mark(root); return root; }
};

function mark(root){root.traverse((child)=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}});}

