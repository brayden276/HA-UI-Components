/** ComponentHouseholdAttentionV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentHouseholdAttentionV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){
    super();this.attachShadow({mode:"open"});this.c=null;this._hass=null;this._connection=null;
    this._registry=null;this._loading=null;this._registrySubscription=null;this._refreshTimer=null;this._renderSignature=null;this._interactionHandles=[];
  }
  setConfig(c){this.c={title:"Needs attention",icon:"mdi:alert-circle-outline",max_items:6,demo:false,...c};this._renderSignature=null;this._render()}
  set hass(h){
    const connection=h?.connection||null;
    if(this._connection!==connection){this._unsubscribe();this._connection=connection;this._registry=null;this._loading=null}
    this._hass=h;this._subscribe();this._load();this._render();
  }
  connectedCallback(){this._subscribe();this._load();this._renderSignature=null;this._render()}
  disconnectedCallback(){for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];clearTimeout(this._refreshTimer);this._refreshTimer=null;this._unsubscribe()}
  getCardSize(){return this.c?.demo?2:1}
  _subscribe(){
    if(!this.isConnected||this._registrySubscription||!this._connection?.subscribeEvents)return;
    const pending=Promise.resolve(this._connection.subscribeEvents(()=>this._queueRefresh(),"entity_registry_updated"));
    this._registrySubscription=pending;
    pending.catch(()=>{if(this._registrySubscription===pending)this._registrySubscription=null});
  }
  _unsubscribe(){
    clearTimeout(this._refreshTimer);this._refreshTimer=null;
    const pending=this._registrySubscription;this._registrySubscription=null;
    if(pending)Promise.resolve(pending).then(fn=>fn?.()).catch(()=>{});
  }
  _queueRefresh(){
    clearTimeout(this._refreshTimer);
    this._refreshTimer=setTimeout(()=>{this._refreshTimer=null;this._registry=null;this._loading=null;this._load(true)},180);
  }
  _load(force=false){
    if(this.c?.demo||!this._connection?.sendMessagePromise)return Promise.resolve(null);
    if(this._registry&&!force)return Promise.resolve(this._registry);
    if(this._loading)return this._loading;
    const connection=this._connection;
    this._loading=connection.sendMessagePromise({type:"config/entity_registry/list"})
      .then(rows=>{
        if(connection!==this._connection)return null;
        this._registry=Array.isArray(rows)?rows:[];this._loading=null;this._render();return this._registry;
      })
      .catch(()=>{if(connection===this._connection){this._loading=null;this._registry=[];this._render()}return null});
    return this._loading;
  }
  _escape(value){return escapeHtml(value)}
  _issues(){
    if(this.c?.demo)return[
      {entity_id:"binary_sensor.demo_garage",name:"Garage door",status:"Open",severity:"warning",severity_text:"Check",icon:"mdi:garage-open"},
      {entity_id:"binary_sensor.demo_leak",name:"Laundry leak sensor",status:"Detected",severity:"critical",severity_text:"Critical",icon:"mdi:water-alert"}
    ];
    if(!this._hass||!this._registry)return[];
    const issues=[];
    for(const entry of this._registry){
      if(!entry?.entity_id||entry.disabled_by||entry.hidden_by||["diagnostic","config"].includes(entry.entity_category))continue;
      const state=this._hass.states?.[entry.entity_id];if(!state)continue;
      const domain=entry.entity_id.split(".")[0],deviceClass=entry.device_class||state.attributes?.device_class||"";
      let issue=null;
      if(entry.entity_id.endsWith("_controller_status")&&state.state==="off"){
        issue={status:"Controller offline",severity:"critical",severity_text:"Critical",icon:"mdi:access-point-network-off"};
      }else if(domain==="binary_sensor"&&state.state==="on"&&["smoke","moisture","gas"].includes(deviceClass)){
        issue={status:"Detected",severity:"critical",severity_text:"Critical",icon:deviceClass==="smoke"?"mdi:smoke-detector-alert":deviceClass==="gas"?"mdi:gas-cylinder":"mdi:water-alert"};
      }else if(domain==="binary_sensor"&&state.state==="on"&&["door","window","garage_door"].includes(deviceClass)){
        issue={status:"Open",severity:"warning",severity_text:"Check",icon:deviceClass==="window"?"mdi:window-open-variant":deviceClass==="garage_door"?"mdi:garage-open":"mdi:door-open"};
      }else if(domain==="lock"&&state.state==="unlocked"){
        issue={status:"Unlocked",severity:"warning",severity_text:"Check",icon:"mdi:lock-open-variant-outline"};
      }
      if(issue)issues.push({entity_id:entry.entity_id,name:entry.name||entry.original_name||state.attributes?.friendly_name||entry.entity_id,...issue});
    }
    return issues.sort((a,b)=>(a.severity==="critical"?0:1)-(b.severity==="critical"?0:1)||a.name.localeCompare(b.name,undefined,{sensitivity:"base"})).slice(0,Math.max(1,Number(this.c?.max_items)||6));
  }
  _open(entityId){
    if(this.c?.demo)return;
    openMoreInfo(this,entityId);
  }
  _render(){
    if(!this.c)return;
    const issues=this._issues(),visible=issues.length>0;
    const signature=JSON.stringify([this.c.title,this.c.icon,issues]);
    if(signature===this._renderSignature)return;
    this._renderSignature=signature;
    for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];
    this.style.display=visible?"block":"none";this.toggleAttribute("aria-hidden",!visible);
    if(!visible){if(this.shadowRoot.childNodes.length)this.shadowRoot.replaceChildren();return}
    const rows=issues.map(issue=>'<button class="issue '+this._escape(issue.severity)+'" type="button" data-entity="'+this._escape(issue.entity_id)+'" aria-label="'+this._escape(issue.name+", "+issue.status+". Open details.")+'"><span class="issue-icon"><ha-icon icon="'+this._escape(issue.icon)+'"></ha-icon></span><span class="copy"><span class="name">'+this._escape(issue.name)+'</span><span class="state">'+this._escape(issue.status)+'</span></span><span class="severity">'+this._escape(issue.severity_text)+'</span></button>').join("");
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}ha-card{border:0;box-shadow:none;background:transparent;color:var(--primary-text-color)}.head{min-height:36px;display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:0 2px}.head ha-icon{color:var(--error-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.issue{appearance:none;width:100%;min-height:52px;padding:6px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-left:3px solid var(--warning-color,#f9a825);border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-warning-surface,var(--card-background-color));display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:8px;text-align:left;cursor:pointer}.issue.critical{border-left-color:var(--error-color)}.issue:hover,.issue:focus-visible{background:var(--dashboard-card-muted-surface,var(--card-background-color));outline:2px solid var(--primary-color);outline-offset:1px}.issue-icon{width:36px;height:36px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;color:var(--warning-color,#f9a825);background:transparent}.critical .issue-icon{color:var(--error-color)}.issue-icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0;display:flex;flex-direction:column;gap:2px}.name{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.state{font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.severity{font-size:12px;font-weight:650;color:var(--warning-color,#f9a825)}.critical .severity{color:var(--error-color)}@media(max-width:700px){.grid{grid-template-columns:1fr}.issue{min-height:56px}}</style><ha-card><div class="head"><ha-icon icon="'+this._escape(this.c.icon)+'"></ha-icon><h2>'+this._escape(this.c.title)+'</h2></div><div class="grid">'+rows+'</div></ha-card>';
    for(const button of this.shadowRoot.querySelectorAll(".issue"))this._interactionHandles.push(interaction(button,{primary:()=>this._open(button.dataset.entity),optimistic:false,repeat:false,feedback:true}));
  }
}
registerCard({ type: "component-household-attention-v1", element: ComponentHouseholdAttentionV1, name: "Household Attention", description: "Registry-aware household attention component." });
