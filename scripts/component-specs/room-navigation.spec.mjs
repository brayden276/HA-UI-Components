import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-room-navigation-v1";

export default {
  component,
  profile: "registry-driven",
  async run() {
    const harness = createComponentHarness();
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.loadDashboardRegistries = async () => ({
      areas: [{ area_id: "living", name: "Living" }], devices: [],
      entities: [{ entity_id: "light.lamp", area_id: "living" }, { entity_id: "binary_sensor.presence", area_id: "living" }],
    });
    await harness.loadFile("src/components/room-navigation.js");
    const card = harness.card(component);
    assert.throws(() => card.setConfig({ navigation_path: "/living" }), /area is required/i);
    card.setConfig({ name: "Living", area: "living", navigation_path: "/living" });
    card.hass = {
      states: {
        "light.lamp": { entity_id: "light.lamp", state: "on", attributes: {} },
        "binary_sensor.presence": { entity_id: "binary_sensor.presence", state: "on", attributes: { device_class: "occupancy" } },
      },
      connection: {}, formatEntityState: (state) => state.state,
    };
    await harness.flushMicrotasks(4);
    const button = card.shadowRoot.querySelector("button");
    assert.match(button?.getAttribute("aria-label") ?? "", /Open Living.*1 light on/, "the room tile must expose its visible state to assistive technology");
    assert.equal(card.shadowRoot.querySelector("ha-card")?.getAttribute("data-presence"), "true", "active room presence must remain visually discoverable");
    harness.interactions.find((handle) => handle.element === button)?.invokePrimary();
    assert.deepEqual(harness.navigation, ["/living"], "the room action must preserve its configured dashboard path");
  },
};
