import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await readFile(
  resolve(root, "dist/ha-component-library.js"),
  "utf8",
);

const definitions = new Map();
const waiters = new Map();
const customElements = {
  define(name, element) {
    if (definitions.has(name)) throw new Error("Duplicate custom element: " + name);
    definitions.set(name, element);
    for (const resolveWaiter of waiters.get(name) ?? []) resolveWaiter();
    waiters.delete(name);
  },
  get(name) {
    return definitions.get(name);
  },
  whenDefined(name) {
    if (definitions.has(name)) return Promise.resolve();
    return new Promise((resolveWaiter) => {
      waiters.set(name, [...(waiters.get(name) ?? []), resolveWaiter]);
    });
  },
};

const styles = new Map();
const document = {
  head: {
    append(element) {
      if (element.id) styles.set(element.id, element);
    },
  },
  getElementById(id) {
    return styles.get(id) ?? null;
  },
  createElement(tagName) {
    return { tagName, id: "", textContent: "" };
  },
};

class MockHTMLElement {}
class MockEvent {
  constructor(type, options = {}) {
    this.type = type;
    Object.assign(this, options);
  }
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

vm.runInContext(bundle, vm.createContext(context), {
  filename: "dist/ha-component-library.js",
});

await Promise.resolve();
await Promise.resolve();

const expected = [
  "component-context-strip-v3",
  "component-energy-day-selector-v1",
  "metric-pair-card-v3",
  "component-history-graph-v2",
  "component-single-kpi-v2",
  "component-three-stat-v2",
  "component-status-row-v2",
  "component-progress-v2",
  "component-action-v2",
  "component-list-v2",
  "component-notice-v2",
  "component-quick-nav-v2",
  "component-favourites-v3",
  "component-nav-tile-v2",
  "component-room-navigation-v1",
  "component-control-row-v2",
  "component-split-controller-v4",
  "component-media-row-v2",
  "component-section-separator-v2",
  "component-room-sheet-v2",
  "component-update-summary-v3",
  "component-update-row-v3",
  "component-empty-state-v3",
  "component-device-discovery-v2",
  "component-text-effect-v1",
  "component-household-attention-v1",
  "component-welcome-header-v1",
  "component-wled-controller-v1",
];

const missingElements = expected.filter((type) => !definitions.has(type));
if (missingElements.length) {
  throw new Error("Missing loaded elements: " + missingElements.join(", "));
}

const pickerTypes = new Set(context.customCards.map((card) => card.type));
const missingPickerEntries = expected.filter((type) => !pickerTypes.has(type));
if (missingPickerEntries.length) {
  throw new Error(
    "Missing card-picker entries: " + missingPickerEntries.join(", "),
  );
}

if (context.__HA_COMPONENT_LIBRARY__?.components !== expected.length) {
  throw new Error("Bundle metadata was not initialised");
}

console.log(
  "Isolated load-order check passed: " + expected.length + " public components",
);

