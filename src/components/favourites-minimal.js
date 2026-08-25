const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentFavouritesMinimalV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this.h = null;
    this.child = null;
    this.buildPromise = null;
  }

  setConfig(config) {
    this.c = { preference_key: "home-control.favourites.v1", ...config };
    if (this.child) this.child.setConfig(this.c);
    else this.ensure();
  }

  set hass(hass) {
    this.h = hass;
    if (this.child) this.child.hass = hass;
    else this.ensure();
  }

  connectedCallback() {
    this.ensure();
  }

  getCardSize() {
    return 2;
  }

  async ensure() {
    if (this.child || !this.c) return;
    if (this.buildPromise) return this.buildPromise;

    const build = (async () => {
      await customElements.whenDefined("component-favourites-v3");
      if (this.child || !this.c) return;

      const child = document.createElement("component-favourites-v3");
      child.setConfig(this.c);
      if (this.h) child.hass = this.h;
      this.child = child;
      this.shadowRoot.replaceChildren(child);
      queueMicrotask(() => this.tune());
    })();
    this.buildPromise = build;
    try {
      await build;
    } finally {
      if (this.buildPromise === build) this.buildPromise = null;
    }
  }

  tune() {
    const root = this.child?.shadowRoot;
    if (!root) return;

    root.querySelector(".edit ha-icon")?.setAttribute("icon", "mdi:dots-horizontal");
    if (root.querySelector("style[data-home-minimal]")) return;

    const style = document.createElement("style");
    style.dataset.homeMinimal = "";
    style.textContent = `.heading h2{font-size:15px!important;font-weight:500!important}.heading ha-icon{color:var(--secondary-text-color)!important;--mdc-icon-size:17px!important}.edit{min-width:44px!important;min-height:44px!important;padding:0!important;color:var(--secondary-text-color)!important;font-weight:400!important}.edit ha-icon{--mdc-icon-size:16px!important}.edit span{display:none!important}.icon{color:var(--secondary-text-color)!important}.name{font-weight:500!important}.state{font-size:12px!important}.dialog-title,.confirm-title{font-size:16px!important;font-weight:500!important}.subheading,.group-title,.choice-name,.dialog-button{font-weight:500!important}.selected-meta,.choice-meta,.editor-copy{font-size:12px!important}`;
    root.append(style);
  }
}

registerCard({
  type: "component-favourites-minimal-v1",
  element: ComponentFavouritesMinimalV1,
  name: "Favourites Minimal",
  description: "Existing favourites behaviour with restrained Home typography.",
});
