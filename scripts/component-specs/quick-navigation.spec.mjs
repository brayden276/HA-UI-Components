import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-quick-nav-v2";

export default {
  component,
  profile: "entity-aware",
  async run() {
    const harness = createComponentHarness();
    class DashboardBaseCard extends harness.context.HTMLElement {
      constructor() { super(); this.attachShadow({ mode: "open" }); }
      escapeHtml(value) { return harness.context.__HA_COMPONENT_LIBRARY_SHARED__.escapeHtml(value); }
      cardStyles() { return ".base-card{}"; }
    }
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.DashboardBaseCard = DashboardBaseCard;
    await harness.loadFile("src/components/quick-navigation.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const staticCard = harness.card(component);
    staticCard.setConfig({});
    assert.equal(staticCard.getCardSize(), 1);
    assert.match(staticCard.shadowRoot.innerHTML, /Context/);
    assert.match(staticCard.shadowRoot.innerHTML, /id="action-1"[^>]*disabled/);
    assert.match(staticCard.shadowRoot.innerHTML, /id="action-2"[^>]*disabled/);

    const card = harness.card(component);
    const hass = { states: { "sensor.weather": { state: "Sunny", attributes: {} } }, formatEntityState: (state) => state.state };
    card.setConfig({ left_entity: "sensor.weather", action_1_path: "/home", action_2_path: "/settings" });
    card.hass = hass;
    const actions = harness.interactions.slice(-3);
    actions[0].invokePrimary();
    actions[1].invokePrimary();
    actions[2].invokePrimary();
    assert.deepEqual(harness.moreInfo.at(-1), { host: card, entityId: "sensor.weather" });
    assert.deepEqual(harness.navigation, ["/home", "/settings"]);
    card.disconnectedCallback();
    assert.equal(actions.every((handle) => !handle.destroyed), true, "retained local controls remain live through a transient detach");
    card.connectedCallback();
    assert.equal(actions.every((handle) => handle.destroyed), true, "the reconnect render replaces stale control bindings");
  },
};
