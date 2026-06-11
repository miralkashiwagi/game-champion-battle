import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseMatchPlayers } from "../src/matchmaking-policy.ts";

const player = (playerId) => ({ playerId, cp: 1000, characterId: "silver_knight" });

test("同じCP帯で対戦中はCとDが揃っても次の試合を開始しない", () => {
  const selected = chooseMatchPlayers(true, [], [player("C"), player("D")]);
  assert.deepEqual(selected, []);
});

test("再戦不成立時は再戦希望者Aを待機中のCより優先する", () => {
  const selected = chooseMatchPlayers(false, [player("A")], [player("C"), player("D")]);
  assert.deepEqual(selected.map(({ playerId }) => playerId), ["A", "C"]);
});

test("再戦希望者がいなければ待機順のCとDを選ぶ", () => {
  const selected = chooseMatchPlayers(false, [], [player("C"), player("D")]);
  assert.deepEqual(selected.map(({ playerId }) => playerId), ["C", "D"]);
});

test("同一プレイヤーが優先枠と待機列に重複しても二重選出しない", () => {
  const selected = chooseMatchPlayers(false, [player("A")], [player("A"), player("C")]);
  assert.deepEqual(selected.map(({ playerId }) => playerId), ["A", "C"]);
});
