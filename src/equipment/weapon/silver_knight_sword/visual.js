const p={metal:0x9aa7b2};

export const visual={
  createAttachments({THREE,material,makeBlade}){ const attachments=(()=>{const sword=makeBlade(1.34,p.metal,0xc7a553,false); return [{socket:"rightHandGrip",object:sword,position:[.02,.08,.14],rotation:[-.05,0,-.22],scale:2}];})(); for(const entry of attachments) mark(entry.object); return {attachments,motions:{drop:"item_drop",pickup:"item_pickup"}}; },
  createFieldItem({THREE,material}){ const root=new THREE.Group(); const item=new THREE.Mesh(new THREE.BoxGeometry(.13,1,.1),material(0x2783cb,.55,.34)); root.add(item); mark(root); return root; }
};

function mark(root){root.traverse((child)=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}});}

