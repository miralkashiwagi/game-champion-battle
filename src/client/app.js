const characters = {
  silver_knight: {
    name: "Silver Knight",
    type: "近距離・バランス型",
    color: "#d8dde7",
    detail: "体当たり、気絶、押し返し、ガード貫通スラッシュを持つ標準キャラ。",
    skills: ["Body Charge", "Headbutt", "Hard Guard", "Slash"]
  },
  saladin: {
    name: "Saladin",
    type: "近距離・攻撃型",
    color: "#d4b36a",
    detail: "素早い連続攻撃とWindwallによる被撃中の切り返しが特徴。",
    skills: ["Spin Slash", "Windwall", "Spiral Kick", "Lunar Slash"]
  }
};

const state = {
  screen: "title",
  playerId: localStorage.getItem("cb.playerId") || crypto.randomUUID(),
  cp: Number(localStorage.getItem("cb.cp") || "1000"),
  characterId: localStorage.getItem("cb.characterId") || "silver_knight",
  ws: null,
  roomId: null,
  cpAppliedRoomId: null,
  snapshot: null,
  localSide: null,
  events: [],
  keys: new Set(),
  frame: 0
};

const assets = {
  silver_knight: loadImage("/assets/silver-knight.svg"),
  saladin: loadImage("/assets/saladin.svg")
};

localStorage.setItem("cb.playerId", state.playerId);

const screen = document.querySelector("#screen");
const connection = document.querySelector("#connection");
const playerMeta = document.querySelector("#playerMeta");
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const battleHud = document.querySelector("#battleHud");

const keyMap = {
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
  KeyJ: "attack",
  KeyK: "guard",
  KeyE: "pickup",
  Digit1: "cloak",
  Digit2: "head",
  Digit3: "armor",
  Digit4: "weapon"
};

window.addEventListener("keydown", (event) => {
  if (keyMap[event.code]) {
    event.preventDefault();
    state.keys.add(event.code);
  }
});

window.addEventListener("keyup", (event) => {
  if (keyMap[event.code]) {
    event.preventDefault();
    state.keys.delete(event.code);
  }
});

function setScreen(next) {
  state.screen = next;
  renderPanel();
}

