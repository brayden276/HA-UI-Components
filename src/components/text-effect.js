/** ComponentTextEffectV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentTextEffectV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.settleTimer = null;
  }

  setConfig(c) {
    if (!c?.text) throw new Error("text is required");
    this.c = {
      effect: "stamp",
      description: "",
      icon: null,
      speed: 2.6,
      ...c,
    };
    this.render();
  }

  set hass(h) { this.h = h; }

  connectedCallback() {
    const row = this.shadowRoot.querySelector(".row");
    if (this.c && !this.settleTimer && row && !row.classList.contains("settled")) this.render();
  }

  disconnectedCallback() {
    clearTimeout(this.settleTimer);
    this.settleTimer = null;
  }

  getCardSize() { return 1; }

  render() {
    clearTimeout(this.settleTimer);
    this.settleTimer = null;

    const c = this.c;
    const effect = ["stamp", "typewave", "overprint", "signal", "rainbow_stamp"].includes(c.effect) ? c.effect : "stamp";
    const speed = Math.max(1.6, Math.min(6, Number(c.speed) || 2.6));
    const text = escapeHtml(c.text);
    const icon = c.icon ? `<span class="icon"><ha-icon icon="${escapeHtml(c.icon)}"></ha-icon></span>` : "";

    this.shadowRoot.innerHTML = `<style>
:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
.row{min-height:70px;padding:12px 14px;display:grid;grid-template-columns:${c.icon?'40px ':''}minmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{position:relative;display:inline-block;max-width:100%;font-size:13px;line-height:1.25;font-weight:650;letter-spacing:-.005em;white-space:nowrap;color:var(--primary-text-color)}.base{position:relative;z-index:2}.desc{margin-top:4px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stamp .title{padding-bottom:4px}.stamp .title:after{content:'';position:absolute;z-index:1;left:0;bottom:0;width:100%;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent 0%,var(--primary-color) 42%,var(--primary-color) 58%,transparent 100%);background-size:220% 100%;opacity:.72;animation:stampSweep ${speed}s cubic-bezier(.4,0,.2,1) infinite}
.typewave .title:after{content:attr(data-text);position:absolute;z-index:3;inset:0;color:var(--primary-color);clip-path:inset(0 100% 0 0);animation:textSweep ${speed}s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
.overprint .title:after{content:attr(data-text);position:absolute;z-index:1;inset:0;color:var(--primary-color);opacity:0;filter:blur(.15px);animation:softPrint ${speed}s ease-in-out infinite;pointer-events:none}
.signal .title{padding-left:16px}.signal .title:before{content:'';position:absolute;left:1px;top:50%;width:7px;height:7px;margin-top:-3.5px;border:1.5px solid var(--primary-color);border-radius:2px;transform:rotate(45deg);opacity:.45;animation:signalPulse ${speed}s cubic-bezier(.4,0,.2,1) infinite}.signal .title:after{content:'';position:absolute;left:3px;top:50%;width:3px;height:3px;margin-top:-1.5px;border-radius:50%;background:var(--primary-color);animation:signalDot ${speed}s cubic-bezier(.4,0,.2,1) infinite}
.rainbow_stamp .title{padding-bottom:4px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2,#ff375f);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:rainbow ${speed}s linear infinite}.rainbow_stamp .title:after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:999px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2);background-size:240% 100%;opacity:.55;animation:rainbow ${speed}s linear infinite}
@keyframes stampSweep{0%{background-position:210% 0;opacity:0}15%{opacity:.28}42%{opacity:.78}70%{opacity:.28}100%{background-position:-110% 0;opacity:0}}@keyframes textSweep{0%,8%{clip-path:inset(0 100% 0 0);opacity:0}22%{opacity:.75}52%{clip-path:inset(0 0 0 0);opacity:.75}72%{clip-path:inset(0 0 0 100%);opacity:.2}100%{clip-path:inset(0 0 0 100%);opacity:0}}@keyframes softPrint{0%,48%,100%{opacity:0;transform:translateX(0)}60%{opacity:.22;transform:translateX(.6px)}70%{opacity:.1;transform:translateX(0)}}@keyframes signalPulse{0%,100%{opacity:.25;transform:rotate(45deg) scale(.88)}48%{opacity:.7;transform:rotate(45deg) scale(1.06)}70%{opacity:.35;transform:rotate(45deg) scale(.96)}}@keyframes signalDot{0%,100%{opacity:.35;transform:scale(.7)}48%{opacity:1;transform:scale(1)}70%{opacity:.5;transform:scale(.8)}}@keyframes rainbow{to{background-position:260% 50%}}
@media(prefers-reduced-motion:reduce){.stamp .title:after,.typewave .title:after,.overprint .title:after,.signal .title:before,.signal .title:after,.rainbow_stamp .title,.rainbow_stamp .title:after{animation:none!important}.stamp .title:after{opacity:.35;background:var(--primary-color)}.typewave .title:after,.overprint .title:after{display:none}.signal .title:before{opacity:.45}.signal .title:after{opacity:.7}}
@media(max-width:700px){.row{padding:12px}.desc{font-size:12px}}
</style><style>.row.settled .title:after,.row.settled .title:before,.row.settled .title{animation:none!important}.row.settled.typewave .title:after,.row.settled.overprint .title:after{display:none}.row.settled.stamp .title:after{opacity:.35;background:var(--primary-color)}.row.settled.signal .title:before{opacity:.45}.row.settled.signal .title:after{opacity:.7}</style><ha-card><div class="row ${effect}">${icon}<div class="copy"><div class="title" data-text="${text}"><span class="base">${text}</span></div>${c.description ? `<div class="desc">${escapeHtml(c.description)}</div>` : ""}</div></div></ha-card>`;

    const row = this.shadowRoot.querySelector(".row");
    this.settleTimer = setTimeout(() => {
      this.settleTimer = null;
      row?.classList.add("settled");
    }, Math.round(speed * 1000) + 80);
  }
}

registerCard({ type: "component-text-effect-v1", element: ComponentTextEffectV1, name: "Signature Text Effect", description: "Reusable transient-status effects using the existing signature motion language." });
