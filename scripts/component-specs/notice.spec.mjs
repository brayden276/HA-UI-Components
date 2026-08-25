import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-notice-v2";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/notice.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const staticCard = harness.card(component);
    staticCard.setConfig({ tone: "warning", title: "Door open", message: "Check the garage" });
    assert.equal(staticCard.getCardSize(), 2);
    assert.match(staticCard.shadowRoot.innerHTML, /warning/);
    assert.equal(staticCard.shadowRoot.querySelector("button"), null);

    const navigable = harness.card(component);
    navigable.setConfig({ navigation_path: "/garage" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.navigation, ["/garage"]);
    const entity = harness.card(component);
    entity.setConfig({ entity: "binary_sensor.garage" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo.at(-1), { host: entity, entityId: "binary_sensor.garage" });
  },
};
