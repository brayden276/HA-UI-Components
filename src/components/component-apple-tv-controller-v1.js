/** Thin Apple TV wrapper around native Home Assistant media controls. */
const { interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const APPLE_TV_REMOTE_COMMANDS = Object.freeze([
  ["up", "Up", "mdi:chevron-up"],
  ["left", "Left", "mdi:chevron-left"],
  ["select", "Select", "mdi:radiobox-marked"],
  ["right", "Right", "mdi:chevron-right"],
  ["down", "Down", "mdi:chevron-down"],
]);

const APPLE_TV_UTILITY_COMMANDS = Object.freeze([
  ["menu", "Menu", "mdi:menu"],
  ["home", "Home", "mdi:home-outline"],
  ["top_menu", "Top Menu", "mdi:format-list-bulleted"],
]);

const appleTvNativeTileConfig = (config) => ({
  type: "tile",
  entity: config.entity,
  ...(config.title ? { name: config.title } : {}),
  features_position: "bottom",
  features: [
    {
      type: "media-player-playback",
      controls: ["media_previous_track", "media_play_pause", "media_next_track"],
    },
    { type: "media-player-volume-buttons", show_mute_button: true },
    { type: "media-player-source" },
  ],
});

class ComponentAppleTvControllerV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._nativeCard = null;
    this._buildToken = 0;
    this._interactions = [];
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;min-width:0}*{box-sizing:border-box}.stack{display:grid;gap:8px}.remote{padding:12px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,8px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));color:var(--primary-text-color)}.remote[hidden]{display:none}.remote-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.remote-title{font-size:13px;font-weight:600}.power,.utility{display:flex;gap:6px;flex-wrap:wrap}.power button,.utility button,.dpad button,.keyboard button{appearance:none;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit;cursor:pointer}.power button,.utility button{min-height:44px;padding:0 10px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;font-size:12px}.power ha-icon,.utility ha-icon{--mdc-icon-size:17px}.dpad{width:min(230px,72vw);aspect-ratio:1;margin:8px auto 10px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:6px}.dpad button{border-radius:50%;display:grid;place-items:center}.dpad button.select{background:var(--card-background-color);color:var(--primary-color)}.dpad button.blank{visibility:hidden}.dpad ha-icon{--mdc-icon-size:26px}.utility{justify-content:center}.keyboard{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;margin-top:10px}.keyboard[hidden]{display:none}.keyboard input{min-width:0;height:44px;padding:0 10px;border:1px solid var(--divider-color);border-radius:10px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}.keyboard button{width:44px;height:44px;border-radius:10px;display:grid;place-items:center}.keyboard ha-icon{--mdc-icon-size:18px}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      </style>
      <div class="stack">
        <div class="native"></div>
        <section class="remote" hidden>
          <div class="remote-head">
            <span class="remote-title">Remote</span>
            <span class="power"></span>
          </div>
          <div class="dpad" aria-label="Apple TV directional remote"></div>
          <div class="utility"></div>
          <div class="keyboard" hidden>
            <input type="text" aria-label="Apple TV keyboard text" placeholder="Type on Apple TV" />
            <button class="keyboard-set" type="button" aria-label="Set keyboard text"><ha-icon icon="mdi:keyboard"></ha-icon></button>
            <button class="keyboard-clear" type="button" aria-label="Clear keyboard text"><ha-icon icon="mdi:backspace-outline"></ha-icon></button>
          </div>
        </section>
      </div>
    `;
    this.$ = {
      native: this.shadowRoot.querySelector(".native"),
      remote: this.shadowRoot.querySelector(".remote"),
      power: this.shadowRoot.querySelector(".power"),
      dpad: this.shadowRoot.querySelector(".dpad"),
      utility: this.shadowRoot.querySelector(".utility"),
      keyboard: this.shadowRoot.querySelector(".keyboard"),
      keyboardInput: this.shadowRoot.querySelector(".keyboard input"),
      keyboardSet: this.shadowRoot.querySelector(".keyboard-set"),
      keyboardClear: this.shadowRoot.querySelector(".keyboard-clear"),
    };
  }

  setConfig(config) {
    if (!config?.entity && !config?.demo) {
      throw new Error("An Apple TV media_player entity is required");
    }
    this._buildToken += 1;
    this._nativeCard = null;
    this.$.native.replaceChildren();
    this.config = {
      entity: config?.entity || "media_player.demo_apple_tv",
      title: config?.title || null,
      demo: Boolean(config?.demo),
      remote_entity: config?.remote_entity || null,
      keyboard_entity: config?.keyboard_entity || null,
      keyboard_config_entry_id:
        config?.keyboard_config_entry_id || config?.config_entry_id || null,
    };
    this._renderRemote();
    void this._buildNativeCard();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._nativeCard) this._nativeCard.hass = hass;
    this._renderRemoteAvailability();
  }

  connectedCallback() {
    this._renderRemote();
    void this._buildNativeCard();
  }

  disconnectedCallback() {
    this._destroyInteractions();
    this._buildToken += 1;
  }

  getCardSize() {
    return this.config?.remote_entity ? 4 : 2;
  }

  _destroyInteractions() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  async _buildNativeCard() {
    if (!this.config || this._nativeCard || !this.isConnected) return;
    const loadCardHelpers = globalThis.loadCardHelpers;
    if (typeof loadCardHelpers !== "function") return;
    const token = ++this._buildToken;
    try {
      const helpers = await loadCardHelpers();
      if (token !== this._buildToken || !this.isConnected) return;
      const card = helpers.createCardElement(appleTvNativeTileConfig(this.config));
      card.hass = this._hass;
      this._nativeCard = card;
      this.$.native.replaceChildren(card);
    } catch (error) {
      console.error("Could not create native Apple TV media tile", error);
    }
  }

  _button(label, icon, action, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    const glyph = document.createElement("ha-icon");
    glyph.setAttribute("icon", icon);
    const text = document.createElement("span");
    text.textContent = label;
    if (className === "select" || className === "direction") {
      text.hidden = true;
    }
    button.append(glyph, text);
    this._interactions.push(
      interaction(button, { primary: action, feedback: true }),
    );
    return button;
  }

  _renderRemote() {
    if (!this.config) return;
    this._destroyInteractions();
    const remoteEntity = this.config.remote_entity;
    this.$.remote.hidden = !remoteEntity;
    if (!remoteEntity) {
      this.$.power.replaceChildren();
      this.$.dpad.replaceChildren();
      this.$.utility.replaceChildren();
      this.$.keyboard.hidden = true;
      return;
    }

    this.$.power.replaceChildren(
      this._button("Wake", "mdi:power-on", () => this._remoteCommand("wakeup")),
      this._button("Sleep", "mdi:power-sleep", () => this._remoteCommand("suspend")),
    );

    const byCommand = new Map(
      APPLE_TV_REMOTE_COMMANDS.map((item) => [item[0], item]),
    );
    const layout = [null, "up", null, "left", "select", "right", null, "down", null];
    this.$.dpad.replaceChildren(
      ...layout.map((command) => {
        if (!command) {
          const blank = document.createElement("button");
          blank.type = "button";
          blank.className = "blank";
          blank.tabIndex = -1;
          blank.setAttribute("aria-hidden", "true");
          return blank;
        }
        const [, label, icon] = byCommand.get(command);
        return this._button(
          label,
          icon,
          () => this._remoteCommand(command),
          command === "select" ? "select" : "direction",
        );
      }),
    );

    this.$.utility.replaceChildren(
      ...APPLE_TV_UTILITY_COMMANDS.map(([command, label, icon]) =>
        this._button(label, icon, () => this._remoteCommand(command)),
      ),
    );

    const hasKeyboard = Boolean(
      this.config.keyboard_entity && this.config.keyboard_config_entry_id,
    );
    this.$.keyboard.hidden = !hasKeyboard;
    if (hasKeyboard) {
      this._interactions.push(
        interaction(this.$.keyboardSet, {
          primary: () => this._keyboardAction("set_keyboard_text"),
          feedback: true,
        }),
        interaction(this.$.keyboardClear, {
          primary: () => this._keyboardAction("clear_keyboard_text"),
          feedback: true,
        }),
      );
    }
    this._renderRemoteAvailability();
  }

  _renderRemoteAvailability() {
    if (!this.config?.remote_entity) return;
    const remote = this._hass?.states?.[this.config.remote_entity];
    const remoteAvailable =
      this.config.demo || Boolean(remote && remote.state !== "unavailable");
    for (const button of this.$.remote.querySelectorAll("button")) {
      if (!button.classList.contains("blank")) button.disabled = !remoteAvailable;
    }
    const keyboardFocused =
      this.config.demo ||
      this._hass?.states?.[this.config.keyboard_entity]?.state === "on";
    this.$.keyboardInput.disabled = !keyboardFocused;
    this.$.keyboardSet.disabled = !keyboardFocused;
    this.$.keyboardClear.disabled = !keyboardFocused;
  }

  async _remoteCommand(command) {
    if (this.config?.demo || !this._hass || !this.config?.remote_entity) return;
    try {
      await this._hass.callService("remote", "send_command", {
        entity_id: this.config.remote_entity,
        command,
      });
    } catch (error) {
      console.error(`Apple TV remote command failed: ${command}`, error);
    }
  }

  async _keyboardAction(service) {
    if (
      this.config?.demo ||
      !this._hass ||
      !this.config?.keyboard_config_entry_id
    ) {
      return;
    }
    const data = { config_entry_id: this.config.keyboard_config_entry_id };
    if (service === "set_keyboard_text") {
      const text = this.$.keyboardInput.value;
      if (!text) return;
      data.text = text;
    }
    try {
      await this._hass.callService("apple_tv", service, data);
    } catch (error) {
      console.error(`Apple TV keyboard action failed: ${service}`, error);
    }
  }
}

registerCard({
  type: "component-apple-tv-controller-v1",
  element: ComponentAppleTvControllerV1,
  name: "Apple TV Controller",
  description:
    "Native Home Assistant media controls with an optional explicit Apple TV remote.",
});
