/** EnergyHistoryCardV3 — reusable Solar dashboard history card. */
const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class EnergyHistoryCardV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._series={};this._loading=false;this._lastEnd=0;this._resizeObserver=null;this._resizeTimer=null;this._selectedDay=null;this._dayListener=e=>this._onDayChange(e)}
  setConfig(c){this.c={house_entity:'sensor.house_consumption_power',solar_entity:'sensor.total_solar_power',grid_entity:'sensor.refoss_smart_energy_monitor_em_channel_3_power',hours:24,bucket_minutes:10,calendar_day:false,day_channel:null,...(c||{})}}
  set hass(h){this.h=h;if(!this._built)this._build();this._scheduleFetch();this._render()}
  connectedCallback(){window.addEventListener('energy-day-selector-change',this._dayListener)}
  disconnectedCallback(){window.removeEventListener('energy-day-selector-change',this._dayListener);this._resizeObserver?.disconnect();clearTimeout(this._resizeTimer)}
  getCardSize(){return 7}
  _build(){
    this._built=true;
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:4px 5px 5px}.top{min-height:28px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 5px;margin:0}.meta{font-size:13px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.legend{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}.legend button{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:12px;font-weight:600;padding:3px 0;display:flex;align-items:center;gap:6px;cursor:pointer}.legend button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:5px}.swatch{width:17px;height:3px;border-radius:999px;display:inline-block}.house-swatch{background:var(--primary-color)}.solar-swatch{background:var(--warning-color,#f5b942)}.grid-swatch{background:var(--secondary-text-color)}.chart{position:relative;width:100%;height:clamp(400px,48vw,520px)}.chart svg{display:block;width:100%;height:100%;overflow:hidden;touch-action:none}.axis{fill:var(--secondary-text-color);font-size:11px;font-weight:500;font-family:inherit}.axis-small{fill:var(--secondary-text-color);font-size:10px;font-weight:600;font-family:inherit}.gridline{stroke:var(--divider-color);stroke-width:1;opacity:.58}.zero{stroke:var(--divider-color);stroke-width:1.35;opacity:.95}.house-line{fill:none;stroke:var(--primary-color);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.solar-line{fill:none;stroke:var(--warning-color,#f5b942);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.solar-fill{fill:color-mix(in srgb,var(--warning-color,#f5b942) 12%,transparent)}.grid-line{fill:none;stroke:var(--secondary-text-color);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.cursor{stroke:var(--secondary-text-color);stroke-width:1;stroke-dasharray:3 3;opacity:0;vector-effect:non-scaling-stroke}.cursor-dot{stroke:var(--card-background-color);stroke-width:2.4;opacity:0;vector-effect:non-scaling-stroke}.cursor-dot.house{fill:var(--primary-color)}.cursor-dot.solar{fill:var(--warning-color,#f5b942)}.cursor-dot.grid{fill:var(--secondary-text-color)}.tooltip{position:absolute;z-index:2;min-width:150px;padding:10px 11px;border-radius:11px;background:var(--card-background-color);border:1px solid var(--divider-color);box-shadow:0 7px 22px rgba(0,0,0,.2);pointer-events:none;opacity:0;transform:translate(-50%,-100%);font-size:12px;line-height:1.45}.tooltip.show{opacity:1}.tooltip-time{font-size:12.5px;font-weight:650;color:var(--primary-text-color);margin-bottom:5px}.tip-row{display:flex;justify-content:space-between;gap:16px;color:var(--secondary-text-color)}.tip-row b{font-weight:650;color:var(--primary-text-color)}.status{position:absolute;inset:0;display:grid;place-items:center;color:var(--secondary-text-color);font-size:13px;pointer-events:none}.status[hidden]{display:none}@media(max-width:700px){.wrap{padding:3px}.top{padding:0 4px}.legend{gap:9px}.legend button{font-size:10.5px}.meta{font-size:13px}.chart{height:400px}.axis{font-size:10px}.axis-small{font-size:9.5px}.tooltip{font-size:11.5px;min-width:140px;padding:9px 10px}}
</style><ha-card><div class="wrap"><div class="top"><div class="meta"></div><div class="legend"><button class="house-key" type="button"><span class="swatch house-swatch"></span>House</button><button class="solar-key" type="button"><span class="swatch solar-swatch"></span>Solar</button><button class="grid-key" type="button"><span class="swatch grid-swatch"></span>Grid</button></div></div><div class="chart"><svg role="img" aria-label="Household power history"></svg><div class="tooltip"></div><div class="status">Loading history…</div></div></div></ha-card>`;
    this.e={meta:this.shadowRoot.querySelector('.meta'),svg:this.shadowRoot.querySelector('svg'),tip:this.shadowRoot.querySelector('.tooltip'),status:this.shadowRoot.querySelector('.status'),chart:this.shadowRoot.querySelector('.chart')};
    this.shadowRoot.querySelector('.house-key').onclick=()=>this._more(this.c.house_entity);
    this.shadowRoot.querySelector('.solar-key').onclick=()=>this._more(this.c.solar_entity);
    this.shadowRoot.querySelector('.grid-key').onclick=()=>this._more(this.c.grid_entity);
    this.e.svg.addEventListener('pointermove',e=>this._pointer(e));
    this.e.svg.addEventListener('pointerleave',()=>this._hideTip());
    this.e.svg.addEventListener('pointerdown',e=>this._pointer(e));
    this._resizeObserver=new ResizeObserver(()=>{clearTimeout(this._resizeTimer);this._resizeTimer=setTimeout(()=>{this._hideTip();this._render()},40)});this._resizeObserver.observe(this.e.chart)
  }
  _more(entityId){openMoreInfo(this,entityId)}
  _onDayChange(event){
    if(!this.c?.calendar_day||!this.c.day_channel||event?.detail?.channel!==this.c.day_channel)return;
    const day=String(event.detail.day||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||day===this._selectedDay)return;
    this._selectedDay=day;this._lastRangeKey=null;this._series={};
    if(this.e){this.e.status.hidden=false;this.e.status.textContent='Loading history…';this._hideTip()}
    this._scheduleFetch()
  }
  _dayStart(day){
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day||''));
    if(!match)return null;
    const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    if(date.getFullYear()!==Number(match[1])||date.getMonth()!==Number(match[2])-1||date.getDate()!==Number(match[3]))return null;
    date.setHours(0,0,0,0);return date
  }
  _dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  _isToday(day){const now=new Date();now.setHours(0,0,0,0);return day===this._dayKey(now)}
  _dayLabel(time){const date=new Date(time),now=new Date();if(this._dayKey(date)===this._dayKey(now))return'Today';const options={weekday:'long',day:'numeric',month:'long'};if(date.getFullYear()!==now.getFullYear())options.year='numeric';return date.toLocaleDateString('en-AU',options)}
  _range(){
    if(this.c.calendar_day){const today=new Date();today.setHours(0,0,0,0);let start=this._dayStart(this._selectedDay)||today;if(start>today)start=today;const end=new Date(start);end.setDate(end.getDate()+1);return{start:start.getTime(),end:end.getTime(),isToday:start.getTime()===today.getTime()}}
    const bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,end=Math.floor(Date.now()/bucket)*bucket,hours=Math.max(1,Number(this.c.hours)||24);return{start:end-hours*3600000,end,isToday:false}
  }
  _rangeKey(r){return `${r.start}:${r.end}:${r.isToday?Math.floor(Date.now()/300000):'fixed'}`}
  _scheduleFetch(){const r=this._range(),key=this._rangeKey(r);if(this._loading||key===this._lastRangeKey)return;this._fetch(r,key)}
  async _fetch(range,key){
    if(!this.h)return;this._loading=true;this.e.status.hidden=false;this.e.status.textContent='Loading history…';
    try{
      const result=await this.h.callWS({type:'recorder/statistics_during_period',start_time:new Date(range.start).toISOString(),end_time:new Date(range.end).toISOString(),statistic_ids:[this.c.house_entity,this.c.solar_entity,this.c.grid_entity],period:'5minute',types:['mean']});
      if(key!==this._rangeKey(this._range())){this._loading=false;this._scheduleFetch();return}
      this._series={house:this._bucket(result?.[this.c.house_entity]||[]),solar:this._bucket(result?.[this.c.solar_entity]||[]),grid:this._bucket(result?.[this.c.grid_entity]||[])};
      this._start=range.start;this._end=range.end;this._lastRangeKey=key;
      const hasData=Object.values(this._series).some(series=>series.length);
      this.e.status.hidden=hasData;
      if(!hasData)this.e.status.textContent='No recorded data for this day'
    }catch(err){this._series={};this.e.status.hidden=false;this.e.status.textContent='History unavailable'}
    this._loading=false;this._render();this._scheduleFetch()
  }
  _bucket(rows){
    const ms=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,m=new Map();
    for(const row of rows){const t=Number(row.start),v=Number(row.mean);if(!Number.isFinite(t)||!Number.isFinite(v))continue;const b=Math.floor(t/ms)*ms,x=m.get(b)||{sum:0,count:0};x.sum+=v;x.count+=1;m.set(b,x)}
    return [...m.entries()].map(([t,x])=>({t,v:x.sum/x.count})).sort((a,b)=>a.t-b.t)
  }
  _fmt(v){const a=Math.abs(v);if(a>=10000)return`${(v/1000).toFixed(0)} kW`;if(a>=1000)return`${(v/1000).toFixed(a>=5000?0:1)} kW`;return`${Math.round(v)} W`}
  _fmtExact(v){return Number.isFinite(v)?`${Math.round(v).toLocaleString('en-AU')} W`:'—'}
  _time(t){return new Date(t).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
  _tickTime(t){const d=new Date(t);return d.getMinutes()===0?d.toLocaleTimeString('en-AU',{hour:'numeric'}):this._time(t)}
  _niceMax(v){if(v<=0)return1000;const mag=10**Math.floor(Math.log10(v)),n=v/mag;const nice=n<=1?1:n<=2?2:n<=5?5:10;return nice*mag}
  _seriesValue(series,t){if(!series?.length)return null;let best=null,dist=Infinity;for(const p of series){const d=Math.abs(p.t-t);if(d<dist){dist=d;best=p}}return dist<=6*60000?best.v:null}
  _paths(series,x,y,baseline=null){
    const parts=[];let fill='',last=null,segment=[];const flush=()=>{if(!segment.length)return;const d=segment.map((p,i)=>`${i?'L':'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');parts.push(d);if(baseline!==null){const first=segment[0],end=segment[segment.length-1];fill+=`${d} L${x(end.t).toFixed(1)},${baseline.toFixed(1)} L${x(first.t).toFixed(1)},${baseline.toFixed(1)} Z `}segment=[]};
    for(const p of series||[]){if(last!==null&&p.t-last>15*60000)flush();segment.push(p);last=p.t}flush();return{line:parts.join(' '),fill:fill.trim()}
  }
  _render(){
    if(!this.e||!this._end)return;
    const house=this._series.house||[],solar=this._series.solar||[],grid=this._series.grid||[];
    if(!house.length&&!solar.length&&!grid.length)return;
    const dayLabel=this.c.calendar_day?this._dayLabel(this._start):null;
    this.e.meta.textContent=dayLabel?`${dayLabel} · ${this.c.bucket_minutes}-minute average`:`${this.c.bucket_minutes}-minute average`;
    this.e.svg.setAttribute('aria-label',dayLabel?`${dayLabel} household power history from midnight to midnight`:'Household power history');
    const rect=this.e.chart.getBoundingClientRect(),W=Math.max(320,Math.round(rect.width||800)),H=Math.max(340,Math.round(rect.height||420));
    this.e.svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const L=W<520?48:58,R=8,T=6,mainB=Math.round(H*.70),axisY=mainB+20,gridT=axisY+18,gridB=H-18,x0=L,x1=W-R,start=this._start,end=this._end;
    const x=t=>x0+(t-start)/(end-start)*(x1-x0);
    const mainValues=[...house,...solar].map(p=>Math.max(0,p.v)),yMax=this._niceMax(Math.max(1,...mainValues)*1.06),y=v=>mainB-(Math.max(0,v)/yMax)*(mainB-T);
    const gridAbs=Math.max(100,...grid.map(p=>Math.abs(p.v))),gridMax=this._niceMax(gridAbs*1.08),gridZero=(gridT+gridB)/2,yg=v=>gridZero-(v/gridMax)*((gridB-gridT)/2);
    const hp=this._paths(house,x,y),sp=this._paths(solar,x,y,mainB),gp=this._paths(grid,x,yg);
    let html='';
    for(let i=0;i<=4;i++){const v=yMax*(1-i/4),yy=T+(mainB-T)*(i/4);html+=`<line class="gridline" x1="${x0}" y1="${yy}" x2="${x1}" y2="${yy}"></line><text class="axis" x="${x0-8}" y="${yy+4}" text-anchor="end">${this._fmt(v)}</text>`}
    const ticks=W<520?4:W<820?6:8;
    for(let i=0;i<=ticks;i++){const t=start+(end-start)*i/ticks,xx=x(t);html+=`<text class="axis" x="${xx}" y="${axisY}" text-anchor="${i===0?'start':i===ticks?'end':'middle'}">${this._tickTime(t)}</text>`}
    html+=`<line class="zero" x1="${x0}" y1="${gridZero}" x2="${x1}" y2="${gridZero}"></line><text class="axis-small" x="${x1-2}" y="${gridT+10}" text-anchor="end">Import</text><text class="axis-small" x="${x1-2}" y="${gridB-3}" text-anchor="end">Export</text>`;
    if(sp.fill)html+=`<path class="solar-fill" d="${sp.fill}"></path>`;
    if(sp.line)html+=`<path class="solar-line" d="${sp.line}"></path>`;
    if(hp.line)html+=`<path class="house-line" d="${hp.line}"></path>`;
    if(gp.line)html+=`<path class="grid-line" d="${gp.line}"></path>`;
    html+=`<line class="cursor" x1="0" y1="${T}" x2="0" y2="${gridB}"></line><circle class="cursor-dot house" r="4.5"></circle><circle class="cursor-dot solar" r="4.5"></circle><circle class="cursor-dot grid" r="4"></circle>`;
    this.e.svg.innerHTML=html;this._geometry={W,H,L,R,T,mainB,gridT,gridB,x0,x1,start,end,x,y,yg}
  }
  _pointer(ev){
    if(!this._geometry||!this._end)return;
    const rect=this.e.svg.getBoundingClientRect(),g=this._geometry,px=(ev.clientX-rect.left)*(g.W/rect.width),clamped=Math.max(g.x0,Math.min(g.x1,px)),ratio=(clamped-g.x0)/(g.x1-g.x0),rawT=g.start+ratio*(g.end-g.start),bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,t=Math.round(rawT/bucket)*bucket;
    const hv=this._seriesValue(this._series.house,t),sv=this._seriesValue(this._series.solar,t),gv=this._seriesValue(this._series.grid,t),xx=g.x(t),cursor=this.e.svg.querySelector('.cursor');cursor.setAttribute('x1',xx);cursor.setAttribute('x2',xx);cursor.style.opacity='1';
    const setDot=(cls,v,yy)=>{const d=this.e.svg.querySelector(`.cursor-dot.${cls}`);if(v===null){d.style.opacity='0';return}d.setAttribute('cx',xx);d.setAttribute('cy',yy(v));d.style.opacity='1'};setDot('house',hv,g.y);setDot('solar',sv,g.y);setDot('grid',gv,g.yg);
    const gridLabel=gv===null?'Grid':gv>=0?'Imported':'Exported';
    this.e.tip.innerHTML=`<div class="tooltip-time">${this._time(t)}</div><div class="tip-row"><span>House</span><b>${this._fmtExact(hv)}</b></div><div class="tip-row"><span>Solar</span><b>${this._fmtExact(sv)}</b></div><div class="tip-row"><span>${gridLabel}</span><b>${this._fmtExact(gv===null?null:Math.abs(gv))}</b></div>`;
    const localX=(xx/g.W)*rect.width,peak=Math.min(hv===null?Infinity:g.y(hv),sv===null?Infinity:g.y(sv),g.mainB),localY=(Math.max(g.T,peak-8)/g.H)*rect.height;this.e.tip.style.left=`${localX}px`;this.e.tip.style.top=`${Math.max(66,localY)}px`;this.e.tip.classList.add('show')
  }
  _hideTip(){if(!this.e)return;this.e.tip.classList.remove('show');for(const el of this.e.svg.querySelectorAll('.cursor,.cursor-dot'))el.style.opacity='0'}
}
registerCard({ type: "energy-history-card-v3", element: EnergyHistoryCardV3, name: "Energy History", description: "Dense readable power history supporting rolling or local calendar-day ranges using completed 10-minute averages and a signed grid strip." });
