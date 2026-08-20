/** ComponentAppleTvControllerV1 - compact Apple TV controller with Split-style advanced controls. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const ATV_INVALID = new Set(["unknown", "unavailable", "none", ""]);
const ATV_MEDIA_VOLUME_MUTE = 8;
const ATV_MEDIA_VOLUME_STEP = 1024;
const ATV_MEDIA_SELECT_SOURCE = 2048;
const ATV_REMOTE_COMMANDS = [
  ["menu", "Menu", "mdi:keyboard-return"],
  ["up", "Up", "mdi:chevron-up"],
  ["top_menu", "Top menu", "mdi:format-list-bulleted"],
  ["left", "Left", "mdi:chevron-left"],
  ["select", "Select", "mdi:circle-outline"],
  ["right", "Right", "mdi:chevron-right"],
  ["home", "Home", "mdi:home-variant-outline"],
  ["down", "Down", "mdi:chevron-down"],
];

class ComponentAppleTvControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.signature = "";
    this.sourceFilter = "";
    this.pending = "";
    this.message = "";
    this.messageType = "info";
    this.panelOpen = false;
    this.panelTrigger = null;
    this.sleepConfirm = false;
    this.messageTimer = null;
    this.pendingTimer = null;
    this.sleepTimer = null;
  }

  setConfig(config) {
    if (!config?.entity && !config?.demo) throw new Error("An Apple TV media-player entity is required");
    const demoDefaults = config?.demo ? {
      entity: "media_player.demo_apple_tv",
      remote_entity: "remote.demo_apple_tv",
      keyboard_entity: "binary_sensor.demo_apple_tv_keyboard_focus",
    } : {};
    this.clearTransientState();
    this.config = {
      icon: "mdi:apple",
      show_app_selector: true,
      show_power_controls: true,
      show_keyboard_status: true,
      ...demoDefaults,
      ...config,
    };
    this.signature = "";
    this.sourceFilter = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    const signature = this.stateSignature();
    if (signature !== this.signature) {
      this.signature = signature;
      this.render();
    } else {
      this.renderMessage();
    }
  }

  connectedCallback() {
    if (this.config && !this.built) this.build();
  }

  disconnectedCallback() {
    this.clearTransientState();
  }

  getCardSize() { return 2; }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button,input{font:inherit;color:inherit}button{appearance:none;border:0;background:transparent;cursor:pointer}ha-card{container-type:inline-size;display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,8px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}ha-icon{--mdc-icon-size:20px}.atv-wrap{padding:12px 14px}.atv-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.atv-identity{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.atv-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);color:var(--secondary-text-color);background:transparent}.atv-icon.active{color:var(--primary-color)}.atv-copy{min-width:0}.atv-name,.atv-status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-name{font-size:13px;line-height:1.25;font-weight:650}.atv-status{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.atv-open{min-height:40px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:flex;align-items:center;gap:6px;color:var(--secondary-text-color);font-size:13px;font-weight:650}.atv-open ha-icon{--mdc-icon-size:18px}.atv-open[aria-expanded=true],.atv-open:hover{color:var(--primary-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.atv-volume{width:min(100%,232px);margin:8px auto 0;display:grid;grid-template-columns:44px minmax(0,126px) 44px;align-items:center;justify-content:center;gap:9px}.atv-volume.unavailable{width:auto;grid-template-columns:1fr;justify-content:stretch}.atv-volume-btn{width:44px;height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center;color:var(--secondary-text-color)}.atv-volume-btn:not(:disabled):hover,.atv-volume-btn:not(:disabled):focus-visible{color:var(--primary-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.atv-volume-btn.pending{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.atv-volume-value{min-width:0;text-align:center;font-size:14px;line-height:1.2;font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-feedback,.atv-panel-feedback{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.atv-feedback:not(:empty){margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color)}.atv-feedback.error,.atv-panel-feedback.error{color:var(--error-color)}.atv-panel{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,rgba(0,0,0,.16)));overscroll-behavior:contain}.atv-panel[hidden]{display:none!important}.atv-sheet{width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}.atv-sheet-head{min-height:54px;padding:7px 8px 7px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) 40px;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.atv-sheet-head .atv-icon{width:34px;height:34px}.atv-sheet-title{min-width:0}.atv-sheet-name,.atv-sheet-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-sheet-name{font-size:14px;line-height:1.25;font-weight:650}.atv-sheet-state{margin-top:2px;font-size:12px;line-height:1.25;color:var(--secondary-text-color)}.atv-close{width:40px;height:40px;border-radius:var(--dashboard-radius-control,8px);display:grid;place-items:center;color:var(--secondary-text-color)}.atv-body{overflow:auto;overscroll-behavior:contain;padding:12px 14px 8px;display:grid;gap:14px}.atv-panel-feedback{padding:0 14px max(14px,env(safe-area-inset-bottom))}.atv-panel-feedback:not(:empty){padding-top:10px;border-top:1px solid var(--divider-color)}.atv-section{display:grid;gap:9px}.atv-section-title{font-size:13px;line-height:1.25;font-weight:650}.atv-note{margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.atv-remote{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:center}.atv-remote-btn{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:flex;align-items:center;justify-content:center;gap:6px;color:var(--secondary-text-color);font-size:13px;font-weight:650}.atv-remote-btn.select{min-height:58px;color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:var(--dashboard-active-surface,var(--card-background-color))}.atv-remote-btn.pending{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.atv-remote-btn.empty{visibility:hidden;pointer-events:none}.atv-source-tools{display:grid;grid-template-columns:1fr;gap:8px}.atv-search{width:100%;height:40px;min-width:0;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);background:var(--card-background-color);color:var(--primary-text-color)}.atv-sources{max-height:220px;overflow:auto;display:grid;gap:6px;padding-right:2px}.atv-source{min-height:42px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:grid;grid-template-columns:minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;color:var(--primary-text-color);font-size:13px;font-weight:600}.atv-source span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-source[aria-selected=true]{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:var(--dashboard-active-surface,var(--card-background-color))}.atv-source ha-icon{--mdc-icon-size:18px}.atv-audio{width:min(100%,232px);margin:0 auto;display:grid;grid-template-columns:44px minmax(0,126px) 44px;align-items:center;justify-content:center;gap:9px}.atv-audio .atv-volume-value{min-height:44px;display:grid;place-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px)}.atv-audio-actions{display:grid;grid-template-columns:1fr;gap:8px}.atv-secondary-btn,.atv-power-btn{min-height:44px;padding:0 11px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:flex;align-items:center;justify-content:center;gap:7px;color:var(--secondary-text-color);font-size:13px;font-weight:650}.atv-secondary-btn.active,.atv-power-btn:not(:disabled):hover{color:var(--primary-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.atv-power{display:grid;grid-template-columns:1fr 1fr;gap:8px}.atv-keyboard{min-height:40px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);font-size:13px;color:var(--secondary-text-color)}button:disabled,button[aria-disabled=true]{opacity:.45;cursor:default}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.atv-open:active,.atv-volume-btn:active,.atv-remote-btn:active,.atv-source:active,.atv-secondary-btn:active,.atv-power-btn:active{background:var(--dashboard-active-surface,var(--card-background-color))}@container (max-width:340px){.atv-wrap{padding:12px}.atv-head{grid-template-columns:1fr}.atv-open{width:100%;justify-content:center}.atv-volume{width:min(100%,216px);gap:8px}.atv-open .atv-open-text{display:inline}}@media(max-width:420px){.atv-panel{padding:8px}.atv-sheet{width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}.atv-body{padding:10px 12px 8px}.atv-panel-feedback{padding:0 12px max(16px,env(safe-area-inset-bottom))}.atv-remote{gap:6px}.atv-remote-btn{font-size:12px}.atv-audio{width:min(100%,216px);gap:8px}.atv-power{grid-template-columns:1fr}}
    </style><ha-card><div class="atv-wrap"><div class="atv-head"><button class="atv-identity" type="button"><span class="atv-icon"><ha-icon></ha-icon></span><span class="atv-copy"><span class="atv-name"></span><span class="atv-status" role="status"></span></span></button><button class="atv-open" type="button" aria-controls="apple-tv-controls-panel" aria-expanded="false"><span class="atv-open-text">Controls</span><ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="atv-volume"><button class="atv-volume-btn atv-volume-down" type="button" aria-label="Volume down"><ha-icon icon="mdi:volume-minus"></ha-icon></button><span class="atv-volume-value"></span><button class="atv-volume-btn atv-volume-up" type="button" aria-label="Volume up"><ha-icon icon="mdi:volume-plus"></ha-icon></button></div><p class="atv-feedback" role="status" aria-live="polite"></p></div></ha-card><section class="atv-panel" id="apple-tv-controls-panel" role="dialog" aria-modal="true" aria-labelledby="apple-tv-controls-title" hidden><div class="atv-sheet"><div class="atv-sheet-head"><span class="atv-icon"><ha-icon></ha-icon></span><span class="atv-sheet-title"><span class="atv-sheet-name" id="apple-tv-controls-title"></span><span class="atv-sheet-state"></span></span><button class="atv-close" type="button" aria-label="Close Apple TV controls"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="atv-body"></div><p class="atv-panel-feedback" role="status" aria-live="polite"></p></div></section>`;
    this.elements = {
      identity: this.shadowRoot.querySelector(".atv-identity"),
      mainIcon: this.shadowRoot.querySelector(".atv-identity ha-icon"),
      mainIconWrap: this.shadowRoot.querySelector(".atv-identity .atv-icon"),
      name: this.shadowRoot.querySelector(".atv-name"),
      status: this.shadowRoot.querySelector(".atv-status"),
      open: this.shadowRoot.querySelector(".atv-open"),
      volumeRow: this.shadowRoot.querySelector(".atv-volume"),
      volumeDown: this.shadowRoot.querySelector(".atv-volume-down"),
      volumeValue: this.shadowRoot.querySelector(".atv-volume-value"),
      volumeUp: this.shadowRoot.querySelector(".atv-volume-up"),
      feedback: this.shadowRoot.querySelector(".atv-feedback"),
      panelFeedback: this.shadowRoot.querySelector(".atv-panel-feedback"),
      panel: this.shadowRoot.querySelector(".atv-panel"),
      sheetIcon: this.shadowRoot.querySelector(".atv-sheet-head ha-icon"),
      sheetIconWrap: this.shadowRoot.querySelector(".atv-sheet-head .atv-icon"),
      sheetName: this.shadowRoot.querySelector(".atv-sheet-name"),
      sheetState: this.shadowRoot.querySelector(".atv-sheet-state"),
      close: this.shadowRoot.querySelector(".atv-close"),
      body: this.shadowRoot.querySelector(".atv-body"),
    };
    this.elements.identity.addEventListener("click", () => this.openPanel(this.elements.identity));
    this.elements.open.addEventListener("click", () => this.openPanel(this.elements.open));
    this.elements.volumeDown.addEventListener("click", () => this.adjustVolume("down"));
    this.elements.volumeUp.addEventListener("click", () => this.adjustVolume("up"));
    this.elements.close.addEventListener("click", () => this.closePanel(true));
    this.elements.panel.addEventListener("click", (event) => { if (event.target === this.elements.panel) this.closePanel(true); });
    this.shadowRoot.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.panelOpen) {
        event.preventDefault();
        this.closePanel(true);
      } else if (event.key === "Tab" && this.panelOpen) {
        this.trapFocus(event);
      }
    });
  }

  clearTransientState() {
    clearTimeout(this.messageTimer);
    clearTimeout(this.pendingTimer);
    clearTimeout(this.sleepTimer);
    this.messageTimer = null;
    this.pendingTimer = null;
    this.sleepTimer = null;
    this.pending = "";
    this.message = "";
    this.sleepConfirm = false;
  }

  demoState(entityId) {
    if (!this.config?.demo) return null;
    if (entityId === this.config?.keyboard_entity) return { state: "on", attributes: { friendly_name: "Apple TV keyboard focus" } };
    if (entityId === this.config?.remote_entity) return { state: "on", attributes: { friendly_name: "Apple TV remote" } };
    return {
      state: "playing",
      attributes: {
        friendly_name: "Apple TV 4K",
        app_name: "Netflix",
        source: "Netflix",
        source_list: ["Netflix", "Disney+", "YouTube", "Spotify", "Prime Video", "ABC iview", "Apple TV"],
        volume_level: 0.42,
        is_volume_muted: false,
        supported_features: ATV_MEDIA_VOLUME_STEP | ATV_MEDIA_VOLUME_MUTE | ATV_MEDIA_SELECT_SOURCE,
      },
    };
  }

  state(entityId) { return entityId ? this._hass?.states?.[entityId] ?? this.demoState(entityId) : null; }
  validState(state) { return Boolean(state && !ATV_INVALID.has(String(state.state).toLowerCase())); }
  supported(state, feature) { return Boolean((Number(state?.attributes?.supported_features) || 0) & feature); }

  mediaState() { return this.state(this.config?.entity); }
  remoteState() { return this.state(this.config?.remote_entity); }
  keyboardState() { return this.state(this.config?.keyboard_entity); }
  remoteAvailable() { return Boolean(this.config?.remote_entity && this.validState(this.remoteState())); }
  mediaAvailable() { return this.validState(this.mediaState()); }

  stateSignature() {
    const ids = [this.config?.entity, this.config?.remote_entity, this.config?.keyboard_entity].filter(Boolean);
    return JSON.stringify([this.panelOpen, this.sourceFilter, this.pending, this.message, this.sleepConfirm, ...ids.map((entityId) => {
      const state = this.state(entityId);
      return [entityId, state?.state, state?.attributes];
    })]);
  }

  title() {
    const state = this.mediaState();
    return this.config?.title || state?.attributes?.friendly_name || "Apple TV";
  }

  appName() {
    const attributes = this.mediaState()?.attributes ?? {};
    return attributes.app_name || attributes.source || null;
  }

  displayStatus() {
    const state = this.mediaState();
    if (!state) return this.config?.demo ? "Playing · Netflix" : "Apple TV unavailable";
    const value = String(state.state || "").toLowerCase();
    const app = this.appName();
    if (value === "unavailable") return "Apple TV unavailable";
    if (value === "unknown") return "Status unknown";
    if (value === "off") return "Sleeping";
    const label = value === "playing" ? "Playing" : value === "paused" ? "Paused" : value === "idle" ? "Idle" : value === "on" ? "Ready" : this.toTitle(value);
    return [label, app].filter(Boolean).join(" · ");
  }

  volumeInfo() {
    const media = this.mediaState();
    const attributes = media?.attributes ?? {};
    const level = Number(attributes.volume_level);
    const hasLevel = Number.isFinite(level) && level >= 0 && level <= 1;
    const percent = hasLevel ? `${Math.round(level * 100)}%` : null;
    const muted = attributes.is_volume_muted === true;
    const mediaStep = this.mediaAvailable() && this.supported(media, ATV_MEDIA_VOLUME_STEP);
    const remoteStep = this.remoteAvailable() && this.commandSupported("volume_up") && this.commandSupported("volume_down");
    return {
      hasLevel,
      muted,
      percent,
      label: muted ? "Muted" : percent ?? (this.mediaAvailable() || remoteStep ? "Volume" : "Volume unavailable"),
      mediaStep,
      remoteStep,
      canStep: mediaStep || remoteStep,
      canMute: this.mediaAvailable() && this.supported(media, ATV_MEDIA_VOLUME_MUTE),
      unavailable: !mediaStep && !remoteStep,
    };
  }

  render() {
    if (!this.built || !this.config) return;
    const available = this.mediaAvailable();
    const title = this.title();
    const status = this.displayStatus();
    const volume = this.volumeInfo();
    const active = available && !["off", "idle"].includes(String(this.mediaState()?.state).toLowerCase());
    this.elements.name.textContent = title;
    this.elements.status.textContent = status;
    this.elements.mainIcon.setAttribute("icon", this.config.icon);
    this.elements.sheetIcon.setAttribute("icon", this.config.icon);
    this.elements.mainIconWrap.classList.toggle("active", active);
    this.elements.sheetIconWrap.classList.toggle("active", active);
    this.elements.identity.setAttribute("aria-label", available ? `Open controls for ${title}` : `${title}. ${status}`);
    this.elements.open.setAttribute("aria-label", `Open controls for ${title}`);
    this.elements.open.setAttribute("aria-expanded", String(this.panelOpen));
    this.elements.open.disabled = !available && !this.remoteAvailable();
    this.elements.sheetName.textContent = title;
    this.elements.sheetState.textContent = status;
    this.renderVolumeRow(this.elements.volumeRow, volume, false);
    this.renderMessage();
    if (this.panelOpen) this.renderPanel();
  }

  renderVolumeRow(container, volume, modal) {
    container.classList.toggle("unavailable", volume.unavailable && !modal);
    const down = container.querySelector(".atv-volume-down");
    const up = container.querySelector(".atv-volume-up");
    const value = container.querySelector(".atv-volume-value");
    if (!modal && volume.unavailable) {
      down.hidden = true;
      up.hidden = true;
      value.textContent = "Volume unavailable";
      value.setAttribute("aria-label", "Volume unavailable");
      return;
    }
    down.hidden = false;
    up.hidden = false;
    down.disabled = !volume.canStep || this.pending === "volume-down";
    up.disabled = !volume.canStep || this.pending === "volume-up";
    down.classList.toggle("pending", this.pending === "volume-down");
    up.classList.toggle("pending", this.pending === "volume-up");
    const label = volume.muted && volume.percent ? `Muted, ${volume.percent}` : volume.label;
    value.textContent = volume.label;
    value.setAttribute("aria-label", label);
  }

  renderPanel() {
    const remoteAvailable = this.remoteAvailable();
    const mediaAvailable = this.mediaAvailable();
    const volume = this.volumeInfo();
    this.elements.body.replaceChildren();
    this.elements.body.append(this.statusSection(mediaAvailable, remoteAvailable));
    this.elements.body.append(this.remoteSection(remoteAvailable));
    const sourceSection = this.sourceSection();
    if (sourceSection) this.elements.body.append(sourceSection);
    this.elements.body.append(this.audioSection(volume));
    if (this.config.show_power_controls !== false) this.elements.body.append(this.powerSection(remoteAvailable));
    const keyboardSection = this.keyboardSection();
    if (keyboardSection) this.elements.body.append(keyboardSection);
    this.renderMessage();
  }

  statusSection(mediaAvailable, remoteAvailable) {
    const section = this.section("Apple TV status");
    const note = document.createElement("p");
    note.className = "atv-note";
    if (!mediaAvailable) note.textContent = "Controls return when the Apple TV reconnects.";
    else if (this.config.remote_entity && !remoteAvailable) note.textContent = "Media state is available. Remote controls are unavailable.";
    else note.textContent = this.displayStatus();
    section.append(note);
    return section;
  }

  remoteSection(remoteAvailable) {
    const section = this.section("Navigation remote");
    if (!this.config.remote_entity || !remoteAvailable) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = this.config.remote_entity ? "Remote controls are unavailable." : "Configure a remote entity to enable navigation controls.";
      section.append(note);
      return section;
    }
    const grid = document.createElement("div");
    grid.className = "atv-remote";
    const order = [
      ["empty"], ["up"], ["empty"],
      ["left"], ["select"], ["right"],
      ["empty"], ["down"], ["empty"],
      ["menu"], ["home"], ["top_menu"],
    ];
    for (const [command] of order) {
      if (command === "empty") {
        const blank = document.createElement("span");
        blank.className = "atv-remote-btn empty";
        grid.append(blank);
        continue;
      }
      if (!this.commandSupported(command)) {
        const blank = document.createElement("span");
        blank.className = "atv-remote-btn empty";
        grid.append(blank);
        continue;
      }
      const [, label, icon] = ATV_REMOTE_COMMANDS.find(([value]) => value === command);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `atv-remote-btn ${command === "select" ? "select" : ""}`;
      button.setAttribute("aria-label", label);
      button.append(this.icon(icon), document.createTextNode(label));
      button.classList.toggle("pending", this.pending === `remote-${command}`);
      button.disabled = this.pending === `remote-${command}`;
      button.addEventListener("click", () => this.sendRemoteCommand(command, label));
      grid.append(button);
    }
    section.append(grid);
    return section;
  }

  sourceSection() {
    if (this.config.show_app_selector === false) return null;
    const media = this.mediaState();
    const sources = Array.isArray(media?.attributes?.source_list) ? media.attributes.source_list.filter(Boolean) : [];
    if (!sources.length) return null;
    const section = this.section("App selector");
    if (sources.length > 8) {
      const tools = document.createElement("div");
      tools.className = "atv-source-tools";
      const input = document.createElement("input");
      input.className = "atv-search";
      input.type = "search";
      input.placeholder = "Search apps";
      input.value = this.sourceFilter;
      input.setAttribute("aria-label", "Search Apple TV apps");
      input.addEventListener("input", () => {
        this.sourceFilter = input.value;
        this.signature = "";
        this.renderPanel();
        queueMicrotask(() => this.elements.body.querySelector(".atv-search")?.focus());
      });
      tools.append(input);
      section.append(tools);
    }
    const list = document.createElement("div");
    list.className = "atv-sources";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Apple TV apps");
    const current = media?.attributes?.source;
    const filter = this.sourceFilter.trim().toLowerCase();
    const filtered = filter ? sources.filter((source) => String(source).toLowerCase().includes(filter)) : sources;
    for (const source of filtered) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atv-source";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(source === current));
      const label = document.createElement("span");
      label.textContent = String(source);
      button.append(label, this.icon(source === current ? "mdi:check" : "mdi:chevron-right"));
      button.disabled = !this.mediaAvailable() || this.pending === `source-${source}`;
      button.addEventListener("click", () => this.selectSource(source));
      list.append(button);
    }
    if (!filtered.length) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = "No matching apps.";
      list.append(note);
    }
    section.append(list);
    return section;
  }

  audioSection(volume) {
    const section = this.section("Volume and audio");
    const row = document.createElement("div");
    row.className = "atv-audio";
    row.innerHTML = '<button class="atv-volume-btn atv-volume-down" type="button" aria-label="Volume down"><ha-icon icon="mdi:volume-minus"></ha-icon></button><span class="atv-volume-value"></span><button class="atv-volume-btn atv-volume-up" type="button" aria-label="Volume up"><ha-icon icon="mdi:volume-plus"></ha-icon></button>';
    row.querySelector(".atv-volume-down").addEventListener("click", () => this.adjustVolume("down"));
    row.querySelector(".atv-volume-up").addEventListener("click", () => this.adjustVolume("up"));
    this.renderVolumeRow(row, volume, true);
    section.append(row);
    if (volume.canMute) {
      const actions = document.createElement("div");
      actions.className = "atv-audio-actions";
      const mute = document.createElement("button");
      mute.type = "button";
      mute.className = `atv-secondary-btn ${volume.muted ? "active" : ""}`;
      mute.setAttribute("aria-label", volume.muted ? "Unmute Apple TV" : "Mute Apple TV");
      mute.append(this.icon(volume.muted ? "mdi:volume-high" : "mdi:volume-mute"), document.createTextNode(volume.muted ? "Unmute" : "Mute"));
      mute.disabled = this.pending === "mute";
      mute.addEventListener("click", () => this.toggleMute());
      actions.append(mute);
      section.append(actions);
    }
    if (!volume.canStep && !volume.canMute) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = "Volume controls are unavailable.";
      section.append(note);
    }
    return section;
  }

  powerSection(remoteAvailable) {
    const section = this.section("Power and sleep");
    if (!this.config.remote_entity || !remoteAvailable) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = this.config.remote_entity ? "Wake and sleep controls are unavailable." : "Configure a remote entity to enable wake and sleep controls.";
      section.append(note);
      return section;
    }
    const grid = document.createElement("div");
    grid.className = "atv-power";
    const wake = document.createElement("button");
    wake.type = "button";
    wake.className = "atv-power-btn";
    wake.setAttribute("aria-label", "Wake Apple TV");
    wake.append(this.icon("mdi:power"), document.createTextNode("Wake Apple TV"));
    wake.disabled = this.pending === "wake";
    wake.addEventListener("click", () => this.callRemotePower("wakeup", "Wake Apple TV", false));
    const sleep = document.createElement("button");
    sleep.type = "button";
    sleep.className = "atv-power-btn";
    sleep.setAttribute("aria-label", this.sleepConfirm ? "Confirm Sleep Apple TV" : "Sleep Apple TV");
    sleep.append(this.icon(this.sleepConfirm ? "mdi:check" : "mdi:power-sleep"), document.createTextNode(this.sleepConfirm ? "Confirm sleep" : "Sleep Apple TV"));
    sleep.disabled = this.pending === "sleep";
    sleep.addEventListener("click", () => this.callRemotePower("suspend", "Sleep Apple TV", true));
    grid.append(wake, sleep);
    section.append(grid);
    return section;
  }

  keyboardSection() {
    if (this.config.show_keyboard_status === false || !this.config.keyboard_entity) return null;
    const keyboard = this.keyboardState();
    if (!this.validState(keyboard) || keyboard.state !== "on") return null;
    const section = this.section("Keyboard status");
    const status = document.createElement("div");
    status.className = "atv-keyboard";
    status.append(this.icon("mdi:keyboard-outline"), document.createTextNode("Keyboard active"));
    section.append(status);
    return section;
  }

  section(title) {
    const section = document.createElement("section");
    section.className = "atv-section";
    const heading = document.createElement("div");
    heading.className = "atv-section-title";
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  icon(name) {
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", name);
    return icon;
  }

  commandSupported(command) {
    const commands = this.remoteState()?.attributes?.supported_commands;
    return !Array.isArray(commands) || !commands.length || commands.includes(command);
  }

  async adjustVolume(direction) {
    const volume = this.volumeInfo();
    if (!volume.canStep) return this.setMessage("Volume controls unavailable", "error");
    const pending = `volume-${direction}`;
    this.startPending(pending);
    try {
      if (volume.mediaStep && !this.config.demo) await this._hass.callService("media_player", direction === "up" ? "volume_up" : "volume_down", { entity_id: this.config.entity });
      else if (volume.remoteStep && !this.config.demo) await this._hass.callService("remote", "send_command", { entity_id: this.config.remote_entity, command: direction === "up" ? "volume_up" : "volume_down" });
      this.finishPending(`${direction === "up" ? "Volume up" : "Volume down"} sent`);
    } catch {
      this.failPending("Apple TV did not respond");
    }
  }

  async sendRemoteCommand(command, label) {
    if (!this.remoteAvailable() || !this.commandSupported(command)) return this.setMessage("Remote controls unavailable", "error");
    this.startPending(`remote-${command}`);
    try {
      if (!this.config.demo) await this._hass.callService("remote", "send_command", { entity_id: this.config.remote_entity, command });
      this.finishPending(`${label} sent`);
    } catch {
      this.failPending("Apple TV did not respond");
    }
  }

  async selectSource(source) {
    if (!this.mediaAvailable() || !this.supported(this.mediaState(), ATV_MEDIA_SELECT_SOURCE)) return this.setMessage("Source selection unavailable", "error");
    this.startPending(`source-${source}`);
    try {
      if (!this.config.demo) await this._hass.callService("media_player", "select_source", { entity_id: this.config.entity, source });
      this.finishPending(`Opening ${source}`);
    } catch {
      this.failPending(`Could not open ${source}`);
    }
  }

  async toggleMute() {
    const volume = this.volumeInfo();
    if (!volume.canMute) return this.setMessage("Mute is unavailable", "error");
    this.startPending("mute");
    try {
      if (!this.config.demo) await this._hass.callService("media_player", "volume_mute", { entity_id: this.config.entity, is_volume_muted: !volume.muted });
      this.finishPending(volume.muted ? "Unmute sent" : "Mute sent");
    } catch {
      this.failPending("Could not change mute");
    }
  }

  async callRemotePower(service, label, needsConfirm) {
    if (!this.remoteAvailable()) return this.setMessage("Remote controls unavailable", "error");
    if (needsConfirm && !this.sleepConfirm) {
      this.sleepConfirm = true;
      this.setMessage("Press again to sleep Apple TV", "info", 5000);
      clearTimeout(this.sleepTimer);
      this.sleepTimer = setTimeout(() => {
        this.sleepConfirm = false;
        this.signature = "";
        this.render();
      }, 5000);
      this.signature = "";
      this.render();
      return;
    }
    clearTimeout(this.sleepTimer);
    this.sleepConfirm = false;
    this.startPending(service === "wakeup" ? "wake" : "sleep");
    try {
      if (!this.config.demo) await this._hass.callService("remote", service, { entity_id: this.config.remote_entity });
      this.finishPending(`${label} sent`);
    } catch {
      this.failPending("Apple TV did not respond");
    }
  }

  startPending(pending) {
    clearTimeout(this.pendingTimer);
    this.pending = pending;
    this.message = "Sending command...";
    this.messageType = "info";
    this.signature = "";
    this.render();
    this.pendingTimer = setTimeout(() => {
      if (this.pending === pending) this.failPending("Apple TV did not respond");
    }, 10000);
  }

  finishPending(message) {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.pending = "";
    this.setMessage(message, "info");
  }

  failPending(message) {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.pending = "";
    this.setMessage(message, "error", 4000);
  }

  setMessage(message, type = "info", timeout = 1800) {
    clearTimeout(this.messageTimer);
    this.message = message;
    this.messageType = type;
    this.signature = "";
    this.render();
    if (timeout) {
      this.messageTimer = setTimeout(() => {
        this.message = "";
        this.messageType = "info";
        this.signature = "";
        this.render();
      }, timeout);
    }
  }

  renderMessage() {
    if (!this.elements) return;
    this.elements.feedback.textContent = this.message;
    this.elements.feedback.classList.toggle("error", this.messageType === "error");
    this.elements.panelFeedback.textContent = this.message;
    this.elements.panelFeedback.classList.toggle("error", this.messageType === "error");
  }

  openPanel(trigger) {
    if (!this.elements || this.elements.open.disabled) return;
    this.panelOpen = true;
    this.panelTrigger = trigger;
    this.elements.panel.hidden = false;
    this.signature = "";
    this.render();
    queueMicrotask(() => this.elements.close.focus());
  }

  closePanel(restoreFocus) {
    if (!this.elements) return;
    this.panelOpen = false;
    this.sleepConfirm = false;
    this.elements.panel.hidden = true;
    this.elements.open.setAttribute("aria-expanded", "false");
    const trigger = this.panelTrigger;
    this.panelTrigger = null;
    this.signature = "";
    this.render();
    if (restoreFocus) queueMicrotask(() => (trigger?.isConnected ? trigger : this.elements.open)?.focus());
  }

  trapFocus(event) {
    const focusable = [...this.elements.panel.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    const current = this.shadowRoot.activeElement;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toTitle(value) {
    return String(value || "").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
  }
}

registerCard({ type: "component-apple-tv-controller-v1", element: ComponentAppleTvControllerV1, name: "Apple TV Controller", description: "Compact Apple TV status and volume control with Split-style advanced navigation, source and power controls." });
