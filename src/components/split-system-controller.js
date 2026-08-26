/** Thin climate wrapper that delegates state and control to Home Assistant. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const splitNativeTileConfig = (config, state) => {
  const attributes = state?.attributes || {};
  const features = [];
  if (Number.isFinite(Number(attributes.temperature))) {
    features.push({ type: "target-temperature" });
  }
  if (Array.isArray(attributes.hvac_modes) && attributes.hvac_modes.length) {
    features.push({ type: "climate-hvac-modes" });
  }
  if (Array.isArray(attributes.fan_modes) && attributes.fan_modes.length) {
    features.push({ type: "climate-fan-modes" });
  }
  if (Array.isArray(attributes.swing_modes) && attributes.swing_modes.length) {
    features.push({ type: "climate-swing-modes" });
  }
  if (
    Array.isArray(attributes.swing_horizontal_modes) &&
    attributes.swing_horizontal_modes.length
  ) {
    features.push({ type: "climate-swing-horizontal-modes" });
  }
  if (Array.isArray(attributes.preset_modes) && attributes.preset_modes.length) {
    features.push({ type: "climate-preset-modes" });
  }
  return {
    type: "tile",
    entity: config.entity,
    ...(config.title ? { name: config.title } : {}),
    features_position: "bottom",
    features,
  };
};

const splitSelectTileConfig = (entity, name) => ({
  type: "tile",
  entity,
  ...(name ? { name } : {}),
  features_position: "bottom",
  features: [{ type: "select-options" }],
});

const splitEntityTileConfig = (entity) => ({ type: "tile", entity });

const splitProfileCardConfig = (entry) => {
  const descriptor =
    typeof entry === "string" ? { entity: entry } : entry && typeof entry === "object" ? entry : null;
  if (!descriptor?.entity) return null;
  const domain = descriptor.entity.split(".")[0];
  const service =
    domain === "script"
      ? "script.turn_on"
      : domain === "scene"
        ? "scene.turn_on"
        : null;
  if (!service) return splitEntityTileConfig(descriptor.entity);
  return {
    type: "button",
    entity: descriptor.entity,
    ...(descriptor.name ? { name: descriptor.name } : {}),
    tap_action: {
      action: "perform-action",
      perform_action: service,
      target: { entity_id: descriptor.entity },
    },
    hold_action: { action: "more-info" },
  };
};

class ComponentSplitControllerV4 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._cards = [];
    this._buildToken = 0;
    this._capabilitySignature = "";
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;min-width:0}.stack{display:grid;gap:8px}.extras{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.extras:empty{display:none}
      </style>
      <div class="stack">
        <div class="climate"></div>
        <div class="extras"></div>
      </div>
    `;
    this.$ = {
      climate: this.shadowRoot.querySelector(".climate"),
      extras: this.shadowRoot.querySelector(".extras"),
    };
  }

  setConfig(config) {
    if (!config?.entity) {
      throw new Error("A climate entity is required");
    }
    this.config = {
      entity: config.entity,
      title: config.title || null,
      vertical_vane_entity:
        config.vertical_vane_entity || config.vertical_vane || null,
      horizontal_vane_entity:
        config.horizontal_vane_entity || config.horizontal_vane || null,
      timer_entity: config.timer_entity || null,
      profile_entities: Array.isArray(config.profile_entities)
        ? config.profile_entities.filter(Boolean)
        : [],
    };
    this._capabilitySignature = "";
    this._resetCards();
    void this._buildCards();
  }

  set hass(hass) {
    this._hass = hass;
    for (const card of this._cards) card.hass = hass;
    const signature = this._featureSignature();
    if (signature !== this._capabilitySignature) {
      this._resetCards();
      void this._buildCards();
    }
  }

  connectedCallback() {
    void this._buildCards();
  }

  disconnectedCallback() {
    this._buildToken += 1;
  }

  getCardSize() {
    return Math.max(2, 2 + this._extraConfigs().length);
  }

  _featureSignature() {
    const attributes = this._hass?.states?.[this.config?.entity]?.attributes || {};
    return JSON.stringify([
      Boolean(Number.isFinite(Number(attributes.temperature))),
      attributes.hvac_modes || [],
      attributes.fan_modes || [],
      attributes.swing_modes || [],
      attributes.swing_horizontal_modes || [],
      attributes.preset_modes || [],
    ]);
  }

  _resetCards() {
    this._buildToken += 1;
    this._cards = [];
    this.$.climate.replaceChildren();
    this.$.extras.replaceChildren();
  }

  _extraConfigs() {
    if (!this.config) return [];
    const configs = [];
    if (this.config.vertical_vane_entity) {
      configs.push(
        splitSelectTileConfig(
          this.config.vertical_vane_entity,
          this.config.vertical_vane_name || "Vertical vane",
        ),
      );
    }
    if (this.config.horizontal_vane_entity) {
      configs.push(
        splitSelectTileConfig(
          this.config.horizontal_vane_entity,
          this.config.horizontal_vane_name || "Horizontal vane",
        ),
      );
    }
    if (this.config.timer_entity) {
      configs.push(splitEntityTileConfig(this.config.timer_entity));
    }
    for (const profile of this.config.profile_entities) {
      const profileConfig = splitProfileCardConfig(profile);
      if (profileConfig) configs.push(profileConfig);
    }
    return configs;
  }

  async _buildCards() {
    if (!this.config || this._cards.length || !this.isConnected) return;
    const loadCardHelpers = globalThis.loadCardHelpers;
    if (typeof loadCardHelpers !== "function") return;
    const token = ++this._buildToken;
    const capabilitySignature = this._featureSignature();
    try {
      const helpers = await loadCardHelpers();
      if (token !== this._buildToken || !this.isConnected) return;
      const climateState = this._hass?.states?.[this.config.entity];
      const climateCard = helpers.createCardElement(
        splitNativeTileConfig(this.config, climateState),
      );
      climateCard.hass = this._hass;
      const extraCards = this._extraConfigs().map((configuration) => {
        const card = helpers.createCardElement(configuration);
        card.hass = this._hass;
        return card;
      });
      this._cards = [climateCard, ...extraCards];
      this._capabilitySignature = capabilitySignature;
      this.$.climate.replaceChildren(climateCard);
      this.$.extras.replaceChildren(...extraCards);
    } catch (error) {
      console.error("Could not create native Split System controls", error);
    }
  }
}

registerCard({
  type: "component-split-controller-v4",
  element: ComponentSplitControllerV4,
  name: "Split-System Controller",
  description:
    "Native Home Assistant climate controls with optional explicit vane, timer and profile entities.",
});
