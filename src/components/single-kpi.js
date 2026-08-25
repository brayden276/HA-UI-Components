/** ComponentSingleKpiV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const SINGLE_KPI_DEFAULTS = Object.freeze({
  value: "00",
  label: "Primary metric",
  support_value: "00",
  support_label: "Supporting context",
  interactive: true,
  entity: null,
  navigation_path: null,
});

class ComponentSingleKpiV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interactionHandle = null;
  }

  get c() {
    return this.config;
  }

  set c(config) {
    this.config = config;
  }

  get h() {
    return this._hass;
  }

  set h(hass) {
    this._hass = hass;
  }

  get _interaction() {
    return this._interactionHandle;
  }

  set _interaction(handle) {
    this._interactionHandle = handle;
  }

  setConfig(config) {
    this.c = {
      ...SINGLE_KPI_DEFAULTS,
      ...config,
    };
    this.r();
  }

  set hass(hass) {
    this.h = hass;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    this._destroyInteraction();
  }

  getCardSize() {
    return 2;
  }

  action() {
    return this._primaryAction();
  }

  _primaryAction() {
    if (this.config.interactive === false) return null;
    if (this.config.navigation_path) return () => navigateTo(this.config.navigation_path);
    if (this.config.entity) return () => openMoreInfo(this, this.config.entity);
    return null;
  }

  _destroyInteraction() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  _render() {
    this._destroyInteraction();

    const action = this.action();
    const tag = action ? "button" : "div";
    const className = action ? "demo" : "demo-static";
    const attributes = action ? ' type="button"' : "";

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-height:70px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em;white-space:nowrap}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color);white-space:nowrap}.support{text-align:right;font-size:11.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap}.support b{font-weight:600;color:var(--primary-text-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.support{font-size:11px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attributes}><div class="wrap"><div><div class="value">${escapeHtml(this.config.value)}</div><div class="label">${escapeHtml(this.config.label)}</div></div><div class="support"><b>${escapeHtml(this.config.support_value)}</b> ${escapeHtml(this.config.support_label)}</div></div></${tag}></ha-card>`;

    if (action) {
      const button = this.shadowRoot.querySelector("button.demo");
      this._interaction = interaction(button, { primary: action, feedback: true });
    }
  }

  r() {
    this._render();
  }
}

registerCard({ type: "component-single-kpi-v2", element: ComponentSingleKpiV2, name: "Single KPI", description: "Reusable single KPI component." });
