import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "src/components/section-separator.js"), "utf8");

class MockShadowRoot {
  innerHTML = "";
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

  cardStyles() {
    return ".base-card{display:block}";
  }
}

const definitions = new Map();
const customElements = {
  define(type, element) {
    definitions.set(type, element);
  },
  get(type) {
    return definitions.get(type);
  },
};
const registrations = [];
const installedContracts = [];
const shared = {
  DashboardBaseCard,
  installConfigContract(type, element) {
    installedContracts.push([type, element]);
    element.getStubConfig ??= () => ({ type: `custom:${type}` });
    element.getConfigElement ??= async () => ({ cardType: type });
  },
  registerCard({ type, element, name, description, preview = true }) {
    shared.installConfigContract(type, element);
    if (!customElements.get(type)) customElements.define(type, element);
    registrations.push({ type, element, name, description, preview });
  },
};
const context = {
  __HA_COMPONENT_LIBRARY_SHARED__: shared,
  customElements,
  HTMLElement: MockHTMLElement,
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/section-separator.js" });

assert.equal(registrations.length, 1, "the card must retain its public registration");
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
    type: "component-section-separator-v2",
    element: "ComponentSectionSeparatorV2",
    name: "Section Separator",
    description: "Reusable section separator component.",
    preview: true,
  },
  "the component metadata and default preview must remain unchanged",
);
assert.equal(customElements.get(registration.type), registration.element, "the component must remain registered");
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "registration must install the shared config contract");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-section-separator-v2" }, "the installed stub contract must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-section-separator-v2" }, "the installed editor contract must remain available");

const Card = registration.element;
assert.equal(Object.getPrototypeOf(Card.prototype), DashboardBaseCard.prototype, "the card must inherit DashboardBaseCard");
assert.equal(Object.hasOwn(Card.prototype, "hass"), false, "hass must remain the inherited no-op setter");
assert.equal(Object.hasOwn(Card.prototype, "c"), false, "c must remain instance data rather than a prototype accessor");
assert.equal(Object.hasOwn(Card.prototype, "config"), false, "the card must not add a config compatibility surface");
assert.equal(Object.hasOwn(Card.prototype, "render"), false, "the card must not add a render compatibility surface");
assert.equal(Object.hasOwn(Card.prototype, "connectedCallback"), false, "the card must not add a connection lifecycle hook");
assert.equal(Object.hasOwn(Card.prototype, "disconnectedCallback"), false, "the card must not add a disconnect lifecycle hook");

const componentCss = "ha-card{background:transparent;border:0;box-shadow:none}.wrap{padding:7px 2px 5px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color)}.wrap ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.label{font-size:12px;font-weight:600;color:var(--primary-text-color)}.line{height:1px;background:var(--divider-color);flex:1}";
const expectedMarkup = (icon, title) => `<style>.base-card{display:block}${componentCss}</style><ha-card><div class="wrap"><ha-icon icon="${icon}"></ha-icon><span class="label">${title}</span><span class="line"></span></div></ha-card>`;
const assertConfig = (card, expected, message) => {
  assert.deepEqual(Object.keys(card.c), Object.keys(expected), `${message}: keys`);
  for (const [key, value] of Object.entries(expected)) assert.equal(card.c[key], value, `${message}: ${key}`);
};

