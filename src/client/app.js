import { ChampionScene } from "./scene.js";

const characters = {
  silver_knight: {
    name: "Silver Knight",
    type: "近距離・バランス型",
    detail: "堅実な剣技と防御を備えた、攻守の均衡に優れる騎士。",
    normal: "剣による4連撃。最終段で相手を打ち上げる。",
    skills: [
      ["外套", "ボディチャージ", "前進しながら相手を打ち上げる", "CTなし"],
      ["兜", "ヘッドバット", "命中した相手を気絶させる", "CT 5秒"],
      ["鎧", "ハードガード", "通常攻撃への防御を強化する", "常時効果"],
      ["武器", "スラッシュ", "無敵を伴うガード貫通斬撃", "CT 20秒"]
    ]
  },
  saladin: {
    name: "Saladin",
    type: "近距離・攻撃型",
    detail: "機動力と連続攻撃に優れ、素早い切り返しを得意とする戦士。",
    normal: "双剣による4連撃。前進しながら間合いを詰める。",
    skills: [
      ["外套", "スピンスラッシュ", "周囲を斬り払い相手を打ち上げる", "CT 5秒"],
      ["兜", "ウィンドウォール", "被撃中にも使える緊急防御", "CT 20秒"],
      ["鎧", "スパイラルキック", "ガードを崩す回転蹴り", "CT 10秒"],
      ["武器", "ルナスラッシュ", "突進して相手を気絶させる", "CT 10秒"]
    ]
  }
};

const slotLabels = { cloak: "外套", head: "兜", armor: "鎧", weapon: "武器" };
const slotGlyphs = { cloak: "◆", head: "●", armor: "⬟", weapon: "†" };
const equipmentOrigins = {
  silver_knight: { badge: "SK", label: "Silver Knight" },
  saladin: { badge: "SA", label: "Saladin" }
};
const reasonLabels = {
  death: "相手を撃破",
  simultaneous_death: "同時撃破",
  timeout_hp: "残りHP判定",
  timeout_equipment: "装備数判定",
  timeout_draw: "時間切れ引き分け",
  disconnect: "接続終了"
};

const state = {
  screen: "title",
  playerId: localStorage.getItem("cb.playerId") || crypto.randomUUID(),
  cp: Number(localStorage.getItem("cb.cp") || "1000"),
  characterId: localStorage.getItem("cb.characterId") || "silver_knight",
  pendingCharacterId: localStorage.getItem("cb.characterId") || "silver_knight",
  ws: null,
  roomId: null,
  cpAppliedRoomId: null,
  resultPreviousCp: null,
  snapshot: null,
  localSide: null,
  keys: new Set(),
  frame: 0
};

localStorage.setItem("cb.playerId", state.playerId);

const screen = document.querySelector("#screen");
const canvas = document.querySelector("#game");
const battleHud = document.querySelector("#battleHud");
const fallback = document.querySelector("#webglFallback");
const scene = new ChampionScene(canvas, () => { fallback.hidden = false; });

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
  if (!keyMap[event.code]) return;
  event.preventDefault();
  state.keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  if (!keyMap[event.code]) return;
  event.preventDefault();
  state.keys.delete(event.code);
});

function setScreen(next) {
  state.screen = next;
  battleHud.hidden = next !== "battle";
  scene.setMode(next, next === "select" ? state.pendingCharacterId : state.characterId);
  if (next === "battle") scene.setSnapshot(state.snapshot, state.localSide);
  renderScreen();
}

