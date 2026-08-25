/** ComponentQuickNavigationV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentQuickNavigationV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      left_icon: "mdi:weather-partly-cloudy",
      left_text: "Context",
      left_entity: null,
      action_1_icon: "mdi:view-dashboard-outline",
      action_1_text: "Destination",
      action_1_path: null,
      action_2_icon: "mdi:cog-outline",
      action_2_text: "Settings",
      action_2_path: null,
      ...c,
    };
    this._hasHass = false;
    this._leftState = undefined;
    this._leftStateText = undefined;
    this.r();
  }

  set hass(h) {
    this.h = h;
    const state = this.c?.left_entity ? h?.states?.[this.c.left_entity] : null;
    const stateText = state ? this.formatState(state) : null;
    if (!this._hasHass || state !== this._leftState || stateText !== this._leftStateText) {
      this._hasHass = true;
      this._leftState = state;
      this._leftStateText = stateText;
      if (this.c?.left_entity && h && !h.states) {
        this.r();
        return;
      }
      this.r({ state, stateText });
      return;
    }

    const contextIcon = this.shadowRoot?.getElementById("context-icon");
    if (contextIcon && state) {
      contextIcon.hass = h;
      contextIcon.stateObj = state;
    }
  }

  disconnectedCallback() {
    // Reconnect renders the retained shadow DOM and replaces these handles.
    // Keeping them alive through a transient detach avoids dead controls.
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  _clearInteractions() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  getCardSize() { return 1; }

  moreInfo(entityId) { openMoreInfo(this, entityId); }

  navigate(path) { navigateTo(path); }

  formatState(state) {
    try {
      return this.h.formatEntityState(state);
    } catch {
      return String(state?.state || "");
    }
  }

  r(...snapshots) {
    if (!this.c) return;
    this._clearInteractions();
    const snapshot = snapshots[0] || (() => {
      const state = this.c.left_entity && this.h ? this.h.states[this.c.left_entity] : null;
      return { state, stateText: state ? this.formatState(state) : null };
    })();
    const { state: stateObj, stateText } = snapshot;

    const leftText = stateObj ? stateText : this.c.left_entity ? "Unavailable" : this.c.left_text;
    const leftIcon = stateObj
      ? '<ha-state-icon id="context-icon"></ha-state-icon>'
      : `<ha-icon icon="${this.escapeHtml(this.c.left_icon)}"></ha-icon>`;
    const disabled1 = this.c.action_1_path ? "" : "disabled";
    const disabled2 = this.c.action_2_path ? "" : "disabled";
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.wrap{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px}.group{display:flex;align-items:center;gap:8px}.chip{min-height:44px;border:1px solid var(--divider-color)!important;border-radius:var(--dashboard-radius-control,8px);padding:0 13px!important;display:flex;align-items:center;gap:7px;color:var(--primary-text-color);font-size:13px;font-weight:600;white-space:nowrap}.chip ha-icon,.chip ha-state-icon{color:var(--primary-color);--mdc-icon-size:19px}.chip:disabled{cursor:default;opacity:1}@media(max-width:520px){.chip{width:44px;padding:0!important;justify-content:center}.chip span{display:none}.context{width:auto;padding:0 12px!important}.context span{display:inline}}</style><ha-card><div class="wrap"><button class="i chip context" id="context" type="button" aria-label="${this.escapeHtml(this.c.left_text)}">${leftIcon}<span>${this.escapeHtml(leftText)}</span></button><div class="group"><button class="i chip" id="action-1" type="button" aria-label="${this.escapeHtml(this.c.action_1_text)}" ${disabled1}><ha-icon icon="${this.escapeHtml(this.c.action_1_icon)}"></ha-icon><span>${this.escapeHtml(this.c.action_1_text)}</span></button><button class="i chip" id="action-2" type="button" aria-label="${this.escapeHtml(this.c.action_2_text)}" ${disabled2}><ha-icon icon="${this.escapeHtml(this.c.action_2_icon)}"></ha-icon><span>${this.escapeHtml(this.c.action_2_text)}</span></button></div></div></ha-card>`;

    const contextIcon = this.shadowRoot.getElementById("context-icon");
    if (contextIcon && stateObj) {
      contextIcon.hass = this.h;
      contextIcon.stateObj = stateObj;
    }
    const context = this.shadowRoot.getElementById("context");
    context.disabled = !this.c.left_entity;
    this._interactions.push(
      interaction(context, { primary: () => this.moreInfo(this.c.left_entity), feedback: true }),
      interaction(this.shadowRoot.getElementById("action-1"), { primary: () => this.navigate(this.c.action_1_path), feedback: true }),
      interaction(this.shadowRoot.getElementById("action-2"), { primary: () => this.navigate(this.c.action_2_path), feedback: true }),
    );
  }
}

registerCard({ type: "component-quick-nav-v2", element: ComponentQuickNavigationV2, name: "Quick Navigation", description: "Reusable quick navigation component." });
