import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "src/support/backend-preferences.js"), "utf8");
const legacyWrites = [];
const context = {
  console,
  __homeDashboardV2: {
    prefs: async () => ({ order: ["kitchen"], hidden: [] }),
    savePrefs: async (_hass, key, value) => legacyWrites.push({ key, value }),
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
  assert.equal(calls.length, 2, "a missing backend preference migrates the existing value once");
  assert.equal(calls[1].expected_revision, 0);

  await context.__homeDashboardV2.savePrefs(hass, "home-control.rooms.v2", {
    order: ["study"],
    hidden: [],
  });
  assert.equal(calls.at(-1).expected_revision, 1, "writes retain the backend revision returned by migration");
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
    "a conflicting save remains explicit so an editor can preserve the user's draft",
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
  assert.deepEqual(legacyWrites.at(-1), { key: "legacy-key", value: { order: [] } }, "an unavailable backend retains the lossless frontend fallback");
}

{
  const calls = [];
  let reads = 0;
  const hass = {
    connection: {},
    async callWS(message) {
      calls.push(message);
      if (message.type.endsWith("/get")) {
        reads += 1;
        return { key: message.key, found: false, value: null, revision: reads + 3 };
      }
      if (message.value?.order?.[0] === "kitchen") {
        const error = new Error("conflict");
        error.code = "preference_conflict";
        throw error;
      }
      return { key: message.key, found: true, value: message.value, revision: 6 };
    },
  };
  await context.__homeDashboardV2.prefs(hass, "tombstone-key");
  await context.__homeDashboardV2.savePrefs(hass, "tombstone-key", { order: ["study"] });
  assert.equal(calls.at(-1).expected_revision, 5, "a missing-key migration conflict retains the refreshed tombstone revision");
}

console.log("Backend preference contract passed: migration, revision acknowledgement, conflict feedback, legacy fallback and stale-load replacement");
