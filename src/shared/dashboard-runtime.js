/** Shared dashboard registry/runtime used by entity-aware controllers. */
const { escapeHtml } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

globalThis.__homeDashboardV2 ??= {};
const HD2 = globalThis.__homeDashboardV2;

const EMPTY_PREFERENCES = Object.freeze({ order: [], hidden: [] });
const REGISTRY_EVENT_TYPES = ["area_registry_updated", "device_registry_updated", "entity_registry_updated"];
const CONTROL_DOMAINS = new Set(["light", "fan", "switch", "input_boolean", "media_player", "climate", "cover", "lock", "vacuum", "button", "select", "number"]);
const DOMAIN_ICONS = {
  light: "mdi:lightbulb-outline", fan: "mdi:fan", switch: "mdi:toggle-switch-outline", input_boolean: "mdi:toggle-switch-outline",
  media_player: "mdi:play-circle-outline", climate: "mdi:thermostat", cover: "mdi:window-shutter", lock: "mdi:lock-outline",
  vacuum: "mdi:robot-vacuum", button: "mdi:gesture-tap-button", select: "mdi:format-list-bulleted", number: "mdi:tune-variant",
  binary_sensor: "mdi:alert-circle-outline", todo: "mdi:format-list-checks",
};

const emptyRegistryData = () => ({ areas: [], devices: [], entities: [], dashboards: [], deviceArea: new Map(), byDevice: new Map(), areaMap: new Map() });
const buildRegistryData = (areas, devices, entities, dashboards) => {
  const areaRows = Array.isArray(areas) ? areas : [];
  const deviceRows = Array.isArray(devices) ? devices : [];
  const entityRows = Array.isArray(entities) ? entities : [];
  const byDevice = new Map();
  for (const entry of entityRows) {
    if (!entry?.device_id) continue;
    const siblings = byDevice.get(entry.device_id) ?? [];
    siblings.push(entry);
    byDevice.set(entry.device_id, siblings);
  }
  return {
    areas: areaRows,
    devices: deviceRows,
    entities: entityRows,
    dashboards: Array.isArray(dashboards) ? dashboards : [],
    deviceArea: new Map(deviceRows.map((device) => [device.id, device.area_id || null])),
    byDevice,
    areaMap: new Map(areaRows.map((area) => [area.area_id, area])),
  };
};
const notifyRegistrySubscribers = (registry, data) => {
  for (const subscriber of [...registry.subs]) {
    try { subscriber(data); } catch { /* Isolate card failures from other subscribers. */ }
  }
};

const createDashboardRegistry = () => ({
  connection: null,
  hass: null,
  data: null,
  promise: null,
  subs: new Set(),
  unsubs: null,
  retry: null,
  refreshPromise: null,
  refreshQueued: false,

  attach(hass) {
    const connection = hass?.connection || null;
    if (this.connection === connection) {
      this.hass = hass;
      return;
    }
    this.detach();
    this.connection = connection;
    this.hass = hass;
    this.listen();
  },

  detach() {
    const unsubscribe = this.unsubs;
    this.unsubs = null;
    Promise.resolve(unsubscribe).then((stop) => stop?.()).catch(() => {});
    clearTimeout(this.retry);
    this.retry = null;
    this.refreshPromise = null;
    this.refreshQueued = false;
    this.connection = null;
    this.data = null;
    this.promise = null;
  },

  listen() {
    const connection = this.connection;
    if (!connection?.subscribeEvents || this.unsubs) return;
    const subscriptions = Promise.all(REGISTRY_EVENT_TYPES.map((type) => connection.subscribeEvents(() => this.refresh(), type)))
      .then((stops) => () => stops.forEach((stop) => stop?.()));
    this.unsubs = subscriptions;
    subscriptions.catch(() => {
      if (this.unsubs !== subscriptions) return;
      this.unsubs = null;
      if (!this.connection || this.retry) return;
      this.retry = setTimeout(() => {
        this.retry = null;
        this.listen();
      }, 30000);
    });
  },

  load(hass, force = false) {
    this.attach(hass);
    if (this.data && !force) return Promise.resolve(this.data);
    if (this.promise) return this.promise;
    const connection = hass?.connection;
    if (!connection?.sendMessagePromise) return Promise.resolve(emptyRegistryData());
    this.promise = Promise.all([
      connection.sendMessagePromise({ type: "config/area_registry/list" }),
      connection.sendMessagePromise({ type: "config/device_registry/list" }),
      connection.sendMessagePromise({ type: "config/entity_registry/list" }),
      hass.callWS({ type: "lovelace/dashboards/list" }).catch(() => []),
    ])
      .then(([areas, devices, entities, dashboards]) => {
        const data = buildRegistryData(areas, devices, entities, dashboards);
        this.data = data;
        return data;
      })
      .catch(() => this.data || emptyRegistryData())
      .finally(() => { this.promise = null; });
    return this.promise;
  },

  refresh() {
    if (!this.hass) return Promise.resolve(this.data);
    if (this.refreshPromise) {
      this.refreshQueued = true;
      return this.refreshPromise;
    }
    const hass = this.hass;
    const loadFresh = () => {
      if (this.hass !== hass) return this.data;
      this.data = null;
      this.promise = null;
      return this.load(hass, true);
    };
    const pending = this.promise ? Promise.resolve(this.promise).catch(() => {}).then(loadFresh) : loadFresh();
    let refreshPromise;
    refreshPromise = Promise.resolve(pending)
      .then((data) => {
        if (this.hass === hass) notifyRegistrySubscribers(this, data);
        return data;
      })
      .finally(() => {
        if (this.refreshPromise !== refreshPromise) return;
        this.refreshPromise = null;
        if (this.refreshQueued) {
          this.refreshQueued = false;
          this.refresh();
        }
      });
    this.refreshPromise = refreshPromise;
    return refreshPromise;
  },

  subscribe(hass, subscriber) {
    this.attach(hass);
    this.subs.add(subscriber);
    this.load(hass).then(subscriber);
    return () => this.subs.delete(subscriber);
  },
});

