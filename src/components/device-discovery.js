/** ComponentDeviceDiscoveryV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentDeviceDiscoveryV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._loadPromise = null;
    this._loadGeneration = 0;
    this._accessState = null;
    this._interactions = [];
  }

  setConfig(config) {
    const wasDemo = Boolean(this.c?.demo);
    this.c = {
      demo: false,
      refresh_seconds: 60,
      max_rows: 6,
      ...config,
    };

    if (this.c.demo) {
      this._accessState = null;
      if (!wasDemo || this.started) {
        clearInterval(this.timer);
        this.timer = null;
        this.started = false;
        this._loadGeneration += 1;
        this._loadPromise = null;
      }
      this.render(this.demoRows());
      return;
    }

    if (wasDemo) this._start();
  }

  set hass(hass) {
    this.h = hass;
    if (this.c?.demo) {
      this.render(this.demoRows());
      return;
    }
    this._start();
  }

  connectedCallback() {
    this._start();
  }

  disconnectedCallback() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    clearInterval(this.timer);
    this.timer = null;
    this.started = false;
    this._loadGeneration += 1;
    this._loadPromise = null;
  }

  _start() {
    if (!this.isConnected || !this.h || this.c?.demo) return;
    if (!this._isAdmin()) {
      clearInterval(this.timer);
      this.timer = null;
      const active = this.started || this._loadPromise;
      this.started = false;
      if (active) {
        this._loadGeneration += 1;
        this._loadPromise = null;
      }
      this._showAdmin();
      return;
    }
    this._accessState = null;
    if (this.started) return;
    this.started = true;
    this.load();
    const seconds = Math.max(30, Number(this.c?.refresh_seconds) || 60);
    this.timer = setInterval(() => this.load(true), seconds * 1000);
  }

  _isAdmin() {
    return !this.h?.user || this.h.user.is_admin;
  }

  _showAdmin() {
    if (this._accessState === "admin") return;
    this._accessState = "admin";
    this.renderState("admin");
  }

  getCardSize() {
    return 3;
  }

  escape(value) {
    return escapeHtml(value);
  }

  name(flow) {
    const placeholders = flow?.context?.title_placeholders || {};
    return (
      placeholders.name ||
      placeholders.device ||
      placeholders.host ||
      flow.handler ||
      "Discovered device"
    );
  }

  source(value) {
    return (
      {
        bluetooth: "Bluetooth",
        dhcp: "DHCP",
        discovery: "Discovery",
        esphome: "ESPHome",
        hardware: "Hardware",
        hassio: "Home Assistant",
        homekit: "HomeKit",
        integration_discovery: "Discovery",
        mqtt: "MQTT",
        ssdp: "SSDP",
        usb: "USB",
        zeroconf: "mDNS",
      }[value] ||
      value ||
      "Discovery"
    );
  }

  pending(flows) {
    const sources = new Set([
      "bluetooth",
      "dhcp",
      "discovery",
      "esphome",
      "hardware",
      "hassio",
      "homekit",
      "integration_discovery",
      "mqtt",
      "ssdp",
      "usb",
      "zeroconf",
    ]);
    return (flows || [])
      .filter((flow) => sources.has(flow?.context?.source))
      .sort((a, b) => this.name(a).localeCompare(this.name(b)));
  }

  demoRows() {
    return [
      {
        handler: "example_integration",
        context: {
          source: "zeroconf",
          title_placeholders: { name: "Discovered device" },
        },
      },
      {
        handler: "example_bridge",
        context: {
          source: "dhcp",
          title_placeholders: { name: "Discovered bridge" },
        },
      },
    ];
  }

  navigate() {
    navigateTo("/config/integrations/dashboard");
  }

  async load(silent = false) {
    if (!this.h || this.c?.demo) return;
    if (this._loadPromise) return this._loadPromise;
    if (!silent) this.renderState("loading");
    if (!this._isAdmin()) {
      this._showAdmin();
      return;
    }

    const generation = this._loadGeneration;
    const hass = this.h;
    const request = Promise.resolve()
      .then(() => hass.callWS({ type: "config_entries/flow/progress" }))
      .then((flows) => {
        if (generation === this._loadGeneration && !this.c?.demo) {
          this.render(this.pending(flows));
        }
      })
      .catch(() => {
        if (generation === this._loadGeneration && !this.c?.demo) {
          this.renderState("error");
        }
      })
      .finally(() => {
        if (this._loadPromise === request) this._loadPromise = null;
      });
    this._loadPromise = request;
    return request;
  }

  styles() {
    return `${PRESENTATIONAL_CARD_STYLES}
      .card { padding: 4px 14px; }
      .summary,
      .state {
        min-height: 64px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
      }
      .state { padding: 8px 0; }
      .icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
      }
      ha-icon { --mdc-icon-size: 20px; }
      .title {
        font-size: 13px;
        line-height: 1.25;
        font-weight: 650;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .description {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.35;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .refresh,
      .review,
      .retry {
        appearance: none;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
        font: inherit;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
      }
      .refresh {
        width: 44px;
        padding: 0;
        display: grid;
        place-items: center;
      }
      .review,
      .retry { padding: 0 12px; }
      .refresh:active,
      .review:active,
      .retry:active { transform: scale(.98); }
      .refresh:focus-visible,
      .review:focus-visible,
      .retry:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .row {
        min-height: 64px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border-top: 1px solid var(--divider-color);
      }
      .row .icon { background: var(--secondary-background-color); }
      button.row{appearance:none;width:100%;border-right:0;border-bottom:0;border-left:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
      button.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}
      .more {
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--divider-color);
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      .error .icon { color: var(--error-color, var(--primary-color)); }
      .success .icon { color: var(--success-color, var(--primary-color)); }
      @media (max-width: 700px) {
        .card { padding: 4px 12px; }
        .summary,
        .state,
        .row { gap: 10px; }
      }
    `;
  }

  renderState(kind) {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const content = {
      loading: {
        className: "",
        icon: "mdi:progress-clock",
        title: "Checking for devices",
        description: "Reading Home Assistant discovery suggestions.",
      },
      admin: {
        className: "error",
        icon: "mdi:shield-lock-outline",
        title: "Administrator access required",
        description: "Device discovery is available to administrators only.",
      },
      error: {
        className: "error",
        icon: "mdi:alert-circle-outline",
        title: "Discovery could not be loaded",
        description: "Retry the Home Assistant discovery check.",
      },
    }[kind];

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="state ${content.className}">
            <span class="icon"><ha-icon icon="${content.icon}"></ha-icon></span>
            <span>
              <div class="title">${content.title}</div>
              <div class="description">${content.description}</div>
            </span>
            ${
              kind === "error"
                ? '<button class="retry" type="button">Retry</button>'
                : ""
            }
          </div>
        </div>
      </ha-card>`;

    const retry = this.shadowRoot.querySelector(".retry");
    if (retry) {
      this._interactions.push(
        interaction(retry, { primary: () => this.load(), feedback: true }),
      );
    }
  }

  row(flow) {
    const name = this.escape(this.name(flow));
    const description = this.escape(
      `${this.source(flow.context?.source)} · ${flow.handler}`,
    );
    const body = `<span class="icon"><ha-icon icon="mdi:plus-circle-outline"></ha-icon></span>
      <span><div class="title">${name}</div><div class="description">${description}</div></span>
      <span class="review" aria-hidden="true">Review</span>`;
    return this.c?.demo
      ? `<div class="row">${body}</div>`
      : `<button class="row" type="button" aria-label="Review ${name}">${body}</button>`;
  }

  render(flows) {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const limit = Math.max(1, Number(this.c?.max_rows) || 6);
    const shown = flows.slice(0, limit);
    const remaining = Math.max(0, flows.length - shown.length);
    const empty = flows.length === 0;
    const title = empty
      ? "No devices waiting"
      : `${flows.length} ${flows.length === 1 ? "device" : "devices"} found`;
    const description = empty
      ? "Home Assistant has no new setup suggestions."
      : "Home Assistant has setup suggestions ready to review.";
    const rows = shown.map((flow) => this.row(flow)).join("");
    const refresh = this.c?.demo
      ? '<span class="refresh" aria-hidden="true"><ha-icon icon="mdi:refresh"></ha-icon></span>'
      : '<button class="refresh" type="button" aria-label="Refresh discovery"><ha-icon icon="mdi:refresh"></ha-icon></button>';

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="summary ${empty ? "success" : ""}">
            <span class="icon"><ha-icon icon="${empty ? "mdi:check-circle-outline" : "mdi:radar"}"></ha-icon></span>
            <span>
              <div class="title">${title}</div>
              <div class="description">${description}</div>
            </span>
            ${refresh}
          </div>
          ${rows}
          ${
            remaining
              ? `<div class="more">${remaining} more ${remaining === 1 ? "suggestion" : "suggestions"} available in Integrations</div>`
              : ""
          }
        </div>
      </ha-card>`;

    const refreshButton = this.shadowRoot.querySelector("button.refresh");
    if (refreshButton) {
      this._interactions.push(
        interaction(refreshButton, { primary: () => this.load(), feedback: true }),
      );
    }
    for (const row of this.shadowRoot.querySelectorAll("button.row")) {
      this._interactions.push(
        interaction(row, { primary: () => this.navigate(), feedback: true }),
      );
    }
  }
}
registerCard({ type: "component-device-discovery-v2", element: ComponentDeviceDiscoveryV2, name: "Device Discovery", description: "Reusable device-discovery status component." });
