/** Live, registry-aware Apple TV controller. */
const {
  APPLE_TV_NAV: NAV,
  appleTvAppIcon,
  appleTvModel,
  createOverlayController,
  createRequestCoalescer,
  interaction,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentAppleTvControllerV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.pending = new Set();
    this.panelMode = null;
    this.panelController = null;
    this.registry = null;
    this.unsubscribe = null;
    this.message = "";
    this.messageType = "info";
    this.messageTimer = null;
    this.interactionHandles = [];
    this.dynamicInteractions = [];
    this.volumeCoalescer = null;
    this.volumeGestureActive = false;
    this.optimisticVolume = null;
  }

  setConfig(config) {
    if (!config?.entity && !config?.demo) {
      throw new Error("An Apple TV media-player entity is required");
    }
    this.config = {
      icon: "mdi:apple",
      ...config,
      entity: config?.entity || "media_player.demo_apple_tv",
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.subscribe();
    this.render();
  }

  connectedCallback() {
    this.subscribe();
    this.render();
  }

  disconnectedCallback() {
    for (const handle of this.interactionHandles) handle.destroy();
    this.interactionHandles = [];
    for (const handle of this.dynamicInteractions) handle.destroy();
    this.dynamicInteractions = [];
    this.volumeCoalescer?.destroy();
    this.volumeCoalescer = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    clearTimeout(this.messageTimer);
    this.panelMode = null;
    this.volumeGestureActive = false;
    this.optimisticVolume = null;
    this.panelController?.close(false);
  }

  getCardSize() {
    return 2;
  }

  subscribe() {
    const registry = globalThis.__homeDashboardV2?.REG;
    if (
      !registry ||
      !this._hass ||
      this.config?.demo ||
      this.unsubscribe
    ) {
      return;
    }
    this.unsubscribe = registry.subscribe(this._hass, (data) => {
      this.registry = data;
      this.render();
    });
  }

  model() {
    return appleTvModel(this._hass, this.config, this.registry);
  }

  name(model) {
    return (
      this.config?.title ||
      model.media?.attributes?.friendly_name ||
      "Apple TV"
    );
  }

  canRemote(model) {
    return Boolean(
      model.canWake ||
        model.canSleep ||
        model.canNavigate ||
        model.canPlay ||
        model.canPause ||
        model.canStop ||
        model.canPrevious ||
        model.canNext ||
        model.canVolumeDown ||
        model.canVolumeUp ||
        model.canMute ||
        model.canSetKeyboardText,
    );
  }

  busy(action) {
    return this.pending.has(action);
  }

  build() {
    if (this.el) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;min-width:0}
        *{box-sizing:border-box}
        button,input{font:inherit;color:inherit}
        button{appearance:none;border:0;background:transparent;cursor:pointer}
        button:disabled{opacity:.42;cursor:default}
        ha-card{display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,8px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}
        .wrap{padding:14px}
        .identity{min-height:44px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:center}
        .ico{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--secondary-text-color)}
        .ico.on{color:var(--primary-color)}
        .name,.status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .name{font-size:14px;font-weight:650}
        .status{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}
        .launchers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
        .launcher{min-height:66px;padding:10px 12px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:14px;display:grid;grid-template-columns:38px minmax(0,1fr) 20px;gap:10px;align-items:center;text-align:left;background:color-mix(in srgb,var(--secondary-background-color) 45%,transparent)}
        .launcher .launch-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:var(--card-background-color);color:var(--primary-color)}
        .launch-copy{min-width:0}
        .launch-title,.launch-meta{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .launch-title{font-size:13px;font-weight:700}
        .launch-meta{margin-top:2px;font-size:11px;color:var(--secondary-text-color)}
        .launcher>ha-icon:last-child{color:var(--secondary-text-color);--mdc-icon-size:18px}
        .notice{margin:0;font-size:12px;color:var(--secondary-text-color)}
        .notice:not(:empty){margin-top:12px;padding-top:10px;border-top:1px solid var(--divider-color)}
        .error{color:var(--error-color)}
        .panel{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,rgba(0,0,0,.28)));overscroll-behavior:contain;touch-action:pan-y}
        .panel[hidden]{display:none!important}
        .sheet{width:min(430px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--divider-color);border-radius:24px;background:var(--card-background-color);box-shadow:0 18px 54px rgba(0,0,0,.24)}
        .head{min-height:62px;padding:9px 10px 9px 18px;display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;border-bottom:1px solid var(--divider-color)}
        .sheet-name{display:block;font-size:15px;font-weight:700}
        .sheet-state{display:block;margin-top:2px;font-size:12px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .close{width:44px;height:44px;border-radius:50%;display:grid;place-items:center}
        .body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:16px 18px max(18px,env(safe-area-inset-bottom));display:grid;gap:16px;scrollbar-gutter:stable}
        .section{display:grid;gap:10px}
        .section-title{font-size:12px;font-weight:700;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.04em}
        .remote-shell{display:grid;gap:16px}
        .remote-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .remote-pill,.transport,.utility,.volume-button{min-height:44px;border:1px solid var(--divider-color);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;gap:7px;color:var(--primary-text-color);background:var(--secondary-background-color)}
        .remote-pill{padding:0 14px;font-size:12px;font-weight:650}
        .remote-pill.power{margin-left:auto}
        .dpad{width:min(286px,78vw);aspect-ratio:1;margin:0 auto;padding:14px;border:1px solid var(--divider-color);border-radius:50%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:5px;background:color-mix(in srgb,var(--secondary-background-color) 72%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
        .remote{min-width:0;min-height:0;border-radius:50%;display:grid;place-items:center;color:var(--secondary-text-color)}
        .remote ha-icon{--mdc-icon-size:30px}
        .remote.select{border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-color);box-shadow:0 3px 14px rgba(0,0,0,.12)}
        .blank{visibility:hidden}
        .utility-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .utility{width:100%;padding:0 12px;font-size:12px;font-weight:650}
        .transport-row{display:flex;justify-content:center;gap:12px}
        .transport{width:52px;height:52px;padding:0;border-radius:50%}
        .transport span{display:none}
        .volume-control{min-height:54px;display:grid;grid-template-columns:52px minmax(92px,1fr) 52px;align-items:center;border:1px solid var(--divider-color);border-radius:18px;background:var(--secondary-background-color);overflow:hidden}
        .volume-button{width:52px;height:54px;min-height:54px;border:0;border-radius:0;background:transparent}
        .volume-button span{display:none}
        .volume-readout{min-width:0;padding:0 10px;text-align:center}
        .volume-value{display:block;font-size:18px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
        .volume-status{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:11px;line-height:1.1;white-space:nowrap}
        .keyboard{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px}
        .keyboard-input{width:100%;min-height:44px;padding:0 11px;border:1px solid var(--divider-color);border-radius:12px;background:transparent}
        .keyboard .utility{width:44px;padding:0}
        .keyboard .utility span{display:none}
        .apps-summary{font-size:12px;color:var(--secondary-text-color)}
        .apps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:12px}
        .app{min-width:0;aspect-ratio:1;padding:10px;border:1px solid var(--divider-color);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;background:color-mix(in srgb,var(--secondary-background-color) 58%,transparent);text-align:center}
        .app[aria-selected=true]{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}
        .app-logo{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 2px 9px rgba(0,0,0,.1)}
        .app-logo ha-icon{--mdc-icon-size:29px}
        .app-name{width:100%;font-size:11px;font-weight:650;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .panel-notice{padding:0 18px max(16px,env(safe-area-inset-bottom));margin:0;font-size:12px;color:var(--secondary-text-color)}
        .panel-notice:not(:empty){padding-top:10px;border-top:1px solid var(--divider-color)}
        :is(button,input,.identity):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
        @media(max-width:420px){.panel{padding:8px}.sheet{width:calc(100vw - 16px);max-height:calc(100dvh - 16px);border-radius:20px}.wrap{padding:12px}.body{padding:14px}.dpad{width:min(270px,78vw)}.apps-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.app{border-radius:16px}.app-logo{width:44px;height:44px}}
      </style>
      <ha-card>
        <div class="wrap">
          <div class="identity" role="button" tabindex="0">
            <span class="ico"><ha-icon></ha-icon></span>
            <span>
              <span class="name"></span>
              <span class="status" role="status"></span>
            </span>
          </div>
          <div class="launchers">
            <button class="launcher remote-launch" type="button" aria-controls="apple-tv-panel">
              <span class="launch-icon"><ha-icon icon="mdi:remote"></ha-icon></span>
              <span class="launch-copy"><span class="launch-title">Remote</span><span class="launch-meta">Navigation & controls</span></span>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
            <button class="launcher apps-launch" type="button" aria-controls="apple-tv-panel">
              <span class="launch-icon"><ha-icon icon="mdi:apps"></ha-icon></span>
              <span class="launch-copy"><span class="launch-title">Apps</span><span class="launch-meta"></span></span>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
          </div>
          <p class="notice" role="status" aria-live="polite"></p>
        </div>
      </ha-card>
      <section class="panel" id="apple-tv-panel" role="dialog" aria-modal="true" aria-labelledby="apple-tv-panel-title" hidden>
        <div class="sheet">
          <header class="head">
            <span>
              <span class="sheet-name" id="apple-tv-panel-title"></span>
              <span class="sheet-state"></span>
            </span>
            <button class="close" type="button" aria-label="Close Apple TV panel"><ha-icon icon="mdi:close"></ha-icon></button>
          </header>
          <div class="body"></div>
          <p class="panel-notice" role="status" aria-live="polite"></p>
        </div>
      </section>
    `;

    const q = (selector) => this.shadowRoot.querySelector(selector);
    this.el = {
      identity: q(".identity"),
      icon: q(".identity ha-icon"),
      iconWrap: q(".ico"),
      name: q(".name"),
      status: q(".status"),
      remoteLaunch: q(".remote-launch"),
      appsLaunch: q(".apps-launch"),
      appsMeta: q(".apps-launch .launch-meta"),
      notice: q(".notice"),
      panel: q(".panel"),
      close: q(".close"),
      body: q(".body"),
      sheetName: q(".sheet-name"),
      sheetState: q(".sheet-state"),
      panelNotice: q(".panel-notice"),
    };

    this.interactionHandles.push(
      interaction(this.el.identity, { primary: () => openMoreInfo(this, this.config.entity), feedback: true }),
      interaction(this.el.remoteLaunch, { primary: () => this.openPanel("remote", this.el.remoteLaunch), feedback: true }),
      interaction(this.el.appsLaunch, { primary: () => this.openPanel("apps", this.el.appsLaunch), feedback: true }),
      interaction(this.el.close, { primary: () => this.closePanel(true), feedback: true }),
    );
    this.panelController = createOverlayController(this, this.el.panel, {
      initialFocus: () => this.el.close,
      onDismiss: () => this.closePanel(true),
    });
    this.el.panel.addEventListener("wheel", (event) => event.stopPropagation(), {
      passive: true,
    });
    this.el.panel.addEventListener(
      "touchmove",
      (event) => event.stopPropagation(),
      { passive: true },
    );
  }

  icon(name) {
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", name);
    return icon;
  }

  button(
    className,
    label,
    icon,
    click,
    disabled = false,
    pending = false,
    interactionOptions = {},
  ) {
    const button = document.createElement("button");
    const text = document.createElement("span");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-busy", String(pending));
    button.disabled = disabled;
    text.textContent = label;
    button.append(this.icon(icon), text);
    this.dynamicInteractions.push(interaction(button, { primary: click, feedback: true, ...interactionOptions }));
    return button;
  }

  section(title) {
    const section = document.createElement("section");
    const heading = document.createElement("div");
    section.className = "section";
    heading.className = "section-title";
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  render() {
    if (!this.config) return;
    this.build();
    const model = this.model();
    this.el.name.textContent = this.name(model);
    this.el.status.textContent = model.status;
    this.el.identity.setAttribute("aria-label", `Open details for ${this.name(model)}`);
    this.el.icon.setAttribute("icon", this.config.icon);
    this.el.iconWrap.classList.toggle("on", model.awake);
    this.el.remoteLaunch.disabled = !this.canRemote(model);
    this.el.remoteLaunch.setAttribute(
      "aria-expanded",
      String(this.panelMode === "remote"),
    );
    this.el.appsLaunch.disabled = !model.canSelectSource;
    this.el.appsLaunch.setAttribute(
      "aria-expanded",
      String(this.panelMode === "apps"),
    );
    this.el.appsMeta.textContent = model.sources.length
      ? `${model.sources.length} installed`
      : "No installed apps";
    this.el.notice.textContent = this.message;
    this.el.notice.classList.toggle("error", this.messageType === "error");
    if (this.panelMode) {
      if (this.volumeGestureActive) this.updateVolumeReadout(model);
      else this.renderPanel(model);
    }
  }

  renderPanel(model) {
    const active = this.shadowRoot.activeElement;
    const keyboardState = active?.classList?.contains("keyboard-input")
      ? {
          value: active.value,
          start: active.selectionStart,
          end: active.selectionEnd,
          direction: active.selectionDirection,
        }
      : null;
    for (const handle of this.dynamicInteractions) handle.destroy();
    this.dynamicInteractions = [];
    const scrollTop = this.el.body.scrollTop;
    this.el.body.replaceChildren();
    this.el.sheetName.textContent =
      this.panelMode === "apps" ? "Installed Apps" : "Apple TV Remote";
    this.el.sheetState.textContent =
      this.panelMode === "apps"
        ? `${this.name(model)} · ${model.sources.length} apps`
        : `${this.name(model)} · ${model.status}`;

    if (this.panelMode === "apps") this.renderApps(model);
    else this.renderRemote(model);

    this.el.panelNotice.textContent = this.message;
    this.el.panelNotice.classList.toggle(
      "error",
      this.messageType === "error",
    );
    this.el.body.scrollTop = scrollTop;
    if (keyboardState) {
      const input = this.el.body.querySelector(".keyboard-input");
      if (input) {
        input.value = keyboardState.value;
        const setButton = input.parentElement?.querySelector(".utility");
        if (setButton) setButton.disabled = !input.value;
        input.focus({ preventScroll: true });
        input.setSelectionRange?.(
          keyboardState.start,
          keyboardState.end,
          keyboardState.direction,
        );
      }
    }
  }

  renderRemote(model) {
    const shell = document.createElement("div");
    shell.className = "remote-shell";

    const toolbar = document.createElement("div");
    toolbar.className = "remote-toolbar";
    if (model.canMute) {
      toolbar.append(
        this.button(
          "remote-pill",
          model.muted ? "Unmute" : "Mute",
          model.muted ? "mdi:volume-high" : "mdi:volume-mute",
          () => this.mute(model),
          this.busy("mute"),
          this.busy("mute"),
        ),
      );
    }
    if (model.canWake || model.canSleep) {
      const wake = model.canWake;
      const action = wake ? "wake" : "sleep";
      toolbar.append(
        this.button(
          "remote-pill power",
          wake ? "Wake" : "Sleep",
          wake ? "mdi:power" : "mdi:power-sleep",
          () => this.remoteCommand(wake ? "wakeup" : "suspend", action),
          this.busy(action),
          this.busy(action),
        ),
      );
    }
    if (toolbar.childElementCount) shell.append(toolbar);

    const navigation = this.navigation(model);
    if (navigation) shell.append(navigation);

    const utility = this.remoteUtility(model);
    if (utility) shell.append(utility);

    const playback = this.playback(model);
    if (playback) shell.append(playback);

    if (model.canVolumeDown || model.canVolumeUp) {
      const volume = this.section("Volume");
      volume.append(this.volumeControl(model));
      shell.append(volume);
    }

    const keyboard = this.keyboard(model);
    if (keyboard) shell.append(keyboard);

    if (!shell.childElementCount) {
      const empty = document.createElement("div");
      empty.className = "apps-summary";
      empty.textContent = "No remote controls are currently available.";
      shell.append(empty);
    }

    this.el.body.append(shell);
  }

  navigation(model) {
    if (!model.canNavigate) return null;
    const commands = new Set(
      Array.isArray(model.remote?.attributes?.supported_commands)
        ? model.remote.attributes.supported_commands
        : NAV.map(([command]) => command),
    );
    const grid = document.createElement("div");
    grid.className = "dpad";

    for (const command of [
      null,
      "up",
      null,
      "left",
      "select",
      "right",
      null,
      "down",
      null,
    ]) {
      if (!command || !commands.has(command)) {
        const blank = document.createElement("span");
        blank.className = "blank";
        grid.append(blank);
        continue;
      }
      const [, label, icon] = NAV.find(([name]) => name === command);
      const action = `remote-${command}`;
      grid.append(
        this.button(
          `remote ${command === "select" ? "select" : ""}`,
          label,
          icon,
          () => this.remoteCommand(command, action),
          this.busy(action),
          this.busy(action),
        ),
      );
    }
    return grid;
  }

  remoteUtility(model) {
    if (!model.canNavigate) return null;
    const commands = new Set(
      Array.isArray(model.remote?.attributes?.supported_commands)
        ? model.remote.attributes.supported_commands
        : NAV.map(([command]) => command),
    );
    const items = NAV.filter(
      ([command]) =>
        !["up", "down", "left", "right", "select"].includes(command) &&
        commands.has(command),
    );
    if (!items.length) return null;

    const grid = document.createElement("div");
    grid.className = "utility-grid";
    for (const [command, label, icon] of items) {
      const action = `remote-${command}`;
      grid.append(
        this.button(
          "utility",
          label,
          icon,
          () => this.remoteCommand(command, action),
          this.busy(action),
          this.busy(action),
        ),
      );
    }
    return grid;
  }

  playback(model) {
    const actions = [
      [model.canPrevious, "media_previous_track", "Previous", "mdi:skip-previous"],
      [model.canPlay, "media_play", "Play", "mdi:play"],
      [model.canPause, "media_pause", "Pause", "mdi:pause"],
      [model.canNext, "media_next_track", "Next", "mdi:skip-next"],
      [model.canStop, "media_stop", "Stop", "mdi:stop"],
    ].filter(([available]) => available);
    if (!actions.length) return null;

    const section = this.section("Playback");
    const row = document.createElement("div");
    row.className = "transport-row";
    for (const [, service, label, icon] of actions) {
      row.append(
        this.button(
          "transport",
          label,
          icon,
          () => this.mediaAction(service),
          this.busy(service),
          this.busy(service),
        ),
      );
    }
    section.append(row);
    return section;
  }

  volumeControl(model) {
    const control = document.createElement("div");
    const readout = document.createElement("span");
    const value = document.createElement("span");
    const status = document.createElement("span");
    control.className = "volume-control";
    readout.className = "volume-readout";
    value.className = "volume-value";
    status.className = "volume-status";
    value.textContent =
      (this.optimisticVolume ?? model.level) === null ? "—" : `${Math.round((this.optimisticVolume ?? model.level) * 100)}%`;
    status.textContent = model.muted
      ? "Muted"
      : this.busy("volume-down") || this.busy("volume-up")
        ? "Adjusting"
        : "Volume";
    readout.append(value, status);
    control.append(
      this.button(
        "volume-button",
        "Volume down",
        "mdi:volume-minus",
        () => this.queueVolume("down"),
        !model.canVolumeDown,
        false,
        { repeat: { delay: 350, interval: 120, coalesce: true }, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) },
      ),
      readout,
      this.button(
        "volume-button",
        "Volume up",
        "mdi:volume-plus",
        () => this.queueVolume("up"),
        !model.canVolumeUp,
        false,
        { repeat: { delay: 350, interval: 120, coalesce: true }, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) },
      ),
    );
    return control;
  }

  keyboard(model) {
    if (!model.canSetKeyboardText) return null;
    const section = this.section("Keyboard");
    const row = document.createElement("div");
    const input = document.createElement("input");
    input.className = "keyboard-input";
    input.type = "text";
    input.placeholder = "Type on Apple TV";
    input.setAttribute("aria-label", "Apple TV keyboard text");
    const set = this.button(
      "utility",
      "Set text",
      "mdi:keyboard",
      () => this.keyboardAction("set_keyboard_text", input.value, "keyboard-set"),
      true,
    );
    const clear = this.button(
      "utility",
      "Clear text",
      "mdi:backspace-outline",
      () => this.keyboardAction("clear_keyboard_text", null, "keyboard-clear"),
      this.busy("keyboard-clear"),
      this.busy("keyboard-clear"),
    );
    input.oninput = () => {
      set.disabled = !input.value;
    };
    row.className = "keyboard";
    row.append(input, set, clear);
    section.append(row);
    return section;
  }

  renderApps(model) {
    const summary = document.createElement("div");
    summary.className = "apps-summary";
    summary.textContent = model.sources.length
      ? "Apps reported as installed by this Apple TV."
      : "No installed apps are currently reported.";
    this.el.body.append(summary);

    if (!model.sources.length) return;
    const grid = document.createElement("div");
    grid.className = "apps-grid";
    grid.setAttribute("role", "listbox");
    grid.setAttribute("aria-label", "Installed Apple TV apps");

    for (const source of model.sources) {
      const action = `source-${source}`;
      const button = document.createElement("button");
      const logo = document.createElement("span");
      const name = document.createElement("span");
      button.type = "button";
      button.className = "app";
      button.setAttribute("role", "option");
      button.setAttribute("aria-label", `Open ${source}`);
      button.setAttribute(
        "aria-selected",
        String(source === model.currentSource),
      );
      button.disabled = !model.canSelectSource || this.busy(action);
      logo.className = "app-logo";
      logo.append(this.icon(this.appIcon(source)));
      name.className = "app-name";
      name.textContent = source;
      button.append(logo, name);
      this.dynamicInteractions.push(interaction(button, { primary: () => this.selectSource(source), optimistic: "selection", feedback: true }));
      grid.append(button);
    }
    this.el.body.append(grid);
  }

  appIcon(source) {
    return appleTvAppIcon(source, this.config?.app_icons);
  }

  async invoke(action, request, success) {
    if (this.busy(action)) return;
    this.pending.add(action);
    this.setMessage("Sending command…");
    try {
      if (!this.config.demo) await request();
      this.setMessage(success);
    } catch {
      this.setMessage("Apple TV did not respond", "error", 4000);
    } finally {
      this.pending.delete(action);
      this.render();
    }
  }

  remoteCommand(command, action) {
    const model = this.model();
    if (
      command === "wakeup"
        ? !model.canWake
        : command === "suspend"
          ? !model.canSleep
          : !model.canNavigate
    ) {
      return;
    }
    return this.invoke(
      action,
      () =>
        this._hass.callService("remote", "send_command", {
          entity_id: model.entities.remote,
          command,
        }),
      "Command sent",
    );
  }

  mediaAction(service) {
    const model = this.model();
    return this.invoke(
      service,
      () =>
        this._hass.callService("media_player", service, {
          entity_id: model.entities.media,
        }),
      "Command sent",
    );
  }

  ensureVolumeCoalescer() {
    if (this.volumeCoalescer) return this.volumeCoalescer;
    this.volumeCoalescer = createRequestCoalescer(async (direction) => {
      const model = this.model();
      if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;
      if (!this.config.demo) await this._hass.callService("media_player", `volume_${direction}`, { entity_id: model.entities.media });
    }, { onError: () => this.setMessage("Apple TV did not respond", "error", 4000) });
    return this.volumeCoalescer;
  }

  updateVolumeReadout(model = this.model()) {
    const value = this.shadowRoot.querySelector(".volume-value");
    const status = this.shadowRoot.querySelector(".volume-status");
    const level = this.optimisticVolume ?? model.level;
    if (value) value.textContent = level === null ? "—" : `${Math.round(level * 100)}%`;
    if (status) status.textContent = model.muted ? "Muted" : this.volumeGestureActive ? "Adjusting" : "Volume";
  }

  setVolumeGesture(pressed, model) {
    this.volumeGestureActive = pressed;
    if (pressed && this.optimisticVolume === null) this.optimisticVolume = model.level;
    if (!pressed) { this.optimisticVolume = null; this.render(); }
  }

  queueVolume(direction) {
    const model = this.model();
    if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;
    const base = this.optimisticVolume ?? model.level;
    if (base !== null) {
      const step = Math.max(0.01, Math.min(0.25, Number(this.config?.volume_step) || 0.05));
      this.optimisticVolume = Math.max(0, Math.min(1, base + (direction === "up" ? step : -step)));
      this.updateVolumeReadout(model);
    }
    this.ensureVolumeCoalescer().request(direction);
  }

  adjustVolume(direction) {
    const model = this.model();
    if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) {
      return;
    }
    const action = `volume-${direction}`;
    return this.invoke(
      action,
      () =>
        this._hass.callService("media_player", `volume_${direction}`, {
          entity_id: model.entities.media,
        }),
      "Volume changed",
    );
  }

  mute(model) {
    return this.invoke(
      "mute",
      () =>
        this._hass.callService("media_player", "volume_mute", {
          entity_id: model.entities.media,
          is_volume_muted: !model.muted,
        }),
      "Audio changed",
    );
  }

  selectSource(source) {
    const model = this.model();
    if (!model.canSelectSource || !model.sources.includes(source)) return;
    const action = `source-${source}`;
    return this.invoke(
      action,
      () =>
        this._hass.callService("media_player", "select_source", {
          entity_id: model.entities.media,
          source,
        }),
      `Opening ${source}`,
    );
  }

  keyboardAction(service, text, action) {
    const model = this.model();
    if (!model.keyboardFocused || !model.entities.configEntryId) return;
    const data = { config_entry_id: model.entities.configEntryId };
    if (text !== null) data.text = text;
    return this.invoke(
      action,
      () => this._hass.callService("apple_tv", service, data),
      "Keyboard updated",
    );
  }

  setMessage(message, type = "info", timeout = 1800) {
    clearTimeout(this.messageTimer);
    this.message = message;
    this.messageType = type;
    this.render();
    if (timeout) {
      this.messageTimer = setTimeout(() => {
        this.message = "";
        this.messageType = "info";
        this.render();
      }, timeout);
    }
  }

  openPanel(mode, trigger) {
    const model = this.model();
    if (mode === "remote" ? !this.canRemote(model) : !model.canSelectSource) {
      return;
    }
    this.panelMode = mode;
    this.panelController.open(trigger);
    this.render();
  }

  closePanel(restore) {
    this.volumeGestureActive = false;
    this.optimisticVolume = null;
    this.panelMode = null;
    this.panelController.close(restore);
    this.render();
  }
}

registerCard({
  type: "component-apple-tv-controller-v1",
  element: ComponentAppleTvControllerV1,
  name: "Apple TV Controller",
  description:
    "Apple TV remote and installed-app launcher generated from live Home Assistant capabilities.",
});