function renderScreen() {
  const online = state.ws?.readyState === WebSocket.OPEN;
  if (state.screen === "title") {
    screen.className = "screen-layer title-screen";
    screen.innerHTML = `
      <div class="title-copy">
        <p class="eyebrow">1 VS 1 ONLINE BATTLE</p>
        <h1>CHAMPION<br>MODE</h1>
        <p class="subtitle">FORTRESS DUEL</p>
        <button class="button primary" data-action="lobby">ゲームを始める</button>
      </div>
      <div class="title-footer">
        <span class="status ${online ? "online" : ""}">${online ? "接続中" : "接続準備完了"}</span>
        <span>PLAYER ID : ${state.playerId.slice(0, 8).toUpperCase()}</span>
      </div>`;
    return;
  }

  if (state.screen === "lobby") {
    const character = characters[state.characterId];
    screen.className = "screen-layer content-screen";
    screen.innerHTML = `
      ${topline("チャンピオンモード", `CP : ${state.cp}`)}
      <div class="content-body lobby-grid">
        <section class="panel character-summary">
          <p class="eyebrow">登録キャラクター</p>
          <h2>${character.name}</h2>
          <p class="muted">${character.type}</p>
        </section>
        <section class="panel panel-pad action-menu">
          <div class="row"><span class="muted">現在CP</span><strong class="cp-number">${state.cp}</strong></div>
          <div class="divider"></div>
          <button class="button primary" data-action="match">マッチング開始</button>
          <button class="button" data-action="select">キャラ変更</button>
          <button class="button ghost" data-action="detail">スキル確認</button>
          <p class="help-line">A / D 移動　W ジャンプ　J 攻撃　K ガード</p>
        </section>
      </div>`;
    return;
  }

  if (state.screen === "select") {
    screen.className = "screen-layer content-screen";
    screen.innerHTML = `
      ${topline("キャラクター選択", `CP : ${state.cp}`)}
      <div class="content-body select-layout">
        ${Object.entries(characters).map(([id, character]) => `
          <article class="panel character-card ${state.pendingCharacterId === id ? "selected" : ""}" data-action="preview" data-id="${id}">
            ${state.pendingCharacterId === id ? '<span class="selected-label">SELECTED</span>' : ""}
            <div class="card-space"></div>
            <p class="eyebrow">${character.type}</p>
            <h2>${character.name}</h2>
            <p class="muted">${character.detail}</p>
          </article>`).join("")}
      </div>
      <div class="screen-actions">
        <button class="button ghost" data-action="lobby">戻る</button>
        <button class="button primary" data-action="confirm-character">決定</button>
      </div>`;
    return;
  }

  if (state.screen === "detail") {
    const character = characters[state.characterId];
    screen.className = "screen-layer content-screen";
    screen.innerHTML = `
      ${topline("キャラクター詳細 / スキル確認", character.name)}
      <div class="content-body detail-layout">
        <section class="detail-copy">
          <p class="eyebrow">${character.type}</p>
          <h2>${character.name}</h2>
          <p class="muted">${character.detail}</p>
        </section>
        <section class="panel skill-panel">
          <h3>スキル一覧</h3>
          <div class="skill-grid">
            <div class="skill-row"><span class="skill-icon">J</span><div><div class="skill-name">通常攻撃</div><div class="skill-effect">${character.normal}</div></div><span class="cooldown">CTなし</span></div>
            ${character.skills.map((skill, index) => `
              <div class="skill-row">
                <span class="skill-icon">${index + 1}</span>
                <div><div class="skill-name">${skill[1]}</div><div class="skill-effect">${skill[0]} / ${skill[2]}</div></div>
                <span class="cooldown">${skill[3]}</span>
              </div>`).join("")}
          </div>
        </section>
      </div>
      <div class="screen-actions"><button class="button ghost" data-action="lobby">戻る</button><span></span></div>`;
    return;
  }

  if (state.screen === "matching") {
    const character = characters[state.characterId];
    screen.className = "screen-layer matching-screen";
    screen.innerHTML = `
      <section class="panel matching-card">
        <p class="eyebrow">ONLINE MATCHMAKING</p>
        <h2>マッチング中...</h2>
        <div class="matching-dots"><i></i><i></i><i></i></div>
        <div class="match-profile">
          <div><span class="muted small">現在CP</span><div class="cp-number">${state.cp}</div></div>
          <div class="divider" style="height:72px"></div>
          <div><span class="muted small">登録キャラクター</span><h3>${character.name}</h3></div>
        </div>
        <p class="status ${online ? "online" : ""}">${online ? `接続状態 : 良好 / ${state.roomId || "検索中"}` : "対戦相手を検索しています"}</p>
        <button class="button danger" data-action="cancel">キャンセル</button>
      </section>`;
    return;
  }

  if (state.screen === "battle") {
    screen.className = "screen-layer";
    screen.innerHTML = "";
    renderBattleHud();
    return;
  }

  if (state.screen === "result") {
    const result = state.snapshot?.result;
    const delta = result && state.localSide ? result.cpDelta[state.localSide] : 0;
    const outcome = !result || result.winner === "draw" ? "DRAW" : result.winner === state.localSide ? "WIN" : "LOSE";
    const before = state.resultPreviousCp ?? state.cp - delta;
    screen.className = "screen-layer result-screen";
    screen.innerHTML = `
      <div class="result-title ${outcome.toLowerCase()}">${outcome}</div>
      <section class="panel result-panel">
        <p>${outcome === "WIN" ? "勝利！" : outcome === "LOSE" ? "敗北" : "引き分け"}　<span class="muted">${reasonLabels[result?.reason] || "対戦終了"}</span></p>
        <div class="divider"></div>
        <div class="cp-change"><span>${before}</span><span>▶</span><strong>${state.cp}</strong><span class="cp-delta ${delta >= 0 ? "plus" : "minus"}">(${delta > 0 ? "+" : ""}${delta})</span></div>
        <div class="result-actions">
          <button class="button primary" data-action="match">再戦する</button>
          <button class="button" data-action="lobby">ロビーに戻る</button>
          <button class="button ghost" data-action="title">タイトルに戻る</button>
        </div>
      </section>`;
  }
}

function topline(title, right) {
  return `<header class="topline"><div><span class="brand">CHAMPION MODE</span><span class="muted">　/　${title}</span></div><div class="meta"><span>${right}</span><span class="status ${state.ws?.readyState === WebSocket.OPEN ? "online" : ""}">${state.ws?.readyState === WebSocket.OPEN ? "ONLINE" : "READY"}</span></div></header>`;
}

