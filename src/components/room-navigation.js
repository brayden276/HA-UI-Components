/** ComponentRoomNavigationV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, loadDashboardRegistries, navigateTo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomNavigationV1 extends HTMLElement{
  static getGridOptions(){return{columns:6,rows:1}}
  constructor(){super();this.attachShadow({mode:"open"});this.c=null;this._hass=null;this._connection=null;this._registries=null;this._registriesPromise=null;this._renderSignature="";this._interaction=null}
  setConfig(config){
    this.c={name:"Room",icon:"mdi:home-outline",area:null,navigation_path:null,...config};
    if(!this.c.area)throw new Error("area is required");
    if(!this.c.navigation_path)throw new Error("navigation_path is required");
    this._renderSignature="";this._render();
  }
  set hass(hass){
    const connection=hass&&hass.connection||null;
    if(connection!==this._connection){this._connection=connection;this._registries=null;this._registriesPromise=null;this._load()}
    this._hass=hass;this._render();
  }
  connectedCallback(){this._load();this._render()}
  disconnectedCallback(){this._interaction?.destroy();this._interaction=null}
  _load(){
    const connection=this._connection;
    if(!connection||this._registries||this._registriesPromise)return;
    const request=loadDashboardRegistries(connection);
    this._registriesPromise=request;
    request.then(registries=>{
      if(connection!==this._connection)return;
      this._registries=registries;this._render();
    }).catch(()=>{}).finally(()=>{if(this._registriesPromise===request)this._registriesPromise=null});
  }
  _escape(value){return escapeHtml(value)}
  _entities(){
    if(!this._registries||!this._hass)return[];
    const areaKey=String(this.c.area).trim().toLowerCase();
    const area=this._registries.areas.find(row=>row.area_id===this.c.area||String(row.name||"").trim().toLowerCase()===areaKey);
    if(!area)return[];
    const deviceAreas=new Map(this._registries.devices.map(row=>[row.id,row.area_id]));
    return this._registries.entities
      .filter(row=>row&&!row.disabled_by&&!row.hidden_by&&(row.area_id===area.area_id||deviceAreas.get(row.device_id)===area.area_id))
      .map(row=>this._hass.states[row.entity_id])
      .filter(Boolean);
  }
  _formatted(state){
    try{return this._hass.formatEntityState(state)}
    catch(error){return String(state&&state.state||"")}
  }
  _status(){
    const states=this._entities().filter(state=>!["unknown","unavailable"].includes(state.state));
    const climate=states.find(state=>state.entity_id.startsWith("climate.")&&state.attributes&&!Number.isNaN(Number.parseFloat(state.attributes.current_temperature)));
    const blockedTemperature=/(_controller_temperature|_outside_air_temperature|cpu_temperature|processor_temperature|board_temperature|chip_temperature|internal_temperature)$/;
    const byClass=deviceClass=>states.find(state=>state.entity_id.startsWith("sensor.")&&state.attributes&&state.attributes.device_class===deviceClass&&!blockedTemperature.test(state.entity_id)&&!Number.isNaN(Number.parseFloat(state.state)));
    const temperature=byClass("temperature"),humidity=byClass("humidity");
    const climateTemperature=climate?Number.parseFloat(climate.attributes.current_temperature):null;
    const temperatureUnit=climate&&(climate.attributes.temperature_unit||(this._hass.config&&this._hass.config.unit_system&&this._hass.config.unit_system.temperature))||"°C";
    const temperatureText=climate?climateTemperature.toLocaleString(this._hass.locale&&this._hass.locale.language||undefined,{maximumFractionDigits:1})+" "+temperatureUnit:temperature?this._formatted(temperature):"";
    const lightsOn=states.filter(state=>state.entity_id.startsWith("light.")&&state.state==="on").length;
    const critical=states.some(state=>state.entity_id.startsWith("binary_sensor.")&&state.state==="on"&&["smoke","moisture","gas"].includes(state.attributes&&state.attributes.device_class));
    const warning=states.some(state=>(state.entity_id.startsWith("binary_sensor.")&&state.state==="on"&&state.attributes&&state.attributes.device_class==="garage_door")||(state.entity_id.startsWith("cover.")&&["open","opening"].includes(state.state)&&state.attributes&&state.attributes.device_class==="garage"));
    const active=lightsOn>0||states.some(state=>(state.entity_id.startsWith("climate.")&&["heating","cooling","drying","fan"].includes(state.attributes&&state.attributes.hvac_action))||(state.entity_id.startsWith("media_player.")&&state.state==="playing"));
    const parts=[];
    if(critical)parts.push("Attention required");
    else if(warning)parts.push("Garage open");
    if(temperatureText)parts.push(temperatureText);
    if(humidity)parts.push(this._formatted(humidity));
    if(lightsOn)parts.push(lightsOn+" light"+(lightsOn===1?"":"s")+" on");
    return{summary:parts.slice(0,3).join(" · "),severity:critical?"critical":warning?"warning":active?"active":""};
  }
  _navigate(){
    navigateTo(this.c.navigation_path);
  }
  _render(){
    if(!this.c)return;
    const status=this._status(),summary=status.summary;
    const signature=JSON.stringify([this.c.name,this.c.icon,this.c.navigation_path,status.summary,status.severity]);
    if(signature===this._renderSignature)return;
    this._renderSignature=signature;
    this._interaction?.destroy();this._interaction=null;
    const label="Open "+this.c.name+(summary?". "+summary:"");
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}button{appearance:none;width:100%;min-height:56px;padding:0 12px 0 10px;border:0;border-left:2px solid transparent;background:transparent;color:inherit;font:inherit;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px;cursor:pointer}.icon{width:36px;height:36px;display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:21px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}button.active{border-left-color:transparent;background:transparent}button.active .icon{color:color-mix(in srgb,var(--primary-color) 68%,var(--secondary-text-color))}button.warning{border-left-color:var(--warning-color,#f9a825);background:var(--dashboard-warning-surface,var(--card-background-color))}button.warning .icon{color:var(--warning-color,#f9a825)}button.critical{border-left-color:var(--error-color);background:var(--dashboard-critical-surface,var(--card-background-color))}button.critical .icon{color:var(--error-color)}button:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}@media(max-width:420px){button{padding-right:10px;gap:8px}}</style><ha-card><button class="'+this._escape(status.severity)+'" type="button" aria-label="'+this._escape(label)+'"><span class="icon"><ha-icon icon="'+this._escape(this.c.icon)+'"></ha-icon></span><span class="copy"><span class="name">'+this._escape(this.c.name)+'</span>'+(summary?'<span class="summary">'+this._escape(summary)+'</span>':"")+'</span></button></ha-card>';
    this._interaction=interaction(this.shadowRoot.querySelector("button"),{primary:()=>this._navigate(),feedback:true});
  }
}
registerCard({ type: "component-room-navigation-v1", element: ComponentRoomNavigationV1, name: "Room Navigation", description: "Area-aware room navigation with presence status." });
