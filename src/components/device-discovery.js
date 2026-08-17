/** ComponentDeviceDiscoveryV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  navigateTo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentDeviceDiscoveryV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this.c = {
      demo: false,
      refresh_seconds: 60,
      max_rows: 6,
      ...config,
    };

    if (this.c.demo) this.render(this.demoRows());
  }

  set hass(hass) {
    this.h = hass;

    if (this.c?.demo) {
      this.render(this.demoRows());
      return;
    }

    if (!this.started) {
      this.started = true;
      this.load();
      const seconds = Math.max(30, Number(this.c?.refresh_seconds) || 60);
      this.timer = setInterval(() => this.load(true), seconds * 1000);
    }
  }

  disconnectedCallback() {
    clearInterval(this.timer);
    this.timer = null;
    this.started = false;
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

    if (!silent) this.renderState("loading");

    if (this.h.user && !this.h.user.is_admin) {
      this.renderState("admin");
      return;
    }

    try {
      const flows = await this.h.callWS({ type: "config_entries/flow/progress" });
      this.render(this.pending(flows));
    } catch (error) {
      this.renderState("error");
    }
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

    this.shadowRoot.querySelector(".retry")?.addEventListener("click", () =>
      this.load(),
    );
  }

  render(flows) {
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

    const rows = shown
      .map(
        (flow) => `<div class="row">
          <span class="icon"><ha-icon icon="mdi:plus-circle-outline"></ha-icon></span>
          <span>
            <div class="title">${this.escape(this.name(flow))}</div>
            <div class="description">${this.escape(
              `${this.source(flow.context?.source)} · ${flow.handler}`,
            )}</div>
          </span>
          <button class="review" type="button">Review</button>
        </div>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="summary ${empty ? "success" : ""}">
            <span class="icon"><ha-icon icon="${
              empty ? "mdi:check-circle-outline" : "mdi:radar"
            }"></ha-icon></span>
            <span>
              <div class="title">${title}</div>
              <div class="description">${description}</div>
            </span>
            <button class="refresh" type="button" aria-label="Refresh discovery">
              <ha-icon icon="mdi:refresh"></ha-icon>
            </button>
          </div>
          ${rows}
          ${
            remaining
              ? `<div class="more">${remaining} more ${
                  remaining === 1 ? "suggestion" : "suggestions"
                } available in Integrations</div>`
              : ""
          }
        </div>
      </ha-card>`;

    this.shadowRoot.querySelector(".refresh")?.addEventListener("click", () =>
      this.load(),
    );
    this.shadowRoot.querySelectorAll(".review").forEach((button) =>
      button.addEventListener("click", () => this.navigate()),
    );
  }
}
registerCard({ type: "component-device-discovery-v2", element: ComponentDeviceDiscoveryV2, name: "Device Discovery", description: "Reusable device-discovery status component." });
