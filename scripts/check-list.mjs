import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLeafCardHarness } from "./fixtures/leaf-card-harness.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/list-ranking.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);
const test = createLeafCardHarness({ source, filename: "src/components/list-ranking.js", buttonSelector: "button.row" });
const { Card, registrations, installedContracts, navigations, moreInfoRequests, escapeHtml, assertConfig } = test;
const css = ".wrap{padding:2px 14px}.row{appearance:none;width:100%;border:0;border-top:1px solid var(--divider-color);background:transparent;color:inherit;font:inherit;min-height:54px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:0;text-align:left;cursor:pointer}.row:first-child{border-top:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}.title{font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:2px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric{text-align:right;white-space:nowrap;font-size:11px;color:var(--secondary-text-color)}.metric b{font-size:12px;font-weight:650;color:var(--primary-text-color);margin-right:4px}@media(max-width:700px){.wrap{padding:2px 12px}}";
const staticCss = ".row:not(button){cursor:default}.row:not(button):active{background:transparent}.row:not(button):focus-visible{outline:none}";
const markup = (rows, active = []) => `<style>.shared-card{}${css}</style><style>${staticCss}</style><ha-card><div class="wrap">${rows.map((row, index) => `<${active.includes(index) ? "button" : "div"} class="row" data-index="${index}"${active.includes(index) ? ' type="button"' : ""}><span><div class="title">${escapeHtml(row.title)}</div><div class="desc">${escapeHtml(row.description)}</div></span><span class="metric"><b>${escapeHtml(row.value)}</b>${escapeHtml(row.label)}</span></${active.includes(index) ? "button" : "div"}>`).join("")}</div></ha-card>`;
const defaultRows = ["First", "Second", "Third"].map((ordinal) => ({ title: `${ordinal} item`, description: "Supporting detail", value: "00", label: "Metric" }));

assert.equal(registrations.length, 1, "List must retain one registration");
const registration = registrations[0];
assert.deepEqual({ type: registration.type, element: registration.element.name, name: registration.name, description: registration.description, preview: registration.preview }, { type: "component-list-v2", element: "ComponentListV2", name: "List / Ranking", description: "Reusable list and ranking component.", preview: true }, "List metadata must remain exact");
assert.deepEqual(installedContracts, [[registration.type, registration.element]], "List must retain shared config registration");
assert.deepEqual(registration.element.getStubConfig(), { type: "custom:component-list-v2" }, "List stub must remain available");
assert.deepEqual(await registration.element.getConfigElement(), { cardType: "component-list-v2" }, "List editor must remain available");

const List = Card();
assert.deepEqual(Object.getOwnPropertyNames(List.prototype).sort(), ["_actions", "_clear", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "r", "setConfig"], "List prototype surface must remain exact");
const defaults = new List();
assert.deepEqual(Object.keys(defaults), ["shadowRoot", "_interactions"], "List constructor fields must remain exact");
defaults.setConfig({});
assertConfig(defaults, { rows: defaults.c.rows, interactive: true }, "List defaults");
assert.deepEqual(Array.from(defaults.c.rows, (row) => ({ title: row.title, description: row.description, value: row.value, label: row.label })), defaultRows, "List default rows must remain exact");
assert.equal(defaults.getCardSize(), 3, "List size must remain three");
assert.equal(defaults.shadowRoot.innerHTML, markup(defaults.c.rows), "List default DOM and CSS must remain exact");
assert.equal(defaults._interactions.length, 0, "default List must remain static");

const disabled = new List();
disabled.setConfig({ interactive: false, rows: [{ title: "Disabled", action() {}, navigation_path: "/ignored", entity: "sensor.ignored" }] });
assert.equal(disabled.shadowRoot.innerHTML, markup(disabled.c.rows), "literal interactive false must retain static DOM");
assert.equal(disabled._interactions.length, 0, "literal interactive false must suppress all actions");

const path = { destination: "original" };
const entity = { entity: "original" };
const calls = [];
const sparseRows = [];
sparseRows[1] = { title: "Custom", action(context) { calls.push(context); }, navigation_path: "/ignored", entity: "sensor.ignored" };
sparseRows[3] = { title: "Path", navigation_path: path, entity };
sparseRows[5] = { title: "Entity", entity };
sparseRows[7] = { title: "Outside slice", navigation_path: "/outside" };
const actions = new List();
actions.hass = { token: "first" };
actions.setConfig({ rows: sparseRows });
assert.equal(actions.shadowRoot.innerHTML, markup(actions.c.rows.slice(0, 6), [1, 3, 5]), "sparse sliced rows must retain exact indexed DOM and CSS");
assert.deepEqual(Array.from(actions._interactions, (handle) => handle.element.dataset.index), ["1", "3", "5"], "sparse rows must bind their original sliced indices");
for (const handle of actions._interactions) assert.deepEqual(Object.keys(handle.options), ["primary", "hold", "feedback"], "List interactions must retain the exact options");
actions.c.rows[1].action = (context) => calls.push({ replacement: true, context });
actions.c.rows[3].navigation_path = "/changed";
actions.c.rows[3].entity = "sensor.changed";
actions.c.rows[5].entity = "sensor.changed";
const currentHass = { token: "current" };
actions.hass = currentHass;
actions._interactions[0].invokePrimary();
actions._interactions[0].invokeHold();
actions._interactions[1].invokePrimary();
actions._interactions[1].invokeHold();
actions._interactions[2].invokePrimary();
actions._interactions[2].invokeHold();
assert.equal(calls.length, 1, "custom primary must win over path and entity without a hold action");
assert.equal(calls[0].replacement, true, "custom invocation must read the current row.action");
assert.equal(calls[0].context.hass, currentHass, "custom invocation must read current hass");
assert.deepEqual(navigations, [path], "path primary must capture its rendered path");
assert.deepEqual(moreInfoRequests, [[actions, entity], [actions, entity]], "path hold and entity primary must capture their rendered entities");

const counted = new List();
const countedRow = { title: "Counted" };
let pathReads = 0;
Object.defineProperty(countedRow, "navigation_path", { get() { pathReads += 1; return "/counted"; }, enumerable: true });
counted.setConfig({ rows: [countedRow] });
assert.equal(pathReads, 1, "each visited row must resolve actions exactly once for DOM and binding");
assert.equal(counted._interactions.length, 1, "the resolved action must bind once");

const firstHandles = [...actions._interactions];
const originalDisconnect = await test.applyRuntimePatch(runtimeReliability);
assert.notEqual(List.prototype.disconnectedCallback, originalDisconnect, "runtime reliability must retain List's disconnect wrapper");
assert.equal(runtimeReliability.includes('["component-list-v2", ["_interactions"]]'), true, "runtime reliability must retain the List interaction patch");
actions.disconnectedCallback();
assert.deepEqual(firstHandles.map((handle) => handle.destroyCalls), [0, 0, 0], "runtime disconnect must retain live List handles");
actions.connectedCallback();
assert.deepEqual(firstHandles.map((handle) => handle.destroyCalls), [1, 1, 1], "reconnect must destroy retained List handles before rebinding");

console.log("List check passed: exact DOM, sparse action records, action precedence/capture, one-resolution binding and retained lifecycle patch");
