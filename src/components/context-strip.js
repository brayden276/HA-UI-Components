/** ComponentContextStripV3 — reusable Home Assistant dashboard card. */
const { escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentContextStripV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'})}
  setConfig(c){this.c={left_text:'Left context',center_1_label:'Primary metric',center_1_value:'00%',center_2_label:'Secondary metric',center_2_value:'00%',center_3_label:'Tertiary metric',center_3_value:'00%',right_text:'Right context',...(c||{})};this._render()}
  set hass(h){}
  getCardSize(){return 1}
  _render(){this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;color:inherit}
button:active{transform:scale(.997)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.mid{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.item{display:flex;align-items:baseline;gap:4px}.lab{font-weight:500}.val{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.mid{gap:10px}.item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.mid{gap:7px}}
</style><ha-card><button type="button"><span class="phase">${escapeHtml(this.c.left_text)}</span><span class="mid">${[1,2,3].map(i=>`<span class="item"><span class="lab">${escapeHtml(this.c[`center_${i}_label`])}</span><span class="val">${escapeHtml(this.c[`center_${i}_value`])}</span></span>`).join('')}</span><span class="event">${escapeHtml(this.c.right_text)}</span></button></ha-card>`}
}
registerCard({ type: "component-context-strip-v3", element: ComponentContextStripV3, name: "Context Strip", description: "Reusable context and metric strip component." });
