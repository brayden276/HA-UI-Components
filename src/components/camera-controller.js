/** ComponentCameraControllerV1 — device-aware ONVIF camera controller. */
const { interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const CAM_HD = globalThis.__homeDashboardV2;
const CAM_DOM = (id) => String(id || "").split(".")[0];
const CAM_NAME = (entity) => String(entity?.name || entity?.original_name || entity?.entity_id || "");
const CAM_BAD = new Set(["unknown", "unavailable"]);

class ComponentCameraControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.config = null;
    this._hass = null;
    this.data = null;
    this.bundleData = null;
    this.unsubscribe = null;
    this.loading = false;
    this.confirmId = null;
    this.confirmTimer = null;
    this.controlsSignature = "";
    this.interactionHandles = [];
    this.controlInteractions = [];
    this.optimisticSwitches = new Map();
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}
      ha-card{display:block;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color);overflow:hidden}
      .row{min-height:62px;padding:8px 9px 8px 10px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:20px}.activity .ico{color:var(--primary-color)}.offline .ico{color:var(--disabled-text-color,var(--secondary-text-color))}
      .identity{appearance:none;border:0;background:transparent;padding:0;min-width:0;text-align:left;cursor:pointer}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:500;line-height:1.25}.state{margin-top:3px;font-size:12px;color:var(--secondary-text-color);line-height:1.25}
      .actions{display:flex;gap:6px}.action,.close,.switchbtn,.maint{appearance:none;border:1px solid var(--divider-color);background:transparent;border-radius:var(--dashboard-radius-control,8px);cursor:pointer}.action{min-height:38px;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--secondary-text-color)}.action ha-icon{--mdc-icon-size:16px}.action:hover,.action:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}button:disabled{opacity:.4;cursor:default}
      dialog{width:min(560px,calc(100vw - 24px));max-height:min(720px,calc(100dvh - 24px));padding:0;margin:auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}
      .sheet{display:flex;flex-direction:column;max-height:min(720px,calc(100dvh - 24px))}.head{min-height:54px;padding:6px 7px 6px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.head>ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}.title{min-width:0;flex:1}.sheet-name,.sheet-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sheet-name{font-size:14px;font-weight:500}.sheet-state{margin-top:2px;font-size:11.5px;color:var(--secondary-text-color)}.close{width:40px;height:40px;border-color:transparent;display:grid;place-items:center;color:var(--secondary-text-color)}.close ha-icon{--mdc-icon-size:18px}
      .body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom));display:grid;gap:16px}.section{display:grid;gap:7px}.section[hidden]{display:none}.section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--secondary-text-color)}.section-title:after{content:'';height:1px;background:var(--divider-color);flex:1}
      .control,.detect,.maintenance{min-height:46px;padding:5px 6px 5px 10px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.copy{min-width:0}.ctl-name,.ctl-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ctl-name{font-size:12.5px}.ctl-state{margin-top:2px;font-size:11px;color:var(--secondary-text-color)}.detect.on{border-color:color-mix(in srgb,var(--primary-color) 42%,var(--divider-color))}.detect .dot{width:8px;height:8px;border-radius:50%;background:var(--divider-color)}.detect.on .dot{background:var(--primary-color)}
      .switchbtn{min-width:58px;height:34px;padding:0 9px;font-size:11px;color:var(--secondary-text-color)}.switchbtn.on{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 7%,transparent)}.maint{grid-template-columns:minmax(0,1fr) auto}.maint button{min-width:78px;height:34px;padding:0 9px}.maint button.confirm{border-color:var(--warning-color,var(--primary-color));color:var(--warning-color,var(--primary-color))}
      :is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      @media(max-width:520px){.row{grid-template-columns:34px minmax(0,1fr) auto;padding-left:8px}.actions .action span{display:none}.action{width:40px;padding:0;justify-content:center}dialog{width:100vw;max-width:100vw;height:88dvh;max-height:88dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:8px 8px 0 0}.sheet{height:88dvh;max-height:88dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}}
    </style><ha-card><div class="row"><span class="ico"><ha-icon icon="mdi:cctv"></ha-icon></span><button class="identity" type="button"><span class="name">Camera</span><span class="state">Loading…</span></button><span class="actions"><button class="action view" type="button"><ha-icon icon="mdi:eye-outline"></ha-icon><span>View</span></button><button class="action controls" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Controls</span></button></span></div></ha-card><dialog><div class="sheet"><div class="head"><ha-icon icon="mdi:cctv"></ha-icon><span class="title"><span class="sheet-name"></span><span class="sheet-state"></span></span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><section class="section detections"><div class="section-title">Detection</div><div class="detection-list"></div></section><section class="section device-controls"><div class="section-title">Camera controls</div><div class="control-list"></div></section><section class="section maintenance-section"><div class="section-title">Maintenance</div><div class="maintenance-list"></div></section></div></div></dialog>`;
    this.row = this.shadowRoot.querySelector(".row");
    this.nameEl = this.shadowRoot.querySelector(".name");
    this.stateEl = this.shadowRoot.querySelector(".state");
    this.sheetName = this.shadowRoot.querySelector(".sheet-name");
    this.sheetState = this.shadowRoot.querySelector(".sheet-state");
    this.view = this.shadowRoot.querySelector(".view");
    this.controls = this.shadowRoot.querySelector(".controls");
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.identity = this.shadowRoot.querySelector(".identity");
    this.bindInteractions();
    this.dialog.onclick = (event) => { if (event.target === this.dialog) this.dialog.close(); };
  }

  bindInteractions() {
    if (this.interactionHandles.length) return;
    this.interactionHandles.push(
      interaction(this.view, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.identity, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.controls, { primary: () => this.openControls(), feedback: true }),
      interaction(this.shadowRoot.querySelector(".close"), { primary: () => this.dialog.close(), feedback: true }),
    );
  }

  setConfig(config) { if (!config?.entity) throw new Error("Camera controller requires entity"); this.config = { ...config }; this.data = null; this.bundleData = null; this.controlsSignature = ""; this.load(); }
  set hass(hass) {
    this._hass = hass;
    this.unsubscribe || this.subscribe();
    if (this.data) {
      this.bundleData = this.bundle();
      this.render();
    } else {
      this.load();
    }
  }
  connectedCallback() { this.bindInteractions(); this.subscribe(); this.load(); }
  disconnectedCallback() { for (const handle of this.interactionHandles) handle.destroy(); this.interactionHandles = []; for (const handle of this.controlInteractions) handle.destroy(); this.controlInteractions = []; this.optimisticSwitches.clear(); this.unsubscribe?.(); this.unsubscribe = null; clearTimeout(this.confirmTimer); }
  getCardSize() { return 1; }
  subscribe() {
    if (this.unsubscribe || !this._hass || !CAM_HD?.REG?.subscribe) return;
    this.unsubscribe = CAM_HD.REG.subscribe(this._hass, (data) => {
      this.data = data;
      if (!this.config) return;
      this.bundleData = this.bundle();
      this.render();
    });
  }
  async load(force = false) { if (this.loading || !this._hass || !this.config || !CAM_HD?.REG?.load) return; this.loading = true; try { this.data = this.data || await CAM_HD.REG.load(this._hass, force); this.bundleData = this.bundle(); this.render(); } finally { this.loading = false; } }
  good(id) { const state = id ? this._hass?.states?.[id] : null; return Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())); }

  bundle() {
    const all = this.data?.entities || [];
    const entry = all.find((entity) => entity.entity_id === this.config.entity);
    const deviceId = this.config.device_id || entry?.device_id;
    const siblings = (deviceId ? this.data?.byDevice?.get(deviceId) : []) || [];
    const enabled = siblings.filter((entity) => !entity.disabled_by && this._hass.states[entity.entity_id]);
    const cameras = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "camera");
    const main = cameras.find((entity) => /main.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) || cameras[0];
    const sub = cameras.find((entity) => /sub.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) || null;
    const switches = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "switch");
    const detections = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "binary_sensor" && (/^(motion|occupancy|presence|sound)$/.test(this._hass.states[entity.entity_id]?.attributes?.device_class || "") || /motion|human|person|detect/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)));
    const buttons = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "button");
    const device = this.data?.devices?.find((item) => item.id === deviceId) || {};
    const areaId = CAM_HD.areaOf(main || entry, this.data);
    const area = this.data?.areaMap?.get(areaId)?.name || "";
    const custom = String(device.name_by_user || "").trim();
    const model = String(device.model || device.name || "Camera").trim();
    const generic = !custom || /^H80$|^camera$/i.test(custom);
    const owners = all.filter((entity) => entity.platform === "onvif" && CAM_DOM(entity.entity_id) === "camera" && /main.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`) && CAM_HD.areaOf(entity, this.data) === areaId).sort((a, b) => String(a.unique_id || a.entity_id).localeCompare(String(b.unique_id || b.entity_id)));
    const index = Math.max(0, owners.findIndex((entity) => entity.device_id === deviceId));
    const name = !generic ? custom : area ? owners.length > 1 ? `${area} · Camera ${index + 1}` : area : owners.length > 1 ? `${model} · Camera ${index + 1}` : model;
    return { deviceId, name, model, main: main?.entity_id || this.config.entity, sub: sub?.entity_id || null, switches, detections, buttons };
  }

  status() {
    if (!this.bundleData) return { online: false, active: false, text: "Unavailable" };
    const online = this.good(this.bundleData.main) || this.good(this.bundleData.sub);
    const activeRows = this.bundleData.detections.filter((entity) => this._hass.states[entity.entity_id]?.state === "on");
    const active = activeRows.length > 0;
    const text = activeRows.find((entity) => /human|person/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) ? "Person detected" : active ? "Motion detected" : online ? "Online" : "Unavailable";
    return { online, active, text };
  }
  clean(entity) { return CAM_NAME(entity).replace(/^H80\s*/i, "").replace(/^(Main|Sub)Stream$/i, "Camera").trim() || "Control"; }

  render() {
    if (!this._hass || !this.bundleData) return;
    const status = this.status();
    this.nameEl.textContent = this.bundleData.name;
    this.stateEl.textContent = status.text;
    this.sheetName.textContent = this.bundleData.name;
    this.sheetState.textContent = status.text;
    this.row.classList.toggle("activity", status.active);
    this.row.classList.toggle("offline", !status.online);
    this.view.disabled = !status.online;
    const hasControls = this.bundleData.switches.length || this.bundleData.detections.length || this.bundleData.buttons.length;
    this.controls.hidden = !hasControls;
    // The sheet is populated when opened. Rebuilding it while hidden creates
    // controls and listeners for every Home Assistant state update.
    if (this.dialog.open) this.renderControls();
    else this.controlsSignature = "";
    if (this.dialog.open && !hasControls) this.dialog.close();
  }

  renderControls() {
    if (!this.bundleData) {
      for (const handle of this.controlInteractions) handle.destroy();
      this.controlInteractions = [];
      this.controlsSignature = "";
      return;
    }
    const signature = JSON.stringify([
      this.confirmId,
      [...this.optimisticSwitches],
      ...this.bundleData.detections.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
      ...this.bundleData.switches.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
      ...this.bundleData.buttons.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
    ]);
    if (signature === this.controlsSignature) return;
    for (const handle of this.controlInteractions) handle.destroy();
    this.controlInteractions = [];
    this.controlsSignature = signature;
    const detections = this.shadowRoot.querySelector(".detection-list");
    const controls = this.shadowRoot.querySelector(".control-list");
    const maintenance = this.shadowRoot.querySelector(".maintenance-list");
    detections.replaceChildren(); controls.replaceChildren(); maintenance.replaceChildren();
    for (const entity of this.bundleData.detections) {
      const state = this._hass.states[entity.entity_id], on = state?.state === "on", row = document.createElement("div");
      row.className = `detect ${on ? "on" : ""}`;
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><span class="dot"></span>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = !state || state.state === "unavailable" ? "Unavailable" : on ? "Detected" : "Clear";
      detections.append(row);
    }
    for (const entity of this.bundleData.switches) {
      const state = this._hass.states[entity.entity_id], reportedOn = state?.state === "on", on = this.optimisticSwitches.has(entity.entity_id) ? this.optimisticSwitches.get(entity.entity_id) : reportedOn, usable = Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())), row = document.createElement("div");
      row.className = "control";
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><button class="switchbtn" type="button"></button>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = usable ? on ? "On" : "Off" : "Unavailable";
      const button = row.querySelector("button");
      button.textContent = on ? "On" : "Off"; button.classList.toggle("on", on); button.disabled = !usable; button.setAttribute("aria-pressed", String(on)); button.setAttribute("aria-label", `${on ? "Turn off" : "Turn on"} ${this.clean(entity)}`);
      this.controlInteractions.push(interaction(button, {
        primary: () => this.toggleSwitch(entity.entity_id, reportedOn),
        hold: () => openMoreInfo(this, entity.entity_id),
        optimistic: {
          capture: () => reportedOn,
          apply: () => { const next = !reportedOn; this.optimisticSwitches.set(entity.entity_id, next); button.textContent = next ? "On" : "Off"; button.classList.toggle("on", next); button.setAttribute("aria-pressed", String(next)); row.querySelector(".ctl-state").textContent = next ? "On" : "Off"; },
          rollback: () => { this.optimisticSwitches.delete(entity.entity_id); this.controlsSignature = ""; if (this.dialog.open) this.renderControls(); },
        },
        singleFlight: true,
        feedback: true,
      }));
      controls.append(row);
    }
    for (const entity of this.bundleData.buttons) {
      const state = this._hass.states[entity.entity_id], usable = Boolean(state && String(state.state).toLowerCase() !== "unavailable"), row = document.createElement("div");
      row.className = "maintenance";
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><button class="maint" type="button">Run</button>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = usable ? "Available" : "Unavailable";
      const button = row.querySelector("button");
      button.disabled = !usable; button.classList.toggle("confirm", this.confirmId === entity.entity_id); button.textContent = this.confirmId === entity.entity_id ? "Confirm" : "Run";
      this.controlInteractions.push(interaction(button, { primary: () => this.press(entity.entity_id), optimistic: false, repeat: false, singleFlight: true, feedback: true }));
      maintenance.append(row);
    }
    this.shadowRoot.querySelector(".detections").hidden = !this.bundleData.detections.length;
    this.shadowRoot.querySelector(".device-controls").hidden = !this.bundleData.switches.length;
    this.shadowRoot.querySelector(".maintenance-section").hidden = !this.bundleData.buttons.length;
  }

  openControls() { if (!this.dialog || !this.bundleData) return; this.confirmId = null; this.renderControls(); if (!this.dialog.open) this.dialog.showModal(); queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus()); }
  async openCamera() {
    const hass = this._hass, bundle = this.bundleData;
    if (!hass || !bundle) return;
    const preference = await CAM_HD.prefs?.(hass, "security-dashboard.camera.viewer.v1").catch?.(() => null);
    if (hass !== this._hass || bundle !== this.bundleData) return;
    const hd = Boolean(preference?.hd);
    const entityId = hd && this.good(bundle.main) ? bundle.main : this.good(bundle.sub) ? bundle.sub : this.good(bundle.main) ? bundle.main : null;
    if (entityId) openMoreInfo(this, entityId);
  }
  async toggleSwitch(entityId, wasOn) {
    await this._hass.callService("switch", "toggle", { entity_id: entityId });
    await waitForEntityState(() => this._hass, entityId, (value) => value === (wasOn ? "off" : "on"), { timeout: 9000 });
    this.optimisticSwitches.delete(entityId);
    this.controlsSignature = "";
    if (this.dialog.open) this.renderControls();
  }

  press(entityId) { if (this.confirmId !== entityId) { this.confirmId = entityId; clearTimeout(this.confirmTimer); this.confirmTimer = setTimeout(() => { this.confirmId = null; if (this.dialog.open) this.renderControls(); }, 5000); this.renderControls(); return; } clearTimeout(this.confirmTimer); this.confirmId = null; const request = this._hass.callService("button", "press", { entity_id: entityId }); this.renderControls(); return request; }
}

registerCard({ type: "component-camera-controller-v1", element: ComponentCameraControllerV1, name: "Camera Controller V1", description: "One device-aware controller for each physical ONVIF camera." });
