import { MatchSimulation } from "./game/simulation.ts";
import { TICK_MS } from "./shared/constants.ts";
import type { CharacterId, ClientMessage, Env, PlayerSide, ServerMessage } from "./shared/types.ts";

interface Session {
  side: PlayerSide;
  playerId: string;
  socket: WebSocket;
}

export class MatchDurableObject {
  private readonly env: Env;
  private readonly simulation = new MatchSimulation();
  private readonly sessions = new Map<WebSocket, Session>();
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor(_state: DurableObjectState, env: Env) {
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/state")) {
      return Response.json(this.simulation.snapshot());
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    server.addEventListener("message", (event) => this.onMessage(server, event));
    server.addEventListener("close", () => this.onClose(server));
    server.addEventListener("error", () => this.onClose(server));
    server.send(JSON.stringify({ type: "server.event", frame: this.simulation.frame, kind: "info", message: "Connected. Send client.hello." }));
    this.ensureLoop();
    return new Response(null, { status: 101, webSocket: client });
  }

  private onMessage(socket: WebSocket, event: MessageEvent): void {
    let message: ClientMessage;
    try {
      message = JSON.parse(String(event.data)) as ClientMessage;
    } catch {
      socket.send(JSON.stringify({ type: "server.event", frame: this.simulation.frame, kind: "info", message: "Invalid JSON" }));
      return;
    }

    if (message.type === "client.ping") {
      socket.send(JSON.stringify({ type: "server.pong", now: message.now }));
      return;
    }

    if (message.type === "client.hello") {
      this.join(socket, message.playerId, message.cp, message.characterId);
      return;
    }

    const session = this.sessions.get(socket);
    if (!session) return;
    if (message.type === "client.input") this.simulation.setInput(session.side, message.input);
  }

  private join(socket: WebSocket, playerId: string, cp: number, characterId: CharacterId): void {
    const existing = [...this.sessions.values()].find((session) => session.playerId === playerId);
    if (existing) {
      this.sessions.delete(existing.socket);
      try {
        existing.socket.close(1000, "Replaced by new connection");
      } catch {
        // Ignore stale socket close failures.
      }
    }

    const occupied = new Set([...this.sessions.values()].map((session) => session.side));
    const side: PlayerSide | undefined = !occupied.has("p1") ? "p1" : !occupied.has("p2") ? "p2" : undefined;
    if (!side) {
      socket.send(JSON.stringify({ type: "server.event", frame: this.simulation.frame, kind: "info", message: "Room is full" }));
      socket.close(1013, "Room is full");
      return;
    }

    this.sessions.set(socket, { side, playerId, socket });
    this.simulation.addPlayer(side, playerId, cp, characterId);
    socket.send(JSON.stringify(this.simulation.snapshot(side)));
    this.broadcastEvents();
  }

  private onClose(socket: WebSocket): void {
    const session = this.sessions.get(socket);
    if (!session) return;
    this.sessions.delete(socket);
    this.simulation.removePlayer(session.side);
    this.broadcastEvents();
  }

  private ensureLoop(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.simulation.tick();
      this.broadcastSnapshot();
      this.broadcastEvents();
      if (this.sessions.size === 0 && this.simulation.phase === "finished" && this.interval) {
        clearInterval(this.interval);
        this.interval = undefined;
      }
    }, TICK_MS);
  }

  private broadcastSnapshot(): void {
    for (const session of this.sessions.values()) {
      this.send(session.socket, this.simulation.snapshot(session.side));
    }
  }

  private broadcastEvents(): void {
    for (const event of this.simulation.drainEvents()) {
      for (const session of this.sessions.values()) this.send(session.socket, event);
    }
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      this.onClose(socket);
    }
  }
}
