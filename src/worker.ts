import { MatchDurableObject } from "./match-object.ts";
import { normalizeCharacterId } from "./characters/registry.ts";
import type { Env } from "./shared/types.ts";

export { MatchDurableObject };

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
      return Response.json({ roomId, playerId, cp, characterId, wsPath: `/ws/${roomId}` });
    }

    if (url.pathname.startsWith("/ws/")) {
      const roomId = decodeURIComponent(url.pathname.slice("/ws/".length)) || "cp-1000";
      const id = env.MATCH_OBJECT.idFromName(roomId);
      const stub = env.MATCH_OBJECT.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
