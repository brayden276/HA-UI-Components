import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-section-separator-v2";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    class DashboardBaseCard extends harness.context.HTMLElement {
      constructor() { super(); this.attachShadow({ mode: "open" }); }
      set hass(_value) {}
      escapeHtml(value) { return harness.context.__HA_COMPONENT_LIBRARY_SHARED__.escapeHtml(value); }
      cardStyles() { return ".base-card{display:block}"; }
    }
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.DashboardBaseCard = DashboardBaseCard;
    await harness.loadFile("src/components/section-separator.js");
    await harness.customElements.whenDefined(component);
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(harness.context.customCards.map(({ type, name, description, preview }) => ({ type, name, description, preview })), [{ type: component, name: "Section Separator", description: "Reusable section separator component.", preview: true }]);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const card = harness.card(component);
    card.setConfig({});
    assert.ok(card.shadowRoot);
    assert.equal(card.getCardSize(), 1);
    assert.match(card.shadowRoot.innerHTML, /ha-icon icon="mdi:gesture-tap-button"/);
    assert.match(card.shadowRoot.innerHTML, /Section label/);
    assert.ok(card.shadowRoot.querySelector("div.wrap"));
    assert.ok(card.shadowRoot.querySelector("span.line"));

    card.setConfig({ icon: 'mdi:<&"\'', title: '<&"\'' });
    assert.match(card.shadowRoot.innerHTML, /mdi:&lt;&amp;&quot;&#39;/);
    assert.match(card.shadowRoot.innerHTML, /&lt;&amp;&quot;&#39;/);

    const before = card.shadowRoot.innerHTML;
    card.hass = { states: { "sensor.example": {} } };
    assert.equal(card.shadowRoot.innerHTML, before, "Hass updates must not alter this static presentational card");
    card.setConfig({ title: "Updated" });
    assert.match(card.shadowRoot.innerHTML, />Updated</);
    assert.equal(card.shadowRoot.querySelector("button"), null, "a separator must remain non-interactive");
  },
};
