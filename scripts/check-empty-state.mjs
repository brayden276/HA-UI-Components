import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (file) => readFile(resolve(root, file), "utf8");
const [coreSource, updateStylesSource, configEditorSource, componentSource] = await Promise.all([
  readSource("src/shared/core.js"),
  readSource("src/shared/update-styles.js"),
  readSource("src/support/config-editor.js"),
  readSource("src/components/empty-state.js"),
]);

class MockShadowRoot {
  innerHTML = "";

  querySelector(selector) {
    if (selector === "textarea") return new MockElement();
    if (selector === ".error") return new MockElement();
    return null;
  }
}

class MockElement {
  addEventListener() {}
}

class MockHTMLElement {
  constructor() {
    this.attachShadowCalls = [];
  }

  attachShadow(options) {
    if (this.shadowRoot) throw new Error("Shadow root already attached");
    this.attachShadowCalls.push(options);
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
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
const context = {
  HTMLElement: MockHTMLElement,
  customElements,
  window: { customCards: [] },
  document: {
    createElement(type) {
      const Element = customElements.get(type);
      return Element ? new Element() : new MockElement();
    },
  },
};
context.globalThis = context;

const completeOwnObject = (value) => Object.fromEntries(
  Reflect.ownKeys(value).map((key) => [key, value[key]]),
);

for (const [filename, source] of [
  ["src/shared/core.js", coreSource],
  ["src/shared/update-styles.js", updateStylesSource],
  ["src/support/config-editor.js", configEditorSource],
  ["src/components/empty-state.js", componentSource],
]) {
  vm.runInNewContext(`(() => {\n${source}\n})()`, context, { filename });
}

const type = "component-empty-state-v3";
const Card = customElements.get(type);
assert.equal(typeof Card, "function", "registerCard must define the empty-state card");
assert.equal(context.window.customCards.length, 1, "registerCard must publish one card metadata record");
const registration = context.window.customCards[0];
assert.deepEqual(
  completeOwnObject(registration),
  {
    type,
    name: "Empty State",
    description: "Reusable empty-state component.",
    preview: true,
  },
  "the public registration metadata must remain exact",
);

assert.deepEqual(
  completeOwnObject(Card.getStubConfig()),
  { type: "custom:component-empty-state-v3" },
  "registerCard must install the shared default stub contract",
);
const editor = await Card.getConfigElement();
assert.equal(editor.constructor, customElements.get("ha-component-library-config-editor"), "registerCard must install the shared config editor contract");
assert.equal(editor.cardType, type, "the shared config editor must receive the registered card type");

assert.equal(Object.hasOwn(Card.prototype, "connectedCallback"), false, "the card must not add a connection lifecycle hook");
assert.equal(Object.hasOwn(Card.prototype, "disconnectedCallback"), false, "the card must not add a disconnection lifecycle hook");
assert.equal(Object.hasOwn(Card.prototype, "c"), false, "c must remain instance data rather than a prototype member");

const renderDescriptor = Object.getOwnPropertyDescriptor(Card.prototype, "_render");
assert.equal(typeof renderDescriptor?.value, "function", "_render must remain a public prototype method");
assert.equal(renderDescriptor.writable, true, "_render must remain writable");
assert.equal(renderDescriptor.enumerable, false, "_render must remain non-enumerable");
assert.equal(renderDescriptor.configurable, true, "_render must remain configurable");

const hassDescriptor = Object.getOwnPropertyDescriptor(Card.prototype, "hass");
assert.equal(typeof hassDescriptor?.set, "function", "hass must remain a setter");
assert.equal(hassDescriptor.set.length, 1, "hass must retain its single-argument setter contract");
assert.equal(hassDescriptor.get, undefined, "hass must not expose a getter");
assert.equal(hassDescriptor.enumerable, false, "hass must remain non-enumerable");
assert.equal(hassDescriptor.configurable, true, "hass must remain configurable");

const updateStyles = ":host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}";
const componentStyles = ".wrap{padding:12px 14px;min-height:72px;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.title{font-size:13px;line-height:1.25;font-weight:600}.desc{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}";
const markup = (icon, title, message) => `<style>${updateStyles}${componentStyles}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><div class="title">${title}</div><div class="desc">${message}</div></span></div></ha-card>`;

const card = new Card();
assert.equal(card.shadowRoot instanceof MockShadowRoot, true, "the constructor must synchronously create a shadow root");
assert.deepEqual(
  card.attachShadowCalls.map(completeOwnObject),
  [{ mode: "open" }],
  "the constructor must attach exactly one open shadow root",
);
assert.equal(Object.hasOwn(card, "c"), false, "before setConfig the card must not own c");
assert.equal(card.shadowRoot.innerHTML, "", "the constructor must not render before configuration");
assert.throws(() => card._render(), (error) => error?.name === "TypeError", "direct _render before configuration must retain its current failure surface");
assert.equal(card.getCardSize(), 1, "the card size must remain one");

card.setConfig({});
assert.deepEqual(
  completeOwnObject(card.c),
  {
    icon: "mdi:check-circle-outline",
    title: "Nothing requires attention",
    message: "Supporting empty-state message.",
  },
  "empty configuration must synchronously apply the exact defaults",
);
assert.equal(card.shadowRoot.innerHTML, markup("mdi:check-circle-outline", "Nothing requires attention", "Supporting empty-state message."), "defaults must synchronously render the exact DOM and CSS");
const cDescriptor = Object.getOwnPropertyDescriptor(card, "c");
assert.equal(cDescriptor.value, card.c, "c's own descriptor must retain the assigned object reference");
assert.deepEqual(
  { writable: cDescriptor.writable, enumerable: cDescriptor.enumerable, configurable: cDescriptor.configurable },
  { writable: true, enumerable: true, configurable: true },
  "c must remain a normal own data property",
);

const overrides = { icon: undefined, title: null, message: false, unknownOption: "preserved" };
card.setConfig(overrides);
assert.equal(card.c.icon, undefined, "an explicit undefined icon must override the default through object spread");
assert.equal(card.c.title, null, "an explicit null title must override the default through object spread");
assert.equal(card.c.message, false, "an explicit false message must override the default through object spread");
assert.equal(card.c.unknownOption, "preserved", "unknown configuration keys must be preserved through object spread");
assert.equal(card.shadowRoot.innerHTML, markup("", "", "false"), "nullish values must render via shared escaping while false remains visible");
assert.notEqual(card.c, overrides, "setConfig must assign a new configuration object");

card.setConfig(null);
assert.equal(card.shadowRoot.innerHTML, markup("mdi:check-circle-outline", "Nothing requires attention", "Supporting empty-state message."), "null config must preserve defaults under object spread");
card.setConfig(undefined);
assert.equal(card.shadowRoot.innerHTML, markup("mdi:check-circle-outline", "Nothing requires attention", "Supporting empty-state message."), "undefined config must preserve defaults under object spread");
card.setConfig("xy");
assert.deepEqual(Object.keys(card.c), ["0", "1", "icon", "title", "message"], "primitive config must retain native object-spread keys");
assert.equal(card.c[0], "x", "primitive config must retain native object-spread values");

card.setConfig({ icon: 'mdi:<>&"\'', title: '<>&"\'', message: "<>&\"'" });
assert.equal(card.shadowRoot.innerHTML, markup("mdi:&lt;&gt;&amp;&quot;&#39;", "&lt;&gt;&amp;&quot;&#39;", "&lt;&gt;&amp;&quot;&#39;"), "icon attributes and text must use the shared HTML escaping contract");

const directConfig = { icon: "mdi:refresh", title: "Direct", message: "Rerender" };
card.c = directConfig;
card._render();
assert.equal(card.c, directConfig, "_render must render the current c reference without replacing it");
assert.equal(card.shadowRoot.innerHTML, markup("mdi:refresh", "Direct", "Rerender"), "_render must remain a direct rerender surface");

const delegatedRender = new Card();
let delegatedRenderCalls = 0;
delegatedRender._render = function delegatedRenderSpy() {
  delegatedRenderCalls += 1;
  return Card.prototype._render.call(this);
};
delegatedRender.setConfig({ title: "Delegated render" });
assert.equal(delegatedRenderCalls, 1, "setConfig must dispatch through an overridable instance _render exactly once");
assert.equal(delegatedRender.shadowRoot.innerHTML, markup("mdi:check-circle-outline", "Delegated render", "Supporting empty-state message."), "the delegated _render surface must produce the current configuration DOM");

const beforeHassMarkup = card.shadowRoot.innerHTML;
const beforeHassConfig = card.c;
const beforeHassKeys = Reflect.ownKeys(card);
card.hass = { states: { "sensor.example": {} } };
assert.equal(card.c, beforeHassConfig, "the hass setter must not replace c");
assert.equal(card.shadowRoot.innerHTML, beforeHassMarkup, "the hass setter must not render");
assert.equal(Object.hasOwn(card, "hass"), false, "the hass setter must not retain state on the instance");
assert.deepEqual(Reflect.ownKeys(card), beforeHassKeys, "the hass setter must not add instance state");

console.log("Empty-state check passed: registration, config contract, descriptors, exact rendering, escaping and lifecycle-free no-op behaviour");
