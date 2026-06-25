import { behavior } from "./behavior.ts";
import { definition } from "./definition.ts";
import { motionController, vrmaMotions } from "./motions.ts";
import { visual } from "./visual.ts";
import { EQUIPMENT_ID } from "./id.ts";
import type { EquipmentRegistration } from "../../../shared/character-types.ts";

export const registration = { definition, behavior, visual, motionController, vrmaMotions } satisfies EquipmentRegistration<typeof EQUIPMENT_ID>;
