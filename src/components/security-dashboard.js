/** ComponentSecurityDashboardV1 — retained, single-owner Security dashboard. */
const {
  createDialogController,
  formatDate,
  interaction,
  loadSecurityModel,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const SECURITY_UNAVAILABLE_STATES = new Set(["unknown", "unavailable"]);
const SECURITY_SNAPSHOT_TTL_MS = 10_000;
const SECURITY_QUICK_ACTION_RESET_MS = 2_600;
const SECURITY_ENTRY_CONFIRMATION_MS = 3_000;

const isUsableSecurityState = (state) =>
  Boolean(state && !SECURITY_UNAVAILABLE_STATES.has(String(state.state).toLowerCase()));

const entryService = (entityId, open) => {
  const domain = String(entityId || "").split(".")[0];
  if (domain === "button") return ["button", "press"];
  if (domain === "cover") return ["cover", open ? "close_cover" : "open_cover"];
  if (domain === "lock") return ["lock", open ? "lock" : "unlock"];
  return ["homeassistant", "toggle"];
};

class ComponentSecurityDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-security", camera_columns: 2 };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = null;
    this.sequence = 0;
    this._children = new Map();
    this.viewerEntityId = null;
    this.refreshTimer = null;
    this.snapshotTimer = null;
    this.quickResetTimers = new Set();
    this.entryConfirmTimer = null;
    this.entryConfirmId = null;
    this.surfaceInteractions = [];
    this.dialogInteractions = [];
    this.staticInteractions = [];
    this.cameraTiles = new Map();
    this.viewerCameraId = null;
    this.viewerStream = null;
    this.settingsCameraId = null;

    this.profileListener = (event) => {
      if (
        event.detail?.kind === "security" &&
        event.detail?.profileId === this.config?.profile
      ) {
        this.refresh(true);
      }
    };
    this.visibilityListener = () => {
      if (document.visibilityState !== "hidden") this.refreshSnapshots(true);
    };

    this.build();
    this.bindStatic();
  }

  setConfig(config) {
    this.config = {
      profile: "household-security",
      camera_columns: 2,
      refresh_seconds: 15,
      title: "Security",
      ...(config || {}),
    };
    this.style.setProperty(
      "--security-columns",
      Math.max(1, Math.min(3, Number(this.config.camera_columns) || 2)),
    );
    this.shadowRoot.querySelector(".page-title").textContent = this.config.title;
    const summary = this._children.get("summary");
    if (summary) summary.config = { profile: this.config.profile };
    const wall = this._children.get("wall");
    wall?.setConfig?.({ profile: this.config.profile, columns: this.config.camera_columns });
    this.scheduleSnapshots();
    this.refresh(true);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.model) {
      this.refresh();
      return;
    }
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      this.refresh();
    }, 40);
  }

  connectedCallback() {
    window.addEventListener("ha-component-profile-change", this.profileListener);
    document.addEventListener("visibilitychange", this.visibilityListener);
    this.bindStatic();
    this.scheduleSnapshots();
    this.refresh();
  }

  disconnectedCallback() {
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    document.removeEventListener("visibilitychange", this.visibilityListener);
    clearTimeout(this.refreshTimer);
    clearInterval(this.snapshotTimer);
    clearTimeout(this.entryConfirmTimer);
    this.refreshTimer = null;
    this.snapshotTimer = null;
    this.entryConfirmTimer = null;
    for (const timer of this.quickResetTimers) clearTimeout(timer);
    this.quickResetTimers.clear();
    this.destroyInteractions(this.surfaceInteractions);
    this.destroyInteractions(this.dialogInteractions);
    this.destroyInteractions(this.staticInteractions);
    for (const tile of this.cameraTiles.values()) this.destroyCameraTile(tile);
    this.cameraTiles.clear();
    this.stopViewer();
    if (this.viewerDialog.open) this.viewerDialog.close();
    if (this.settingsDialog.open) this.settingsDialog.close();
  }

  getCardSize() { return 12; }

  build() {
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0;--security-gap:10px}*{box-sizing:border-box}button{font:inherit;color:inherit}
      .page{display:grid;gap:var(--security-gap)}.panel{border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,16px);background:var(--card-background-color);color:var(--primary-text-color);overflow:hidden}
      .hero{min-height:88px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px}.hero-main{min-width:0;display:grid;grid-template-columns:44px minmax(0,1fr);align-items:center;gap:11px}.hero-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 10%,transparent);color:var(--primary-color)}.hero-icon.attention{background:color-mix(in srgb,var(--warning-color,var(--error-color)) 12%,transparent);color:var(--warning-color,var(--error-color))}.hero-icon ha-icon{--mdc-icon-size:24px}.page-title{margin:0;font-size:18px;line-height:1.15;font-weight:700}.status-copy{margin-top:4px;font-size:13px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.metrics{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.metric{min-height:34px;padding:0 10px;border-radius:999px;background:var(--secondary-background-color);display:flex;align-items:center;gap:6px;font-size:12px;font-weight:650;white-space:nowrap}.metric ha-icon{--mdc-icon-size:17px;color:var(--secondary-text-color)}.metric.attention{color:var(--warning-color,var(--error-color))}
      .section{padding:13px 14px 14px}.section[hidden]{display:none}.section-head{min-height:34px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.section-title{margin:0;font-size:15px;line-height:1.2;font-weight:650}.section-meta{font-size:12px;color:var(--secondary-text-color);white-space:nowrap}
      .quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.quick-action{appearance:none;min-width:0;min-height:58px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:12px;background:transparent;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.quick-action:hover{background:var(--secondary-background-color)}.quick-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 9%,transparent);color:var(--primary-color)}.quick-icon ha-icon{--mdc-icon-size:20px}.quick-name,.quick-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quick-name{font-size:13px;font-weight:650}.quick-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}
      .camera-grid{display:grid;grid-template-columns:repeat(var(--security-columns,2),minmax(0,1fr));gap:8px}.camera{min-width:0;border:1px solid var(--divider-color);border-radius:14px;overflow:hidden;background:var(--card-background-color)}.camera-media{position:relative;display:block;width:100%;aspect-ratio:16/9;padding:0;border:0;background:var(--dashboard-media-surface,#111);cursor:pointer;overflow:hidden}.camera-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.camera-media.offline:after{content:"Camera unavailable";position:absolute;inset:0;display:grid;place-items:center;padding:12px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 72%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:13px;font-weight:650}.camera-badge{position:absolute;top:9px;left:9px;min-height:28px;padding:0 8px;border-radius:999px;display:flex;align-items:center;gap:5px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 78%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:11px;font-weight:700}.camera-badge.activity{background:color-mix(in srgb,var(--warning-color,#f4a100) 88%,transparent)}.camera-badge ha-icon{--mdc-icon-size:14px}.camera-copy{padding:10px 11px 8px}.camera-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.camera-name{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.camera-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.classification-summary{margin-top:6px;font-size:12px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.camera-actions{padding:0 7px 7px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.camera-action{appearance:none;min-width:0;min-height:42px;padding:0 7px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;font-size:12px;font-weight:650}.camera-action.primary{background:color-mix(in srgb,var(--primary-color) 9%,transparent);border-color:color-mix(in srgb,var(--primary-color) 28%,var(--divider-color));color:var(--primary-color)}.camera-action:hover{background:var(--secondary-background-color)}.camera-action ha-icon{--mdc-icon-size:17px}
      .entries{display:grid;gap:7px}.entry{min-height:64px;padding:7px 7px 7px 11px;border:1px solid var(--divider-color);border-radius:12px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}.entry-icon{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.entry-icon.attention{color:var(--warning-color,var(--error-color))}.entry-icon ha-icon{--mdc-icon-size:20px}.entry-name,.entry-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.entry-name{font-size:13px;font-weight:650}.entry-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.entry-actions{display:flex;gap:4px}.entry-detail,.entry-operate{appearance:none;min-height:44px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer}.entry-detail{width:44px;padding:0;display:grid;place-items:center;color:var(--secondary-text-color)}.entry-operate{min-width:92px;padding:0 10px;color:var(--primary-color);font-size:12px;font-weight:700}.entry-operate.confirm{color:var(--warning-color,var(--error-color));border-color:currentColor}.entry-detail ha-icon{--mdc-icon-size:18px}
      .empty{min-height:78px;display:grid;place-items:center;text-align:center;color:var(--secondary-text-color);font-size:13px;padding:12px}
      dialog{padding:0;border:1px solid var(--divider-color);border-radius:16px;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 18px 56px rgba(0,0,0,.28));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.46));backdrop-filter:blur(2px)}.dialog-shell{display:flex;flex-direction:column;max-height:calc(100dvh - 24px)}.dialog-head{min-height:58px;padding:6px 7px 6px 14px;border-bottom:1px solid var(--divider-color);display:flex;align-items:center;gap:7px}.dialog-title{min-width:0;flex:1;font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dialog-button{appearance:none;min-width:44px;height:44px;padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color);display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer}.dialog-button:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.dialog-button ha-icon{--mdc-icon-size:19px}.dialog-button span{font-size:12px;font-weight:650}.dialog-body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}
      .viewer-dialog{width:min(1120px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px))}.viewer-shell{height:100%}.viewer-body{position:relative;min-height:0;flex:1;display:grid;place-items:center;background:var(--dashboard-media-surface,#111);overflow:hidden}.viewer-stream{display:block;width:100%;height:100%;min-height:0;color:var(--dashboard-media-on-surface,#fff)}.viewer-message{position:absolute;inset:auto 12px 12px;pointer-events:none;text-align:center;color:var(--dashboard-media-on-surface,#fff);font-size:12px}
      .settings-dialog{width:min(680px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}.settings-groups{display:grid;gap:18px}.settings-group{display:grid;gap:8px}.settings-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.04em}.settings-title:after{content:"";height:1px;background:var(--divider-color);flex:1}.detections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detection{appearance:none;min-width:0;padding:0;border:1px solid var(--divider-color);border-radius:12px;background:var(--secondary-background-color);overflow:hidden;text-align:left;cursor:pointer}.detection img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--dashboard-media-surface,#111)}.detection-copy{display:block;padding:8px 10px}.detection-name,.detection-time{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.detection-name{font-size:13px;font-weight:700}.detection-time{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.status-list,.control-list{display:grid;gap:6px}.status-row,.control-row{min-height:54px;padding:5px 5px 5px 10px;border:1px solid var(--divider-color);border-radius:11px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.control-name,.control-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.control-name{font-size:13px;font-weight:650}.control-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.control-value{min-width:74px;text-align:right;font-size:12px;font-weight:700}.control-value.on{color:var(--warning-color,var(--primary-color))}.control-toggle{appearance:none;min-width:88px;min-height:42px;padding:0 9px;border:1px solid var(--divider-color);border-radius:9px;background:transparent;cursor:pointer;font-size:12px;font-weight:700}.control-toggle.on{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 8%,transparent);border-color:color-mix(in srgb,var(--primary-color) 30%,var(--divider-color))}.settings-footer{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.footer-action{appearance:none;min-height:46px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:700}.footer-action ha-icon{--mdc-icon-size:18px}
      button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{cursor:default;opacity:.45}
      @media(max-width:700px){:host{--security-gap:8px}.hero{grid-template-columns:1fr;padding:12px}.metrics{justify-content:flex-start}.section{padding:12px}.camera-grid,.quick-grid{grid-template-columns:1fr}.camera-actions{grid-template-columns:repeat(3,minmax(0,1fr))}.dialog-button span{display:none}.dialog-button{padding:0}.viewer-dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-width:0;border-radius:0}.settings-dialog{width:100vw;max-width:100vw;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.detections{grid-template-columns:1fr}.entry{grid-template-columns:34px minmax(0,1fr)}.entry-actions{grid-column:2;justify-content:flex-start}.entry-operate{flex:1}.settings-footer{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
    </style>
    <div class="page">
      <section class="panel hero">
        <div class="hero-main">
          <span class="hero-icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span>
          <div><h1 class="page-title">Security</h1><div class="status-copy">Loading security state…</div></div>
        </div>
        <div class="metrics"></div>
      </section>
      <section class="panel section quick-section" hidden>
        <div class="section-head"><h2 class="section-title">Quick actions</h2><span class="section-meta quick-meta"></span></div>
        <div class="quick-grid"></div>
      </section>
      <section class="panel section camera-section">
        <div class="section-head"><h2 class="section-title">Cameras</h2><span class="section-meta camera-meta">Loading…</span></div>
        <div class="camera-grid"></div>
        <div class="empty camera-empty" hidden></div>
      </section>
      <section class="panel section entry-section" hidden>
        <div class="section-head"><h2 class="section-title">Entry points</h2><span class="section-meta entry-meta"></span></div>
        <div class="entries"></div>
      </section>
    </div>
    <dialog class="viewer-dialog">
      <div class="dialog-shell viewer-shell">
        <div class="dialog-head">
          <span class="dialog-title viewer-title">Camera</span>
          <button class="dialog-button viewer-settings" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Settings</span></button>
          <button class="dialog-button viewer-details" type="button"><ha-icon icon="mdi:information-outline"></ha-icon><span>Details</span></button>
          <button class="dialog-button viewer-close" type="button" aria-label="Close live camera"><ha-icon icon="mdi:close"></ha-icon></button>
        </div>
        <div class="viewer-body"><div class="viewer-message">Connecting…</div></div>
      </div>
    </dialog>
    <dialog class="settings-dialog">
      <div class="dialog-shell">
        <div class="dialog-head">
          <span class="dialog-title settings-dialog-title">Camera settings</span>
          <button class="dialog-button settings-live" type="button"><ha-icon icon="mdi:play-circle-outline"></ha-icon><span>Live</span></button>
          <button class="dialog-button settings-close" type="button" aria-label="Close camera settings"><ha-icon icon="mdi:close"></ha-icon></button>
        </div>
        <div class="dialog-body settings-body"></div>
      </div>
    </dialog>`;

    this.elements = {
      heroIcon: this.shadowRoot.querySelector(".hero-icon"),
      heroIconGlyph: this.shadowRoot.querySelector(".hero-icon ha-icon"),
      status: this.shadowRoot.querySelector(".status-copy"),
      metrics: this.shadowRoot.querySelector(".metrics"),
      quickSection: this.shadowRoot.querySelector(".quick-section"),
      quickGrid: this.shadowRoot.querySelector(".quick-grid"),
      quickMeta: this.shadowRoot.querySelector(".quick-meta"),
      cameraGrid: this.shadowRoot.querySelector(".camera-grid"),
      cameraMeta: this.shadowRoot.querySelector(".camera-meta"),
      cameraEmpty: this.shadowRoot.querySelector(".camera-empty"),
      entrySection: this.shadowRoot.querySelector(".entry-section"),
      entries: this.shadowRoot.querySelector(".entries"),
      entryMeta: this.shadowRoot.querySelector(".entry-meta"),
      viewerBody: this.shadowRoot.querySelector(".viewer-body"),
      viewerTitle: this.shadowRoot.querySelector(".viewer-title"),
      settingsTitle: this.shadowRoot.querySelector(".settings-dialog-title"),
      settingsBody: this.shadowRoot.querySelector(".settings-body"),
    };
    this.viewerDialog = this.shadowRoot.querySelector(".viewer-dialog");
    this.settingsDialog = this.shadowRoot.querySelector(".settings-dialog");
    const viewerDialogController = createDialogController(this, this.viewerDialog, {
      initialFocus: () => this.shadowRoot.querySelector(".viewer-close"),
    });
    const settingsDialogController = createDialogController(this, this.settingsDialog, {
      initialFocus: () => this.shadowRoot.querySelector(".settings-close"),
    });
    const self = this;
    this.viewerController = Object.freeze({
      open(from) { return viewerDialogController.open(from); },
      close(reason) { return viewerDialogController.close(reason); },
      get isOpen() { return self.viewerDialog.open === true; },
    });
    this.settingsController = Object.freeze({
      open(from) { return settingsDialogController.open(from); },
      close(reason) { return settingsDialogController.close(reason); },
      get isOpen() { return self.settingsDialog.open === true; },
    });
    this.controlsController = this.settingsController;
    this.viewerDialog.addEventListener("close", () => this.stopViewer());
    this.installCompatibilitySurface();
  }

  installCompatibilitySurface() {
    const summary = { config: {} };
    const wall = document.createElement("component-security-camera-wall-v3");
    wall.addEventListener("security-camera-control-request", (event) => {
      const camera = event.detail?.camera;
      if (!camera) return;
      this._children.set("camera-controller", {
        config: {
          profile: this.config?.profile,
          entity: camera.entityId,
          device_id: camera.deviceId,
          expanded: true,
          title: camera.name,
        },
      });
      this.openSettings(camera, event.detail?.trigger, "controls");
    });
    wall.addEventListener("security-camera-view-request", (event) => {
      const camera = event.detail?.camera;
      if (camera) this.openViewer(camera, event.detail?.trigger);
    });
    this._children.set("summary", summary);
    this._children.set("wall", wall);
  }

  bindStatic() {
    if (this.staticInteractions.length) return;
    this.staticInteractions.push(
      interaction(this.shadowRoot.querySelector(".viewer-close"), {
        primary: () => this.viewerController.close(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".viewer-settings"), {
        primary: () => this.switchViewerToSettings(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".viewer-details"), {
        primary: () => this.openViewerDetails(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".settings-close"), {
        primary: () => this.settingsController.close(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".settings-live"), {
        primary: () => this.switchSettingsToViewer(),
        feedback: true,
      }),
    );
  }

  destroyInteractions(collection) {
    for (const handle of collection.splice(0)) handle.destroy();
  }

  clearDashboardTimers() {
    clearTimeout(this.refreshTimer);
    clearInterval(this.snapshotTimer);
    clearTimeout(this.entryConfirmTimer);
    this.refreshTimer = null;
    this.snapshotTimer = null;
    this.entryConfirmTimer = null;
    for (const timer of this.quickResetTimers) clearTimeout(timer);
    this.quickResetTimers.clear();
  }

  clearCameraTiles() {
    for (const tile of this.cameraTiles.values()) this.destroyCameraTile(tile);
    this.cameraTiles.clear();
  }

  cameraState(camera) {
    return this._hass?.states?.[camera.entityId] || null;
  }

  cameraSnapshotUrl(camera) {
    const picture = this.cameraState(camera)?.attributes?.entity_picture;
    if (!picture) return null;
    const base = this._hass?.hassUrl ? this._hass.hassUrl(picture) : picture;
    return `${base}${base.includes("?") ? "&" : "?"}_=${Math.floor(Date.now() / SECURITY_SNAPSHOT_TTL_MS)}`;
  }

  updateCameraSnapshot(tile, force = false) {
    const camera = tile.camera;
    if (!camera?.online) return;
    const url = this.cameraSnapshotUrl(camera);
    if (!url || (!force && tile.image.src === url)) return;
    tile.lastSnapshotUrl = tile.image.src || tile.lastSnapshotUrl;
    tile.image.src = url;
  }

  viewerState(camera) {
    const requestedEntityId = camera.streamEntityId || camera.entityId;
    const requestedState = this._hass?.states?.[requestedEntityId];
    const fallbackState = this.cameraState(camera);
    return {
      requestedEntityId,
      state: isUsableSecurityState(requestedState)
        ? requestedState
        : fallbackState,
    };
  }

  viewerMessage(text) {
    const message = document.createElement("div");
    message.className = "viewer-message";
    message.textContent = text;
    return message;
  }

  settingGroup(groups, title, className = "") {
    const section = document.createElement("section");
    section.className = "settings-group";
    const heading = document.createElement("div");
    heading.className = "settings-title";
    heading.textContent = title;
    const body = document.createElement("div");
    if (className) body.className = className;
    section.append(heading, body);
    groups.append(section);
    return body;
  }

  scheduleSnapshots() {
    clearInterval(this.snapshotTimer);
    this.snapshotTimer = null;
    if (!this.config || !this.isConnected) return;
    this.snapshotTimer = setInterval(
      () => this.refreshSnapshots(),
      Math.max(10, Number(this.config.refresh_seconds) || 15) * 1000,
    );
  }

  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence !== this.sequence || !this.isConnected) return;
      this.model = model;
      this.render();
    } catch (error) {
      if (sequence !== this.sequence || !this.isConnected) return;
      this.model = {
        error,
        cameras: [],
        entries: [],
        quickActions: [],
        attention: [],
        allClear: false,
        onlineCameras: 0,
      };
      this.render();
    }
  }

  render() {
    const model = this.model || {};
    const cameras = model.cameras || [];
    const entries = model.entries || [];
    const quickActions = model.quickActions || [];
    const activeDetections = cameras.reduce(
      (count, camera) =>
        count +
        (camera.detections || []).filter(
          (entity) => this._hass?.states?.[entity.entity_id]?.state === "on",
        ).length,
      0,
    );
    const openEntries = entries.filter((entry) => entry.available && entry.open).length;
    const attentionCount = (model.attention || []).length;
    const hasError = Boolean(model.error || model.profileError || model.profileMissing);

    this.elements.heroIcon.classList.toggle("attention", attentionCount > 0 || hasError);
    this.elements.heroIconGlyph.setAttribute(
      "icon",
      hasError
        ? "mdi:shield-alert-outline"
        : attentionCount > 0
          ? "mdi:shield-alert-outline"
          : "mdi:shield-check-outline",
    );
    this.elements.status.textContent = model.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : model.error || model.profileError
        ? "Security status is temporarily unavailable"
        : attentionCount > 0
          ? `${attentionCount} ${attentionCount === 1 ? "item needs" : "items need"} attention`
          : "All clear";

    const metrics = [
      {
        icon: "mdi:cctv",
        text: `${model.onlineCameras || 0}/${cameras.length} cameras`,
        attention: cameras.length > 0 && (model.onlineCameras || 0) < cameras.length,
      },
      {
        icon: "mdi:motion-sensor",
        text: `${activeDetections} active`,
        attention: activeDetections > 0,
      },
      {
        icon: "mdi:door",
        text: `${openEntries} open`,
        attention: openEntries > 0,
      },
    ];
    this.elements.metrics.replaceChildren(
      ...metrics.map((metric) => {
        const node = document.createElement("span");
        node.className = `metric ${metric.attention ? "attention" : ""}`;
        node.innerHTML = `<ha-icon></ha-icon><span></span>`;
        node.querySelector("ha-icon").setAttribute("icon", metric.icon);
        node.querySelector("span").textContent = metric.text;
        return node;
      }),
    );

    this.renderQuickActions(quickActions);
    this.renderCameras(cameras);
    this.renderEntries(entries);

    if (this.viewerDialog.open && this.viewerCameraId) {
      const current = cameras.find((camera) => camera.id === this.viewerCameraId);
      if (current) this.updateViewer(current);
      else this.viewerController.close();
    }
    if (this.settingsDialog.open && this.settingsCameraId) {
      const current = cameras.find((camera) => camera.id === this.settingsCameraId);
      if (current) this.renderSettings(current);
      else this.settingsController.close();
    }
  }

  renderQuickActions(actions) {
    this.destroyInteractions(this.surfaceInteractions);
    this.elements.quickGrid.replaceChildren();
    this.elements.quickSection.hidden = actions.length === 0;
    this.elements.quickMeta.textContent = actions.length
      ? `${actions.length} ${actions.length === 1 ? "action" : "actions"}`
      : "";

    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-action";
      button.disabled = !action.available;
      button.innerHTML =
        '<span class="quick-icon"><ha-icon></ha-icon></span><span><span class="quick-name"></span><span class="quick-state" role="status" aria-live="polite"></span></span>';
      button.querySelector("ha-icon").setAttribute("icon", action.icon);
      button.querySelector(".quick-name").textContent = action.name;
      button.querySelector(".quick-state").textContent = action.available ? "Run" : "Unavailable";
      button.setAttribute(
        "aria-label",
        `${action.name}. ${action.available ? "Run quick action" : "Unavailable"}.`,
      );
      this.surfaceInteractions.push(
        interaction(button, {
          primary: () => this.runQuickAction(action, button),
          singleFlight: true,
          feedback: true,
        }),
      );
      this.elements.quickGrid.append(button);
    }
  }

  async runQuickAction(action, button) {
    const state = button.querySelector(".quick-state");
    state.textContent = "Running…";
    try {
      await this._hass.callService(action.domain, action.service, {
        entity_id: action.entityId,
      });
      state.textContent = "Started";
    } catch (error) {
      state.textContent = error?.message || "Could not start";
      throw error;
    } finally {
      const timer = setTimeout(() => {
        this.quickResetTimers.delete(timer);
        if (button.isConnected) state.textContent = action.available ? "Run" : "Unavailable";
      }, 2600);
      this.quickResetTimers.add(timer);
    }
  }

  renderCameras(cameras) {
    const keep = new Set(cameras.map((camera) => camera.id));
    this.elements.cameraMeta.textContent = this.model?.error
      ? "Unavailable"
      : `${cameras.filter((camera) => camera.online).length}/${cameras.length} online`;
    this.elements.cameraEmpty.hidden = cameras.length > 0;
    // `.camera-empty` is a grid container by design, so make the hidden state
    // explicit when live cameras exist rather than relying on browser defaults.
    this.elements.cameraEmpty.style.display = cameras.length ? "none" : "";
    this.elements.cameraEmpty.textContent = this.model?.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : this.model?.error
        ? this.model.error.message || "Camera discovery is unavailable"
        : "No security cameras are configured";

    for (const camera of cameras) {
      let tile = this.cameraTiles.get(camera.id);
      if (!tile) {
        tile = this.createCameraTile(camera);
        this.cameraTiles.set(camera.id, tile);
      }
      tile.camera = camera;
      this.updateCameraTile(tile, camera);
      this.elements.cameraGrid.append(tile.root);
    }

    for (const [id, tile] of [...this.cameraTiles]) {
      if (keep.has(id)) continue;
      this.destroyCameraTile(tile);
      tile.root.remove();
      this.cameraTiles.delete(id);
    }
    this.refreshSnapshots();
  }

  createCameraTile(camera) {
    const root = document.createElement("article");
    root.className = "camera";
    root.innerHTML = `<button class="camera-media" type="button">
      <img alt="">
      <span class="camera-badge"><ha-icon icon="mdi:cctv"></ha-icon><span></span></span>
    </button>
    <div class="camera-copy">
      <div class="camera-title-row"><span class="camera-name"></span></div>
      <div class="camera-state"></div>
      <div class="classification-summary"></div>
    </div>
    <div class="camera-actions">
      <button class="camera-action primary live-action" type="button"><ha-icon icon="mdi:play-circle-outline"></ha-icon><span>Live</span></button>
      <button class="camera-action detections-action" type="button"><ha-icon icon="mdi:motion-sensor"></ha-icon><span>Detections</span></button>
      <button class="camera-action settings-action" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Settings</span></button>
    </div>`;
    const tile = {
      root,
      camera,
      image: root.querySelector("img"),
      interactions: [],
      lastSnapshotUrl: null,
    };
    tile.interactions.push(
      interaction(root.querySelector(".camera-media"), {
        primary: (event) => this.openViewer(tile.camera, event.currentTarget),
        feedback: true,
      }),
      interaction(root.querySelector(".live-action"), {
        primary: (event) => this.openViewer(tile.camera, event.currentTarget),
        feedback: true,
      }),
      interaction(root.querySelector(".detections-action"), {
        primary: (event) => this.openSettings(tile.camera, event.currentTarget, "detections"),
        feedback: true,
      }),
      interaction(root.querySelector(".settings-action"), {
        primary: (event) => this.openSettings(tile.camera, event.currentTarget, "controls"),
        feedback: true,
      }),
    );
    tile.image.addEventListener("error", () => {
      if (tile.lastSnapshotUrl && tile.image.src !== tile.lastSnapshotUrl) {
        tile.image.src = tile.lastSnapshotUrl;
      }
    });
    return tile;
  }

  updateCameraTile(tile, camera) {
    const media = tile.root.querySelector(".camera-media");
    const badge = tile.root.querySelector(".camera-badge");
    const classifications = camera.classifications || [];
    const capabilityCount =
      (camera.switches?.length || 0) +
      (camera.actions?.length || 0) +
      (camera.ptz?.length || 0);

    media.disabled = !camera.online;
    media.classList.toggle("offline", !camera.online);
    media.setAttribute("aria-label", `Open live view for ${camera.name}`);
    tile.root.querySelector(".camera-name").textContent = camera.name;
    tile.root.querySelector(".camera-state").textContent = camera.active
      ? "Activity detected"
      : camera.online
        ? "Online"
        : "Unavailable";
    tile.root.querySelector(".classification-summary").textContent = classifications.length
      ? `Recent: ${classifications.map((item) => item.name).join(" · ")}`
      : "No detection image entities";
    badge.classList.toggle("activity", camera.active);
    badge.querySelector("ha-icon").setAttribute(
      "icon",
      camera.active ? "mdi:motion-sensor" : "mdi:cctv",
    );
    badge.querySelector("span").textContent = camera.active
      ? "Activity"
      : camera.online
        ? "Live available"
        : "Offline";

    const live = tile.root.querySelector(".live-action");
    live.disabled = !camera.online;
    const detections = tile.root.querySelector(".detections-action");
    detections.disabled = !(classifications.length || camera.detections?.length);
    detections.setAttribute(
      "aria-label",
      `Open recent detections for ${camera.name}`,
    );
    const settings = tile.root.querySelector(".settings-action");
    settings.disabled = !camera.online && !capabilityCount;
    settings.setAttribute("aria-label", `Open settings for ${camera.name}`);
    tile.image.alt = `${camera.name} camera snapshot`;
  }

  destroyCameraTile(tile) {
    for (const handle of tile.interactions) handle.destroy();
    tile.interactions = [];
  }

  refreshSnapshots(force = false) {
    if (!this._hass || document.visibilityState === "hidden") return;
    for (const tile of this.cameraTiles.values()) {
      const camera = tile.camera;
      if (!camera?.online) continue;
      const state = this._hass.states?.[camera.entityId];
      const picture = state?.attributes?.entity_picture;
      if (!picture) continue;
      const base = this._hass.hassUrl ? this._hass.hassUrl(picture) : picture;
      const stamp = Math.floor(Date.now() / 10000);
      const url = `${base}${base.includes("?") ? "&" : "?"}_=${stamp}`;
      if (!force && tile.image.src === url) continue;
      tile.lastSnapshotUrl = tile.image.src || tile.lastSnapshotUrl;
      tile.image.src = url;
    }
  }

  renderEntries(entries) {
    this.elements.entrySection.hidden = entries.length === 0;
    this.elements.entryMeta.textContent = entries.length
      ? `${entries.filter((entry) => entry.available && entry.open).length} open`
      : "";
    this.elements.entries.replaceChildren();

    for (const entry of entries) {
      const row = document.createElement("article");
      row.className = "entry";
      const icon = this.entryIcon(entry);
      const actionLabel = this.entryActionLabel(entry);
      row.innerHTML = `<span class="entry-icon"><ha-icon></ha-icon></span>
        <span><span class="entry-name"></span><span class="entry-state"></span></span>
        <span class="entry-actions">
          <button class="entry-detail" type="button" aria-label="Open entity details"><ha-icon icon="mdi:information-outline"></ha-icon></button>
          <button class="entry-operate" type="button"></button>
        </span>`;
      row.querySelector(".entry-icon ha-icon").setAttribute("icon", icon);
      row.querySelector(".entry-icon").classList.toggle("attention", entry.open);
      row.querySelector(".entry-name").textContent = entry.name;
      row.querySelector(".entry-state").textContent = entry.available
        ? this.entryStateLabel(entry)
        : "Unavailable";
      const operate = row.querySelector(".entry-operate");
      operate.textContent = actionLabel;
      operate.disabled = !entry.available || !this.canOperateEntry(entry);
      operate.setAttribute("aria-label", `${actionLabel} ${entry.name}`);
      this.surfaceInteractions.push(
        interaction(row.querySelector(".entry-detail"), {
          primary: () => openMoreInfo(this, entry.entityId),
          feedback: true,
        }),
        interaction(operate, {
          primary: () => this.requestEntryOperation(entry, operate),
          singleFlight: true,
          feedback: true,
        }),
      );
      this.elements.entries.append(row);
    }
  }

  entryIcon(entry) {
    if (entry.domain === "lock") return entry.open ? "mdi:lock-open-outline" : "mdi:lock-outline";
    if (entry.deviceClass === "garage_door") return entry.open ? "mdi:garage-open" : "mdi:garage";
    if (entry.deviceClass === "window") return entry.open ? "mdi:window-open-variant" : "mdi:window-closed-variant";
    return entry.open ? "mdi:door-open" : "mdi:door-closed";
  }

  entryStateLabel(entry) {
    if (entry.domain === "lock") return entry.open ? "Unlocked" : "Locked";
    return entry.open ? "Open" : "Closed";
  }

  entryActionLabel(entry) {
    if (entry.domain === "lock") return entry.open ? "Lock" : "Unlock";
    return entry.open ? "Close" : "Open";
  }

  canOperateEntry(entry) {
    if (entry.controlEntityId && this._hass?.states?.[entry.controlEntityId]) return true;
    return ["lock", "cover"].includes(entry.domain);
  }

  async requestEntryOperation(entry, button) {
    if (this.entryConfirmId !== entry.entityId) {
      this.entryConfirmId = entry.entityId;
      button.textContent = "Confirm";
      button.classList.add("confirm");
      clearTimeout(this.entryConfirmTimer);
      this.entryConfirmTimer = setTimeout(() => {
        this.entryConfirmTimer = null;
        if (this.entryConfirmId === entry.entityId) this.entryConfirmId = null;
        if (button.isConnected) {
          button.textContent = this.entryActionLabel(entry);
          button.classList.remove("confirm");
        }
      }, 3000);
      return;
    }

    this.entryConfirmId = null;
    clearTimeout(this.entryConfirmTimer);
    this.entryConfirmTimer = null;
    button.classList.remove("confirm");
    button.textContent = "Working…";
    await this.runEntryOperation(entry);
    if (button.isConnected) button.textContent = "Done";
  }

  async runEntryOperation(entry) {
    if (entry.controlEntityId) {
      const domain = entry.controlEntityId.split(".")[0];
      if (domain === "button") {
        await this._hass.callService("button", "press", {
          entity_id: entry.controlEntityId,
        });
        return;
      }
      if (domain === "cover") {
        await this._hass.callService(
          "cover",
          entry.open ? "close_cover" : "open_cover",
          { entity_id: entry.controlEntityId },
        );
        return;
      }
      if (domain === "lock") {
        await this._hass.callService(
          "lock",
          entry.open ? "lock" : "unlock",
          { entity_id: entry.controlEntityId },
        );
        return;
      }
      await this._hass.callService("homeassistant", "toggle", {
        entity_id: entry.controlEntityId,
      });
      return;
    }
    if (entry.domain === "lock") {
      await this._hass.callService("lock", entry.open ? "lock" : "unlock", {
        entity_id: entry.entityId,
      });
    } else if (entry.domain === "cover") {
      await this._hass.callService(
        "cover",
        entry.open ? "close_cover" : "open_cover",
        { entity_id: entry.entityId },
      );
    }
  }

  openViewer(camera, trigger) {
    if (!camera?.online || !this._hass) return;
    this.viewerCameraId = camera.id;
    this.startViewer(camera);
    this.viewerController.open(trigger);
  }

  startViewer(camera) {
    this.stopViewer(false);
    const requestedEntityId = camera.streamEntityId || camera.entityId;
    const requestedState = this._hass.states?.[requestedEntityId];
    const fallbackState = this._hass.states?.[camera.entityId];
    const valid = (state) =>
      state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase());
    const stateObj = valid(requestedState) ? requestedState : fallbackState;
    this.elements.viewerTitle.textContent = `${camera.name} live`;
    this.elements.viewerBody.replaceChildren();
    if (!stateObj) {
      const message = document.createElement("div");
      message.className = "viewer-message";
      message.textContent = "Live stream is unavailable";
      this.elements.viewerBody.append(message);
      return;
    }

    const stream = document.createElement("ha-camera-stream");
    stream.className = "viewer-stream";
    stream.hass = this._hass;
    stream.stateObj = stateObj;
    stream.controls = true;
    stream.muted = true;
    this.viewerStream = stream;
    this.viewerEntityId = stateObj.entity_id || camera.entityId;
    const message = document.createElement("div");
    message.className = "viewer-message";
    message.textContent =
      requestedEntityId !== camera.entityId
        ? "Using configured high-resolution stream"
        : "Live";
    this.elements.viewerBody.append(stream, message);
  }

  updateViewer(camera) {
    this.elements.viewerTitle.textContent = `${camera.name} live`;
    if (!this.viewerStream) return;
    const entityId = camera.streamEntityId || camera.entityId;
    const stateObj = this._hass?.states?.[entityId] || this._hass?.states?.[camera.entityId];
    if (stateObj) {
      this.viewerStream.hass = this._hass;
      this.viewerStream.stateObj = stateObj;
    }
  }

  stopViewer(clearId = true) {
    this.viewerStream?.remove?.();
    this.viewerStream = null;
    this.viewerEntityId = null;
    this.elements?.viewerBody?.replaceChildren();
    if (clearId) this.viewerCameraId = null;
  }

  openViewerDetails() {
    const camera = this.findCamera(this.viewerCameraId);
    if (!camera) return;
    this.viewerController.close();
    queueMicrotask(() => openMoreInfo(this, camera.entityId));
  }

  switchViewerToSettings() {
    const camera = this.findCamera(this.viewerCameraId);
    if (!camera) return;
    const trigger = this.shadowRoot.querySelector(".viewer-settings");
    this.viewerController.close();
    queueMicrotask(() => this.openSettings(camera, trigger, "controls"));
  }

  openSettings(camera, trigger, focus = "controls") {
    if (!camera) return;
    this.settingsCameraId = camera.id;
    this.renderSettings(camera);
    this.settingsController.open(trigger);
    if (focus === "detections") {
      queueMicrotask(() =>
        this.elements.settingsBody.querySelector(".settings-group")?.scrollIntoView?.({
          block: "start",
        }),
      );
    }
  }

  switchSettingsToViewer() {
    const camera = this.findCamera(this.settingsCameraId);
    if (!camera?.online) return;
    const trigger = this.shadowRoot.querySelector(".settings-live");
    this.settingsController.close();
    queueMicrotask(() => this.openViewer(camera, trigger));
  }

  findCamera(id) {
    return (this.model?.cameras || []).find((camera) => camera.id === id) || null;
  }

  renderSettings(camera) {
    this.destroyInteractions(this.dialogInteractions);
    this.elements.settingsTitle.textContent = camera.name;
    this.elements.settingsBody.replaceChildren();
    const groups = document.createElement("div");
    groups.className = "settings-groups";
    this.elements.settingsBody.append(groups);

    const addGroup = (title, className = "") => {
      const section = document.createElement("section");
      section.className = "settings-group";
      const heading = document.createElement("div");
      heading.className = "settings-title";
      heading.textContent = title;
      const body = document.createElement("div");
      if (className) body.className = className;
      section.append(heading, body);
      groups.append(section);
      return body;
    };

    const classifications = camera.classifications || [];
    if (classifications.length) {
      const list = addGroup("Recent detections", "detections");
      for (const classification of classifications) {
        const entityId = classification.entity.entity_id;
        const state = this._hass.states?.[entityId];
        const picture = state?.attributes?.entity_picture;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "detection";
        button.setAttribute("aria-label", `Open latest ${classification.name} detection`);
        const image = document.createElement("img");
        image.alt = `Latest ${classification.name} detection`;
        image.loading = "lazy";
        if (picture) image.src = this._hass.hassUrl?.(picture) || picture;
        const copy = document.createElement("span");
        copy.className = "detection-copy";
        const name = document.createElement("span");
        name.className = "detection-name";
        name.textContent = classification.name;
        const time = document.createElement("span");
        time.className = "detection-time";
        const timestamp = state?.last_updated ? new Date(state.last_updated) : null;
        time.textContent =
          timestamp && Number.isFinite(timestamp.getTime())
            ? formatDate(this._hass, timestamp, {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : "No detection available";
        copy.append(name, time);
        button.append(image, copy);
        this.dialogInteractions.push(
          interaction(button, {
            primary: () => {
              this.settingsController.close();
              queueMicrotask(() => openMoreInfo(this, entityId));
            },
            feedback: true,
          }),
        );
        list.append(button);
      }
    }

    const detections = camera.detections || [];
    if (detections.length) {
      const list = addGroup("Detection status", "status-list");
      for (const entity of detections) {
        const state = this._hass.states?.[entity.entity_id];
        const available =
          state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase());
        const row = document.createElement("div");
        row.className = "status-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><span class="control-value"></span>';
        row.querySelector(".control-name").textContent =
          entity.name || entity.original_name || state?.attributes?.friendly_name || "Detection";
        row.querySelector(".control-state").textContent = available
          ? state.state === "on"
            ? "Detected"
            : "Clear"
          : "Unavailable";
        const value = row.querySelector(".control-value");
        value.textContent = available && state.state === "on" ? "Active" : available ? "Clear" : "—";
        value.classList.toggle("on", available && state.state === "on");
        list.append(row);
      }
    }

    const switches = camera.switches || [];
    if (switches.length) {
      const list = addGroup("Camera controls", "control-list");
      for (const capability of switches) {
        const entityId = capability.entity.entity_id;
        const state = this._hass.states?.[entityId];
        const available =
          state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase());
        const on = available && state.state === "on";
        const row = document.createElement("div");
        row.className = "control-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><button class="control-toggle" type="button"></button>';
        row.querySelector(".control-name").textContent = capability.role;
        row.querySelector(".control-state").textContent = available
          ? on
            ? "On"
            : "Off"
          : "Unavailable";
        const button = row.querySelector("button");
        button.textContent = on ? "Turn off" : "Turn on";
        button.disabled = !available;
        button.classList.toggle("on", on);
        button.setAttribute("aria-pressed", String(on));
        button.setAttribute(
          "aria-label",
          `${on ? "Turn off" : "Turn on"} ${capability.role}`,
        );
        this.dialogInteractions.push(
          interaction(button, {
            primary: () => this.toggleCameraSwitch(entityId, on),
            hold: () => {
              this.settingsController.close();
              queueMicrotask(() => openMoreInfo(this, entityId));
            },
            singleFlight: true,
            feedback: true,
          }),
        );
        list.append(row);
      }
    }

    const actions = camera.actions || [];
    const ptz = camera.ptz || [];
    if (actions.length || ptz.length) {
      const list = addGroup("Advanced controls", "control-list");
      for (const action of actions) {
        const entityId = action.entity.entity_id;
        const row = document.createElement("div");
        row.className = "control-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><button class="control-toggle" type="button">Run</button>';
        row.querySelector(".control-name").textContent =
          action.entity.name || action.entity.original_name || action.role;
        row.querySelector(".control-state").textContent = "Action";
        this.dialogInteractions.push(
          interaction(row.querySelector("button"), {
            primary: () =>
              this._hass.callService("button", "press", { entity_id: entityId }),
            hold: () => openMoreInfo(this, entityId),
            singleFlight: true,
            feedback: true,
          }),
        );
        list.append(row);
      }
      for (const entity of ptz) {
        const row = document.createElement("div");
        row.className = "control-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><button class="control-toggle" type="button">Open</button>';
        row.querySelector(".control-name").textContent =
          entity.name || entity.original_name || "PTZ";
        row.querySelector(".control-state").textContent =
          this._hass.states?.[entity.entity_id]?.state || "Control";
        this.dialogInteractions.push(
          interaction(row.querySelector("button"), {
            primary: () => {
              this.settingsController.close();
              queueMicrotask(() => openMoreInfo(this, entity.entity_id));
            },
            feedback: true,
          }),
        );
        list.append(row);
      }
    }

    const footer = addGroup("Camera", "settings-footer");
    const details = document.createElement("button");
    details.type = "button";
    details.className = "footer-action";
    details.innerHTML = '<ha-icon icon="mdi:information-outline"></ha-icon><span>Home Assistant details</span>';
    const live = document.createElement("button");
    live.type = "button";
    live.className = "footer-action";
    live.disabled = !camera.online;
    live.innerHTML = '<ha-icon icon="mdi:play-circle-outline"></ha-icon><span>Open live view</span>';
    this.dialogInteractions.push(
      interaction(details, {
        primary: () => {
          this.settingsController.close();
          queueMicrotask(() => openMoreInfo(this, camera.entityId));
        },
        feedback: true,
      }),
      interaction(live, {
        primary: () => this.switchSettingsToViewer(),
        feedback: true,
      }),
    );
    footer.append(details, live);
  }

  async toggleCameraSwitch(entityId, currentlyOn) {
    await this._hass.callService("switch", currentlyOn ? "turn_off" : "turn_on", {
      entity_id: entityId,
    });
    await this.refresh();
  }
}

registerCard({
  type: "component-security-dashboard-v1",
  element: ComponentSecurityDashboardV1,
  name: "Security Dashboard V1",
  description: "Single-owner Security dashboard with on-demand live video, detections, controls, quick actions and entry points.",
});
