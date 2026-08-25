import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLeafCardHarness } from "./fixtures/leaf-card-harness.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/action-card.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);
const test = createLeafCardHarness({ source, filename: "src/components/action-card.js" });
const { Card, registrations, installedContracts, interactions, navigations, moreInfoRequests, escapeHtml, MockElement, assertConfig, assertOwnData } = test;

assert.equal(registrations.length, 1, "Action must retain one public registration");
const registration = registrations[0];
assert.deepEqual(
  { type: registration.type, element: registration.element.name, name: registration.name, description: registration.description, preview: registration.preview },
  { type: "component-action-v2", element: "ComponentActionV2", name: "Action Card", description: "Reusable navigation and more-info action card.", preview: true },
  "Action registration metadata must remain exact",
);
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "Action must retain its shared editor and stub contract");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-action-v2" }, "Action stub config must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-action-v2" }, "Action editor config must remain available");

const Action = Card();
assert.deepEqual(Object.getOwnPropertyNames(Action.prototype).sort(), ["actions", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "r", "setConfig"], "Action prototype surface must remain exact");
for (const [name, length] of [["constructor", 0], ["setConfig", 1], ["connectedCallback", 0], ["disconnectedCallback", 0], ["getCardSize", 0], ["actions", 0], ["r", 0]]) {
  const descriptor = Object.getOwnPropertyDescriptor(Action.prototype, name);
  assert.equal(descriptor?.value.length, length, `${name} must retain its public arity`);
  assert.deepEqual({ writable: descriptor?.writable, enumerable: descriptor?.enumerable, configurable: descriptor?.configurable }, { writable: true, enumerable: false, configurable: true }, `${name} must remain a native class method`);
}
const hassDescriptor = Object.getOwnPropertyDescriptor(Action.prototype, "hass");
assert.equal(hassDescriptor?.set.length, 1, "hass must retain its setter contract");
assert.equal(hassDescriptor?.get, undefined, "hass must not expose a getter");

const expectedMarkup = (config) => {
  const active = config.navigation_path || config.more_info_entity || config.entity;
  const tag = active ? "button" : "div";
  const attrs = active ? ' type="button"' : "";
  const className = active ? "demo" : "demo-static";
  return `<style>.shared-card{}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action{min-height:32px;padding:0 10px;border-radius:11px;display:flex;align-items:center;background:var(--secondary-background-color);color:var(--primary-color);font-size:11.5px;font-weight:650;white-space:nowrap}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(config.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(config.title)}</div><div class="desc">${escapeHtml(config.description)}</div></span><span class="action">${escapeHtml(config.action_text)}</span></div></${tag}></ha-card>`;
};
const defaults = new Action();
assert.deepEqual(Object.keys(defaults), ["shadowRoot", "_interaction"], "Action constructor fields must remain minimal");
assertOwnData(defaults, "_interaction", null, "Action must own a normal interaction handle");
defaults.setConfig({});
assertConfig(defaults, { title: "Action title", description: "What this action will do", action_text: "Open", icon: "mdi:gesture-tap-button" }, "Action defaults");
assertOwnData(defaults, "c", defaults.c, "setConfig must retain a normal config field");
assert.equal(defaults.getCardSize(), 2, "Action size must remain two");
assert.equal(defaults.shadowRoot.innerHTML, expectedMarkup(defaults.c), "Action static template and CSS must remain exact");
assert.equal(defaults._interaction, null, "static Actions must not bind interactions");
defaults.setConfig({ title: "First", retained: "discarded" });
defaults.setConfig({ icon: "mdi:second" });
assertConfig(defaults, { title: "Action title", description: "What this action will do", action_text: "Open", icon: "mdi:second" }, "Action configs must replace prior values");
const escaped = new Action();
escaped.setConfig({ icon: 'mdi:<&"\'', title: '<&"\'', description: '<&"\'', action_text: '<&"\'' });
assert.equal(escaped.shadowRoot.innerHTML, expectedMarkup(escaped.c), "Action text and icon attributes must retain escaping and exact template");

