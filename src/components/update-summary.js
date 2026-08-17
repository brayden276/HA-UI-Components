/** ComponentUpdateSummaryV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentUpdateSummaryV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.busy = false;
    this.error = "";
    this.messageTimer = null;
  }

  setConfig(c) {
    this.c = {
      count: "3",
      title: "updates available",
      message: "Review the items below before installing.",
      live_updates: false,
      update_all: false,
      confirm: true,
      ...c,
    };
    this._render();
  }

  set hass(h) {
    this.h = h;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  disconnectedCallback() {
    window.clearTimeout(this.messageTimer);
    this.messageTimer = null;
  }

  _all() {
    if (!this.h) return [];
    const ids = Array.isArray(this.c.entities)
      ? new Set(this.c.entities)
      : null;
    return Object.values(this.h.states).filter(
      (state) =>
        state.entity_id.startsWith("update.") &&
        (!ids || ids.has(state.entity_id)),
    );
  }

  _progress(attributes) {
    const raw = attributes?.in_progress;
    return !(
      raw === false ||
      raw === null ||
      raw === undefined
    );
  }

  _pending() {
    return this._all().filter((state) => state.state === "on");
  }

  _live() {
    if (!this.c.live_updates || !this.h) return null;
    const pending = this._pending().length;
    return {
      count: String(pending),
      title: pending === 1 ? "update available" : "updates available",
      message: pending
        ? "Review the items below before installing."
        : "Everything is current.",
    };
  }

  _setError(message) {
    this.error = message;
    window.clearTimeout(this.messageTimer);
    if (message) {
      this.messageTimer = window.setTimeout(() => {
        this.error = "";
        this._render();
      }, 5000);
    }
  }

  async _installAll() {
    if (!this.h || this.busy) return;
    const pending = this._pending().filter(
      (state) => !this._progress(state.attributes),
    );
    if (!pending.length) return;

    const count = pending.length;
    if (
      this.c.confirm !== false &&
      !window.confirm(
        `Install ${count} available ${count === 1 ? "update" : "updates"}? Home Assistant may restart if Core, Supervisor or the operating system is included.`,
      )
    ) {
      return;
    }

    this._setError("");
    this.busy = true;
    this._render();

    const priority = [
      "update.home_assistant_supervisor_update",
      "update.home_assistant_operating_system_update",
      "update.home_assistant_core_update",
    ];
    const normal = pending
      .map((state) => state.entity_id)
      .filter((id) => !priority.includes(id));

    try {
      if (normal.length) {
        await this.h.callService("update", "install", {
          entity_id: normal,
        });
      }
      for (const id of priority) {
        if (pending.some((state) => state.entity_id === id)) {
          await this.h.callService("update", "install", {
            entity_id: id,
          });
        }
      }
    } catch (_) {
      this._setError("One or more updates could not be started.");
    } finally {
      this.busy = false;
      this._render();
    }
  }

  _render() {
    if (!this.c) return;
    const data = this._live() || this.c;
    const pending = this.h
      ? this._pending().length
      : Number(data.count) || 0;
    const showButton = Boolean(this.c.update_all);
    const message = this.error
      ? this.error
      : this.busy
        ? "Starting available updates…"
        : data.message;
    const progress = this.busy
      ? '<span class="progress indeterminate" role="progressbar" aria-label="Starting available updates"></span>'
      : "";

    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}ha-card{position:relative}.wrap{padding:12px 14px;min-height:72px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px}.count{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.headline{font-size:13px;font-weight:600}.desc{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color)}.desc.error{color:var(--error-color)}.all{appearance:none;border:0;min-height:44px;padding:0 14px;border-radius:11px;background:var(--primary-color);color:var(--text-primary-color);font-size:13px;font-weight:650;cursor:pointer;white-space:nowrap}.all:active{transform:scale(.98)}.all:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.all:disabled{cursor:default;background:var(--secondary-background-color);color:var(--secondary-text-color)}.progress{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0;background:var(--primary-color);pointer-events:none}.progress.indeterminate{width:34%;animation:update-slide 1.15s ease-in-out infinite}@keyframes update-slide{0%{transform:translateX(-105%)}50%{transform:translateX(150%)}100%{transform:translateX(305%)}}@media(prefers-reduced-motion:reduce){.progress.indeterminate{animation:none;width:100%;opacity:.55}}@media(max-width:700px){.wrap{padding:12px;gap:10px}.count{font-size:25px}.all{padding:0 12px}}</style><ha-card><div class="wrap"><span class="count">${escapeHtml(data.count)}</span><span><div class="headline">${escapeHtml(data.title)}</div><div class="desc ${this.error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(message)}</div></span>${showButton ? `<button class="all" type="button" ${this.busy || pending === 0 ? "disabled" : ""}>${escapeHtml(this.busy ? "Starting…" : "Update all")}</button>` : "<span></span>"}</div>${progress}</ha-card>`;

    this.shadowRoot
      .querySelector(".all")
      ?.addEventListener("click", () => this._installAll());
  }
}
registerCard({ type: "component-update-summary-v3", element: ComponentUpdateSummaryV3, name: "Update Summary", description: "Reusable update summary with live update support." });
