/** ComponentSecurityDashboardV1 — thin Security composition wrapper. */
const {
  createOverlayController,
  interaction,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._children = new Map();
    this.interactions = [];
    this.viewerStream = null;
    this.viewerEntityId = null;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}.layout{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.entries:has(> [hidden]){display:none}
      .overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:12px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,rgba(0,0,0,.42)));overscroll-behavior:contain}.sheet{width:min(600px,calc(100vw - 24px));max-height:calc(100dvh - 24px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,var(--ha-card-border-radius,16px));background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.24))}.head{flex:0 0 auto;min-height:56px;padding:6px 7px 6px 14px;border-bottom:1px solid var(--divider-color);display:flex;align-items:center;gap:8px}.title{min-width:0;flex:1;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.head-action,.close{appearance:none;min-width:44px;height:44px;padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color);display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}.head-action:hover,.close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.head-action:focus-visible,.close:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.head-action ha-icon,.close ha-icon{--mdc-icon-size:20px}.head-action span{font-size:13px;font-weight:600}.body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}
      .viewer-overlay{background:color-mix(in srgb,var(--dashboard-media-surface,#111) 84%,transparent)}.viewer-sheet{width:min(1120px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}.viewer-body{position:relative;min-height:0;aspect-ratio:16/9;display:grid;place-items:center;overflow:hidden;background:var(--dashboard-media-surface,#111)}.viewer-stream{display:block;width:100%;height:100%;min-height:0;color:var(--dashboard-media-on-surface,#fff)}
      @media(max-width:700px){.overlay{padding:0}.sheet{width:100vw;max-width:100vw;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.viewer-sheet{height:100dvh;max-height:100dvh;margin:0;border-width:0;border-radius:0}.viewer-body{flex:1 1 auto;aspect-ratio:auto}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}.head-action span{display:none}.head-action{padding:0}}
    </style><div class="layout"><div class="summary"></div><div class="wall"></div><div class="entries"></div></div>
    <section class="overlay controls-overlay" role="dialog" aria-modal="true" aria-labelledby="security-controls-title" hidden><div class="sheet controls-sheet"><div class="head"><span class="title controls-title" id="security-controls-title">Camera settings</span><button class="close controls-close" type="button" aria-label="Close camera settings"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body controls-body"></div></div></section>
    <section class="overlay viewer-overlay" role="dialog" aria-modal="true" aria-labelledby="security-viewer-title" hidden><div class="sheet viewer-sheet"><div class="head"><span class="title viewer-title" id="security-viewer-title">Camera</span><button class="head-action viewer-details" type="button"><ha-icon icon="mdi:information-outline"></ha-icon><span>Details</span></button><button class="close viewer-close" type="button" aria-label="Close camera viewer"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="viewer-body"></div></div></section>`;
    this.controlsOverlay = this.shadowRoot.querySelector(".controls-overlay");
    this.viewerOverlay = this.shadowRoot.querySelector(".viewer-overlay");
    this.controlsController = createOverlayController(this, this.controlsOverlay, {
      initialFocus: () => this.shadowRoot.querySelector(".controls-close"),
      onDismiss: () => this.closeCameraControls(),
    });
    this.viewerController = createOverlayController(this, this.viewerOverlay, {
      initialFocus: () => this.shadowRoot.querySelector(".viewer-close"),
      onDismiss: () => this.closeCameraViewer(),
    });
  }

  setConfig(config) {
    this.config = { profile: "household-security", camera_columns: 2, ...(config || {}) };
    this.ensure();
  }

  set hass(hass) {
    this._hass = hass;
    for (const child of this._children.values()) child.hass = hass;
    if (this.viewerStream && this.viewerEntityId) {
      this.viewerStream.hass = hass;
      this.viewerStream.stateObj = hass?.states?.[this.viewerEntityId];
    }
  }

  connectedCallback() { this.bind(); this.ensure(); }

  disconnectedCallback() {
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this.closeCameraControls(false);
    this.closeCameraViewer(false);
  }

  getCardSize() { return 12; }

  bind() {
    if (this.interactions.length) return;
    this.interactions.push(
      interaction(this.shadowRoot.querySelector(".controls-close"), { primary: () => this.closeCameraControls(), feedback: true }),
      interaction(this.shadowRoot.querySelector(".viewer-close"), { primary: () => this.closeCameraViewer(), feedback: true }),
      interaction(this.shadowRoot.querySelector(".viewer-details"), { primary: () => openMoreInfo(this, this.viewerEntityId), feedback: true }),
    );
  }

  ensure() {
    if (!this.config) return;
    let summary = this._children.get("summary");
    if (!summary) {
      summary = document.createElement("component-security-summary-v1");
      this.shadowRoot.querySelector(".summary").append(summary);
      this._children.set("summary", summary);
    }
    summary.setConfig({ profile: this.config.profile });

    let wall = this._children.get("wall");
    if (!wall) {
      wall = document.createElement("component-security-camera-wall-v3");
      wall.addEventListener("security-camera-view-request", (event) => this.openCameraViewer(event.detail));
      wall.addEventListener("security-camera-control-request", (event) => this.openCameraControls(event.detail));
      this.shadowRoot.querySelector(".wall").append(wall);
      this._children.set("wall", wall);
    }
    wall.setConfig({ profile: this.config.profile, columns: this.config.camera_columns });

    let entries = this._children.get("entries");
    if (!entries) {
      entries = document.createElement("component-security-entry-points-v1");
      this.shadowRoot.querySelector(".entries").append(entries);
      this._children.set("entries", entries);
    }
    entries.setConfig({ profile: this.config.profile });
    for (const child of [summary, wall, entries]) if (this._hass) child.hass = this._hass;
  }

  openCameraControls(detail) {
    const camera = detail?.camera;
    if (!camera) return;
    this.closeCameraViewer(false);
    let controller = this._children.get("camera-controller");
    if (!controller) {
      controller = document.createElement("component-camera-controller-v2");
      controller.addEventListener("security-camera-view-request", (event) => this.openCameraViewer(event.detail));
      this._children.set("camera-controller", controller);
      this.shadowRoot.querySelector(".controls-body").append(controller);
    }
    controller.setConfig({
      profile: this.config.profile,
      entity: camera.entityId,
      device_id: camera.deviceId,
      expanded: true,
      title: camera.name,
    });
    if (this._hass) controller.hass = this._hass;
    this.shadowRoot.querySelector(".controls-title").textContent = `${camera.name} settings`;
    this.controlsController.open(detail.trigger);
  }

  closeCameraControls(restoreFocus = true) {
    this.controlsController.close(restoreFocus);
  }

  openCameraViewer(detail) {
    const camera = detail?.camera;
    if (!camera || !this._hass) return;
    this.closeCameraControls(false);
    this.stopViewer();
    const requestedEntityId = camera.streamEntityId || camera.entityId;
    const requestedState = this._hass.states?.[requestedEntityId];
    const fallbackState = this._hass.states?.[camera.entityId];
    const stateObj = requestedState && !["unknown", "unavailable"].includes(String(requestedState.state).toLowerCase())
      ? requestedState
      : fallbackState;
    if (!stateObj) return openMoreInfo(this, camera.entityId);
    const stream = document.createElement("ha-camera-stream");
    stream.className = "viewer-stream";
    stream.hass = this._hass;
    stream.stateObj = stateObj;
    stream.controls = true;
    stream.muted = true;
    this.viewerStream = stream;
    this.viewerEntityId = stateObj.entity_id || camera.entityId;
    this.shadowRoot.querySelector(".viewer-title").textContent = `${camera.name} live`;
    this.shadowRoot.querySelector(".viewer-details").setAttribute("aria-label", `Open details for ${camera.name}`);
    this.shadowRoot.querySelector(".viewer-body").replaceChildren(stream);
    this.viewerController.open(detail.trigger);
  }

  closeCameraViewer(restoreFocus = true) {
    this.viewerController.close(restoreFocus);
    this.stopViewer();
  }

  stopViewer() {
    this.viewerStream?.remove?.();
    this.viewerStream = null;
    this.viewerEntityId = null;
    this.shadowRoot.querySelector(".viewer-body")?.replaceChildren();
  }
}

registerCard({ type: "component-security-dashboard-v1", element: ComponentSecurityDashboardV1, name: "Security Dashboard V1", description: "Single-card capability-driven Security dashboard composition." });
