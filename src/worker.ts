import { MatchDurableObject } from "./match-object.ts";
import { MatchmakerDurableObject } from "./matchmaker-object.ts";
import { normalizeCharacterId } from "./characters/registry.ts";
import type { Env } from "./shared/types.ts";

export { MatchDurableObject, MatchmakerDurableObject };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, service: "champion-battle-mvp" });
    }

    if (url.pathname === "/api/match") {
      const playerId = url.searchParams.get("playerId") ?? crypto.randomUUID();
      const cp = clampNumber(Number(url.searchParams.get("cp") ?? 1000), 0, 9999);
      const characterId = normalizeCharacterId(url.searchParams.get("characterId"));
      const bucket = Math.round(cp / 100) * 100;
      const roomId = `cp-${bucket}`;
      const query = new URLSearchParams({ playerId, cp: String(cp), characterId });
      return Response.json({ roomId, playerId, cp, characterId, wsPath: `/ws/matchmaker/${roomId}?${query}` });
    }

    if (url.pathname.startsWith("/ws/matchmaker/")) {
      const roomId = decodeURIComponent(url.pathname.slice("/ws/matchmaker/".length)) || "cp-1000";
      const id = env.MATCHMAKER_OBJECT.idFromName(roomId);
      return env.MATCHMAKER_OBJECT.get(id).fetch(request);
    }

    if (url.pathname.startsWith("/ws/match/")) {
      const roomId = decodeURIComponent(url.pathname.slice("/ws/match/".length));
      const id = env.MATCH_OBJECT.idFromName(roomId);
      return env.MATCH_OBJECT.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
