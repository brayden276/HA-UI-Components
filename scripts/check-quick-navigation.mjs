import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/quick-navigation.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);
class MockElement { constructor() { this.disabled = false; } }
class MockShadowRoot {
  #html = "";
  set innerHTML(value) {
    this.#html = value;
    const control = (id) => {
      const element = new MockElement();
      element.disabled = new RegExp(`id="${id}"[^>]*\\sdisabled>`).test(value);
      return element;
    };
    this.elements = new Map([["context", control("context")], ["action-1", control("action-1")], ["action-2", control("action-2")]]);
    if (value.includes('id="context-icon"')) this.elements.set("context-icon", new MockElement());
  }
  get innerHTML() { return this.#html; }
  getElementById(id) { return this.elements?.get(id) ?? null; }
}
class MockHTMLElement {
  attachShadow(options) {
    assert.equal(this.shadowRoot, undefined, "Quick Navigation must attach one shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "Quick Navigation shadow options must remain exact");
    assert.equal(options.mode, "open", "Quick Navigation must use an open shadow root");
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
}
class DashboardBaseCard extends MockHTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  escapeHtml(value) { return escapeHtml(value); }
  cardStyles() { return ".base-card{}"; }
}
const definitions = new Map();
const customElements = { define(type, element) { definitions.set(type, element); }, get(type) { return definitions.get(type); }, whenDefined() { return Promise.resolve(); } };
const registrations = [];
const installedContracts = [];
const navigations = [];
const moreInfo = [];
const escapeHtml = (value) => (value == null ? "" : String(value)).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const shared = {
  DashboardBaseCard,
  interaction(element, options) {
    const handle = { element, options, destroyCalls: 0, destroyed: false, destroy() { this.destroyed = true; this.destroyCalls += 1; }, invoke() { return options.primary?.(); } };
    return handle;
  },
  navigateTo(path) { navigations.push(path); },
  openMoreInfo(host, entity) { moreInfo.push([host, entity]); },
  installConfigContract(type, element) { installedContracts.push([type, element]); element.getStubConfig ??= () => ({ type: `custom:${type}` }); element.getConfigElement ??= async () => ({ cardType: type }); },
  registerCard({ type, element, name, description, preview = true }) { shared.installConfigContract(type, element); customElements.define(type, element); registrations.push({ type, element, name, description, preview }); },
};
const context = { HTMLElement: MockHTMLElement, customElements, __HA_COMPONENT_LIBRARY_SHARED__: shared };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/quick-navigation.js" });
const type = "component-quick-nav-v2";
const Card = customElements.get(type);
assert.equal(registrations.length, 1, "Quick Navigation must register once");
const registration = registrations[0];
assert.deepEqual({ type: registration.type, element: registration.element.name, name: registration.name, description: registration.description, preview: registration.preview }, { type, element: "ComponentQuickNavigationV2", name: "Quick Navigation", description: "Reusable quick navigation component.", preview: true }, "Quick Navigation metadata must remain exact");
assert.deepEqual(installedContracts, [[type, Card]], "Quick Navigation must retain shared config installation");
assert.deepEqual(Card.getStubConfig(), { type: `custom:${type}` }, "Quick Navigation stub must remain exact");
assert.deepEqual(await Card.getConfigElement(), { cardType: type }, "Quick Navigation editor must remain exact");
assert.equal(Object.getPrototypeOf(Card.prototype), DashboardBaseCard.prototype, "Quick Navigation must retain DashboardBaseCard inheritance");
assert.deepEqual(Object.getOwnPropertyNames(Card.prototype).sort(), ["_clearInteractions", "connectedCallback", "constructor", "disconnectedCallback", "formatState", "getCardSize", "hass", "moreInfo", "navigate", "r", "setConfig"], "Quick Navigation prototype surface must remain exact");
assert.equal(Card.prototype.r.length, 0, "Quick Navigation r must retain zero public arguments");

const css = ".wrap{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px}.group{display:flex;align-items:center;gap:8px}.chip{min-height:44px;border:1px solid var(--divider-color)!important;border-radius:var(--dashboard-radius-control,8px);padding:0 13px!important;display:flex;align-items:center;gap:7px;color:var(--primary-text-color);font-size:13px;font-weight:600;white-space:nowrap}.chip ha-icon,.chip ha-state-icon{color:var(--primary-color);--mdc-icon-size:19px}.chip:disabled{cursor:default;opacity:1}@media(max-width:520px){.chip{width:44px;padding:0!important;justify-content:center}.chip span{display:none}.context{width:auto;padding:0 12px!important}.context span{display:inline}}";
const markup = (config, state = null, stateText = null) => {
  const leftText = state ? stateText : config.left_entity ? "Unavailable" : config.left_text;
  const icon = state ? '<ha-state-icon id="context-icon"></ha-state-icon>' : `<ha-icon icon="${escapeHtml(config.left_icon)}"></ha-icon>`;
  const disabled1 = config.action_1_path ? "" : "disabled";
  const disabled2 = config.action_2_path ? "" : "disabled";
  return `<style>.base-card{}${css}</style><ha-card><div class="wrap"><button class="i chip context" id="context" type="button" aria-label="${escapeHtml(config.left_text)}">${icon}<span>${escapeHtml(leftText)}</span></button><div class="group"><button class="i chip" id="action-1" type="button" aria-label="${escapeHtml(config.action_1_text)}" ${disabled1}><ha-icon icon="${escapeHtml(config.action_1_icon)}"></ha-icon><span>${escapeHtml(config.action_1_text)}</span></button><button class="i chip" id="action-2" type="button" aria-label="${escapeHtml(config.action_2_text)}" ${disabled2}><ha-icon icon="${escapeHtml(config.action_2_icon)}"></ha-icon><span>${escapeHtml(config.action_2_text)}</span></button></div></div></ha-card>`;
};
const defaults = { left_icon: "mdi:weather-partly-cloudy", left_text: "Context", left_entity: null, action_1_icon: "mdi:view-dashboard-outline", action_1_text: "Destination", action_1_path: null, action_2_icon: "mdi:cog-outline", action_2_text: "Settings", action_2_path: null };
const card = new Card();
assert.deepEqual(Object.keys(card), ["shadowRoot", "_interactions"], "Quick Navigation constructor fields must remain exact");
card.setConfig({});
assert.deepEqual(Object.keys(card.c), Object.keys(defaults), "Quick Navigation default key order must remain exact");
for (const [key, value] of Object.entries(defaults)) assert.equal(card.c[key], value, `Quick Navigation default ${key} must remain exact`);
assert.equal(card.getCardSize(), 1, "Quick Navigation size must remain one");
assert.equal(card.shadowRoot.innerHTML, markup(card.c), "Quick Navigation static DOM and CSS must remain exact");
assert.equal(card.shadowRoot.getElementById("context").disabled, true, "missing context entity must disable its button");
assert.equal(card.shadowRoot.getElementById("action-1").disabled, true, "missing first action path must disable its button");
assert.equal(card.shadowRoot.getElementById("action-2").disabled, true, "missing second action path must disable its button");
assert.equal(card._interactions.length, 3, "Quick Navigation must retain all three shared interactions");
for (const handle of card._interactions) assert.deepEqual(Object.keys(handle.options), ["primary", "feedback"], "Quick Navigation interactions must retain exact options");
for (const input of [null, undefined, false, 0]) {
  const probe = new Card();
  probe.setConfig(input);
  assert.deepEqual(Object.keys(probe.c), Object.keys(defaults), `native object spread with ${String(input)} must retain defaults`);
}
const stringConfig = new Card();
stringConfig.setConfig("xy");
assert.deepEqual(Object.keys(stringConfig.c), ["0", "1", ...Object.keys(defaults)], "string configuration must retain native object-spread keys");

let formatCalls = 0;
let formatted = "21.0 °C";
const state = { state: "21", attributes: {} };
const live = new Card();
live.setConfig({ left_entity: "sensor.temperature", left_text: "Temperature", action_1_path: "/first", action_2_path: "/second" });
const hass = { states: { "sensor.temperature": state }, formatEntityState() { formatCalls += 1; return formatted; } };
live.hass = hass;
assert.equal(formatCalls, 1, "a Hass update must format live state once before rendering");
assert.equal(live.shadowRoot.innerHTML, markup(live.c, state, formatted), "live state DOM must reuse the resolved formatted snapshot");
const firstLiveHandles = [...live._interactions];
const firstIcon = live.shadowRoot.getElementById("context-icon");
const sameStateHass = { states: { "sensor.temperature": state }, formatEntityState() { formatCalls += 1; return formatted; } };
live.hass = sameStateHass;
assert.equal(formatCalls, 2, "an unchanged Hass update must format state once for cache comparison");
assert.equal(live._interactions[0], firstLiveHandles[0], "unchanged cache input must avoid rerendering interactions");
assert.equal(live.shadowRoot.getElementById("context-icon"), firstIcon, "unchanged cache input must retain the current state icon");
assert.equal(firstIcon.hass, sameStateHass, "unchanged cache input must refresh the icon hass reference");
assert.equal(firstIcon.stateObj, state, "unchanged cache input must refresh the icon state reference");
formatted = "22.0 °C";
live.hass = sameStateHass;
assert.equal(formatCalls, 3, "formatted-state cache changes must still format once");
assert.equal(firstLiveHandles.every((handle) => handle.destroyed), true, "formatted-state changes must rerender and tear down old interactions");
assert.equal(live.shadowRoot.innerHTML, markup(live.c, state, formatted), "formatted-state changes must use the exact supplied snapshot");
const nextState = { state: "23", attributes: {} };
const changedStateHass = { states: { "sensor.temperature": nextState }, formatEntityState() { formatCalls += 1; return "23.0 °C"; } };
live.hass = changedStateHass;
assert.equal(formatCalls, 4, "state-object cache changes must format once");
assert.equal(live.shadowRoot.innerHTML, markup(live.c, nextState, "23.0 °C"), "state-object cache changes must render the new snapshot");

const direct = new Card();
let directCalls = 0;
direct.h = { states: { "sensor.direct": state }, formatEntityState() { directCalls += 1; return "Direct"; } };
direct.setConfig({ left_entity: "sensor.direct" });
assert.equal(directCalls, 1, "direct configuration render must derive one formatted snapshot");
direct.connectedCallback();
assert.equal(directCalls, 2, "connected render must derive one formatted snapshot");
const partial = new Card();
partial.setConfig({ left_entity: "sensor.partial" });
const partialMarkup = partial.shadowRoot.innerHTML;
const partialHandles = [...partial._interactions];
assert.throws(() => { partial.hass = {}; }, /Cannot read properties of undefined/, "partial hass must retain the native missing states failure");
assert.equal(partial._hasHass, true, "partial hass failure must retain the first-Hass cache flag");
assert.equal(partial._leftState, undefined, "partial hass failure must retain an undefined missing state");
assert.equal(partial._leftStateText, null, "partial hass failure must retain an empty formatted-state cache");
assert.equal(partial.shadowRoot.innerHTML, partialMarkup, "partial hass failure must retain the prior DOM");
assert.equal(partialHandles.every((handle) => handle.destroyed), true, "partial hass failure must preserve teardown-before-state-resolution timing");
assert.equal(partial._interactions.length, 0, "partial hass failure must leave cleared interactions");

const actions = new Card();
actions.setConfig({ left_entity: "sensor.first", action_1_path: "/one", action_2_path: "/two" });
const actionHandles = [...actions._interactions];
actions.c.left_entity = "sensor.current";
actions.c.action_1_path = "/current-one";
actions.c.action_2_path = "/current-two";
for (const handle of actionHandles) handle.invoke();
assert.deepEqual(moreInfo, [[actions, "sensor.current"]], "context action must read current entity configuration");
assert.deepEqual(navigations, ["/current-one", "/current-two"], "navigation actions must read current path configuration");

const originalDisconnect = Card.prototype.disconnectedCallback;
vm.runInNewContext(runtimeReliability, context, { filename: "src/patches/runtime-reliability.js" });
await Promise.resolve();
await Promise.resolve();
assert.notEqual(Card.prototype.disconnectedCallback, originalDisconnect, "runtime reliability must retain Quick Navigation's disconnect wrapper");
assert.equal(runtimeReliability.includes('["component-quick-nav-v2", ["_interactions"]]'), true, "runtime reliability must retain Quick Navigation interaction ownership");
const retained = [...actions._interactions];
actions.disconnectedCallback();
assert.deepEqual(retained.map((handle) => handle.destroyCalls), [0, 0, 0], "runtime disconnect must retain Quick Navigation interactions");
actions.connectedCallback();
assert.deepEqual(retained.map((handle) => handle.destroyCalls), [1, 1, 1], "reconnect must destroy retained interactions before rebinding");
assert.equal(actions._interactions.length, 3, "reconnect must bind three fresh interactions");

console.log("Quick Navigation check passed: exact output, one-format snapshots, cache branches, current actions and retained lifecycle");
