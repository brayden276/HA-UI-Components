import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/context-strip.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);
class Element {}
class ShadowRoot {
  innerHTML = "";
  querySelector(selector) { return selector === "button" && this.innerHTML.includes('<button class=""') ? new Element() : null; }
}
class HTMLElement {
  attachShadow(options) {
    assert.equal(this.shadowRoot, undefined, "Context Strip must attach one shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "Context Strip shadow options must remain exact");
    assert.equal(options.mode, "open", "Context Strip must use an open shadow root");
    this.shadowRoot = new ShadowRoot();
    return this.shadowRoot;
  }
}
const definitions = new Map();
const customElements = { define(type, element) { definitions.set(type, element); }, get(type) { return definitions.get(type); }, whenDefined() { return Promise.resolve(); } };
const registrations = [];
const installedContracts = [];
const navigations = [];
const moreInfo = [];
const escapeHtml = (value) => (value == null ? "" : String(value)).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const shared = {
  escapeHtml,
  interaction(element, options) {
    const handle = { element, options, destroyCalls: 0, destroy() { this.destroyCalls += 1; }, invoke() { return options.primary?.(); } };
    return handle;
  },
  navigateTo(path) { navigations.push(path); },
  openMoreInfo(host, entity) { moreInfo.push([host, entity]); },
  installConfigContract(type, element) { installedContracts.push([type, element]); element.getStubConfig ??= () => ({ type: `custom:${type}` }); element.getConfigElement ??= async () => ({ cardType: type }); },
  registerCard({ type, element, name, description, preview = true }) { shared.installConfigContract(type, element); customElements.define(type, element); registrations.push({ type, element, name, description, preview }); },
};
const context = { HTMLElement, customElements, __HA_COMPONENT_LIBRARY_SHARED__: shared };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/context-strip.js" });
const type = "component-context-strip-v3";
const Card = customElements.get(type);
assert.equal(registrations.length, 1, "Context Strip must register once");
const registration = registrations[0];
assert.deepEqual({ type: registration.type, element: registration.element.name, name: registration.name, description: registration.description, preview: registration.preview }, { type, element: "ComponentContextStripV3", name: "Context Strip", description: "Reusable context and metric strip component.", preview: true }, "Context Strip metadata must remain exact");
assert.deepEqual(installedContracts, [[type, Card]], "Context Strip must retain shared config installation");
assert.deepEqual(Card.getStubConfig(), { type: `custom:${type}` }, "Context Strip stub must remain exact");
assert.deepEqual(await Card.getConfigElement(), { cardType: type }, "Context Strip editor must remain exact");
assert.deepEqual(Object.getOwnPropertyNames(Card.prototype).sort(), ["_action", "_render", "connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "setConfig"], "Context Strip prototype surface must remain exact");

const css = `\n:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;color:inherit}
button:active{transform:scale(.997)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.mid{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.item{display:flex;align-items:baseline;gap:4px}.lab{font-weight:500}.val{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.mid{gap:10px}.item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.mid{gap:7px}}
`;
const staticCss = ".context-static{width:100%;min-height:44px;box-sizing:border-box;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden}@media(max-width:900px){.context-static{gap:10px;padding:11px 12px;font-size:11px}}@media(max-width:650px){.context-static{font-size:11px;gap:6px;padding:10px}}";
const markup = (config, active) => `<style>${css}</style><style>${staticCss}</style><ha-card><${active ? "button" : "div"} class="${active ? "" : "context-static"}"${active ? ' type="button"' : ""}><span class="phase">${escapeHtml(config.left_text)}</span><span class="mid">${[1, 2, 3].map((index) => `<span class="item"><span class="lab">${escapeHtml(config[`center_${index}_label`])}</span><span class="val">${escapeHtml(config[`center_${index}_value`])}</span></span>`).join("")}</span><span class="event">${escapeHtml(config.right_text)}</span></${active ? "button" : "div"}></ha-card>`;
const defaults = { left_text: "Left context", center_1_label: "Primary metric", center_1_value: "00%", center_2_label: "Secondary metric", center_2_value: "00%", center_3_label: "Tertiary metric", center_3_value: "00%", right_text: "Right context", navigation_path: null, entity: null };
const card = new Card();
assert.deepEqual(Object.keys(card), ["shadowRoot", "_interaction", "_hass"], "Context Strip constructor state must remain exact");
card.setConfig({});
assert.deepEqual(Object.keys(card.c), Object.keys(defaults), "Context Strip defaults must retain key order");
for (const [key, value] of Object.entries(defaults)) assert.equal(card.c[key], value, `Context Strip default ${key} must remain exact`);
assert.equal(card.getCardSize(), 1, "Context Strip size must remain one");
assert.equal(card.shadowRoot.innerHTML, markup(card.c, false), "Context Strip static DOM and CSS must remain exact");
assert.equal(card._interaction, null, "static Context Strip must not bind interaction");
for (const input of [null, undefined, false, 0]) { const probe = new Card(); probe.setConfig(input); assert.equal(probe.shadowRoot.innerHTML, markup(probe.c, false), `setConfig must preserve defaults for ${String(input)}`); }
const escaped = new Card();
escaped.setConfig({ left_text: '<>&"\'', center_1_label: '<>&"\'', center_1_value: '<>&"\'', right_text: '<>&"\'' });
assert.equal(escaped.shadowRoot.innerHTML, markup(escaped.c, false), "Context Strip must retain shared escaping in exact static markup");

const navigation = new Card();
navigation.setConfig({ navigation_path: "/first", entity: "sensor.ignored" });
const navHandle = navigation._interaction;
assert.equal(navigation.shadowRoot.innerHTML, markup(navigation.c, true), "navigation must render the exact actionable root");
assert.deepEqual(Object.keys(navHandle.options), ["primary", "optimistic", "repeat", "feedback"], "navigation interaction option order must remain exact");
assert.deepEqual({ primary: navHandle.options.primary, optimistic: navHandle.options.optimistic, repeat: navHandle.options.repeat, feedback: navHandle.options.feedback }, { primary: navHandle.options.primary, optimistic: false, repeat: false, feedback: true }, "navigation interaction options must remain exact");
navigation.c.navigation_path = "/current";
navHandle.invoke();
assert.deepEqual(navigations, ["/first"], "navigation action must retain the rendered path");
const entity = new Card();
entity.setConfig({ entity: "sensor.first" });
const entityHandle = entity._interaction;
entity.c.entity = "sensor.current";
entityHandle.invoke();
assert.deepEqual(moreInfo, [[entity, "sensor.first"]], "entity action must retain the rendered entity");
const counted = new Card();
counted.setConfig({ navigation_path: "/initial" });
let pathReads = 0;
Object.defineProperty(counted.c, "navigation_path", { get() { pathReads += 1; return "/counted"; }, configurable: true });
counted._render();
assert.equal(pathReads, 1, "each render must resolve the selected navigation path once");
const resolved = new Card();
let resolutions = 0;
resolved._action = () => { resolutions += 1; return null; };
resolved.setConfig({});
assert.equal(resolutions, 1, "Context Strip must resolve an action once per render");

const lifecycle = new Card();
lifecycle.setConfig({ navigation_path: "/lifecycle" });
const firstHandle = lifecycle._interaction;
lifecycle.disconnectedCallback();
assert.equal(firstHandle.destroyCalls, 1, "disconnect must destroy the owned interaction once");
assert.equal(lifecycle._interaction, null, "disconnect must release the owned interaction");
lifecycle.connectedCallback();
assert.notEqual(lifecycle._interaction, firstHandle, "reconnect must bind a fresh interaction");
const originalDisconnect = Card.prototype.disconnectedCallback;
vm.runInNewContext(runtimeReliability, context, { filename: "src/patches/runtime-reliability.js" });
await Promise.resolve();
assert.notEqual(Card.prototype.disconnectedCallback, originalDisconnect, "runtime reliability must retain Context Strip's disconnect wrapper");
assert.equal(runtimeReliability.includes('["component-context-strip-v3", ["_interaction"]]'), true, "runtime reliability must retain Context Strip interaction ownership");
assert.equal(runtimeReliability.includes("CtxEsc"), false, "runtime reliability must remove the dead Context Strip escape wrapper");
const retained = lifecycle._interaction;
lifecycle.disconnectedCallback();
assert.equal(retained.destroyCalls, 0, "runtime disconnect must retain the active interaction");
assert.equal(lifecycle._interaction, retained, "runtime disconnect must retain the interaction reference");
lifecycle.connectedCallback();
assert.equal(retained.destroyCalls, 1, "reconnect must destroy the retained interaction once before rebinding");
assert.notEqual(lifecycle._interaction, retained, "reconnect must bind a fresh interaction");

console.log("Context Strip check passed: exact static/action markup, defaults, snapshot closures, retained lifecycle and removed escape compatibility");
