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

