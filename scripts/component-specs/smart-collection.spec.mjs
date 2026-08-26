import assert from "node:assert/strict";
import { deferred } from "../fixtures/async.mjs";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-smart-collection-v3";
const snapshot = (value) => JSON.parse(JSON.stringify(value));

const createRegistry = (entries) => {
  const byDevice = new Map();
  for (const entry of entries) {
    if (!entry.device_id) continue;
    byDevice.set(entry.device_id, [...(byDevice.get(entry.device_id) ?? []), entry]);
  }
  return { entities: entries, devices: [], areaMap: new Map(), byDevice };
};

function installDashboardFixture(harness, { entries, createCard }) {
  const listeners = [];
  const dashboard = harness.context.__homeDashboardV2;
  dashboard.REG = {
    load: async () => createRegistry(entries),
    subscribe(_hass, listener) {
      listeners.push(listener);
      return () => listeners.splice(listeners.indexOf(listener), 1);
    },
  };
  dashboard.uiEntry = () => true;
  dashboard.domain = (entityId) => entityId.split(".")[0];
  dashboard.areaOf = () => "living";
  dashboard.stateName = (_hass, entry) => entry.name;
  dashboard.isPotential = () => true;
  dashboard.isActive = (_entry, state) => state?.state === "on";
  dashboard.label = (domain) => domain;
  dashboard.icon = () => "mdi:flash";
  dashboard.applyPrefs = (items) => ({ all: items, visible: items, hidden: [] });
  dashboard.controlConfig = (entry) => ({ entity: entry.entity_id, version: entry.version });
  dashboard.card = createCard;
  return { dashboard, listeners };
}

const waitFor = async (condition, message, turns = 20) => {
  for (let turn = 0; turn < turns; turn += 1) {
    if (condition()) return;
    await Promise.resolve();
  }
  assert.fail(message);
};

const cardChild = (harness, config) => {
  const child = harness.context.document.createElement("smart-control-row");
  child.entityId = config.entity;
  child.version = config.version;
  child.config = config;
  return child;
};

const prepareSemanticHeader = (collection) => {
  const title = collection.shadowRoot.querySelector("h2");
  const icon = collection.shadowRoot.querySelector(".heading ha-icon");
  collection.head.append(icon, title);
};

