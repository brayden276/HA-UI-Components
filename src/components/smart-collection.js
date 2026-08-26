(() => {
  globalThis.__homeDashboardV2 ??= {};
  const HD2 = globalThis.__homeDashboardV2;
  const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

  class ComponentSmartCollectionV3 extends HTMLElement {
    static getGridOptions() {
      return { columns: 12, rows: "auto" };
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.c = null;
      this.h = null;
      this.d = null;
      this.prefs = { order: [], hidden: [] };
      this.prefsLoaded = false;
      this.unsub = null;
      this.activeStateSubscription = null;
      this.activeStateToken = null;
      this.activeStateConnection = null;
      this.activeStateRetry = null;
      this.gen = 0;
      this.structureSig = "";
      this.reconcileIncomplete = false;
      this.cards = new Map();
      this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.heading{display:flex;align-items:center;gap:7px;min-width:0}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.head.sep{min-height:30px;margin:2px 0 6px}.head.sep .heading{flex:1}.head.sep .heading h2{font-size:12px;font-weight:500;color:var(--secondary-text-color)}.head.sep .heading ha-icon{display:none}.head.sep .heading:after{content:'';height:1px;background:var(--divider-color);flex:1}.body{display:grid;gap:8px;min-width:0}.empty{min-height:44px;padding:8px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);color:var(--secondary-text-color);font-size:12px;display:flex;align-items:center;gap:8px}.empty ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}</style><ha-card><div class="head"><span class="heading"><ha-icon></ha-icon><h2></h2></span><button class="edit" type="button" aria-label="Edit"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="body"></div></ha-card>`;
      this.head = this.shadowRoot.querySelector(".head");
      this.body = this.shadowRoot.querySelector(".body");
      this.edit = this.shadowRoot.querySelector(".edit");
      this.edit.onclick = () => this.openEditor();
    }

    setConfig(config) {
      this.c = {
        mode: "all",
        title: "Controls",
        icon: "mdi:tune-variant",
        pref_key: null,
        show_header: true,
        header_style: "title",
        editable: false,
        exclude_device_names: [],
        ...config,
      };
      this.head.hidden = !this.c.show_header;
      this.head.classList.toggle("sep", this.c.header_style === "separator");
      this.head.querySelector("h2").textContent = this.c.title;
      this.head.querySelector(".heading ha-icon").setAttribute("icon", this.c.icon);
      this.edit.hidden = !this.c.editable;
      this.structureSig = "";
      this.loadPrefs();
      this.schedule();
      if (this.c.mode === "active") this.startActiveStateStream();
      else this.stopActiveStateStream();
    }

    set hass(hass) {
      this.h = hass;
      for (const record of this.cards.values()) record.el.hass = hass;
      this.unsub || this.subscribe();
      if (!this.prefsLoaded) this.loadPrefs();
      if (!this.d || this.c?.mode === "active" || this.reconcileIncomplete) this.schedule();
      this.startActiveStateStream();
    }

    connectedCallback() {
      this.subscribe();
      this.schedule();
      this.startActiveStateStream();
    }

    disconnectedCallback() {
      this.unsub?.();
      this.unsub = null;
      this.stopActiveStateStream();
      this.gen++;
    }

    getCardSize() {
      return 2;
    }

    subscribe() {
      if (this.unsub || !this.h || !HD2.REG?.subscribe) return;
      this.unsub = HD2.REG.subscribe(this.h, (data) => {
        this.d = data;
        this.structureSig = "";
        this.schedule();
      });
    }

    isCameraOwner(entry) {
      if (entry?.platform !== "onvif" || HD2.domain(entry.entity_id) !== "camera") return false;
      const identity = `${entry.entity_id} ${entry.name || entry.original_name || ""}`;
      return !/sub.?stream/i.test(identity);
    }

    isCameraDeviceActive(entry) {
      if (!entry?.device_id) return false;
      return (this.d?.byDevice?.get(entry.device_id) || []).some((sibling) => {
        if (HD2.domain(sibling.entity_id) !== "binary_sensor") return false;
        const state = this.h?.states?.[sibling.entity_id];
        const deviceClass = state?.attributes?.device_class || "";
        const identity = `${sibling.entity_id} ${sibling.name || sibling.original_name || ""}`;
        return state?.state === "on" &&
          (/^(motion|occupancy|presence|sound)$/.test(deviceClass) || /motion|human|person|detect/i.test(identity));
      });
    }

    isGarageTrigger(entry, garageDevices) {
      if (!garageDevices.has(entry?.device_id) || HD2.domain(entry.entity_id) !== "button") return false;
      const identity = `${entry.entity_id || ""} ${entry.name || ""} ${entry.original_name || ""}`.toLowerCase();
      return /(garage.?door|door).*(trigger|operate)|(trigger|operate).*(garage.?door|door)/.test(identity);
    }

    async loadPrefs() {
      if (!this.h || !this.c?.pref_key || !HD2.prefs) return;
      this.prefs = await HD2.prefs(this.h, this.c.pref_key);
      this.prefsLoaded = true;
      this.structureSig = "";
      this.schedule();
    }

    candidates() {
      if (!this.d || !this.h) return [];
      const media = this.d.entities.filter((entry) =>
        HD2.uiEntry(entry) &&
        HD2.domain(entry.entity_id) === "media_player" &&
        this.h.states[entry.entity_id],
      );
      const mediaDevices = new Set(media.map((entry) => entry.device_id).filter(Boolean));
      const mediaNames = media
        .map((entry) => HD2.stateName(this.h, entry, this.h.states[entry.entity_id]).trim().toLowerCase())
        .filter(Boolean);
      const excluded = new Set(this.c.exclude_device_names || []);
      const deviceNames = new Map(this.d.devices.map((device) => [device.id, device.name_by_user || device.name || ""]));

      const candidates = this.d.entities
        .filter((entry) => {
          const state = this.h.states[entry.entity_id];
          const cameraOwner = this.isCameraOwner(entry);
          const eligible = this.c.mode === "sound"
            ? Boolean(entry?.entity_id && !entry.disabled_by)
            : HD2.uiEntry(entry) && (entry.platform !== "onvif" || cameraOwner);
          if (!eligible || !state || excluded.has(deviceNames.get(entry.device_id))) return false;

          const domain = HD2.domain(entry.entity_id);
          const area = HD2.areaOf(entry, this.d);
          const controlName = HD2.stateName(this.h, entry, state).trim().toLowerCase();
          if (this.c.mode === "area") return area === this.c.area_id && (HD2.isPotential(entry, state) || cameraOwner);
          if (this.c.mode === "media") return domain === "media_player";
          if (this.c.mode === "sound") {
            return ["switch", "number", "select"].includes(domain) &&
              (mediaDevices.has(entry.device_id) || mediaNames.some((name) => controlName.startsWith(`${name} `)));
          }
          if (this.c.mode === "active" || this.c.mode === "all") {
            return cameraOwner || HD2.isPotential(entry, state) ||
              (this.c.mode === "active" && domain === "binary_sensor" && /^(door|window|smoke|moisture|gas)$/.test(state.attributes?.device_class || ""));
          }
          return false;
        });
      const garageDevices = new Set(candidates
        .filter((entry) => HD2.domain(entry.entity_id) === "binary_sensor" && this.h.states[entry.entity_id]?.attributes?.device_class === "garage_door")
        .map((entry) => entry.device_id)
        .filter(Boolean));
      return candidates.filter((entry) => !this.isGarageTrigger(entry, garageDevices));
    }

    shown(entries) {
      return this.c.mode === "active"
        ? entries.filter((entry) => this.isCameraOwner(entry)
          ? this.isCameraDeviceActive(entry)
          : HD2.isActive(entry, this.h.states[entry.entity_id]))
        : entries;
    }

    meta(entry) {
      const area = HD2.areaOf(entry, this.d);
      const name = this.d.areaMap?.get(area)?.name || "Household";
      return `${name} · ${HD2.label(HD2.domain(entry.entity_id))}`;
    }

    schedule() {
      if (!this.h || !this.c || !HD2.REG?.load) return;
      const generation = ++this.gen;
      queueMicrotask(() => this.sync(generation));
    }

    stopActiveStateStream() {
      clearTimeout(this.activeStateRetry);
      this.activeStateRetry = null;
      this.activeStateToken = null;
      this.activeStateConnection = null;
      const subscription = this.activeStateSubscription;
      this.activeStateSubscription = null;
      if (subscription) Promise.resolve(subscription).then((unsubscribe) => unsubscribe?.()).catch(() => {});
    }

    handleActiveStateChanged(event) {
      if (this.c?.mode !== "active" || !this.h) return;
      const data = event?.data || event;
      const entityId = data?.entity_id;
      if (!entityId) return;
      const domain = HD2.domain?.(entityId);
      if (!new Set(["light", "fan", "switch", "input_boolean", "media_player", "climate", "cover", "lock", "vacuum", "binary_sensor"]).has(domain)) return;
      const oldState = data.old_state || this.h.states?.[entityId] || null;
      const newState = data.new_state || null;
      if (domain === "binary_sensor" && !/^(door|window|garage_door|smoke|moisture|gas)$/.test(newState?.attributes?.device_class || oldState?.attributes?.device_class || "")) return;
      let entry = this.d?.entities?.find((item) => item.entity_id === entityId) || null;
      if (entry && !HD2.uiEntry(entry)) return;
      entry ||= { entity_id: entityId };
      if (HD2.isActive(entry, oldState) === HD2.isActive(entry, newState)) return;
      const states = { ...(this.h.states || {}) };
      if (newState) states[entityId] = newState;
      else delete states[entityId];
      this.structureSig = "";
      this.hass = { ...this.h, states };
    }

    startActiveStateStream() {
      if (this.c?.mode !== "active" || !this.isConnected) return;
      const connection = this.h?.connection;
      if (!connection?.subscribeEvents || (this.activeStateConnection === connection && this.activeStateSubscription)) return;
      this.stopActiveStateStream();
      this.activeStateConnection = connection;
      const token = {};
      this.activeStateToken = token;
      let subscription;
      try {
        subscription = connection.subscribeEvents((event) => {
          if (this.activeStateToken === token) this.handleActiveStateChanged(event);
        }, "state_changed");
      } catch {
        subscription = Promise.reject(new Error("state subscription failed"));
      }
      this.activeStateSubscription = Promise.resolve(subscription).catch(() => {
        if (this.activeStateToken !== token) return null;
        this.activeStateSubscription = null;
        this.activeStateRetry = setTimeout(() => {
          this.activeStateRetry = null;
          this.startActiveStateStream();
        }, 10000);
        return null;
      });
    }

    tune(card) {
      if (card?.localName !== "component-split-controller-v4" || !card.shadowRoot || card.shadowRoot.querySelector("style[data-home-minimal]")) return;
      const style = document.createElement("style");
      style.dataset.homeMinimal = "";
      style.textContent = ".nm{font-weight:500!important}.iw{color:var(--secondary-text-color)!important}.rv{font-size:22px!important;font-weight:500!important}.tv{font-size:16px!important;font-weight:500!important}.al,.pt,.gt,.o,.tpr button,.tcu button,.tac button{font-weight:500!important}.pt{font-size:16px!important}.a ha-icon{--mdc-icon-size:17px!important}";
      card.shadowRoot.append(style);
    }

    async sync(generation) {
      const data = this.d || await HD2.REG.load(this.h);
      if (generation !== this.gen) return;
      this.d ||= data;

      const candidates = this.candidates().sort((left, right) =>
        HD2.stateName(this.h, left, this.h.states[left.entity_id]).localeCompare(
          HD2.stateName(this.h, right, this.h.states[right.entity_id]),
          undefined,
          { sensitivity: "base" },
        ),
      );
      const preferences = HD2.applyPrefs(candidates.map((entry) => ({ id: entry.entity_id, entry })), this.prefs);
      const visible = this.shown(preferences.visible.map((item) => item.entry));
      const rows = [];
      for (const entry of visible) {
        const config = this.isCameraOwner(entry)
          ? { type: "custom:component-camera-controller-v1", entity: entry.entity_id, device_id: entry.device_id }
          : HD2.controlConfig(entry, this.h.states[entry.entity_id], this.d, this.h);
        if (config) rows.push({ entry, config, signature: JSON.stringify(config) });
      }

      const structureSignature = JSON.stringify(rows.map(({ entry, signature }) => [entry.entity_id, signature]));
      if (structureSignature === this.structureSig) {
        for (const record of this.cards.values()) record.el.hass = this.h;
        return;
      }

      const staged = new Map();
      for (const row of rows) {
        const current = this.cards.get(row.entry.entity_id);
        if (current?.sig === row.signature) {
          staged.set(row.entry.entity_id, current);
          continue;
        }
        try {
          const element = await HD2.card(this.h, row.config);
          if (generation !== this.gen) return;
          this.tune(element);
          staged.set(row.entry.entity_id, { el: element, sig: row.signature });
        } catch {
          // Leave the committed rows and signature intact so the next sync retries.
        }
      }
      if (generation !== this.gen) return;
      if (staged.size !== rows.length) {
        this.reconcileIncomplete = true;
        return;
      }

      const retained = new Set(staged.values());
      for (const record of this.cards.values()) {
        if (!retained.has(record)) record.el.remove();
      }
      this.cards.clear();
      for (const [entityId, record] of staged) this.cards.set(entityId, record);

      if (!rows.length) {
        if (!this.empty) {
          this.empty = document.createElement("div");
          this.empty.className = "empty";
          this.empty.innerHTML = "<ha-icon></ha-icon><span></span>";
        }
        this.empty.querySelector("ha-icon").setAttribute("icon", this.c.mode === "active" ? "mdi:check-circle-outline" : "mdi:gesture-tap");
        this.empty.querySelector("span").textContent = this.c.mode === "active" ? "Everything is quiet" : "No controls available";
        if (!this.empty.isConnected) this.body.append(this.empty);
      } else {
        this.empty?.remove();
        for (const { entry } of rows) {
          const record = this.cards.get(entry.entity_id);
          record.el.hass = this.h;
          if (this.body.lastElementChild !== record.el) this.body.append(record.el);
        }
      }
      this.structureSig = structureSignature;
      this.reconcileIncomplete = false;
    }

    async openEditor() {
      if (!this.h || !this.c?.pref_key || !HD2.REG?.load) return;
      const editor = await HD2.preferenceEditor();
      this.d = this.d || await HD2.REG.load(this.h);
      const items = this.candidates().map((entry) => ({
        id: entry.entity_id,
        name: HD2.stateName(this.h, entry, this.h.states[entry.entity_id]),
        meta: this.meta(entry),
        icon: this.isCameraOwner(entry) ? "mdi:cctv" : HD2.icon(entry, this.h.states[entry.entity_id]),
      }));
      const preferences = HD2.applyPrefs(items, this.prefs);
      editor.open({
        title: `Edit ${this.c.title.toLowerCase()}`,
        description: "Reorder discovered controls or hide controls you do not want shown.",
        items: preferences.all,
        hidden: [...preferences.hidden],
        onSave: async (value) => {
          this.prefs = value;
          await HD2.savePrefs(this.h, this.c.pref_key, value);
          this.structureSig = "";
          this.schedule();
        },
      });
    }
  }

  registerCard({
    type: "component-smart-collection-v3",
    element: ComponentSmartCollectionV3,
    name: "Smart Control Collection V3",
    description: "Stable registry-driven household controls without refresh teardown.",
  });
})();
