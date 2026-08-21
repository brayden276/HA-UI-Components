/** Makes Active Now react directly to Home Assistant state changes. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__liveActiveStatesV1) return;
  prototype.__liveActiveStatesV1 = true;

  const hassDescriptor = Object.getOwnPropertyDescriptor(prototype, "hass");
  const baseHassSet = hassDescriptor?.set;
  const baseSetConfig = prototype.setConfig;
  const baseConnected = prototype.connectedCallback;
  const baseDisconnected = prototype.disconnectedCallback;
  const ACTIVE_DOMAINS = new Set([
    "light",
    "fan",
    "switch",
    "input_boolean",
    "media_player",
    "climate",
    "cover",
    "lock",
    "vacuum",
    "binary_sensor",
  ]);
  const ACTIVE_BINARY_CLASSES = /^(door|window|garage_door|smoke|moisture|gas)$/;

  prototype.stopActiveStateStream = function stopActiveStateStream() {
    clearTimeout(this.__activeStateRetry);
    this.__activeStateRetry = null;
    this.__activeStateToken = null;
    this.__activeStateConnection = null;

    const subscription = this.__activeStateSubscription;
    this.__activeStateSubscription = null;
    if (subscription) {
      Promise.resolve(subscription)
        .then((unsubscribe) => unsubscribe?.())
        .catch(() => {});
    }
  };

  prototype.handleActiveStateChanged = function handleActiveStateChanged(event) {
    if (this.c?.mode !== "active" || !this.h) return;

    const data = event?.data || event;
    const entityId = data?.entity_id;
    if (!entityId) return;

    const domain = globalThis.__homeDashboardV2?.domain?.(entityId);
    if (!ACTIVE_DOMAINS.has(domain)) return;

    const oldState = data?.old_state || this.h.states?.[entityId] || null;
    const newState = data?.new_state || null;
    if (domain === "binary_sensor") {
      const deviceClass =
        newState?.attributes?.device_class || oldState?.attributes?.device_class || "";
      if (!ACTIVE_BINARY_CLASSES.test(deviceClass)) return;
    }

    const HD2 = globalThis.__homeDashboardV2;
    if (!HD2?.isActive) return;

    let entry = this.d?.entities?.find((item) => item.entity_id === entityId) || null;
    if (entry && !HD2.uiEntry(entry)) return;
    entry ||= { entity_id: entityId };

    const wasActive = HD2.isActive(entry, oldState);
    const isActive = HD2.isActive(entry, newState);
    if (wasActive === isActive) return;

    const states = { ...(this.h.states || {}) };
    if (newState) states[entityId] = newState;
    else delete states[entityId];

    this.structureSig = "";
    if (baseHassSet) {
      baseHassSet.call(this, { ...this.h, states });
    } else {
      this.h = { ...this.h, states };
      this.schedule?.();
    }
  };

  prototype.startActiveStateStream = function startActiveStateStream() {
    if (this.c?.mode !== "active" || !this.isConnected) return;

    const connection = this.h?.connection;
    if (!connection?.subscribeEvents) return;
    if (
      this.__activeStateConnection === connection &&
      this.__activeStateSubscription
    ) {
      return;
    }

    this.stopActiveStateStream();
    this.__activeStateConnection = connection;
    const token = {};
    this.__activeStateToken = token;

    let subscription;
    try {
      subscription = connection.subscribeEvents(
        (event) => {
          if (this.__activeStateToken === token) {
            this.handleActiveStateChanged(event);
          }
        },
        "state_changed",
      );
    } catch {
      subscription = Promise.reject(new Error("state subscription failed"));
    }

    this.__activeStateSubscription = Promise.resolve(subscription).catch(() => {
      if (this.__activeStateToken !== token) return null;
      this.__activeStateSubscription = null;
      this.__activeStateRetry = setTimeout(() => {
        this.__activeStateRetry = null;
        this.startActiveStateStream();
      }, 10000);
      return null;
    });
  };

  Object.defineProperty(prototype, "hass", {
    configurable: true,
    get() {
      return this.h;
    },
    set(hass) {
      if (baseHassSet) baseHassSet.call(this, hass);
      else this.h = hass;
      this.startActiveStateStream();
    },
  });

  prototype.setConfig = function setConfig(config) {
    const result = baseSetConfig.call(this, config);
    if (this.c?.mode === "active") this.startActiveStateStream();
    else this.stopActiveStateStream();
    return result;
  };

  prototype.connectedCallback = function connectedCallback() {
    const result = baseConnected.call(this);
    this.startActiveStateStream();
    return result;
  };

  prototype.disconnectedCallback = function disconnectedCallback() {
    this.stopActiveStateStream();
    return baseDisconnected.call(this);
  };
});
