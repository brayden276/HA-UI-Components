import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "energy-history-card-v3";

export default {
  component,
  profile: "async-visualisation",
  async run() {
    const harness = createComponentHarness({ capabilities: ["global-events"] });
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    harness.context.ResizeObserver = class { observe() {} disconnect() {} };
    shared.calendarDayRange = () => ({ start: 0, end: 600000 });
    shared.energyDayState = { get: () => "2026-08-26", today: () => "2026-08-26", subscribe: () => () => {} };
    shared.energyDayData = { get: async () => ({ range: { start: 0, end: 600000 }, series: { house: [{ t: 0, v: 500 }], solar: [{ t: 0, v: 200 }], grid: [{ t: 0, v: -100 }] } }), invalidateProfile() {} };
    shared.formatCalendarDay = () => "Today";
    shared.formatPower = (_hass, value) => `${Math.round(value || 0)} W`;
    shared.formatTime = () => "12:00";
    await harness.loadFile("src/components/energy-history-card.js");
    const card = harness.card(component);
    card.setConfig({ profile: "house", calendar_day: true, day_channel: "energy" });
    // Geometry is deliberately not a capability of this strict harness. Mark
    // the initial range observed so this contract can verify lifecycle and
    // semantics without pretending to render a browser SVG layout.
    card._lastRangeKey = card._rangeKey(card._range());
    card.hass = { states: {} };
    assert.equal(card.getCardSize(), 7);
    assert.equal(card.shadowRoot.querySelector("svg")?.getAttribute("aria-label"), "Household power history", "history must keep its semantic chart description");
    assert.match(card.shadowRoot.innerHTML, /Loading history/, "history must communicate its pending data state without a fabricated chart");
    card.disconnectedCallback();
    assert.equal(card._dayUnsubscribe, null, "disconnect must release calendar-day listeners");
  },
};
