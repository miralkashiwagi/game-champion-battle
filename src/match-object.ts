import { MatchSimulation } from "./game/simulation.ts";
import { REMATCH_WINDOW_MS, SNAPSHOT_EVERY_TICKS, TICK_MS } from "./shared/constants.ts";
import type { ClientMessage, Env, MatchPlayer, MatchSnapshot, PlayerSide, ServerMessage } from "./shared/types.ts";

interface MatchConfig {
  matchId: string;
  matchmakerId: string;
  players: MatchPlayer[];
}

interface MatchMeta {
  phase: "playing" | "rematch_pending" | "released";
  roundId: number;
  deadline?: number;
  requestedPlayerIds: string[];
}

interface MatchAttachment {
  playerId: string;
}

interface InitRequest extends MatchConfig {}

interface Assignment {
  playerId: string;
  matchId: string;
  wsPath: string;
}

export class MatchDurableObject {
  private simulation: MatchSimulation | undefined;
  private config: MatchConfig | undefined;
  private meta: MatchMeta | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;
  private advancing = false;

  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/init")) {
      const config = await request.json<InitRequest>();
      await this.initialize(config);
      return Response.json({ ok: true });
    }
    if (url.pathname.endsWith("/state")) {
      await this.loadState();
      return Response.json(this.snapshot());
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    await this.loadState();
    const playerId = url.searchParams.get("playerId");
    if (!playerId || !this.config?.players.some((player) => player.playerId === playerId)) {
      return new Response("Unknown player", { status: 403 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ playerId } satisfies MatchAttachment);
    this.replacePlayerSocket(playerId, server);
    this.send(server, this.snapshot(this.sideFor(playerId)));
    if (this.meta?.phase === "rematch_pending") this.sendRematchStatus(server);
    this.startLoopIfReady();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== "string") return;
    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      return;
    }
    await this.loadState();
    const playerId = attachmentOf(socket)?.playerId;
    if (!playerId || !this.meta) return;

    if (message.type === "client.ping") {
      this.send(socket, { type: "server.pong", now: message.now });
      return;
    }
    if (message.type === "client.input" && this.meta.phase === "playing") {
      const side = this.sideFor(playerId);
      if (side) this.simulation?.setInput(side, message.input);
      return;
    }
    if (message.type === "client.rematch" && this.meta.phase === "rematch_pending") {
      await this.requestRematch(playerId);
      return;
    }
    if (message.type === "client.leave") await this.handleResultDeparture(playerId);
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    await this.handleSocketClosed(socket);
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.handleSocketClosed(socket);
  }

  async alarm(): Promise<void> {
    await this.loadState();
    if (this.meta?.phase === "rematch_pending" && (this.meta.deadline ?? 0) <= Date.now()) {
      await this.releaseMatch();
    }
  }

  private async initialize(config: MatchConfig): Promise<void> {
    this.config = config;
    this.meta = { phase: "playing", roundId: 1, requestedPlayerIds: [] };
    this.resetSimulation();
    await this.persistState();
  }

  private async loadState(): Promise<void> {
    if (!this.config) this.config = await this.state.storage.get<MatchConfig>("config");
    if (!this.meta) this.meta = await this.state.storage.get<MatchMeta>("meta");
    if (!this.simulation && this.config && this.meta?.phase === "playing") this.resetSimulation();
  }

  private resetSimulation(): void {
    if (!this.config) return;
    this.simulation = new MatchSimulation();
    this.config.players.forEach((player, index) => {
      this.simulation?.addPlayer(index === 0 ? "p1" : "p2", player.playerId, player.cp, player.characterId);
    });
  }

  private startLoopIfReady(): void {
    if (this.interval || this.meta?.phase !== "playing" || this.connectedPlayerIds().size < 2) return;
    this.interval = setInterval(() => void this.advanceFrame(), TICK_MS);
  }

  private async advanceFrame(): Promise<void> {
    if (this.advancing || this.meta?.phase !== "playing" || !this.simulation) return;
    this.advancing = true;
    try {
      this.simulation.tick();
      if (this.simulation.frame % SNAPSHOT_EVERY_TICKS === 0 || this.simulation.phase === "finished") {
        this.broadcastSnapshot();
        this.broadcastEvents();
      }
      if (this.simulation.phase === "finished") await this.finishRound();
    } finally {
      this.advancing = false;
    }
  }

  private async finishRound(): Promise<void> {
    if (!this.meta || this.meta.phase !== "playing" || !this.simulation?.result || !this.config) return;
    this.stopLoop();
    const result = this.simulation.result;
    this.config.players = this.config.players.map((player, index) => {
      const side: PlayerSide = index === 0 ? "p1" : "p2";
      return { ...player, cp: Math.max(0, player.cp + result.cpDelta[side]) };
    });
    this.meta = {
      phase: "rematch_pending",
      roundId: this.meta.roundId,
      deadline: Date.now() + REMATCH_WINDOW_MS,
      requestedPlayerIds: []
    };
    await this.persistState();
    const deadline = this.meta.deadline;
    if (deadline === undefined) throw new Error("Rematch deadline was not set");
    await this.state.storage.setAlarm(deadline);
    await this.notifyMatchmaker("finished", { matchId: this.config.matchId });
    this.broadcastRematchStatus();
  }

  private async requestRematch(playerId: string): Promise<void> {
    if (!this.meta || !this.config || this.meta.requestedPlayerIds.includes(playerId)) return;
    this.meta.requestedPlayerIds.push(playerId);
    await this.state.storage.put("meta", this.meta);
    this.broadcastRematchStatus();
    if (this.config.players.every((player) => this.meta?.requestedPlayerIds.includes(player.playerId))) {
      await this.startRematch();
    } else if (this.config.players.some((player) => !this.connectedPlayerIds().has(player.playerId))) {
      await this.releaseMatch();
    }
  }

  private async startRematch(): Promise<void> {
    if (!this.meta || !this.config || this.meta.phase !== "rematch_pending") return;
    await this.state.storage.deleteAlarm();
    await this.notifyMatchmaker("rematch-started", { matchId: this.config.matchId });
    this.meta = { phase: "playing", roundId: this.meta.roundId + 1, requestedPlayerIds: [] };
    this.resetSimulation();
    await this.persistState();
    this.broadcastSnapshot();
    this.startLoopIfReady();
  }

  private async handleResultDeparture(playerId: string): Promise<void> {
    if (this.meta?.phase !== "rematch_pending") return;
    const otherRequested = this.meta.requestedPlayerIds.some((id) => id !== playerId);
    if (otherRequested || this.meta.requestedPlayerIds.includes(playerId)) await this.releaseMatch();
  }

  private async handleSocketClosed(socket: WebSocket): Promise<void> {
    await this.loadState();
    const playerId = attachmentOf(socket)?.playerId;
    if (!playerId) return;
    if (this.meta?.phase === "playing" && this.simulation) {
      const side = this.sideFor(playerId);
      if (side) {
        this.simulation.removePlayer(side);
        if (this.simulation.phase === "finished") {
          this.broadcastSnapshot();
          await this.finishRound();
        }
      }
    } else if (this.meta?.phase === "rematch_pending") {
      await this.handleResultDeparture(playerId);
    }
  }

  private async releaseMatch(): Promise<void> {
    if (!this.meta || !this.config || this.meta.phase !== "rematch_pending") return;
    this.meta.phase = "released";
    await this.persistState();
    await this.state.storage.deleteAlarm();
    const preferredPlayers = this.config.players.filter((player) => this.meta?.requestedPlayerIds.includes(player.playerId));
    const response = await this.notifyMatchmaker("release", { matchId: this.config.matchId, preferredPlayers });
    const body = await response.json<{ assignments: Assignment[] }>();
    const assignmentByPlayer = new Map(body.assignments.map((assignment) => [assignment.playerId, assignment]));

    for (const socket of this.state.getWebSockets()) {
      const playerId = attachmentOf(socket)?.playerId;
      if (!playerId) continue;
      const assignment = assignmentByPlayer.get(playerId);
      if (assignment) {
        this.send(socket, { type: "server.match_found", matchId: assignment.matchId, wsPath: assignment.wsPath });
      } else if (preferredPlayers.some((player) => player.playerId === playerId)) {
        this.send(socket, { type: "server.rematch_unavailable", message: "新しい対戦相手を検索しています" });
      } else {
        this.send(socket, { type: "server.rematch_unavailable", message: "再戦受付が終了しました" });
      }
      socket.close(1000, "Rematch window closed");
    }
  }

  private snapshot(localSide?: PlayerSide): MatchSnapshot {
    const snapshot = this.simulation?.snapshot(localSide) ?? {
      type: "server.snapshot" as const,
      frame: 0,
      phase: "waiting" as const,
      timeRemainingMs: 0,
      players: [],
      fieldItems: []
    };
    if (this.config) snapshot.matchId = this.config.matchId;
    if (this.meta) snapshot.roundId = this.meta.roundId;
    return snapshot;
  }

  private broadcastSnapshot(): void {
    for (const socket of this.state.getWebSockets()) {
      const side = this.sideFor(attachmentOf(socket)?.playerId);
      this.send(socket, this.snapshot(side));
    }
  }

  private broadcastEvents(): void {
    for (const event of this.simulation?.drainEvents() ?? []) {
      for (const socket of this.state.getWebSockets()) this.send(socket, event);
    }
  }

  private broadcastRematchStatus(): void {
    for (const socket of this.state.getWebSockets()) this.sendRematchStatus(socket);
  }

  private sendRematchStatus(socket: WebSocket): void {
    if (!this.meta?.deadline) return;
    this.send(socket, {
      type: "server.rematch_status",
      deadline: this.meta.deadline,
      requestedPlayerIds: this.meta.requestedPlayerIds
    });
  }

  private async notifyMatchmaker(path: string, body: unknown): Promise<Response> {
    if (!this.config) throw new Error("Match is not initialized");
    const stub = this.env.MATCHMAKER_OBJECT.get(this.env.MATCHMAKER_OBJECT.idFromString(this.config.matchmakerId));
    return stub.fetch(new Request(`https://internal/matchmaker/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }));
  }

  private async persistState(): Promise<void> {
    if (!this.config || !this.meta) return;
    await this.state.storage.put({ config: this.config, meta: this.meta });
  }

  private sideFor(playerId: string | undefined): PlayerSide | undefined {
    if (!playerId || !this.config) return undefined;
    const index = this.config.players.findIndex((player) => player.playerId === playerId);
    return index === 0 ? "p1" : index === 1 ? "p2" : undefined;
  }

  private connectedPlayerIds(): Set<string> {
    return new Set(this.state.getWebSockets().map((socket) => attachmentOf(socket)?.playerId).filter((id): id is string => Boolean(id)));
  }

  private replacePlayerSocket(playerId: string, except: WebSocket): void {
    for (const socket of this.state.getWebSockets()) {
      if (socket !== except && attachmentOf(socket)?.playerId === playerId) socket.close(1000, "Replaced by new connection");
    }
  }

  private stopLoop(): void {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = undefined;
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // Close/error callbacks clean up the player state.
    }
  }
}

function attachmentOf(socket: WebSocket): MatchAttachment | undefined {
  return socket.deserializeAttachment() as MatchAttachment | undefined;
}
