import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { composeBundleFromSource } from "./bundle-composition.mjs";
import { createComponentHarness } from "./fixtures/component-harness.mjs";
import {
  publicComponents,
  publicComponentContracts,
  supportedComponentCategories,
  requiredSpecialisedComponentTypes,
} from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const specificationsRoot = resolve(root, "scripts/component-specs");
const publicByType = new Map(publicComponents.map(([file, type, element]) => [type, { file, element }]));
const allowedProfiles = new Set(supportedComponentCategories);

const files = (await readdir(specificationsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".spec.mjs"))
  .map((entry) => entry.name)
  .sort();
const specifications = [];
for (const file of files) {
  const imported = await import(pathToFileURL(resolve(specificationsRoot, file)).href);
  const specification = imported.default;
  if (!specification || typeof specification !== "object") throw new Error(`Invalid component specification export: ${file}`);
  if (typeof specification.component !== "string" || typeof specification.profile !== "string" || typeof specification.run !== "function") {
    throw new Error(`Component specification requires component, profile and run(): ${file}`);
  }
  if (!publicByType.has(specification.component)) throw new Error(`Orphan or unknown component specification: ${file} -> ${specification.component}`);
  if (!allowedProfiles.has(specification.profile)) throw new Error(`Invalid contract profile in ${file}: ${specification.profile}`);
  const expectedProfile = publicComponentContracts[publicByType.get(specification.component).file]?.category;
  if (specification.profile !== expectedProfile) throw new Error(`Component specification profile drift: ${file} is ${specification.profile}, public contract is ${expectedProfile}`);
  specifications.push({ file, ...specification });
}
const duplicates = specifications.filter((specification, index) => specifications.some((other, otherIndex) => otherIndex < index && other.component === specification.component));
if (duplicates.length) throw new Error(`Duplicate component specification coverage: ${duplicates.map((specification) => specification.component).join(", ")}`);

const harness = createComponentHarness({ capabilities: ["document-events", "global-events"] });
await harness.loadSource(await composeBundleFromSource(root), "in-memory-ha-component-library.js");
for (const [file, type, element] of publicComponents) {
  const Card = harness.definitions.get(type);
  assert.equal(Card?.name, element, `${type} must retain its independently authored public constructor`);
  const picker = harness.context.customCards.filter((card) => card.type === type);
  assert.equal(picker.length, 1, `${type} must have exactly one public picker registration`);
  assert.equal(typeof Card.getConfigElement, "function", `${type} must expose a config editor contract`);
  assert.equal(typeof Card.getStubConfig, "function", `${type} must expose a configuration stub contract`);
  const card = new Card();
  assert.ok(card.shadowRoot, `${type} must create an open Shadow DOM surface`);
  if (typeof Card.getGridOptions === "function") {
    const grid = Card.getGridOptions();
    assert.equal(typeof grid, "object", `${type} grid metadata must be an object`);
  }
  const contract = publicComponentContracts[file];
  if (!contract) throw new Error(`Missing generic component contract: ${file}`);
  if (requiredSpecialisedComponentTypes.includes(type) && !specifications.some((specification) => specification.component === type)) throw new Error(`Missing required specialised component specification: ${type}`);
}

for (const specification of specifications) await specification.run();
console.log(`Component contracts passed: ${publicComponents.length} generic public contracts, ${specifications.length} automatically discovered specialised specifications`);
