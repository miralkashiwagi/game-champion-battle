import type { VrmaMotionClipDefinition } from "../shared/character-types.ts";

const M = "/assets/motions";

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
  if (options.hitFrames !== undefined) result.hitFrames = options.hitFrames;
  if (options.weight !== undefined) result.weight = options.weight;
  if (options.fallbackFor !== undefined) result.fallbackFor = options.fallbackFor;
  return result;
}

export const EQUIPMENT_VRMA_CLIPS = {
  block: (options = {}) => vrmaClip(`${M}/combat/block.vrma`, options),
  headbutt: (options = {}) => vrmaClip(`${M}/combat/headbutt.vrma`, options),
  slashToLeft: (options = {}) => vrmaClip(`${M}/combat/slash-to-left.vrma`, options),
  slashToRight: (options = {}) => vrmaClip(`${M}/combat/slash-to-right.vrma`, options),
  slashUp: (options = {}) => vrmaClip(`${M}/combat/slash-up.vrma`, options)
} as const;
