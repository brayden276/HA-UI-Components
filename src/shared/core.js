/** Shared card primitives. CSS values are preserved from the Components dashboard. */
const componentLibraryShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const PRESENTATIONAL_CARD_STYLES = `:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}button.demo{appearance:none;width:100%;border:0;background:transparent;text-align:inherit;padding:0;cursor:pointer}button.demo:active{transform:scale(.992)}button.demo:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}`;

const toText = (value) => (value == null ? "" : String(value));
const escapeHtml = (value) =>
  toText(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const registerCard = ({ type, element, name, description, preview = true }) => {
  if (!customElements.get(type)) customElements.define(type, element);
  window.customCards ??= [];
  if (!window.customCards.some((card) => card.type === type)) {
    window.customCards.push({ type, name, description, preview });
  }
};

const openMoreInfo = (host, entityId) => {
  if (!entityId) return;
  host.dispatchEvent(
    new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }),
  );
};

const navigateTo = (path) => {
  if (!path) return;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("location-changed"));
};

class DashboardBaseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(_hass) {}

  escapeHtml(value) {
    return escapeHtml(value);
  }

  cardStyles() {
    return `:host{display:block;min-width:0}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color);box-sizing:border-box}.wrap{box-sizing:border-box;padding:12px 14px}.title{font-size:13px;line-height:1.25;font-weight:600;color:var(--primary-text-color)}.desc{margin-top:3px;font-size:11px;line-height:1.3;color:var(--secondary-text-color)}ha-icon{--mdc-icon-size:19px}button{font:inherit;color:inherit}button.i{appearance:none;border:0;background:transparent;cursor:pointer}button.i:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button.i:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:var(--dashboard-radius-control,5px)}@media(max-width:700px){.wrap{padding:12px}}`;
  }
}

Object.assign(componentLibraryShared, {
  PRESENTATIONAL_CARD_STYLES,
  DashboardBaseCard,
  escapeHtml,
  navigateTo,
  openMoreInfo,
  registerCard,
  toText,
});

