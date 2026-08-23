/** ComponentEnergyDaySelectorV1 — reusable Home Assistant dashboard card. */
const { interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEnergyDaySelectorV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = this._todayKey();
    this._connectedOnce = false;
    this._interactions = [];
  }

  setConfig(config) {
    this.config = {
      channel: "energy-day",
      title: "Energy day",
      ...config,
    };
    this._selected = this._todayKey();
    this._render();
    if (this.isConnected) queueMicrotask(() => this._emit());
  }

  set hass(hass) {
    this._hass = hass;
  }

  connectedCallback() {
    this._selected = this._todayKey();
    this._render();
    queueMicrotask(() => this._emit());
  }

  disconnectedCallback() {
    this._clearInteractions();
  }

  getCardSize() {
    return 1;
  }

  _clearInteractions() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  _pad(value) {
    return String(value).padStart(2, "0");
  }

  _key(date) {
    return `${date.getFullYear()}-${this._pad(date.getMonth() + 1)}-${this._pad(date.getDate())}`;
  }

  _todayKey() {
    return this._key(new Date());
  }

  _parse(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    ) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  _isToday() {
    return this._selected === this._todayKey();
  }

  _label() {
    const date = this._parse(this._selected) || new Date();
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = "numeric";
    }
    return date.toLocaleDateString("en-AU", options);
  }

  _emit() {
    window.dispatchEvent(
      new CustomEvent("energy-day-selector-change", {
        detail: {
          channel: this.config?.channel || "energy-day",
          day: this._selected,
          isToday: this._isToday(),
        },
      }),
    );
  }

  _setDay(value) {
    const date = this._parse(value);
    const today = this._parse(this._todayKey());
    if (!date || date > today) return;
    const next = this._key(date);
    if (next === this._selected) return;
    this._selected = next;
    this._render();
    this._emit();
  }

  _shift(days) {
    const date = this._parse(this._selected) || new Date();
    date.setDate(date.getDate() + days);
    this._setDay(this._key(date));
  }

  _render() {
    if (!this.config) return;
    this._clearInteractions();
    const today = this._isToday();
    this.shadowRoot.innerHTML = `<style>
      :host {
        display: block;
        min-width: 0;
      }
      * {
        box-sizing: border-box;
      }
      ha-card {
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 16px);
        background: var(--ha-card-background, var(--card-background-color));
        color: var(--primary-text-color);
      }
      .row {
        min-height: 56px;
        padding: 6px 8px;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px auto;
        align-items: center;
        gap: 8px;
      }
      button {
        appearance: none;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      button:active:not(:disabled) {
        transform: scale(.97);
      }
      button:focus-visible,
      .date:focus-within {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      button:disabled {
        color: var(--disabled-text-color, var(--secondary-text-color));
        cursor: default;
        opacity: .45;
      }
      .step {
        display: grid;
        place-items: center;
      }
      ha-icon {
        --mdc-icon-size: 22px;
      }
      .date {
        position: relative;
        min-width: 0;
        min-height: 44px;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 12px;
        background: var(--secondary-background-color);
        overflow: hidden;
      }
      .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 650;
      }
      .state {
        flex: 0 0 auto;
        padding: 3px 7px;
        border-radius: 999px;
        background: var(--card-background-color);
        color: var(--secondary-text-color);
        font-size: 13px;
        font-weight: 600;
      }
      .state.historical {
        color: var(--primary-color);
      }
      input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }
      .today {
        padding: 0 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--primary-color);
        background: var(--secondary-background-color);
        font-size: 13px;
        font-weight: 650;
      }
      .today:disabled {
        opacity: .55;
      }
      @media (max-width: 420px) {
        .row {
          grid-template-columns: 44px minmax(0, 1fr) 44px 44px;
          gap: 4px;
          padding: 6px;
        }
        .today {
          width: 44px;
          padding: 0;
        }
        .today span {
          display: none;
        }
      }
    </style>
    <ha-card>
      <div class="row">
        <button class="step previous" type="button" aria-label="Previous day">
          <ha-icon icon="mdi:chevron-left"></ha-icon>
        </button>
        <label class="date">
          <span class="label">${this._label()}</span>
          <span class="state ${today ? "" : "historical"}" role="status" aria-live="polite">
            ${today ? "Today" : "Historical"}
          </span>
          <input type="date" aria-label="Select energy day" value="${this._selected}" max="${this._todayKey()}">
        </label>
        <button class="step next" type="button" aria-label="Next day" ${today ? "disabled" : ""}>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
        <button class="today" type="button" aria-label="Return to today" ${today ? "disabled" : ""}>
          <ha-icon icon="mdi:calendar-today-outline"></ha-icon><span>Today</span>
        </button>
      </div>
    </ha-card>`;

    const repeat = { delay: 350, interval: 110, accelerate: true };
    this._interactions.push(
      interaction(this.shadowRoot.querySelector(".previous"), {
        primary: () => this._shift(-1),
        optimistic: "selection",
        repeat,
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".next"), {
        primary: () => this._shift(1),
        optimistic: "selection",
        repeat,
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".today"), {
        primary: () => this._setDay(this._todayKey()),
        optimistic: "selection",
        repeat: false,
        feedback: true,
      }),
    );
    this.shadowRoot.querySelector("input").onchange = (event) =>
      this._setDay(event.target.value);
  }
}
registerCard({ type: "component-energy-day-selector-v1", element: ComponentEnergyDaySelectorV1, name: "Energy Day Selector", description: "Reusable day selector that broadcasts historical energy-day state." });
