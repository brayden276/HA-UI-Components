import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/progress-target.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);

class MockElement {}

class MockShadowRoot {
  innerHTML = "";

  querySelector(selector) {
    return selector === ".wrap" ? new MockElement() : null;
  }
}

class MockHTMLElement {
  attachShadow(options) {
    assert.equal(options?.mode, "open", "the Progress card must attach an open shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "the Progress shadow root options must remain exact");
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

vm.runInNewContext(source, context, { filename: "src/components/progress-target.js" });

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
    type: "component-progress-v2",
    element: "ComponentProgressV2",
    name: "Progress / Target",
    description: "Reusable progress and target component.",
    preview: true,
  },
  "the Progress registration metadata must remain exact",
);
assert.equal(customElements.get(registration.type), registration.element, "the Progress card must remain registered");
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "registration must install the shared editor and stub contract");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-progress-v2" }, "the shared stub contract must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-progress-v2" }, "the shared editor contract must remain available");

const Card = registration.element;
assert.deepEqual(
  Object.getOwnPropertyNames(Card.prototype).sort(),
  ["action", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "r", "setConfig"],
  "the Progress prototype surface must remain exact",
);
const hassDescriptor = Object.getOwnPropertyDescriptor(Card.prototype, "hass");
assert.equal(typeof hassDescriptor?.set, "function", "hass must remain a setter");
assert.equal(hassDescriptor.set.length, 1, "hass must retain its single-argument setter contract");
assert.equal(hassDescriptor.get, undefined, "hass must not expose a getter");
assert.equal(hassDescriptor.enumerable, false, "hass must remain non-enumerable");
assert.equal(hassDescriptor.configurable, true, "hass must remain configurable");
assert.equal(source.includes("Math.min(100, Math.max(0, Number(this.c.progress) || 0))"), true, "Progress must retain its exact numeric calculation");

const expectedMarkup = (config) => {
  const progress = Math.min(100, Math.max(0, Number(config.progress) || 0));
  const actionable = config.navigation_path || config.entity;
  return `<style>.shared-card{}.wrap{padding:12px 14px;min-height:78px}.head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color)}.target{text-align:right;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap}.target b{font-weight:600;color:var(--primary-text-color)}.track{height:5px;margin-top:11px;border-radius:999px;background:var(--secondary-background-color);overflow:hidden}.fill{height:100%;border-radius:inherit;background:var(--primary-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.target{font-size:11px}}</style><style>.wrap.actionable{cursor:pointer}.wrap.actionable:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}</style><ha-card><div class="wrap ${actionable ? "actionable" : ""}" ${actionable ? 'role="button" tabindex="0"' : ""}><div class="head"><div><div class="value">${escapeHtml(config.value)}</div><div class="label">${escapeHtml(config.label)}</div></div><div class="target"><b>${escapeHtml(config.target_value)}</b> ${escapeHtml(config.target_label)}</div></div><div class="track"><div class="fill" style="width:${progress}%"></div></div></div></ha-card>`;
};
const assertConfig = (card, expected, message) => {
  assert.deepEqual(Object.keys(card.c), Object.keys(expected), `${message}: key order`);
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(card.c[key], value, `${message}: ${key}`);
  }
};

const unconfigured = new Card();
assert.deepEqual(Object.keys(unconfigured), ["shadowRoot", "_interaction"], "the constructor must retain only its open root and enumerable interaction field");
const interactionDescriptor = Object.getOwnPropertyDescriptor(unconfigured, "_interaction");
assert.deepEqual(
  {
    value: interactionDescriptor.value,
    writable: interactionDescriptor.writable,
    enumerable: interactionDescriptor.enumerable,
    configurable: interactionDescriptor.configurable,
  },
  { value: null, writable: true, enumerable: true, configurable: true },
  "_interaction must remain a normal enumerable own field",
);
assert.equal(unconfigured.shadowRoot.innerHTML, "", "the constructor must not render before configuration");
assert.throws(() => unconfigured.r(), (error) => error?.name === "TypeError", "direct r before configuration must retain its failure surface");
unconfigured.connectedCallback();
unconfigured.disconnectedCallback();
unconfigured.disconnectedCallback();
assert.equal(unconfigured._interaction, null, "unconfigured reconnect and repeated disconnect must be harmless no-ops");

