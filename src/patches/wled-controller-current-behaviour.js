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

