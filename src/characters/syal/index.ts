import { behavior } from "./behavior.ts";
import { definition } from "./definition.ts";
import { visual } from "./visual.js";
import type { CharacterRegistration } from "../../shared/character-types.ts";

export const syal = { definition, behavior, visual } satisfies CharacterRegistration<"syal">;
