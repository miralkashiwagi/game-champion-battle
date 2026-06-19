import { ChampionScene } from "./scene.js";
import { CHARACTER_LIST, normalizeCharacterId } from "../characters/registry.ts";
import { EQUIPMENT_REGISTRY } from "../equipment/registry.ts";

const slotLabels = { cloak: "外套", head: "兜", armor: "鎧", weapon: "武器" };
const slotGlyphs = { cloak: "◆", head: "●", armor: "⬟", weapon: "†" };
const characters = Object.fromEntries(CHARACTER_LIST.map(({ definition }) => [definition.id, {
  ...definition.ui,
  skills: Object.values(definition.initialEquipment).map((equipmentId) => EQUIPMENT_REGISTRY[equipmentId].definition.skill).map((skill) => [
    slotLabels[skill.slot],
    skill.name,
    skill.description,
    skill.passive ? "常時効果" : skill.cooldownMs ? `CT ${skill.cooldownMs / 1000}秒` : "CTなし"
  ])
}]));
const equipmentUi = Object.fromEntries(Object.entries(EQUIPMENT_REGISTRY).map(([id, registration]) => [id, registration.definition.ui]));
const reasonLabels = {
  death: "相手を撃破",
  simultaneous_death: "同時撃破",
  timeout_hp: "残りHP判定",
  timeout_equipment: "装備数判定",
  timeout_draw: "時間切れ引き分け",
  disconnect: "接続終了"
};

const INPUT_RESEND_MS = 50;
const BATTLE_HUD_RENDER_MS = 100;

const state = {
  screen: "title",
  playerId: localStorage.getItem("cb.playerId") || crypto.randomUUID(),
  cp: Number(localStorage.getItem("cb.cp") || "1000"),
  characterId: normalizeCharacterId(localStorage.getItem("cb.characterId")),
  pendingCharacterId: normalizeCharacterId(localStorage.getItem("cb.characterId")),
  ws: null,
  roomId: null,
  matchMode: "online",
  matchSearch: null,
  cpAppliedRoundKey: null,
  resultPreviousCp: null,
  rematchDeadline: null,
  rematchRequestedPlayerIds: [],
  rematchRequested: false,
  rematchAvailable: true,
  notice: "",
  snapshot: null,
  localSide: null,
  keys: new Set(),
  frame: 0,
  lastBattleHudRenderAt: 0
};

localStorage.setItem("cb.playerId", state.playerId);

const screen = document.querySelector("#screen");
const canvas = document.querySelector("#game");
const battleHud = document.querySelector("#battleHud");
const fallback = document.querySelector("#webglFallback");
const scene = new ChampionScene(canvas, () => { fallback.hidden = false; });
scene.setLocalInputProvider(currentInputButtons);

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
  if (event.code === "KeyH" && !event.repeat) {
    event.preventDefault();
    scene.toggleCollisionDebug();
    return;
  }
  if (!keyMap[event.code]) return;
  event.preventDefault();
  const changed = !state.keys.has(event.code);
  state.keys.add(event.code);
  if (changed) sendCurrentInput();
});

window.addEventListener("keyup", (event) => {
  if (!keyMap[event.code]) return;
  event.preventDefault();
  const changed = state.keys.delete(event.code);
  if (changed) sendCurrentInput();
});

function setScreen(next) {
  state.screen = next;
  state.lastBattleHudRenderAt = 0;
  battleHud.hidden = next !== "battle";
  scene.setMode(next, next === "select" ? state.pendingCharacterId : state.characterId);
  if (next === "battle") scene.setSnapshot(state.snapshot, state.localSide);
  renderScreen();
}

function rematchStatus() {
  const remaining = state.rematchDeadline ? Math.max(0, Math.ceil((state.rematchDeadline - Date.now()) / 1000)) : 0;
  const opponentRequested = state.rematchRequestedPlayerIds.some((id) => id !== state.playerId);
  const text = !state.rematchAvailable
    ? "再戦受付は終了しました"
    : state.rematchRequested
      ? `対戦相手の返答を待っています（残り ${remaining}秒）`
      : opponentRequested
        ? `対戦相手が再戦を希望しています（残り ${remaining}秒）`
        : `再戦受付中（残り ${remaining}秒）`;
  return { text, opponentRequested };
}

