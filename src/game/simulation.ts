import {
  DEFAULT_INPUT,
  DASH_SPEED,
  DROP_ORDER,
  GRAVITY,
  GROUND_Y,
  AIR_KNOCKBACK_SPEED,
  BATTLE_COLLISION_SCALE,
  INITIAL_HP,
  JUMP_SPEED,
  MATCH_TIME_MS,
  MOVE_SPEED,
  OPPONENT_PICKUP_LOCK_FRAMES,
  OWNER_PICKUP_LOCK_FRAMES,
  PICKUP_RADIUS,
  STAGE_WIDTH,
  TICK_RATE,
  TICK_MS
} from "../shared/constants.ts";
import { COMMON_BAREHAND_COMBO, COMMON_GUARD_COUNTER, COMMON_WAKE_UP_ATTACK } from "../characters/common.ts";
import { CHARACTER_REGISTRY } from "../characters/registry.ts";
import { EQUIPMENT_REGISTRY } from "../equipment/registry.ts";
import { attackForEquipment, CHARACTER_SPECS, createEquipment, type AttackSpec } from "../shared/characters.ts";
import type {
  CharacterId,
  EquipmentItem,
  EquipmentSlot,
  FieldItem,
  InputState,
  MatchEvent,
  MatchPhase,
  MatchResult,
  MatchSnapshot,
  PlayerSide,
  PlayerSnapshot
} from "../shared/types.ts";

interface ActiveAttack {
  spec: AttackSpec;
  startFrame: number;
  hitsDone: number;
}

type MoveAxis = -1 | 0 | 1;

interface PlayerRuntime extends PlayerSnapshot {
  latestInput: InputState;
  previousInput: InputState;
  attackTimer: number;
  activeAttack: ActiveAttack | null;
  invulnerableUntilFrame: number;
  attackHeldFrames: number;
  attackHoldConsumed: boolean;
  comboContinueUntilFrame: number;
  lastLeftTapFrame: number;
  lastRightTapFrame: number;
  dashDirection: MoveAxis;
  wakeRollDirection: MoveAxis;
  hitStopRemainingFrames: number;
}

const HOLD_ATTACK_FRAMES = Math.round(TICK_RATE * 0.4);
const COMBO_CONTINUE_WINDOW_FRAMES = Math.round(TICK_RATE * 0.45);
const DASH_TAP_WINDOW_FRAMES = Math.round(TICK_RATE * 0.25);
const DOWN_FRAMES = Math.round(TICK_RATE * 1);
const STUN_FRAMES = Math.round(TICK_RATE * 2);
const WAKE_ROLL_FRAMES = Math.round(TICK_RATE * 0.32);
const GET_UP_FRAMES = Math.round(TICK_RATE * 0.3);
const WAKE_ROLL_SPEED = 5.8;
const DEFAULT_HIT_STOP_FRAMES = 4;
const HEAVY_HIT_STOP_FRAMES = 6;
const DEFAULT_BLOCK_STOP_FRAMES = 3;
const MULTI_HIT_STOP_FRAMES = 3;

export class MatchSimulation {
  frame = 0;
  phase: MatchPhase = "waiting";
  timeRemainingMs = MATCH_TIME_MS;
  result: MatchResult | undefined;
  players = new Map<PlayerSide, PlayerRuntime>();
  fieldItems: FieldItem[] = [];
  events: MatchEvent[] = [];

