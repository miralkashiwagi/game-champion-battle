import { COMMON_BAREHAND_COMBO, COMMON_GUARD_COUNTER } from "../characters/common.ts";
import { EQUIPMENT_REGISTRY } from "../equipment/registry.ts";

const M = "/assets/motions";
const fallbackDeathReason = "No dedicated death VRMA exists in the current repository; using knockdown as the visible fallback.";

function clip(url, { loop = false, fadeIn = .12, fadeOut = .12, rootMotion = "inPlace", interruptibleAfter, fallbackReason, playbackRate } = {}) {
  return { url, loop, fadeIn, fadeOut, layer: "base", rootMotion, interruptibleAfter, fallbackReason, playbackRate };
}

export const VRMA_ASSET_URLS = Object.freeze([
  `${M}/air/jump-end.vrma`,
  `${M}/air/jump-loop.vrma`,
  `${M}/air/jump-start.vrma`,
  `${M}/combat/block.vrma`,
  `${M}/combat/headbutt.vrma`,
  `${M}/combat/punch-01.vrma`,
  `${M}/combat/punch-02.vrma`,
  `${M}/combat/punch-03.vrma`,
  `${M}/combat/slash-to-left.vrma`,
  `${M}/combat/slash-to-right.vrma`,
  `${M}/combat/slash-up.vrma`,
  `${M}/common/idle.vrma`,
  `${M}/common/run.vrma`,
  `${M}/common/turn.vrma`,
  `${M}/common/walk.vrma`,
  `${M}/reaction/crumple-stun.vrma`,
  `${M}/reaction/get-up.vrma`,
  `${M}/reaction/hit.vrma`,
  `${M}/reaction/knockdown.vrma`
]);

const stateClips = {
  idle: clip(`${M}/common/idle.vrma`, { loop: true, fadeIn: .2, fadeOut: .2 }),
  move: clip(`${M}/common/walk.vrma`, { loop: true, fadeIn: .16, fadeOut: .14 }),
  walkForward: clip(`${M}/common/walk.vrma`, { loop: true, fadeIn: .16, fadeOut: .14 }),
  dash: clip(`${M}/common/run.vrma`, { loop: true, fadeIn: .12, fadeOut: .12 }),
  runForward: clip(`${M}/common/run.vrma`, { loop: true, fadeIn: .12, fadeOut: .12 }),
  turnLeft: clip(`${M}/common/turn.vrma`, { interruptibleAfter: .28 }),
  turnRight: clip(`${M}/common/turn.vrma`, { interruptibleAfter: .28 }),
  jumpStart: clip(`${M}/air/jump-start.vrma`, { rootMotion: "gameplay", interruptibleAfter: .14 }),
  jumpLoop: clip(`${M}/air/jump-loop.vrma`, { loop: true, rootMotion: "gameplay" }),
  jumpLand: clip(`${M}/air/jump-end.vrma`, { rootMotion: "gameplay", interruptibleAfter: .2 }),
  guard: clip(`${M}/combat/block.vrma`, { loop: true, fadeIn: .08, fadeOut: .12 }),
  hit: clip(`${M}/reaction/hit.vrma`, { interruptibleAfter: .28 }),
  kneel: clip(`${M}/reaction/crumple-stun.vrma`, { fadeIn: .06, interruptibleAfter: .55, playbackRate: 2 }),
  air: clip(`${M}/reaction/hit.vrma`, { interruptibleAfter: .28, fallbackReason: "No dedicated air-damaged VRMA exists; using hit reaction." }),
  stunned: clip(`${M}/reaction/crumple-stun.vrma`, { loop: true, fadeIn: .08, fadeOut: .16 }),
  down: clip(`${M}/reaction/knockdown.vrma`, { interruptibleAfter: .68, playbackRate: 4 }),
  dead: clip(`${M}/reaction/knockdown.vrma`, { fadeOut: .3, playbackRate: 4, fallbackReason: fallbackDeathReason }),
  getUp: clip(`${M}/reaction/get-up.vrma`, { interruptibleAfter: .45 })
};

const motionIdClips = {
  barehand_1: clip(`${M}/combat/punch-01.vrma`, { interruptibleAfter: .38, playbackRate: 1.35 }),
  barehand_2: clip(`${M}/combat/punch-02.vrma`, { interruptibleAfter: .38, playbackRate: 1.3 }),
  barehand_3: clip(`${M}/combat/punch-03.vrma`, { interruptibleAfter: .42, playbackRate: 1.3 }),
  common_guard_counter: clip(`${M}/combat/block.vrma`, { interruptibleAfter: .35 })
};

const equipmentMotionClips = Object.freeze(Object.assign(
  {},
  ...Object.values(EQUIPMENT_REGISTRY).map((registration) => registration.vrmaMotions || {})
));

export const VRMA_MOTION_SET = Object.freeze({
  modelType: "vrm1",
  defaultState: "idle",
  clips: Object.freeze({ ...stateClips, ...motionIdClips, ...equipmentMotionClips }),
  transitions: Object.freeze({
    idle: { move: .16, dash: .12, guard: .08 },
    move: { idle: .18, dash: .1 },
    dash: { move: .12, idle: .16 },
    guard: { idle: .14, move: .14 }
  }),
  additiveProcedural: Object.freeze({ lookAt: true, blink: true, breathing: false, footLock: false, weaponSocket: "rightHand" })
});

export function getVrmaMotionSet() {
  return VRMA_MOTION_SET;
}

export function getRegisteredVrmaMotionIds() {
  return [...Object.keys(motionIdClips), ...Object.keys(equipmentMotionClips)];
}

export function collectGameplayMotionIds() {
  const ids = new Set([...COMMON_BAREHAND_COMBO.map((attack) => attack.motionId), COMMON_GUARD_COUNTER.motionId]);
  for (const registration of Object.values(EQUIPMENT_REGISTRY)) {
    const definition = registration.definition;
    for (const attack of [...(definition.combo || []), ...(definition.holdAttack ? [definition.holdAttack] : []), definition.skill]) {
      ids.add(attack.motionId);
    }
  }
  return [...ids].sort();
}

export function findMissingVrmaMotionIds() {
  const registered = new Set(getRegisteredVrmaMotionIds());
  return collectGameplayMotionIds().filter((motionId) => !registered.has(motionId));
}
