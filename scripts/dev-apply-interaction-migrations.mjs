import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const apply = async (file, transforms) => {
  const path = resolve(root, file);
  let source = await readFile(path, "utf8");
  let changed = false;
  for (const [label, from, to] of transforms) {
    if (source.includes(to)) continue;
    if (from instanceof RegExp) {
      if (!from.test(source)) throw new Error(`${file}: migration target not found: ${label}`);
      source = source.replace(from, to);
    } else {
      if (!source.includes(from)) throw new Error(`${file}: migration target not found: ${label}`);
      source = source.replace(from, to);
    }
    changed = true;
  }
  if (changed) {
    await writeFile(path, source, "utf8");
    console.log(`Migrated ${file}`);
  } else {
    console.log(`Already migrated ${file}`);
  }
};

await apply("src/components/split-system-controller.js", [
  [
    "shared interaction import",
    'const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
    'const { interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "interaction handles",
    'this.C=null,this.q=null,this.L=null}',
    'this.C=null,this.q=null,this.L=null,this._interactionHandles=[]}',
  ],
  [
    "disconnect cleanup",
    'disconnectedCallback(){clearTimeout(this._)',
    'disconnectedCallback(){for(const t of this._interactionHandles)t.destroy();this._interactionHandles=[];clearTimeout(this._)',
  ],
  [
    "top-level control bindings",
    'this.$.idn.addEventListener("click",()=>this.B()),this.$.pw.addEventListener("click",()=>this.G()),this.$.decrease.addEventListener("click",()=>this.W(-1)),this.$.increase.addEventListener("click",()=>this.W(1)),this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>t.addEventListener("click",()=>this.U(t.dataset.panel,t))),',
    'this._interactionHandles.push(interaction(this.$.idn,{primary:()=>this.B(),feedback:!0}),interaction(this.$.pw,{primary:()=>this.G(),optimistic:!1,feedback:!0}),interaction(this.$.decrease,{primary:()=>this.W(-1),repeat:{delay:350,interval:120,coalesce:!0},feedback:!0}),interaction(this.$.increase,{primary:()=>this.W(1),repeat:{delay:350,interval:120,coalesce:!0},feedback:!0})),this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>this._interactionHandles.push(interaction(t,{primary:()=>this.U(t.dataset.panel,t),feedback:!0}))),',
  ],
]);

await apply("src/components/favourites.js", [
  [
    "shared interaction import",
    'const { escapeHtml, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
    'const { escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "optimistic and interaction state",
    'this._editorStorageSignature="",this._connection=null}',
    'this._editorStorageSignature="",this._connection=null,this._interactionHandles=[],this._optimistic=new Map}',
  ],
  [
    "disconnect interaction cleanup",
    'disconnectedCallback(){clearTimeout(this._noticeTimer)',
    'disconnectedCallback(){for(const t of this._interactionHandles)t.destroy();this._interactionHandles=[];this._optimistic.clear();clearTimeout(this._noticeTimer)',
  ],
  [
    "render interaction cleanup",
    '_renderGrid(){if(!this.$?.grid||!this.config)return;',
    '_renderGrid(){for(const t of this._interactionHandles)t.destroy();this._interactionHandles=[];if(!this.$?.grid||!this.config)return;',
  ],
  [
    "optimistic active class",
    'this._isActive(i)?"active":""',
    '(this._optimistic.has(e)?this._optimistic.get(e):this._isActive(i))?"active":""',
  ],
  [
    "optimistic aria pressed",
    'String("on"===i.state?.state)',
    'String(this._optimistic.has(e)?this._optimistic.get(e):"on"===i.state?.state)',
  ],
  [
    "main favourite interaction",
    'd.addEventListener("click",()=>this._activate(e)),c.append(d)',
    'this._interactionHandles.push(interaction(d,{primary:()=>this._activate(e),hold:()=>this._moreInfo(i.entry?.entity_id),optimistic:!1,repeat:!1,feedback:!0})),c.append(d)',
  ],
  [
    "media quick interaction",
    't.addEventListener("click",()=>this._mediaAction(e)),c.append(t)',
    'this._interactionHandles.push(interaction(t,{primary:()=>this._mediaAction(e),optimistic:!1,repeat:!1,feedback:!0})),c.append(t)',
  ],
  [
    "preview-only demo semantics",
    '<button class="main" type="button" aria-disabled="true"><span class="icon"><ha-icon icon="${this._escape(t.icon||"mdi:star-outline")}"></ha-icon></span><span class="copy"><div class="name">${this._escape(t.title||"Favourite")}</div><div class="state">${this._escape(t.state||"Supporting state")}</div></span></button>',
    '<div class="main"><span class="icon"><ha-icon icon="${this._escape(t.icon||"mdi:star-outline")}"></ha-icon></span><span class="copy"><div class="name">${this._escape(t.title||"Favourite")}</div><div class="state">${this._escape(t.state||"Supporting state")}</div></span></div>',
  ],
  [
    "toggle optimistic intent",
    'const s=e.state.state;this._setPending(t,"on"===s?"Turning off…":"Turning on…")',
    'const s=e.state.state;this._optimistic.set(t,"on"!==s),this._setPending(t,"on"===s?"Turning off…":"Turning on…")',
  ],
  [
    "media optimistic intent",
    'const i=e.entry.entity_id,s="playing"===e.state.state,r=s?"media_pause":"media_play";this._setPending(t,s?"Pausing…":"Playing…")',
    'const i=e.entry.entity_id,s="playing"===e.state.state,r=s?"media_pause":"media_play";this._optimistic.set(t,!s),this._setPending(t,s?"Pausing…":"Playing…")',
  ],
  [
    "optimistic reconciliation",
    '_setFlash(t,e,i){this._pending.delete(t)',
    '_setFlash(t,e,i){this._optimistic.delete(t),this._pending.delete(t)',
  ],
]);

