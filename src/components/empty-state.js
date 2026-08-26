/** ComponentEmptyStateV3 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, UPDATE_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEmptyStateV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(c) {
    this.c = {
      icon: "mdi:check-circle-outline",
      title: "Nothing requires attention",
      message: "Supporting empty-state message.",
      ...c,
    };
    this._render();
  }

  set hass(h) {}

  getCardSize() {
    return 1;
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}.wrap{padding:12px 14px;min-height:72px;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.title{font-size:13px;line-height:1.25;font-weight:600}.desc{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.message)}</div></span></div></ha-card>`;
  }
}
registerCard({ type: "component-empty-state-v3", element: ComponentEmptyStateV3, name: "Empty State", description: "Reusable empty-state component." });

/**
 * Compatibility surface for dashboards that still reference the original
 * compact card type. The current Empty State module owns both registrations so
 * there is no separate support module or load-order dependency.
 */
class ComponentCompactEmptyState extends DashboardBaseCard {
  setConfig(config) {
    this.config = {
      icon: "mdi:check-circle-outline",
      title: "Nothing requires attention",
      message: "Supporting empty-state message.",
      ...config,
    };
    this.render();
  }

  getCardSize() {
    return 1;
  }

  render() {
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}ha-card{border:0;background:transparent;box-shadow:none}.wrap{min-height:40px;padding:0 2px;display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;gap:8px}.icon{width:24px;height:24px;display:grid;place-items:center;background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:18px}.desc{margin-top:1px;font-size:12px;line-height:1.3}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.config.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.config.title)}</div><div class="desc">${escapeHtml(this.config.message)}</div></span></div></ha-card>`;
  }
}

registerCard({
  type: "component-empty-state-v2",
  element: ComponentCompactEmptyState,
  name: "Empty State V2",
  description: "Reusable compact empty-state component.",
});
