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

const installDialogAdapter = (dialog) => {
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
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

    const lifecycleHarness = createComponentHarness();
    const lifecycleEvents = [];
    let lifecycleUnsubscribes = 0;
    lifecycleHarness.context.__homeDashboardV2.prefs = async () => [];
    lifecycleHarness.context.__homeDashboardV2.savePrefs = async () => {};
    await lifecycleHarness.loadFile("src/components/favourites.js");
    const lifecycleCard = lifecycleHarness.card(component);
    lifecycleCard.setConfig({ preference_key: "lifecycle" });
    lifecycleCard.hass = {
      states: {},
      connection: {
        sendMessagePromise: async () => [],
        subscribeEvents(_listener, eventType) {
          lifecycleEvents.push(eventType);
          return Promise.resolve(() => { lifecycleUnsubscribes += 1; });
        },
      },
    };
    lifecycleHarness.context.document.body.append(lifecycleCard);
    await lifecycleHarness.flushMicrotasks(6);
    assert.deepEqual(
      lifecycleEvents.sort(),
      [
        "area_registry_updated",
        "device_registry_updated",
        "entity_registry_updated",
        "ha_component_backend_preferences_updated",
      ],
      "a connected backend-backed card owns both registry and preference event subscriptions",
    );
    lifecycleCard.remove();
    await lifecycleHarness.flushMicrotasks(4);
    assert.equal(lifecycleUnsubscribes, 4, "disconnect releases every Favourites subscription");
    lifecycleHarness.context.document.body.append(lifecycleCard);
    await lifecycleHarness.flushMicrotasks(4);
    assert.equal(lifecycleEvents.length, 8, "reconnect creates one fresh set of subscriptions without retaining the old set");

    const errorHarness = createComponentHarness();
    errorHarness.context.__homeDashboardV2.prefs = async () => { throw new Error("backend unavailable"); };
    errorHarness.context.__homeDashboardV2.savePrefs = async () => {};
    await errorHarness.loadFile("src/components/favourites.js");
    const errorCard = errorHarness.card(component);
    errorCard.setConfig({ preference_key: "unavailable" });
    errorCard.hass = { states: {}, connection: { sendMessagePromise: async () => [] } };
    await waitFor(
      () => errorCard.shadowRoot.querySelector(".load-error") !== null,
      "a preference read failure must expose a visible retry-safe error state",
    );
    assert.equal(errorCard.$.edit.disabled, true, "the editor remains disabled when its authoritative preference state is unavailable");

    const saveHarness = createComponentHarness();
    const saved = [];
    saveHarness.context.__homeDashboardV2.prefs = async () => [];
    saveHarness.context.__homeDashboardV2.savePrefs = async (_hass, key, selected) => {
      saved.push({ key, selected: JSON.parse(JSON.stringify(selected)) });
    };
    await saveHarness.loadFile("src/components/favourites.js");
    const saveCard = saveHarness.card(component);
    saveCard.setConfig({ preference_key: "home-control.favourites.v1" });
    saveCard.hass = {
      states: { "light.kitchen": { state: "off", attributes: { friendly_name: "Kitchen" } } },
      connection: {
        sendMessagePromise: async (message) => message.type === "config/entity_registry/list"
          ? [{ entity_id: "light.kitchen", platform: "demo", unique_id: "kitchen", name: "Kitchen" }]
          : [],
      },
    };
    await waitFor(() => saveCard.$.edit.disabled === false, "the backend editor must become available after its preference and registry state load");
    installDialogAdapter(saveCard.$.editor);
    saveCard.$.edit.dispatchEvent(new saveHarness.context.Event("click"));
    await waitFor(() => saveCard.$.editor.open === true, "the public editor control must open the persistent favourites editor");
    const choice = saveCard.$.available.querySelector(".choice");
    assert.ok(choice, "the editor exposes eligible registry controls");
    choice.dispatchEvent(new saveHarness.context.Event("click"));
    assert.equal(saveCard.$.save.disabled, false, "a changed draft enables persistence");
    saveCard.$.save.dispatchEvent(new saveHarness.context.Event("click"));
    await waitFor(() => saved.length === 1, "saving a changed draft must persist exactly one authoritative preference payload");
    await waitFor(() => saveCard.$.editor.open === false, "a successful save must close the editor after committing the selection");
    assert.deepEqual(saved, [{
      key: "home-control.favourites.v1",
      selected: [{ v: 1, d: "light", p: "demo", u: "kitchen", n: "" }],
    }], "the editor persists normalised references without leaking view state into backend storage");

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
