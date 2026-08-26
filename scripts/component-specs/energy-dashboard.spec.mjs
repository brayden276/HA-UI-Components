import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-energy-dashboard-v1";

export default {
  component,
  profile: "composition-wrapper",
  async run() {
    const harness = createComponentHarness();
    await harness.loadSource(`
      for (const type of ["component-energy-day-selector-v1", "component-energy-summary-v1", "solar-daylight-card-v7", "energy-history-card-v3"]) {
        customElements.define(type, class extends HTMLElement { setConfig(config) { this.config = config; } set hass(value) { this.receivedHass = value; } });
      }
    `, "energy-dashboard-children.js");
    await harness.loadFile("src/components/energy-dashboard.js");
    const card = harness.card(component);
    const hass = { states: {} };
    card.setConfig({ profile: "house", day_channel: "day", weather_entity: "weather.home", sun_entity: "sun.home" });
    card.hass = hass;
    assert.equal(card._children.size, 4, "the Energy dashboard must retain its four public composition slots");
    assert.deepEqual(JSON.parse(JSON.stringify(card._children.get("history").config)), { profile: "house", calendar_day: true, day_channel: "day", bucket_minutes: 10, house_entity: "sensor.ha_component_house_power", solar_entity: "sensor.ha_component_solar_power", grid_entity: "sensor.ha_component_grid_power" }, "history must retain the shared Energy backend contract");
    assert.equal([...card._children.values()].every((child) => child.receivedHass === hass), true, "Hass must be forwarded to each retained Energy child");
  },
};
