import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { MODEL_CONTRACT, ProceduralCharacterView } from "../src/client/character-view.js";
import { getAttackPhase } from "../src/client/script-motion-player.js";
import { createShowcaseEquipment, faceShowcaseCamera } from "../src/client/scene.js";

const equipmentSets = {
  silver_knight: { cloak: "silver_knight_cloak", head: "silver_knight_helmet", armor: "silver_knight_armor", weapon: "silver_knight_sword" },
  saladin: { cloak: "saladin_cloak", head: "saladin_headgear", armor: "saladin_armor", weapon: "saladin_twin_blades" },
  syal: { cloak: "syal_cloak", head: "sample_helmet", armor: "sample_armor", weapon: "syal_twin_blades" }
};
const fullEquipment = (characterId) => Object.fromEntries(
  Object.entries(equipmentSets[characterId]).map(([slot, equipmentId]) => [slot, { id: `${equipmentId}-item`, equipmentId }])
);

test("ショーケース装備はキャラクターの初期equipmentIdから生成される", () => {
  for (const [characterId, expected] of Object.entries(equipmentSets)) {
    const equipment = createShowcaseEquipment(characterId);
    assert.deepEqual(
      Object.fromEntries(Object.entries(equipment).map(([slot, item]) => [slot, item.equipmentId])),
      expected
    );

    const view = new ProceduralCharacterView(characterId);
    view.setEquipment(equipment);
    assert.equal(view.equipment.size, 4);
    view.dispose();
  }
});

test("Silver Knightは本体VRMと共有スクリプトフォールバックを使用する", () => {
  const view = new ProceduralCharacterView("silver_knight");
  assert.equal(view.profile.renderer, "vrm");
  assert.equal(view.profile.url, "/characters/silver_knight/silver_knight.vrm");
  assert.equal(view.profile.scale, 1);
  assert.equal(view.profile.groundOffset, 0);
  assert.equal(view.profile.fallback, "shared-script");
  assert.equal(view.root.userData.modelType, "script");
  assert.equal(view.visual.scriptModel, undefined);
  view.dispose();
});

test("装着用とフィールド用GLBはURLだけを共有し変換を分離する", async () => {
  const { EQUIPMENT_REGISTRY } = await import("../src/equipment/registry.ts");
  const THREE = await import("three");
  const visual = EQUIPMENT_REGISTRY.sample_armor.visual;
  const definition = visual.createAttachments({
    THREE,
    material: (color) => new THREE.MeshStandardMaterial({ color }),
    makeBlade: () => null
  });
  assert.equal(definition.attachments[0].model.url, visual.fieldModel.url);
  assert.notDeepEqual(definition.attachments[0].model.position, visual.fieldModel.position);
  assert.equal(definition.attachments[0].model.position[2], -.1);
});

test("スクリプトモデルは装備を必要時だけSocketへ生成する", () => {
  const silver = new ProceduralCharacterView("silver_knight");
  assert.equal(silver.equipment.size, 0);
  silver.setEquipment(fullEquipment("silver_knight"));
  assert.equal(silver.equipment.get("armor").objects.length, 2);
  assert.equal(silver.rig.getSocket("leftHandGrip").children.length, 1);
  assert.equal(silver.rig.getSocket("rightHandGrip").children.length, 1);
  silver.dispose();

  const saladin = new ProceduralCharacterView("saladin");
  saladin.setEquipment(fullEquipment("saladin"));
  assert.equal(saladin.equipment.get("weapon").objects.length, 2);
  assert.equal(saladin.rig.getSocket("leftHandGrip").children.length, 1);
  assert.equal(saladin.rig.getSocket("rightHandGrip").children.length, 1);
  saladin.dispose();

  const syal = new ProceduralCharacterView("syal");
  syal.setEquipment(fullEquipment("syal"));
  assert.equal(syal.root.userData.modelType, "script");
  assert.equal(syal.equipment.get("weapon").objects.length, 2);
  assert.equal(syal.rig.getSocket("leftHandGrip").children.length, 1);
  assert.equal(syal.rig.getSocket("rightHandGrip").children.length, 1);
  syal.dispose();
});

