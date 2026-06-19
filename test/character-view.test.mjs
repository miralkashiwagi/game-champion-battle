import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { MODEL_CONTRACT, ProceduralCharacterView } from "../src/client/character-view.js";
import { getAttackPhase } from "../src/client/script-motion-player.js";
import { createInPlaceClip } from "../src/client/vrma-motion-player.js";
import { findMissingVrmaMotionIds, getVrmaMotionSet } from "../src/client/vrma-motion-registry.js";
import { applyBattleCharacterRenderScale, BATTLE_CAMERA_TARGET_Y, BATTLE_CHARACTER_RENDER_SCALE, ChampionScene, createShowcaseEquipment, faceShowcaseCamera } from "../src/client/scene.js";

const equipmentSets = {
  silver_knight: { cloak: "silver_knight_cloak", head: "silver_knight_helmet", armor: "silver_knight_armor", weapon: "silver_knight_sword" },
  saladin: { cloak: "saladin_cloak", head: "saladin_headgear", armor: "saladin_armor", weapon: "saladin_twin_blades" },
  syal: { cloak: "syal_cloak", head: "sample_helmet", armor: "syal_armor", weapon: "syal_twin_blades" }
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

test("SaladinはVRMを優先しロード中はscript fallbackを使用する", () => {
  const view = new ProceduralCharacterView("saladin");
  assert.equal(view.profile.renderer, "vrm");
  assert.equal(view.profile.url, "/characters/saladin/saladin.vrm");
  assert.equal(view.profile.fallback, "shared-script");
  assert.equal(view.root.userData.modelType, "script");
  assert.equal(view.motionPlayer.motionController, view.visual.scriptModel.motionController);
  view.dispose();
});

test("VRMロード後はVRMAモーションプレイヤーへ切り替える", () => {
  for (const characterId of ["silver_knight", "saladin", "syal"]) {
    const view = new ProceduralCharacterView(characterId);
    const bones = makeVrmBones();
    const vrm = {
      scene: new THREE.Group(),
      humanoid: { getNormalizedBoneNode: (name) => bones[name] },
      update() {}
    };
    view.installVrm(vrm);
    assert.equal(view.root.userData.modelType, "vrm");
    assert.equal(view.motionPlayer.kind, "vrma");
    assert.equal(view.motionPlayer.motionSet.defaultState, "idle");
    view.dispose();
  }
});

test("Saladinを含むGameplay motionIdはVRMA registryへ登録されている", () => {
  assert.deepEqual(findMissingVrmaMotionIds(), []);
  const clips = getVrmaMotionSet().clips;
  for (const motionId of ["saladin_combo_1", "saladin_lunar_slash", "saladin_forward_cut", "saladin_spin", "saladin_windwall"]) {
    assert.ok(clips[motionId], `${motionId} should be registered`);
  }
  assert.match(clips.saladin_forward_cut.fallbackReason, /No dedicated thrust/);
  assert.match(clips.silver_thrust.fallbackReason, /No dedicated thrust/);
});

test("装備のmotions.tsがVRMA clipを選びregistryが収集する", async () => {
  const { EQUIPMENT_REGISTRY } = await import("../src/equipment/registry.ts");
  const clips = getVrmaMotionSet().clips;
  assert.equal(clips.silver_thrust, EQUIPMENT_REGISTRY.silver_knight_sword.vrmaMotions.silver_thrust);
  assert.equal(clips.saladin_lunar_slash, EQUIPMENT_REGISTRY.saladin_twin_blades.vrmaMotions.saladin_lunar_slash);
  assert.equal(clips.syal_spin, EQUIPMENT_REGISTRY.syal_cloak.vrmaMotions.syal_spin);
  assert.equal(clips.silver_headbutt.url, "/assets/motions/combat/headbutt.vrma");
  assert.equal(clips.syal_windwall.url, "/assets/motions/combat/headbutt.vrma");
  assert.equal(clips.saladin_windwall.url, "/assets/motions/combat/headbutt.vrma");
});

test("ダウンVRMAはゲーム上のDown時間内に倒れ切る速度で再生する", () => {
  const clips = getVrmaMotionSet().clips;
  assert.equal(clips.down.url, "/assets/motions/reaction/knockdown.vrma");
  assert.ok(clips.down.playbackRate > 1);
  assert.ok(clips.down.interruptibleAfter < .75);
  assert.equal(clips.dead.playbackRate, clips.down.playbackRate);
});

test("ひざつきVRMAはKneelDown時間内に反応が見える速度で再生する", () => {
  const clips = getVrmaMotionSet().clips;
  assert.equal(clips.kneel.url, "/assets/motions/reaction/crumple-stun.vrma");
  assert.ok(clips.kneel.fadeIn < .12);
  assert.ok(clips.kneel.playbackRate > 1);
});

test("VRMA inPlace再生では水平root motionだけ抑え高さの姿勢を残す", () => {
  const source = new THREE.AnimationClip("walk", 1, [
    new THREE.VectorKeyframeTrack("hips.position", [0, 1], [0, 0, 0, 3, -.4, 1]),
    new THREE.QuaternionKeyframeTrack("hips.quaternion", [0, 1], [0, 0, 0, 1, 0, .1, 0, .99]),
    new THREE.VectorKeyframeTrack("leftFoot.position", [0, 1], [0, 0, 0, 0, -.12, .2])
  ]);
  const inPlace = createInPlaceClip(source, { rootMotion: "inPlace" });
  assert.deepEqual(inPlace.tracks.map((track) => track.name), ["hips.position", "hips.quaternion", "leftFoot.position"]);
  assertVectorValues(inPlace.tracks[0].values, [0, 0, 0, 0, -.4, 0]);
  assertVectorValues(inPlace.tracks[2].values, [0, 0, 0, 0, -.12, 0]);

  const clipRootMotion = createInPlaceClip(source, { rootMotion: "clip" });
  assert.equal(clipRootMotion.tracks.length, 3);

  const noRootMotion = createInPlaceClip(source, { rootMotion: "none" });
  assert.deepEqual(noRootMotion.tracks.map((track) => track.name), ["hips.quaternion"]);
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

test("戦闘中のキャラクター描画はgameRoot側で全体拡大する", () => {
  const view = new ProceduralCharacterView("silver_knight");
  assert.equal(BATTLE_CHARACTER_RENDER_SCALE, 2);
  assert.equal(BATTLE_CAMERA_TARGET_Y, 1.6);
  assert.equal(view.visualRoot.scale.x, view.profile.scale);
  applyBattleCharacterRenderScale(view.root);
  assert.equal(view.root.scale.x, 2);
  assert.equal(view.hurtboxView.scale.x, 1);
  view.dispose();
});

test("ローカルプレイヤーの移動描画だけ短時間予測する", () => {
  const scene = Object.create(ChampionScene.prototype);
  scene.localSide = "p1";
  scene.snapshotReceivedAt = performance.now() - 100;
  scene.localInputProvider = () => ({ left: false, right: true, down: false });
  const player = {
    side: "p1",
    characterId: "silver_knight",
    position: { x: 260, y: 430 },
    velocity: { x: 4.1, y: 0 },
    state: "Move",
    activeActionId: null
  };

  assert.ok(scene.predictedLocalPlayerX(player) > player.position.x);

  scene.snapshotReceivedAt = performance.now() - 100;
  const movePredictedX = scene.predictedLocalPlayerX(player);
  scene.snapshotReceivedAt = performance.now() - 100;
  const dashPredictedX = scene.predictedLocalPlayerX({ ...player, state: "Dash" });
  assert.ok(dashPredictedX > movePredictedX);

  const airborne = { ...player, state: "Jump", velocity: { x: -4.1, y: -5 } };
  assert.ok(scene.predictedLocalPlayerX(airborne) < airborne.position.x);

  const attacking = { ...player, state: "AttackStartup", activeActionId: "silver_slash" };
  assert.equal(scene.predictedLocalPlayerX(attacking), attacking.position.x);
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

test("素手攻撃はVRM Humanoid向けに肩、胸、肘、脚を使う", () => {
  const view = new ProceduralCharacterView("silver_knight");
  for (const [motionId, shoulderName, lowerArmName, lowerLegName, lowerArmSign] of [
    ["barehand_1", "leftShoulder", "leftLowerArm", "leftLowerLeg", -1],
    ["barehand_2", "rightShoulder", "rightLowerArm", "rightLowerLeg", 1],
    ["barehand_3", "leftShoulder", "leftLowerArm", "leftLowerLeg", -1]
  ]) {
    view.update({
      state: "AttackActive",
      facing: 1,
      worldY: 0,
      activeActionId: motionId,
      actionStartedFrame: 0,
      snapshotFrame: 13
    }, 1 / 60, 0);
    assert.notEqual(view.rig.getBone(shoulderName).rotation.z, 0);
    assert.notEqual(view.rig.getBone(lowerArmName).rotation.z, 0);
    assert.equal(Math.sign(view.rig.getBone(lowerArmName).rotation.z), lowerArmSign);
    assert.notEqual(view.rig.getBone("chest").rotation.y, 0);
    assert.notEqual(view.rig.getBone(lowerLegName).rotation.x, 0);
  }
  view.dispose();
});

test("素手攻撃は予備動作から腕を前側へ構える", () => {
  const view = new ProceduralCharacterView("silver_knight");
  for (const [motionId, armName, shoulderName] of [
    ["barehand_1", "leftUpperArm", "leftShoulder"],
    ["barehand_2", "rightUpperArm", "rightShoulder"],
    ["barehand_3", "leftUpperArm", "leftShoulder"]
  ]) {
    view.update({
      state: "AttackStartup",
      facing: 1,
      worldY: 0,
      activeActionId: motionId,
      actionStartedFrame: 0,
      snapshotFrame: 5
    }, 1 / 60, 0);
    assert.ok(view.rig.getBone(armName).rotation.x < -.35);
    assert.notEqual(view.rig.getBone(shoulderName).rotation.y, 0);
    assert.notEqual(view.rig.getBone(shoulderName).rotation.z, 0);
  }
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

function makeVrmBones() {
  const bones = Object.fromEntries(MODEL_CONTRACT.humanoidBones.map((name) => [name, new THREE.Group()]));
  bones.hips.add(bones.spine, bones.leftUpperLeg, bones.rightUpperLeg);
  bones.spine.add(bones.chest);
  bones.chest.add(bones.head, bones.leftShoulder, bones.rightShoulder);
  bones.leftShoulder.add(bones.leftUpperArm);
  bones.rightShoulder.add(bones.rightUpperArm);
  bones.leftUpperArm.add(bones.leftLowerArm);
  bones.rightUpperArm.add(bones.rightLowerArm);
  bones.leftLowerArm.add(bones.leftHand);
  bones.rightLowerArm.add(bones.rightHand);
  bones.leftUpperLeg.add(bones.leftLowerLeg);
  bones.rightUpperLeg.add(bones.rightLowerLeg);
  bones.leftLowerLeg.add(bones.leftFoot);
  bones.rightLowerLeg.add(bones.rightFoot);
  return bones;
}

function assertVectorValues(actual, expected) {
  assert.equal(actual.length, expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    assert.ok(Math.abs(actual[index] - expected[index]) < 1e-6, `index ${index}: ${actual[index]} !== ${expected[index]}`);
  }
}
