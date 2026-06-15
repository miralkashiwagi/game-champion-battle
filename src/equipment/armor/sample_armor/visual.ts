import { createFallbackEquipment } from "../../fallback-visual.ts";
import type { EquipmentAttachment, EquipmentModelVisual, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const MODEL_URL = "/equipment/armor/sample_armor/model.glb";
const attachedModel = { url: MODEL_URL, position: [0, 0, -.15] } satisfies EquipmentModelVisual;
const fieldModel = { url: MODEL_URL, position: [0, -.04, .04] } satisfies EquipmentModelVisual;

export const visual = {
  createAttachments(context) {
    const attachments = [{
      socket: "chestArmor",
      object: createFallbackEquipment("armor", context),
      model: attachedModel,
      position: [0, 0, .02]
    }] satisfies EquipmentAttachment[];
    return { attachments, motions: { drop: "item_drop", pickup: "item_pickup" } };
  },
  createFieldItem(context) {
    return createFallbackEquipment("armor", context);
  },
  fieldModel
} satisfies EquipmentVisualFactory;
