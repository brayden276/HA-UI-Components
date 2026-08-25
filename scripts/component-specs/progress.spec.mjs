import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-progress-v2";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/progress-target.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const staticCard = harness.card(component);
    staticCard.setConfig({ progress: 135, value: "135%" });
    assert.equal(staticCard.getCardSize(), 2);
    assert.match(staticCard.shadowRoot.innerHTML, /width:100%/, "the visible progress is clamped to the supported range");
    assert.equal(staticCard.shadowRoot.querySelector("button"), null);

    const navigable = harness.card(component);
    navigable.setConfig({ navigation_path: "/energy" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.navigation, ["/energy"]);
    const entity = harness.card(component);
    entity.setConfig({ entity: "sensor.energy" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo.at(-1), { host: entity, entityId: "sensor.energy" });
  },
};
