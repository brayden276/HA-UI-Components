import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-update-summary-v3";

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness();
    harness.context.confirm = () => true;
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.UPDATE_CARD_STYLES = "";
    await harness.loadFile("src/components/update-summary.js");
    const card = harness.card(component);
    card.setConfig({ live_updates: true, update_all: true });
    card.hass = { states: {
      "update.a": { entity_id: "update.a", state: "on", attributes: {} },
      "update.home_assistant_core_update": { entity_id: "update.home_assistant_core_update", state: "on", attributes: {} },
      "update.busy": { entity_id: "update.busy", state: "on", attributes: { in_progress: true } },
    }, callService: async (...args) => calls.push(args) };
    assert.match(card.shadowRoot.innerHTML, /<span class="count">3<\/span>/, "live update totals must reflect pending update entities");
    await card._installAll();
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
      ["update", "install", { entity_id: ["update.a"] }],
      ["update", "install", { entity_id: "update.home_assistant_core_update" }],
    ], "bulk updates must exclude in-progress work and install restart-sensitive Core updates last");
  },
};
