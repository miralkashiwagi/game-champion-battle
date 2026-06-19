import type { VrmaMotionClipDefinition } from "../shared/character-types.ts";

const M = "/assets/motions";
const ACTION_FRAME_RATE = 60;

export const EQUIPMENT_VRMA_DURATION_BY_URL = {
  [`${M}/combat/slash-to-left.vrma`]: 0.833333313465118,
  [`${M}/combat/slash-to-right.vrma`]: 0.666666686534882,
  [`${M}/combat/slash-up.vrma`]: 0.75
} as const;

type EquipmentVrmaClipOptions = Partial<Omit<VrmaMotionClipDefinition, "url" | "layer">> & {
  actionFrames?: number;
};

export const VRMA_FALLBACK_REASONS = {
  slash: "No dedicated VRMA exists in the current repository; using the closest existing slash clip.",
  thrust: "No dedicated thrust or forward charge VRMA exists in the current repository; using an existing slash clip until a replacement is added.",
  kick: "No dedicated kick VRMA exists; using slash-up as a visible fallback.",
  guard: "No dedicated guard skill VRMA exists; using block.",
  head: "No dedicated head equipment VRMA exists; using headbutt as a temporary fallback.",
  passive: "Passive skill has no dedicated VRMA; using block."
} as const;

export function vrmaClip(
  url: string,
  options: EquipmentVrmaClipOptions = {}
): VrmaMotionClipDefinition {
  const result: VrmaMotionClipDefinition = {
    url,
    loop: options.loop ?? false,
    fadeIn: options.fadeIn ?? .12,
    fadeOut: options.fadeOut ?? .12,
    layer: "base",
    rootMotion: options.rootMotion ?? "inPlace"
  };
  if (options.interruptibleAfter !== undefined) result.interruptibleAfter = options.interruptibleAfter;
  if (options.fallbackReason !== undefined) result.fallbackReason = options.fallbackReason;
  if (options.lockInput !== undefined) result.lockInput = options.lockInput;
  if (options.lockFacing !== undefined) result.lockFacing = options.lockFacing;
  if (options.speedScaleByVelocity !== undefined) result.speedScaleByVelocity = options.speedScaleByVelocity;
  if (options.playbackRate !== undefined) result.playbackRate = options.playbackRate;
  if (options.alignEndWithAction !== undefined) result.alignEndWithAction = options.alignEndWithAction;
  if (options.actionDurationSeconds !== undefined) result.actionDurationSeconds = options.actionDurationSeconds;
  if (options.hitFrames !== undefined) result.hitFrames = options.hitFrames;
  if (options.weight !== undefined) result.weight = options.weight;
  if (options.fallbackFor !== undefined) result.fallbackFor = options.fallbackFor;
  return result;
}

function actionTimedOptions(
  url: keyof typeof EQUIPMENT_VRMA_DURATION_BY_URL,
  options: EquipmentVrmaClipOptions
): EquipmentVrmaClipOptions {
  if (options.actionFrames === undefined) return options;
  const actionDurationSeconds = options.actionFrames / ACTION_FRAME_RATE;
  const clipDuration = EQUIPMENT_VRMA_DURATION_BY_URL[url];
  const fitRate = clipDuration / actionDurationSeconds;
  const playbackRate = options.playbackRate ?? roundToStep(Math.min(1.4, Math.max(1, 1 + (fitRate - 1) * .35)), .05);
  return {
    ...options,
    alignEndWithAction: options.alignEndWithAction ?? true,
    actionDurationSeconds: options.actionDurationSeconds ?? actionDurationSeconds,
    playbackRate
  };
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export const EQUIPMENT_VRMA_CLIPS = {
  block: (options = {}) => vrmaClip(`${M}/combat/block.vrma`, options),
  headbutt: (options = {}) => vrmaClip(`${M}/combat/headbutt.vrma`, options),
  slashToLeft: (options = {}) => vrmaClip(`${M}/combat/slash-to-left.vrma`, actionTimedOptions(`${M}/combat/slash-to-left.vrma`, options)),
  slashToRight: (options = {}) => vrmaClip(`${M}/combat/slash-to-right.vrma`, actionTimedOptions(`${M}/combat/slash-to-right.vrma`, options)),
  slashUp: (options = {}) => vrmaClip(`${M}/combat/slash-up.vrma`, actionTimedOptions(`${M}/combat/slash-up.vrma`, options))
} as const;
