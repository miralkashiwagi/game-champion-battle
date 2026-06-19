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
      const roomId = "ranked-global-v1";
      const query = new URLSearchParams({ playerId, cp: String(cp), characterId });
      return Response.json({ roomId, playerId, cp, characterId, wsPath: `/ws/matchmaker/${roomId}?${query}` });
    }

    if (url.pathname === "/api/practice") {
      const playerId = url.searchParams.get("playerId") ?? crypto.randomUUID();
      const cp = clampNumber(Number(url.searchParams.get("cp") ?? 1000), 0, 9999);
      const characterId = normalizeCharacterId(url.searchParams.get("characterId"));
      const matchId = crypto.randomUUID();
      const matchStub = env.MATCH_OBJECT.get(env.MATCH_OBJECT.idFromName(matchId));
      const response = await matchStub.fetch(new Request(`https://internal/match/${matchId}/init`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matchId,
          mode: "practice",
          cpuSide: "p2",
          players: [
            { playerId, cp, characterId },
            { playerId: `cpu:${matchId}`, cp, characterId }
          ]
        })
      }));
      if (!response.ok) return new Response("Failed to initialize practice match", { status: 500 });
      return Response.json({
        matchId,
        playerId,
        cp,
        characterId,
        mode: "practice",
        wsPath: `/ws/match/${matchId}?playerId=${encodeURIComponent(playerId)}`
      });
    }

    if (url.pathname.startsWith("/ws/matchmaker/")) {
      const roomId = decodeURIComponent(url.pathname.slice("/ws/matchmaker/".length)) || "ranked-global-v1";
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
