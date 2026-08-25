import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-list-v2";
export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/list-ranking.js");
    await harness.flushMicrotasks(3);
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });
    assert.deepEqual(harness.context.customCards.map(({ type, name, description }) => ({ type, name, description })), [{ type: component, name: "List / Ranking", description: "Reusable list and ranking component." }]);

    const defaults = harness.card(component);
    defaults.setConfig({});
    assert.equal(defaults.getCardSize(), 3);
    assert.equal(defaults.shadowRoot.querySelectorAll("button.row").length, 0);
    assert.equal(defaults.shadowRoot.querySelectorAll("div.row").length, 3);

    const disabled = harness.card(component);
    disabled.setConfig({ interactive: false, rows: [{ title: "Disabled", navigation_path: "/ignored" }] });
    assert.equal(disabled.shadowRoot.querySelectorAll("button.row").length, 0);

    const path = { destination: "original" };
    const entity = { entity: "original" };
    const calls = [];
    const rows = [];
    rows[1] = { title: "Custom", action(context) { calls.push(context); }, navigation_path: "/ignored", entity: "sensor.ignored" };
    rows[3] = { title: "Path", navigation_path: path, entity };
    rows[5] = { title: "Entity", entity };
    const actions = harness.card(component);
    const currentHass = { token: "current" };
    actions.hass = currentHass;
    actions.setConfig({ rows });
    assert.equal(actions.shadowRoot.querySelectorAll("button.row").length, 3);
    assert.deepEqual([...actions.shadowRoot.querySelectorAll("button.row")].map((row) => row.dataset.index), ["1", "3", "5"]);
    const handles = [...harness.interactions].slice(-3);
    actions.c.rows[1].action = (context) => calls.push({ replacement: true, context });
    for (const handle of handles) { handle.invokePrimary(); handle.invokeHold(); }
    assert.equal(calls.length, 1);
    assert.equal(calls[0].replacement, true);
    assert.equal(calls[0].context.hass, currentHass);
    assert.deepEqual(harness.navigation, [path]);
    assert.deepEqual(harness.moreInfo, [{ host: actions, entityId: entity }, { host: actions, entityId: entity }]);

    const first = [...harness.interactions].slice(-3);
    actions.disconnectedCallback();
    assert.equal(first.every((handle) => !handle.destroyed), true, "the component must preserve retained DOM interactions during disconnect");
    actions.connectedCallback();
    assert.equal(first.every((handle) => handle.destroyed), true);
  },
};
