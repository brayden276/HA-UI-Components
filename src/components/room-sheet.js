/** ComponentRoomSheetV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomSheetV2 extends DashboardBaseCard{
 constructor(){super();this._hass=null;this._interactions=[]}
 setConfig(c){this.c={icon:'mdi:bed-king-outline',title:'Room name',rows:null,...c};this.r()}
 set hass(h){this._hass=h;this.r()}
 disconnectedCallback(){for(const handle of this._interactions)handle.destroy();this._interactions=[]}
 getCardSize(){return 5}
 _defaults(){return[
  {section:'Room state',icon:'mdi:thermometer',name:'Status metric',state:'Supporting context',value:'Value'},
  {section:'Controls',icon:'mdi:lightbulb-outline',name:'Control name',state:'Current state',value:'Value'},
  {section:'Controls',icon:'mdi:thermostat',name:'Control name',state:'Current state',value:'Value'},
 ]}
 _action(row){
  if(row.navigation_path)return()=>navigateTo(row.navigation_path);
  if(row.service&&this._hass){const [domain,service]=String(row.service).split('.');if(domain&&service)return()=>this._hass.callService(domain,service,{...(row.service_data||{}),...(row.entity?{entity_id:row.entity}:{})})}
  if(row.entity)return()=>openMoreInfo(this,row.entity);
  return null
 }
 r(){
  if(!this.c)return;
  for(const handle of this._interactions)handle.destroy();this._interactions=[];
  const rows=Array.isArray(this.c.rows)&&this.c.rows.length?this.c.rows.slice(0,8):this._defaults();
  let section=null,body='';
  rows.forEach((row,index)=>{const next=row.section||'Controls';if(next!==section){section=next;body+=`<div class="sep">${this.escapeHtml(section)}</div>`}const action=this._action(row),tag=action?'button':'div',attrs=action?' type="button"':'';body+=`<${tag} class="row${action?' actionable':''}" data-row="${index}"${attrs}><ha-icon icon="${this.escapeHtml(row.icon||'mdi:circle-outline')}"></ha-icon><span><div class="rname">${this.escapeHtml(row.name||'Control name')}</div><div class="rstate">${this.escapeHtml(row.state||'')}</div></span><span class="rvalue">${this.escapeHtml(row.value||'')}</span></${tag}>`});
  this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.wrap{padding:0}.head{padding:13px 14px 11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--divider-color)}.head-left{display:flex;align-items:center;gap:9px}.head-left ha-icon{color:var(--primary-color)}.close{width:32px;height:32px;border:1px solid var(--dashboard-card-border-color,var(--divider-color))!important;border-radius:var(--dashboard-radius-control,5px)!important;color:var(--secondary-text-color);padding:0!important}.body{padding:8px 14px 12px}.sep{display:flex;align-items:center;gap:7px;margin:8px 0 6px;font-size:11px;font-weight:600;color:var(--secondary-text-color)}.sep:after{content:'';height:1px;background:var(--divider-color);flex:1}.row{appearance:none;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;min-height:46px;display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:8px;border-radius:var(--dashboard-radius-control,8px);cursor:pointer;padding:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.row ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.rname{font-size:12px;font-weight:600}.rstate,.rvalue{font-size:10.5px;color:var(--secondary-text-color)}.rvalue{font-weight:600;color:var(--primary-text-color)}</style><style>.row:not(.actionable){cursor:default}.row:not(.actionable):active{background:transparent}.close.preview-only{display:grid;place-items:center}</style><ha-card><div class="wrap"><div class="head"><span class="head-left"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="title">${this.escapeHtml(this.c.title)}</span></span><span class="i close preview-only" aria-hidden="true"><ha-icon icon="mdi:close"></ha-icon></span></div><div class="body">${body}</div></div></ha-card>`;
  rows.forEach((row,index)=>{const action=this._action(row);if(!action)return;const el=this.shadowRoot.querySelector(`[data-row="${index}"]`);if(!el)return;el.setAttribute('aria-label',row.aria_label||`${row.name||'Room control'}`);this._interactions.push(interaction(el,{primary:action,hold:row.entity&&row.navigation_path?()=>openMoreInfo(this,row.entity):null,optimistic:false,repeat:false,feedback:true}))})
 }
}
registerCard({ type: "component-room-sheet-v2", element: ComponentRoomSheetV2, name: "Room Sheet", description: "Reusable room-sheet component." });
