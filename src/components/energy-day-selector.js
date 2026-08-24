/** ComponentEnergyDaySelectorV1 — stable, replayable selected-day control. */
const { energyDayState, formatCalendarDay, interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentEnergyDaySelectorV1 extends HTMLElement {
  static stubConfig = { channel: "energy-day" };
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.interactions = [];
    this.unsubscribe = null;
  }
  setConfig(config) {
    this.config = { channel: "energy-day", title: "Energy day", ...(config || {}) };
    this.selected = energyDayState.get(this.config.channel);
    if (!this.built) this.build();
    this.update();
  }
  set hass(hass) {
    this._hass = hass;
    this.selected = energyDayState.get(this.config?.channel, hass);
    this.update();
  }
  connectedCallback() {
    this.bindInteractions();
    this.unsubscribe ||= energyDayState.subscribe(this.config?.channel, (detail) => {
      this.selected = detail.day;
      this.update();
    }, { hass: this._hass });
  }
  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
  }
  getCardSize() { return 1; }

  parse(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return this.key(date) === value ? date : null;
  }
  key(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  isToday() { return this.selected === energyDayState.today(this._hass); }
  setDay(value) {
    this.selected = energyDayState.set(this.config.channel, value, { hass: this._hass });
    this.update();
  }
  shift(days) {
    const date = this.parse(this.selected) || new Date();
    date.setDate(date.getDate() + days);
    this.setDay(this.key(date));
  }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .row{min-height:56px;padding:6px 8px;display:grid;grid-template-columns:44px minmax(0,1fr) 44px auto;align-items:center;gap:8px}
      button{appearance:none;min-width:44px;min-height:44px;border:0;border-radius:12px;background:transparent;color:inherit;font:inherit;cursor:pointer}button:focus-visible,.date:focus-within{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{color:var(--disabled-text-color,var(--secondary-text-color));cursor:default;opacity:.45}.step{display:grid;place-items:center}ha-icon{--mdc-icon-size:22px}
      .date{position:relative;min-width:0;min-height:44px;padding:4px 8px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:var(--secondary-background-color);overflow:hidden}.label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:650}.state{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:var(--card-background-color);color:var(--secondary-text-color);font-size:13px;font-weight:600}.state.historical{color:var(--primary-color)}
      input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.today{padding:0 12px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--primary-color);background:var(--secondary-background-color);font-size:13px;font-weight:650}.today:disabled{opacity:.55}
      @media(max-width:420px){.row{grid-template-columns:44px minmax(0,1fr) 44px 44px;gap:4px;padding:6px}.today{width:44px;padding:0}.today span{display:none}}
    </style><ha-card><div class="row"><button class="step previous" type="button" aria-label="Previous day"><ha-icon icon="mdi:chevron-left"></ha-icon></button><label class="date"><span class="label"></span><span class="state" role="status"></span><input type="date" aria-label="Select Energy day"></label><button class="step next" type="button" aria-label="Next day"><ha-icon icon="mdi:chevron-right"></ha-icon></button><button class="today" type="button" aria-label="Return to today"><ha-icon icon="mdi:calendar-today-outline"></ha-icon><span>Today</span></button></div></ha-card>`;
    this.elements = {
      label: this.shadowRoot.querySelector(".label"), state: this.shadowRoot.querySelector(".state"), input: this.shadowRoot.querySelector("input"), next: this.shadowRoot.querySelector(".next"), today: this.shadowRoot.querySelector(".today"),
    };
    this.elements.input.addEventListener("change", (event) => this.setDay(event.target.value));
    this.bindInteractions();
  }
  bindInteractions() {
    if (!this.built || this.interactions.length) return;
    const repeat = { delay: 350, interval: 110, accelerate: true };
    this.interactions.push(
      interaction(this.shadowRoot.querySelector(".previous"), { primary: () => this.shift(-1), repeat, feedback: true }),
      interaction(this.elements.next, { primary: () => this.shift(1), repeat, feedback: true }),
      interaction(this.elements.today, { primary: () => this.setDay(energyDayState.today(this._hass)), feedback: true }),
    );
  }
  update() {
    if (!this.elements || !this.selected) return;
    const today = this.isToday();
    this.elements.label.textContent = formatCalendarDay(this._hass, this.selected, { weekday: "short", day: "numeric", month: "short", ...(this.selected.slice(0, 4) === energyDayState.today(this._hass).slice(0, 4) ? {} : { year: "numeric" }) });
    this.elements.state.textContent = today ? "Today" : "Historical";
    this.elements.state.classList.toggle("historical", !today);
    this.elements.input.value = this.selected;
    this.elements.input.max = energyDayState.today(this._hass);
    this.elements.next.disabled = today;
    this.elements.today.disabled = today;
  }
}

registerCard({ type: "component-energy-day-selector-v1", element: ComponentEnergyDaySelectorV1, name: "Energy Day Selector", description: "Stable selected-day control shared by every Energy card." });
