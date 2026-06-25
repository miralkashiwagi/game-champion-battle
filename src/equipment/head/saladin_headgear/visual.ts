import { createFallbackEquipment } from "../../fallback-visual.ts";
import type { EquipmentAttachment, EquipmentModelVisual, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const MODEL_URL = "/equipment/head/saladin_headgear/model.glb";
const attachedModel = { url: MODEL_URL, position: [0, -.18, 0], scale: 4 } satisfies EquipmentModelVisual;
const fieldModel = { url: MODEL_URL, position: [0, -.18, 0], scale: 4 } satisfies EquipmentModelVisual;

export const visual = {
  createAttachments(context) {
    const attachments = [{
      socket: "headAccessory",
      object: createFallbackEquipment("head", context),
      model: attachedModel,
      position: [0, -.04, .015]
    }] satisfies EquipmentAttachment[];
    return { attachments, motions: { drop: "item_drop", pickup: "item_pickup" } };
  },
  createFieldItem(context) {
    return createFallbackEquipment("head", context);
  },
  fieldModel
} satisfies EquipmentVisualFactory;
