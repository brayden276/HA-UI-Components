import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-room-directory-v4";
const snapshot = (value) => JSON.parse(JSON.stringify(value));

const waitFor = async (condition, message, turns = 20) => {
  for (let turn = 0; turn < turns; turn += 1) {
    if (condition()) return;
    await Promise.resolve();
  }
  assert.fail(message);
};

function installRoomDirectoryFixture(harness) {
  const dashboard = harness.context.__homeDashboardV2;
  const livingRoom = { area_id: "living_room", name: "Living room", icon: "mdi:sofa" };
  const registry = {
    areas: [livingRoom],
    areaMap: new Map([[livingRoom.area_id, livingRoom]]),
    entities: [{ entity_id: "light.living_room", area_id: livingRoom.area_id }],
  };

  dashboard.REG = {
    load: async () => registry,
    subscribe: () => () => {},
  };
  dashboard.prefs = async () => ({ order: [], hidden: [] });
  dashboard.uiEntry = () => true;
  dashboard.areaOf = (entry) => entry.area_id;
  dashboard.domain = (entityId) => entityId.split(".")[0];
  dashboard.validState = (state) => state?.state !== "unavailable";
  dashboard.applyPrefs = (items) => ({ all: items, visible: items, hidden: [] });

  harness.context.history.pushState = (_state, _title, url) => {
    harness.context.location.hash = String(url).slice(String(url).indexOf("#"));
  };
}

function installDialogAdapter(dialog) {
  let opens = 0;
  dialog.showModal = () => { opens += 1; dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  return () => opens;
}

export default {
  component,
  profile: "registry-driven",
  async run() {
    const harness = createComponentHarness({ capabilities: ["global-events"] });
    installRoomDirectoryFixture(harness);
    await harness.loadFile("src/components/room-directory.js");

    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public Room Directory card type must be registered");
    assert.deepEqual(
      snapshot(harness.context.customCards),
      [{
        type: component,
        name: "Room Directory V4",
        description: "Stable registry-driven rooms with full-height swipeable room sheets.",
        preview: true,
      }],
      "the picker must retain its established Room Directory metadata",
    );
    assert.deepEqual(snapshot(Card.getGridOptions()), { columns: 12, rows: "auto" }, "the card must retain its dashboard grid contract");

    const hass = {
      states: {
        "light.living_room": { state: "on", attributes: {} },
      },
      formatEntityState: (state) => state.state,
      config: { unit_system: { temperature: "°C" } },
      locale: { language: "en-AU" },
    };
    const directory = harness.card(component);
    directory.setConfig({ title: "House rooms", icon: "mdi:home-group", navigation_path: "/rooms" });
    directory.hass = hass;
    harness.context.document.body.append(directory);
    await waitFor(
      () => directory.shadowRoot.querySelector(".grid")?.children.length === 1,
      "the configured directory must expose registry-derived room controls",
    );

    assert.ok(directory.shadowRoot, "the card must use open Shadow DOM");
    assert.equal(directory.getCardSize(), 4, "the card must retain its documented dashboard size");
    assert.equal(directory.shadowRoot.querySelector("h2")?.textContent, "House rooms", "the configured title must be visible");
    assert.equal(directory.shadowRoot.querySelector(".open-view ha-icon")?.getAttribute("icon"), "mdi:home-group", "the configured icon must be visible");

    const tile = directory.shadowRoot.querySelector("button.room");
    assert.equal(tile?.getAttribute("aria-label"), "Open Living room. 1 light on", "room controls must describe their visible state");
    const tileInteraction = harness.interactions.find((handle) => handle.element === tile);
    assert.ok(tileInteraction, "the visible room control must expose the shared primary interaction contract");

    const opens = installDialogAdapter(directory.shadowRoot.querySelector("dialog"));
    const firstOpen = tileInteraction.invokePrimary();
    const duplicateOpen = tileInteraction.invokePrimary();

    await harness.loadSource(`
      class SmartCollectionFixture extends HTMLElement {
        constructor() { super(); this.localName = "component-smart-collection-v3"; }
        setConfig(config) { this.config = config; }
        set hass(value) { this.receivedHass = value; }
        get hass() { return this.receivedHass; }
      }
      customElements.define("component-smart-collection-v3", SmartCollectionFixture);
    `, "room-directory-child-fixture.js");
    await Promise.all([firstOpen, duplicateOpen]);
    await harness.flushMicrotasks(4);

    const sheetBody = directory.shadowRoot.querySelector(".sheet-body");
    assert.equal(opens(), 1, "a repeated room action and its matching hash update must open one drawer");
    assert.equal(sheetBody.children.length, 1, "duplicate room opening must retain one visible control collection");
    const controls = sheetBody.children[0];
    assert.deepEqual(
      snapshot(controls.config),
      {
        mode: "area",
        area_id: "living_room",
        title: "Controls",
        icon: "mdi:gesture-tap-button",
        header_style: "separator",
        editable: false,
        pref_key: "home-control.area.living_room.v2",
      },
      "the opened drawer must configure the established area control collection",
    );
    assert.equal(controls.hass, hass, "the drawer must forward Home Assistant state to the visible control collection");
    assert.equal(harness.context.location.hash, "#living-room", "opening a room must retain its public deep-link hash");
  },
};
