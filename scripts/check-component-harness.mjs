import assert from "node:assert/strict";
import { createComponentHarness } from "./fixtures/component-harness.mjs";

const basic = createComponentHarness();
assert.throws(() => basic.context.document.addEventListener("click", () => {}), /explicit document-events capability/);
assert.throws(() => basic.context.document.body.getBoundingClientRect(), /does not implement getBoundingClientRect/);

const harness = createComponentHarness({ capabilities: ["document-events", "global-events", "portals"] });
let documentEvents = 0;
let globalEvents = 0;
harness.context.document.addEventListener("validation-event", () => { documentEvents += 1; });
harness.context.addEventListener("validation-event", () => { globalEvents += 1; });
await harness.loadSource(`
  class HarnessChild extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); }
    connectedCallback() { this.connected = (this.connected || 0) + 1; }
    disconnectedCallback() { this.disconnected = (this.disconnected || 0) + 1; }
    setConfig(config) { this.config = config; }
  }
  customElements.define("harness-child", HarnessChild);
`, "harness-child-fixture.js");
const child = harness.context.document.createElement("harness-child");
assert.equal(child.isConnected, false, "new custom elements must begin disconnected");
harness.context.document.body.append(child);
assert.equal(child.connected, 1, "append must connect the child exactly once");
child.dispatchEvent(new harness.context.Event("validation-event", { bubbles: true }));
assert.equal(documentEvents, 1, "bubbling events must reach document listeners when enabled");
assert.equal(globalEvents, 1, "bubbling events must reach global listeners when enabled");
const sibling = harness.context.document.createElement("div");
harness.context.document.body.append(sibling);
sibling.append(child);
assert.equal(child.disconnected, 1, "moving between connected parents must disconnect once");
assert.equal(child.connected, 2, "moving between connected parents must reconnect once");
child.remove();
assert.equal(child.isConnected, false, "removal must disconnect the child");
assert.equal(child.disconnected, 2, "removal must invoke disconnectedCallback once");

const configured = harness.createChildCard("harness-child", { mode: "fixture" }, { states: {} });
assert.deepEqual(configured.config, { mode: "fixture" }, "child-card helper must apply configuration");
assert.deepEqual(configured.hass, { states: {} }, "child-card helper must forward Hass");
const portal = harness.context.document.createElement("dialog");
harness.openPortal(portal);
assert.equal(portal.parentNode, harness.context.document.body, "portal capability must append to the document body");
harness.closePortal(portal);
assert.equal(portal.parentNode, null, "closing a portal must remove it");

const timer = harness.timers.setTimeout(() => { documentEvents += 1; }, 0);
harness.timers.run(timer);
assert.equal(documentEvents, 2, "deterministic timers must run only when explicitly advanced");
console.log("Component harness check passed: strict capabilities, custom-element readiness, DOM lifecycle, propagation, child cards, portals and deterministic timers");