function updateRematchStatus() {
  const status = screen.querySelector("[data-rematch-status]");
  if (!status) return;
  const { text, opponentRequested } = rematchStatus();
  status.textContent = text;
  status.classList.toggle("online", opponentRequested);
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
          ${state.notice ? `<p class="status">${state.notice}</p>` : ""}
          <button class="button primary" data-action="match">マッチング開始</button>
          <button class="button" data-action="practice">練習開始</button>
          <button class="button" data-action="select">キャラ変更</button>
          <button class="button ghost" data-action="detail">スキル確認</button>
          <p class="help-line">A / D 移動・2回でダッシュ　W ジャンプ　J 攻撃　K ガード</p>
        </section>
      </div>`;
    return;
  }

  if (state.screen === "select") {
    const selectedCharacter = characters[state.pendingCharacterId];
    screen.className = "screen-layer content-screen";
    screen.innerHTML = `
      ${topline("キャラクター選択", `CP : ${state.cp}`)}
      <div class="content-body select-layout">
        <section class="panel select-roster" aria-label="キャラクター一覧">
          <div class="select-roster-head">
            <div>
              <p class="eyebrow">Roster</p>
              <h3>登録キャラクター</h3>
            </div>
            <span class="roster-count">${Object.keys(characters).length}</span>
          </div>
          <div class="character-list">
            ${Object.entries(characters).map(([id, character], index) => `
              <button class="character-option ${state.pendingCharacterId === id ? "selected" : ""}" data-action="preview" data-id="${id}" type="button">
                <span class="option-index">${String(index + 1).padStart(2, "0")}</span>
                <span class="option-copy">
                  <strong>${character.name}</strong>
                  <span>${character.type}</span>
                </span>
                <span class="option-state">${state.pendingCharacterId === id ? "選択中" : "確認"}</span>
              </button>`).join("")}
          </div>
        </section>
        <section class="panel character-preview">
          <div class="preview-copy">
            <p class="eyebrow">${selectedCharacter.type}</p>
            <h2>${selectedCharacter.name}</h2>
            <p class="muted">${selectedCharacter.detail}</p>
            <div class="preview-normal">
              <span class="small muted">通常攻撃</span>
              <strong>${selectedCharacter.normal}</strong>
            </div>
          </div>
        </section>
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
    const practice = state.matchMode === "practice";
    screen.className = "screen-layer matching-screen";
    screen.innerHTML = `
      <section class="panel matching-card">
        <p class="eyebrow">${practice ? "PRACTICE MODE" : "ONLINE MATCHMAKING"}</p>
        <h2>${practice ? "練習準備中..." : "マッチング中..."}</h2>
        <div class="matching-dots"><i></i><i></i><i></i></div>
        <div class="match-profile">
          <div><span class="muted small">現在CP</span><div class="cp-number">${state.cp}</div></div>
          <div class="divider" style="height:72px"></div>
          <div><span class="muted small">登録キャラクター</span><h3>${character.name}</h3></div>
        </div>
        <p class="status ${online ? "online" : ""}">${practice ? "CPU戦を開始しています" : online ? `接続状態 : 良好 / ${state.roomId || "検索中"}` : "対戦相手を検索しています"}</p>
        ${!practice && state.matchSearch ? `<p class="muted">検索範囲 CP ${state.matchSearch.minCp} ～ ${state.matchSearch.maxCp}</p>` : ""}
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
    const practice = state.matchMode === "practice";
    const delta = result && state.localSide ? result.cpDelta[state.localSide] : 0;
    const outcome = !result || result.winner === "draw" ? "DRAW" : result.winner === state.localSide ? "WIN" : "LOSE";
    const before = state.resultPreviousCp ?? state.cp - delta;
    const { text: rematchText, opponentRequested } = rematchStatus();
    screen.className = "screen-layer result-screen";
    screen.innerHTML = `
      <div class="result-title ${outcome.toLowerCase()}">${outcome}</div>
      <section class="panel result-panel">
        <p>${outcome === "WIN" ? "勝利！" : outcome === "LOSE" ? "敗北" : "引き分け"}　<span class="muted">${reasonLabels[result?.reason] || "対戦終了"}</span></p>
        <div class="divider"></div>
        ${practice ? `<p class="status">練習モードのためCPは変動しません</p>` : `<div class="cp-change"><span>${before}</span><span>▶</span><strong>${state.cp}</strong><span class="cp-delta ${delta >= 0 ? "plus" : "minus"}">(${delta > 0 ? "+" : ""}${delta})</span></div>
        <p class="status ${opponentRequested ? "online" : ""}" data-rematch-status>${rematchText}</p>`}
        <div class="result-actions">
          ${practice ? `<button class="button primary" data-action="practice">もう一度</button>` : `<button class="button primary" data-action="match" ${state.rematchRequested ? "disabled" : ""}>${state.rematchAvailable ? "再戦する" : "新しい対戦相手を探す"}</button>`}
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
  if (action === "match") {
    if (state.screen === "result" && state.rematchAvailable && state.ws?.readyState === WebSocket.OPEN) requestRematch();
    else startMatch();
  }
  if (action === "practice") startPractice();
  if (action === "cancel") {
    state.ws?.close();
    state.ws = null;
    setScreen("lobby");
  }
});

