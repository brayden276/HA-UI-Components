/** Moves Apple TV power and volume controls into the card header. */
customElements.whenDefined("component-apple-tv-controller-v1").then(() => {
  const Card = customElements.get("component-apple-tv-controller-v1");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__headerControlsV2) return;
  prototype.__headerControlsV2 = true;

  const oldRender = prototype.render;
  const oldRenderRemote = prototype.renderRemote;
  const oldOpenPanel = prototype.openPanel;

  prototype.ensureHeaderControls = function ensureHeaderControls(model) {
    if (!this.shadowRoot || !this.el) return;

    if (!this.shadowRoot.querySelector("style[data-apple-tv-header-controls]")) {
      const style = document.createElement("style");
      style.setAttribute("data-apple-tv-header-controls", "");
      style.textContent = `
        .identity{grid-template-columns:44px minmax(0,1fr) auto!important}
        .card-actions{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-left:4px}
        .header-action{width:34px;height:34px;min-width:34px;padding:0;border-radius:50%;display:grid;place-items:center;color:var(--secondary-text-color);background:transparent}
        .header-action:not(:disabled):hover{background:var(--secondary-background-color);color:var(--primary-text-color)}
        .header-action.power:not(:disabled){color:var(--primary-color)}
        .header-action ha-icon{--mdc-icon-size:20px}
        .header-action span{display:none}
        @media(max-width:420px){
          .card-actions{gap:2px;margin-left:2px}
          .header-action{width:32px;height:32px;min-width:32px}
          .header-action ha-icon{--mdc-icon-size:19px}
        }
      `;
      this.shadowRoot.append(style);
    }

    let actions = this.shadowRoot.querySelector(".card-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "card-actions";
      actions.setAttribute("aria-label", "Apple TV quick controls");
      this.shadowRoot.querySelector(".identity")?.append(actions);
    }

    const wake = !model.awake;
    const powerAction = wake ? "wake" : "sleep";
    const canPower = wake ? model.canWake : model.canSleep;

    actions.replaceChildren(
      this.button(
        "header-action power",
        wake ? "Turn Apple TV on" : "Turn Apple TV off",
        "mdi:power",
        () => this.remoteCommand(wake ? "wakeup" : "suspend", powerAction),
        !canPower || this.busy(powerAction),
        this.busy(powerAction),
      ),
      this.button(
        "header-action",
        "Volume down",
        "mdi:volume-minus",
        () => this.adjustVolume("down"),
        !model.canVolumeDown || this.busy("volume-down"),
        this.busy("volume-down"),
      ),
      this.button(
        "header-action",
        "Volume up",
        "mdi:volume-plus",
        () => this.adjustVolume("up"),
        !model.canVolumeUp || this.busy("volume-up"),
        this.busy("volume-up"),
      ),
    );
  };

  prototype.render = function render() {
    oldRender.call(this);
    if (!this.config || !this.el) return;

    const model = this.model();
    this.el.remoteLaunch.disabled = !model.awake || !this.canRemote(model);
    this.el.appsLaunch.disabled = !model.awake || !model.canSelectSource;
    this.ensureHeaderControls(model);

    if (this.panelMode && !model.awake) {
      this.closePanel(false);
    }
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

  prototype.openPanel = function openPanel(mode, trigger) {
    if (!this.model().awake) return;
    return oldOpenPanel.call(this, mode, trigger);
  };
});
