import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const manifest = JSON.parse(
  await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"),
);
const version = packageJson.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`package.json version must be major.minor.patch, received ${version}`);
}
const publicComponentCount = manifest.filter((entry) =>
  entry.file.startsWith("src/components/"),
).length;

let output = `/**
 * HA Component Library v${version}
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
  `globalThis.__HA_COMPONENT_LIBRARY__ = Object.freeze({ version: ${JSON.stringify(version)}, components: ${publicComponentCount} });\n`;

const destination = resolve(root, "dist/ha-component-library.js");
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, output, "utf8");
console.log(`Wrote ${destination}`);
