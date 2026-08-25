/** ComponentSplitControllerV4 — reusable Home Assistant dashboard card. */
const { interaction, registerCard } =
  globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const SPLIT_INVALID = new Set(["unknown", "unavailable", "none", ""]),
  SPLIT_LABELS = { fan_only: "Fan only" };
const SPLIT_PROFILE_SLOT_COUNT = 5;

function splitProfileRoomId(card) {
  return (
    card?.config?.room_id ||
    card?.config?.profile_area_id ||
    globalThis.__componentSplitRegistryV4?.result?.systems?.get(
      card?.config?.entity,
    )?.room_id ||
    null
  );
}

class ComponentSplitControllerV4 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }
  constructor() {
    super(),
      this.attachShadow({ mode: "open" }),
      (this.t = !1),
      (this.i = ""),
      (this.o = null),
      (this.l = ""),
      (this.h = null),
      (this.u = null),
      (this.p = new Map()),
      (this.m = 0),
      (this.v = null),
      (this._ = null),
      (this.k = null),
      (this.T = null),
      (this.S = null),
      (this.A = null),
      (this.C = null),
      (this.q = null),
      (this.L = null),
      (this._interactionHandles = []);
  }
  _setConfigCore(t) {
    if (!t?.entity) throw new Error("A climate entity is required");
    clearTimeout(this._), (this._ = null);
    for (const t of this.p.values()) this.I(t);
    this.p.clear(),
      (this.v = null),
      (this.T = null),
      this.t && (this.M(!1), this.$.pb.replaceChildren()),
      (this.S = { ...t }),
      (this.config = { ...this.S }),
      (this.A = null),
      (this.C = null),
      clearTimeout(this.q),
      (this.q = null),
      (this.i = "");
  }
  set hass(t) {
    (this.P = t), this.N(), this.O(), this.t || this.R(), this.D();
    const i = this.V();
    i !== this.i ? ((this.i = i), this.H()) : this.F(), this.j();
  }
  O() {
    const t = this.S?.entity;
    if (!t || !this.P || this.A === t || this.C === t) return;
    const i = globalThis.__componentSplitRegistryV4;
    i?.load &&
      ((this.C = t),
      i.load(this.P).then((s) => {
        if (this.S?.entity !== t) return;
        if (((this.C = null), s.error)) {
          if (!this.isConnected) return;
          return (
            clearTimeout(this.q),
            void (this.q = setTimeout(() => {
              (this.q = null), this.O();
            }, 31e3))
          );
        }
        clearTimeout(this.q), (this.q = null);
        const e = s.systems.get(t);
        (this.config = {
          ...this.S,
          ...(e
            ? {
                room_id: e.room_id,
                registry_entity: e.registry_entity,
                controller_entity: e.controller_entity,
                vertical_vane_entity: e.vertical_vane_entity,
                horizontal_vane_entity: e.horizontal_vane_entity,
                minimum_target: e.minimum_target,
                maximum_target: e.maximum_target,
                fan_ceiling: e.fan_ceiling,
                last_mode: e.last_mode,
                deadline: e.deadline,
                profiles: e.profiles,
              }
            : {}),
        }),
          (this.A = t),
          (this.i = ""),
          this.t && this.isConnected && (this.H(), this.j());
      }));
  }
  connectedCallback() {
    this.N(), this.O(), this.t && this.j();
  }
  N() {
    const t = globalThis.__componentSplitRegistryV4;
    this.isConnected &&
      !this.L &&
      this.P &&
      t?.subscribe &&
      (this.L = t.subscribe(this.P, () => {
        (this.A = null), (this.i = ""), this.O();
      }));
  }
  disconnectedCallback() {
    // These local controls remain bound to the retained shadow DOM. Timers,
    // service state and registry subscriptions are still released below.
    clearTimeout(this._),
      (this._ = null),
      clearInterval(this.k),
      (this.k = null),
      clearTimeout(this.q),
      (this.q = null),
      this.L?.(),
      (this.L = null);
    for (const t of this.p.values())
      clearTimeout(t.timeoutTimer), clearTimeout(t.settleTimer);
    this.p.clear(), (this.v = null), (this.T = null), this.t && this.M(!1);
  }
  _renderCore() {
    (this.t = !0),
      (this.shadowRoot.innerHTML =
        '<style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;background:transparent;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px}.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;gap:12px}.hd.settings{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}.idn{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.iw{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.cp{min-width:0}.nm,.st{display:block}.nm{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw{width:44px;height:44px;padding:0;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.pw.on{color:var(--primary-color)}button[disabled],button[aria-disabled=true]{opacity:.45;cursor:default}.ct{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.cr{display:grid;grid-template-columns:minmax(120px,1fr) auto;align-items:center;gap:16px}.cr.to{grid-template-columns:auto;justify-content:end}.rv{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.ml{display:block;margin-top:6px;color:var(--secondary-text-color);font-size:13px;line-height:1.2}.tc{min-height:48px;display:grid;grid-template-columns:44px minmax(82px,auto) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;overflow:hidden}.tb{width:44px;height:48px;padding:0;display:grid;place-items:center}.tp{min-width:0;padding:0 8px;text-align:center}.tv{font-size:18px;line-height:1.1;font-weight:650;font-variant-numeric:tabular-nums}.ts{margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.1;white-space:nowrap}.os,.uv{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.as{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.a{min-width:0;min-height:44px;flex:1 1 118px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:7px;color:var(--secondary-text-color)}.a ha-icon{--mdc-icon-size:18px}.al{min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.a.av,.a[aria-expanded=true]{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.pn{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;overscroll-behavior:contain;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,color-mix(in srgb,var(--primary-text-color) 32%,transparent)))}.pd{width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;padding:12px 14px 14px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,8px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}.ph{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px}.pt{margin:0;font-size:18px;line-height:1.2;font-weight:650}.x{width:44px;height:44px;border-radius:var(--dashboard-radius-control,8px);display:grid;place-items:center}.og+.og{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.gt{margin:0 4px 8px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.qs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.o{min-height:50px;width:100%;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:20px minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;background:transparent;font-size:13px;font-weight:600}.oi{color:var(--secondary-text-color)}.o[aria-selected=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}.o[aria-selected=true] .oi{color:var(--primary-color)}.tpr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tpr button,.tcu button,.tac button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.tpr button{display:flex;align-items:center;justify-content:center;gap:6px}.tcu{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px;margin-top:12px}.tcu label{font-size:13px;color:var(--secondary-text-color)}.tcu input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,5px);background:transparent}.tcu button{padding:0 14px;color:var(--primary-color)}.tac{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.tac button:first-child{color:var(--primary-color)}.tac button:last-child{color:var(--error-color)}.fb{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.fb:not(:empty){margin-top:10px}.fb.er{color:var(--error-color)}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:400px){.w{padding:12px}.as .a{flex-basis:calc(50% - 4px)}}@container (max-width:340px){.cr{grid-template-columns:1fr;justify-content:stretch}.tc{width:100%}}\n      </style><ha-card><div class="w"><div class="hd"><button class="idn" type="button"><span class="iw"><ha-icon class="mi"></ha-icon></span><span class="cp"><span class="nm"></span><span class="st" role="status"></span></span></button><button class="pw" type="button"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="ct"><div class="cr"><div class="rm"><span class="rv"></span><span class="ml">Room temperature</span></div><div class="tc"><button class="tb decrease" type="button" aria-label="Decrease target temperature"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tp"><div class="tv"></div><div class="ts"></div></div><button class="tb increase" type="button" aria-label="Increase target temperature"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="os"></div><div class="uv"></div><div class="as"><button class="a ma" type="button" data-panel="mode" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:thermostat"></ha-icon><span class="al"></span></button><button class="a fa" type="button" data-panel="fan" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:fan"></ha-icon><span class="al"></span></button><button class="a va" type="button" data-panel="vanes" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:swap-vertical"></ha-icon><span class="al"></span></button><button class="a ta" type="button" data-panel="timer" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:timer-outline"></ha-icon><span class="al"></span></button></div></div><div class="fb" role="status" aria-live="polite"></div></div></ha-card><section class="pn" id="split-secondary" role="dialog" aria-modal="true" aria-labelledby="split-pt" hidden><div class="pd"><div class="ph"><h3 class="pt" id="split-pt"></h3><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="pb"></div></div></section>');
    const t = document.createElement("button");
    (t.className = "pw sg"),
      (t.type = "button"),
      (t.dataset.panel = "settings"),
      t.setAttribute("aria-controls", "split-secondary"),
      t.setAttribute("aria-expanded", "false"),
      t.setAttribute("aria-label", "Advanced settings");
    const i = document.createElement("ha-icon");
    i.setAttribute("icon", "mdi:cog-outline"),
      t.append(i),
      this.shadowRoot.querySelector(".pw").before(t),
      (this.$ = Object.fromEntries(
        [...this.shadowRoot.querySelectorAll("[class]")].flatMap((t) =>
          [...t.classList].map((i) => [i, t]),
        ),
      )),
      this._interactionHandles.push(
        interaction(this.$.idn, { primary: () => this.B(), feedback: !0 }),
        interaction(this.$.pw, {
          primary: () => this.G(),
          optimistic: !1,
          feedback: !0,
        }),
        interaction(this.$.decrease, {
          primary: () => this.W(-1),
          feedback: !0,
        }),
        interaction(this.$.increase, {
          primary: () => this.W(1),
          feedback: !0,
        }),
      ),
      this.shadowRoot
        .querySelectorAll("[data-panel]")
        .forEach((t) =>
          this._interactionHandles.push(
            interaction(t, {
              primary: () => this.U(t.dataset.panel, t),
              feedback: !0,
            }),
          ),
        ),
      this.$.x.addEventListener("click", () => this.M(!0)),
      this.$.pn.addEventListener("click", (t) => {
        t.target === this.$.pn && this.M(!0);
      }),
      this.shadowRoot.addEventListener("keydown", (t) => {
        "Escape" === t.key && this.o
          ? (t.preventDefault(), this.M(!0))
          : "Tab" === t.key && this.o && this.J(t);
      });
  }
  _signatureCore() {
    const t = [
        this.config.entity,
        this.config.vertical_vane_entity,
        this.config.horizontal_vane_entity,
        this.config.controller_entity,
        this.config.registry_entity || "sensor.ha_component_backend",
      ].filter(Boolean),
      i = t.map((t) => {
        const i = this.P?.states?.[t];
        return [t, i?.state, i?.attributes];
      }),
      s = {
        room_id: this.config.room_id,
        minimum_target: this.config.minimum_target,
        maximum_target: this.config.maximum_target,
        fan_ceiling: this.config.fan_ceiling,
        last_mode: this.config.last_mode,
        deadline: this.config.deadline,
        profiles: this.config.profiles,
      };
    return JSON.stringify([i, s]);
  }
  K(t) {
    if (null == t || "" === t) return null;
    const i = Number(t);
    return Number.isFinite(i) ? i : null;
  }
  X(t) {
    return t ? (this.P?.states?.[t] ?? null) : null;
  }
  Y(t) {
    return Boolean(t && !SPLIT_INVALID.has(String(t.state).toLowerCase()));
  }
  Z() {
    const t = this.X(this.config.entity),
      i = this.X(this.config.controller_entity),
      s =
        !this.Y(t) ||
        (this.config.controller_entity && (!i || "on" !== i.state));
    return { state: t, attributes: t?.attributes ?? {}, uv: s };
  }
  tt(t) {
    const i = String(t ?? "").toLowerCase();
    return (
      SPLIT_LABELS[i] ??
      i.replaceAll("_", " ").replace(/^./, (t) => t.toUpperCase())
    );
  }
  it(t) {
    const i = this.K(t);
    return null === i ? null : `${Number.isInteger(i) ? i : i.toFixed(1)}°`;
  }
  et(t, i) {
    return "heating" === i || "heat" === t
      ? "mdi:fire"
      : "cooling" === i || "cool" === t
        ? "mdi:snowflake"
        : "auto" === t
          ? "mdi:thermostat-auto"
          : "dry" === t
            ? "mdi:water-percent"
            : "fan_only" === t
              ? "mdi:fan"
              : "mdi:heat-pump";
  }
  nt(t) {
    if (t.uv) return "Controller unavailable";
    const { state: i, attributes: s } = t,
      e = i.state,
      n = s.hvac_action,
      o = this.it(s.temperature),
      r = this.K(s.current_temperature),
      a = this.K(s.temperature),
      l = this.K(s.target_temp_step),
      h =
        null !== r && null !== a && null !== l && l > 0 && Math.abs(r - a) <= l;
    return "off" === e
      ? "Off"
      : "heating" === n
        ? o
          ? `Heating to ${o}`
          : "Heating"
        : "cooling" === n
          ? o
            ? `Cooling to ${o}`
            : "Cooling"
          : "heat" === e
            ? h
              ? "Heat · At target"
              : o
                ? `Heat · Target ${o}`
                : "Heat"
            : "cool" === e
              ? h
                ? "Cool · At target"
                : o
                  ? `Cool · Target ${o}`
                  : "Cool"
              : "auto" === e
                ? o
                  ? `Auto · Target ${o}`
                  : "Auto"
                : "dry" === e
                  ? "drying" === n
                    ? "Drying"
                    : "Dry"
                  : "fan_only" === e
                    ? "Fan only" +
                      (this.ot(s.fan_mode) ? ` · ${this.tt(s.fan_mode)}` : "")
                    : this.tt(e);
  }
  ot(t) {
    return null != t && !SPLIT_INVALID.has(String(t).toLowerCase());
  }
  rt(t) {
    const i = [
      this.p.get("hvac"),
      this.p.get("temperature"),
      this.p.get("fan"),
      [...this.p].find(([t]) => t.startsWith("vane:"))?.[1],
      this.p.get("timer"),
    ];
    for (const s of i) {
      if (!s) continue;
      const i = s.queued?.label ?? s.label;
      return `${this.nt(t)} · Requesting ${i}`;
    }
    return this.nt(t);
  }
  _refreshCore() {
    const t = this.Z(),
      { state: i, attributes: s, uv: e } = t,
      n = !e && "off" !== i.state,
      o = this.config.title || s.friendly_name || "Split system";
    (this.$.nm.textContent = o),
      (this.$.st.textContent = this.rt(t)),
      this.$.mi.setAttribute(
        "icon",
        e ? "mdi:heat-pump" : this.et(i.state, s.hvac_action),
      ),
      this.$.idn.setAttribute("aria-label", `Open details for ${o}`),
      this.$.pw.classList.toggle("on", n),
      (this.$.pw.disabled = e),
      this.$.pw.setAttribute(
        "aria-label",
        e ? `${o} unavailable` : `Turn ${n ? "off" : "on"} ${o}`,
      ),
      this.$.pw.setAttribute("aria-pressed", String(n));
    const r = this.lt();
    if (
      ((this.$.sg.hidden = !r),
      this.$.hd.classList.toggle("settings", r),
      (this.$.ct.hidden = !1),
      (this.$.uv.hidden = !e),
      (this.$.uv.textContent = e
        ? "Controls return when the controller reconnects."
        : ""),
      e)
    )
      return (
        (this.$.cr.hidden = !0),
        (this.$.os.hidden = !0),
        (this.$.as.hidden = !0),
        this.M(!0),
        void this.ht()
      );
    const a = this.K(s.current_temperature),
      l = this.K(s.temperature),
      h = this.K(s.target_temp_step),
      { minimum: c, maximum: d } = this.dt(),
      u =
        n &&
        ["heat", "cool", "auto"].includes(i.state) &&
        null !== l &&
        null !== h &&
        h > 0;
    (this.$.cr.hidden = !n || (null === a && !u)),
      this.$.cr.classList.toggle("to", null === a && u),
      (this.$.rm.hidden = null === a),
      (this.$.rv.textContent = this.it(a) ?? ""),
      (this.$.tc.hidden = !u);
    const p = this.v ?? l;
    if (
      ((this.$.tv.textContent = this.it(p) ?? ""),
      (this.$.ts.textContent = this.ut(l)),
      (this.$.decrease.disabled = !u || (null !== c && p <= c)),
      (this.$.increase.disabled = !u || (null !== d && p >= d)),
      (this.$.os.hidden = n),
      !n)
    ) {
      const t = [];
      null !== a && t.push(`Room ${this.it(a)}`);
      const i = this.gt();
      i && t.push(`Resume ${this.tt(i)}`),
        (this.$.os.textContent = t.join(" · ") || "Ready when needed");
    }
    const m = this.ft(),
      g = this.bt(),
      f = this.vt(),
      b = this.xt();
    (this.$.as.hidden = !n),
      (this.$.ma.hidden = !n || m.length < 2),
      (this.$.fa.hidden = !n || g.length < 2),
      (this.$.va.hidden = !n || 0 === f.length),
      (this.$.ta.hidden = !n || !b),
      (this.$.ma.querySelector(".al").textContent =
        `Mode · ${this.tt(i.state)}`),
      (this.$.fa.querySelector(".al").textContent =
        `Fan · ${this.tt(s.fan_mode)}`),
      (this.$.va.querySelector(".al").textContent = this.yt(f)),
      (this.$.ta.querySelector(".al").textContent = this.wt()),
      this.$.ta.classList.toggle("av", this._t().av),
      this.o && !this.kt()
        ? (this.Tt("That control is no longer available.", "error"), this.M(!0))
        : this.o && this.St(),
      this.ht();
  }
  F() {
    if (!this.t || !this.P) return;
    const t = this.Z();
    (this.$.st.textContent = this.rt(t)), this.ht(), this.o && this.St();
  }
  ut(t) {
    if (this.p.get("temperature") || this._) {
      const i = this.it(t);
      return i ? `Requesting · Current ${i}` : "Requesting";
    }
    return "Target";
  }
  ft() {
    const t = this.Z().attributes.hvac_modes;
    return Array.isArray(t) ? t.filter((t) => "off" !== t && this.ot(t)) : [];
  }
  bt() {
    const { attributes: t } = this.Z(),
      i =
        Array.isArray(t.fan_modes) && this.ot(t.fan_mode)
          ? t.fan_modes.filter((t) => this.ot(t))
          : [],
      s = this.config.fan_ceiling;
    if (!s || "unrestricted" === String(s).toLowerCase()) return i;
    const e = { quiet: 0, low: 1, medium: 2, high: 3 },
      n = e[String(s).toLowerCase()];
    return void 0 === n
      ? i
      : i.filter(
          (t) =>
            void 0 !== e[String(t).toLowerCase()] &&
            e[String(t).toLowerCase()] <= n,
        );
  }
  lt() {
    const t = this.Z(),
      i = this.K(t.attributes.min_temp),
      s = this.K(t.attributes.max_temp),
      e = this.K(t.attributes.target_temp_step),
      n = this.K(this.config.minimum_target),
      o = this.K(this.config.maximum_target),
      r = ["Quiet", "Low", "Medium", "High", "Unrestricted"];
    return (
      !t.uv &&
      this.config.room_id &&
      null !== i &&
      null !== s &&
      i < s &&
      null !== e &&
      e > 0 &&
      null !== n &&
      null !== o &&
      n >= i &&
      o <= s &&
      n < o &&
      r.includes(this.config.fan_ceiling)
    );
  }
  dt() {
    const t = this.Z().attributes,
      i = this.K(t.min_temp),
      s = this.K(t.max_temp),
      e = this.K(this.config.minimum_target),
      n = this.K(this.config.maximum_target),
      o =
        null !== e &&
        null !== n &&
        e < n &&
        (null === i || e >= i) &&
        (null === s || n <= s);
    return {
      minimum: o && null !== i ? Math.max(i, e) : i,
      maximum: o && null !== s ? Math.min(s, n) : s,
    };
  }
  gt() {
    const t = this.config.last_mode;
    return this.ft().includes(t) ? t : null;
  }
  vt() {
    return [
      ["vertical", "Vertical vane", this.config.vertical_vane_entity],
      ["horizontal", "Horizontal vane", this.config.horizontal_vane_entity],
    ].flatMap(([t, i, s]) => {
      const e = this.X(s),
        n = Array.isArray(e?.attributes?.options)
          ? e.attributes.options.filter((t) => this.ot(t))
          : [];
      return s &&
        e &&
        "unavailable" !== String(e.state).toLowerCase() &&
        n.length
        ? [{ axis: t, title: i, entityId: s, state: e.state, qs: n }]
        : [];
    });
  }
  $t(t, i) {
    return (
      ("vertical" === i
        ? {
            AUTO: "Auto",
            "↑↑": "Highest",
            "↑": "High",
            "—": "Centre",
            "↓": "Low",
            "↓↓": "Lowest",
            SWING: "Swing",
          }
        : {
            "←←": "Far left",
            "←": "Left",
            "|": "Centre",
            "→": "Right",
            "→→": "Far right",
            "←→": "Wide",
            SWING: "Swing",
            "AIRFLOW CONTROL": "Airflow control",
          })[t] ?? this.tt(t)
    );
  }
  At(t, i) {
    return "mode" === t.key
      ? this.et(i)
      : "fan" === t.key
        ? ({
            auto: "mdi:fan-auto",
            quiet: "mdi:volume-low",
            low: "mdi:fan-speed-1",
            medium: "mdi:fan-speed-2",
            high: "mdi:fan-speed-3",
          }[String(i).toLowerCase()] ?? "mdi:fan")
        : "vertical" === t.axis
          ? ({
              AUTO: "mdi:autorenew",
              "↑↑": "mdi:arrow-up-bold",
              "↑": "mdi:arrow-up",
              "—": "mdi:minus",
              "↓": "mdi:arrow-down",
              "↓↓": "mdi:arrow-down-bold",
              SWING: "mdi:swap-vertical",
            }[i] ?? "mdi:swap-vertical")
          : "mdi:swap-horizontal";
  }
  yt(t) {
    return 1 === t.length
      ? `Vanes · ${this.$t(t[0].state, t[0].axis)}`
      : t.length > 1
        ? `Vanes · V ${this.$t(t[0].state, "vertical")} · H ${this.$t(t[1].state, "horizontal")}`
        : "Vanes";
  }
  xt() {
    return Boolean(this.config.room_id && this.config.entity);
  }
  _t() {
    const t = this.config.deadline
      ? Date.parse(String(this.config.deadline))
      : NaN;
    return Number.isFinite(t)
      ? { av: t > Date.now(), deadline: t }
      : { av: !1, deadline: null };
  }
  wt() {
    const t = this._t();
    if (!t.av) return "Timer";
    const i = Math.max(0, Math.ceil((t.deadline - Date.now()) / 6e4));
    return i >= 60 && i % 60 == 0 ? `Timer · ${i / 60} hr` : `Timer · ${i} min`;
  }
  j() {
    const t = this._t().av;
    t && !this.k
      ? (this.k = setInterval(() => {
          this.$.ta?.querySelector(".al")?.replaceChildren(this.wt()),
            "timer" === this.o && this.St();
        }, 3e4))
      : !t && this.k && (clearInterval(this.k), (this.k = null));
  }
  U(t, i) {
    this.o !== t
      ? ((this.o = t),
        (this.h = i),
        (this.l = ""),
        (this.u = null),
        this.shadowRoot
          .querySelectorAll("[data-panel]")
          .forEach((t) => t.setAttribute("aria-expanded", String(t === i))),
        (this.$.pn.hidden = !1),
        this.St(!0))
      : this.M(!0);
  }
  _closePanelCore(t) {
    if (!this.t) return;
    const i = Boolean(this.o),
      s = this.h;
    (this.o = null),
      (this.h = null),
      (this.l = ""),
      (this.u = null),
      (this.$.pn.hidden = !0),
      this.shadowRoot
        .querySelectorAll("[data-panel]")
        .forEach((t) => t.setAttribute("aria-expanded", "false")),
      t &&
        i &&
        (!s?.isConnected || s.hidden || s.disabled
          ? this.$.idn.focus()
          : s.focus());
  }
  J(t) {
    const i =
        "settings" === this.o
          ? this.$.pb.querySelector("component-split-settings-v1")
          : null,
      s = i?.shadowRoot
        ? [
            this.$.x,
            ...i.shadowRoot.querySelectorAll(
              'button:not([disabled]):not([tabindex="-1"]),input:not([disabled])',
            ),
          ]
        : [
            ...this.$.pn.querySelectorAll(
              'button:not([disabled]):not([tabindex="-1"]),input:not([disabled])',
            ),
          ];
    if (!s.length) return;
    const e = s[0],
      n = s.at(-1),
      o = this.shadowRoot.activeElement,
      r = i && o === i ? i.shadowRoot.activeElement : o;
    !t.shiftKey || (r !== e && s.includes(r))
      ? t.shiftKey || r !== n || (t.preventDefault(), e.focus())
      : (t.preventDefault(), n.focus());
  }
  _panelAvailableCore() {
    return "settings" === this.o
      ? this.lt()
      : "mode" === this.o
        ? this.ft().length > 0
        : "fan" === this.o
          ? this.bt().length > 0
          : "vanes" === this.o
            ? this.vt().length > 0
            : "timer" === this.o && this.xt();
  }
  _renderPanelCore(t = !1) {
    if (!this.o || !this.kt()) return;
    if ("settings" === this.o) {
      if (
        ((this.$.pt.textContent = "Advanced settings"),
        !customElements.get("component-split-settings-v1"))
      )
        return (
          (this.$.pb.textContent = "Loading settings…"),
          void customElements
            .whenDefined("component-split-settings-v1")
            .then(() => {
              "settings" === this.o && this.St(!0);
            })
        );
      let i = this.$.pb.querySelector("component-split-settings-v1");
      return (
        i ||
          ((i = document.createElement("component-split-settings-v1")),
          i.setConfig({
            entity: this.config.entity,
            room_id: this.config.room_id,
            minimum_target: this.config.minimum_target,
            maximum_target: this.config.maximum_target,
            fan_ceiling: this.config.fan_ceiling,
          }),
          this.$.pb.replaceChildren(i)),
        (i.hass = this.P),
        void (t && i.focusInitial())
      );
    }
    const i = this.u,
      s = this.$.pb,
      e = s.querySelector('input[type="number"]')?.value,
      n = this.Ct(),
      o = JSON.stringify(n);
    if (o === this.l) return;
    if (
      ((this.l = o),
      (this.$.pt.textContent = n.title),
      s.replaceChildren(),
      "timer" === this.o)
    )
      this.qt(s, e);
    else for (const t of n.groups) s.append(this.Lt(t));
    const r = i
      ? s.querySelector(`[data-focus-key="${CSS.escape(i)}"]`)
      : (s.querySelector('[aria-selected="true"]') ??
        s.querySelector("button"));
    (i || t) && queueMicrotask(() => r?.focus());
  }
  zt(t) {
    const i = this.p.get(t);
    return i?.queued?.requested ?? i?.requested ?? null;
  }
  It(t, i) {
    (t.dataset.focusKey = i),
      t.addEventListener("focus", () => {
        this.u = i;
      });
  }
  Ct() {
    const t = this.Z();
    if ("mode" === this.o)
      return {
        title: "Mode",
        groups: [
          {
            title: null,
            key: "mode",
            current: t.state.state,
            pending: this.zt("hvac"),
            qs: this.ft().map((t) => ({ value: t, label: this.tt(t) })),
          },
        ],
      };
    if ("fan" === this.o)
      return {
        title: "Fan",
        groups: [
          {
            title: null,
            key: "fan",
            current: t.attributes.fan_mode,
            pending: this.zt("fan"),
            qs: this.bt().map((t) => ({ value: t, label: this.tt(t) })),
          },
        ],
      };
    if ("vanes" === this.o)
      return {
        title: "Vanes",
        groups: this.vt().map((t) => ({
          title: t.title,
          key: t.entityId,
          current: t.state,
          pending: this.zt(`vane:${t.entityId}`),
          axis: t.axis,
          qs: t.qs.map((i) => ({ value: i, label: this.$t(i, t.axis) })),
        })),
      };
    const i = this._t();
    return {
      title: "Off timer",
      active: i.av,
      deadline: i.deadline,
      pending: this.p.has("timer"),
    };
  }
  Lt(t) {
    const i = document.createElement("div");
    if (((i.className = "og"), t.title)) {
      const s = document.createElement("div");
      (s.className = "gt"), (s.textContent = t.title), i.append(s);
    }
    const s = document.createElement("div");
    (s.className = "qs"),
      s.setAttribute("role", "listbox"),
      s.setAttribute("aria-label", t.title || this.tt(t.key));
    const e = t.pending,
      n = t.qs.some((i) => i.value === t.current);
    for (const [i, o] of t.qs.entries()) {
      const r = document.createElement("button");
      (r.type = "button"),
        (r.className = "o"),
        (r.dataset.key = `${t.key}|${o.value}`),
        this.It(r, r.dataset.key),
        r.setAttribute("role", "option"),
        r.setAttribute("aria-selected", String(t.current === o.value)),
        r.setAttribute("aria-disabled", String(e === o.value)),
        (r.tabIndex = t.current === o.value || (!n && 0 === i) ? 0 : -1);
      const a = document.createElement("ha-icon");
      if (
        ((a.className = "oi"),
        a.setAttribute("icon", this.At(t, o.value)),
        r.append(a, o.label),
        e === o.value)
      ) {
        const t = document.createElement("ha-icon");
        t.setAttribute("icon", "mdi:progress-clock"), r.append(t);
      } else if (t.current === o.value) {
        const t = document.createElement("ha-icon");
        t.setAttribute("icon", "mdi:check"), r.append(t);
      }
      r.addEventListener("click", () => this.Mt(t, o)),
        r.addEventListener("keydown", (t) => this.Pt(t, s)),
        s.append(r);
    }
    return i.append(s), i;
  }
  Pt(t, i) {
    if (
      ![
        "ArrowDown",
        "ArrowRight",
        "ArrowUp",
        "ArrowLeft",
        "Home",
        "End",
      ].includes(t.key)
    )
      return;
    t.preventDefault();
    const s = [...i.querySelectorAll("button:not([disabled])")];
    if (!s.length) return;
    const e = s.indexOf(t.currentTarget),
      n =
        "Home" === t.key
          ? 0
          : "End" === t.key
            ? s.length - 1
            : (e +
                (["ArrowDown", "ArrowRight"].includes(t.key) ? 1 : -1) +
                s.length) %
              s.length;
    s.forEach((t, i) => {
      t.tabIndex = i === n ? 0 : -1;
    }),
      s[n].focus();
  }
  Mt(t, i) {
    t.current !== i.value &&
      t.pending !== i.value &&
      ("mode" === t.key
        ? this.Nt("hvac", {
            requested: i.value,
            label: i.label,
            call: () =>
              this.P.callService("climate", "set_hvac_mode", {
                entity_id: this.config.entity,
                hvac_mode: i.value,
              }),
            matches: () => this.X(this.config.entity)?.state === i.value,
            closePanel: !0,
          })
        : "fan" === t.key
          ? this.Nt("fan", {
              requested: i.value,
              label: i.label,
              call: () =>
                this.P.callService("climate", "set_fan_mode", {
                  entity_id: this.config.entity,
                  fan_mode: i.value,
                }),
              matches: () =>
                this.X(this.config.entity)?.attributes?.fan_mode === i.value,
              closePanel: !0,
            })
          : this.Nt(`vane:${t.key}`, {
              requested: i.value,
              label: i.label,
              call: () =>
                this.P.callService("select", "select_option", {
                  entity_id: t.key,
                  option: i.value,
                }),
              matches: () => this.X(t.key)?.state === i.value,
              closePanel: !1,
            }));
  }
  qt(t, i) {
    const s = this.p.has("timer"),
      e = document.createElement("div");
    e.className = "tpr";
    for (const [t, i] of [
      [30, "30 min"],
      [60, "1 hr"],
      [120, "2 hr"],
    ]) {
      const n = document.createElement("button");
      n.type = "button";
      const o = document.createElement("ha-icon");
      o.setAttribute("icon", "mdi:clock-outline"),
        n.append(o, i),
        this.It(n, `timer-preset-${t}`),
        n.setAttribute("aria-disabled", String(s)),
        n.addEventListener("click", () => {
          s || this.Ot("set", t, i);
        }),
        e.append(n);
    }
    const n = document.createElement("div");
    n.className = "tcu";
    const o = document.createElement("label");
    o.textContent = "Custom minutes";
    const r = document.createElement("input");
    (r.type = "number"),
      (r.min = "1"),
      (r.max = "720"),
      (r.step = "1"),
      (r.value = i || "90"),
      this.It(r, "timer-custom-input"),
      o.append(r);
    const a = document.createElement("button");
    if (
      ((a.type = "button"),
      (a.textContent = "Start"),
      a.setAttribute("aria-disabled", String(s)),
      this.It(a, "timer-custom-start"),
      a.addEventListener("click", () => {
        if (s) return;
        const t = Number(r.value);
        if (!Number.isInteger(t) || t < 1 || t > 720)
          return (
            this.Tt("Enter a timer between 1 and 720 minutes.", "error"),
            void r.focus()
          );
        this.Ot("set", t, `${t} min`);
      }),
      n.append(o, a),
      t.append(e, n),
      this._t().av)
    ) {
      const i = document.createElement("div");
      i.className = "tac";
      const e = document.createElement("button");
      (e.type = "button"),
        (e.textContent = "+30 min"),
        e.setAttribute("aria-disabled", String(s)),
        this.It(e, "timer-extend"),
        e.addEventListener("click", () => {
          s || this.Ot("extend", 30, "30 more minutes");
        });
      const n = document.createElement("button");
      (n.type = "button"),
        (n.textContent = "Cancel timer"),
        n.setAttribute("aria-disabled", String(s)),
        this.It(n, "timer-cancel"),
        n.addEventListener("click", () => {
          s || this.Ot("cancel", 0, "timer cancellation");
        }),
        i.append(e, n),
        t.append(i);
    }
  }
  Ot(t, i, s) {
    const e = this._t(),
      n = "extend" === t && null !== e.deadline ? e.deadline + 6e4 * i : null;
    this.Nt("timer", {
      requested: t,
      label: s,
      call: () =>
        this.P.callService("ha_component_backend", "set_timer", {
          room_id: this.config.room_id,
          operation: t,
          minutes: i || void 0,
        }),
      matches: () => {
        const i = this._t();
        return "cancel" === t
          ? !i.av
          : "extend" === t
            ? i.av && null !== n && i.deadline >= n - 5e3
            : i.av && i.deadline !== e.deadline;
      },
      closePanel: !0,
      timeout: 1e4,
    });
  }
  _powerCore() {
    const t = this.Z();
    if (t.uv) return;
    if ("off" !== t.state.state)
      return void this.Rt(
        "hvac",
        {
          requested: "off",
          label: "Off",
          call: () =>
            this.P.callService("climate", "set_hvac_mode", {
              entity_id: this.config.entity,
              hvac_mode: "off",
            }),
          matches: () => "off" === this.X(this.config.entity)?.state,
          closePanel: !0,
          timeout: 1e4,
        },
        !0,
      );
    const i = this.gt();
    i
      ? this.Rt(
          "hvac",
          {
            requested: i,
            label: this.tt(i),
            call: () =>
              this.P.callService("climate", "set_hvac_mode", {
                entity_id: this.config.entity,
                hvac_mode: i,
              }),
            matches: () => this.X(this.config.entity)?.state === i,
            closePanel: !1,
            timeout: 1e4,
          },
          !0,
        )
      : this.U("mode", this.$.pw);
  }
  Dt(t, i, s) {
    const e = s ?? 0,
      n = Math.max(0, String(i).split(".")[1]?.length ?? 0);
    return Number((e + Math.round((t - e) / i) * i).toFixed(n));
  }
  Et(t) {
    const i = this.K(t);
    if (null === i) return null;
    const { minimum: s, maximum: e } = this.dt();
    return Math.min(e ?? i, Math.max(s ?? i, i));
  }
  W(t) {
    const i = this.Z().attributes,
      s = this.K(i.temperature),
      e = this.K(i.target_temp_step);
    if (null === s || null === e || e <= 0) return;
    const { minimum: n } = this.dt(),
      o = this.v ?? s,
      r = this.Dt(o + t * e, e, n ?? s);
    (this.v = this.Et(r)),
      (this.T = null),
      clearTimeout(this._),
      this.p.has("temperature") ||
        (this._ = setTimeout(() => {
          (this._ = null), this.Vt();
        }, 300)),
      this.H();
  }
  Vt() {
    const t = this.Et(this.v);
    null !== t &&
      ((this.v = t),
      this.Rt("temperature", {
        requested: t,
        label: this.it(t),
        call: () =>
          this.P.callService("climate", "set_temperature", {
            entity_id: this.config.entity,
            temperature: t,
          }),
        matches: () => {
          const i = this.Et(t),
            s = this.K(this.X(this.config.entity)?.attributes?.temperature);
          return null !== i && null !== s && Math.abs(s - i) < 0.001;
        },
        closePanel: !1,
        timeout: 1e4,
      }));
  }
  Nt(t, i) {
    this.T = null;
    const s = this.p.get(t);
    if (s) return (s.queued = i), void this.H();
    this.Rt(t, i);
  }
  Rt(t, i, s = !1) {
    this.T = null;
    const e = this.p.get(t);
    if (e && !s) return (e.queued = i), void this.H();
    e && this.I(e);
    const n = ++this.m,
      o = Date.now(),
      r = { ...i, id: n, settleAfter: o + 1800, queued: null };
    this.p.set(t, r),
      (r.timeoutTimer = setTimeout(
        () => this.Ht(t, n, `No confirmation for ${r.label}.`),
        i.timeout ?? 8e3,
      )),
      (r.settleTimer = setTimeout(() => this.D(), 1820)),
      this.H(),
      Promise.resolve()
        .then(() => r.call())
        .then(() => {
          const i = this.p.get(t);
          i && i.id === n && this.D();
        })
        .catch(() => this.Ht(t, n, `Could not request ${r.label}.`));
  }
  D() {
    const t = this.Z();
    if (this.p.size && t.uv) {
      for (const t of this.p.values()) this.I(t);
      return (
        this.p.clear(),
        clearTimeout(this._),
        (this._ = null),
        (this.v = null),
        void (this.T = {
          text: "Controller disconnected before the request was confirmed.",
          type: "error",
        })
      );
    }
    if ("off" === t.state?.state) {
      for (const [t, i] of [...this.p])
        ("temperature" === t ||
          "fan" === t ||
          "timer" === t ||
          t.startsWith("vane:")) &&
          (this.I(i), this.p.delete(t));
      clearTimeout(this._), (this._ = null), (this.v = null);
    }
    const i = Date.now();
    for (const [t, s] of [...this.p])
      i >= s.settleAfter && s.matches() && this.Ft(t, s.id);
  }
  Ft(t, i) {
    const s = this.p.get(t);
    if (!s || s.id !== i) return;
    this.I(s), this.p.delete(t);
    const e = s.queued;
    if ("temperature" === t) {
      const t = this.K(this.X(this.config.entity)?.attributes?.temperature),
        i = this.Et(s.requested);
      (this.v = this.Et(this.v)),
        null !== i && null !== this.v && Math.abs(this.v - i) > 0.001
          ? queueMicrotask(() => this.Vt())
          : null !== i &&
            null !== t &&
            Math.abs(t - i) < 0.001 &&
            (this.v = null);
    }
    e
      ? queueMicrotask(() => this.Rt(t, e))
      : s.closePanel && this.o && this.M(!0),
      (this.i = ""),
      this.H();
  }
  Ht(t, i, s) {
    const e = this.p.get(t);
    e &&
      e.id === i &&
      (this.I(e),
      this.p.delete(t),
      "temperature" === t && (this.v = null),
      this.Tt(s, "error"),
      e.queued && queueMicrotask(() => this.Rt(t, e.queued)),
      (this.i = ""),
      this.H());
  }
  I(t) {
    clearTimeout(t.timeoutTimer), clearTimeout(t.settleTimer);
  }
  Tt(t, i = "info") {
    (this.T = { text: t, type: i }), this.ht();
  }
  ht() {
    this.t &&
      ((this.$.fb.textContent = this.T?.text ?? ""),
      this.$.fb.classList.toggle("er", "error" === this.T?.type));
  }
  B() {
    this.dispatchEvent(
      new CustomEvent("hass-action", {
        bubbles: !0,
        composed: !0,
        detail: {
          config: {
            entity: this.config.entity,
            tap_action: { action: "more-info" },
          },
          action: "tap",
        },
      }),
    );
  }
  setConfig(config) {
    this._profileEditV1 = null;
    this._profileBusyV1 = false;
    this._profileMessageV1 = null;
    this._profileLocalProfilesV1 = null;
    return this._setConfigCore(config);
  }

  profileSlotsV1() {
    const roomId = splitProfileRoomId(this);
    return roomId
      ? Array.from(
          { length: SPLIT_PROFILE_SLOT_COUNT },
          (_, index) => `${roomId}:${index}`,
        )
      : [];
  }

  profileRowsV1() {
    const roomId = splitProfileRoomId(this);
    if (!roomId) return [];
    const profiles = Array.isArray(this._profileLocalProfilesV1)
      ? this._profileLocalProfilesV1
      : Array.isArray(this.config?.profiles)
        ? this.config.profiles
        : [];
    return Array.from({ length: SPLIT_PROFILE_SLOT_COUNT }, (_, index) => {
      const profile = profiles[index] ?? null;
      if (!profile)
        return {
          index,
          entityId: `${roomId}:${index}`,
          available: true,
          raw: "",
          profile: null,
          invalid: false,
        };
      try {
        if (
          profile.v !== 1 ||
          typeof profile.n !== "string" ||
          !profile.n.trim() ||
          typeof profile.m !== "string"
        ) {
          throw new Error("Invalid profile");
        }
        return {
          index,
          entityId: `${roomId}:${index}`,
          available: true,
          raw: JSON.stringify(profile),
          profile,
          invalid: false,
        };
      } catch {
        return {
          index,
          entityId: `${roomId}:${index}`,
          available: true,
          raw: JSON.stringify(profile),
          profile: null,
          invalid: true,
        };
      }
    });
  }

  profileReadyV1() {
    return Boolean(
      splitProfileRoomId(this) &&
        this.profileRowsV1().length === SPLIT_PROFILE_SLOT_COUNT,
    );
  }

  profileActiveV1(profile) {
    if (!profile) return false;
    const state = this.Z();
    if (
      state.uv ||
      state.state?.state === "off" ||
      state.state?.state !== profile.m
    )
      return false;
    if (
      Number.isFinite(profile.t) &&
      ["heat", "cool", "auto"].includes(profile.m)
    ) {
      const current = this.K(state.attributes?.temperature);
      const target = this.Et(profile.t);
      if (
        current === null ||
        target === null ||
        Math.abs(current - target) > 0.001
      )
        return false;
    }
    if (profile.f && state.attributes?.fan_mode !== profile.f) return false;
    for (const vane of this.vt()) {
      const key = vane.axis === "vertical" ? "vv" : "hv";
      if (profile[key] && vane.state !== profile[key]) return false;
    }
    return true;
  }

  profileSummaryV1(profile) {
    const parts = [this.tt(profile.m)];
    if (
      Number.isFinite(profile.t) &&
      ["heat", "cool", "auto"].includes(profile.m)
    )
      parts.push(this.it(profile.t));
    if (profile.f) parts.push(this.tt(profile.f));
    if (profile.vv) parts.push(`V ${this.$t(profile.vv, "vertical")}`);
    if (profile.hv) parts.push(`H ${this.$t(profile.hv, "horizontal")}`);
    return parts.filter(Boolean).join(" · ");
  }

  profileDraftV1(profile = null) {
    const state = this.Z();
    const modes = this.ft();
    let mode = profile?.m;
    if (!modes.includes(mode)) {
      const current = state.state?.state;
      mode =
        (modes.includes(current) && current !== "off" && current) ||
        this.gt() ||
        (modes.includes("cool") ? "cool" : modes[0]) ||
        "";
    }
    let temperature = Number.isFinite(profile?.t)
      ? profile.t
      : this.K(state.attributes?.temperature);
    if (temperature === null || !Number.isFinite(temperature)) temperature = 22;
    temperature = this.Et(temperature) ?? temperature;
    let fan = profile?.f ?? null;
    if (fan && !this.bt().includes(fan)) fan = null;
    if (!profile && this.bt().includes(state.attributes?.fan_mode))
      fan = state.attributes.fan_mode;
    const draft = {
      n: profile?.n ?? "",
      m: mode,
      t: temperature,
      f: fan,
      vv: null,
      hv: null,
    };
    for (const vane of this.vt()) {
      const key = vane.axis === "vertical" ? "vv" : "hv";
      const saved = profile?.[key];
      draft[key] =
        saved && vane.qs.includes(saved)
          ? saved
          : !profile && vane.qs.includes(vane.state)
            ? vane.state
            : null;
    }
    return draft;
  }

  profileNormaliseV1(draft) {
    const name = String(draft?.n ?? "").trim();
    const modes = this.ft();
    if (!name) throw new Error("Enter a profile name.");
    if (name.length > 24)
      throw new Error("Profile names can be up to 24 characters.");
    if (!modes.includes(draft.m)) throw new Error("Choose an available mode.");
    const profile = { v: 1, n: name, m: draft.m };
    if (["heat", "cool", "auto"].includes(draft.m)) {
      const temperature = this.Et(draft.t);
      if (temperature === null)
        throw new Error("Choose a valid target temperature.");
      profile.t = temperature;
    }
    if (draft.f && this.bt().includes(draft.f)) profile.f = draft.f;
    for (const vane of this.vt()) {
      const key = vane.axis === "vertical" ? "vv" : "hv";
      if (draft[key] && vane.qs.includes(draft[key])) profile[key] = draft[key];
    }
    return profile;
  }

  async profileStoreV1() {
    const roomId = splitProfileRoomId(this);
    if (this._profileBusyV1 || !this._profileEditV1 || !roomId) return;
    const rows = this.profileRowsV1();
    let profile;
    try {
      profile = this.profileNormaliseV1(this._profileEditV1.draft);
    } catch (error) {
      this._profileMessageV1 = { text: error.message, type: "error" };
      this.St();
      return;
    }
    const duplicate = rows.find(
      (row) =>
        row.profile &&
        row.index !== this._profileEditV1.index &&
        row.profile.n.trim().toLowerCase() === profile.n.trim().toLowerCase(),
    );
    if (duplicate) {
      this._profileMessageV1 = {
        text: "A profile with that name already exists.",
        type: "error",
      };
      this.St();
      return;
    }
    const row =
      this._profileEditV1.index === null
        ? rows.find(
            (candidate) =>
              candidate.available && !candidate.profile && !candidate.invalid,
          )
        : rows[this._profileEditV1.index];
    if (!row) {
      this._profileMessageV1 = {
        text: `Maximum of ${SPLIT_PROFILE_SLOT_COUNT} profiles reached.`,
        type: "error",
      };
      this.St();
      return;
    }
    this._profileBusyV1 = true;
    this._profileMessageV1 = { text: "Saving profile…", type: "info" };
    this.St();
    try {
      await this.P.callService("ha_component_backend", "upsert_profile", {
        room_id: roomId,
        index: row.index,
        profile,
      });
      const profiles = rows
        .filter((candidate) => candidate.profile)
        .map((candidate) => candidate.profile);
      profiles[row.index] = profile;
      this._profileLocalProfilesV1 = profiles.filter(Boolean);
      this._profileEditV1 = null;
      this._profileMessageV1 = { text: `${profile.n} saved.`, type: "info" };
    } catch {
      this._profileMessageV1 = {
        text: "Could not save the profile.",
        type: "error",
      };
    } finally {
      this._profileBusyV1 = false;
      this.St(true);
      this.H();
    }
  }

  async profileDeleteV1() {
    const roomId = splitProfileRoomId(this);
    if (this._profileBusyV1 || this._profileEditV1?.index === null || !roomId)
      return;
    const row = this.profileRowsV1()[this._profileEditV1.index];
    if (!row?.available) return;
    const name = row.profile?.n || "Profile";
    this._profileBusyV1 = true;
    this._profileMessageV1 = { text: "Deleting profile…", type: "info" };
    this.St();
    try {
      await this.P.callService("ha_component_backend", "remove_profile", {
        room_id: roomId,
        index: row.index,
      });
      this._profileLocalProfilesV1 = this.profileRowsV1()
        .filter(
          (candidate) => candidate.profile && candidate.index !== row.index,
        )
        .map((candidate) => candidate.profile);
      this._profileEditV1 = null;
      this._profileMessageV1 = { text: `${name} deleted.`, type: "info" };
    } catch {
      this._profileMessageV1 = {
        text: "Could not delete the profile.",
        type: "error",
      };
    } finally {
      this._profileBusyV1 = false;
      this.St(true);
      this.H();
    }
  }

  async profileApplyV1(profile) {
    if (this._profileBusyV1 || !profile) return;
    const state = this.Z();
    if (state.uv) {
      this._profileMessageV1 = {
        text: "The split system is currently unavailable.",
        type: "error",
      };
      this.St();
      return;
    }
    if (!this.ft().includes(profile.m)) {
      this._profileMessageV1 = {
        text: `${profile.n} uses a mode that is no longer available.`,
        type: "error",
      };
      this.St();
      return;
    }
    this._profileBusyV1 = true;
    this._profileMessageV1 = { text: `Applying ${profile.n}…`, type: "info" };
    this.St();
    try {
      if (
        Number.isFinite(profile.t) &&
        ["heat", "cool", "auto"].includes(profile.m)
      ) {
        const temperature = this.Et(profile.t);
        if (temperature === null) throw new Error("Invalid target");
        await this.P.callService("climate", "set_temperature", {
          entity_id: this.config.entity,
          temperature,
          hvac_mode: profile.m,
        });
      } else {
        await this.P.callService("climate", "set_hvac_mode", {
          entity_id: this.config.entity,
          hvac_mode: profile.m,
        });
      }
      const calls = [];
      if (profile.f && this.bt().includes(profile.f))
        calls.push(
          this.P.callService("climate", "set_fan_mode", {
            entity_id: this.config.entity,
            fan_mode: profile.f,
          }),
        );
      for (const vane of this.vt()) {
        const key = vane.axis === "vertical" ? "vv" : "hv";
        if (profile[key] && vane.qs.includes(profile[key]))
          calls.push(
            this.P.callService("select", "select_option", {
              entity_id: vane.entityId,
              option: profile[key],
            }),
          );
      }
      await Promise.all(calls);
      this._profileMessageV1 = null;
      this.Tt(`${profile.n} profile requested.`);
      this.M(true);
    } catch {
      this._profileMessageV1 = {
        text: `Could not apply ${profile.n}.`,
        type: "error",
      };
      this.St();
    } finally {
      this._profileBusyV1 = false;
      this.H();
    }
  }

  profileChoiceV1({
    title,
    key,
    options,
    value,
    optional = false,
    label,
    icon,
    onChange,
  }) {
    const group = document.createElement("div");
    group.className = "og";
    if (title) {
      const heading = document.createElement("div");
      heading.className = "gt";
      heading.textContent = title;
      group.append(heading);
    }
    const list = document.createElement("div");
    list.className = "qs";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", title || key);
    const choices = optional ? [null, ...options] : options;
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "o";
      button.dataset.focusKey = `profile-${key}-${choice ?? "keep"}`;
      this.It(button, button.dataset.focusKey);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(choice === value));
      button.disabled = this._profileBusyV1;
      button.tabIndex =
        choice === value || (!choices.includes(value) && index === 0) ? 0 : -1;
      const choiceIcon = document.createElement("ha-icon");
      choiceIcon.className = "oi";
      choiceIcon.setAttribute(
        "icon",
        choice === null ? "mdi:minus-circle-outline" : icon(choice),
      );
      const text = document.createElement("span");
      text.textContent = choice === null ? "Keep current" : label(choice);
      button.append(choiceIcon, text);
      if (choice === value) {
        const check = document.createElement("ha-icon");
        check.setAttribute("icon", "mdi:check");
        button.append(check);
      } else {
        button.append(document.createElement("span"));
      }
      button.addEventListener("click", () => {
        if (this._profileBusyV1 || choice === value) return;
        onChange(choice);
        this.St();
      });
      button.addEventListener("keydown", (event) => this.Pt(event, list));
      list.append(button);
    });
    group.append(list);
    return group;
  }

  profileRenderListV1(focusInitial = false) {
    const rows = this.profileRowsV1();
    const saved = rows.filter((row) => row.profile);
    const invalid = rows.filter((row) => row.invalid);
    const body = this.$.pb;
    body.replaceChildren();
    if (!saved.length) {
      const empty = document.createElement("div");
      empty.className = "pempty";
      empty.innerHTML =
        '<ha-icon icon="mdi:account-plus-outline"></ha-icon><strong>No saved profiles</strong><span>Create one from the split system\'s current settings, then adjust it before saving.</span>';
      body.append(empty);
    } else {
      const list = document.createElement("div");
      list.className = "plist";
      for (const row of saved) {
        const profile = row.profile;
        const active = this.profileActiveV1(profile);
        const wrap = document.createElement("div");
        wrap.className = "prow";
        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "papply";
        apply.dataset.focusKey = `profile-apply-${row.index}`;
        this.It(apply, apply.dataset.focusKey);
        apply.disabled = this._profileBusyV1 || this.Z().uv;
        apply.setAttribute("aria-current", active ? "true" : "false");
        const modeIcon = document.createElement("ha-icon");
        modeIcon.className = "pmi";
        modeIcon.setAttribute("icon", this.et(profile.m));
        const copy = document.createElement("span");
        copy.className = "pcopy";
        const name = document.createElement("strong");
        name.textContent = profile.n;
        const summary = document.createElement("small");
        summary.textContent = this.profileSummaryV1(profile);
        copy.append(name, summary);
        const status = document.createElement("ha-icon");
        status.className = "pstatus";
        status.setAttribute(
          "icon",
          active ? "mdi:check-circle" : "mdi:chevron-right",
        );
        apply.append(modeIcon, copy, status);
        apply.addEventListener("click", () => this.profileApplyV1(profile));

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "pedit";
        edit.dataset.focusKey = `profile-edit-${row.index}`;
        this.It(edit, edit.dataset.focusKey);
        edit.disabled = this._profileBusyV1;
        edit.setAttribute("aria-label", `Edit ${profile.n}`);
        const editIcon = document.createElement("ha-icon");
        editIcon.setAttribute("icon", "mdi:pencil-outline");
        edit.append(editIcon);
        edit.addEventListener("click", () => {
          this._profileEditV1 = {
            index: row.index,
            draft: this.profileDraftV1(profile),
          };
          this._profileMessageV1 = null;
          this.u = "profile-name";
          this.St(true);
        });
        wrap.append(apply, edit);
        list.append(wrap);
      }
      body.append(list);
    }
    if (invalid.length) {
      const warning = document.createElement("div");
      warning.className = "pmsg error";
      warning.textContent =
        "One saved profile could not be read. Delete or recreate the affected profile.";
      body.append(warning);
    }
    const create = document.createElement("button");
    create.type = "button";
    create.className = "pnew";
    create.dataset.focusKey = "profile-new";
    this.It(create, create.dataset.focusKey);
    const emptySlot = rows.some(
      (row) => row.available && !row.profile && !row.invalid,
    );
    create.disabled = this._profileBusyV1 || !emptySlot;
    const addIcon = document.createElement("ha-icon");
    addIcon.setAttribute("icon", "mdi:plus");
    const addText = document.createElement("span");
    addText.textContent = emptySlot
      ? "Create profile"
      : `${SPLIT_PROFILE_SLOT_COUNT} profile limit reached`;
    create.append(addIcon, addText);
    create.addEventListener("click", () => {
      if (!emptySlot || this._profileBusyV1) return;
      this._profileEditV1 = { index: null, draft: this.profileDraftV1() };
      this._profileMessageV1 = null;
      this.u = "profile-name";
      this.St(true);
    });
    body.append(create);
    this.profileAppendMessageV1(body);
    const focusKey = this.u;
    if (focusKey || focusInitial) {
      queueMicrotask(() => {
        const target = focusKey
          ? body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)
          : body.querySelector("button:not([disabled])");
        target?.focus();
      });
    }
  }

  profileAppendMessageV1(body) {
    if (!this._profileMessageV1) return;
    const message = document.createElement("div");
    message.className = `pmsg ${this._profileMessageV1.type === "error" ? "error" : ""}`;
    message.setAttribute("role", "status");
    message.textContent = this._profileMessageV1.text;
    body.append(message);
  }

  profileRenderEditorV1(focusInitial = false) {
    const edit = this._profileEditV1;
    if (!edit) return;
    const draft = edit.draft;
    const body = this.$.pb;
    body.replaceChildren();
    const intro = document.createElement("p");
    intro.className = "pintro";
    intro.textContent =
      edit.index === null
        ? "Current settings are used as the starting point. Only settings saved here will change when the profile is applied."
        : "Adjust the saved settings below. Changes do not affect the split system until the profile is applied.";
    body.append(intro);

    const nameWrap = document.createElement("label");
    nameWrap.className = "pname";
    nameWrap.textContent = "Profile name";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 24;
    input.placeholder = "e.g. Sleep";
    input.value = draft.n;
    input.dataset.focusKey = "profile-name";
    this.It(input, input.dataset.focusKey);
    input.disabled = this._profileBusyV1;
    input.addEventListener("input", () => {
      draft.n = input.value;
      this._profileMessageV1 = null;
    });
    nameWrap.append(input);
    body.append(nameWrap);

    body.append(
      this.profileChoiceV1({
        title: "Mode",
        key: "mode",
        options: this.ft(),
        value: draft.m,
        label: (value) => this.tt(value),
        icon: (value) => this.et(value),
        onChange: (value) => {
          draft.m = value;
        },
      }),
    );
    if (["heat", "cool", "auto"].includes(draft.m)) {
      const attrs = this.Z().attributes;
      const step = this.K(attrs.target_temp_step) ?? 0.5;
      const { minimum, maximum } = this.dt();
      const group = document.createElement("div");
      group.className = "og";
      const heading = document.createElement("div");
      heading.className = "gt";
      heading.textContent = "Target temperature";
      const stepper = document.createElement("div");
      stepper.className = "pstep";
      const createTemperatureButton = (direction, label) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.focusKey = `profile-temp-${direction < 0 ? "down" : "up"}`;
        this.It(button, button.dataset.focusKey);
        button.disabled =
          this._profileBusyV1 ||
          (direction < 0
            ? minimum !== null && Number(draft.t) <= minimum
            : maximum !== null && Number(draft.t) >= maximum);
        button.setAttribute("aria-label", label);
        const icon = document.createElement("ha-icon");
        icon.setAttribute("icon", direction < 0 ? "mdi:minus" : "mdi:plus");
        button.append(icon);
        button.addEventListener("click", () => {
          const base = Number(draft.t);
          if (!Number.isFinite(base)) return;
          const next = this.Dt(base + direction * step, step, minimum ?? base);
          draft.t = this.Et(next) ?? next;
          this.St();
        });
        return button;
      };
      const value = document.createElement("strong");
      value.textContent = this.it(draft.t) ?? "—";
      stepper.append(
        createTemperatureButton(-1, "Decrease profile target temperature"),
        value,
        createTemperatureButton(1, "Increase profile target temperature"),
      );
      group.append(heading, stepper);
      body.append(group);
    }
    const fans = this.bt();
    if (fans.length) {
      body.append(
        this.profileChoiceV1({
          title: "Fan",
          key: "fan",
          options: fans,
          value: draft.f,
          optional: true,
          label: (value) => this.tt(value),
          icon: (value) =>
            ({
              auto: "mdi:fan-auto",
              quiet: "mdi:volume-low",
              low: "mdi:fan-speed-1",
              medium: "mdi:fan-speed-2",
              high: "mdi:fan-speed-3",
            })[String(value).toLowerCase()] ?? "mdi:fan",
          onChange: (value) => {
            draft.f = value;
          },
        }),
      );
    }
    for (const vane of this.vt()) {
      const key = vane.axis === "vertical" ? "vv" : "hv";
      body.append(
        this.profileChoiceV1({
          title: vane.title,
          key,
          options: vane.qs,
          value: draft[key],
          optional: true,
          label: (value) => this.$t(value, vane.axis),
          icon: (value) => this.At(vane, value),
          onChange: (value) => {
            draft[key] = value;
          },
        }),
      );
    }
    this.profileAppendMessageV1(body);
    const actions = document.createElement("div");
    actions.className = `pactions ${edit.index !== null ? "editing" : ""}`;
    if (edit.index !== null) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "pdelete";
      remove.dataset.focusKey = "profile-delete";
      this.It(remove, remove.dataset.focusKey);
      remove.disabled = this._profileBusyV1;
      remove.textContent = "Delete";
      remove.addEventListener("click", () => this.profileDeleteV1());
      actions.append(remove);
    }
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.dataset.focusKey = "profile-cancel";
    this.It(cancel, cancel.dataset.focusKey);
    cancel.disabled = this._profileBusyV1;
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => {
      this._profileEditV1 = null;
      this._profileMessageV1 = null;
      this.u = "profile-new";
      this.St(true);
    });
    const save = document.createElement("button");
    save.type = "button";
    save.className = "psave";
    save.dataset.focusKey = "profile-save";
    this.It(save, save.dataset.focusKey);
    save.disabled = this._profileBusyV1 || !String(draft.n ?? "").trim();
    save.textContent = this._profileBusyV1 ? "Saving…" : "Save";
    save.addEventListener("click", () => this.profileStoreV1());
    actions.append(cancel, save);
    body.append(actions);
    const focusKey = this.u;
    if (focusKey || focusInitial) {
      queueMicrotask(() => {
        const target = focusKey
          ? body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)
          : input;
        target?.focus();
      });
    }
  }

  G() {
    const split = this.Z();
    if (split.uv || split.state?.state !== "off")
      return this._powerCore();
    const mode = this.gt();
    if (!mode || !this.config.room_id) return this._powerCore();
    this.Rt(
      "hvac",
      {
        requested: mode,
        label: this.tt(mode),
        call: () =>
          this.P.callService("ha_component_backend", "resume_room", {
            room_id: this.config.room_id,
          }),
        matches: () => this.X(this.config.entity)?.state === mode,
        closePanel: true,
        timeout: 10000,
      },
      true,
    );
  }

  R(...args) {
    const result = this._renderCore(...args);
    if (this.$?.pr) return result;
    this._profileEditV1 ??= null;
    this._profileBusyV1 ??= false;
    this._profileMessageV1 ??= null;
    const button = document.createElement("button");
    button.className = "pw pr";
    button.type = "button";
    button.dataset.panel = "profiles";
    button.setAttribute("aria-controls", "split-secondary");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Saved profiles");
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", "mdi:account-circle-outline");
    button.append(icon);
    this.$.sg?.before(button);
    this.$.pr = button;
    button.addEventListener("click", () => this.U("profiles", button));
    const style = document.createElement("style");
    style.textContent = SPLIT_PROFILE_STYLES;
    this.shadowRoot.append(style);
    return result;
  }

  V() {
    return `${this._signatureCore()}|${JSON.stringify(this.profileRowsV1().map((row) => row.raw))}`;
  }

  kt() {
    return this.o === "profiles"
      ? this.profileReadyV1()
      : this._panelAvailableCore();
  }

  H() {
    const result = this._refreshCore();
    if (!this.$?.pr) return result;
    const ready = this.profileReadyV1();
    this.$.pr.hidden = !ready;
    this.$.hd.classList.toggle("profiled", ready);
    const active = ready
      ? this.profileRowsV1().find(
          (row) => row.profile && this.profileActiveV1(row.profile),
        )
      : null;
    this.$.pr.classList.toggle("on", Boolean(active));
    this.$.pr
      .querySelector("ha-icon")
      ?.setAttribute(
        "icon",
        active ? "mdi:account-check-outline" : "mdi:account-circle-outline",
      );
    this.$.pr.setAttribute(
      "aria-label",
      active ? `Saved profiles · ${active.profile.n} active` : "Saved profiles",
    );
    this.$.pr.setAttribute("aria-expanded", String(this.o === "profiles"));
    return result;
  }

  St(focusInitial = false) {
    if (this.o !== "profiles")
      return this._renderPanelCore(focusInitial);
    if (!this.profileReadyV1()) return;
    this.$.pt.textContent =
      this._profileEditV1?.index === null
        ? "New profile"
        : this._profileEditV1
          ? "Edit profile"
          : "Saved profiles";
    if (this._profileEditV1) this.profileRenderEditorV1(focusInitial);
    else this.profileRenderListV1(focusInitial);
  }

  M(restoreFocus) {
    const wasProfiles = this.o === "profiles";
    const result = this._closePanelCore(restoreFocus);
    if (wasProfiles) {
      this._profileEditV1 = null;
      this._profileMessageV1 = null;
      this.u = null;
    }
    return result;
  }
}

