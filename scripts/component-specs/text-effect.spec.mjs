import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-text-effect-v1";

export default {
  component,
  profile: "presentational",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/text-effect.js");
    await harness.customElements.whenDefined(component);
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(harness.context.customCards.map(({ type, name, description, preview }) => ({ type, name, description, preview })), [{ type: component, name: "Signature Text Effect", description: "Reusable transient-status effects using the existing signature motion language.", preview: true }]);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const invalid = harness.card(component);
    assert.throws(() => invalid.setConfig({}), /text is required/);
    assert.throws(() => invalid.setConfig({ text: "" }), /text is required/);
    assert.equal(invalid.shadowRoot.innerHTML, "", "invalid configuration must not render an effect");

    const card = harness.card(component);
    card.setConfig({ text: "Ready" });
    assert.equal(card.getCardSize(), 1);
    assert.ok(card.shadowRoot.querySelector(".row.stamp"));
    assert.ok(card.shadowRoot.querySelector(".title"));
    assert.match(card.shadowRoot.innerHTML, /data-text="Ready"/);
    assert.equal(harness.timers.pending(), 1, "configured effects must schedule deterministic settlement");
    const beforeHass = card.shadowRoot.innerHTML;
    card.hass = { states: {} };
    assert.equal(card.shadowRoot.innerHTML, beforeHass, "Hass updates must not rerender the effect");

    const effect = harness.card(component);
    effect.setConfig({ text: '<>&"\'', description: '<>&"\'', icon: 'mdi:<>&"\'', effect: "typewave", speed: 9 });
    assert.ok(effect.shadowRoot.querySelector(".row.typewave"));
    assert.match(effect.shadowRoot.innerHTML, /&lt;&gt;&amp;&quot;&#39;/);
    assert.ok(effect.shadowRoot.querySelector("span.icon"));
    harness.timers.runAll();
    assert.equal(effect.shadowRoot.querySelector(".row")?.classList.contains("settled"), true);

    for (const accepted of ["overprint", "signal", "rainbow_stamp"]) {
      const probe = harness.card(component);
      probe.setConfig({ text: accepted, effect: accepted });
      assert.ok(probe.shadowRoot.querySelector(`.row.${accepted}`));
    }
    const fallback = harness.card(component);
    fallback.setConfig({ text: "Fallback", effect: "unknown", speed: 1 });
    assert.ok(fallback.shadowRoot.querySelector(".row.stamp"));

    const reconnecting = harness.card(component);
    reconnecting.setConfig({ text: "Reconnect" });
    reconnecting.disconnectedCallback();
    assert.equal(harness.timers.pending() >= 1, true, "other cards may retain timers while this card disconnects");
    reconnecting.connectedCallback();
    assert.ok(reconnecting.shadowRoot.querySelector(".row.stamp"), "reconnect must restore the rendered row");
    assert.equal(harness.timers.pending() >= 1, true);
    harness.timers.runAll();
    assert.equal(reconnecting.shadowRoot.querySelector(".row")?.classList.contains("settled"), true);
    const settledMarkup = reconnecting.shadowRoot.innerHTML;
    reconnecting.disconnectedCallback();
    reconnecting.connectedCallback();
    assert.equal(reconnecting.shadowRoot.innerHTML, settledMarkup, "settled effects must not replay on reconnect");
  },
};