  addPlayer(side: PlayerSide, playerId: string, cp: number, characterId: CharacterId): void {
    const equipment = createEquipment(characterId, playerId);
    const x = side === "p1" ? 260 : STAGE_WIDTH - 260;
    this.players.set(side, {
      side,
      playerId,
      characterId,
      cp,
      hp: INITIAL_HP,
      position: { x, y: GROUND_Y },
      velocity: { x: 0, y: 0 },
      facing: side === "p1" ? 1 : -1,
      state: "Idle",
      stateTimer: 0,
      equipment,
      equippedCount: 4,
      comboStep: 0,
      attackName: null,
      activeActionId: null,
      actionStartedFrame: null,
      guardUntilFrame: 0,
      latestInput: { ...DEFAULT_INPUT, skills: {} },
      previousInput: { ...DEFAULT_INPUT, skills: {} },
      attackTimer: 0,
      activeAttack: null,
      invulnerableUntilFrame: 0,
      attackHeldFrames: 0,
      attackHoldConsumed: false,
      comboContinueUntilFrame: Number.NEGATIVE_INFINITY,
      lastLeftTapFrame: Number.NEGATIVE_INFINITY,
      lastRightTapFrame: Number.NEGATIVE_INFINITY,
      dashDirection: 0,
      wakeRollDirection: 0,
      hitStopRemainingFrames: 0
    });
    this.push("joined", `${side} joined as ${CHARACTER_SPECS[characterId].ui.name}`);
    if (this.players.size === 2) {
      this.phase = "playing";
      this.push("ready", "Match started");
    }
  }

  removePlayer(side: PlayerSide): void {
    if (this.phase === "finished") return;
    const other = side === "p1" ? "p2" : "p1";
    if (this.players.has(other)) {
      this.finish({ winner: other, reason: "disconnect", cpDelta: { p1: side === "p1" ? -30 : 30, p2: side === "p2" ? -30 : 30 } });
    }
  }

  setInput(side: PlayerSide, input: InputState): void {
    const player = this.players.get(side);
    if (!player) return;
    player.latestInput = { ...input, skills: { ...input.skills } };
  }

  tick(): void {
    this.frame += 1;
    if (this.phase !== "playing") return;

    this.timeRemainingMs = Math.max(0, this.timeRemainingMs - TICK_MS);
    for (const item of this.fieldItems) {
      item.item.cooldownRemainingMs = Math.max(0, item.item.cooldownRemainingMs - TICK_MS);
    }

    const p1 = this.players.get("p1");
    const p2 = this.players.get("p2");
    if (!p1 || !p2) return;

    this.updatePlayer(p1, p2);
    this.updatePlayer(p2, p1);
    this.resolveAttack(p1, p2);
    this.resolveAttack(p2, p1);
    this.resolvePickup(p1);
    this.resolvePickup(p2);
    this.faceOpponents(p1, p2);
    this.checkFinish();

    for (const player of [p1, p2]) {
      player.previousInput = { ...player.latestInput, skills: { ...player.latestInput.skills } };
    }
  }

  snapshot(localSide?: PlayerSide): MatchSnapshot {
    const snapshot: MatchSnapshot = {
      type: "server.snapshot",
      frame: this.frame,
      phase: this.phase,
      timeRemainingMs: Math.max(0, Math.round(this.timeRemainingMs)),
      players: [...this.players.values()].map((player) => this.publicPlayer(player)),
      fieldItems: this.fieldItems.map((item) => ({ ...item, item: { ...item.item }, position: { ...item.position } }))
    };
    if (localSide) snapshot.localSide = localSide;
    if (this.result) snapshot.result = this.result;
    return snapshot;
  }

