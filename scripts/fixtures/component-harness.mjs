import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createDeterministicTimers, flushMicrotasks } from "./async.mjs";
import { createDom } from "./dom.mjs";
import { createHassFixture } from "./hass.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function createComponentHarness({ capabilities = [], hass = createHassFixture() } = {}) {
  const enabled = new Set(capabilities);
  const definitions = new Map();
  const waiters = new Map();
  const customElements = {
    define(type, element) {
      if (definitions.has(type)) throw new Error(`Duplicate custom element registration: ${type}`);
      definitions.set(type, element);
      for (const resolveWaiter of waiters.get(type) ?? []) resolveWaiter();
      waiters.delete(type);
    },
    get: (type) => definitions.get(type),
    whenDefined(type) {
      if (definitions.has(type)) return Promise.resolve();
      return new Promise((resolveWaiter) => waiters.set(type, [...(waiters.get(type) ?? []), resolveWaiter]));
    },
  };
  const dom = createDom({ definitions });
  const timers = createDeterministicTimers();
  const registrations = [];
  const interactions = [];
  const navigation = [];
  const moreInfo = [];
  const portals = [];
  const childCards = [];
  class HarnessDashboardBaseCard extends dom.HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    set hass(_hass) {}
    escapeHtml(value) { return shared.escapeHtml(value); }
    cardStyles() { return ".shared-dashboard-card{}"; }
  }
  const eventTarget = (label) => {
    const listeners = new Map();
    return {
      addEventListener(type, listener) {
        if (typeof listener !== "function") throw new TypeError(`${label} listener must be a function`);
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
      removeEventListener(type, listener) { listeners.set(type, (listeners.get(type) ?? []).filter((item) => item !== listener)); },
      dispatchEvent(event) {
        if (!event || typeof event.type !== "string") throw new TypeError(`${label} dispatchEvent requires an Event`);
        event.target ??= this; event.currentTarget = this;
        for (const listener of [...(listeners.get(event.type) ?? [])]) listener.call(this, event);
        return !event.defaultPrevented;
      },
      listeners,
    };
  };
  const documentEvents = eventTarget("document");
  const globalEvents = eventTarget("globalThis");
  const shared = {
    PRESENTATIONAL_CARD_STYLES: ".shared-card{}",
    DashboardBaseCard: HarnessDashboardBaseCard,
    escapeHtml: (value) => value == null ? "" : String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"),
    installConfigContract(type, element) {
      element.getStubConfig ??= () => ({ type: `custom:${type}` });
      element.getConfigElement ??= async () => ({ cardType: type });
    },
    registerCard({ type, element, name, description, preview = true }) {
      if (!type || !element || !name || !description) throw new Error("Public registration requires type, element, name and description");
      shared.installConfigContract(type, element);
      if (!customElements.get(type)) customElements.define(type, element);
      const registration = { type, element, name, description, preview };
      registrations.push(registration);
      context.customCards.push(registration);
    },
    interaction(element, options = {}) {
      if (!element) throw new Error("interaction requires an element");
      const handle = { element, options, destroyed: false, destroy() { this.destroyed = true; }, invokePrimary: () => options.primary?.(), invokeHold: () => options.hold?.() };
      interactions.push(handle); return handle;
    },
    navigateTo: (path) => navigation.push(path),
    openMoreInfo: (host, entityId) => moreInfo.push({ host, entityId }),
  };
  const context = {
    ...dom, AbortController, CSS: { escape: String }, Map, Set, Promise, JSON, Error, console,
    customElements, document: dom.document, HTMLElement: dom.HTMLElement, Event: dom.Event, CustomEvent: dom.CustomEvent,
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout, setInterval: timers.setInterval, clearInterval: timers.clearInterval,
    queueMicrotask, navigator: { language: "en-AU" }, history: { pushState() {}, replaceState() {} }, location: { pathname: "/", hash: "", search: "" },
    __HA_COMPONENT_LIBRARY_SHARED__: shared, __homeDashboardV2: {},
  };
  context.window = context; context.globalThis = context; context.customCards = []; context.hass = hass;
  if (enabled.has("document-events")) Object.assign(context.document, documentEvents);
  if (enabled.has("global-events")) Object.assign(context, globalEvents);
  if (enabled.has("document-events")) {
    context.document.parentNode = enabled.has("global-events") ? context : null;
    context.document.listeners = documentEvents.listeners;
    context.document.head.parentNode = context.document;
    context.document.body.parentNode = context.document;
  }
  if (enabled.has("global-events")) context.listeners = globalEvents.listeners;
  const vmContext = vm.createContext(context);
  return {
    capabilities: enabled, context, customElements, definitions, registrations, interactions, navigation, moreInfo, portals, hass, timers, documentEvents, globalEvents,
    async loadSource(source, filename = "component.js") { vm.runInContext(source, vmContext, { filename }); await flushMicrotasks(); },
    async loadFile(file) { return this.loadSource(await readFile(resolve(root, file), "utf8"), file); },
    card(type) { const Card = definitions.get(type); if (!Card) throw new Error(`No registered component: ${type}`); return new Card(); },
    createChildCard(type, config, childHass = hass) {
      const child = dom.document.createElement(type);
      if (typeof child.setConfig !== "function") throw new Error(`Child card ${type} does not implement setConfig()`);
      child.setConfig(config);
      child.hass = childHass;
      childCards.push({ type, config, child });
      return child;
    },
    updateChildHass(child, childHass) { child.hass = childHass; return child; },
    childCards,
    openPortal(node) {
      if (!enabled.has("portals")) throw new Error("Portal operations require the portals capability");
      dom.document.body.append(node);
      portals.push(node);
      return node;
    },
    closePortal(node) { node.remove(); const index = portals.indexOf(node); if (index >= 0) portals.splice(index, 1); },
    flushMicrotasks,
  };
}
