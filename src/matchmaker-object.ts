import type { CharacterId, Env, MatchFoundMessage, MatchPlayer, MatchSearchMessage } from "./shared/types.ts";
import {
  CP_RANGE_INTERVAL_MS,
  chooseMatchPairs,
  searchRange,
  type MatchCandidate
} from "./matchmaking-policy.ts";

interface QueueAttachment extends MatchPlayer {
  joinedAt: number;
}

interface QueueRow extends Record<string, SqlStorageValue> {
  playerId: string;
  cp: number;
  characterId: CharacterId;
  joinedAt: number;
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
        CREATE TABLE IF NOT EXISTS active_matches (
          match_id TEXT PRIMARY KEY,
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
      this.updateActiveState(matchId, "playing");
      return Response.json({ ok: true });
    }
    if (url.pathname.endsWith("/release")) {
      const body = await request.json<ReleaseRequest>();
      return Response.json({ assignments: await this.release(body) });
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
    const attachment: QueueAttachment = { ...player, joinedAt: this.nextJoinedAt(player.playerId) };
    server.serializeAttachment(attachment);
    this.removePlayerSocket(player.playerId, server);
    this.insertQueued(attachment);

    await this.startQueuedMatches();
    this.sendSearchStatusToPlayer(player.playerId);
    await this.scheduleAlarmIfNeeded();
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    await this.startQueuedMatches();
    this.broadcastSearchStatus();
    await this.scheduleAlarmIfNeeded();
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
    const active = this.activeMatch(body.matchId);
    if (!active) return [];
    this.state.storage.sql.exec("DELETE FROM active_matches WHERE match_id = ?", body.matchId);

    const now = Date.now();
    const preferred = body.preferredPlayers.map((player) => ({ ...player, joinedAt: now, preferred: true }));
    const preferredIds = new Set(preferred.map((player) => player.playerId));
    const queued = this.queueRows().filter((row) => !preferredIds.has(row.playerId));
    const selected = chooseMatchPairs([...preferred, ...queued], now)[0];
    let assignments: Assignment[] = [];
    if (selected?.some((player) => preferredIds.has(player.playerId))) {
      assignments = await this.createMatch(selected, preferredIds) ?? [];
    }

    await this.startQueuedMatches();
    this.broadcastSearchStatus();
    await this.scheduleAlarmIfNeeded();
    return assignments;
  }

  private async startQueuedMatches(): Promise<void> {
    while (true) {
      const selected = chooseMatchPairs(this.queueRows(), Date.now())[0];
      if (!selected) return;
      const created = await this.createMatch(selected, new Set());
      if (!created) return;
    }
  }

