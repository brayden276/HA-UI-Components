import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const apply = async (file, transforms) => {
  const path = resolve(root, file);
  let source = await readFile(path, "utf8");
  let changed = false;
  for (const [label, from, to] of transforms) {
    if (source.includes(to)) continue;
    if (!source.includes(from)) throw new Error(`${file}: target not found: ${label}`);
    source = source.replace(from, to);
    changed = true;
  }
  if (changed) await writeFile(path, source, "utf8");
  console.log(`${changed ? "Migrated" : "Already migrated"} ${file}`);
};

await apply("src/components/energy-history-card.js", [
  [
    "interaction import",
    'const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
    'const { interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "pin state",
    'this._dayListener=e=>this._onDayChange(e)}',
    'this._dayListener=e=>this._onDayChange(e);this._pinned=false;this._pointerState=null;this._interactionHandles=[];this._outside=e=>{if(this._pinned&&!e.composedPath?.().includes(this)){this._pinned=false;this._hideTip()}}}',
  ],
  [
    "connected outside listener",
    "connectedCallback(){window.addEventListener('energy-day-selector-change',this._dayListener)}",
    "connectedCallback(){window.addEventListener('energy-day-selector-change',this._dayListener);window.addEventListener('pointerdown',this._outside,true)}",
  ],
  [
    "disconnect cleanup",
    "disconnectedCallback(){window.removeEventListener('energy-day-selector-change',this._dayListener);this._resizeObserver?.disconnect();clearTimeout(this._resizeTimer)}",
    "disconnectedCallback(){window.removeEventListener('energy-day-selector-change',this._dayListener);window.removeEventListener('pointerdown',this._outside,true);for(const h of this._interactionHandles)h.destroy();this._interactionHandles=[];this._resizeObserver?.disconnect();clearTimeout(this._resizeTimer)}",
  ],
  [
    "legend interactions",
    "    this.shadowRoot.querySelector('.house-key').onclick=()=>this._more(this.c.house_entity);\n    this.shadowRoot.querySelector('.solar-key').onclick=()=>this._more(this.c.solar_entity);\n    this.shadowRoot.querySelector('.grid-key').onclick=()=>this._more(this.c.grid_entity);",
    "    this._interactionHandles.push(\n      interaction(this.shadowRoot.querySelector('.house-key'),{primary:()=>this._more(this.c.house_entity),feedback:true}),\n      interaction(this.shadowRoot.querySelector('.solar-key'),{primary:()=>this._more(this.c.solar_entity),feedback:true}),\n      interaction(this.shadowRoot.querySelector('.grid-key'),{primary:()=>this._more(this.c.grid_entity),feedback:true}),\n    );",
  ],
  [
    "chart pointer bindings",
    "    this.e.svg.addEventListener('pointermove',e=>this._pointer(e));\n    this.e.svg.addEventListener('pointerleave',()=>this._hideTip());\n    this.e.svg.addEventListener('pointerdown',e=>this._pointer(e));",
    "    this.e.svg.addEventListener('pointerdown',e=>this._pointerDown(e));\n    this.e.svg.addEventListener('pointermove',e=>this._pointerMove(e));\n    this.e.svg.addEventListener('pointerup',e=>this._pointerUp(e));\n    this.e.svg.addEventListener('pointercancel',()=>{this._pointerState=null});\n    this.e.svg.addEventListener('pointerleave',()=>{if(!this._pinned&&!this._pointerState)this._hideTip()});",
  ],
  [
    "pointer lifecycle",
    "  _pointer(ev){\n    if(!this._geometry||!this._end)return;",
    "  _pointerDown(ev){this._pointerState={id:ev.pointerId,x:ev.clientX,y:ev.clientY,moved:false};this._pointer(ev)}\n  _pointerMove(ev){if(this._pointerState?.id===ev.pointerId){if(Math.hypot(ev.clientX-this._pointerState.x,ev.clientY-this._pointerState.y)>6)this._pointerState.moved=true;this._pointer(ev);return}if(!this._pinned&&ev.pointerType!=='touch')this._pointer(ev)}\n  _pointerUp(ev){const state=this._pointerState;if(!state||state.id!==ev.pointerId)return;this._pointerState=null;if(!state.moved){if(this._pinned){this._pinned=false;this._hideTip()}else{this._pointer(ev);this._pinned=true}}else{this._pinned=false;if(ev.pointerType==='touch')this._hideTip()}}\n  _pointer(ev){\n    if(!this._geometry||!this._end)return;",
  ],
]);

