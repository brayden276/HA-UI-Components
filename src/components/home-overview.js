const { interaction, openMoreInfo } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentHomeOverviewV4 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this.h = null;
    this._children = new Map();
    this.built = false;
    this.building = false;
    this.timer = null;
    this._weatherInteraction = null;
    this._headerSignature = "";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}
      ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}
      .top{min-height:44px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}
      .weather{appearance:none;border:0;min-height:44px;padding:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer}
      .weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}
      .sections{margin-top:8px}.section+.section{margin-top:16px}
      @media(max-width:520px){.time{font-size:13px}.weather{font-size:12px}}
      @media(max-width:350px){.time{font-size:12px}.weather{font-size:11px}}
    </style><ha-card><div class="top"><span class="time"></span><button class="weather" type="button"></button></div><div class="sections"></div></ha-card>`;
    this.sections = this.shadowRoot.querySelector(".sections");
    this._bindWeather();
  }

  setConfig(c) {
    this.c = {
      weather_entity: "weather.forecast_home",
      base_path: "/home-control",
      current_dashboard: "home-control",
      favourites_helpers: ["input_text.dashboard_favourite_1", "input_text.dashboard_favourite_2", "input_text.dashboard_favourite_3", "input_text.dashboard_favourite_4"],
      ...c,
    };
    this.renderHeader();
    this.ensure();
    this.tick();
  }

  set hass(h) {
    this.h = h;
    for (const child of this._children.values()) child.hass = h;
    this.renderHeader();
    if (!this.built) this.ensure();
  }

  connectedCallback() { this._bindWeather(); this.tick(); this.ensure(); }
  disconnectedCallback() { this._weatherInteraction?.destroy(); this._weatherInteraction = null; clearTimeout(this.timer); }
  getCardSize() { return 12; }

  _bindWeather() {
    if (this._weatherInteraction) return;
    this._weatherInteraction = interaction(this.shadowRoot.querySelector(".weather"), { primary: () => this.moreWeather(), feedback: true });
  }

  tick() {
    clearTimeout(this.timer);
    this.renderHeader();
    this.timer = setTimeout(() => this.tick(), 60000 - Date.now() % 60000 + 100);
  }

  renderHeader() {
    if (!this.c) return;
    const now = new Date();
    const zone = this.h?.config?.time_zone;
    const language = this.h?.locale?.language || navigator.language || "en-AU";
    const locale = language === "en" ? "en-AU" : language;
    const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: zone }).format(now);
    const state = this.h?.states?.[this.c.weather_entity];
    const attributes = state?.attributes || {};
    const number = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value)) : "—";
    const temperature = number(attributes.temperature) + (attributes.temperature_unit || "°C");
    const cloud = Number.isFinite(Number(attributes.cloud_coverage)) ? `Cloud ${Math.round(Number(attributes.cloud_coverage))}%` : "Cloud —";
    const weatherText = `${temperature} · ${cloud}`;
    const weatherAriaLabel = `Outside ${temperature}, ${cloud}. Open weather details.`;
    const signature = JSON.stringify([time, weatherText, weatherAriaLabel]);
    if (signature === this._headerSignature) return;
    this._headerSignature = signature;
    this.shadowRoot.querySelector(".time").textContent = time;
    const weather = this.shadowRoot.querySelector(".weather");
    weather.textContent = weatherText;
    weather.setAttribute("aria-label", weatherAriaLabel);
  }

  moreWeather() { if (this.c?.weather_entity) openMoreInfo(this, this.c.weather_entity); }

  async ensure() {
    if (this.built || this.building || !this.c || !this.h) return;
    this.building = true;
    await Promise.all(["component-favourites-minimal-v1", "component-smart-collection-v3", "component-room-directory-v4", "component-household-directory-v3"].map((name) => customElements.whenDefined(name)));
    if (!this.isConnected) { this.building = false; return; }
    const definitions = [
      ["favourites", () => {
        const element = document.createElement("component-favourites-minimal-v1");
        element.setConfig({ helpers: this.c.favourites_helpers, max: 4, title: "Favourites" });
        return element;
      }],
      ["active", () => {
        const element = document.createElement("component-smart-collection-v3");
        element.setConfig({ mode: "active", title: "Active now", icon: "mdi:motion-play-outline", editable: false, pref_key: null });
        return element;
      }],
      ["household", () => {
        const element = document.createElement("component-household-directory-v3");
        element.setConfig({
          title: "Quick actions",
          icon: "mdi:gesture-tap-button",
          quick_action_label: "dashboard_quick_action",
          pref_key: "home-control.household.v2",
          base_path: this.c.base_path,
          current_dashboard: this.c.current_dashboard,
        });
        return element;
      }],
      ["rooms", () => {
        const element = document.createElement("component-room-directory-v4");
        element.setConfig({ mode: "home", title: "Rooms", icon: "mdi:floor-plan", pref_key: "home-control.rooms.v2", base_path: this.c.base_path, navigation_path: `${this.c.base_path}/rooms` });
        return element;
      }],
    ];
    for (const [id, make] of definitions) {
      const element = make();
      element.classList.add("section");
      element.hass = this.h;
      this._children.set(id, element);
      this.sections.append(element);
    }
    this.built = true;
    this.building = false;
  }
}

class ComponentHomeOverviewV5 extends ComponentHomeOverviewV4 {}

if (!customElements.get("component-home-overview-v5")) customElements.define("component-home-overview-v5", ComponentHomeOverviewV5);
if(!customElements.get('component-home-overview-v4'))customElements.define('component-home-overview-v4',ComponentHomeOverviewV4);window.customCards=window.customCards||[];
if (!window.customCards.some((x) => x.type === "component-home-overview-v4")) window.customCards.push({ type: "component-home-overview-v4", name: "Home Overview V4", description: "Stable minimal Home overview without state-refresh teardown." });
