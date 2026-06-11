import { saladin } from "./saladin/index.ts";
import { silverKnight } from "./silver_knight/index.ts";

export const CHARACTER_REGISTRY = {
  silver_knight: silverKnight,
  saladin
} as const;

export type RegisteredCharacterId = keyof typeof CHARACTER_REGISTRY;
export const CHARACTER_IDS = Object.keys(CHARACTER_REGISTRY) as RegisteredCharacterId[];
export const DEFAULT_CHARACTER_ID: RegisteredCharacterId = "silver_knight";
export const CHARACTER_LIST = CHARACTER_IDS.map((id) => CHARACTER_REGISTRY[id]);

export function isCharacterId(value: string | null | undefined): value is RegisteredCharacterId {
  return Boolean(value && value in CHARACTER_REGISTRY);
}

export function normalizeCharacterId(value: string | null | undefined): RegisteredCharacterId {
  return isCharacterId(value) ? value : DEFAULT_CHARACTER_ID;
}
