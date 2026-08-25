import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-three-stat-v2";
export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/three-stat-summary.js");
    await harness.flushMicrotasks(3);
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });
    assert.deepEqual(harness.context.customCards.map(({ type, name, description, preview }) => ({ type, name, description, preview })), [{ type: component, name: "Three-stat Summary", description: "Reusable three-stat summary component.", preview: true }]);

    const defaults = harness.card(component);
    defaults.setConfig({});
    assert.equal(defaults.getCardSize(), 2);
    assert.equal(defaults.shadowRoot.querySelectorAll("button.stat").length, 0);
    assert.equal(defaults.shadowRoot.querySelectorAll("div.stat").length, 3);

    const disabled = harness.card(component);
    disabled.setConfig({ interactive: false, metric_1_entity: "sensor.ignored" });
    assert.equal(disabled.shadowRoot.querySelectorAll("button.stat").length, 0);
    const falsey = harness.card(component);
    falsey.setConfig({ interactive: 0, metric_1_entity: "sensor.fallback" });
    assert.equal(falsey.shadowRoot.querySelectorAll("button.stat").length, 1);

    const customCalls = [];
    const path = { path: "original" };
    const entity = { entity: "original" };
    const actions = harness.card(component);
    const currentHass = { token: "current" };
    actions.hass = currentHass;
    actions.setConfig({ metric_1_action: (context) => customCalls.push(context), metric_1_navigation_path: "/ignored", metric_1_entity: "sensor.ignored", metric_2_navigation_path: path, metric_2_entity: "sensor.ignored", metric_3_entity: entity });
    assert.equal(actions.shadowRoot.querySelectorAll("button.stat").length, 3);
    const handles = [...harness.interactions].slice(-3);
    for (const handle of handles) handle.invokePrimary();
    assert.equal(customCalls.length, 1);
    assert.equal(customCalls[0].host, actions);
    assert.equal(customCalls[0].hass, currentHass);
    assert.equal(customCalls[0].index, 1);
    assert.deepEqual(harness.navigation, [path]);
    assert.deepEqual(harness.moreInfo, [{ host: actions, entityId: entity }]);

    const first = [...harness.interactions].slice(-3);
    actions.disconnectedCallback();
    assert.equal(first.every((handle) => !handle.destroyed), true, "the component must preserve retained DOM interactions during disconnect");
    actions.connectedCallback();
    assert.equal(first.every((handle) => handle.destroyed), true);
    assert.equal(harness.interactions.slice(-3).every((handle) => !handle.destroyed), true);
  },
};
