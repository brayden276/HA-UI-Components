import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-household-directory-v3";
const snapshot = (value) => JSON.parse(JSON.stringify(value));

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
    const dashboard = harness.context.__homeDashboardV2;
    const entries = [
      { entity_id: "media_player.tv", name: "Television" },
      { entity_id: "light.kitchen", name: "Kitchen" },
      { entity_id: "automation.good", labels: ["dashboard_quick_action"], name: "Run scene" },
      { entity_id: "todo.shop", name: "Shopping List" },
    ];
    const registry = {
      entities: entries,
      dashboards: [
        { url_path: "home-control", title: "Current" },
        { url_path: "rooms", title: "Rooms" },
        { url_path: "admin", require_admin: true },
      ],
      devices: [],
    };
    dashboard.REG = { load: async () => registry, subscribe: () => () => {} };
    dashboard.uiEntry = () => true;
    dashboard.domain = (entityId) => entityId.split(".")[0];
    dashboard.stateName = (_hass, entry) => entry.name || entry.entity_id;
    dashboard.label = (value) => String(value);
    dashboard.controlDomains = new Set(["light"]);
    dashboard.applyPrefs = (items) => ({ all: items, visible: items, hidden: [] });
    dashboard.prefs = async () => ({ order: [], hidden: [] });
    dashboard.savePrefs = async () => {};
    let failChild = false;
    let childCount = 0;
    dashboard.card = async (_hass, config) => {
      if (failChild) throw new Error("child unavailable");
      const child = harness.context.document.createElement("household-action");
      child.id = `child-${++childCount}`;
      child.config = config;
      return child;
    };

    await harness.loadFile("src/components/household-directory.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card);
    assert.deepEqual(snapshot(Card.getGridOptions()), { columns: 12, rows: "auto" });
    assert.deepEqual(snapshot(Card.getStubConfig()), { type: `custom:${component}` });
    assert.deepEqual(await Card.getConfigElement(), { cardType: component });

    const directory = harness.card(component);
    directory.setConfig({ title: "Household", base_path: "/test-home", icon: "mdi:home" });
    const hass = {
      states: {
        "media_player.tv": { state: "on", attributes: {} },
        "light.kitchen": { state: "on", attributes: {} },
        "automation.good": { state: "on", attributes: { icon: "mdi:rocket" } },
        "todo.shop": { state: "on", attributes: {} },
      },
    };
    directory.hass = hass;
    harness.context.document.body.append(directory);
    await waitFor(() => directory.grid.children.length === 5, "the registry directory must render the discovered household destinations and actions");
    assert.equal(directory.getCardSize(), 2);
    assert.equal(directory.shadowRoot.querySelector(".heading h2")?.textContent, "Household");
    assert.equal(directory.shadowRoot.querySelector(".heading ha-icon")?.getAttribute("icon"), "mdi:home");
    assert.deepEqual(
      snapshot(directory.items().map((item) => item.id)),
      ["view:media", "view:all-controls", "dashboard:rooms", "action:automation.good", "entity:todo.shop"],
      "only visible, non-admin dashboard destinations and labelled quick actions are exposed",
    );
    assert.deepEqual(
      snapshot(directory.cardConfig(directory.items()[3])),
      {
        type: "custom:bubble-card",
        card_type: "button",
        button_type: "name",
        name: "Run scene",
        icon: "mdi:rocket",
        show_icon: true,
        button_action: {
          tap_action: {
            action: "perform-action",
            perform_action: "automation.trigger",
            target: { entity_id: "automation.good" },
          },
        },
        scrolling_effect: false,
      },
      "quick-action discovery retains Home Assistant's native perform-action contract",
    );

    const committed = [...directory.grid.children];
    directory.hass = { ...hass, states: { ...hass.states } };
    await harness.flushMicrotasks(4);
    assert.deepEqual([...directory.grid.children], committed, "non-structural Hass refreshes retain child identity and ordering");

    entries[2] = { ...entries[2], name: "Run again", icon: "mdi:play" };
    failChild = true;
    directory.schedule();
    await harness.flushMicrotasks(8);
    assert.deepEqual([...directory.grid.children], committed, "a failed child reconciliation retains the last committed visible directory");
    failChild = false;
    directory.schedule();
    await waitFor(() => directory.grid.children.some((child) => child.config.name === "Run again"), "a later schedule retries a failed child configuration");

    directory.disconnectedCallback();
    assert.equal(directory.unsub, null, "disconnect releases the registry subscription before an async result can be committed");
  },
};
