import { behavior } from "./behavior.ts";
import { definition } from "./definition.ts";
import { motionController } from "./motions.js";
import { visual } from "./visual.js";
import type { EquipmentRegistration } from "../../../shared/character-types.ts";

export const registration = { definition, behavior, visual, motionController } satisfies EquipmentRegistration<"syal_cloak">;