HD2.esc = escapeHtml;
HD2.domain = (entityId) => String(entityId || "").split(".")[0];
HD2.label = (value) => String(value ?? "").replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
HD2.stateName = (hass, entry, state) => entry?.name || entry?.original_name || state?.attributes?.friendly_name || entry?.entity_id || "Control";
HD2.icon = (entry, state) => state?.attributes?.icon || DOMAIN_ICONS[HD2.domain(entry?.entity_id)] || "mdi:gesture-tap-button";
HD2.validState = (state) => Boolean(state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase()));
HD2.prefs = async (hass, key) => {
  if (!hass || !key) return { ...EMPTY_PREFERENCES };
  try { return (await hass.callWS({ type: "frontend/get_user_data", key }))?.value || { ...EMPTY_PREFERENCES }; } catch { return { ...EMPTY_PREFERENCES }; }
};
HD2.savePrefs = (hass, key, value) => hass.callWS({ type: "frontend/set_user_data", key, value });
HD2.applyPrefs = (items, preferences) => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set();
  const all = [];
  for (const id of preferences?.order || []) {
    const item = byId.get(id);
    if (item) { all.push(item); seen.add(id); }
  }
  for (const item of items) if (!seen.has(item.id)) all.push(item);
  const hidden = new Set(preferences?.hidden || []);
  return { all, visible: all.filter((item) => !hidden.has(item.id)), hidden };
};

HD2.REG ??= createDashboardRegistry();
HD2.areaOf = (entry, registry) => entry?.area_id || (entry?.device_id ? registry?.deviceArea?.get(entry.device_id) : null) || null;
HD2.entryFilters ??= [];
HD2.registerEntryFilter ??= (filter) => {
  if (typeof filter !== "function") throw new TypeError("Dashboard entry filters must be functions");
  HD2.entryFilters.push(filter);
  return () => {
    const index = HD2.entryFilters.indexOf(filter);
    if (index >= 0) HD2.entryFilters.splice(index, 1);
  };
};
HD2.uiEntry = (entry) => Boolean(entry?.entity_id && !entry.disabled_by && !entry.hidden_by && !["diagnostic", "config"].includes(entry.entity_category) && HD2.entryFilters.every((filter) => filter(entry)));
HD2.card = async (hass, config) => {
  const helpers = await window.loadCardHelpers();
  const card = helpers.createCardElement(config);
  card.hass = hass;
  return card;
};
HD2.controlDomains = CONTROL_DOMAINS;
HD2.isPotential = (entry, state) => HD2.uiEntry(entry) && (CONTROL_DOMAINS.has(HD2.domain(entry.entity_id)) || (HD2.domain(entry.entity_id) === "binary_sensor" && state?.attributes?.device_class === "garage_door"));
HD2.isActive = (entry, state) => {
  if (!HD2.uiEntry(entry) || !state) return false;
  const domain = HD2.domain(entry.entity_id);
  const attributes = state.attributes || {};
  if (["light", "fan", "switch", "input_boolean"].includes(domain)) return state.state === "on";
  if (domain === "media_player") {
    if (["playing", "paused", "buffering", "on"].includes(state.state)) return true;
    const description = String(attributes.media_title || attributes.app_name || "");
    return state.state === "idle" && Boolean(description && !/^(idle|home(?: screen)?|default media receiver)$/i.test(description));
  }
  if (domain === "climate") return /^(heat|cool|heat_cool|auto|dry|fan_only)$/.test(state.state);
  if (domain === "cover") return /^(open|opening|closing)$/.test(state.state);
  if (domain === "lock") return state.state === "unlocked";
  if (domain === "vacuum") return /^(cleaning|returning)$/.test(state.state);
  return domain === "binary_sensor" && state.state === "on" && /^(door|window|garage_door|smoke|moisture|gas)$/.test(attributes.device_class || "");
};

