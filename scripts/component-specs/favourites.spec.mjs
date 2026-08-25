import assert from "node:assert/strict";
import { deferred } from "../fixtures/async.mjs";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-favourites-v3";

const waitFor = async (condition, message, turns = 24) => {
  for (let turn = 0; turn < turns; turn += 1) {
    if (condition()) return;
    await Promise.resolve();
  }
  assert.fail(message);
};

export default {
  component,
  profile: "registry-driven",
  async run() {
    const harness = createComponentHarness();
    const first = deferred();
    const second = deferred();
    const dashboard = harness.context.__homeDashboardV2;
    dashboard.prefs = (_hass, key) => key === "first" ? first.promise : second.promise;
    dashboard.savePrefs = async () => {};
    await harness.loadFile("src/components/favourites.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(Card.getStubConfig(), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const hass = {
      states: {
        "light.first": { state: "on", attributes: { friendly_name: "First" } },
        "light.second": { state: "on", attributes: { friendly_name: "Second" } },
      },
      connection: {
        sendMessagePromise: async (message) => {
          if (message.type === "config/entity_registry/list") {
            return [
              { entity_id: "light.first", platform: "demo", unique_id: "first" },
              { entity_id: "light.second", platform: "demo", unique_id: "second" },
            ];
          }
          return [];
        },
      },
    };
    const card = harness.card(component);
    card.setConfig({ preference_key: "first" });
    card.hass = hass;
    assert.equal(card.$.edit.hidden, false, "backend-backed favourites retain the public editor control");
    assert.equal(card.$.edit.getAttribute("aria-busy"), "true", "the editor reports loading while the preference request is pending");

    card.setConfig({ preference_key: "second" });
    first.resolve([{ v: 1, d: "light", p: "demo", u: "first", n: "First" }]);
    await harness.flushMicrotasks(6);
    second.resolve([{ v: 1, d: "light", p: "demo", u: "second", n: "Second" }]);
    await waitFor(
      () => card.shadowRoot.querySelector(".grid")?.querySelector(".item") !== null,
      "the current preference request must render one visible favourite",
    );
    assert.match(
      card.shadowRoot.querySelector(".grid")?.querySelector(".main")?.getAttribute("aria-label") ?? "",
      /^Second,/,
      "the latest preference result is the visible favourite",
    );
    assert.equal(card.$.edit.disabled, false, "the editor becomes usable after the current preference loads");
    assert.equal(card.$.edit.getAttribute("aria-busy"), null);

    const minimalHarness = createComponentHarness();
    await minimalHarness.loadSource(`
      class FavouritesChild extends HTMLElement {
        setConfig(config) { this.config = config; }
        set hass(value) { this._hass = value; }
      }
      customElements.define("component-favourites-v3", FavouritesChild);
    `, "favourites-child.js");
    await minimalHarness.loadFile("src/components/favourites-minimal.js");
    const minimal = minimalHarness.card("component-favourites-minimal-v1");
    minimal.setConfig({ title: "Minimal" });
    await minimal.ensure();
    assert.equal(minimal.child.config.preference_key, "home-control.favourites.v1", "the minimal card owns its backend preference default without a runtime patch");
  },
};
