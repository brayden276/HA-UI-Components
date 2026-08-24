import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { entityState, hassFixture, registryFixture } from "./fixtures/ha-models.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const context = { Map, Number, Object, RegExp, Set, String, console };
context.globalThis = context;
context.__homeDashboardV2 = {
  areaOf(entity, registry) {
    return entity.area_id || registry.devices.find((device) => device.id === entity.device_id)?.area_id || null;
  },
  uiEntry(entity) { return Boolean(entity?.entity_id && !entity.disabled_by && !entity.hidden_by && !["diagnostic", "config"].includes(entity.entity_category)); },
};
const sandbox = vm.createContext(context);
for (const file of ["src/shared/apple-tv-runtime.js", "src/shared/security-runtime.js"]) {
  vm.runInContext(await readFile(resolve(root, file), "utf8"), sandbox, { filename: file });
}
const { APPLE_TV_FEATURES: F, appleTvModel, securityModel } = context.__HA_COMPONENT_LIBRARY_SHARED__;

const securityRegistry = registryFixture({
  areas: [{ id: "front", name: "Front Yard" }, { id: "garage", name: "Garage" }],
  devices: [
    { id: "camera-device", area_id: "front", name_by_user: "Front camera" },
    { id: "garage-device", area_id: "garage", name_by_user: "Garage door" },
  ],
  entities: [
    { entity_id: "camera.front_main", device_id: "camera-device", platform: "frigate", unique_id: "front_main", area_id: "front" },
    { entity_id: "camera.front_sub", device_id: "camera-device", platform: "frigate", unique_id: "front_sub", area_id: "front" },
    { entity_id: "switch.front_recordings", device_id: "camera-device", platform: "frigate", translation_key: "recordings", entity_category: "config" },
    { entity_id: "switch.front_detect", device_id: "camera-device", platform: "frigate", translation_key: "detect", entity_category: "config" },
    { entity_id: "binary_sensor.front_motion", device_id: "camera-device", platform: "frigate", translation_key: "motion" },
    { entity_id: "image.front_person", device_id: "camera-device", platform: "frigate", name: "Person" },
    { entity_id: "image.front_car", device_id: "camera-device", platform: "frigate", name: "Car" },
    { entity_id: "binary_sensor.garage_open", device_id: "garage-device", platform: "meross", area_id: "garage" },
    { entity_id: "button.garage_trigger", device_id: "garage-device", platform: "meross", translation_key: "trigger" },
    { entity_id: "camera.hidden", device_id: "hidden-device", platform: "demo", hidden_by: "user" },
  ],
});
const securityHass = hassFixture({
  "camera.front_main": entityState("camera.front_main", "streaming", { entity_picture: "/api/camera_proxy/camera.front_main" }),
  "camera.front_sub": entityState("camera.front_sub", "streaming"),
  "camera.front_hd": entityState("camera.front_hd", "streaming"),
  "switch.front_recordings": entityState("switch.front_recordings", "on"),
  "switch.front_detect": entityState("switch.front_detect", "on"),
  "binary_sensor.front_motion": entityState("binary_sensor.front_motion", "on", { device_class: "motion" }),
  "image.front_person": entityState("image.front_person", "2026-08-24T10:00:00Z", { entity_picture: "/api/image_proxy/image.front_person" }),
  "image.front_car": entityState("image.front_car", "2026-08-24T09:00:00Z", { entity_picture: "/api/image_proxy/image.front_car" }),
  "binary_sensor.garage_open": entityState("binary_sensor.garage_open", "on", { device_class: "garage_door" }),
  "button.garage_trigger": entityState("button.garage_trigger", "unknown"),
  "camera.hidden": entityState("camera.hidden", "streaming"),
});
const security = securityModel(securityHass, securityRegistry, {
  area_ids: ["front", "garage"],
  mappings: { "camera_stream:camera.front_main": "camera.front_hd" },
});
assert.equal(security.cameras.length, 1, "camera streams belonging to one device must collapse into one camera");
assert.equal(security.cameras[0].entityId, "camera.front_main", "snapshot-capable stream must be preferred");
assert.equal(security.cameras[0].streamEntityId, "camera.front_hd", "backend profile must select the full-resolution stream");
assert.equal(security.cameras[0].name, "Front camera", "camera device names must remain distinguishable");
assert.deepEqual([...security.cameras[0].switches.map((item) => item.role)], ["Recording", "Detection"]);
assert.deepEqual([...security.cameras[0].classifications.map((item) => item.name)].sort(), ["Car", "Person"], "Frigate image entities must provide classification snapshots");
assert.equal(security.cameras[0].ptz.length, 0, "PTZ must not be invented when no PTZ capability exists");
assert.equal(security.entries.length, 1, "one physical entry must render once");
assert.equal(security.entries[0].controlEntityId, "button.garage_trigger");
assert.equal(security.allClear, false);
assert.deepEqual([...security.attention.map((item) => item.type)].sort(), ["camera-activity", "entry-open"]);
assert.match(securityModel(securityHass, { error: new Error("registry down") }).error.message, /registry down/);

