import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-security-camera-wall-v3";

export default {
  component,
  profile: "async-visualisation",
  async run() {
    const harness = createComponentHarness({ capabilities: ["document-events", "global-events"] });
    const camera = { id: "driveway", entityId: "camera.driveway", name: "Driveway", online: true, active: false };
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.loadSecurityModel = async () => ({
      cameras: [camera], profile: { viewer: { preferred_stream: "live" } },
    });
    await harness.loadFile("src/components/security-camera-wall.js");
    const card = harness.card(component);
    card.setConfig({ title: "Cameras", columns: 3 });
    card.hass = { states: { "camera.driveway": { state: "idle", attributes: { entity_picture: "/api/camera_proxy/camera.driveway" } } } };
    await harness.flushMicrotasks(6);
    const tile = card.tiles.get("driveway");
    assert.ok(tile, "the available camera must have one visible tile");
    assert.equal(card.shadowRoot.querySelector("h2")?.textContent, "Cameras");
    assert.equal(tile.snapshot.alt, "Driveway camera snapshot", "snapshots retain descriptive camera alternative text");
    tile.snapshot.dispatchEvent(new harness.context.Event("load"));
    assert.equal(tile.stream?.localName, "ha-camera-stream", "the wall must create Home Assistant's native live stream only after its snapshot is ready");
    assert.equal(tile.stream.hass, card._hass, "the native stream must receive current Hass state");
    card.disconnectedCallback();
    assert.equal(tile.stream, null, "disconnect must stop an active native stream");
    assert.equal(card.tiles.size, 0, "disconnect must release camera tiles rather than retaining stale playback");
  },
};