test("GLB装備はスクリプトモデルをフォールバックとして保持する", async () => {
  const { EQUIPMENT_REGISTRY } = await import("../src/equipment/registry.ts");
  const THREE = await import("three");
  for (const [equipmentId, socket, url] of [
    ["sample_helmet", "headAccessory", "/equipment/head/sample_helmet/model.glb"],
    ["sample_armor", "chestArmor", "/equipment/armor/sample_armor/model.glb"]
  ]) {
    const definition = EQUIPMENT_REGISTRY[equipmentId].visual.createAttachments({
      THREE,
      material: (color) => new THREE.MeshStandardMaterial({ color }),
      makeBlade: () => null
    });
    assert.equal(definition.attachments[0].socket, socket);
    assert.equal(definition.attachments[0].model.url, url);
    assert.ok(definition.attachments[0].object.children.length > 0);
    assert.equal(definition.attachments[0].object.userData.isEquipmentFallback, true);
    assert.equal(definition.attachments[0].object.userData.equipmentSlot, EQUIPMENT_REGISTRY[equipmentId].definition.slot);
  }
});

test("攻撃モーションはgameRootのサーバー座標を変更しない", () => {
  const view = new ProceduralCharacterView("saladin");
  view.root.position.set(3, 0, .15);
  view.update({
    state: "AttackActive",
    facing: 1,
    worldY: 0,
    activeActionId: "saladin_lunar_slash",
    actionStartedFrame: 10,
    snapshotFrame: 24
  }, 1 / 60, 1);
  assert.equal(view.root.position.x, 3);
  assert.notEqual(view.visualRoot.position.z, 0);
  view.dispose();
});

test("攻撃フェーズは互換値と拡張値を返す", () => {
  const spec = { startupFrames: 10, activeFrames: 8, recoveryFrames: 12 };
  const windup = getAttackPhase({ actionStartedFrame: 0, snapshotFrame: 5 }, spec);
  assert.ok(windup.pose > 0);
  assert.equal(windup.strike, 0);
  assert.ok(windup.windup > 0);
  assert.equal(windup.impact, 0);
  assert.equal(windup.recover, 0);
  assert.ok(windup.progress > 0 && windup.progress < 1);
  assert.equal(windup.elapsedFrames, 5);

  const active = getAttackPhase({ actionStartedFrame: 0, snapshotFrame: 13 }, spec);
  assert.equal(active.pose, 1);
  assert.ok(active.strike > 0);
  assert.ok(active.impact > 0);
  assert.ok(active.followThrough > 0);

  const recovery = getAttackPhase({ actionStartedFrame: 0, snapshotFrame: 24 }, spec);
  assert.ok(recovery.pose < 1);
  assert.ok(recovery.strike < 1);
  assert.ok(recovery.recover > 0);
});

test("状態遷移ブレンド中もgameRoot座標を変更しない", () => {
  const view = new ProceduralCharacterView("silver_knight");
  view.root.position.set(2.25, 0, -.35);
  view.update({ state: "Idle", facing: 1, worldY: 0 }, 1 / 60, 0);
  view.update({ state: "Guard", facing: 1, worldY: 0 }, 1 / 120, 0);
  assert.equal(view.root.position.x, 2.25);
  assert.equal(view.root.position.z, -.35);
  assert.notEqual(view.rig.getBone("chest").rotation.x, 0);
  view.dispose();
});

test("キャラクター別の判定表示を切り替えられる", () => {
  const silver = new ProceduralCharacterView("silver_knight");
  const saladin = new ProceduralCharacterView("saladin");
  silver.setCollisionDebug(true);
  saladin.setCollisionDebug(true);
  assert.equal(silver.hurtboxView.visible, true);
  assert.equal(saladin.hurtboxView.visible, true);
  assert.ok(silver.registration.definition.collision.halfWidth > saladin.registration.definition.collision.halfWidth);
  silver.dispose();
  saladin.dispose();
});

test("攻撃判定表示はデバッグ有効時だけ表示される", () => {
  const view = new ProceduralCharacterView("silver_knight");
  const snapshot = {
    state: "AttackActive",
    facing: 1,
    worldY: 0,
    activeActionId: "silver_slash",
    actionStartedFrame: 4,
    snapshotFrame: 8
  };
  view.update(snapshot, 1 / 60, 1);
  assert.equal(view.hitboxView.visible, false);
  view.setCollisionDebug(true);
  view.update(snapshot, 1 / 60, 1);
  assert.equal(view.hitboxView.visible, true);
  view.setCollisionDebug(false);
  view.update(snapshot, 1 / 60, 1);
  assert.equal(view.hitboxView.visible, false);
  view.dispose();
});

