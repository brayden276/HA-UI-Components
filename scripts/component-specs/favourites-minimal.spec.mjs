import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-favourites-minimal-v1";
const snapshot = (value) => JSON.parse(JSON.stringify(value));

async function installFavouriteChild(harness) {
  await harness.loadSource(`
    class FavouritesChild extends HTMLElement {
      constructor() {
        super();
        this.configurations = [];
        this.hassValues = [];
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = '<button class="edit"><ha-icon></ha-icon></button>';
      }
      setConfig(config) {
        if (globalThis.__failFavouriteChildConfig) throw new Error("child config failed");
        this.configurations.push({ ...config });
        this.config = { ...config };
      }
      set hass(value) { this.hassValues.push(value); this._hass = value; }
      get hass() { return this._hass; }
    }
    customElements.define("component-favourites-v3", FavouritesChild);
  `, "favourites-child-fixture.js");
}

const waitFor = async (condition, message, turns = 12) => {
  for (let turn = 0; turn < turns; turn += 1) {
    if (condition()) return;
    await Promise.resolve();
  }
  assert.fail(message);
};

export default {
  component,
  profile: "composition-wrapper",
  async run() {
    const harness = createComponentHarness();
    await harness.loadFile("src/components/favourites-minimal.js");
    const Card = harness.customElements.get(component);
    assert.ok(Card, "the public Favourites Minimal card type must be registered");
    assert.deepEqual(
      harness.context.customCards.map(({ type, name, description, preview }) => ({ type, name, description, preview })),
      [{
        type: component,
        name: "Favourites Minimal",
        description: "Existing favourites behaviour with restrained Home typography.",
        preview: true,
      }],
      "the picker must retain the established Favourites Minimal metadata",
    );
    assert.deepEqual(snapshot(Card.getGridOptions()), { columns: 12, rows: "auto" }, "the card must retain its grid contract");
    assert.deepEqual(snapshot(Card.getStubConfig()), { type: `custom:${component}` }, "the shared registration contract must provide a stub config");
    assert.equal(typeof Card.getConfigElement, "function", "the shared registration contract must provide an editor factory");

    const gateHarness = createComponentHarness();
    await gateHarness.loadFile("src/components/favourites-minimal.js");
    const gated = gateHarness.card(component);
    gateHarness.context.document.body.append(gated);
    const firstHass = { states: { "input_text.favourites": { state: "idle" } } };
    gated.setConfig({ title: "Earlier", preference_key: "home-control.favourites.v1" });
    gated.setConfig({ title: "Latest", preference_key: "home-control.favourites.v1", max: 4 });
    gated.hass = firstHass;
    assert.equal(gated.shadowRoot.children.length, 0, "the wrapper must wait for the child custom element before rendering");
    await installFavouriteChild(gateHarness);
    await gateHarness.flushMicrotasks(4);
    const child = gated.child;
    assert.ok(child, "the child card must be created after custom-element readiness");
    assert.equal(gated.shadowRoot.children[0], child, "the child must be appended to the open shadow root");
    assert.deepEqual(snapshot(child.configurations[0]), { title: "Latest", preference_key: "home-control.favourites.v1", max: 4 }, "the latest config must be forwarded once");
    assert.equal(child.hassValues.length, 1, "Hass must be forwarded once after asynchronous creation");
    assert.equal(child.hassValues[0], firstHass, "the original Hass object must be forwarded after asynchronous creation");
    assert.equal(child.shadowRoot.querySelector(".edit ha-icon").getAttribute("icon"), "mdi:dots-horizontal", "the minimal editor icon must retain its semantic icon");
    assert.ok(child.shadowRoot.querySelector("style[data-home-minimal]"), "minimal presentation rules must be applied to the child");

    const refreshedHass = { states: {} };
    gated.hass = refreshedHass;
    assert.equal(child.hassValues.length, 2, "Hass refreshes must be forwarded without replacing the child");
    assert.equal(child.hassValues[1], refreshedHass, "the refreshed Hass object must be forwarded to the retained child");
    gated.remove();
    gateHarness.context.document.body.append(gated);
    await gateHarness.flushMicrotasks(2);
    assert.equal(gated.child, child, "reconnect must retain the existing child identity");
    assert.equal(child.configurations.length, 1, "reconnect must not reconfigure the retained child");
    assert.equal(child.shadowRoot.querySelectorAll("style[data-home-minimal]").length, 1, "reconnect must not duplicate minimal styling");

    const retryHarness = createComponentHarness();
    retryHarness.context.__failFavouriteChildConfig = true;
    await retryHarness.loadFile("src/components/favourites-minimal.js");
    await installFavouriteChild(retryHarness);
    const retry = retryHarness.card(component);
    retryHarness.context.document.body.append(retry);
    const originalEnsure = retry.ensure.bind(retry);
    let ensurePromise;
    retry.ensure = () => { ensurePromise = originalEnsure(); return ensurePromise; };
    retry.setConfig({ title: "Retry" });
    const failure = await ensurePromise.catch((error) => error);
    assert.match(failure?.message || "", /child config failed/, "a child configuration failure must reject the build");
    assert.equal(retry.child, null, "a failed child build must not commit partial content");
    assert.equal(retry.buildPromise, null, "a failed child build must release its retry gate");
    retryHarness.context.__failFavouriteChildConfig = false;
    retry.setConfig({ title: "Retry" });
    await retry.buildPromise;
    assert.ok(retry.child, "a later config must retry child creation");
    assert.equal(retry.child.configurations[0].title, "Retry", "the retry must use the current config");
  },
};
