/** ComponentCameraControllerV2 — platform-adapted camera controls. */
const {
  createDialogController,
  interaction,
  loadSecurityModel,
  openMoreInfo,
  registerCard,
  waitForEntityState,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentCameraControllerV2 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.sequence = 0;
    this.fixedInteractions = [];
    this.controlInteractions = [];
    this.confirmId = null;
    this.confirmTimer = null;
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.build();
  }
  setConfig(config) {
    this.config = { profile: "household-security", expanded: false, ...(config || {}) };
    this.render();
    this.refresh();
  }
  set hass(hass) { this._hass = hass; this.refresh(); }
  connectedCallback() { window.addEventListener("ha-component-profile-change", this.profileListener); this.bindFixed(); this.refresh(); }
  disconnectedCallback() {
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    for (const handle of [...this.fixedInteractions, ...this.controlInteractions]) handle.destroy();
    this.fixedInteractions = [];
    this.controlInteractions = [];
    clearTimeout(this.confirmTimer);
    if (this.dialog.open) this.dialog.close();
  }
  getCardSize() { return this.config?.expanded ? 5 : 1; }

  build() {
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}
      ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.row{min-height:62px;padding:8px 9px 8px 12px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:9px}.icon{width:36px;height:36px;display:grid;place-items:center;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:21px}.identity{appearance:none;border:0;background:transparent;min-width:0;min-height:44px;padding:4px 0;text-align:left;cursor:pointer}.name,.state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name{font-size:13px;font-weight:650}.state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.actions{display:flex;gap:4px}.action,.close{appearance:none;min-width:44px;height:44px;padding:0 10px;border:0;border-radius:10px;background:transparent;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;color:var(--secondary-text-color)}.action:hover,.close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.action ha-icon,.close ha-icon{--mdc-icon-size:19px}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{cursor:default;opacity:.45}
      dialog{width:min(560px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:0;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,16px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.24));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.32));backdrop-filter:blur(3px)}.sheet{display:flex;flex-direction:column;max-height:calc(100dvh - 24px)}.head{min-height:56px;padding:6px 7px 6px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--divider-color)}.sheet-title{min-width:0;flex:1;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.body,.inline{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}.inline{border-top:1px solid var(--divider-color)}.inline[hidden]{display:none}.groups{display:grid;gap:16px}.group{display:grid;gap:7px}.group[hidden]{display:none}.group-list{display:grid;gap:6px}.group-title{display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:13px;font-weight:600}.group-title:after{content:'';height:1px;background:var(--divider-color);flex:1}.control{min-height:52px;padding:5px 5px 5px 10px;border:1px solid var(--divider-color);border-radius:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.copy{min-width:0}.control-name,.control-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.control-name{font-size:13px;font-weight:600}.control-state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.control button{appearance:none;width:96px;min-height:44px;padding:0 10px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer}.control button.on{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,transparent)}.control button.confirm{color:var(--warning-color,var(--error-color));border-color:currentColor}.detection.on{border-color:color-mix(in srgb,var(--primary-color) 40%,var(--divider-color))}.feedback{min-height:18px;margin-top:8px;color:var(--secondary-text-color);font-size:13px}.feedback.error{color:var(--error-color)}
      @media(max-width:520px){.action span{display:none}.action{padding:0}dialog{width:100vw;max-width:100vw;max-height:90dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.sheet{max-height:90dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}}
    </style><ha-card><div class="row"><span class="icon"><ha-icon icon="mdi:cctv"></ha-icon></span><button class="identity" type="button"><span class="name">Camera</span><span class="state">Loading…</span></button><span class="actions"><button class="action view" type="button"><ha-icon icon="mdi:eye-outline"></ha-icon><span>View</span></button><button class="action open-controls" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Controls</span></button></span></div><div class="inline" hidden></div></ha-card><dialog><div class="sheet"><div class="head"><span class="sheet-title">Camera controls</span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"></div></div></dialog>`;
    this.elements = { name: this.shadowRoot.querySelector(".name"), state: this.shadowRoot.querySelector(".state"), identity: this.shadowRoot.querySelector(".identity"), view: this.shadowRoot.querySelector(".view"), open: this.shadowRoot.querySelector(".open-controls"), inline: this.shadowRoot.querySelector(".inline"), body: this.shadowRoot.querySelector(".body"), sheetTitle: this.shadowRoot.querySelector(".sheet-title") };
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.dialogController = createDialogController(this, this.dialog, { initialFocus: () => this.shadowRoot.querySelector(".close") });
    this.bindFixed();
  }
  bindFixed() {
    if (this.fixedInteractions.length) return;
    this.fixedInteractions.push(
      interaction(this.elements.identity, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.elements.view, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.elements.open, { primary: (event) => this.openControls(event.currentTarget), feedback: true }),
      interaction(this.shadowRoot.querySelector(".close"), { primary: () => this.dialogController.close(), feedback: true }),
    );
  }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence !== this.sequence) return;
      this.model = model;
      this.camera = model.cameras.find((camera) => camera.entityId === this.config.entity || camera.deviceId === this.config.device_id) || model.cameras[0] || null;
      this.render();
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error }; this.camera = null; this.render(); }
    }
  }
  render() {
    if (!this.config) return;
    const camera = this.camera, error = this.model?.error || this.model?.profileError;
    this.elements.name.textContent = camera?.name || this.config.title || "Camera";
    this.elements.state.textContent = this.model?.profileMissing
      ? `Configure ${this.config.profile}`
      : error ? "Controls unavailable" : camera?.active ? "Activity detected" : camera?.online ? "Online" : "Unavailable";
    this.elements.identity.disabled = !camera?.online;
    this.elements.view.disabled = !camera?.online;
    const hasControls = Boolean(camera && (camera.switches.length || camera.detections.length || camera.actions.length || camera.ptz.length));
    this.elements.open.hidden = this.config.expanded || !hasControls;
    this.elements.inline.hidden = !this.config.expanded;
    this.elements.sheetTitle.textContent = `${camera?.name || "Camera"} controls`;
    if (this.config.expanded || this.dialog.open) this.renderControls();
  }
  openCamera() { if (this.camera?.online) openMoreInfo(this, this.camera.entityId); }
  openControls(trigger) {
    if (!this.camera) return;
    this.renderControls();
    this.dialogController.open(trigger);
  }
  renderControls() {
    const host = this.config.expanded ? this.elements.inline : this.elements.body;
    const camera = this.camera;
    for (const handle of this.controlInteractions) handle.destroy();
    this.controlInteractions = [];
    host.replaceChildren();
    if (!camera) { host.textContent = "Camera controls are unavailable"; return; }
    const groups = document.createElement("div"); groups.className = "groups";
    const group = (title) => { const section = document.createElement("section"); section.className = "group"; section.innerHTML = '<div class="group-title"></div><div class="group-list"></div>'; section.querySelector(".group-title").textContent = title; groups.append(section); return section.querySelector(".group-list"); };
    if (camera.detections.length) {
      const list = group("Detection status");
      for (const entity of camera.detections) {
        const state = this._hass.states[entity.entity_id], available = Boolean(state && !["unknown", "unavailable"].includes(state.state)), on = available && state.state === "on", row = document.createElement("div");
        row.className = `control detection ${on ? "on" : ""}`;
        row.innerHTML = '<span class="copy"><span class="control-name"></span><span class="control-state"></span></span>';
        row.querySelector(".control-name").textContent = entity.name || entity.original_name || "Detection";
        row.querySelector(".control-state").textContent = !available ? "Unavailable" : on ? "Detected" : "Clear";
        list.append(row);
      }
    }
    if (camera.switches.length) {
      const list = group("Camera controls");
      for (const capability of camera.switches) {
        const entityId = capability.entity.entity_id, state = this._hass.states[entityId], on = state?.state === "on", usable = Boolean(state && !["unknown", "unavailable"].includes(state.state)), row = document.createElement("div");
        row.className = "control";
        row.innerHTML = '<span class="copy"><span class="control-name"></span><span class="control-state"></span></span><button type="button"></button>';
        row.querySelector(".control-name").textContent = capability.role;
        row.querySelector(".control-state").textContent = usable ? on ? "On" : "Off" : "Unavailable";
        const button = row.querySelector("button"), confirmation = this.confirmId === entityId;
        button.textContent = confirmation ? "Confirm off" : on ? "On" : "Off";
        button.classList.toggle("on", on); button.classList.toggle("confirm", confirmation); button.disabled = !usable; button.setAttribute("aria-pressed", String(on));
        button.setAttribute("aria-label", confirmation ? `Confirm turning off ${capability.role}` : `${on ? "Turn off" : "Turn on"} ${capability.role}`);
        this.controlInteractions.push(interaction(button, { primary: () => this.toggle(capability, on), hold: () => openMoreInfo(this, entityId), singleFlight: true, feedback: true }));
        list.append(row);
      }
    }
    if (camera.ptz.length) {
      const list = group("Pan, tilt and zoom");
      for (const entity of camera.ptz) this.actionRow(list, entity, "Open", () => openMoreInfo(this, entity.entity_id));
    }
    if (camera.actions.length) {
      const list = group("Maintenance");
      for (const capability of camera.actions) this.actionRow(list, capability.entity, this.confirmId === capability.entity.entity_id ? "Confirm" : "Run", () => this.press(capability.entity.entity_id), this.confirmId === capability.entity.entity_id);
    }
    const feedback = document.createElement("div"); feedback.className = `feedback ${this.error ? "error" : ""}`; feedback.setAttribute("role", "status"); feedback.textContent = this.error || ""; groups.append(feedback);
    host.append(groups);
  }
  actionRow(list, entity, label, action, confirm = false) {
    const state = this._hass.states[entity.entity_id], usable = Boolean(state && state.state !== "unavailable"), row = document.createElement("div");
    row.className = "control"; row.innerHTML = '<span class="copy"><span class="control-name"></span><span class="control-state"></span></span><button type="button"></button>';
    row.querySelector(".control-name").textContent = entity.name || entity.original_name || "Camera action";
    row.querySelector(".control-state").textContent = usable ? "Available" : "Unavailable";
    const button = row.querySelector("button"); button.textContent = label; button.disabled = !usable; button.classList.toggle("confirm", confirm);
    this.controlInteractions.push(interaction(button, { primary: action, singleFlight: true, feedback: true }));
    list.append(row);
  }
  askConfirmation(entityId) {
    this.confirmId = entityId;
    clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => { this.confirmId = null; this.renderControls(); }, 5000);
    this.renderControls();
  }
  async toggle(capability, wasOn) {
    const entityId = capability.entity.entity_id, destructiveOff = wasOn && /^(Recording|Detection|Alerts)$/i.test(capability.role);
    if (destructiveOff && this.confirmId !== entityId) return this.askConfirmation(entityId);
    this.confirmId = null; clearTimeout(this.confirmTimer); this.error = ""; this.dialogController.setBusy(true);
    try {
      await this._hass.callService("switch", wasOn ? "turn_off" : "turn_on", { entity_id: entityId });
      await waitForEntityState(() => this._hass, entityId, (value) => value === (wasOn ? "off" : "on"), { timeout: 9000 });
    } catch (error) {
      this.error = error?.message || "Camera did not confirm the change";
      throw error;
    } finally {
      this.dialogController.setBusy(false); this.renderControls();
    }
  }
  async press(entityId) {
    if (this.confirmId !== entityId) return this.askConfirmation(entityId);
    this.confirmId = null; clearTimeout(this.confirmTimer); this.error = ""; this.dialogController.setBusy(true);
    try { await this._hass.callService("button", "press", { entity_id: entityId }); }
    catch (error) { this.error = error?.message || "Camera action failed"; throw error; }
    finally { this.dialogController.setBusy(false); this.renderControls(); }
  }
}

registerCard({ type: "component-camera-controller-v2", element: ComponentCameraControllerV2, name: "Camera Controller V2", description: "Platform-adapted camera controls with explicit state and protected destructive changes." });