const appleEntities = [
  { entity_id: "media_player.lounge_tv", device_id: "apple-device", platform: "apple_tv", config_entry_id: "apple-entry" },
  { entity_id: "remote.lounge_tv", device_id: "apple-device", platform: "apple_tv", config_entry_id: "apple-entry" },
  { entity_id: "binary_sensor.lounge_keyboard_focus", device_id: "apple-device", platform: "apple_tv", config_entry_id: "apple-entry" },
];
const appleRegistry = registryFixture({ devices: [{ id: "apple-device" }], entities: appleEntities });
const appleHass = hassFixture({
  "media_player.lounge_tv": entityState("media_player.lounge_tv", "playing", {
    friendly_name: "Lounge Apple TV",
    source: "Netflix",
    source_list: ["Netflix", "Netflix", "YouTube"],
    volume_level: 0.45,
    supported_features: F.PAUSE | F.MUTE | F.STEP_VOLUME | F.SOURCE | F.NEXT,
  }),
  "remote.lounge_tv": entityState("remote.lounge_tv", "on", { supported_commands: ["up", "select", "suspend"] }),
  "binary_sensor.lounge_keyboard_focus": entityState("binary_sensor.lounge_keyboard_focus", "on"),
});
const apple = appleTvModel(appleHass, { entity: "media_player.lounge_tv" }, appleRegistry);
assert.equal(apple.available, true);
assert.equal(apple.awake, true);
assert.equal(apple.canPause, true);
assert.equal(apple.canPlay, false);
assert.equal(apple.canNavigate, true);
assert.equal(apple.canSleep, true);
assert.equal(apple.canSelectSource, true);
assert.equal(apple.canSetKeyboardText, true);
assert.deepEqual([...apple.sources], ["Netflix", "YouTube"], "installed apps must be stable and deduplicated");
assert.equal(apple.status, "Playing · Netflix");

const dateContext = {
  CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; Object.assign(this, options); } },
  Date, Error, Intl, Map, Number, Object, Promise, Set, String,
  navigator: { language: "en-AU" },
  sessionStorage: { values: new Map(), getItem(key) { return this.values.get(key) ?? null; }, setItem(key, value) { this.values.set(key, String(value)); } },
};
dateContext.globalThis = dateContext;
dateContext.window = dateContext;
dateContext.dispatchEvent = () => true;
const dateSandbox = vm.createContext(dateContext);
for (const file of ["src/shared/async-broker.js", "src/shared/localisation.js"]) {
  vm.runInContext(`{\n${await readFile(resolve(root, file), "utf8")}\n}`, dateSandbox, { filename: file });
}
dateContext.__HA_COMPONENT_LIBRARY_SHARED__.connectionId = () => "fixture";
vm.runInContext(`{\n${await readFile(resolve(root, "src/support/energy-store.js"), "utf8")}\n}`, dateSandbox, { filename: "src/support/energy-store.js" });
const dateShared = dateContext.__HA_COMPONENT_LIBRARY_SHARED__;
const remoteHass = hassFixture({}, { config: { time_zone: "Pacific/Honolulu" } });
assert.match(dateShared.formatCalendarDay(remoteHass, "2026-08-24", { day: "numeric", month: "short", year: "numeric" }), /24 Aug 2026/);
const expectedToday = Object.fromEntries(new Intl.DateTimeFormat("en-AU", {
  timeZone: "Pacific/Honolulu", year: "numeric", month: "2-digit", day: "2-digit",
}).formatToParts(new Date()).map((part) => [part.type, part.value]));
assert.equal(dateShared.energyDayState.today(remoteHass), `${expectedToday.year}-${expectedToday.month}-${expectedToday.day}`);
assert.equal(dateShared.energyDayState.get("timezone-fixture", remoteHass), dateShared.energyDayState.today(remoteHass));
const daylightSavingDay = dateShared.calendarDayRange(hassFixture(), "2026-10-04");
assert.equal(daylightSavingDay.end - daylightSavingDay.start, 23 * 60 * 60 * 1000, "HA-local day ranges must honour daylight-saving transitions");

console.log("Component model check passed: Security discovery, Apple TV capabilities and HA-local calendar dates");
