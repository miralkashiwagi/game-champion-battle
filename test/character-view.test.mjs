import assert from "node:assert/strict";
import { test } from "node:test";
import { ProceduralCharacterView } from "../src/client/character-view.js";

const fullEquipment = (characterId) => ({
  cloak: { id: `${characterId}-cloak`, originCharacterId: characterId },
  head: { id: `${characterId}-head`, originCharacterId: characterId },
  armor: { id: `${characterId}-armor`, originCharacterId: characterId },
  weapon: { id: `${characterId}-weapon`, originCharacterId: characterId }
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
    snapshotFrame: 18
  }, 1 / 60, 1);
  assert.equal(view.root.position.x, 3);
  assert.notEqual(view.visualRoot.position.z, 0);
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
  assert.equal(silver.motionPlayer.motionController, silver.visual.scriptModel.motionController);
  assert.equal(saladin.motionPlayer.motionController, saladin.visual.scriptModel.motionController);
  assert.notEqual(silver.motionPlayer.motionController, saladin.motionPlayer.motionController);
  silver.dispose();
  saladin.dispose();
});
