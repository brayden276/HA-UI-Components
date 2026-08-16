/** Device-aware Auto-Entities adapter used by dynamic dashboard collections. */
const DEVICE_AWARE_V4_TYPE="custom:component-split-controller-v4",DEVICE_AWARE_INNER_TYPE="custom:auto-entities",deviceAwareClone=t=>JSON.parse(JSON.stringify(t)),deviceAwareEscape=t=>String(t).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),deviceAwarePattern=t=>t.length?`/^(${t.map(deviceAwareEscape).join("|")})$/`:null;class ComponentDeviceAwareAutoEntitiesV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){
    super();this.attachShadow({mode:"open"});this.t=null;this.i=null;this.o=null;this.l=0;this._=!1;this.h=null;this.u=null;
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}.head{min-height:44px;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px;color:var(--primary-text-color)}.head[hidden]{display:none}.head ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.body{min-width:0}</style><div class="head" hidden><ha-icon></ha-icon><h2></h2></div><div class="body"></div>';
    this.g=this.shadowRoot.querySelector(".head");this.m=this.shadowRoot.querySelector(".body");
  }
  setConfig(t){
    if(!t?.filter)throw new Error("An Auto-Entities filter is required");
    this.t=deviceAwareClone(t);this.q();this._=!1;clearTimeout(this.h);this.h=null;this.l+=1;this.i&&this.p();
  }
  set hass(t){this.i=t;this.v();this.o&&(this.o.hass=t);this._||this.p()}
  connectedCallback(){this.v();!this._&&this.t&&this.i&&this.p()}
  disconnectedCallback(){clearTimeout(this.h);this.h=null;this.u?.();this.u=null;this.l+=1;this._=!1}
  q(){
    const header=this.t?.header,title=String(header?.title||"").trim();
    this.g.hidden=!title;
    if(title){this.g.querySelector("ha-icon").setAttribute("icon",header?.icon||"mdi:format-list-bulleted");this.g.querySelector("h2").textContent=title}
  }
  v(){
    const registry=globalThis.__componentSplitRegistryV4;
    this.isConnected&&!this.u&&this.i&&registry?.subscribe&&(this.u=registry.subscribe(this.i,()=>{this._=!1;this.p()}));
  }
  getCardSize(){return(this.o?.getCardSize?.()??1)+(this.g?.hidden?0:1)}
  getLayoutOptions(){return this.o?.getLayoutOptions?.()??{}}
  p(){
    if(!this.t||!this.i)return;
    this._=!0;const generation=++this.l,registry=globalThis.__componentSplitRegistryV4;
    registry?.load?registry.load(this.i).then(result=>{generation===this.l&&(result.error&&this.o?this.V():(this.A(this.S(result),generation),result.error&&this.V()))}):this.A(this.S(null),generation);
  }
  V(){
    clearTimeout(this.h);this.h=setTimeout(()=>{this.h=null;this._=!1;this.isConnected&&this.p()},31e3);
  }
  S(registry){
    const config=deviceAwareClone(this.t),excludeInvalid=false!==config.exclude_invalid_states;
    delete config.header;delete config.exclude_invalid_states;config.type="custom:auto-entities";
    const filter=config.filter??={},includes=Array.isArray(filter.include)?filter.include:[],excludes=Array.isArray(filter.exclude)?filter.exclude:[],
      regular=includes.filter(rule=>rule?.options?.type!==DEVICE_AWARE_V4_TYPE),
      systems=registry?[...registry.systems.keys()].sort():[],claimed=registry?[...registry.claimed].sort():[],
      systemsPattern=deviceAwarePattern(systems),claimedPattern=deviceAwarePattern(claimed),injected=[];
    if(systemsPattern){
      for(const rule of regular.filter(rule=>rule?.domain==="climate"&&rule?.options?.type==="custom:bubble-card")){
        for(const entityId of systems){
          const split={domain:"climate",entity_id:entityId};
          if(rule.area)split.area=rule.area;
          if(rule.state)split.state=rule.state;
          if(rule.not?.state)split.not={state:rule.not.state};
          split.options={type:DEVICE_AWARE_V4_TYPE,...rule.area?{title:"Split system"}:{}};
          injected.push(split);
        }
        rule.not={...rule.not??{},entity_id:systemsPattern};
      }
    }
    const climateIndex=regular.findIndex(rule=>rule?.domain==="climate");
    filter.include=climateIndex<0?regular:[...regular.slice(0,climateIndex),...injected,...regular.slice(climateIndex)];
    filter.exclude=[...excludes];
    if(claimedPattern)filter.exclude.push({entity_id:claimedPattern});
    if(excludeInvalid)for(const state of["unavailable","unknown"])if(!filter.exclude.some(rule=>rule?.state===state&&Object.keys(rule).length===1))filter.exclude.push({state});
    config.unique=!0;return config;
  }
  async A(config,generation){
    try{
      const needsSplit=config.filter?.include?.some(rule=>rule?.options?.type===DEVICE_AWARE_V4_TYPE);
      if(needsSplit&&!customElements.get("component-split-controller-v4"))await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error("Split controller did not load")),5e3);
        customElements.whenDefined("component-split-controller-v4").then(()=>{clearTimeout(timer);resolve()});
      });
      const helpers=await window.loadCardHelpers();if(generation!==this.l)return;
      const card=helpers.createCardElement(config);card.hass=this.i;this.o=card;this.m.replaceChildren(card);
    }catch{
      if(generation===this.l&&this.V(),!this.o&&generation===this.l){
        const alert=document.createElement("ha-alert");alert.setAttribute("alert-type","error");alert.textContent="Household controls are temporarily unavailable.";this.m.replaceChildren(alert);
      }
    }
  }
}
customElements.get("component-device-aware-auto-entities-v1")||customElements.define("component-device-aware-auto-entities-v1",ComponentDeviceAwareAutoEntitiesV1);

