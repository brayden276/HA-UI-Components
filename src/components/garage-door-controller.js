/** ComponentGarageDoorControllerV1 — momentary garage-door operator card. */
const { interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentGarageDoorControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.signature = "";
    this.busy = false;
    this.pendingLabel = "";
    this.message = "";
    this.messageType = "info";
    this.messageTimer = null;
    this.confirmation = null;
    this.interactions = [];
    this.requestGeneration = 0;
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("A garage-door state entity is required");
    if (!config?.control_entity) throw new Error("A garage-door control entity is required");
    clearTimeout(this.messageTimer);
    this.messageTimer = null;
    this.requestGeneration += 1;
    this.cancelConfirmation(new Error("Garage configuration changed"));
    this.busy = false;
    this.pendingLabel = "";
    this.message = "";
    this.messageType = "info";
    const configuredTimeout = config.confirmation_timeout ?? config.confirm_timeout;
    this.config = {
      ...config,
      confirmation_timeout: Math.max(3000, Number(configuredTimeout) || 20000),
    };
    this.signature = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    this.checkConfirmation();
    const signature = this.stateSignature();
    if (signature !== this.signature) {
      this.signature = signature;
      this.render();
    }
  }

  connectedCallback() {
    if (!this.config) return;
    // Lovelace may retain the element while disconnecting it. Recreate the
    // fixed button bindings instead of showing a visually intact dead card.
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this.built = false;
    this.build();
    this.signature = "";
    this.render();
  }

  disconnectedCallback() {
    clearTimeout(this.messageTimer);
    this.messageTimer = null;
    this.requestGeneration += 1;
    this.cancelConfirmation(new Error("Garage controller disconnected"));
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this.busy = false;
    this.pendingLabel = "";
    this.message = "";
    this.messageType = "info";
  }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{appearance:none;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px;border-left:2px solid transparent}.w:has(.well.not-closed){border-left-color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)));background:var(--dashboard-warning-surface,var(--card-background-color))}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.identity{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.well{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.well.not-closed{color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)))}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:650}.state{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.action{min-width:104px;height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--primary-color);font-size:13px;font-weight:650}.action.pending{color:var(--secondary-text-color)}button[disabled],button[aria-disabled=true]{opacity:.5;cursor:default}.feedback{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.feedback:not(:empty){margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color)}.feedback.error{color:var(--error-color)}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:340px){.row{grid-template-columns:1fr}.action{width:100%}}
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
    this.interactions.push(
      interaction(this.elements.identity, { primary: () => this.openDetails(), optimistic: false, repeat: false, feedback: true }),
      interaction(this.elements.action, { primary: () => this.requestAction(), optimistic: false, repeat: false, feedback: true }),
    );
  }

  entityState(entityId) { return entityId ? this._hass?.states?.[entityId] ?? null : null; }

  stateSignature() {
    return JSON.stringify(
      [this.config.entity, this.config.control_entity, this.config.availability_entity]
        .filter(Boolean)
        .map((entityId) => {
          const state = this.entityState(entityId);
          return [entityId, state?.state, state?.attributes];
        }),
    );
  }

  status() {
    const state = this.entityState(this.config.entity);
    const control = this.entityState(this.config.control_entity);
    const availability = this.entityState(this.config.availability_entity);
    const controllerUnavailable =
      (this.config.availability_entity && (!availability || availability.state !== "on")) ||
      !control || String(control.state).toLowerCase() === "unavailable";
    const reed = String(state?.state || "unknown").toLowerCase();
    const known = reed === "on" || reed === "off";
    const closed = known && reed === "off";
    const notClosed = known && reed === "on";
    const stateUnavailable = !state || reed === "unavailable";
    return { state, control, controllerUnavailable, stateUnavailable, known, closed, notClosed, reed };
  }

  render() {
    const status = this.status();
    const name = this.config.title || status.state?.attributes?.friendly_name?.replace(/ Garage Door Status$/, "") || "Garage door";
    const displayState = status.controllerUnavailable ? "Controller unavailable" : status.closed ? "Closed" : status.notClosed ? "Not closed" : status.stateUnavailable ? "Door state unavailable" : "Door state unknown";
    const action = status.closed ? "Open" : "Trigger";
    const disabled = status.controllerUnavailable || this.busy;
    this.elements.name.textContent = name;
    this.elements.identity.setAttribute("aria-label", `Open details for ${name}`);
    this.elements.well.classList.toggle("not-closed", status.notClosed);
    this.elements.doorIcon.setAttribute("icon", status.controllerUnavailable || !status.known ? "mdi:garage-alert" : status.notClosed ? "mdi:garage-open" : "mdi:garage");
    this.elements.state.textContent = displayState;
    this.elements.action.disabled = disabled;
    this.elements.action.setAttribute("aria-disabled", String(disabled));
    this.elements.action.classList.toggle("pending", this.busy);
    this.elements.actionIcon.setAttribute("icon", this.busy ? "mdi:progress-clock" : status.closed ? "mdi:garage-open" : "mdi:gesture-tap-button");
    this.elements.actionLabel.textContent = this.busy ? this.pendingLabel || "Waiting" : action;
    this.elements.action.setAttribute("aria-label", status.controllerUnavailable ? "Garage door controller unavailable" : this.busy ? `${this.pendingLabel || "Waiting for"} garage door state confirmation` : status.closed ? "Open garage door" : "Trigger garage door operator");
    this.elements.feedback.textContent = this.message;
    this.elements.feedback.classList.toggle("error", this.messageType === "error");
  }

  setMessage(message, type = "info", timeout = 2600) {
    clearTimeout(this.messageTimer);
    this.message = message;
    this.messageType = type;
    this.render();
    if (!timeout) return;
    this.messageTimer = setTimeout(() => {
      this.messageTimer = null;
      this.message = "";
      this.messageType = "info";
      if (this.isConnected) this.render();
    }, timeout);
  }

  waitForConfirmation(expected) {
    this.cancelConfirmation(new Error("Garage confirmation superseded"));
    const timeout = this.config.confirmation_timeout;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.confirmation?.timer !== timer) return;
        this.confirmation = null;
        reject(new Error("Garage state confirmation timed out"));
      }, timeout);
      this.confirmation = { expected, resolve, reject, timer };
      this.checkConfirmation();
    });
  }

  checkConfirmation() {
    const pending = this.confirmation;
    if (!pending) return;
    const reed = String(this.entityState(this.config.entity)?.state || "unknown").toLowerCase();
    const confirmed = pending.expected ? reed === pending.expected : reed === "on" || reed === "off";
    if (!confirmed) return;
    clearTimeout(pending.timer);
    this.confirmation = null;
    pending.resolve(reed);
  }

  cancelConfirmation(error) {
    const pending = this.confirmation;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.confirmation = null;
    pending.reject(error);
  }

  async requestAction() {
    const status = this.status();
    if (status.controllerUnavailable || this.busy) return;
    const expected = status.closed ? "on" : status.notClosed ? "off" : null;
    const generation = this.requestGeneration;
    this.busy = true;
    this.pendingLabel = "Sending";
    this.message = "";
    this.messageType = "info";
    this.render();

    let confirmation;
    try {
      confirmation = this.waitForConfirmation(expected);
      void confirmation.catch(() => {});
      await this._hass.callService("button", "press", { entity_id: this.config.control_entity });
      if (generation !== this.requestGeneration) return;
      this.pendingLabel = expected === "on" ? "Opening" : expected === "off" ? "Closing" : "Waiting";
      this.render();
      const confirmed = await confirmation;
      if (generation !== this.requestGeneration) return;
      this.setMessage(confirmed === "off" ? "Closed confirmed." : confirmed === "on" ? "Door movement confirmed." : "Garage state confirmed.");
    } catch (error) {
      if (generation !== this.requestGeneration) return;
      this.cancelConfirmation(error instanceof Error ? error : new Error("Garage command failed"));
      const message = String(error?.message || "");
      if (this.isConnected) this.setMessage(message.includes("timed out") ? "The command was sent, but the door state was not confirmed." : "The garage-door command failed.", "error", 5000);
    } finally {
      if (generation === this.requestGeneration) {
        this.busy = false;
        this.pendingLabel = "";
        if (this.isConnected) this.render();
      }
    }
  }

  openDetails() { openMoreInfo(this, this.config.entity); }
  getCardSize() { return 1; }
}

registerCard({ type: "component-garage-door-controller-v1", element: ComponentGarageDoorControllerV1, name: "Garage Door Controller", description: "A garage-door controller for a closed-position reed sensor and momentary operator trigger." });
