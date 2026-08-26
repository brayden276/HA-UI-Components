import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createComponentHarness } from "./fixtures/component-harness.mjs";

const serialise = (value) => JSON.parse(JSON.stringify(value));
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function loadScopedFile(harness, file) {
  const source = await readFile(resolve(root, file), "utf8");
  await harness.loadSource(`{\n${source}\n}`, file);
}

async function loadDashboardRuntime(harness) {
  await loadScopedFile(harness, "src/shared/core.js");
  await loadScopedFile(harness, "src/shared/dashboard-runtime.js");
  await loadScopedFile(harness, "src/shared/wled-runtime.js");
  return harness.context.__homeDashboardV2;
}

async function checkDiscoveryAndResolvers() {
  const harness = createComponentHarness();
  const dashboard = await loadDashboardRuntime(harness);

  assert.equal(dashboard.uiEntry({ entity_id: "switch.hall" }), true, "ordinary visible entries must remain discoverable");
  assert.equal(
    dashboard.uiEntry({ entity_id: "light.wled_main", platform: "wled", original_name: "Main", unique_id: "wled-main" }),
    true,
    "the canonical WLED light must remain discoverable",
  );
  assert.equal(
    dashboard.uiEntry({ entity_id: "light.wled_segment", platform: "wled", original_name: "Segment", unique_id: "wled_2" }),
    false,
    "WLED segment lights must not duplicate the physical-device control",
  );
  assert.equal(
    dashboard.uiEntry({ entity_id: "select.wled_preset", platform: "wled", original_name: "Preset" }),
    false,
    "WLED detail entities must not become top-level controls",
  );
  assert.deepEqual(
    serialise(dashboard.controlConfig({ entity_id: "light.wled_main", platform: "wled", device_id: "wled-device" }, {}, {}, {})),
    { type: "custom:component-wled-controller-v1", entity: "light.wled_main", device_id: "wled-device" },
    "the canonical WLED light must resolve to the component-owned controller",
  );

  const unregister = dashboard.registerControlResolver((entry) => entry.entity_id === "switch.priority" ? { type: "custom:priority-control", entity: entry.entity_id } : null);
  assert.deepEqual(
    serialise(dashboard.controlConfig({ entity_id: "switch.priority" }, {}, {}, {})),
    { type: "custom:priority-control", entity: "switch.priority" },
    "registered component resolvers must take precedence over default card selection",
  );
  unregister();
  assert.equal(
    dashboard.controlConfig({ entity_id: "switch.priority" }, {}, {}, {}).type,
    "custom:bubble-card",
    "unregistering a resolver must restore the default public card contract",
  );

  const garage = { entity_id: "binary_sensor.garage_status", device_id: "garage-device" };
  const registry = { byDevice: new Map([["garage-device", [
    { entity_id: "button.garage_door_trigger", name: "Garage Door Trigger" },
    { entity_id: "button.garage_light", name: "Garage light" },
  ]]]) };
  const hass = { states: { "button.garage_door_trigger": { state: "unknown" }, "button.garage_light": { state: "unknown" } } };
  assert.equal(dashboard.garageControl(garage, registry, hass), "button.garage_door_trigger", "garage discovery must select one explicit operator rather than guessing from sibling buttons");
  registry.byDevice.get("garage-device").push({ entity_id: "button.other_garage_door_operator", name: "Garage Door Operator" });
  hass.states["button.other_garage_door_operator"] = { state: "unknown" };
  assert.equal(dashboard.garageControl(garage, registry, hass), null, "ambiguous garage operators must fail closed");
}

async function checkRegistryRetryAndCoalescing() {
  const harness = createComponentHarness();
  const dashboard = await loadDashboardRuntime(harness);
  const registry = dashboard.REG;
  let subscribeAttempts = 0;
  const retryHass = {
    connection: {
      subscribeEvents() {
        subscribeAttempts += 1;
        return subscribeAttempts === 1 ? Promise.reject(new Error("temporary event subscription failure")) : Promise.resolve(() => {});
      },
      sendMessagePromise: async () => [],
    },
    callWS: async () => [],
  };

  registry.attach(retryHass);
  await harness.flushMicrotasks(6);
  assert.equal(harness.timers.pending(), 1, "a failed event subscription must schedule exactly one retry");
  harness.timers.runAll();
  await harness.flushMicrotasks(6);
  assert.equal(subscribeAttempts, 6, "registry subscription retry must retry the complete event set once");
  registry.detach();

  let registryRequests = 0;
  const coalescedHass = {
    connection: {
      subscribeEvents: async () => () => {},
      sendMessagePromise: async () => {
        registryRequests += 1;
        return [];
      },
    },
    callWS: async () => [],
  };
  registry.attach(coalescedHass);
  const firstRefresh = registry.refresh();
  const secondRefresh = registry.refresh();
  assert.equal(firstRefresh, secondRefresh, "a registry event burst must join the in-flight refresh");
  await firstRefresh;
  await harness.flushMicrotasks(8);
  assert.equal(registryRequests, 6, "a refresh burst must perform one in-flight load and one final reconciled load");
  registry.detach();
}

