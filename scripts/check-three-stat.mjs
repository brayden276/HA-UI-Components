import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLeafCardHarness } from "./fixtures/leaf-card-harness.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/three-stat-summary.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);
const test = createLeafCardHarness({ source, filename: "src/components/three-stat-summary.js", buttonSelector: "button.stat" });
const { Card, registrations, installedContracts, interactions, navigations, moreInfoRequests, escapeHtml, assertConfig } = test;

assert.equal(registrations.length, 1, "Three-stat must retain one public registration");
const registration = registrations[0];
assert.deepEqual(
  { type: registration.type, element: registration.element.name, name: registration.name, description: registration.description, preview: registration.preview },
  { type: "component-three-stat-v2", element: "ComponentThreeStatV2", name: "Three-stat Summary", description: "Reusable three-stat summary component.", preview: true },
  "Three-stat registration metadata must remain exact",
);
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "Three-stat must retain its shared editor and stub contract");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-three-stat-v2" }, "Three-stat stub config must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-three-stat-v2" }, "Three-stat editor config must remain available");

const ThreeStat = Card();
assert.deepEqual(Object.getOwnPropertyNames(ThreeStat.prototype).sort(), ["_action", "_clear", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "r", "setConfig"], "Three-stat prototype surface must remain exact");
for (const [name, length] of [["constructor", 0], ["setConfig", 1], ["connectedCallback", 0], ["disconnectedCallback", 0], ["getCardSize", 0], ["_clear", 0], ["_action", 1], ["r", 0]]) {
  const descriptor = Object.getOwnPropertyDescriptor(ThreeStat.prototype, name);
  assert.equal(descriptor?.value.length, length, `${name} must retain its public arity`);
  assert.deepEqual({ writable: descriptor?.writable, enumerable: descriptor?.enumerable, configurable: descriptor?.configurable }, { writable: true, enumerable: false, configurable: true }, `${name} must remain a native class method`);
}

const defaults = { metric_1_value: "00", metric_1_label: "Metric one", metric_2_value: "00", metric_2_label: "Metric two", metric_3_value: "00", metric_3_label: "Metric three", interactive: true };
const markup = (config, active = []) => `<style>.shared-card{}.wrap{padding:12px 14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;min-height:70px;align-items:center}.stat{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;text-align:center;min-width:0;cursor:pointer}.stat:first-child{text-align:left}.stat:last-child{text-align:right}.stat:active{transform:scale(.98)}.stat:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:8px}.value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:5px;font-size:10.5px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;gap:8px}.value{font-size:20px}.label{font-size:10px}}</style><style>.stat:not(button){cursor:default}.stat:not(button):active{transform:none}.stat:not(button):focus-visible{outline:none}</style><ha-card><div class="wrap">${[1, 2, 3].map((index) => `<${active.includes(index) ? "button" : "div"} class="stat" data-index="${index}"${active.includes(index) ? ' type="button"' : ""}><div class="value">${escapeHtml(config[`metric_${index}_value`])}</div><div class="label">${escapeHtml(config[`metric_${index}_label`])}</div></${active.includes(index) ? "button" : "div"}>`).join("")}</div></ha-card>`;
const card = new ThreeStat();
assert.deepEqual(Object.keys(card), ["shadowRoot", "_interactions"], "Three-stat constructor fields must remain minimal");
const interactionsDescriptor = Object.getOwnPropertyDescriptor(card, "_interactions");
assert.deepEqual({ writable: interactionsDescriptor?.writable, enumerable: interactionsDescriptor?.enumerable, configurable: interactionsDescriptor?.configurable }, { writable: true, enumerable: true, configurable: true }, "Three-stat must own a normal interaction array");
assert.equal(Array.isArray(interactionsDescriptor?.value), true, "Three-stat interaction storage must remain an array");
card.setConfig({});
assertConfig(card, defaults, "Three-stat defaults");
assert.equal(card.getCardSize(), 2, "Three-stat size must remain two");
assert.equal(card.shadowRoot.innerHTML, markup(card.c), "Three-stat default DOM and CSS must remain exact");
assert.equal(card._interactions.length, 0, "default Three-stat must stay presentational");

const disabled = new ThreeStat();
disabled.setConfig({ interactive: false, metric_1_entity: "sensor.ignored", metric_2_navigation_path: "/ignored", metric_3_action: () => {} });
assert.equal(disabled.shadowRoot.innerHTML, markup(disabled.c), "literal interactive false must retain static DOM");
assert.equal(disabled._interactions.length, 0, "literal interactive false must suppress every metric action");
const falsey = new ThreeStat();
falsey.setConfig({ interactive: 0, metric_1_entity: "sensor.fallback" });
assert.equal(falsey._interactions.length, 1, "only literal false may suppress metric interaction");

