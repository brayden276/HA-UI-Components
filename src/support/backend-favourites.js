/** Backend preference storage adapter for the existing Favourites component. */
const backendFavouritesRuntime = globalThis.__homeDashboardV2;
const BackendFavourites = customElements.get("component-favourites-v3");

if (backendFavouritesRuntime && BackendFavourites && !BackendFavourites.prototype.__backendStorageV1) {
  const prototype = BackendFavourites.prototype;
  prototype.__backendStorageV1 = true;
  const originalSetConfig = prototype.setConfig;
  const originalSyncStored = prototype._syncStored;
  const originalStorageSignature = prototype._storageSignature;
  const originalRenderGrid = prototype._renderGrid;
  const originalSave = prototype._save;
  const originalSubscribe = prototype._subscribeRegistryEvents;
  const originalUnsubscribe = prototype._unsubscribeRegistryEvents;

  prototype.setConfig = function setBackendFavouritesConfig(config) {
    const preferenceKey = String(config?.preference_key || "").trim();
    const demoItems = Array.isArray(config?.items) ? config.items : [];
    if (!preferenceKey || demoItems.length) {
      originalSetConfig.call(this, config);
      return;
    }
    const legacyHelpers = Array.isArray(config?.helpers)
      ? config.helpers.filter((entityId) => typeof entityId === "string")
      : [];
    this._backendPreferenceInitialising = true;
    originalSetConfig.call(this, {
      ...config,
      helpers: legacyHelpers.length ? legacyHelpers : ["__backend_preference__"],
    });
    this._legacyFavouriteHelpers = legacyHelpers.slice(0, 4);
    this.config.helpers = [];
    this.config.preference_key = preferenceKey;
    this._preferenceLoaded = false;
    this._preferenceError = null;
    this._backendPreferenceInitialising = false;
    if (this.$?.edit) {
      this.$.edit.hidden = false;
      this.$.edit.disabled = true;
      this.$.edit.setAttribute("aria-busy", "true");
    }
    this._syncStored();
    this._renderGrid();
  };

  prototype._syncStored = function syncBackendFavourites() {
    if (!this.config?.preference_key) {
      originalSyncStored.call(this);
      return;
    }
    if (this._backendPreferenceInitialising || !this._hass) return;
    void this._loadBackendFavourites();
  };

  prototype._loadBackendFavourites = async function loadBackendFavourites(force = false) {
    if (!this._hass || !this.config?.preference_key) return;
    const hass = this._hass;
    const key = this.config.preference_key;
    if (this._preferencePromise) {
      if (
        force ||
        this._preferenceRequestHass !== hass ||
        this._preferenceRequestKey !== key
      ) {
        this._preferenceReloadPending = true;
      }
      return this._preferencePromise;
    }
    if (this._preferenceLoaded && !force) return;
    this._preferenceRequestHass = hass;
    this._preferenceRequestKey = key;
    this._preferencePromise = backendFavouritesRuntime
      .prefs(hass, key)
      .then(async (stored) => {
        if (hass !== this._hass || key !== this.config?.preference_key) return;
        let selected = Array.isArray(stored)
          ? stored.map((item) => this._normaliseRef(item)).filter(Boolean).slice(0, this.config.max)
          : [];
        if (!Array.isArray(stored) && this._legacyFavouriteHelpers?.length) {
          selected = this._legacyFavouriteHelpers
            .map((entityId) => this._parseSlot(hass.states?.[entityId]?.state))
            .filter(Boolean)
            .slice(0, this.config.max);
          if (selected.length) {
            await backendFavouritesRuntime.savePrefs(hass, key, selected);
          }
        }
        this._selected = selected;
        this._preferenceLoaded = true;
        this._preferenceError = null;
        if (this.$?.edit) {
          this.$.edit.disabled = false;
          this.$.edit.removeAttribute("aria-busy");
        }
        this._lastStorageSignature = this._storageSignature();
        this._renderSignature = "";
        this._renderGrid();
        if (this.$?.editor?.open) this._updateEditorState();
      })
      .catch((error) => {
        if (hass !== this._hass) return;
        this._preferenceError = error;
        this._renderGrid();
      })
      .finally(() => {
        this._preferencePromise = null;
        this._preferenceRequestHass = null;
        this._preferenceRequestKey = null;
        if (this._preferenceReloadPending) {
          this._preferenceReloadPending = false;
          if (this._hass && this.config?.preference_key) {
            void this._loadBackendFavourites(true);
          }
        }
      });
    return this._preferencePromise;
  };

  prototype._storageSignature = function backendFavouriteSignature() {
    if (!this.config?.preference_key) return originalStorageSignature.call(this);
    return JSON.stringify(this._selected);
  };

  prototype._renderGrid = function renderBackendFavourites() {
    originalRenderGrid.call(this);
    if (!this.config?.preference_key || !this.$?.grid) return;
    if (this._preferenceError) {
      this.$.edit.disabled = true;
      this.$.edit.removeAttribute("aria-busy");
      this.$.grid.innerHTML =
        '<div class="load-error">Favourites storage could not be loaded. Try again shortly.</div>';
    } else if (!this._preferenceLoaded) {
      this.$.edit.disabled = true;
      this.$.edit.setAttribute("aria-busy", "true");
      this.$.grid.innerHTML = '<div class="empty">Loading favourites…</div>';
    } else {
      this.$.edit.disabled = false;
      this.$.edit.removeAttribute("aria-busy");
    }
  };

  prototype._save = async function saveBackendFavourites() {
    if (!this.config?.preference_key) {
      return originalSave.call(this);
    }
    if (this.$.save.disabled) return;
    if (this._editorStorageSignature !== this._storageSignature()) {
      this._updateEditorState();
      return;
    }
    const selected = this._draft
      .map((item) => this._normaliseRef(item))
      .filter(Boolean)
      .slice(0, this.config.max);
    this.$.save.disabled = true;
    this.$.save.setAttribute("aria-busy", "true");
    this.$.save.style.minWidth = "84px";
    this.$.save.textContent = "Saving…";
    this.$.editorError.textContent = "";
    try {
      await backendFavouritesRuntime.savePrefs(
        this._hass,
        this.config.preference_key,
        selected,
      );
      this._selected = selected.map((item) => ({ ...item }));
      this._preferenceLoaded = true;
      this._preferenceError = null;
      this._lastStorageSignature = this._storageSignature();
      this._renderSignature = "";
      this._editorStorageSignature = this._storageSignature();
      this.$.editor.close();
      this._renderGrid();
      this._notice("Favourites saved.");
    } catch (error) {
      this.$.editorError.textContent =
        error?.message ||
        "Favourites could not be saved. Your current choices are still open; try again.";
    } finally {
      const error = this.$.editorError.textContent;
      this.$.save.removeAttribute("aria-busy");
      this.$.save.textContent = "Save";
      this._updateEditorState();
      if (error) this.$.editorError.textContent = error;
    }
  };

  prototype._subscribeRegistryEvents = function subscribeBackendFavourites() {
    originalSubscribe.call(this);
    if (
      !this.isConnected ||
      this._preferenceSubscription ||
      !this.config?.preference_key ||
      !this._connection?.subscribeEvents
    ) {
      return;
    }
    const subscription = this._connection
      .subscribeEvents((event) => {
        if (event?.data?.key === this.config?.preference_key) {
          void this._loadBackendFavourites(true);
        }
      }, "ha_component_backend_preferences_updated")
      .then((unsubscribe) => unsubscribe);
    this._preferenceSubscription = subscription;
    subscription.catch(() => {
      if (this._preferenceSubscription === subscription) {
        this._preferenceSubscription = null;
      }
    });
  };

  prototype._unsubscribeRegistryEvents = function unsubscribeBackendFavourites() {
    originalUnsubscribe.call(this);
    const subscription = this._preferenceSubscription;
    this._preferenceSubscription = null;
    if (subscription) Promise.resolve(subscription).then((unsubscribe) => unsubscribe?.()).catch(() => {});
  };
}

const MinimalFavourites = customElements.get("component-favourites-minimal-v1");
if (MinimalFavourites && !MinimalFavourites.prototype.__backendStorageV1) {
  MinimalFavourites.prototype.__backendStorageV1 = true;
  const originalMinimalSetConfig = MinimalFavourites.prototype.setConfig;
  MinimalFavourites.prototype.setConfig = function setMinimalBackendFavourites(config) {
    originalMinimalSetConfig.call(this, {
      preference_key: "home-control.favourites.v1",
      ...config,
    });
  };
}
