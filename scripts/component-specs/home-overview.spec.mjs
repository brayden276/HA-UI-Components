import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-home-overview-v4";
const childTypes = [
  "component-favourites-minimal-v1",
  "component-smart-collection-v3",
  "component-household-directory-v3",
  "component-room-directory-v4",
];
const snapshot = (value) => JSON.parse(JSON.stringify(value));

export default {
  component,
  profile: "composition-wrapper",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/home-overview.js");
    await harness.flushMicrotasks();

    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public Home Overview card type must be registered");
    assert.deepEqual(
      harness.context.customCards.map(({ type, name, description }) => ({ type, name, description })),
      [{
        type: component,
        name: "Home Overview V4",
        description: "Stable minimal Home overview without state-refresh teardown.",
      }],
      "the picker must expose the established Home Overview metadata",
    );
    assert.deepEqual(snapshot(Card.getGridOptions()), { columns: 12, rows: "auto" }, "the card must retain its dashboard grid contract");

    const hass = {
      states: {
        "weather.home": {
          attributes: { temperature: 21.5, temperature_unit: "°C", cloud_coverage: 47 },
        },
      },
      config: { time_zone: "UTC" },
      locale: { language: "en" },
    };
    const overview = harness.card(component);
    overview.setConfig({
      weather_entity: "weather.home",
      base_path: "/test-home",
      current_dashboard: "test-home",
      favourites_helpers: ["input_text.must_not_be_forwarded"],
    });
    overview.hass = hass;

    assert.ok(overview.shadowRoot, "the card must use open Shadow DOM");
    assert.equal(overview.getCardSize(), 12, "the card must retain its documented dashboard size");
    const time = overview.shadowRoot.querySelector(".time");
    const weather = overview.shadowRoot.querySelector("button.weather");
    assert.ok(time?.textContent, "the header must show a formatted current time");
    assert.equal(weather?.getAttribute("type"), "button", "the weather action must use native button semantics");
    assert.equal(weather?.textContent, "21.5°C · Cloud 47%", "the header must show the configured weather state");
    assert.equal(weather?.getAttribute("aria-label"), "Outside 21.5°C, Cloud 47%. Open weather details.", "the weather action must describe its outcome");
    harness.interactions.at(-1).invokePrimary();
    assert.deepEqual(harness.moreInfo, [{ host: overview, entityId: "weather.home" }], "the weather action must open More Info for the configured entity");

    const timerCountBeforeDisconnect = harness.timers.pending();
    const weatherInteraction = harness.interactions.at(-1);
    overview.disconnectedCallback();
    assert.equal(weatherInteraction.destroyed, true, "disconnect must release the weather interaction");
    assert.equal(harness.timers.pending(), timerCountBeforeDisconnect - 1, "disconnect must clear the scheduled header refresh");
    overview.connectedCallback();
    assert.notEqual(harness.interactions.at(-1), weatherInteraction, "reconnect must restore the weather interaction");

    assert.equal(overview.shadowRoot.querySelector(".sections").children.length, 0, "child cards must wait until their custom elements are ready");
    overview.isConnected = false;
    overview.disconnectedCallback();

    await harness.loadSource(`
      for (const name of ${JSON.stringify(childTypes)}) {
        class ChildCard extends HTMLElement {
          constructor() {
            super();
            this.localName = name;
            this.configurations = [];
          }
          setConfig(config) { this.configurations.push(config); }
          set hass(value) { this.receivedHass = value; }
          get hass() { return this.receivedHass; }
        }
        customElements.define(name, ChildCard);
      }
    `, "home-overview-child-fixtures.js");
    await harness.flushMicrotasks(5);
    assert.equal(overview.shadowRoot.querySelector(".sections").children.length, 0, "disconnecting before child readiness must not append stale child cards");

    overview.isConnected = true;
    overview.connectedCallback();
    await harness.flushMicrotasks(5);
    const sections = overview.shadowRoot.querySelector(".sections");
    const children = [...sections.children];
    assert.deepEqual(children.map((child) => child.localName), childTypes, "ready child cards must retain their established visible ordering");
    assert.equal(children.every((child) => child.classList.contains("section")), true, "child cards must retain their section presentation contract");

    const [favourites, active, household, rooms] = children;
    assert.deepEqual(snapshot(favourites.configurations[0]), { helpers: [], max: 4, title: "Favourites" }, "the backend-only favourites policy must be passed to the child card");
    assert.deepEqual(snapshot(active.configurations[0]), { mode: "active", title: "Active now", icon: "mdi:motion-play-outline", editable: false, pref_key: null }, "the active collection must retain its established configuration");
    assert.deepEqual(
      snapshot(household.configurations[0]),
      {
        title: "Quick actions",
        icon: "mdi:gesture-tap-button",
        quick_action_label: "dashboard_quick_action",
        pref_key: "home-control.household.v2",
        base_path: "/test-home",
        current_dashboard: "test-home",
      },
      "the household section must retain its dashboard configuration",
    );
    assert.deepEqual(
      snapshot(rooms.configurations[0]),
      {
        mode: "home",
        title: "Rooms",
        icon: "mdi:floor-plan",
        pref_key: "home-control.rooms.v2",
        base_path: "/test-home",
        navigation_path: "/test-home/rooms",
      },
      "the rooms section must retain its navigation configuration",
    );

    const forwardedHass = { states: {} };
    overview.hass = forwardedHass;
    overview.setConfig({ weather_entity: "weather.home", base_path: "/next-home", current_dashboard: "next-home" });
    assert.deepEqual([...sections.children], children, "Hass and configuration updates must retain child identity and ordering");
    assert.equal(children.every((child) => child.hass === forwardedHass), true, "Hass updates must be forwarded to retained child cards");
  },
};