const path = { path: "original" };
const preferredEntity = { entity: "preferred" };
const fallbackEntity = { entity: "fallback" };
const matrix = new Action();
matrix.setConfig({ navigation_path: path, entity: fallbackEntity, more_info_entity: preferredEntity });
const firstHandle = matrix._interaction;
assert.equal(firstHandle.element instanceof MockElement, true, "Action must bind the rendered native button");
assert.deepEqual(Object.keys(firstHandle.options), ["primary", "hold", "optimistic", "repeat", "feedback"], "Action interaction option order must remain exact");
assert.deepEqual({ optimistic: firstHandle.options.optimistic, repeat: firstHandle.options.repeat, feedback: firstHandle.options.feedback }, { optimistic: false, repeat: false, feedback: true }, "Action interaction flags must remain exact");
assert.equal(matrix.shadowRoot.innerHTML, expectedMarkup(matrix.c), "actionable Action template and CSS must remain exact");
matrix.c = { navigation_path: { path: "changed" }, entity: { entity: "changed" }, more_info_entity: { entity: "changed preferred" } };
firstHandle.invokePrimary();
firstHandle.invokeHold();
assert.equal(navigations.at(-1), path, "primary navigation must capture its original path");
assert.deepEqual(moreInfoRequests.at(-1), [matrix, preferredEntity], "hold More Info must capture more_info_entity before fallback entity");

for (const [message, config, expectedEntity] of [
  ["more_info_entity alone", { more_info_entity: preferredEntity }, preferredEntity],
  ["truthy more_info_entity precedence", { more_info_entity: preferredEntity, entity: fallbackEntity }, preferredEntity],
  ["falsy more_info_entity fallback", { more_info_entity: "", entity: fallbackEntity }, fallbackEntity],
]) {
  const card = new Action();
  card.setConfig(config);
  const handle = card._interaction;
  card.c = { more_info_entity: { entity: "changed preferred" }, entity: { entity: "changed fallback" } };
  handle.invokePrimary();
  assert.deepEqual(moreInfoRequests.at(-1), [card, expectedEntity], `${message} must retain its captured primary More Info entity`);
}

const entityOnly = new Action();
entityOnly.setConfig({ entity: fallbackEntity });
const entityHandle = entityOnly._interaction;
assert.equal(typeof entityHandle.options.primary, "function", "entity-only Action must provide a primary action");
assert.equal(entityHandle.options.hold, null, "entity-only Action must not provide a hold action");
entityOnly.c.entity = { entity: "changed" };
entityHandle.invokePrimary();
assert.deepEqual(moreInfoRequests.at(-1), [entityOnly, fallbackEntity], "entity primary must capture the selected fallback entity");
const pathOnly = new Action();
pathOnly.setConfig({ navigation_path: path });
assert.equal(pathOnly._interaction.options.hold, null, "path-only Action must not provide a hold action");
const noAction = new Action();
const beforeNoAction = interactions.length;
noAction.setConfig({ navigation_path: 0, entity: "", more_info_entity: null });
assert.equal(noAction._interaction, null, "falsy action values must remain static");
assert.equal(interactions.length, beforeNoAction, "static Action values must not create interaction handles");

matrix.r();
assert.equal(firstHandle.destroyCalls, 1, "Action render must destroy the old interaction before replacement");
const secondHandle = matrix._interaction;
matrix.disconnectedCallback();
assert.equal(secondHandle.destroyCalls, 1, "Action disconnect must destroy the owned interaction");
assert.equal(matrix._interaction, null, "Action disconnect must release the owned interaction");
const originalDisconnect = await test.applyRuntimePatch(runtimeReliability);
assert.equal(Action.prototype.disconnectedCallback, originalDisconnect, "runtime reliability must not replace Action lifecycle ownership");
assert.equal(runtimeReliability.includes('"component-action-v2"'), false, "the stale Action retained-field patch must be removed");
matrix.connectedCallback();
assert.equal(matrix._interaction?.destroyed, false, "Action reconnect must bind a fresh live interaction");

console.log("Action check passed: exact template and escaping, action matrix snapshots, shared interaction contract, and owned lifecycle");