screen.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "title") leaveMatch("title");
  if (action === "lobby") leaveMatch("lobby");
  if (action === "select") {
    state.pendingCharacterId = state.characterId;
    setScreen("select");
  }
  if (action === "detail") setScreen("detail");
  if (action === "preview") {
    state.pendingCharacterId = target.dataset.id;
    scene.setMode("select", state.pendingCharacterId);
    renderScreen();
  }
  if (action === "confirm-character") {
    state.characterId = state.pendingCharacterId;
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

function leaveMatch(nextScreen) {
  const ws = state.ws;
  state.ws = null;
  ws?.close();
  state.roomId = null;
  state.snapshot = null;
  state.localSide = null;
  state.keys.clear();
  setScreen(nextScreen);
}

async function startMatch() {
  const previousSocket = state.ws;
  state.ws = null;
  previousSocket?.close();
  state.snapshot = null;
  state.resultPreviousCp = null;
  state.cpAppliedRoomId = null;
  setScreen("matching");
  try {
    const response = await fetch(`/api/match?playerId=${encodeURIComponent(state.playerId)}&cp=${state.cp}&characterId=${state.characterId}`);
    if (!response.ok) throw new Error(`Match request failed: ${response.status}`);
    const match = await response.json();
    state.roomId = match.roomId;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}${match.wsPath}`);
    state.ws = ws;
    ws.addEventListener("open", () => {
      if (state.ws !== ws) return;
      ws.send(JSON.stringify({ type: "client.hello", playerId: state.playerId, cp: state.cp, characterId: state.characterId }));
      renderScreen();
    });
    ws.addEventListener("message", (event) => {
      if (state.ws !== ws) return;
      const message = JSON.parse(event.data);
      if (message.type !== "server.snapshot") return;
      state.snapshot = message;
      if (message.localSide) state.localSide = message.localSide;
      if (message.phase === "playing") {
        if (state.screen !== "battle") setScreen("battle");
        scene.setSnapshot(message, state.localSide);
        renderBattleHud();
      }
      if (message.phase === "finished") {
        applyCpDelta(message.result);
        if (state.screen !== "result") setScreen("result");
      }
    });
    ws.addEventListener("close", () => {
      if (state.ws !== ws) return;
      state.ws = null;
      if (state.screen === "matching") setScreen("lobby");
    });
    ws.addEventListener("error", () => {
      if (state.ws !== ws) return;
      if (state.screen === "matching") setScreen("lobby");
    });
  } catch (error) {
    console.error(error);
    state.ws = null;
    setScreen("lobby");
  }
}

function applyCpDelta(result) {
  if (!result || !state.localSide || state.cpAppliedRoomId === state.roomId) return;
  state.cpAppliedRoomId = state.roomId;
  state.resultPreviousCp = state.cp;
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

function renderBattleHud() {
  const snapshot = state.snapshot;
  if (!snapshot?.players?.length) {
    battleHud.innerHTML = "";
    return;
  }
  const local = snapshot.players.find((player) => player.side === state.localSide) || snapshot.players[0];
  const enemy = snapshot.players.find((player) => player.side !== local.side) || snapshot.players[1];
  battleHud.innerHTML = `
    <div class="hud-top">
      ${fighterHud(local, "PLAYER", false)}
      <div class="timer">${formatTime(snapshot.timeRemainingMs)}</div>
      ${fighterHud(enemy, "ENEMY", true)}
    </div>
    <div class="hud-bottom">
      <div class="equipment-bar">${equipmentHud(local)}</div>
      <div class="control-box"><div><b>移動</b> W A S D</div><div><b>攻撃</b> J　<b>ガード</b> K</div><div><b>スキル</b> 1 2 3 4　<b>拾得</b> E</div></div>
    </div>`;
}

function fighterHud(player, label, enemy) {
  if (!player) return "<div></div>";
  return `<section class="fighter-hud ${enemy ? "enemy" : ""}"><div class="fighter-name"><strong>${label}</strong><span>${characters[player.characterId].name}</span></div><div class="hp-row"><div class="hp-bar"><i style="width:${Math.max(0, player.hp)}%"></i></div><span class="hp-value">${Math.max(0, player.hp)}</span></div></section>`;
}

function equipmentHud(player) {
  return ["cloak", "head", "armor", "weapon"].map((slot, index) => {
    const item = player.equipment[slot];
    const cooldown = item ? Math.ceil(item.cooldownRemainingMs / 1000) : 0;
    const origin = item ? equipmentOrigins[item.originCharacterId] : null;
    const originClass = item ? `origin-${item.originCharacterId}` : "";
    return `<div class="equipment-slot ${originClass} ${item ? "" : "off"} ${cooldown ? "cooling" : ""}" data-cd="${cooldown || ""}" title="${origin?.label || "装備なし"}"><span class="origin-badge">${origin?.badge || "--"}</span><div class="slot-icon">${slotGlyphs[slot]}</div><div class="slot-label">${index + 1} ${slotLabels[slot]}</div></div>`;
  }).join("");
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

renderScreen();
