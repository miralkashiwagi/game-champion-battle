import type { MatchPlayer } from "./shared/types.ts";

export const INITIAL_CP_RANGE = 100;
export const CP_RANGE_STEP = 100;
export const CP_RANGE_INTERVAL_MS = 5_000;

export interface MatchCandidate extends MatchPlayer {
  joinedAt: number;
  preferred?: boolean;
}

export function cpRangeForWait(waitedMs: number): number {
  return INITIAL_CP_RANGE + Math.floor(Math.max(0, waitedMs) / CP_RANGE_INTERVAL_MS) * CP_RANGE_STEP;
}

export function searchRange(candidate: MatchCandidate, now: number): { minCp: number; maxCp: number; waitedMs: number } {
  const waitedMs = Math.max(0, now - candidate.joinedAt);
  const range = cpRangeForWait(waitedMs);
  return {
    minCp: Math.max(0, candidate.cp - range),
    maxCp: Math.min(9999, candidate.cp + range),
    waitedMs
  };
}

export function canMatch(left: MatchCandidate, right: MatchCandidate, now: number): boolean {
  const difference = Math.abs(left.cp - right.cp);
  return difference <= cpRangeForWait(now - left.joinedAt) || difference <= cpRangeForWait(now - right.joinedAt);
}

export function chooseMatchPairs(candidates: MatchCandidate[], now: number): MatchCandidate[][] {
  const remaining = uniqueCandidates(candidates).sort(compareQueueOrder);
  const pairs: MatchCandidate[][] = [];

  while (remaining.length >= 2) {
    const first = remaining[0]!;
    const opponentIndex = findBestOpponentIndex(first, remaining, now);
    if (opponentIndex < 0) {
      remaining.shift();
      continue;
    }
    const opponent = remaining[opponentIndex]!;
    pairs.push([first, opponent]);
    remaining.splice(opponentIndex, 1);
    remaining.shift();
  }
  return pairs;
}

function findBestOpponentIndex(first: MatchCandidate, candidates: MatchCandidate[], now: number): number {
  let bestIndex = -1;
  for (let index = 1; index < candidates.length; index += 1) {
    const candidate = candidates[index]!;
    if (!canMatch(first, candidate, now)) continue;
    if (bestIndex < 0 || compareOpponent(candidate, candidates[bestIndex]!, first) < 0) bestIndex = index;
  }
  return bestIndex;
}

function compareOpponent(left: MatchCandidate, right: MatchCandidate, first: MatchCandidate): number {
  return Math.abs(left.cp - first.cp) - Math.abs(right.cp - first.cp)
    || compareQueueOrder(left, right);
}

function compareQueueOrder(left: MatchCandidate, right: MatchCandidate): number {
  return Number(Boolean(right.preferred)) - Number(Boolean(left.preferred))
    || left.joinedAt - right.joinedAt
    || left.playerId.localeCompare(right.playerId);
}

function uniqueCandidates(candidates: MatchCandidate[]): MatchCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.playerId)) return false;
    seen.add(candidate.playerId);
    return true;
  });
}
