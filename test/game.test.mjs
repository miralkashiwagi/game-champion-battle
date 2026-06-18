import assert from "node:assert/strict";
import { test } from "node:test";
import { MatchSimulation } from "../src/game/simulation.ts";
import { CHARACTER_IDS, DEFAULT_CHARACTER_ID, normalizeCharacterId } from "../src/characters/registry.ts";
import { COMMON_GUARD_COUNTER } from "../src/characters/common.ts";
import { DASH_SPEED, MOVE_SPEED } from "../src/shared/constants.ts";

const idleInput = (frame = 0) => ({
  frame,
  left: false,
  right: false,
  up: false,
  down: false,
  attack: false,
  guard: false,
  pickup: false,
  skills: {}
});

function setup() {
  const sim = new MatchSimulation();
  sim.addPlayer("p1", "p1-id", 1000, "silver_knight");
  sim.addPlayer("p2", "p2-id", 1000, "saladin");
  return sim;
}

function players(sim) {
  return [sim.players.get("p1"), sim.players.get("p2")];
}

test("HP0後はcloak, head, armor, weaponの順にパージされ、次の被弾で死亡する", () => {
  const sim = setup();
  const [, p2] = players(sim);
  p2.hp = 0;
  for (const expected of ["cloak", "head", "armor", "weapon"]) {
    sim.purgeOrKill(p2);
    assert.equal(p2.equipment[expected], null);
    assert.equal(sim.fieldItems.at(-1).item.slot, expected);
  }
  sim.purgeOrKill(p2);
  assert.equal(p2.state, "Dead");
});

test("自分装備回収でHPは回復せず、装備だけ戻る", () => {
  const sim = setup();
  const [p1] = players(sim);
  p1.hp = 0;
  sim.purgeOrKill(p1);
  p1.position.x = sim.fieldItems[0].position.x;
  for (let i = 0; i < 31; i++) sim.tick();
  sim.setInput("p1", { ...idleInput(99), pickup: true });
  sim.tick();
  assert.equal(p1.equipment.cloak?.ownerPlayerId, "p1-id");
  assert.equal(p1.hp, 0);
});

test("相手装備拾得は同部位スワップし、CTを引き継ぐ", () => {
  const sim = setup();
  const [p1, p2] = players(sim);
  p2.equipment.head.cooldownRemainingMs = 3210;
  p2.hp = 0;
  sim.purgeOrKill(p2); // cloak
  sim.purgeOrKill(p2); // head
  const droppedHead = sim.fieldItems.find((item) => item.item.slot === "head");
  sim.fieldItems.find((item) => item.item.slot === "cloak").position.x = 20;
  p1.position.x = droppedHead.position.x;
  for (let i = 0; i < 16; i++) sim.tick();
  sim.setInput("p1", { ...idleInput(100), pickup: true });
  sim.tick();
  assert.equal(p1.equipment.head.ownerPlayerId, "p2-id");
  assert.ok(p1.equipment.head.cooldownRemainingMs > 0);
  assert.equal(sim.fieldItems.some((item) => item.item.ownerPlayerId === "p1-id" && item.item.slot === "head"), true);
});

test("ガード貫通なしはブロックされ、ガード貫通ありはヒットする", () => {
  const sim = setup();
  const [p1, p2] = players(sim);
  p1.position.x = 500;
  p2.position.x = 560;
  p1.facing = 1;
  p2.facing = -1;

  sim.setInput("p2", { ...idleInput(1), guard: true });
  sim.tick();
  sim.startAttack(p1, { id: "test", motionId: "test", name: "blocked", damage: 8, range: 90, startupFrames: 0, activeFrames: 5, recoveryFrames: 1, effect: "hitstun", guardPierce: false });
  sim.tick();
  assert.equal(p2.hp, 100);

  p1.activeAttack = null;
  p1.attackTimer = 0;
  sim.startAttack(p1, { id: "pierce", motionId: "pierce", name: "pierce", damage: 8, range: 90, startupFrames: 0, activeFrames: 5, recoveryFrames: 1, effect: "hitstun", guardPierce: true });
  sim.tick();
  assert.equal(p2.hp, 92);
});

