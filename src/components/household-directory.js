(() => {
  globalThis.__homeDashboardV2 ??= {};
  const HD2 = globalThis.__homeDashboardV2;
  const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
  const ACTION_SERVICES = new Map([
    ["automation", "trigger"],
    ["scene", "turn_on"],
    ["script", "turn_on"],
    ["button", "press"],
    ["input_button", "press"],
  ]);

  class ComponentHouseholdDirectoryV3 extends HTMLElement {
    static getGridOptions() { return { columns: 12, rows: "auto" }; }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.c = null;
      this.h = null;
      this.d = null;
      this.prefs = { order: [], hidden: [] };
      this.prefsLoaded = false;
      this.unsub = null;
      this.gen = 0;
      this.cards = new Map();
      this.structureSig = "";
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;min-width:0}*{box-sizing:border-box}
        ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}
        .head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}
        .heading{display:flex;align-items:center;gap:7px}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}
        .heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}
        .edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}
        .edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .empty{display:none;margin:0;padding:9px 2px;color:var(--secondary-text-color);font-size:13px;line-height:1.35}
        @media(max-width:340px){.grid{grid-template-columns:minmax(0,1fr)}}
      </style><ha-card><div class="head"><span class="heading"><ha-icon></ha-icon><h2></h2></span><button class="edit" type="button"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div><p class="empty">No quick actions available</p></ha-card>`;
      this.grid = this.shadowRoot.querySelector(".grid");
      this.empty = this.shadowRoot.querySelector(".empty");
      this.shadowRoot.querySelector(".edit").onclick = () => this.openEditor();
    }

    setConfig(c) {
      this.c = {
        pref_key: "home-control.household.v2",
        base_path: "/home-control",
        current_dashboard: "home-control",
        title: "Quick actions",
        icon: "mdi:gesture-tap-button",
        quick_action_label: "dashboard_quick_action",
        ...c,
      };
      this.shadowRoot.querySelector(".heading h2").textContent = this.c.title;
      this.shadowRoot.querySelector(".heading ha-icon").setAttribute("icon", this.c.icon);
      this.shadowRoot.querySelector(".edit").setAttribute("aria-label", `Edit ${this.c.title.toLowerCase()}`);
      this.loadPrefs();
      this.schedule();
    }

    set hass(h) {
      this.h = h;
      for (const record of this.cards.values()) record.element.hass = h;
      this.unsub || this.subscribe();
      if (!this.prefsLoaded) this.loadPrefs();
      if (!this.d) this.schedule();
    }

    connectedCallback() { this.subscribe(); this.schedule(); }
    disconnectedCallback() {
      this.unsub?.();
      this.unsub = null;
      this.gen++;
    }
    getCardSize() { return 2; }

    subscribe() {
      if (this.unsub || !this.h || !HD2.REG?.subscribe) return;
      this.unsub = HD2.REG.subscribe(this.h, (d) => {
        this.d = d;
        this.structureSig = "";
        this.schedule();
      });
    }

    async loadPrefs() {
      if (!this.h || !this.c?.pref_key || !HD2.prefs) return;
      this.prefs = await HD2.prefs(this.h, this.c.pref_key);
      this.prefsLoaded = true;
      this.structureSig = "";
      this.schedule();
    }

    items() {
      if (!this.d || !this.h) return [];
      const out = [];
      const hasMedia = this.d.entities.some((e) => HD2.uiEntry(e) && HD2.domain(e.entity_id) === "media_player" && this.h.states[e.entity_id]);
      const hasControls = this.d.entities.some((e) => HD2.uiEntry(e) && HD2.controlDomains.has(HD2.domain(e.entity_id)) && this.h.states[e.entity_id]);
      if (hasMedia) out.push({ id: "view:media", name: "Media", icon: "mdi:speaker-multiple", kind: "nav", path: `${this.c.base_path}/media`, meta: "Dashboard view" });
      if (hasControls) out.push({ id: "view:all-controls", name: "Controls", icon: "mdi:tune-variant", kind: "nav", path: `${this.c.base_path}/all-controls`, meta: "Dashboard view" });

      for (const dashboard of this.d.dashboards || []) {
        const path = dashboard.url_path;
        if (!path || path === this.c.current_dashboard || path === "home-control-fix" || dashboard.require_admin === true || dashboard.show_in_sidebar === false) continue;
        out.push({ id: `dashboard:${path}`, name: dashboard.title || HD2.label(path), icon: dashboard.icon || "mdi:view-dashboard-outline", kind: "nav", path: `/${path}`, meta: "Dashboard" });
      }

      for (const entry of this.d.entities) {
        if (!HD2.uiEntry(entry) || !this.h.states[entry.entity_id]) continue;
        const domain = HD2.domain(entry.entity_id);
        const labels = Array.isArray(entry.labels) ? entry.labels : [];
        if (ACTION_SERVICES.has(domain) && labels.includes(this.c.quick_action_label)) {
          out.push({
            id: `action:${entry.entity_id}`,
            name: HD2.stateName(this.h, entry, this.h.states[entry.entity_id]),
            icon: this.h.states[entry.entity_id].attributes?.icon || entry.icon || "mdi:gesture-tap-button",
            kind: "action",
            entity: entry.entity_id,
            domain,
            service: ACTION_SERVICES.get(domain),
            meta: "Quick action",
          });
        }
        if (domain === "todo") {
          out.push({ id: `entity:${entry.entity_id}`, name: HD2.stateName(this.h, entry, this.h.states[entry.entity_id]).replace(/ List$/i, ""), icon: "mdi:cart-outline", kind: "entity", entity: entry.entity_id, meta: "List" });
        }
      }

      const seen = new Set();
      return out.filter((item) => !seen.has(item.id) && seen.add(item.id));
    }

    cardConfig(item) {
      if (item.kind === "entity") {
        return { type: "custom:bubble-card", card_type: "button", button_type: "state", entity: item.entity, name: item.name, icon: item.icon, show_state: true, button_action: { tap_action: { action: "more-info" } }, scrolling_effect: false };
      }
      if (item.kind === "action") {
        const tapAction = { action: "perform-action", perform_action: `${item.domain}.${item.service}`, target: { entity_id: item.entity } };
        if (item.domain === "button" || item.domain === "input_button") tapAction.confirmation = { text: `Run ${item.name}?` };
        return { type: "custom:bubble-card", card_type: "button", button_type: "name", name: item.name, icon: item.icon, show_icon: true, button_action: { tap_action: tapAction }, scrolling_effect: false };
      }
      return { type: "custom:bubble-card", card_type: "button", button_type: "name", name: item.name, icon: item.icon, show_icon: true, button_action: { tap_action: { action: "navigate", navigation_path: item.path } }, scrolling_effect: false };
    }

    schedule() {
      if (!this.h || !this.c || !HD2.REG?.load) return;
      const generation = ++this.gen;
      queueMicrotask(() => this.sync(generation));
    }

    async sync(generation) {
      const data = this.d || await HD2.REG.load(this.h);
      if (generation !== this.gen) return;
      this.d ||= data;

      const presentation = HD2.applyPrefs(this.items(), this.prefs);
      const rows = presentation.visible.map((item) => {
        const config = this.cardConfig(item);
        return { item, config, configSignature: JSON.stringify(config) };
      });
      const signature = JSON.stringify(rows.map((row) => [row.item.id, row.configSignature]));
      const complete = rows.length === this.cards.size && rows.every((row, index) =>
        this.cards.get(row.item.id)?.configSignature === row.configSignature &&
        this.grid.children[index] === this.cards.get(row.item.id)?.element,
      );
      if (complete) {
        this.empty.style.display = rows.length ? "none" : "block";
        for (const record of this.cards.values()) record.element.hass = this.h;
        this.structureSig = signature;
        return;
      }

      const staged = new Map();
      for (const row of rows) {
        const current = this.cards.get(row.item.id);
        if (current?.configSignature === row.configSignature) {
          staged.set(row.item.id, current);
          continue;
        }
        try {
          const element = await HD2.card(this.h, row.config);
          if (generation !== this.gen) return;
          staged.set(row.item.id, { element, configSignature: row.configSignature });
        } catch {
          // Retain the committed child and leave the signature stale for retry.
        }
      }
      if (generation !== this.gen || staged.size !== rows.length) return;

      const retained = new Set(staged.values());
      for (const record of this.cards.values()) {
        if (!retained.has(record)) record.element.remove();
      }
      this.cards.clear();
      for (const [id, record] of staged) this.cards.set(id, record);

      this.empty.style.display = rows.length ? "none" : "block";
      for (const row of rows) {
        const record = this.cards.get(row.item.id);
        record.element.hass = this.h;
        if (this.grid.lastElementChild !== record.element) this.grid.append(record.element);
      }
      this.structureSig = signature;
    }

    async openEditor() {
      if (!this.h || !HD2.REG?.load) return;
      const editor = await HD2.preferenceEditor();
      this.d = this.d || await HD2.REG.load(this.h);
      const presentation = HD2.applyPrefs(this.items(), this.prefs);
      editor.open({
        title: `Edit ${this.c.title.toLowerCase()}`,
        description: "Reorder or hide discovered actions and destinations without changing their Home Assistant configuration.",
        items: presentation.all,
        hidden: [...presentation.hidden],
        onSave: async (value) => {
          this.prefs = value;
          await HD2.savePrefs(this.h, this.c.pref_key, value);
          this.structureSig = "";
          this.schedule();
        },
      });
    }
  }

  registerCard({ type: "component-household-directory-v3", element: ComponentHouseholdDirectoryV3, name: "Quick Actions Directory V3", description: "Stable auto-discovered labelled actions and household destinations." });
})();
