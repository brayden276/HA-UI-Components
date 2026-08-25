import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-status-row-v2";

export default {
  component,
  profile: "entity-aware",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/status-row.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const staticCard = harness.card(component);
    staticCard.setConfig({ interactive: false, entity: "sensor.ignored" });
    assert.equal(staticCard.getCardSize(), 2);
    assert.equal(staticCard.shadowRoot.querySelector("button.demo"), null, "explicitly non-interactive status must not expose a button");

    const navigable = harness.card(component);
    navigable.setConfig({ navigation_path: "/status" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.navigation, ["/status"]);
    const entity = harness.card(component);
    entity.setConfig({ entity: "sensor.status" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo.at(-1), { host: entity, entityId: "sensor.status" });
    const first = harness.interactions.at(-1);
    entity.disconnectedCallback();
    assert.equal(first.destroyed, true);
    entity.connectedCallback();
    assert.equal(harness.interactions.at(-1).destroyed, false);
  },
};
