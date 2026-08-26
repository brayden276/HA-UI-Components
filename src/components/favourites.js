/** ComponentFavouritesV3 — reusable Home Assistant dashboard card. */
const {
  escapeHtml,
  interaction,
  openMoreInfo,
  registerCard,
  waitForEntityState,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const FAVOURITES_V3_DOMAINS = new Set([
    "automation",
    "button",
    "climate",
    "cover",
    "fan",
    "humidifier",
    "input_boolean",
    "input_button",
    "light",
    "lock",
    "media_player",
    "scene",
    "script",
    "select",
    "switch",
    "vacuum",
    "water_heater",
  ]),
  FAVOURITES_V3_INVALID = new Set(["unavailable", "unknown"]);
class ComponentFavouritesV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._registry = null;
    this._registryPromise = null;
    this._selected = [];
    this._draft = [];
    this._originalDraft = "";
    this._pending = new Map();
    this._flash = new Map();
    this._flashTimers = new Map();
    this._lastStorageSignature = "";
    this._noticeTimer = null;
    this._registrySubscription = null;
    this._registryRefreshTimer = null;
    this._renderSignature = "";
    this._editorStorageSignature = "";
    this._connection = null;
    this._interactionHandles = [];
    this._optimistic = new Map();
    this._preferenceLoaded = false;
    this._preferenceError = null;
    this._preferencePromise = null;
    this._preferenceSubscription = null;
    this._preferenceReloadPending = false;
  }
  setConfig(config) {
    this._unsubscribePreferenceEvents();
    const legacyHelpers = Array.isArray(config?.helpers)
        ? config.helpers.filter((helper) => typeof helper === "string")
        : [],
      demoItems = Array.isArray(config?.items) ? config.items.slice(0, 4) : [],
      preferenceKey = String(config?.preference_key || "").trim();
    if (!legacyHelpers.length && !demoItems.length && !preferenceKey)
      throw new Error("helpers, items or preference_key is required");
    this._legacyFavouriteHelpers = preferenceKey ? legacyHelpers.slice(0, 4) : [];
    this._preferenceLoaded = !preferenceKey;
    this._preferenceError = null;
    this._preferencePromise = null;
    this._preferenceReloadPending = false;
    this.config = {
      title: "Favourites",
      max: 4,
      show_header: legacyHelpers.length > 0 || Boolean(preferenceKey),
      ...config,
      helpers: preferenceKey ? [] : legacyHelpers.slice(0, 4),
      items: demoItems,
      preference_key: preferenceKey || null,
    };
    this._build();
    this._subscribePreferenceEvents();
    this._syncStored();
    this._renderGrid();
  }
  set hass(hass) {
    const previousConnection = this._connection;
    this._hass = hass;
    this._connection = hass?.connection || null;
    if (!this._built) this._build();
    if (previousConnection !== this._connection) {
      this._unsubscribeRegistryEvents();
      this._subscribeRegistryEvents();
    }
    this._syncStored();
    void this._ensureRegistry();
    const signature = this._gridSignature();
    if (signature !== this._renderSignature) {
      this._renderSignature = signature;
      this._renderGrid();
    }
    if (this.$?.editor?.open) this._updateEditorState();
    if (this._controllerCard) this._controllerCard.hass = hass;
  }
  getCardSize() {
    return 2;
  }
  connectedCallback() {
    this._connection = this._hass?.connection || null;
    this._subscribeRegistryEvents();
    void this._ensureRegistry();
  }
  disconnectedCallback() {
    // Controls are bound to retained shadow DOM and are replaced on render.
    this._optimistic.clear();
    clearTimeout(this._noticeTimer);
    clearTimeout(this._registryRefreshTimer);
    this._registryRefreshTimer = null;
    this._unsubscribeRegistryEvents();
    for (const timer of this._flashTimers.values()) clearTimeout(timer);
    this._flashTimers.clear();
  }
  _subscribeRegistryEvents() {
    if (
      !this.isConnected ||
      this._registrySubscription ||
      !this._connection?.subscribeEvents
    )
      return;
    const subscription = Promise.all(
      [
        "entity_registry_updated",
        "device_registry_updated",
        "area_registry_updated",
      ].map((eventType) =>
        this._connection.subscribeEvents(() => this._queueRegistryRefresh(), eventType),
      ),
    ).then((unsubscribeAll) => () => {
      for (const unsubscribe of unsubscribeAll) unsubscribe?.();
    });
    this._registrySubscription = subscription;
    subscription.catch(() => {
      if (this._registrySubscription === subscription) {
        this._registrySubscription = null;
      }
    });
    this._subscribePreferenceEvents();
  }
  _subscribePreferenceEvents() {
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
  }
  _unsubscribeRegistryEvents() {
    const subscription = this._registrySubscription;
    this._registrySubscription = null;
    if (subscription) {
      Promise.resolve(subscription)
          .then((t) => t?.())
          .catch(() => {});
    }
    this._unsubscribePreferenceEvents();
  }
  _unsubscribePreferenceEvents() {
    const preferenceSubscription = this._preferenceSubscription;
    this._preferenceSubscription = null;
    preferenceSubscription &&
      Promise.resolve(preferenceSubscription)
        .then((unsubscribe) => unsubscribe?.())
        .catch(() => {});
  }
  _queueRegistryRefresh() {
    clearTimeout(this._registryRefreshTimer);
    this._registryRefreshTimer = setTimeout(() => {
      this._registryRefreshTimer = null;
      this._registry = null;
      this._registryPromise = null;
      this._registryError = null;
      this._renderSignature = "";
      if (this.isConnected) void this._ensureRegistry();
    }, 180);
  }
  _storageSignature() {
    if (this.config?.preference_key) return JSON.stringify(this._selected);
    return JSON.stringify(
      (this.config?.helpers || []).map((t) => this._hass?.states?.[t]?.state),
    );
  }
  _gridSignature() {
    if (!this.config) return "";
    return JSON.stringify([
      this._storageSignature(),
      this._selected.map((t, s) => {
        const e = this._record(t),
          i = this._companion(e);
        return [
          this._refKey(t),
          this._name(e),
          this._icon(e),
          e.state?.state,
          this._stateLabel(e),
          this._isActive(e),
          i?.state?.state,
          this._pending.get(s)?.label || "",
          this._flash.get(s)?.kind || "",
          this._flash.get(s)?.label || "",
        ];
      }),
    ]);
  }
  _build() {
    if (this.config && !this._built) {
      (this._built = !0),
        (this.shadowRoot.innerHTML =
          '\n      <style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;cursor:pointer}ha-card{border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.wrap{padding:0}.head{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.heading{display:flex;align-items:center;gap:8px;min-width:0}.heading ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.heading h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.edit{min-width:44px;min-height:44px;padding:0 10px;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-color);display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:600}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.edit ha-icon{--mdc-icon-size:18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:448px}.item{position:relative;min-width:0;min-height:52px;display:grid;grid-template-columns:minmax(0,1fr) auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));overflow:hidden}.main{min-width:0;min-height:52px;padding:6px 8px;text-align:left;background:transparent;display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:8px}.item.has-quick .main{padding-right:4px}.main:active,.quick:active{background:color-mix(in srgb,var(--primary-color) 10%,transparent)}.main:focus-visible,.quick:focus-visible,.edit:focus-visible,.dialog-button:focus-visible,.choice:focus-visible,.order:focus-visible,.remove:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.icon{width:32px;height:32px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:650}.state{margin-top:2px;font-size:13px;color:var(--secondary-text-color)}.item.active{background:var(--dashboard-active-surface,var(--card-background-color));box-shadow:inset 2px 0 0 var(--primary-color)}.item.active .icon{background:transparent;color:var(--primary-color)}.item.active .state{color:var(--primary-color);font-weight:600}.item.unavailable{opacity:.55}.quick{width:44px;min-height:52px;padding:0;border-left:1px solid var(--dashboard-card-border-color,var(--divider-color));background:transparent;color:var(--primary-color);display:grid;place-items:center}.quick ha-icon{--mdc-icon-size:21px}.item:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;opacity:0;transform-origin:left}.item.pending:after{opacity:1;background:linear-gradient(90deg,transparent,var(--primary-color),transparent);animation:favourite-progress 1.05s linear infinite}.item.success:after{opacity:1;background:var(--success-color,#43a047)}.item.error:after{opacity:1;background:var(--error-color)}@keyframes favourite-progress{from{transform:translateX(-100%)}to{transform:translateX(100%)}}.empty,.load-error{grid-column:1/-1;min-height:44px;padding:9px 11px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:transparent;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.notice{min-height:0;margin-top:0;font-size:13px;color:var(--secondary-text-color)}.notice:not(:empty){margin-top:7px}.notice.error{color:var(--error-color)}dialog{box-sizing:border-box;border:var(--dashboard-card-border,1px solid var(--divider-color));padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}.editor{width:min(580px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 24px));border-radius:var(--dashboard-radius-dialog,8px)}.dialog-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:transparent;border-bottom:1px solid var(--divider-color)}.dialog-title{font-size:20px;font-weight:650}.close{width:44px;height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.editor-body{padding:14px 16px 96px}.editor-copy{font-size:13px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:12px}.subheading{margin:14px 0 7px;font-size:13px;font-weight:650;color:var(--primary-text-color)}.selected{display:grid;gap:7px}.selected-row{min-height:62px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px;padding:6px 7px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color))}.selected-row .icon{background:transparent}.selected-copy{min-width:0}.selected-meta{font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.alias{width:100%;height:44px;margin-top:3px;padding:0 8px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;font-size:13px;outline:none}.alias:focus{border-color:var(--primary-color)}.selected-actions{display:flex;align-items:center;gap:2px}.order,.remove{width:44px;height:44px;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.order[disabled]{opacity:.3;cursor:default}.remove{color:var(--error-color)}.order ha-icon,.remove ha-icon{--mdc-icon-size:18px}.search{width:100%;min-height:46px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;outline:none}.search:focus{border-color:var(--primary-color)}.available{margin-top:8px}.group-title{padding:10px 4px 5px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.choice{width:100%;min-height:58px;padding:6px 7px;border-radius:var(--dashboard-radius-control,8px);background:transparent;text-align:left;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px}.choice:hover{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.choice-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.choice-meta{margin-top:2px;font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.add{color:var(--primary-color);font-size:13px;font-weight:650;padding-right:4px}.available-empty{padding:10px 7px;color:var(--secondary-text-color);font-size:13px}.editor-actions{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;background:transparent;border-top:1px solid var(--divider-color)}.count{font-size:13px;color:var(--secondary-text-color)}.action-buttons{display:flex;gap:8px}.dialog-button{min-height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.dialog-button.primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}.dialog-button[disabled]{opacity:.45;cursor:default}.editor-error{min-height:0;margin-top:8px;color:var(--error-color);font-size:13px}.confirm{width:min(430px,calc(100vw - 28px));border-radius:var(--dashboard-radius-dialog,8px)}.confirm-body{padding:18px}.confirm-title{font-size:18px;font-weight:650}.confirm-message{margin-top:7px;font-size:13px;line-height:1.45;color:var(--secondary-text-color)}.confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.controller{width:min(620px,calc(100vw - 20px));max-height:calc(100vh - 20px);border-radius:var(--dashboard-radius-dialog,8px);overflow:auto}.controller-body{padding:12px}.controller-body>*{display:block}.controller .dialog-head{border-bottom:0}@media(max-width:420px){.head{margin-bottom:6px}.edit span{display:none}.edit{padding:0}.grid{gap:8px}.main{padding:6px}.editor-body{padding:12px 12px 94px}.dialog-head{padding:12px}.editor-actions{padding:11px 12px}.selected-row{grid-template-columns:30px minmax(0,1fr) auto;gap:7px;padding:5px}.selected-actions{gap:0}.order,.remove{width:44px}.choice{padding:5px}}\n      </style>\n      <ha-card>\n        <div class="wrap">\n          <div class="head">\n            <div class="heading"><ha-icon icon="mdi:star-outline"></ha-icon><h2></h2></div>\n            <button class="edit" type="button"><ha-icon icon="mdi:pencil-outline"></ha-icon><span>Edit</span></button>\n          </div>\n          <div class="grid"></div>\n          <div class="notice" role="status" aria-live="polite"></div>\n        </div>\n      </ha-card>\n      <dialog class="editor" aria-labelledby="favourites-editor-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-editor-title">Edit favourites</div><button class="close editor-close" type="button" aria-label="Close editor"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="editor-body">\n          <div class="editor-copy">Choose up to four household controls. Their order here is their order on Home.</div>\n          <div class="subheading">Selected</div>\n          <div class="selected"></div>\n          <div class="subheading">Available controls</div>\n          <input class="search" type="search" placeholder="Search by name, room or entity" aria-label="Search available controls">\n          <div class="available"></div>\n          <div class="editor-error" role="alert"></div>\n        </div>\n        <div class="editor-actions"><div class="count"></div><div class="action-buttons"><button class="dialog-button cancel" type="button">Cancel</button><button class="dialog-button primary save" type="button">Save</button></div></div>\n      </dialog>\n      <dialog class="confirm" aria-labelledby="favourites-confirm-title">\n        <div class="confirm-body"><div class="confirm-title" id="favourites-confirm-title"></div><div class="confirm-message"></div><div class="confirm-actions"><button class="dialog-button confirm-cancel" type="button">Cancel</button><button class="dialog-button primary confirm-run" type="button">Run</button></div></div>\n      </dialog>\n      <dialog class="controller" aria-labelledby="favourites-controller-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-controller-title">Climate</div><button class="close controller-close" type="button" aria-label="Close climate controller"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="controller-body"></div>\n      </dialog>\n    '),
        (this.$ = Object.fromEntries(
          [...this.shadowRoot.querySelectorAll("[class]")].flatMap((t) =>
            [...t.classList].map((e) => [e, t]),
          ),
        )),
        Object.assign(this.$, {
          editorClose: this.shadowRoot.querySelector(".editor-close"),
          confirmCancel: this.shadowRoot.querySelector(".confirm-cancel"),
          confirmRun: this.shadowRoot.querySelector(".confirm-run"),
          confirmTitle: this.shadowRoot.querySelector(".confirm-title"),
          confirmMessage: this.shadowRoot.querySelector(".confirm-message"),
          controllerClose: this.shadowRoot.querySelector(".controller-close"),
          controllerTitle: this.shadowRoot.querySelector(
            "#favourites-controller-title",
          ),
          controllerBody: this.shadowRoot.querySelector(".controller-body"),
          editorError: this.shadowRoot.querySelector(".editor-error"),
        }),
        (this.shadowRoot.querySelector("h2").textContent = this.config.title),
        (this.$.head.hidden = !1 === this.config.show_header),
        (this.$.edit.hidden =
          !this.config.helpers.length && !this.config.preference_key),
        this.$.edit.addEventListener("click", () => this._openEditor()),
        this.$.editorClose.addEventListener("click", () =>
          this.$.editor.close(),
        ),
        this.$.cancel.addEventListener("click", () => this.$.editor.close()),
        this.$.search.addEventListener("input", () => this._renderAvailable()),
        this.$.save.addEventListener("click", () => this._save()),
        this.$.confirmCancel.addEventListener("click", () =>
          this.$.confirm.close(),
        ),
        this.$.controllerClose.addEventListener("click", () =>
          this.$.controller.close(),
        );
      for (const t of [this.$.editor, this.$.confirm, this.$.controller])
        t.addEventListener("click", (e) => {
          e.target === t && t.close();
        });
    }
  }
  _escape(t) {
    return escapeHtml(t);
  }
  _domain(t) {
    return String(t || "").split(".")[0];
  }
  _normaliseRef(t) {
    return t &&
      "object" == typeof t &&
      [t.d, t.p, t.u].every((t) => "string" == typeof t && t)
      ? {
          v: 1,
          d: t.d,
          p: t.p,
          u: t.u,
          n: "string" == typeof t.n ? t.n.slice(0, 64) : "",
        }
      : null;
  }
  _parseSlot(t) {
    if (!t || FAVOURITES_V3_INVALID.has(String(t).toLowerCase())) return null;
    try {
      return this._normaliseRef(JSON.parse(t));
    } catch (t) {
      return null;
    }
  }
  _syncStored() {
    if (this.config?.preference_key) {
      if (!this._hass) return;
      void this._loadBackendFavourites();
      return;
    }
    if (!this.config || !this._hass || !this.config.helpers.length) return;
    const storageSignature = JSON.stringify(
      this.config.helpers.map((entityId) => this._hass.states?.[entityId]?.state),
    );
    if (storageSignature === this._lastStorageSignature) return;
    this._lastStorageSignature = storageSignature;
    this._selected = this.config.helpers
      .map((entityId) => this._parseSlot(this._hass.states?.[entityId]?.state))
      .filter(Boolean)
      .slice(0, this.config.max);
  }
  _isCurrentPreferenceRequest(hass, key) {
    return hass === this._hass && key === this.config?.preference_key;
  }
  _normaliseStoredFavourites(stored) {
    return Array.isArray(stored)
      ? stored
          .map((item) => this._normaliseRef(item))
          .filter(Boolean)
          .slice(0, this.config.max)
      : [];
  }
  async _migrateLegacyFavourites(hass, key) {
    const selected = this._legacyFavouriteHelpers
      .map((entityId) => this._parseSlot(hass.states?.[entityId]?.state))
      .filter(Boolean)
      .slice(0, this.config.max);
    if (selected.length) {
      await globalThis.__homeDashboardV2.savePrefs(hass, key, selected);
    }
    return selected;
  }
  _applyLoadedFavourites(selected) {
    this._selected = selected;
    this._preferenceLoaded = true;
    this._preferenceError = null;
    this._lastStorageSignature = this._storageSignature();
    this._renderSignature = "";
    this._renderGrid();
    if (this.$?.editor?.open) this._updateEditorState();
  }
  async _loadBackendFavourites(force = false) {
    if (!this._hass || !this.config?.preference_key) return;
    const hass = this._hass;
    const key = this.config.preference_key;
    if (this._preferencePromise) {
      const requestHasChanged =
        this._preferenceRequestHass !== hass || this._preferenceRequestKey !== key;
      if (force || requestHasChanged) {
        this._preferenceReloadPending = true;
      }
      return this._preferencePromise;
    }
    if (this._preferenceLoaded && !force) return;
    this._preferenceRequestHass = hass;
    this._preferenceRequestKey = key;
    const request = Promise.resolve(globalThis.__homeDashboardV2.prefs(hass, key))
      .then(async (stored) => {
        if (!this._isCurrentPreferenceRequest(hass, key)) return;
        let selected = this._normaliseStoredFavourites(stored);
        if (!Array.isArray(stored) && this._legacyFavouriteHelpers.length) {
          selected = await this._migrateLegacyFavourites(hass, key);
        }
        if (this._isCurrentPreferenceRequest(hass, key)) {
          this._applyLoadedFavourites(selected);
        }
      })
      .catch((error) => {
        if (!this._isCurrentPreferenceRequest(hass, key)) return;
        this._preferenceError = error;
        this._renderGrid();
      })
      .finally(() => {
        if (this._preferencePromise === request) {
          this._preferencePromise = null;
          this._preferenceRequestHass = null;
          this._preferenceRequestKey = null;
        }
        if (this._preferenceReloadPending) {
          this._preferenceReloadPending = false;
          if (this._hass && this.config?.preference_key) {
            void this._loadBackendFavourites(true);
          }
        }
      });
    this._preferencePromise = request;
    return request;
  }
  async _ensureRegistry() {
    if (this._registry) return this._registry;
    if (this._registryPromise) return this._registryPromise;
    const connection = this._hass?.connection;
    if (!connection?.sendMessagePromise) return null;
    this._registryPromise = Promise.all([
      connection.sendMessagePromise({ type: "config/entity_registry/list" }),
      connection.sendMessagePromise({ type: "config/device_registry/list" }),
      connection.sendMessagePromise({ type: "config/area_registry/list" }),
    ])
      .then(async ([entityEntries, deviceEntries, areaEntries]) => {
        this._registry = this._createRegistry(
          entityEntries,
          deviceEntries,
          areaEntries,
        );
        await this._refreshSplitRegistry();
        this._renderSignature = "";
        this._renderGrid();
        if (this.$?.editor?.open) this._renderEditor();
        return this._registry;
      })
      .catch((error) => {
        this._registryError = error;
        this._registryPromise = null;
        this._renderGrid();
        return null;
      });
    return this._registryPromise;
  }
  _createRegistry(entityEntries, deviceEntries, areaEntries) {
    const entities = Array.isArray(entityEntries) ? entityEntries : [];
    const devices = Array.isArray(deviceEntries) ? deviceEntries : [];
    const areas = Array.isArray(areaEntries) ? areaEntries : [];
    const byKey = new Map();
    const byDevice = new Map();
    for (const entry of entities) {
      const key = this._entryKey(entry);
      if (key) byKey.set(key, entry);
      if (!entry.device_id) continue;
      if (!byDevice.has(entry.device_id)) byDevice.set(entry.device_id, []);
      byDevice.get(entry.device_id).push(entry);
    }
    return {
      entities,
      devices: new Map(devices.map((entry) => [entry.id, entry])),
      areas: new Map(areas.map((entry) => [entry.area_id, entry.name])),
      byKey,
      byDevice,
      claimed: new Set(),
      splitSystems: new Map(),
    };
  }
  async _refreshSplitRegistry() {
    const splitRegistry = globalThis.__componentSplitRegistryV4;
    if (!this._registry || !splitRegistry?.load || !this._hass) return;
    try {
      const result = await splitRegistry.load(this._hass);
      this._registry.claimed = result?.claimed || new Set();
      this._registry.splitSystems = result?.systems || new Map();
    } catch {
      this._registry.claimed = new Set();
      this._registry.splitSystems = new Map();
    }
  }
  _entryKey(t) {
    return t?.entity_id && t.platform && t.unique_id
      ? `${this._domain(t.entity_id)}|${t.platform}|${t.unique_id}`
      : null;
  }
  _refKey(t) {
    return t ? `${t.d}|${t.p}|${t.u}` : "";
  }
  _refForEntry(t, e = "") {
    return {
      v: 1,
      d: this._domain(t.entity_id),
      p: t.platform,
      u: t.unique_id,
      n: e,
    };
  }
  _record(ref) {
    const entry = this._registry?.byKey.get(this._refKey(ref)) || null;
    return {
      ref,
      entry,
      state: (entry && this._hass?.states?.[entry.entity_id]) || null,
    };
  }
  _name(t) {
    return (
      t.ref?.n?.trim() ||
      t.entry?.name ||
      t.entry?.original_name ||
      t.state?.attributes?.friendly_name ||
      t.entry?.entity_id ||
      "Favourite not found"
    );
  }
  _icon(t) {
    if (t.state?.attributes?.icon) return t.state.attributes.icon;
    return (
      {
        automation: "mdi:robot-outline",
        button: "mdi:gesture-tap-button",
        climate: "mdi:thermostat",
        cover: "mdi:window-shutter",
        fan: "mdi:fan",
        humidifier: "mdi:air-humidifier",
        input_boolean: "mdi:toggle-switch-outline",
        input_button: "mdi:gesture-tap-button",
        light: "mdi:lightbulb-outline",
        lock: "mdi:lock-outline",
        media_player: "mdi:play-circle-outline",
        scene: "mdi:palette-outline",
        script: "mdi:script-text-outline",
        select: "mdi:format-list-bulleted",
        switch: "mdi:toggle-switch-outline",
        vacuum: "mdi:robot-vacuum",
        water_heater: "mdi:water-boiler",
      }[t.entry ? this._domain(t.entry.entity_id) : t.ref?.d] ||
      "mdi:star-outline"
    );
  }
  _companion(t) {
    if (!t.entry?.device_id || !this._registry) return null;
    const e = (this._registry.byDevice.get(t.entry.device_id) || [])
      .filter((t) => "binary_sensor" === this._domain(t.entity_id))
      .map((t) => ({ entry: t, state: this._hass?.states?.[t.entity_id] }))
      .filter(({ state: t }) =>
        ["garage_door", "door", "opening"].includes(
          t?.attributes?.device_class,
        ),
      );
    return (
      e.find(({ state: t }) => "garage_door" === t?.attributes?.device_class) ||
      e[0] ||
      null
    );
  }
  _companionLabel(t) {
    return t?.state
      ? "on" === t.state.state
        ? "Open"
        : "off" === t.state.state
          ? "Closed"
          : "unavailable" === t.state.state
            ? "Status unavailable"
            : "Status unknown"
      : null;
  }
  _stateLabel(t) {
    if (!t.entry || !t.state) return "Not found";
    if ("unavailable" === t.state.state) return "Unavailable";
    if ("unknown" === t.state.state) return "Status unknown";
    const e = this._domain(t.entry.entity_id),
      i = this._companion(t);
    if (["button", "input_button"].includes(e)) {
      const t = this._companionLabel(i);
      return t ? `${t} · Tap to operate` : "Tap to run";
    }
    if (["automation", "script"].includes(e)) return "Tap to start";
    if ("scene" === e) return "Tap to activate";
    if ("media_player" === e) {
      const e = t.state.attributes?.media_title,
        i = this._label(t.state.state);
      return e ? `${i} · ${e}` : i;
    }
    if ("climate" === e) {
      const e = t.state.attributes?.hvac_action;
      return this._label(e && "idle" !== e ? e : t.state.state);
    }
    return this._label(t.state.state);
  }
  _label(t) {
    return String(t ?? "")
      .replaceAll("_", " ")
      .replace(/^./, (t) => t.toUpperCase());
  }
  _isActive(t) {
    if (
      !t.state ||
      FAVOURITES_V3_INVALID.has(String(t.state.state).toLowerCase())
    )
      return !1;
    const e = this._domain(t.entry?.entity_id);
    return ["light", "switch", "fan", "input_boolean"].includes(e)
      ? "on" === t.state.state
      : "media_player" === e
        ? ["playing", "paused", "buffering", "on"].includes(t.state.state)
        : "climate" === e
          ? "off" !== t.state.state
          : "cover" === e
            ? "closed" !== t.state.state
            : "lock" === e && "unlocked" === t.state.state;
  }
  _hasMediaQuick(t) {
    return (
      "media_player" === this._domain(t.entry?.entity_id) &&
      ["playing", "paused"].includes(t.state?.state)
    );
  }
  _actionLabel(t) {
    const e = this._domain(t.entry?.entity_id);
    return ["light", "switch", "fan", "input_boolean"].includes(e)
      ? "on" === t.state?.state
        ? "turn off"
        : "turn on"
      : ["button", "input_button"].includes(e)
        ? "run"
        : ["automation", "script"].includes(e)
          ? "start"
          : "scene" === e
            ? "activate"
            : "climate" === e
              ? "open climate controls"
              : "open details";
  }
  _renderGrid() {
    for (const t of this._interactionHandles) t.destroy();
    this._interactionHandles = [];
    if (!this.$?.grid || !this.config) return;
    if (this.config.preference_key) {
      if (this._preferenceError) {
        this.$.edit.disabled = true;
        this.$.edit.removeAttribute("aria-busy");
        this.$.grid.innerHTML =
          '<div class="load-error">Favourites storage could not be loaded. Try again shortly.</div>';
        return;
      }
      if (!this._preferenceLoaded) {
        this.$.edit.disabled = true;
        this.$.edit.setAttribute("aria-busy", "true");
        this.$.grid.innerHTML = '<div class="empty">Loading favourites…</div>';
        return;
      }
      this.$.edit.disabled = false;
      this.$.edit.removeAttribute("aria-busy");
    }
    if (this.config.items.length && !this.config.helpers.length)
      return void this._renderDemo();
    this.$.grid.replaceChildren();
    this.config.helpers.some((t) => {
      const e = this._hass?.states?.[t];
      return (
        this._hass &&
        (!e || FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase()))
      );
    })
      ? (this.$.grid.innerHTML =
          '<div class="load-error">Favourites storage is unavailable.</div>')
      : this._registry
        ? this._selected.length
          ? this._selected.forEach((t, e) => {
              const i = this._record(t),
                s = this._name(i),
                r = this._stateLabel(i),
                a = this._pending.get(e),
                o = this._flash.get(e),
                n = a?.label || o?.label || r,
                l = this._hasMediaQuick(i),
                u =
                  !i.state ||
                  FAVOURITES_V3_INVALID.has(
                    String(i.state.state).toLowerCase(),
                  ),
                c = document.createElement("div");
              c.className = [
                "item",
                l ? "has-quick" : "",
                (
                  this._optimistic.has(e)
                    ? this._optimistic.get(e)
                    : this._isActive(i)
                )
                  ? "active"
                  : "",
                u ? "unavailable" : "",
                a ? "pending" : "",
                o?.kind || "",
              ]
                .filter(Boolean)
                .join(" ");
              const d = document.createElement("button");
              (d.type = "button"),
                (d.className = "main"),
                d.setAttribute(
                  "aria-label",
                  `${s}, ${r}, ${this._actionLabel(i)}`,
                ),
                u &&
                  ((d.disabled = !0), d.setAttribute("aria-disabled", "true"));
              const h = this._domain(i.entry?.entity_id);
              if (
                (["light", "switch", "fan", "input_boolean"].includes(h) &&
                  d.setAttribute(
                    "aria-pressed",
                    String(
                      this._optimistic.has(e)
                        ? this._optimistic.get(e)
                        : "on" === i.state?.state,
                    ),
                  ),
                (d.innerHTML = `<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="copy"><div class="name">${this._escape(s)}</div><div class="state">${this._escape(n)}</div></span>`),
                this._interactionHandles.push(
                  interaction(d, {
                    primary: () => this._activate(e),
                    hold: () => this._moreInfo(i.entry?.entity_id),
                    optimistic: !1,
                    repeat: !1,
                    feedback: !0,
                  }),
                ),
                c.append(d),
                l)
              ) {
                const t = document.createElement("button");
                (t.type = "button"), (t.className = "quick");
                const r = "playing" === i.state.state;
                t.setAttribute("aria-label", `${r ? "Pause" : "Play"} ${s}`),
                  (t.innerHTML = `<ha-icon icon="mdi:${r ? "pause" : "play"}"></ha-icon>`),
                  this._interactionHandles.push(
                    interaction(t, {
                      primary: () => this._mediaAction(e),
                      optimistic: !1,
                      repeat: !1,
                      feedback: !0,
                    }),
                  ),
                  c.append(t);
              }
              this.$.grid.append(c);
            })
          : (this.$.grid.innerHTML =
              '<div class="empty">Add up to four everyday controls here.</div>')
        : (this.$.grid.innerHTML = `<div class="${this._registryError ? "load-error" : "empty"}">${this._registryError ? "Favourites could not load the entity registry." : "Loading favourites…"}</div>`);
  }
  _renderDemo() {
    this.$.grid.replaceChildren();
    for (const item of this.config.items.slice(0, 4)) {
      const tile = document.createElement("div");
      tile.className = "item";
      tile.innerHTML = `<div class="main"><span class="icon"><ha-icon icon="${this._escape(item.icon || "mdi:star-outline")}"></ha-icon></span><span class="copy"><div class="name">${this._escape(item.title || "Favourite")}</div><div class="state">${this._escape(item.state || "Supporting state")}</div></span></div>`;
      this.$.grid.append(tile);
    }
  }
  async _activate(t) {
    if (this._pending.has(t)) return;
    const e = this._record(this._selected[t]);
    if (!e.entry || !e.state) return void this._openEditor();
    const i = e.entry.entity_id,
      s = this._domain(i);
    if (!FAVOURITES_V3_INVALID.has(String(e.state.state).toLowerCase()))
      if (["button", "input_button"].includes(s)) this._confirmButton(t, e);
      else {
        if (["light", "switch", "fan", "input_boolean"].includes(s)) {
          const s = e.state.state;
          this._optimistic.set(t, "on" !== s),
            this._setPending(t, "on" === s ? "Turning off…" : "Turning on…");
          try {
            await this._hass.callService("homeassistant", "toggle", {
              entity_id: i,
            }),
              await this._waitFor(i, (t) => t !== s, 9e3),
              this._setFlash(t, "success", "on" === s ? "Off" : "On");
          } catch (e) {
            this._setFlash(t, "error", "Could not update");
          }
          return;
        }
        if (["automation", "script", "scene"].includes(s)) {
          const e = "automation" === s ? "trigger" : "turn_on",
            r = "scene" === s ? "Activating…" : "Starting…",
            a = "scene" === s ? "Activated" : "Started";
          this._setPending(t, r);
          try {
            await this._hass.callService(s, e, { entity_id: i }),
              this._setFlash(t, "success", a);
          } catch (e) {
            this._setFlash(t, "error", "Could not start");
          }
          return;
        }
        "climate" === s && this._registry?.splitSystems?.has(i)
          ? this._openSplit(e)
          : this._moreInfo(i);
      }
    else this._moreInfo(i);
  }
  async _mediaAction(t) {
    if (this._pending.has(t)) return;
    const e = this._record(this._selected[t]);
    if (!e.entry || !e.state) return;
    const i = e.entry.entity_id,
      s = "playing" === e.state.state,
      r = s ? "media_pause" : "media_play";
    this._optimistic.set(t, !s),
      this._setPending(t, s ? "Pausing…" : "Playing…");
    try {
      await this._hass.callService("media_player", r, { entity_id: i }),
        await this._waitFor(
          i,
          (t) => (s ? "playing" !== t : "playing" === t),
          9e3,
        ),
        this._setFlash(t, "success", s ? "Paused" : "Playing");
    } catch (e) {
      this._setFlash(t, "error", "Could not update");
    }
  }
  _confirmButton(t, e) {
    const i = this._name(e),
      s = this._companion(e),
      r = this._companionLabel(s);
    (this.$.confirmTitle.textContent = r ? `Operate ${i}?` : `Run ${i}?`),
      (this.$.confirmMessage.textContent = r
        ? `The current reported state is ${r.toLowerCase()}.`
        : "This action runs immediately and cannot be reversed from this button."),
      (this.$.confirmRun.textContent = r ? "Operate" : "Run"),
      (this.$.confirmRun.onclick = () => {
        this.$.confirm.close(), this._runButton(t, e);
      }),
      this.$.confirm.showModal(),
      this.$.confirmCancel.focus();
  }
  async _runButton(t, e) {
    const i = e.entry.entity_id,
      s = this._domain(i);
    this._setPending(t, "Sending command…");
    try {
      await this._hass.callService(s, "press", { entity_id: i }),
        this._setFlash(t, "success", "Command sent");
    } catch (e) {
      this._setFlash(t, "error", "Command failed");
    }
  }
  _setPending(index, label) {
    this._pending.set(index, { label });
    this._flash.delete(index);
    this._renderGrid();
  }
  _setFlash(index, kind, label) {
    this._optimistic.delete(index);
    this._pending.delete(index);
    this._flash.set(index, { kind, label });
    clearTimeout(this._flashTimers.get(index));
    this._flashTimers.set(
      index,
      setTimeout(() => {
        this._flash.delete(index);
        this._flashTimers.delete(index);
        this._renderGrid();
      }, 3200),
    );
    this._renderGrid();
  }
  _waitFor(t, e, i) {
    return waitForEntityState(() => this._hass, t, e, { timeout: i });
  }
  _moreInfo(t) {
    openMoreInfo(this, t);
  }
  _openSplit(t) {
    const e = "component-split-controller-v4";
    if (!customElements.get(e)) return void this._moreInfo(t.entry.entity_id);
    (this.$.controllerTitle.textContent = this._name(t)),
      this.$.controllerBody.replaceChildren();
    const i = document.createElement(e);
    i.setConfig({ entity: t.entry.entity_id }),
      (i.hass = this._hass),
      (this._controllerCard = i),
      this.$.controllerBody.append(i),
      this.$.controller.showModal(),
      this.$.controllerClose.focus();
  }
  async _openEditor() {
    await this._ensureRegistry();
    await this._refreshSplitRegistry();
    this._editorStorageSignature = this._storageSignature();
    this._draft = this._selected.map((item) => ({ ...item }));
    this._originalDraft = JSON.stringify(this._draft);
    this.$.search.value = "";
    this.$.editorError.textContent = "";
    this._renderEditor();
    this.$.editor.showModal();
    setTimeout(() => this.$.search.focus(), 30);
  }
  _renderEditor() {
    this._renderSelected();
    this._renderAvailable();
    this._updateEditorState();
  }
  _renderSelected() {
    this.$.selected.replaceChildren(),
      this._draft.length
        ? this._draft.forEach((t, e) => {
            const i = this._record(t),
              s = document.createElement("div");
            (s.className = "selected-row"),
              (s.innerHTML = `<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="selected-copy"><div class="selected-meta">${this._escape(this._name({ ...i, ref: { ...t, n: "" } }))}</div><input class="alias" type="text" maxlength="64" value="${this._escape(t.n)}" placeholder="Optional shorter label" aria-label="Custom label for ${this._escape(this._name(i))}"></span><span class="selected-actions"><button class="order up" type="button" aria-label="Move ${this._escape(this._name(i))} earlier" ${0 === e ? "disabled" : ""}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="order down" type="button" aria-label="Move ${this._escape(this._name(i))} later" ${e === this._draft.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="remove" type="button" aria-label="Remove ${this._escape(this._name(i))}"><ha-icon icon="mdi:close"></ha-icon></button></span>`),
              s.querySelector(".alias").addEventListener("input", (t) => {
                (this._draft[e].n = t.target.value.slice(0, 64)),
                  this._updateEditorState();
              }),
              s
                .querySelector(".up")
                .addEventListener("click", () => this._move(e, -1)),
              s
                .querySelector(".down")
                .addEventListener("click", () => this._move(e, 1)),
              s.querySelector(".remove").addEventListener("click", () => {
                this._draft.splice(e, 1), this._renderEditor();
              }),
              this.$.selected.append(s);
          })
        : (this.$.selected.innerHTML =
            '<div class="available-empty">No favourites selected.</div>');
  }
  _move(index, direction) {
    const destination = index + direction;
    if (destination < 0 || destination >= this._draft.length) return;
    [this._draft[index], this._draft[destination]] = [
      this._draft[destination],
      this._draft[index],
    ];
    this._renderEditor();
  }
  _eligibleEntries() {
    if (!this._registry || !this._hass) return [];
    const t = new Set(this._draft.map((t) => this._refKey(t))),
      e = new Set(this.config.helpers);
    return this._registry.entities.filter((i) => {
      const s = this._domain(i.entity_id);
      return (
        FAVOURITES_V3_DOMAINS.has(s) &&
        i.unique_id &&
        i.platform &&
        !i.disabled_by &&
        !i.hidden_by &&
        !i.entity_category &&
        this._hass.states?.[i.entity_id] &&
        !e.has(i.entity_id) &&
        !this._registry.claimed.has(i.entity_id) &&
        !t.has(this._entryKey(i))
      );
    });
  }
  _areaName(t) {
    if (!t) return "Missing";
    const e = t.device_id ? this._registry?.devices.get(t.device_id) : null,
      i = t.area_id || e?.area_id;
    return i && this._registry?.areas.has(i)
      ? this._registry.areas.get(i)
      : ["automation", "scene", "script"].includes(this._domain(t.entity_id))
        ? "Routines"
        : "Household";
  }
  _renderAvailable() {
    if (!this.$?.available) return;
    if ((this.$.available.replaceChildren(), !this._registry))
      return void (this.$.available.innerHTML =
        '<div class="available-empty">Loading household controls…</div>');
    const t = this.$.search.value.trim().toLowerCase(),
      e = this._eligibleEntries()
        .map((t) => {
          const e = this._record(this._refForEntry(t));
          return {
            entry: t,
            record: e,
            name: this._name(e),
            area: this._areaName(t),
          };
        })
        .filter(({ entry: e, name: i, area: s }) =>
          `${i} ${s} ${e.entity_id} ${this._domain(e.entity_id)}`
            .toLowerCase()
            .includes(t),
        )
        .sort((t, e) =>
          `${t.area}\0${t.name}`.localeCompare(`${e.area}\0${e.name}`, void 0, {
            sensitivity: "base",
          }),
        );
    if (!e.length)
      return void (this.$.available.innerHTML = `<div class="available-empty">${this._draft.length >= this.config.max ? "Four favourites selected. Remove one to choose another." : "No matching household controls."}</div>`);
    let i = "";
    for (const t of e) {
      if (t.area !== i) {
        i = t.area;
        const e = document.createElement("div");
        (e.className = "group-title"),
          (e.textContent = i),
          this.$.available.append(e);
      }
      const e = document.createElement("button");
      (e.type = "button"),
        (e.className = "choice"),
        (e.disabled = this._draft.length >= this.config.max),
        (e.innerHTML = `<span class="icon"><ha-icon icon="${this._escape(this._icon(t.record))}"></ha-icon></span><span><div class="choice-name">${this._escape(t.name)}</div><div class="choice-meta">${this._escape(`${this._label(this._domain(t.entry.entity_id))} · ${this._stateLabel(t.record)}`)}</div></span><span class="add">Add</span>`),
        e.addEventListener("click", () => {
          this._draft.length >= this.config.max ||
            (this._draft.push(this._refForEntry(t.entry)),
            this._renderEditor());
        }),
        this.$.available.append(e);
    }
  }
  _slotValue(t) {
    return t ? JSON.stringify(this._normaliseRef(t)) : "";
  }
  _updateEditorState() {
    const t = this.config.helpers
        .map((t, e) => this._slotValue(this._draft[e] || null))
        .every((t, e) => {
          const i = Number(
            this._hass?.states?.[this.config.helpers[e]]?.attributes?.max ||
              255,
          );
          return t.length <= i;
        }),
      e = this.config.helpers.every((t) => {
        const e = this._hass?.states?.[t];
        return e && !FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase());
      }),
      i = JSON.stringify(this._draft) !== this._originalDraft,
      s = Boolean(
        this.$?.editor?.open &&
          this._editorStorageSignature &&
          this._editorStorageSignature !== this._storageSignature(),
      );
    (this.$.count.textContent = `${this._draft.length} of ${this.config.max} selected`),
      (this.$.save.disabled = !i || !t || !e || s),
      (this.$.editorError.textContent = s
        ? "Favourites changed on another dashboard. Close and reopen the editor before trying again."
        : e
          ? t
            ? ""
            : "A stored favourite is too long. Shorten its custom label."
          : "Favourites storage is unavailable.");
  }
  async _save() {
    if (this.config.preference_key) {
      await this._saveBackendFavourites();
      return;
    }
    if (this.$.save.disabled) return;
    if (this._editorStorageSignature !== this._storageSignature())
      return void this._updateEditorState();
    const t = this.config.helpers.map(
        (t) => this._hass.states?.[t]?.state || "",
      ),
      e = this.config.helpers.map((t, e) =>
        this._slotValue(this._draft[e] || null),
      );
    (this.$.save.disabled = !0),
      (this.$.save.textContent = "Saving…"),
      (this.$.editorError.textContent = "");
    try {
      for (let t = 0; t < this.config.helpers.length; t += 1)
        await this._hass.callService("input_text", "set_value", {
          entity_id: this.config.helpers[t],
          value: e[t],
        });
      (this._selected = this._draft.map((t) => ({ ...t }))),
        (this._lastStorageSignature = ""),
        (this._renderSignature = ""),
        (this._editorStorageSignature = this._storageSignature()),
        this.$.editor.close(),
        this._renderGrid(),
        this._notice("Favourites saved.");
    } catch (e) {
      let i = !0;
      for (let e = 0; e < this.config.helpers.length; e += 1)
        try {
          await this._hass.callService("input_text", "set_value", {
            entity_id: this.config.helpers[e],
            value: t[e],
          });
        } catch (t) {
          i = !1;
        }
      this.$.editorError.textContent = i
        ? "Favourites could not be saved. No changes were kept."
        : "Favourites could not be saved, and some stored slots may have changed. Close and reopen the editor before trying again.";
    } finally {
      const t = this.$.editorError.textContent;
      (this.$.save.textContent = "Save"),
        this._updateEditorState(),
        t && (this.$.editorError.textContent = t);
    }
  }
  async _saveBackendFavourites() {
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
      await globalThis.__homeDashboardV2.savePrefs(
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
  }
  _notice(message, isError = false) {
    clearTimeout(this._noticeTimer);
    this.$.notice.textContent = message;
    this.$.notice.classList.toggle("error", isError);
    this._noticeTimer = setTimeout(() => {
      this.$.notice.textContent = "";
      this.$.notice.classList.remove("error");
    }, 3600);
  }
}
registerCard({
  type: "component-favourites-v3",
  element: ComponentFavouritesV3,
  name: "Favourites",
  description:
    "Registry-aware persistent household favourites with safe actions.",
});
