import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const sourcePath = new URL("../src/components/favourites-minimal.js", import.meta.url);
const backendPath = new URL("../src/support/backend-favourites.js", import.meta.url);
const [source, backend] = await Promise.all([readFile(sourcePath, "utf8"), readFile(backendPath, "utf8")]);

class MockNode {
  constructor(localName = "div") {
    this.localName = localName;
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.replaceCount = (this.replaceCount || 0) + 1;
    this.children = nodes;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
}

class MockShadowRoot extends MockNode {
  constructor() {
    super("shadow-root");
    this.editIcon = new MockNode("ha-icon");
  }

  querySelector(selector) {
    if (selector === ".edit ha-icon") return this.editIcon;
    if (selector === "style[data-home-minimal]") {
      return this.children.find((child) => child.localName === "style" && Object.hasOwn(child.dataset, "homeMinimal")) ?? null;
    }
    return null;
  }
}

class MockHTMLElement {
  attachShadow(options) {
    this.shadowOptions = options;
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
}

class MockElements {
  constructor() {
    this.registry = new Map();
    this.gates = new Map();
  }

  define(name, element) {
    this.registry.set(name, element);
  }

  get(name) {
    return this.registry.get(name);
  }

  defer(name) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const gate = { promise, resolve, reject };
    this.gates.set(name, gate);
    return gate;
  }

  whenDefined(name) {
    return this.gates.get(name)?.promise ?? Promise.resolve();
  }
}

let failNextConfig = false;
class BackendFavourites extends MockHTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.originalConfigs = [];
    this.hassValues = [];
  }

  setConfig(config) {
    if (failNextConfig) {
      failNextConfig = false;
      throw new Error("child config failed");
    }
    this.originalConfigs.push(config);
    this.config = { ...config };
  }

  set hass(hass) {
    this._hass = hass;
    this.hassValues.push(hass);
  }

  _syncStored() {}
  _storageSignature() { return ""; }
  _renderGrid() {}
  async _save() {}
  _subscribeRegistryEvents() {}
  _unsubscribeRegistryEvents() {}
}

const elements = new MockElements();
elements.define("component-favourites-v3", BackendFavourites);
const context = vm.createContext({
  HTMLElement: MockHTMLElement,
  customElements: elements,
  document: {
    createElement: (name) => {
      const Element = elements.get(name);
      return Element ? new Element() : new MockNode(name);
    },
  },
  window: { customCards: [] },
  queueMicrotask,
  setTimeout,
  clearTimeout,
  Promise,
  Map,
  Set,
  JSON,
  String,
  Error,
  __homeDashboardV2: { prefs: async () => [] },
});

vm.runInContext(source, context, { filename: sourcePath.pathname });
vm.runInContext(backend, context, { filename: backendPath.pathname });
const Minimal = elements.get("component-favourites-minimal-v1");
assert.ok(Minimal);
assert.equal(Minimal.prototype.__backendStorageV1, true);
assert.deepEqual(JSON.parse(JSON.stringify(Minimal.getGridOptions())), { columns: 12, rows: "auto" });
assert.deepEqual(JSON.parse(JSON.stringify(context.window.customCards)), [{
  type: "component-favourites-minimal-v1",
  name: "Favourites Minimal",
  description: "Existing favourites behaviour with restrained Home typography.",
}]);