function renderPanel() {
  playerMeta.textContent = `CP ${state.cp} / ${state.playerId.slice(0, 8)}`;
  connection.textContent = state.ws?.readyState === WebSocket.OPEN ? `online ${state.roomId || ""}` : "offline";

  if (state.screen === "title") {
    screen.innerHTML = `
      <div class="stack">
        <h1>Champion Battle</h1>
        <p class="muted">1v1 Champion Mode MVP</p>
        <button class="primary" data-action="lobby">Game Start</button>
      </div>`;
  } else if (state.screen === "lobby") {
    const c = characters[state.characterId];
    screen.innerHTML = `
      <div class="stack">
        <h2>Lobby</h2>
        <div class="card">
          <div class="row"><strong>Current CP</strong><span>${state.cp}</span></div>
          <div class="row"><strong>Registered</strong><span>${c.name}</span></div>
        </div>
        <button data-action="select">Change Character</button>
        <button data-action="detail">Skill Detail</button>
        <button class="primary" data-action="match">Start Matching</button>
      </div>`;
  } else if (state.screen === "select") {
    screen.innerHTML = `
      <div class="stack">
        <h2>Character Select</h2>
        <div class="cards">${Object.entries(characters)
          .map(([id, c]) => `
            <div class="card ${state.characterId === id ? "selected" : ""}">
              <div class="row"><strong>${c.name}</strong><span>${c.type}</span></div>
              <p class="muted">${c.detail}</p>
              <button data-action="choose" data-id="${id}">Register</button>
            </div>`)
          .join("")}</div>
        <button data-action="lobby">Back</button>
      </div>`;
  } else if (state.screen === "detail") {
    const c = characters[state.characterId];
    screen.innerHTML = `
      <div class="stack">
        <h2>${c.name}</h2>
        <p class="muted">${c.detail}</p>
        <div class="card">
          <strong>Normal</strong>
          <p>D x 4 combo. Weapon lost switches to barehand D x 3.</p>
        </div>
        ${["cloak", "head", "armor", "weapon"].map((slot, i) => `<div class="card"><strong>${slot}</strong><p>${c.skills[i]}</p></div>`).join("")}
        <button data-action="lobby">Back</button>
      </div>`;
  } else if (state.screen === "matching") {
    screen.innerHTML = `
      <div class="stack">
        <h2>Matching</h2>
        <div class="card">
          <div class="row"><span>Room</span><strong>${state.roomId || "searching"}</strong></div>
          <div class="row"><span>Character</span><strong>${characters[state.characterId].name}</strong></div>
          <div class="row"><span>CP</span><strong>${state.cp}</strong></div>
        </div>
        <p class="muted">同じCP帯の相手を待っています。別ブラウザでもう1人接続してください。</p>
        <button data-action="cancel">Cancel</button>
      </div>`;
  } else if (state.screen === "battle") {
    screen.innerHTML = `
      <div class="stack">
        <h2>Battle</h2>
        <div class="card"><div class="row"><span>Time</span><strong>${formatTime(state.snapshot?.timeRemainingMs ?? 0)}</strong></div></div>
        <div class="log">${state.events.slice(-12).map((event) => `<div>${event}</div>`).join("")}</div>
      </div>`;
  } else if (state.screen === "result") {
    const result = state.snapshot?.result;
    const delta = result && state.localSide ? result.cpDelta[state.localSide] : 0;
    screen.innerHTML = `
      <div class="stack">
        <h2>Result</h2>
        <div class="card">
          <div class="row"><span>Winner</span><strong>${result?.winner || "-"}</strong></div>
          <div class="row"><span>Reason</span><strong>${result?.reason || "-"}</strong></div>
          <div class="row"><span>CP Delta</span><strong>${delta > 0 ? "+" : ""}${delta}</strong></div>
        </div>
        <button class="primary" data-action="match">Rematch</button>
        <button data-action="lobby">Lobby</button>
      </div>`;
  }
}

screen.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "lobby") setScreen("lobby");
  if (action === "select") setScreen("select");
  if (action === "detail") setScreen("detail");
  if (action === "choose") {
    state.characterId = target.dataset.id;
    localStorage.setItem("cb.characterId", state.characterId);
    setScreen("lobby");
  }
  if (action === "match") startMatch();
  if (action === "cancel") {
    state.ws?.close();
    state.ws = null;
    setScreen("lobby");
  }
});

async function startMatch() {
  state.snapshot = null;
  state.events = [];
  state.cpAppliedRoomId = null;
  setScreen("matching");
  const res = await fetch(`/api/match?playerId=${encodeURIComponent(state.playerId)}&cp=${state.cp}&characterId=${state.characterId}`);
  const match = await res.json();
  state.roomId = match.roomId;
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${proto}//${location.host}${match.wsPath}`);
  state.ws = ws;
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ type: "client.hello", playerId: state.playerId, cp: state.cp, characterId: state.characterId }));
    renderPanel();
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "server.snapshot") {
      state.snapshot = message;
      if (message.localSide) state.localSide = message.localSide;
      if (message.phase === "playing") setScreen("battle");
      if (message.phase === "finished") {
        applyCpDelta(message.result);
        setScreen("result");
      }
    }
    if (message.type === "server.event") {
      state.events.push(`${message.frame}: ${message.message}`);
      if (state.screen === "battle" || state.screen === "matching") renderPanel();
    }
  });
  ws.addEventListener("close", () => {
    connection.textContent = "offline";
    renderPanel();
  });
}

function applyCpDelta(result) {
  if (!result || !state.localSide || state.cpAppliedRoomId === state.roomId) return;
  state.cpAppliedRoomId = state.roomId;
  state.cp = Math.max(0, state.cp + result.cpDelta[state.localSide]);
  localStorage.setItem("cb.cp", String(state.cp));
}