const customCalls = [];
const custom = (context) => customCalls.push(context);
const path = { path: "original" };
const entity = { entity: "original" };
const actions = new ThreeStat();
actions.hass = { token: "first" };
actions.setConfig({ metric_1_action: custom, metric_1_navigation_path: "/ignored", metric_1_entity: "sensor.ignored", metric_2_navigation_path: path, metric_2_entity: "sensor.ignored", metric_3_entity: entity });
assert.equal(actions.shadowRoot.innerHTML, markup(actions.c, [1, 2, 3]), "actionable Three-stat DOM and CSS must remain exact");
assert.deepEqual(Array.from(actions._interactions, (handle) => handle.element.dataset.index), ["1", "2", "3"], "each action must bind its matching rendered metric");
for (const handle of actions._interactions) assert.deepEqual(Object.keys(handle.options), ["primary", "feedback"], "metric interactions must keep the exact shared options");
const originalAction = actions.c.metric_1_action;
let replacementActionCalls = 0;
actions.c.metric_1_action = (...args) => { replacementActionCalls += 1; return originalAction(...args); };
actions.c = { ...actions.c, metric_1_action: actions.c.metric_1_action, metric_2_navigation_path: { path: "changed" }, metric_3_entity: { entity: "changed" } };
const currentHass = { token: "current" };
actions.hass = currentHass;
actions._interactions[0].invokePrimary();
actions._interactions[1].invokePrimary();
actions._interactions[2].invokePrimary();
assert.equal(replacementActionCalls, 0, "custom action must capture its original function over path and entity");
assert.equal(customCalls.length, 1, "custom actions must run once");
assert.equal(customCalls[0].host, actions, "custom action context must retain its host");
assert.equal(customCalls[0].hass, currentHass, "custom action must read current hass");
assert.equal(customCalls[0].index, 1, "custom action must retain its metric index");
assert.deepEqual(navigations, [path], "navigation action must capture its selected path over entity");
assert.deepEqual(moreInfoRequests, [[actions, entity]], "More Info action must capture its selected entity");

const counted = new ThreeStat();
counted.setConfig({ metric_1_entity: "sensor.counted" });
let reads = 0;
Object.defineProperty(counted.c, "metric_1_entity", { get() { reads += 1; return "sensor.counted"; }, enumerable: true, configurable: true });
counted.r();
assert.equal(reads, 1, "each metric action must resolve exactly once per render for both DOM and binding");

const matched = new ThreeStat();
let selections = 0;
const invoked = [];
matched._action = function action(index) { selections += 1; return selections % 2 ? () => invoked.push(index) : null; };
matched.setConfig({});
assert.equal(selections, 3, "action selection must run once for each of three metrics");
assert.equal(matched.shadowRoot.innerHTML, markup(matched.c, [1, 3]), "selected actions must determine the matching button markup");
assert.equal(matched._interactions.length, 2, "only selected metric buttons may bind interactions");
for (const handle of matched._interactions) handle.invokePrimary();
assert.deepEqual(invoked, [1, 3], "bound actions must be the same closures used to select their metric buttons");

const firstHandles = [...actions._interactions];
const originalDisconnect = await test.applyRuntimePatch(runtimeReliability);
assert.notEqual(ThreeStat.prototype.disconnectedCallback, originalDisconnect, "runtime reliability must retain the Three-stat disconnect wrapper");
assert.equal(runtimeReliability.includes('["component-three-stat-v2", ["_interactions"]]'), true, "Three-stat retained interaction patch entry must remain exact");
actions.disconnectedCallback();
assert.deepEqual(Array.from(firstHandles, (handle) => handle.destroyCalls), [0, 0, 0], "wrapped disconnect must retain live metric handles");
actions.connectedCallback();
assert.deepEqual(Array.from(firstHandles, (handle) => handle.destroyCalls), [1, 1, 1], "reconnect must destroy each retained handle once before rebinding");
assert.equal(actions._interactions.length, 3, "reconnect must bind fresh metric handles");
assert.equal(actions._interactions.every((handle) => !firstHandles.includes(handle) && !handle.destroyed), true, "reconnect must retain only fresh live metric handles");

console.log("Three-stat check passed: exact DOM, metric action precedence/capture, single action resolution, and retained reconnect lifecycle");
