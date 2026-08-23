import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { publicComponents, publicComponentCount } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await readFile(resolve(root, "dist/ha-component-library.js"), "utf8");
const manifest = JSON.parse(await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"));

const componentEntries = manifest.filter((entry) => entry.file.startsWith("src/components/"));
if (componentEntries.length !== publicComponentCount) {
  throw new Error(`Expected ${publicComponentCount} component modules, found ${componentEntries.length}`);
}

const expectedFiles = new Set(publicComponents.map(([file]) => file));
for (const entry of componentEntries) {
  if (!expectedFiles.has(entry.file)) throw new Error(`Component is missing from public inventory: ${entry.file}`);
}
for (const file of expectedFiles) {
  if (!componentEntries.some((entry) => entry.file === file)) throw new Error(`Public inventory file is missing from bundle manifest: ${file}`);
}

const normalisedBundle = bundle.replace(/\r\n/g, "\n");
const registrations = new Map();
for (const entry of manifest) {
  const source = await readFile(resolve(root, entry.file), "utf8");
  new vm.Script(source, { filename: entry.file });
  const normalisedSource = source.replace(/\r\n/g, "\n").trimEnd();
  if (!normalisedBundle.includes(normalisedSource)) throw new Error(`Bundle does not contain module source: ${entry.file}`);

  for (const match of source.matchAll(/registerCard\(\{\s*type:\s*["']([^"']+)["'][\s\S]*?element:\s*([A-Za-z0-9_$]+)/g)) {
    registrations.set(match[1], [...(registrations.get(match[1]) ?? []), { element: match[2], file: entry.file }]);
  }
  for (const match of source.matchAll(/if\(!customElements\.get\('([^']+)'\)\)customElements\.define\('\1',([A-Za-z0-9_$]+)\);window\.customCards=/g)) {
    registrations.set(match[1], [...(registrations.get(match[1]) ?? []), { element: match[2], file: entry.file }]);
  }
}

for (const [file, type, element] of publicComponents) {
  const matches = registrations.get(type) ?? [];
  if (matches.length !== 1) throw new Error(`Expected one registration for ${type}; found ${matches.length}`);
  if (matches[0].element !== element) throw new Error(`Expected ${type} to use ${element}; found ${matches[0].element}`);
  if (matches[0].file !== file) throw new Error(`Expected ${type} registration in ${file}; found ${matches[0].file}`);
}

const firstComponent = manifest.findIndex((entry) => entry.file.startsWith("src/components/"));
const lastShared = manifest.findLastIndex((entry) => entry.file.startsWith("src/shared/"));
const firstPatch = manifest.findIndex((entry) => entry.file.startsWith("src/patches/"));
if (lastShared >= firstComponent || firstPatch <= firstComponent) throw new Error("Bundle dependency order is invalid");
if (!bundle.includes(`components: ${publicComponentCount}`)) throw new Error(`Bundle metadata does not declare all ${publicComponentCount} components`);

console.log(`Inventory check passed: ${publicComponentCount} components`);
console.log(`Module syntax and bundle-presence check passed: ${manifest.length} modules`);
