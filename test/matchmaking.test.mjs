import assert from "node:assert/strict";
import { test } from "node:test";
import { canMatch, chooseMatchPairs, cpRangeForWait, searchRange } from "../src/matchmaking-policy.ts";

const player = (playerId, cp, joinedAt, preferred = false) => ({
  playerId,
  cp,
  joinedAt,
  preferred,
  characterId: "silver_knight"
});

test("検索範囲は開始時100で5秒ごとに100広がる", () => {
  assert.equal(cpRangeForWait(0), 100);
  assert.equal(cpRangeForWait(4_999), 100);
  assert.equal(cpRangeForWait(5_000), 200);
  assert.equal(cpRangeForWait(10_000), 300);
});

test("表示範囲をCPの有効範囲へ丸める", () => {
  assert.deepEqual(searchRange(player("A", 50, 0), 5_000), { minCp: 0, maxCp: 250, waitedMs: 5_000 });
  assert.deepEqual(searchRange(player("B", 9950, 0), 5_000), { minCp: 9750, maxCp: 9999, waitedMs: 5_000 });
});

test("片方の検索範囲に入れば成立する", () => {
  assert.equal(canMatch(player("A", 1000, 0), player("B", 1250, 10_000), 10_000), true);
  assert.equal(canMatch(player("A", 1000, 10_000), player("B", 1250, 10_000), 10_000), false);
});

test("最古の待機者へCP差が最小の相手を割り当てる", () => {
  const pairs = chooseMatchPairs([
    player("A", 1000, 0),
    player("B", 1080, 1),
    player("C", 1020, 2)
  ], 2);
  assert.deepEqual(pairs.map((pair) => pair.map(({ playerId }) => playerId)), [["A", "C"]]);
});

test("CP差と参加時刻が同じ場合はPlayer ID順で決める", () => {
  const pairs = chooseMatchPairs([
    player("A", 1000, 0),
    player("C", 1050, 1),
    player("B", 950, 1)
  ], 1);
  assert.deepEqual(pairs[0]?.map(({ playerId }) => playerId), ["A", "B"]);
});

test("4人から複数ペアを選び余りを残す", () => {
  const pairs = chooseMatchPairs([
    player("A", 1000, 0), player("B", 1010, 1),
    player("C", 2000, 2), player("D", 2020, 3), player("E", 4000, 4)
  ], 4);
  assert.deepEqual(pairs.map((pair) => pair.map(({ playerId }) => playerId)), [["A", "B"], ["C", "D"]]);
});

test("再戦希望者を通常待機者より優先する", () => {
  const pairs = chooseMatchPairs([
    player("C", 1000, 0),
    player("A", 1000, 10, true),
    player("D", 1000, 20)
  ], 20);
  assert.deepEqual(pairs[0]?.map(({ playerId }) => playerId), ["A", "C"]);
});

test("同一プレイヤーを二重選出しない", () => {
  const pairs = chooseMatchPairs([
    player("A", 1000, 0, true), player("A", 1000, 1), player("C", 1000, 2)
  ], 2);
  assert.deepEqual(pairs[0]?.map(({ playerId }) => playerId), ["A", "C"]);
});