const garageOperatorIdentity = (entry) => `${entry?.entity_id || ""} ${entry?.name || ""} ${entry?.original_name || ""}`.toLowerCase().replace(/[_./-]+/g, " ");
HD2.garageControl = (entry, registry, hass) => {
  if (!entry?.device_id) return null;
  const buttons = (registry?.byDevice?.get(entry.device_id) || []).filter((candidate) => HD2.domain(candidate?.entity_id) === "button" && HD2.uiEntry(candidate) && hass?.states?.[candidate.entity_id] && String(hass.states[candidate.entity_id].state).toLowerCase() !== "unavailable");
  const explicit = buttons.filter((candidate) => /\bgarage\s+door\b.*\b(trigger|operate|operator)\b|\b(trigger|operate|operator)\b.*\bgarage\s+door\b/.test(garageOperatorIdentity(candidate)));
  return explicit.length === 1 ? explicit[0].entity_id : null;
};

const entryName = (entry) => `${entry?.entity_id || ""} ${entry?.name || ""} ${entry?.original_name || ""}`.toLowerCase();
HD2.appleTvRegistry = (entityId, registry, hass, options = {}) => {
  const entity = (registry?.entities || []).find((row) => row?.entity_id === entityId) || null;
  const deviceId = entity?.device_id || options.deviceId || null;
  const siblings = deviceId ? registry?.byDevice?.get(deviceId) || [] : [];
  const visibleSiblings = (domain) => siblings.filter((entry) => HD2.uiEntry(entry) && entry?.entity_id && HD2.domain(entry.entity_id) === domain);
  const mediaEntry = entity || visibleSiblings("media_player").find((entry) => entry.entity_id === entityId) || null;
  const remoteEntry = visibleSiblings("remote").find((entry) => entry.platform === "apple_tv") || visibleSiblings("remote")[0] || null;
  const keyboardEntry = visibleSiblings("binary_sensor").find((entry) => /keyboard.*focus|focus.*keyboard/.test(entryName(entry))) || null;
  const device = (registry?.devices || []).find((row) => row.id === deviceId);
  const deviceConfigEntry = Array.isArray(device?.config_entries) ? device.config_entries[0] : null;
  const configEntryId = mediaEntry?.config_entry_id || remoteEntry?.config_entry_id || keyboardEntry?.config_entry_id || entity?.config_entry_id || deviceConfigEntry || null;
  const signature = JSON.stringify([deviceId, configEntryId, siblings.map((entry) => [entry.entity_id, entry.platform, entry.disabled_by, entry.hidden_by])]);
  return { entityId, deviceId, mediaEntry, remoteEntry, keyboardEntry, remoteEntityId: remoteEntry?.entity_id || null, keyboardEntityId: keyboardEntry?.entity_id || null, configEntryId, signature };
};
HD2.appleTvBundle = (entry, state, registry, hass) => {
  if (HD2.domain(entry?.entity_id) !== "media_player" || entry?.platform !== "apple_tv") return null;
  const info = HD2.appleTvRegistry(entry.entity_id, registry, hass, { deviceId: entry.device_id });
  return { type: "custom:component-apple-tv-controller-v1", entity: entry.entity_id, device_id: info?.deviceId || entry.device_id || null, title: HD2.stateName(hass, entry, state), icon: "mdi:apple" };
};
HD2.splitBundle = (entry, registry) => {
  if (!entry?.device_id || !registry) return null;
  const siblings = registry.byDevice?.get(entry.device_id) || [];
  const suffix = (candidate) => String(candidate?.entity_id || "").split(".")[1] || "";
  const find = (domain, ending) => siblings.find((candidate) => !candidate?.disabled_by && HD2.domain(candidate.entity_id) === domain && suffix(candidate).endsWith(ending));
  const controller = find("binary_sensor", "_controller_status");
  if (!controller) return null;
  const vertical = find("select", "_vertical_vane");
  const horizontal = find("select", "_horizontal_vane");
  return { controller_entity: controller.entity_id, vertical_vane_entity: vertical?.entity_id, horizontal_vane_entity: horizontal?.entity_id, room_id: HD2.areaOf(entry, registry) };
};
HD2.splitRegistryConfig = (entityId, splitRegistry) => {
  const system = splitRegistry?.systems?.get(entityId) || globalThis.__componentSplitRegistryV4?.result?.systems?.get(entityId);
  if (!system) return null;
  return { type: "custom:component-split-controller-v4", entity: entityId, room_id: system.room_id, registry_entity: system.registry_entity, controller_entity: system.controller_entity, vertical_vane_entity: system.vertical_vane_entity, horizontal_vane_entity: system.horizontal_vane_entity, minimum_target: system.minimum_target, maximum_target: system.maximum_target, fan_ceiling: system.fan_ceiling, last_mode: system.last_mode, deadline: system.deadline, profiles: system.profiles };
};

