import assert from "node:assert/strict";
import { deferred } from "../fixtures/async.mjs";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-energy-summary-v1";

export default {
  component,
  profile: "async-visualisation",
  async run() {
    const harness = createComponentHarness({ capabilities: ["global-events"] });
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    const first = deferred();
    const second = deferred();
    let requests = 0;
    shared.createLifecycle = () => ({ connect() {}, disconnect() {} });
    shared.energyDayState = { get: () => "2026-08-26", today: () => "2026-08-26", subscribe: () => () => {} };
    shared.energyDayData = { get: () => (++requests === 1 ? first.promise : second.promise), invalidateProfile() {} };
    shared.formatCalendarDay = () => "26 Aug";
    shared.formatPower = (_hass, value) => value == null ? "—" : `${value} W`;
    shared.formatEnergy = (_hass, value) => value == null ? "—" : `${value} kWh`;
    await harness.loadFile("src/components/energy-summary.js");
    const card = harness.card(component);
    card.setConfig({ profile: "house", title: "House energy" });
    card.hass = { states: {} };
    card.load(true);
    first.resolve({ house_w: 10, solar_w: 20, grid_w: 0 });
    await harness.flushMicrotasks(4);
    second.resolve({ house_w: 700, solar_w: 400, grid_w: -100, consumed_kwh: 4, generated_kwh: 2, imported_kwh: 1, exported_kwh: 3, coverage: 1 });
    await harness.flushMicrotasks(5);
    assert.equal(card.elements.title.textContent, "House energy");
    const house = card.shadowRoot.querySelector(".house");
    harness.interactions.find((handle) => handle.element === house)?.invokePrimary();
    assert.deepEqual(harness.moreInfo.map((entry) => entry.entityId), ["sensor.ha_component_house_power"], "the live house metric must retain its More Info destination after asynchronous refresh");
    card.disconnectedCallback();
    assert.equal(card.dayUnsub, null, "disconnect must release selected-day subscriptions");
  },
};