await apply("src/components/device-discovery.js", [
  [
    "interaction import",
    '  escapeHtml,\n  navigateTo,',
    '  escapeHtml,\n  interaction,\n  navigateTo,',
  ],
  [
    "interaction state",
    '    this._accessState = null;\n  }',
    '    this._accessState = null;\n    this._interactions = [];\n  }',
  ],
  [
    "disconnect interactions",
    '  disconnectedCallback() {\n    clearInterval(this.timer);',
    '  disconnectedCallback() {\n    for (const handle of this._interactions) handle.destroy();\n    this._interactions = [];\n    clearInterval(this.timer);',
  ],
  [
    "functional row style",
    '      .row .icon { background: var(--secondary-background-color); }',
    '      .row .icon { background: var(--secondary-background-color); }\n      button.row{appearance:none;width:100%;border-right:0;border-bottom:0;border-left:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}\n      button.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}',
  ],
  [
    "render state cleanup",
    '  renderState(kind) {\n    const content = {',
    '  renderState(kind) {\n    for (const handle of this._interactions) handle.destroy();\n    this._interactions = [];\n    const content = {',
  ],
  [
    "retry interaction",
    '    this.shadowRoot.querySelector(".retry")?.addEventListener("click", () =>\n      this.load(),\n    );',
    '    const retry = this.shadowRoot.querySelector(".retry");\n    if (retry) this._interactions.push(interaction(retry, { primary: () => this.load(), feedback: true }));',
  ],
  [
    "render cleanup",
    '  render(flows) {\n    const limit =',
    '  render(flows) {\n    for (const handle of this._interactions) handle.destroy();\n    this._interactions = [];\n    const limit =',
  ],
  [
    "whole row target",
    '        (flow) => `<div class="row">',
    '        (flow) => `${this.c?.demo ? `<div class="row">` : `<button class="row" type="button" aria-label="Review ${this.escape(this.name(flow))}">`}`',
  ],
  [
    "review visual and row close",
    '          <button class="review" type="button">Review</button>\n        </div>`,',
    '          <span class="review" aria-hidden="true">Review</span>\n        ${this.c?.demo ? `</div>` : `</button>`}` ,',
  ],
  [
    "demo refresh semantics",
    '            <button class="refresh" type="button" aria-label="Refresh discovery">\n              <ha-icon icon="mdi:refresh"></ha-icon>\n            </button>',
    '            ${this.c?.demo ? `<span class="refresh" aria-hidden="true"><ha-icon icon="mdi:refresh"></ha-icon></span>` : `<button class="refresh" type="button" aria-label="Refresh discovery"><ha-icon icon="mdi:refresh"></ha-icon></button>`}',
  ],
  [
    "refresh and row interactions",
    '    this.shadowRoot.querySelector(".refresh")?.addEventListener("click", () =>\n      this.load(),\n    );\n    this.shadowRoot.querySelectorAll(".review").forEach((button) =>\n      button.addEventListener("click", () => this.navigate()),\n    );',
    '    const refresh = this.shadowRoot.querySelector("button.refresh");\n    if (refresh) this._interactions.push(interaction(refresh, { primary: () => this.load(), feedback: true }));\n    for (const row of this.shadowRoot.querySelectorAll("button.row")) this._interactions.push(interaction(row, { primary: () => this.navigate(), feedback: true }));',
  ],
]);

await apply("src/components/home-overview.js", [
  [
    "shared helpers",
    'class ComponentHomeOverviewV4 extends HTMLElement',
    'const {interaction,openMoreInfo}=globalThis.__HA_COMPONENT_LIBRARY_SHARED__;class ComponentHomeOverviewV4 extends HTMLElement',
  ],
  [
    "weather interaction state",
    'this.timer=null;this.shadowRoot.innerHTML=',
    'this.timer=null;this._weatherInteraction=null;this.shadowRoot.innerHTML=',
  ],
  [
    "remove direct weather click",
    "this.sections=this.shadowRoot.querySelector('.sections');this.shadowRoot.querySelector('.weather').onclick=()=>this.moreWeather()",
    "this.sections=this.shadowRoot.querySelector('.sections');this._bindWeather()",
  ],
  [
    "bind weather on connect",
    'connectedCallback(){this.tick();this.ensure()}',
    'connectedCallback(){this._bindWeather();this.tick();this.ensure()}',
  ],
  [
    "weather cleanup",
    'disconnectedCallback(){clearTimeout(this.timer)}',
    'disconnectedCallback(){this._weatherInteraction?.destroy();this._weatherInteraction=null;clearTimeout(this.timer)}',
  ],
  [
    "weather helper",
    "getCardSize(){return 12}tick()",
    "getCardSize(){return 12}_bindWeather(){if(this._weatherInteraction)return;this._weatherInteraction=interaction(this.shadowRoot.querySelector('.weather'),{primary:()=>this.moreWeather(),feedback:true})}tick()",
  ],
  [
    "shared more info",
    "moreWeather(){if(this.c?.weather_entity)this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:this.c.weather_entity}}))}",
    "moreWeather(){if(this.c?.weather_entity)openMoreInfo(this,this.c.weather_entity)}",
  ],
]);

