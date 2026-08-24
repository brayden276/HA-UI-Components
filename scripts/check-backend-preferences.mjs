import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(
  resolve(root, "src/support/backend-preferences.js"),
  "utf8",
);
const favouritesSource = await readFile(
  resolve(root, "src/support/backend-favourites.js"),
  "utf8",
);
new vm.Script(favouritesSource, { filename: "src/support/backend-favourites.js" });
for (const contract of [
  'preference_key: "home-control.favourites.v1"',
  "this.config.helpers = []",
  "await backendFavouritesRuntime.savePrefs",
  '"ha_component_backend_preferences_updated"',
]) {
  assert.ok(
    favouritesSource.includes(contract),
    `backend favourites adapter is missing contract: ${contract}`,
  );
}
const legacyWrites = [];
const context = {
  console,
  customElements: { get: () => undefined },
  document: {},
  __homeDashboardV2: {
    prefs: async () => ({ order: ["kitchen"], hidden: [] }),
    savePrefs: async (_hass, key, value) => {
      legacyWrites.push({ key, value });
    },
  },
};
context.globalThis = context;
vm.runInContext(source, vm.createContext(context), {
  filename: "src/support/backend-preferences.js",
});

{
  const calls = [];
  const connection = {};
  const hass = {
    connection,
    async callWS(message) {
      calls.push(message);
      if (message.type.endsWith("/get")) {
        return { key: message.key, found: false, value: null, revision: 0 };
      }
      return { key: message.key, found: true, value: message.value, revision: 1 };
    },
  };
  const value = await context.__homeDashboardV2.prefs(hass, "home-control.rooms.v2");
  assert.deepEqual(value, { order: ["kitchen"], hidden: [] });
  assert.equal(calls.length, 2, "a missing backend preference should migrate once");
  assert.equal(calls[1].expected_revision, 0);

  hass.callWS = async (message) => {
    calls.push(message);
    return { key: message.key, found: true, value: message.value, revision: 2 };
  };
  await context.__homeDashboardV2.savePrefs(hass, "home-control.rooms.v2", {
    order: ["study"],
    hidden: [],
  });
  assert.equal(calls.at(-1).expected_revision, 1, "save should use the per-key backend revision");
}

{
  const hass = {
    connection: {},
    callWS: async () => {
      const error = new Error("conflict");
      error.code = "preference_conflict";
      throw error;
    },
  };
  await assert.rejects(
    context.__homeDashboardV2.savePrefs(hass, "home-control.rooms.v2", {}),
    /changed on another screen/,
  );
}

{
  const hass = {
    connection: {},
    callWS: async () => {
      const error = new Error("unknown command");
      error.code = "unknown_command";
      throw error;
    },
  };
  const value = await context.__homeDashboardV2.prefs(hass, "legacy-key");
  assert.deepEqual(value, { order: ["kitchen"], hidden: [] });
  await context.__homeDashboardV2.savePrefs(hass, "legacy-key", { order: [] });
  assert.deepEqual(legacyWrites.at(-1), { key: "legacy-key", value: { order: [] } });
}

console.log("Backend preference contract passed: migration, revision acknowledgement, conflict feedback and legacy fallback");
