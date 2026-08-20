(()=>{
customElements.whenDefined('component-room-directory-v4').then(()=>{
  const Card=customElements.get('component-room-directory-v4');
  const P=Card?.prototype;
  if(!P||P.__presenceGlowV1)return;
  P.__presenceGlowV1=true;

  P._roomPresence=function(area){
    const items=typeof this.entries==='function'?this.entries(area.area_id):[];
    return items.some(({e,s})=>{
      if(!e?.entity_id?.startsWith('binary_sensor.')||s?.state!=='on')return false;
      const cls=String(s.attributes?.device_class||e.device_class||'').toLowerCase();
      const identity=(e.entity_id+' '+String(e.name||e.original_name||'')+' '+String(s.attributes?.friendly_name||'')).toLowerCase();
      return cls==='occupancy'||cls==='presence'||identity.includes('presence')||identity.includes('occupancy')||identity.includes('mmwave');
    });
  };

  P._roomActive=function(area){
    const items=typeof this.entries==='function'?this.entries(area.area_id):[];
    const HD2=globalThis.__homeDashboardV2;
    return this._roomPresence(area)||items.some(({e,s})=>HD2?.isActive?.(e,s)===true);
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
    button.style.transition='box-shadow 220ms ease, border-left-color 220ms ease';
    if(!this._roomActive(area)){
      button.style.removeProperty('box-shadow');
      button.style.removeProperty('border-left-color');
      button.removeAttribute('data-presence');
      return;
    }
    const hue=this._roomPresenceHue(area);
    button.setAttribute('data-presence','true');
    if(button.classList.contains('warning')||button.classList.contains('critical')){
      button.style.removeProperty('border-left-color');
    }else{
      button.style.borderLeftColor=`hsl(${hue} 82% 68% / .72)`;
    }
    button.style.boxShadow=`inset 0 0 0 1px hsl(${hue} 82% 68% / .46), 0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
  };
});
})();