  drainEvents(): MatchEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  private updatePlayer(player: PlayerRuntime, opponent: PlayerRuntime): void {
    const input = player.latestInput;

    if (player.state === "Dead") return;
    if (player.hitStopRemainingFrames > 0) {
      player.hitStopRemainingFrames -= 1;
      return;
    }
    this.cooldownEquipment(player);
    if (player.stateTimer > 0) player.stateTimer -= 1;

    if (player.stateTimer <= 0 && ["Hitstun", "AttackRecovery", "GuardCounterWindow", "Stunned", "GetUp"].includes(player.state)) {
      player.state = "Idle";
      player.attackName = null;
      player.activeActionId = null;
      player.actionStartedFrame = null;
      player.wakeRollDirection = 0;
    }
    if (player.stateTimer <= 0 && player.state === "KneelDown") {
      player.state = "Down";
      player.stateTimer = DOWN_FRAMES;
    }
    if (player.state === "Down") {
      this.updateDownAction(player);
    }
    if (player.state === "WakeRoll") {
      player.velocity.x = player.wakeRollDirection * WAKE_ROLL_SPEED;
      if (player.stateTimer <= 0) {
        player.state = "Idle";
        player.velocity.x = 0;
        player.wakeRollDirection = 0;
      }
    }

    const canAct = ["Idle", "Move", "Dash", "Guard", "GuardCounterWindow"].includes(player.state);
    const headSkill = player.equipment.head ? attackForEquipment(player.equipment.head) : undefined;
    if (headSkill?.usableWhileHit && !["Down", "WakeRoll", "GetUp"].includes(player.state) && input.skills.head && !player.previousInput.skills.head) {
      this.trySkill(player, opponent, "head", true);
    }

    if (canAct) {
      if (input.guard) {
        if (player.state !== "Guard" && player.state !== "GuardCounterWindow") {
          player.guardUntilFrame = this.frame + 180;
        }
        player.state = this.frame <= player.guardUntilFrame ? "Guard" : "Idle";
        if (player.state === "Guard") player.velocity.x = 0;
      } else if (player.state === "Guard") {
        player.state = "Idle";
      }

      for (const slot of ["cloak", "head", "armor", "weapon"] as EquipmentSlot[]) {
        if (input.skills[slot] && !player.previousInput.skills[slot]) {
          this.trySkill(player, opponent, slot, false);
        }
      }

      const attackPressed = input.attack && !player.previousInput.attack;
      const attackReleased = !input.attack && player.previousInput.attack;
      if (attackPressed) {
        player.attackHeldFrames = 0;
        player.attackHoldConsumed = false;
        if (player.state === "GuardCounterWindow") {
          this.startAttack(player, COMMON_GUARD_COUNTER);
          player.attackHoldConsumed = true;
        }
      }

      if (input.attack && !player.attackHoldConsumed && player.state !== "GuardCounterWindow") {
        player.attackHeldFrames += 1;
        if (player.attackHeldFrames >= HOLD_ATTACK_FRAMES) {
          const holdAttack = this.getHoldAttack(player);
          if (holdAttack) {
            this.startAttack(player, holdAttack);
            player.attackHoldConsumed = true;
            player.attackHeldFrames = 0;
          }
        }
      } else if (attackReleased) {
        if (!player.attackHoldConsumed) this.startComboAttack(player);
        player.attackHeldFrames = 0;
        player.attackHoldConsumed = false;
      }

      if (!player.activeAttack && player.state !== "Guard") {
        const axis = inputAxis(input);
        const dashing = this.updateDashDirection(player, axis, inputAxis(player.previousInput)) !== 0 && player.position.y >= GROUND_Y;
        player.velocity.x = axis * (dashing ? DASH_SPEED : MOVE_SPEED);
        if (axis !== 0) {
          player.facing = axis > 0 ? 1 : -1;
          player.state = dashing ? "Dash" : "Move";
        } else if (player.state === "Move" || player.state === "Dash") {
          player.state = "Idle";
        }
        if (input.up && player.position.y >= GROUND_Y) {
          player.velocity.y = JUMP_SPEED;
          player.state = "Jump";
        }
      }
    }

    player.velocity.y += GRAVITY;
    const halfWidth = collisionHalfWidth(player.characterId);
    player.position.x = clamp(player.position.x + player.velocity.x, halfWidth, STAGE_WIDTH - halfWidth);
    player.position.y += player.velocity.y;
    if (player.position.y >= GROUND_Y) {
      player.position.y = GROUND_Y;
      player.velocity.y = 0;
      if (player.state === "AirDamaged") {
        player.state = "Down";
        player.stateTimer = DOWN_FRAMES;
      } else if (player.state === "Jump") {
        player.state = "Idle";
      }
    }

    if (player.activeAttack) {
      player.attackTimer += 1;
      const total = player.activeAttack.spec.startupFrames + player.activeAttack.spec.activeFrames + player.activeAttack.spec.recoveryFrames;
      const move = player.activeAttack.spec.movement ?? 0;
      if (move && player.attackTimer <= player.activeAttack.spec.startupFrames + player.activeAttack.spec.activeFrames) {
        const halfWidth = collisionHalfWidth(player.characterId);
        player.position.x = clamp(player.position.x + (move / Math.max(1, player.activeAttack.spec.activeFrames + player.activeAttack.spec.startupFrames)) * player.facing, halfWidth, STAGE_WIDTH - halfWidth);
      }
      if (player.attackTimer >= total) {
        player.activeAttack = null;
        player.attackTimer = 0;
        player.attackName = null;
        player.activeActionId = null;
        player.actionStartedFrame = null;
        player.state = "Idle";
      }
    }
  }