export default {
  component,
  profile: "registry-driven",
  async run() {
    const entries = [
      { entity_id: "switch.beta", name: "Beta", version: 1 },
      { entity_id: "light.alpha", name: "Alpha", version: 1 },
    ];
    const harness = createComponentHarness();
    let createCard = async (_hass, config) => cardChild(harness, config);
    installDashboardFixture(harness, { entries, createCard: (...args) => createCard(...args) });

    await harness.loadFile("src/components/smart-collection.js");
    await harness.customElements.whenDefined(component);

    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public Smart Collection card type must be registered");
    assert.deepEqual(
      snapshot(harness.context.customCards),
      [{
        type: component,
        name: "Smart Control Collection V3",
        description: "Stable registry-driven household controls without refresh teardown.",
        preview: true,
      }],
      "the picker must retain the established Smart Collection metadata",
    );
    assert.deepEqual(snapshot(Card.getGridOptions()), { columns: 12, rows: "auto" }, "the card must retain its dashboard grid contract");

    const hass = {
      states: {
        "light.alpha": { state: "on", attributes: {} },
        "switch.beta": { state: "on", attributes: {} },
      },
    };
    const collection = harness.card(component);
    prepareSemanticHeader(collection);
    collection.setConfig({
      title: "Kitchen controls",
      icon: "mdi:lightbulb",
      header_style: "separator",
      editable: true,
    });
    assert.ok(collection.shadowRoot, "the card must use open Shadow DOM");
    assert.equal(collection.getCardSize(), 2, "the card must retain its documented dashboard size");
    assert.equal(collection.shadowRoot.querySelector(".head")?.hidden, false, "the configured header must remain visible");
    assert.equal(collection.shadowRoot.querySelector(".head")?.classList.contains("sep"), true, "separator headers must retain their semantic presentation class");
    assert.equal(collection.shadowRoot.querySelector("h2")?.textContent, "Kitchen controls", "the configured heading must be visible");
    assert.equal(collection.shadowRoot.querySelector(".heading ha-icon")?.getAttribute("icon"), "mdi:lightbulb", "the configured heading icon must be visible");
    const edit = collection.shadowRoot.querySelector("button.edit");
    assert.equal(edit?.getAttribute("type"), "button", "the editor control must retain native button semantics");
    assert.equal(edit?.hidden, false, "editable collections must expose the editor control");

    collection.hass = hass;
    await waitFor(() => collection.shadowRoot.querySelector(".body")?.children.length === 2, "registry controls must be rendered after registry data is available");
    const body = collection.shadowRoot.querySelector(".body");
    const initialChildren = [...body.children];
    assert.deepEqual(initialChildren.map((child) => child.entityId), ["light.alpha", "switch.beta"], "registry-derived controls must be visibly ordered by their display names");
    assert.equal(initialChildren.every((child) => child.hass === hass), true, "Hass must be forwarded to every visible child card");

    const refreshedHass = { ...hass, states: { ...hass.states } };
    collection.hass = refreshedHass;
    assert.deepEqual([...body.children], initialChildren, "a state refresh without a structural change must retain visible child identity and ordering");
    assert.equal(initialChildren.every((child) => child.hass === refreshedHass), true, "refreshed Hass must be forwarded to retained child cards");

    entries[0].version = 2;
    let unavailable = true;
    createCard = async (_hass, config) => {
      if (unavailable && config.entity === "switch.beta") throw new Error("child is temporarily unavailable");
      return cardChild(harness, config);
    };
    collection.setConfig({ title: "Kitchen controls", editable: true });
    await waitFor(() => body.children.length === 2, "a failed reconciliation must leave the committed controls visible");
    assert.deepEqual([...body.children], initialChildren, "a child-card creation failure must retain the previously committed visible DOM");

    unavailable = false;
    collection.setConfig({ title: "Kitchen controls", editable: true });
    await waitFor(() => body.children.some((child) => child.version === 2), "a later sync must retry unavailable child creation");
    assert.equal(body.children.length, 2, "a successful retry must replace the collection atomically without duplicating controls");

    const staleHarness = createComponentHarness();
    const staleEntries = [{ entity_id: "light.stale", name: "Stale", version: 1 }];
    const lateChild = deferred();
    installDashboardFixture(staleHarness, {
      entries: staleEntries,
      createCard: () => lateChild.promise,
    });
    await staleHarness.loadFile("src/components/smart-collection.js");
    const staleCollection = staleHarness.card(component);
    prepareSemanticHeader(staleCollection);
    staleCollection.setConfig({ title: "Stale test" });
    staleCollection.hass = { states: { "light.stale": { state: "on", attributes: {} } } };
    await waitFor(() => staleCollection.shadowRoot.querySelector(".body")?.children.length === 0, "the stale collection must wait for its asynchronous child");
    staleCollection.disconnectedCallback();
    lateChild.resolve(cardChild(staleHarness, { entity: "light.stale", version: 1 }));
    await staleHarness.flushMicrotasks(8);
    assert.equal(staleCollection.shadowRoot.querySelector(".body")?.children.length, 0, "a child result resolving after disconnect must not append stale visible content");

    const activeHarness = createComponentHarness();
    installDashboardFixture(activeHarness, {
      entries: [],
      createCard: async (_hass, config) => cardChild(activeHarness, config),
    });
    await activeHarness.loadFile("src/components/smart-collection.js");
    const eventTypes = [];
    let unsubscribeCount = 0;
    const active = activeHarness.card(component);
    prepareSemanticHeader(active);
    activeHarness.context.document.body.append(active);
    active.setConfig({ mode: "active", title: "Active now" });
    active.hass = {
      states: {},
      connection: {
        subscribeEvents(_listener, eventType) {
          eventTypes.push(eventType);
          return Promise.resolve(() => { unsubscribeCount += 1; });
        },
      },
    };
    await activeHarness.flushMicrotasks(4);
    assert.deepEqual(eventTypes, ["state_changed"], "active collections must subscribe to live Home Assistant state changes");
    active.disconnectedCallback();
    await activeHarness.flushMicrotasks(4);
    assert.equal(unsubscribeCount, 1, "disconnecting an active collection must release its live state subscription");

    const discoveryHarness = createComponentHarness();
    const discoveryEntries = [
      { entity_id: "camera.driveway", platform: "onvif", device_id: "camera-device", name: "Driveway" },
      { entity_id: "camera.driveway_substream", platform: "onvif", device_id: "camera-device", name: "Driveway Sub Stream" },
      { entity_id: "binary_sensor.driveway_motion", device_id: "camera-device", name: "Driveway motion" },
      { entity_id: "binary_sensor.garage_status", device_id: "garage-device", name: "Garage door status" },
      { entity_id: "button.garage_door_trigger", device_id: "garage-device", name: "Garage door trigger" },
    ];
    installDashboardFixture(discoveryHarness, {
      entries: discoveryEntries,
      createCard: async (_hass, config) => cardChild(discoveryHarness, config),
    });
    await discoveryHarness.loadFile("src/components/smart-collection.js");
    const discovery = discoveryHarness.card(component);
    prepareSemanticHeader(discovery);
    discovery.setConfig({ mode: "active", title: "Active devices" });
    discovery.hass = {
      states: {
        "camera.driveway": { state: "idle", attributes: {} },
        "camera.driveway_substream": { state: "idle", attributes: {} },
        "binary_sensor.driveway_motion": { state: "on", attributes: { device_class: "motion" } },
        "binary_sensor.garage_status": { state: "on", attributes: { device_class: "garage_door" } },
        "button.garage_door_trigger": { state: "unknown", attributes: {} },
      },
    };
    await waitFor(() => discovery.shadowRoot.querySelector(".body")?.children.length > 0, "native discovery must render active controls");
    const discovered = [...discovery.shadowRoot.querySelector(".body").children];
    assert.ok(discovered.some((child) => child.entityId === "camera.driveway"), "the ONVIF owner camera must be included when a sibling sensor is active");
    assert.ok(!discovered.some((child) => child.entityId === "camera.driveway_substream"), "ONVIF substreams must remain excluded");
    assert.ok(!discovered.some((child) => child.entityId === "button.garage_door_trigger"), "a garage trigger must not appear beside its device controller");
    assert.deepEqual(
      snapshot(discovered.find((child) => child.entityId === "camera.driveway")?.config),
      { type: "custom:component-camera-controller-v1", entity: "camera.driveway", device_id: "camera-device" },
      "the ONVIF owner camera must retain its specialised controller contract",
    );
  },
};
