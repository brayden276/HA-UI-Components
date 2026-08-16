/** ComponentEmptyStateV2 — reusable Home Assistant dashboard card. */

const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEmptyStateV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:check-circle-outline',title:'Nothing requires attention',message:'Supporting empty-state message.',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}ha-card{border:0;background:transparent;box-shadow:none}.wrap{min-height:40px;padding:0 2px;display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;gap:8px}.icon{width:24px;height:24px;display:grid;place-items:center;background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:18px}.desc{margin-top:1px;font-size:12px;line-height:1.3}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.message)}</div></span></div></ha-card>`}}
registerCard({ type: "component-empty-state-v2", element: ComponentEmptyStateV2, name: "Empty State V2", description: "Reusable compact empty-state component." });

