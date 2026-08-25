import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, runtimeReliability] = await Promise.all([
  readFile(resolve(root, "src/components/text-effect.js"), "utf8"),
  readFile(resolve(root, "src/patches/runtime-reliability.js"), "utf8"),
]);
class MockClassList { constructor() { this.values = new Set(); } add(value) { this.values.add(value); } contains(value) { return this.values.has(value); } }
class MockRow { constructor() { this.classList = new MockClassList(); } }
class MockShadowRoot {
  #html = "";
  set innerHTML(value) { this.#html = value; this.row = new MockRow(); }
  get innerHTML() { return this.#html; }
  querySelector(selector) { return selector === ".row" ? this.row : null; }
}
class MockHTMLElement {
  attachShadow(options) {
    assert.equal(this.shadowRoot, undefined, "Text Effect must attach one shadow root");
    assert.deepEqual(Object.keys(options), ["mode"], "Text Effect shadow options must remain exact");
    assert.equal(options.mode, "open", "Text Effect must use an open shadow root");
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
}
const timers = new Map();
const cleared = [];
let timerId = 0;
const setTimeoutMock = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
const clearTimeoutMock = (id) => { cleared.push(id); timers.delete(id); };
const definitions = new Map();
const customElements = { define(type, element) { definitions.set(type, element); }, get(type) { return definitions.get(type); } };
const registrations = [];
const installedContracts = [];
const escapeHtml = (value) => (value == null ? "" : String(value)).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const shared = {
  escapeHtml,
  installConfigContract(type, element) { installedContracts.push([type, element]); element.getStubConfig ??= () => ({ type: `custom:${type}` }); element.getConfigElement ??= async () => ({ cardType: type }); },
  registerCard({ type, element, name, description, preview = true }) { shared.installConfigContract(type, element); customElements.define(type, element); registrations.push({ type, element, name, description, preview }); },
};
const context = { HTMLElement: MockHTMLElement, customElements, setTimeout: setTimeoutMock, clearTimeout: clearTimeoutMock, __HA_COMPONENT_LIBRARY_SHARED__: shared };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "src/components/text-effect.js" });
const type = "component-text-effect-v1";
const Card = customElements.get(type);
assert.equal(registrations.length, 1, "Text Effect must retain one registration");
const registration = registrations[0];
assert.deepEqual({ type: registration.type, element: registration.element.name, name: registration.name, description: registration.description, preview: registration.preview }, { type, element: "ComponentTextEffectV1", name: "Signature Text Effect", description: "Reusable transient-status effects using the existing signature motion language.", preview: true }, "Text Effect metadata must remain exact");
assert.deepEqual(installedContracts, [[type, Card]], "Text Effect must retain shared config installation");
assert.deepEqual(Card.getStubConfig(), { type: `custom:${type}` }, "Text Effect stub must remain exact");
assert.deepEqual(await Card.getConfigElement(), { cardType: type }, "Text Effect editor must remain exact");
assert.deepEqual(Object.getOwnPropertyNames(Card.prototype).sort(), ["connectedCallback", "constructor", "disconnectedCallback", "getCardSize", "hass", "render", "setConfig"], "Text Effect prototype surface must remain exact");
assert.equal(runtimeReliability.includes("component-text-effect-v1"), false, "Text Effect must not depend on a runtime compatibility patch");

const style = `\n:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
.row{min-height:70px;padding:12px 14px;display:grid;grid-template-columns:PLACEHOLDERminmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{position:relative;display:inline-block;max-width:100%;font-size:13px;line-height:1.25;font-weight:650;letter-spacing:-.005em;white-space:nowrap;color:var(--primary-text-color)}.base{position:relative;z-index:2}.desc{margin-top:4px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stamp .title{padding-bottom:4px}.stamp .title:after{content:'';position:absolute;z-index:1;left:0;bottom:0;width:100%;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent 0%,var(--primary-color) 42%,var(--primary-color) 58%,transparent 100%);background-size:220% 100%;opacity:.72;animation:stampSweep SPEEDs cubic-bezier(.4,0,.2,1) infinite}
.typewave .title:after{content:attr(data-text);position:absolute;z-index:3;inset:0;color:var(--primary-color);clip-path:inset(0 100% 0 0);animation:textSweep SPEEDs cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
.overprint .title:after{content:attr(data-text);position:absolute;z-index:1;inset:0;color:var(--primary-color);opacity:0;filter:blur(.15px);animation:softPrint SPEEDs ease-in-out infinite;pointer-events:none}
.signal .title{padding-left:16px}.signal .title:before{content:'';position:absolute;left:1px;top:50%;width:7px;height:7px;margin-top:-3.5px;border:1.5px solid var(--primary-color);border-radius:2px;transform:rotate(45deg);opacity:.45;animation:signalPulse SPEEDs cubic-bezier(.4,0,.2,1) infinite}.signal .title:after{content:'';position:absolute;left:3px;top:50%;width:3px;height:3px;margin-top:-1.5px;border-radius:50%;background:var(--primary-color);animation:signalDot SPEEDs cubic-bezier(.4,0,.2,1) infinite}
.rainbow_stamp .title{padding-bottom:4px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2,#ff375f);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:rainbow SPEEDs linear infinite}.rainbow_stamp .title:after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:999px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2);background-size:240% 100%;opacity:.55;animation:rainbow SPEEDs linear infinite}
@keyframes stampSweep{0%{background-position:210% 0;opacity:0}15%{opacity:.28}42%{opacity:.78}70%{opacity:.28}100%{background-position:-110% 0;opacity:0}}@keyframes textSweep{0%,8%{clip-path:inset(0 100% 0 0);opacity:0}22%{opacity:.75}52%{clip-path:inset(0 0 0 0);opacity:.75}72%{clip-path:inset(0 0 0 100%);opacity:.2}100%{clip-path:inset(0 0 0 100%);opacity:0}}@keyframes softPrint{0%,48%,100%{opacity:0;transform:translateX(0)}60%{opacity:.22;transform:translateX(.6px)}70%{opacity:.1;transform:translateX(0)}}@keyframes signalPulse{0%,100%{opacity:.25;transform:rotate(45deg) scale(.88)}48%{opacity:.7;transform:rotate(45deg) scale(1.06)}70%{opacity:.35;transform:rotate(45deg) scale(.96)}}@keyframes signalDot{0%,100%{opacity:.35;transform:scale(.7)}48%{opacity:1;transform:scale(1)}70%{opacity:.5;transform:scale(.8)}}@keyframes rainbow{to{background-position:260% 50%}}
@media(prefers-reduced-motion:reduce){.stamp .title:after,.typewave .title:after,.overprint .title:after,.signal .title:before,.signal .title:after,.rainbow_stamp .title,.rainbow_stamp .title:after{animation:none!important}.stamp .title:after{opacity:.35;background:var(--primary-color)}.typewave .title:after,.overprint .title:after{display:none}.signal .title:before{opacity:.45}.signal .title:after{opacity:.7}}
@media(max-width:700px){.row{padding:12px}.desc{font-size:12px}}
`;
const settledStyle = ".row.settled .title:after,.row.settled .title:before,.row.settled .title{animation:none!important}.row.settled.typewave .title:after,.row.settled.overprint .title:after{display:none}.row.settled.stamp .title:after{opacity:.35;background:var(--primary-color)}.row.settled.signal .title:before{opacity:.45}.row.settled.signal .title:after{opacity:.7}";
const markup = (config, effect, speed) => {
  const text = escapeHtml(config.text);
  const icon = config.icon ? `<span class="icon"><ha-icon icon="${escapeHtml(config.icon)}"></ha-icon></span>` : "";
  const css = style.replace("PLACEHOLDER", config.icon ? "40px " : "").replaceAll("SPEED", speed);
  return `<style>${css}</style><style>${settledStyle}</style><ha-card><div class="row ${effect}">${icon}<div class="copy"><div class="title" data-text="${text}"><span class="base">${text}</span></div>${config.description ? `<div class="desc">${escapeHtml(config.description)}</div>` : ""}</div></div></ha-card>`;
};
const card = new Card();
assert.deepEqual(Object.keys(card), ["shadowRoot", "settleTimer"], "Text Effect constructor fields must remain exact");
assert.throws(() => card.setConfig({}), /text is required/, "missing text must reject before configuration mutation");
assert.equal(Object.hasOwn(card, "c"), false, "invalid initial config must not create c");
card.setConfig({ text: "Ready" });
assert.deepEqual(Object.keys(card.c), ["effect", "description", "icon", "speed", "text"], "Text Effect defaults must retain key order");
assert.equal(card.shadowRoot.innerHTML, markup(card.c, "stamp", 2.6), "default Text Effect DOM and CSS must remain exact");
assert.equal(timers.get(card.settleTimer).delay, 2680, "default settle delay must remain speed plus 80ms");
assert.equal(card.getCardSize(), 1, "Text Effect size must remain one");
const originalConfig = card.c;
const originalTimer = card.settleTimer;
const originalMarkup = card.shadowRoot.innerHTML;
assert.throws(() => card.setConfig({ text: "" }), /text is required/, "empty text must reject");
assert.equal(card.c, originalConfig, "invalid config must preserve the current config");
assert.equal(card.settleTimer, originalTimer, "invalid config must preserve the pending settle timer");
assert.equal(card.shadowRoot.innerHTML, originalMarkup, "invalid config must preserve current DOM");
card.hass = { states: {} };
assert.equal(card.h.states !== undefined, true, "hass must remain a stored no-render input");
assert.equal(card.settleTimer, originalTimer, "hass must not replace the settle timer");

const effect = new Card();
effect.setConfig({ text: '<>&"\'', description: '<>&"\'', icon: 'mdi:<>&"\'', effect: "typewave", speed: 9 });
assert.equal(effect.shadowRoot.innerHTML, markup(effect.c, "typewave", 6), "overrides, escaping, icon layout and clamped speed must retain exact DOM/CSS");
assert.equal(timers.get(effect.settleTimer).delay, 6080, "upper speed clamp must drive settle timing");
effect.setConfig({ text: "Fallback", effect: "unknown", speed: 1 });
assert.equal(effect.shadowRoot.innerHTML, markup(effect.c, "stamp", 1.6), "unknown effects and lower speed clamp must retain fallback rendering");
assert.equal(timers.get(effect.settleTimer).delay, 1680, "lower speed clamp must drive settle timing");
for (const acceptedEffect of ["overprint", "signal", "rainbow_stamp"]) {
  const accepted = new Card();
  accepted.setConfig({ text: acceptedEffect, effect: acceptedEffect });
  assert.equal(accepted.shadowRoot.innerHTML, markup(accepted.c, acceptedEffect, 2.6), `${acceptedEffect} must retain its exact effect class and CSS`);
}
const replacedTimer = effect.settleTimer;
effect.setConfig({ text: "Zero speed", speed: 0 });
assert.equal(cleared.includes(replacedTimer), true, "reconfiguration must clear the replaced settle timer");
assert.equal(timers.get(effect.settleTimer).delay, 2680, "falsey speed must retain the default speed");

const invalidSpeed = new Card();
invalidSpeed.setConfig({ text: "Before invalid speed" });
const invalidSpeedTimer = invalidSpeed.settleTimer;
const invalidSpeedMarkup = invalidSpeed.shadowRoot.innerHTML;
assert.throws(() => invalidSpeed.setConfig({ text: "After invalid speed", speed: Symbol("speed") }), /Symbol value to a number/, "Symbol speed must retain native numeric coercion failure");
assert.equal(invalidSpeed.c.text, "After invalid speed", "speed coercion failure must retain the replacement config");
assert.equal(cleared.includes(invalidSpeedTimer), true, "speed coercion failure must cancel the previous timer before failing");
assert.equal(invalidSpeed.settleTimer, null, "speed coercion failure must leave no pending timer");
assert.equal(invalidSpeed.shadowRoot.innerHTML, invalidSpeedMarkup, "speed coercion failure must retain the previous DOM");

const reconnecting = new Card();
reconnecting.setConfig({ text: "Reconnect" });
const firstTimer = reconnecting.settleTimer;
const firstRow = reconnecting.shadowRoot.row;
reconnecting.disconnectedCallback();
assert.equal(reconnecting.settleTimer, null, "disconnect must clear the pending settle timer");
assert.equal(cleared.includes(firstTimer), true, "disconnect must cancel the pending settle timer");
assert.equal(firstRow.classList.contains("settled"), false, "disconnect must retain unfinished output");
reconnecting.connectedCallback();
const replayTimer = reconnecting.settleTimer;
assert.notEqual(replayTimer, firstTimer, "reconnect must restart unfinished configured output");
assert.equal(timers.get(replayTimer).delay, 2680, "reconnect must reschedule using the configured speed");
timers.get(replayTimer).callback();
assert.equal(reconnecting.settleTimer, null, "settlement must release the timer field");
assert.equal(reconnecting.shadowRoot.row.classList.contains("settled"), true, "settlement must mark the retained row");
const settledRow = reconnecting.shadowRoot.row;
const settledMarkup = reconnecting.shadowRoot.innerHTML;
reconnecting.disconnectedCallback();
reconnecting.connectedCallback();
assert.equal(reconnecting.shadowRoot.row, settledRow, "reconnect must not replay already-settled output");
assert.equal(reconnecting.shadowRoot.innerHTML, settledMarkup, "reconnect must retain already-settled DOM");
assert.equal(reconnecting.settleTimer, null, "already-settled reconnect must not schedule another timer");

console.log("Text Effect check passed: metadata, exact effects/markup, config failures, speed/timers and detached reconnect settlement");
