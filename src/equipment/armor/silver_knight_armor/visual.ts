import { createFallbackEquipment } from "../../fallback-visual.ts";
import { EQUIPMENT_ID } from "./id.ts";
import type { EquipmentAttachment, EquipmentModelVisual, EquipmentVisualFactory } from "../../../shared/character-types.ts";

const MODEL_URL = `/equipment/armor/${EQUIPMENT_ID}/model.glb`;
const zUpToYUp = [-Math.PI / 2, 0, 0] as [number, number, number];

//positionの2番目：上下、3番目：前後
const attachedModel = {
  url: MODEL_URL,
  position: [0, -.32, -.13],
  rotation: zUpToYUp,
  scale: .016
} satisfies EquipmentModelVisual;
const fieldModel = {
  url: MODEL_URL,
  position: [0, -.5, .04],
  rotation: zUpToYUp,
  scale: .016
} satisfies EquipmentModelVisual;

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
