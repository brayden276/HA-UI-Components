import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "src/components/single-kpi.js"), "utf8");
const runtimeReliability = await readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8");

class MockElement {
  constructor() {
    this.innerHTML = "";
  }
}

class MockShadowRoot extends MockElement {
  querySelector(selector) {
    if (selector === "button.demo" && this.innerHTML.includes('<button class="demo"')) {
      return new MockElement();
    }
    return null;
  }
}

class MockHTMLElement {
  attachShadow() {
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
}

const registrations = [];
const interactions = [];
const navigations = [];
const moreInfoRequests = [];
const definitions = new Map();
const customElements = {
  define(name, element) {
    definitions.set(name, element);
  },
  get(name) {
    return definitions.get(name);
  },
  whenDefined() {
    return Promise.resolve();
  },
};
const escapeHtml = (value) => (value == null ? "" : String(value))
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const shared = {
  PRESENTATIONAL_CARD_STYLES: ".shared-card{}",
  escapeHtml,
  interaction(element, options) {
    const handle = {
      destroyed: false,
      element,
      options,
      destroy() { this.destroyed = true; },
      invoke() { return options.primary(); },
    };
    interactions.push(handle);
    return handle;
  },
  navigateTo(path) { navigations.push(path); },
  openMoreInfo(host, entityId) { moreInfoRequests.push([host, entityId]); },
  registerCard(registration) {
    registrations.push(registration);
    if (!customElements.get(registration.type)) customElements.define(registration.type, registration.element);
  },
};
const context = {
  HTMLElement: MockHTMLElement,
  customElements,
  __HA_COMPONENT_LIBRARY_SHARED__: shared,
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/single-kpi.js" });
vm.runInNewContext(runtimeReliability, context, { filename: "src/patches/runtime-reliability.js" });
await Promise.resolve();

assert.equal(registrations.length, 1, "the component must retain its public registration");
assert.deepEqual(
  { type: registrations[0].type, name: registrations[0].name, description: registrations[0].description },
  { type: "component-single-kpi-v2", name: "Single KPI", description: "Reusable single KPI component." },
  "the card metadata must remain unchanged",
);

const Card = registrations[0].element;
const defaults = new Card();
defaults.setConfig({});
assert.equal(defaults.getCardSize(), 2, "the card size must remain unchanged");
assert.equal(defaults.c, defaults.config, "legacy c must remain the configuration surface");
assert.equal(defaults.c.value, "00", "default KPI value must remain available");
assert.equal(defaults.c.label, "Primary metric", "default KPI label must remain available");
assert.equal(defaults.c.support_value, "00", "default supporting value must remain available");
assert.equal(defaults.c.support_label, "Supporting context", "default supporting label must remain available");
assert.equal(defaults.shadowRoot.innerHTML.includes('<div class="demo-static">'), true, "a non-actionable card must stay presentational");
assert.equal(interactions.length, 0, "a non-actionable card must not bind an interaction");
const defaultMarkup = defaults.shadowRoot.innerHTML;
const hass = { states: {} };
defaults.hass = hass;
assert.equal(defaults.h, hass, "legacy h must retain the exact hass reference");
assert.equal(defaults.shadowRoot.innerHTML, defaultMarkup, "hass updates must not change a configuration-driven KPI");

const escaped = new Card();
escaped.setConfig({
  value: '<value&>',
  label: '"label"',
  support_value: "'support'",
  support_label: "<context>",
});
assert.equal(escaped.shadowRoot.innerHTML.includes("&lt;value&amp;&gt;"), true, "KPI values must be escaped");
assert.equal(escaped.shadowRoot.innerHTML.includes("&quot;label&quot;"), true, "KPI labels must be escaped");
assert.equal(escaped.shadowRoot.innerHTML.includes("&#39;support&#39;"), true, "supporting values must be escaped");
assert.equal(escaped.shadowRoot.innerHTML.includes("&lt;context&gt;"), true, "supporting labels must be escaped");
assert.equal(escaped.shadowRoot.innerHTML.includes(".wrap{padding:12px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-height:70px}"), true, "the established KPI layout styles must remain unchanged");

const emptyValues = new Card();
emptyValues.setConfig({ value: null, label: undefined, support_value: 0, support_label: false });
assert.equal(emptyValues.shadowRoot.innerHTML.includes('<div class="value"></div>'), true, "null configured values must render as empty text");
assert.equal(emptyValues.shadowRoot.innerHTML.includes('<div class="label"></div>'), true, "undefined configured labels must render as empty text");
assert.equal(emptyValues.shadowRoot.innerHTML.includes('<div class="support"><b>0</b> false</div>'), true, "zero and false configured values must remain visible");

const actionable = new Card();
actionable.setConfig({ entity: "sensor.kpi", navigation_path: "/overview" });
assert.equal(actionable.shadowRoot.innerHTML.includes('<button class="demo" type="button">'), true, "actionable cards must retain native button semantics");
assert.equal(interactions.length, 1, "actionable cards must use the shared interaction helper");
assert.equal(interactions[0].options.feedback, true, "actionable cards must keep shared interaction feedback");
assert.equal(actionable._interaction, interactions[0], "legacy _interaction must expose the active interaction handle");
assert.equal(typeof actionable.action(), "function", "legacy action() must remain reachable");
actionable.action()();
assert.deepEqual(navigations, ["/overview"], "navigation must take precedence over More Info");
assert.deepEqual(moreInfoRequests, [], "navigation precedence must suppress More Info");
const preLegacyRender = actionable._interaction;
actionable.r();
assert.equal(preLegacyRender.destroyed, true, "legacy r() must re-render through the lifecycle teardown path");
assert.equal(actionable._interaction, interactions.at(-1), "legacy r() must expose its fresh interaction through _interaction");

const moreInfo = new Card();
moreInfo.setConfig({ entity: "sensor.kpi" });
const moreInfoHandle = interactions.at(-1);
moreInfoHandle.invoke();
assert.deepEqual(moreInfoRequests, [[moreInfo, "sensor.kpi"]], "entity-only cards must open More Info");

const nonBooleanInteractive = new Card();
nonBooleanInteractive.setConfig({ entity: "sensor.fallback", navigation_path: "", interactive: 0 });
interactions.at(-1).invoke();
assert.deepEqual(moreInfoRequests.at(-1), [nonBooleanInteractive, "sensor.fallback"], "only literal false may disable interaction and an empty navigation path must fall back to More Info");

const beforeDisabled = interactions.length;
moreInfo.setConfig({ entity: "sensor.kpi", navigation_path: "/overview", interactive: false });
assert.equal(moreInfoHandle.destroyed, true, "re-rendering must tear down the previous interaction");
assert.equal(moreInfo.shadowRoot.innerHTML.includes('<div class="demo-static">'), true, "interactive:false must remove button semantics");
assert.equal(interactions.length, beforeDisabled, "interactive:false must not bind a shared interaction");

const reconnecting = new Card();
reconnecting.setConfig({ entity: "sensor.kpi" });
const firstConnection = interactions.at(-1);
reconnecting.disconnectedCallback();
assert.equal(firstConnection.destroyed, true, "disconnect must tear down the bound interaction");
assert.equal(reconnecting._interaction, null, "disconnect must release the legacy interaction handle");
reconnecting.connectedCallback();
const secondConnection = interactions.at(-1);
assert.notEqual(secondConnection, firstConnection, "reconnect must bind a fresh interaction to the new DOM");
assert.equal(secondConnection.destroyed, false, "the reconnect interaction must remain active");

console.log("Single KPI check passed: metadata, legacy surfaces, defaults, escaping, navigation precedence, More Info, interactive:false, shared interactions, accessibility and reconnect lifecycle");