  startAttack(player: PlayerRuntime, spec: AttackSpec): boolean {
    if (player.activeAttack || player.state === "Dead") return false;
    player.activeAttack = { spec, startFrame: this.frame, hitsDone: 0 };
    player.attackTimer = 0;
    player.attackName = spec.name;
    player.activeActionId = spec.motionId || spec.id;
    player.actionStartedFrame = this.frame;
    player.state = "AttackStartup";
    player.velocity.x = 0;
    if (spec.invulnerable) player.invulnerableUntilFrame = this.frame + spec.startupFrames + spec.activeFrames;
    return true;
  }

  private resolveAttack(attacker: PlayerRuntime, defender: PlayerRuntime): void {
    const active = attacker.activeAttack;
    if (!active) return;
    if (attacker.hitStopRemainingFrames > 0) return;
    const hitCount = Math.max(1, active.spec.hitCount ?? 1);
    if (active.hitsDone >= hitCount) return;
    const localTimer = attacker.attackTimer;
    const isActive = localTimer >= active.spec.startupFrames && localTimer <= active.spec.startupFrames + active.spec.activeFrames;
    attacker.state = localTimer < active.spec.startupFrames ? "AttackStartup" : isActive ? "AttackActive" : "AttackRecovery";
    if (!isActive) return;
    const activeElapsed = localTimer - active.spec.startupFrames;
    const nextHitFrame = Math.floor((active.spec.activeFrames * active.hitsDone) / hitCount);
    if (activeElapsed < nextHitFrame) return;
    if (defender.invulnerableUntilFrame >= this.frame || defender.state === "Dead") return;
    if (defender.state === "Down" && !active.spec.hitsDowned) return;
    const defenderCollision = CHARACTER_REGISTRY[defender.characterId].definition.collision;
    const horizontalReach = attackRange(active.spec) + collisionHalfWidth(defender.characterId);
    if (Math.abs(attacker.position.x - defender.position.x) > horizontalReach) return;
    if (Math.abs(attacker.position.y - defender.position.y) > defenderCollision.height * BATTLE_COLLISION_SCALE) return;

    const blocked = this.isBlocking(defender, attacker) && !active.spec.guardPierce;
    active.hitsDone += 1;
    if (blocked) {
      defender.state = "GuardCounterWindow";
      defender.stateTimer = 30;
      this.applyHitStop(attacker, defender, blockStopFrames(active.spec));
      this.push("blocked", `${defender.side} blocked ${active.spec.name}`);
      return;
    }

    this.applyHit(attacker, defender, active.spec);
  }

