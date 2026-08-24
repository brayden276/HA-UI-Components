/** SolarDaylightCardV7 — reusable Solar dashboard daylight context card. */
const { formatTime, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class SolarDaylightCardV7 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._forecast=[];this._lastFetch=0;this._pending=false;this._updateSignature='';this._interaction=null}
  setConfig(c){const weather=(c||{}).weather_entity||'weather.forecast_home';this.c=c||{};this.sun=this.c.sun_entity||'sun.sun';if(weather!==this.weather){this._forecast=[];this._lastFetch=0}this.weather=weather;this._updateSignature=''}
  set hass(h){this.h=h;if(!this._built)this._build();this._update();this._fetch()}
  connectedCallback(){this._bindInteraction();this._fetch()}
  disconnectedCallback(){this._interaction?.destroy();this._interaction=null}
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
    this.b=this.shadowRoot.querySelector('button');this.p=this.shadowRoot.querySelector('.phase');this.ev=this.shadowRoot.querySelector('.event');this.nowEl=this.shadowRoot.querySelector('.now');this.p4=this.shadowRoot.querySelector('.plus4');this.p8=this.shadowRoot.querySelector('.plus8');this._bindInteraction()
  }
  _bindInteraction(){if(!this.b||this._interaction)return;this._interaction=interaction(this.b,{primary:()=>this._more(this.sun),hold:()=>this._more(this.weather),optimistic:false,repeat:false,feedback:true})}
  _more(entityId){openMoreInfo(this,entityId)}
  _num(v,f=null){if(v===null||v===undefined||v==='')return f;const n=Number(v);return Number.isFinite(n)?n:f}
  _time(v){if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':formatTime(this.h,d)}
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
    this.b.setAttribute('aria-label',`${phase}, cloud coverage ${nowText}, plus 4 hours ${plus4}, plus 8 hours ${plus8}, ${event}. Tap for sun details; hold for weather details.`)
  }
  async _fetch(){
    if(!this.h||this._pending)return;const now=Date.now();if(now<(this._retryAt||0)||this._lastFetch&&now-this._lastFetch<30*60*1000)return;this._pending=true;
    const weather=this.weather;
    try{
      const r=await this.h.callWS({type:'call_service',domain:'weather',service:'get_forecasts',service_data:{type:'hourly'},target:{entity_id:this.weather},return_response:true});
      const x=this._forecastPayload(r);
      if(weather===this.weather){this._forecast=Array.isArray(x?.forecast)?x.forecast.slice(0,24):[];this._lastFetch=Date.now();this._failures=0;this._retryAt=0}
    }catch(_){if(weather===this.weather){this._failures=(this._failures||0)+1;this._retryAt=Date.now()+Math.min(5*60*1000,15000*2**(this._failures-1))}}
    this._pending=false;
    if(weather===this.weather)this._update();else this._fetch()
  }
}
registerCard({ type: "solar-daylight-card-v7", element: SolarDaylightCardV7, name: "Solar Daylight Context", description: "Full-width sun context with centred current and forecast cloud coverage." });
