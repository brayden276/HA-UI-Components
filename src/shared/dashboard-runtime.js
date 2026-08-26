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
HD2.entryFilters ??= [];
HD2.registerEntryFilter ??= (filter) => {
  if (typeof filter !== "function") throw new TypeError("Dashboard entry filters must be functions");
  HD2.entryFilters.push(filter);
  return () => {
    const index = HD2.entryFilters.indexOf(filter);
    if (index >= 0) HD2.entryFilters.splice(index, 1);
  };
};
HD2.uiEntry = (entry) =>
  Boolean(
    entry?.entity_id &&
      !entry.disabled_by &&
      !entry.hidden_by &&
      !["diagnostic", "config"].includes(entry.entity_category) &&
      HD2.entryFilters.every((filter) => filter(entry)),
  );
HD2.card=async(h,c)=>{const helpers=await window.loadCardHelpers();const x=helpers.createCardElement(c);x.hass=h;return x};
HD2.controlDomains=new Set(['light','fan','switch','input_boolean','media_player','climate','cover','lock','vacuum','button','select','number']);
HD2.isPotential=(e,s)=>HD2.uiEntry(e)&&(HD2.controlDomains.has(HD2.domain(e.entity_id))||(HD2.domain(e.entity_id)==='binary_sensor'&&s?.attributes?.device_class==='garage_door'));
HD2.isActive=(e,s)=>{if(!HD2.uiEntry(e)||!s)return false;const d=HD2.domain(e.entity_id),st=s.state,a=s.attributes||{};if(['light','fan','switch','input_boolean'].includes(d))return st==='on';if(d==='media_player'){if(['playing','paused','buffering','on'].includes(st))return true;if(st==='idle'){const v=String(a.media_title||a.app_name||'');return Boolean(v&&!/^(idle|home(?: screen)?|default media receiver)$/i.test(v))}return false}if(d==='climate')return /^(heat|cool|heat_cool|auto|dry|fan_only)$/.test(st);if(d==='cover')return /^(open|opening|closing)$/.test(st);if(d==='lock')return st==='unlocked';if(d==='vacuum')return /^(cleaning|returning)$/.test(st);if(d==='binary_sensor')return st==='on'&&/^(door|window|garage_door|smoke|moisture|gas)$/.test(a.device_class||'');return false};
const garageOperatorIdentity = (entry) =>
  `${entry?.entity_id || ""} ${entry?.name || ""} ${entry?.original_name || ""}`
    .toLowerCase()
    .replace(/[_./-]+/g, " ");

HD2.garageControl = (entry, registry, hass) => {
  if (!entry?.device_id) return null;
  const buttons = (registry?.byDevice?.get(entry.device_id) || []).filter(
    (candidate) =>
      HD2.domain(candidate?.entity_id) === "button" &&
      HD2.uiEntry(candidate) &&
      hass?.states?.[candidate.entity_id] &&
      String(hass.states[candidate.entity_id].state).toLowerCase() !== "unavailable",
  );
  const explicit = buttons.filter((candidate) =>
    /\bgarage\s+door\b.*\b(trigger|operate|operator)\b|\b(trigger|operate|operator)\b.*\bgarage\s+door\b/.test(
      garageOperatorIdentity(candidate),
    ),
  );
  return explicit.length === 1 ? explicit[0].entity_id : null;
};

// Apple TV and climate controls intentionally do not discover sibling entities.
// Their public wrappers accept explicit capability entities and otherwise delegate
// to the primary Home Assistant entity only.
HD2.appleTvBundle=(e,s,_d,h)=>HD2.domain(e?.entity_id)==='media_player'&&e?.platform==='apple_tv'?{type:'custom:component-apple-tv-controller-v1',entity:e.entity_id,title:HD2.stateName(h,e,s),icon:'mdi:apple'}:null;
HD2.controlConfig=(e,s,d,h)=>{const id=e.entity_id,dom=HD2.domain(id);if(dom==='binary_sensor'&&s?.attributes?.device_class==='garage_door'){const b=HD2.garageControl(e,d,h);return b?{type:'custom:component-garage-door-controller-v1',title:HD2.stateName(h,e,s).replace(/ Garage Door Status$/i,''),entity:id,control_entity:b}:{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true}}if(['light','fan','number'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'slider',entity:id,show_state:true,tap_action:{action:'more-info'}};if(['switch','input_boolean'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'switch',entity:id,show_state:true,button_action:{tap_action:{action:'toggle'}},tap_action:{action:'more-info'}};if(dom==='media_player')return HD2.appleTvBundle(e,s,d,h)||{type:'custom:bubble-card',card_type:'media-player',entity:id,show_state:true,tap_action:{action:'more-info'}};if(dom==='climate')return{type:'custom:component-split-controller-v4',entity:id,title:HD2.stateName(h,e,s)};if(dom==='cover')return{type:'custom:bubble-card',card_type:'cover',entity:id,show_state:true};if(dom==='lock')return{type:'custom:mushroom-lock-card',entity:id};if(dom==='vacuum')return{type:'custom:mushroom-vacuum-card',entity:id};if(dom==='select')return{type:'custom:mushroom-select-card',entity:id};if(dom==='button')return{type:'custom:mushroom-entity-card',entity:id,tap_action:{action:'perform-action',perform_action:'button.press',target:{entity_id:id},confirmation:{text:'Run this control?'}},hold_action:{action:'more-info'}};if(dom==='binary_sensor')return{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true,show_last_changed:false};return null};

HD2.controlResolvers ??= [];
HD2.registerControlResolver ??= (resolver) => {
  if (typeof resolver !== "function") throw new TypeError("Dashboard control resolvers must be functions");
  HD2.controlResolvers.push(resolver);
  return () => {
    const index = HD2.controlResolvers.indexOf(resolver);
    if (index >= 0) HD2.controlResolvers.splice(index, 1);
  };
};

const defaultControlConfig = HD2.controlConfig;
HD2.controlConfig = (entry, state, registry, hass) => {
  for (const resolveControl of HD2.controlResolvers) {
    const configuration = resolveControl(entry, state, registry, hass);
    if (configuration) return configuration;
  }
  return defaultControlConfig(entry, state, registry, hass);
};

HD2.preferenceEditor ??= async () => {
  await customElements.whenDefined("dashboard-preference-editor-v3");
  const editor = globalThis.__homeDashboardEditorV3 ??= document.createElement("dashboard-preference-editor-v3");
  if (editor.parentNode !== document.body) {
    editor.remove?.();
    document.body.append(editor);
  }
  return editor;
};