async function checkPreferencePortal() {
  const harness = createComponentHarness();
  const dashboard = await loadDashboardRuntime(harness);
  class PreferenceEditor extends harness.context.HTMLElement {}
  harness.customElements.define("dashboard-preference-editor-v3", PreferenceEditor);
  const first = await dashboard.preferenceEditor();
  assert.equal(first.parentNode, harness.context.document.body, "the preference editor must open in the document portal");
  first.remove();
  const second = await dashboard.preferenceEditor();
  assert.equal(second, first, "the preference editor portal must retain one shared editor instance");
  assert.equal(second.parentNode, harness.context.document.body, "a detached preference editor must be restored to the portal");
}

async function checkDeviceAwareConfiguration() {
  const harness = createComponentHarness();
  class SplitController extends harness.context.HTMLElement {}
  harness.customElements.define("component-split-controller-v4", SplitController);
  const createdConfigs = [];
  let registryResult = { systems: new Map([["climate.lounge_split", {}]]), claimed: new Set(["button.lounge_claimed"]) };
  let notifyRegistry;
  harness.context.window.loadCardHelpers = async () => ({
    createCardElement(config) {
      createdConfigs.push(serialise(config));
      return harness.context.document.createElement("auto-entities-card");
    },
  });
  harness.context.__componentSplitRegistryV4 = {
    load: async () => registryResult,
    subscribe: (hass, callback) => {
      notifyRegistry = callback;
      return () => {};
    },
  };
  await loadScopedFile(harness, "src/support/device-aware-auto-entities.js");
  const adapter = harness.card("component-device-aware-auto-entities-v1");
  assert.throws(() => adapter.setConfig({}), /Auto-Entities filter/, "the adapter must reject incomplete public configuration");
  adapter.setConfig({
    header: { title: "Climate", icon: "mdi:thermostat" },
    filter: {
      include: [
        { domain: "climate", area: "lounge", state: "cool", not: { state: "off" }, options: { type: "custom:bubble-card" } },
        { domain: "light", options: { type: "custom:bubble-card" } },
      ],
      exclude: [{ state: "unknown" }],
    },
  });
  adapter.hass = {};
  harness.context.document.body.append(adapter);
  await harness.flushMicrotasks(10);

  assert.equal(createdConfigs.length, 1, "the adapter must create one child card from the resolved registry state");
  const [config] = createdConfigs;
  assert.equal(config.type, "custom:auto-entities", "the adapter must preserve the Auto-Entities public card type");
  assert.equal(config.unique, true, "the adapter must prevent duplicate physical-device controls");
  assert.equal(config.header, undefined, "wrapper-only header configuration must not leak into the child card");
  assert.deepEqual(config.filter.include[0], {
    domain: "climate", entity_id: "climate.lounge_split", area: "lounge", state: "cool", not: { state: "off" }, options: { type: "custom:component-split-controller-v4", title: "Split system" },
  }, "a discovered split must use the component-owned controller while retaining the caller filter constraints");
  assert.equal(config.filter.include[1].not.entity_id, "/^(climate\\.lounge_split)$/", "the ordinary climate rule must exclude the injected split entity");
  assert.deepEqual(config.filter.exclude, [{ state: "unknown" }, { entity_id: "/^(button\\.lounge_claimed)$/" }, { state: "unavailable" }], "claimed and unavailable entities must be excluded without duplicating caller exclusions");

  registryResult = { error: true, systems: new Map(), claimed: new Set() };
  notifyRegistry();
  await harness.flushMicrotasks(10);
  assert.equal(createdConfigs.length, 1, "a registry error must retain the last working child controls");
  assert.equal(harness.timers.pending(), 1, "a registry error must schedule one bounded retry");
}

await checkDiscoveryAndResolvers();
await checkRegistryRetryAndCoalescing();
await checkPreferencePortal();
await checkDeviceAwareConfiguration();
console.log("Dashboard discovery check passed: resolver routing, registry retry/coalescing, editor portal, and device-aware card configuration");
