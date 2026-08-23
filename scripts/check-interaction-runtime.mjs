import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "src/shared/interaction.js"), "utf8");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

class MockCustomEvent {
  constructor(type, options = {}) { this.type = type; Object.assign(this, options); }
}

class MockElement {
  constructor() {
    this.disabled = false;
    this.attributes = new Map();
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    const rows = this.listeners.get(type) ?? [];
    rows.push(listener);
    this.listeners.set(type, rows);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((row) => row !== listener));
  }
  dispatch(type, data = {}) {
    const event = {
      type,
      button: 0,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      detail: 1,
      repeat: false,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { this.immediatePropagationStopped = true; },
      ...data,
    };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
    return event;
  }
  dispatchEvent(event) {
    for (const listener of [...(this.listeners.get(event.type) ?? [])]) listener(event);
    return true;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, force) {
    const enabled = force ?? !this.attributes.has(name);
    if (enabled) this.attributes.set(name, "");
    else this.attributes.delete(name);
    return enabled;
  }
}

const context = {
  AbortController,
  CustomEvent: MockCustomEvent,
  clearInterval,
  clearTimeout,
  console,
  matchMedia: () => ({ matches: false }),
  setInterval,
  setTimeout,
};
context.globalThis = context;
vm.runInContext(source, vm.createContext(context), { filename: "src/shared/interaction.js" });
const { interaction, createRequestCoalescer, waitForEntityState } = context.__HA_COMPONENT_LIBRARY_SHARED__;

{
  const element = new MockElement();
  let calls = 0;
  interaction(element, { primary: () => { calls += 1; } });
  element.dispatch("pointerdown");
  element.dispatch("pointerup");
  assert.equal(calls, 1, "pointer tap should invoke the primary action exactly once");
}

{
  const element = new MockElement();
  let calls = 0;
  interaction(element, { primary: () => { calls += 1; } });
  element.dispatch("keydown", { key: "Enter", detail: 0 });
  element.dispatch("keyup", { key: "Enter", detail: 0 });
  assert.equal(calls, 1, "keyboard activation should invoke the primary action exactly once");
}

{
  const element = new MockElement();
  element.disabled = true;
  let calls = 0;
  interaction(element, { primary: () => { calls += 1; } });
  element.dispatch("pointerdown");
  element.dispatch("pointerup");
  assert.equal(calls, 0, "disabled controls must not invoke actions");
}

{
  const element = new MockElement();
  let primary = 0;
  let held = 0;
  interaction(element, {
    primary: () => { primary += 1; },
    hold: () => { held += 1; },
    holdDelay: 250,
  });
  element.dispatch("pointerdown");
  await sleep(280);
  element.dispatch("pointerup");
  assert.equal(held, 1, "hold should invoke the hold action");
  assert.equal(primary, 0, "hold must suppress the primary tap action");
}

{
  const element = new MockElement();
  let calls = 0;
  interaction(element, {
    primary: () => { calls += 1; },
    repeat: { delay: 150, interval: 40 },
  });
  element.dispatch("pointerdown");
  await sleep(255);
  element.dispatch("pointerup");
  assert.ok(calls >= 2, "held repeat controls should issue repeated actions");
}

{
  const element = new MockElement();
  let calls = 0;
  interaction(element, { primary: () => { calls += 1; }, moveTolerance: 8 });
  element.dispatch("pointerdown", { clientX: 1, clientY: 1 });
  element.dispatch("pointermove", { clientX: 20, clientY: 1 });
  element.dispatch("pointerup", { clientX: 20, clientY: 1 });
  assert.equal(calls, 0, "dragging beyond the movement tolerance must cancel activation");
}

{
  const element = new MockElement();
  assert.throws(
    () => interaction(element, { primary: () => {}, hold: () => {}, repeat: true }),
    /mutually exclusive/,
    "hold and repeat must remain mutually exclusive",
  );
}

{
  const element = new MockElement();
  element.setAttribute("aria-pressed", "false");
  const handle = interaction(element, {
    primary: () => Promise.reject(new Error("expected")),
    optimistic: "toggle",
  });
  await assert.rejects(handle.invoke(), /expected/);
  assert.equal(element.getAttribute("aria-pressed"), "false", "failed optimistic actions must roll back");
}

{
  const element = new MockElement();
  let resolveRequest;
  const request = new Promise((resolvePromise) => { resolveRequest = resolvePromise; });
  const handle = interaction(element, { primary: () => request });
  const pending = handle.invoke();
  assert.equal(element.getAttribute("aria-busy"), "true", "pending async action should expose aria-busy");
  handle.destroy();
  assert.equal(handle.destroyed, true, "destroyed handle should report destroyed state");
  assert.equal(element.getAttribute("aria-busy"), "false", "destroy should clear pending accessibility state");
  assert.equal(element.hasAttribute("data-interaction-pending"), false, "destroy should clear pending feedback state");
  resolveRequest();
  await pending;
}

{
  const values = [];
  let releaseFirst;
  const first = new Promise((resolvePromise) => { releaseFirst = resolvePromise; });
  const coalescer = createRequestCoalescer(async (value) => {
    values.push(value);
    if (value === 1) await first;
  });
  coalescer.request(1);
  await sleep(0);
  coalescer.request(2);
  coalescer.request(3);
  releaseFirst();
  await sleep(30);
  assert.deepEqual(values, [1, 3], "coalescer should retain only the latest queued request");
  assert.equal(coalescer.pending, false, "coalescer should become idle after draining");
}

{
  let idle = 0;
  let release;
  const gate = new Promise((resolvePromise) => { release = resolvePromise; });
  const coalescer = createRequestCoalescer(async () => gate, { onIdle: () => { idle += 1; } });
  coalescer.request("x");
  await sleep(0);
  coalescer.destroy();
  release();
  await sleep(10);
  assert.equal(coalescer.destroyed, true, "destroyed coalescer should report destroyed state");
  assert.equal(idle, 0, "destroyed coalescer must not invoke post-destroy callbacks");
}

{
  const hass = { states: { "light.test": { state: "off" } } };
  const wait = waitForEntityState(() => hass, "light.test", (value) => value === "on", { timeout: 500, interval: 40 });
  setTimeout(() => { hass.states["light.test"].state = "on"; }, 60);
  const state = await wait;
  assert.equal(state.state, "on", "state confirmation should resolve with the confirmed entity state");
}

{
  const hass = { states: { "light.test": { state: "off" } } };
  await assert.rejects(
    waitForEntityState(hass, "light.test", (value) => value === "on", { timeout: 250, interval: 40 }),
    /timed out/,
    "state confirmation should reject when the expected state never arrives",
  );
}

console.log("Interaction runtime check passed: tap, keyboard, disabled, hold, repeat, drag cancellation, rollback, lifecycle, coalescing and state confirmation");
