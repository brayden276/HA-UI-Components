import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-garage-door-controller-v1";

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness();
    await harness.loadFile("src/components/garage-door-controller.js");
    const card = harness.card(component);
    assert.throws(() => card.setConfig({ entity: "binary_sensor.garage" }), /control entity/i);
    card.setConfig({ entity: "binary_sensor.garage", control_entity: "button.garage_trigger", confirmation_timeout: 3000 });
    card.hass = {
      states: {
        "binary_sensor.garage": { state: "off", attributes: { friendly_name: "Garage Door Status" } },
        "button.garage_trigger": { state: "unknown", attributes: {} },
      },
      callService: async (...args) => calls.push(args),
    };
    assert.equal(card.shadowRoot.querySelector(".action")?.getAttribute("aria-label"), "Open garage door");
    const request = card.requestAction();
    await harness.flushMicrotasks(2);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["button", "press", { entity_id: "button.garage_trigger" }]], "opening must use the configured momentary button only");
    card.hass = { ...card._hass, states: { ...card._hass.states, "binary_sensor.garage": { state: "on", attributes: {} } } };
    await request;
    assert.match(card.shadowRoot.querySelector(".feedback")?.textContent ?? "", /confirmed/i, "the safety action must wait for physical state confirmation");
    card.hass = { ...card._hass, states: { ...card._hass.states, "button.garage_trigger": { state: "unavailable", attributes: {} } } };
    assert.equal(card.shadowRoot.querySelector(".action")?.disabled, true, "an unavailable operator must never be actionable");
  },
};