await apply("src/components/room-directory.js", [
  [
    "shared interaction helpers",
    'globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2;',
    'globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2,{interaction,navigateTo,openMoreInfo}=globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "session scroll state",
    'this._location=()=>this.syncHash();this._touch=null;',
    'this._location=()=>this.syncHash();this._touch=null;this._interactionHandles=[];this._scrollPositions=new Map;',
  ],
  [
    "reduced motion",
    '</style><ha-card><div class="head">',
    '</style><style>@media(prefers-reduced-motion:reduce){.sheet{transition:none}}</style><ha-card><div class="head">',
  ],
  [
    "open-view interaction",
    "this.shadowRoot.querySelector('.open-view').onclick=()=>this.openView();",
    "this._interactionHandles.push(interaction(this.shadowRoot.querySelector('.open-view'),{primary:()=>this.openView(),feedback:true}));",
  ],
  [
    "disconnect interactions",
    "disconnectedCallback(){this.unsub?.();this.unsub=null;",
    "disconnectedCallback(){for(const h of this._interactionHandles)h.destroy();this._interactionHandles=[];for(const b of this.tiles.values())b._interaction?.destroy?.();this.unsub?.();this.unsub=null;",
  ],
  [
    "navigation helper",
    "openView(){if(!this.c.navigation_path)return;history.pushState(null,'',this.c.navigation_path);window.dispatchEvent(new Event('location-changed'))}",
    "openView(){if(!this.c.navigation_path)return;navigateTo(this.c.navigation_path)}",
  ],
  [
    "room tile interaction",
    "b.onclick=()=>{const x=this.d?.areaMap?.get(a.area_id)||a;this.openRoom(x,true)};return b",
    "b._interaction=interaction(b,{primary:()=>{const x=this.d?.areaMap?.get(a.area_id)||a;return this.openRoom(x,true)},feedback:true});return b",
  ],
  [
    "destroy removed tile interaction",
    "if(!keep.has(id)){b.remove();this.tiles.delete(id)}",
    "if(!keep.has(id)){b._interaction?.destroy?.();b.remove();this.tiles.delete(id)}",
  ],
  [
    "save and restore room scroll",
    "async openRoom(a,writeHash=true){if(!a||!this.h)return;this.currentAreaId=a.area_id;",
    "async openRoom(a,writeHash=true){if(!a||!this.h)return;if(this.dialog.open&&this.currentAreaId)this._scrollPositions.set(this.currentAreaId,this.sheetBody.scrollTop);this.currentAreaId=a.area_id;",
  ],
  [
    "restore room scroll position",
    "this.sheetBody.scrollTop=0;this.sheet.style.transform='';",
    "this.sheetBody.scrollTop=this._scrollPositions.get(a.area_id)||0;this.sheet.style.transform='';",
  ],
  [
    "metric detail interaction",
    "b.onclick=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:s.entity_id}}));this.environment.append(b)",
    "this._interactionHandles.push(interaction(b,{primary:()=>openMoreInfo(this,s.entity_id),feedback:true}));this.environment.append(b)",
  ],
  [
    "save scroll on close",
    "closeRoom(clearHash=true){if(this.dialog.open)this.dialog.close();this.currentAreaId=null;",
    "closeRoom(clearHash=true){if(this.currentAreaId)this._scrollPositions.set(this.currentAreaId,this.sheetBody.scrollTop);if(this.dialog.open)this.dialog.close();this.currentAreaId=null;",
  ],
]);

