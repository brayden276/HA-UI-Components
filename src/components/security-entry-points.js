/** ComponentSecurityEntryPointsV1 — capability-driven doors, garage and locks. */
const { interaction, loadSecurityModel, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityEntryPointsV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.sequence = 0;
    this.interactions = [];
    // `children` is a read-only HTMLElement API. Only nested custom cards
    // need to be retained here, so use a private collection.
    this._children = [];
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}.head{min-height:32px;padding:0 2px;display:flex;align-items:center;margin-bottom:8px}h2{margin:0;font-size:15px;line-height:1.2;font-weight:600}.list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.entry{appearance:none;min-width:0;min-height:60px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.entry:hover{background:var(--secondary-background-color)}.entry:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.icon{width:36px;height:36px;display:grid;place-items:center;color:var(--secondary-text-color)}.open .icon{color:var(--warning-color,var(--primary-color))}.icon ha-icon{--mdc-icon-size:21px}.copy{min-width:0}.name,.state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name{font-size:13px;font-weight:650}.state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}@media(max-width:700px){.list{grid-template-columns:1fr}}
    </style><div class="head"><h2>Entry points</h2></div><div class="list"></div>`;
    this.list = this.shadowRoot.querySelector(".list");
  }
  setConfig(config) { this.config = { profile: "household-security", title: "Entry points", ...(config || {}) }; this.shadowRoot.querySelector("h2").textContent = this.config.title; this.refresh(); }
  set hass(hass) { this._hass = hass; for (const child of this._children) child.hass = hass; this.refresh(); }
  connectedCallback() { window.addEventListener("ha-component-profile-change", this.profileListener); this.refresh(); }
  disconnectedCallback() { window.removeEventListener("ha-component-profile-change", this.profileListener); this.clear(); }
  getCardSize() { return this.hidden ? 0 : 3; }
  clear() {
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this._children = [];
    this.list.replaceChildren();
  }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence === this.sequence) { this.model = model; this.render(); }
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error, entries: [] }; this.render(); }
    }
  }
  render() {
    this.clear();
    const entries = this.model?.entries || [];
    this.hidden = entries.length === 0;
    for (const entry of entries) {
      if (entry.deviceClass === "garage_door" && entry.controlEntityId) {
        const controller = document.createElement("component-garage-door-controller-v1");
        controller.setConfig({ entity: entry.entityId, control_entity: entry.controlEntityId, title: entry.name });
        controller.hass = this._hass;
        this._children.push(controller);
        this.list.append(controller);
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = `entry ${entry.open ? "open" : ""}`;
      const icon = entry.domain === "lock" ? (entry.open ? "mdi:lock-open-outline" : "mdi:lock-outline") : entry.deviceClass === "window" ? "mdi:window-closed-variant" : "mdi:door-closed";
      button.innerHTML = `<span class="icon"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="state"></span></span>`;
      button.querySelector("ha-icon").setAttribute("icon", icon);
      button.querySelector(".name").textContent = entry.name;
      button.querySelector(".state").textContent = !entry.available ? "Unavailable" : entry.domain === "lock" ? entry.open ? "Unlocked" : "Locked" : entry.open ? "Open" : "Closed";
      button.setAttribute("aria-label", `${entry.name}, ${button.querySelector(".state").textContent}. Open details.`);
      button.disabled = !entry.available;
      this.interactions.push(interaction(button, { primary: () => openMoreInfo(this, entry.entityId), feedback: true }));
      this.list.append(button);
    }
  }
}

registerCard({ type: "component-security-entry-points-v1", element: ComponentSecurityEntryPointsV1, name: "Security Entry Points V1", description: "Capability-driven garage, door, window and lock status using the shared garage controller where available." });
