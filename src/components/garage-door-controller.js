/** ComponentGarageDoorControllerV1 — state-led garage-door control card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const GARAGE_INVALID = new Set(["unknown", "unavailable", "none", ""]);

class ComponentGarageDoorControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.signature = "";
    this.pendingTargetOpen = null;
    this.confirmedTargetOpen = null;
    this.confirmTimer = null;
    this.confirmationTimer = null;
    this.message = "";
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("A garage-door state entity is required");
    if (!config?.control_entity) throw new Error("A garage-door control entity is required");
    this.clearConfirmation();
    this.clearPending();
    this.message = "";
    this.config = { ...config };
    this.signature = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    this.syncPending();
    const signature = this.stateSignature();
    if (signature !== this.signature) {
      this.signature = signature;
      this.render();
    }
  }

  disconnectedCallback() {
    clearTimeout(this.confirmTimer);
    clearTimeout(this.confirmationTimer);
    this.confirmTimer = null;
    this.confirmationTimer = null;
    this.pendingTargetOpen = null;
    this.confirmedTargetOpen = null;
    this.message = "";
  }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{appearance:none;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px;border-left:2px solid transparent}.w:has(.well.open){border-left-color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)));background:var(--dashboard-warning-surface,var(--card-background-color))}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.identity{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.well{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.well.open{color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)))}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:650}.state{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.action{min-width:104px;height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--primary-color);font-size:13px;font-weight:650}.action.confirm{border-color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color));color:var(--primary-color)}.action.pending{color:var(--secondary-text-color)}button[disabled],button[aria-disabled=true]{opacity:.5;cursor:default}.feedback{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.feedback:not(:empty){margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color)}.feedback.error{color:var(--error-color)}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:340px){.row{grid-template-columns:1fr}.action{width:100%}}
    </style><ha-card><div class="w"><div class="row"><button class="identity" type="button"><span class="well"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="state" role="status" aria-live="polite"></span></span></button><button class="action" type="button"><ha-icon></ha-icon><span></span></button></div><p class="feedback" role="status" aria-live="polite"></p></div></ha-card>`;
    this.elements = {
      identity: this.shadowRoot.querySelector(".identity"),
      well: this.shadowRoot.querySelector(".well"),
      doorIcon: this.shadowRoot.querySelector(".well ha-icon"),
      name: this.shadowRoot.querySelector(".name"),
      state: this.shadowRoot.querySelector(".state"),
      action: this.shadowRoot.querySelector(".action"),
      actionIcon: this.shadowRoot.querySelector(".action ha-icon"),
      actionLabel: this.shadowRoot.querySelector(".action span"),
      feedback: this.shadowRoot.querySelector(".feedback"),
    };
    this.elements.identity.addEventListener("click", () => this.openDetails());
    this.elements.action.addEventListener("click", () => this.requestAction());
  }

  entityState(entityId) { return entityId ? this._hass?.states?.[entityId] ?? null : null; }
  isKnown(state) { return Boolean(state && !GARAGE_INVALID.has(String(state.state).toLowerCase())); }
  stateSignature() { return JSON.stringify([this.config.entity, this.config.control_entity, this.config.availability_entity].filter(Boolean).map((entityId) => { const state = this.entityState(entityId); return [entityId, state?.state, state?.attributes]; })); }

  status() {
    const state = this.entityState(this.config.entity);
    const control = this.entityState(this.config.control_entity);
    const availability = this.entityState(this.config.availability_entity);
    const unavailable = (this.config.availability_entity && (!availability || availability.state !== "on")) || !state || state.state === "unavailable" || !control || control.state === "unavailable";
    const known = this.isKnown(state) && ["on", "off"].includes(state.state);
    return { state, control, unavailable, known, open: known && state.state === "on" };
  }

  syncPending() {
    const status = this.status();
    if (this.confirmedTargetOpen !== null && (status.unavailable || !status.known || this.confirmedTargetOpen !== !status.open)) {
      this.clearConfirmation();
      this.message = status.unavailable || !status.known ? "" : "Door state changed. Review the new action.";
    }
    if (!this.pendingTargetOpen) return;
    const pending = this.pendingTargetOpen;
    if (status.known && status.open === pending.targetOpen) {
      this.clearPending();
      this.message = pending.targetOpen ? "Door opened." : "Door closed.";
    } else if (status.unavailable) {
      this.clearPending();
      this.message = "Controller disconnected before the movement was confirmed.";
    }
  }

  render() {
    const status = this.status();
    const name = this.config.title || status.state?.attributes?.friendly_name?.replace(/ Garage Door Status$/, "") || "Garage door";
    this.elements.name.textContent = name;
    this.elements.identity.setAttribute("aria-label", `Open details for ${name}`);
    this.elements.well.classList.toggle("open", status.open);
    this.elements.doorIcon.setAttribute("icon", status.unavailable || !status.known ? "mdi:garage-alert" : status.open ? "mdi:garage-open" : "mdi:garage");
    let displayState = status.unavailable ? "Controller unavailable" : status.known ? status.open ? "Open" : "Closed" : "Door state unknown";
    if (this.pendingTargetOpen) displayState = `${this.pendingTargetOpen.targetOpen ? "Opening" : "Closing"} requested`;
    this.elements.state.textContent = displayState;
    const nextOpen = status.known ? !status.open : null;
    const action = nextOpen === null ? status.unavailable ? "Unavailable" : "State unknown" : nextOpen ? "Open" : "Close";
    const disabled = status.unavailable || !status.known;
    const ariaDisabled = disabled || Boolean(this.pendingTargetOpen);
    this.elements.action.disabled = disabled;
    this.elements.action.setAttribute("aria-disabled", String(ariaDisabled));
    this.elements.action.classList.toggle("confirm", this.confirmedTargetOpen !== null);
    this.elements.action.classList.toggle("pending", Boolean(this.pendingTargetOpen));
    this.elements.actionIcon.setAttribute("icon", this.pendingTargetOpen ? "mdi:progress-clock" : this.confirmedTargetOpen !== null ? "mdi:check" : nextOpen === null ? "mdi:garage-alert" : nextOpen ? "mdi:garage-open" : "mdi:garage");
    this.elements.actionLabel.textContent = this.pendingTargetOpen ? "Waiting" : this.confirmedTargetOpen !== null ? `Confirm ${action.toLowerCase()}` : action;
    this.elements.action.setAttribute("aria-label", ariaDisabled ? displayState : this.confirmedTargetOpen !== null ? `Confirm ${action.toLowerCase()} garage door` : `${action} garage door`);
    this.elements.feedback.textContent = this.message;
    this.elements.feedback.classList.toggle("error", /did not|disconnected|failed/i.test(this.message));
  }

  async requestAction() {
    const status = this.status();
    if (status.unavailable || !status.known || this.pendingTargetOpen) return;
    const targetOpen = !status.open;
    if (this.confirmedTargetOpen === null) {
      this.confirmedTargetOpen = targetOpen;
      this.message = `Press again to ${targetOpen ? "open" : "close"} the door.`;
      clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(() => { this.clearConfirmation(); this.message = ""; this.render(); }, 5000);
      this.render();
      return;
    }
    if (this.confirmedTargetOpen !== targetOpen) {
      this.clearConfirmation();
      this.message = "Door state changed. Review the new action.";
      this.render();
      return;
    }
    this.clearConfirmation();
    this.message = "";
    this.pendingTargetOpen = { targetOpen, started: Date.now() };
    this.render();
    try {
      await this._hass.callService("button", "press", { entity_id: this.config.control_entity });
      if (!this.pendingTargetOpen) return;
      const configuredTimeout = Number(this.config.confirmation_timeout);
      const timeout = Number.isFinite(configuredTimeout) && configuredTimeout >= 5000 && configuredTimeout <= 120000 ? configuredTimeout : 30000;
      this.confirmationTimer = setTimeout(() => {
        if (!this.pendingTargetOpen) return;
        this.clearPending();
        this.message = "The door did not change within the expected time.";
        this.render();
      }, timeout);
    } catch {
      if (!this.pendingTargetOpen) return;
      this.clearPending();
      this.message = "The garage-door command failed.";
      this.render();
    }
  }

  clearPending() { clearTimeout(this.confirmationTimer); this.confirmationTimer = null; this.pendingTargetOpen = null; }
  clearConfirmation() { clearTimeout(this.confirmTimer); this.confirmTimer = null; this.confirmedTargetOpen = null; }
  openDetails() { openMoreInfo(this, this.config.entity); }
  getCardSize() { return 1; }
}

registerCard({ type: "component-garage-door-controller-v1", element: ComponentGarageDoorControllerV1, name: "Garage Door Controller", description: "A state-led garage-door controller for a reed sensor and momentary trigger." });