test("キャラクター固有モーションはVisual登録から解決される", () => {
  const silver = new ProceduralCharacterView("silver_knight");
  const saladin = new ProceduralCharacterView("saladin");
  const syal = new ProceduralCharacterView("syal");
  assert.equal(silver.motionPlayer.motionController, silver.visual.motionController);
  assert.equal(saladin.motionPlayer.motionController, saladin.visual.scriptModel.motionController);
  assert.notEqual(silver.motionPlayer.motionController, saladin.motionPlayer.motionController);
  assert.notEqual(saladin.visual.motionController, syal.visual.motionController);
  silver.dispose();
  saladin.dispose();
  syal.dispose();
});

test("SyalのmotionIdはSyal用Controllerで共通攻撃ポーズを再生する", () => {
  const view = new ProceduralCharacterView("syal");
  view.update({
    state: "AttackActive",
    facing: 1,
    worldY: 0,
    activeActionId: "syal_lunar_slash",
    actionStartedFrame: 2,
    snapshotFrame: 16
  }, 1 / 60, 1);
  assert.equal(view.motionPlayer.motionController, view.visual.motionController);
  assert.notEqual(view.visualRoot.position.z, 0);
  view.dispose();
});

test("共通Humanoid走行は肩、肘、膝、足首を連動させる", () => {
  const view = new ProceduralCharacterView("syal");
  view.motionPlayer.time = 0;
  view.update({ state: "Move", facing: 1, worldY: 0 }, 1 / 30, 0);
  assert.notEqual(view.rig.getBone("hips").rotation.y, 0);
  assert.notEqual(view.rig.getBone("leftShoulder").rotation.y, 0);
  assert.notEqual(view.rig.getBone("leftLowerArm").rotation.z, 0);
  assert.notEqual(view.rig.getBone("leftLowerLeg").rotation.x, 0);
  assert.notEqual(view.rig.getBone("leftFoot").rotation.x, 0);
  assert.notEqual(view.rig.getBone("spine").position.y, view.motionPlayer.basePositions.get("spine").y);
  assert.notEqual(view.rig.getBone("chest").rotation.z, 0);
  assert.equal(view.profile.scale, 1);
  view.dispose();
});

test("共通Humanoidのダッシュとジャンプは全身モーションとして再生される", () => {
  assert.ok(MODEL_CONTRACT.stateMotions.includes("dash"));
  assert.ok(MODEL_CONTRACT.stateMotions.includes("jump"));

  const view = new ProceduralCharacterView("silver_knight");
  view.motionPlayer.time = 0;
  view.update({ state: "Dash", facing: 1, worldY: 0, velocity: { x: 6.8, y: 0 } }, 1 / 30, 0);
  assert.notEqual(view.rig.getBone("chest").rotation.x, 0);
  assert.notEqual(view.rig.getBone("leftLowerArm").rotation.z, 0);
  assert.notEqual(view.rig.getBone("leftLowerLeg").rotation.x, 0);

  view.update({ state: "Jump", facing: 1, worldY: .5, velocity: { x: 0, y: -8 } }, 1 / 30, 0);
  assert.notEqual(view.rig.getBone("hips").position.y, view.motionPlayer.basePositions.get("hips").y);
  assert.notEqual(view.rig.getBone("rightLowerLeg").rotation.x, 0);
  assert.equal(view.root.position.y, .5);
  view.dispose();
});

test("スクリプトモデルもVRM互換の骨格階層を持つ", () => {
  const view = new ProceduralCharacterView("silver_knight");
  assert.equal(view.rig.getBone("spine").parent, view.rig.getBone("hips"));
  assert.equal(view.rig.getBone("chest").parent, view.rig.getBone("spine"));
  assert.equal(view.rig.getBone("leftUpperLeg").parent, view.rig.getBone("hips"));
  assert.equal(view.rig.getBone("leftLowerLeg").parent, view.rig.getBone("leftUpperLeg"));
  assert.equal(view.rig.getBone("leftFoot").parent, view.rig.getBone("leftLowerLeg"));
  assert.equal(view.rig.getBone("leftLowerArm").parent, view.rig.getBone("leftUpperArm"));
  assert.equal(view.rig.getBone("leftHand").parent, view.rig.getBone("leftLowerArm"));
  view.dispose();
});

