import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/notice.js"), "utf8"),
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
    assert.equal(options?.mode, "open", "the Notice card must attach an open shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "the Notice shadow root options must remain exact");
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
const interactions = [];
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
    interactions.push(handle);
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

vm.runInNewContext(source, context, { filename: "src/components/notice.js" });

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
    type: "component-notice-v2",
    element: "ComponentNoticeV2",
    name: "Alert / Notice",
    description: "Reusable alert and notice component.",
    preview: true,
  },
  "the Notice registration metadata must remain exact",
);
assert.equal(customElements.get(registration.type), registration.element, "the Notice card must remain registered");
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "registration must install the shared editor and stub contract");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-notice-v2" }, "the shared stub contract must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-notice-v2" }, "the shared editor contract must remain available");

const Card = registration.element;
assert.deepEqual(
  Object.getOwnPropertyNames(Card.prototype).sort(),
  ["action", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "r", "setConfig"],
  "the Notice prototype surface must remain exact",
);
const hassDescriptor = Object.getOwnPropertyDescriptor(Card.prototype, "hass");
assert.equal(typeof hassDescriptor?.set, "function", "hass must remain a setter");
assert.equal(hassDescriptor.set.length, 1, "hass must retain its single-argument setter contract");
assert.equal(hassDescriptor.get, undefined, "hass must not expose a getter");
assert.equal(hassDescriptor.enumerable, false, "hass must remain non-enumerable");
assert.equal(hassDescriptor.configurable, true, "hass must remain configurable");

