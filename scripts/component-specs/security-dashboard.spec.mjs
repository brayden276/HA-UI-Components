import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-security-dashboard-v1";

export default {
  component,
  profile: "composition-wrapper",
  async run() {
    const harness = createComponentHarness({ capabilities: ["document-events", "global-events"] });
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    shared.createDialogController = (_host, dialog) => ({ open() { dialog.open = true; }, close() { dialog.open = false; }, setBusy() {} });
    shared.loadSecurityModel = async () => ({ cameras: [], entries: [], quickActions: [], attention: [], onlineCameras: 0, allClear: true });
    await harness.loadFile("src/components/security-dashboard.js");
    const card = harness.card(component);
    card.setConfig({ title: "House security", profile: "security" });
    card.hass = { states: { "camera.front": { entity_id: "camera.front", state: "idle", attributes: {} } } };
    harness.context.document.body.append(card);
    await harness.flushMicrotasks(6);
    assert.equal(card.shadowRoot.querySelector(".page-title")?.textContent, "House security");
    assert.match(card.shadowRoot.querySelector(".status-copy")?.textContent ?? "", /All clear/, "the security status must have a calm zero-alert state");
    const camera = { id: "front", entityId: "camera.front", name: "Front", online: true };
    card.startViewer(camera);
    assert.equal(card.viewerStream?.localName, "ha-camera-stream", "the dashboard must use the native Home Assistant stream element for live viewing");
    assert.equal(card.viewerStream?.stateObj.entity_id, "camera.front");
    card.stopViewer();
    assert.equal(card.viewerStream, null, "closing a viewer must release its native stream");
    card.disconnectedCallback();
    assert.equal(card.surfaceInteractions.length, 0, "disconnect must release dashboard interactions");
  },
};