function leaveMatch(nextScreen) {
  const ws = state.ws;
  state.ws = null;
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "client.leave" }));
  ws?.close();
  state.roomId = null;
  state.matchMode = "online";
  state.snapshot = null;
  state.matchSearch = null;
  state.localSide = null;
  state.keys.clear();
  state.rematchAvailable = false;
  setScreen(nextScreen);
}

async function startMatch() {
  const previousSocket = state.ws;
  state.ws = null;
  previousSocket?.close();
  state.matchMode = "online";
  state.snapshot = null;
  state.matchSearch = null;
  state.resultPreviousCp = null;
  state.rematchDeadline = null;
  state.rematchRequestedPlayerIds = [];
  state.rematchRequested = false;
  state.rematchAvailable = true;
  state.notice = "";
  setScreen("matching");
  try {
    const response = await fetch(`/api/match?playerId=${encodeURIComponent(state.playerId)}&cp=${state.cp}&characterId=${state.characterId}`);
    if (!response.ok) throw new Error(`Match request failed: ${response.status}`);
    const match = await response.json();
    state.roomId = match.roomId;
    connectSocket(match.wsPath, "matchmaker");
  } catch (error) {
    console.error(error);
    state.ws = null;
    setScreen("lobby");
  }
}

async function startPractice() {
  const previousSocket = state.ws;
  state.ws = null;
  previousSocket?.close();
  state.matchMode = "practice";
  state.snapshot = null;
  state.matchSearch = null;
  state.resultPreviousCp = null;
  state.rematchDeadline = null;
  state.rematchRequestedPlayerIds = [];
  state.rematchRequested = false;
  state.rematchAvailable = false;
  state.notice = "";
  setScreen("matching");
  try {
    const response = await fetch(`/api/practice?playerId=${encodeURIComponent(state.playerId)}&cp=${state.cp}&characterId=${state.characterId}`);
    if (!response.ok) throw new Error(`Practice request failed: ${response.status}`);
    const match = await response.json();
    state.roomId = match.matchId;
    state.matchMode = match.mode || "practice";
    connectSocket(match.wsPath, "match");
  } catch (error) {
    console.error(error);
    state.ws = null;
    state.matchMode = "online";
    setScreen("lobby");
  }
}

