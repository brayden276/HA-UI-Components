import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-empty-state-v3";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    harness.context.__HA_COMPONENT_LIBRARY_SHARED__.UPDATE_CARD_STYLES = ":host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}";
    await harness.loadFile("src/components/empty-state.js");
    await harness.customElements.whenDefined(component);
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(harness.context.customCards.map(({ type, name, description, preview }) => ({ type, name, description, preview })), [
      { type: component, name: "Empty State", description: "Reusable empty-state component.", preview: true },
      { type: "component-empty-state-v2", name: "Empty State V2", description: "Reusable compact empty-state component.", preview: true },
    ]);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const card = harness.card(component);
    assert.ok(card.shadowRoot);
    assert.equal(card.shadowRoot.innerHTML, "", "construction must not render before configuration");
    assert.equal(card.getCardSize(), 1);
    card.setConfig({});
    assert.match(card.shadowRoot.innerHTML, /mdi:check-circle-outline/);
    assert.match(card.shadowRoot.innerHTML, /Nothing requires attention/);
    assert.match(card.shadowRoot.innerHTML, /Supporting empty-state message\./);
    assert.ok(card.shadowRoot.querySelector("div.wrap"));
    assert.ok(card.shadowRoot.querySelector("div.title"));
    assert.ok(card.shadowRoot.querySelector("div.desc"));

    card.setConfig({ icon: undefined, title: null, message: false, unknownOption: "preserved" });
    assert.match(card.shadowRoot.innerHTML, /<ha-icon icon=""><\/ha-icon>/);
    assert.match(card.shadowRoot.innerHTML, /<div class="title"><\/div>/);
    assert.match(card.shadowRoot.innerHTML, /<div class="desc">false<\/div>/);
    assert.equal(card.c.unknownOption, "preserved");

    card.setConfig(null);
    assert.match(card.shadowRoot.innerHTML, /Nothing requires attention/);
    card.setConfig("xy");
    assert.equal(card.c[0], "x");
    assert.equal(card.c[1], "y");

    card.setConfig({ icon: 'mdi:<>&"\'', title: '<>&"\'', message: '<>&"\'' });
    assert.match(card.shadowRoot.innerHTML, /mdi:&lt;&gt;&amp;&quot;&#39;/);
    assert.match(card.shadowRoot.innerHTML, /&lt;&gt;&amp;&quot;&#39;/);

    const before = card.shadowRoot.innerHTML;
    card.hass = { states: { "sensor.example": {} } };
    assert.equal(card.shadowRoot.innerHTML, before, "Hass updates must not rerender static empty state");
    assert.equal(harness.interactions.length, 0, "empty state must not create interactions");

    const compact = harness.card("component-empty-state-v2");
    compact.setConfig({ title: "Compact", message: "Compatibility" });
    assert.equal(compact.getCardSize(), 1);
    assert.match(compact.shadowRoot.innerHTML, /Compact/);
    assert.match(compact.shadowRoot.innerHTML, /Compatibility/);
  },
};
