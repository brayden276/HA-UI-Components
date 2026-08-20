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