  private applyHit(attacker: PlayerRuntime, defender: PlayerRuntime, spec: AttackSpec): void {
    if (defender.hp > 0) {
      defender.hp = Math.max(0, defender.hp - spec.damage);
    } else {
      this.purgeOrKill(defender);
    }

    if (defender.state !== "Dead") {
      if (spec.effect === "kneel") {
        defender.state = "KneelDown";
        defender.stateTimer = 30;
      } else if (spec.effect === "air" || spec.effect === "down") {
        defender.state = "AirDamaged";
        defender.stateTimer = 45;
        defender.velocity.y = activeLaunchVelocityY(spec);
        defender.velocity.x = attacker.facing * AIR_KNOCKBACK_SPEED;
      } else if (spec.effect === "stun") {
        defender.state = "Stunned";
        defender.stateTimer = STUN_FRAMES;
      } else if (defender.state === "KneelDown") {
        defender.state = "Down";
        defender.stateTimer = DOWN_FRAMES;
      } else {
        defender.state = "Hitstun";
        defender.stateTimer = 12;
      }
      const armor = defender.equipment.armor;
      if (armor) EQUIPMENT_REGISTRY[armor.equipmentId].behavior.afterHitReceived?.({ attack: spec, attacker, defender, groundY: GROUND_Y });
    }
    this.applyHitStop(attacker, defender, hitStopFrames(spec));
    this.push("hit", `${attacker.side} hit ${defender.side} with ${spec.name}`);
  }

  private applyHitStop(attacker: PlayerRuntime, defender: PlayerRuntime, frames: number): void {
    if (frames <= 0) return;
    attacker.hitStopRemainingFrames = Math.max(attacker.hitStopRemainingFrames, frames);
    defender.hitStopRemainingFrames = Math.max(defender.hitStopRemainingFrames, frames);
    this.extendFrameLocks(attacker, frames);
    this.extendFrameLocks(defender, frames);
  }

  private extendFrameLocks(player: PlayerRuntime, frames: number): void {
    if (player.invulnerableUntilFrame > this.frame) player.invulnerableUntilFrame += frames;
    if (player.guardUntilFrame > this.frame) player.guardUntilFrame += frames;
    if (Number.isFinite(player.comboContinueUntilFrame) && player.comboContinueUntilFrame > this.frame) {
      player.comboContinueUntilFrame += frames;
    }
  }

  purgeOrKill(player: PlayerRuntime): void {
    const slot = DROP_ORDER.find((candidate) => player.equipment[candidate]);
    if (!slot) {
      player.state = "Dead";
      this.push("dead", `${player.side} is dead`);
      return;
    }
    const item = player.equipment[slot];
    if (!item) return;
    player.equipment[slot] = null;
    player.equippedCount -= 1;
    this.fieldItems.push({
      id: item.id,
      item,
      position: { x: clamp(player.position.x + player.facing * -28, 40, STAGE_WIDTH - 40), y: GROUND_Y },
      droppedFrame: this.frame,
      lockOwnerUntilFrame: this.frame + OWNER_PICKUP_LOCK_FRAMES,
      lockOpponentUntilFrame: this.frame + OPPONENT_PICKUP_LOCK_FRAMES
    });
    this.push("purged", `${player.side} dropped ${slot}`);
  }

  private resolvePickup(player: PlayerRuntime): void {
    if (!["Idle", "Move", "Dash", "Guard", "GuardCounterWindow"].includes(player.state)) return;
    if (!player.latestInput.pickup || !this.justPressed(player, "pickup")) return;
    const candidates = this.fieldItems
      .map((item, index) => ({ item, index, distance: Math.abs(item.position.x - player.position.x) }))
      .filter(({ item, distance }) => distance <= PICKUP_RADIUS && this.canPickup(player, item))
      .sort((a, b) => this.pickupPriority(player, a.item) - this.pickupPriority(player, b.item) || a.distance - b.distance);
    const chosen = candidates[0];
    if (!chosen) return;
    const field = chosen.item;
    this.fieldItems.splice(chosen.index, 1);
    const slot = field.item.slot;
    const current = player.equipment[slot];
    const own = field.item.ownerPlayerId === player.playerId;
    if (current && current.id !== field.item.id) {
      player.equipment[slot] = field.item;
      this.fieldItems.push({
        id: current.id,
        item: current,
        position: { x: player.position.x, y: GROUND_Y },
        droppedFrame: this.frame,
        lockOwnerUntilFrame: this.frame + OWNER_PICKUP_LOCK_FRAMES,
        lockOpponentUntilFrame: this.frame + OPPONENT_PICKUP_LOCK_FRAMES
      });
      this.push("swap", `${player.side} swapped ${slot}`);
    } else {
      if (!current) player.equippedCount += 1;
      player.equipment[slot] = field.item;
      this.push("pickup", `${player.side} picked up ${own ? "own" : "opponent"} ${slot}`);
    }
  }