const defaultControlConfig = (entry, state, registry, hass, splitRegistry) => {
  const entityId = entry.entity_id;
  const domain = HD2.domain(entityId);
  const splitConfig = domain === "climate" ? HD2.splitRegistryConfig(entityId, splitRegistry) : null;
  const splitBundle = !splitConfig && domain === "climate" ? HD2.splitBundle(entry, registry) : null;
  if (splitConfig) return splitConfig;
  if (splitBundle) return { type: "custom:component-split-controller-v4", entity: entityId, ...splitBundle };
  if (domain === "binary_sensor" && state?.attributes?.device_class === "garage_door") {
    const controlEntity = HD2.garageControl(entry, registry, hass);
    return controlEntity ? { type: "custom:component-garage-door-controller-v1", title: HD2.stateName(hass, entry, state).replace(/ Garage Door Status$/i, ""), entity: entityId, control_entity: controlEntity } : { type: "custom:bubble-card", card_type: "button", button_type: "state", entity: entityId, show_state: true };
  }
  if (["light", "fan", "number"].includes(domain)) return { type: "custom:bubble-card", card_type: "button", button_type: "slider", entity: entityId, show_state: true, tap_action: { action: "more-info" } };
  if (["switch", "input_boolean"].includes(domain)) return { type: "custom:bubble-card", card_type: "button", button_type: "switch", entity: entityId, show_state: true, button_action: { tap_action: { action: "toggle" } }, tap_action: { action: "more-info" } };
  if (domain === "media_player") return HD2.appleTvBundle(entry, state, registry, hass) || { type: "custom:bubble-card", card_type: "media-player", entity: entityId, show_state: true, tap_action: { action: "more-info" } };
  if (domain === "climate") return { type: "custom:bubble-card", card_type: "climate", entity: entityId, show_state: true };
  if (domain === "cover") return { type: "custom:bubble-card", card_type: "cover", entity: entityId, show_state: true };
  if (domain === "lock") return { type: "custom:mushroom-lock-card", entity: entityId };
  if (domain === "vacuum") return { type: "custom:mushroom-vacuum-card", entity: entityId };
  if (domain === "select") return { type: "custom:mushroom-select-card", entity: entityId };
  if (domain === "button") return { type: "custom:mushroom-entity-card", entity: entityId, tap_action: { action: "perform-action", perform_action: "button.press", target: { entity_id: entityId }, confirmation: { text: "Run this control?" } }, hold_action: { action: "more-info" } };
  if (domain === "binary_sensor") return { type: "custom:bubble-card", card_type: "button", button_type: "state", entity: entityId, show_state: true, show_last_changed: false };
  return null;
};

HD2.controlResolvers ??= [];
HD2.registerControlResolver ??= (resolver) => {
  if (typeof resolver !== "function") throw new TypeError("Dashboard control resolvers must be functions");
  HD2.controlResolvers.push(resolver);
  return () => {
    const index = HD2.controlResolvers.indexOf(resolver);
    if (index >= 0) HD2.controlResolvers.splice(index, 1);
  };
};
HD2.controlConfig = (entry, state, registry, hass, splitRegistry) => {
  for (const resolver of HD2.controlResolvers) {
    const configuration = resolver(entry, state, registry, hass, splitRegistry);
    if (configuration) return configuration;
  }
  return defaultControlConfig(entry, state, registry, hass, splitRegistry);
};

HD2.preferenceEditor ??= async () => {
  await customElements.whenDefined("dashboard-preference-editor-v3");
  const editor = globalThis.__homeDashboardEditorV3 ??= document.createElement("dashboard-preference-editor-v3");
  if (editor.parentNode !== document.body) {
    editor.remove?.();
    document.body.append(editor);
  }
  return editor;
};
