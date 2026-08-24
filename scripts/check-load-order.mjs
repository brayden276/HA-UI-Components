import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { publicComponentTypes } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await readFile(resolve(root, "dist/ha-component-library.js"), "utf8");

const definitions = new Map();
const waiters = new Map();
const customElements = {
  define(name, element) {
    if (definitions.has(name)) throw new Error("Duplicate custom element: " + name);
    definitions.set(name, element);
    for (const resolveWaiter of waiters.get(name) ?? []) resolveWaiter();
    waiters.delete(name);
  },
  get(name) { return definitions.get(name); },
  whenDefined(name) {
    if (definitions.has(name)) return Promise.resolve();
    return new Promise((resolveWaiter) => {
      waiters.set(name, [...(waiters.get(name) ?? []), resolveWaiter]);
    });
  },
};

const styles = new Map();
const document = {
  head: { append(element) { if (element.id) styles.set(element.id, element); } },
  getElementById(id) { return styles.get(id) ?? null; },
  createElement(tagName) { return { tagName, id: "", textContent: "" }; },
};

class MockHTMLElement {}
class MockEvent {
  constructor(type, options = {}) { this.type = type; Object.assign(this, options); }
}
class MockCustomEvent extends MockEvent {}

const context = {
  CSS: { escape: (value) => String(value) },
  CustomEvent: MockCustomEvent,
  Event: MockEvent,
  HTMLElement: MockHTMLElement,
  clearInterval,
  clearTimeout,
  console,
  customElements,
  document,
  history: { pushState() {} },
  navigator: { language: "en-AU" },
  queueMicrotask,
  setInterval,
  setTimeout,
};
context.window = context;
context.globalThis = context;
context.customCards = [];

vm.runInContext(bundle, vm.createContext(context), { filename: "dist/ha-component-library.js" });
await Promise.resolve();
await Promise.resolve();

const missingElements = publicComponentTypes.filter((type) => !definitions.has(type));
if (missingElements.length) throw new Error("Missing loaded elements: " + missingElements.join(", "));

const pickerTypes = new Set(context.customCards.map((card) => card.type));
const missingPickerEntries = publicComponentTypes.filter((type) => !pickerTypes.has(type));
if (missingPickerEntries.length) throw new Error("Missing card-picker entries: " + missingPickerEntries.join(", "));

const missingConfigContracts = publicComponentTypes.filter((type) => {
  const element = definitions.get(type);
  return typeof element?.getConfigElement !== "function" || typeof element?.getStubConfig !== "function";
});
if (missingConfigContracts.length) {
  throw new Error("Missing config editor/stub contracts: " + missingConfigContracts.join(", "));
}

if (context.__HA_COMPONENT_LIBRARY__?.components !== publicComponentTypes.length) {
  throw new Error("Bundle metadata was not initialised");
}

console.log("Isolated load-order/editor check passed: " + publicComponentTypes.length + " public components");
