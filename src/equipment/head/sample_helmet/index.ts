import { behavior } from "./behavior.ts";
import { definition } from "./definition.ts";
import { motionController, vrmaMotions } from "./motions.ts";
import { visual } from "./visual.ts";
import type { EquipmentRegistration } from "../../../shared/character-types.ts";

export const registration = { definition, behavior, visual, motionController, vrmaMotions } satisfies EquipmentRegistration<"sample_helmet">;
