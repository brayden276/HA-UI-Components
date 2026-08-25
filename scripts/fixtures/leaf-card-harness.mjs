import assert from "node:assert/strict";
import vm from "node:vm";

export function createLeafCardHarness({ source, filename, buttonSelector = "button.demo" }) {
  class MockElement {
    constructor(dataset = {}) { this.dataset = dataset; }
  }
  class MockShadowRoot {
    innerHTML = "";

    querySelector(selector) {
      return selector === buttonSelector && this.innerHTML.includes(`<${buttonSelector.split(".")[0]} class="${buttonSelector.split(".")[1]}"`) ? new MockElement() : null;
    }
    querySelectorAll(selector) {
      const [tagName, className] = selector.split(".");
      const expression = new RegExp(`<${tagName} class="[^\"]*\\b${className}\\b[^\"]*"[^>]*data-index="([^\"]+)"`, "g");
      return [...this.innerHTML.matchAll(expression)].map(([, index]) => new MockElement({ index }));
    }
  }
  class MockHTMLElement {
    attachShadow(options) {
      if (this.shadowRoot) throw new Error("a card may attach only one shadow root");
      assert.equal(options?.mode, "open", "the card must attach an open shadow root");
      assert.deepEqual(Object.keys(options), ["mode"], "the card shadow options must remain exact");
      this.shadowRoot = new MockShadowRoot();
      return this.shadowRoot;
    }
  }

  const definitions = new Map();
  const customElements = {
    define(type, element) { definitions.set(type, element); },
    get(type) { return definitions.get(type); },
    whenDefined() { return Promise.resolve(); },
  };
  const registrations = [];
  const installedContracts = [];
  const interactions = [];
  const navigations = [];
  const moreInfoRequests = [];
  const escapeHtml = (value) => (value == null ? "" : String(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  const shared = {
    PRESENTATIONAL_CARD_STYLES: ".shared-card{}",
    escapeHtml,
    installConfigContract(type, element) {
      installedContracts.push([type, element]);
      element.getStubConfig ??= () => ({ type: `custom:${type}` });
      element.getConfigElement ??= async () => ({ cardType: type });
    },
    interaction(element, options) {
      const handle = {
        destroyCalls: 0,
        destroyed: false,
        element,
        options,
        destroy() { this.destroyCalls += 1; this.destroyed = true; },
        invokePrimary() { return options.primary?.(); },
        invokeHold() { return options.hold?.(); },
      };
      interactions.push(handle);
      return handle;
    },
    navigateTo(path) { navigations.push(path); },
    openMoreInfo(host, entity) { moreInfoRequests.push([host, entity]); },
    registerCard({ type, element, name, description, preview = true }) {
      shared.installConfigContract(type, element);
      if (!customElements.get(type)) customElements.define(type, element);
      registrations.push({ type, element, name, description, preview });
    },
  };
  const context = { HTMLElement: MockHTMLElement, __HA_COMPONENT_LIBRARY_SHARED__: shared, customElements };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename });

  const assertConfig = (card, expected, message) => {
    assert.deepEqual(Object.keys(card.c), Object.keys(expected), `${message}: key order`);
    for (const [key, value] of Object.entries(expected)) assert.equal(card.c[key], value, `${message}: ${key}`);
  };
  const assertOwnData = (object, key, value, message) => assert.deepEqual(
    Object.getOwnPropertyDescriptor(object, key),
    { value, writable: true, enumerable: true, configurable: true },
    message,
  );
  return {
    MockElement, registrations, installedContracts, interactions, navigations, moreInfoRequests, escapeHtml,
    Card: () => registrations[0]?.element,
    assertConfig, assertOwnData,
    async applyRuntimePatch(runtimeSource) {
      const originalDisconnect = registrations[0]?.element?.prototype.disconnectedCallback;
      vm.runInNewContext(runtimeSource, context, { filename: "src/patches/runtime-reliability.js" });
      await Promise.resolve();
      await Promise.resolve();
      return originalDisconnect;
    },
  };
}
