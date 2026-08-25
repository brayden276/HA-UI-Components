import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeBundleFromSource } from "./bundle-composition.mjs";
import { createComponentHarness } from "./fixtures/component-harness.mjs";
import { publicComponentTypes } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const harness = createComponentHarness({ capabilities: ["document-events", "global-events"] });
await harness.loadSource(await composeBundleFromSource(root), "in-memory-ha-component-library.js");

const missingElements = publicComponentTypes.filter((type) => !harness.definitions.has(type));
if (missingElements.length) throw new Error(`Missing loaded elements: ${missingElements.join(", ")}`);
const pickerTypes = new Set(harness.context.customCards.map((card) => card.type));
const missingPickerEntries = publicComponentTypes.filter((type) => !pickerTypes.has(type));
if (missingPickerEntries.length) throw new Error(`Missing card-picker entries: ${missingPickerEntries.join(", ")}`);
const missingConfigContracts = publicComponentTypes.filter((type) => {
  const element = harness.definitions.get(type);
  return typeof element?.getConfigElement !== "function" || typeof element?.getStubConfig !== "function";
});
if (missingConfigContracts.length) throw new Error(`Missing config editor/stub contracts: ${missingConfigContracts.join(", ")}`);
if (harness.context.__HA_COMPONENT_LIBRARY__?.components !== publicComponentTypes.length) throw new Error("In-memory bundle metadata was not initialised");
console.log(`In-memory load-order/editor check passed: ${publicComponentTypes.length} public components`);
