import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "src/components/navigation-tile.js"), "utf8");
const runtimeReliability = await readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8");

class MockElement {
  constructor() { this.innerHTML = ""; }
}

class MockShadowRoot extends MockElement {
  querySelector(selector) {
    if (selector === "button.nav" && this.innerHTML.includes('<button class="i nav" type="button">')) return new MockElement();
    return null;
  }
}

class MockHTMLElement {
  attachShadow(options) {
    assert.deepEqual(options, { mode: "open" }, "the base card must attach an open shadow root");
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
}

class DashboardBaseCard extends MockHTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(_hass) {}

  escapeHtml(value) {
    return (value == null ? "" : String(value))
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  cardStyles() { return ".base-card{display:block}"; }
}

const definitions = new Map();
const customElements = {
  define(type, element) { definitions.set(type, element); },
  get(type) { return definitions.get(type); },
  whenDefined() { return Promise.resolve(); },
};
const registrations = [];
const interactions = [];
const navigations = [];
const shared = {
  DashboardBaseCard,
  installConfigContract(type, element) {
    element.getStubConfig ??= () => ({ type: `custom:${type}` });
    element.getConfigElement ??= async () => ({ cardType: type });
  },
  interaction(element, options) {
    const handle = {
      destroyed: false,
      destroyCalls: 0,
      element,
      options,
      destroy() { this.destroyCalls += 1; this.destroyed = true; },
      invoke() { return options.primary(); },
    };
    interactions.push(handle);
    return handle;
  },
  navigateTo(path) { navigations.push(path); },
  registerCard({ type, element, name, description, preview = true }) {
    shared.installConfigContract(type, element);
    if (!customElements.get(type)) customElements.define(type, element);
    registrations.push({ type, element, name, description, preview });
  },
};
const context = {
  HTMLElement: MockHTMLElement,
  __HA_COMPONENT_LIBRARY_SHARED__: shared,
  customElements,
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/navigation-tile.js" });
const originalDisconnect = registrations[0]?.element?.prototype.disconnectedCallback;
vm.runInNewContext(runtimeReliability, context, { filename: "src/patches/runtime-reliability.js" });
await Promise.resolve();

assert.equal(registrations.length, 1, "the component must retain one public registration");
const registration = registrations[0];
assert.deepEqual(
  {
    type: registration.type,
    element: registration.element.name,
    name: registration.name,
    description: registration.description,
    preview: registration.preview,
  },
  {
    type: "component-nav-tile-v2",
    element: "ComponentNavigationTileV2",
    name: "Navigation Tile",
    description: "Reusable navigation tile component.",
    preview: true,
  },
  "the card metadata and default preview must remain unchanged",
);
assert.equal(customElements.get(registration.type), registration.element, "the component must remain registered");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-nav-tile-v2" }, "the installed stub contract must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-nav-tile-v2" }, "the installed editor contract must remain available");

const Card = registration.element;
assert.equal(Object.getPrototypeOf(Card.prototype), DashboardBaseCard.prototype, "the card must inherit DashboardBaseCard");
assert.deepEqual(
  Object.getOwnPropertyNames(Card.prototype).sort(),
  ["connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "r", "setConfig"],
  "the legacy prototype surface must remain exact",
);
assert.equal(Card.prototype.disconnectedCallback, originalDisconnect, "the runtime patch must not replace Navigation Tile disconnect ownership");
assert.equal(runtimeReliability.includes('"component-nav-tile-v2"'), false, "the generic retained-interaction patch must no longer include Navigation Tile");

const componentCss = ".nav{width:100%;text-align:left}.wrap{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}";
const staticCss = ".nav-static{border:0;background:transparent;color:inherit;font:inherit;padding:0}";
const expectedMarkup = (config) => {
  const path = config.navigation_path;
  const tag = path ? "button" : "div";
  const attrs = path ? ' type="button"' : "";
  const className = path ? "i nav" : "nav nav-static";
  const escape = (value) => (value == null ? "" : String(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  return `<style>.base-card{display:block}${componentCss}</style><style>${staticCss}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escape(config.icon)}"></ha-icon></span><span><div class="title">${escape(config.title)}</div><div class="desc">${escape(config.context)}</div></span></div></${tag}></ha-card>`;
};
const assertConfig = (card, expected, message) => {
  assert.deepEqual(Object.keys(card.c), Object.keys(expected), `${message}: key order`);
  for (const [key, value] of Object.entries(expected)) assert.equal(card.c[key], value, `${message}: ${key}`);
};

const defaults = new Card();
assert.deepEqual(Object.keys(defaults), ["shadowRoot", "_interaction"], "the constructor must retain its enumerable own interaction handle");
const interactionDescriptor = Object.getOwnPropertyDescriptor(defaults, "_interaction");
assert.deepEqual(
  { value: interactionDescriptor.value, writable: interactionDescriptor.writable, enumerable: interactionDescriptor.enumerable, configurable: interactionDescriptor.configurable },
  { value: null, writable: true, enumerable: true, configurable: true },
  "_interaction must remain a writable enumerable configurable own field",
);
defaults.setConfig({});
assertConfig(defaults, { icon: "mdi:door-open", title: "Destination", context: "Navigation", navigation_path: null }, "defaults");
const configDescriptor = Object.getOwnPropertyDescriptor(defaults, "c");
assert.deepEqual(
  { value: configDescriptor.value, writable: configDescriptor.writable, enumerable: configDescriptor.enumerable, configurable: configDescriptor.configurable },
  { value: defaults.c, writable: true, enumerable: true, configurable: true },
  "setConfig must retain c as a writable enumerable configurable own data field",
);
assert.equal(defaults.getCardSize(), 1, "the card size must remain one");
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup(defaults.c), "default configuration must synchronously render the exact established markup and CSS");
assert.equal(defaults._interaction, null, "a static tile must not bind an interaction");
assert.equal(Object.hasOwn(Card.prototype, "hass"), false, "hass must remain inherited from DashboardBaseCard");
const beforeHassConfig = defaults.c;
const beforeHassMarkup = defaults.shadowRoot.innerHTML;
defaults.hass = { states: { "sensor.navigation_tile": {} } };
assert.equal(defaults.c, beforeHassConfig, "the inherited hass setter must not replace configuration");
assert.equal(defaults.shadowRoot.innerHTML, beforeHassMarkup, "the inherited hass setter must not render a configuration-driven tile");
assert.equal("config" in defaults, false, "the card must not expose a config alias");
assert.equal("render" in defaults, false, "the card must not expose a render alias");

const delegatedRender = new Card();
let legacyRenderCalls = 0;
delegatedRender.r = function r() {
  legacyRenderCalls += 1;
  return Card.prototype.r.call(this);
};
delegatedRender.setConfig({ title: "Delegated render" });
assert.equal(legacyRenderCalls, 1, "setConfig must retain immediate dynamic dispatch through legacy r");

defaults.setConfig({ title: "First", retained: "first" });
defaults.setConfig({ icon: "mdi:second" });
assertConfig(defaults, { icon: "mdi:second", title: "Destination", context: "Navigation", navigation_path: null }, "each setConfig call must replace prior configuration");
for (const input of [null, undefined, 0, false]) {
  const card = new Card();
  card.setConfig(input);
  assertConfig(card, { icon: "mdi:door-open", title: "Destination", context: "Navigation", navigation_path: null }, `native object spread with ${String(input)}`);
}
const stringConfig = new Card();
stringConfig.setConfig("text");
assertConfig(
  stringConfig,
  { 0: "t", 1: "e", 2: "x", 3: "t", icon: "mdi:door-open", title: "Destination", context: "Navigation", navigation_path: null },
  "native object spread with a string",
);

const explicitValues = new Card();
explicitValues.setConfig({ icon: undefined, title: null, context: false, navigation_path: "", retained: 0 });
assertConfig(explicitValues, { icon: undefined, title: null, context: false, navigation_path: "", retained: 0 }, "explicit and extra config values");
assert.equal(explicitValues.shadowRoot.innerHTML, expectedMarkup(explicitValues.c), "nullish and false values must retain exact escaped static markup");

const escaped = new Card();
escaped.setConfig({ icon: 'mdi:<&"\'', title: '<&"\'', context: '<&"\'' });
assert.equal(escaped.shadowRoot.innerHTML, expectedMarkup(escaped.c), "icon attributes and text content must use inherited HTML escaping");

const navigable = new Card();
const unusualPath = { destination: "kitchen" };
navigable.setConfig({ navigation_path: unusualPath });
const firstHandle = navigable._interaction;
assert.equal(navigable.shadowRoot.innerHTML, expectedMarkup(navigable.c), "truthy navigation paths must retain exact native button markup");
assert.equal(firstHandle.element instanceof MockElement, true, "the shared interaction must bind the native Navigation Tile button");
assert.deepEqual(Object.keys(firstHandle.options), ["primary", "feedback"], "the shared interaction options must remain exact");
assert.equal(firstHandle.options.feedback, true, "navigation must retain shared interaction feedback");
assert.equal(typeof firstHandle.options.primary, "function", "navigation must provide a shared primary action");
navigable.c.navigation_path = "/changed-after-render";
firstHandle.invoke();
assert.equal(navigations.at(-1), unusualPath, "the interaction must retain the path captured by its rendered button");
navigable.r();
assert.equal(firstHandle.destroyed, true, "r must destroy the old interaction before replacing the DOM");
assert.equal(firstHandle.destroyCalls, 1, "r must tear down the old interaction exactly once");
assert.notEqual(navigable._interaction, firstHandle, "r must bind a fresh interaction for a truthy path");

const staticTile = new Card();
const interactionsBeforeStatic = interactions.length;
staticTile.setConfig({ navigation_path: 0 });
assert.equal(staticTile.shadowRoot.innerHTML, expectedMarkup(staticTile.c), "falsy paths must remain static div tiles");
assert.equal(staticTile._interaction, null, "falsy paths must not bind an interaction");
assert.equal(interactions.length, interactionsBeforeStatic, "static tiles must not create shared interaction handles");

const reconnecting = new Card();
reconnecting.setConfig({ navigation_path: "/overview" });
const firstConnection = reconnecting._interaction;
reconnecting.disconnectedCallback();
assert.equal(firstConnection.destroyed, true, "disconnect must destroy the active interaction");
assert.equal(firstConnection.destroyCalls, 1, "disconnect must tear down the active interaction exactly once");
assert.equal(reconnecting._interaction, null, "disconnect must release the owned interaction handle");
reconnecting.connectedCallback();
assert.notEqual(reconnecting._interaction, firstConnection, "reconnect must render and bind a fresh interaction");
assert.equal(reconnecting._interaction.destroyed, false, "the reconnect interaction must remain live");
assert.equal(interactions.filter((handle) => handle === reconnecting._interaction).length, 1, "reconnect must bind exactly one fresh interaction");

console.log("Navigation Tile check passed: metadata/editor/stub, legacy surface, native config semantics, exact markup, escaping, navigation capture, shared interaction delegation and owned reconnect lifecycle");
