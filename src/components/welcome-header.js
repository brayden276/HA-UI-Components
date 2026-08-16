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
