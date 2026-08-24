/** ComponentEnergyDashboardV1 — thin composition wrapper preserving Energy styling. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentEnergyDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-energy", day_channel: "energy-day" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // `children` is a read-only HTMLElement API. Keep composed cards in a
    // private map so construction works in every supported browser.
    this._children = new Map();
    this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}.layout{display:grid;gap:8px;grid-template-columns:minmax(0,1fr)}.context{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}@media(min-width:900px){.context{grid-template-columns:minmax(0,1fr)}}</style><div class="layout"><div class="selector"></div><div class="summary"></div><div class="context"><div class="daylight"></div></div><div class="history"></div></div>`;
  }
  setConfig(config) {
    this.config = {
      profile: "household-energy",
      day_channel: "energy-day",
      weather_entity: "weather.forecast_home",
      sun_entity: "sun.sun",
      ...config,
    };
    this.ensure();
  }
  set hass(hass) {
    this._hass = hass;
    for (const child of this._children.values()) child.hass = hass;
  }
  connectedCallback() { this.ensure(); }
  getCardSize() { return 12; }
  ensure() {
    if (!this.config) return;
    const definitions = [
      ["selector", "component-energy-day-selector-v1", { channel: this.config.day_channel }],
      ["summary", "component-energy-summary-v1", { profile: this.config.profile, day_channel: this.config.day_channel }],
      ["daylight", "solar-daylight-card-v7", { weather_entity: this.config.weather_entity, sun_entity: this.config.sun_entity }],
      ["history", "energy-history-card-v3", {
        profile: this.config.profile,
        calendar_day: true,
        day_channel: this.config.day_channel,
        bucket_minutes: 10,
        house_entity: "sensor.ha_component_house_power",
        solar_entity: "sensor.ha_component_solar_power",
        grid_entity: "sensor.ha_component_grid_power",
      }],
    ];
    for (const [slot, type, childConfig] of definitions) {
      let child = this._children.get(slot);
      if (!child) {
        child = document.createElement(type);
        this.shadowRoot.querySelector(`.${slot}`).append(child);
        this._children.set(slot, child);
      }
      child.setConfig(childConfig);
      if (this._hass) child.hass = this._hass;
    }
  }
}

registerCard({ type: "component-energy-dashboard-v1", element: ComponentEnergyDashboardV1, name: "Energy Dashboard V1", description: "Single-card Energy composition using shared day state and one backend data contract." });
