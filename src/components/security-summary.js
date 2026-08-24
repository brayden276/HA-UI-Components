/** ComponentSecuritySummaryV1 — exception-first household Security status. */
const { interaction, loadSecurityModel, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecuritySummaryV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.sequence = 0;
    this.interactions = [];
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .wrap{padding:12px 14px}.top{min-height:44px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px}.icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--secondary-background-color);color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:22px}.ok .icon{color:var(--primary-color)}
      .copy{min-width:0}.title,.detail{display:block}.title{font-size:15px;line-height:1.2;font-weight:650}.detail{margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.3}.count{font-size:13px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.attention{display:grid;gap:6px;margin-top:8px}.attention:empty{display:none}.attention button{appearance:none;width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:12px;background:transparent;color:inherit;font:inherit;text-align:left;display:flex;align-items:center;gap:8px;cursor:pointer}.attention button:hover{background:var(--secondary-background-color)}.attention button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.attention ha-icon{--mdc-icon-size:18px;color:var(--warning-color,var(--primary-color))}.attention span{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .error{color:var(--error-color)}@media(max-width:420px){.wrap{padding:12px}.count{display:none}}
    </style><ha-card><div class="wrap"><div class="top"><span class="icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><span class="copy"><span class="title">Security</span><span class="detail">Loading household status…</span></span><span class="count"></span></div><div class="attention"></div></div></ha-card>`;
    this.elements = { wrap: this.shadowRoot.querySelector(".wrap"), icon: this.shadowRoot.querySelector(".icon ha-icon"), title: this.shadowRoot.querySelector(".title"), detail: this.shadowRoot.querySelector(".detail"), count: this.shadowRoot.querySelector(".count"), attention: this.shadowRoot.querySelector(".attention") };
  }
  setConfig(config) { this.config = { profile: "household-security", title: "Security", ...(config || {}) }; this.refresh(); }
  set hass(hass) { this._hass = hass; this.refresh(); }
  connectedCallback() { window.addEventListener("ha-component-profile-change", this.profileListener); this.refresh(); }
  disconnectedCallback() { window.removeEventListener("ha-component-profile-change", this.profileListener); for (const handle of this.interactions) handle.destroy(); this.interactions = []; }
  getCardSize() { return 2; }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence === this.sequence) { this.model = model; this.render(); }
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error, cameras: [], entries: [], attention: [] }; this.render(); }
    }
  }
  render() {
    if (!this.model || !this.elements) return;
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    const model = this.model, error = model.error || model.profileError;
    this.elements.title.textContent = this.config.title;
    this.elements.wrap.classList.toggle("ok", !error && model.allClear);
    this.elements.detail.classList.toggle("error", Boolean(error));
    this.elements.icon.setAttribute("icon", error ? "mdi:shield-alert-outline" : model.allClear ? "mdi:shield-check-outline" : "mdi:shield-alert-outline");
    this.elements.detail.textContent = model.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : error ? (error.message || "Security status is unavailable")
        : model.allClear ? "All clear" : `${model.attention.length} item${model.attention.length === 1 ? "" : "s"} need attention`;
    this.elements.count.textContent = error ? "Unavailable" : `${model.onlineCameras || 0}/${model.cameras.length} cameras online`;
    this.elements.attention.replaceChildren();
    for (const item of (model.attention || []).slice(0, 4)) {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = '<ha-icon icon="mdi:alert-circle-outline"></ha-icon><span></span>';
      button.querySelector("span").textContent = item.label;
      button.setAttribute("aria-label", `${item.label}. Open details.`);
      this.interactions.push(interaction(button, { primary: () => openMoreInfo(this, item.entityId), feedback: true }));
      this.elements.attention.append(button);
    }
  }
}

registerCard({ type: "component-security-summary-v1", element: ComponentSecuritySummaryV1, name: "Security Summary V1", description: "Exception-first all-clear and attention summary discovered from Home Assistant capabilities." });
