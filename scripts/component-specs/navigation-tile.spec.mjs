import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-nav-tile-v2";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    class DashboardBaseCard extends harness.context.HTMLElement {
      constructor() { super(); this.attachShadow({ mode: "open" }); }
      escapeHtml(value) { return harness.context.__HA_COMPONENT_LIBRARY_SHARED__.escapeHtml(value); }
      cardStyles() { return ".base-card{}"; }
    }
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.DashboardBaseCard = DashboardBaseCard;
    await harness.loadFile("src/components/navigation-tile.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const staticCard = harness.card(component);
    staticCard.setConfig({ title: "Laundry", context: "Upstairs" });
    assert.equal(staticCard.getCardSize(), 1);
    assert.equal(staticCard.shadowRoot.querySelector("button.nav"), null, "a tile without a destination is static semantic content");
    assert.match(staticCard.shadowRoot.innerHTML, /Laundry/);

    const destination = { path: "/dashboard/laundry" };
    const actionable = harness.card(component);
    actionable.setConfig({ navigation_path: destination });
    const first = harness.interactions.at(-1);
    assert.equal(actionable.shadowRoot.querySelector("button.nav")?.getAttribute("type"), "button");
    first.invokePrimary();
    assert.deepEqual(harness.navigation, [destination]);
    actionable.disconnectedCallback();
    assert.equal(first.destroyed, true, "the owned interaction must be released on disconnect");
    actionable.connectedCallback();
    assert.equal(harness.interactions.at(-1).destroyed, false, "reconnect must bind a fresh interaction");
  },
};
