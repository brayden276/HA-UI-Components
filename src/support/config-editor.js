/** Generic source-preserving Lovelace editor and component config contract. */
const editorShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

class HaComponentLibraryConfigEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color)}*{box-sizing:border-box}
      label{display:grid;gap:8px;font-size:13px;font-weight:600}
      textarea{width:100%;min-height:180px;resize:vertical;padding:12px;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);color:var(--primary-text-color);font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:2}
      textarea:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .hint,.error{font-size:13px;line-height:1.35;font-weight:400}.hint{color:var(--secondary-text-color)}.error{color:var(--error-color);min-height:18px}
    </style><label><span>Card configuration</span><textarea spellcheck="false" aria-describedby="component-config-hint component-config-error"></textarea></label><div id="component-config-hint" class="hint">Edit the card object. Entity IDs and supported options are validated when Home Assistant previews the card.</div><div id="component-config-error" class="error" role="alert"></div>`;
    this.textarea = this.shadowRoot.querySelector("textarea");
    this.error = this.shadowRoot.querySelector(".error");
    this.textarea.addEventListener("input", () => this._changed());
  }
  set hass(value) { this._hass = value; }
  setConfig(config) {
    this._config = { ...(config || {}) };
    this.textarea.value = JSON.stringify(this._config, null, 2);
    this.error.textContent = "";
  }
  _changed() {
    try {
      const config = JSON.parse(this.textarea.value);
      if (!config || Array.isArray(config) || typeof config !== "object") throw new Error("Configuration must be an object");
      config.type ||= `custom:${this.cardType}`;
      this._config = config;
      this.error.textContent = "";
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config },
      }));
    } catch (error) {
      this.error.textContent = error.message;
    }
  }
}

if (!customElements.get("ha-component-library-config-editor")) {
  customElements.define("ha-component-library-config-editor", HaComponentLibraryConfigEditor);
}

const installConfigContract = (type, element) => {
  if (!type || !element) return;
  if (typeof element.getStubConfig !== "function") {
    element.getStubConfig = () => ({
      type: `custom:${type}`,
      ...(typeof element.stubConfig === "function" ? element.stubConfig() : element.stubConfig || {}),
    });
  }
  if (typeof element.getConfigElement !== "function") {
    element.getConfigElement = async () => {
      const editor = document.createElement("ha-component-library-config-editor");
      editor.cardType = type;
      return editor;
    };
  }
};

Object.assign(editorShared, { installConfigContract });
