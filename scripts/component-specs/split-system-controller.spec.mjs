import assert from "node:assert/strict";
import { deferred } from "../fixtures/async.mjs";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-split-controller-v4";
const snapshot = (value) => JSON.parse(JSON.stringify(value));

const splitState = (mode = "heat") => ({
  state: mode,
  attributes: {
    friendly_name: "Living split",
    current_temperature: 22,
    temperature: 23,
    target_temp_step: 0.5,
    min_temp: 16,
    max_temp: 30,
    hvac_modes: ["off", "heat", "cool"],
    fan_mode: "low",
    fan_modes: ["low", "high"],
  },
});

export default {
  component,
  profile: "direct-controller",
  async run() {
    const harness = createComponentHarness();
    const subscriptions = [];
    const hass = harness.hass;
    hass.states = {
      "climate.living": splitState(),
      "switch.living_controller": { state: "on", attributes: {} },
      "select.living_vertical": { state: "AUTO", attributes: { options: ["AUTO", "SWING"] } },
    };
    harness.context.__componentSplitRegistryV4 = {
      load: async () => ({ systems: new Map() }),
      subscribe(_hass, listener) {
        subscriptions.push(listener);
        return () => subscriptions.splice(subscriptions.indexOf(listener), 1);
      },
    };

    await harness.loadFile("src/components/split-system-controller.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public Split controller type must be registered");
    assert.deepEqual(snapshot(Card.getGridOptions()), { columns: 12, rows: "auto" }, "the controller retains its dashboard grid contract");
    assert.deepEqual(snapshot(Card.getStubConfig()), { type: `custom:${component}` }, "the picker stub retains the public type");
    assert.deepEqual(snapshot(await Card.getConfigElement()), { cardType: component }, "the public editor contract remains available");

    const card = harness.card(component);
    assert.throws(() => card.setConfig({}), /climate entity is required/, "a climate entity remains required");
    card.setConfig({
      entity: "climate.living",
      controller_entity: "switch.living_controller",
      vertical_vane_entity: "select.living_vertical",
      room_id: "living",
      last_mode: "heat",
      profiles: [{ v: 1, n: "Sleep", m: "cool", t: 21, f: "low", vv: "SWING" }],
    });
    card.hass = { states: {} };
    for (const control of [card.$.ma, card.$.fa, card.$.va, card.$.ta]) {
      const label = harness.context.document.createElement("span");
      label.className = "al";
      control.append(label);
    }
    card.hass = hass;
    harness.context.document.body.append(card);
    await harness.flushMicrotasks(4);

    assert.ok(card.shadowRoot, "the controller retains open Shadow DOM");
    assert.equal(subscriptions.length, 1, "a connected controller owns one registry subscription");
    assert.equal(card.shadowRoot.querySelector(".nm")?.textContent, "Living split", "the entity name remains visible");
    assert.equal(card.$.pw?.getAttribute("aria-label"), "Turn off Living split", "the power control describes its visible action");

    const details = [];
    card.addEventListener("hass-action", (event) => details.push(snapshot(event.detail)));
    const detailsInteraction = harness.interactions.find((handle) => handle.element === card.$.idn);
    detailsInteraction.invokePrimary();
    assert.deepEqual(details, [{ config: { entity: "climate.living", tap_action: { action: "more-info" } }, action: "tap" }], "opening details retains the Home Assistant more-info action contract");

    const powerInteraction = harness.interactions.find((handle) => handle.element === card.$.pw);
    powerInteraction.invokePrimary();
    await harness.flushMicrotasks(4);
    assert.deepEqual(snapshot(hass.services.at(-1)), {
      domain: "climate",
      service: "set_hvac_mode",
      data: { entity_id: "climate.living", hvac_mode: "off" },
    }, "power-off requests the established climate service exactly");

    const profileButton = card.shadowRoot.querySelector(".pr");
    profileButton.dispatchEvent(new harness.context.Event("click"));
    const apply = card.shadowRoot.querySelector(".papply");
    assert.ok(apply, "saved profiles remain available as visible controls");
    apply.dispatchEvent(new harness.context.Event("click"));
    await harness.flushMicrotasks(8);
    assert.deepEqual(snapshot(hass.services.slice(-3).map(({ domain, service, data }) => ({ domain, service, data }))), [
      { domain: "climate", service: "set_temperature", data: { entity_id: "climate.living", temperature: 21, hvac_mode: "cool" } },
      { domain: "climate", service: "set_fan_mode", data: { entity_id: "climate.living", fan_mode: "low" } },
      { domain: "select", service: "select_option", data: { entity_id: "select.living_vertical", option: "SWING" } },
    ], "applying a saved profile retains the established climate, fan and vane service contract");

    card.remove();
    assert.equal(subscriptions.length, 0, "disconnect releases the registry subscription");
    harness.context.document.body.append(card);
    assert.equal(subscriptions.length, 1, "reconnect establishes one fresh registry subscription");

    const staleHarness = createComponentHarness();
    const first = deferred();
    const second = deferred();
    staleHarness.context.__componentSplitRegistryV4 = {
      load(_hass) { return staleHarness.context.requestedEntity === "climate.second" ? second.promise : first.promise; },
      subscribe: () => () => {},
    };
    await staleHarness.loadFile("src/components/split-system-controller.js");
    const stale = staleHarness.card(component);
    staleHarness.context.requestedEntity = "climate.first";
    stale.setConfig({ entity: "climate.first" });
    stale.hass = { states: {} };
    for (const control of [stale.$.ma, stale.$.fa, stale.$.va, stale.$.ta]) {
      const label = staleHarness.context.document.createElement("span");
      label.className = "al";
      control.append(label);
    }
    stale.hass = { states: { "climate.first": splitState() } };
    staleHarness.context.requestedEntity = "climate.second";
    stale.setConfig({ entity: "climate.second" });
    stale.hass = { states: { "climate.second": splitState("cool") } };
    first.resolve({ systems: new Map([["climate.first", { room_id: "wrong-room" }]]) });
    second.resolve({ systems: new Map([["climate.second", { room_id: "right-room" }]]) });
    await staleHarness.flushMicrotasks(8);
    assert.equal(stale.config.room_id, "right-room", "a stale registry result cannot overwrite the current component configuration");
  },
};
