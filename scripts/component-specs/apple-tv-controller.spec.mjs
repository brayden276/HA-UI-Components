import assert from "node:assert/strict";
import { createComponentHarness } from "../fixtures/component-harness.mjs";

const component = "component-apple-tv-controller-v1";

const model = Object.freeze({
  entities: { media: "media_player.apple_tv", remote: "remote.apple_tv", configEntryId: "apple" }, media: { attributes: {} }, remote: { attributes: { supported_commands: ["wakeup", "suspend", "select"] } },
  awake: true, sleeping: false, available: true, sources: [], currentSource: null, level: 0.5, muted: false, keyboardFocused: false, status: "Idle",
  canWake: false, canSleep: true, canNavigate: true, canPlay: false, canPause: false, canStop: false, canPrevious: false, canNext: false, canVolumeUp: true, canVolumeDown: true, canMute: true, canSelectSource: false, canSetKeyboardText: false,
});

export default {
  component,
  profile: "direct-controller",
  async run() {
    const calls = [];
    const harness = createComponentHarness();
    const shared = harness.context.__HA_COMPONENT_LIBRARY_SHARED__;
    shared.APPLE_TV_NAV = [["select", "Select", "mdi:checkbox-blank-circle-outline"]];
    shared.appleTvAppIcon = () => "mdi:television";
    shared.appleTvModel = () => model;
    shared.createOverlayController = (_host, panel) => ({ open() { panel.hidden = false; }, close() { panel.hidden = true; } });
    shared.createRequestCoalescer = (run) => ({ destroyed: false, request: (value) => run(value), destroy() { this.destroyed = true; } });
    await harness.loadFile("src/components/component-apple-tv-controller-v1.js");
    const card = harness.card(component);
    assert.throws(() => card.setConfig({}), /media-player entity/i);
    card.setConfig({ entity: "media_player.apple_tv" });
    card.hass = { states: {}, callService: async (...args) => calls.push(args) };
    assert.equal(card.shadowRoot.querySelector(".status")?.textContent, "Idle");
    await card.remoteCommand("suspend", "sleep");
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["remote", "send_command", { entity_id: "remote.apple_tv", command: "suspend" }]], "sleep must use the discovered Apple TV remote entity");
    card.disconnectedCallback();
    assert.equal(card.volumeCoalescer, null, "disconnect must release queued volume work");
  },
};
