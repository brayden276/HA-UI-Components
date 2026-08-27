import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const definitions = new Map();
class MockElement {}
const context = {
  Array,
  Boolean,
  Error,
  Map,
  Object,
  Promise,
  Set,
  String,
  TypeError,
  clearTimeout,
  customElements: {
    define(type, element) { definitions.set(type, element); },
    get(type) { return definitions.get(type); },
  },
  HTMLElement: MockElement,
  queueMicrotask,
  setTimeout,
  window: {},
};
context.globalThis = context;
context.window = context;
const sandbox = vm.createContext(context);

for (const file of ["src/shared/core.js", "src/shared/dashboard-runtime.js", "src/shared/wled-runtime.js"]) {
  const source = await readFile(resolve(root, file), "utf8");
  vm.runInContext(`{\n${source}\n}`, sandbox, { filename: file });
}

const dashboard = context.__homeDashboardV2;
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
  JSON.parse(JSON.stringify(dashboard.controlConfig({ entity_id: "light.wled_main", platform: "wled", device_id: "wled-device" }, {}, {}, {}))),
  {
    type: "custom:component-wled-controller-v1",
    entity: "light.wled_main",
    device_id: "wled-device",
  },
  "the canonical WLED light must resolve to the component-owned controller",
);

const garage = { entity_id: "binary_sensor.garage_status", device_id: "garage-device" };
const registry = {
  byDevice: new Map([["garage-device", [
    { entity_id: "button.garage_door_trigger", name: "Garage Door Trigger" },
    { entity_id: "button.garage_light", name: "Garage light" },
  ]]]),
};
const hass = {
  states: {
    "button.garage_door_trigger": { state: "unknown" },
    "button.garage_light": { state: "unknown" },
  },
};
assert.equal(
  dashboard.garageControl(garage, registry, hass),
  "button.garage_door_trigger",
  "garage discovery must select one explicit operator rather than guessing from sibling buttons",
);
registry.byDevice.get("garage-device").push({ entity_id: "button.other_garage_door_operator", name: "Garage Door Operator" });
hass.states["button.other_garage_door_operator"] = { state: "unknown" };
assert.equal(
  dashboard.garageControl(garage, registry, hass),
  null,
  "ambiguous garage operators must fail closed",
);

const climate = { entity_id: "climate.living_room_split_climate", device_id: "split-device", name: "Living room split" };
const splitEntries = [
  climate,
  { entity_id: "select.living_room_split_vertical_vane", device_id: "split-device", name: "Vertical vane" },
  { entity_id: "select.living_room_split_horizontal_vane", device_id: "split-device", name: "Horizontal vane" },
  { entity_id: "timer.living_room_split", area_id: "living_room", name: "Living room split timer" },
  { entity_id: "script.living_room_split_profile", area_id: "living_room", name: "Living room split profile" },
  { entity_id: "scene.living_room_evening", area_id: "living_room", name: "Living room evening" },
];
const splitRegistry = {
  entities: splitEntries,
  byDevice: new Map([["split-device", splitEntries.slice(0, 3)]]),
  deviceArea: new Map([["split-device", "living_room"]]),
};
const splitHass = {
  states: Object.fromEntries(splitEntries.map((entry) => [entry.entity_id, { state: "idle", attributes: { friendly_name: entry.name } }])),
};
assert.deepEqual(
  JSON.parse(JSON.stringify(dashboard.nativeClimateControlConfig(climate, splitHass.states[climate.entity_id], splitRegistry, splitHass))),
  {
    type: "custom:component-split-controller-v4",
    entity: "climate.living_room_split_climate",
    title: "Living room split",
    vertical_vane_entity: "select.living_room_split_vertical_vane",
    horizontal_vane_entity: "select.living_room_split_horizontal_vane",
    timer_entity: "timer.living_room_split",
    profile_entities: [{ entity: "script.living_room_split_profile", name: "Living room split profile" }],
  },
  "native climate discovery must compose one Split card from its HA vane, timer and profile entities",
);

console.log("Dashboard discovery check passed: WLED, garage and native Split composition");