const defaults = new Card();
defaults.setConfig({});
assertConfig(defaults, { icon: "mdi:gesture-tap-button", title: "Section label" }, "setConfig must replace c with defaults");
assert.equal(Object.hasOwn(defaults, "c"), true, "setConfig must create c as an own data property");
const cDescriptor = Object.getOwnPropertyDescriptor(defaults, "c");
assert.equal(cDescriptor.value, defaults.c, "c's descriptor must expose the assigned configuration value");
assert.equal(cDescriptor.writable, true, "c must remain writable");
assert.equal(cDescriptor.enumerable, true, "c must remain enumerable");
assert.equal(cDescriptor.configurable, true, "c must remain configurable");
assert.equal(Object.keys(defaults).includes("c"), true, "c must remain visible in instance keys");
assert.equal(Object.keys(defaults).includes("config"), false, "config must not appear in instance keys");
assert.equal("config" in defaults, false, "the card must not expose config");
assert.equal("render" in defaults, false, "the card must not expose render");
assert.equal(typeof defaults.render, "undefined", "the card must not expose a render method");
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup("mdi:gesture-tap-button", "Section label"), "default configuration must synchronously render the exact established markup and CSS");
assert.equal(defaults.getCardSize(), 1, "the card size must remain one");

const delegatedRender = new Card();
let legacyRenderCalls = 0;
delegatedRender.r = function r() {
  legacyRenderCalls += 1;
  return Card.prototype.r.call(this);
};
delegatedRender.setConfig({ title: "Delegated render" });
assert.equal(legacyRenderCalls, 1, "setConfig must retain its immediate render path through legacy r");
assert.equal(delegatedRender.shadowRoot.innerHTML, expectedMarkup("mdi:gesture-tap-button", "Delegated render"), "legacy r must remain the direct renderer");

defaults.c = { icon: "mdi:legacy", title: "Legacy value" };
defaults.r();
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup("mdi:legacy", "Legacy value"), "r must render the current c value");

defaults.setConfig({ title: "First" });
defaults.setConfig({ icon: "mdi:second" });
assertConfig(defaults, { icon: "mdi:second", title: "Section label" }, "each setConfig call must replace prior configuration");
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup("mdi:second", "Section label"), "replacement config must replace the rendered markup");

const nullConfig = new Card();
nullConfig.setConfig(null);
assertConfig(nullConfig, { icon: "mdi:gesture-tap-button", title: "Section label" }, "null config must preserve defaults");
nullConfig.setConfig(undefined);
assertConfig(nullConfig, { icon: "mdi:gesture-tap-button", title: "Section label" }, "undefined config must preserve defaults");

const explicitValues = new Card();
explicitValues.setConfig({ icon: undefined, title: null });
assert.equal(explicitValues.c.icon, undefined, "explicit undefined must override the icon default");
assert.equal(explicitValues.c.title, null, "explicit null must override the title default");
assert.equal(explicitValues.shadowRoot.innerHTML, expectedMarkup("", ""), "nullish explicit values must escape to empty text");
explicitValues.setConfig({ icon: 0, title: false });
assert.equal(explicitValues.shadowRoot.innerHTML, expectedMarkup("0", "false"), "zero and false must remain visible after escaping");

const escaped = new Card();
escaped.setConfig({ icon: 'mdi:<&"\'', title: '<&"\'' });
assert.equal(escaped.shadowRoot.innerHTML, expectedMarkup("mdi:&lt;&amp;&quot;&#39;", "&lt;&amp;&quot;&#39;"), "icon attributes and text content must use inherited HTML escaping");

const beforeHassMarkup = escaped.shadowRoot.innerHTML;
const beforeHassConfig = escaped.c;
escaped.hass = { states: { "sensor.example": {} } };
assert.equal(escaped.c, beforeHassConfig, "the inherited hass setter must not store configuration state");
assert.equal(escaped.shadowRoot.innerHTML, beforeHassMarkup, "the inherited hass setter must not render");
assert.equal(typeof escaped.connectedCallback, "undefined", "connection state must require no rebind hook");
assert.equal(typeof escaped.disconnectedCallback, "undefined", "disconnection state must require no cleanup hook");
assert.equal(escaped.shadowRoot.innerHTML, beforeHassMarkup, "disconnect/reconnect absence must retain the existing DOM and configuration");

console.log("Section separator check passed: metadata, legacy c shape, exact markup, escaping, inherited base behaviour and lifecycle-free reconnect semantics");
