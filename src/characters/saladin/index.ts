import { behavior } from "./behavior.ts";
import { definition } from "./definition.ts";
import { visual } from "./visual.ts";
import type { CharacterRegistration } from "../../shared/character-types.ts";

export const saladin = { definition, behavior, visual } satisfies CharacterRegistration<"saladin">;
