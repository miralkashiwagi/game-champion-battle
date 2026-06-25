import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EQUIPMENT_ROOT = join(ROOT, "src", "equipment");
const REGISTRY_PATH = join(EQUIPMENT_ROOT, "registry.ts");
const SLOT_ORDER = ["cloak", "head", "armor", "weapon"];

const entries = [];

for (const slot of SLOT_ORDER) {
  const slotDir = join(EQUIPMENT_ROOT, slot);
  if (!existsSync(slotDir)) continue;
  const equipmentDirs = await readdir(slotDir, { withFileTypes: true });
  for (const dirent of equipmentDirs.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = join(slotDir, dirent.name);
    const idPath = join(dir, "id.ts");
    const indexPath = join(dir, "index.ts");
    if (!existsSync(idPath) || !existsSync(indexPath)) continue;
    const idSource = await readFile(idPath, "utf8");
    const match = idSource.match(/EQUIPMENT_ID\s*=\s*"([^"]+)"/);
    if (!match) throw new Error(`Unable to read EQUIPMENT_ID from ${relative(ROOT, idPath)}`);
    entries.push({
      id: match[1],
      importName: toIdentifier(match[1]),
      importPath: `./${slot}/${dirent.name}/index.ts`
    });
  }
}

const imports = entries
  .map((entry) => `import { registration as ${entry.importName} } from "${entry.importPath}";`)
  .join("\n");
const registrations = entries
  .map((entry) => `  ${entry.id}: ${entry.importName}`)
  .join(",\n");

const source = `${imports}
import type { EquipmentRegistration } from "../shared/character-types.ts";

const registrations = {
${registrations}
} as const;

export type RegisteredEquipmentId = keyof typeof registrations;
export const EQUIPMENT_REGISTRY: Record<RegisteredEquipmentId, EquipmentRegistration> = registrations;
export const EQUIPMENT_IDS = Object.keys(EQUIPMENT_REGISTRY) as RegisteredEquipmentId[];
export const EQUIPMENT_LIST = EQUIPMENT_IDS.map((id) => EQUIPMENT_REGISTRY[id]);

export function getEquipmentRegistration(id: RegisteredEquipmentId): EquipmentRegistration {
  const registration = EQUIPMENT_REGISTRY[id];
  if (!registration) throw new Error(\`Unknown equipmentId: \${id}\`);
  return registration;
}
`;

await writeFile(REGISTRY_PATH, source, "utf8");

function toIdentifier(id) {
  return id.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}
