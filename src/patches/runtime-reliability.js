/** Runtime compatibility and lifecycle guards for retained component DOM. */
(() => {
  const shared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ?? {};
  const { createRequestCoalescer } = shared;

  const patch = (type, apply) => customElements.whenDefined(type).then(() => {
    const Card = customElements.get(type);
    if (Card) apply(Card.prototype);
  });

  const preserveLocalInteractionFields = (prototype, fields) => {
    const original = prototype.disconnectedCallback;
    if (typeof original !== "function" || original.__preservesRetainedInteractions) return;
    const wrapped = function disconnectWithRetainedInteractions(...args) {
      const saved = fields.map((field) => [field, this[field]]);
      for (const [field, value] of saved) this[field] = Array.isArray(value) ? [] : null;
      try {
        return original.apply(this, args);
      } finally {
        for (const [field, value] of saved) this[field] = value;
      }
    };
    wrapped.__preservesRetainedInteractions = true;
    prototype.disconnectedCallback = wrapped;
  };

  const retainedLocalFields = new Map([
    ["component-context-strip-v3", ["_interaction"]],
    ["component-history-graph-v2", ["interactions"]],
    ["component-three-stat-v2", ["_interactions"]],
    ["component-list-v2", ["_interactions"]],
    ["component-quick-nav-v2", ["_interactions"]],
    ["component-favourites-v3", ["_interactionHandles"]],
    ["component-room-navigation-v1", ["_interaction"]],
    ["component-control-row-v2", ["_interactions"]],
    ["component-split-controller-v4", ["_interactionHandles"]],
    ["component-media-row-v2", ["_interactions"]],
    ["component-room-sheet-v2", ["_interactions"]],
    ["component-update-summary-v3", ["_interaction"]],
    ["component-update-row-v3", ["_interactions"]],
    ["component-household-attention-v1", ["_interactionHandles"]],
    ["component-welcome-header-v1", ["_interaction"]],
    ["component-wled-controller-v1", ["_interactionHandles"]],
  ]);
  for (const [type, fields] of retainedLocalFields) {
    patch(type, (prototype) => preserveLocalInteractionFields(prototype, fields));
  }

  patch("component-device-discovery-v2", (prototype) => {
    const originalStyles = prototype.styles;
    if (typeof originalStyles === "function" && String(originalStyles).includes("${B}")) {
      prototype.styles = function stylesWithScopedBase() {
        const previous = globalThis.B;
        globalThis.B = shared.PRESENTATIONAL_CARD_STYLES ?? "";
        try { return originalStyles.call(this); }
        finally {
          if (previous === undefined) delete globalThis.B;
          else globalThis.B = previous;
        }
      };
    }
    const originalDisconnect = prototype.disconnectedCallback;
    if (!String(originalDisconnect).includes("started = false")) {
      prototype.disconnectedCallback = function disconnectDiscovery() {
        originalDisconnect?.call(this);
        this.timer = null;
        this.started = false;
      };
    }
  });

  patch("component-history-graph-v2", (prototype) => {
    if (prototype.connectedCallback) return;
    prototype.connectedCallback = function reconnectHistoryGraph() {
      if (this.e?.chart) this.ro?.observe(this.e.chart);
      this.draw?.();
    };
  });

  patch("energy-history-card-v3", (prototype) => {
    const originalConnected = prototype.connectedCallback;
    if (originalConnected?.__restoresResizeObserver) return;
    const wrapped = function reconnectEnergyHistory(...args) {
      const result = originalConnected?.apply(this, args);
      if (this.e?.chart) this._resizeObserver?.observe(this.e.chart);
      return result;
    };
    wrapped.__restoresResizeObserver = true;
    prototype.connectedCallback = wrapped;
  });

  patch("component-camera-controller-v1", (prototype) => {
    const original = prototype.renderControls;
    if (typeof original !== "function" || original.__preservesUnchangedControls) return;
    const wrapped = function renderControlsWithoutDroppingHandlers(...args) {
      if (this.bundleData) {
        const signature = JSON.stringify([
          this.confirmId,
          ...this.bundleData.detections.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
          ...this.bundleData.switches.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
          ...this.bundleData.buttons.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
        ]);
        if (signature === this.controlsSignature) return;
      }
      return original.apply(this, args);
    };
    wrapped.__preservesUnchangedControls = true;
    prototype.renderControls = wrapped;
  });

  patch("component-apple-tv-controller-v1", (prototype) => {
    prototype.setVolumeGesture = function setVolumeGesture(pressed, model) {
      this.volumeGestureActive = pressed;
      if (pressed && this.optimisticVolume === null) this.optimisticVolume = model.level;
      this.updateVolumeReadout(model);
    };

    prototype.ensureVolumeCoalescer = function ensureVolumeCoalescer() {
      if (this.volumeCoalescer && !this.volumeCoalescer.destroyed) return this.volumeCoalescer;
      this.volumeCoalescer = createRequestCoalescer(async (direction) => {
        const model = this.model();
        if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;
        if (!this.config.demo) {
          await this._hass.callService("media_player", `volume_${direction}`, { entity_id: model.entities.media });
        }
      }, {
        onError: () => this.setMessage("Apple TV did not respond", "error", 4000),
        onIdle: () => {
          if (this.volumeGestureActive) return;
          this.optimisticVolume = null;
          if (this.isConnected) this.render();
        },
      });
      return this.volumeCoalescer;
    };
  });

  patch("component-wled-controller-v1", (prototype) => {
    const original = prototype.renderPresets;
    if (typeof original !== "function" || original.__cleansPresetInteractions) return;
    const wrapped = function renderPresetsWithCleanup(...args) {
      for (const button of this.presetGrid?.querySelectorAll?.(".preset-btn") || []) {
        button._interaction?.destroy?.();
        button._interaction = null;
      }
      return original.apply(this, args);
    };
    wrapped.__cleansPresetInteractions = true;
    prototype.renderPresets = wrapped;
  });

  patch("component-room-directory-v4", (prototype) => {
    const originalHeader = prototype.renderSheetHeader;
    if (typeof originalHeader === "function" && !originalHeader.__cleansMetricInteractions) {
      const wrappedHeader = function renderSheetHeaderWithCleanup(...args) {
        if (this.environment && Array.isArray(this._interactionHandles)) {
          const retained = [];
          for (const handle of this._interactionHandles) {
            if (handle?.element && this.environment.contains(handle.element)) handle.destroy();
            else retained.push(handle);
          }
          this._interactionHandles = retained;
        }
        return originalHeader.apply(this, args);
      };
      wrappedHeader.__cleansMetricInteractions = true;
      prototype.renderSheetHeader = wrappedHeader;
    }

    const originalDisconnect = prototype.disconnectedCallback;
    if (typeof originalDisconnect === "function" && !originalDisconnect.__preservesRoomTiles) {
      const wrappedDisconnect = function disconnectRoomDirectory(...args) {
        const saved = [];
        for (const tile of this.tiles?.values?.() || []) {
          saved.push([tile, tile._interaction]);
          tile._interaction = null;
        }
        try {
          return originalDisconnect.apply(this, args);
        } finally {
          for (const [tile, handle] of saved) tile._interaction = handle;
        }
      };
      wrappedDisconnect.__preservesRoomTiles = true;
      prototype.disconnectedCallback = wrappedDisconnect;
    }
  });

  patch("component-update-summary-v3", (prototype) => {
    if (prototype.disconnectedCallback) return;
    prototype.disconnectedCallback = function disconnectUpdateSummary() {
      window.clearTimeout(this.messageTimer);
      this.messageTimer = null;
    };
  });
})();
