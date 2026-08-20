/** SolarDaylightCardV7 — reusable Solar dashboard daylight context card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class SolarDaylightCardV7 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._forecast=[];this._lastFetch=0;this._pending=false}
  setConfig(c){this.c=c||{};this.sun=this.c.sun_entity||'sun.sun';this.weather=this.c.weather_entity||'weather.forecast_home'}
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
    if(!valid){this.p.textContent='Sun state unavailable';this.ev.textContent=''}else if(s.state==='above_horizon'){const elevation=this._num(s.attributes?.elevation,0),sunset=this._time(s.attributes?.next_setting);this.p.textContent=`Sun ${Math.round(elevation)}°`;this.ev.textContent=sunset?`Sunset ${sunset}`:'Daylight'}else{const sunrise=this._time(s.attributes?.next_rising);this.p.textContent='Night';this.ev.textContent=sunrise?`Sunrise ${sunrise}`:'Before sunrise'}
    const now=this._num(w?.attributes?.cloud_coverage),c4=this._at(4),c8=this._at(8);this.nowEl.textContent=this._cloud(now);this.p4.textContent=this._cloud(c4);this.p8.textContent=this._cloud(c8);
    this.b.setAttribute('aria-label',`${this.p.textContent}, cloud coverage ${this.nowEl.textContent}, plus 4 hours ${this.p4.textContent}, plus 8 hours ${this.p8.textContent}, ${this.ev.textContent}. Open sun details.`)
  }
  async _fetch(){
    if(!this.h||this._pending)return;const now=Date.now();if(this._lastFetch&&now-this._lastFetch<30*60*1000)return;this._lastFetch=now;this._pending=true;
    try{
      const r=await this.h.callWS({type:'call_service',domain:'weather',service:'get_forecasts',service_data:{type:'hourly'},target:{entity_id:this.weather},return_response:true});
      const x=this._forecastPayload(r);this._forecast=Array.isArray(x?.forecast)?x.forecast.slice(0,24):[]
    }catch(_){this._forecast=[]}
    this._pending=false;this._update()
  }
}
registerCard({ type: "solar-daylight-card-v7", element: SolarDaylightCardV7, name: "Solar Daylight Context", description: "Full-width sun context with centred current and forecast cloud coverage." });
