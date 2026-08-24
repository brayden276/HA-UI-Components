/** ComponentEnergySummaryV1 — one backend-driven Energy summary surface. */
const {
  createLifecycle,
  energyDayData,
  energyDayState,
  formatCalendarDay,
  formatEnergy,
  formatPower,
  interaction,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentEnergySummaryV1 extends HTMLElement {
  static stubConfig = { profile: "household-energy", day_channel: "energy-day" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lifecycle = createLifecycle(this);
    this.data = null;
    this.error = null;
    this.loading = false;
    this.sequence = 0;
    this.dayUnsub = null;
    this.profileListener = (event) => {
      if (event.detail?.kind !== "energy" || event.detail?.profileId !== this.config?.profile) return;
      energyDayData.invalidateProfile(this._hass, this.config.profile);
      this.load(true);
    };
    this.interactions = [];
  }

  setConfig(config) {
    this.config = { profile: "household-energy", day_channel: "energy-day", title: "Energy", ...(config || {}) };
    this.day = energyDayState.get(this.config.day_channel);
    if (!this.built) this.build();
    this.render();
    this.load();
  }
  set hass(hass) {
    this._hass = hass;
    this.day = energyDayState.get(this.config?.day_channel, hass);
    this.render();
    this.load();
  }
  connectedCallback() {
    this.lifecycle.connect();
    window.addEventListener("ha-component-profile-change", this.profileListener);
    this.bindInteractions();
    this.dayUnsub ||= energyDayState.subscribe(this.config?.day_channel, (detail) => {
      if (detail.day === this.day) return;
      this.day = detail.day;
      this.render();
      this.load();
    }, { hass: this._hass });
    this.load();
  }
  disconnectedCallback() {
    this.lifecycle.disconnect();
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    this.dayUnsub?.();
    this.dayUnsub = null;
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
  }
  getCardSize() { return 3; }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}
      ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .wrap{padding:12px 14px 14px}.head{min-height:32px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
      h2{margin:0;font-size:15px;line-height:1.2;font-weight:600}.context{display:flex;align-items:center;gap:7px;min-width:0;color:var(--secondary-text-color);font-size:13px}.day{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.state{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:var(--secondary-background-color);font-weight:600}.state.now{color:var(--primary-color)}
      .live{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:8px}.daily{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .metric{appearance:none;min-width:0;min-height:68px;padding:10px 11px;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:transparent;color:inherit;font:inherit;text-align:left;display:flex;flex-direction:column;justify-content:center;cursor:pointer}.metric:disabled{cursor:default;opacity:1}.metric:not(:disabled):hover{background:var(--secondary-background-color)}.metric:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:6px;font-size:13px;line-height:1.2;font-weight:500;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.daily .value{font-size:18px}.daily .metric{min-height:62px}
      .feedback{min-height:18px;margin-top:8px;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.feedback.error{color:var(--error-color)}
      :host([data-loading]) .wrap{cursor:progress}:host([data-loading]) .state{opacity:.75}
      @media(max-width:700px){.wrap{padding:12px}.daily{grid-template-columns:repeat(2,minmax(0,1fr))}.value{font-size:20px}}
      @media(max-width:420px){.live{grid-template-columns:1fr}.metric{min-height:58px}.live .metric{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center}.live .label{grid-column:1;grid-row:1;margin:0}.live .value{grid-column:2;grid-row:1}.head{align-items:flex-start}.context{justify-content:flex-end}}
    </style><ha-card><div class="wrap"><div class="head"><h2></h2><div class="context"><span class="day"></span><span class="state"></span></div></div><div class="live">
      <button class="metric house" type="button"><span class="value">—</span><span class="label">House now</span></button>
      <button class="metric solar" type="button"><span class="value">—</span><span class="label">Solar now</span></button>
      <button class="metric grid" type="button"><span class="value">—</span><span class="label">Grid now</span></button>
    </div><div class="daily">
      <button class="metric consumed" type="button" disabled><span class="value">—</span><span class="label">Consumed</span></button>
      <button class="metric generated" type="button" disabled><span class="value">—</span><span class="label">Generated</span></button>
      <button class="metric imported" type="button" disabled><span class="value">—</span><span class="label">Imported</span></button>
      <button class="metric exported" type="button" disabled><span class="value">—</span><span class="label">Exported</span></button>
    </div><div class="feedback" role="status"></div></div></ha-card>`;
    this.elements = {
      title: this.shadowRoot.querySelector("h2"), day: this.shadowRoot.querySelector(".day"), state: this.shadowRoot.querySelector(".state"), feedback: this.shadowRoot.querySelector(".feedback"),
      house: this.shadowRoot.querySelector(".house .value"), solar: this.shadowRoot.querySelector(".solar .value"), grid: this.shadowRoot.querySelector(".grid .value"),
      consumed: this.shadowRoot.querySelector(".consumed .value"), generated: this.shadowRoot.querySelector(".generated .value"), imported: this.shadowRoot.querySelector(".imported .value"), exported: this.shadowRoot.querySelector(".exported .value"),
    };
    this.bindInteractions();
  }

  bindInteractions() {
    if (!this.built || this.interactions.length) return;
    const targets = [
      [".house", "sensor.ha_component_house_power"],
      [".solar", "sensor.ha_component_solar_power"],
      [".grid", "sensor.ha_component_grid_power"],
    ];
    for (const [selector, entityId] of targets) {
      this.interactions.push(interaction(this.shadowRoot.querySelector(selector), {
        primary: () => openMoreInfo(this, entityId), feedback: true,
      }));
    }
  }

  async load(force = false) {
    if (!this._hass || !this.config || !this.day) return;
    if (this.loading) { this.reloadAfterLoad ||= force; return; }
    const sequence = ++this.sequence;
    this.loading = true;
    this.error = null;
    this.toggleAttribute("data-loading", true);
    this.render();
    try {
      const data = await energyDayData.get(this._hass, this.config.profile, this.day, { force });
      if (sequence === this.sequence) this.data = data;
    } catch (error) {
      if (sequence === this.sequence) this.error = error;
    } finally {
      if (sequence === this.sequence) {
        this.loading = false;
        this.toggleAttribute("data-loading", false);
        this.render();
        if (this.reloadAfterLoad) { this.reloadAfterLoad = false; this.load(true); }
      }
    }
  }

  render() {
    if (!this.elements || !this.config) return;
    const data = this.data, isToday = this.day === energyDayState.today(this._hass);
    this.elements.title.textContent = this.config.title;
    this.elements.day.textContent = isToday ? "Today" : formatCalendarDay(this._hass, this.day, { weekday: "short", day: "numeric", month: "short" });
    this.elements.state.textContent = isToday ? "Now" : "Historical";
    this.elements.state.classList.toggle("now", isToday);
    this.elements.house.textContent = formatPower(this._hass, data?.house_w);
    this.elements.solar.textContent = formatPower(this._hass, data?.solar_w);
    const grid = data?.grid_w == null ? Number.NaN : Number(data.grid_w);
    this.elements.grid.textContent = formatPower(this._hass, data?.grid_w, { absolute: true });
    this.shadowRoot.querySelector(".grid .label").textContent = Number.isFinite(grid) ? grid > 15 ? "Importing now" : grid < -15 ? "Exporting now" : "Grid balanced" : "Grid unavailable";
    this.elements.consumed.textContent = formatEnergy(this._hass, data?.consumed_kwh);
    this.elements.generated.textContent = formatEnergy(this._hass, data?.generated_kwh);
    this.elements.imported.textContent = formatEnergy(this._hass, data?.imported_kwh);
    this.elements.exported.textContent = formatEnergy(this._hass, data?.exported_kwh);
    const coverage = Number(data?.coverage);
    const feedback = this.error ? (/unknown energy profile/i.test(this.error.message || "")
      ? `Configure ${this.config.profile} in HA Component Backend`
      : (this.error.message || "Energy data is unavailable")) :
      this.loading ? (this.data ? "Updating…" : "Loading Energy data…") :
      data?.stale ? "Showing the last successful update" :
      Number.isFinite(coverage) && coverage < 1 ? `${Math.round(coverage * 100)}% of source data available` : "";
    this.elements.feedback.textContent = feedback;
    this.elements.feedback.classList.toggle("error", Boolean(this.error));
  }
}

registerCard({ type: "component-energy-summary-v1", element: ComponentEnergySummaryV1, name: "Energy Summary V1", description: "Stable backend-driven live power and selected-day Energy totals." });
