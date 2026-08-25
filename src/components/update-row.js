/** ComponentUpdateRowV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentUpdateRowV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.busy = false;
    this.requested = false;
    this.error = "";
    this.startTimer = null;
    this.errorTimer = null;
    this._renderSignature = null;
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      icon: "mdi:update",
      title: "Update name",
      current: "Current 1.0",
      available: "Available 1.1",
      action: "Update",
      confirm: true,
      ...c,
    };
    this._render();
  }

  set hass(h) {
    this.h = h;
    const data = this._data();
    if (
      this.requested &&
      (data.progress.active || !data.pending)
    ) {
      this.requested = false;
      window.clearTimeout(this.startTimer);
    }
    this._render();
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    this._renderSignature = null;
    this._render();
  }

  disconnectedCallback() {
    window.clearTimeout(this.startTimer);
    window.clearTimeout(this.errorTimer);
    // The retained detail and action controls are replaced by the next render.
  }

  _state() {
    return (
      (this.c.entity && this.h?.states?.[this.c.entity]) || null
    );
  }

  _name(state) {
    if (this.c.name) return this.c.name;
    if (!state) return this.c.title;
    const name =
      state.attributes?.title ||
      state.attributes?.friendly_name ||
      this.c.entity;
    return String(name).replace(/ Update$/, "");
  }

  _progress(attributes) {
    const raw = attributes?.in_progress;
    if (
      raw === false ||
      raw === null ||
      raw === undefined
    ) {
      return { active: false, determinate: false, value: 0 };
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return {
        active: true,
        determinate: true,
        value: Math.max(0, Math.min(100, raw)),
      };
    }
    if (
      typeof raw === "string" &&
      raw.trim() !== "" &&
      Number.isFinite(Number(raw))
    ) {
      return {
        active: true,
        determinate: true,
        value: Math.max(0, Math.min(100, Number(raw))),
      };
    }
    return {
      active: Boolean(raw),
      determinate: false,
      value: 0,
    };
  }

  _data() {
    const state = this._state();
    if (!state) {
      const configured = Boolean(this.c.entity);
      return {
        live: false,
        missing: configured,
        unavailable: configured,
        title: this.c.title,
        current: configured
          ? "Update entity unavailable"
          : this.c.current,
        available: configured ? "" : this.c.available,
        action: configured ? "Unavailable" : this.c.action,
        pending: !configured,
        progress: {
          active: false,
          determinate: false,
          value: 0,
        },
      };
    }

    const attributes = state.attributes || {};
    const unavailable = ["unavailable", "unknown"].includes(
      state.state,
    );
    const pending = state.state === "on";
    const progress = this._progress(attributes);
    return {
      live: true,
      missing: false,
      unavailable,
      title: this._name(state),
      current: attributes.installed_version
        ? `Current ${attributes.installed_version}`
        : "Current version unavailable",
      available: attributes.latest_version
        ? `Available ${attributes.latest_version}`
        : "Latest version unavailable",
      action: unavailable
        ? "Unavailable"
        : progress.active
          ? "Updating…"
          : pending
            ? "Update"
            : "Current",
      pending,
      progress,
    };
  }

  _more() {
    if (!this._state()) return;
    openMoreInfo(this, this.c.entity);
  }

  _setError(message) {
    this.error = message;
    window.clearTimeout(this.errorTimer);
    if (message) {
      this.errorTimer = window.setTimeout(() => {
        this.error = "";
        this._render();
      }, 5000);
    }
  }

  _watchForStart() {
    window.clearTimeout(this.startTimer);
    this.startTimer = window.setTimeout(() => {
      if (!this.requested) return;
      this.requested = false;
      this._setError("The update did not start.");
      this._render();
    }, 12000);
  }

  async _install(data) {
    if (
      !data.live ||
      data.unavailable ||
      !data.pending ||
      data.progress.active ||
      this.busy ||
      this.requested ||
      !this.h
    ) {
      return;
    }

    const state = this._state();
    const name = this._name(state);
    const latest =
      state?.attributes?.latest_version || "the latest version";
    if (
      this.c.confirm !== false &&
      !window.confirm(`Install ${latest} for ${name}?`)
    ) {
      return;
    }

    this._setError("");
    this.busy = true;
    this.requested = true;
    this._render();

    try {
      await this.h.callService("update", "install", {
        entity_id: this.c.entity,
      });
      this._watchForStart();
    } catch (_) {
      this.requested = false;
      window.clearTimeout(this.startTimer);
      this._setError("The update could not be started.");
    } finally {
      this.busy = false;
      this._render();
    }
  }

  _render() {
    if (!this.c) return;
    const data = this._data();
    const signature = JSON.stringify([
      this.c,
      data,
      this.busy,
      this.requested,
      this.error,
    ]);
    if (signature === this._renderSignature) return;
    this._renderSignature = signature;
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const active =
      data.progress.active || this.busy || this.requested;
    const disabled =
      data.missing ||
      data.unavailable ||
      !data.pending ||
      active;
    const action = this.error
      ? "Retry"
      : this.busy || this.requested
        ? "Starting…"
        : data.action;
    const status = this.error
      ? this.error
      : `${data.current}${data.available ? ` · ${data.available}` : ""}`;
    const progress = active
      ? data.progress.determinate
        ? `<span class="progress determinate" role="progressbar" aria-label="Updating ${escapeHtml(data.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${data.progress.value}" style="--progress:${data.progress.value}%"></span>`
        : `<span class="progress indeterminate" role="progressbar" aria-label="${this.busy || this.requested ? "Starting" : "Updating"} ${escapeHtml(data.title)}"></span>`
      : "";

    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}ha-card{position:relative}.wrap{min-height:68px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:0 14px}.details{appearance:none;border:0;background:transparent;text-align:left;min-width:0;padding:10px 0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:10px;cursor:${this._state() ? "pointer" : "default"}}.details:active{transform:scale(.995)}.details:focus-visible,.action:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:10px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{font-size:13px;line-height:1.25;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.versions{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.versions.error{color:var(--error-color)}.versions b{font-weight:600;color:var(--primary-text-color)}.action{appearance:none;border:0;min-height:44px;padding:0 13px;border-radius:11px;background:var(--primary-color);color:var(--text-primary-color);font-size:13px;font-weight:600;cursor:pointer}.action:disabled{cursor:default;background:var(--secondary-background-color);color:var(--secondary-text-color);opacity:1}.progress{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0;background:var(--primary-color);pointer-events:none}.progress.determinate{width:var(--progress);transition:width .25s ease}.progress.indeterminate{width:34%;animation:update-slide 1.15s ease-in-out infinite}@keyframes update-slide{0%{transform:translateX(-105%)}50%{transform:translateX(150%)}100%{transform:translateX(305%)}}@media(prefers-reduced-motion:reduce){.progress.indeterminate{animation:none;width:100%;opacity:.55}.progress.determinate{transition:none}}@media(max-width:700px){.wrap{padding:0 12px}}</style><ha-card><div class="wrap"><button class="details" type="button" ${this._state() ? "" : "disabled"}><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span class="copy"><div class="title">${escapeHtml(data.title)}</div><div class="versions ${this.error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(status)}</div></span></button><button class="action" type="button" aria-label="${escapeHtml(action)} ${escapeHtml(data.title)}" ${disabled ? "disabled" : ""}>${escapeHtml(action)}</button></div>${progress}</ha-card>`;

    const details = this.shadowRoot.querySelector(".details");
    const actionButton = this.shadowRoot.querySelector(".action");
    if (details && this._state()) {
      details.setAttribute("aria-label", `Open details for ${data.title}`);
      this._interactions.push(interaction(details, {
        primary: () => this._more(),
        optimistic: false,
        repeat: false,
        feedback: true,
      }));
    }
    if (actionButton) {
      this._interactions.push(interaction(actionButton, {
        primary: () => this._install(data),
        optimistic: false,
        repeat: false,
        feedback: true,
      }));
    }
  }
}
registerCard({ type: "component-update-row-v3", element: ComponentUpdateRowV3, name: "Update Row", description: "Reusable update row with live update support." });
