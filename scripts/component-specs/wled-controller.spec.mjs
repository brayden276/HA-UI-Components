import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-wled-controller-v1";

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness();
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    shared.createRequestCoalescer = (run) => ({ request: (value) => run(value), destroy() {} });
    shared.waitForEntityState = async () => {};
    shared.WLED_DOMAIN = (entityId) => entityId.split(".")[0];
    shared.WLED_NAME = (entry) => entry.name || entry.entity_id;
    shared.WLED_INVALID = new Set(["unknown", "unavailable"]);
    shared.WLED_HD = { REG: {
      load: async () => ({ entities: [{ entity_id: "light.strip", device_id: "wled", platform: "wled", name: "Main" }], devices: [{ id: "wled", name: "Desk lights" }], byDevice: new Map([["wled", [{ entity_id: "light.strip", device_id: "wled", platform: "wled", name: "Main" }]]]) }),
      subscribe: () => () => {},
    } };
    await harness.loadFile("src/components/wled-controller.js");
    const card = harness.card(component);
    assert.throws(() => card.setConfig({}), /requires entity/i);
    card.setConfig({ entity: "light.strip" });
    card.hass = { states: { "light.strip": { state: "on", attributes: { brightness: 128, friendly_name: "Desk lights" } } }, callService: async (...args) => calls.push(args) };
    await harness.flushMicrotasks(5);
    assert.equal(card.statusEl.textContent, "50%", "brightness must remain visible as an accessible percentage");
    await card.togglePower();
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["light", "toggle", { entity_id: "light.strip" }]], "power must target the configured physical WLED light");
    card.hass = { ...card.h, states: { "light.strip": { state: "unavailable", attributes: {} } } };
    assert.equal(card.power.disabled, true, "unavailable WLED hardware must not accept controls");
    card.disconnectedCallback();
    assert.equal(card.unsub, null, "disconnect must release registry subscriptions");
  },
};
