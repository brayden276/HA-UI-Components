/** Device-aware Auto-Entities adapter used by dynamic dashboard collections. */
const SPLIT_CARD_TYPE = "custom:component-split-controller-v4";
const AUTO_ENTITIES_TYPE = "custom:auto-entities";
const RETRY_DELAY_MS = 31000;
const SPLIT_DEFINITION_TIMEOUT_MS = 5000;

const cloneConfig = (value) => JSON.parse(JSON.stringify(value));
const escapePattern = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactEntityPattern = (entityIds) => entityIds.length ? `/^(${entityIds.map(escapePattern).join("|")})$/` : null;
const hasExactStateExclusion = (rules, state) => rules.some((rule) => rule?.state === state && Object.keys(rule).length === 1);

class ComponentDeviceAwareAutoEntitiesV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.config = null;
    this._hass = null;
    this.card = null;
    this.generation = 0;
    this.loaded = false;
    this.retryTimer = null;
    this.unsubscribeRegistry = null;
    this.shadowRoot.innerHTML = '<style>:host{display:block;min-width:0}.head{min-height:44px;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px;color:var(--primary-text-color)}.head[hidden]{display:none}.head ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.body{min-width:0}</style><div class="head" hidden><ha-icon></ha-icon><h2></h2></div><div class="body"></div>';
    this.header = this.shadowRoot.querySelector(".head");
    this.headerIcon = this.shadowRoot.querySelector("ha-icon");
    this.headerTitle = this.shadowRoot.querySelector("h2");
    this.body = this.shadowRoot.querySelector(".body");
  }

  setConfig(config) {
    if (!config?.filter) throw new Error("An Auto-Entities filter is required");
    this.config = cloneConfig(config);
    this.renderHeader();
    this.loaded = false;
    this.cancelRetry();
    this.generation += 1;
    if (this.isConnected && this._hass) this.refresh();
  }

  set hass(hass) {
    this._hass = hass;
    this.subscribeToRegistry();
    if (this.isConnected && this.card) this.card.hass = hass;
    if (this.isConnected && !this.loaded) this.refresh();
  }

  connectedCallback() {
    this.subscribeToRegistry();
    if (!this.loaded && this.config && this._hass) this.refresh();
  }

  disconnectedCallback() {
    this.cancelRetry();
    this.unsubscribeRegistry?.();
    this.unsubscribeRegistry = null;
    this.generation += 1;
    this.loaded = false;
  }

  getCardSize() { return (this.card?.getCardSize?.() ?? 1) + (this.header?.hidden ? 0 : 1); }
  getLayoutOptions() { return this.card?.getLayoutOptions?.() ?? {}; }

  renderHeader() {
    const header = this.config?.header;
    const title = String(header?.title || "").trim();
    this.header.hidden = !title;
    if (!title) return;
    this.headerIcon.setAttribute("icon", header?.icon || "mdi:format-list-bulleted");
    this.headerTitle.textContent = title;
  }

  subscribeToRegistry() {
    const registry = globalThis.__componentSplitRegistryV4;
    if (!this.isConnected || this.unsubscribeRegistry || !this._hass || !registry?.subscribe) return;
    this.unsubscribeRegistry = registry.subscribe(this._hass, () => {
      this.loaded = false;
      this.refresh();
    });
  }

  refresh() {
    if (!this.isConnected || !this.config || !this._hass) return;
    this.loaded = true;
    const generation = ++this.generation;
    const registry = globalThis.__componentSplitRegistryV4;
    if (!registry?.load) {
      this.renderCard(this.buildAutoEntitiesConfig(null), generation);
      return;
    }
    Promise.resolve(registry.load(this._hass))
      .then((result) => {
        if (generation !== this.generation) return;
        if (result?.error) {
          if (this.card) {
            this.scheduleRetry();
          } else {
            this.renderCard(this.buildAutoEntitiesConfig(result), generation);
            this.scheduleRetry();
          }
          return;
        }
        this.renderCard(this.buildAutoEntitiesConfig(result), generation);
      })
      .catch(() => {
        if (generation !== this.generation) return;
        if (this.card) this.scheduleRetry();
        else this.showUnavailable();
      });
  }

  scheduleRetry() {
    this.cancelRetry();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.loaded = false;
      if (this.isConnected) this.refresh();
    }, RETRY_DELAY_MS);
  }

  cancelRetry() {
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  showUnavailable() {
    this.scheduleRetry();
    if (this.card) return;
    const alert = document.createElement("ha-alert");
    alert.setAttribute("alert-type", "error");
    alert.textContent = "Household controls are temporarily unavailable.";
    this.body.replaceChildren(alert);
  }

  buildAutoEntitiesConfig(registry) {
    const config = cloneConfig(this.config);
    const excludeInvalidStates = config.exclude_invalid_states !== false;
    delete config.header;
    delete config.exclude_invalid_states;
    config.type = AUTO_ENTITIES_TYPE;

    const filter = config.filter ?? {};
    const includes = Array.isArray(filter.include) ? filter.include : [];
    const excludes = Array.isArray(filter.exclude) ? filter.exclude : [];
    const ordinaryIncludes = includes.filter((rule) => rule?.options?.type !== SPLIT_CARD_TYPE);
    const systems = registry ? [...registry.systems.keys()].sort() : [];
    const claimed = registry ? [...registry.claimed].sort() : [];
    const systemPattern = exactEntityPattern(systems);
    const claimedPattern = exactEntityPattern(claimed);
    const injectedSplitRules = [];

    if (systemPattern) {
      for (const rule of ordinaryIncludes.filter((candidate) => candidate?.domain === "climate" && candidate?.options?.type === "custom:bubble-card")) {
        for (const entityId of systems) {
          const splitRule = { domain: "climate", entity_id: entityId };
          if (rule.area) splitRule.area = rule.area;
          if (rule.state) splitRule.state = rule.state;
          if (rule.not?.state) splitRule.not = { state: rule.not.state };
          splitRule.options = { type: SPLIT_CARD_TYPE, ...(rule.area ? { title: "Split system" } : {}) };
          injectedSplitRules.push(splitRule);
        }
        rule.not = { ...(rule.not ?? {}), entity_id: systemPattern };
      }
    }

    const climateIndex = ordinaryIncludes.findIndex((rule) => rule?.domain === "climate");
    filter.include = climateIndex < 0
      ? ordinaryIncludes
      : [...ordinaryIncludes.slice(0, climateIndex), ...injectedSplitRules, ...ordinaryIncludes.slice(climateIndex)];
    filter.exclude = [...excludes];
    if (claimedPattern) filter.exclude.push({ entity_id: claimedPattern });
    if (excludeInvalidStates) {
      for (const state of ["unavailable", "unknown"]) {
        if (!hasExactStateExclusion(filter.exclude, state)) filter.exclude.push({ state });
      }
    }
    config.unique = true;
    return config;
  }

  async renderCard(config, generation) {
    try {
      const needsSplitCard = config.filter?.include?.some((rule) => rule?.options?.type === SPLIT_CARD_TYPE);
      if (needsSplitCard && !customElements.get("component-split-controller-v4")) await this.waitForSplitController();
      const helpers = await window.loadCardHelpers();
      if (generation !== this.generation) return;
      const card = helpers.createCardElement(config);
      card.hass = this._hass;
      this.card = card;
      this.body.replaceChildren(card);
    } catch {
      if (generation === this.generation) this.showUnavailable();
    }
  }

  waitForSplitController() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Split controller did not load")), SPLIT_DEFINITION_TIMEOUT_MS);
      customElements.whenDefined("component-split-controller-v4").then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

customElements.get("component-device-aware-auto-entities-v1") || customElements.define("component-device-aware-auto-entities-v1", ComponentDeviceAwareAutoEntitiesV1);