  private canPickup(player: PlayerRuntime, item: FieldItem): boolean {
    if (item.item.ownerPlayerId === player.playerId) return this.frame >= item.lockOwnerUntilFrame;
    return this.frame >= item.lockOpponentUntilFrame;
  }

  private pickupPriority(player: PlayerRuntime, item: FieldItem): number {
    const missing = !player.equipment[item.item.slot];
    const own = item.item.ownerPlayerId === player.playerId;
    if (missing && own) return 1;
    if (missing && !own) return 2;
    if (!missing && !own) return 3;
    if (!missing && own) return 4;
    return 5;
  }

  private trySkill(player: PlayerRuntime, opponent: PlayerRuntime, slot: EquipmentSlot, force: boolean): void {
    const item = player.equipment[slot];
    if (!item || item.cooldownRemainingMs > 0) return;
    const spec = attackForEquipment(item);
    if (!spec) return;
    const registration = EQUIPMENT_REGISTRY[item.equipmentId];
    const skill = spec;
    const canUse = force || ["Idle", "Move", "Dash", "Guard", "GuardCounterWindow"].includes(player.state);
    if (!canUse || skill.passive) return;
    registration.behavior.beforeSkill?.({ skill, player, opponent });
    this.startAttack(player, spec);
    item.cooldownRemainingMs = skill.cooldownMs;
  }

  private getComboAttack(player: PlayerRuntime): AttackSpec {
    if (this.frame > player.comboContinueUntilFrame) player.comboStep = 0;
    const weapon = player.equipment.weapon;
    const combo = weapon ? EQUIPMENT_REGISTRY[weapon.equipmentId].definition.combo : COMMON_BAREHAND_COMBO;
    if (!combo?.length) throw new Error(`Weapon ${weapon?.equipmentId} has no combo`);
    const next = player.comboStep % combo.length;
    player.comboStep = next + 1;
    return combo[next] ?? combo[0]!;
  }

  private startComboAttack(player: PlayerRuntime): void {
    if (player.activeAttack || player.state === "Dead") return;
    const spec = this.getComboAttack(player);
    if (this.startAttack(player, spec)) {
      player.comboContinueUntilFrame = this.frame + attackTotalFrames(spec) + COMBO_CONTINUE_WINDOW_FRAMES;
    }
  }

  private getHoldAttack(player: PlayerRuntime): AttackSpec | undefined {
    const weapon = player.equipment.weapon;
    if (!weapon) return undefined;
    const holdAttack = EQUIPMENT_REGISTRY[weapon.equipmentId].definition.holdAttack;
    if (!holdAttack) throw new Error(`Weapon ${weapon.equipmentId} has no hold attack`);
    return holdAttack;
  }

  private cooldownEquipment(player: PlayerRuntime): void {
    for (const item of Object.values(player.equipment)) {
      if (item) item.cooldownRemainingMs = Math.max(0, item.cooldownRemainingMs - TICK_MS);
    }
  }

  private updateDownAction(player: PlayerRuntime): void {
    const input = player.latestInput;
    const previous = player.previousInput;
    const leftPressed = input.left && !previous.left;
    const rightPressed = input.right && !previous.right;
    if (leftPressed || rightPressed) {
      const direction = rightPressed && !leftPressed ? 1 : leftPressed && !rightPressed ? -1 : player.facing;
      this.startWakeRoll(player, direction);
      return;
    }
    if (input.attack && !previous.attack) {
      this.startAttack(player, COMMON_WAKE_UP_ATTACK);
      return;
    }
    if (this.justPressedAnyGetUpInput(player) || player.stateTimer <= 0) {
      this.startGetUp(player);
    }
  }