const SPLIT_PROFILE_STYLES = `
  .hd.profiled{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}.hd.settings.profiled{grid-template-columns:minmax(0,1fr) 44px 44px 44px;gap:8px}
  .plist{display:grid;gap:8px}.prow{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:8px}.papply{min-height:58px;padding:8px 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:24px minmax(0,1fr) 20px;align-items:center;gap:10px;text-align:left;background:transparent}.papply[aria-current=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.pmi{color:var(--secondary-text-color);--mdc-icon-size:20px}.papply[aria-current=true] .pmi{color:var(--primary-color)}.pcopy{min-width:0}.pcopy strong,.pcopy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pcopy strong{font-size:13px;line-height:1.25;font-weight:650}.pcopy small{margin-top:4px;color:var(--secondary-text-color);font-size:12px;line-height:1.2;font-weight:400}.pstatus{color:var(--secondary-text-color);--mdc-icon-size:18px}.papply[aria-current=true] .pstatus{color:var(--primary-color)}.pedit{width:44px;min-height:58px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.pnew{width:100%;min-height:46px;margin-top:12px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:var(--primary-color);font-size:13px;font-weight:650}.pempty{min-height:126px;padding:20px 16px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--secondary-text-color)}.pempty ha-icon{--mdc-icon-size:28px;color:var(--primary-color)}.pempty strong{margin-top:10px;color:var(--primary-text-color);font-size:14px}.pempty span{max-width:280px;margin-top:5px;font-size:12px;line-height:1.4}.pintro{margin:0 0 12px;color:var(--secondary-text-color);font-size:12px;line-height:1.4}.pname{display:block;margin-bottom:12px;color:var(--secondary-text-color);font-size:13px;font-weight:600}.pname input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent}.pstep{display:grid;grid-template-columns:44px minmax(90px,1fr) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);overflow:hidden}.pstep button{width:44px;height:46px;display:grid;place-items:center}.pstep strong{text-align:center;font-size:18px;font-variant-numeric:tabular-nums}.pmsg{margin-top:10px;color:var(--secondary-text-color);font-size:12px;line-height:1.35}.pmsg.error{color:var(--error-color)}.pactions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--divider-color)}.pactions.editing{grid-template-columns:1fr 1fr 1fr}.pactions button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.pactions .psave{color:var(--primary-color)}.pactions .pdelete{color:var(--error-color)}@media(max-width:420px){.pactions.editing{grid-template-columns:1fr 1fr}.pactions.editing .pdelete{grid-column:1/-1;grid-row:2}}
`;

registerCard({
  type: "component-split-controller-v4",
  element: ComponentSplitControllerV4,
  name: "Split-System Controller",
  description:
    "Registry-aware split-system controller with settings, timer, saved-profile, and durable resume support.",
});