const defaults = new Card();
defaults.setConfig({});
assertConfig(defaults, {
  value: "68%",
  label: "Progress metric",
  progress: 68,
  target_value: "100%",
  target_label: "Target",
  entity: null,
  navigation_path: null,
}, "defaults");
assert.equal(defaults.getCardSize(), 2, "the card size must remain two");
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup(defaults.c), "default configuration must synchronously produce the exact static DOM and CSS");
const configDescriptor = Object.getOwnPropertyDescriptor(defaults, "c");
assert.deepEqual(
  {
    value: configDescriptor.value,
    writable: configDescriptor.writable,
    enumerable: configDescriptor.enumerable,
    configurable: configDescriptor.configurable,
  },
  { value: defaults.c, writable: true, enumerable: true, configurable: true },
  "c must remain a normal enumerable own field",
);
const hass = { states: { "sensor.progress": {} } };
defaults.hass = hass;
assert.equal(defaults.h, hass, "the hass setter must retain the exact hass reference as h");
const hassValueDescriptor = Object.getOwnPropertyDescriptor(defaults, "h");
assert.deepEqual(
  {
    value: hassValueDescriptor.value,
    writable: hassValueDescriptor.writable,
    enumerable: hassValueDescriptor.enumerable,
    configurable: hassValueDescriptor.configurable,
  },
  { value: hass, writable: true, enumerable: true, configurable: true },
  "h must remain a normal enumerable own field",
);
assert.equal("config" in defaults, false, "the card must not expose a config alias");
assert.equal("render" in defaults, false, "the card must not expose a render alias");

defaults.setConfig({ value: "Old value", retained: "discarded" });
const replaced = defaults.c;
defaults.setConfig({ label: "Replacement" });
assertConfig(defaults, {
  value: "68%",
  label: "Replacement",
  progress: 68,
  target_value: "100%",
  target_label: "Target",
  entity: null,
  navigation_path: null,
}, "replacement config");
assert.notEqual(defaults.c, replaced, "each setConfig call must replace c rather than retain stale keys");
for (const input of [null, undefined, 0, false]) {
  const card = new Card();
  card.setConfig(input);
  assertConfig(card, {
    value: "68%",
    label: "Progress metric",
    progress: 68,
    target_value: "100%",
    target_label: "Target",
    entity: null,
    navigation_path: null,
  }, `native spread with ${String(input)}`);
}
const primitive = new Card();
primitive.setConfig("xy");
assert.deepEqual(Object.keys(primitive.c), ["0", "1", "value", "label", "progress", "target_value", "target_label", "entity", "navigation_path"], "primitive config must retain native object-spread keys before defaults");
assert.equal(primitive.c[0], "x", "primitive config must retain native object-spread values");
const explicit = new Card();
explicit.setConfig({ value: null, label: false, progress: "15", target_value: undefined, target_label: 0, arbitrary: "preserved" });
assert.equal(explicit.c.value, null, "explicit null must override the display value default");
assert.equal(explicit.c.label, false, "explicit false must override the label default");
assert.equal(explicit.c.target_value, undefined, "explicit undefined must override the target default");
assert.equal(explicit.c.target_label, 0, "explicit zero must override the target label default");
assert.equal(explicit.c.arbitrary, "preserved", "unknown config values must be preserved");
assert.equal(explicit.shadowRoot.innerHTML, expectedMarkup(explicit.c), "nullish display values and string progress must retain exact markup");

const escaped = new Card();
escaped.setConfig({ value: '<&"\'', label: '<&"\'', target_value: '<&"\'', target_label: '<&"\'' });
assert.equal(escaped.shadowRoot.innerHTML, expectedMarkup(escaped.c), "all Progress text content must retain shared HTML escaping");

const delegatedRender = new Card();
let delegatedRenderCalls = 0;
delegatedRender.r = function r() {
  delegatedRenderCalls += 1;
  return Card.prototype.r.call(this);
};
delegatedRender.setConfig({ label: "Delegated render" });
assert.equal(delegatedRenderCalls, 1, "setConfig must dynamically dispatch through the public r method exactly once");

for (const [progress, width] of [["25", 25], [-1, 0], [101, 100], [NaN, 0], [null, 0], [false, 0], [true, 1], [Infinity, 100], [-Infinity, 0], [[], 0], [[23], 23], [[23, 24], 0], [{ valueOf: () => 34 }, 34]]) {
  const card = new Card();
  card.setConfig({ progress, value: "Display stays independent" });
  assert.equal(card.shadowRoot.innerHTML, expectedMarkup(card.c), `progress ${String(progress)} must retain exact markup`);
  assert.equal(card.shadowRoot.innerHTML.includes(`style="width:${width}%"`), true, `progress ${String(progress)} must retain the expected fill width`);
  assert.equal(card.shadowRoot.innerHTML.includes("Display stays independent"), true, "display value must remain independent from progress calculation");
}

