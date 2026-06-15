const p={clothDark:0x0b2d52};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const cape=new THREE.Mesh(new THREE.PlaneGeometry(.9,.92),material(p.clothDark,.9)); cape.position.set(0,-.02,-.36); cape.rotation.x=.13; group.add(cape); return [{socket:"back",object:group}];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.BoxGeometry(.62,.7,.05),material(0x2783cb,.55,.34)); root.add(item); mark(root); return root; }
};

function mark(root){root.traverse((child)=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}});}

