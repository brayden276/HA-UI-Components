/** ComponentActionV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentActionV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interaction = null;
  }

  setConfig(c) {
    this.c = { title: 'Action title', description: 'What this action will do', action_text: 'Open', icon: 'mdi:gesture-tap-button', ...c };
    this.r();
  }

  set hass(h) { this.h = h; }

  connectedCallback() { if (this.c) this.r(); }

  disconnectedCallback() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  getCardSize() { return 2; }

  actions() {
    const entity = this.c.more_info_entity || this.c.entity || null;
    const path = this.c.navigation_path || null;
    return {
      primary: path ? () => navigateTo(path) : entity ? () => openMoreInfo(this, entity) : null,
      hold: path && entity ? () => openMoreInfo(this, entity) : null,
    };
  }

  r() {
    this._interaction?.destroy();
    this._interaction = null;
    const actions = this.actions();
    const tag = actions.primary ? 'button' : 'div';
    const attrs = actions.primary ? ' type="button"' : '';
    const className = actions.primary ? 'demo' : 'demo-static';
    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action{min-height:32px;padding:0 10px;border-radius:11px;display:flex;align-items:center;background:var(--secondary-background-color);color:var(--primary-color);font-size:11.5px;font-weight:650;white-space:nowrap}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></span><span class="action">${escapeHtml(this.c.action_text)}</span></div></${tag}></ha-card>`;
    if (actions.primary) this._interaction = interaction(this.shadowRoot.querySelector('button.demo'), { primary: actions.primary, hold: actions.hold, optimistic: false, repeat: false, feedback: true });
  }
}
registerCard({ type: "component-action-v2", element: ComponentActionV2, name: "Action Card", description: "Reusable navigation and more-info action card." });