const throwingProgress = new Card();
throwingProgress.setConfig({ entity: "sensor.progress" });
const throwingHandle = throwingProgress._interaction;
const markupBeforeProgressThrow = throwingProgress.shadowRoot.innerHTML;
throwingProgress.c.progress = Symbol("progress");
assert.throws(() => throwingProgress.r(), (error) => error?.name === "TypeError", "Symbol progress must retain Number conversion failure");
assert.equal(throwingHandle.destroyed, true, "numeric conversion failure must retain prior interaction teardown timing");
assert.equal(throwingProgress._interaction, null, "numeric conversion failure must release the owned interaction before throwing");
assert.equal(throwingProgress.shadowRoot.innerHTML, markupBeforeProgressThrow, "numeric conversion failure must not replace existing DOM before throwing");

const path = { arbitrary: "navigation path" };
const navigable = new Card();
navigable.setConfig({ navigation_path: path, entity: { ignored: true } });
const navigationHandle = navigable._interaction;
assert.equal(navigable.shadowRoot.innerHTML, expectedMarkup(navigable.c), "actionable Progress cards must retain exact DOM, whitespace and ARIA");
assert.deepEqual(Object.keys(navigationHandle.options), ["primary", "feedback"], "shared interaction options must contain only primary and feedback:true");
assert.equal(navigationHandle.options.feedback, true, "shared interaction options must retain feedback:true");
assert.equal(navigationHandle.element instanceof MockElement, true, "the shared interaction must bind the rendered wrap div");
const changedPath = { arbitrary: "changed path" };
navigable.c = { ...navigable.c, navigation_path: changedPath };
navigationHandle.invoke();
assert.equal(navigations.at(-1), changedPath, "navigation actions must read the current c value when invoked");
const moreInfoBeforeNavigationClosure = moreInfoRequests.length;
navigable.c = { ...navigable.c, navigation_path: 0, entity: { nowAvailable: true } };
navigationHandle.invoke();
assert.equal(navigations.at(-1), 0, "a navigation-created action must retain its branch while reading the current path");
assert.equal(moreInfoRequests.length, moreInfoBeforeNavigationClosure, "a navigation-created action must not switch to More Info after configuration changes");

const entity = { arbitrary: "entity" };
const moreInfo = new Card();
moreInfo.setConfig({ entity });
const moreInfoHandle = moreInfo._interaction;
const changedEntity = { arbitrary: "changed entity" };
const navigationsBeforeMoreInfoClosure = navigations.length;
moreInfo.c = { ...moreInfo.c, navigation_path: { nowAvailable: true }, entity: changedEntity };
moreInfoHandle.invoke();
assert.deepEqual(moreInfoRequests.at(-1), [moreInfo, changedEntity], "More Info actions must pass the current arbitrary entity through unchanged");
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
assert.equal(overriddenPrimaryCalls, 1, "r must bind the action returned by the overridden action method");
actionOverride.r();
assert.equal(actionOverrideCalls, 2, "direct r calls must retain dynamic action dispatch");
assert.equal(firstOverrideHandle.destroyed, true, "re-rendering an overridden action must destroy its previous interaction");
actionOverride._interaction.invoke();
assert.equal(overriddenPrimaryCalls, 2, "the re-rendered overridden action must remain bound");

const firstHandle = navigable._interaction;
navigable.r();
assert.equal(firstHandle.destroyed, true, "r must destroy the prior interaction before replacing DOM");
assert.equal(firstHandle.destroyCalls, 1, "r must destroy the prior interaction exactly once");
assert.notEqual(navigable._interaction, firstHandle, "r must bind one fresh interaction for actionable configuration");
const secondHandle = navigable._interaction;
navigable.disconnectedCallback();
assert.equal(secondHandle.destroyed, true, "disconnect must destroy the active interaction");
assert.equal(secondHandle.destroyCalls, 1, "disconnect must destroy the active interaction exactly once");
assert.equal(navigable._interaction, null, "disconnect must release the active interaction handle");
navigable.disconnectedCallback();
assert.equal(secondHandle.destroyCalls, 1, "repeated disconnect must not destroy an already released interaction again");

const originalDisconnect = Card.prototype.disconnectedCallback;
vm.runInNewContext(runtimeReliability, context, { filename: "src/patches/runtime-reliability.js" });
await Promise.resolve();
await Promise.resolve();
assert.equal(Card.prototype.disconnectedCallback, originalDisconnect, "the runtime patch must not override Progress disconnect ownership");
assert.equal(runtimeReliability.includes('"component-progress-v2"'), false, "the stale Progress retained-interaction patch must be removed");
navigable.connectedCallback();
assert.notEqual(navigable._interaction, secondHandle, "reconnect after the real runtime patch must bind a fresh interaction");
assert.equal(navigable._interaction.destroyed, false, "the rebound interaction must remain live");

console.log("Progress check passed: metadata/editor/stub, exact public surface, native config and numeric semantics, exact DOM, dynamic actions, and owned interaction lifecycle");
