import { behavior } from "./behavior.ts";
import { definition } from "./definition.ts";
import { visual } from "./visual.js";
import type { CharacterRegistration } from "../../shared/character-types.ts";

export const silverKnight = { definition, behavior, visual } satisfies CharacterRegistration<"silver_knight">;