function currentInput() {
  return {
    frame: state.frame++,
    left: state.keys.has("KeyA"),
    right: state.keys.has("KeyD"),
    up: state.keys.has("KeyW"),
    down: state.keys.has("KeyS"),
    attack: state.keys.has("KeyJ"),
    guard: state.keys.has("KeyK"),
    pickup: state.keys.has("KeyE"),
    skills: {
      cloak: state.keys.has("Digit1"),
      head: state.keys.has("Digit2"),
      armor: state.keys.has("Digit3"),
      weapon: state.keys.has("Digit4")
    }
  };
}

setInterval(() => {
  if (state.ws?.readyState === WebSocket.OPEN && state.screen === "battle") {
    state.ws.send(JSON.stringify({ type: "client.input", input: currentInput() }));
  }
}, 1000 / 60);

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStage();
  const snapshot = state.snapshot;
  if (snapshot) {
    for (const item of snapshot.fieldItems) drawItem(item);
    for (const player of snapshot.players) drawPlayer(player);
    renderHud(snapshot);
  } else {
    battleHud.innerHTML = "";
  }
  requestAnimationFrame(draw);
}

function drawStage() {
  ctx.fillStyle = "#1d211b";
  ctx.fillRect(0, 0, 1280, 540);
  ctx.fillStyle = "#30372d";
  ctx.fillRect(0, 430, 1280, 110);
  ctx.strokeStyle = "#526047";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.lineTo(1280, 430);
  ctx.stroke();
  for (let x = 0; x < 1280; x += 80) {
    ctx.fillStyle = x % 160 === 0 ? "#384131" : "#323a2e";
    ctx.fillRect(x, 450, 62, 14);
  }
}

function drawPlayer(player) {
  const c = characters[player.characterId];
  const x = player.position.x;
  const y = player.position.y;
  const image = assets[player.characterId];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(player.facing, 1);
  if (image.complete) {
    ctx.drawImage(image, -36, -112, 72, 112);
  } else {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.lineTo(16, -62);
    ctx.lineTo(0, -92);
    ctx.lineTo(-18, -62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = player.side === state.localSide ? "#75b66b" : "#d96b5f";
  ctx.lineWidth = 3;
  ctx.strokeRect(-38, -114, 76, 116);
  ctx.fillStyle = "#151713";
  ctx.fillRect(8, -58, 44, 8);
  if (player.state === "Guard" || player.state === "GuardCounterWindow") {
    ctx.strokeStyle = "#79a9d6";
    ctx.beginPath();
    ctx.arc(34, -48, 34, -1.2, 1.2);
    ctx.stroke();
  }
  if (player.attackName) {
    ctx.fillStyle = "rgba(211,181,93,0.26)";
    ctx.fillRect(16, -66, 92, 36);
  }
  ctx.restore();

  ctx.fillStyle = "#edf1e8";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.state, x, y - 108);
}

function drawItem(field) {
  const slotColor = { cloak: "#79a9d6", head: "#d3b55d", armor: "#75b66b", weapon: "#d96b5f" }[field.item.slot];
  ctx.fillStyle = slotColor;
  ctx.beginPath();
  ctx.moveTo(field.position.x, field.position.y - 28);
  ctx.lineTo(field.position.x + 18, field.position.y - 8);
  ctx.lineTo(field.position.x, field.position.y + 8);
  ctx.lineTo(field.position.x - 18, field.position.y - 8);
  ctx.closePath();
  ctx.fill();
}

function renderHud(snapshot) {
  battleHud.innerHTML = snapshot.players.map((player, index) => `
    <div class="hud-card ${index === 1 ? "right" : ""}">
      <div class="row"><strong>${characters[player.characterId].name}</strong><span>${player.side}</span></div>
      <div class="bar"><i style="width:${player.hp}%"></i></div>
      <div class="slots">${["cloak", "head", "armor", "weapon"].map((slot) => {
        const item = player.equipment[slot];
        const cd = item ? Math.ceil(item.cooldownRemainingMs / 1000) : "";
        return `<span class="slot ${item ? "on" : ""}">${slot}${cd ? ` ${cd}` : ""}</span>`;
      }).join("")}</div>
    </div>`).join("");
}

function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

renderPanel();
draw();

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}
