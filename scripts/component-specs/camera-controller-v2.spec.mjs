import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-camera-controller-v2";

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness({ capabilities: ["global-events"] });
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    shared.createDialogController = (_host, dialog) => ({ open() { dialog.open = true; }, close() { dialog.open = false; }, setBusy() {} });
    shared.waitForEntityState = async () => {};
    shared.loadSecurityModel = async () => ({ cameras: [{ id: "front", entityId: "camera.front", name: "Front", online: true, active: false, switches: [{ role: "Recording", entity: { entity_id: "switch.front_recording" } }], detections: [], actions: [], ptz: [], classifications: [] }] });
    await harness.loadFile("src/components/camera-controller-v2.js");
    const card = harness.card(component);
    card.setConfig({ entity: "camera.front" });
    card.hass = { states: { "camera.front": { state: "idle", attributes: {} }, "switch.front_recording": { state: "on", attributes: {} } }, callService: async (...args) => calls.push(args) };
    await harness.flushMicrotasks(5);
    await card.toggle(card.camera.switches[0], true);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [], "turning off recording must require an explicit confirmation");
    await card.toggle(card.camera.switches[0], true);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["switch", "turn_off", { entity_id: "switch.front_recording" }]], "the confirmed safety action must target only the camera recording switch");
    card.camera = { ...card.camera, online: false };
    card.render();
    assert.equal(card.elements.view.disabled, true, "an unavailable camera must not expose a live-view action");
  },
};
