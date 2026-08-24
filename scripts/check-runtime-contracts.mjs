import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await readFile(resolve(root, "dist/ha-component-library.js"), "utf8");

class MockStyle {
  constructor() { this.values = new Map(); }
  setProperty(name, value) { this.values.set(name, String(value)); }
  removeProperty(name) { const previous = this.values.get(name) ?? ""; this.values.delete(name); return previous; }
  getPropertyValue(name) { return this.values.get(name) ?? ""; }
}

class MockNode {
  constructor(tagName = "div") {
    this.tagName = tagName;
    this.style = new MockStyle();
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.listeners = new Map();
    this.classNames = [];
    this.classList = {
      [Symbol.iterator]: () => this.classNames[Symbol.iterator](),
      add: (...names) => this.classNames.push(...names),
      remove: (...names) => { this.classNames = this.classNames.filter((name) => !names.includes(name)); },
      contains: (name) => this.classNames.includes(name),
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
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== listener));
  }
  dispatch(type, data = {}) {
    const event = { type, button: 0, pointerId: 1, clientX: 0, clientY: 0, key: "", repeat: false, preventDefault() {}, stopImmediatePropagation() {}, ...data };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
    return event;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  contains(node) { return node === this || this.children.includes(node); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  toggleAttribute(name, force) {
    const enabled = force ?? !this.attributes.has(name);
    if (enabled) this.attributes.set(name, "");
    else this.attributes.delete(name);
    return enabled;
  }
  focus() {}
  setPointerCapture() {}
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
  constructor() { super("host"); this.isConnected = true; this.dispatchedEvents = []; }
  attachShadow() { this.shadowRoot = new MockNode("shadow-root"); return this.shadowRoot; }
  dispatchEvent(event) { this.dispatchedEvents.push(event); return true; }
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
  activeElement: null,
  visibilityState: "visible",
};
class MockResizeObserver { observe() {} disconnect() {} }
class MockEvent { constructor(type, options = {}) { this.type = type; Object.assign(this, options); } }

const context = {
  AbortController, CSS: { escape: String }, CustomEvent: MockEvent, Event: MockEvent,
  HTMLElement: MockHTMLElement, ResizeObserver: MockResizeObserver,
  clearInterval, clearTimeout, console, customElements, document,
  history: { pushState() {}, replaceState() {} }, location: { hash: "", pathname: "/", search: "" }, navigator: { language: "en-AU" },
  queueMicrotask, setInterval, setTimeout,
  sessionStorage: { values: new Map(), getItem(key) { return this.values.get(key) ?? null; }, setItem(key, value) { this.values.set(key, String(value)); } },
};
context.window = context;
context.globalThis = context;
context.customCards = [];
context.addEventListener = () => {};
context.removeEventListener = () => {};
context.dispatchEvent = () => true;
vm.runInContext(bundle, vm.createContext(context), { filename: "dist/ha-component-library.js" });
await Promise.resolve();
await Promise.resolve();

const configurations = {
  "component-context-strip-v3": {},
  "component-energy-day-selector-v1": { channel: "smoke" },
  "metric-pair-card-v3": {},
  "component-energy-summary-v1": { profile: "household-energy", day_channel: "smoke" },
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
  "component-camera-controller-v2": { entity: "camera.smoke_main_stream" },
  "component-security-summary-v1": { profile: "household-security" },
  "component-security-camera-wall-v3": { profile: "household-security" },
  "component-security-entry-points-v1": { profile: "household-security" },
  "component-security-dashboard-v1": { profile: "household-security" },
  "component-smart-collection-v3": {},
  "component-household-directory-v3": {},
  "component-favourites-minimal-v1": { items: [{ title: "Smoke" }] },
  "component-room-directory-v4": {},
  "component-home-overview-v4": {},
  "solar-daylight-card-v7": { sun_entity: "sun.smoke", weather_entity: "weather.smoke" },
  "energy-history-card-v3": { house_entity: "sensor.smoke_house", solar_entity: "sensor.smoke_solar", grid_entity: "sensor.smoke_grid", day_channel: "smoke" },
  "component-energy-dashboard-v1": { profile: "household-energy", day_channel: "smoke" },
};

const failures = [];
for (const [type, config] of Object.entries(configurations)) {
  try {
    const Card = definitions.get(type);
    if (!Card) throw new Error("not registered");
    const card = new Card();
    card.setConfig(config);
    for (let cycle = 0; cycle < 2; cycle += 1) {
      card.isConnected = true;
      card.connectedCallback?.();
      card.isConnected = false;
      card.disconnectedCallback?.();
    }
  } catch (error) {
    failures.push(`${type}: ${error.message}`);
  }
}

if (failures.length) throw new Error(`Runtime contract failures:\n${failures.join("\n")}`);

{
  const Selector = definitions.get("component-energy-day-selector-v1");
  const selector = new Selector();
  selector.setConfig({ channel: "reconnect-action" });
  selector.connectedCallback();
  const previous = selector.shadowRoot.querySelector(".previous");
  const firstDay = selector.selected;
  previous.dispatch("pointerdown");
  previous.dispatch("pointerup");
  const secondDay = selector.selected;
  selector.disconnectedCallback();
  selector.connectedCallback();
  previous.dispatch("pointerdown");
  previous.dispatch("pointerup");
  const thirdDay = selector.selected;
  selector.disconnectedCallback();
  if (firstDay === secondDay || secondDay === thirdDay) {
    throw new Error("Energy day selector actions must remain live after reconnect");
  }
}

{
  const Metric = definitions.get("metric-pair-card-v3");
  const metric = new Metric();
  metric.setConfig({ left_more_info_entity: "sensor.smoke" });
  metric.hass = { states: { "sensor.smoke": { entity_id: "sensor.smoke", state: "1", attributes: {} } } };
  metric.connectedCallback();
  metric.disconnectedCallback();
  metric.connectedCallback();
  const left = metric.shadowRoot.querySelector(".left");
  left.dispatch("pointerdown");
  left.dispatch("pointerup");
  metric.disconnectedCallback();
  if (!metric.dispatchedEvents.some((event) => event.type === "hass-more-info")) {
    throw new Error("Metric Pair More Info action must remain live after reconnect");
  }
}

{
  const Energy = definitions.get("component-energy-dashboard-v1");
  const energy = new Energy();
  energy.setConfig({ profile: "first-energy", day_channel: "first-day" });
  energy.setConfig({ profile: "second-energy", day_channel: "second-day" });
  if (energy.children.get("summary")?.config?.profile !== "second-energy" ||
      energy.children.get("selector")?.config?.channel !== "second-day") {
    throw new Error("Energy wrapper must propagate edited configuration to retained child cards");
  }

  const Security = definitions.get("component-security-dashboard-v1");
  const security = new Security();
  security.setConfig({ profile: "first-security", camera_columns: 1 });
  security.setConfig({ profile: "second-security", camera_columns: 3 });
  if (security.children.get("summary")?.config?.profile !== "second-security" ||
      security.children.get("wall")?.config?.columns !== 3) {
    throw new Error("Security wrapper must propagate edited configuration to retained child cards");
  }
}

console.log(`Runtime contract check passed: ${Object.keys(configurations).length} public components plus live actions across reconnect cycles`);