test("時間切れはHP、装備数、引き分けの順に判定する", () => {
  const sim = setup();
  const [p1, p2] = players(sim);
  p1.hp = 60;
  p2.hp = 40;
  sim.timeRemainingMs = 0;
  sim.tick();
  assert.equal(sim.result.winner, "p1");
  assert.equal(sim.result.reason, "timeout_hp");

  const sim2 = setup();
  const [q1, q2] = players(sim2);
  q1.hp = 0;
  q2.hp = 0;
  sim2.purgeOrKill(q2);
  sim2.timeRemainingMs = 0;
  sim2.tick();
  assert.equal(sim2.result.winner, "p1");
  assert.equal(sim2.result.reason, "timeout_equipment");

  const sim3 = setup();
  sim3.timeRemainingMs = 0;
  sim3.tick();
  assert.equal(sim3.result.winner, "draw");
  assert.equal(sim3.result.reason, "timeout_draw");
});

test("キャラクターレジストリが登録順と不明IDのフォールバックを管理する", () => {
  assert.deepEqual(CHARACTER_IDS, ["silver_knight", "saladin", "syal"]);
  assert.equal(normalizeCharacterId("saladin"), "saladin");
  assert.equal(normalizeCharacterId("syal"), "syal");
  assert.equal(normalizeCharacterId("unknown"), DEFAULT_CHARACTER_ID);
});

test("Syalはdefinitionで指定された装備を生成する", () => {
  const sim = new MatchSimulation();
  sim.addPlayer("p1", "syal-player", 1000, "syal");
  const syal = sim.players.get("p1");
  const expected = ["syal_cloak", "sample_helmet", "sample_armor", "syal_twin_blades"];
  for (const item of Object.values(syal.equipment)) {
    assert.ok(expected.includes(item.equipmentId));
    assert.match(item.id, new RegExp(`_${item.equipmentId}_`));
  }
});

test("SyalとSaladinの武器は同じ性能を別のmotionIdで保持する", async () => {
  const { EQUIPMENT_REGISTRY } = await import("../src/equipment/registry.ts");
  const saladin = EQUIPMENT_REGISTRY.saladin_twin_blades.definition;
  const syal = EQUIPMENT_REGISTRY.syal_twin_blades.definition;
  assert.deepEqual(
    syal.combo.map(({ id, motionId, ...attack }) => attack),
    saladin.combo.map(({ id, motionId, ...attack }) => attack)
  );
  assert.match(syal.skill.motionId, /^syal_/);
  assert.match(saladin.skill.motionId, /^saladin_/);
  assert.notEqual(syal, saladin);
  assert.notEqual(syal.combo, saladin.combo);
});

test("武器交換はコンボと長押しだけを装備側へ切り替える", () => {
  const sim = setup();
  const [silver, saladin] = players(sim);
  silver.equipment.weapon = { ...saladin.equipment.weapon, id: "borrowed-saladin-weapon" };

  assert.match(sim.getComboAttack(silver).motionId, /^saladin_combo_/);
  assert.equal(sim.getHoldAttack(silver).motionId, "saladin_forward_cut");
  assert.equal(sim.getComboAttack(saladin).motionId, "saladin_combo_1");
  assert.equal(sim.getHoldAttack(saladin).motionId, "saladin_forward_cut");
});

test("武器を失うと共通素手コンボへ戻り、素手長押しは攻撃しない", () => {
  const sim = setup();
  const [silver] = players(sim);
  silver.equipment.weapon = null;

  assert.match(sim.getComboAttack(silver).motionId, /^barehand_/);
  assert.equal(sim.getHoldAttack(silver), undefined);

  silver.previousInput.attack = true;
  silver.attackHeldFrames = 18;
  sim.setInput("p1", idleInput(30));
  sim.tick();
  assert.equal(silver.activeActionId, null);
  assert.equal(silver.attackName, null);
});

test("ガードカウンターはキャラクター別ではなく共通攻撃を使う", () => {
  const sim = setup();
  const [silver] = players(sim);
  silver.state = "GuardCounterWindow";
  silver.stateTimer = 30;

  sim.setInput("p1", { ...idleInput(1), attack: true });
  sim.tick();
  assert.equal(silver.activeActionId, COMMON_GUARD_COUNTER.motionId);
});

test("downと左右入力で共通ダッシュ状態になり通常移動より速い", () => {
  const sim = setup();
  const [silver] = players(sim);
  sim.setInput("p1", { ...idleInput(1), right: true, down: true });
  sim.tick();

  assert.equal(silver.state, "Dash");
  assert.equal(silver.velocity.x, DASH_SPEED);
  assert.ok(Math.abs(silver.velocity.x) > MOVE_SPEED);
});

