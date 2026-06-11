import type { MatchPlayer } from "./shared/types.ts";

export function chooseMatchPlayers(
  activeMatchExists: boolean,
  preferredPlayers: MatchPlayer[],
  queuedPlayers: MatchPlayer[]
): MatchPlayer[] {
  if (activeMatchExists) return [];
  const seen = new Set<string>();
  const candidates = [...preferredPlayers, ...queuedPlayers].filter((player) => {
    if (seen.has(player.playerId)) return false;
    seen.add(player.playerId);
    return true;
  });
  return candidates.length >= 2 ? candidates.slice(0, 2) : [];
}
