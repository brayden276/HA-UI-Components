import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { readBundleInputs } from "./bundle-composition.mjs";
import { publicComponents, publicComponentCount } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { manifest, modules } = await readBundleInputs(root);
const componentDirectory = resolve(root, "src/components");
const componentFiles = (await readdir(componentDirectory)).filter((file) => file.endsWith(".js")).sort();
const expectedFiles = publicComponents.map(([file]) => file.replace("src/components/", "")).sort();

if (JSON.stringify(componentFiles) !== JSON.stringify(expectedFiles)) {
  const missing = expectedFiles.filter((file) => !componentFiles.includes(file));
  const extra = componentFiles.filter((file) => !expectedFiles.includes(file));
  throw new Error(`Public component inventory mismatch; missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`);
}

const componentEntries = manifest.filter((entry) => entry.file.startsWith("src/components/"));
if (componentEntries.length !== publicComponentCount) throw new Error(`Expected ${publicComponentCount} component modules, found ${componentEntries.length}`);
const expected = new Set(publicComponents.map(([file]) => file));
for (const entry of componentEntries) if (!expected.has(entry.file)) throw new Error(`Component is missing from the independent public compatibility oracle: ${entry.file}`);
for (const file of expected) if (!componentEntries.some((entry) => entry.file === file)) throw new Error(`Public compatibility oracle file is missing from bundle manifest: ${file}`);

const sources = new Map();
for (const { file, source } of modules) {
  new vm.Script(source, { filename: file });
  sources.set(file, source);
}
for (const [file, type, element] of publicComponents) {
  const source = sources.get(file);
  const escapedType = type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const registration = new RegExp(`(?:registerCard\\(\\{[\\s\\S]*?type:\\s*["']${escapedType}["'][\\s\\S]*?element:\\s*${element}|customElements\\.define\\(\\s*["']${escapedType}["']\\s*,\\s*${element}\\s*\\))`);
  if (!registration.test(source)) throw new Error(`Independent public registration changed for ${type}`);
}

const firstComponent = manifest.findIndex((entry) => entry.file.startsWith("src/components/"));
const lastShared = manifest.findLastIndex((entry) => entry.file.startsWith("src/shared/"));
if (manifest.some((entry) => entry.file.startsWith("src/patches/"))) {
  throw new Error("The retired patch layer must not be reintroduced; move behaviour to its component or shared runtime");
}
if (lastShared >= firstComponent) throw new Error("Bundle dependency order is invalid");
console.log(`Source inventory check passed: ${publicComponentCount} public components, ${manifest.length} parseable source modules`);
