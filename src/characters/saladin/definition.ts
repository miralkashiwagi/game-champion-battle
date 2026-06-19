import type { CharacterDefinition } from "../../shared/character-types.ts";

export const definition = {
  id: "saladin",
  collision: { halfWidth: 39, height: 102 },
  visualProfile: { renderer: "vrm", url: "/characters/saladin/saladin.vrm", scale: 1, groundOffset: 0, fallback: "shared-script" },
  ui: { name: "Saladin", type: "近距離・攻撃型", detail: "機動力と連続攻撃に優れ、素早い切り返しを得意とする戦士。", normal: "双剣による4連撃。前進しながら間合いを詰める。", badge: "SA", accentColor: "#c84840" },
  initialEquipment: { cloak: "saladin_cloak", head: "saladin_headgear", armor: "saladin_armor", weapon: "saladin_twin_blades" }
} satisfies CharacterDefinition<"saladin">;
