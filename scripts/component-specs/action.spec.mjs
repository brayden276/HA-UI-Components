import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-action-v2";

export default {
  component,
  profile: "entity-aware",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/action-card.js");
    await harness.customElements.whenDefined(component);
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(harness.context.customCards.map(({ type, name, description, preview }) => ({ type, name, description, preview })), [{ type: component, name: "Action Card", description: "Reusable navigation and more-info action card.", preview: true }]);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const defaults = harness.card(component);
    defaults.setConfig({});
    assert.equal(defaults.getCardSize(), 2);
    assert.match(defaults.shadowRoot.innerHTML, /Action title/);
    assert.equal(defaults.shadowRoot.querySelector("button.demo"), null);

    const escaped = harness.card(component);
    escaped.setConfig({ title: "<&\"'", description: "<&\"'", action_text: "<&\"'", icon: "mdi:<&\"'" });
    assert.match(escaped.shadowRoot.innerHTML, /&lt;&amp;&quot;&#39;/);

    const path = { path: "original" };
    const entity = { entity: "original" };
    const actionable = harness.card(component);
    actionable.setConfig({ navigation_path: path, entity, more_info_entity: { entity: "preferred" } });
    const handle = harness.interactions.at(-1);
    assert.equal(actionable.shadowRoot.querySelector("button.demo")?.getAttribute("type"), "button");
    handle.invokePrimary();
    handle.invokeHold();
    assert.deepEqual(harness.navigation, [path]);
    assert.deepEqual(harness.moreInfo, [{ host: actionable, entityId: { entity: "preferred" } }]);

    const entityOnly = harness.card(component);
    entityOnly.setConfig({ entity });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo.at(-1), { host: entityOnly, entityId: entity });

    const staticCard = harness.card(component);
    staticCard.setConfig({ navigation_path: 0, entity: "", more_info_entity: null });
    assert.equal(harness.interactions.includes(undefined), false);
    assert.equal(staticCard.shadowRoot.querySelector("button.demo"), null);

    const reconnecting = harness.card(component);
    reconnecting.setConfig({ entity: "sensor.reconnect" });
    const first = harness.interactions.at(-1);
    reconnecting.disconnectedCallback();
    assert.equal(first.destroyed, true);
    reconnecting.connectedCallback();
    assert.notEqual(harness.interactions.at(-1), first);
    harness.interactions.at(-1).invokePrimary();
    assert.equal(harness.moreInfo.at(-1).entityId, "sensor.reconnect");
  },
};
