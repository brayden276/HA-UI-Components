/** ComponentSectionSeparatorV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentSectionSeparatorV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:gesture-tap-button',title:'Section label',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}ha-card{background:transparent;border:0;box-shadow:none}.wrap{padding:7px 2px 5px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color)}.wrap ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.label{font-size:12px;font-weight:600;color:var(--primary-text-color)}.line{height:1px;background:var(--divider-color);flex:1}</style><ha-card><div class="wrap"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="label">${this.escapeHtml(this.c.title)}</span><span class="line"></span></div></ha-card>`}}
registerCard({ type: "component-section-separator-v2", element: ComponentSectionSeparatorV2, name: "Section Separator", description: "Reusable section separator component." });