  private startWakeRoll(player: PlayerRuntime, direction: MoveAxis): void {
    player.state = "WakeRoll";
    player.stateTimer = WAKE_ROLL_FRAMES;
    player.wakeRollDirection = direction;
    player.velocity.x = direction * WAKE_ROLL_SPEED;
    player.invulnerableUntilFrame = this.frame + WAKE_ROLL_FRAMES;
    player.attackName = direction === player.facing ? "Forward Roll" : "Back Roll";
    player.activeActionId = null;
    player.actionStartedFrame = null;
  }

  private startGetUp(player: PlayerRuntime): void {
    player.state = "GetUp";
    player.stateTimer = GET_UP_FRAMES;
    player.velocity.x = 0;
    player.wakeRollDirection = 0;
    player.invulnerableUntilFrame = this.frame + GET_UP_FRAMES;
    player.attackName = "Get Up";
    player.activeActionId = null;
    player.actionStartedFrame = null;
  }

  private justPressedAnyGetUpInput(player: PlayerRuntime): boolean {
    const input = player.latestInput;
    const previous = player.previousInput;
    return Boolean(
      (input.up && !previous.up) ||
      (input.down && !previous.down) ||
      (input.guard && !previous.guard) ||
      (input.pickup && !previous.pickup) ||
      Object.entries(input.skills).some(([slot, pressed]) => pressed && !previous.skills[slot as EquipmentSlot])
    );
  }

  private isBlocking(defender: PlayerRuntime, attacker: PlayerRuntime): boolean {
    if (defender.state !== "Guard" && defender.state !== "GuardCounterWindow") return false;
    const incomingFromRight = attacker.position.x > defender.position.x;
    return (incomingFromRight && defender.facing === 1) || (!incomingFromRight && defender.facing === -1);
  }

  private faceOpponents(p1: PlayerRuntime, p2: PlayerRuntime): void {
    if (this.canAutoFaceOpponent(p1)) p1.facing = p2.position.x >= p1.position.x ? 1 : -1;
    if (this.canAutoFaceOpponent(p2)) p2.facing = p1.position.x >= p2.position.x ? 1 : -1;
  }

  private canAutoFaceOpponent(player: PlayerRuntime): boolean {
    if (player.activeAttack || player.state === "Guard") return false;
    if (!["Idle", "Move", "Dash", "Jump", "GuardCounterWindow"].includes(player.state)) return false;
    return inputAxis(player.latestInput) === 0;
  }

  private updateDashDirection(player: PlayerRuntime, axis: MoveAxis, previousAxis: MoveAxis): MoveAxis {
    if (axis === 0) {
      player.dashDirection = 0;
      return 0;
    }

    if (axis !== previousAxis) {
      const lastTapFrame = axis === 1 ? player.lastRightTapFrame : player.lastLeftTapFrame;
      if (axis === 1) player.lastRightTapFrame = this.frame;
      else player.lastLeftTapFrame = this.frame;
      player.dashDirection = this.frame - lastTapFrame <= DASH_TAP_WINDOW_FRAMES ? axis : 0;
    }

    return player.dashDirection === axis ? axis : 0;
  }

  private checkFinish(): void {
    const p1 = this.players.get("p1");
    const p2 = this.players.get("p2");
    if (!p1 || !p2 || this.phase === "finished") return;
    if (p1.state === "Dead" && p2.state === "Dead") {
      this.finish({ winner: "draw", reason: "simultaneous_death", cpDelta: { p1: 0, p2: 0 } });
    } else if (p1.state === "Dead") {
      this.finish({ winner: "p2", reason: "death", cpDelta: { p1: -30, p2: 30 } });
    } else if (p2.state === "Dead") {
      this.finish({ winner: "p1", reason: "death", cpDelta: { p1: 30, p2: -30 } });
    } else if (this.timeRemainingMs <= 0) {
      this.finish(this.timeoutResult(p1, p2));
    }
  }

