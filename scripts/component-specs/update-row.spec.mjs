import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-update-row-v3";

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness();
    harness.context.confirm = () => true;
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.UPDATE_CARD_STYLES = "";
    await harness.loadFile("src/components/update-row.js");
    const card = harness.card(component);
    card.setConfig({ entity: "update.camera" });
    card.hass = { states: { "update.camera": { entity_id: "update.camera", state: "on", attributes: { title: "Camera Update", installed_version: "1.0", latest_version: "1.1" } } }, callService: async (...args) => calls.push(args) };
    assert.match(card.shadowRoot.querySelector(".action")?.getAttribute("aria-label") ?? "", /Update Camera/);
    await card._install(card._data());
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["update", "install", { entity_id: "update.camera" }]], "a row must install only its configured update entity");
    card.hass = { ...card.h, states: { "update.camera": { entity_id: "update.camera", state: "unavailable", attributes: {} } } };
    assert.equal(card.shadowRoot.querySelector(".action")?.hasAttribute("disabled"), true, "unavailable updates must not expose a destructive action");
  },
};