test("スクリプトモデルとVRM 1.0はローカル+Zを正面として扱う", () => {
  assert.equal(MODEL_CONTRACT.frontAxis, "+Z");
  const view = new ProceduralCharacterView("silver_knight");
  const forward = new THREE.Vector3();

  view.update({ state: "Idle", facing: 1, worldY: 0 }, 1 / 60, 0);
  view.root.getWorldDirection(forward);
  assert.ok(forward.x > .99);

  view.update({ state: "Idle", facing: -1, worldY: 0 }, 1 / 60, 0);
  view.root.getWorldDirection(forward);
  assert.ok(forward.x < -.99);
  view.dispose();
});

test("プレビューは全モデルのローカル+Zをカメラへ向ける", () => {
  for (const characterId of Object.keys(equipmentSets)) {
    const view = new ProceduralCharacterView(characterId);
    view.root.position.set(characterId === "silver_knight" ? -4.9 : characterId === "syal" ? 4.9 : 0, 0, .2);
    const cameraPosition = new THREE.Vector3(0, 3.4, 9.2);
    faceShowcaseCamera(view.root, cameraPosition);
    view.update({ state: "Idle", worldY: 0 }, 1 / 60, 0);

    const forward = view.root.getWorldDirection(new THREE.Vector3()).setY(0).normalize();
    const towardCamera = cameraPosition.clone().sub(view.root.position).setY(0).normalize();
    assert.ok(forward.dot(towardCamera) > .999);
    view.dispose();
  }
});

test("スクリプトモデルの攻撃も肘と膝を使用する", () => {
  const view = new ProceduralCharacterView("saladin");
  view.update({
    state: "AttackActive", facing: 1, worldY: 0,
    activeActionId: "saladin_lunar_slash", actionStartedFrame: 2, snapshotFrame: 16
  }, 1 / 60, 0);
  assert.notEqual(view.rig.getBone("rightLowerArm").rotation.z, 0);
  assert.notEqual(view.rig.getBone("rightLowerLeg").rotation.x, 0);
  view.dispose();
});

test("双剣モーションは装備ごとに異なる骨回転を持つ", () => {
  const saladin = new ProceduralCharacterView("saladin");
  const syal = new ProceduralCharacterView("syal");
  const snapshotBase = { state: "AttackActive", facing: 1, worldY: 0, actionStartedFrame: 2, snapshotFrame: 16 };
  saladin.update({ ...snapshotBase, activeActionId: "saladin_lunar_slash" }, 1 / 60, 0);
  syal.update({ ...snapshotBase, activeActionId: "syal_lunar_slash" }, 1 / 60, 0);
  assert.notEqual(saladin.rig.getBone("hips").position.y, syal.rig.getBone("hips").position.y);
  assert.notEqual(saladin.rig.getBone("chest").rotation.z, syal.rig.getBone("chest").rotation.z);
  assert.notEqual(saladin.visualRoot.rotation.y, syal.visualRoot.rotation.y);
  saladin.dispose();
  syal.dispose();
});

test("空中被弾は速度に応じて全身Humanoidポーズを変える", () => {
  const view = new ProceduralCharacterView("syal");
  view.root.position.x = 4;
  view.update({ state: "AirDamaged", facing: 1, worldY: .8, velocity: { x: 4.8, y: -6 } }, 1 / 60, 0);
  const risingChest = view.rig.getBone("chest").rotation.x;
  assert.notEqual(view.rig.getBone("hips").rotation.x, 0);
  assert.notEqual(view.rig.getBone("leftLowerArm").rotation.z, 0);
  assert.notEqual(view.rig.getBone("leftLowerLeg").rotation.x, 0);
  assert.equal(view.root.position.x, 4);

  view.update({ state: "AirDamaged", facing: 1, worldY: .4, velocity: { x: 4.8, y: 5 } }, 1 / 60, 0);
  assert.notEqual(view.rig.getBone("chest").rotation.x, risingChest);
  view.dispose();
});

test("ダウンは骨盤を軸に全身を倒す", () => {
  const view = new ProceduralCharacterView("saladin");
  view.update({ state: "Down", facing: -1, worldY: 0, velocity: { x: 0, y: 0 } }, 1 / 60, 0);
  assert.ok(Math.abs(view.rig.getBone("hips").rotation.z) > 1);
  assert.notEqual(view.rig.getBone("leftLowerLeg").rotation.x, 0);
  assert.equal(view.root.position.y, 0);
  view.dispose();
});
