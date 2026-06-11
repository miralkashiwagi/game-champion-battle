import type { CharacterId, Env, MatchCancelledMessage, MatchFoundMessage, MatchPlayer } from "./shared/types.ts";
import { chooseMatchPlayers } from "./matchmaking-policy.ts";

interface QueueAttachment extends MatchPlayer {
  joinedAt: number;
}

interface QueueRow extends MatchPlayer, Record<string, SqlStorageValue> {
  joined_at: number;
}

interface ActiveRow extends Record<string, SqlStorageValue> {
  match_id: string;
  state: "playing" | "rematch_pending";
}

interface ReleaseRequest {
  matchId: string;
  preferredPlayers: MatchPlayer[];
}

interface Assignment {
  playerId: string;
  matchId: string;
  wsPath: string;
}

export class MatchmakerDurableObject {
  constructor(private readonly state: DurableObjectState, private readonly env: Env) {
    state.blockConcurrencyWhile(async () => {
      state.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS queue (
          player_id TEXT PRIMARY KEY,
          cp INTEGER NOT NULL,
          character_id TEXT NOT NULL,
          joined_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS active_match (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          match_id TEXT NOT NULL,
          state TEXT NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/finished")) {
      const { matchId } = await request.json<{ matchId: string }>();
      this.updateActiveState(matchId, "rematch_pending");
      return Response.json({ ok: true });
    }
    if (url.pathname.endsWith("/rematch-started")) {
      const { matchId } = await request.json<{ matchId: string }>();
      if (this.activeMatch()?.match_id === matchId) {
        this.updateActiveState(matchId, "playing");
        this.cancelQueued("rematch_started", "前の対戦者の再戦が成立したため、マッチングを終了しました");
      }
      return Response.json({ ok: true });
    }
    if (url.pathname.endsWith("/release")) {
      const body = await request.json<ReleaseRequest>();
      const assignments = await this.release(body);
      return Response.json({ assignments });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const player = playerFromUrl(url);
    if (!player) return new Response("Invalid player", { status: 400 });
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.state.acceptWebSocket(server);
    const attachment: QueueAttachment = { ...player, joinedAt: Date.now() };
    server.serializeAttachment(attachment);
    this.removePlayerSocket(player.playerId, server);
    this.state.storage.sql.exec(
      "INSERT OR REPLACE INTO queue (player_id, cp, character_id, joined_at) VALUES (?, ?, ?, ?)",
      player.playerId,
      player.cp,
      player.characterId,
      attachment.joinedAt
    );
    await this.startQueuedMatchIfAvailable();
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== "string") return;
    try {
      const parsed = JSON.parse(message) as { type?: string };
      if (parsed.type === "client.leave") this.removeQueuedSocket(socket);
    } catch {
      // Ignore malformed client messages while waiting.
    }
  }

  webSocketClose(socket: WebSocket): void {
    this.removeQueuedSocket(socket);
  }

  webSocketError(socket: WebSocket): void {
    this.removeQueuedSocket(socket);
  }

  private async release(body: ReleaseRequest): Promise<Assignment[]> {
    const active = this.activeMatch();
    if (!active || active.match_id !== body.matchId) return [];
    this.state.storage.sql.exec("DELETE FROM active_match WHERE singleton = 1");

    const queued = this.queueRows().filter((row) => !body.preferredPlayers.some((player) => player.playerId === row.playerId));
    const selected = chooseMatchPlayers(false, body.preferredPlayers, queued);
    if (selected.length < 2) return [];
    return this.createMatch(selected, new Set(body.preferredPlayers.map((player) => player.playerId)));
  }

  private async startQueuedMatchIfAvailable(): Promise<void> {
    const activeMatchExists = Boolean(this.activeMatch());
    const queued = this.queueRows();
    const selected = chooseMatchPlayers(activeMatchExists, [], queued);
    if (selected.length < 2) return;
    await this.createMatch(selected, new Set());
  }

  private async createMatch(players: MatchPlayer[], preferredIds: Set<string>): Promise<Assignment[]> {
    const matchId = crypto.randomUUID();
    const matchStub = this.env.MATCH_OBJECT.get(this.env.MATCH_OBJECT.idFromName(matchId));
    const response = await matchStub.fetch(new Request(`https://internal/match/${matchId}/init`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ matchId, players, matchmakerId: this.state.id.toString() })
    }));
    if (!response.ok) throw new Error(`Failed to initialize match ${matchId}`);

    this.state.storage.sql.exec(
      "INSERT OR REPLACE INTO active_match (singleton, match_id, state) VALUES (1, ?, 'playing')",
      matchId
    );
    for (const player of players) {
      this.state.storage.sql.exec("DELETE FROM queue WHERE player_id = ?", player.playerId);
    }

    const assignments: Assignment[] = [];
    for (const player of players) {
      const assignment = { playerId: player.playerId, matchId, wsPath: `/ws/match/${matchId}?playerId=${encodeURIComponent(player.playerId)}` };
      if (preferredIds.has(player.playerId)) {
        assignments.push(assignment);
      } else {
        this.sendToPlayer(player.playerId, { type: "server.match_found", matchId, wsPath: assignment.wsPath });
      }
    }
    this.cancelQueued(
      "another_match_started",
      "別の対戦が成立したため、マッチングを終了しました",
      new Set(players.map((player) => player.playerId))
    );
    return assignments;
  }

