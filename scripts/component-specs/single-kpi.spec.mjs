import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-single-kpi-v2";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/single-kpi.js");
    await harness.customElements.whenDefined(component);

    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public card type must be registered");
    assert.deepEqual(
      harness.registrations.map(({ type, name, description, preview }) => ({ type, name, description, preview })),
      [{ type: component, name: "Single KPI", description: "Reusable single KPI component.", preview: true }],
      "the picker must expose the established public card metadata",
    );
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` }, "the card must provide a usable configuration stub");
    assert.deepEqual(await Card.getConfigElement(), { cardType: component }, "the card must provide a configuration editor contract");

    const defaults = harness.card(component);
    defaults.setConfig({});
    assert.ok(defaults.shadowRoot, "the card must use open Shadow DOM");
    assert.equal(defaults.getCardSize(), 2, "the card must retain its documented dashboard size");
    assert.match(defaults.shadowRoot.innerHTML, /<div class="value">00<\/div>/, "default KPI value must be visible");
    assert.match(defaults.shadowRoot.innerHTML, /<div class="label">Primary metric<\/div>/, "default KPI label must be visible");
    assert.match(defaults.shadowRoot.innerHTML, /<div class="support"><b>00<\/b> Supporting context<\/div>/, "default support content must be visible");
    assert.equal(defaults.shadowRoot.querySelector("button.demo"), null, "a non-actionable card must remain non-button content");
    assert.ok(defaults.shadowRoot.querySelector("div.demo-static"), "a non-actionable card must retain presentational semantics");

    const values = harness.card(component);
    values.setConfig({ value: null, label: undefined, support_value: 0, support_label: false });
    assert.match(values.shadowRoot.innerHTML, /<div class="value"><\/div>/, "null KPI values must render as empty content");
    assert.match(values.shadowRoot.innerHTML, /<div class="label"><\/div>/, "undefined labels must render as empty content");
    assert.match(values.shadowRoot.innerHTML, /<div class="support"><b>0<\/b> false<\/div>/, "zero and false support values must remain visible");

    const escaped = harness.card(component);
    escaped.setConfig({ value: "<value&>", label: '"label"', support_value: "'support'", support_label: "<context>" });
    assert.match(escaped.shadowRoot.innerHTML, /&lt;value&amp;&gt;/, "visible KPI values must be HTML escaped");
    assert.match(escaped.shadowRoot.innerHTML, /&quot;label&quot;/, "visible KPI labels must be HTML escaped");
    assert.match(escaped.shadowRoot.innerHTML, /&#39;support&#39;/, "visible supporting values must be HTML escaped");
    assert.match(escaped.shadowRoot.innerHTML, /&lt;context&gt;/, "visible supporting labels must be HTML escaped");

    const navigable = harness.card(component);
    navigable.setConfig({ entity: "sensor.kpi", navigation_path: "/overview" });
    const navigationButton = navigable.shadowRoot.querySelector("button.demo");
    assert.ok(navigationButton, "actionable cards must use a native button");
    assert.equal(navigationButton.getAttribute("type"), "button", "the actionable element must not submit surrounding forms");
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.navigation, ["/overview"], "navigation must take precedence over More Info");
    assert.deepEqual(harness.moreInfo, [], "navigation precedence must suppress More Info");

    const moreInfo = harness.card(component);
    moreInfo.setConfig({ entity: "sensor.kpi" });
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo, [{ host: moreInfo, entityId: "sensor.kpi" }], "an entity-only card must open More Info");

    const disabled = harness.card(component);
    disabled.setConfig({ entity: "sensor.kpi", interactive: false });
    assert.equal(disabled.shadowRoot.querySelector("button.demo"), null, "interactive:false must remove button semantics");
    assert.ok(disabled.shadowRoot.querySelector("div.demo-static"), "interactive:false must keep content presentational");

    const reconnecting = harness.card(component);
    reconnecting.setConfig({ entity: "sensor.reconnect" });
    const firstInteraction = harness.interactions.at(-1);
    reconnecting.disconnectedCallback();
    assert.equal(firstInteraction.destroyed, true, "disconnect must release the active interaction");
    reconnecting.connectedCallback();
    const reconnectedInteraction = harness.interactions.at(-1);
    assert.notEqual(reconnectedInteraction, firstInteraction, "reconnect must bind the current rendered control");
    reconnectedInteraction.invokePrimary();
    assert.deepEqual(harness.moreInfo.at(-1), { host: reconnecting, entityId: "sensor.reconnect" }, "reconnected cards must keep their public interaction behaviour");
  },
};