const firstGate = elements.defer("component-favourites-v3");
const minimal = new Minimal();
assert.deepEqual(JSON.parse(JSON.stringify(minimal.shadowOptions)), { mode: "open" });
minimal.setConfig({ title: "Earlier" });
const firstBuild = minimal.buildPromise;
minimal.setConfig({ title: "Latest" });
assert.equal(minimal.buildPromise, firstBuild);
firstGate.resolve();
await firstBuild;
await Promise.resolve();
const firstChild = minimal.child;
assert.ok(firstChild instanceof BackendFavourites);
assert.equal(minimal.shadowRoot.children[0], firstChild);
assert.equal(minimal.shadowRoot.replaceCount, 1);
assert.equal(firstChild.originalConfigs.length, 1);
assert.equal(firstChild.originalConfigs[0].title, "Latest");
assert.equal(firstChild.originalConfigs[0].preference_key, "home-control.favourites.v1");
assert.equal(firstChild.config.preference_key, "home-control.favourites.v1");
assert.deepEqual(JSON.parse(JSON.stringify(firstChild.config.helpers)), []);
assert.equal(firstChild.shadowRoot.editIcon.getAttribute("icon"), "mdi:dots-horizontal");
const injected = firstChild.shadowRoot.querySelector("style[data-home-minimal]");
assert.ok(injected);
assert.equal(injected.textContent, ".heading h2{font-size:15px!important;font-weight:500!important}.heading ha-icon{color:var(--secondary-text-color)!important;--mdc-icon-size:17px!important}.edit{min-width:44px!important;min-height:44px!important;padding:0!important;color:var(--secondary-text-color)!important;font-weight:400!important}.edit ha-icon{--mdc-icon-size:16px!important}.edit span{display:none!important}.icon{color:var(--secondary-text-color)!important}.name{font-weight:500!important}.state{font-size:12px!important}.dialog-title,.confirm-title{font-size:16px!important;font-weight:500!important}.subheading,.group-title,.choice-name,.dialog-button{font-weight:500!important}.selected-meta,.choice-meta,.editor-copy{font-size:12px!important}");
minimal.tune();
assert.equal(firstChild.shadowRoot.children.filter((child) => child.localName === "style").length, 1);
minimal.connectedCallback();
minimal.connectedCallback();
await minimal.ensure();
assert.equal(minimal.child, firstChild, "reconnect must retain the built child");
assert.equal(minimal.shadowRoot.replaceCount, 1, "reconnect must not replace the built child");
assert.equal(firstChild.originalConfigs.length, 1, "reconnect must not reconfigure the built child");
assert.equal(firstChild.shadowRoot.children.filter((child) => child.localName === "style").length, 1, "reconnect must not duplicate Minimal tuning");

const hassAfterBuild = { id: "after-build" };
minimal.hass = hassAfterBuild;
assert.deepEqual(firstChild.hassValues, [hassAfterBuild]);
minimal.setConfig({ title: "Override", preference_key: "other.favourites" });
assert.equal(minimal.child, firstChild);
assert.equal(minimal.shadowRoot.replaceCount, 1);
assert.equal(firstChild.originalConfigs.length, 2);
assert.equal(firstChild.originalConfigs[1].preference_key, "other.favourites");
assert.equal(firstChild.config.preference_key, "other.favourites");

const secondGate = elements.defer("component-favourites-v3");
const hassBeforeConfig = { id: "before-config" };
const hassFirst = new Minimal();
hassFirst.hass = hassBeforeConfig;
hassFirst.setConfig({ title: "Hass first" });
const secondBuild = hassFirst.buildPromise;
secondGate.resolve();
await secondBuild;
assert.deepEqual(hassFirst.child.hassValues, [hassBeforeConfig]);
assert.equal(hassFirst.child.originalConfigs[0].preference_key, "home-control.favourites.v1");

const failingGate = elements.defer("component-favourites-v3");
const retry = new Minimal();
const retryEnsure = retry.ensure.bind(retry);
let publicEnsureCall = null;
retry.ensure = () => { publicEnsureCall = retryEnsure(); return publicEnsureCall; };
failNextConfig = true;
retry.setConfig({ title: "Retry" });
const failedBuild = publicEnsureCall;
failingGate.resolve();
await assert.rejects(failedBuild, /child config failed/);
assert.equal(retry.child, null);
assert.equal(retry.buildPromise, null);
const retryGate = elements.defer("component-favourites-v3");
retry.setConfig({ title: "Retry" });
const retriedBuild = publicEnsureCall;
retryGate.resolve();
await retriedBuild;
assert.ok(retry.child);
assert.equal(retry.child.originalConfigs[0].title, "Retry");
assert.equal(retry.child.originalConfigs[0].preference_key, "home-control.favourites.v1");

console.log("check-favourites-minimal: ok");
