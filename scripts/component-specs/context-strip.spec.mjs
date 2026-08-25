import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-context-strip-v3";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/context-strip.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public custom element must be registered");
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const staticCard = harness.card(component);
    staticCard.setConfig({ left_text: "Status", right_text: "Today" });
    assert.equal(staticCard.getCardSize(), 1);
    assert.equal(staticCard.shadowRoot.querySelectorAll("button").length, 0, "a card without an action is semantic static content");
    assert.match(staticCard.shadowRoot.innerHTML, /Status/);
    assert.match(staticCard.shadowRoot.innerHTML, /Today/);

    const card = harness.card(component);
    card.setConfig({ navigation_path: "/dashboard/living" });
    const [first] = harness.interactions.slice(-1);
    assert.equal(card.shadowRoot.querySelectorAll("button").length, 1, "an actionable card exposes a button");
    first.invokePrimary();
    assert.deepEqual(harness.navigation, ["/dashboard/living"]);

    card.disconnectedCallback();
    assert.equal(first.destroyed, false, "a transient disconnect retains the local DOM interaction");
    card.connectedCallback();
    assert.equal(first.destroyed, true, "the reconnect render releases the replaced interaction");
    assert.equal(harness.interactions.at(-1).destroyed, false);

    const moreInfo = harness.card(component);
    moreInfo.setConfig({ entity: "sensor.temperature" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo.map(({ entityId }) => entityId), ["sensor.temperature"]);
  },
};