test("ジャンプ開始時にJump状態になり着地後に復帰する", () => {
  const sim = setup();
  const [silver] = players(sim);
  sim.setInput("p1", { ...idleInput(1), up: true });
  sim.tick();

  assert.equal(silver.state, "Jump");
  assert.ok(silver.position.y < 430);

  sim.setInput("p1", idleInput(2));
  for (let i = 0; i < 60 && silver.state === "Jump"; i++) sim.tick();
  assert.equal(silver.state, "Idle");
  assert.equal(silver.velocity.y, 0);
});

test("被撃中に使用可能な装備スキルは装備Behaviorを実行する", () => {
  const sim = setup();
  const [silver, saladin] = players(sim);
  saladin.state = "Hitstun";
  saladin.stateTimer = 30;
  sim.setInput("p2", { ...idleInput(1), skills: { head: true } });
  sim.tick();
  assert.equal(saladin.attackName, "Windwall");
  assert.equal(silver.state, "Hitstun");
  assert.equal(silver.stateTimer, 6);
});

test("SyalのWindwallはSyal頭装備のBehaviorを実行する", () => {
  const sim = new MatchSimulation();
  sim.addPlayer("p1", "silver-player", 1000, "silver_knight");
  sim.addPlayer("p2", "syal-player", 1000, "syal");
  const [silver, syal] = players(sim);
  syal.state = "Hitstun";
  syal.stateTimer = 30;
  sim.setInput("p2", { ...idleInput(1), skills: { head: true } });
  sim.tick();
  assert.equal(syal.attackName, "Windwall");
  assert.equal(syal.equipment.head.equipmentId, "sample_helmet");
  assert.equal(silver.state, "Hitstun");
  assert.equal(silver.stateTimer, 6);
});

test("防具の被弾フックが攻撃側をノックバックする", () => {
  const sim = setup();
  const [silver, saladin] = players(sim);
  silver.position.x = 500;
  saladin.position.x = 560;
  silver.facing = 1;
  saladin.facing = -1;
  sim.startAttack(saladin, { id: "hook-test", motionId: "hook-test", name: "hook-test", damage: 1, range: 90, startupFrames: 0, activeFrames: 2, recoveryFrames: 1, effect: "hitstun", guardPierce: true });
  sim.tick();
  assert.equal(saladin.velocity.x, 7);
});

test("空中被弾の水平移動速度は従来値の半分になる", () => {
  const sim = setup();
  const [silver, saladin] = players(sim);
  silver.position.x = 500;
  saladin.position.x = 560;
  silver.facing = 1;
  sim.startAttack(silver, { id: "air-test", motionId: "air-test", name: "air-test", damage: 0, range: 90, startupFrames: 0, activeFrames: 2, recoveryFrames: 1, effect: "air", guardPierce: true });
  sim.tick();
  assert.equal(saladin.velocity.x, 2.4);
});

test("通常攻撃は大振りに見えるだけのフレーム数を持つ", async () => {
  const { EQUIPMENT_REGISTRY } = await import("../src/equipment/registry.ts");
  for (const equipmentId of ["silver_knight_sword", "saladin_twin_blades", "syal_twin_blades"]) {
    for (const attack of EQUIPMENT_REGISTRY[equipmentId].definition.combo) {
      assert.ok(attack.startupFrames >= 8);
      assert.ok(attack.startupFrames + attack.activeFrames + attack.recoveryFrames >= 22);
    }
  }
});

test("攻撃モーションIDと開始フレームが同一攻撃の再実行ごとに更新される", () => {
  const sim = setup();
  const [p1] = players(sim);
  const attack = { id: "repeat", motionId: "repeat_motion", name: "Repeat", damage: 0, range: 0, startupFrames: 0, activeFrames: 1, recoveryFrames: 1, effect: "hitstun", guardPierce: false };

  sim.startAttack(p1, attack);
  const first = sim.snapshot().players.find((player) => player.side === "p1");
  assert.equal(first.activeActionId, "repeat_motion");
  assert.equal(first.actionStartedFrame, 0);

  sim.tick();
  sim.tick();
  sim.tick();
  sim.startAttack(p1, attack);
  const second = sim.snapshot().players.find((player) => player.side === "p1");
  assert.equal(second.activeActionId, "repeat_motion");
  assert.equal(second.actionStartedFrame, sim.frame);
  assert.notEqual(second.actionStartedFrame, first.actionStartedFrame);
});
