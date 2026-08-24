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

{
  const calls = [];
  let getCount = 0;
  const hass = {
    connection: {},
    async callWS(message) {
      calls.push(message);
      if (message.type.endsWith("/get")) {
        getCount += 1;
        return { key: message.key, found: false, value: null, revision: getCount === 1 ? 4 : 5 };
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
  assert.equal(calls.at(-1).expected_revision, 5, "a missing-key tombstone revision must be retained after migration conflict");
}

class FavouriteNode {
  constructor() {
    this.attributes = new Map();
    this.disabled = false;
    this.hidden = false;
    this.innerHTML = "";
    this.open = false;
    this.style = {};
    this.textContent = "";
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  close() { this.open = false; }
}

class FavouriteCard {
  constructor(hass) {
    this._hass = hass;
    this._connection = hass.connection;
    this._selected = [];
    this._draft = [];
    this.isConnected = true;
    this.$ = {
      edit: new FavouriteNode(),
      grid: new FavouriteNode(),
      save: new FavouriteNode(),
      editor: new FavouriteNode(),
      editorError: new FavouriteNode(),
    };
  }
  setConfig(config) {
    const helpers = Array.isArray(config.helpers) ? config.helpers : [];
    const items = Array.isArray(config.items) ? config.items : [];
    if (!helpers.length && !items.length) throw new Error("helpers or items is required");
    this.config = { max: 4, ...config, helpers, items };
    this._syncStored();
    this._renderGrid();
  }
  _syncStored() {}
  _storageSignature() { return JSON.stringify(this.config.helpers); }
  _renderGrid() {}
  _save() {}
  _subscribeRegistryEvents() {}
  _unsubscribeRegistryEvents() {}
  _updateEditorState() {}
  _notice() {}
  _normaliseRef(value) {
    return value && typeof value === "object" && [value.d, value.p, value.u].every(Boolean)
      ? { v: 1, d: String(value.d), p: String(value.p), u: String(value.u), n: String(value.n ?? "") }
      : null;
  }
  _parseSlot(value) {
    try { return this._normaliseRef(JSON.parse(value)); }
    catch { return null; }
  }
}

{
  const first = { v: 1, d: "light", p: "hue", u: "first", n: "First" };
  const second = { v: 1, d: "switch", p: "shelly", u: "second", n: "Second" };
  let resolveFirst;
  const preferenceCalls = [];
  const favouritesRuntime = {
    prefs: (_hass, key) => {
      preferenceCalls.push(key);
      if (key === "first") return new Promise((resolvePromise) => { resolveFirst = resolvePromise; });
      return Promise.resolve([second]);
    },
    savePrefs: async () => ({ revision: 1 }),
  };
  const favouritesContext = {
    console,
    __homeDashboardV2: favouritesRuntime,
    customElements: {
      get: (name) => name === "component-favourites-v3" ? FavouriteCard : undefined,
    },
  };
  favouritesContext.globalThis = favouritesContext;
  vm.runInContext(favouritesSource, vm.createContext(favouritesContext), {
    filename: "src/support/backend-favourites.js",
  });

  const card = new FavouriteCard({ connection: {}, states: {} });
  card.setConfig({ preference_key: "first", helpers: ["input_text.legacy"] });
  const staleRequest = card._preferencePromise;
  card.setConfig({ preference_key: "second", helpers: ["input_text.legacy"] });
  resolveFirst([first]);
  await staleRequest;
  await card._preferencePromise;
  assert.deepEqual(preferenceCalls, ["first", "second"]);
  assert.deepEqual(JSON.parse(JSON.stringify(card._selected)), [second]);
  assert.equal(card._preferenceLoaded, true);

  let resolveForced;
  let forcedCalls = 0;
  favouritesRuntime.prefs = () => {
    forcedCalls += 1;
    if (forcedCalls === 1) {
      return new Promise((resolvePromise) => { resolveForced = resolvePromise; });
    }
    return Promise.resolve([first]);
  };
  void card._loadBackendFavourites(true);
  const firstForcedRequest = card._preferencePromise;
  void card._loadBackendFavourites(true);
  resolveForced([second]);
  await firstForcedRequest;
  await card._preferencePromise;
  assert.equal(forcedCalls, 2, "a backend event during a read must queue a fresh read");
  assert.deepEqual(JSON.parse(JSON.stringify(card._selected)), [first]);
}

console.log("Backend preference contract passed: migration, revision acknowledgement, conflict feedback, legacy fallback and stale-load replacement");
