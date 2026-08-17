import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"),
);

let output = `/**
 * HA Component Library v1.0.0
 * Generated HACS Dashboard bundle.
 *
 * Source is organised by component under src/components. Shared logic lives
 * under src/shared. Existing component CSS and runtime behaviour are preserved.
 */

`;

for (const entry of manifest) {
  const source = await readFile(resolve(root, entry.file), "utf8");
  output += `// Module: ${entry.file}\n{\n${source.trimEnd()}\n}\n\n`;
}

output +=
  'globalThis.__HA_COMPONENT_LIBRARY__ = Object.freeze({ version: "1.0.0", components: 35 });\n';

const destination = resolve(root, "dist/ha-component-library.js");
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, output, "utf8");
console.log(`Wrote ${destination}`);