await apply("src/components/wled-controller.js", [
  [
    "coalescer imports",
    '  interaction,\n  openMoreInfo,',
    '  createRequestCoalescer,\n  interaction,\n  openMoreInfo,',
  ],
  [
    "state confirmation import",
    '  registerCard,\n  WLED_HD,',
    '  registerCard,\n  waitForEntityState,\n  WLED_HD,',
  ],
  [
    "brightness state",
    "this.c=null;this.h=null;this.d=null;this.b=null;this.unsub=null;this.loading=false;this.sheetSignature='';this._interactionHandles=[];",
    "this.c=null;this.h=null;this.d=null;this.b=null;this.unsub=null;this.loading=false;this.sheetSignature='';this._interactionHandles=[];this._brightnessCoalescer=null;this._brightnessIntent=null;",
  ],
  [
    "confirmed power action",
    "interaction(this.power,{primary:()=>this.call('light','toggle',this.b?.main?[this.b.main]:[]),optimistic:",
    "interaction(this.power,{primary:()=>this.togglePower(),optimistic:",
  ],
  [
    "coalesced brightness input",
    "    this.brightness.oninput=()=>this.brightnessValue.textContent=this.pct(this.brightness.value);\n    this.brightness.onchange=()=>{const v=Number(this.brightness.value);v<=0?this.call('light','turn_off',this.b?.main?[this.b.main]:[]):this.call('light','turn_on',this.b?.main?[this.b.main]:[],{brightness:v})};",
    "    this.brightness.oninput=()=>{const v=Number(this.brightness.value);this._brightnessIntent=v;this.brightnessValue.textContent=this.pct(v);this.brightnessCoalescer().request(v)};\n    this.brightness.onchange=()=>{};",
  ],
  [
    "disconnect coalescer",
    "disconnectedCallback(){for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];this.unsub?.();this.unsub=null}",
    "disconnectedCallback(){for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];this._brightnessCoalescer?.destroy();this._brightnessCoalescer=null;this._brightnessIntent=null;this.unsub?.();this.unsub=null}",
  ],
  [
    "brightness render intent",
    "brightness=on?Number(main?.attributes?.brightness??0):0,effect=",
    "reportedBrightness=on?Number(main?.attributes?.brightness??0):0,brightness=this._brightnessIntent??reportedBrightness,effect=",
  ],
  [
    "controller methods",
    "  pct(v){const n=Number(v);return Number.isFinite(n)?`${Math.round(n/255*100)}%`:'—'}",
    "  pct(v){const n=Number(v);return Number.isFinite(n)?`${Math.round(n/255*100)}%`:'—'}\n  async togglePower(){const id=this.b?.main,state=id?this.h?.states?.[id]:null;if(!id||!state)return;const wasOn=state.state==='on';await this.h.callService('light','toggle',{entity_id:id});await waitForEntityState(()=>this.h,id,value=>value===(wasOn?'off':'on'),{timeout:9000})}\n  brightnessCoalescer(){if(this._brightnessCoalescer)return this._brightnessCoalescer;this._brightnessCoalescer=createRequestCoalescer(async value=>{const id=this.b?.main;if(!id)return;if(value<=0)await this.h.callService('light','turn_off',{entity_id:id});else await this.h.callService('light','turn_on',{entity_id:id,brightness:value});await waitForEntityState(()=>this.h,id,(state,obj)=>value<=0?state==='off':state==='on'&&Math.abs(Number(obj?.attributes?.brightness??-999)-value)<=2,{timeout:7000})},{onSuccess:value=>{if(this._brightnessIntent===value)this._brightnessIntent=null;this.render()},onError:()=>{this._brightnessIntent=null;this.render()}});return this._brightnessCoalescer}",
  ],
]);

console.log("Second one-shot interaction migrations complete.");