await apply("src/components/wled-controller.js", [
  [
    "shared interaction import",
    'const {\n  openMoreInfo,',
    'const {\n  interaction,\n  openMoreInfo,',
  ],
  [
    "interaction handles",
    "this.c=null;this.h=null;this.d=null;this.b=null;this.unsub=null;this.loading=false;this.sheetSignature='';",
    "this.c=null;this.h=null;this.d=null;this.b=null;this.unsub=null;this.loading=false;this.sheetSignature='';this._interactionHandles=[];",
  ],
  [
    "power and identity interactions",
    "this.power.onclick=()=>this.call('light','toggle',this.b?.main?[this.b.main]:[]);\n    this.identity.onclick=()=>this.openAdvanced(false);\n    this.presetsBtn.onclick=()=>this.openAdvanced(true);\n    this.advanced.onclick=()=>this.openAdvanced(false);\n    this.colour.onclick=()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main);\n    this.nativeColour.onclick=()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main);\n    this.shadowRoot.querySelector('.close').onclick=()=>this.dialog.close();",
    "this._interactionHandles.push(\n      interaction(this.power,{primary:()=>this.call('light','toggle',this.b?.main?[this.b.main]:[]),optimistic:{capture:()=>this.head.classList.contains('on'),apply:()=>{const next=!this.head.classList.contains('on');this.head.classList.toggle('on',next);this.power.setAttribute('aria-pressed',String(next));this.statusEl.textContent=next?'Turning on…':'Turning off…'},rollback:previous=>{this.head.classList.toggle('on',previous);this.power.setAttribute('aria-pressed',String(previous));this.render()}},feedback:true}),\n      interaction(this.identity,{primary:()=>this.openAdvanced(false),hold:()=>this.moreInfo(this.b?.main),feedback:true}),\n      interaction(this.presetsBtn,{primary:()=>this.openAdvanced(true),feedback:true}),\n      interaction(this.advanced,{primary:()=>this.openAdvanced(false),feedback:true}),\n      interaction(this.colour,{primary:()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main),feedback:true}),\n      interaction(this.nativeColour,{primary:()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main),feedback:true}),\n      interaction(this.shadowRoot.querySelector('.close'),{primary:()=>this.dialog.close(),feedback:true}),\n    );",
  ],
  [
    "disconnect interaction cleanup",
    "disconnectedCallback(){this.unsub?.();this.unsub=null}",
    "disconnectedCallback(){for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];this.unsub?.();this.unsub=null}",
  ],
  [
    "power aria state",
    "this.power.disabled=!main;this.presetsBtn.disabled",
    "this.power.disabled=!main;this.power.setAttribute('aria-pressed',String(on));this.presetsBtn.disabled",
  ],
  [
    "preset interaction",
    "b.onclick=async()=>{await this.call('select','select_option',this.b?.preset?[this.b.preset]:[],{option:value});this.dialog.close()};",
    "b._interaction=interaction(b,{primary:async()=>{await this.call('select','select_option',this.b?.preset?[this.b.preset]:[],{option:value});this.dialog.close()},optimistic:'selection',feedback:true});",
  ],
]);

console.log("One-shot interaction migrations complete.");
