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
  assert.notEqual(view.visualRoot.position.x, view.root.position.x);
  view.dispose();
});
