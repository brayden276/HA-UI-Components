/** ComponentSecurityDashboardV1 — thin Security composition wrapper. */
const { createDialogController, interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // `children` is a read-only HTMLElement API. Keep composed cards in a
    // private map so construction works in every supported browser.
    this._children = new Map();
    this.interactions = [];
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}.layout{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.entries:has(> [hidden]){display:none}
      dialog{width:min(600px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:0;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,16px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 16px 48px rgba(0,0,0,.24);overflow:hidden}dialog::backdrop{background:rgba(0,0,0,.32);backdrop-filter:blur(3px)}.sheet{display:flex;flex-direction:column;max-height:calc(100dvh - 24px)}.head{min-height:56px;padding:6px 7px 6px 14px;border-bottom:1px solid var(--divider-color);display:flex;align-items:center;gap:8px}.title{min-width:0;flex:1;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.close{appearance:none;width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.close:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.close ha-icon{--mdc-icon-size:20px}.body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}
      @media(max-width:520px){dialog{width:100vw;max-width:100vw;max-height:90dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.sheet{max-height:90dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}}
    </style><div class="layout"><div class="summary"></div><div class="wall"></div><div class="entries"></div></div><dialog><div class="sheet"><div class="head"><span class="title">Camera controls</span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"></div></div></dialog>`;
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.dialogController = createDialogController(this, this.dialog, { initialFocus: () => this.shadowRoot.querySelector(".close") });
  }
  setConfig(config) {
    this.config = { profile: "household-security", camera_columns: 2, ...(config || {}) };
    this.ensure();
  }
  set hass(hass) { this._hass = hass; for (const child of this._children.values()) child.hass = hass; }
  connectedCallback() { this.bind(); this.ensure(); }
  disconnectedCallback() { for (const handle of this.interactions) handle.destroy(); this.interactions = []; if (this.dialog.open) this.dialog.close(); }
  getCardSize() { return 12; }
  bind() {
    if (this.interactions.length) return;
    this.interactions.push(interaction(this.shadowRoot.querySelector(".close"), { primary: () => this.dialogController.close(), feedback: true }));
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
    let controller = this._children.get("camera-controller");
    if (!controller) {
      controller = document.createElement("component-camera-controller-v2");
      this._children.set("camera-controller", controller);
      this.shadowRoot.querySelector(".body").append(controller);
    }
    controller.setConfig({ profile: this.config.profile, entity: camera.entityId, device_id: camera.deviceId, expanded: true, title: camera.name });
    if (this._hass) controller.hass = this._hass;
    this.shadowRoot.querySelector(".title").textContent = `${camera.name} controls`;
    this.dialogController.open(detail.trigger);
  }
}

registerCard({ type: "component-security-dashboard-v1", element: ComponentSecurityDashboardV1, name: "Security Dashboard V1", description: "Single-card capability-driven Security dashboard composition." });