  private timeoutResult(p1: PlayerRuntime, p2: PlayerRuntime): MatchResult {
    if (p1.hp !== p2.hp) {
      const winner = p1.hp > p2.hp ? "p1" : "p2";
      return { winner, reason: "timeout_hp", cpDelta: { p1: winner === "p1" ? 30 : -30, p2: winner === "p2" ? 30 : -30 } };
    }
    if (p1.equippedCount !== p2.equippedCount) {
      const winner = p1.equippedCount > p2.equippedCount ? "p1" : "p2";
      return { winner, reason: "timeout_equipment", cpDelta: { p1: winner === "p1" ? 30 : -30, p2: winner === "p2" ? 30 : -30 } };
    }
    return { winner: "draw", reason: "timeout_draw", cpDelta: { p1: 0, p2: 0 } };
  }

  private finish(result: MatchResult): void {
    this.phase = "finished";
    this.result = result;
    this.push("result", `Result: ${result.winner} by ${result.reason}`);
  }

  private publicPlayer(player: PlayerRuntime): PlayerSnapshot {
    return {
      side: player.side,
      playerId: player.playerId,
      characterId: player.characterId,
      cp: player.cp,
      hp: player.hp,
      position: { ...player.position },
      velocity: { ...player.velocity },
      facing: player.facing,
      state: player.state,
      stateTimer: player.stateTimer,
      equipment: {
        cloak: player.equipment.cloak ? { ...player.equipment.cloak } : null,
        head: player.equipment.head ? { ...player.equipment.head } : null,
        armor: player.equipment.armor ? { ...player.equipment.armor } : null,
        weapon: player.equipment.weapon ? { ...player.equipment.weapon } : null
      },
      equippedCount: player.equippedCount,
      comboStep: player.comboStep,
      attackName: player.attackName,
      activeActionId: player.activeActionId,
      actionStartedFrame: player.actionStartedFrame,
      actionElapsedFrames: player.activeAttack ? player.attackTimer : null,
      hitStopRemainingFrames: player.hitStopRemainingFrames,
      guardUntilFrame: player.guardUntilFrame
    };
  }

  private justPressed(player: PlayerRuntime, key: keyof Pick<InputState, "pickup">): boolean {
    return Boolean(player.latestInput[key]) && !player.previousInput[key];
  }

  private push(kind: MatchEvent["kind"], message: string): void {
    this.events.push({ type: "server.event", frame: this.frame, kind, message });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function collisionHalfWidth(characterId: CharacterId): number {
  return CHARACTER_REGISTRY[characterId].definition.collision.halfWidth * BATTLE_COLLISION_SCALE;
}

function attackRange(spec: AttackSpec): number {
  return spec.range * BATTLE_COLLISION_SCALE;
}

function activeLaunchVelocityY(spec: AttackSpec): number {
  return spec.launchVelocityY ?? -15;
}

function attackTotalFrames(spec: AttackSpec): number {
  return spec.startupFrames + spec.activeFrames + spec.recoveryFrames;
}

function hitStopFrames(spec: AttackSpec): number {
  if (spec.hitStopFrames != null) return spec.hitStopFrames;
  if (spec.damage <= 0) return 0;
  if ((spec.hitCount ?? 1) > 1) return MULTI_HIT_STOP_FRAMES;
  return ["kneel", "air", "down", "stun"].includes(spec.effect) ? HEAVY_HIT_STOP_FRAMES : DEFAULT_HIT_STOP_FRAMES;
}

function blockStopFrames(spec: AttackSpec): number {
  if (spec.blockStopFrames != null) return spec.blockStopFrames;
  return DEFAULT_BLOCK_STOP_FRAMES;
}

function inputAxis(input: InputState): MoveAxis {
  return (Number(input.right) - Number(input.left)) as MoveAxis;
}
