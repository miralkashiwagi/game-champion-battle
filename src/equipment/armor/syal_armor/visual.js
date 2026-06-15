const p={clothDark:0x07080b,metal:0xf2c230,metalDark:0x2a2517};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const group=new THREE.Group(); const plate=new THREE.Mesh(new THREE.BoxGeometry(.38,.36,.055),material(p.clothDark,.7,.28)); plate.position.set(0,-.04,.075); const center=new THREE.Mesh(new THREE.BoxGeometry(.055,.29,.018),material(p.metal,.46,.5)); center.position.set(0,-.04,.11); const topTrim=new THREE.Mesh(new THREE.BoxGeometry(.36,.035,.018),material(p.metal,.46,.5)); topTrim.position.set(0,.125,.11); group.add(plate,center,topTrim); for(const side of [-1,1]){const shoulder=new THREE.Mesh(new THREE.BoxGeometry(.16,.055,.16),material(p.metalDark,.65,.42)); shoulder.position.set(side*.27,.13,.025); shoulder.rotation.z=side*-.12; const edge=new THREE.Mesh(new THREE.BoxGeometry(.16,.018,.17),material(p.metal,.44,.5)); edge.position.set(side*.27,.158,.025); edge.rotation.z=side*-.12; group.add(shoulder,edge);} return [{socket:"chestArmor",object:group,position:[0,0,.02]}];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.BoxGeometry(.36,.3,.08),material(0x07080b,.72,.28)); root.add(item); mark(root); return root; }
};

function mark(root){root.traverse((child)=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}});}

