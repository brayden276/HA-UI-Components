import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await readFile(resolve(root, "dist/ha-component-library.js"), "utf8");

class MockNode {
  constructor(tagName = "div") {
    this.tagName = tagName;
    this.style = {};
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.classNames = [];
    this.classList = {
      [Symbol.iterator]: () => this.classNames[Symbol.iterator](),
      add: (...names) => this.classNames.push(...names),
      remove: (...names) => { this.classNames = this.classNames.filter((name) => !names.includes(name)); },
      toggle: (name, force) => {
        const enabled = force ?? !this.classNames.includes(name);
        if (enabled && !this.classNames.includes(name)) this.classNames.push(name);
        if (!enabled) this.classNames = this.classNames.filter((item) => item !== name);
        return enabled;
      },
    };
  }
  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    for (const match of this._innerHTML.matchAll(/<([a-z][a-z0-9-]*)([^>]*)>/gi)) {
      const node = new MockNode(match[1].toLowerCase());
      const classMatch = /class=["']([^"']*)["']/.exec(match[2]);
      const idMatch = /id=["']([^"']*)["']/.exec(match[2]);
      node.classNames = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
      node.id = idMatch?.[1] ?? "";
      this.children.push(node);
    }
  }
  get innerHTML() { return this._innerHTML ?? ""; }
  addEventListener() {}
  removeEventListener() {}
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  toggleAttribute() {}
  focus() {}
  getBoundingClientRect() { return { width: 800, height: 420, left: 0, top: 0 }; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  querySelector(selector) { return this._find(selector) ?? new MockNode(); }
  querySelectorAll(selector) {
    if (selector === "[class]") return this.children.filter((node) => node.classNames.length);
    if (selector.includes("button")) return this.children.filter((node) => node.tagName === "button");
    if (selector.startsWith(".")) return this.children.filter((node) => node.classNames.includes(selector.slice(1)));
    return [];
  }
  getElementById(id) { return this.children.find((node) => node.id === id) ?? new MockNode(); }
  _find(selector) {
    const className = selector.match(/\.([a-zA-Z0-9_-]+)/)?.[1];
    const id = selector.match(/#([a-zA-Z0-9_-]+)/)?.[1];
    if (className) return this.children.find((node) => node.classNames.includes(className));
    if (id) return this.children.find((node) => node.id === id);
    const tag = selector.match(/^[a-z][a-z0-9-]*/i)?.[0]?.toLowerCase();
    return tag ? this.children.find((node) => node.tagName === tag) : null;
  }
}

class MockHTMLElement extends MockNode {
  constructor() { super("host"); this.isConnected = true; }
  attachShadow() { this.shadowRoot = new MockNode("shadow-root"); return this.shadowRoot; }
  dispatchEvent() { return true; }
}

const definitions = new Map();
const customElements = {
  define: (name, element) => definitions.set(name, element),
  get: (name) => definitions.get(name),
  whenDefined: () => Promise.resolve(),
};
const document = {
  head: new MockNode("head"),
  createElement: (name) => definitions.has(name) ? new (definitions.get(name))() : new MockNode(name),
  getElementById: () => null,
};
class MockResizeObserver { observe() {} disconnect() {} }
class MockEvent { constructor(type, options = {}) { this.type = type; Object.assign(this, options); } }

const context = {
  CSS: { escape: String }, CustomEvent: MockEvent, Event: MockEvent,
  HTMLElement: MockHTMLElement, ResizeObserver: MockResizeObserver,
  clearInterval, clearTimeout, console, customElements, document,
  history: { pushState() {}, replaceState() {} }, location: { hash: "", pathname: "/", search: "" }, navigator: { language: "en-AU" },
  queueMicrotask, setInterval, setTimeout,
};
context.window = context;
context.globalThis = context;
context.customCards = [];
context.addEventListener = () => {};
context.removeEventListener = () => {};
context.dispatchEvent = () => true;
vm.runInContext(bundle, vm.createContext(context), { filename: "dist/ha-component-library.js" });

const configurations = {
  "component-context-strip-v3": {},
  "component-energy-day-selector-v1": { channel: "smoke" },
  "metric-pair-card-v3": {},
  "component-history-graph-v2": {},
  "component-single-kpi-v2": {},
  "component-three-stat-v2": {},
  "component-status-row-v2": {},
  "component-progress-v2": {},
  "component-action-v2": {},
  "component-list-v2": {},
  "component-notice-v2": {},
  "component-quick-nav-v2": {},
  "component-favourites-v3": { items: [{ title: "Smoke" }] },
  "component-nav-tile-v2": {},
  "component-room-navigation-v1": { area: "Smoke", navigation_path: "#smoke" },
  "component-control-row-v2": {},
  "component-split-controller-v4": { entity: "climate.smoke", profile_area_id: "smoke" },
  "component-media-row-v2": {},
  "component-apple-tv-controller-v1": { demo: true },
  "component-section-separator-v2": {},
  "component-room-sheet-v2": {},
  "component-update-summary-v3": {},
  "component-update-row-v3": {},
  "component-empty-state-v3": {},
  "component-device-discovery-v2": { demo: true },
  "component-text-effect-v1": { text: "Smoke" },
  "component-household-attention-v1": { demo: true },
  "component-welcome-header-v1": { weather_entity: "weather.smoke" },
  "component-wled-controller-v1": { entity: "light.smoke" },
  "component-garage-door-controller-v1": { entity: "binary_sensor.smoke_garage_door", control_entity: "button.smoke_garage_door_trigger" },
  "component-camera-controller-v1": { entity: "camera.smoke_main_stream" },
  "component-smart-collection-v3": {},
  "component-household-directory-v3": {},
  "component-favourites-minimal-v1": { items: [{ title: "Smoke" }] },
  "component-room-directory-v4": {},
  "component-home-overview-v4": {},
  "solar-daylight-card-v7": { sun_entity: "sun.smoke", weather_entity: "weather.smoke" },
  "energy-history-card-v3": { house_entity: "sensor.smoke_house", solar_entity: "sensor.smoke_solar", grid_entity: "sensor.smoke_grid", day_channel: "smoke" },
};

const failures = [];
for (const [type, config] of Object.entries(configurations)) {
  try {
    const Card = definitions.get(type);
    if (!Card) throw new Error("not registered");
    const card = new Card();
    card.setConfig(config);
    card.connectedCallback?.();
    card.disconnectedCallback?.();
  } catch (error) {
    failures.push(`${type}: ${error.message}`);
  }
}

if (failures.length) throw new Error(`Runtime contract failures:\n${failures.join("\n")}`);
console.log(`Runtime contract check passed: ${Object.keys(configurations).length} public components instantiated`);
