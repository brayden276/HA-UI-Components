import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-camera-controller-v1";

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness();
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    shared.waitForEntityState = async () => {};
    harness.context.__homeDashboardV2 = { areaOf: () => "front", prefs: async () => ({ hd: false }), REG: { load: async () => ({ entities: [
      { entity_id: "camera.front", device_id: "front", platform: "onvif", name: "Main Stream" },
      { entity_id: "button.front_restart", device_id: "front", name: "Restart" },
    ], devices: [{ id: "front", name: "Camera" }], areaMap: new Map([["front", { name: "Front" }]]), byDevice: new Map([["front", [
      { entity_id: "camera.front", device_id: "front", platform: "onvif", name: "Main Stream" }, { entity_id: "button.front_restart", device_id: "front", name: "Restart" },
    ]]]) }), subscribe: () => () => {} } };
    await harness.loadFile("src/components/camera-controller.js");
    const card = harness.card(component);
    assert.throws(() => card.setConfig({}), /requires entity/i);
    card.setConfig({ entity: "camera.front" });
    card.hass = { states: { "camera.front": { state: "idle", attributes: {} }, "button.front_restart": { state: "unknown", attributes: {} } }, callService: async (...args) => calls.push(args) };
    await harness.flushMicrotasks(5);
    card.press("button.front_restart");
    assert.equal(calls.length, 0, "camera maintenance controls must require a second explicit action");
    await card.press("button.front_restart");
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["button", "press", { entity_id: "button.front_restart" }]]);
    await card.openCamera();
    assert.deepEqual(harness.moreInfo, [{ host: card, entityId: "camera.front" }], "camera viewing must use the selected available stream entity");
  },
};
