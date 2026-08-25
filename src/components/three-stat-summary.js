/** ComponentThreeStatV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentThreeStatV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      metric_1_value: "00",
      metric_1_label: "Metric one",
      metric_2_value: "00",
      metric_2_label: "Metric two",
      metric_3_value: "00",
      metric_3_label: "Metric three",
      interactive: true,
      ...c,
    };
    this.r();
  }

  set hass(h) {
    this.h = h;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    // The interaction handles belong to the retained shadow DOM. They remain
    // valid during a transient detach and are replaced by the next render.
  }

  getCardSize() {
    return 2;
  }

  _clear() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  _action(i) {
    if (this.c.interactive === false) return null;

    const custom = this.c[`metric_${i}_action`];
    if (typeof custom === "function") return () => custom({ host: this, hass: this.h, index: i });

    const path = this.c[`metric_${i}_navigation_path`];
    if (path) return () => navigateTo(path);

    const entity = this.c[`metric_${i}_entity`];
    if (entity) return () => openMoreInfo(this, entity);

    return null;
  }

  r() {
    this._clear();

    const metrics = [1, 2, 3].map((index) => ({ index, action: this._action(index) }));
    const rows = metrics.map(({ index, action }) => {
      const tag = action ? "button" : "div";
      const attrs = action ? ' type="button"' : "";
      return `<${tag} class="stat" data-index="${index}"${attrs}><div class="value">${escapeHtml(this.c[`metric_${index}_value`])}</div><div class="label">${escapeHtml(this.c[`metric_${index}_label`])}</div></${tag}>`;
    }).join("");

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;min-height:70px;align-items:center}.stat{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;text-align:center;min-width:0;cursor:pointer}.stat:first-child{text-align:left}.stat:last-child{text-align:right}.stat:active{transform:scale(.98)}.stat:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:8px}.value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:5px;font-size:10.5px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;gap:8px}.value{font-size:20px}.label{font-size:10px}}</style><style>.stat:not(button){cursor:default}.stat:not(button):active{transform:none}.stat:not(button):focus-visible{outline:none}</style><ha-card><div class="wrap">${rows}</div></ha-card>`;

    for (const element of this.shadowRoot.querySelectorAll("button.stat")) {
      const metric = metrics.find(({ index }) => index === Number(element.dataset.index));
      this._interactions.push(interaction(element, { primary: metric.action, feedback: true }));
    }
  }
}

registerCard({ type: "component-three-stat-v2", element: ComponentThreeStatV2, name: "Three-stat Summary", description: "Reusable three-stat summary component." });
