/**
 * HA Component Library v4.0.0
 * Generated HACS Dashboard bundle.
 *
 * Source is organised by component under src/components. Shared logic lives
 * under src/shared. Existing component CSS and runtime behaviour are preserved.
 */

// Module: src/shared/core.js
{
/** Shared card primitives. CSS values are preserved from the Components dashboard. */
const componentLibraryShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const PRESENTATIONAL_CARD_STYLES = `:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}button.demo{appearance:none;width:100%;border:0;background:transparent;text-align:inherit;padding:0;cursor:pointer}button.demo:active{transform:scale(.992)}button.demo:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}`;

const toText = (value) => (value == null ? "" : String(value));
const escapeHtml = (value) =>
  toText(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const registerCard = ({ type, element, name, description, preview = true }) => {
  if (!customElements.get(type)) customElements.define(type, element);
  window.customCards ??= [];
  if (!window.customCards.some((card) => card.type === type)) {
    window.customCards.push({ type, name, description, preview });
  }
};

const openMoreInfo = (host, entityId) => {
  if (!entityId) return;
  host.dispatchEvent(
    new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }),
  );
};

const navigateTo = (path) => {
  if (!path) return;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("location-changed"));
};

class DashboardBaseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(_hass) {}

  escapeHtml(value) {
    return escapeHtml(value);
  }

  cardStyles() {
    return `:host{display:block;min-width:0}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color);box-sizing:border-box}.wrap{box-sizing:border-box;padding:12px 14px}.title{font-size:13px;line-height:1.25;font-weight:600;color:var(--primary-text-color)}.desc{margin-top:3px;font-size:11px;line-height:1.3;color:var(--secondary-text-color)}ha-icon{--mdc-icon-size:19px}button{font:inherit;color:inherit}button.i{appearance:none;border:0;background:transparent;cursor:pointer}button.i:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button.i:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:var(--dashboard-radius-control,5px)}@media(max-width:700px){.wrap{padding:12px}}`;
  }
}

Object.assign(componentLibraryShared, {
  PRESENTATIONAL_CARD_STYLES,
  DashboardBaseCard,
  escapeHtml,
  navigateTo,
  openMoreInfo,
  registerCard,
  toText,
});
}

// Module: src/shared/registry-cache.js
{
/** Shared read-only registry cache for room-aware components. */
const DASHBOARD_REGISTRY_CACHE=new WeakMap();
const loadDashboardRegistries=connection=>{
  if(!connection||!connection.sendMessagePromise)return Promise.resolve({areas:[],devices:[],entities:[]});
  let cached=DASHBOARD_REGISTRY_CACHE.get(connection);
  if(!cached){
    cached=Promise.all([
      connection.sendMessagePromise({type:"config/area_registry/list"}),
      connection.sendMessagePromise({type:"config/device_registry/list"}),
      connection.sendMessagePromise({type:"config/entity_registry/list"})
    ]).then(values=>({
      areas:Array.isArray(values[0])?values[0]:[],
      devices:Array.isArray(values[1])?values[1]:[],
      entities:Array.isArray(values[2])?values[2]:[]
    })).catch(()=>({areas:[],devices:[],entities:[]}));
    DASHBOARD_REGISTRY_CACHE.set(connection,cached);
  }
  return cached;
};

Object.assign(globalThis.__HA_COMPONENT_LIBRARY_SHARED__, { loadDashboardRegistries });
}

// Module: src/shared/dashboard-style-tokens.js
{
/** Shared dashboard CSS custom properties, preserved verbatim. */
const DASHBOARD_SHARED_STYLE_ID="dashboard-shared-ui-tokens-v3";
let dashboardSharedStyle=document.getElementById(DASHBOARD_SHARED_STYLE_ID);
if(!dashboardSharedStyle){dashboardSharedStyle=document.createElement("style");dashboardSharedStyle.id=DASHBOARD_SHARED_STYLE_ID;document.head.append(dashboardSharedStyle)}
dashboardSharedStyle.textContent=":root{--dashboard-radius-card:8px;--dashboard-radius-control:6px;--dashboard-radius-dialog:10px;--dashboard-radius-icon:0px;--dashboard-modal-scrim:rgba(0,0,0,.16);--dashboard-card-surface:var(--ha-card-background,var(--card-background-color));--dashboard-card-muted-surface:color-mix(in srgb,var(--primary-text-color) 3%,var(--card-background-color));--dashboard-card-border-color:color-mix(in srgb,var(--primary-text-color) 10%,transparent);--dashboard-card-border:1px solid var(--dashboard-card-border-color);--dashboard-active-surface:color-mix(in srgb,var(--primary-color) 7%,var(--card-background-color));--dashboard-warning-surface:color-mix(in srgb,var(--warning-color,#f9a825) 9%,var(--card-background-color));--dashboard-critical-surface:color-mix(in srgb,var(--error-color) 8%,var(--card-background-color));--dashboard-dialog-shadow:0 16px 48px rgba(0,0,0,.22);--ha-card-border-radius:var(--dashboard-radius-card);--ha-card-box-shadow:none;--ha-card-border-width:1px;--ha-card-border-color:var(--dashboard-card-border-color);--mush-card-border-radius:var(--dashboard-radius-card);--bubble-border-radius:var(--dashboard-radius-card);--bubble-main-background-color:var(--dashboard-card-surface);--bubble-secondary-background-color:transparent;--bubble-accent-color:var(--primary-color);--bubble-border:var(--dashboard-card-border);--bubble-icon-border-radius:var(--dashboard-radius-icon);--bubble-icon-background-color:transparent;--bubble-sub-button-border-radius:var(--dashboard-radius-control);--bubble-sub-button-background-color:transparent;--bubble-button-main-background-color:var(--dashboard-card-surface);--bubble-button-border-radius:var(--dashboard-radius-card);--bubble-button-icon-border-radius:var(--dashboard-radius-icon);--bubble-button-icon-background-color:transparent;--bubble-button-box-shadow:none;--bubble-media-player-border-radius:var(--dashboard-radius-card);--bubble-media-player-buttons-border-radius:var(--dashboard-radius-control);--bubble-media-player-buttons-background-color:transparent;--bubble-media-player-icon-border-radius:var(--dashboard-radius-icon);--bubble-media-player-icon-background-color:transparent;--bubble-cover-border-radius:var(--dashboard-radius-card);--bubble-cover-icon-border-radius:var(--dashboard-radius-icon);--bubble-cover-icon-background-color:transparent;--bubble-select-border-radius:var(--dashboard-radius-card);--bubble-select-button-border-radius:var(--dashboard-radius-control);--bubble-select-button-background-color:transparent;--bubble-select-icon-border-radius:var(--dashboard-radius-icon);--bubble-select-icon-background-color:transparent;--bubble-climate-border-radius:var(--dashboard-radius-card);--bubble-climate-icon-border-radius:var(--dashboard-radius-icon);--bubble-climate-button-background-color:transparent;--bubble-calendar-border-radius:var(--dashboard-radius-card);--bubble-pop-up-border-radius:var(--dashboard-radius-dialog);--bubble-pop-up-main-background-color:var(--card-background-color);--bubble-pop-up-box-shadow:var(--dashboard-dialog-shadow);--bubble-backdrop-background-color:var(--dashboard-modal-scrim);--ha-dialog-scrim-color:var(--dashboard-modal-scrim)}@media(max-width:700px){:root{--dashboard-radius-dialog:8px}}";
}

// Module: src/shared/split-system-registry.js
{
/** Shared split-system registry backed by the split_state_registry integration. */
const SPLIT_REGISTRY_ENTITY="sensor.split_state_registry";
const splitV4Room=(roomId,room)=>room&&room.climate?{
  room_id:roomId,
  registry_entity:SPLIT_REGISTRY_ENTITY,
  climate:room.climate,
  controller_entity:room.controller,
  vertical_vane_entity:room.vertical_vane,
  horizontal_vane_entity:room.horizontal_vane,
  area_id:roomId,
  minimum_target:room.minimum_target,
  maximum_target:room.maximum_target,
  fan_ceiling:room.fan_ceiling,
  last_mode:room.last_mode,
  deadline:room.deadline,
  profiles:Array.isArray(room.profiles)?room.profiles:[]
}:null;
const buildSplitV4Registry=hass=>{
  const source=hass?.states?.[SPLIT_REGISTRY_ENTITY],rooms=source?.attributes?.rooms,systems=new Map,claimed=new Set;
  source?.entity_id&&claimed.add(source.entity_id);
  if(!rooms||typeof rooms!=="object")return{systems,claimed,error:null};
  for(const[roomId,room]of Object.entries(rooms)){
    const entry=splitV4Room(roomId,room);
    if(!entry)continue;
    systems.set(entry.climate,entry);
    for(const entityId of[entry.climate,entry.controller_entity,entry.vertical_vane_entity,entry.horizontal_vane_entity].filter(Boolean))claimed.add(entityId);
  }
  return{systems,claimed,error:null};
};
const splitV4RegistrySignature=registry=>JSON.stringify([[...registry.systems].sort(([left],[right])=>left.localeCompare(right)),[...registry.claimed].sort()]);
globalThis.__componentSplitRegistryV4??={
  result:{systems:new Map,claimed:new Set,error:null},
  subscribers:new Set,
  eventSubscription:null,
  load(hass,force=false){
    const previous=this.result,next=buildSplitV4Registry(hass);
    this.result=next;
    if(force||splitV4RegistrySignature(previous)!==splitV4RegistrySignature(next))for(const subscriber of[...this.subscribers])try{subscriber(next)}catch{}
    return Promise.resolve(next);
  },
  refresh(hass){return this.load(hass,true)},
  ensureEvents(hass){
    if(this.eventSubscription||!hass?.connection?.subscribeEvents)return;
    this.eventSubscription=hass.connection.subscribeEvents(event=>{
      event?.data?.entity_id===SPLIT_REGISTRY_ENTITY&&this.refresh(hass);
    },"state_changed").catch(()=>{this.eventSubscription=null});
  },
  subscribe(hass,subscriber){
    this.subscribers.add(subscriber),this.ensureEvents(hass),this.refresh(hass);
    return()=>{this.subscribers.delete(subscriber)};
  }
};
}

// Module: src/shared/dashboard-runtime.js
{
/** Shared dashboard registry/runtime used by entity-aware controllers. */
const { escapeHtml } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
globalThis.__homeDashboardV2??={};
const HD2=globalThis.__homeDashboardV2;
HD2.esc=escapeHtml;
HD2.domain=id=>String(id||'').split('.')[0];
HD2.label=v=>String(v??'').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
HD2.stateName=(h,e,s)=>e?.name||e?.original_name||s?.attributes?.friendly_name||e?.entity_id||'Control';
HD2.icon=(e,s)=>s?.attributes?.icon||({light:'mdi:lightbulb-outline',fan:'mdi:fan',switch:'mdi:toggle-switch-outline',input_boolean:'mdi:toggle-switch-outline',media_player:'mdi:play-circle-outline',climate:'mdi:thermostat',cover:'mdi:window-shutter',lock:'mdi:lock-outline',vacuum:'mdi:robot-vacuum',button:'mdi:gesture-tap-button',select:'mdi:format-list-bulleted',number:'mdi:tune-variant',binary_sensor:'mdi:alert-circle-outline',todo:'mdi:format-list-checks'}[HD2.domain(e?.entity_id)]||'mdi:gesture-tap-button');
HD2.validState=s=>Boolean(s&&!['unknown','unavailable'].includes(String(s.state).toLowerCase()));
HD2.prefs=async(h,key)=>{if(!h||!key)return{order:[],hidden:[]};try{return(await h.callWS({type:'frontend/get_user_data',key}))?.value||{order:[],hidden:[]}}catch{return{order:[],hidden:[]}}};
HD2.savePrefs=(h,key,value)=>h.callWS({type:'frontend/set_user_data',key,value});
HD2.applyPrefs=(items,prefs)=>{const by=new Map(items.map(x=>[x.id,x])),seen=new Set,all=[];for(const id of prefs?.order||[]){const x=by.get(id);if(x){all.push(x);seen.add(id)}}for(const x of items)if(!seen.has(x.id))all.push(x);const hidden=new Set(prefs?.hidden||[]);return{all,visible:all.filter(x=>!hidden.has(x.id)),hidden}};
HD2.REG??={connection:null,hass:null,data:null,promise:null,subs:new Set,unsubs:null,retry:null,attach(h){const c=h?.connection||null;if(this.connection===c){this.hass=h;return}this.detach();this.connection=c;this.hass=h;this.listen()},detach(){const p=this.unsubs;this.unsubs=null;p&&Promise.resolve(p).then(f=>f?.()).catch(()=>{});clearTimeout(this.retry);this.retry=null;this.connection=null;this.data=null;this.promise=null},listen(){const c=this.connection;if(!c?.subscribeEvents||this.unsubs)return;const p=Promise.all(['area_registry_updated','device_registry_updated','entity_registry_updated'].map(t=>c.subscribeEvents(()=>this.refresh(),t))).then(a=>()=>a.forEach(f=>f?.()));this.unsubs=p;p.catch(()=>{if(this.unsubs===p)this.unsubs=null;if(this.connection&&!this.retry)this.retry=setTimeout(()=>{this.retry=null;this.listen()},30000)})},async load(h,force=false){this.attach(h);if(this.data&&!force)return this.data;if(this.promise)return this.promise;const c=h?.connection;if(!c?.sendMessagePromise)return{areas:[],devices:[],entities:[],dashboards:[],deviceArea:new Map,byDevice:new Map,areaMap:new Map};this.promise=Promise.all([c.sendMessagePromise({type:'config/area_registry/list'}),c.sendMessagePromise({type:'config/device_registry/list'}),c.sendMessagePromise({type:'config/entity_registry/list'}),h.callWS({type:'lovelace/dashboards/list'}).catch(()=>[])]).then(([areas,devices,entities,dashboards])=>{areas=Array.isArray(areas)?areas:[];devices=Array.isArray(devices)?devices:[];entities=Array.isArray(entities)?entities:[];dashboards=Array.isArray(dashboards)?dashboards:[];const deviceArea=new Map(devices.map(d=>[d.id,d.area_id||null])),byDevice=new Map;for(const e of entities){if(!e?.device_id)continue;const a=byDevice.get(e.device_id)||[];a.push(e);byDevice.set(e.device_id,a)}return this.data={areas,devices,entities,dashboards,deviceArea,byDevice,areaMap:new Map(areas.map(a=>[a.area_id,a]))}}).catch(()=>this.data||{areas:[],devices:[],entities:[],dashboards:[],deviceArea:new Map,byDevice:new Map,areaMap:new Map}).finally(()=>{this.promise=null});return this.promise},refresh(){if(!this.hass)return;this.data=null;this.promise=null;this.load(this.hass,true).then(d=>{for(const f of [...this.subs])try{f(d)}catch{}})},subscribe(h,fn){this.attach(h);this.subs.add(fn);this.load(h).then(fn);return()=>this.subs.delete(fn)}};
HD2.areaOf=(e,d)=>e?.area_id||(e?.device_id?d?.deviceArea?.get(e.device_id):null)||null;

// Registry updates commonly arrive as a small burst of area, device and entity events.
// Keep one refresh in flight, then run one final pass only when an event arrived during it.
const dashboardRegistry = HD2.REG;
if (dashboardRegistry && !dashboardRegistry.__refreshCoalescingV1) {
  dashboardRegistry.__refreshCoalescingV1 = true;
  dashboardRegistry.refreshPromise = null;
  dashboardRegistry.refreshQueued = false;
  const originalDetach = dashboardRegistry.detach;
  dashboardRegistry.detach = function detachDashboardRegistry() {
    this.refreshPromise = null;
    this.refreshQueued = false;
    return originalDetach.call(this);
  };
  dashboardRegistry.refresh = function refreshDashboardRegistry() {
    if (!this.hass) return Promise.resolve(this.data);
    if (this.refreshPromise) {
      this.refreshQueued = true;
      return this.refreshPromise;
    }

    const hass = this.hass;
    const loadFresh = () => {
      if (this.hass !== hass) return this.data;
      this.data = null;
      this.promise = null;
      return this.load(hass, true);
    };
    const pending = this.promise
      ? Promise.resolve(this.promise).catch(() => {}).then(loadFresh)
      : loadFresh();
    let refreshPromise;
    refreshPromise = Promise.resolve(pending)
      .then((data) => {
        if (this.hass === hass) {
          for (const subscriber of [...this.subs]) {
            try { subscriber(data); } catch {}
          }
        }
        return data;
      })
      .finally(() => {
        if (this.refreshPromise !== refreshPromise) return;
        this.refreshPromise = null;
        if (this.refreshQueued) {
          this.refreshQueued = false;
          this.refresh();
        }
      });
    this.refreshPromise = refreshPromise;
    return refreshPromise;
  };
}
HD2.uiEntry=e=>Boolean(e?.entity_id&&!e.disabled_by&&!e.hidden_by&&!['diagnostic','config'].includes(e.entity_category));
HD2.card=async(h,c)=>{const helpers=await window.loadCardHelpers();const x=helpers.createCardElement(c);x.hass=h;return x};
HD2.controlDomains=new Set(['light','fan','switch','input_boolean','media_player','climate','cover','lock','vacuum','button','select','number']);
HD2.isPotential=(e,s)=>HD2.uiEntry(e)&&(HD2.controlDomains.has(HD2.domain(e.entity_id))||(HD2.domain(e.entity_id)==='binary_sensor'&&s?.attributes?.device_class==='garage_door'));
HD2.isActive=(e,s)=>{if(!HD2.uiEntry(e)||!s)return false;const d=HD2.domain(e.entity_id),st=s.state,a=s.attributes||{};if(['light','fan','switch','input_boolean'].includes(d))return st==='on';if(d==='media_player'){if(['playing','paused','buffering','on'].includes(st))return true;if(st==='idle'){const v=String(a.media_title||a.app_name||'');return Boolean(v&&!/^(idle|home(?: screen)?|default media receiver)$/i.test(v))}return false}if(d==='climate')return /^(heat|cool|heat_cool|auto|dry|fan_only)$/.test(st);if(d==='cover')return /^(open|opening|closing)$/.test(st);if(d==='lock')return st==='unlocked';if(d==='vacuum')return /^(cleaning|returning)$/.test(st);if(d==='binary_sensor')return st==='on'&&/^(door|window|garage_door|smoke|moisture|gas)$/.test(a.device_class||'');return false};
HD2.garageControl=(e,d,h)=>{if(!e?.device_id)return null;const sib=d?.byDevice?.get(e.device_id)||[],buttons=sib.filter(x=>HD2.domain(x.entity_id)==='button'&&HD2.uiEntry(x)&&h.states[x.entity_id]);return buttons.find(x=>/trigger|operate|door/i.test(`${x.entity_id} ${x.name||''} ${x.original_name||''}`))?.entity_id||buttons[0]?.entity_id||null};
HD2.appleTvBundle=(e,s,d,h)=>{if(HD2.domain(e?.entity_id)!=='media_player'||e?.platform!=='apple_tv')return null;const siblings=d?.byDevice?.get(e.device_id)||[],available=x=>x?.entity_id&&!x.disabled_by&&h.states[x.entity_id],named=x=>`${x.entity_id} ${x.name||''} ${x.original_name||''}`.toLowerCase(),find=(domain,match)=>siblings.find(x=>available(x)&&HD2.domain(x.entity_id)===domain&&x.platform==='apple_tv'&&(!match||match(x)));const remote=find('remote'),keyboard=find('binary_sensor',x=>/keyboard.*focus|focus.*keyboard/.test(named(x)));return{type:'custom:component-apple-tv-controller-v1',entity:e.entity_id,remote_entity:remote?.entity_id,keyboard_entity:keyboard?.entity_id,title:HD2.stateName(h,e,s),icon:'mdi:apple'}};
HD2.splitBundle=(e,d)=>{if(!e?.device_id||!d)return null;const siblings=d.byDevice?.get(e.device_id)||[],suffix=x=>String(x?.entity_id||'').split('.')[1]||'',find=(rows,domain,end)=>rows.find(x=>!x?.disabled_by&&HD2.domain(x.entity_id)===domain&&suffix(x).endsWith(end)),controller=find(siblings,'binary_sensor','_controller_status');if(!controller)return null;const vertical=find(siblings,'select','_vertical_vane'),horizontal=find(siblings,'select','_horizontal_vane');return{controller_entity:controller.entity_id,vertical_vane_entity:vertical?.entity_id,horizontal_vane_entity:horizontal?.entity_id,room_id:HD2.areaOf(e,d)}};HD2.controlConfig=(e,s,d,h,split)=>{const id=e.entity_id,dom=HD2.domain(id),bundle=dom==='climate'?HD2.splitBundle(e,d):null;if(bundle)return{type:'custom:component-split-controller-v4',entity:id,...bundle};if(dom==='binary_sensor'&&s?.attributes?.device_class==='garage_door'){const b=HD2.garageControl(e,d,h);return b?{type:'custom:component-garage-door-controller-v1',title:HD2.stateName(h,e,s).replace(/ Garage Door Status$/i,''),entity:id,control_entity:b}:{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true}}if(['light','fan','number'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'slider',entity:id,show_state:true,tap_action:{action:'more-info'}};if(['switch','input_boolean'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'switch',entity:id,show_state:true,button_action:{tap_action:{action:'toggle'}},tap_action:{action:'more-info'}};if(dom==='media_player')return HD2.appleTvBundle(e,s,d,h)||{type:'custom:bubble-card',card_type:'media-player',entity:id,show_state:true,tap_action:{action:'more-info'}};if(dom==='climate')return{type:'custom:bubble-card',card_type:'climate',entity:id,show_state:true};if(dom==='cover')return{type:'custom:bubble-card',card_type:'cover',entity:id,show_state:true};if(dom==='lock')return{type:'custom:mushroom-lock-card',entity:id};if(dom==='vacuum')return{type:'custom:mushroom-vacuum-card',entity:id};if(dom==='select')return{type:'custom:mushroom-select-card',entity:id};if(dom==='button')return{type:'custom:mushroom-entity-card',entity:id,tap_action:{action:'perform-action',perform_action:'button.press',target:{entity_id:id},confirmation:{text:'Run this control?'}},hold_action:{action:'more-info'}};if(dom==='binary_sensor')return{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true,show_last_changed:false};return null};
class DashboardPreferenceEditorV2 extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});this.built=false}open(o){this.o=o;this.items=o.items.map(x=>({...x}));const ids=new Set(this.items.map(x=>x.id));this.hidden=new Set((o.hidden||[]).filter(id=>ids.has(id)));this.build();this.render();this.d.showModal();queueMicrotask(()=>this.shadowRoot.querySelector('.x')?.focus())}build(){if(this.built)return;this.built=true;this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box}dialog{width:min(580px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 24px));border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,8px);padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.hd{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--divider-color)}h2{font-size:20px;margin:0}.x,.move,.vis{width:44px;height:44px;border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center}.x{border:1px solid var(--divider-color)}.body{padding:12px 14px 92px}.copy{font-size:13px;color:var(--secondary-text-color);line-height:1.4;margin:0 2px 10px}.rows{display:grid;gap:7px}.row{min-height:58px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 6px}.row.off{opacity:.58}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--primary-color)}.name{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{font-size:12px;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acts{display:flex}.move[disabled]{opacity:.25}.vis.off{color:var(--error-color)}.ft{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color)}.count{font-size:13px;color:var(--secondary-text-color)}.buttons{display:flex;gap:8px}.cancel,.save{min-height:44px;padding:0 13px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,6px);background:transparent;font-weight:650}.save{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:transparent}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><dialog><div class="hd"><h2></h2><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><div class="copy"></div><div class="rows"></div></div><div class="ft"><span class="count"></span><span class="buttons"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save</button></span></div></dialog>`;this.d=this.shadowRoot.querySelector('dialog');this.d.addEventListener('click',e=>{if(e.target===this.d)this.d.close()});this.shadowRoot.querySelector('.x').onclick=()=>this.d.close();this.shadowRoot.querySelector('.cancel').onclick=()=>this.d.close();this.shadowRoot.querySelector('.save').onclick=()=>this.save()}render(){this.shadowRoot.querySelector('h2').textContent=this.o.title||'Edit';this.shadowRoot.querySelector('.copy').textContent=this.o.description||'Reorder items and hide anything you do not want shown.';const rows=this.shadowRoot.querySelector('.rows');rows.replaceChildren();this.items.forEach((x,i)=>{const r=document.createElement('div'),off=this.hidden.has(x.id);r.className=`row ${off?'off':''}`;r.innerHTML=`<span class="ico"><ha-icon icon="${HD2.esc(x.icon||'mdi:circle-outline')}"></ha-icon></span><span><div class="name">${HD2.esc(x.name)}</div><div class="meta">${HD2.esc(x.meta||'')}</div></span><span class="acts"><button class="move up" type="button" aria-label="Move earlier" ${i===0?'disabled':''}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="move down" type="button" aria-label="Move later" ${i===this.items.length-1?'disabled':''}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="vis ${off?'off':''}" type="button" aria-label="${off?'Show':'Hide'} ${HD2.esc(x.name)}"><ha-icon icon="mdi:${off?'eye-outline':'eye-off-outline'}"></ha-icon></button></span>`;r.querySelector('.up').onclick=()=>this.move(i,-1);r.querySelector('.down').onclick=()=>this.move(i,1);r.querySelector('.vis').onclick=()=>{off?this.hidden.delete(x.id):this.hidden.add(x.id);this.render()};rows.append(r)});this.shadowRoot.querySelector('.count').textContent=`${this.items.length-this.hidden.size} of ${this.items.length} shown`}move(i,d){const n=i+d;if(n<0||n>=this.items.length)return;[this.items[i],this.items[n]]=[this.items[n],this.items[i]];this.render()}async save(){const b=this.shadowRoot.querySelector('.save');b.disabled=true;b.textContent='Saving…';try{await this.o.onSave?.({order:this.items.map(x=>x.id),hidden:[...this.hidden]});this.d.close()}finally{b.disabled=false;b.textContent='Save'}}}
if(!customElements.get('dashboard-preference-editor-v2'))customElements.define('dashboard-preference-editor-v2',DashboardPreferenceEditorV2);
}

// Module: src/shared/wled-runtime.js
{
/** Shared WLED registry helpers used by the controller and dashboard integration. */
const componentLibraryWledShared =
  globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

globalThis.__homeDashboardV2 ??= {};
const WLED_HD = globalThis.__homeDashboardV2;
const WLED_DOMAIN = (entityId) => String(entityId || "").split(".")[0];
const WLED_INVALID = new Set(["unknown", "unavailable", "none", ""]);
const WLED_NAME = (entry) =>
  String(entry?.original_name || entry?.name || entry?.entity_id || "").toLowerCase();

Object.assign(componentLibraryWledShared, {
  WLED_HD,
  WLED_DOMAIN,
  WLED_INVALID,
  WLED_NAME,
});
}

// Module: src/shared/update-styles.js
{
/** Shared Update card presentation styles, preserved verbatim. */
const UPDATE_CARD_STYLES = ":host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}";
Object.assign(globalThis.__HA_COMPONENT_LIBRARY_SHARED__, { UPDATE_CARD_STYLES });
}

// Module: src/support/split-settings.js
{
/** Advanced registry-backed settings panel used by ComponentSplitControllerV4. */
const SPLIT_SETTINGS_INVALID=new Set(["unknown","unavailable","none",""]);
class ComponentSplitSettingsV1 extends HTMLElement{
  constructor(){super(),this.attachShadow({mode:"open"}),this.t=!1,this.i=null,this.o=!1,this.h=null,this.l=null,this.u=null,this.p=null}
  setConfig(t){if(!t?.entity)throw new Error("Split settings requires entity");if(!t?.room_id)throw new Error("Split settings requires room_id");this.config={...t},clearTimeout(this.l),this.i=null,this.o=!1,this.h=null,this.u=null,this.p=null}
  set hass(t){this.m=t,this.t||this.v(),this._(),this.o||this.h||(this.i=this.k()),this.S()}
  disconnectedCallback(){clearTimeout(this.l),this.l=null,this.i=null,this.o=!1,this.h=null,this.u=null,this.p=null}
  focusInitial(){queueMicrotask(()=>this.shadowRoot.querySelector("button:not([disabled])")?.focus())}
  v(){this.t=!0,this.shadowRoot.innerHTML='<style>\n      :host{display:block;min-width:0}*{box-sizing:border-box}button{appearance:none;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer}button[disabled],button[aria-disabled=true]{opacity:.45;cursor:default}ha-icon{--mdc-icon-size:18px}.setting{padding:12px 0;border-top:1px solid var(--divider-color)}.setting:first-of-type{border-top:0;padding-top:0}.label{display:block;font-size:13px;font-weight:650;line-height:1.25}.hint{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.stepper{display:grid;grid-template-columns:44px minmax(88px,1fr) 44px;align-items:center;margin-top:10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;overflow:hidden}.stepper button{width:44px;height:44px;display:grid;place-items:center}.value{text-align:center;font-size:17px;font-weight:650;font-variant-numeric:tabular-nums}.fan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.fan button{min-height:48px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;display:grid;grid-template-columns:20px minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;font-size:13px;font-weight:600}.fan button[aria-checked=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}.fan .check{visibility:hidden}.fan button[aria-checked=true] .check{visibility:visible}.message{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.message:not(:empty){margin-top:10px}.message.error{color:var(--error-color)}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.actions button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.actions .save{color:var(--primary-color)}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}\n    </style>\n    <div class="setting"><span class="label">Minimum target</span><span class="hint">Lower target temperatures are corrected automatically.</span><div class="stepper min"><button type="button" data-adjust="min:-1" aria-label="Decrease minimum target"><ha-icon icon="mdi:minus"></ha-icon></button><span class="value"></span><button type="button" data-adjust="min:1" aria-label="Increase minimum target"><ha-icon icon="mdi:plus"></ha-icon></button></div></div>\n    <div class="setting"><span class="label">Maximum target</span><span class="hint">Higher target temperatures are corrected automatically.</span><div class="stepper max"><button type="button" data-adjust="max:-1" aria-label="Decrease maximum target"><ha-icon icon="mdi:minus"></ha-icon></button><span class="value"></span><button type="button" data-adjust="max:1" aria-label="Increase maximum target"><ha-icon icon="mdi:plus"></ha-icon></button></div></div>\n    <div class="setting"><span class="label">Fan ceiling</span><span class="hint">Auto remains available only when the fan is unrestricted.</span><div class="fan" role="radiogroup" aria-label="Fan ceiling"></div></div>\n    <p class="message" role="status" aria-live="polite"></p>\n    <div class="actions"><button class="reset" type="button">Reset defaults</button><button class="save" type="button">Save settings</button></div>',this.$={minValue:this.shadowRoot.querySelector(".min .value"),minDown:this.shadowRoot.querySelector('[data-adjust="min:-1"]'),minUp:this.shadowRoot.querySelector('[data-adjust="min:1"]'),maxValue:this.shadowRoot.querySelector(".max .value"),maxDown:this.shadowRoot.querySelector('[data-adjust="max:-1"]'),maxUp:this.shadowRoot.querySelector('[data-adjust="max:1"]'),fan:this.shadowRoot.querySelector(".fan"),message:this.shadowRoot.querySelector(".message"),reset:this.shadowRoot.querySelector(".reset"),save:this.shadowRoot.querySelector(".save")},this.shadowRoot.querySelectorAll("[data-adjust]").forEach(t=>{t.addEventListener("click",()=>{const[i,s]=t.dataset.adjust.split(":");this.T(i,Number(s))})}),this.$.reset.addEventListener("click",()=>this.A()),this.$.save.addEventListener("click",()=>this.I())}
  M(t){return this.m?.states?.[t]??null}
  j(t){if(null==t||""===t)return null;const i=Number(t);return Number.isFinite(i)?i:null}
  D(t){return Boolean(t&&!SPLIT_SETTINGS_INVALID.has(String(t.state).toLowerCase()))}
  k(){const t=this.M(this.config.entity);if(!this.D(t))return null;const i=this.j(t.attributes?.min_temp),s=this.j(t.attributes?.max_temp),e=this.j(t.attributes?.target_temp_step),n=this.j(this.config.minimum_target),a=this.j(this.config.maximum_target),o=this.config.fan_ceiling||"Quiet",r=["Quiet","Low","Medium","High","Unrestricted"];return[i,s,e,n,a].some(t=>null===t)||e<=0||i>=s||n<i||a>s||n>=a||!r.includes(o)?null:{min:n,max:a,fan:o,deviceMin:i,deviceMax:s,step:e,fanOptions:r}}
  _(){if(!this.h)return;const t=this.k();t&&Math.abs(t.min-this.h.min)<.001&&Math.abs(t.max-this.h.max)<.001&&t.fan===this.h.fan&&(clearTimeout(this.l),this.h=null,this.o=!1,this.i=t,this.u={text:"Settings saved.",type:"info"})}
  L(t){return`${Number.isInteger(t)?t:t.toFixed(1)}°`}
  T(t,i){if(!this.i||this.h)return;const s=Math.round(10*(this.i[t]+i*this.i.step))/10;"min"===t&&(s<this.i.deviceMin||s>=this.i.max)||"max"===t&&(s>this.i.deviceMax||s<=this.i.min)||(this.i[t]=s,this.o=!0,this.u=null,this.S())}
  N(t){this.i&&!this.h&&this.i.fanOptions.includes(t)&&(this.i.fan=t,this.o=!0,this.u=null,this.S())}
  U(t){if(this.h)return;if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(t.key))return;const i=[...this.$.fan.querySelectorAll("button:not([disabled])")];if(!i.length)return;t.preventDefault();const s=Math.max(0,i.indexOf(t.currentTarget)),e=["ArrowRight","ArrowDown"].includes(t.key)?1:-1,n=i["Home"===t.key?0:"End"===t.key?i.length-1:(s+e+i.length)%i.length];this.p=n.dataset.fanValue,this.N(n.dataset.fanValue)}
  A(){this.i&&!this.h&&(this.i.min=this.i.deviceMin,this.i.max=this.i.deviceMax,this.i.fan="Quiet",this.o=!0,this.u=null,this.S())}
  async I(){if(!this.i||!this.o||this.h)return;const t={min:this.i.min,max:this.i.max,fan:this.i.fan};this.h=t,this.u={text:"Saving settings…",type:"info"},this.S(),clearTimeout(this.l),this.l=setTimeout(()=>{this.h&&(this.h=null,this.o=!1,this.i=this.k(),this.u={text:"Home Assistant did not confirm the settings.",type:"error"},this.S())},8e3);try{await this.m.callService("split_state_registry","update_room",{room_id:this.config.room_id,minimum_target:t.min,maximum_target:t.max,fan_ceiling:t.fan}),this.config={...this.config,minimum_target:t.min,maximum_target:t.max,fan_ceiling:t.fan},this._(),this.S()}catch{clearTimeout(this.l),this.h=null,this.o=!1,this.i=this.k(),this.u={text:"Could not save settings. Current values were reloaded.",type:"error"},this.S()}}
  C(t){return{Unrestricted:"mdi:fan-auto",High:"mdi:fan-speed-3",Medium:"mdi:fan-speed-2",Low:"mdi:fan-speed-1",Quiet:"mdi:volume-low"}[t]??"mdi:fan"}
  S(){const t=this.i,i=!t,s=Boolean(this.h),e=this.p;this.p=null,this.$.minValue.textContent=t?this.L(t.min):"Unavailable",this.$.maxValue.textContent=t?this.L(t.max):"Unavailable",this.$.minDown.disabled=i||t.min<=t.deviceMin,this.$.minUp.disabled=i||t.min+t.step>=t.max,this.$.maxDown.disabled=i||t.max-t.step<=t.min,this.$.maxUp.disabled=i||t.max>=t.deviceMax;for(const t of[this.$.minDown,this.$.minUp,this.$.maxDown,this.$.maxUp])t.setAttribute("aria-disabled",String(s||t.disabled));this.$.fan.replaceChildren();for(const[i,e]of(t?.fanOptions??[]).entries()){const n=document.createElement("button");n.type="button",n.dataset.fanValue=e,n.setAttribute("role","radio"),n.setAttribute("aria-checked",String(t.fan===e)),n.tabIndex=t.fan===e||!t.fan&&0===i?0:-1,n.setAttribute("aria-disabled",String(s));const a=document.createElement("ha-icon");a.setAttribute("icon",this.C(e));const o=document.createElement("span");o.textContent=e;const r=document.createElement("ha-icon");r.className="check",r.setAttribute("icon","mdi:check"),n.append(a,o,r),n.addEventListener("click",()=>this.N(e)),n.addEventListener("focus",()=>{this.p=e}),n.addEventListener("keydown",t=>this.U(t)),this.$.fan.append(n)}e&&queueMicrotask(()=>this.$.fan.querySelector(`[data-fan-value="${CSS.escape(e)}"]`)?.focus()),this.$.reset.disabled=i,this.$.reset.setAttribute("aria-disabled",String(i||s)),this.$.save.disabled=i,this.$.save.setAttribute("aria-disabled",String(i||!this.o||s)),this.$.save.textContent=s?"Saving…":"Save settings",this.$.message.textContent=i?"Settings are temporarily unavailable.":this.u?.text??"",this.$.message.classList.toggle("error",i||"error"===this.u?.type)}
}
customElements.get("component-split-settings-v1")||customElements.define("component-split-settings-v1",ComponentSplitSettingsV1);
}

// Module: src/support/device-aware-auto-entities.js
{
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
    this.t=deviceAwareClone(t);this.q();this._=!1;clearTimeout(this.h);this.h=null;this.l+=1;this.isConnected&&this.i&&this.p();
  }
  set hass(t){this.i=t;this.v();this.isConnected&&this.o&&(this.o.hass=t);this.isConnected&&!this._&&this.p()}
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
    if(!this.isConnected||!this.t||!this.i)return;
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
}

// Module: src/support/empty-state-v2.js
{
/** ComponentEmptyStateV2 — reusable Home Assistant dashboard card. */

const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEmptyStateV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:check-circle-outline',title:'Nothing requires attention',message:'Supporting empty-state message.',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}ha-card{border:0;background:transparent;box-shadow:none}.wrap{min-height:40px;padding:0 2px;display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;gap:8px}.icon{width:24px;height:24px;display:grid;place-items:center;background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:18px}.desc{margin-top:1px;font-size:12px;line-height:1.3}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.message)}</div></span></div></ha-card>`}}
registerCard({ type: "component-empty-state-v2", element: ComponentEmptyStateV2, name: "Empty State V2", description: "Reusable compact empty-state component." });
}

// Module: src/support/dashboard-preference-editor.js
{
class DashboardPreferenceEditorV3 extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});this.built=false;this.hiddenIds=new Set}open(o){this.o=o;this.items=o.items.map(x=>({...x}));const ids=new Set(this.items.map(x=>x.id));this.hiddenIds=new Set((o.hidden||[]).filter(id=>ids.has(id)));this.build();this.render();this.d.showModal();queueMicrotask(()=>this.shadowRoot.querySelector('.x')?.focus())}build(){if(this.built)return;this.built=true;this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box}dialog{width:min(560px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,8px);padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.hd{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--divider-color);background:var(--card-background-color)}h2{font-size:16px;line-height:1.2;font-weight:500;margin:0}.x,.move,.vis{width:44px;height:44px;border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center;color:var(--secondary-text-color)}.x ha-icon,.move ha-icon,.vis ha-icon{--mdc-icon-size:17px}.body{padding:12px 14px 88px}.copy{font-size:12px;color:var(--secondary-text-color);line-height:1.45;margin:0 2px 10px}.rows{display:grid;gap:7px}.row{min-height:56px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 6px}.row.off{opacity:.52}.ico{width:32px;height:32px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:18px}.name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{font-size:12px;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acts{display:flex}.move[disabled]{opacity:.22}.vis.off{color:var(--error-color)}.ft{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color)}.count{font-size:12px;color:var(--secondary-text-color)}.buttons{display:flex;gap:8px}.cancel,.save{min-height:42px;padding:0 13px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,6px);background:transparent;font-size:13px;font-weight:500}.save{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:transparent}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><dialog><div class="hd"><h2></h2><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><div class="copy"></div><div class="rows"></div></div><div class="ft"><span class="count"></span><span class="buttons"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save</button></span></div></dialog>`;this.d=this.shadowRoot.querySelector('dialog');this.d.addEventListener('click',e=>{if(e.target===this.d)this.d.close()});this.shadowRoot.querySelector('.x').onclick=()=>this.d.close();this.shadowRoot.querySelector('.cancel').onclick=()=>this.d.close();this.shadowRoot.querySelector('.save').onclick=()=>this.save()}render(){this.shadowRoot.querySelector('h2').textContent=this.o.title||'Edit';this.shadowRoot.querySelector('.copy').textContent=this.o.description||'Reorder or hide items.';const rows=this.shadowRoot.querySelector('.rows');rows.replaceChildren();this.items.forEach((x,i)=>{const r=document.createElement('div'),off=this.hiddenIds.has(x.id);r.className=`row ${off?'off':''}`;r.innerHTML=`<span class="ico"><ha-icon icon="${x.icon||'mdi:circle-outline'}"></ha-icon></span><span><div class="name"></div><div class="meta"></div></span><span class="acts"><button class="move up" type="button" aria-label="Move earlier" ${i===0?'disabled':''}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="move down" type="button" aria-label="Move later" ${i===this.items.length-1?'disabled':''}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="vis ${off?'off':''}" type="button" aria-label="${off?'Show':'Hide'}"><ha-icon icon="mdi:${off?'eye-outline':'eye-off-outline'}"></ha-icon></button></span>`;r.querySelector('.name').textContent=x.name;r.querySelector('.meta').textContent=x.meta||'';r.querySelector('.up').onclick=()=>this.move(i,-1);r.querySelector('.down').onclick=()=>this.move(i,1);r.querySelector('.vis').onclick=()=>{off?this.hiddenIds.delete(x.id):this.hiddenIds.add(x.id);this.render()};rows.append(r)});this.shadowRoot.querySelector('.count').textContent=`${this.items.length-this.hiddenIds.size} of ${this.items.length} shown`}move(i,d){const n=i+d;if(n<0||n>=this.items.length)return;[this.items[i],this.items[n]]=[this.items[n],this.items[i]];this.render()}async save(){const b=this.shadowRoot.querySelector('.save');b.disabled=true;b.textContent='Saving…';try{await this.o.onSave?.({order:this.items.map(x=>x.id),hidden:[...this.hiddenIds]});this.d.close()}finally{b.disabled=false;b.textContent='Save'}}}if(!customElements.get('dashboard-preference-editor-v3'))customElements.define('dashboard-preference-editor-v3',DashboardPreferenceEditorV3);
}

// Module: src/components/single-kpi.js
{
/** ComponentSingleKpiV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentSingleKpiV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={value:'00',label:'Primary metric',support_value:'00',support_label:'Supporting context',interactive:true,...c};this.r()} set hass(h){} getCardSize(){return 2}
 r(){this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-height:70px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em;white-space:nowrap}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color);white-space:nowrap}.support{text-align:right;font-size:11.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap}.support b{font-weight:600;color:var(--primary-text-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.support{font-size:11px}}</style><ha-card><button class="demo" type="button" ${this.c.interactive?'':'disabled'}><div class="wrap"><div><div class="value">${escapeHtml(this.c.value)}</div><div class="label">${escapeHtml(this.c.label)}</div></div><div class="support"><b>${escapeHtml(this.c.support_value)}</b> ${escapeHtml(this.c.support_label)}</div></div></button></ha-card>`}}
registerCard({ type: "component-single-kpi-v2", element: ComponentSingleKpiV2, name: "Single KPI", description: "Reusable single KPI component." });
}

// Module: src/components/three-stat-summary.js
{
/** ComponentThreeStatV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentThreeStatV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={metric_1_value:'00',metric_1_label:'Metric one',metric_2_value:'00',metric_2_label:'Metric two',metric_3_value:'00',metric_3_label:'Metric three',interactive:true,...c};this.r()} set hass(h){} getCardSize(){return 2}
 r(){this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;min-height:70px;align-items:center}.stat{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;text-align:center;min-width:0;cursor:pointer}.stat:first-child{text-align:left}.stat:last-child{text-align:right}.stat:active{transform:scale(.98)}.stat:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:8px}.value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:5px;font-size:10.5px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;gap:8px}.value{font-size:20px}.label{font-size:10px}}</style><ha-card><div class="wrap">${[1,2,3].map(i=>`<button class="stat" type="button" ${this.c.interactive?'':'disabled'}><div class="value">${escapeHtml(this.c[`metric_${i}_value`])}</div><div class="label">${escapeHtml(this.c[`metric_${i}_label`])}</div></button>`).join('')}</div></ha-card>`}}
registerCard({ type: "component-three-stat-v2", element: ComponentThreeStatV2, name: "Three-stat Summary", description: "Reusable three-stat summary component." });
}

// Module: src/components/status-row.js
{
/** ComponentStatusRowV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentStatusRowV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={title:'Status title',description:'Supporting description',status_value:'Active',status_label:'Current state',icon:'mdi:information-outline',interactive:true,...c};this.r()} set hass(h){} getCardSize(){return 2}
 r(){this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status{text-align:right;white-space:nowrap}.status b{display:block;font-size:12px;font-weight:650}.status span{display:block;margin-top:3px;font-size:10.5px;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}</style><ha-card><button class="demo" type="button" ${this.c.interactive?'':'disabled'}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></div><div class="status"><b>${escapeHtml(this.c.status_value)}</b><span>${escapeHtml(this.c.status_label)}</span></div></div></button></ha-card>`}}
registerCard({ type: "component-status-row-v2", element: ComponentStatusRowV2, name: "Status Row", description: "Reusable status row component." });
}

// Module: src/components/progress-target.js
{
/** ComponentProgressV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentProgressV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={value:'68%',label:'Progress metric',progress:68,target_value:'100%',target_label:'Target',...c};this.r()} set hass(h){} getCardSize(){return 2}
 r(){let p=Math.min(100,Math.max(0,Number(this.c.progress)||0));this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;min-height:78px}.head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color)}.target{text-align:right;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap}.target b{font-weight:600;color:var(--primary-text-color)}.track{height:5px;margin-top:11px;border-radius:999px;background:var(--secondary-background-color);overflow:hidden}.fill{height:100%;border-radius:inherit;background:var(--primary-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.target{font-size:11px}}</style><ha-card><div class="wrap"><div class="head"><div><div class="value">${escapeHtml(this.c.value)}</div><div class="label">${escapeHtml(this.c.label)}</div></div><div class="target"><b>${escapeHtml(this.c.target_value)}</b> ${escapeHtml(this.c.target_label)}</div></div><div class="track"><div class="fill" style="width:${p}%"></div></div></div></ha-card>`}}
registerCard({ type: "component-progress-v2", element: ComponentProgressV2, name: "Progress / Target", description: "Reusable progress and target component." });
}

// Module: src/components/action-card.js
{
/** ComponentActionV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentActionV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={title:'Action title',description:'What this action will do',action_text:'Open',icon:'mdi:gesture-tap-button',...c};this.r()} set hass(h){this.h=h} getCardSize(){return 2}
 r(){this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action{min-height:32px;padding:0 10px;border-radius:11px;display:flex;align-items:center;background:var(--secondary-background-color);color:var(--primary-color);font-size:11.5px;font-weight:650;white-space:nowrap}@media(max-width:700px){.wrap{padding:12px}}</style><ha-card><button class="demo" type="button"><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></span><span class="action">${escapeHtml(this.c.action_text)}</span></div></button></ha-card>`;this.shadowRoot.querySelector('button').onclick=()=>{if(this.c.navigation_path)navigateTo(this.c.navigation_path);else if(this.c.more_info_entity)openMoreInfo(this,this.c.more_info_entity)}}}
registerCard({ type: "component-action-v2", element: ComponentActionV2, name: "Action Card", description: "Reusable navigation and more-info action card." });
}

// Module: src/components/list-ranking.js
{
/** ComponentListV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentListV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={rows:[{title:'First item',description:'Supporting detail',value:'00',label:'Metric'},{title:'Second item',description:'Supporting detail',value:'00',label:'Metric'},{title:'Third item',description:'Supporting detail',value:'00',label:'Metric'}],interactive:true,...c};this.r()} set hass(h){} getCardSize(){return 3}
 r(){let rows=Array.isArray(this.c.rows)?this.c.rows.slice(0,6):[];this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:2px 14px}.row{appearance:none;width:100%;border:0;border-top:1px solid var(--divider-color);background:transparent;color:inherit;font:inherit;min-height:54px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:0;text-align:left;cursor:pointer}.row:first-child{border-top:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}.title{font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:2px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric{text-align:right;white-space:nowrap;font-size:11px;color:var(--secondary-text-color)}.metric b{font-size:12px;font-weight:650;color:var(--primary-text-color);margin-right:4px}@media(max-width:700px){.wrap{padding:2px 12px}}</style><ha-card><div class="wrap">${rows.map(r=>`<button class="row" type="button" ${this.c.interactive?'':'disabled'}><span><div class="title">${escapeHtml(r.title)}</div><div class="desc">${escapeHtml(r.description)}</div></span><span class="metric"><b>${escapeHtml(r.value)}</b>${escapeHtml(r.label)}</span></button>`).join('')}</div></ha-card>`}}
registerCard({ type: "component-list-v2", element: ComponentListV2, name: "List / Ranking", description: "Reusable list and ranking component." });
}

// Module: src/components/notice.js
{
/** ComponentNoticeV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentNoticeV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'})} setConfig(c){this.c={title:'Notice title',message:'Important supporting information appears here.',tone:'info',icon:'mdi:information-outline',...c};this.r()} set hass(h){} getCardSize(){return 2}
 r(){let tone=['warning','error','success'].includes(this.c.tone)?this.c.tone:'';this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}.warning .icon{color:var(--warning-color,var(--primary-color))}.error .icon{color:var(--error-color,var(--primary-color))}.success .icon{color:var(--success-color,var(--primary-color))}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650}.message{margin-top:3px;font-size:10.5px;line-height:1.35;color:var(--secondary-text-color)}</style><ha-card><div class="wrap ${tone}"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(this.c.title)}</div><div class="message">${escapeHtml(this.c.message)}</div></div></div></ha-card>`}}
registerCard({ type: "component-notice-v2", element: ComponentNoticeV2, name: "Alert / Notice", description: "Reusable alert and notice component." });
}

// Module: src/components/device-discovery.js
{
/** ComponentDeviceDiscoveryV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  navigateTo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentDeviceDiscoveryV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._loadPromise = null;
    this._loadGeneration = 0;
    this._accessState = null;
  }

  setConfig(config) {
    const wasDemo = Boolean(this.c?.demo);
    this.c = {
      demo: false,
      refresh_seconds: 60,
      max_rows: 6,
      ...config,
    };

    if (this.c.demo) {
      this._accessState = null;
      if (!wasDemo || this.started) {
        clearInterval(this.timer);
        this.timer = null;
        this.started = false;
        this._loadGeneration += 1;
        this._loadPromise = null;
      }
      this.render(this.demoRows());
      return;
    }

    if (wasDemo) this._start();
  }

  set hass(hass) {
    this.h = hass;

    if (this.c?.demo) {
      this.render(this.demoRows());
      return;
    }

    this._start();
  }

  connectedCallback() {
    this._start();
  }

  disconnectedCallback() {
    clearInterval(this.timer);
    this.timer = null;
    this.started = false;
    this._loadGeneration += 1;
    this._loadPromise = null;
  }

  _start() {
    if (!this.isConnected || !this.h || this.c?.demo) return;
    if (!this._isAdmin()) {
      clearInterval(this.timer);
      this.timer = null;
      const active = this.started || this._loadPromise;
      this.started = false;
      if (active) {
        this._loadGeneration += 1;
        this._loadPromise = null;
      }
      this._showAdmin();
      return;
    }
    this._accessState = null;
    if (this.started) return;
    this.started = true;
    this.load();
    const seconds = Math.max(30, Number(this.c?.refresh_seconds) || 60);
    this.timer = setInterval(() => this.load(true), seconds * 1000);
  }

  _isAdmin() {
    return !this.h?.user || this.h.user.is_admin;
  }

  _showAdmin() {
    if (this._accessState === "admin") return;
    this._accessState = "admin";
    this.renderState("admin");
  }

  getCardSize() {
    return 3;
  }

  escape(value) {
    return escapeHtml(value);
  }

  name(flow) {
    const placeholders = flow?.context?.title_placeholders || {};
    return (
      placeholders.name ||
      placeholders.device ||
      placeholders.host ||
      flow.handler ||
      "Discovered device"
    );
  }

  source(value) {
    return (
      {
        bluetooth: "Bluetooth",
        dhcp: "DHCP",
        discovery: "Discovery",
        esphome: "ESPHome",
        hardware: "Hardware",
        hassio: "Home Assistant",
        homekit: "HomeKit",
        integration_discovery: "Discovery",
        mqtt: "MQTT",
        ssdp: "SSDP",
        usb: "USB",
        zeroconf: "mDNS",
      }[value] ||
      value ||
      "Discovery"
    );
  }

  pending(flows) {
    const sources = new Set([
      "bluetooth",
      "dhcp",
      "discovery",
      "esphome",
      "hardware",
      "hassio",
      "homekit",
      "integration_discovery",
      "mqtt",
      "ssdp",
      "usb",
      "zeroconf",
    ]);

    return (flows || [])
      .filter((flow) => sources.has(flow?.context?.source))
      .sort((a, b) => this.name(a).localeCompare(this.name(b)));
  }

  demoRows() {
    return [
      {
        handler: "example_integration",
        context: {
          source: "zeroconf",
          title_placeholders: { name: "Discovered device" },
        },
      },
      {
        handler: "example_bridge",
        context: {
          source: "dhcp",
          title_placeholders: { name: "Discovered bridge" },
        },
      },
    ];
  }

  navigate() {
    navigateTo("/config/integrations/dashboard");
  }

  async load(silent = false) {
    if (!this.h || this.c?.demo) return;

    if (this._loadPromise) return this._loadPromise;

    if (!silent) this.renderState("loading");

    if (!this._isAdmin()) {
      this._showAdmin();
      return;
    }

    const generation = this._loadGeneration;
    const hass = this.h;
    const request = Promise.resolve()
      .then(() => hass.callWS({ type: "config_entries/flow/progress" }))
      .then((flows) => {
        if (generation === this._loadGeneration && !this.c?.demo) {
          this.render(this.pending(flows));
        }
      })
      .catch(() => {
        if (generation === this._loadGeneration && !this.c?.demo) {
          this.renderState("error");
        }
      })
      .finally(() => {
        if (this._loadPromise === request) this._loadPromise = null;
      });
    this._loadPromise = request;
    return request;
  }

  styles() {
    return `${PRESENTATIONAL_CARD_STYLES}
      .card { padding: 4px 14px; }
      .summary,
      .state {
        min-height: 64px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
      }
      .state { padding: 8px 0; }
      .icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
      }
      ha-icon { --mdc-icon-size: 20px; }
      .title {
        font-size: 13px;
        line-height: 1.25;
        font-weight: 650;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .description {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.35;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .refresh,
      .review,
      .retry {
        appearance: none;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
        font: inherit;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
      }
      .refresh {
        width: 44px;
        padding: 0;
        display: grid;
        place-items: center;
      }
      .review,
      .retry { padding: 0 12px; }
      .refresh:active,
      .review:active,
      .retry:active { transform: scale(.98); }
      .refresh:focus-visible,
      .review:focus-visible,
      .retry:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .row {
        min-height: 64px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border-top: 1px solid var(--divider-color);
      }
      .row .icon { background: var(--secondary-background-color); }
      .more {
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--divider-color);
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      .error .icon { color: var(--error-color, var(--primary-color)); }
      .success .icon { color: var(--success-color, var(--primary-color)); }
      @media (max-width: 700px) {
        .card { padding: 4px 12px; }
        .summary,
        .state,
        .row { gap: 10px; }
      }
    `;
  }

  renderState(kind) {
    const content = {
      loading: {
        className: "",
        icon: "mdi:progress-clock",
        title: "Checking for devices",
        description: "Reading Home Assistant discovery suggestions.",
      },
      admin: {
        className: "error",
        icon: "mdi:shield-lock-outline",
        title: "Administrator access required",
        description: "Device discovery is available to administrators only.",
      },
      error: {
        className: "error",
        icon: "mdi:alert-circle-outline",
        title: "Discovery could not be loaded",
        description: "Retry the Home Assistant discovery check.",
      },
    }[kind];

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="state ${content.className}">
            <span class="icon"><ha-icon icon="${content.icon}"></ha-icon></span>
            <span>
              <div class="title">${content.title}</div>
              <div class="description">${content.description}</div>
            </span>
            ${
              kind === "error"
                ? '<button class="retry" type="button">Retry</button>'
                : ""
            }
          </div>
        </div>
      </ha-card>`;

    this.shadowRoot.querySelector(".retry")?.addEventListener("click", () =>
      this.load(),
    );
  }

  render(flows) {
    const limit = Math.max(1, Number(this.c?.max_rows) || 6);
    const shown = flows.slice(0, limit);
    const remaining = Math.max(0, flows.length - shown.length);
    const empty = flows.length === 0;
    const title = empty
      ? "No devices waiting"
      : `${flows.length} ${flows.length === 1 ? "device" : "devices"} found`;
    const description = empty
      ? "Home Assistant has no new setup suggestions."
      : "Home Assistant has setup suggestions ready to review.";

    const rows = shown
      .map(
        (flow) => `<div class="row">
          <span class="icon"><ha-icon icon="mdi:plus-circle-outline"></ha-icon></span>
          <span>
            <div class="title">${this.escape(this.name(flow))}</div>
            <div class="description">${this.escape(
              `${this.source(flow.context?.source)} · ${flow.handler}`,
            )}</div>
          </span>
          <button class="review" type="button">Review</button>
        </div>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="summary ${empty ? "success" : ""}">
            <span class="icon"><ha-icon icon="${
              empty ? "mdi:check-circle-outline" : "mdi:radar"
            }"></ha-icon></span>
            <span>
              <div class="title">${title}</div>
              <div class="description">${description}</div>
            </span>
            <button class="refresh" type="button" aria-label="Refresh discovery">
              <ha-icon icon="mdi:refresh"></ha-icon>
            </button>
          </div>
          ${rows}
          ${
            remaining
              ? `<div class="more">${remaining} more ${
                  remaining === 1 ? "suggestion" : "suggestions"
                } available in Integrations</div>`
              : ""
          }
        </div>
      </ha-card>`;

    this.shadowRoot.querySelector(".refresh")?.addEventListener("click", () =>
      this.load(),
    );
    this.shadowRoot.querySelectorAll(".review").forEach((button) =>
      button.addEventListener("click", () => this.navigate()),
    );
  }
}
registerCard({ type: "component-device-discovery-v2", element: ComponentDeviceDiscoveryV2, name: "Device Discovery", description: "Reusable device-discovery status component." });
}

// Module: src/components/quick-navigation.js
{
/** ComponentQuickNavigationV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentQuickNavigationV2 extends DashboardBaseCard {
  setConfig(c) {
    this.c = {
      left_icon: "mdi:weather-partly-cloudy",
      left_text: "Context",
      left_entity: null,
      action_1_icon: "mdi:view-dashboard-outline",
      action_1_text: "Destination",
      action_1_path: null,
      action_2_icon: "mdi:cog-outline",
      action_2_text: "Settings",
      action_2_path: null,
      ...c,
    };
    this._hasHass = false;
    this._leftState = undefined;
    this._leftStateText = undefined;
    this.r();
  }

  set hass(h) {
    this.h = h;
    const state = this.c?.left_entity ? h?.states?.[this.c.left_entity] : null;
    const stateText = state ? this.formatState(state) : null;
    if (!this._hasHass || state !== this._leftState || stateText !== this._leftStateText) {
      this._hasHass = true;
      this._leftState = state;
      this._leftStateText = stateText;
      this.r();
    } else {
      const contextIcon = this.shadowRoot?.getElementById("context-icon");
      if (contextIcon && state) {
        contextIcon.hass = h;
        contextIcon.stateObj = state;
      }
    }
  }

  getCardSize() {
    return 1;
  }

  moreInfo(entityId) {
    openMoreInfo(this, entityId);
  }

  navigate(path) {
    navigateTo(path);
  }

  formatState(state) {
    try {
      return this.h.formatEntityState(state);
    } catch {
      return String(state?.state || "");
    }
  }

  r() {
    if (!this.c) return;
    const stateObj =
      this.c.left_entity && this.h
        ? this.h.states[this.c.left_entity]
        : null;
    const leftText = stateObj
      ? this.formatState(stateObj)
      : this.c.left_entity
        ? "Unavailable"
        : this.c.left_text;
    const leftIcon = stateObj
      ? '<ha-state-icon id="context-icon"></ha-state-icon>'
      : `<ha-icon icon="${this.escapeHtml(this.c.left_icon)}"></ha-icon>`;
    const disabled1 = this.c.action_1_path ? "" : "disabled";
    const disabled2 = this.c.action_2_path ? "" : "disabled";
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.wrap{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px}.group{display:flex;align-items:center;gap:8px}.chip{min-height:44px;border:1px solid var(--divider-color)!important;border-radius:var(--dashboard-radius-control,8px);padding:0 13px!important;display:flex;align-items:center;gap:7px;color:var(--primary-text-color);font-size:13px;font-weight:600;white-space:nowrap}.chip ha-icon,.chip ha-state-icon{color:var(--primary-color);--mdc-icon-size:19px}.chip:disabled{cursor:default;opacity:1}@media(max-width:520px){.chip{width:44px;padding:0!important;justify-content:center}.chip span{display:none}.context{width:auto;padding:0 12px!important}.context span{display:inline}}</style><ha-card><div class="wrap"><button class="i chip context" id="context" type="button" aria-label="${this.escapeHtml(this.c.left_text)}">${leftIcon}<span>${this.escapeHtml(leftText)}</span></button><div class="group"><button class="i chip" id="action-1" type="button" aria-label="${this.escapeHtml(this.c.action_1_text)}" ${disabled1}><ha-icon icon="${this.escapeHtml(this.c.action_1_icon)}"></ha-icon><span>${this.escapeHtml(this.c.action_1_text)}</span></button><button class="i chip" id="action-2" type="button" aria-label="${this.escapeHtml(this.c.action_2_text)}" ${disabled2}><ha-icon icon="${this.escapeHtml(this.c.action_2_icon)}"></ha-icon><span>${this.escapeHtml(this.c.action_2_text)}</span></button></div></div></ha-card>`;
    const contextIcon = this.shadowRoot.getElementById("context-icon");
    if (contextIcon && stateObj) {
      contextIcon.hass = this.h;
      contextIcon.stateObj = stateObj;
    }
    const context = this.shadowRoot.getElementById("context");
    context.disabled = !this.c.left_entity;
    context.onclick = () => this.moreInfo(this.c.left_entity);
    this.shadowRoot.getElementById("action-1").onclick = () =>
      this.navigate(this.c.action_1_path);
    this.shadowRoot.getElementById("action-2").onclick = () =>
      this.navigate(this.c.action_2_path);
  }
}
registerCard({ type: "component-quick-nav-v2", element: ComponentQuickNavigationV2, name: "Quick Navigation", description: "Reusable quick navigation component." });
}

// Module: src/components/navigation-tile.js
{
/** ComponentNavigationTileV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentNavigationTileV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:door-open',title:'Destination',context:'Navigation',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.nav{width:100%;text-align:left}.wrap{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}</style><ha-card><button class="i nav" type="button"><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.context)}</div></span></div></button></ha-card>`}}
registerCard({ type: "component-nav-tile-v2", element: ComponentNavigationTileV2, name: "Navigation Tile", description: "Reusable navigation tile component." });
}

// Module: src/components/control-row.js
{
/** ComponentControlRowV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentControlRowV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:lightbulb-outline',title:'Control name',state:'Current state',mode:'slider',value:68,...c};this.on=this.c.on!==false;this.val=Math.max(0,Math.min(100,Number(this.c.value)||68));this.r()} getCardSize(){return 1}
 r(){let m=this.c.mode,ctl=m==='switch'?`<span class="switch ${this.on?'on':''}"><span></span></span>`:m==='state'?`<span class="metric">${this.escapeHtml(this.c.value)}</span>`:m==='action'?'<span class="action">Action</span>':`<span class="slider"><span style="width:${this.val}%"></span></span>`;this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.row{width:100%;text-align:left}.wrap{min-height:56px;display:grid;grid-template-columns:36px minmax(0,1fr) minmax(72px,auto);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.control{justify-self:end;min-width:72px;display:flex;justify-content:flex-end}.metric{font-size:13px;font-weight:600}.slider{width:96px;height:5px;border-radius:var(--dashboard-radius-control,8px);background:var(--divider-color);overflow:hidden}.slider span{display:block;height:100%;background:var(--primary-color);border-radius:var(--dashboard-radius-control,8px)}.switch{width:38px;height:22px;border-radius:var(--dashboard-radius-control,8px);background:var(--divider-color);padding:3px;box-sizing:border-box}.switch span{display:block;width:16px;height:16px;border-radius:50%;background:var(--secondary-text-color);transition:margin .12s,background .12s}.switch.on{background:color-mix(in srgb,var(--primary-color) 35%,var(--divider-color))}.switch.on span{margin-left:16px;background:var(--primary-color)}.action{min-height:30px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--primary-color);font-size:11.5px;font-weight:600;display:grid;place-items:center}</style><ha-card><button class="i row" type="button"><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.state)}</div></span><span class="control">${ctl}</span></div></button></ha-card>`;this.shadowRoot.querySelector('button').onclick=()=>{if(m==='switch'){this.on=!this.on;this.r()}else if(m==='slider'){this.val=(this.val+20)%120;if(this.val>100)this.val=0;this.r()}}}}
registerCard({ type: "component-control-row-v2", element: ComponentControlRowV2, name: "Control Row", description: "Reusable control-row component." });
}

// Module: src/components/media-row.js
{
/** ComponentMediaRowV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentMediaRowV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:speaker',title:'Media player',state:'Playing · Media title',...c};this.playing=true;this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.wrap{min-height:56px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,0px);background:transparent;color:var(--primary-color)}.buttons{display:flex;gap:4px}.btn{width:30px;height:30px;border:1px solid var(--dashboard-card-border-color,var(--divider-color))!important;border-radius:var(--dashboard-radius-control,5px)!important;background:transparent!important;display:grid;place-items:center;color:var(--secondary-text-color);padding:0!important}.btn.main{color:var(--primary-color)}.btn ha-icon{--mdc-icon-size:17px}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.state)}</div></span><span class="buttons"><button class="i btn" type="button" aria-label="Previous"><ha-icon icon="mdi:skip-previous"></ha-icon></button><button class="i btn main" type="button" aria-label="${this.playing?'Pause':'Play'}"><ha-icon icon="mdi:${this.playing?'pause':'play'}"></ha-icon></button><button class="i btn" type="button" aria-label="Next"><ha-icon icon="mdi:skip-next"></ha-icon></button></span></div></ha-card>`;this.shadowRoot.querySelector('.main').onclick=()=>{this.playing=!this.playing;this.r()}}}
registerCard({ type: "component-media-row-v2", element: ComponentMediaRowV2, name: "Media Row", description: "Reusable media-row component." });
}

// Module: src/components/component-apple-tv-controller-v1.js
{
/** ComponentAppleTvControllerV1 - compact Apple TV controller with Split-style advanced controls. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const ATV_INVALID = new Set(["unknown", "unavailable", "none", ""]);
const ATV_MEDIA_VOLUME_MUTE = 8;
const ATV_MEDIA_VOLUME_STEP = 1024;
const ATV_MEDIA_SELECT_SOURCE = 2048;
const ATV_REMOTE_COMMANDS = [
  ["menu", "Menu", "mdi:keyboard-return"],
  ["up", "Up", "mdi:chevron-up"],
  ["top_menu", "Top menu", "mdi:format-list-bulleted"],
  ["left", "Left", "mdi:chevron-left"],
  ["select", "Select", "mdi:circle-outline"],
  ["right", "Right", "mdi:chevron-right"],
  ["home", "Home", "mdi:home-variant-outline"],
  ["down", "Down", "mdi:chevron-down"],
];

class ComponentAppleTvControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.signature = "";
    this.sourceFilter = "";
    this.pending = "";
    this.message = "";
    this.messageType = "info";
    this.panelOpen = false;
    this.panelTrigger = null;
    this.sleepConfirm = false;
    this.messageTimer = null;
    this.pendingTimer = null;
    this.sleepTimer = null;
  }

  setConfig(config) {
    if (!config?.entity && !config?.demo) throw new Error("An Apple TV media-player entity is required");
    const demoDefaults = config?.demo ? {
      entity: "media_player.demo_apple_tv",
      remote_entity: "remote.demo_apple_tv",
      keyboard_entity: "binary_sensor.demo_apple_tv_keyboard_focus",
    } : {};
    this.clearTransientState();
    this.config = {
      icon: "mdi:apple",
      show_app_selector: true,
      show_power_controls: true,
      show_keyboard_status: true,
      ...demoDefaults,
      ...config,
    };
    this.signature = "";
    this.sourceFilter = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    const signature = this.stateSignature();
    if (signature !== this.signature) {
      this.signature = signature;
      this.render();
    } else {
      this.renderMessage();
    }
  }

  connectedCallback() {
    if (this.config && !this.built) this.build();
  }

  disconnectedCallback() {
    this.clearTransientState();
  }

  getCardSize() { return 2; }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button,input{font:inherit;color:inherit}button{appearance:none;border:0;background:transparent;cursor:pointer}ha-card{container-type:inline-size;display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,8px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}ha-icon{--mdc-icon-size:20px}.atv-wrap{padding:12px 14px}.atv-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.atv-identity{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.atv-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);color:var(--secondary-text-color);background:transparent}.atv-icon.active{color:var(--primary-color)}.atv-copy{min-width:0}.atv-name,.atv-status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-name{font-size:13px;line-height:1.25;font-weight:650}.atv-status{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.atv-open{min-height:40px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:flex;align-items:center;gap:6px;color:var(--secondary-text-color);font-size:13px;font-weight:650}.atv-open ha-icon{--mdc-icon-size:18px}.atv-open[aria-expanded=true],.atv-open:hover{color:var(--primary-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.atv-volume{margin-top:11px;display:grid;grid-template-columns:44px minmax(82px,1fr) 44px;align-items:center;gap:10px}.atv-volume.unavailable{grid-template-columns:1fr}.atv-volume-btn{width:44px;height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center;color:var(--secondary-text-color)}.atv-volume-btn:not(:disabled):hover,.atv-volume-btn:not(:disabled):focus-visible{color:var(--primary-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.atv-volume-btn.pending{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.atv-volume-value{min-width:0;text-align:center;font-size:14px;line-height:1.2;font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-feedback,.atv-panel-feedback{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.atv-feedback:not(:empty){margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color)}.atv-feedback.error,.atv-panel-feedback.error{color:var(--error-color)}.atv-panel{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,rgba(0,0,0,.16)));overscroll-behavior:contain}.atv-panel[hidden]{display:none!important}.atv-sheet{width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}.atv-sheet-head{min-height:54px;padding:7px 8px 7px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) 40px;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.atv-sheet-head .atv-icon{width:34px;height:34px}.atv-sheet-title{min-width:0}.atv-sheet-name,.atv-sheet-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-sheet-name{font-size:14px;line-height:1.25;font-weight:650}.atv-sheet-state{margin-top:2px;font-size:12px;line-height:1.25;color:var(--secondary-text-color)}.atv-close{width:40px;height:40px;border-radius:var(--dashboard-radius-control,8px);display:grid;place-items:center;color:var(--secondary-text-color)}.atv-body{overflow:auto;overscroll-behavior:contain;padding:12px 14px 8px;display:grid;gap:14px}.atv-panel-feedback{padding:0 14px max(14px,env(safe-area-inset-bottom))}.atv-panel-feedback:not(:empty){padding-top:10px;border-top:1px solid var(--divider-color)}.atv-section{display:grid;gap:9px}.atv-section-title{font-size:13px;line-height:1.25;font-weight:650}.atv-note{margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.atv-remote{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:center}.atv-remote-btn{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:flex;align-items:center;justify-content:center;gap:6px;color:var(--secondary-text-color);font-size:13px;font-weight:650}.atv-remote-btn.select{min-height:58px;color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:var(--dashboard-active-surface,var(--card-background-color))}.atv-remote-btn.pending{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.atv-remote-btn.empty{visibility:hidden;pointer-events:none}.atv-source-tools{display:grid;grid-template-columns:1fr;gap:8px}.atv-search{width:100%;height:40px;min-width:0;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);background:var(--card-background-color);color:var(--primary-text-color)}.atv-sources{max-height:220px;overflow:auto;display:grid;gap:6px;padding-right:2px}.atv-source{min-height:42px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:grid;grid-template-columns:minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;color:var(--primary-text-color);font-size:13px;font-weight:600}.atv-source span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.atv-source[aria-selected=true]{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:var(--dashboard-active-surface,var(--card-background-color))}.atv-source ha-icon{--mdc-icon-size:18px}.atv-audio{display:grid;grid-template-columns:44px minmax(88px,1fr) 44px;align-items:center;gap:9px}.atv-audio .atv-volume-value{min-height:44px;display:grid;place-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px)}.atv-audio-actions{display:grid;grid-template-columns:1fr;gap:8px}.atv-secondary-btn,.atv-power-btn{min-height:44px;padding:0 11px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);display:flex;align-items:center;justify-content:center;gap:7px;color:var(--secondary-text-color);font-size:13px;font-weight:650}.atv-secondary-btn.active,.atv-power-btn:not(:disabled):hover{color:var(--primary-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.atv-power{display:grid;grid-template-columns:1fr 1fr;gap:8px}.atv-keyboard{min-height:40px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,6px);font-size:13px;color:var(--secondary-text-color)}button:disabled,button[aria-disabled=true]{opacity:.45;cursor:default}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.atv-open:active,.atv-volume-btn:active,.atv-remote-btn:active,.atv-source:active,.atv-secondary-btn:active,.atv-power-btn:active{background:var(--dashboard-active-surface,var(--card-background-color))}@container (max-width:340px){.atv-wrap{padding:12px}.atv-head{grid-template-columns:1fr}.atv-open{width:100%;justify-content:center}.atv-volume{gap:8px}.atv-open .atv-open-text{display:inline}}@media(max-width:420px){.atv-panel{padding:8px}.atv-sheet{width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}.atv-body{padding:10px 12px 8px}.atv-panel-feedback{padding:0 12px max(16px,env(safe-area-inset-bottom))}.atv-remote{gap:6px}.atv-remote-btn{font-size:12px}.atv-power{grid-template-columns:1fr}}
    </style><ha-card><div class="atv-wrap"><div class="atv-head"><button class="atv-identity" type="button"><span class="atv-icon"><ha-icon></ha-icon></span><span class="atv-copy"><span class="atv-name"></span><span class="atv-status" role="status"></span></span></button><button class="atv-open" type="button" aria-controls="apple-tv-controls-panel" aria-expanded="false"><span class="atv-open-text">Controls</span><ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="atv-volume"><button class="atv-volume-btn atv-volume-down" type="button" aria-label="Volume down"><ha-icon icon="mdi:volume-minus"></ha-icon></button><span class="atv-volume-value"></span><button class="atv-volume-btn atv-volume-up" type="button" aria-label="Volume up"><ha-icon icon="mdi:volume-plus"></ha-icon></button></div><p class="atv-feedback" role="status" aria-live="polite"></p></div></ha-card><section class="atv-panel" id="apple-tv-controls-panel" role="dialog" aria-modal="true" aria-labelledby="apple-tv-controls-title" hidden><div class="atv-sheet"><div class="atv-sheet-head"><span class="atv-icon"><ha-icon></ha-icon></span><span class="atv-sheet-title"><span class="atv-sheet-name" id="apple-tv-controls-title"></span><span class="atv-sheet-state"></span></span><button class="atv-close" type="button" aria-label="Close Apple TV controls"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="atv-body"></div><p class="atv-panel-feedback" role="status" aria-live="polite"></p></div></section>`;
    this.elements = {
      identity: this.shadowRoot.querySelector(".atv-identity"),
      mainIcon: this.shadowRoot.querySelector(".atv-identity ha-icon"),
      mainIconWrap: this.shadowRoot.querySelector(".atv-identity .atv-icon"),
      name: this.shadowRoot.querySelector(".atv-name"),
      status: this.shadowRoot.querySelector(".atv-status"),
      open: this.shadowRoot.querySelector(".atv-open"),
      volumeRow: this.shadowRoot.querySelector(".atv-volume"),
      volumeDown: this.shadowRoot.querySelector(".atv-volume-down"),
      volumeValue: this.shadowRoot.querySelector(".atv-volume-value"),
      volumeUp: this.shadowRoot.querySelector(".atv-volume-up"),
      feedback: this.shadowRoot.querySelector(".atv-feedback"),
      panelFeedback: this.shadowRoot.querySelector(".atv-panel-feedback"),
      panel: this.shadowRoot.querySelector(".atv-panel"),
      sheetIcon: this.shadowRoot.querySelector(".atv-sheet-head ha-icon"),
      sheetIconWrap: this.shadowRoot.querySelector(".atv-sheet-head .atv-icon"),
      sheetName: this.shadowRoot.querySelector(".atv-sheet-name"),
      sheetState: this.shadowRoot.querySelector(".atv-sheet-state"),
      close: this.shadowRoot.querySelector(".atv-close"),
      body: this.shadowRoot.querySelector(".atv-body"),
    };
    this.elements.identity.addEventListener("click", () => this.openPanel(this.elements.identity));
    this.elements.open.addEventListener("click", () => this.openPanel(this.elements.open));
    this.elements.volumeDown.addEventListener("click", () => this.adjustVolume("down"));
    this.elements.volumeUp.addEventListener("click", () => this.adjustVolume("up"));
    this.elements.close.addEventListener("click", () => this.closePanel(true));
    this.elements.panel.addEventListener("click", (event) => { if (event.target === this.elements.panel) this.closePanel(true); });
    this.shadowRoot.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.panelOpen) {
        event.preventDefault();
        this.closePanel(true);
      } else if (event.key === "Tab" && this.panelOpen) {
        this.trapFocus(event);
      }
    });
  }

  clearTransientState() {
    clearTimeout(this.messageTimer);
    clearTimeout(this.pendingTimer);
    clearTimeout(this.sleepTimer);
    this.messageTimer = null;
    this.pendingTimer = null;
    this.sleepTimer = null;
    this.pending = "";
    this.message = "";
    this.sleepConfirm = false;
  }

  demoState(entityId) {
    if (!this.config?.demo) return null;
    if (entityId === this.config?.keyboard_entity) return { state: "on", attributes: { friendly_name: "Apple TV keyboard focus" } };
    if (entityId === this.config?.remote_entity) return { state: "on", attributes: { friendly_name: "Apple TV remote" } };
    return {
      state: "playing",
      attributes: {
        friendly_name: "Apple TV 4K",
        app_name: "Netflix",
        source: "Netflix",
        source_list: ["Netflix", "Disney+", "YouTube", "Spotify", "Prime Video", "ABC iview", "Apple TV"],
        volume_level: 0.42,
        is_volume_muted: false,
        supported_features: ATV_MEDIA_VOLUME_STEP | ATV_MEDIA_VOLUME_MUTE | ATV_MEDIA_SELECT_SOURCE,
      },
    };
  }

  state(entityId) { return entityId ? this._hass?.states?.[entityId] ?? this.demoState(entityId) : null; }
  validState(state) { return Boolean(state && !ATV_INVALID.has(String(state.state).toLowerCase())); }
  supported(state, feature) { return Boolean((Number(state?.attributes?.supported_features) || 0) & feature); }

  mediaState() { return this.state(this.config?.entity); }
  remoteState() { return this.state(this.config?.remote_entity); }
  keyboardState() { return this.state(this.config?.keyboard_entity); }
  remoteAvailable() { return Boolean(this.config?.remote_entity && this.validState(this.remoteState())); }
  mediaAvailable() { return this.validState(this.mediaState()); }

  stateSignature() {
    const ids = [this.config?.entity, this.config?.remote_entity, this.config?.keyboard_entity].filter(Boolean);
    return JSON.stringify([this.panelOpen, this.sourceFilter, this.pending, this.message, this.sleepConfirm, ...ids.map((entityId) => {
      const state = this.state(entityId);
      return [entityId, state?.state, state?.attributes];
    })]);
  }

  title() {
    const state = this.mediaState();
    return this.config?.title || state?.attributes?.friendly_name || "Apple TV";
  }

  appName() {
    const attributes = this.mediaState()?.attributes ?? {};
    return attributes.app_name || attributes.source || null;
  }

  displayStatus() {
    const state = this.mediaState();
    if (!state) return this.config?.demo ? "Playing · Netflix" : "Apple TV unavailable";
    const value = String(state.state || "").toLowerCase();
    const app = this.appName();
    if (value === "unavailable") return "Apple TV unavailable";
    if (value === "unknown") return "Status unknown";
    if (value === "off") return "Sleeping";
    const label = value === "playing" ? "Playing" : value === "paused" ? "Paused" : value === "idle" ? "Idle" : value === "on" ? "Ready" : this.toTitle(value);
    return [label, app].filter(Boolean).join(" · ");
  }

  volumeInfo() {
    const media = this.mediaState();
    const attributes = media?.attributes ?? {};
    const level = Number(attributes.volume_level);
    const hasLevel = Number.isFinite(level) && level >= 0 && level <= 1;
    const percent = hasLevel ? `${Math.round(level * 100)}%` : null;
    const muted = attributes.is_volume_muted === true;
    const mediaStep = this.mediaAvailable() && this.supported(media, ATV_MEDIA_VOLUME_STEP);
    const remoteStep = this.remoteAvailable() && this.commandSupported("volume_up") && this.commandSupported("volume_down");
    return {
      hasLevel,
      muted,
      percent,
      label: muted ? "Muted" : percent ?? (this.mediaAvailable() || remoteStep ? "Volume" : "Volume unavailable"),
      mediaStep,
      remoteStep,
      canStep: mediaStep || remoteStep,
      canMute: this.mediaAvailable() && this.supported(media, ATV_MEDIA_VOLUME_MUTE),
      unavailable: !mediaStep && !remoteStep,
    };
  }

  render() {
    if (!this.built || !this.config) return;
    const available = this.mediaAvailable();
    const title = this.title();
    const status = this.displayStatus();
    const volume = this.volumeInfo();
    const active = available && !["off", "idle"].includes(String(this.mediaState()?.state).toLowerCase());
    this.elements.name.textContent = title;
    this.elements.status.textContent = status;
    this.elements.mainIcon.setAttribute("icon", this.config.icon);
    this.elements.sheetIcon.setAttribute("icon", this.config.icon);
    this.elements.mainIconWrap.classList.toggle("active", active);
    this.elements.sheetIconWrap.classList.toggle("active", active);
    this.elements.identity.setAttribute("aria-label", available ? `Open controls for ${title}` : `${title}. ${status}`);
    this.elements.open.setAttribute("aria-label", `Open controls for ${title}`);
    this.elements.open.setAttribute("aria-expanded", String(this.panelOpen));
    this.elements.open.disabled = !available && !this.remoteAvailable();
    this.elements.sheetName.textContent = title;
    this.elements.sheetState.textContent = status;
    this.renderVolumeRow(this.elements.volumeRow, volume, false);
    this.renderMessage();
    if (this.panelOpen) this.renderPanel();
  }

  renderVolumeRow(container, volume, modal) {
    container.classList.toggle("unavailable", volume.unavailable && !modal);
    const down = container.querySelector(".atv-volume-down");
    const up = container.querySelector(".atv-volume-up");
    const value = container.querySelector(".atv-volume-value");
    if (!modal && volume.unavailable) {
      down.hidden = true;
      up.hidden = true;
      value.textContent = "Volume unavailable";
      value.setAttribute("aria-label", "Volume unavailable");
      return;
    }
    down.hidden = false;
    up.hidden = false;
    down.disabled = !volume.canStep || this.pending === "volume-down";
    up.disabled = !volume.canStep || this.pending === "volume-up";
    down.classList.toggle("pending", this.pending === "volume-down");
    up.classList.toggle("pending", this.pending === "volume-up");
    const label = volume.muted && volume.percent ? `Muted, ${volume.percent}` : volume.label;
    value.textContent = volume.label;
    value.setAttribute("aria-label", label);
  }

  renderPanel() {
    const remoteAvailable = this.remoteAvailable();
    const mediaAvailable = this.mediaAvailable();
    const volume = this.volumeInfo();
    this.elements.body.replaceChildren();
    this.elements.body.append(this.statusSection(mediaAvailable, remoteAvailable));
    this.elements.body.append(this.remoteSection(remoteAvailable));
    const sourceSection = this.sourceSection();
    if (sourceSection) this.elements.body.append(sourceSection);
    this.elements.body.append(this.audioSection(volume));
    if (this.config.show_power_controls !== false) this.elements.body.append(this.powerSection(remoteAvailable));
    const keyboardSection = this.keyboardSection();
    if (keyboardSection) this.elements.body.append(keyboardSection);
    this.renderMessage();
  }

  statusSection(mediaAvailable, remoteAvailable) {
    const section = this.section("Apple TV status");
    const note = document.createElement("p");
    note.className = "atv-note";
    if (!mediaAvailable) note.textContent = "Controls return when the Apple TV reconnects.";
    else if (this.config.remote_entity && !remoteAvailable) note.textContent = "Media state is available. Remote controls are unavailable.";
    else note.textContent = this.displayStatus();
    section.append(note);
    return section;
  }

  remoteSection(remoteAvailable) {
    const section = this.section("Navigation remote");
    if (!this.config.remote_entity || !remoteAvailable) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = this.config.remote_entity ? "Remote controls are unavailable." : "Configure a remote entity to enable navigation controls.";
      section.append(note);
      return section;
    }
    const grid = document.createElement("div");
    grid.className = "atv-remote";
    const order = [
      ["empty"], ["up"], ["empty"],
      ["left"], ["select"], ["right"],
      ["empty"], ["down"], ["empty"],
      ["menu"], ["home"], ["top_menu"],
    ];
    for (const [command] of order) {
      if (command === "empty") {
        const blank = document.createElement("span");
        blank.className = "atv-remote-btn empty";
        grid.append(blank);
        continue;
      }
      if (!this.commandSupported(command)) {
        const blank = document.createElement("span");
        blank.className = "atv-remote-btn empty";
        grid.append(blank);
        continue;
      }
      const [, label, icon] = ATV_REMOTE_COMMANDS.find(([value]) => value === command);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `atv-remote-btn ${command === "select" ? "select" : ""}`;
      button.setAttribute("aria-label", label);
      button.append(this.icon(icon), document.createTextNode(label));
      button.classList.toggle("pending", this.pending === `remote-${command}`);
      button.disabled = this.pending === `remote-${command}`;
      button.addEventListener("click", () => this.sendRemoteCommand(command, label));
      grid.append(button);
    }
    section.append(grid);
    return section;
  }

  sourceSection() {
    if (this.config.show_app_selector === false) return null;
    const media = this.mediaState();
    const sources = Array.isArray(media?.attributes?.source_list) ? media.attributes.source_list.filter(Boolean) : [];
    if (!sources.length) return null;
    const section = this.section("App selector");
    if (sources.length > 8) {
      const tools = document.createElement("div");
      tools.className = "atv-source-tools";
      const input = document.createElement("input");
      input.className = "atv-search";
      input.type = "search";
      input.placeholder = "Search apps";
      input.value = this.sourceFilter;
      input.setAttribute("aria-label", "Search Apple TV apps");
      input.addEventListener("input", () => {
        this.sourceFilter = input.value;
        this.signature = "";
        this.renderPanel();
        queueMicrotask(() => this.elements.body.querySelector(".atv-search")?.focus());
      });
      tools.append(input);
      section.append(tools);
    }
    const list = document.createElement("div");
    list.className = "atv-sources";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Apple TV apps");
    const current = media?.attributes?.source;
    const filter = this.sourceFilter.trim().toLowerCase();
    const filtered = filter ? sources.filter((source) => String(source).toLowerCase().includes(filter)) : sources;
    for (const source of filtered) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atv-source";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(source === current));
      const label = document.createElement("span");
      label.textContent = String(source);
      button.append(label, this.icon(source === current ? "mdi:check" : "mdi:chevron-right"));
      button.disabled = !this.mediaAvailable() || this.pending === `source-${source}`;
      button.addEventListener("click", () => this.selectSource(source));
      list.append(button);
    }
    if (!filtered.length) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = "No matching apps.";
      list.append(note);
    }
    section.append(list);
    return section;
  }

  audioSection(volume) {
    const section = this.section("Volume and audio");
    const row = document.createElement("div");
    row.className = "atv-audio";
    row.innerHTML = '<button class="atv-volume-btn atv-volume-down" type="button" aria-label="Volume down"><ha-icon icon="mdi:volume-minus"></ha-icon></button><span class="atv-volume-value"></span><button class="atv-volume-btn atv-volume-up" type="button" aria-label="Volume up"><ha-icon icon="mdi:volume-plus"></ha-icon></button>';
    row.querySelector(".atv-volume-down").addEventListener("click", () => this.adjustVolume("down"));
    row.querySelector(".atv-volume-up").addEventListener("click", () => this.adjustVolume("up"));
    this.renderVolumeRow(row, volume, true);
    section.append(row);
    if (volume.canMute) {
      const actions = document.createElement("div");
      actions.className = "atv-audio-actions";
      const mute = document.createElement("button");
      mute.type = "button";
      mute.className = `atv-secondary-btn ${volume.muted ? "active" : ""}`;
      mute.setAttribute("aria-label", volume.muted ? "Unmute Apple TV" : "Mute Apple TV");
      mute.append(this.icon(volume.muted ? "mdi:volume-high" : "mdi:volume-mute"), document.createTextNode(volume.muted ? "Unmute" : "Mute"));
      mute.disabled = this.pending === "mute";
      mute.addEventListener("click", () => this.toggleMute());
      actions.append(mute);
      section.append(actions);
    }
    if (!volume.canStep && !volume.canMute) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = "Volume controls are unavailable.";
      section.append(note);
    }
    return section;
  }

  powerSection(remoteAvailable) {
    const section = this.section("Power and sleep");
    if (!this.config.remote_entity || !remoteAvailable) {
      const note = document.createElement("p");
      note.className = "atv-note";
      note.textContent = this.config.remote_entity ? "Wake and sleep controls are unavailable." : "Configure a remote entity to enable wake and sleep controls.";
      section.append(note);
      return section;
    }
    const grid = document.createElement("div");
    grid.className = "atv-power";
    const wake = document.createElement("button");
    wake.type = "button";
    wake.className = "atv-power-btn";
    wake.setAttribute("aria-label", "Wake Apple TV");
    wake.append(this.icon("mdi:power"), document.createTextNode("Wake Apple TV"));
    wake.disabled = this.pending === "wake";
    wake.addEventListener("click", () => this.callRemotePower("wakeup", "Wake Apple TV", false));
    const sleep = document.createElement("button");
    sleep.type = "button";
    sleep.className = "atv-power-btn";
    sleep.setAttribute("aria-label", this.sleepConfirm ? "Confirm Sleep Apple TV" : "Sleep Apple TV");
    sleep.append(this.icon(this.sleepConfirm ? "mdi:check" : "mdi:power-sleep"), document.createTextNode(this.sleepConfirm ? "Confirm sleep" : "Sleep Apple TV"));
    sleep.disabled = this.pending === "sleep";
    sleep.addEventListener("click", () => this.callRemotePower("suspend", "Sleep Apple TV", true));
    grid.append(wake, sleep);
    section.append(grid);
    return section;
  }

  keyboardSection() {
    if (this.config.show_keyboard_status === false || !this.config.keyboard_entity) return null;
    const keyboard = this.keyboardState();
    if (!this.validState(keyboard) || keyboard.state !== "on") return null;
    const section = this.section("Keyboard status");
    const status = document.createElement("div");
    status.className = "atv-keyboard";
    status.append(this.icon("mdi:keyboard-outline"), document.createTextNode("Keyboard active"));
    section.append(status);
    return section;
  }

  section(title) {
    const section = document.createElement("section");
    section.className = "atv-section";
    const heading = document.createElement("div");
    heading.className = "atv-section-title";
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  icon(name) {
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", name);
    return icon;
  }

  commandSupported(command) {
    const commands = this.remoteState()?.attributes?.supported_commands;
    return !Array.isArray(commands) || !commands.length || commands.includes(command);
  }

  async adjustVolume(direction) {
    const volume = this.volumeInfo();
    if (!volume.canStep) return this.setMessage("Volume controls unavailable", "error");
    const pending = `volume-${direction}`;
    this.startPending(pending);
    try {
      if (volume.mediaStep && !this.config.demo) await this._hass.callService("media_player", direction === "up" ? "volume_up" : "volume_down", { entity_id: this.config.entity });
      else if (volume.remoteStep && !this.config.demo) await this._hass.callService("remote", "send_command", { entity_id: this.config.remote_entity, command: direction === "up" ? "volume_up" : "volume_down" });
      this.finishPending(`${direction === "up" ? "Volume up" : "Volume down"} sent`);
    } catch {
      this.failPending("Apple TV did not respond");
    }
  }

  async sendRemoteCommand(command, label) {
    if (!this.remoteAvailable() || !this.commandSupported(command)) return this.setMessage("Remote controls unavailable", "error");
    this.startPending(`remote-${command}`);
    try {
      if (!this.config.demo) await this._hass.callService("remote", "send_command", { entity_id: this.config.remote_entity, command });
      this.finishPending(`${label} sent`);
    } catch {
      this.failPending("Apple TV did not respond");
    }
  }

  async selectSource(source) {
    if (!this.mediaAvailable() || !this.supported(this.mediaState(), ATV_MEDIA_SELECT_SOURCE)) return this.setMessage("Source selection unavailable", "error");
    this.startPending(`source-${source}`);
    try {
      if (!this.config.demo) await this._hass.callService("media_player", "select_source", { entity_id: this.config.entity, source });
      this.finishPending(`Opening ${source}`);
    } catch {
      this.failPending(`Could not open ${source}`);
    }
  }

  async toggleMute() {
    const volume = this.volumeInfo();
    if (!volume.canMute) return this.setMessage("Mute is unavailable", "error");
    this.startPending("mute");
    try {
      if (!this.config.demo) await this._hass.callService("media_player", "volume_mute", { entity_id: this.config.entity, is_volume_muted: !volume.muted });
      this.finishPending(volume.muted ? "Unmute sent" : "Mute sent");
    } catch {
      this.failPending("Could not change mute");
    }
  }

  async callRemotePower(service, label, needsConfirm) {
    if (!this.remoteAvailable()) return this.setMessage("Remote controls unavailable", "error");
    if (needsConfirm && !this.sleepConfirm) {
      this.sleepConfirm = true;
      this.setMessage("Press again to sleep Apple TV", "info", 5000);
      clearTimeout(this.sleepTimer);
      this.sleepTimer = setTimeout(() => {
        this.sleepConfirm = false;
        this.signature = "";
        this.render();
      }, 5000);
      this.signature = "";
      this.render();
      return;
    }
    clearTimeout(this.sleepTimer);
    this.sleepConfirm = false;
    this.startPending(service === "wakeup" ? "wake" : "sleep");
    try {
      if (!this.config.demo) await this._hass.callService("remote", service, { entity_id: this.config.remote_entity });
      this.finishPending(`${label} sent`);
    } catch {
      this.failPending("Apple TV did not respond");
    }
  }

  startPending(pending) {
    clearTimeout(this.pendingTimer);
    this.pending = pending;
    this.message = "Sending command...";
    this.messageType = "info";
    this.signature = "";
    this.render();
    this.pendingTimer = setTimeout(() => {
      if (this.pending === pending) this.failPending("Apple TV did not respond");
    }, 10000);
  }

  finishPending(message) {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.pending = "";
    this.setMessage(message, "info");
  }

  failPending(message) {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.pending = "";
    this.setMessage(message, "error", 4000);
  }

  setMessage(message, type = "info", timeout = 1800) {
    clearTimeout(this.messageTimer);
    this.message = message;
    this.messageType = type;
    this.signature = "";
    this.render();
    if (timeout) {
      this.messageTimer = setTimeout(() => {
        this.message = "";
        this.messageType = "info";
        this.signature = "";
        this.render();
      }, timeout);
    }
  }

  renderMessage() {
    if (!this.elements) return;
    this.elements.feedback.textContent = this.message;
    this.elements.feedback.classList.toggle("error", this.messageType === "error");
    this.elements.panelFeedback.textContent = this.message;
    this.elements.panelFeedback.classList.toggle("error", this.messageType === "error");
  }

  openPanel(trigger) {
    if (!this.elements || this.elements.open.disabled) return;
    this.panelOpen = true;
    this.panelTrigger = trigger;
    this.elements.panel.hidden = false;
    this.signature = "";
    this.render();
    queueMicrotask(() => this.elements.close.focus());
  }

  closePanel(restoreFocus) {
    if (!this.elements) return;
    this.panelOpen = false;
    this.sleepConfirm = false;
    this.elements.panel.hidden = true;
    this.elements.open.setAttribute("aria-expanded", "false");
    const trigger = this.panelTrigger;
    this.panelTrigger = null;
    this.signature = "";
    this.render();
    if (restoreFocus) queueMicrotask(() => (trigger?.isConnected ? trigger : this.elements.open)?.focus());
  }

  trapFocus(event) {
    const focusable = [...this.elements.panel.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    const current = this.shadowRoot.activeElement;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toTitle(value) {
    return String(value || "").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
  }
}

registerCard({ type: "component-apple-tv-controller-v1", element: ComponentAppleTvControllerV1, name: "Apple TV Controller", description: "Compact Apple TV status and volume control with Split-style advanced navigation, source and power controls." });
}

// Module: src/components/section-separator.js
{
/** ComponentSectionSeparatorV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentSectionSeparatorV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:gesture-tap-button',title:'Section label',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}ha-card{background:transparent;border:0;box-shadow:none}.wrap{padding:7px 2px 5px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color)}.wrap ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.label{font-size:12px;font-weight:600;color:var(--primary-text-color)}.line{height:1px;background:var(--divider-color);flex:1}</style><ha-card><div class="wrap"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="label">${this.escapeHtml(this.c.title)}</span><span class="line"></span></div></ha-card>`}}
registerCard({ type: "component-section-separator-v2", element: ComponentSectionSeparatorV2, name: "Section Separator", description: "Reusable section separator component." });
}

// Module: src/components/room-sheet.js
{
/** ComponentRoomSheetV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomSheetV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:bed-king-outline',title:'Room name',...c};this.r()} getCardSize(){return 5}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.wrap{padding:0}.head{padding:13px 14px 11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--divider-color)}.head-left{display:flex;align-items:center;gap:9px}.head-left ha-icon{color:var(--primary-color)}.close{width:32px;height:32px;border:1px solid var(--dashboard-card-border-color,var(--divider-color))!important;border-radius:var(--dashboard-radius-control,5px)!important;color:var(--secondary-text-color);padding:0!important}.body{padding:8px 14px 12px}.sep{display:flex;align-items:center;gap:7px;margin:8px 0 6px;font-size:11px;font-weight:600;color:var(--secondary-text-color)}.sep:after{content:'';height:1px;background:var(--divider-color);flex:1}.row{appearance:none;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;min-height:46px;display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:8px;border-radius:var(--dashboard-radius-control,8px);cursor:pointer;padding:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.row ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.rname{font-size:12px;font-weight:600}.rstate,.rvalue{font-size:10.5px;color:var(--secondary-text-color)}.rvalue{font-weight:600;color:var(--primary-text-color)}</style><ha-card><div class="wrap"><div class="head"><span class="head-left"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="title">${this.escapeHtml(this.c.title)}</span></span><button class="i close" type="button" aria-label="Close preview"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><div class="sep">Room state</div><button class="row" type="button"><ha-icon icon="mdi:thermometer"></ha-icon><span><div class="rname">Status metric</div><div class="rstate">Supporting context</div></span><span class="rvalue">Value</span></button><div class="sep">Controls</div>${[['mdi:lightbulb-outline','Control name','Current state'],['mdi:thermostat','Control name','Current state']].map(x=>`<button class="row" type="button"><ha-icon icon="${x[0]}"></ha-icon><span><div class="rname">${x[1]}</div><div class="rstate">${x[2]}</div></span><span class="rvalue">Value</span></button>`).join('')}</div></div></ha-card>`}}
registerCard({ type: "component-room-sheet-v2", element: ComponentRoomSheetV2, name: "Room Sheet", description: "Reusable room-sheet component." });
}

// Module: src/components/household-attention.js
{
/** ComponentHouseholdAttentionV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentHouseholdAttentionV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){
    super();this.attachShadow({mode:"open"});this.c=null;this._hass=null;this._connection=null;
    this._registry=null;this._loading=null;this._registrySubscription=null;this._refreshTimer=null;this._renderSignature=null;
  }
  setConfig(c){this.c={title:"Needs attention",icon:"mdi:alert-circle-outline",max_items:6,demo:false,...c};this._renderSignature=null;this._render()}
  set hass(h){
    const connection=h?.connection||null;
    if(this._connection!==connection){this._unsubscribe();this._connection=connection;this._registry=null;this._loading=null}
    this._hass=h;this._subscribe();this._load();this._render();
  }
  connectedCallback(){this._subscribe();this._load();this._render()}
  disconnectedCallback(){clearTimeout(this._refreshTimer);this._refreshTimer=null;this._unsubscribe()}
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
    this.style.display=visible?"block":"none";this.toggleAttribute("aria-hidden",!visible);
    if(!visible){if(this.shadowRoot.childNodes.length)this.shadowRoot.replaceChildren();return}
    const rows=issues.map(issue=>'<button class="issue '+this._escape(issue.severity)+'" type="button" data-entity="'+this._escape(issue.entity_id)+'" aria-label="'+this._escape(issue.name+", "+issue.status+". Open details.")+'"><span class="issue-icon"><ha-icon icon="'+this._escape(issue.icon)+'"></ha-icon></span><span class="copy"><span class="name">'+this._escape(issue.name)+'</span><span class="state">'+this._escape(issue.status)+'</span></span><span class="severity">'+this._escape(issue.severity_text)+'</span></button>').join("");
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}ha-card{border:0;box-shadow:none;background:transparent;color:var(--primary-text-color)}.head{min-height:36px;display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:0 2px}.head ha-icon{color:var(--error-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.issue{appearance:none;width:100%;min-height:52px;padding:6px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-left:3px solid var(--warning-color,#f9a825);border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-warning-surface,var(--card-background-color));display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:8px;text-align:left;cursor:pointer}.issue.critical{border-left-color:var(--error-color)}.issue:hover,.issue:focus-visible{background:var(--dashboard-card-muted-surface,var(--card-background-color));outline:2px solid var(--primary-color);outline-offset:1px}.issue-icon{width:36px;height:36px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;color:var(--warning-color,#f9a825);background:transparent}.critical .issue-icon{color:var(--error-color)}.issue-icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0;display:flex;flex-direction:column;gap:2px}.name{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.state{font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.severity{font-size:12px;font-weight:650;color:var(--warning-color,#f9a825)}.critical .severity{color:var(--error-color)}@media(max-width:700px){.grid{grid-template-columns:1fr}.issue{min-height:56px}}</style><ha-card><div class="head"><ha-icon icon="'+this._escape(this.c.icon)+'"></ha-icon><h2>'+this._escape(this.c.title)+'</h2></div><div class="grid">'+rows+'</div></ha-card>';
    for(const button of this.shadowRoot.querySelectorAll(".issue"))button.addEventListener("click",()=>this._open(button.dataset.entity));
  }
}
registerCard({ type: "component-household-attention-v1", element: ComponentHouseholdAttentionV1, name: "Household Attention", description: "Registry-aware household attention component." });
}

// Module: src/components/room-navigation.js
{
/** ComponentRoomNavigationV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, loadDashboardRegistries, navigateTo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomNavigationV1 extends HTMLElement{
  static getGridOptions(){return{columns:6,rows:1}}
  constructor(){super();this.attachShadow({mode:"open"});this.c=null;this._hass=null;this._connection=null;this._registries=null;this._registriesPromise=null;this._renderSignature=""}
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
    const label="Open "+this.c.name+(summary?". "+summary:"");
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}button{appearance:none;width:100%;min-height:56px;padding:0 12px 0 10px;border:0;border-left:2px solid transparent;background:transparent;color:inherit;font:inherit;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px;cursor:pointer}.icon{width:36px;height:36px;display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:21px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}button.active{border-left-color:transparent;background:transparent}button.active .icon{color:color-mix(in srgb,var(--primary-color) 68%,var(--secondary-text-color))}button.warning{border-left-color:var(--warning-color,#f9a825);background:var(--dashboard-warning-surface,var(--card-background-color))}button.warning .icon{color:var(--warning-color,#f9a825)}button.critical{border-left-color:var(--error-color);background:var(--dashboard-critical-surface,var(--card-background-color))}button.critical .icon{color:var(--error-color)}button:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}@media(max-width:420px){button{padding-right:10px;gap:8px}}</style><ha-card><button class="'+this._escape(status.severity)+'" type="button" aria-label="'+this._escape(label)+'"><span class="icon"><ha-icon icon="'+this._escape(this.c.icon)+'"></ha-icon></span><span class="copy"><span class="name">'+this._escape(this.c.name)+'</span>'+(summary?'<span class="summary">'+this._escape(summary)+'</span>':"")+'</span></button></ha-card>';
    this.shadowRoot.querySelector("button").addEventListener("click",()=>this._navigate());
  }
}
registerCard({ type: "component-room-navigation-v1", element: ComponentRoomNavigationV1, name: "Room Navigation", description: "Area-aware room navigation with presence status." });
}

// Module: src/components/history-graph.js
{
/** ComponentHistoryGraphV2 — reusable Home Assistant dashboard card. */
const { escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentHistoryGraphV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.ro=null;this.timer=null} setConfig(c){this.c={meta_text:'Aggregation label',series_1_label:'Primary series',series_2_label:'Secondary series',series_3_label:'Supporting series',positive_label:'Positive',negative_label:'Negative',...c};if(!this.b)this.build();this.draw()} set hass(h){} connectedCallback(){this.e?.chart&&this.ro?.observe(this.e.chart);this.draw()} disconnectedCallback(){this.ro?.disconnect();clearTimeout(this.timer);this.timer=null} getCardSize(){return 7}
 build(){this.b=1;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:4px 5px 5px}.top{min-height:28px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 5px}.meta{font-size:11.5px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.legend{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}.legend button{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:12px;font-weight:600;padding:3px 0;display:flex;align-items:center;gap:6px;cursor:pointer}.legend button:active{transform:scale(.97)}.legend button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:5px}.sw{width:17px;height:3px;border-radius:999px}.s1{background:var(--primary-color)}.s2{background:var(--warning-color,#f5b942)}.s3{background:var(--secondary-text-color)}.chart{position:relative;width:100%;height:clamp(400px,48vw,520px)}svg{display:block;width:100%;height:100%;overflow:hidden;touch-action:none}.axis{fill:var(--secondary-text-color);font-size:11px;font-weight:500;font-family:inherit}.small{fill:var(--secondary-text-color);font-size:10px;font-weight:600;font-family:inherit}.grid{stroke:var(--divider-color);stroke-width:1;opacity:.58}.zero{stroke:var(--divider-color);stroke-width:1.35;opacity:.95}.l1{fill:none;stroke:var(--primary-color);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.l2{fill:none;stroke:var(--warning-color,#f5b942);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.f2{fill:color-mix(in srgb,var(--warning-color,#f5b942) 12%,transparent)}.l3{fill:none;stroke:var(--secondary-text-color);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.cursor{stroke:var(--secondary-text-color);stroke-width:1;stroke-dasharray:3 3;opacity:0}.tip{position:absolute;min-width:145px;padding:9px 10px;border-radius:11px;background:var(--card-background-color);border:1px solid var(--divider-color);box-shadow:0 7px 22px rgba(0,0,0,.2);pointer-events:none;opacity:0;transform:translate(-50%,-100%);font-size:11.5px;line-height:1.45}.tip.show{opacity:1}.tip b{color:var(--primary-text-color);font-weight:650}.tr{display:flex;justify-content:space-between;gap:14px;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:3px}.legend{gap:9px}.legend button,.meta{font-size:10.5px}.chart{height:400px}.axis{font-size:10px}.small{font-size:9.5px}}</style><ha-card><div class="wrap"><div class="top"><div class="meta"></div><div class="legend">${[1,2,3].map(i=>`<button type="button"><span class="sw s${i}"></span><span class="k${i}"></span></button>`).join('')}</div></div><div class="chart"><svg role="img" aria-label="Interactive reusable graph example"></svg><div class="tip"></div></div></div></ha-card>`;this.e={m:this.shadowRoot.querySelector('.meta'),svg:this.shadowRoot.querySelector('svg'),tip:this.shadowRoot.querySelector('.tip'),chart:this.shadowRoot.querySelector('.chart'),ks:[1,2,3].map(i=>this.shadowRoot.querySelector(`.k${i}`))};this.e.svg.onpointermove=e=>this.pointer(e);this.e.svg.onpointerdown=e=>this.pointer(e);this.e.svg.onpointerleave=()=>this.hide();this.ro=new ResizeObserver(()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.draw(),40)});this.ro.observe(this.e.chart)}
 draw(){if(!this.e||!this.c)return;this.e.m.textContent=this.c.meta_text;this.e.ks.forEach((x,i)=>x.textContent=this.c[`series_${i+1}_label`]);let r=this.e.chart.getBoundingClientRect(),W=Math.max(320,Math.round(r.width||800)),H=Math.max(340,Math.round(r.height||420));this.e.svg.setAttribute('viewBox',`0 0 ${W} ${H}`);let L=W<520?48:58,R=8,T=6,B=Math.round(H*.70),AY=B+20,GT=AY+18,GB=H-18,x0=L,x1=W-R,w=x1-x0,h=B-T,z=(GT+GB)/2;let p=(rx,ry)=>`${(x0+w*rx).toFixed(1)},${(T+h*ry).toFixed(1)}`,g=(rx,ry)=>`${(x0+w*rx).toFixed(1)},${(z+(GB-GT)*.32*ry).toFixed(1)}`;let d1=`M${p(0,.68)} L${p(.08,.61)} L${p(.17,.70)} L${p(.26,.38)} L${p(.35,.52)} L${p(.44,.24)} L${p(.53,.43)} L${p(.62,.35)} L${p(.72,.63)} L${p(.82,.48)} L${p(.91,.59)} L${p(1,.44)}`,d2=`M${p(0,.86)} L${p(.12,.75)} L${p(.24,.52)} L${p(.36,.42)} L${p(.48,.55)} L${p(.60,.72)} L${p(.72,.82)} L${p(.84,.91)} L${p(1,.94)}`,d3=`M${g(0,.08)} L${g(.1,-.10)} L${g(.2,.12)} L${g(.3,-.20)} L${g(.4,.02)} L${g(.5,-.35)} L${g(.6,.16)} L${g(.7,.28)} L${g(.8,-.12)} L${g(.9,.05)} L${g(1,-.08)}`,fill=`${d2} L${x1},${B} L${x0},${B} Z`;let q='';['Max','75%','50%','25%','0'].forEach((t,i)=>{let y=T+h*i/4;q+=`<line class="grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"></line><text class="axis" x="${x0-8}" y="${y+4}" text-anchor="end">${t}</text>`});['Start','¼','½','¾','End'].forEach((t,i)=>{let x=x0+w*i/4;q+=`<text class="axis" x="${x}" y="${AY}" text-anchor="${i===0?'start':i===4?'end':'middle'}">${t}</text>`});q+=`<line class="zero" x1="${x0}" y1="${z}" x2="${x1}" y2="${z}"></line><text class="small" x="${x1-2}" y="${GT+10}" text-anchor="end">${escapeHtml(this.c.positive_label)}</text><text class="small" x="${x1-2}" y="${GB-3}" text-anchor="end">${escapeHtml(this.c.negative_label)}</text><path class="f2" d="${fill}"></path><path class="l2" d="${d2}"></path><path class="l1" d="${d1}"></path><path class="l3" d="${d3}"></path><line class="cursor" x1="0" y1="${T}" x2="0" y2="${GB}"></line>`;this.e.svg.innerHTML=q;this.geo={W,H,x0,x1,T,GB}}
 pointer(ev){let g=this.geo;if(!g)return;let r=this.e.svg.getBoundingClientRect(),px=(ev.clientX-r.left)*(g.W/r.width),x=Math.max(g.x0,Math.min(g.x1,px)),ratio=(x-g.x0)/(g.x1-g.x0),pct=Math.round(ratio*100),c=this.e.svg.querySelector('.cursor');c.setAttribute('x1',x);c.setAttribute('x2',x);c.style.opacity='1';this.e.tip.innerHTML=`<div style="font-weight:650;margin-bottom:4px">${pct}% through range</div><div class="tr"><span>${escapeHtml(this.c.series_1_label)}</span><b>${Math.round(20+ratio*80)}</b></div><div class="tr"><span>${escapeHtml(this.c.series_2_label)}</span><b>${Math.round(75-ratio*45)}</b></div><div class="tr"><span>${escapeHtml(this.c.series_3_label)}</span><b>${Math.round((ratio-.5)*40)}</b></div>`;this.e.tip.style.left=`${(x/g.W)*r.width}px`;this.e.tip.style.top=`${Math.max(70,r.height*.42)}px`;this.e.tip.classList.add('show')}
 hide(){this.e.tip.classList.remove('show');let c=this.e.svg.querySelector('.cursor');if(c)c.style.opacity='0'}
}
registerCard({ type: "component-history-graph-v2", element: ComponentHistoryGraphV2, name: "History Graph", description: "Reusable interactive history graph component." });
}

// Module: src/components/context-strip.js
{
/** ComponentContextStripV3 — reusable Home Assistant dashboard card. */
const { escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentContextStripV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'})}
  setConfig(c){this.c={left_text:'Left context',center_1_label:'Primary metric',center_1_value:'00%',center_2_label:'Secondary metric',center_2_value:'00%',center_3_label:'Tertiary metric',center_3_value:'00%',right_text:'Right context',...(c||{})};this._render()}
  set hass(h){}
  getCardSize(){return 1}
  _render(){this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;color:inherit}
button:active{transform:scale(.997)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.mid{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.item{display:flex;align-items:baseline;gap:4px}.lab{font-weight:500}.val{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.mid{gap:10px}.item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.mid{gap:7px}}
</style><ha-card><button type="button"><span class="phase">${escapeHtml(this.c.left_text)}</span><span class="mid">${[1,2,3].map(i=>`<span class="item"><span class="lab">${escapeHtml(this.c[`center_${i}_label`])}</span><span class="val">${escapeHtml(this.c[`center_${i}_value`])}</span></span>`).join('')}</span><span class="event">${escapeHtml(this.c.right_text)}</span></button></ha-card>`}
}
registerCard({ type: "component-context-strip-v3", element: ComponentContextStripV3, name: "Context Strip", description: "Reusable context and metric strip component." });
}

// Module: src/components/metric-pair.js
{
/** ComponentMetricPairCardV3 — reusable Home Assistant dashboard card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentMetricPairCardV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._selectedDay=this._dayKey(new Date());this._stats={};this._loading=false;this._error='';this._lastKey=null;this._dayListener=e=>this._onDayChange(e)}
  setConfig(c){this.c={left_value:'Primary value',left_label:'Primary label',right_value:'Secondary value',right_label:'Secondary label',right_primary:'Primary text',right_secondary:'Secondary text',deadband:15,day_channel:null,...(c||{})};if(this._built){this._render();this._scheduleStats()}}
  set hass(h){this.h=h;if(!this._built)this._build();this._render();this._scheduleStats()}
  connectedCallback(){window.addEventListener('energy-day-selector-change',this._dayListener);if(!this._selectedDay)this._selectedDay=this._dayKey(new Date());this._scheduleStats()}
  disconnectedCallback(){window.removeEventListener('energy-day-selector-change',this._dayListener)}
  getCardSize(){return 2}
  _build(){this._built=true;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:12px 14px;display:grid;grid-template-columns:minmax(82px,auto) minmax(0,1fr);gap:16px;align-items:stretch}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;min-width:0;min-height:44px}button:not(:disabled){cursor:pointer}button:disabled{opacity:1}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:4px;border-radius:8px}.left{text-align:left;display:flex;flex-direction:column;align-items:flex-start;padding-top:1px}.right{text-align:right;display:flex;flex-direction:column;justify-content:center;align-items:flex-end}.left-value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em;color:var(--primary-text-color);white-space:nowrap}.left-label{margin-top:4px;font-size:13px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap}.right-top,.right-bottom{width:100%;display:flex;align-items:center;justify-content:flex-end;gap:5px;max-width:100%;font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.right-bottom{margin-top:4px}.right-value,.right-primary{font-weight:600;color:var(--primary-text-color);flex:0 0 auto}.right-label,.right-secondary{font-weight:500;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;grid-template-columns:minmax(76px,auto) minmax(0,1fr);gap:12px}.left-value{font-size:25px}.right-top,.right-bottom{font-size:13px}}</style><ha-card><div class="wrap"><button class="left" type="button"><div class="left-value"></div><div class="left-label"></div></button><button class="right" type="button" aria-live="polite"><div class="right-top"><span class="right-value"></span><span class="right-label"></span></div><div class="right-bottom"><span class="right-primary"></span><span class="right-secondary"></span></div></button></div></ha-card>`;this.e={left:this.shadowRoot.querySelector('.left'),right:this.shadowRoot.querySelector('.right'),leftValue:this.shadowRoot.querySelector('.left-value'),leftLabel:this.shadowRoot.querySelector('.left-label'),rightValue:this.shadowRoot.querySelector('.right-value'),rightLabel:this.shadowRoot.querySelector('.right-label'),rightPrimary:this.shadowRoot.querySelector('.right-primary'),rightSecondary:this.shadowRoot.querySelector('.right-secondary')};this.e.left.onclick=()=>this._more(this._clickEntity('left'));this.e.right.onclick=()=>this._more(this._clickEntity('right'))}
  _entity(v){if(!v||typeof v!=='object')return null;if(typeof v.entity==='string')return v.entity;if(Array.isArray(v.entities))return v.entities.find(x=>typeof x==='string')||null;if(Array.isArray(v.terms)){const t=v.terms.find(x=>x&&typeof x.entity==='string');return t?.entity||null}return null}
  _clickEntity(side){if(side==='left')return this.c.left_more_info_entity||this._entity(this.c.left_value)||this._entity(this.c.left_label);return this.c.right_more_info_entity||this._entity(this.c.right_value)||this._entity(this.c.right_label)||this._entity(this.c.right_primary)||this._entity(this.c.right_secondary)}
  _more(entityId){openMoreInfo(this,entityId)}
  _dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  _dayStart(day){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day||''));if(!m)return null;const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));if(d.getFullYear()!==Number(m[1])||d.getMonth()!==Number(m[2])-1||d.getDate()!==Number(m[3]))return null;d.setHours(0,0,0,0);return d}
  _isToday(){return this._selectedDay===this._dayKey(new Date())}
  _range(){const start=this._dayStart(this._selectedDay)||this._dayStart(this._dayKey(new Date()));const end=new Date(start);end.setDate(end.getDate()+1);return{start:start.getTime(),end:end.getTime()}}
  _formatNeeds(v){if(!v||typeof v!=='object')return null;return String(v.format||'').startsWith('energy_kwh_day')?'change':null}
  _statEntities(){const change=new Set(),vals=[this.c?.left_value,this.c?.left_label,this.c?.right_value,this.c?.right_label,this.c?.right_primary,this.c?.right_secondary];for(const v of vals){if(this._formatNeeds(v)!=='change')continue;if(typeof v.entity==='string')change.add(v.entity);for(const id of v.entities||[])if(typeof id==='string')change.add(id);for(const term of v.terms||[])if(typeof term?.entity==='string')change.add(term.entity)}return{change:[...change].sort()}}
  _currentKey(){const ids=this._statEntities(),refresh=this._isToday()?Math.floor(Date.now()/300000):'fixed';return`${this._selectedDay}|${refresh}|c:${ids.change.join(',')}`}
  _onDayChange(event){if(!this.c?.day_channel||event?.detail?.channel!==this.c.day_channel)return;const day=String(event.detail.day||''),start=this._dayStart(day),today=this._dayStart(this._dayKey(new Date()));if(!start||start>today||day===this._selectedDay)return;this._selectedDay=day;this._stats={};this._error='';this._lastKey=null;this._render();this._scheduleStats()}
  _scheduleStats(){if(!this.h||!this.c?.day_channel)return;const ids=this._statEntities();if(!ids.change.length)return;const key=this._currentKey();if(this._loading||key===this._lastKey)return;this._fetchStats(this._range(),ids,key)}
  async _fetchStats(range,ids,key){this._loading=true;this._error='';this._render();try{const result=await this.h.callWS({type:'recorder/statistics_during_period',start_time:new Date(range.start).toISOString(),end_time:new Date(range.end).toISOString(),statistic_ids:ids.change,period:'5minute',types:['change']});if(key!==this._currentKey())return;const stats={};for(const entity of ids.change){const rows=(result?.[entity]||[]).filter(row=>{const s=typeof row.start==='number'?row.start:Date.parse(row.start);return Number.isFinite(s)&&s>=range.start&&s<range.end});const changes=rows.map(r=>Number(r.change)).filter(Number.isFinite);stats[entity]={change:changes.length?changes.reduce((a,b)=>a+b,0):null}}this._stats=stats;this._lastKey=key}catch(_){if(key===this._currentKey())this._error='Data unavailable'}finally{this._loading=false;this._render();if(key!==this._currentKey())this._scheduleStats()}}
  _number(entity,type){const v=this._stats?.[entity]?.[type];return Number.isFinite(v)?v:null}
  _liveNumber(entity){const s=this.h?.states?.[entity];if(!s||['unknown','unavailable'].includes(s.state))return null;const n=Number(s.state);return Number.isFinite(n)?n:null}
  _status(){if(this._loading)return'Loading…';if(this._error)return this._error;return null}
  _energy(v){if(!Number.isFinite(v))return'—';const a=Math.abs(v),digits=a<1?2:1;return`${v.toFixed(digits)} kWh`}
  _watts(v,abs=false){if(!Number.isFinite(v))return'—';return`${Math.round(abs?Math.abs(v):v)} W`}
  _resolve(v){if(v===null||v===undefined)return'';if(typeof v!=='object')return String(v);if(v.text!==undefined)return String(v.text);const f=String(v.format||''),status=this._formatNeeds(v)?this._status():null;if(status)return status;if(f==='energy_kwh_day')return this._energy(this._number(v.entity,'change'));if(f==='energy_kwh_day_sum'){if(!Array.isArray(v.entities)||!v.entities.length)return'—';let total=0;for(const id of v.entities){const n=this._number(id,'change');if(n===null)return'—';total+=n}return this._energy(total)}if(f==='energy_kwh_day_formula'){if(!Array.isArray(v.terms)||!v.terms.length)return'—';let total=0;for(const term of v.terms){const n=this._number(term?.entity,'change');if(n===null)return'—';total+=n*(Number.isFinite(Number(term.factor))?Number(term.factor):1)}return this._energy(total)}if(['watts','watts_abs'].includes(f))return this._watts(this._liveNumber(v.entity),f==='watts_abs');if(f==='grid_import_watts'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'—';return`${Math.round(n>=d?n:0)} W`}if(f==='grid_export_watts'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'—';return`${Math.round(n<=-d?Math.abs(n):0)} W`}if(f==='grid_label'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'Live grid';return n>=d?'Live grid import':n<=-d?'Live grid export':'Live grid flow'}if(f==='grid_direction'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'Unavailable';return n>=d?'Importing now':n<=-d?'Exporting now':'Balanced now'}if(!v.entity)return'';const s=this.h?.states?.[v.entity];return s?(this.h?.formatEntityState?this.h.formatEntityState(s):String(s.state)):(v.unavailable||'Unavailable')}
  _render(){if(!this.e||!this.c)return;this.e.leftValue.textContent=this._resolve(this.c.left_value);this.e.leftLabel.textContent=this._resolve(this.c.left_label);this.e.rightValue.textContent=this._resolve(this.c.right_value);this.e.rightLabel.textContent=this._resolve(this.c.right_label);this.e.rightPrimary.textContent=this._resolve(this.c.right_primary);this.e.rightSecondary.textContent=this._resolve(this.c.right_secondary);const l=this._clickEntity('left'),r=this._clickEntity('right');this.e.left.disabled=!l;this.e.right.disabled=!r;this.e.left.setAttribute('aria-label',`${this.e.leftValue.textContent} ${this.e.leftLabel.textContent}${l?'. Open details.':''}`.trim());this.e.right.setAttribute('aria-label',`${this.e.rightValue.textContent} ${this.e.rightLabel.textContent}, ${this.e.rightPrimary.textContent} ${this.e.rightSecondary.textContent}${r?'. Open details.':''}`.trim());this.e.right.setAttribute('aria-busy',String(this._loading))}
}
registerCard({ type: "metric-pair-card-v3", element: ComponentMetricPairCardV3, name: "Metric Pair", description: "Live power metrics with selected-day energy totals." });
}

// Module: src/components/update-summary.js
{
/** ComponentUpdateSummaryV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentUpdateSummaryV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.busy = false;
    this.error = "";
    this.messageTimer = null;
    this._renderSignature = null;
  }

  setConfig(c) {
    this.c = {
      count: "3",
      title: "updates available",
      message: "Review the items below before installing.",
      live_updates: false,
      update_all: false,
      confirm: true,
      ...c,
    };
    this._render();
  }

  set hass(h) {
    this.h = h;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  disconnectedCallback() {
    window.clearTimeout(this.messageTimer);
    this.messageTimer = null;
  }

  _all() {
    if (!this.h) return [];
    const ids = Array.isArray(this.c.entities)
      ? new Set(this.c.entities)
      : null;
    return Object.values(this.h.states).filter(
      (state) =>
        state.entity_id.startsWith("update.") &&
        (!ids || ids.has(state.entity_id)),
    );
  }

  _progress(attributes) {
    const raw = attributes?.in_progress;
    return !(
      raw === false ||
      raw === null ||
      raw === undefined
    );
  }

  _pending() {
    return this._all().filter((state) => state.state === "on");
  }

  _live() {
    if (!this.c.live_updates || !this.h) return null;
    const pending = this._pending().length;
    return {
      count: String(pending),
      title: pending === 1 ? "update available" : "updates available",
      message: pending
        ? "Review the items below before installing."
        : "Everything is current.",
    };
  }

  _setError(message) {
    this.error = message;
    window.clearTimeout(this.messageTimer);
    if (message) {
      this.messageTimer = window.setTimeout(() => {
        this.error = "";
        this._render();
      }, 5000);
    }
  }

  async _installAll() {
    if (!this.h || this.busy) return;
    const pending = this._pending().filter(
      (state) => !this._progress(state.attributes),
    );
    if (!pending.length) return;

    const count = pending.length;
    if (
      this.c.confirm !== false &&
      !window.confirm(
        `Install ${count} available ${count === 1 ? "update" : "updates"}? Home Assistant may restart if Core, Supervisor or the operating system is included.`,
      )
    ) {
      return;
    }

    this._setError("");
    this.busy = true;
    this._render();

    const priority = [
      "update.home_assistant_supervisor_update",
      "update.home_assistant_operating_system_update",
      "update.home_assistant_core_update",
    ];
    const normal = pending
      .map((state) => state.entity_id)
      .filter((id) => !priority.includes(id));

    try {
      if (normal.length) {
        await this.h.callService("update", "install", {
          entity_id: normal,
        });
      }
      for (const id of priority) {
        if (pending.some((state) => state.entity_id === id)) {
          await this.h.callService("update", "install", {
            entity_id: id,
          });
        }
      }
    } catch (_) {
      this._setError("One or more updates could not be started.");
    } finally {
      this.busy = false;
      this._render();
    }
  }

  _render() {
    if (!this.c) return;
    const data = this._live() || this.c;
    const showButton = Boolean(this.c.update_all);
    const pending = this.h
      ? this.c.live_updates
        ? Number(data.count)
        : showButton
          ? this._pending().length
          : 0
      : Number(data.count) || 0;
    const signature = JSON.stringify([
      this.c,
      data,
      showButton ? pending : null,
      this.busy,
      this.error,
    ]);
    if (signature === this._renderSignature) return;
    this._renderSignature = signature;
    const message = this.error
      ? this.error
      : this.busy
        ? "Starting available updates…"
        : data.message;
    const progress = this.busy
      ? '<span class="progress indeterminate" role="progressbar" aria-label="Starting available updates"></span>'
      : "";

    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}ha-card{position:relative}.wrap{padding:12px 14px;min-height:72px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px}.count{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.headline{font-size:13px;font-weight:600}.desc{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color)}.desc.error{color:var(--error-color)}.all{appearance:none;border:0;min-height:44px;padding:0 14px;border-radius:11px;background:var(--primary-color);color:var(--text-primary-color);font-size:13px;font-weight:650;cursor:pointer;white-space:nowrap}.all:active{transform:scale(.98)}.all:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.all:disabled{cursor:default;background:var(--secondary-background-color);color:var(--secondary-text-color)}.progress{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0;background:var(--primary-color);pointer-events:none}.progress.indeterminate{width:34%;animation:update-slide 1.15s ease-in-out infinite}@keyframes update-slide{0%{transform:translateX(-105%)}50%{transform:translateX(150%)}100%{transform:translateX(305%)}}@media(prefers-reduced-motion:reduce){.progress.indeterminate{animation:none;width:100%;opacity:.55}}@media(max-width:700px){.wrap{padding:12px;gap:10px}.count{font-size:25px}.all{padding:0 12px}}</style><ha-card><div class="wrap"><span class="count">${escapeHtml(data.count)}</span><span><div class="headline">${escapeHtml(data.title)}</div><div class="desc ${this.error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(message)}</div></span>${showButton ? `<button class="all" type="button" ${this.busy || pending === 0 ? "disabled" : ""}>${escapeHtml(this.busy ? "Starting…" : "Update all")}</button>` : "<span></span>"}</div>${progress}</ha-card>`;

    this.shadowRoot
      .querySelector(".all")
      ?.addEventListener("click", () => this._installAll());
  }
}
registerCard({ type: "component-update-summary-v3", element: ComponentUpdateSummaryV3, name: "Update Summary", description: "Reusable update summary with live update support." });
}

// Module: src/components/update-row.js
{
/** ComponentUpdateRowV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentUpdateRowV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.busy = false;
    this.requested = false;
    this.error = "";
    this.startTimer = null;
    this.errorTimer = null;
    this._renderSignature = null;
  }

  setConfig(c) {
    this.c = {
      icon: "mdi:update",
      title: "Update name",
      current: "Current 1.0",
      available: "Available 1.1",
      action: "Update",
      confirm: true,
      ...c,
    };
    this._render();
  }

  set hass(h) {
    this.h = h;
    const data = this._data();
    if (
      this.requested &&
      (data.progress.active || !data.pending)
    ) {
      this.requested = false;
      window.clearTimeout(this.startTimer);
    }
    this._render();
  }

  getCardSize() {
    return 1;
  }

  disconnectedCallback() {
    window.clearTimeout(this.startTimer);
    window.clearTimeout(this.errorTimer);
  }

  _state() {
    return (
      (this.c.entity && this.h?.states?.[this.c.entity]) || null
    );
  }

  _name(state) {
    if (this.c.name) return this.c.name;
    if (!state) return this.c.title;
    const name =
      state.attributes?.title ||
      state.attributes?.friendly_name ||
      this.c.entity;
    return String(name).replace(/ Update$/, "");
  }

  _progress(attributes) {
    const raw = attributes?.in_progress;
    if (
      raw === false ||
      raw === null ||
      raw === undefined
    ) {
      return { active: false, determinate: false, value: 0 };
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return {
        active: true,
        determinate: true,
        value: Math.max(0, Math.min(100, raw)),
      };
    }
    if (
      typeof raw === "string" &&
      raw.trim() !== "" &&
      Number.isFinite(Number(raw))
    ) {
      return {
        active: true,
        determinate: true,
        value: Math.max(0, Math.min(100, Number(raw))),
      };
    }
    return {
      active: Boolean(raw),
      determinate: false,
      value: 0,
    };
  }

  _data() {
    const state = this._state();
    if (!state) {
      const configured = Boolean(this.c.entity);
      return {
        live: false,
        missing: configured,
        unavailable: configured,
        title: this.c.title,
        current: configured
          ? "Update entity unavailable"
          : this.c.current,
        available: configured ? "" : this.c.available,
        action: configured ? "Unavailable" : this.c.action,
        pending: !configured,
        progress: {
          active: false,
          determinate: false,
          value: 0,
        },
      };
    }

    const attributes = state.attributes || {};
    const unavailable = ["unavailable", "unknown"].includes(
      state.state,
    );
    const pending = state.state === "on";
    const progress = this._progress(attributes);
    return {
      live: true,
      missing: false,
      unavailable,
      title: this._name(state),
      current: attributes.installed_version
        ? `Current ${attributes.installed_version}`
        : "Current version unavailable",
      available: attributes.latest_version
        ? `Available ${attributes.latest_version}`
        : "Latest version unavailable",
      action: unavailable
        ? "Unavailable"
        : progress.active
          ? "Updating…"
          : pending
            ? "Update"
            : "Current",
      pending,
      progress,
    };
  }

  _more() {
    if (!this._state()) return;
    openMoreInfo(this, this.c.entity);
  }

  _setError(message) {
    this.error = message;
    window.clearTimeout(this.errorTimer);
    if (message) {
      this.errorTimer = window.setTimeout(() => {
        this.error = "";
        this._render();
      }, 5000);
    }
  }

  _watchForStart() {
    window.clearTimeout(this.startTimer);
    this.startTimer = window.setTimeout(() => {
      if (!this.requested) return;
      this.requested = false;
      this._setError("The update did not start.");
      this._render();
    }, 12000);
  }

  async _install(data) {
    if (
      !data.live ||
      data.unavailable ||
      !data.pending ||
      data.progress.active ||
      this.busy ||
      this.requested ||
      !this.h
    ) {
      return;
    }

    const state = this._state();
    const name = this._name(state);
    const latest =
      state?.attributes?.latest_version || "the latest version";
    if (
      this.c.confirm !== false &&
      !window.confirm(`Install ${latest} for ${name}?`)
    ) {
      return;
    }

    this._setError("");
    this.busy = true;
    this.requested = true;
    this._render();

    try {
      await this.h.callService("update", "install", {
        entity_id: this.c.entity,
      });
      this._watchForStart();
    } catch (_) {
      this.requested = false;
      window.clearTimeout(this.startTimer);
      this._setError("The update could not be started.");
    } finally {
      this.busy = false;
      this._render();
    }
  }

  _render() {
    if (!this.c) return;
    const data = this._data();
    const signature = JSON.stringify([
      this.c,
      data,
      this.busy,
      this.requested,
      this.error,
    ]);
    if (signature === this._renderSignature) return;
    this._renderSignature = signature;
    const active =
      data.progress.active || this.busy || this.requested;
    const disabled =
      data.missing ||
      data.unavailable ||
      !data.pending ||
      active;
    const action = this.error
      ? "Retry"
      : this.busy || this.requested
        ? "Starting…"
        : data.action;
    const status = this.error
      ? this.error
      : `${data.current}${data.available ? ` · ${data.available}` : ""}`;
    const progress = active
      ? data.progress.determinate
        ? `<span class="progress determinate" role="progressbar" aria-label="Updating ${escapeHtml(data.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${data.progress.value}" style="--progress:${data.progress.value}%"></span>`
        : `<span class="progress indeterminate" role="progressbar" aria-label="${this.busy || this.requested ? "Starting" : "Updating"} ${escapeHtml(data.title)}"></span>`
      : "";

    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}ha-card{position:relative}.wrap{min-height:68px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:0 14px}.details{appearance:none;border:0;background:transparent;text-align:left;min-width:0;padding:10px 0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:10px;cursor:${this._state() ? "pointer" : "default"}}.details:active{transform:scale(.995)}.details:focus-visible,.action:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:10px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{font-size:13px;line-height:1.25;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.versions{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.versions.error{color:var(--error-color)}.versions b{font-weight:600;color:var(--primary-text-color)}.action{appearance:none;border:0;min-height:44px;padding:0 13px;border-radius:11px;background:var(--primary-color);color:var(--text-primary-color);font-size:13px;font-weight:600;cursor:pointer}.action:disabled{cursor:default;background:var(--secondary-background-color);color:var(--secondary-text-color);opacity:1}.progress{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0;background:var(--primary-color);pointer-events:none}.progress.determinate{width:var(--progress);transition:width .25s ease}.progress.indeterminate{width:34%;animation:update-slide 1.15s ease-in-out infinite}@keyframes update-slide{0%{transform:translateX(-105%)}50%{transform:translateX(150%)}100%{transform:translateX(305%)}}@media(prefers-reduced-motion:reduce){.progress.indeterminate{animation:none;width:100%;opacity:.55}.progress.determinate{transition:none}}@media(max-width:700px){.wrap{padding:0 12px}}</style><ha-card><div class="wrap"><button class="details" type="button" ${this._state() ? "" : "disabled"}><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span class="copy"><div class="title">${escapeHtml(data.title)}</div><div class="versions ${this.error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(status)}</div></span></button><button class="action" type="button" aria-label="${escapeHtml(action)} ${escapeHtml(data.title)}" ${disabled ? "disabled" : ""}>${escapeHtml(action)}</button></div>${progress}</ha-card>`;

    this.shadowRoot.querySelector(".details").onclick = () =>
      this._more();
    this.shadowRoot.querySelector(".action").onclick = () =>
      this._install(data);
  }
}
registerCard({ type: "component-update-row-v3", element: ComponentUpdateRowV3, name: "Update Row", description: "Reusable update row with live update support." });
}

// Module: src/components/empty-state.js
{
/** ComponentEmptyStateV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
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
}

// Module: src/components/energy-day-selector.js
{
/** ComponentEnergyDaySelectorV1 — reusable Home Assistant dashboard card. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEnergyDaySelectorV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = this._todayKey();
    this._connectedOnce = false;
  }

  setConfig(config) {
    this.config = {
      channel: "energy-day",
      title: "Energy day",
      ...config,
    };
    this._selected = this._todayKey();
    this._render();
    if (this.isConnected) queueMicrotask(() => this._emit());
  }

  set hass(hass) {
    this._hass = hass;
  }

  connectedCallback() {
    this._selected = this._todayKey();
    this._render();
    queueMicrotask(() => this._emit());
  }

  getCardSize() {
    return 1;
  }

  _pad(value) {
    return String(value).padStart(2, "0");
  }

  _key(date) {
    return `${date.getFullYear()}-${this._pad(date.getMonth() + 1)}-${this._pad(date.getDate())}`;
  }

  _todayKey() {
    return this._key(new Date());
  }

  _parse(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    ) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  _isToday() {
    return this._selected === this._todayKey();
  }

  _label() {
    const date = this._parse(this._selected) || new Date();
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = "numeric";
    }
    return date.toLocaleDateString("en-AU", options);
  }

  _emit() {
    window.dispatchEvent(
      new CustomEvent("energy-day-selector-change", {
        detail: {
          channel: this.config?.channel || "energy-day",
          day: this._selected,
          isToday: this._isToday(),
        },
      }),
    );
  }

  _setDay(value) {
    const date = this._parse(value);
    const today = this._parse(this._todayKey());
    if (!date || date > today) return;
    const next = this._key(date);
    if (next === this._selected) return;
    this._selected = next;
    this._render();
    this._emit();
  }

  _shift(days) {
    const date = this._parse(this._selected) || new Date();
    date.setDate(date.getDate() + days);
    this._setDay(this._key(date));
  }

  _render() {
    if (!this.config) return;
    const today = this._isToday();
    this.shadowRoot.innerHTML = `<style>
      :host {
        display: block;
        min-width: 0;
      }
      * {
        box-sizing: border-box;
      }
      ha-card {
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 16px);
        background: var(--ha-card-background, var(--card-background-color));
        color: var(--primary-text-color);
      }
      .row {
        min-height: 56px;
        padding: 6px 8px;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px auto;
        align-items: center;
        gap: 8px;
      }
      button {
        appearance: none;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      button:active:not(:disabled) {
        transform: scale(.97);
      }
      button:focus-visible,
      .date:focus-within {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      button:disabled {
        color: var(--disabled-text-color, var(--secondary-text-color));
        cursor: default;
        opacity: .45;
      }
      .step {
        display: grid;
        place-items: center;
      }
      ha-icon {
        --mdc-icon-size: 22px;
      }
      .date {
        position: relative;
        min-width: 0;
        min-height: 44px;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 12px;
        background: var(--secondary-background-color);
        overflow: hidden;
      }
      .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 650;
      }
      .state {
        flex: 0 0 auto;
        padding: 3px 7px;
        border-radius: 999px;
        background: var(--card-background-color);
        color: var(--secondary-text-color);
        font-size: 13px;
        font-weight: 600;
      }
      .state.historical {
        color: var(--primary-color);
      }
      input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }
      .today {
        padding: 0 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--primary-color);
        background: var(--secondary-background-color);
        font-size: 13px;
        font-weight: 650;
      }
      .today:disabled {
        opacity: .55;
      }
      @media (max-width: 420px) {
        .row {
          grid-template-columns: 44px minmax(0, 1fr) 44px 44px;
          gap: 4px;
          padding: 6px;
        }
        .today {
          width: 44px;
          padding: 0;
        }
        .today span {
          display: none;
        }
      }
    </style>
    <ha-card>
      <div class="row">
        <button class="step previous" type="button" aria-label="Previous day">
          <ha-icon icon="mdi:chevron-left"></ha-icon>
        </button>
        <label class="date">
          <span class="label">${this._label()}</span>
          <span class="state ${today ? "" : "historical"}" role="status" aria-live="polite">
            ${today ? "Today" : "Historical"}
          </span>
          <input type="date" aria-label="Select energy day" value="${this._selected}" max="${this._todayKey()}">
        </label>
        <button class="step next" type="button" aria-label="Next day" ${today ? "disabled" : ""}>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
        <button class="today" type="button" aria-label="Return to today" ${today ? "disabled" : ""}>
          <ha-icon icon="mdi:calendar-today-outline"></ha-icon><span>Today</span>
        </button>
      </div>
    </ha-card>`;

    this.shadowRoot.querySelector(".previous").onclick = () => this._shift(-1);
    this.shadowRoot.querySelector(".next").onclick = () => this._shift(1);
    this.shadowRoot.querySelector(".today").onclick = () =>
      this._setDay(this._todayKey());
    this.shadowRoot.querySelector("input").onchange = (event) =>
      this._setDay(event.target.value);
  }
}
registerCard({ type: "component-energy-day-selector-v1", element: ComponentEnergyDaySelectorV1, name: "Energy Day Selector", description: "Reusable day selector that broadcasts historical energy-day state." });
}

// Module: src/components/text-effect.js
{
/** ComponentTextEffectV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentTextEffectV1 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'})}
  setConfig(c){if(!c?.text)throw new Error('text is required');this.c={effect:'stamp',description:'',icon:null,speed:2.6,...c};this.render()}
  set hass(h){this.h=h}
  getCardSize(){return 1}
  render(){
    const c=this.c;
    const effect=['stamp','typewave','overprint','signal','rainbow_stamp'].includes(c.effect)?c.effect:'stamp';
    const speed=Math.max(1.6,Math.min(6,Number(c.speed)||2.6));
    const text=escapeHtml(c.text);
    const icon=c.icon?`<span class="icon"><ha-icon icon="${escapeHtml(c.icon)}"></ha-icon></span>`:'';
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
.row{min-height:70px;padding:12px 14px;display:grid;grid-template-columns:${c.icon?'40px ':''}minmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{position:relative;display:inline-block;max-width:100%;font-size:13px;line-height:1.25;font-weight:650;letter-spacing:-.005em;white-space:nowrap;color:var(--primary-text-color)}.base{position:relative;z-index:2}.desc{margin-top:4px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stamp .title{padding-bottom:4px}.stamp .title:after{content:'';position:absolute;z-index:1;left:0;bottom:0;width:100%;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent 0%,var(--primary-color) 42%,var(--primary-color) 58%,transparent 100%);background-size:220% 100%;opacity:.72;animation:stampSweep ${speed}s cubic-bezier(.4,0,.2,1) infinite}
.typewave .title:after{content:attr(data-text);position:absolute;z-index:3;inset:0;color:var(--primary-color);clip-path:inset(0 100% 0 0);animation:textSweep ${speed}s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
.overprint .title:after{content:attr(data-text);position:absolute;z-index:1;inset:0;color:var(--primary-color);opacity:0;filter:blur(.15px);animation:softPrint ${speed}s ease-in-out infinite;pointer-events:none}
.signal .title{padding-left:16px}.signal .title:before{content:'';position:absolute;left:1px;top:50%;width:7px;height:7px;margin-top:-3.5px;border:1.5px solid var(--primary-color);border-radius:2px;transform:rotate(45deg);opacity:.45;animation:signalPulse ${speed}s cubic-bezier(.4,0,.2,1) infinite}.signal .title:after{content:'';position:absolute;left:3px;top:50%;width:3px;height:3px;margin-top:-1.5px;border-radius:50%;background:var(--primary-color);animation:signalDot ${speed}s cubic-bezier(.4,0,.2,1) infinite}
.rainbow_stamp .title{padding-bottom:4px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2,#ff375f);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:rainbow ${speed}s linear infinite}.rainbow_stamp .title:after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:999px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2);background-size:240% 100%;opacity:.55;animation:rainbow ${speed}s linear infinite}
@keyframes stampSweep{0%{background-position:210% 0;opacity:0}15%{opacity:.28}42%{opacity:.78}70%{opacity:.28}100%{background-position:-110% 0;opacity:0}}@keyframes textSweep{0%,8%{clip-path:inset(0 100% 0 0);opacity:0}22%{opacity:.75}52%{clip-path:inset(0 0 0 0);opacity:.75}72%{clip-path:inset(0 0 0 100%);opacity:.2}100%{clip-path:inset(0 0 0 100%);opacity:0}}@keyframes softPrint{0%,48%,100%{opacity:0;transform:translateX(0)}60%{opacity:.22;transform:translateX(.6px)}70%{opacity:.1;transform:translateX(0)}}@keyframes signalPulse{0%,100%{opacity:.25;transform:rotate(45deg) scale(.88)}48%{opacity:.7;transform:rotate(45deg) scale(1.06)}70%{opacity:.35;transform:rotate(45deg) scale(.96)}}@keyframes signalDot{0%,100%{opacity:.35;transform:scale(.7)}48%{opacity:1;transform:scale(1)}70%{opacity:.5;transform:scale(.8)}}@keyframes rainbow{to{background-position:260% 50%}}
@media(prefers-reduced-motion:reduce){.stamp .title:after,.typewave .title:after,.overprint .title:after,.signal .title:before,.signal .title:after,.rainbow_stamp .title,.rainbow_stamp .title:after{animation:none!important}.stamp .title:after{opacity:.35;background:var(--primary-color)}.typewave .title:after,.overprint .title:after{display:none}.signal .title:before{opacity:.45}.signal .title:after{opacity:.7}}
@media(max-width:700px){.row{padding:12px}.desc{font-size:12px}}
</style><ha-card><div class="row ${effect}">${icon}<div class="copy"><div class="title" data-text="${text}"><span class="base">${text}</span></div>${c.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}</div></div></ha-card>`
  }
}
registerCard({ type: "component-text-effect-v1", element: ComponentTextEffectV1, name: "Signature Text Effect", description: "Reusable transient-status effects using the existing signature motion language." });
}

// Module: src/components/split-system-controller.js
{
/** ComponentSplitControllerV4 — reusable Home Assistant dashboard card. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const SPLIT_INVALID=new Set(["unknown","unavailable","none",""]),SPLIT_LABELS={fan_only:"Fan only"};class ComponentSplitControllerV4 extends HTMLElement{static getGridOptions(){return{columns:12,rows:"auto"}}constructor(){super(),this.attachShadow({mode:"open"}),this.t=!1,this.i="",this.o=null,this.l="",this.h=null,this.u=null,this.p=new Map,this.m=0,this.v=null,this._=null,this.k=null,this.T=null,this.S=null,this.A=null,this.C=null,this.q=null,this.L=null}setConfig(t){if(!t?.entity)throw new Error("A climate entity is required");clearTimeout(this._),this._=null;for(const t of this.p.values())this.I(t);this.p.clear(),this.v=null,this.T=null,this.t&&(this.M(!1),this.$.pb.replaceChildren()),this.S={...t},this.config={...this.S},this.A=null,this.C=null,clearTimeout(this.q),this.q=null,this.i=""}set hass(t){this.P=t,this.N(),this.O(),this.t||this.R(),this.D();const i=this.V();i!==this.i?(this.i=i,this.H()):this.F(),this.j()}O(){const t=this.S?.entity;if(!t||!this.P||this.A===t||this.C===t)return;const i=globalThis.__componentSplitRegistryV4;i?.load&&(this.C=t,i.load(this.P).then(s=>{if(this.S?.entity!==t)return;if(this.C=null,s.error){if(!this.isConnected)return;return clearTimeout(this.q),void(this.q=setTimeout(()=>{this.q=null,this.O()},31e3))}clearTimeout(this.q),this.q=null;const e=s.systems.get(t);this.config={...this.S,...e?{room_id:e.room_id,registry_entity:e.registry_entity,controller_entity:e.controller_entity,vertical_vane_entity:e.vertical_vane_entity,horizontal_vane_entity:e.horizontal_vane_entity,minimum_target:e.minimum_target,maximum_target:e.maximum_target,fan_ceiling:e.fan_ceiling,last_mode:e.last_mode,deadline:e.deadline,profiles:e.profiles}:{}},this.A=t,this.i="",this.t&&this.isConnected&&(this.H(),this.j())}))}connectedCallback(){this.N(),this.O(),this.t&&this.j()}N(){const t=globalThis.__componentSplitRegistryV4;this.isConnected&&!this.L&&this.P&&t?.subscribe&&(this.L=t.subscribe(this.P,()=>{this.A=null,this.i="",this.O()}))}disconnectedCallback(){clearTimeout(this._),this._=null,clearInterval(this.k),this.k=null,clearTimeout(this.q),this.q=null,this.L?.(),this.L=null;for(const t of this.p.values())clearTimeout(t.timeoutTimer),clearTimeout(t.settleTimer);this.p.clear(),this.v=null,this.T=null,this.t&&this.M(!1)}R(){this.t=!0,this.shadowRoot.innerHTML='<style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;background:transparent;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px}.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;gap:12px}.hd.settings{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}.idn{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.iw{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.cp{min-width:0}.nm,.st{display:block}.nm{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw{width:44px;height:44px;padding:0;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.pw.on{color:var(--primary-color)}button[disabled],button[aria-disabled=true]{opacity:.45;cursor:default}.ct{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.cr{display:grid;grid-template-columns:minmax(120px,1fr) auto;align-items:center;gap:16px}.cr.to{grid-template-columns:auto;justify-content:end}.rv{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.ml{display:block;margin-top:6px;color:var(--secondary-text-color);font-size:13px;line-height:1.2}.tc{min-height:48px;display:grid;grid-template-columns:44px minmax(82px,auto) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;overflow:hidden}.tb{width:44px;height:48px;padding:0;display:grid;place-items:center}.tp{min-width:0;padding:0 8px;text-align:center}.tv{font-size:18px;line-height:1.1;font-weight:650;font-variant-numeric:tabular-nums}.ts{margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.1;white-space:nowrap}.os,.uv{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.as{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.a{min-width:0;min-height:44px;flex:1 1 118px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:7px;color:var(--secondary-text-color)}.a ha-icon{--mdc-icon-size:18px}.al{min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.a.av,.a[aria-expanded=true]{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.pn{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;overscroll-behavior:contain;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,color-mix(in srgb,var(--primary-text-color) 32%,transparent)))}.pd{width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;padding:12px 14px 14px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,8px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}.ph{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px}.pt{margin:0;font-size:18px;line-height:1.2;font-weight:650}.x{width:44px;height:44px;border-radius:var(--dashboard-radius-control,8px);display:grid;place-items:center}.og+.og{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.gt{margin:0 4px 8px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.qs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.o{min-height:50px;width:100%;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:20px minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;background:transparent;font-size:13px;font-weight:600}.oi{color:var(--secondary-text-color)}.o[aria-selected=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}.o[aria-selected=true] .oi{color:var(--primary-color)}.tpr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tpr button,.tcu button,.tac button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.tpr button{display:flex;align-items:center;justify-content:center;gap:6px}.tcu{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px;margin-top:12px}.tcu label{font-size:13px;color:var(--secondary-text-color)}.tcu input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,5px);background:transparent}.tcu button{padding:0 14px;color:var(--primary-color)}.tac{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.tac button:first-child{color:var(--primary-color)}.tac button:last-child{color:var(--error-color)}.fb{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.fb:not(:empty){margin-top:10px}.fb.er{color:var(--error-color)}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:400px){.w{padding:12px}.as .a{flex-basis:calc(50% - 4px)}}@container (max-width:340px){.cr{grid-template-columns:1fr;justify-content:stretch}.tc{width:100%}}\n      </style><ha-card><div class="w"><div class="hd"><button class="idn" type="button"><span class="iw"><ha-icon class="mi"></ha-icon></span><span class="cp"><span class="nm"></span><span class="st" role="status"></span></span></button><button class="pw" type="button"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="ct"><div class="cr"><div class="rm"><span class="rv"></span><span class="ml">Room temperature</span></div><div class="tc"><button class="tb decrease" type="button" aria-label="Decrease target temperature"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tp"><div class="tv"></div><div class="ts"></div></div><button class="tb increase" type="button" aria-label="Increase target temperature"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="os"></div><div class="uv"></div><div class="as"><button class="a ma" type="button" data-panel="mode" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:thermostat"></ha-icon><span class="al"></span></button><button class="a fa" type="button" data-panel="fan" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:fan"></ha-icon><span class="al"></span></button><button class="a va" type="button" data-panel="vanes" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:swap-vertical"></ha-icon><span class="al"></span></button><button class="a ta" type="button" data-panel="timer" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:timer-outline"></ha-icon><span class="al"></span></button></div></div><div class="fb" role="status" aria-live="polite"></div></div></ha-card><section class="pn" id="split-secondary" role="dialog" aria-modal="true" aria-labelledby="split-pt" hidden><div class="pd"><div class="ph"><h3 class="pt" id="split-pt"></h3><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="pb"></div></div></section>';const t=document.createElement("button");t.className="pw sg",t.type="button",t.dataset.panel="settings",t.setAttribute("aria-controls","split-secondary"),t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label","Advanced settings");const i=document.createElement("ha-icon");i.setAttribute("icon","mdi:cog-outline"),t.append(i),this.shadowRoot.querySelector(".pw").before(t),this.$=Object.fromEntries([...this.shadowRoot.querySelectorAll("[class]")].flatMap(t=>[...t.classList].map(i=>[i,t]))),this.$.idn.addEventListener("click",()=>this.B()),this.$.pw.addEventListener("click",()=>this.G()),this.$.decrease.addEventListener("click",()=>this.W(-1)),this.$.increase.addEventListener("click",()=>this.W(1)),this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>t.addEventListener("click",()=>this.U(t.dataset.panel,t))),this.$.x.addEventListener("click",()=>this.M(!0)),this.$.pn.addEventListener("click",t=>{t.target===this.$.pn&&this.M(!0)}),this.shadowRoot.addEventListener("keydown",t=>{"Escape"===t.key&&this.o?(t.preventDefault(),this.M(!0)):"Tab"===t.key&&this.o&&this.J(t)})}V(){const t=[this.config.entity,this.config.vertical_vane_entity,this.config.horizontal_vane_entity,this.config.controller_entity,this.config.registry_entity||"sensor.split_state_registry"].filter(Boolean),i=t.map(t=>{const i=this.P?.states?.[t];return[t,i?.state,i?.attributes]}),s={room_id:this.config.room_id,minimum_target:this.config.minimum_target,maximum_target:this.config.maximum_target,fan_ceiling:this.config.fan_ceiling,last_mode:this.config.last_mode,deadline:this.config.deadline,profiles:this.config.profiles};return JSON.stringify([i,s])}K(t){if(null==t||""===t)return null;const i=Number(t);return Number.isFinite(i)?i:null}X(t){return t?this.P?.states?.[t]??null:null}Y(t){return Boolean(t&&!SPLIT_INVALID.has(String(t.state).toLowerCase()))}Z(){const t=this.X(this.config.entity),i=this.X(this.config.controller_entity),s=!this.Y(t)||this.config.controller_entity&&(!i||"on"!==i.state);return{state:t,attributes:t?.attributes??{},uv:s}}tt(t){const i=String(t??"").toLowerCase();return SPLIT_LABELS[i]??i.replaceAll("_"," ").replace(/^./,t=>t.toUpperCase())}it(t){const i=this.K(t);return null===i?null:`${Number.isInteger(i)?i:i.toFixed(1)}°`}et(t,i){return"heating"===i||"heat"===t?"mdi:fire":"cooling"===i||"cool"===t?"mdi:snowflake":"auto"===t?"mdi:thermostat-auto":"dry"===t?"mdi:water-percent":"fan_only"===t?"mdi:fan":"mdi:heat-pump"}nt(t){if(t.uv)return"Controller unavailable";const{state:i,attributes:s}=t,e=i.state,n=s.hvac_action,o=this.it(s.temperature),r=this.K(s.current_temperature),a=this.K(s.temperature),l=this.K(s.target_temp_step),h=null!==r&&null!==a&&null!==l&&l>0&&Math.abs(r-a)<=l;return"off"===e?"Off":"heating"===n?o?`Heating to ${o}`:"Heating":"cooling"===n?o?`Cooling to ${o}`:"Cooling":"heat"===e?h?"Heat · At target":o?`Heat · Target ${o}`:"Heat":"cool"===e?h?"Cool · At target":o?`Cool · Target ${o}`:"Cool":"auto"===e?o?`Auto · Target ${o}`:"Auto":"dry"===e?"drying"===n?"Drying":"Dry":"fan_only"===e?"Fan only"+(this.ot(s.fan_mode)?` · ${this.tt(s.fan_mode)}`:""):this.tt(e)}ot(t){return null!=t&&!SPLIT_INVALID.has(String(t).toLowerCase())}rt(t){const i=[this.p.get("hvac"),this.p.get("temperature"),this.p.get("fan"),[...this.p].find(([t])=>t.startsWith("vane:"))?.[1],this.p.get("timer")];for(const s of i){if(!s)continue;const i=s.queued?.label??s.label;return`${this.nt(t)} · Requesting ${i}`}return this.nt(t)}H(){const t=this.Z(),{state:i,attributes:s,uv:e}=t,n=!e&&"off"!==i.state,o=this.config.title||s.friendly_name||"Split system";this.$.nm.textContent=o,this.$.st.textContent=this.rt(t),this.$.mi.setAttribute("icon",e?"mdi:heat-pump":this.et(i.state,s.hvac_action)),this.$.idn.setAttribute("aria-label",`Open details for ${o}`),this.$.pw.classList.toggle("on",n),this.$.pw.disabled=e,this.$.pw.setAttribute("aria-label",e?`${o} unavailable`:`Turn ${n?"off":"on"} ${o}`),this.$.pw.setAttribute("aria-pressed",String(n));const r=this.lt();if(this.$.sg.hidden=!r,this.$.hd.classList.toggle("settings",r),this.$.ct.hidden=!1,this.$.uv.hidden=!e,this.$.uv.textContent=e?"Controls return when the controller reconnects.":"",e)return this.$.cr.hidden=!0,this.$.os.hidden=!0,this.$.as.hidden=!0,this.M(!0),void this.ht();const a=this.K(s.current_temperature),l=this.K(s.temperature),h=this.K(s.target_temp_step),{minimum:c,maximum:d}=this.dt(),u=n&&["heat","cool","auto"].includes(i.state)&&null!==l&&null!==h&&h>0;this.$.cr.hidden=!n||null===a&&!u,this.$.cr.classList.toggle("to",null===a&&u),this.$.rm.hidden=null===a,this.$.rv.textContent=this.it(a)??"",this.$.tc.hidden=!u;const p=this.v??l;if(this.$.tv.textContent=this.it(p)??"",this.$.ts.textContent=this.ut(l),this.$.decrease.disabled=!u||null!==c&&p<=c,this.$.increase.disabled=!u||null!==d&&p>=d,this.$.os.hidden=n,!n){const t=[];null!==a&&t.push(`Room ${this.it(a)}`);const i=this.gt();i&&t.push(`Resume ${this.tt(i)}`),this.$.os.textContent=t.join(" · ")||"Ready when needed"}const m=this.ft(),g=this.bt(),f=this.vt(),b=this.xt();this.$.as.hidden=!n,this.$.ma.hidden=!n||m.length<2,this.$.fa.hidden=!n||g.length<2,this.$.va.hidden=!n||0===f.length,this.$.ta.hidden=!n||!b,this.$.ma.querySelector(".al").textContent=`Mode · ${this.tt(i.state)}`,this.$.fa.querySelector(".al").textContent=`Fan · ${this.tt(s.fan_mode)}`,this.$.va.querySelector(".al").textContent=this.yt(f),this.$.ta.querySelector(".al").textContent=this.wt(),this.$.ta.classList.toggle("av",this._t().av),this.o&&!this.kt()?(this.Tt("That control is no longer available.","error"),this.M(!0)):this.o&&this.St(),this.ht()}F(){if(!this.t||!this.P)return;const t=this.Z();this.$.st.textContent=this.rt(t),this.ht(),this.o&&this.St()}ut(t){if(this.p.get("temperature")||this._){const i=this.it(t);return i?`Requesting · Current ${i}`:"Requesting"}return"Target"}ft(){const t=this.Z().attributes.hvac_modes;return Array.isArray(t)?t.filter(t=>"off"!==t&&this.ot(t)):[]}bt(){const{attributes:t}=this.Z(),i=Array.isArray(t.fan_modes)&&this.ot(t.fan_mode)?t.fan_modes.filter(t=>this.ot(t)):[],s=this.config.fan_ceiling;if(!s||"unrestricted"===String(s).toLowerCase())return i;const e={quiet:0,low:1,medium:2,high:3},n=e[String(s).toLowerCase()];return void 0===n?i:i.filter(t=>void 0!==e[String(t).toLowerCase()]&&e[String(t).toLowerCase()]<=n)}lt(){const t=this.Z(),i=this.K(t.attributes.min_temp),s=this.K(t.attributes.max_temp),e=this.K(t.attributes.target_temp_step),n=this.K(this.config.minimum_target),o=this.K(this.config.maximum_target),r=["Quiet","Low","Medium","High","Unrestricted"];return!t.uv&&this.config.room_id&&null!==i&&null!==s&&i<s&&null!==e&&e>0&&null!==n&&null!==o&&n>=i&&o<=s&&n<o&&r.includes(this.config.fan_ceiling)}dt(){const t=this.Z().attributes,i=this.K(t.min_temp),s=this.K(t.max_temp),e=this.K(this.config.minimum_target),n=this.K(this.config.maximum_target),o=null!==e&&null!==n&&e<n&&(null===i||e>=i)&&(null===s||n<=s);return{minimum:o&&null!==i?Math.max(i,e):i,maximum:o&&null!==s?Math.min(s,n):s}}gt(){const t=this.config.last_mode;return this.ft().includes(t)?t:null}vt(){return[["vertical","Vertical vane",this.config.vertical_vane_entity],["horizontal","Horizontal vane",this.config.horizontal_vane_entity]].flatMap(([t,i,s])=>{const e=this.X(s),n=Array.isArray(e?.attributes?.options)?e.attributes.options.filter(t=>this.ot(t)):[];return s&&e&&"unavailable"!==String(e.state).toLowerCase()&&n.length?[{axis:t,title:i,entityId:s,state:e.state,qs:n}]:[]})}$t(t,i){return("vertical"===i?{AUTO:"Auto","↑↑":"Highest","↑":"High","—":"Centre","↓":"Low","↓↓":"Lowest",SWING:"Swing"}:{"←←":"Far left","←":"Left","|":"Centre","→":"Right","→→":"Far right","←→":"Wide",SWING:"Swing","AIRFLOW CONTROL":"Airflow control"})[t]??this.tt(t)}At(t,i){return"mode"===t.key?this.et(i):"fan"===t.key?{auto:"mdi:fan-auto",quiet:"mdi:volume-low",low:"mdi:fan-speed-1",medium:"mdi:fan-speed-2",high:"mdi:fan-speed-3"}[String(i).toLowerCase()]??"mdi:fan":"vertical"===t.axis?{AUTO:"mdi:autorenew","↑↑":"mdi:arrow-up-bold","↑":"mdi:arrow-up","—":"mdi:minus","↓":"mdi:arrow-down","↓↓":"mdi:arrow-down-bold",SWING:"mdi:swap-vertical"}[i]??"mdi:swap-vertical":"mdi:swap-horizontal"}yt(t){return 1===t.length?`Vanes · ${this.$t(t[0].state,t[0].axis)}`:t.length>1?`Vanes · V ${this.$t(t[0].state,"vertical")} · H ${this.$t(t[1].state,"horizontal")}`:"Vanes"}xt(){return Boolean(this.config.room_id&&this.config.entity)}_t(){const t=this.config.deadline?Date.parse(String(this.config.deadline)):NaN;return Number.isFinite(t)?{av:t>Date.now(),deadline:t}:{av:!1,deadline:null}}wt(){const t=this._t();if(!t.av)return"Timer";const i=Math.max(0,Math.ceil((t.deadline-Date.now())/6e4));return i>=60&&i%60==0?`Timer · ${i/60} hr`:`Timer · ${i} min`}j(){const t=this._t().av;t&&!this.k?this.k=setInterval(()=>{this.$.ta?.querySelector(".al")?.replaceChildren(this.wt()),"timer"===this.o&&this.St()},3e4):!t&&this.k&&(clearInterval(this.k),this.k=null)}U(t,i){this.o!==t?(this.o=t,this.h=i,this.l="",this.u=null,this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>t.setAttribute("aria-expanded",String(t===i))),this.$.pn.hidden=!1,this.St(!0)):this.M(!0)}M(t){if(!this.t)return;const i=Boolean(this.o),s=this.h;this.o=null,this.h=null,this.l="",this.u=null,this.$.pn.hidden=!0,this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>t.setAttribute("aria-expanded","false")),t&&i&&(!s?.isConnected||s.hidden||s.disabled?this.$.idn.focus():s.focus())}J(t){const i="settings"===this.o?this.$.pb.querySelector("component-split-settings-v1"):null,s=i?.shadowRoot?[this.$.x,...i.shadowRoot.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled])')]:[...this.$.pn.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled])')];if(!s.length)return;const e=s[0],n=s.at(-1),o=this.shadowRoot.activeElement,r=i&&o===i?i.shadowRoot.activeElement:o;!t.shiftKey||r!==e&&s.includes(r)?t.shiftKey||r!==n||(t.preventDefault(),e.focus()):(t.preventDefault(),n.focus())}kt(){return"settings"===this.o?this.lt():"mode"===this.o?this.ft().length>0:"fan"===this.o?this.bt().length>0:"vanes"===this.o?this.vt().length>0:"timer"===this.o&&this.xt()}St(t=!1){if(!this.o||!this.kt())return;if("settings"===this.o){if(this.$.pt.textContent="Advanced settings",!customElements.get("component-split-settings-v1"))return this.$.pb.textContent="Loading settings…",void customElements.whenDefined("component-split-settings-v1").then(()=>{"settings"===this.o&&this.St(!0)});let i=this.$.pb.querySelector("component-split-settings-v1");return i||(i=document.createElement("component-split-settings-v1"),i.setConfig({entity:this.config.entity,room_id:this.config.room_id,minimum_target:this.config.minimum_target,maximum_target:this.config.maximum_target,fan_ceiling:this.config.fan_ceiling}),this.$.pb.replaceChildren(i)),i.hass=this.P,void(t&&i.focusInitial())}const i=this.u,s=this.$.pb,e=s.querySelector('input[type="number"]')?.value,n=this.Ct(),o=JSON.stringify(n);if(o===this.l)return;if(this.l=o,this.$.pt.textContent=n.title,s.replaceChildren(),"timer"===this.o)this.qt(s,e);else for(const t of n.groups)s.append(this.Lt(t));const r=i?s.querySelector(`[data-focus-key="${CSS.escape(i)}"]`):s.querySelector('[aria-selected="true"]')??s.querySelector("button");(i||t)&&queueMicrotask(()=>r?.focus())}zt(t){const i=this.p.get(t);return i?.queued?.requested??i?.requested??null}It(t,i){t.dataset.focusKey=i,t.addEventListener("focus",()=>{this.u=i})}Ct(){const t=this.Z();if("mode"===this.o)return{title:"Mode",groups:[{title:null,key:"mode",current:t.state.state,pending:this.zt("hvac"),qs:this.ft().map(t=>({value:t,label:this.tt(t)}))}]};if("fan"===this.o)return{title:"Fan",groups:[{title:null,key:"fan",current:t.attributes.fan_mode,pending:this.zt("fan"),qs:this.bt().map(t=>({value:t,label:this.tt(t)}))}]};if("vanes"===this.o)return{title:"Vanes",groups:this.vt().map(t=>({title:t.title,key:t.entityId,current:t.state,pending:this.zt(`vane:${t.entityId}`),axis:t.axis,qs:t.qs.map(i=>({value:i,label:this.$t(i,t.axis)}))}))};const i=this._t();return{title:"Off timer",active:i.av,deadline:i.deadline,pending:this.p.has("timer")}}Lt(t){const i=document.createElement("div");if(i.className="og",t.title){const s=document.createElement("div");s.className="gt",s.textContent=t.title,i.append(s)}const s=document.createElement("div");s.className="qs",s.setAttribute("role","listbox"),s.setAttribute("aria-label",t.title||this.tt(t.key));const e=t.pending,n=t.qs.some(i=>i.value===t.current);for(const[i,o]of t.qs.entries()){const r=document.createElement("button");r.type="button",r.className="o",r.dataset.key=`${t.key}|${o.value}`,this.It(r,r.dataset.key),r.setAttribute("role","option"),r.setAttribute("aria-selected",String(t.current===o.value)),r.setAttribute("aria-disabled",String(e===o.value)),r.tabIndex=t.current===o.value||!n&&0===i?0:-1;const a=document.createElement("ha-icon");if(a.className="oi",a.setAttribute("icon",this.At(t,o.value)),r.append(a,o.label),e===o.value){const t=document.createElement("ha-icon");t.setAttribute("icon","mdi:progress-clock"),r.append(t)}else if(t.current===o.value){const t=document.createElement("ha-icon");t.setAttribute("icon","mdi:check"),r.append(t)}r.addEventListener("click",()=>this.Mt(t,o)),r.addEventListener("keydown",t=>this.Pt(t,s)),s.append(r)}return i.append(s),i}Pt(t,i){if(!["ArrowDown","ArrowRight","ArrowUp","ArrowLeft","Home","End"].includes(t.key))return;t.preventDefault();const s=[...i.querySelectorAll("button:not([disabled])")];if(!s.length)return;const e=s.indexOf(t.currentTarget),n="Home"===t.key?0:"End"===t.key?s.length-1:(e+(["ArrowDown","ArrowRight"].includes(t.key)?1:-1)+s.length)%s.length;s.forEach((t,i)=>{t.tabIndex=i===n?0:-1}),s[n].focus()}Mt(t,i){t.current!==i.value&&t.pending!==i.value&&("mode"===t.key?this.Nt("hvac",{requested:i.value,label:i.label,call:()=>this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:i.value}),matches:()=>this.X(this.config.entity)?.state===i.value,closePanel:!0}):"fan"===t.key?this.Nt("fan",{requested:i.value,label:i.label,call:()=>this.P.callService("climate","set_fan_mode",{entity_id:this.config.entity,fan_mode:i.value}),matches:()=>this.X(this.config.entity)?.attributes?.fan_mode===i.value,closePanel:!0}):this.Nt(`vane:${t.key}`,{requested:i.value,label:i.label,call:()=>this.P.callService("select","select_option",{entity_id:t.key,option:i.value}),matches:()=>this.X(t.key)?.state===i.value,closePanel:!1}))}qt(t,i){const s=this.p.has("timer"),e=document.createElement("div");e.className="tpr";for(const[t,i]of[[30,"30 min"],[60,"1 hr"],[120,"2 hr"]]){const n=document.createElement("button");n.type="button";const o=document.createElement("ha-icon");o.setAttribute("icon","mdi:clock-outline"),n.append(o,i),this.It(n,`timer-preset-${t}`),n.setAttribute("aria-disabled",String(s)),n.addEventListener("click",()=>{s||this.Ot("set",t,i)}),e.append(n)}const n=document.createElement("div");n.className="tcu";const o=document.createElement("label");o.textContent="Custom minutes";const r=document.createElement("input");r.type="number",r.min="1",r.max="720",r.step="1",r.value=i||"90",this.It(r,"timer-custom-input"),o.append(r);const a=document.createElement("button");if(a.type="button",a.textContent="Start",a.setAttribute("aria-disabled",String(s)),this.It(a,"timer-custom-start"),a.addEventListener("click",()=>{if(s)return;const t=Number(r.value);if(!Number.isInteger(t)||t<1||t>720)return this.Tt("Enter a timer between 1 and 720 minutes.","error"),void r.focus();this.Ot("set",t,`${t} min`)}),n.append(o,a),t.append(e,n),this._t().av){const i=document.createElement("div");i.className="tac";const e=document.createElement("button");e.type="button",e.textContent="+30 min",e.setAttribute("aria-disabled",String(s)),this.It(e,"timer-extend"),e.addEventListener("click",()=>{s||this.Ot("extend",30,"30 more minutes")});const n=document.createElement("button");n.type="button",n.textContent="Cancel timer",n.setAttribute("aria-disabled",String(s)),this.It(n,"timer-cancel"),n.addEventListener("click",()=>{s||this.Ot("cancel",0,"timer cancellation")}),i.append(e,n),t.append(i)}}Ot(t,i,s){const e=this._t(),n="extend"===t&&null!==e.deadline?e.deadline+6e4*i:null;this.Nt("timer",{requested:t,label:s,call:()=>this.P.callService("split_state_registry","set_timer",{room_id:this.config.room_id,operation:t,minutes:i||void 0}),matches:()=>{const i=this._t();return"cancel"===t?!i.av:"extend"===t?i.av&&null!==n&&i.deadline>=n-5e3:i.av&&i.deadline!==e.deadline},closePanel:!0,timeout:1e4})}G(){const t=this.Z();if(t.uv)return;if("off"!==t.state.state)return void this.Rt("hvac",{requested:"off",label:"Off",call:()=>this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:"off"}),matches:()=>"off"===this.X(this.config.entity)?.state,closePanel:!0,timeout:1e4},!0);const i=this.gt();i?this.Rt("hvac",{requested:i,label:this.tt(i),call:()=>this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:i}),matches:()=>this.X(this.config.entity)?.state===i,closePanel:!1,timeout:1e4},!0):this.U("mode",this.$.pw)}Dt(t,i,s){const e=s??0,n=Math.max(0,String(i).split(".")[1]?.length??0);return Number((e+Math.round((t-e)/i)*i).toFixed(n))}Et(t){const i=this.K(t);if(null===i)return null;const{minimum:s,maximum:e}=this.dt();return Math.min(e??i,Math.max(s??i,i))}W(t){const i=this.Z().attributes,s=this.K(i.temperature),e=this.K(i.target_temp_step);if(null===s||null===e||e<=0)return;const{minimum:n}=this.dt(),o=this.v??s,r=this.Dt(o+t*e,e,n??s);this.v=this.Et(r),this.T=null,clearTimeout(this._),this.p.has("temperature")||(this._=setTimeout(()=>{this._=null,this.Vt()},300)),this.H()}Vt(){const t=this.Et(this.v);null!==t&&(this.v=t,this.Rt("temperature",{requested:t,label:this.it(t),call:()=>this.P.callService("climate","set_temperature",{entity_id:this.config.entity,temperature:t}),matches:()=>{const i=this.Et(t),s=this.K(this.X(this.config.entity)?.attributes?.temperature);return null!==i&&null!==s&&Math.abs(s-i)<.001},closePanel:!1,timeout:1e4}))}Nt(t,i){this.T=null;const s=this.p.get(t);if(s)return s.queued=i,void this.H();this.Rt(t,i)}Rt(t,i,s=!1){this.T=null;const e=this.p.get(t);if(e&&!s)return e.queued=i,void this.H();e&&this.I(e);const n=++this.m,o=Date.now(),r={...i,id:n,settleAfter:o+1800,queued:null};this.p.set(t,r),r.timeoutTimer=setTimeout(()=>this.Ht(t,n,`No confirmation for ${r.label}.`),i.timeout??8e3),r.settleTimer=setTimeout(()=>this.D(),1820),this.H(),Promise.resolve().then(()=>r.call()).then(()=>{const i=this.p.get(t);i&&i.id===n&&this.D()}).catch(()=>this.Ht(t,n,`Could not request ${r.label}.`))}D(){const t=this.Z();if(this.p.size&&t.uv){for(const t of this.p.values())this.I(t);return this.p.clear(),clearTimeout(this._),this._=null,this.v=null,void(this.T={text:"Controller disconnected before the request was confirmed.",type:"error"})}if("off"===t.state?.state){for(const[t,i]of[...this.p])("temperature"===t||"fan"===t||"timer"===t||t.startsWith("vane:"))&&(this.I(i),this.p.delete(t));clearTimeout(this._),this._=null,this.v=null}const i=Date.now();for(const[t,s]of[...this.p])i>=s.settleAfter&&s.matches()&&this.Ft(t,s.id)}Ft(t,i){const s=this.p.get(t);if(!s||s.id!==i)return;this.I(s),this.p.delete(t);const e=s.queued;if("temperature"===t){const t=this.K(this.X(this.config.entity)?.attributes?.temperature),i=this.Et(s.requested);this.v=this.Et(this.v),null!==i&&null!==this.v&&Math.abs(this.v-i)>.001?queueMicrotask(()=>this.Vt()):null!==i&&null!==t&&Math.abs(t-i)<.001&&(this.v=null)}e?queueMicrotask(()=>this.Rt(t,e)):s.closePanel&&this.o&&this.M(!0),this.i="",this.H()}Ht(t,i,s){const e=this.p.get(t);e&&e.id===i&&(this.I(e),this.p.delete(t),"temperature"===t&&(this.v=null),this.Tt(s,"error"),e.queued&&queueMicrotask(()=>this.Rt(t,e.queued)),this.i="",this.H())}I(t){clearTimeout(t.timeoutTimer),clearTimeout(t.settleTimer)}Tt(t,i="info"){this.T={text:t,type:i},this.ht()}ht(){this.t&&(this.$.fb.textContent=this.T?.text??"",this.$.fb.classList.toggle("er","error"===this.T?.type))}B(){this.dispatchEvent(new CustomEvent("hass-action",{bubbles:!0,composed:!0,detail:{config:{entity:this.config.entity,tap_action:{action:"more-info"}},action:"tap"}}))}}
registerCard({ type: "component-split-controller-v4", element: ComponentSplitControllerV4, name: "Split-System Controller", description: "Registry-aware split-system controller with settings and timer support." });
}

// Module: src/components/favourites.js
{
/** ComponentFavouritesV3 — reusable Home Assistant dashboard card. */
const { escapeHtml, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const FAVOURITES_V3_DOMAINS=new Set(["automation","button","climate","cover","fan","humidifier","input_boolean","input_button","light","lock","media_player","scene","script","select","switch","vacuum","water_heater"]),FAVOURITES_V3_INVALID=new Set(["unavailable","unknown"]);class ComponentFavouritesV3 extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._registry=null,this._registryPromise=null,this._selected=[],this._draft=[],this._originalDraft="",this._pending=new Map,this._flash=new Map,this._flashTimers=new Map,this._lastStorageSignature="",this._noticeTimer=null,this._registrySubscription=null,this._registryRefreshTimer=null,this._renderSignature="",this._editorStorageSignature="",this._connection=null}setConfig(t){const e=Array.isArray(t?.helpers)?t.helpers.filter(t=>"string"==typeof t):[],i=Array.isArray(t?.items)?t.items.slice(0,4):[];if(!e.length&&!i.length)throw new Error("helpers or items is required");this.config={title:"Favourites",max:4,show_header:e.length>0,...t,helpers:e.slice(0,4),items:i},this._build(),this._syncStored(),this._renderGrid()}set hass(t){const e=this._connection;this._hass=t,this._connection=t?.connection||null,this._built||this._build(),e!==this._connection&&(this._unsubscribeRegistryEvents(),this._subscribeRegistryEvents()),this._syncStored(),this._ensureRegistry();const i=this._gridSignature();i!==this._renderSignature&&(this._renderSignature=i,this._renderGrid()),this.$?.editor?.open&&this._updateEditorState(),this._controllerCard&&(this._controllerCard.hass=t)}getCardSize(){return 2}connectedCallback(){this._connection=this._hass?.connection||null,this._subscribeRegistryEvents(),this._ensureRegistry()}disconnectedCallback(){clearTimeout(this._noticeTimer),clearTimeout(this._registryRefreshTimer),this._registryRefreshTimer=null,this._unsubscribeRegistryEvents();for(const t of this._flashTimers.values())clearTimeout(t);this._flashTimers.clear()}_subscribeRegistryEvents(){if(!this.isConnected||this._registrySubscription||!this._connection?.subscribeEvents)return;const t=Promise.all(["entity_registry_updated","device_registry_updated","area_registry_updated"].map(e=>this._connection.subscribeEvents(()=>this._queueRegistryRefresh(),e))).then(t=>()=>{for(const e of t)e?.()});this._registrySubscription=t,t.catch(()=>{this._registrySubscription===t&&(this._registrySubscription=null)})}_unsubscribeRegistryEvents(){const t=this._registrySubscription;this._registrySubscription=null,t&&Promise.resolve(t).then(t=>t?.()).catch(()=>{})}_queueRegistryRefresh(){clearTimeout(this._registryRefreshTimer),this._registryRefreshTimer=setTimeout(()=>{this._registryRefreshTimer=null,this._registry=null,this._registryPromise=null,this._registryError=null,this._renderSignature="",this.isConnected&&this._ensureRegistry()},180)}_storageSignature(){return JSON.stringify((this.config?.helpers||[]).map(t=>this._hass?.states?.[t]?.state))}_gridSignature(){if(!this.config)return"";return JSON.stringify([this._storageSignature(),this._selected.map((t,s)=>{const e=this._record(t),i=this._companion(e);return[this._refKey(t),this._name(e),this._icon(e),e.state?.state,this._stateLabel(e),this._isActive(e),i?.state?.state,this._pending.get(s)?.label||"",this._flash.get(s)?.kind||"",this._flash.get(s)?.label||""]})])}_build(){if(this.config&&!this._built){this._built=!0,this.shadowRoot.innerHTML='\n      <style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;cursor:pointer}ha-card{border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.wrap{padding:0}.head{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.heading{display:flex;align-items:center;gap:8px;min-width:0}.heading ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.heading h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.edit{min-width:44px;min-height:44px;padding:0 10px;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-color);display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:600}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.edit ha-icon{--mdc-icon-size:18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:448px}.item{position:relative;min-width:0;min-height:52px;display:grid;grid-template-columns:minmax(0,1fr) auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));overflow:hidden}.main{min-width:0;min-height:52px;padding:6px 8px;text-align:left;background:transparent;display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:8px}.item.has-quick .main{padding-right:4px}.main:active,.quick:active{background:color-mix(in srgb,var(--primary-color) 10%,transparent)}.main:focus-visible,.quick:focus-visible,.edit:focus-visible,.dialog-button:focus-visible,.choice:focus-visible,.order:focus-visible,.remove:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.icon{width:32px;height:32px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:650}.state{margin-top:2px;font-size:13px;color:var(--secondary-text-color)}.item.active{background:var(--dashboard-active-surface,var(--card-background-color));box-shadow:inset 2px 0 0 var(--primary-color)}.item.active .icon{background:transparent;color:var(--primary-color)}.item.active .state{color:var(--primary-color);font-weight:600}.item.unavailable{opacity:.55}.quick{width:44px;min-height:52px;padding:0;border-left:1px solid var(--dashboard-card-border-color,var(--divider-color));background:transparent;color:var(--primary-color);display:grid;place-items:center}.quick ha-icon{--mdc-icon-size:21px}.item:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;opacity:0;transform-origin:left}.item.pending:after{opacity:1;background:linear-gradient(90deg,transparent,var(--primary-color),transparent);animation:favourite-progress 1.05s linear infinite}.item.success:after{opacity:1;background:var(--success-color,#43a047)}.item.error:after{opacity:1;background:var(--error-color)}@keyframes favourite-progress{from{transform:translateX(-100%)}to{transform:translateX(100%)}}.empty,.load-error{grid-column:1/-1;min-height:44px;padding:9px 11px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:transparent;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.notice{min-height:0;margin-top:0;font-size:13px;color:var(--secondary-text-color)}.notice:not(:empty){margin-top:7px}.notice.error{color:var(--error-color)}dialog{box-sizing:border-box;border:var(--dashboard-card-border,1px solid var(--divider-color));padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}.editor{width:min(580px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 24px));border-radius:var(--dashboard-radius-dialog,8px)}.dialog-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:transparent;border-bottom:1px solid var(--divider-color)}.dialog-title{font-size:20px;font-weight:650}.close{width:44px;height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.editor-body{padding:14px 16px 96px}.editor-copy{font-size:13px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:12px}.subheading{margin:14px 0 7px;font-size:13px;font-weight:650;color:var(--primary-text-color)}.selected{display:grid;gap:7px}.selected-row{min-height:62px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px;padding:6px 7px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color))}.selected-row .icon{background:transparent}.selected-copy{min-width:0}.selected-meta{font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.alias{width:100%;height:44px;margin-top:3px;padding:0 8px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;font-size:13px;outline:none}.alias:focus{border-color:var(--primary-color)}.selected-actions{display:flex;align-items:center;gap:2px}.order,.remove{width:44px;height:44px;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.order[disabled]{opacity:.3;cursor:default}.remove{color:var(--error-color)}.order ha-icon,.remove ha-icon{--mdc-icon-size:18px}.search{width:100%;min-height:46px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;outline:none}.search:focus{border-color:var(--primary-color)}.available{margin-top:8px}.group-title{padding:10px 4px 5px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.choice{width:100%;min-height:58px;padding:6px 7px;border-radius:var(--dashboard-radius-control,8px);background:transparent;text-align:left;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px}.choice:hover{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.choice-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.choice-meta{margin-top:2px;font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.add{color:var(--primary-color);font-size:13px;font-weight:650;padding-right:4px}.available-empty{padding:10px 7px;color:var(--secondary-text-color);font-size:13px}.editor-actions{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;background:transparent;border-top:1px solid var(--divider-color)}.count{font-size:13px;color:var(--secondary-text-color)}.action-buttons{display:flex;gap:8px}.dialog-button{min-height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.dialog-button.primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}.dialog-button[disabled]{opacity:.45;cursor:default}.editor-error{min-height:0;margin-top:8px;color:var(--error-color);font-size:13px}.confirm{width:min(430px,calc(100vw - 28px));border-radius:var(--dashboard-radius-dialog,8px)}.confirm-body{padding:18px}.confirm-title{font-size:18px;font-weight:650}.confirm-message{margin-top:7px;font-size:13px;line-height:1.45;color:var(--secondary-text-color)}.confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.controller{width:min(620px,calc(100vw - 20px));max-height:calc(100vh - 20px);border-radius:var(--dashboard-radius-dialog,8px);overflow:auto}.controller-body{padding:12px}.controller-body>*{display:block}.controller .dialog-head{border-bottom:0}@media(max-width:420px){.head{margin-bottom:6px}.edit span{display:none}.edit{padding:0}.grid{gap:8px}.main{padding:6px}.editor-body{padding:12px 12px 94px}.dialog-head{padding:12px}.editor-actions{padding:11px 12px}.selected-row{grid-template-columns:30px minmax(0,1fr) auto;gap:7px;padding:5px}.selected-actions{gap:0}.order,.remove{width:44px}.choice{padding:5px}}\n      </style>\n      <ha-card>\n        <div class="wrap">\n          <div class="head">\n            <div class="heading"><ha-icon icon="mdi:star-outline"></ha-icon><h2></h2></div>\n            <button class="edit" type="button"><ha-icon icon="mdi:pencil-outline"></ha-icon><span>Edit</span></button>\n          </div>\n          <div class="grid"></div>\n          <div class="notice" role="status" aria-live="polite"></div>\n        </div>\n      </ha-card>\n      <dialog class="editor" aria-labelledby="favourites-editor-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-editor-title">Edit favourites</div><button class="close editor-close" type="button" aria-label="Close editor"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="editor-body">\n          <div class="editor-copy">Choose up to four household controls. Their order here is their order on Home.</div>\n          <div class="subheading">Selected</div>\n          <div class="selected"></div>\n          <div class="subheading">Available controls</div>\n          <input class="search" type="search" placeholder="Search by name, room or entity" aria-label="Search available controls">\n          <div class="available"></div>\n          <div class="editor-error" role="alert"></div>\n        </div>\n        <div class="editor-actions"><div class="count"></div><div class="action-buttons"><button class="dialog-button cancel" type="button">Cancel</button><button class="dialog-button primary save" type="button">Save</button></div></div>\n      </dialog>\n      <dialog class="confirm" aria-labelledby="favourites-confirm-title">\n        <div class="confirm-body"><div class="confirm-title" id="favourites-confirm-title"></div><div class="confirm-message"></div><div class="confirm-actions"><button class="dialog-button confirm-cancel" type="button">Cancel</button><button class="dialog-button primary confirm-run" type="button">Run</button></div></div>\n      </dialog>\n      <dialog class="controller" aria-labelledby="favourites-controller-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-controller-title">Climate</div><button class="close controller-close" type="button" aria-label="Close climate controller"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="controller-body"></div>\n      </dialog>\n    ',this.$=Object.fromEntries([...this.shadowRoot.querySelectorAll("[class]")].flatMap(t=>[...t.classList].map(e=>[e,t]))),Object.assign(this.$,{editorClose:this.shadowRoot.querySelector(".editor-close"),confirmCancel:this.shadowRoot.querySelector(".confirm-cancel"),confirmRun:this.shadowRoot.querySelector(".confirm-run"),confirmTitle:this.shadowRoot.querySelector(".confirm-title"),confirmMessage:this.shadowRoot.querySelector(".confirm-message"),controllerClose:this.shadowRoot.querySelector(".controller-close"),controllerTitle:this.shadowRoot.querySelector("#favourites-controller-title"),controllerBody:this.shadowRoot.querySelector(".controller-body"),editorError:this.shadowRoot.querySelector(".editor-error")}),this.shadowRoot.querySelector("h2").textContent=this.config.title,this.$.head.hidden=!1===this.config.show_header,this.$.edit.hidden=!this.config.helpers.length,this.$.edit.addEventListener("click",()=>this._openEditor()),this.$.editorClose.addEventListener("click",()=>this.$.editor.close()),this.$.cancel.addEventListener("click",()=>this.$.editor.close()),this.$.search.addEventListener("input",()=>this._renderAvailable()),this.$.save.addEventListener("click",()=>this._save()),this.$.confirmCancel.addEventListener("click",()=>this.$.confirm.close()),this.$.controllerClose.addEventListener("click",()=>this.$.controller.close());for(const t of[this.$.editor,this.$.confirm,this.$.controller])t.addEventListener("click",e=>{e.target===t&&t.close()})}}_escape(t){return escapeHtml(t)}_domain(t){return String(t||"").split(".")[0]}_normaliseRef(t){return t&&"object"==typeof t&&[t.d,t.p,t.u].every(t=>"string"==typeof t&&t)?{v:1,d:t.d,p:t.p,u:t.u,n:"string"==typeof t.n?t.n.slice(0,64):""}:null}_parseSlot(t){if(!t||FAVOURITES_V3_INVALID.has(String(t).toLowerCase()))return null;try{return this._normaliseRef(JSON.parse(t))}catch(t){return null}}_syncStored(){if(!this.config||!this._hass||!this.config.helpers.length)return;const t=JSON.stringify(this.config.helpers.map(t=>this._hass.states?.[t]?.state));t!==this._lastStorageSignature&&(this._lastStorageSignature=t,this._selected=this.config.helpers.map(t=>this._parseSlot(this._hass.states?.[t]?.state)).filter(Boolean).slice(0,this.config.max))}async _ensureRegistry(){return this._registry||this._registryPromise||!this._hass?.connection?.sendMessagePromise||(this._registryPromise=Promise.all([this._hass.connection.sendMessagePromise({type:"config/entity_registry/list"}),this._hass.connection.sendMessagePromise({type:"config/device_registry/list"}),this._hass.connection.sendMessagePromise({type:"config/area_registry/list"})]).then(async([t,e,i])=>{const s=Array.isArray(t)?t:[],r=Array.isArray(e)?e:[],a=Array.isArray(i)?i:[],o=new Map,n=new Map;for(const t of s){const e=this._entryKey(t);e&&o.set(e,t),t.device_id&&(n.has(t.device_id)||n.set(t.device_id,[]),n.get(t.device_id).push(t))}return this._registry={entities:s,devices:new Map(r.map(t=>[t.id,t])),areas:new Map(a.map(t=>[t.area_id,t.name])),byKey:o,byDevice:n,claimed:new Set,splitSystems:new Map},await this._refreshSplitRegistry(),this._renderSignature="",this._renderGrid(),this.$?.editor?.open&&this._renderEditor(),this._registry}).catch(t=>(this._registryError=t,this._registryPromise=null,this._renderGrid(),null))),this._registryPromise}async _refreshSplitRegistry(){const t=globalThis.__componentSplitRegistryV4;if(this._registry&&t?.load&&this._hass)try{const e=await t.load(this._hass);this._registry.claimed=e?.claimed||new Set,this._registry.splitSystems=e?.systems||new Map}catch(t){this._registry.claimed=new Set,this._registry.splitSystems=new Map}}_entryKey(t){return t?.entity_id&&t.platform&&t.unique_id?`${this._domain(t.entity_id)}|${t.platform}|${t.unique_id}`:null}_refKey(t){return t?`${t.d}|${t.p}|${t.u}`:""}_refForEntry(t,e=""){return{v:1,d:this._domain(t.entity_id),p:t.platform,u:t.unique_id,n:e}}_record(t){const e=this._registry?.byKey.get(this._refKey(t))||null;return{ref:t,entry:e,state:e&&this._hass?.states?.[e.entity_id]||null}}_name(t){return t.ref?.n?.trim()||t.entry?.name||t.entry?.original_name||t.state?.attributes?.friendly_name||t.entry?.entity_id||"Favourite not found"}_icon(t){if(t.state?.attributes?.icon)return t.state.attributes.icon;return{automation:"mdi:robot-outline",button:"mdi:gesture-tap-button",climate:"mdi:thermostat",cover:"mdi:window-shutter",fan:"mdi:fan",humidifier:"mdi:air-humidifier",input_boolean:"mdi:toggle-switch-outline",input_button:"mdi:gesture-tap-button",light:"mdi:lightbulb-outline",lock:"mdi:lock-outline",media_player:"mdi:play-circle-outline",scene:"mdi:palette-outline",script:"mdi:script-text-outline",select:"mdi:format-list-bulleted",switch:"mdi:toggle-switch-outline",vacuum:"mdi:robot-vacuum",water_heater:"mdi:water-boiler"}[t.entry?this._domain(t.entry.entity_id):t.ref?.d]||"mdi:star-outline"}_companion(t){if(!t.entry?.device_id||!this._registry)return null;const e=(this._registry.byDevice.get(t.entry.device_id)||[]).filter(t=>"binary_sensor"===this._domain(t.entity_id)).map(t=>({entry:t,state:this._hass?.states?.[t.entity_id]})).filter(({state:t})=>["garage_door","door","opening"].includes(t?.attributes?.device_class));return e.find(({state:t})=>"garage_door"===t?.attributes?.device_class)||e[0]||null}_companionLabel(t){return t?.state?"on"===t.state.state?"Open":"off"===t.state.state?"Closed":"unavailable"===t.state.state?"Status unavailable":"Status unknown":null}_stateLabel(t){if(!t.entry||!t.state)return"Not found";if("unavailable"===t.state.state)return"Unavailable";if("unknown"===t.state.state)return"Status unknown";const e=this._domain(t.entry.entity_id),i=this._companion(t);if(["button","input_button"].includes(e)){const t=this._companionLabel(i);return t?`${t} · Tap to operate`:"Tap to run"}if(["automation","script"].includes(e))return"Tap to start";if("scene"===e)return"Tap to activate";if("media_player"===e){const e=t.state.attributes?.media_title,i=this._label(t.state.state);return e?`${i} · ${e}`:i}if("climate"===e){const e=t.state.attributes?.hvac_action;return this._label(e&&"idle"!==e?e:t.state.state)}return this._label(t.state.state)}_label(t){return String(t??"").replaceAll("_"," ").replace(/^./,t=>t.toUpperCase())}_isActive(t){if(!t.state||FAVOURITES_V3_INVALID.has(String(t.state.state).toLowerCase()))return!1;const e=this._domain(t.entry?.entity_id);return["light","switch","fan","input_boolean"].includes(e)?"on"===t.state.state:"media_player"===e?["playing","paused","buffering","on"].includes(t.state.state):"climate"===e?"off"!==t.state.state:"cover"===e?"closed"!==t.state.state:"lock"===e&&"unlocked"===t.state.state}_hasMediaQuick(t){return"media_player"===this._domain(t.entry?.entity_id)&&["playing","paused"].includes(t.state?.state)}_actionLabel(t){const e=this._domain(t.entry?.entity_id);return["light","switch","fan","input_boolean"].includes(e)?"on"===t.state?.state?"turn off":"turn on":["button","input_button"].includes(e)?"run":["automation","script"].includes(e)?"start":"scene"===e?"activate":"climate"===e?"open climate controls":"open details"}_renderGrid(){if(!this.$?.grid||!this.config)return;if(this.config.items.length&&!this.config.helpers.length)return void this._renderDemo();this.$.grid.replaceChildren();this.config.helpers.some(t=>{const e=this._hass?.states?.[t];return this._hass&&(!e||FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase()))})?this.$.grid.innerHTML='<div class="load-error">Favourites storage is unavailable.</div>':this._registry?this._selected.length?this._selected.forEach((t,e)=>{const i=this._record(t),s=this._name(i),r=this._stateLabel(i),a=this._pending.get(e),o=this._flash.get(e),n=a?.label||o?.label||r,l=this._hasMediaQuick(i),u=!i.state||FAVOURITES_V3_INVALID.has(String(i.state.state).toLowerCase()),c=document.createElement("div");c.className=["item",l?"has-quick":"",this._isActive(i)?"active":"",u?"unavailable":"",a?"pending":"",o?.kind||""].filter(Boolean).join(" ");const d=document.createElement("button");d.type="button",d.className="main",d.setAttribute("aria-label",`${s}, ${r}, ${this._actionLabel(i)}`),u&&(d.disabled=!0,d.setAttribute("aria-disabled","true"));const h=this._domain(i.entry?.entity_id);if(["light","switch","fan","input_boolean"].includes(h)&&d.setAttribute("aria-pressed",String("on"===i.state?.state)),d.innerHTML=`<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="copy"><div class="name">${this._escape(s)}</div><div class="state">${this._escape(n)}</div></span>`,d.addEventListener("click",()=>this._activate(e)),c.append(d),l){const t=document.createElement("button");t.type="button",t.className="quick";const r="playing"===i.state.state;t.setAttribute("aria-label",`${r?"Pause":"Play"} ${s}`),t.innerHTML=`<ha-icon icon="mdi:${r?"pause":"play"}"></ha-icon>`,t.addEventListener("click",()=>this._mediaAction(e)),c.append(t)}this.$.grid.append(c)}):this.$.grid.innerHTML='<div class="empty">Add up to four everyday controls here.</div>':this.$.grid.innerHTML=`<div class="${this._registryError?"load-error":"empty"}">${this._registryError?"Favourites could not load the entity registry.":"Loading favourites…"}</div>`}_renderDemo(){this.$.grid.replaceChildren(),this.config.items.slice(0,4).forEach(t=>{const e=document.createElement("div");e.className="item",e.innerHTML=`<button class="main" type="button" aria-disabled="true"><span class="icon"><ha-icon icon="${this._escape(t.icon||"mdi:star-outline")}"></ha-icon></span><span class="copy"><div class="name">${this._escape(t.title||"Favourite")}</div><div class="state">${this._escape(t.state||"Supporting state")}</div></span></button>`,this.$.grid.append(e)})}async _activate(t){if(this._pending.has(t))return;const e=this._record(this._selected[t]);if(!e.entry||!e.state)return void this._openEditor();const i=e.entry.entity_id,s=this._domain(i);if(!FAVOURITES_V3_INVALID.has(String(e.state.state).toLowerCase()))if(["button","input_button"].includes(s))this._confirmButton(t,e);else{if(["light","switch","fan","input_boolean"].includes(s)){const s=e.state.state;this._setPending(t,"on"===s?"Turning off…":"Turning on…");try{await this._hass.callService("homeassistant","toggle",{entity_id:i}),await this._waitFor(i,t=>t!==s,9e3),this._setFlash(t,"success","on"===s?"Off":"On")}catch(e){this._setFlash(t,"error","Could not update")}return}if(["automation","script","scene"].includes(s)){const e="automation"===s?"trigger":"turn_on",r="scene"===s?"Activating…":"Starting…",a="scene"===s?"Activated":"Started";this._setPending(t,r);try{await this._hass.callService(s,e,{entity_id:i}),this._setFlash(t,"success",a)}catch(e){this._setFlash(t,"error","Could not start")}return}"climate"===s&&this._registry?.splitSystems?.has(i)?this._openSplit(e):this._moreInfo(i)}else this._moreInfo(i)}async _mediaAction(t){if(this._pending.has(t))return;const e=this._record(this._selected[t]);if(!e.entry||!e.state)return;const i=e.entry.entity_id,s="playing"===e.state.state,r=s?"media_pause":"media_play";this._setPending(t,s?"Pausing…":"Playing…");try{await this._hass.callService("media_player",r,{entity_id:i}),await this._waitFor(i,t=>s?"playing"!==t:"playing"===t,9e3),this._setFlash(t,"success",s?"Paused":"Playing")}catch(e){this._setFlash(t,"error","Could not update")}}_confirmButton(t,e){const i=this._name(e),s=this._companion(e),r=this._companionLabel(s);this.$.confirmTitle.textContent=r?`Operate ${i}?`:`Run ${i}?`,this.$.confirmMessage.textContent=r?`The current reported state is ${r.toLowerCase()}.`:"This action runs immediately and cannot be reversed from this button.",this.$.confirmRun.textContent=r?"Operate":"Run",this.$.confirmRun.onclick=()=>{this.$.confirm.close(),this._runButton(t,e)},this.$.confirm.showModal(),this.$.confirmCancel.focus()}async _runButton(t,e){const i=e.entry.entity_id,s=this._domain(i);this._setPending(t,"Sending command…");try{await this._hass.callService(s,"press",{entity_id:i}),this._setFlash(t,"success","Command sent")}catch(e){this._setFlash(t,"error","Command failed")}}_setPending(t,e){this._pending.set(t,{label:e}),this._flash.delete(t),this._renderGrid()}_setFlash(t,e,i){this._pending.delete(t),this._flash.set(t,{kind:e,label:i}),clearTimeout(this._flashTimers.get(t)),this._flashTimers.set(t,setTimeout(()=>{this._flash.delete(t),this._flashTimers.delete(t),this._renderGrid()},3200)),this._renderGrid()}_waitFor(t,e,i){return new Promise((s,r)=>{const a=Date.now(),o=setInterval(()=>{const n=this._hass?.states?.[t]?.state;e(n)?(clearInterval(o),s()):Date.now()-a>=i&&(clearInterval(o),r(new Error("State confirmation timed out")))},160)})}_moreInfo(t){openMoreInfo(this,t)}_openSplit(t){const e="component-split-controller-v4";if(!customElements.get(e))return void this._moreInfo(t.entry.entity_id);this.$.controllerTitle.textContent=this._name(t),this.$.controllerBody.replaceChildren();const i=document.createElement(e);i.setConfig({entity:t.entry.entity_id}),i.hass=this._hass,this._controllerCard=i,this.$.controllerBody.append(i),this.$.controller.showModal(),this.$.controllerClose.focus()}async _openEditor(){await this._ensureRegistry(),await this._refreshSplitRegistry(),this._editorStorageSignature=this._storageSignature(),this._draft=this._selected.map(t=>({...t})),this._originalDraft=JSON.stringify(this._draft),this.$.search.value="",this.$.editorError.textContent="",this._renderEditor(),this.$.editor.showModal(),setTimeout(()=>this.$.search.focus(),30)}_renderEditor(){this._renderSelected(),this._renderAvailable(),this._updateEditorState()}_renderSelected(){this.$.selected.replaceChildren(),this._draft.length?this._draft.forEach((t,e)=>{const i=this._record(t),s=document.createElement("div");s.className="selected-row",s.innerHTML=`<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="selected-copy"><div class="selected-meta">${this._escape(this._name({...i,ref:{...t,n:""}}))}</div><input class="alias" type="text" maxlength="64" value="${this._escape(t.n)}" placeholder="Optional shorter label" aria-label="Custom label for ${this._escape(this._name(i))}"></span><span class="selected-actions"><button class="order up" type="button" aria-label="Move ${this._escape(this._name(i))} earlier" ${0===e?"disabled":""}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="order down" type="button" aria-label="Move ${this._escape(this._name(i))} later" ${e===this._draft.length-1?"disabled":""}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="remove" type="button" aria-label="Remove ${this._escape(this._name(i))}"><ha-icon icon="mdi:close"></ha-icon></button></span>`,s.querySelector(".alias").addEventListener("input",t=>{this._draft[e].n=t.target.value.slice(0,64),this._updateEditorState()}),s.querySelector(".up").addEventListener("click",()=>this._move(e,-1)),s.querySelector(".down").addEventListener("click",()=>this._move(e,1)),s.querySelector(".remove").addEventListener("click",()=>{this._draft.splice(e,1),this._renderEditor()}),this.$.selected.append(s)}):this.$.selected.innerHTML='<div class="available-empty">No favourites selected.</div>'}_move(t,e){const i=t+e;i<0||i>=this._draft.length||([this._draft[t],this._draft[i]]=[this._draft[i],this._draft[t]],this._renderEditor())}_eligibleEntries(){if(!this._registry||!this._hass)return[];const t=new Set(this._draft.map(t=>this._refKey(t))),e=new Set(this.config.helpers);return this._registry.entities.filter(i=>{const s=this._domain(i.entity_id);return FAVOURITES_V3_DOMAINS.has(s)&&i.unique_id&&i.platform&&!i.disabled_by&&!i.hidden_by&&!i.entity_category&&this._hass.states?.[i.entity_id]&&!e.has(i.entity_id)&&!this._registry.claimed.has(i.entity_id)&&!t.has(this._entryKey(i))})}_areaName(t){if(!t)return"Missing";const e=t.device_id?this._registry?.devices.get(t.device_id):null,i=t.area_id||e?.area_id;return i&&this._registry?.areas.has(i)?this._registry.areas.get(i):["automation","scene","script"].includes(this._domain(t.entity_id))?"Routines":"Household"}_renderAvailable(){if(!this.$?.available)return;if(this.$.available.replaceChildren(),!this._registry)return void(this.$.available.innerHTML='<div class="available-empty">Loading household controls…</div>');const t=this.$.search.value.trim().toLowerCase(),e=this._eligibleEntries().map(t=>{const e=this._record(this._refForEntry(t));return{entry:t,record:e,name:this._name(e),area:this._areaName(t)}}).filter(({entry:e,name:i,area:s})=>`${i} ${s} ${e.entity_id} ${this._domain(e.entity_id)}`.toLowerCase().includes(t)).sort((t,e)=>`${t.area}\0${t.name}`.localeCompare(`${e.area}\0${e.name}`,void 0,{sensitivity:"base"}));if(!e.length)return void(this.$.available.innerHTML=`<div class="available-empty">${this._draft.length>=this.config.max?"Four favourites selected. Remove one to choose another.":"No matching household controls."}</div>`);let i="";for(const t of e){if(t.area!==i){i=t.area;const e=document.createElement("div");e.className="group-title",e.textContent=i,this.$.available.append(e)}const e=document.createElement("button");e.type="button",e.className="choice",e.disabled=this._draft.length>=this.config.max,e.innerHTML=`<span class="icon"><ha-icon icon="${this._escape(this._icon(t.record))}"></ha-icon></span><span><div class="choice-name">${this._escape(t.name)}</div><div class="choice-meta">${this._escape(`${this._label(this._domain(t.entry.entity_id))} · ${this._stateLabel(t.record)}`)}</div></span><span class="add">Add</span>`,e.addEventListener("click",()=>{this._draft.length>=this.config.max||(this._draft.push(this._refForEntry(t.entry)),this._renderEditor())}),this.$.available.append(e)}}_slotValue(t){return t?JSON.stringify(this._normaliseRef(t)):""} _updateEditorState(){const t=this.config.helpers.map((t,e)=>this._slotValue(this._draft[e]||null)).every((t,e)=>{const i=Number(this._hass?.states?.[this.config.helpers[e]]?.attributes?.max||255);return t.length<=i}),e=this.config.helpers.every(t=>{const e=this._hass?.states?.[t];return e&&!FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase())}),i=JSON.stringify(this._draft)!==this._originalDraft,s=Boolean(this.$?.editor?.open&&this._editorStorageSignature&&this._editorStorageSignature!==this._storageSignature());this.$.count.textContent=`${this._draft.length} of ${this.config.max} selected`,this.$.save.disabled=!i||!t||!e||s,this.$.editorError.textContent=s?"Favourites changed on another dashboard. Close and reopen the editor before trying again.":e?t?"":"A stored favourite is too long. Shorten its custom label.":"Favourites storage is unavailable."}async _save(){if(this.$.save.disabled)return;if(this._editorStorageSignature!==this._storageSignature())return void(this._updateEditorState());const t=this.config.helpers.map(t=>this._hass.states?.[t]?.state||""),e=this.config.helpers.map((t,e)=>this._slotValue(this._draft[e]||null));this.$.save.disabled=!0,this.$.save.textContent="Saving…",this.$.editorError.textContent="";try{for(let t=0;t<this.config.helpers.length;t+=1)await this._hass.callService("input_text","set_value",{entity_id:this.config.helpers[t],value:e[t]});this._selected=this._draft.map(t=>({...t})),this._lastStorageSignature="",this._renderSignature="",this._editorStorageSignature=this._storageSignature(),this.$.editor.close(),this._renderGrid(),this._notice("Favourites saved.")}catch(e){let i=!0;for(let e=0;e<this.config.helpers.length;e+=1)try{await this._hass.callService("input_text","set_value",{entity_id:this.config.helpers[e],value:t[e]})}catch(t){i=!1}this.$.editorError.textContent=i?"Favourites could not be saved. No changes were kept.":"Favourites could not be saved, and some stored slots may have changed. Close and reopen the editor before trying again."}finally{const t=this.$.editorError.textContent;this.$.save.textContent="Save",this._updateEditorState(),t&&(this.$.editorError.textContent=t)}}_notice(t,e=!1){clearTimeout(this._noticeTimer),this.$.notice.textContent=t,this.$.notice.classList.toggle("error",e),this._noticeTimer=setTimeout(()=>{this.$.notice.textContent="",this.$.notice.classList.remove("error")},3600)}}
registerCard({ type: "component-favourites-v3", element: ComponentFavouritesV3, name: "Favourites", description: "Registry-aware persistent household favourites with safe actions." });
}

// Module: src/components/welcome-header.js
{
/** ComponentWelcomeHeaderV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentWelcomeHeaderV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){super();this.attachShadow({mode:"open"});this.config=null;this._hass=null;this._timer=null;this._signature=""}
  setConfig(config){
    this.config={weather_entity:"weather.forecast_home",...config};
    if(!this.config.weather_entity)throw new Error("weather_entity is required");
    this._signature="";this._render();
  }
  set hass(hass){this._hass=hass;this._render()}
  connectedCallback(){this._schedule();this._render()}
  disconnectedCallback(){clearTimeout(this._timer);this._timer=null}
  getCardSize(){return 1}
  _schedule(){
    clearTimeout(this._timer);
    const delay=60000-Date.now()%60000+100;
    this._timer=setTimeout(()=>{this._signature="";this._render();this._schedule()},delay);
  }
  _escape(value){return escapeHtml(value)}
  _locale(){const locale=this._hass?.locale?.language||navigator.language||"en-AU";return locale==="en"?"en-AU":locale}
  _timeZone(){return this._hass?.config?.time_zone||undefined}
  _number(value,digits=0){
    const n=Number(value);if(!Number.isFinite(n))return null;
    return new Intl.NumberFormat(this._locale(),{maximumFractionDigits:digits,minimumFractionDigits:Number.isInteger(n)?0:Math.min(1,digits)}).format(n);
  }
  _openWeather(){
    openMoreInfo(this,this.config.weather_entity);
  }
  _render(){
    if(!this.config)return;
    const now=new Date(),state=this._hass?.states?.[this.config.weather_entity],attrs=state?.attributes||{},zone=this._timeZone();
    const temperature=this._number(attrs.temperature,1),cloud=this._number(attrs.cloud_coverage,0);
    const temperatureText=temperature===null?"—":temperature+(attrs.temperature_unit||"°C");
    const cloudText=cloud===null?"Cloud —":"Cloud "+cloud+"%";
    const time=new Intl.DateTimeFormat(this._locale(),{hour:"numeric",minute:"2-digit",timeZone:zone}).format(now);
    const signature=JSON.stringify([Math.floor(now.getTime()/60000),state?.state,attrs.temperature,attrs.temperature_unit,attrs.cloud_coverage,zone]);
    if(signature===this._signature)return;this._signature=signature;
    this.shadowRoot.innerHTML="<style>:host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit}ha-card{border:0;box-shadow:none;background:transparent;color:var(--primary-text-color)}.row{min-height:32px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}.time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}.weather{appearance:none;border:0;min-height:32px;padding:0;background:transparent;color:var(--secondary-text-color);font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer;text-align:right}.weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}@media(max-width:520px){.row{gap:8px}.time{font-size:13px}.weather{font-size:12px}}@media(max-width:350px){.row{gap:6px}.time{font-size:12px}.weather{font-size:11px}}</style><ha-card><div class=\"row\"><span class=\"time\">"+this._escape(time)+"</span><button class=\"weather\" type=\"button\" aria-label=\"Outside "+this._escape(temperatureText)+", "+this._escape(cloudText)+". Open weather details.\">"+this._escape(temperatureText+" · "+cloudText)+"</button></div></ha-card>"
    this.shadowRoot.querySelector(".weather")?.addEventListener("click",()=>this._openWeather());
  }
}
registerCard({ type: "component-welcome-header-v1", element: ComponentWelcomeHeaderV1, name: "Welcome Header", description: "Compact live weather and home-time header." });
}

// Module: src/components/wled-controller.js
{
/** ComponentWledControllerV1 — reusable Home Assistant dashboard card. */
const {
  openMoreInfo,
  registerCard,
  WLED_HD,
  WLED_DOMAIN,
  WLED_INVALID,
  WLED_NAME,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentWledControllerV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:'auto'}}
  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this.c=null;this.h=null;this.d=null;this.b=null;this.unsub=null;this.loading=false;this.sheetSignature='';
    this.shadowRoot.innerHTML=`<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button,select,input{font:inherit;color:inherit}
      ha-card{display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}
      .head{min-height:58px;padding:8px 8px 7px 10px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}
      .ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:20px}.on .ico{color:var(--primary-color)}
      .identity{appearance:none;border:0;background:transparent;min-width:0;padding:0;text-align:left;cursor:pointer}.name,.status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.status{margin-top:3px;font-size:12px;line-height:1.25;color:var(--secondary-text-color)}
      .power,.action,.close{appearance:none;border:1px solid var(--divider-color);background:transparent;border-radius:var(--dashboard-radius-control,8px);cursor:pointer}.power{width:40px;height:40px;display:grid;place-items:center;color:var(--secondary-text-color)}.power ha-icon{--mdc-icon-size:18px}.on .power{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 8%,transparent)}
      .body{padding:0 10px 10px;display:grid;gap:8px}.slider-row{display:grid;grid-template-columns:74px minmax(0,1fr) 38px;align-items:center;gap:8px}.label{font-size:11px;color:var(--secondary-text-color)}.value{font-size:11px;text-align:right;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
      input[type=range]{width:100%;min-width:0;accent-color:var(--primary-color)}
      .actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}.action{min-height:32px;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--secondary-text-color)}.action ha-icon{--mdc-icon-size:15px}.action:hover,.action:focus-visible{color:var(--primary-text-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}
      dialog{width:min(620px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));padding:0;margin:auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}
      .sheet{display:flex;flex-direction:column;max-height:min(760px,calc(100dvh - 24px))}.sheet-head{min-height:54px;padding:6px 7px 6px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.sheet-head ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}.sheet-title{min-width:0;flex:1}.sheet-name{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sheet-state{margin-top:2px;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.close{width:40px;height:40px;display:grid;place-items:center;color:var(--secondary-text-color);border-color:transparent}.close ha-icon{--mdc-icon-size:18px}
      .sheet-body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom));display:grid;gap:16px}.section{display:grid;gap:8px}.section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--secondary-text-color)}.section-title:after{content:'';height:1px;background:var(--divider-color);flex:1}
      .preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.preset-btn{appearance:none;min-height:38px;padding:6px 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-text-color);text-align:left;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preset-btn:hover,.preset-btn:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.preset-btn.active{border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,transparent);color:var(--primary-color)}
      .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.field{display:grid;gap:4px;min-width:0}.field>span{font-size:11px;color:var(--secondary-text-color);padding-left:2px}select{width:100%;height:38px;min-width:0;padding:0 28px 0 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:var(--card-background-color);font-size:12px;outline:none}
      .fine{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fine-card{min-width:0;padding:8px 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px)}.fine-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px}.fine-head span,.fine-head output{font-size:11px;color:var(--secondary-text-color)}.fine-head output{font-variant-numeric:tabular-nums}
      .native{display:flex;justify-content:flex-end}.native .action{min-height:36px}
      :is(button,select,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled,select:disabled,input:disabled{opacity:.45;cursor:default}
      @media(max-width:520px){dialog{width:100vw;max-width:100vw;height:88dvh;max-height:88dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:var(--dashboard-radius-dialog,8px) var(--dashboard-radius-dialog,8px) 0 0}.sheet{height:88dvh;max-height:88dvh}.sheet-body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}.preset-grid{grid-template-columns:1fr}.fields,.fine{grid-template-columns:1fr}.body{padding-left:9px;padding-right:9px}.head{padding-left:8px}.slider-row{grid-template-columns:68px minmax(0,1fr) 36px}.actions{justify-content:stretch}.actions .action{flex:1;justify-content:center}}
    </style><ha-card><div class="head"><span class="ico"><ha-icon icon="mdi:led-strip-variant"></ha-icon></span><button class="identity" type="button"><span class="name">WLED</span><span class="status">Loading…</span></button><button class="power" type="button" aria-label="Toggle WLED"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="body"><div class="slider-row"><span class="label">Brightness</span><input class="brightness" type="range" min="0" max="255" step="1"><output class="brightness-value value">—</output></div><div class="actions"><button class="action presets" type="button"><ha-icon icon="mdi:bookmark-multiple-outline"></ha-icon><span>Presets</span></button><button class="action colour" type="button"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Colour</span></button><button class="action advanced" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Advanced</span></button></div></div></ha-card><dialog><div class="sheet"><div class="sheet-head"><ha-icon icon="mdi:led-strip-variant"></ha-icon><span class="sheet-title"><div class="sheet-name">WLED</div><div class="sheet-state"></div></span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="sheet-body"><section class="section presets-section"><div class="section-title">Presets</div><div class="preset-grid"></div></section><section class="section"><div class="section-title">Effect</div><div class="fields"><label class="field"><span>Effect</span><select class="effect"></select></label><label class="field"><span>Palette</span><select class="palette"></select></label></div></section><section class="section"><div class="section-title">Animation</div><div class="fine"><label class="fine-card"><span class="fine-head"><span>Speed</span><output class="speed-value">—</output></span><input class="speed" type="range" min="0" max="255" step="1"></label><label class="fine-card"><span class="fine-head"><span>Intensity</span><output class="intensity-value">—</output></span><input class="intensity" type="range" min="0" max="255" step="1"></label></div></section><div class="native"><button class="action native-colour" type="button"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Colour & white controls</span></button></div></div></div></dialog>`;
    this.head=this.shadowRoot.querySelector('.head');this.nameEl=this.shadowRoot.querySelector('.name');this.statusEl=this.shadowRoot.querySelector('.status');this.sheetName=this.shadowRoot.querySelector('.sheet-name');this.sheetState=this.shadowRoot.querySelector('.sheet-state');
    this.power=this.shadowRoot.querySelector('.power');this.identity=this.shadowRoot.querySelector('.identity');this.brightness=this.shadowRoot.querySelector('.brightness');this.brightnessValue=this.shadowRoot.querySelector('.brightness-value');this.presetsBtn=this.shadowRoot.querySelector('.presets');this.colour=this.shadowRoot.querySelector('.colour');this.advanced=this.shadowRoot.querySelector('.advanced');this.dialog=this.shadowRoot.querySelector('dialog');this.presetGrid=this.shadowRoot.querySelector('.preset-grid');this.presetsSection=this.shadowRoot.querySelector('.presets-section');this.effect=this.shadowRoot.querySelector('.effect');this.palette=this.shadowRoot.querySelector('.palette');this.speed=this.shadowRoot.querySelector('.speed');this.speedValue=this.shadowRoot.querySelector('.speed-value');this.intensity=this.shadowRoot.querySelector('.intensity');this.intensityValue=this.shadowRoot.querySelector('.intensity-value');this.nativeColour=this.shadowRoot.querySelector('.native-colour');
    this.power.onclick=()=>this.call('light','toggle',this.b?.main?[this.b.main]:[]);
    this.identity.onclick=()=>this.openAdvanced(false);
    this.presetsBtn.onclick=()=>this.openAdvanced(true);
    this.advanced.onclick=()=>this.openAdvanced(false);
    this.colour.onclick=()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main);
    this.nativeColour.onclick=()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main);
    this.shadowRoot.querySelector('.close').onclick=()=>this.dialog.close();
    this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.dialog.close()});
    this.brightness.oninput=()=>this.brightnessValue.textContent=this.pct(this.brightness.value);
    this.brightness.onchange=()=>{const v=Number(this.brightness.value);v<=0?this.call('light','turn_off',this.b?.main?[this.b.main]:[]):this.call('light','turn_on',this.b?.main?[this.b.main]:[],{brightness:v})};
    this.effect.onchange=()=>this.effect.value&&this.call('light','turn_on',this.b?.effectLights||[],{effect:this.effect.value});
    this.palette.onchange=()=>this.palette.value&&this.call('select','select_option',this.b?.palettes||[],{option:this.palette.value});
    this.speed.oninput=()=>this.speedValue.textContent=this.speed.value;this.speed.onchange=()=>this.call('number','set_value',this.b?.speeds||[],{value:Number(this.speed.value)});
    this.intensity.oninput=()=>this.intensityValue.textContent=this.intensity.value;this.intensity.onchange=()=>this.call('number','set_value',this.b?.intensities||[],{value:Number(this.intensity.value)});
  }
  setConfig(c){if(!c?.entity)throw new Error('WLED controller requires entity');this.c={...c};this.d=null;this.b=null;this.load()}
  set hass(h){this.h=h;this.unsub||this.subscribe();if(this.d){this.b=this.bundle();this.render()}else this.load()}
  connectedCallback(){this.subscribe();this.load()}
  disconnectedCallback(){this.unsub?.();this.unsub=null}
  getCardSize(){return 2}
  subscribe(){if(this.unsub||!this.h||!WLED_HD.REG?.subscribe)return;this.unsub=WLED_HD.REG.subscribe(this.h,d=>{this.d=d;if(!this.c)return;this.b=this.bundle();this.render()})}
  async load(force=false){if(this.loading||!this.h||!this.c||!WLED_HD.REG?.load)return;this.loading=true;try{this.d=this.d||await WLED_HD.REG.load(this.h,force);this.b=this.bundle();this.render()}finally{this.loading=false}}
  bundle(){const all=this.d?.entities||[],entry=all.find(e=>e.entity_id===this.c.entity),deviceId=this.c.device_id||entry?.device_id,siblings=(deviceId?this.d?.byDevice?.get(deviceId):[])||[],rows=siblings.filter(e=>e?.platform==='wled'&&!e.disabled_by&&this.h.states[e.entity_id]),lightRows=rows.filter(e=>WLED_DOMAIN(e.entity_id)==='light'),main=lightRows.find(e=>e.entity_id===this.c.entity)||lightRows.find(e=>WLED_NAME(e)==='main')||lightRows[0],effectRows=lightRows.filter(e=>Array.isArray(this.h.states[e.entity_id]?.attributes?.effect_list)),selectRows=rows.filter(e=>WLED_DOMAIN(e.entity_id)==='select'),numberRows=rows.filter(e=>WLED_DOMAIN(e.entity_id)==='number'),match=(e,re)=>re.test(`${e.entity_id} ${e.original_name||''} ${e.name||''}`),preset=selectRows.find(e=>match(e,/\bpreset\b/i)),palettes=selectRows.filter(e=>match(e,/color.?palette|colour.?palette/i)),speeds=numberRows.filter(e=>match(e,/\bspeed\b/i)),intensities=numberRows.filter(e=>match(e,/\bintensity\b/i)),dev=this.d?.devices?.find(x=>x.id===deviceId),deviceName=dev?.name_by_user||dev?.name||this.h.states[main?.entity_id]?.attributes?.friendly_name||'WLED';return{deviceId,deviceName,main:main?.entity_id||this.c.entity,effectLights:effectRows.map(e=>e.entity_id),preset:preset?.entity_id||null,palettes:palettes.map(e=>e.entity_id),speeds:speeds.map(e=>e.entity_id),intensities:intensities.map(e=>e.entity_id)}}
  pct(v){const n=Number(v);return Number.isFinite(n)?`${Math.round(n/255*100)}%`:'—'}
  same(ids,read){const vals=ids.map(id=>read(this.h.states[id])).filter(v=>v!==undefined&&v!==null&&!WLED_INVALID.has(String(v).toLowerCase()));if(!vals.length)return null;return vals.every(v=>String(v)===String(vals[0]))?vals[0]:'Mixed'}
  setOptions(el,options,current,emptyLabel){const opts=Array.isArray(options)?options:[],valid=current!=null&&current!=='Mixed'&&opts.includes(String(current));el.replaceChildren();if(!valid){const o=document.createElement('option');o.value='';o.textContent=current==='Mixed'?'Mixed':emptyLabel;o.selected=true;el.append(o)}for(const v of opts){const o=document.createElement('option');o.value=String(v);o.textContent=String(v);o.selected=valid&&String(v)===String(current);el.append(o)}el.disabled=!opts.length}
  renderPresets(options,current){this.presetGrid.replaceChildren();if(!options.length){const x=document.createElement('span');x.className='label';x.textContent='No presets configured';this.presetGrid.append(x);return}for(const value of options){const b=document.createElement('button');b.type='button';b.className=`preset-btn ${String(current)===String(value)?'active':''}`;b.textContent=String(value);b.title=String(value);b.onclick=async()=>{await this.call('select','select_option',this.b?.preset?[this.b.preset]:[],{option:value});this.dialog.close()};this.presetGrid.append(b)}}
  render(){if(!this.h||!this.b)return;const main=this.h.states[this.b.main],on=main?.state==='on',brightness=on?Number(main?.attributes?.brightness??0):0,effect=this.same(this.b.effectLights,s=>s?.attributes?.effect),palette=this.same(this.b.palettes,s=>s?.state),speed=this.same(this.b.speeds,s=>s?.state),intensity=this.same(this.b.intensities,s=>s?.state),presetState=this.b.preset?this.h.states[this.b.preset]:null,presetOptions=presetState?.attributes?.options||[];this.head.classList.toggle('on',on);this.nameEl.textContent=this.b.deviceName;const status=on?[this.pct(brightness),effect&&effect!=='Mixed'?effect:null,palette&&palette!=='Mixed'?palette:null].filter(Boolean).join(' · '):'Off';this.statusEl.textContent=status;this.sheetName.textContent=this.b.deviceName;this.sheetState.textContent=status;this.brightness.disabled=!main;this.brightness.value=String(Math.max(0,Math.min(255,Number.isFinite(brightness)?brightness:0)));this.brightnessValue.textContent=this.pct(this.brightness.value);this.power.disabled=!main;this.presetsBtn.disabled=!presetOptions.length;this.colour.disabled=!this.b.effectLights.length;this.nativeColour.disabled=!this.b.effectLights.length;if(!this.dialog.open){this.sheetSignature='';return}const fxState=this.b.effectLights.map(id=>this.h.states[id]).find(Boolean),fxOptions=fxState?.attributes?.effect_list||[],paletteState=this.b.palettes.map(id=>this.h.states[id]).find(Boolean),paletteOptions=paletteState?.attributes?.options||[],sheetSignature=JSON.stringify([this.b.main,this.b.preset,this.b.effectLights,this.b.palettes,this.b.speeds,this.b.intensities,main,presetState,fxState,paletteState,...this.b.speeds.map(id=>this.h.states[id]),...this.b.intensities.map(id=>this.h.states[id])]);if(sheetSignature===this.sheetSignature)return;this.sheetSignature=sheetSignature;this.renderPresets(presetOptions,presetState?.state);this.setOptions(this.effect,fxOptions,effect,'Choose effect');this.setOptions(this.palette,paletteOptions,palette,'Choose palette');this.setRange(this.speed,this.speedValue,this.b.speeds,speed);this.setRange(this.intensity,this.intensityValue,this.b.intensities,intensity)}
  setRange(input,output,ids,value){const s=ids.map(id=>this.h.states[id]).find(Boolean),a=s?.attributes||{};input.min=String(a.min??0);input.max=String(a.max??255);input.step=String(a.step??1);const n=value==='Mixed'?Number(s?.state):Number(value);input.value=String(Number.isFinite(n)?n:Number(input.min));input.disabled=!ids.length;output.textContent=value==='Mixed'?'Mixed':ids.length?String(Math.round(Number(input.value))):'—'}
  openAdvanced(presets=false){if(!this.dialog||!this.b)return;if(!this.dialog.open){this.dialog.showModal();this.render()}queueMicrotask(()=>{if(presets)this.presetsSection?.scrollIntoView({block:'start'});else this.shadowRoot.querySelector('.close')?.focus()})}
  async call(domain,service,ids,data={}){const targets=[...new Set((ids||[]).filter(Boolean))];if(!this.h||!targets.length)return;await Promise.all(targets.map(entity_id=>this.h.callService(domain,service,{entity_id,...data}))) }
  moreInfo(entityId){openMoreInfo(this,entityId)}
}
registerCard({ type: "component-wled-controller-v1", element: ComponentWledControllerV1, name: "WLED Controller V1", description: "Minimal WLED control with advanced settings sheet." });
}

// Module: src/components/garage-door-controller.js
{
/** ComponentGarageDoorControllerV1 — state-led garage-door control card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const GARAGE_INVALID = new Set(["unknown", "unavailable", "none", ""]);

class ComponentGarageDoorControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.signature = "";
    this.pendingTargetOpen = null;
    this.confirmedTargetOpen = null;
    this.confirmTimer = null;
    this.confirmationTimer = null;
    this.message = "";
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("A garage-door state entity is required");
    if (!config?.control_entity) throw new Error("A garage-door control entity is required");
    this.clearConfirmation();
    this.clearPending();
    this.message = "";
    this.config = { ...config };
    this.signature = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    this.syncPending();
    const signature = this.stateSignature();
    if (signature !== this.signature) {
      this.signature = signature;
      this.render();
    }
  }

  disconnectedCallback() {
    clearTimeout(this.confirmTimer);
    clearTimeout(this.confirmationTimer);
    this.confirmTimer = null;
    this.confirmationTimer = null;
    this.pendingTargetOpen = null;
    this.confirmedTargetOpen = null;
    this.message = "";
  }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{appearance:none;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px;border-left:2px solid transparent}.w:has(.well.open){border-left-color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)));background:var(--dashboard-warning-surface,var(--card-background-color))}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.identity{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.well{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.well.open{color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)))}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:650}.state{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.action{min-width:104px;height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--primary-color);font-size:13px;font-weight:650}.action.confirm{border-color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color));color:var(--primary-color)}.action.pending{color:var(--secondary-text-color)}button[disabled],button[aria-disabled=true]{opacity:.5;cursor:default}.feedback{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.feedback:not(:empty){margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color)}.feedback.error{color:var(--error-color)}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:340px){.row{grid-template-columns:1fr}.action{width:100%}}
    </style><ha-card><div class="w"><div class="row"><button class="identity" type="button"><span class="well"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="state" role="status" aria-live="polite"></span></span></button><button class="action" type="button"><ha-icon></ha-icon><span></span></button></div><p class="feedback" role="status" aria-live="polite"></p></div></ha-card>`;
    this.elements = {
      identity: this.shadowRoot.querySelector(".identity"),
      well: this.shadowRoot.querySelector(".well"),
      doorIcon: this.shadowRoot.querySelector(".well ha-icon"),
      name: this.shadowRoot.querySelector(".name"),
      state: this.shadowRoot.querySelector(".state"),
      action: this.shadowRoot.querySelector(".action"),
      actionIcon: this.shadowRoot.querySelector(".action ha-icon"),
      actionLabel: this.shadowRoot.querySelector(".action span"),
      feedback: this.shadowRoot.querySelector(".feedback"),
    };
    this.elements.identity.addEventListener("click", () => this.openDetails());
    this.elements.action.addEventListener("click", () => this.requestAction());
  }

  entityState(entityId) { return entityId ? this._hass?.states?.[entityId] ?? null : null; }
  isKnown(state) { return Boolean(state && !GARAGE_INVALID.has(String(state.state).toLowerCase())); }
  stateSignature() { return JSON.stringify([this.config.entity, this.config.control_entity, this.config.availability_entity].filter(Boolean).map((entityId) => { const state = this.entityState(entityId); return [entityId, state?.state, state?.attributes]; })); }

  status() {
    const state = this.entityState(this.config.entity);
    const control = this.entityState(this.config.control_entity);
    const availability = this.entityState(this.config.availability_entity);
    const unavailable = (this.config.availability_entity && (!availability || availability.state !== "on")) || !state || state.state === "unavailable" || !control || control.state === "unavailable";
    const known = this.isKnown(state) && ["on", "off"].includes(state.state);
    return { state, control, unavailable, known, open: known && state.state === "on" };
  }

  syncPending() {
    const status = this.status();
    if (this.confirmedTargetOpen !== null && (status.unavailable || !status.known || this.confirmedTargetOpen !== !status.open)) {
      this.clearConfirmation();
      this.message = status.unavailable || !status.known ? "" : "Door state changed. Review the new action.";
    }
    if (!this.pendingTargetOpen) return;
    const pending = this.pendingTargetOpen;
    if (status.known && status.open === pending.targetOpen) {
      this.clearPending();
      this.message = pending.targetOpen ? "Door opened." : "Door closed.";
    } else if (status.unavailable) {
      this.clearPending();
      this.message = "Controller disconnected before the movement was confirmed.";
    }
  }

  render() {
    const status = this.status();
    const name = this.config.title || status.state?.attributes?.friendly_name?.replace(/ Garage Door Status$/, "") || "Garage door";
    this.elements.name.textContent = name;
    this.elements.identity.setAttribute("aria-label", `Open details for ${name}`);
    this.elements.well.classList.toggle("open", status.open);
    this.elements.doorIcon.setAttribute("icon", status.unavailable || !status.known ? "mdi:garage-alert" : status.open ? "mdi:garage-open" : "mdi:garage");
    let displayState = status.unavailable ? "Controller unavailable" : status.known ? status.open ? "Open" : "Closed" : "Door state unknown";
    if (this.pendingTargetOpen) displayState = `${this.pendingTargetOpen.targetOpen ? "Opening" : "Closing"} requested`;
    this.elements.state.textContent = displayState;
    const nextOpen = status.known ? !status.open : null;
    const action = nextOpen === null ? status.unavailable ? "Unavailable" : "State unknown" : nextOpen ? "Open" : "Close";
    const disabled = status.unavailable || !status.known;
    const ariaDisabled = disabled || Boolean(this.pendingTargetOpen);
    this.elements.action.disabled = disabled;
    this.elements.action.setAttribute("aria-disabled", String(ariaDisabled));
    this.elements.action.classList.toggle("confirm", this.confirmedTargetOpen !== null);
    this.elements.action.classList.toggle("pending", Boolean(this.pendingTargetOpen));
    this.elements.actionIcon.setAttribute("icon", this.pendingTargetOpen ? "mdi:progress-clock" : this.confirmedTargetOpen !== null ? "mdi:check" : nextOpen === null ? "mdi:garage-alert" : nextOpen ? "mdi:garage-open" : "mdi:garage");
    this.elements.actionLabel.textContent = this.pendingTargetOpen ? "Waiting" : this.confirmedTargetOpen !== null ? `Confirm ${action.toLowerCase()}` : action;
    this.elements.action.setAttribute("aria-label", ariaDisabled ? displayState : this.confirmedTargetOpen !== null ? `Confirm ${action.toLowerCase()} garage door` : `${action} garage door`);
    this.elements.feedback.textContent = this.message;
    this.elements.feedback.classList.toggle("error", /did not|disconnected|failed/i.test(this.message));
  }

  async requestAction() {
    const status = this.status();
    if (status.unavailable || !status.known || this.pendingTargetOpen) return;
    const targetOpen = !status.open;
    if (this.confirmedTargetOpen === null) {
      this.confirmedTargetOpen = targetOpen;
      this.message = `Press again to ${targetOpen ? "open" : "close"} the door.`;
      clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(() => { this.clearConfirmation(); this.message = ""; this.render(); }, 5000);
      this.render();
      return;
    }
    if (this.confirmedTargetOpen !== targetOpen) {
      this.clearConfirmation();
      this.message = "Door state changed. Review the new action.";
      this.render();
      return;
    }
    this.clearConfirmation();
    this.message = "";
    this.pendingTargetOpen = { targetOpen, started: Date.now() };
    this.render();
    try {
      await this._hass.callService("button", "press", { entity_id: this.config.control_entity });
      if (!this.pendingTargetOpen) return;
      const configuredTimeout = Number(this.config.confirmation_timeout);
      const timeout = Number.isFinite(configuredTimeout) && configuredTimeout >= 5000 && configuredTimeout <= 120000 ? configuredTimeout : 30000;
      this.confirmationTimer = setTimeout(() => {
        if (!this.pendingTargetOpen) return;
        this.clearPending();
        this.message = "The door did not change within the expected time.";
        this.render();
      }, timeout);
    } catch {
      if (!this.pendingTargetOpen) return;
      this.clearPending();
      this.message = "The garage-door command failed.";
      this.render();
    }
  }

  clearPending() { clearTimeout(this.confirmationTimer); this.confirmationTimer = null; this.pendingTargetOpen = null; }
  clearConfirmation() { clearTimeout(this.confirmTimer); this.confirmTimer = null; this.confirmedTargetOpen = null; }
  openDetails() { openMoreInfo(this, this.config.entity); }
  getCardSize() { return 1; }
}

registerCard({ type: "component-garage-door-controller-v1", element: ComponentGarageDoorControllerV1, name: "Garage Door Controller", description: "A state-led garage-door controller for a reed sensor and momentary trigger." });
}

// Module: src/components/camera-controller.js
{
/** ComponentCameraControllerV1 — device-aware ONVIF camera controller. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const CAM_HD = globalThis.__homeDashboardV2;
const CAM_DOM = (id) => String(id || "").split(".")[0];
const CAM_NAME = (entity) => String(entity?.name || entity?.original_name || entity?.entity_id || "");
const CAM_BAD = new Set(["unknown", "unavailable"]);

class ComponentCameraControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.config = null;
    this._hass = null;
    this.data = null;
    this.bundleData = null;
    this.unsubscribe = null;
    this.loading = false;
    this.confirmId = null;
    this.confirmTimer = null;
    this.controlsSignature = "";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}
      ha-card{display:block;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color);overflow:hidden}
      .row{min-height:62px;padding:8px 9px 8px 10px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:20px}.activity .ico{color:var(--primary-color)}.offline .ico{color:var(--disabled-text-color,var(--secondary-text-color))}
      .identity{appearance:none;border:0;background:transparent;padding:0;min-width:0;text-align:left;cursor:pointer}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:500;line-height:1.25}.state{margin-top:3px;font-size:12px;color:var(--secondary-text-color);line-height:1.25}
      .actions{display:flex;gap:6px}.action,.close,.switchbtn,.maint{appearance:none;border:1px solid var(--divider-color);background:transparent;border-radius:var(--dashboard-radius-control,8px);cursor:pointer}.action{min-height:38px;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--secondary-text-color)}.action ha-icon{--mdc-icon-size:16px}.action:hover,.action:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}button:disabled{opacity:.4;cursor:default}
      dialog{width:min(560px,calc(100vw - 24px));max-height:min(720px,calc(100dvh - 24px));padding:0;margin:auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}
      .sheet{display:flex;flex-direction:column;max-height:min(720px,calc(100dvh - 24px))}.head{min-height:54px;padding:6px 7px 6px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.head>ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}.title{min-width:0;flex:1}.sheet-name,.sheet-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sheet-name{font-size:14px;font-weight:500}.sheet-state{margin-top:2px;font-size:11.5px;color:var(--secondary-text-color)}.close{width:40px;height:40px;border-color:transparent;display:grid;place-items:center;color:var(--secondary-text-color)}.close ha-icon{--mdc-icon-size:18px}
      .body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom));display:grid;gap:16px}.section{display:grid;gap:7px}.section[hidden]{display:none}.section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--secondary-text-color)}.section-title:after{content:'';height:1px;background:var(--divider-color);flex:1}
      .control,.detect,.maintenance{min-height:46px;padding:5px 6px 5px 10px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.copy{min-width:0}.ctl-name,.ctl-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ctl-name{font-size:12.5px}.ctl-state{margin-top:2px;font-size:11px;color:var(--secondary-text-color)}.detect.on{border-color:color-mix(in srgb,var(--primary-color) 42%,var(--divider-color))}.detect .dot{width:8px;height:8px;border-radius:50%;background:var(--divider-color)}.detect.on .dot{background:var(--primary-color)}
      .switchbtn{min-width:58px;height:34px;padding:0 9px;font-size:11px;color:var(--secondary-text-color)}.switchbtn.on{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 7%,transparent)}.maint{grid-template-columns:minmax(0,1fr) auto}.maint button{min-width:78px;height:34px;padding:0 9px}.maint button.confirm{border-color:var(--warning-color,var(--primary-color));color:var(--warning-color,var(--primary-color))}
      :is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      @media(max-width:520px){.row{grid-template-columns:34px minmax(0,1fr) auto;padding-left:8px}.actions .action span{display:none}.action{width:40px;padding:0;justify-content:center}dialog{width:100vw;max-width:100vw;height:88dvh;max-height:88dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:8px 8px 0 0}.sheet{height:88dvh;max-height:88dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}}
    </style><ha-card><div class="row"><span class="ico"><ha-icon icon="mdi:cctv"></ha-icon></span><button class="identity" type="button"><span class="name">Camera</span><span class="state">Loading…</span></button><span class="actions"><button class="action view" type="button"><ha-icon icon="mdi:eye-outline"></ha-icon><span>View</span></button><button class="action controls" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Controls</span></button></span></div></ha-card><dialog><div class="sheet"><div class="head"><ha-icon icon="mdi:cctv"></ha-icon><span class="title"><span class="sheet-name"></span><span class="sheet-state"></span></span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><section class="section detections"><div class="section-title">Detection</div><div class="detection-list"></div></section><section class="section device-controls"><div class="section-title">Camera controls</div><div class="control-list"></div></section><section class="section maintenance-section"><div class="section-title">Maintenance</div><div class="maintenance-list"></div></section></div></div></dialog>`;
    this.row = this.shadowRoot.querySelector(".row");
    this.nameEl = this.shadowRoot.querySelector(".name");
    this.stateEl = this.shadowRoot.querySelector(".state");
    this.sheetName = this.shadowRoot.querySelector(".sheet-name");
    this.sheetState = this.shadowRoot.querySelector(".sheet-state");
    this.view = this.shadowRoot.querySelector(".view");
    this.controls = this.shadowRoot.querySelector(".controls");
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.view.onclick = () => this.openCamera();
    this.identity = this.shadowRoot.querySelector(".identity");
    this.identity.onclick = () => this.openCamera();
    this.controls.onclick = () => this.openControls();
    this.shadowRoot.querySelector(".close").onclick = () => this.dialog.close();
    this.dialog.onclick = (event) => { if (event.target === this.dialog) this.dialog.close(); };
  }

  setConfig(config) { if (!config?.entity) throw new Error("Camera controller requires entity"); this.config = { ...config }; this.data = null; this.bundleData = null; this.controlsSignature = ""; this.load(); }
  set hass(hass) {
    this._hass = hass;
    this.unsubscribe || this.subscribe();
    if (this.data) {
      this.bundleData = this.bundle();
      this.render();
    } else {
      this.load();
    }
  }
  connectedCallback() { this.subscribe(); this.load(); }
  disconnectedCallback() { this.unsubscribe?.(); this.unsubscribe = null; clearTimeout(this.confirmTimer); }
  getCardSize() { return 1; }
  subscribe() {
    if (this.unsubscribe || !this._hass || !CAM_HD?.REG?.subscribe) return;
    this.unsubscribe = CAM_HD.REG.subscribe(this._hass, (data) => {
      this.data = data;
      if (!this.config) return;
      this.bundleData = this.bundle();
      this.render();
    });
  }
  async load(force = false) { if (this.loading || !this._hass || !this.config || !CAM_HD?.REG?.load) return; this.loading = true; try { this.data = this.data || await CAM_HD.REG.load(this._hass, force); this.bundleData = this.bundle(); this.render(); } finally { this.loading = false; } }
  good(id) { const state = id ? this._hass?.states?.[id] : null; return Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())); }

  bundle() {
    const all = this.data?.entities || [];
    const entry = all.find((entity) => entity.entity_id === this.config.entity);
    const deviceId = this.config.device_id || entry?.device_id;
    const siblings = (deviceId ? this.data?.byDevice?.get(deviceId) : []) || [];
    const enabled = siblings.filter((entity) => !entity.disabled_by && this._hass.states[entity.entity_id]);
    const cameras = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "camera");
    const main = cameras.find((entity) => /main.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) || cameras[0];
    const sub = cameras.find((entity) => /sub.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) || null;
    const switches = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "switch");
    const detections = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "binary_sensor" && (/^(motion|occupancy|presence|sound)$/.test(this._hass.states[entity.entity_id]?.attributes?.device_class || "") || /motion|human|person|detect/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)));
    const buttons = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "button");
    const device = this.data?.devices?.find((item) => item.id === deviceId) || {};
    const areaId = CAM_HD.areaOf(main || entry, this.data);
    const area = this.data?.areaMap?.get(areaId)?.name || "";
    const custom = String(device.name_by_user || "").trim();
    const model = String(device.model || device.name || "Camera").trim();
    const generic = !custom || /^H80$|^camera$/i.test(custom);
    const owners = all.filter((entity) => entity.platform === "onvif" && CAM_DOM(entity.entity_id) === "camera" && /main.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`) && CAM_HD.areaOf(entity, this.data) === areaId).sort((a, b) => String(a.unique_id || a.entity_id).localeCompare(String(b.unique_id || b.entity_id)));
    const index = Math.max(0, owners.findIndex((entity) => entity.device_id === deviceId));
    const name = !generic ? custom : area ? owners.length > 1 ? `${area} · Camera ${index + 1}` : area : owners.length > 1 ? `${model} · Camera ${index + 1}` : model;
    return { deviceId, name, model, main: main?.entity_id || this.config.entity, sub: sub?.entity_id || null, switches, detections, buttons };
  }

  status() {
    if (!this.bundleData) return { online: false, active: false, text: "Unavailable" };
    const online = this.good(this.bundleData.main) || this.good(this.bundleData.sub);
    const activeRows = this.bundleData.detections.filter((entity) => this._hass.states[entity.entity_id]?.state === "on");
    const active = activeRows.length > 0;
    const text = activeRows.find((entity) => /human|person/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) ? "Person detected" : active ? "Motion detected" : online ? "Online" : "Unavailable";
    return { online, active, text };
  }
  clean(entity) { return CAM_NAME(entity).replace(/^H80\s*/i, "").replace(/^(Main|Sub)Stream$/i, "Camera").trim() || "Control"; }

  render() {
    if (!this._hass || !this.bundleData) return;
    const status = this.status();
    this.nameEl.textContent = this.bundleData.name;
    this.stateEl.textContent = status.text;
    this.sheetName.textContent = this.bundleData.name;
    this.sheetState.textContent = status.text;
    this.row.classList.toggle("activity", status.active);
    this.row.classList.toggle("offline", !status.online);
    this.view.disabled = !status.online;
    const hasControls = this.bundleData.switches.length || this.bundleData.detections.length || this.bundleData.buttons.length;
    this.controls.hidden = !hasControls;
    // The sheet is populated when opened. Rebuilding it while hidden creates
    // controls and listeners for every Home Assistant state update.
    if (this.dialog.open) this.renderControls();
    else this.controlsSignature = "";
    if (this.dialog.open && !hasControls) this.dialog.close();
  }

  renderControls() {
    if (!this.bundleData) return;
    const signature = JSON.stringify([
      this.confirmId,
      ...this.bundleData.detections.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
      ...this.bundleData.switches.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
      ...this.bundleData.buttons.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
    ]);
    if (signature === this.controlsSignature) return;
    this.controlsSignature = signature;
    const detections = this.shadowRoot.querySelector(".detection-list");
    const controls = this.shadowRoot.querySelector(".control-list");
    const maintenance = this.shadowRoot.querySelector(".maintenance-list");
    detections.replaceChildren(); controls.replaceChildren(); maintenance.replaceChildren();
    for (const entity of this.bundleData.detections) {
      const state = this._hass.states[entity.entity_id], on = state?.state === "on", row = document.createElement("div");
      row.className = `detect ${on ? "on" : ""}`;
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><span class="dot"></span>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = !state || state.state === "unavailable" ? "Unavailable" : on ? "Detected" : "Clear";
      detections.append(row);
    }
    for (const entity of this.bundleData.switches) {
      const state = this._hass.states[entity.entity_id], on = state?.state === "on", usable = Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())), row = document.createElement("div");
      row.className = "control";
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><button class="switchbtn" type="button"></button>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = usable ? on ? "On" : "Off" : "Unavailable";
      const button = row.querySelector("button");
      button.textContent = on ? "On" : "Off"; button.classList.toggle("on", on); button.disabled = !usable;
      button.onclick = () => this._hass.callService("switch", "toggle", { entity_id: entity.entity_id });
      controls.append(row);
    }
    for (const entity of this.bundleData.buttons) {
      const state = this._hass.states[entity.entity_id], usable = Boolean(state && String(state.state).toLowerCase() !== "unavailable"), row = document.createElement("div");
      row.className = "maintenance";
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><button class="maint" type="button">Run</button>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = usable ? "Available" : "Unavailable";
      const button = row.querySelector("button");
      button.disabled = !usable; button.classList.toggle("confirm", this.confirmId === entity.entity_id); button.textContent = this.confirmId === entity.entity_id ? "Confirm" : "Run";
      button.onclick = () => this.press(entity.entity_id);
      maintenance.append(row);
    }
    this.shadowRoot.querySelector(".detections").hidden = !this.bundleData.detections.length;
    this.shadowRoot.querySelector(".device-controls").hidden = !this.bundleData.switches.length;
    this.shadowRoot.querySelector(".maintenance-section").hidden = !this.bundleData.buttons.length;
  }

  openControls() { if (!this.dialog || !this.bundleData) return; this.confirmId = null; this.renderControls(); if (!this.dialog.open) this.dialog.showModal(); queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus()); }
  async openCamera() {
    const hass = this._hass, bundle = this.bundleData;
    if (!hass || !bundle) return;
    const preference = await CAM_HD.prefs?.(hass, "security-dashboard.camera.viewer.v1").catch?.(() => null);
    if (hass !== this._hass || bundle !== this.bundleData) return;
    const hd = Boolean(preference?.hd);
    const entityId = hd && this.good(bundle.main) ? bundle.main : this.good(bundle.sub) ? bundle.sub : this.good(bundle.main) ? bundle.main : null;
    if (entityId) openMoreInfo(this, entityId);
  }
  press(entityId) { if (this.confirmId !== entityId) { this.confirmId = entityId; clearTimeout(this.confirmTimer); this.confirmTimer = setTimeout(() => { this.confirmId = null; if (this.dialog.open) this.renderControls(); }, 5000); this.renderControls(); return; } clearTimeout(this.confirmTimer); this.confirmId = null; this._hass.callService("button", "press", { entity_id: entityId }); this.renderControls(); }
}

registerCard({ type: "component-camera-controller-v1", element: ComponentCameraControllerV1, name: "Camera Controller V1", description: "One device-aware controller for each physical ONVIF camera." });
}

// Module: src/components/smart-collection.js
{
(()=>{
globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2;class ComponentSmartCollectionV3 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.d=null;this.split=null;this.prefs={order:[],hidden:[]};this.prefsLoaded=false;this.unsub=null;this.gen=0;this.structureSig='';this.cards=new Map;this.editor=document.createElement('dashboard-preference-editor-v3');this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.heading{display:flex;align-items:center;gap:7px;min-width:0}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.head.sep{min-height:30px;margin:2px 0 6px}.head.sep .heading{flex:1}.head.sep .heading h2{font-size:12px;font-weight:500;color:var(--secondary-text-color)}.head.sep .heading ha-icon{display:none}.head.sep .heading:after{content:'';height:1px;background:var(--divider-color);flex:1}.body{display:grid;gap:8px;min-width:0}.empty{min-height:44px;padding:8px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);color:var(--secondary-text-color);font-size:12px;display:flex;align-items:center;gap:8px}.empty ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}</style><ha-card><div class="head"><span class="heading"><ha-icon></ha-icon><h2></h2></span><button class="edit" type="button" aria-label="Edit"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="body"></div></ha-card>`;this.head=this.shadowRoot.querySelector('.head');this.body=this.shadowRoot.querySelector('.body');this.shadowRoot.append(this.editor);this.edit=this.shadowRoot.querySelector('.edit');this.edit.onclick=()=>this.openEditor()}setConfig(c){this.c={mode:'all',title:'Controls',icon:'mdi:tune-variant',pref_key:null,show_header:true,header_style:'title',editable:false,exclude_device_names:[],...c};this.head.hidden=!this.c.show_header;this.head.classList.toggle('sep',this.c.header_style==='separator');this.head.querySelector('h2').textContent=this.c.title;this.head.querySelector('.heading ha-icon').setAttribute('icon',this.c.icon);this.edit.hidden=!this.c.editable;this.structureSig='';this.loadPrefs();this.schedule()}set hass(h){this.h=h;for(const x of this.cards.values())x.el.hass=h;this.unsub||this.subscribe();if(!this.prefsLoaded)this.loadPrefs();if(!this.d||this.c?.mode==='active')this.schedule()}connectedCallback(){this.subscribe();this.schedule()}disconnectedCallback(){this.unsub?.();this.unsub=null;this.gen++}getCardSize(){return 2}subscribe(){if(this.unsub||!this.h||!HD2.REG?.subscribe)return;this.unsub=HD2.REG.subscribe(this.h,d=>{this.d=d;this.structureSig='';this.schedule()})}async loadPrefs(){if(!this.h||!this.c?.pref_key||!HD2.prefs)return;this.prefs=await HD2.prefs(this.h,this.c.pref_key);this.prefsLoaded=true;this.structureSig='';this.schedule()}candidates(){if(!this.d||!this.h)return[];const media=this.d.entities.filter(e=>HD2.uiEntry(e)&&HD2.domain(e.entity_id)==='media_player'&&this.h.states[e.entity_id]),mediaDevices=new Set(media.map(e=>e.device_id).filter(Boolean)),mediaNames=media.map(e=>HD2.stateName(this.h,e,this.h.states[e.entity_id]).trim().toLowerCase()).filter(Boolean),excluded=new Set(this.c.exclude_device_names||[]),deviceNames=new Map(this.d.devices.map(x=>[x.id,x.name_by_user||x.name||'']));return this.d.entities.filter(e=>{const s=this.h.states[e.entity_id],eligible=this.c.mode==='sound'?Boolean(e?.entity_id&&!e.disabled_by):HD2.uiEntry(e);if(!eligible||!s||excluded.has(deviceNames.get(e.device_id)))return false;const dom=HD2.domain(e.entity_id),area=HD2.areaOf(e,this.d),controlName=HD2.stateName(this.h,e,s).trim().toLowerCase();if(this.c.mode==='active'&&dom==='camera')return false;if(this.c.mode==='area')return area===this.c.area_id&&HD2.isPotential(e,s);if(this.c.mode==='media')return dom==='media_player';if(this.c.mode==='sound')return['switch','number','select'].includes(dom)&&(mediaDevices.has(e.device_id)||mediaNames.some(n=>controlName.startsWith(n+' ')));if(this.c.mode==='active'||this.c.mode==='all')return HD2.isPotential(e,s)||(this.c.mode==='active'&&dom==='binary_sensor'&&/^(door|window|smoke|moisture|gas)$/.test(s.attributes?.device_class||''));return false}).filter(e=>!this.split||!this.split.claimed?.has(e.entity_id)||this.split.systems?.has(e.entity_id))}shown(c){return this.c.mode==='active'?c.filter(e=>HD2.isActive(e,this.h.states[e.entity_id])):c}meta(e){const area=HD2.areaOf(e,this.d),a=this.d.areaMap?.get(area)?.name||'Household';return`${a} · ${HD2.label(HD2.domain(e.entity_id))}`}schedule(){if(!this.h||!this.c||!HD2.REG?.load)return;const g=++this.gen;queueMicrotask(()=>this.sync(g))}tune(card){if(card?.localName!=='component-split-controller-v4'||!card.shadowRoot||card.shadowRoot.querySelector('style[data-home-minimal]'))return;const s=document.createElement('style');s.dataset.homeMinimal='';s.textContent='.nm{font-weight:500!important}.iw{color:var(--secondary-text-color)!important}.rv{font-size:22px!important;font-weight:500!important}.tv{font-size:16px!important;font-weight:500!important}.al,.pt,.gt,.o,.tpr button,.tcu button,.tac button{font-weight:500!important}.pt{font-size:16px!important}.a ha-icon{--mdc-icon-size:17px!important}';card.shadowRoot.append(s)}async sync(g){this.d=this.d||await HD2.REG.load(this.h);if(g!==this.gen)return;const reg=globalThis.__componentSplitRegistryV4;this.split=reg?.load?await reg.load(this.h):null;if(g!==this.gen)return;const candidates=this.candidates().sort((a,b)=>HD2.stateName(this.h,a,this.h.states[a.entity_id]).localeCompare(HD2.stateName(this.h,b,this.h.states[b.entity_id]),undefined,{sensitivity:'base'})),pref=HD2.applyPrefs(candidates.map(e=>({id:e.entity_id,entry:e})),this.prefs),show=this.shown(pref.visible.map(x=>x.entry)),rows=[];for(const e of show){const cfg=HD2.controlConfig(e,this.h.states[e.entity_id],this.d,this.h,this.split);if(cfg)rows.push({e,cfg,sig:JSON.stringify(cfg)})}const sig=JSON.stringify(rows.map(x=>[x.e.entity_id,x.sig]));if(sig===this.structureSig){for(const x of this.cards.values())x.el.hass=this.h;return}this.structureSig=sig;const keep=new Set(rows.map(x=>x.e.entity_id));for(const[id,x]of[...this.cards])if(!keep.has(id)){x.el.remove();this.cards.delete(id)}if(!rows.length){if(!this.empty){this.empty=document.createElement('div');this.empty.className='empty';this.empty.innerHTML='<ha-icon></ha-icon><span></span>'}this.empty.querySelector('ha-icon').setAttribute('icon',this.c.mode==='active'?'mdi:check-circle-outline':'mdi:gesture-tap');this.empty.querySelector('span').textContent=this.c.mode==='active'?'Everything is quiet':'No controls available';if(!this.empty.isConnected)this.body.append(this.empty);return}this.empty?.remove();for(const x of rows){let rec=this.cards.get(x.e.entity_id);if(!rec||rec.sig!==x.sig){rec?.el.remove();try{const el=await HD2.card(this.h,x.cfg);if(g!==this.gen)return;this.tune(el);rec={el,sig:x.sig};this.cards.set(x.e.entity_id,rec)}catch{continue}}rec.el.hass=this.h;if(this.body.lastElementChild!==rec.el)this.body.append(rec.el)}}async openEditor(){if(!this.h||!this.c?.pref_key||!HD2.REG?.load)return;await customElements.whenDefined('dashboard-preference-editor-v3');this.d=this.d||await HD2.REG.load(this.h);const reg=globalThis.__componentSplitRegistryV4;this.split=reg?.load?await reg.load(this.h):null;const c=this.candidates().map(e=>({id:e.entity_id,name:HD2.stateName(this.h,e,this.h.states[e.entity_id]),meta:this.meta(e),icon:HD2.icon(e,this.h.states[e.entity_id])})),p=HD2.applyPrefs(c,this.prefs);this.editor.open({title:`Edit ${this.c.title.toLowerCase()}`,description:'Reorder discovered controls or hide controls you do not want shown.',items:p.all,hidden:[...p.hidden],onSave:async v=>{this.prefs=v;await HD2.savePrefs(this.h,this.c.pref_key,v);this.structureSig='';this.schedule()}})}}if(!customElements.get('component-smart-collection-v3'))customElements.define('component-smart-collection-v3',ComponentSmartCollectionV3);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-smart-collection-v3'))window.customCards.push({type:'component-smart-collection-v3',name:'Smart Control Collection V3',description:'Stable registry-driven household controls without refresh teardown.'});
})();
}

// Module: src/components/household-directory.js
{
(()=>{
globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2;class ComponentHouseholdDirectoryV3 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.d=null;this.prefs={order:[],hidden:[]};this.prefsLoaded=false;this.unsub=null;this.gen=0;this.cards=new Map;this.structureSig='';this.editor=document.createElement('dashboard-preference-editor-v3');this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.heading{display:flex;align-items:center;gap:7px}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}</style><ha-card><div class="head"><span class="heading"><ha-icon icon="mdi:home-heart"></ha-icon><h2>Household</h2></span><button class="edit" type="button" aria-label="Edit household"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div></ha-card>`;this.grid=this.shadowRoot.querySelector('.grid');this.shadowRoot.append(this.editor);this.shadowRoot.querySelector('.edit').onclick=()=>this.openEditor()}setConfig(c){this.c={pref_key:'home-control.household.v2',base_path:'/home-control',current_dashboard:'home-control',...c};this.loadPrefs();this.schedule()}set hass(h){this.h=h;for(const x of this.cards.values())x.hass=h;this.unsub||this.subscribe();if(!this.prefsLoaded)this.loadPrefs();if(!this.d)this.schedule()}connectedCallback(){this.subscribe();this.schedule()}disconnectedCallback(){this.unsub?.();this.unsub=null;this.gen++}getCardSize(){return 2}subscribe(){if(this.unsub||!this.h||!HD2.REG?.subscribe)return;this.unsub=HD2.REG.subscribe(this.h,d=>{this.d=d;this.structureSig='';this.schedule()})}async loadPrefs(){if(!this.h||!this.c?.pref_key||!HD2.prefs)return;this.prefs=await HD2.prefs(this.h,this.c.pref_key);this.prefsLoaded=true;this.structureSig='';this.schedule()}items(){if(!this.d||!this.h)return[];const out=[],hasMedia=this.d.entities.some(e=>HD2.uiEntry(e)&&HD2.domain(e.entity_id)==='media_player'&&this.h.states[e.entity_id]),hasControls=this.d.entities.some(e=>HD2.uiEntry(e)&&HD2.controlDomains.has(HD2.domain(e.entity_id))&&this.h.states[e.entity_id]);if(hasMedia)out.push({id:'view:media',name:'Media',icon:'mdi:speaker-multiple',kind:'nav',path:`${this.c.base_path}/media`,meta:'Dashboard view'});if(hasControls)out.push({id:'view:all-controls',name:'Controls',icon:'mdi:tune-variant',kind:'nav',path:`${this.c.base_path}/all-controls`,meta:'Dashboard view'});for(const d of this.d.dashboards||[]){const path=d.url_path;if(!path||path===this.c.current_dashboard||path==='home-control-fix'||d.require_admin===true||d.show_in_sidebar===false)continue;out.push({id:`dashboard:${path}`,name:d.title||HD2.label(path),icon:d.icon||'mdi:view-dashboard-outline',kind:'nav',path:`/${path}`,meta:'Dashboard'})}for(const e of this.d.entities.filter(e=>HD2.uiEntry(e)&&HD2.domain(e.entity_id)==='todo'&&this.h.states[e.entity_id]))out.push({id:`entity:${e.entity_id}`,name:HD2.stateName(this.h,e,this.h.states[e.entity_id]).replace(/ List$/i,''),icon:'mdi:cart-outline',kind:'entity',entity:e.entity_id,meta:'List'});const seen=new Set;return out.filter(x=>!seen.has(x.id)&&seen.add(x.id))}schedule(){if(!this.h||!this.c||!HD2.REG?.load)return;const g=++this.gen;queueMicrotask(()=>this.sync(g))}async sync(g){this.d=this.d||await HD2.REG.load(this.h);if(g!==this.gen)return;const p=HD2.applyPrefs(this.items(),this.prefs),sig=JSON.stringify(p.visible.map(x=>[x.id,x.name,x.icon,x.path,x.entity]));if(sig===this.structureSig){for(const x of this.cards.values())x.hass=this.h;return}this.structureSig=sig;const keep=new Set(p.visible.map(x=>x.id));for(const[id,el]of[...this.cards])if(!keep.has(id)){el.remove();this.cards.delete(id)}for(const x of p.visible){let el=this.cards.get(x.id);if(!el){const cfg=x.kind==='entity'?{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:x.entity,name:x.name,icon:x.icon,show_state:true,button_action:{tap_action:{action:'more-info'}},scrolling_effect:false}:{type:'custom:bubble-card',card_type:'button',button_type:'name',name:x.name,icon:x.icon,show_icon:true,button_action:{tap_action:{action:'navigate',navigation_path:x.path}},scrolling_effect:false};try{el=await HD2.card(this.h,cfg);if(g!==this.gen)return;this.cards.set(x.id,el)}catch{continue}}el.hass=this.h;if(this.grid.lastElementChild!==el)this.grid.append(el)}}async openEditor(){if(!this.h||!HD2.REG?.load)return;await customElements.whenDefined('dashboard-preference-editor-v3');this.d=this.d||await HD2.REG.load(this.h);const p=HD2.applyPrefs(this.items(),this.prefs);this.editor.open({title:'Edit household',description:'Reorder or hide discovered destinations without changing the underlying dashboard or entity.',items:p.all,hidden:[...p.hidden],onSave:async v=>{this.prefs=v;await HD2.savePrefs(this.h,this.c.pref_key,v);this.structureSig='';this.schedule()}})}}if(!customElements.get('component-household-directory-v3'))customElements.define('component-household-directory-v3',ComponentHouseholdDirectoryV3);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-household-directory-v3'))window.customCards.push({type:'component-household-directory-v3',name:'Household Directory V3',description:'Stable auto-discovered household destinations.'});
})();
}

// Module: src/components/favourites-minimal.js
{
class ComponentFavouritesMinimalV1 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.child=null;this.ready=false}setConfig(c){this.c=c;this.ensure()}set hass(h){this.h=h;if(this.child)this.child.hass=h;else this.ensure()}connectedCallback(){this.ensure()}getCardSize(){return 2}async ensure(){if(this.ready||!this.c)return;this.ready=true;await customElements.whenDefined('component-favourites-v3');const x=document.createElement('component-favourites-v3');x.setConfig(this.c);if(this.h)x.hass=this.h;this.child=x;this.shadowRoot.replaceChildren(x);queueMicrotask(()=>this.tune())}tune(){const r=this.child?.shadowRoot;if(!r)return;r.querySelector('.edit ha-icon')?.setAttribute('icon','mdi:dots-horizontal');if(r.querySelector('style[data-home-minimal]'))return;const s=document.createElement('style');s.dataset.homeMinimal='';s.textContent='.heading h2{font-size:15px!important;font-weight:500!important}.heading ha-icon{color:var(--secondary-text-color)!important;--mdc-icon-size:17px!important}.edit{min-width:44px!important;min-height:44px!important;padding:0!important;color:var(--secondary-text-color)!important;font-weight:400!important}.edit ha-icon{--mdc-icon-size:16px!important}.edit span{display:none!important}.icon{color:var(--secondary-text-color)!important}.name{font-weight:500!important}.state{font-size:12px!important}.dialog-title,.confirm-title{font-size:16px!important;font-weight:500!important}.subheading,.group-title,.choice-name,.dialog-button{font-weight:500!important}.selected-meta,.choice-meta,.editor-copy{font-size:12px!important}';r.append(s)}}if(!customElements.get('component-favourites-minimal-v1'))customElements.define('component-favourites-minimal-v1',ComponentFavouritesMinimalV1);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-favourites-minimal-v1'))window.customCards.push({type:'component-favourites-minimal-v1',name:'Favourites Minimal',description:'Existing favourites behaviour with restrained Home typography.'});
}

// Module: src/components/room-directory.js
{
(()=>{
globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2;class ComponentRoomDirectoryV4 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.d=null;this.prefs={order:[],hidden:[]};this.prefsLoaded=false;this.unsub=null;this.currentAreaId=null;this.controlCard=null;this.tiles=new Map;this.editor=document.createElement('dashboard-preference-editor-v3');this._location=()=>this.syncHash();this._touch=null;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}button{font:inherit;color:inherit}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.open-view{appearance:none;border:0;background:transparent;display:flex;align-items:center;gap:7px;min-height:38px;padding:0;cursor:pointer}.open-view ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.open-view h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit,.room-edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon,.room-edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible,.room-edit:hover,.room-edit:focus-visible,.open-view:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.group{grid-column:1/-1;min-height:28px;padding:3px 2px 1px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:12px;font-weight:500}.group:after{content:'';height:1px;background:var(--divider-color);flex:1}.room{appearance:none;min-width:0;min-height:56px;padding:0 12px 0 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));text-align:left;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.room:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.room:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:19px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}.room.active .ico{color:color-mix(in srgb,var(--primary-color) 55%,var(--secondary-text-color))}.room.warning{border-left-color:var(--warning-color,#f9a825)}.room.warning .ico{color:var(--warning-color,#f9a825)}.room.critical{border-left-color:var(--error-color)}.room.critical .ico{color:var(--error-color)}dialog{width:min(720px,calc(100vw - 24px));height:min(760px,calc(100dvh - 32px));min-height:min(560px,calc(100dvh - 32px));margin:auto;padding:0;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}.sheet{height:100%;display:flex;flex-direction:column;will-change:transform;transition:transform .18s ease}.sheet.dragging{transition:none}.sheet-head{flex:0 0 auto;min-height:54px;padding:5px 6px 5px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--divider-color);touch-action:pan-y}.identity{min-width:0;display:flex;align-items:center;gap:8px}.identity ha-icon{color:var(--secondary-text-color);--mdc-icon-size:18px}.sheet-name{font-size:14px;line-height:1.2;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.environment{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0;color:var(--secondary-text-color)}.metric{appearance:none;border:0;background:transparent;min-height:32px;padding:0;display:flex;align-items:center;gap:3px;white-space:nowrap;cursor:pointer;color:inherit;font-size:12px}.metric ha-icon{--mdc-icon-size:15px;color:var(--secondary-text-color)}.dot{font-size:11px;color:var(--disabled-text-color,var(--secondary-text-color))}.close{appearance:none;width:40px;height:40px;padding:0;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer;flex:0 0 auto}.close ha-icon{--mdc-icon-size:18px}.sheet-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:10px 14px max(14px,env(safe-area-inset-bottom));touch-action:pan-y}@media(max-width:700px){dialog{width:100vw;max-width:100vw;height:92dvh;min-height:92dvh;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:var(--dashboard-radius-dialog,8px) var(--dashboard-radius-dialog,8px) 0 0}.sheet-head{padding-left:12px}.sheet-body{padding:8px 12px max(18px,env(safe-area-inset-bottom))}}@media(max-width:520px){.identity ha-icon{display:none}.sheet-head{gap:5px}.environment{gap:4px}.metric{font-size:11.5px}.room-edit,.close{width:38px;height:40px}}</style><ha-card><div class="head"><button class="open-view" type="button"><ha-icon></ha-icon><h2></h2></button><button class="edit" type="button" aria-label="Edit rooms"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div></ha-card><dialog><div class="sheet"><div class="sheet-head"><span class="identity"><ha-icon class="sheet-icon"></ha-icon><span class="sheet-name"></span></span><span class="environment"></span><button class="room-edit" type="button" aria-label="Edit room controls"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button><button class="close" type="button" aria-label="Close room"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="sheet-body"></div></div></dialog>`;this.grid=this.shadowRoot.querySelector('.grid');this.dialog=this.shadowRoot.querySelector('dialog');this.sheet=this.shadowRoot.querySelector('.sheet');this.sheetBody=this.shadowRoot.querySelector('.sheet-body');this.environment=this.shadowRoot.querySelector('.environment');this.shadowRoot.append(this.editor);this.shadowRoot.querySelector('.edit').onclick=()=>this.openEditor();this.shadowRoot.querySelector('.open-view').onclick=()=>this.openView();this.shadowRoot.querySelector('.room-edit').onclick=()=>this.controlCard?.openEditor?.();this.shadowRoot.querySelector('.close').onclick=()=>this.closeRoom();this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.closeRoom()});this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.closeRoom()});this.bindSwipe()}setConfig(c){this.c={title:'Rooms',icon:'mdi:floor-plan',mode:'home',pref_key:'home-control.rooms.v2',navigation_path:null,base_path:'/home-control',...c};this.shadowRoot.querySelector('h2').textContent=this.c.title;this.shadowRoot.querySelector('.open-view ha-icon').setAttribute('icon',this.c.icon);this.shadowRoot.querySelector('.open-view').disabled=!this.c.navigation_path;this.loadPrefs();this.rebuild()}set hass(h){this.h=h;if(this.controlCard)this.controlCard.hass=h;this.unsub||this.subscribe();if(!this.prefsLoaded)this.loadPrefs();this.refreshTiles();this.refreshOpenRoom()}connectedCallback(){this.subscribe();window.addEventListener('hashchange',this._location);window.addEventListener('location-changed',this._location);this.rebuild();this.syncHash()}disconnectedCallback(){this.unsub?.();this.unsub=null;window.removeEventListener('hashchange',this._location);window.removeEventListener('location-changed',this._location)}getCardSize(){return 4}subscribe(){if(this.unsub||!this.h||!HD2.REG?.subscribe)return;this.unsub=HD2.REG.subscribe(this.h,d=>{this.d=d;this.rebuild();this.syncHash()})}async loadPrefs(){if(!this.h||!this.c?.pref_key||!HD2.prefs)return;this.prefs=await HD2.prefs(this.h,this.c.pref_key);this.prefsLoaded=true;this.rebuild()}openView(){if(!this.c.navigation_path)return;history.pushState(null,'',this.c.navigation_path);window.dispatchEvent(new Event('location-changed'))}entries(areaId){if(!this.d||!this.h)return[];return this.d.entities.filter(e=>HD2.uiEntry(e)&&HD2.areaOf(e,this.d)===areaId).map(e=>({e,s:this.h.states[e.entity_id]})).filter(x=>x.s)}air(x){const id=`${x.e.entity_id} ${x.s.attributes?.friendly_name||''}`.toLowerCase();return id.includes('air_quality')||id.includes('air quality')||id.includes('air_monitor')||id.includes('air monitor')}metric(items,cls,monitor=false){const blocked=/(_controller_temperature|_outside_air_temperature|cpu_temperature|processor_temperature|board_temperature|chip_temperature|internal_temperature)$/;return items.find(x=>HD2.domain(x.e.entity_id)==='sensor'&&x.s.attributes?.device_class===cls&&HD2.validState(x.s)&&Number.isFinite(Number.parseFloat(x.s.state))&&!(cls==='temperature'&&blocked.test(x.e.entity_id))&&(!monitor||this.air(x)))||null}fmt(s){try{return this.h.formatEntityState(s)}catch{return String(s?.state||'')}}status(area){const x=this.entries(area.area_id).filter(y=>HD2.validState(y.s)),mt=this.metric(x,'temperature',true),mh=this.metric(x,'humidity',true),cl=x.find(y=>HD2.domain(y.e.entity_id)==='climate'&&Number.isFinite(Number.parseFloat(y.s.attributes?.current_temperature))),ft=this.metric(x,'temperature'),fh=this.metric(x,'humidity');let temp='';if(mt)temp=this.fmt(mt.s);else if(cl){const n=Number.parseFloat(cl.s.attributes.current_temperature),u=cl.s.attributes.temperature_unit||this.h.config?.unit_system?.temperature||'°C';temp=n.toLocaleString(this.h.locale?.language||undefined,{maximumFractionDigits:1})+' '+u}else if(ft)temp=this.fmt(ft.s);const hum=mh||fh,lights=x.filter(y=>HD2.domain(y.e.entity_id)==='light'&&y.s.state==='on').length,critical=x.some(y=>HD2.domain(y.e.entity_id)==='binary_sensor'&&y.s.state==='on'&&/^(smoke|moisture|gas)$/.test(y.s.attributes?.device_class||'')),warning=x.some(y=>(HD2.domain(y.e.entity_id)==='binary_sensor'&&y.s.state==='on'&&y.s.attributes?.device_class==='garage_door')||(HD2.domain(y.e.entity_id)==='cover'&&/^(open|opening)$/.test(y.s.state)&&y.s.attributes?.device_class==='garage')),active=lights>0||x.some(y=>(HD2.domain(y.e.entity_id)==='climate'&&/^(heating|cooling|drying|fan)$/.test(y.s.attributes?.hvac_action||''))||(HD2.domain(y.e.entity_id)==='media_player'&&y.s.state==='playing'));const p=[];if(critical)p.push('Attention required');else if(warning)p.push('Garage open');if(temp)p.push(temp);if(hum)p.push(this.fmt(hum.s));if(lights)p.push(`${lights} light${lights===1?'':'s'} on`);return{summary:p.slice(0,3).join(' · '),severity:critical?'critical':warning?'warning':active?'active':'',tempState:mt?.s||cl?.s||ft?.s||null,humState:hum?.s||null}}isOutdoor(a){return/(yard|garage|garden|patio|deck|outdoor|shed|carport)/i.test(`${a.area_id} ${a.name}`)}async rebuild(){if(!this.h||!this.c||!HD2.REG?.load)return;this.d=this.d||await HD2.REG.load(this.h);if(!this.d)return;const areas=this.d.areas.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),undefined,{sensitivity:'base'})),visible=HD2.applyPrefs(areas.map(a=>({id:a.area_id,area:a})),this.prefs).visible.map(x=>x.area);this.grid.replaceChildren();const add=(title,list)=>{if(this.c.mode==='full'){const g=document.createElement('div');g.className='group';g.textContent=title;this.grid.append(g)}for(const a of list){let b=this.tiles.get(a.area_id);if(!b){b=this.makeTile(a);this.tiles.set(a.area_id,b)}this.updateTile(b,a);this.grid.append(b)}};if(this.c.mode==='full'){add('Indoor',visible.filter(a=>!this.isOutdoor(a)));add('Outdoor & utility',visible.filter(a=>this.isOutdoor(a)))}else add('',visible);const keep=new Set(visible.map(a=>a.area_id));for(const[id,b]of[...this.tiles])if(!keep.has(id)){b.remove();this.tiles.delete(id)}}makeTile(a){const b=document.createElement('button');b.type='button';b.className='room';b.innerHTML='<span class="ico"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="summary"></span></span>';b.onclick=()=>{const x=this.d?.areaMap?.get(a.area_id)||a;this.openRoom(x,true)};return b}updateTile(b,a){if(!this.h)return;const st=this.status(a);b.className=`room ${st.severity}`;b.setAttribute('aria-label',`Open ${a.name}${st.summary?'. '+st.summary:''}`);b.querySelector('ha-icon').setAttribute('icon',a.icon||'mdi:home-outline');b.querySelector('.name').textContent=a.name;const s=b.querySelector('.summary');s.textContent=st.summary||'';s.hidden=!st.summary}refreshTiles(){if(!this.d||!this.h)return;for(const[id,b]of this.tiles){const a=this.d.areaMap?.get(id);if(a)this.updateTile(b,a)}}areaFromHash(){const slug=location.hash.replace(/^#/,'');if(!slug||!this.d)return null;return this.d.areas.find(a=>a.area_id.replaceAll('_','-')===slug)||null}syncHash(){if(!this.d||!this.h)return;const a=this.areaFromHash();if(a){if(this.currentAreaId!==a.area_id||!this.dialog.open)this.openRoom(a,false)}else if(this.dialog.open)this.closeRoom(false)}async openRoom(a,writeHash=true){if(!a||!this.h)return;this.currentAreaId=a.area_id;if(writeHash){const hash='#'+a.area_id.replaceAll('_','-');if(location.hash!==hash){history.pushState(null,'',location.pathname+location.search+hash);window.dispatchEvent(new Event('location-changed'))}}this.renderSheetHeader(a);await customElements.whenDefined('component-smart-collection-v3');this.sheetBody.replaceChildren();const controls=document.createElement('component-smart-collection-v3');controls.setConfig({mode:'area',area_id:a.area_id,title:'Controls',icon:'mdi:gesture-tap-button',header_style:'separator',editable:false,pref_key:`home-control.area.${a.area_id}.v2`});controls.hass=this.h;this.controlCard=controls;this.sheetBody.append(controls);if(!this.dialog.open)this.dialog.showModal();this.sheetBody.scrollTop=0;this.sheet.style.transform='';queueMicrotask(()=>this.shadowRoot.querySelector('.close')?.focus())}refreshOpenRoom(){const a=this.d?.areaMap?.get(this.currentAreaId);if(a&&this.dialog.open)this.renderSheetHeader(a)}renderSheetHeader(a){const st=this.status(a);this.shadowRoot.querySelector('.sheet-icon').setAttribute('icon',a.icon||'mdi:home-outline');this.shadowRoot.querySelector('.sheet-name').textContent=a.name;this.environment.replaceChildren();const add=(s,icon,label)=>{if(!s)return;if(this.environment.childElementCount){const dot=document.createElement('span');dot.className='dot';dot.textContent='•';this.environment.append(dot)}const b=document.createElement('button');b.type='button';b.className='metric';b.innerHTML=`<ha-icon icon="${icon}"></ha-icon><span></span>`;b.querySelector('span').textContent=label;b.onclick=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:s.entity_id}}));this.environment.append(b)};add(st.tempState,'mdi:thermometer',st.tempState?this.tempText(st.tempState):'');add(st.humState,'mdi:water-percent',st.humState?this.fmt(st.humState):'')}tempText(s){if(HD2.domain(s.entity_id)==='climate'){const n=Number.parseFloat(s.attributes?.current_temperature);if(Number.isFinite(n)){const u=s.attributes?.temperature_unit||this.h.config?.unit_system?.temperature||'°C';return n.toLocaleString(this.h.locale?.language||undefined,{maximumFractionDigits:1})+' '+u}}return this.fmt(s)}closeRoom(clearHash=true){if(this.dialog.open)this.dialog.close();this.currentAreaId=null;this.controlCard=null;this.sheetBody.replaceChildren();this.sheet.style.transform='';if(clearHash&&location.hash){history.replaceState(null,'',location.pathname+location.search);window.dispatchEvent(new Event('location-changed'))}}bindSwipe(){const interactive=e=>e.composedPath().some(n=>n?.matches?.('button,input,select,textarea,[role="slider"],a'));const start=e=>{if(e.touches?.length!==1||interactive(e))return;const fromHeader=e.composedPath().some(n=>n?.classList?.contains('sheet-head'));if(!fromHeader&&this.sheetBody.scrollTop>0)return;const t=e.touches[0];this._touch={x:t.clientX,y:t.clientY,dy:0,fromHeader};this.sheet.classList.add('dragging')},move=e=>{if(!this._touch||e.touches?.length!==1)return;if(!this._touch.fromHeader&&this.sheetBody.scrollTop>0){this.cancelSwipe();return}const t=e.touches[0],dy=t.clientY-this._touch.y,dx=t.clientX-this._touch.x;if(dy<=0||Math.abs(dx)>dy){this.sheet.style.transform='';return}this._touch.dy=dy;this.sheet.style.transform=`translateY(${Math.min(dy,240)}px)`;if(dy>8)e.preventDefault()},end=()=>{if(!this._touch)return;const close=this._touch.dy>96;this.cancelSwipe();if(close)this.closeRoom()};this.sheet.addEventListener('touchstart',start,{passive:true});this.sheet.addEventListener('touchmove',move,{passive:false});this.sheet.addEventListener('touchend',end,{passive:true});this.sheet.addEventListener('touchcancel',end,{passive:true})}cancelSwipe(){this._touch=null;this.sheet.classList.remove('dragging');this.sheet.style.transform=''}async openEditor(){if(!this.h||!HD2.REG?.load)return;await customElements.whenDefined('dashboard-preference-editor-v3');this.d=this.d||await HD2.REG.load(this.h);const areas=this.d.areas.map(a=>({id:a.area_id,name:a.name,meta:this.isOutdoor(a)?'Outdoor & utility':'Indoor',icon:a.icon||'mdi:home-outline'})),p=HD2.applyPrefs(areas,this.prefs);this.editor.open({title:'Edit rooms',description:'Rooms are discovered from Home Assistant Areas. Reorder them or hide rooms without changing the Area itself.',items:p.all,hidden:[...p.hidden],onSave:async v=>{this.prefs=v;await HD2.savePrefs(this.h,this.c.pref_key,v);this.rebuild()}})}}if(!customElements.get('component-room-directory-v4'))customElements.define('component-room-directory-v4',ComponentRoomDirectoryV4);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-room-directory-v4'))window.customCards.push({type:'component-room-directory-v4',name:'Room Directory V4',description:'Stable registry-driven rooms with full-height swipeable room sheets.'});
})();
}

// Module: src/components/home-overview.js
{
class ComponentHomeOverviewV4 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this._children=new Map;this.built=false;this.building=false;this.timer=null;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.top{min-height:32px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}.time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}.weather{appearance:none;border:0;min-height:32px;padding:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer}.weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}.sections{margin-top:8px}.section+.section{margin-top:16px}@media(max-width:520px){.time{font-size:13px}.weather{font-size:12px}}@media(max-width:350px){.time{font-size:12px}.weather{font-size:11px}}</style><ha-card><div class="top"><span class="time"></span><button class="weather" type="button"></button></div><div class="sections"></div></ha-card>`;this.sections=this.shadowRoot.querySelector('.sections');this.shadowRoot.querySelector('.weather').onclick=()=>this.moreWeather()}setConfig(c){this.c={weather_entity:'weather.forecast_home',base_path:'/home-control',current_dashboard:'home-control',favourites_helpers:['input_text.dashboard_favourite_1','input_text.dashboard_favourite_2','input_text.dashboard_favourite_3','input_text.dashboard_favourite_4'],...c};this.renderHeader();this.ensure();this.tick()}set hass(h){this.h=h;for(const x of this._children.values())x.hass=h;this.renderHeader();if(!this.built)this.ensure()}connectedCallback(){this.tick();this.ensure()}disconnectedCallback(){clearTimeout(this.timer)}getCardSize(){return 12}tick(){clearTimeout(this.timer);this.renderHeader();this.timer=setTimeout(()=>this.tick(),60000-Date.now()%60000+100)}renderHeader(){if(!this.c)return;const now=new Date(),zone=this.h?.config?.time_zone,loc=this.h?.locale?.language||navigator.language||'en-AU',locale=loc==='en'?'en-AU':loc;this.shadowRoot.querySelector('.time').textContent=new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',timeZone:zone}).format(now);const s=this.h?.states?.[this.c.weather_entity],a=s?.attributes||{},n=v=>Number.isFinite(Number(v))?new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(Number(v)):'—',temp=n(a.temperature)+(a.temperature_unit||'°C'),cloud=Number.isFinite(Number(a.cloud_coverage))?`Cloud ${Math.round(Number(a.cloud_coverage))}%`:'Cloud —',w=this.shadowRoot.querySelector('.weather');w.textContent=`${temp} · ${cloud}`;w.setAttribute('aria-label',`Outside ${temp}, ${cloud}. Open weather details.`)}moreWeather(){if(this.c?.weather_entity)this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:this.c.weather_entity}}))}async ensure(){if(this.built||this.building||!this.c||!this.h)return;this.building=true;await Promise.all(['component-favourites-minimal-v1','component-smart-collection-v3','component-room-directory-v4','component-household-directory-v3'].map(x=>customElements.whenDefined(x)));if(!this.isConnected){this.building=false;return}const defs=[['favourites',()=>{const x=document.createElement('component-favourites-minimal-v1');x.setConfig({helpers:this.c.favourites_helpers,max:4,title:'Favourites'});return x}],['active',()=>{const x=document.createElement('component-smart-collection-v3');x.setConfig({mode:'active',title:'Active now',icon:'mdi:motion-play-outline',editable:false,pref_key:null});return x}],['rooms',()=>{const x=document.createElement('component-room-directory-v4');x.setConfig({mode:'home',title:'Rooms',icon:'mdi:floor-plan',pref_key:'home-control.rooms.v2',base_path:this.c.base_path,navigation_path:`${this.c.base_path}/rooms`});return x}],['household',()=>{const x=document.createElement('component-household-directory-v3');x.setConfig({pref_key:'home-control.household.v2',base_path:this.c.base_path,current_dashboard:this.c.current_dashboard});return x}]];for(const[id,make]of defs){const x=make();x.classList.add('section');x.hass=this.h;this._children.set(id,x);this.sections.append(x)}this.built=true;this.building=false}}if(!customElements.get('component-home-overview-v4'))customElements.define('component-home-overview-v4',ComponentHomeOverviewV4);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-home-overview-v4'))window.customCards.push({type:'component-home-overview-v4',name:'Home Overview V4',description:'Stable minimal Home overview without state-refresh teardown.'});
}

// Module: src/components/solar-daylight-card.js
{
/** SolarDaylightCardV7 — reusable Solar dashboard daylight context card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class SolarDaylightCardV7 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._forecast=[];this._lastFetch=0;this._pending=false;this._updateSignature=''}
  setConfig(c){const weather=(c||{}).weather_entity||'weather.forecast_home';this.c=c||{};this.sun=this.c.sun_entity||'sun.sun';if(weather!==this.weather){this._forecast=[];this._lastFetch=0}this.weather=weather;this._updateSignature=''}
  set hass(h){this.h=h;if(!this._built)this._build();this._update();this._fetch()}
  getCardSize(){return 1}
  _build(){
    this._built=true;
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden}
button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.clouds{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.cloud-item{display:flex;align-items:baseline;gap:4px}.cloud-label{font-weight:500}.cloud-value{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.clouds{gap:10px}.cloud-item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.clouds{gap:7px}}
</style><ha-card><button type="button"><span class="phase"></span><span class="clouds"><span class="cloud-item"><span class="cloud-label">Cloud Coverage</span><span class="cloud-value now">—</span></span><span class="cloud-item"><span class="cloud-label">+4 Hours</span><span class="cloud-value plus4">—</span></span><span class="cloud-item"><span class="cloud-label">+8 Hours</span><span class="cloud-value plus8">—</span></span></span><span class="event"></span></button></ha-card>`;
    this.b=this.shadowRoot.querySelector('button');this.p=this.shadowRoot.querySelector('.phase');this.ev=this.shadowRoot.querySelector('.event');this.nowEl=this.shadowRoot.querySelector('.now');this.p4=this.shadowRoot.querySelector('.plus4');this.p8=this.shadowRoot.querySelector('.plus8');this.b.onclick=()=>this._more()
  }
  _more(){openMoreInfo(this,this.sun)}
  _num(v,f=null){if(v===null||v===undefined||v==='')return f;const n=Number(v);return Number.isFinite(n)?n:f}
  _time(v){if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
  _cloud(v){const n=this._num(v);return n===null?'—':`${Math.round(Math.min(100,Math.max(0,n)))}%`}
  _at(hours){if(!this._forecast.length)return null;const target=Date.now()+hours*3600000;let best=null,dist=Infinity;for(const x of this._forecast){const t=new Date(x.datetime||0).getTime(),v=this._num(x.cloud_coverage);if(!Number.isFinite(t)||v===null)continue;const d=Math.abs(t-target);if(d<dist){dist=d;best=v}}return dist<=90*60000?best:null}
  _forecastPayload(r){return r?.response?.[this.weather]||r?.service_response?.[this.weather]||r?.[this.weather]||r?.response?.service_response?.[this.weather]||null}
  _update(){
    if(!this.h||!this.b)return;
    const s=this.h.states[this.sun],w=this.h.states[this.weather],valid=s&&['above_horizon','below_horizon'].includes(s.state);
    let phase,event;
    if(!valid){phase='Sun state unavailable';event=''}else if(s.state==='above_horizon'){const elevation=this._num(s.attributes?.elevation,0),sunset=this._time(s.attributes?.next_setting);phase=`Sun ${Math.round(elevation)}°`;event=sunset?`Sunset ${sunset}`:'Daylight'}else{const sunrise=this._time(s.attributes?.next_rising);phase='Night';event=sunrise?`Sunrise ${sunrise}`:'Before sunrise'}
    const now=this._num(w?.attributes?.cloud_coverage),c4=this._at(4),c8=this._at(8);
    const nowText=this._cloud(now),plus4=this._cloud(c4),plus8=this._cloud(c8),signature=JSON.stringify([phase,event,nowText,plus4,plus8]);
    if(signature===this._updateSignature)return;this._updateSignature=signature;
    this.p.textContent=phase;this.ev.textContent=event;this.nowEl.textContent=nowText;this.p4.textContent=plus4;this.p8.textContent=plus8;
    this.b.setAttribute('aria-label',`${phase}, cloud coverage ${nowText}, plus 4 hours ${plus4}, plus 8 hours ${plus8}, ${event}. Open sun details.`)
  }
  async _fetch(){
    if(!this.h||this._pending)return;const now=Date.now();if(this._lastFetch&&now-this._lastFetch<30*60*1000)return;this._lastFetch=now;this._pending=true;
    const weather=this.weather;
    try{
      const r=await this.h.callWS({type:'call_service',domain:'weather',service:'get_forecasts',service_data:{type:'hourly'},target:{entity_id:this.weather},return_response:true});
      const x=this._forecastPayload(r);
      if(weather===this.weather)this._forecast=Array.isArray(x?.forecast)?x.forecast.slice(0,24):[]
    }catch(_){if(weather===this.weather)this._forecast=[]}
    this._pending=false;
    if(weather===this.weather)this._update();else this._fetch()
  }
}
registerCard({ type: "solar-daylight-card-v7", element: SolarDaylightCardV7, name: "Solar Daylight Context", description: "Full-width sun context with centred current and forecast cloud coverage." });
}

// Module: src/components/energy-history-card.js
{
/** EnergyHistoryCardV3 — reusable Solar dashboard history card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class EnergyHistoryCardV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._series={};this._loading=false;this._lastEnd=0;this._resizeObserver=null;this._resizeTimer=null;this._selectedDay=null;this._dayListener=e=>this._onDayChange(e)}
  setConfig(c){
    const next={house_entity:'sensor.house_consumption_power',solar_entity:'sensor.total_solar_power',grid_entity:'sensor.refoss_smart_energy_monitor_em_channel_3_power',hours:24,bucket_minutes:10,calendar_day:false,day_channel:null,...(c||{})};
    const changed=this.c&&['house_entity','solar_entity','grid_entity','bucket_minutes','hours','calendar_day'].some(key=>this.c[key]!==next[key]);
    this.c=next;
    if(changed){
      this._lastRangeKey=null;this._series={};
      if(this._built&&this.h){this.e.status.hidden=false;this.e.status.textContent='Loading history…';this._hideTip();this._scheduleFetch()}
    }
  }
  set hass(h){this.h=h;if(!this._built)this._build();this._scheduleFetch()}
  connectedCallback(){window.addEventListener('energy-day-selector-change',this._dayListener)}
  disconnectedCallback(){window.removeEventListener('energy-day-selector-change',this._dayListener);this._resizeObserver?.disconnect();clearTimeout(this._resizeTimer)}
  getCardSize(){return 7}
  _build(){
    this._built=true;
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:4px 5px 5px}.top{min-height:28px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 5px;margin:0}.meta{font-size:13px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.legend{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}.legend button{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:12px;font-weight:600;padding:3px 0;display:flex;align-items:center;gap:6px;cursor:pointer}.legend button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:5px}.swatch{width:17px;height:3px;border-radius:999px;display:inline-block}.house-swatch{background:var(--primary-color)}.solar-swatch{background:var(--warning-color,#f5b942)}.grid-swatch{background:var(--secondary-text-color)}.chart{position:relative;width:100%;height:clamp(400px,48vw,520px)}.chart svg{display:block;width:100%;height:100%;overflow:hidden;touch-action:none}.axis{fill:var(--secondary-text-color);font-size:11px;font-weight:500;font-family:inherit}.axis-small{fill:var(--secondary-text-color);font-size:10px;font-weight:600;font-family:inherit}.gridline{stroke:var(--divider-color);stroke-width:1;opacity:.58}.zero{stroke:var(--divider-color);stroke-width:1.35;opacity:.95}.house-line{fill:none;stroke:var(--primary-color);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.solar-line{fill:none;stroke:var(--warning-color,#f5b942);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.solar-fill{fill:color-mix(in srgb,var(--warning-color,#f5b942) 12%,transparent)}.grid-line{fill:none;stroke:var(--secondary-text-color);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.cursor{stroke:var(--secondary-text-color);stroke-width:1;stroke-dasharray:3 3;opacity:0;vector-effect:non-scaling-stroke}.cursor-dot{stroke:var(--card-background-color);stroke-width:2.4;opacity:0;vector-effect:non-scaling-stroke}.cursor-dot.house{fill:var(--primary-color)}.cursor-dot.solar{fill:var(--warning-color,#f5b942)}.cursor-dot.grid{fill:var(--secondary-text-color)}.tooltip{position:absolute;z-index:2;min-width:150px;padding:10px 11px;border-radius:11px;background:var(--card-background-color);border:1px solid var(--divider-color);box-shadow:0 7px 22px rgba(0,0,0,.2);pointer-events:none;opacity:0;transform:translate(-50%,-100%);font-size:12px;line-height:1.45}.tooltip.show{opacity:1}.tooltip-time{font-size:12.5px;font-weight:650;color:var(--primary-text-color);margin-bottom:5px}.tip-row{display:flex;justify-content:space-between;gap:16px;color:var(--secondary-text-color)}.tip-row b{font-weight:650;color:var(--primary-text-color)}.status{position:absolute;inset:0;display:grid;place-items:center;color:var(--secondary-text-color);font-size:13px;pointer-events:none}.status[hidden]{display:none}@media(max-width:700px){.wrap{padding:3px}.top{padding:0 4px}.legend{gap:9px}.legend button{font-size:10.5px}.meta{font-size:13px}.chart{height:400px}.axis{font-size:10px}.axis-small{font-size:9.5px}.tooltip{font-size:11.5px;min-width:140px;padding:9px 10px}}
</style><ha-card><div class="wrap"><div class="top"><div class="meta"></div><div class="legend"><button class="house-key" type="button"><span class="swatch house-swatch"></span>House</button><button class="solar-key" type="button"><span class="swatch solar-swatch"></span>Solar</button><button class="grid-key" type="button"><span class="swatch grid-swatch"></span>Grid</button></div></div><div class="chart"><svg role="img" aria-label="Household power history"></svg><div class="tooltip"></div><div class="status">Loading history…</div></div></div></ha-card>`;
    this.e={meta:this.shadowRoot.querySelector('.meta'),svg:this.shadowRoot.querySelector('svg'),tip:this.shadowRoot.querySelector('.tooltip'),status:this.shadowRoot.querySelector('.status'),chart:this.shadowRoot.querySelector('.chart')};
    this.shadowRoot.querySelector('.house-key').onclick=()=>this._more(this.c.house_entity);
    this.shadowRoot.querySelector('.solar-key').onclick=()=>this._more(this.c.solar_entity);
    this.shadowRoot.querySelector('.grid-key').onclick=()=>this._more(this.c.grid_entity);
    this.e.svg.addEventListener('pointermove',e=>this._pointer(e));
    this.e.svg.addEventListener('pointerleave',()=>this._hideTip());
    this.e.svg.addEventListener('pointerdown',e=>this._pointer(e));
    this._resizeObserver=new ResizeObserver(()=>{clearTimeout(this._resizeTimer);this._resizeTimer=setTimeout(()=>{this._hideTip();this._render()},40)});this._resizeObserver.observe(this.e.chart)
  }
  _more(entityId){openMoreInfo(this,entityId)}
  _onDayChange(event){
    if(!this.c?.calendar_day||!this.c.day_channel||event?.detail?.channel!==this.c.day_channel)return;
    const day=String(event.detail.day||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||day===this._selectedDay)return;
    this._selectedDay=day;this._lastRangeKey=null;this._series={};
    if(this.e){this.e.status.hidden=false;this.e.status.textContent='Loading history…';this._hideTip()}
    this._scheduleFetch()
  }
  _dayStart(day){
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day||''));
    if(!match)return null;
    const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    if(date.getFullYear()!==Number(match[1])||date.getMonth()!==Number(match[2])-1||date.getDate()!==Number(match[3]))return null;
    date.setHours(0,0,0,0);return date
  }
  _dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  _isToday(day){const now=new Date();now.setHours(0,0,0,0);return day===this._dayKey(now)}
  _dayLabel(time){const date=new Date(time),now=new Date();if(this._dayKey(date)===this._dayKey(now))return'Today';const options={weekday:'long',day:'numeric',month:'long'};if(date.getFullYear()!==now.getFullYear())options.year='numeric';return date.toLocaleDateString('en-AU',options)}
  _range(){
    if(this.c.calendar_day){const today=new Date();today.setHours(0,0,0,0);let start=this._dayStart(this._selectedDay)||today;if(start>today)start=today;const end=new Date(start);end.setDate(end.getDate()+1);return{start:start.getTime(),end:end.getTime(),isToday:start.getTime()===today.getTime()}}
    const bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,end=Math.floor(Date.now()/bucket)*bucket,hours=Math.max(1,Number(this.c.hours)||24);return{start:end-hours*3600000,end,isToday:false}
  }
  _rangeKey(r){return `${r.start}:${r.end}:${r.isToday?Math.floor(Date.now()/300000):'fixed'}:${this.c.house_entity}:${this.c.solar_entity}:${this.c.grid_entity}:${this.c.bucket_minutes}`}
  _scheduleFetch(){const r=this._range(),key=this._rangeKey(r);if(this._loading||key===this._lastRangeKey)return;this._fetch(r,key)}
  async _fetch(range,key){
    if(!this.h)return;this._loading=true;this.e.status.hidden=false;this.e.status.textContent='Loading history…';
    try{
      const result=await this.h.callWS({type:'recorder/statistics_during_period',start_time:new Date(range.start).toISOString(),end_time:new Date(range.end).toISOString(),statistic_ids:[this.c.house_entity,this.c.solar_entity,this.c.grid_entity],period:'5minute',types:['mean']});
      if(key!==this._rangeKey(this._range()))return;
      this._series={house:this._bucket(result?.[this.c.house_entity]||[]),solar:this._bucket(result?.[this.c.solar_entity]||[]),grid:this._bucket(result?.[this.c.grid_entity]||[])};
      this._start=range.start;this._end=range.end;this._lastRangeKey=key;
      const hasData=Object.values(this._series).some(series=>series.length);
      this.e.status.hidden=hasData;
      if(!hasData)this.e.status.textContent='No recorded data for this day'
    }catch(err){
      if(key!==this._rangeKey(this._range()))return;
      this._series={};this.e.status.hidden=false;this.e.status.textContent='History unavailable'
    }finally{
      const current=key===this._rangeKey(this._range());
      this._loading=false;if(current)this._render();this._scheduleFetch()
    }
  }
  _bucket(rows){
    const ms=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,m=new Map();
    for(const row of rows){const t=Number(row.start),v=Number(row.mean);if(!Number.isFinite(t)||!Number.isFinite(v))continue;const b=Math.floor(t/ms)*ms,x=m.get(b)||{sum:0,count:0};x.sum+=v;x.count+=1;m.set(b,x)}
    return [...m.entries()].map(([t,x])=>({t,v:x.sum/x.count})).sort((a,b)=>a.t-b.t)
  }
  _fmt(v){const a=Math.abs(v);if(a>=10000)return`${(v/1000).toFixed(0)} kW`;if(a>=1000)return`${(v/1000).toFixed(a>=5000?0:1)} kW`;return`${Math.round(v)} W`}
  _fmtExact(v){return Number.isFinite(v)?`${Math.round(v).toLocaleString('en-AU')} W`:'—'}
  _time(t){return new Date(t).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
  _tickTime(t){const d=new Date(t);return d.getMinutes()===0?d.toLocaleTimeString('en-AU',{hour:'numeric'}):this._time(t)}
  _niceMax(v){if(v<=0)return1000;const mag=10**Math.floor(Math.log10(v)),n=v/mag;const nice=n<=1?1:n<=2?2:n<=5?5:10;return nice*mag}
  _seriesValue(series,t){if(!series?.length)return null;let best=null,dist=Infinity;for(const p of series){const d=Math.abs(p.t-t);if(d<dist){dist=d;best=p}}return dist<=6*60000?best.v:null}
  _paths(series,x,y,baseline=null){
    const parts=[];let fill='',last=null,segment=[];const flush=()=>{if(!segment.length)return;const d=segment.map((p,i)=>`${i?'L':'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');parts.push(d);if(baseline!==null){const first=segment[0],end=segment[segment.length-1];fill+=`${d} L${x(end.t).toFixed(1)},${baseline.toFixed(1)} L${x(first.t).toFixed(1)},${baseline.toFixed(1)} Z `}segment=[]};
    for(const p of series||[]){if(last!==null&&p.t-last>15*60000)flush();segment.push(p);last=p.t}flush();return{line:parts.join(' '),fill:fill.trim()}
  }
  _render(){
    if(!this.e||!this._end)return;
    const house=this._series.house||[],solar=this._series.solar||[],grid=this._series.grid||[];
    if(!house.length&&!solar.length&&!grid.length)return;
    const dayLabel=this.c.calendar_day?this._dayLabel(this._start):null;
    this.e.meta.textContent=dayLabel?`${dayLabel} · ${this.c.bucket_minutes}-minute average`:`${this.c.bucket_minutes}-minute average`;
    this.e.svg.setAttribute('aria-label',dayLabel?`${dayLabel} household power history from midnight to midnight`:'Household power history');
    const rect=this.e.chart.getBoundingClientRect(),W=Math.max(320,Math.round(rect.width||800)),H=Math.max(340,Math.round(rect.height||420));
    this.e.svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const L=W<520?48:58,R=8,T=6,mainB=Math.round(H*.70),axisY=mainB+20,gridT=axisY+18,gridB=H-18,x0=L,x1=W-R,start=this._start,end=this._end;
    const x=t=>x0+(t-start)/(end-start)*(x1-x0);
    const mainValues=[...house,...solar].map(p=>Math.max(0,p.v)),yMax=this._niceMax(Math.max(1,...mainValues)*1.06),y=v=>mainB-(Math.max(0,v)/yMax)*(mainB-T);
    const gridAbs=Math.max(100,...grid.map(p=>Math.abs(p.v))),gridMax=this._niceMax(gridAbs*1.08),gridZero=(gridT+gridB)/2,yg=v=>gridZero-(v/gridMax)*((gridB-gridT)/2);
    const hp=this._paths(house,x,y),sp=this._paths(solar,x,y,mainB),gp=this._paths(grid,x,yg);
    let html='';
    for(let i=0;i<=4;i++){const v=yMax*(1-i/4),yy=T+(mainB-T)*(i/4);html+=`<line class="gridline" x1="${x0}" y1="${yy}" x2="${x1}" y2="${yy}"></line><text class="axis" x="${x0-8}" y="${yy+4}" text-anchor="end">${this._fmt(v)}</text>`}
    const ticks=W<520?4:W<820?6:8;
    for(let i=0;i<=ticks;i++){const t=start+(end-start)*i/ticks,xx=x(t);html+=`<text class="axis" x="${xx}" y="${axisY}" text-anchor="${i===0?'start':i===ticks?'end':'middle'}">${this._tickTime(t)}</text>`}
    html+=`<line class="zero" x1="${x0}" y1="${gridZero}" x2="${x1}" y2="${gridZero}"></line><text class="axis-small" x="${x1-2}" y="${gridT+10}" text-anchor="end">Import</text><text class="axis-small" x="${x1-2}" y="${gridB-3}" text-anchor="end">Export</text>`;
    if(sp.fill)html+=`<path class="solar-fill" d="${sp.fill}"></path>`;
    if(sp.line)html+=`<path class="solar-line" d="${sp.line}"></path>`;
    if(hp.line)html+=`<path class="house-line" d="${hp.line}"></path>`;
    if(gp.line)html+=`<path class="grid-line" d="${gp.line}"></path>`;
    html+=`<line class="cursor" x1="0" y1="${T}" x2="0" y2="${gridB}"></line><circle class="cursor-dot house" r="4.5"></circle><circle class="cursor-dot solar" r="4.5"></circle><circle class="cursor-dot grid" r="4"></circle>`;
    this.e.svg.innerHTML=html;this._geometry={W,H,L,R,T,mainB,gridT,gridB,x0,x1,start,end,x,y,yg}
  }
  _pointer(ev){
    if(!this._geometry||!this._end)return;
    const rect=this.e.svg.getBoundingClientRect(),g=this._geometry,px=(ev.clientX-rect.left)*(g.W/rect.width),clamped=Math.max(g.x0,Math.min(g.x1,px)),ratio=(clamped-g.x0)/(g.x1-g.x0),rawT=g.start+ratio*(g.end-g.start),bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,t=Math.round(rawT/bucket)*bucket;
    const hv=this._seriesValue(this._series.house,t),sv=this._seriesValue(this._series.solar,t),gv=this._seriesValue(this._series.grid,t),xx=g.x(t),cursor=this.e.svg.querySelector('.cursor');cursor.setAttribute('x1',xx);cursor.setAttribute('x2',xx);cursor.style.opacity='1';
    const setDot=(cls,v,yy)=>{const d=this.e.svg.querySelector(`.cursor-dot.${cls}`);if(v===null){d.style.opacity='0';return}d.setAttribute('cx',xx);d.setAttribute('cy',yy(v));d.style.opacity='1'};setDot('house',hv,g.y);setDot('solar',sv,g.y);setDot('grid',gv,g.yg);
    const gridLabel=gv===null?'Grid':gv>=0?'Imported':'Exported';
    this.e.tip.innerHTML=`<div class="tooltip-time">${this._time(t)}</div><div class="tip-row"><span>House</span><b>${this._fmtExact(hv)}</b></div><div class="tip-row"><span>Solar</span><b>${this._fmtExact(sv)}</b></div><div class="tip-row"><span>${gridLabel}</span><b>${this._fmtExact(gv===null?null:Math.abs(gv))}</b></div>`;
    const localX=(xx/g.W)*rect.width,peak=Math.min(hv===null?Infinity:g.y(hv),sv===null?Infinity:g.y(sv),g.mainB),localY=(Math.max(g.T,peak-8)/g.H)*rect.height;this.e.tip.style.left=`${localX}px`;this.e.tip.style.top=`${Math.max(66,localY)}px`;this.e.tip.classList.add('show')
  }
  _hideTip(){if(!this.e)return;this.e.tip.classList.remove('show');for(const el of this.e.svg.querySelectorAll('.cursor,.cursor-dot'))el.style.opacity='0'}
}
registerCard({ type: "energy-history-card-v3", element: EnergyHistoryCardV3, name: "Energy History", description: "Dense readable power history supporting rolling or local calendar-day ranges using completed 10-minute averages and a signed grid strip." });
}

// Module: src/patches/split-profiles-core.js
{
/** Live split-controller saved-profile core patch backed by split_state_registry. */
(()=>{const TAG="component-split-controller-v4";const SLOT_COUNT=5;const escRoom=card=>card?.config?.room_id||card?.config?.profile_area_id||globalThis.__componentSplitRegistryV4?.result?.systems?.get(card?.config?.entity)?.room_id||null;customElements.whenDefined(TAG).then(()=>{const Card=customElements.get(TAG),P=Card?.prototype;if(!P||P.__splitProfilesCoreV2)return;P.__splitProfilesCoreV2=!0;const originalSetConfig=P.setConfig;P.setConfig=function(config){this._profileEditV1=null,this._profileBusyV1=!1,this._profileMessageV1=null,this._profileLocalProfilesV1=null;return originalSetConfig.call(this,config)};P.profileSlotsV1=function(){const roomId=escRoom(this);return roomId?Array.from({length:SLOT_COUNT},(_,index)=>`${roomId}:${index}`):[]};P.profileRowsV1=function(){const roomId=escRoom(this);if(!roomId)return[];const profiles=Array.isArray(this._profileLocalProfilesV1)?this._profileLocalProfilesV1:Array.isArray(this.config?.profiles)?this.config.profiles:[];return Array.from({length:SLOT_COUNT},(_,index)=>{const profile=profiles[index]??null;if(!profile)return{index,entityId:`${roomId}:${index}`,available:!0,raw:"",profile:null,invalid:!1};try{if(!profile||profile.v!==1||typeof profile.n!=="string"||!profile.n.trim()||typeof profile.m!=="string")throw new Error("Invalid profile");return{index,entityId:`${roomId}:${index}`,available:!0,raw:JSON.stringify(profile),profile,invalid:!1}}catch{return{index,entityId:`${roomId}:${index}`,available:!0,raw:JSON.stringify(profile),profile:null,invalid:!0}}})};P.profileReadyV1=function(){return Boolean(escRoom(this)&&Array.isArray(this.profileRowsV1())&&this.profileRowsV1().length===SLOT_COUNT)};P.profileActiveV1=function(profile){if(!profile)return!1;const state=this.Z();if(state.uv||state.state?.state==="off")return!1;if(state.state?.state!==profile.m)return!1;if(Number.isFinite(profile.t)&&["heat","cool","auto"].includes(profile.m)){const current=this.K(state.attributes?.temperature),wanted=this.Et(profile.t);if(current===null||wanted===null||Math.abs(current-wanted)>.001)return!1}if(profile.f&&state.attributes?.fan_mode!==profile.f)return!1;for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";if(profile[key]&&vane.state!==profile[key])return!1}return!0};P.profileSummaryV1=function(profile){const parts=[this.tt(profile.m)];Number.isFinite(profile.t)&&["heat","cool","auto"].includes(profile.m)&&parts.push(this.it(profile.t));profile.f&&parts.push(this.tt(profile.f));profile.vv&&parts.push(`V ${this.$t(profile.vv,"vertical")}`);profile.hv&&parts.push(`H ${this.$t(profile.hv,"horizontal")}`);return parts.filter(Boolean).join(" · ")};P.profileDraftV1=function(profile=null){const state=this.Z(),modes=this.ft(),fans=this.bt(),vanes=this.vt();let mode=profile?.m;if(!modes.includes(mode)){const current=state.state?.state;mode=modes.includes(current)&&current!=="off"&&current||this.gt()||(modes.includes("cool")?"cool":modes[0])||""}let temperature=Number.isFinite(profile?.t)?profile.t:this.K(state.attributes?.temperature);if(temperature===null||!Number.isFinite(temperature))temperature=22;temperature=this.Et(temperature)??temperature;let fan=profile?.f??null;if(fan&&!fans.includes(fan))fan=null;if(!profile&&fans.includes(state.attributes?.fan_mode))fan=state.attributes.fan_mode;const draft={n:profile?.n??"",m:mode,t:temperature,f:fan,vv:null,hv:null};for(const vane of vanes){const key=vane.axis==="vertical"?"vv":"hv",saved=profile?.[key];draft[key]=saved&&vane.qs.includes(saved)?saved:!profile&&vane.qs.includes(vane.state)?vane.state:null}return draft};P.profileNormaliseV1=function(draft){const name=String(draft?.n??"").trim(),modes=this.ft();if(!name)throw new Error("Enter a profile name.");if(name.length>24)throw new Error("Profile names can be up to 24 characters.");if(!modes.includes(draft.m))throw new Error("Choose an available mode.");const profile={v:1,n:name,m:draft.m};if(["heat","cool","auto"].includes(draft.m)){const temperature=this.Et(draft.t);if(temperature===null)throw new Error("Choose a valid target temperature.");profile.t=temperature}const fans=this.bt();draft.f&&fans.includes(draft.f)&&(profile.f=draft.f);for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";draft[key]&&vane.qs.includes(draft[key])&&(profile[key]=draft[key])}return profile};P.profileStoreV1=async function(){const roomId=escRoom(this);if(this._profileBusyV1||!this._profileEditV1||!roomId)return;const rows=this.profileRowsV1();let profile;try{profile=this.profileNormaliseV1(this._profileEditV1.draft)}catch(error){this._profileMessageV1={text:error.message,type:"error"},this.St();return}const duplicate=rows.find(row=>row.profile&&row.index!==this._profileEditV1.index&&row.profile.n.trim().toLowerCase()===profile.n.trim().toLowerCase());if(duplicate){this._profileMessageV1={text:"A profile with that name already exists.",type:"error"},this.St();return}let row=this._profileEditV1.index===null?rows.find(candidate=>candidate.available&&!candidate.profile&&!candidate.invalid):rows[this._profileEditV1.index];if(this._profileEditV1.index===null&&!row){this._profileMessageV1={text:`Maximum of ${SLOT_COUNT} profiles reached.`,type:"error"},this.St();return}this._profileBusyV1=!0,this._profileMessageV1={text:"Saving profile…",type:"info"},this.St();try{await this.P.callService("split_state_registry","upsert_profile",{room_id:roomId,index:row.index,profile});const profiles=rows.filter(candidate=>candidate.profile).map(candidate=>candidate.profile);profiles[row.index]=profile;this._profileLocalProfilesV1=profiles.filter(Boolean),this._profileEditV1=null,this._profileMessageV1={text:`${profile.n} saved.`,type:"info"}}catch{this._profileMessageV1={text:"Could not save the profile.",type:"error"}}finally{this._profileBusyV1=!1,this.St(!0),this.H()}};P.profileDeleteV1=async function(){const roomId=escRoom(this);if(this._profileBusyV1||this._profileEditV1?.index===null||!roomId)return;const row=this.profileRowsV1()[this._profileEditV1.index];if(!row?.available)return;const name=row.profile?.n||"Profile";this._profileBusyV1=!0,this._profileMessageV1={text:"Deleting profile…",type:"info"},this.St();try{await this.P.callService("split_state_registry","remove_profile",{room_id:roomId,index:row.index});const profiles=this.profileRowsV1().filter(candidate=>candidate.profile&&candidate.index!==row.index).map(candidate=>candidate.profile);this._profileLocalProfilesV1=profiles,this._profileEditV1=null,this._profileMessageV1={text:`${name} deleted.`,type:"info"}}catch{this._profileMessageV1={text:"Could not delete the profile.",type:"error"}}finally{this._profileBusyV1=!1,this.St(!0),this.H()}};P.profileApplyV1=async function(profile){if(this._profileBusyV1||!profile)return;const state=this.Z();if(state.uv){this._profileMessageV1={text:"The split system is currently unavailable.",type:"error"},this.St();return}const modes=this.ft();if(!modes.includes(profile.m)){this._profileMessageV1={text:`${profile.n} uses a mode that is no longer available.`,type:"error"},this.St();return}this._profileBusyV1=!0,this._profileMessageV1={text:`Applying ${profile.n}…`,type:"info"},this.St();try{if(Number.isFinite(profile.t)&&["heat","cool","auto"].includes(profile.m)){const temperature=this.Et(profile.t);if(temperature===null)throw new Error("Invalid target");await this.P.callService("climate","set_temperature",{entity_id:this.config.entity,temperature,hvac_mode:profile.m})}else await this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:profile.m});const calls=[];profile.f&&this.bt().includes(profile.f)&&calls.push(this.P.callService("climate","set_fan_mode",{entity_id:this.config.entity,fan_mode:profile.f}));for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";profile[key]&&vane.qs.includes(profile[key])&&calls.push(this.P.callService("select","select_option",{entity_id:vane.entityId,option:profile[key]}))}await Promise.all(calls),this._profileMessageV1=null,this.Tt(`${profile.n} profile requested.`),this.M(!0)}catch{this._profileMessageV1={text:`Could not apply ${profile.n}.`,type:"error"},this.St()}finally{this._profileBusyV1=!1,this.H()}}})})();
}

// Module: src/patches/split-profiles-ui.js
{
/** Live split-controller saved-profile UI patch. */
(()=>{const TAG="component-split-controller-v4";const SLOT_COUNT=5;const install=()=>customElements.whenDefined(TAG).then(()=>{const Card=customElements.get(TAG);const P=Card?.prototype;if(!P)return;if(!P.profileSlotsV1){setTimeout(install,50);return;}if(P.__splitProfilesUiV1)return;P.__splitProfilesUiV1=true;const originalRender=P.R;const originalSignature=P.V;const originalRefresh=P.H;const originalAvailable=P.kt;const originalPanelRender=P.St;const originalClose=P.M;P.profileChoiceV1=function({title,key,options,value,optional=false,label,icon,onChange,}){const group=document.createElement("div");group.className="og";if(title){const heading=document.createElement("div");heading.className="gt";heading.textContent=title;group.append(heading);}const list=document.createElement("div");list.className="qs";list.setAttribute("role","listbox");list.setAttribute("aria-label",title||key);const choices=optional?[null,...options]:options;choices.forEach((choice,index)=>{const button=document.createElement("button");button.type="button";button.className="o";button.dataset.focusKey=`profile-${key}-${choice ?? "keep"}`;this.It(button,button.dataset.focusKey);button.setAttribute("role","option");button.setAttribute("aria-selected",String(choice===value));button.disabled=this._profileBusyV1;button.tabIndex=choice===value||(!choices.includes(value)&&index===0)?0:-1;const choiceIcon=document.createElement("ha-icon");choiceIcon.className="oi";choiceIcon.setAttribute("icon",choice===null?"mdi:minus-circle-outline":icon(choice),);const text=document.createElement("span");text.textContent=choice===null?"Keep current":label(choice);button.append(choiceIcon,text);if(choice===value){const check=document.createElement("ha-icon");check.setAttribute("icon","mdi:check");button.append(check);}else{button.append(document.createElement("span"));}button.addEventListener("click",()=>{if(this._profileBusyV1||choice===value)return;onChange(choice);this.St();});button.addEventListener("keydown",(event)=>this.Pt(event,list));list.append(button);});group.append(list);return group;};P.profileRenderListV1=function(focusInitial=false){const rows=this.profileRowsV1();const saved=rows.filter((row)=>row.profile);const invalid=rows.filter((row)=>row.invalid);const body=this.$.pb;body.replaceChildren();if(!saved.length){const empty=document.createElement("div");empty.className="pempty";empty.innerHTML="<ha-icon icon=\"mdi:account-plus-outline\"></ha-icon><strong>No saved profiles</strong><span>Create one from the split system's current settings, then adjust it before saving.</span>";body.append(empty);}else{const list=document.createElement("div");list.className="plist";for(const row of saved){const profile=row.profile;const active=this.profileActiveV1(profile);const wrap=document.createElement("div");wrap.className="prow";const apply=document.createElement("button");apply.type="button";apply.className="papply";apply.dataset.focusKey=`profile-apply-${row.index}`;this.It(apply,apply.dataset.focusKey);apply.disabled=this._profileBusyV1||this.Z().uv;apply.setAttribute("aria-current",active?"true":"false");const modeIcon=document.createElement("ha-icon");modeIcon.className="pmi";modeIcon.setAttribute("icon",this.et(profile.m));const copy=document.createElement("span");copy.className="pcopy";const name=document.createElement("strong");name.textContent=profile.n;const summary=document.createElement("small");summary.textContent=this.profileSummaryV1(profile);copy.append(name,summary);const status=document.createElement("ha-icon");status.className="pstatus";status.setAttribute("icon",active?"mdi:check-circle":"mdi:chevron-right",);apply.append(modeIcon,copy,status);apply.addEventListener("click",()=>this.profileApplyV1(profile));const edit=document.createElement("button");edit.type="button";edit.className="pedit";edit.dataset.focusKey=`profile-edit-${row.index}`;this.It(edit,edit.dataset.focusKey);edit.disabled=this._profileBusyV1;edit.setAttribute("aria-label",`Edit ${profile.n}`);const editIcon=document.createElement("ha-icon");editIcon.setAttribute("icon","mdi:pencil-outline");edit.append(editIcon);edit.addEventListener("click",()=>{this._profileEditV1={index:row.index,draft:this.profileDraftV1(profile),};this._profileMessageV1=null;this.u="profile-name";this.St(true);});wrap.append(apply,edit);list.append(wrap);}body.append(list);}if(invalid.length){const warning=document.createElement("div");warning.className="pmsg error";warning.textContent="One saved profile could not be read. Delete or recreate the affected profile.";body.append(warning);}const create=document.createElement("button");create.type="button";create.className="pnew";create.dataset.focusKey="profile-new";this.It(create,create.dataset.focusKey);const emptySlot=rows.some((row)=>row.available&&!row.profile&&!row.invalid,);create.disabled=this._profileBusyV1||!emptySlot;const addIcon=document.createElement("ha-icon");addIcon.setAttribute("icon","mdi:plus");const addText=document.createElement("span");addText.textContent=emptySlot?"Create profile":`${SLOT_COUNT} profile limit reached`;create.append(addIcon,addText);create.addEventListener("click",()=>{if(!emptySlot||this._profileBusyV1)return;this._profileEditV1={index:null,draft:this.profileDraftV1(),};this._profileMessageV1=null;this.u="profile-name";this.St(true);});body.append(create);if(this._profileMessageV1){const message=document.createElement("div");message.className=`pmsg ${
          this._profileMessageV1.type === "error" ? "error" : ""
        }`;message.setAttribute("role","status");message.textContent=this._profileMessageV1.text;body.append(message);}const focusKey=this.u;if(focusKey||focusInitial){queueMicrotask(()=>{const target=focusKey?body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`,):body.querySelector("button:not([disabled])");target?.focus();});}};P.profileRenderEditorV1=function(focusInitial=false){const edit=this._profileEditV1;if(!edit)return;const draft=edit.draft;const body=this.$.pb;body.replaceChildren();const intro=document.createElement("p");intro.className="pintro";intro.textContent=edit.index===null?"Current settings are used as the starting point. Only settings saved here will change when the profile is applied.":"Adjust the saved settings below. Changes do not affect the split system until the profile is applied.";body.append(intro);const nameWrap=document.createElement("label");nameWrap.className="pname";nameWrap.textContent="Profile name";const input=document.createElement("input");input.type="text";input.maxLength=24;input.placeholder="e.g. Sleep";input.value=draft.n;input.dataset.focusKey="profile-name";this.It(input,input.dataset.focusKey);input.disabled=this._profileBusyV1;input.addEventListener("input",()=>{draft.n=input.value;this._profileMessageV1=null;});nameWrap.append(input);body.append(nameWrap);const modes=this.ft();body.append(this.profileChoiceV1({title:"Mode",key:"mode",options:modes,value:draft.m,label:(value)=>this.tt(value),icon:(value)=>this.et(value),onChange:(value)=>{draft.m=value;},}),);if(["heat","cool","auto"].includes(draft.m)){const attrs=this.Z().attributes;const step=this.K(attrs.target_temp_step)??0.5;const{minimum,maximum}=this.dt();const tempGroup=document.createElement("div");tempGroup.className="og";const heading=document.createElement("div");heading.className="gt";heading.textContent="Target temperature";const stepper=document.createElement("div");stepper.className="pstep";const down=document.createElement("button");down.type="button";down.dataset.focusKey="profile-temp-down";this.It(down,down.dataset.focusKey);down.disabled=this._profileBusyV1||(minimum!==null&&Number(draft.t)<=minimum);down.setAttribute("aria-label","Decrease profile target temperature");const downIcon=document.createElement("ha-icon");downIcon.setAttribute("icon","mdi:minus");down.append(downIcon);const value=document.createElement("strong");value.textContent=this.it(draft.t)??"—";const up=document.createElement("button");up.type="button";up.dataset.focusKey="profile-temp-up";this.It(up,up.dataset.focusKey);up.disabled=this._profileBusyV1||(maximum!==null&&Number(draft.t)>=maximum);up.setAttribute("aria-label","Increase profile target temperature");const upIcon=document.createElement("ha-icon");upIcon.setAttribute("icon","mdi:plus");up.append(upIcon);const adjust=(direction)=>{const base=Number(draft.t);if(!Number.isFinite(base))return;const next=this.Dt(base+direction*step,step,minimum??base,);draft.t=this.Et(next)??next;this.St();};down.addEventListener("click",()=>adjust(-1));up.addEventListener("click",()=>adjust(1));stepper.append(down,value,up);tempGroup.append(heading,stepper);body.append(tempGroup);}const fans=this.bt();if(fans.length){body.append(this.profileChoiceV1({title:"Fan",key:"fan",options:fans,value:draft.f,optional:true,label:(value)=>this.tt(value),icon:(value)=>({auto:"mdi:fan-auto",quiet:"mdi:volume-low",low:"mdi:fan-speed-1",medium:"mdi:fan-speed-2",high:"mdi:fan-speed-3",})[String(value).toLowerCase()]??"mdi:fan",onChange:(value)=>{draft.f=value;},}),);}for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";body.append(this.profileChoiceV1({title:vane.title,key,options:vane.qs,value:draft[key],optional:true,label:(value)=>this.$t(value,vane.axis),icon:(value)=>this.At(vane,value),onChange:(value)=>{draft[key]=value;},}),);}if(this._profileMessageV1){const message=document.createElement("div");message.className=`pmsg ${
          this._profileMessageV1.type === "error" ? "error" : ""
        }`;message.setAttribute("role","status");message.textContent=this._profileMessageV1.text;body.append(message);}const actions=document.createElement("div");actions.className=`pactions ${edit.index !== null ? "editing" : ""}`;if(edit.index!==null){const remove=document.createElement("button");remove.type="button";remove.className="pdelete";remove.dataset.focusKey="profile-delete";this.It(remove,remove.dataset.focusKey);remove.disabled=this._profileBusyV1;remove.textContent="Delete";remove.addEventListener("click",()=>this.profileDeleteV1());actions.append(remove);}const cancel=document.createElement("button");cancel.type="button";cancel.dataset.focusKey="profile-cancel";this.It(cancel,cancel.dataset.focusKey);cancel.disabled=this._profileBusyV1;cancel.textContent="Cancel";cancel.addEventListener("click",()=>{this._profileEditV1=null;this._profileMessageV1=null;this.u="profile-new";this.St(true);});const save=document.createElement("button");save.type="button";save.className="psave";save.dataset.focusKey="profile-save";this.It(save,save.dataset.focusKey);save.disabled=this._profileBusyV1||!String(draft.n??"").trim();save.textContent=this._profileBusyV1?"Saving…":"Save";save.addEventListener("click",()=>this.profileStoreV1());actions.append(cancel,save);body.append(actions);const focusKey=this.u;if(focusKey||focusInitial){queueMicrotask(()=>{const target=focusKey?body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`,):input;target?.focus();});}};P.R=function(...args){const result=originalRender.apply(this,args);if(this.$?.pr)return result;this._profileOverridesV1??=new Map();this._profileEditV1??=null;this._profileBusyV1??=false;this._profileMessageV1??=null;const profileButton=document.createElement("button");profileButton.className="pw pr";profileButton.type="button";profileButton.dataset.panel="profiles";profileButton.setAttribute("aria-controls","split-secondary");profileButton.setAttribute("aria-expanded","false");profileButton.setAttribute("aria-label","Saved profiles");const icon=document.createElement("ha-icon");icon.setAttribute("icon","mdi:account-circle-outline");profileButton.append(icon);this.$.sg?.before(profileButton);this.$.pr=profileButton;profileButton.addEventListener("click",()=>this.U("profiles",profileButton),);const style=document.createElement("style");style.textContent=`
        .hd.profiled{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}
        .hd.settings.profiled{grid-template-columns:minmax(0,1fr) 44px 44px 44px;gap:8px}
        .plist{display:grid;gap:8px}
        .prow{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:8px}
        .papply{min-height:58px;padding:8px 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:24px minmax(0,1fr) 20px;align-items:center;gap:10px;text-align:left;background:transparent}
        .papply[aria-current=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}
        .pmi{color:var(--secondary-text-color);--mdc-icon-size:20px}.papply[aria-current=true] .pmi{color:var(--primary-color)}
        .pcopy{min-width:0}.pcopy strong,.pcopy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pcopy strong{font-size:13px;line-height:1.25;font-weight:650}.pcopy small{margin-top:4px;color:var(--secondary-text-color);font-size:12px;line-height:1.2;font-weight:400}
        .pstatus{color:var(--secondary-text-color);--mdc-icon-size:18px}.papply[aria-current=true] .pstatus{color:var(--primary-color)}
        .pedit{width:44px;min-height:58px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}
        .pnew{width:100%;min-height:46px;margin-top:12px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:var(--primary-color);font-size:13px;font-weight:650}
        .pempty{min-height:126px;padding:20px 16px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--secondary-text-color)}
        .pempty ha-icon{--mdc-icon-size:28px;color:var(--primary-color)}.pempty strong{margin-top:10px;color:var(--primary-text-color);font-size:14px}.pempty span{max-width:280px;margin-top:5px;font-size:12px;line-height:1.4}
        .pintro{margin:0 0 12px;color:var(--secondary-text-color);font-size:12px;line-height:1.4}
        .pname{display:block;margin-bottom:12px;color:var(--secondary-text-color);font-size:13px;font-weight:600}.pname input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent}
        .pstep{display:grid;grid-template-columns:44px minmax(90px,1fr) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);overflow:hidden}.pstep button{width:44px;height:46px;display:grid;place-items:center}.pstep strong{text-align:center;font-size:18px;font-variant-numeric:tabular-nums}
        .pmsg{margin-top:10px;color:var(--secondary-text-color);font-size:12px;line-height:1.35}.pmsg.error{color:var(--error-color)}
        .pactions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--divider-color)}.pactions.editing{grid-template-columns:1fr 1fr 1fr}.pactions button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.pactions .psave{color:var(--primary-color)}.pactions .pdelete{color:var(--error-color)}
        @media(max-width:420px){.pactions.editing{grid-template-columns:1fr 1fr}.pactions.editing .pdelete{grid-column:1/-1;grid-row:2}}
      `;this.shadowRoot.append(style);return result;};P.V=function(){const base=originalSignature.call(this);const profiles=this.profileRowsV1().map(row=>row.raw);return`${base}|${JSON.stringify(profiles)}`;};P.kt=function(){if(this.o==="profiles")return this.profileReadyV1();return originalAvailable.call(this);};P.H=function(){const result=originalRefresh.call(this);if(!this.$?.pr)return result;const ready=this.profileReadyV1();this.$.pr.hidden=!ready;this.$.hd.classList.toggle("profiled",ready);const active=ready?this.profileRowsV1().find((row)=>row.profile&&this.profileActiveV1(row.profile),):null;this.$.pr.classList.toggle("on",Boolean(active));this.$.pr.querySelector("ha-icon")?.setAttribute("icon",active?"mdi:account-check-outline":"mdi:account-circle-outline",);this.$.pr.setAttribute("aria-label",active?`Saved profiles · ${active.profile.n} active`:"Saved profiles",);this.$.pr.setAttribute("aria-expanded",String(this.o==="profiles"),);return result;};P.St=function(focusInitial=false){if(this.o!=="profiles"){return originalPanelRender.call(this,focusInitial);}if(!this.profileReadyV1())return;this.$.pt.textContent=this._profileEditV1?.index===null?"New profile":this._profileEditV1?"Edit profile":"Saved profiles";if(this._profileEditV1){this.profileRenderEditorV1(focusInitial);}else{this.profileRenderListV1(focusInitial);}};P.M=function(restoreFocus){const wasProfiles=this.o==="profiles";const result=originalClose.call(this,restoreFocus);if(wasProfiles){this._profileEditV1=null;this._profileMessageV1=null;this.u=null;}return result;};});install();})();
}

// Module: src/patches/wled-registry-integration.js
{
/** Registers WLED as a dynamic dashboard control without changing its UI. */
const { WLED_HD, WLED_DOMAIN, WLED_NAME } =
  globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

if(!WLED_HD.__wledComponentPatchV1){
  WLED_HD.__wledComponentPatchV1=true;
  const oldUi=WLED_HD.uiEntry;
  WLED_HD.uiEntry=e=>{if(!oldUi?.(e))return false;if(e?.platform!=='wled')return true;if(WLED_DOMAIN(e.entity_id)!=='light')return false;const n=WLED_NAME(e),u=String(e.unique_id||'');return n==='main'||!/_\d+$/.test(u)};
  const oldControl=WLED_HD.controlConfig;
  WLED_HD.controlConfig=(e,s,d,h,split)=>e?.platform==='wled'&&WLED_DOMAIN(e.entity_id)==='light'?{type:'custom:component-wled-controller-v1',entity:e.entity_id,device_id:e.device_id}:oldControl?.(e,s,d,h,split)||null;
  WLED_HD.REG?.refresh?.();
}
}

// Module: src/patches/wled-controller-current-behaviour.js
{
/** Preserves the current WLED controller runtime patch from Home Assistant. */
customElements.whenDefined('component-wled-controller-v1').then(()=>{
  const C=customElements.get('component-wled-controller-v1');
  if(!C||C.prototype.__stateAwareV3)return;
  C.prototype.__stateAwareV3=true;

  const usable=(h,id)=>{
    const s=h?.states?.[id];
    return Boolean(s&&!['unknown','unavailable'].includes(String(s.state).toLowerCase()));
  };

  const originalRender=C.prototype.render;
  C.prototype.render=function(){
    originalRender?.call(this);
    if(!this.h||!this.b)return;

    const main=this.h.states[this.b.main];
    const state=String(main?.state||'unavailable').toLowerCase();
    const on=state==='on';
    const controllable=state==='on'||state==='off';
    const body=this.shadowRoot?.querySelector('.body');

    if(body)body.style.display=on?'grid':'none';
    if(this.power)this.power.disabled=!controllable;

    if(!on&&this.dialog?.open)this.dialog.close();

    if(this.statusEl){
      if(state==='unavailable')this.statusEl.textContent='Unavailable';
      else if(state==='unknown')this.statusEl.textContent='Unknown';
      else if(state==='off')this.statusEl.textContent='Off';
    }

    if(this.sheetState){
      if(state==='unavailable')this.sheetState.textContent='Unavailable';
      else if(state==='unknown')this.sheetState.textContent='Unknown';
      else if(state==='off')this.sheetState.textContent='Off';
    }

    const presetOk=Boolean(this.b.preset&&usable(this.h,this.b.preset));
    const effectOk=(this.b.effectLights||[]).some(id=>usable(this.h,id));
    const paletteOk=(this.b.palettes||[]).some(id=>usable(this.h,id));
    const speedOk=(this.b.speeds||[]).some(id=>usable(this.h,id));
    const intensityOk=(this.b.intensities||[]).some(id=>usable(this.h,id));

    if(this.presetsBtn)this.presetsBtn.disabled=!on||!presetOk;
    if(this.colour)this.colour.disabled=!on||!effectOk;
    if(this.nativeColour)this.nativeColour.disabled=!on||!effectOk;
    if(this.effect)this.effect.disabled=!on||!effectOk;
    if(this.palette)this.palette.disabled=!on||!paletteOk;
    if(this.speed)this.speed.disabled=!on||!speedOk;
    if(this.intensity)this.intensity.disabled=!on||!intensityOk;
    if(this.advanced)this.advanced.disabled=!on||!(presetOk||effectOk||paletteOk||speedOk||intensityOk);
  };

  const originalOpenAdvanced=C.prototype.openAdvanced;
  C.prototype.openAdvanced=function(presets=false){
    const state=String(this.h?.states?.[this.b?.main]?.state||'unavailable').toLowerCase();
    if(state!=='on')return;
    return originalOpenAdvanced?.call(this,presets);
  };
});
}

// Module: src/patches/room-navigation-current-behaviour.js
{
/** Preserves the current room-navigation runtime patch from Home Assistant. */
customElements.whenDefined('component-room-navigation-v1').then(()=>{
  const Card=customElements.get('component-room-navigation-v1');
  const P=Card?.prototype;
  if(!P||P.__presenceGlowV1)return;
  P.__presenceGlowV1=true;

  P._presenceDetected=function(){
    if(this.c?.demo_presence===true)return true;
    if(this.c?.demo_presence===false)return false;
    const explicit=this.c?.presence_entity;
    if(explicit){
      const state=this._hass?.states?.[explicit];
      return !!state&&['on','home','occupied','present','detected'].includes(String(state.state).toLowerCase());
    }
    const states=typeof this._entities==='function'?this._entities():[];
    return states.some(state=>{
      if(!state?.entity_id?.startsWith('binary_sensor.')||state.state!=='on')return false;
      const cls=String(state.attributes?.device_class||'').toLowerCase();
      const identity=(state.entity_id+' '+String(state.attributes?.friendly_name||'')).toLowerCase();
      return cls==='occupancy'||cls==='presence'||identity.includes('presence')||identity.includes('occupancy')||identity.includes('mmwave')||identity.includes('mmwave');
    });
  };

  P._presenceHue=function(){
    const key=String(this.c?.presence_colour_key||this.c?.area||this.c?.name||'room');
    let hash=2166136261;
    for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return ((hash>>>0)%360+360)%360;
  };

  const original=P._render;
  P._render=function(){
    original.call(this);
    const card=this.shadowRoot?.querySelector('ha-card');
    if(!card)return;
    card.style.transition='border-color 220ms ease, box-shadow 220ms ease';
    if(!this._presenceDetected()){
      card.style.removeProperty('border-color');
      card.style.removeProperty('box-shadow');
      card.removeAttribute('data-presence');
      return;
    }
    const hue=this._presenceHue();
    card.setAttribute('data-presence','true');
    card.style.borderColor=`hsl(${hue} 82% 68% / .62)`;
    card.style.boxShadow=`0 0 0 1px hsl(${hue} 82% 68% / .18), 0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
  };
});
}

// Module: src/patches/garage-door-device-dedup.js
{
/** Prevent the smart collection from showing a garage trigger beside its controller. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__garageDoorDeviceDedupV1) return;
  prototype.__garageDoorDeviceDedupV1 = true;

  const previousCandidates = prototype.candidates;
  prototype.candidates = function candidates() {
    const rows = previousCandidates.call(this);
    if (!Array.isArray(rows) || !this.d?.byDevice || !this.h) return rows;
    const garageDevices = new Set(rows.filter((entity) => {
      if (!entity?.device_id || String(entity.entity_id || "").split(".")[0] !== "binary_sensor") return false;
      return this.h.states[entity.entity_id]?.attributes?.device_class === "garage_door";
    }).map((entity) => entity.device_id));
    if (!garageDevices.size) return rows;
    return rows.filter((entity) => {
      if (!garageDevices.has(entity?.device_id)) return true;
      if (String(entity.entity_id || "").split(".")[0] !== "button") return true;
      const name = `${entity.entity_id || ""} ${entity.name || ""} ${entity.original_name || ""}`.toLowerCase();
      return !/(garage.?door|door).*(trigger|operate)|(trigger|operate).*(garage.?door|door)/.test(name);
    });
  };
  globalThis.__homeDashboardV2?.REG?.refresh?.();
});
}

// Module: src/patches/camera-controller-integration.js
{
/** Adds one ONVIF camera controller per device to smart collections. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const HD = globalThis.__homeDashboardV2;
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!HD || !prototype || prototype.__cameraDeviceDedupV1) return;
  prototype.__cameraDeviceDedupV1 = true;
  const oldUiEntry = HD.uiEntry;
  const oldPotential = HD.isPotential;
  const oldControl = HD.controlConfig;
  const oldIcon = HD.icon;
  const oldCandidates = prototype.candidates;
  const domain = HD.domain;
  const name = (entity) => String(entity?.name || entity?.original_name || entity?.entity_id || "");
  const isOnvif = (entity) => entity?.platform === "onvif";
  const isOwner = (entity) => isOnvif(entity) && domain(entity.entity_id) === "camera" && !/sub.?stream/i.test(`${entity.entity_id} ${name(entity)}`);
  const cameraDeviceActive = (entity, data, hass) => {
    if (!entity?.device_id) return false;
    return (data?.byDevice?.get(entity.device_id) || []).some((sibling) => {
      if (domain(sibling.entity_id) !== "binary_sensor") return false;
      const state = hass?.states?.[sibling.entity_id];
      const deviceClass = state?.attributes?.device_class || "";
      const candidateName = `${sibling.entity_id} ${name(sibling)}`;
      return state?.state === "on" && (/^(motion|occupancy|presence|sound)$/.test(deviceClass) || /motion|human|person|detect/i.test(candidateName));
    });
  };
  HD.uiEntry = (entity) => oldUiEntry?.(entity) && (!isOnvif(entity) || isOwner(entity));
  HD.isPotential = (entity, state) => isOwner(entity) || oldPotential?.(entity, state) || false;
  HD.icon = (entity, state) => isOwner(entity) ? "mdi:cctv" : oldIcon?.(entity, state) || "mdi:gesture-tap-button";
  HD.controlConfig = (entity, state, data, hass, split) => isOwner(entity) ? { type: "custom:component-camera-controller-v1", entity: entity.entity_id, device_id: entity.device_id } : oldControl?.(entity, state, data, hass, split) || null;
  prototype.candidates = function candidates() {
    const rows = oldCandidates.call(this);
    if (!Array.isArray(rows) || !this.d || !this.h) return rows;
    if (this.c?.mode === "active") {
      const ids = new Set(rows.map((entity) => entity.entity_id));
      for (const entity of this.d.entities) {
        if (!isOwner(entity) || !this.h.states[entity.entity_id] || ids.has(entity.entity_id)) continue;
        rows.push(entity);
        ids.add(entity.entity_id);
      }
    }
    return rows;
  };
  prototype.shown = function shown(rows) {
    if (this.c?.mode !== "active") return rows;
    return rows.filter((entity) => isOwner(entity) ? cameraDeviceActive(entity, this.d, this.h) : HD.isActive(entity, this.h.states[entity.entity_id]));
  };
  HD.REG?.refresh?.();
});
}

// Module: src/patches/camera-controller-current-behaviour.js
{
/** Preserves the current camera controller availability behaviour. */
customElements.whenDefined("component-camera-controller-v1").then(() => {
  const Card = customElements.get("component-camera-controller-v1");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__stateAwareV2) return;
  prototype.__stateAwareV2 = true;
  const oldRender = prototype.render;
  prototype.render = function render() {
    oldRender.call(this);
    if (!this._hass || !this.bundleData) return;
    const status = this.status();
    const usable = (entityId) => {
      const state = this._hass.states[entityId];
      return Boolean(state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase()));
    };
    const internalUsable = [...this.bundleData.switches, ...this.bundleData.detections, ...this.bundleData.buttons].some((entity) => usable(entity.entity_id));
    if (this.view) this.view.hidden = !status.online;
    if (this.controls) this.controls.hidden = !status.online || !internalUsable;
    if (!status.online && this.dialog?.open) this.dialog.close();
  };
  const oldOpenControls = prototype.openControls;
  prototype.openControls = function openControls() { if (!this.status()?.online) return; return oldOpenControls.call(this); };
});
}

// Module: src/patches/runtime-reliability.js
{
/** Temporary compatibility fixes for installed bundles predating the scoped-source corrections. */
(() => {
  const patch = (type, apply) => customElements.whenDefined(type).then(() => {
    const Card = customElements.get(type);
    if (Card) apply(Card.prototype);
  });

  patch("component-context-strip-v3", (prototype) => {
    const original = prototype._render;
    if (typeof original !== "function" || !String(original).includes("CtxEsc")) return;
    prototype._render = function renderWithScopedEscape() {
      const previous = globalThis.CtxEsc;
      globalThis.CtxEsc = globalThis.__HA_COMPONENT_LIBRARY_SHARED__?.escapeHtml ?? String;
      try { return original.call(this); }
      finally {
        if (previous === undefined) delete globalThis.CtxEsc;
        else globalThis.CtxEsc = previous;
      }
    };
  });

  patch("component-device-discovery-v2", (prototype) => {
    const originalStyles = prototype.styles;
    if (typeof originalStyles === "function" && String(originalStyles).includes("${B}")) {
      prototype.styles = function stylesWithScopedBase() {
        const previous = globalThis.B;
        globalThis.B = globalThis.__HA_COMPONENT_LIBRARY_SHARED__?.PRESENTATIONAL_CARD_STYLES ?? "";
        try { return originalStyles.call(this); }
        finally {
          if (previous === undefined) delete globalThis.B;
          else globalThis.B = previous;
        }
      };
    }
    const originalDisconnect = prototype.disconnectedCallback;
    if (!String(originalDisconnect).includes("started = false")) {
      prototype.disconnectedCallback = function disconnectDiscovery() {
        originalDisconnect?.call(this);
        this.timer = null;
        this.started = false;
      };
    }
  });

  patch("component-history-graph-v2", (prototype) => {
    if (prototype.connectedCallback) return;
    prototype.connectedCallback = function reconnectHistoryGraph() {
      if (this.e?.chart) this.ro?.observe(this.e.chart);
      this.draw?.();
    };
  });

  patch("component-update-summary-v3", (prototype) => {
    if (prototype.disconnectedCallback) return;
    prototype.disconnectedCallback = function disconnectUpdateSummary() {
      window.clearTimeout(this.messageTimer);
      this.messageTimer = null;
    };
  });
})();
}

// Module: src/patches/home-editor-portal.js
{
(()=>{
(()=>{const TAG='dashboard-preference-editor-v3',PATCH='__homeEditorPortalV1';async function portal(){await customElements.whenDefined(TAG);let e=globalThis.__homeDashboardEditorV3;if(!e||typeof e.open!=='function'){e=document.createElement(TAG);globalThis.__homeDashboardEditorV3=e}if(e.parentNode!==document.body){e.remove();document.body.append(e)}return e}async function patch(tag){await customElements.whenDefined(tag);const C=customElements.get(tag),p=C?.prototype;if(!p||p[PATCH]||typeof p.openEditor!=='function')return;const original=p.openEditor;p.openEditor=async function(...args){this.editor=await portal();return original.apply(this,args)};p[PATCH]=true}Promise.all(['component-room-directory-v4','component-household-directory-v3','component-smart-collection-v3'].map(patch)).catch(e=>console.error('[HOME EDITOR PORTAL]',e));})();
})();
}

// Module: src/patches/room-directory-presence-glow.js
{
(()=>{
customElements.whenDefined('component-room-directory-v4').then(()=>{
  const Card=customElements.get('component-room-directory-v4');
  const P=Card?.prototype;
  if(!P||P.__roomDirectoryGlowV2)return;
  P.__roomDirectoryGlowV2=true;

  const originalEntries=P.entries;
  P.entries=function(areaId){
    if(!this.d||!this.h)return[];
    const HD2=globalThis.__homeDashboardV2;
    if(!HD2?.uiEntry||!HD2?.areaOf)return originalEntries.call(this,areaId);
    let cache=this.__roomEntriesCache;
    if(!cache||cache.registry!==this.d){
      const byArea=new Map();
      for(const entry of this.d.entities||[]){
        if(!HD2.uiEntry(entry))continue;
        const id=HD2.areaOf(entry,this.d);
        if(!id)continue;
        const entries=byArea.get(id)||[];
        entries.push(entry);
        byArea.set(id,entries);
      }
      cache={registry:this.d,byArea};
      this.__roomEntriesCache=cache;
    }
    return (cache.byArea.get(areaId)||[]).map(e=>({e,s:this.h.states[e.entity_id]})).filter(x=>x.s);
  };

  P._roomActive=function(area){
    const HD2=globalThis.__homeDashboardV2;
    return this.entries(area.area_id).some(({e,s})=>{
      if(e?.entity_id?.startsWith('binary_sensor.')&&s?.state==='on'){
        const cls=String(s.attributes?.device_class||e.device_class||'').toLowerCase();
        const identity=(e.entity_id+' '+String(e.name||e.original_name||'')+' '+String(s.attributes?.friendly_name||'')).toLowerCase();
        if(cls==='occupancy'||cls==='presence'||identity.includes('presence')||identity.includes('occupancy')||identity.includes('mmwave'))return true;
      }
      return HD2?.isActive?.(e,s)===true;
    });
  };

  P._roomPresenceHue=function(area){
    const key=String(area?.area_id||area?.name||'room');
    let hash=2166136261;
    for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return (hash>>>0)%360;
  };

  const original=P.updateTile;
  P.updateTile=function(button,area){
    original.call(this,button,area);
    const active=button.classList.contains('active')||this._roomActive(area);
    if(button.dataset.roomGlowInitialised!=='true'){
      button.dataset.roomGlowInitialised='true';
      button.style.transition='box-shadow 180ms ease, border-color 180ms ease';
      button.style.borderLeft='var(--dashboard-card-border,1px solid var(--divider-color))';
    }
    if(!active){
      button.style.removeProperty('border-color');
      button.style.removeProperty('box-shadow');
      button.removeAttribute('data-presence');
      return;
    }
    const hue=this._roomPresenceHue(area);
    button.setAttribute('data-presence','true');
    button.style.borderColor=`hsl(${hue} 82% 68% / .72)`;
    button.style.boxShadow=`0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
  };

  const refresh=(root,seen=new Set())=>{
    if(!root||seen.has(root))return;
    seen.add(root);
    root.querySelectorAll?.('component-room-directory-v4').forEach(card=>card.refreshTiles?.());
    root.querySelectorAll?.('*').forEach(host=>refresh(host.shadowRoot,seen));
  };
  const refreshMounted=()=>refresh(document);
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(refreshMounted);
  else queueMicrotask(refreshMounted);
});
})();
}

globalThis.__HA_COMPONENT_LIBRARY__ = Object.freeze({ version: "4.0.0", components: 38 });