function connectSocket(wsPath, kind) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}${wsPath}`);
  state.ws = ws;
  ws.addEventListener("open", () => {
    if (state.ws === ws) renderScreen();
  });
  ws.addEventListener("message", (event) => {
    if (state.ws !== ws) return;
    const message = JSON.parse(event.data);
    handleServerMessage(message, ws);
  });
  ws.addEventListener("close", () => {
    if (state.ws !== ws) return;
    state.ws = null;
    if (state.screen === "matching") setScreen("lobby");
  });
  ws.addEventListener("error", () => {
    if (state.ws === ws && state.screen === "matching") setScreen("lobby");
  });
  if (kind === "match") state.roomId = wsPath.split("/").at(-1)?.split("?")[0] || state.roomId;
}

function handleServerMessage(message, ws) {
  if (message.type === "server.match_search") {
    state.matchSearch = message;
    if (state.screen === "matching") renderScreen();
    return;
  }
  if (message.type === "server.match_found") {
    state.ws = null;
    ws.close();
    state.roomId = message.matchId;
    state.matchMode = "online";
    state.matchSearch = null;
    state.rematchRequested = false;
    state.rematchAvailable = true;
    connectSocket(message.wsPath, "match");
    return;
  }
  if (message.type === "server.rematch_status") {
    state.rematchDeadline = message.deadline;
    state.rematchRequestedPlayerIds = message.requestedPlayerIds;
    state.rematchRequested = message.requestedPlayerIds.includes(state.playerId);
    if (state.screen === "result") renderScreen();
    return;
  }
  if (message.type === "server.rematch_unavailable") {
    state.rematchAvailable = false;
    if (state.rematchRequested) {
      state.ws = null;
      ws.close();
      startMatch();
    } else if (state.screen === "result") {
      renderScreen();
    }
    return;
  }
  if (message.type !== "server.snapshot") return;
  const previousRoundId = state.snapshot?.roundId;
  state.snapshot = message;
  if (message.mode) state.matchMode = message.mode;
  if (message.localSide) state.localSide = message.localSide;
  if (message.phase === "playing") {
    if (previousRoundId !== message.roundId) {
      state.resultPreviousCp = null;
      state.rematchDeadline = null;
      state.rematchRequestedPlayerIds = [];
      state.rematchRequested = false;
    }
    if (state.screen !== "battle") setScreen("battle");
    scene.setSnapshot(message, state.localSide);
    renderBattleHudThrottled();
  }
  if (message.phase === "finished") {
    applyCpDelta(message.result, message.matchId, message.roundId);
    if (state.screen !== "result") setScreen("result");
  }
}

function requestRematch() {
  if (state.ws?.readyState !== WebSocket.OPEN) return;
  state.rematchRequested = true;
  state.ws.send(JSON.stringify({ type: "client.rematch" }));
  renderScreen();
}

function applyCpDelta(result, matchId, roundId) {
  if (state.matchMode === "practice") return;
  const roundKey = `${matchId || state.roomId}:${roundId || 1}`;
  if (!result || !state.localSide || state.cpAppliedRoundKey === roundKey) return;
  state.cpAppliedRoundKey = roundKey;
  state.resultPreviousCp = state.cp;
  state.cp = Math.max(0, state.cp + result.cpDelta[state.localSide]);
  localStorage.setItem("cb.cp", String(state.cp));
}

function currentInput() {
  return {
    frame: state.frame++,
    ...currentInputButtons()
  };
}

function currentInputButtons() {
  return {
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

function sendCurrentInput() {
  if (state.ws?.readyState === WebSocket.OPEN && state.screen === "battle") {
    state.ws.send(JSON.stringify({ type: "client.input", input: currentInput() }));
  }
}

setInterval(sendCurrentInput, INPUT_RESEND_MS);
setInterval(() => {
  if (state.screen === "result" && state.rematchAvailable) updateRematchStatus();
}, 250);

function renderBattleHudThrottled() {
  const now = performance.now();
  if (now - state.lastBattleHudRenderAt < BATTLE_HUD_RENDER_MS) return;
  renderBattleHud();
}

function renderBattleHud() {
  state.lastBattleHudRenderAt = performance.now();
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
      <div class="control-box"><div><b>移動</b> W A S D　<b>ダッシュ</b> A/D 2回</div><div><b>攻撃</b> J　<b>ガード</b> K</div><div><b>スキル</b> 1 2 3 4　<b>拾得</b> E　<b>判定</b> H</div></div>
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
    const ui = item ? equipmentUi[item.equipmentId] : null;
    const equipmentClass = item ? `equipment-${item.equipmentId}` : "";
    const equipmentStyle = ui ? `style="--origin-color:${ui.accentColor}"` : "";
    return `<div class="equipment-slot ${equipmentClass} ${item ? "" : "off"} ${cooldown ? "cooling" : ""}" ${equipmentStyle} data-cd="${cooldown || ""}" title="${ui?.name || "装備なし"}"><span class="origin-badge">${ui?.badge || "--"}</span><div class="slot-icon">${slotGlyphs[slot]}</div><div class="slot-label">${index + 1} ${slotLabels[slot]}</div></div>`;
  }).join("");
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

renderScreen();
