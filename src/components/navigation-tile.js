/** ComponentNavigationTileV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentNavigationTileV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:door-open',title:'Destination',context:'Navigation',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.nav{width:100%;text-align:left}.wrap{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}</style><ha-card><button class="i nav" type="button"><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.context)}</div></span></div></button></ha-card>`}}
registerCard({ type: "component-nav-tile-v2", element: ComponentNavigationTileV2, name: "Navigation Tile", description: "Reusable navigation tile component." });

