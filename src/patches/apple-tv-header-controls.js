/** Aligns Apple TV controls with the dashboard design system. */
customElements.whenDefined("component-apple-tv-controller-v1").then(() => {
  const Card = customElements.get("component-apple-tv-controller-v1");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__headerControlsV3) return;
  prototype.__headerControlsV3 = true;

  const oldRender = prototype.render;
  const oldRenderRemote = prototype.renderRemote;
  const oldRenderApps = prototype.renderApps;
  const oldOpenPanel = prototype.openPanel;

  const APP_BRAND_COLOURS = [
    [/netflix/i, "#e50914"], [/youtube/i, "#ff0000"], [/spotify/i, "#1ed760"], [/prime video|amazon/i, "#00a8e1"], [/plex/i, "#e5a00d"], [/twitch/i, "#9146ff"], [/vlc/i, "#ff8800"], [/apple tv|apple music|music/i, "var(--primary-text-color)"], [/disney/i, "#0b5bd3"], [/kayo|sport/i, "#00a651"], [/binge/i, "#8a2be2"], [/stan/i, "#00a5ff"], [/paramount/i, "#0064ff"],
  ];

  prototype.appleTvAppColour = function appleTvAppColour(source) {
    return APP_BRAND_COLOURS.find(([pattern]) => pattern.test(source))?.[1] || "var(--primary-color)";
  };

  prototype.ensureHeaderControls = function ensureHeaderControls(model) {
    if (!this.shadowRoot || !this.el) return;
    if (!this.shadowRoot.querySelector("style[data-apple-tv-header-controls]")) {
      const style = document.createElement("style");
      style.setAttribute("data-apple-tv-header-controls", "");
      style.textContent = `.identity{grid-template-columns:44px minmax(0,1fr) auto!important;gap:12px!important}.card-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-left:0}.header-action{width:44px;height:44px;min-width:44px;padding:0;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.header-action.power.on{color:var(--primary-color)}.header-action ha-icon{--mdc-icon-size:20px}.header-action span{display:none}.panel{padding:16px!important;overscroll-behavior:contain}.sheet{width:min(430px,calc(100vw - 32px))!important;max-height:calc(100dvh - 32px)!important;min-height:0;overflow:hidden!important;display:flex!important;flex-direction:column;border-radius:var(--dashboard-radius-dialog,8px)!important;box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))!important}.head{flex:0 0 auto}.body{flex:1 1 auto;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable}.panel-notice{flex:0 0 auto}.panel[data-mode="apps"] .body{max-height:calc(100dvh - 112px)}.apps-grid{align-content:start}.app-logo ha-icon{color:var(--apple-tv-app-colour,var(--primary-color))}@media(max-width:420px){.panel{padding:16px!important}.sheet{width:calc(100vw - 32px)!important;max-height:calc(100dvh - 32px)!important}.card-actions{gap:8px}.header-action{width:44px;height:44px;min-width:44px}.header-action ha-icon{--mdc-icon-size:20px}}`;
      this.shadowRoot.append(style);
    }

    let actions = this.shadowRoot.querySelector(".card-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "card-actions";
      actions.setAttribute("aria-label", "Apple TV quick controls");
      this.shadowRoot.querySelector(".identity")?.append(actions);
    }
    for (const handle of this._headerInteractions || []) handle.destroy();
    this._headerInteractions = [];

    const wake = !model.awake;
    const powerAction = wake ? "wake" : "sleep";
    const canPower = wake ? model.canWake : model.canSleep;
    const repeatVolume = { delay: 350, interval: 110, accelerate: true };
    const start = this.dynamicInteractions.length;
    const volumeDown = this.button("header-action", "Volume down", "mdi:volume-minus", () => this.queueVolume("down"), !model.canVolumeDown, false, { repeat: repeatVolume, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) });
    const volumeUp = this.button("header-action", "Volume up", "mdi:volume-plus", () => this.queueVolume("up"), !model.canVolumeUp, false, { repeat: repeatVolume, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) });
    const power = this.button(`header-action power ${model.awake ? "on" : ""}`, wake ? "Turn Apple TV on" : "Turn Apple TV off", "mdi:power", () => this.remoteCommand(wake ? "wakeup" : "suspend", powerAction), !canPower || this.busy(powerAction), this.busy(powerAction));
    this._headerInteractions.push(...this.dynamicInteractions.splice(start));
    actions.replaceChildren(volumeDown, volumeUp, power);
  };

  prototype.render = function render() {
    oldRender.call(this);
    if (!this.config || !this.el) return;
    const model = this.model();
    this.el.remoteLaunch.disabled = !model.awake || !this.canRemote(model);
    this.el.appsLaunch.disabled = !model.awake || !model.canSelectSource;
    this.el.panel.dataset.mode = this.panelMode || "";
    this.ensureHeaderControls(model);
    if (this.panelMode && !model.awake) this.closePanel(false);
  };

  prototype.renderRemote = function renderRemote(model) {
    oldRenderRemote.call(this, model);
    const power = this.el?.body?.querySelector(".remote-toolbar .power");
    power?.remove();
    const toolbar = this.el?.body?.querySelector(".remote-toolbar");
    if (toolbar && !toolbar.childElementCount) toolbar.remove();
    const volume = this.el?.body?.querySelector(".volume-control");
    volume?.closest(".section")?.remove();
  };

  prototype.renderApps = function renderApps(model) {
    oldRenderApps.call(this, model);
    for (const app of this.el?.body?.querySelectorAll(".app") || []) {
      const source = app.querySelector(".app-name")?.textContent?.trim() || "";
      const logo = app.querySelector(".app-logo");
      if (logo) logo.style.setProperty("--apple-tv-app-colour", this.appleTvAppColour(source));
    }
  };

  prototype.openPanel = function openPanel(mode, trigger) {
    if (!this.model().awake) return;
    return oldOpenPanel.call(this, mode, trigger);
  };
});