const expectedMarkup = (config) => {
  const tone = ["warning", "error", "success"].includes(config.tone) ? config.tone : "";
  const actionable = config.navigation_path || config.entity ? "actionable" : "";
  const attributes = actionable ? 'role="button" tabindex="0"' : "";
  return `<style>.shared-card{}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}.warning .icon{color:var(--warning-color,var(--primary-color))}.error .icon{color:var(--error-color,var(--primary-color))}.success .icon{color:var(--success-color,var(--primary-color))}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650}.message{margin-top:3px;font-size:10.5px;line-height:1.35;color:var(--secondary-text-color)}</style><style>.wrap.actionable{cursor:pointer}.wrap.actionable:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}</style><ha-card><div class="wrap ${tone} ${actionable}" ${attributes}><span class="icon"><ha-icon icon="${escapeHtml(config.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(config.title)}</div><div class="message">${escapeHtml(config.message)}</div></div></div></ha-card>`;
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
assert.throws(
  () => unconfigured.r(),
  (error) => error?.name === "TypeError",
  "direct r before configuration must retain its failure surface",
);
unconfigured.connectedCallback();
unconfigured.disconnectedCallback();
unconfigured.disconnectedCallback();
assert.equal(unconfigured._interaction, null, "unconfigured reconnect and repeated disconnect must be harmless no-ops");

const defaults = new Card();
defaults.setConfig({});
assertConfig(defaults, {
  title: "Notice title",
  message: "Important supporting information appears here.",
  tone: "info",
  icon: "mdi:information-outline",
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
const hass = { states: { "sensor.notice": {} } };
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
  "h must remain a normal enumerable own field");

defaults.setConfig({ title: "Old value", unknown: "discarded" });
const replaced = defaults.c;
defaults.setConfig({ icon: "mdi:replacement" });
assertConfig(defaults, {
  title: "Notice title",
  message: "Important supporting information appears here.",
  tone: "info",
  icon: "mdi:replacement",
  entity: null,
  navigation_path: null,
}, "replacement config");
assert.notEqual(defaults.c, replaced, "each setConfig call must replace c rather than retain stale keys");
for (const input of [null, undefined, 0, false]) {
  const card = new Card();
  card.setConfig(input);
  assertConfig(card, {
    title: "Notice title",
    message: "Important supporting information appears here.",
    tone: "info",
    icon: "mdi:information-outline",
    entity: null,
    navigation_path: null,
  }, `native spread with ${String(input)}`);
}
const primitive = new Card();
primitive.setConfig("xy");
assert.deepEqual(Object.keys(primitive.c), ["0", "1", "title", "message", "tone", "icon", "entity", "navigation_path"], "primitive config must retain native object-spread keys before defaults");
assert.equal(primitive.c[0], "x", "primitive config must retain native object-spread values");
const explicit = new Card();
explicit.setConfig({ icon: undefined, title: null, message: false, tone: "unsupported", arbitrary: "preserved" });
assert.equal(explicit.c.icon, undefined, "explicit undefined must override the icon default");
assert.equal(explicit.c.title, null, "explicit null must override the title default");
assert.equal(explicit.c.message, false, "explicit false must override the message default");
assert.equal(explicit.c.arbitrary, "preserved", "unknown config values must be preserved");
assert.equal(explicit.shadowRoot.innerHTML, expectedMarkup(explicit.c), "unsupported tones must remain unclassified and nullish values must escape to empty text");
assert.equal(explicit.shadowRoot.innerHTML.includes('class="wrap  " >'), true, "static Notices must retain their exact non-actionable div whitespace and ARIA-free markup");
for (const tone of ["warning", "error", "success", "info", null, "WARNING"]) {
  const card = new Card();
  card.setConfig({ tone });
  assert.equal(card.shadowRoot.innerHTML, expectedMarkup(card.c), `tone ${String(tone)} must retain the established supported-tone rendering contract`);
}

const delegatedRender = new Card();
let delegatedRenderCalls = 0;
delegatedRender.r = function r() {
  delegatedRenderCalls += 1;
  return Card.prototype.r.call(this);
};
delegatedRender.setConfig({ title: "Delegated render" });
assert.equal(delegatedRenderCalls, 1, "setConfig must dynamically dispatch through the public r method exactly once");

const path = { arbitrary: "navigation path" };
const navigable = new Card();
navigable.setConfig({ tone: "warning", navigation_path: path, entity: { ignored: true } });
const navigationHandle = navigable._interaction;
assert.equal(navigable.shadowRoot.innerHTML, expectedMarkup(navigable.c), "actionable Notices must retain exact DOM, CSS, whitespace and ARIA");
assert.deepEqual(Object.keys(navigationHandle.options), ["primary", "feedback"], "shared interaction options must contain only primary and feedback:true");
assert.equal(navigationHandle.options.feedback, true, "shared interaction options must retain feedback:true");
assert.equal(typeof navigationHandle.options.primary, "function", "actionable Notices must provide a primary action");
assert.equal(navigationHandle.element instanceof MockElement, true, "the shared interaction must bind the rendered wrap div");
const changedPath = { arbitrary: "changed path" };
navigable.c = { ...navigable.c, navigation_path: changedPath };
navigationHandle.invoke();
assert.equal(navigations.at(-1), changedPath, "navigation action closures must read the current c value when invoked");
assert.deepEqual(moreInfoRequests, [], "truthy navigation paths must take precedence over entities");
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
assert.deepEqual(moreInfoRequests.at(-1), [moreInfo, changedEntity], "More Info action closures must pass the current arbitrary entity through unchanged");
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
assert.equal(firstOverrideHandle.options.feedback, true, "an overridden action must retain shared interaction feedback");
firstOverrideHandle.invoke();
assert.equal(overriddenPrimaryCalls, 1, "r must bind and use the action returned by the overridden action method");
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
assert.equal(Card.prototype.disconnectedCallback, originalDisconnect, "the runtime patch must not override Notice disconnect ownership");
assert.equal(runtimeReliability.includes('"component-notice-v2"'), false, "the stale Notice retained-interaction patch must be removed");
navigable.connectedCallback();
assert.notEqual(navigable._interaction, secondHandle, "reconnect after the real runtime patch must bind a fresh interaction");
assert.equal(navigable._interaction.destroyed, false, "the rebound interaction must remain live");

console.log("Notice check passed: metadata/editor/stub, exact public surface, native config semantics, static/actionable DOM, current action dispatch, and owned interaction lifecycle");