  private activeMatch(): ActiveRow | undefined {
    return this.state.storage.sql.exec<ActiveRow>("SELECT match_id, state FROM active_match WHERE singleton = 1").toArray()[0];
  }

  private updateActiveState(matchId: string, state: ActiveRow["state"]): void {
    this.state.storage.sql.exec("UPDATE active_match SET state = ? WHERE singleton = 1 AND match_id = ?", state, matchId);
  }

  private queueRows(): QueueRow[] {
    return this.state.storage.sql.exec<QueueRow>(
      "SELECT player_id AS playerId, cp, character_id AS characterId, joined_at FROM queue ORDER BY joined_at ASC"
    ).toArray();
  }

  private sendToPlayer(playerId: string, message: MatchFoundMessage): void {
    const socket = this.socketForPlayer(playerId);
    if (!socket) return;
    socket.send(JSON.stringify(message));
    socket.close(1000, "Match found");
  }

  private cancelQueued(reason: MatchCancelledMessage["reason"], message: string, excludedPlayerIds = new Set<string>()): void {
    const payload: MatchCancelledMessage = { type: "server.match_cancelled", reason, message };
    for (const socket of this.state.getWebSockets()) {
      if (excludedPlayerIds.has(attachmentOf(socket)?.playerId ?? "")) continue;
      socket.send(JSON.stringify(payload));
      socket.close(1000, "Matchmaking cancelled");
    }
    this.state.storage.sql.exec("DELETE FROM queue");
  }

  private socketForPlayer(playerId: string): WebSocket | undefined {
    return this.state.getWebSockets().find((socket) => attachmentOf(socket)?.playerId === playerId);
  }

  private removePlayerSocket(playerId: string, except: WebSocket): void {
    for (const socket of this.state.getWebSockets()) {
      if (socket !== except && attachmentOf(socket)?.playerId === playerId) socket.close(1000, "Replaced by new connection");
    }
  }

  private removeQueuedSocket(socket: WebSocket): void {
    const playerId = attachmentOf(socket)?.playerId;
    if (playerId) this.state.storage.sql.exec("DELETE FROM queue WHERE player_id = ?", playerId);
  }
}

function attachmentOf(socket: WebSocket): QueueAttachment | undefined {
  return socket.deserializeAttachment() as QueueAttachment | undefined;
}

function playerFromUrl(url: URL): MatchPlayer | undefined {
  const playerId = url.searchParams.get("playerId");
  const characterId = url.searchParams.get("characterId") as CharacterId | null;
  const cp = Number(url.searchParams.get("cp"));
  if (!playerId || !characterId || !Number.isFinite(cp)) return undefined;
  return { playerId, characterId, cp };
}