  private async createMatch(players: MatchCandidate[], preferredIds: Set<string>): Promise<Assignment[] | undefined> {
    const queuedPlayers = players.filter((player) => !preferredIds.has(player.playerId));
    for (const player of queuedPlayers) this.deleteQueued(player);

    const matchId = crypto.randomUUID();
    const matchStub = this.env.MATCH_OBJECT.get(this.env.MATCH_OBJECT.idFromName(matchId));
    try {
      const response = await matchStub.fetch(new Request(`https://internal/match/${matchId}/init`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ matchId, players: players.map(stripQueueFields), matchmakerId: this.state.id.toString() })
      }));
      if (!response.ok) throw new Error(`Failed to initialize match ${matchId}`);
    } catch (error) {
      for (const player of queuedPlayers) this.insertQueued(player);
      console.error(error);
      return undefined;
    }

    this.state.storage.sql.exec(
      "INSERT INTO active_matches (match_id, state) VALUES (?, 'playing')",
      matchId
    );

    const assignments: Assignment[] = [];
    for (const player of players) {
      const assignment = {
        playerId: player.playerId,
        matchId,
        wsPath: `/ws/match/${matchId}?playerId=${encodeURIComponent(player.playerId)}`
      };
      if (preferredIds.has(player.playerId)) assignments.push(assignment);
      else this.sendToPlayer(player.playerId, { type: "server.match_found", matchId, wsPath: assignment.wsPath });
    }
    return assignments;
  }

  private activeMatch(matchId: string): ActiveRow | undefined {
    return this.state.storage.sql.exec<ActiveRow>(
      "SELECT match_id, state FROM active_matches WHERE match_id = ?",
      matchId
    ).toArray()[0];
  }

  private updateActiveState(matchId: string, state: ActiveRow["state"]): void {
    this.state.storage.sql.exec("UPDATE active_matches SET state = ? WHERE match_id = ?", state, matchId);
  }

  private queueRows(): QueueRow[] {
    return this.state.storage.sql.exec<QueueRow>(
      "SELECT player_id AS playerId, cp, character_id AS characterId, joined_at AS joinedAt FROM queue ORDER BY joined_at ASC, player_id ASC"
    ).toArray();
  }

  private insertQueued(player: MatchCandidate): void {
    this.state.storage.sql.exec(
      "INSERT OR REPLACE INTO queue (player_id, cp, character_id, joined_at) VALUES (?, ?, ?, ?)",
      player.playerId,
      player.cp,
      player.characterId,
      player.joinedAt
    );
  }

  private deleteQueued(player: MatchCandidate): void {
    this.state.storage.sql.exec(
      "DELETE FROM queue WHERE player_id = ? AND joined_at = ?",
      player.playerId,
      player.joinedAt
    );
  }

  private sendToPlayer(playerId: string, message: MatchFoundMessage): void {
    const socket = this.socketForPlayer(playerId);
    if (!socket) return;
    socket.send(JSON.stringify(message));
    socket.close(1000, "Match found");
  }

  private sendSearchStatusToPlayer(playerId: string): void {
    const socket = this.socketForPlayer(playerId);
    const attachment = socket ? attachmentOf(socket) : undefined;
    if (!socket || !attachment || !this.hasQueued(attachment)) return;
    socket.send(JSON.stringify({ type: "server.match_search", ...searchRange(attachment, Date.now()) } satisfies MatchSearchMessage));
  }

  private broadcastSearchStatus(): void {
    const now = Date.now();
    for (const socket of this.state.getWebSockets()) {
      const attachment = attachmentOf(socket);
      if (!attachment || !this.hasQueued(attachment)) continue;
      socket.send(JSON.stringify({ type: "server.match_search", ...searchRange(attachment, now) } satisfies MatchSearchMessage));
    }
  }

  private hasQueued(player: QueueAttachment): boolean {
    return Boolean(this.state.storage.sql.exec<{ found: number }>(
      "SELECT 1 AS found FROM queue WHERE player_id = ? AND joined_at = ?",
      player.playerId,
      player.joinedAt
    ).toArray()[0]);
  }

  private async scheduleAlarmIfNeeded(): Promise<void> {
    if (this.queueRows().length === 0) {
      await this.state.storage.deleteAlarm();
      return;
    }
    const nextAlarm = Date.now() + CP_RANGE_INTERVAL_MS;
    const currentAlarm = await this.state.storage.getAlarm();
    if (currentAlarm === null || nextAlarm < currentAlarm) await this.state.storage.setAlarm(nextAlarm);
  }

  private socketForPlayer(playerId: string): WebSocket | undefined {
    return this.state.getWebSockets().find((socket) => attachmentOf(socket)?.playerId === playerId);
  }

  private nextJoinedAt(playerId: string): number {
    const previousJoinedAt = this.state.getWebSockets()
      .map((socket) => attachmentOf(socket))
      .filter((attachment) => attachment?.playerId === playerId)
      .reduce((latest, attachment) => Math.max(latest, attachment?.joinedAt ?? 0), 0);
    return Math.max(Date.now(), previousJoinedAt + 1);
  }

  private removePlayerSocket(playerId: string, except: WebSocket): void {
    for (const socket of this.state.getWebSockets()) {
      if (socket !== except && attachmentOf(socket)?.playerId === playerId) socket.close(1000, "Replaced by new connection");
    }
  }

  private removeQueuedSocket(socket: WebSocket): void {
    const attachment = attachmentOf(socket);
    if (attachment) this.deleteQueued(attachment);
  }
}

function stripQueueFields(player: MatchCandidate): MatchPlayer {
  return { playerId: player.playerId, cp: player.cp, characterId: player.characterId };
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
