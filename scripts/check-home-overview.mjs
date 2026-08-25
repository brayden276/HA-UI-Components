import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, backendPatch] = await Promise.all([
  readFile(resolve(root, "src/components/home-overview.js"), "utf8"),
  readFile(resolve(root, "src/patches/home-favourites-backend-only.js"), "utf8"),
]);
class MockClassList { constructor() { this.values = new Set(); } add(value) { this.values.add(value); } }
class MockElement {
  constructor() { this.children = []; this.attributes = new Map(); this.classList = new MockClassList(); this.textWrites = 0; this.attributeWrites = 0; }
  set textContent(value) { this._textContent = value; this.textWrites += 1; }
  get textContent() { return this._textContent ?? ""; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); this.attributeWrites += 1; }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  append(...children) { this.children.push(...children); for (const child of children) child.parentNode = this; }
}
class MockShadowRoot extends MockElement {
  #html = "";
  set innerHTML(value) {
    this.#html = value;
    this.elements = new Map([[".time", new MockElement()], [".weather", new MockElement()], [".sections", new MockElement()]]);
  }
  get innerHTML() { return this.#html; }
  querySelector(selector) { return this.elements?.get(selector) ?? null; }
}
class MockHTMLElement {
  attachShadow(options) {
    assert.equal(this.shadowRoot, undefined, "Home Overview must attach one shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "Home Overview shadow options must remain exact");
    assert.equal(options.mode, "open", "Home Overview must use an open shadow root");
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
}
class ChildCard extends MockElement {
  constructor(localName) { super(); this.localName = localName; this.configs = []; }
  setConfig(config) { this.configs.push(config); }
  set hass(value) { this._hass = value; }
  get hass() { return this._hass; }
}
const definitions = new Map();
let definitionGate = null;
const requestedDefinitions = [];
const customElements = {
  define(type, element) { definitions.set(type, element); },
  get(type) { return definitions.get(type); },
  whenDefined(type) { requestedDefinitions.push(type); return definitionGate || Promise.resolve(); },
};
const document = { createElement(type) { return new ChildCard(type); } };
const timers = new Map();
const clearedTimers = [];
let timerId = 0;
const setTimeoutMock = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
const clearTimeoutMock = (id) => { clearedTimers.push(id); timers.delete(id); };
const interactions = [];
const moreInfo = [];
const shared = {
  interaction(element, options) { const handle = { element, options, destroyCalls: 0, destroy() { this.destroyCalls += 1; }, invoke() { return options.primary?.(); } }; interactions.push(handle); return handle; },
  openMoreInfo(host, entity) { moreInfo.push([host, entity]); },
};
let timeText = "9:05 am";
let dateFailure = false;
const IntlMock = {
  DateTimeFormat: class { constructor(locale, options) { this.locale = locale; this.options = options; } format() { if (dateFailure) throw new RangeError("invalid time zone"); return timeText; } },
  NumberFormat: class { constructor(locale, options) { this.locale = locale; this.options = options; } format(value) { return `N${value}`; } },
};
class DateMock { static now() { return 120000; } }
const context = { HTMLElement: MockHTMLElement, customElements, document, setTimeout: setTimeoutMock, clearTimeout: clearTimeoutMock, Intl: IntlMock, Date: DateMock, navigator: { language: "en-AU" }, __HA_COMPONENT_LIBRARY_SHARED__: shared, window: { customCards: [] } };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/home-overview.js" });
const V4 = customElements.get("component-home-overview-v4");
const V5 = customElements.get("component-home-overview-v5");
assert.equal(typeof V4, "function", "Home Overview V4 must remain registered");
assert.equal(typeof V5, "function", "Home Overview V5 must remain registered");
assert.equal(Object.getPrototypeOf(V5.prototype), V4.prototype, "V5 must retain V4 inheritance");
assert.equal(context.window.customCards.length, 1, "only V4 must retain public card metadata");
assert.deepEqual({ type: context.window.customCards[0].type, name: context.window.customCards[0].name, description: context.window.customCards[0].description }, { type: "component-home-overview-v4", name: "Home Overview V4", description: "Stable minimal Home overview without state-refresh teardown." }, "Home Overview metadata must remain exact");
assert.deepEqual({ columns: V4.getGridOptions().columns, rows: V4.getGridOptions().rows }, { columns: 12, rows: "auto" }, "V4 grid options must remain exact");
assert.deepEqual(Object.getOwnPropertyNames(V4.prototype).sort(), ["_bindWeather", "connectedCallback", "constructor", "disconnectedCallback", "ensure", "getCardSize", "hass", "moreWeather", "renderHeader", "setConfig", "tick"], "V4 prototype surface must remain exact except the local header signature field");

const shell = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}
      ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}
      .top{min-height:44px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}
      .weather{appearance:none;border:0;min-height:44px;padding:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer}
      .weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}
      .sections{margin-top:8px}.section+.section{margin-top:16px}
      @media(max-width:520px){.time{font-size:13px}.weather{font-size:12px}}
      @media(max-width:350px){.time{font-size:12px}.weather{font-size:11px}}
    </style><ha-card><div class="top"><span class="time"></span><button class="weather" type="button"></button></div><div class="sections"></div></ha-card>`;
const sourceCard = new V4();
assert.equal(sourceCard.shadowRoot.innerHTML, shell, "Home Overview shell CSS and DOM must remain exact");
assert.deepEqual(Object.keys(sourceCard), ["shadowRoot", "c", "h", "_children", "built", "building", "timer", "_weatherInteraction", "_headerSignature", "sections"], "constructor fields must retain the source-owned header state");
sourceCard.setConfig({});
assert.deepEqual(Array.from(sourceCard.c.favourites_helpers), ["input_text.dashboard_favourite_1", "input_text.dashboard_favourite_2", "input_text.dashboard_favourite_3", "input_text.dashboard_favourite_4"], "source defaults must retain historical favourite helpers before backend patching");
assert.equal(sourceCard.c.base_path, "/home-control", "source defaults must retain historical base path");
assert.equal(sourceCard.c.current_dashboard, "home-control", "source defaults must retain historical dashboard key");
assert.equal(sourceCard.getCardSize(), 12, "Home Overview size must remain twelve");
assert.equal(timers.get(sourceCard.timer).delay, 60100, "tick must retain minute-boundary scheduling");

vm.runInNewContext(backendPatch, context, { filename: "src/patches/home-favourites-backend-only.js" });
await Promise.resolve();
await Promise.resolve();
assert.equal(V4.prototype.__backendOnlyFavouritesV1, true, "real backend-only patch must retain its V4 inheritance marker");
const card = new V5();
card.isConnected = true;
card.setConfig({ weather_entity: "weather.home", base_path: "/test-home", current_dashboard: "test-home", favourites_helpers: ["input_text.ignored"] });
assert.deepEqual(Array.from(card.c.favourites_helpers), [], "backend-only V4 patch must also apply through V5 inheritance");
const time = card.shadowRoot.querySelector(".time");
const weather = card.shadowRoot.querySelector(".weather");
const states = { "weather.home": { attributes: { temperature: 21.5, temperature_unit: "°C", cloud_coverage: 47 } } };
const hass = { states, config: { time_zone: "Australia/Sydney" }, locale: { language: "en" } };
let resolveDefinitions;
definitionGate = new Promise((resolve) => { resolveDefinitions = resolve; });
const ensureStart = requestedDefinitions.length;
card.hass = hass;
assert.equal(time.textContent, "9:05 am", "header must retain formatted time output");
assert.equal(weather.textContent, "N21.5°C · Cloud 47%", "header must retain formatted weather output");
assert.equal(weather.getAttribute("aria-label"), "Outside N21.5°C, Cloud 47%. Open weather details.", "header must retain exact weather ARIA output");
const headerWrites = [time.textWrites, weather.textWrites, weather.attributeWrites];
card.renderHeader();
assert.deepEqual([time.textWrites, weather.textWrites, weather.attributeWrites], headerWrites, "unchanged formatted header output must not rewrite time, weather or ARIA DOM");
states["weather.home"].attributes.cloud_coverage = 48;
card.renderHeader();
assert.deepEqual([time.textWrites, weather.textWrites, weather.attributeWrites], headerWrites.map((count) => count + 1), "changed formatted weather output must update all header writes together");
dateFailure = true;
assert.throws(() => card.renderHeader(), RangeError, "native date formatting failures must remain visible");
dateFailure = false;
const previousTimer = card.timer;
card.tick();
assert.equal(clearedTimers.includes(previousTimer), true, "tick must replace the prior timer");
assert.equal(timers.get(card.timer).delay, 60100, "replacement tick must retain minute-boundary delay");
card.c.weather_entity = "weather.current";
interactions.at(-1).invoke();
assert.deepEqual(moreInfo, [[card, "weather.current"]], "weather action must read the current configured entity");

assert.equal(card.building, true, "ensure must enter the once-only asynchronous build state");
card.ensure();
assert.deepEqual(requestedDefinitions.slice(ensureStart), ["component-favourites-minimal-v1", "component-smart-collection-v3", "component-room-directory-v4", "component-household-directory-v3"], "ensure must wait for child definitions in established order once");
resolveDefinitions();
for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
definitionGate = null;
assert.equal(card.built, true, "connected ensure must complete one child build");
assert.deepEqual([...card._children.keys()], ["favourites", "active", "household", "rooms"], "child section order must remain exact");
assert.deepEqual(card.sections.children.map((child) => child.localName), ["component-favourites-minimal-v1", "component-smart-collection-v3", "component-household-directory-v3", "component-room-directory-v4"], "child DOM order must remain exact");
const children = [...card._children.values()];
assert.equal(children.every((child) => child.classList.values.has("section") && child.hass === hass), true, "built children must retain section class and initial Hass forwarding");
const [favourites, active, household, rooms] = children;
assert.deepEqual({ helpers: Array.from(favourites.configs[0].helpers), max: favourites.configs[0].max, title: favourites.configs[0].title }, { helpers: [], max: 4, title: "Favourites" }, "backend-only favourites config must retain the child contract");
assert.deepEqual({ mode: active.configs[0].mode, title: active.configs[0].title, pref_key: active.configs[0].pref_key }, { mode: "active", title: "Active now", pref_key: null }, "active collection config must remain exact");
assert.deepEqual({ pref_key: household.configs[0].pref_key, base_path: household.configs[0].base_path, current_dashboard: household.configs[0].current_dashboard }, { pref_key: "home-control.household.v2", base_path: "/test-home", current_dashboard: "test-home" }, "household historical preference/path contract must remain exact");
assert.deepEqual({ pref_key: rooms.configs[0].pref_key, base_path: rooms.configs[0].base_path, navigation_path: rooms.configs[0].navigation_path }, { pref_key: "home-control.rooms.v2", base_path: "/test-home", navigation_path: "/test-home/rooms" }, "rooms historical preference/path contract must remain exact");
const postBuildHass = { states: {} };
card.hass = postBuildHass;
assert.equal(children.every((child) => child.hass === postBuildHass), true, "post-build Hass updates must forward to retained children");
assert.equal(card.sections.children.length, 4, "post-build updates must not rebuild child sections");

let resolveDetached;
definitionGate = new Promise((resolve) => { resolveDetached = resolve; });
const detached = new V4();
detached.isConnected = true;
detached.setConfig({ weather_entity: "weather.home" });
detached.hass = hass;
assert.equal(detached.building, true, "detached-race fixture must start an asynchronous build");
detached.isConnected = false;
resolveDetached();
for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
definitionGate = null;
assert.equal(detached.built, false, "detach before definitions settle must not mark the component built");
assert.equal(detached.building, false, "detach before definitions settle must release the build flag");
assert.equal(detached._children.size, 0, "detach before definitions settle must not append child cards");

const weatherHandle = card._weatherInteraction;
card.disconnectedCallback();
assert.equal(weatherHandle.destroyCalls, 1, "disconnect must destroy the weather interaction");
assert.equal(card._weatherInteraction, null, "disconnect must release weather interaction ownership");
assert.equal(clearedTimers.includes(card.timer), true, "disconnect must clear the active minute timer");

console.log("Home Overview check passed: exact header writes, backend-only inheritance, child composition, timers and detach races");
