import assert from "node:assert/strict";
import { test } from "node:test";
import { MatchSimulation } from "../src/game/simulation.ts";

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
  sim.startAttack(p1, { id: "test", name: "blocked", damage: 8, range: 90, startupFrames: 0, activeFrames: 5, recoveryFrames: 1, effect: "hitstun", guardPierce: false });
  sim.tick();
  assert.equal(p2.hp, 100);

  p1.activeAttack = null;
  p1.attackTimer = 0;
  sim.startAttack(p1, { id: "pierce", name: "pierce", damage: 8, range: 90, startupFrames: 0, activeFrames: 5, recoveryFrames: 1, effect: "hitstun", guardPierce: true });
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
