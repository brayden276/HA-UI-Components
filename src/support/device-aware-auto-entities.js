/**
 * Presentation wrapper for Auto-Entities collections.
 *
 * Split systems are now normal, explicitly configured climate cards. This
 * wrapper leaves entity selection to Auto-Entities instead of rediscovering
 * climate entities through a second registry.
 */
const DEVICE_AWARE_INNER_TYPE = "custom:auto-entities";
const deviceAwareClone = (value) => JSON.parse(JSON.stringify(value));

class ComponentDeviceAwareAutoEntitiesV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._card = null;
    this._generation = 0;
    this._retryTimer = null;
    this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}.head{min-height:44px;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px;color:var(--primary-text-color)}.head[hidden]{display:none}.head ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.body{min-width:0}</style><div class="head" hidden><ha-icon></ha-icon><h2></h2></div><div class="body"></div>`;
    this.$ = {
      head: this.shadowRoot.querySelector(".head"),
      body: this.shadowRoot.querySelector(".body"),
    };
  }

  setConfig(config) {
    if (!config?.filter) throw new Error("An Auto-Entities filter is required");
    this._config = deviceAwareClone(config);
    this._renderHeader();
    this._generation += 1;
    clearTimeout(this._retryTimer);
    this._retryTimer = null;
    if (this.isConnected && this._hass) void this._buildCard();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._card) this._card.hass = hass;
    if (this.isConnected && !this._card) void this._buildCard();
  }

  connectedCallback() {
    if (this._config && this._hass) void this._buildCard();
  }

  disconnectedCallback() {
    clearTimeout(this._retryTimer);
    this._retryTimer = null;
    this._generation += 1;
  }

  getCardSize() {
    return (this._card?.getCardSize?.() ?? 1) + (this.$.head.hidden ? 0 : 1);
  }

  getLayoutOptions() {
    return this._card?.getLayoutOptions?.() ?? {};
  }

  _renderHeader() {
    const header = this._config?.header;
    const title = String(header?.title || "").trim();
    this.$.head.hidden = !title;
    if (!title) return;
    this.$.head.querySelector("ha-icon").setAttribute("icon", header.icon || "mdi:format-list-bulleted");
    this.$.head.querySelector("h2").textContent = title;
  }

  _cardConfig() {
    const config = deviceAwareClone(this._config);
    const excludeInvalid = config.exclude_invalid_states !== false;
    delete config.header;
    delete config.exclude_invalid_states;
    config.type = DEVICE_AWARE_INNER_TYPE;
    const filter = config.filter ?? {};
    filter.exclude = Array.isArray(filter.exclude) ? [...filter.exclude] : [];
    if (excludeInvalid) {
      for (const state of ["unavailable", "unknown"]) {
        if (!filter.exclude.some((rule) => rule?.state === state && Object.keys(rule).length === 1)) {
          filter.exclude.push({ state });
        }
      }
    }
    config.filter = filter;
    config.unique = true;
    return config;
  }

  async _buildCard() {
    if (!this.isConnected || !this._config || !this._hass) return;
    const loadCardHelpers = globalThis.loadCardHelpers;
    if (typeof loadCardHelpers !== "function") return;
    const generation = ++this._generation;
    try {
      const helpers = await loadCardHelpers();
      if (generation !== this._generation || !this.isConnected) return;
      const card = helpers.createCardElement(this._cardConfig());
      card.hass = this._hass;
      this._card = card;
      this.$.body.replaceChildren(card);
    } catch {
      if (generation !== this._generation) return;
      clearTimeout(this._retryTimer);
      this._retryTimer = setTimeout(() => {
        this._retryTimer = null;
        void this._buildCard();
      }, 31000);
      if (!this._card) {
        const alert = document.createElement("ha-alert");
        alert.setAttribute("alert-type", "error");
        alert.textContent = "Household controls are temporarily unavailable.";
        this.$.body.replaceChildren(alert);
      }
    }
  }
}

customElements.get("component-device-aware-auto-entities-v1") ||
  customElements.define("component-device-aware-auto-entities-v1", ComponentDeviceAwareAutoEntitiesV1);
