import assert from "node:assert/strict";
import { deferred } from "../fixtures/async.mjs";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-device-discovery-v2";

export default {
  component,
  profile: "async-visualisation",
  async run() {
    const harness = createComponentHarness();
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    shared.PRESENTATIONAL_CARD_STYLES = "";
    shared.navigateTo = (path) => harness.navigation.push(path);
    await harness.loadFile("src/components/device-discovery.js");
    const card = harness.card(component);
    card.setConfig({ demo: true });
    harness.context.document.body.append(card);
    assert.match(card.shadowRoot.innerHTML, /Discovered device/, "demo discovery must remain a clear, visible preview");
    const stale = deferred();
    card.setConfig({ demo: false });
    card.hass = { user: { is_admin: true }, callWS: () => stale.promise };
    card._loadGeneration += 1;
    card.setConfig({ demo: true });
    stale.resolve([{ handler: "late_device", context: { source: "zeroconf" } }]);
    await harness.flushMicrotasks(5);
    assert.doesNotMatch(card.shadowRoot.innerHTML, /late_device/, "a stale discovery response must not overwrite the current card mode");
    card.hass = { user: { is_admin: false } };
    card.setConfig({ demo: false });
    assert.match(card.shadowRoot.innerHTML, /administrator/i, "non-admin users must receive a safe access explanation rather than a failing request");
  },
};
