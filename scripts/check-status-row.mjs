import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { publicComponentContracts, publicComponents } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability, manifestText] = await Promise.all([
  readFile(resolve(root, "src/components/status-row.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
  readFile(resolve(root, "src/bundle-manifest.json"), "utf8"),
]);
const manifest = JSON.parse(manifestText);

class MockElement {}

class MockShadowRoot {
  innerHTML = "";

  querySelector(selector) {
    return selector === "button.demo" ? new MockElement() : null;
  }
}

class MockHTMLElement {
  attachShadow(options) {
    assert.equal(options?.mode, "open", "the Status Row must attach an open shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "the Status Row shadow root options must remain exact");
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
  whenDefined() {
    return Promise.resolve();
  },
};
const registrations = [];
const installedContracts = [];
const navigations = [];
const moreInfoRequests = [];
const escapeHtml = (value) => (value == null ? "" : String(value))
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const shared = {
  PRESENTATIONAL_CARD_STYLES: ".shared-card{}",
  escapeHtml,
  installConfigContract(type, element) {
    installedContracts.push([type, element]);
    element.getStubConfig ??= () => ({ type: `custom:${type}` });
    element.getConfigElement ??= async () => ({ cardType: type });
  },
  interaction(element, options) {
    const handle = {
      destroyCalls: 0,
      destroyed: false,
      element,
      options,
      destroy() {
        this.destroyCalls += 1;
        this.destroyed = true;
      },
      invoke() {
        return options.primary();
      },
    };
    return handle;
  },
  navigateTo(path) {
    navigations.push(path);
  },
  openMoreInfo(host, entity) {
    moreInfoRequests.push([host, entity]);
  },
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

vm.runInNewContext(source, context, { filename: "src/components/status-row.js" });

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
    type: "component-status-row-v2",
    element: "ComponentStatusRowV2",
    name: "Status Row",
    description: "Reusable status row component.",
    preview: true,
  },
  "the Status Row registration metadata must remain exact",
);
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "registration must install the shared editor and stub contract");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-status-row-v2" }, "the shared stub contract must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-status-row-v2" }, "the shared editor contract must remain available");
assert.deepEqual(
  publicComponents.filter(([file]) => file === "src/components/status-row.js"),
  [["src/components/status-row.js", "component-status-row-v2", "ComponentStatusRowV2"]],
  "the public component inventory must retain the exact Status Row tuple",
);
assert.deepEqual(
  publicComponentContracts["src/components/status-row.js"],
  { category: "entity-aware", interaction: "shared-optional" },
  "the public component classification must remain entity-aware with optional shared interaction",
);
assert.deepEqual(
  manifest.find(({ file }) => file === "src/components/status-row.js"),
  { order: 25, file: "src/components/status-row.js" },
  "the authoritative bundle manifest must retain Status Row at order 25",
);

const Card = registration.element;
assert.deepEqual(
  Object.getOwnPropertyNames(Card.prototype).sort(),
  ["action", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "r", "setConfig"],
  "the Status Row prototype surface must remain exact",
);
const assertMethod = (name, length) => {
  const descriptor = Object.getOwnPropertyDescriptor(Card.prototype, name);
  assert.equal(typeof descriptor?.value, "function", `${name} must remain a prototype method`);
  assert.equal(descriptor.value, Card.prototype[name], `${name} must retain its native method value`);
  assert.equal(descriptor.value.length, length, `${name} must retain its public arity`);
  assert.deepEqual(
    { writable: descriptor.writable, enumerable: descriptor.enumerable, configurable: descriptor.configurable },
    { writable: true, enumerable: false, configurable: true },
    `${name} must retain native class-method descriptor flags`,
  );
};
for (const [name, length] of [["constructor", 0], ["setConfig", 1], ["connectedCallback", 0], ["disconnectedCallback", 0], ["getCardSize", 0], ["action", 0], ["r", 0]]) {
  assertMethod(name, length);
}
const hassDescriptor = Object.getOwnPropertyDescriptor(Card.prototype, "hass");
assert.equal(typeof hassDescriptor?.set, "function", "hass must remain a setter");
assert.equal(hassDescriptor.set.length, 1, "hass must retain its single-argument setter contract");
assert.equal(hassDescriptor.get, undefined, "hass must not expose a getter");
assert.equal(hassDescriptor.enumerable, false, "hass must remain non-enumerable");
assert.equal(hassDescriptor.configurable, true, "hass must remain configurable");

const expectedMarkup = (config) => {
  const action = config.interactive !== false && (config.navigation_path || config.entity);
  const tag = action ? "button" : "div";
  const className = action ? "demo" : "demo-static";
  const attrs = action ? ' type="button"' : "";
  return `<style>.shared-card{}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status{text-align:right;white-space:nowrap}.status b{display:block;font-size:12px;font-weight:650}.status span{display:block;margin-top:3px;font-size:10.5px;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(config.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(config.title)}</div><div class="desc">${escapeHtml(config.description)}</div></div><div class="status"><b>${escapeHtml(config.status_value)}</b><span>${escapeHtml(config.status_label)}</span></div></div></${tag}></ha-card>`;
};
const expectedDefaults = {
  title: "Status title",
  description: "Supporting description",
  status_value: "Active",
  status_label: "Current state",
  icon: "mdi:information-outline",
  interactive: true,
  entity: null,
  navigation_path: null,
};
const assertConfig = (card, expected, message) => {
  assert.deepEqual(Object.keys(card.c), Object.keys(expected), `${message}: key order`);
  for (const [key, value] of Object.entries(expected)) assert.equal(card.c[key], value, `${message}: ${key}`);
};

const unconfigured = new Card();
assert.deepEqual(Object.keys(unconfigured), ["shadowRoot", "_interaction"], "the constructor must retain only its open root and enumerable interaction field");
assert.deepEqual(Object.getOwnPropertyDescriptor(unconfigured, "_interaction"), {
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
}, "_interaction must remain a normal enumerable own field");
assert.equal(unconfigured.shadowRoot.innerHTML, "", "the constructor must not render before configuration");
assert.throws(() => unconfigured.r(), (error) => error?.name === "TypeError", "direct r before configuration must retain its failure surface");
unconfigured.connectedCallback();
unconfigured.disconnectedCallback();
unconfigured.disconnectedCallback();

const defaults = new Card();
defaults.setConfig({});
assertConfig(defaults, expectedDefaults, "defaults");
assert.equal(defaults.getCardSize(), 2, "the card size must remain two");
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup(defaults.c), "defaults must synchronously produce the exact static DOM and CSS");
assert.deepEqual(Object.getOwnPropertyDescriptor(defaults, "c"), {
  value: defaults.c,
  writable: true,
  enumerable: true,
  configurable: true,
}, "c must remain a normal enumerable own field");

const hass = { states: { "sensor.status": { state: "ignored" } } };
defaults.hass = hass;
assert.equal(defaults.h, hass, "the hass setter must retain the exact hass reference as h");
assert.deepEqual(Object.getOwnPropertyDescriptor(defaults, "h"), {
  value: hass,
  writable: true,
  enumerable: true,
  configurable: true,
}, "h must remain a normal enumerable own field");

defaults.setConfig({ title: "Old value", retained: "discarded" });
const replaced = defaults.c;
defaults.setConfig({ icon: "mdi:replacement" });
assertConfig(defaults, { ...expectedDefaults, icon: "mdi:replacement" }, "replacement config");
assert.notEqual(defaults.c, replaced, "each setConfig call must replace c rather than retain stale keys");
for (const input of [null, undefined, 0, false]) {
  const card = new Card();
  card.setConfig(input);
  assertConfig(card, expectedDefaults, `native spread with ${String(input)}`);
}
const primitive = new Card();
primitive.setConfig("xy");
assert.deepEqual(Object.keys(primitive.c), ["0", "1", ...Object.keys(expectedDefaults)], "primitive config must retain native object-spread keys before defaults");
assert.equal(primitive.c[0], "x", "primitive config must retain native object-spread values");

const explicit = new Card();
explicit.setConfig({
  title: null,
  description: false,
  status_value: 0,
  status_label: undefined,
  icon: null,
  interactive: false,
  entity: 0,
  navigation_path: false,
});
for (const [key, value] of Object.entries({
  title: null,
  description: false,
  status_value: 0,
  status_label: undefined,
  icon: null,
  interactive: false,
  entity: 0,
  navigation_path: false,
})) assert.equal(explicit.c[key], value, `explicit ${key} must override its default without coercion`);
assert.equal(explicit.shadowRoot.innerHTML, expectedMarkup(explicit.c), "nullish and falsey display overrides must retain exact static markup");

const spreadFailure = new Card();
spreadFailure.setConfig({ entity: "sensor.status" });
const cBeforeSpreadFailure = spreadFailure.c;
const markupBeforeSpreadFailure = spreadFailure.shadowRoot.innerHTML;
const interactionBeforeSpreadFailure = spreadFailure._interaction;
const spreadError = new Error("spread failed");
assert.throws(
  () => spreadFailure.setConfig(new Proxy({}, { ownKeys() { throw spreadError; } })),
  (error) => error === spreadError,
  "spread failures must retain their original error",
);
assert.equal(spreadFailure.c, cBeforeSpreadFailure, "a spread failure must leave c at its prior reference");
assert.equal(spreadFailure.shadowRoot.innerHTML, markupBeforeSpreadFailure, "a spread failure must not replace the prior DOM");
assert.equal(spreadFailure._interaction, interactionBeforeSpreadFailure, "a spread failure must retain the active interaction");
assert.equal(interactionBeforeSpreadFailure.destroyed, false, "a spread failure must occur before interaction teardown");

const direct = new Card();
direct.hass = new Proxy({}, { get() { throw new Error("Status Row must not derive display fields from hass"); } });
direct.setConfig({
  title: '<&"\'',
  description: '<&"\'',
  status_value: '<&"\'',
  status_label: '<&"\'',
  icon: '<&"\'',
  tone: "error",
  active: false,
  arbitrary: "preserved",
});
assert.equal(direct.c.arbitrary, "preserved", "unknown config values must be preserved");
assert.equal(direct.shadowRoot.innerHTML, expectedMarkup(direct.c), "all display fields must be direct escaped configuration, without status, tone or active derivation");
assert.equal(direct.shadowRoot.innerHTML.includes("error"), false, "tone must not affect the Status Row markup");

const disabled = new Card();
disabled.setConfig({ interactive: false, navigation_path: "/ignored", entity: "sensor.ignored" });
assert.equal(disabled.shadowRoot.innerHTML, expectedMarkup(disabled.c), "literal interactive false must retain static div markup");
assert.equal(disabled._interaction, null, "literal interactive false must suppress configured actions");
const falseyInteractive = new Card();
falseyInteractive.setConfig({ interactive: 0, entity: "sensor.status" });
assert.equal(falseyInteractive._interaction !== null, true, "only literal false may suppress interactions");
assert.equal(falseyInteractive.shadowRoot.innerHTML.includes('<button class="demo" type="button">'), true, "actionable rows must retain button semantics");

const path = { arbitrary: "navigation path" };
const navigable = new Card();
navigable.setConfig({ navigation_path: path, entity: { ignored: true } });
const navigationHandle = navigable._interaction;
assert.equal(navigable.shadowRoot.innerHTML, expectedMarkup(navigable.c), "actionable rows must retain exact button markup and CSS");
assert.deepEqual(Object.keys(navigationHandle.options), ["primary", "feedback"], "shared interaction options must contain only primary and feedback:true");
assert.equal(navigationHandle.options.feedback, true, "shared interaction feedback must remain enabled");
assert.equal(navigationHandle.element instanceof MockElement, true, "shared interaction must bind the rendered button");
const changedPath = { arbitrary: "changed path" };
navigable.c = { ...navigable.c, navigation_path: changedPath };
navigationHandle.invoke();
assert.equal(navigations.at(-1), changedPath, "navigation actions must read the current path when invoked");
navigable.c = { ...navigable.c, navigation_path: 0, entity: { nowAvailable: true } };
navigationHandle.invoke();
assert.equal(navigations.at(-1), 0, "a navigation-created action must retain its branch while reading the current path");
assert.deepEqual(moreInfoRequests, [], "truthy navigation paths must take precedence over entities");

const moreInfo = new Card();
moreInfo.setConfig({ entity: { arbitrary: "entity" } });
const moreInfoHandle = moreInfo._interaction;
const changedEntity = { arbitrary: "changed entity" };
moreInfo.c = { ...moreInfo.c, navigation_path: { nowAvailable: true }, entity: changedEntity };
const navigationsBeforeMoreInfoClosure = navigations.length;
moreInfoHandle.invoke();
assert.deepEqual(moreInfoRequests.at(-1), [moreInfo, changedEntity], "More Info actions must retain their creation branch and read the current entity");
assert.equal(navigations.length, navigationsBeforeMoreInfoClosure, "a More Info-created action must not switch to navigation after configuration changes");

const actionOverride = new Card();
let actionOverrideCalls = 0;
let overriddenPrimaryCalls = 0;
actionOverride.action = function action() {
  actionOverrideCalls += 1;
  return () => { overriddenPrimaryCalls += 1; };
};
actionOverride.setConfig({});
const firstOverrideHandle = actionOverride._interaction;
assert.equal(actionOverrideCalls, 1, "r must dynamically dispatch through an overridden action method");
firstOverrideHandle.invoke();
assert.equal(overriddenPrimaryCalls, 1, "r must bind and invoke the overridden primary action");
actionOverride.r();
assert.equal(actionOverrideCalls, 2, "direct r calls must retain dynamic overridden action dispatch");
assert.equal(firstOverrideHandle.destroyCalls, 1, "re-rendering an overridden action must destroy the prior interaction");
const secondOverrideHandle = actionOverride._interaction;
assert.notEqual(secondOverrideHandle, firstOverrideHandle, "re-rendering an overridden action must bind a fresh interaction");
secondOverrideHandle.invoke();
assert.equal(overriddenPrimaryCalls, 2, "the rebound overridden action must remain invokable");

const teardown = new Card();
teardown.setConfig({ entity: "sensor.status" });
const firstHandle = teardown._interaction;
teardown.r();
assert.equal(firstHandle.destroyCalls, 1, "re-rendering must destroy the prior interaction exactly once");
const secondHandle = teardown._interaction;
teardown.c = null;
assert.throws(() => teardown.r(), (error) => error?.name === "TypeError", "action selection errors must retain their TypeError surface");
assert.equal(secondHandle.destroyed, true, "action selection failures must retain prior interaction teardown timing");
assert.equal(teardown._interaction, null, "action selection failures must release the owned interaction before throwing");

const coercionFailure = new Card();
coercionFailure.setConfig({ entity: "sensor.status" });
const cBeforeCoercionFailure = coercionFailure.c;
const markupBeforeCoercionFailure = coercionFailure.shadowRoot.innerHTML;
const interactionBeforeCoercionFailure = coercionFailure._interaction;
const coercionError = new Error("display coercion failed");
const throwingDisplay = { toString() { throw coercionError; } };
assert.throws(
  () => coercionFailure.setConfig({ title: throwingDisplay, entity: "sensor.replacement" }),
  (error) => error === coercionError,
  "escaped display coercion failures must retain their original error",
);
assert.notEqual(coercionFailure.c, cBeforeCoercionFailure, "display coercion failures must install the replacement c object before rendering");
assert.equal(coercionFailure.c.title, throwingDisplay, "display coercion failures must retain the new direct display value");
assert.equal(interactionBeforeCoercionFailure.destroyed, true, "display coercion failures must destroy the prior active interaction");
assert.equal(coercionFailure._interaction, null, "display coercion failures must release the owned interaction before throwing");
assert.equal(coercionFailure.shadowRoot.innerHTML, markupBeforeCoercionFailure, "display coercion failures must leave the prior DOM in place");

const lifecycle = new Card();
lifecycle.setConfig({ entity: "sensor.status" });
const lifecycleHandle = lifecycle._interaction;
lifecycle.disconnectedCallback();
assert.equal(lifecycleHandle.destroyCalls, 1, "disconnect must destroy the active interaction exactly once");
assert.equal(lifecycle._interaction, null, "disconnect must release the active interaction handle");
lifecycle.disconnectedCallback();
assert.equal(lifecycleHandle.destroyCalls, 1, "repeated disconnect must not destroy an already released interaction again");
const originalDisconnect = Card.prototype.disconnectedCallback;
vm.runInNewContext(runtimeReliability, context, { filename: "src/patches/runtime-reliability.js" });
await Promise.resolve();
await Promise.resolve();
assert.equal(Card.prototype.disconnectedCallback, originalDisconnect, "the runtime patch must not override Status Row disconnect ownership");
assert.equal(runtimeReliability.includes('"component-status-row-v2"'), false, "the stale Status Row retained-interaction patch must be removed");
lifecycle.connectedCallback();
assert.equal(lifecycle._interaction?.destroyed, false, "reconnect must bind a fresh live interaction");

console.log("Status Row check passed: exact public surface, direct display config, native replacement, static/button actions, dynamic closures, and owned interaction lifecycle");
