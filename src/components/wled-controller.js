/** ComponentWledControllerV1 — reusable Home Assistant dashboard card. */
const {
  createRequestCoalescer,
  interaction,
  openMoreInfo,
  registerCard,
  waitForEntityState,
  WLED_HD,
  WLED_DOMAIN,
  WLED_INVALID,
  WLED_NAME,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentWledControllerV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this.h = null;
    this.d = null;
    this.b = null;
    this.unsub = null;
    this.loading = false;
    this.sheetSignature = "";
    this._interactionHandles = [];
    this._brightnessCoalescer = null;
    this._brightnessIntent = null;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button,select,input{font:inherit;color:inherit}
      ha-card{display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}
      .head{min-height:58px;padding:8px 8px 7px 10px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}
      .ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:20px}.on .ico{color:var(--primary-color)}
      .identity{appearance:none;border:0;background:transparent;min-width:0;padding:0;text-align:left;cursor:pointer}.name,.status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.status{margin-top:3px;font-size:12px;line-height:1.25;color:var(--secondary-text-color)}
      .power,.action,.close{appearance:none;border:1px solid var(--divider-color);background:transparent;border-radius:var(--dashboard-radius-control,8px);cursor:pointer}.power{width:44px;height:44px;display:grid;place-items:center;color:var(--secondary-text-color)}.power ha-icon{--mdc-icon-size:18px}.on .power{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 8%,transparent)}
      .body{padding:0 10px 10px;display:grid;gap:8px}.slider-row{display:grid;grid-template-columns:74px minmax(0,1fr) 38px;align-items:center;gap:8px}.label{font-size:11px;color:var(--secondary-text-color)}.value{font-size:11px;text-align:right;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
      input[type=range]{width:100%;min-width:0;accent-color:var(--primary-color)}
      .actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}.action{min-height:44px;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--secondary-text-color)}.action ha-icon{--mdc-icon-size:15px}.action:hover,.action:focus-visible{color:var(--primary-text-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}
      dialog{width:min(620px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));padding:0;margin:auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}
      .sheet{display:flex;flex-direction:column;max-height:min(760px,calc(100dvh - 24px))}.sheet-head{min-height:54px;padding:5px 7px 5px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.sheet-head ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}.sheet-title{min-width:0;flex:1}.sheet-name{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sheet-state{margin-top:2px;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.close{width:44px;height:44px;display:grid;place-items:center;color:var(--secondary-text-color);border-color:transparent}.close ha-icon{--mdc-icon-size:18px}
      .sheet-body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom));display:grid;gap:16px}.section{display:grid;gap:8px}.section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--secondary-text-color)}.section-title:after{content:'';height:1px;background:var(--divider-color);flex:1}
      .preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.preset-btn{appearance:none;min-height:44px;padding:6px 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-text-color);text-align:left;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preset-btn:hover,.preset-btn:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.preset-btn.active{border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,transparent);color:var(--primary-color)}
      .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.field{display:grid;gap:4px;min-width:0}.field>span{font-size:11px;color:var(--secondary-text-color);padding-left:2px}select{width:100%;height:44px;min-width:0;padding:0 28px 0 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:var(--card-background-color);font-size:12px;outline:none}
      .fine{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fine-card{min-width:0;padding:8px 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px)}.fine-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px}.fine-head span,.fine-head output{font-size:11px;color:var(--secondary-text-color)}.fine-head output{font-variant-numeric:tabular-nums}
      .native{display:flex;justify-content:flex-end}
      :is(button,select,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled,select:disabled,input:disabled{opacity:.45;cursor:default}
      @media(max-width:520px){dialog{width:100vw;max-width:100vw;height:88dvh;max-height:88dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:var(--dashboard-radius-dialog,8px) var(--dashboard-radius-dialog,8px) 0 0}.sheet{height:88dvh;max-height:88dvh}.sheet-body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}.preset-grid{grid-template-columns:1fr}.fields,.fine{grid-template-columns:1fr}.body{padding-left:9px;padding-right:9px}.head{padding-left:8px}.slider-row{grid-template-columns:68px minmax(0,1fr) 36px}.actions{justify-content:stretch}.actions .action{flex:1;justify-content:center}}
    </style><ha-card><div class="head"><span class="ico"><ha-icon icon="mdi:led-strip-variant"></ha-icon></span><button class="identity" type="button"><span class="name">WLED</span><span class="status">Loading…</span></button><button class="power" type="button" aria-label="Toggle WLED"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="body"><div class="slider-row"><span class="label">Brightness</span><input class="brightness" type="range" min="0" max="255" step="1"><output class="brightness-value value">—</output></div><div class="actions"><button class="action presets" type="button"><ha-icon icon="mdi:bookmark-multiple-outline"></ha-icon><span>Presets</span></button><button class="action colour" type="button"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Colour</span></button><button class="action advanced" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Advanced</span></button></div></div></ha-card><dialog><div class="sheet"><div class="sheet-head"><ha-icon icon="mdi:led-strip-variant"></ha-icon><span class="sheet-title"><div class="sheet-name">WLED</div><div class="sheet-state"></div></span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="sheet-body"><section class="section presets-section"><div class="section-title">Presets</div><div class="preset-grid"></div></section><section class="section"><div class="section-title">Effect</div><div class="fields"><label class="field"><span>Effect</span><select class="effect"></select></label><label class="field"><span>Palette</span><select class="palette"></select></label></div></section><section class="section"><div class="section-title">Animation</div><div class="fine"><label class="fine-card"><span class="fine-head"><span>Speed</span><output class="speed-value">—</output></span><input class="speed" type="range" min="0" max="255" step="1"></label><label class="fine-card"><span class="fine-head"><span>Intensity</span><output class="intensity-value">—</output></span><input class="intensity" type="range" min="0" max="255" step="1"></label></div></section><div class="native"><button class="action native-colour" type="button"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Colour & white controls</span></button></div></div></div></dialog>`;
    this.head = this.shadowRoot.querySelector(".head");
    this.nameEl = this.shadowRoot.querySelector(".name");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.sheetName = this.shadowRoot.querySelector(".sheet-name");
    this.sheetState = this.shadowRoot.querySelector(".sheet-state");
    this.power = this.shadowRoot.querySelector(".power");
    this.identity = this.shadowRoot.querySelector(".identity");
    this.brightness = this.shadowRoot.querySelector(".brightness");
    this.brightnessValue = this.shadowRoot.querySelector(".brightness-value");
    this.presetsBtn = this.shadowRoot.querySelector(".presets");
    this.colour = this.shadowRoot.querySelector(".colour");
    this.advanced = this.shadowRoot.querySelector(".advanced");
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.presetGrid = this.shadowRoot.querySelector(".preset-grid");
    this.presetsSection = this.shadowRoot.querySelector(".presets-section");
    this.effect = this.shadowRoot.querySelector(".effect");
    this.palette = this.shadowRoot.querySelector(".palette");
    this.speed = this.shadowRoot.querySelector(".speed");
    this.speedValue = this.shadowRoot.querySelector(".speed-value");
    this.intensity = this.shadowRoot.querySelector(".intensity");
    this.intensityValue = this.shadowRoot.querySelector(".intensity-value");
    this.nativeColour = this.shadowRoot.querySelector(".native-colour");
    this._interactionHandles.push(
      interaction(this.power, {
        primary: () => this.togglePower(),
        optimistic: {
          capture: () => this.head.classList.contains("on"),
          apply: () => {
            const next = !this.head.classList.contains("on");
            this.head.classList.toggle("on", next);
            this.power.setAttribute("aria-pressed", String(next));
            this.statusEl.textContent = next ? "Turning on…" : "Turning off…";
          },
          rollback: (previous) => {
            this.head.classList.toggle("on", previous);
            this.power.setAttribute("aria-pressed", String(previous));
            this.render();
          },
        },
        feedback: true,
      }),
      interaction(this.identity, {
        primary: () => this.openAdvanced(false),
        hold: () => this.moreInfo(this.b?.main),
        feedback: true,
      }),
      interaction(this.presetsBtn, {
        primary: () => this.openAdvanced(true),
        feedback: true,
      }),
      interaction(this.advanced, {
        primary: () => this.openAdvanced(false),
        feedback: true,
      }),
      interaction(this.colour, {
        primary: () => this.moreInfo(this.b?.effectLights?.[0] || this.b?.main),
        feedback: true,
      }),
      interaction(this.nativeColour, {
        primary: () => this.moreInfo(this.b?.effectLights?.[0] || this.b?.main),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".close"), {
        primary: () => this.dialog.close(),
        feedback: true,
      }),
    );
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog) this.dialog.close();
    });
    this.brightness.oninput = () => {
      const v = Number(this.brightness.value);
      this._brightnessIntent = v;
      this.brightnessValue.textContent = this.pct(v);
      this.brightnessCoalescer().request(v);
    };
    this.brightness.onchange = () => {};
    this.effect.onchange = () =>
      this.effect.value &&
      this.call("light", "turn_on", this.b?.effectLights || [], {
        effect: this.effect.value,
      });
    this.palette.onchange = () =>
      this.palette.value &&
      this.call("select", "select_option", this.b?.palettes || [], {
        option: this.palette.value,
      });
    this.speed.oninput = () => (this.speedValue.textContent = this.speed.value);
    this.speed.onchange = () =>
      this.call("number", "set_value", this.b?.speeds || [], {
        value: Number(this.speed.value),
      });
    this.intensity.oninput = () =>
      (this.intensityValue.textContent = this.intensity.value);
    this.intensity.onchange = () =>
      this.call("number", "set_value", this.b?.intensities || [], {
        value: Number(this.intensity.value),
      });
  }
  setConfig(c) {
    if (!c?.entity) throw new Error("WLED controller requires entity");
    this.c = { ...c };
    this.d = null;
    this.b = null;
    this.load();
  }
  set hass(h) {
    this.h = h;
    this.unsub || this.subscribe();
    if (this.d) {
      this.b = this.bundle();
      this.render();
    } else this.load();
  }
  connectedCallback() {
    this.subscribe();
    this.load();
  }
  disconnectedCallback() {
    // Retained controls stay live through a transient Home Assistant detach.
    this._brightnessCoalescer?.destroy();
    this._brightnessCoalescer = null;
    this._brightnessIntent = null;
    this.unsub?.();
    this.unsub = null;
  }
  getCardSize() {
    return 2;
  }
  subscribe() {
    if (this.unsub || !this.h || !WLED_HD.REG?.subscribe) return;
    this.unsub = WLED_HD.REG.subscribe(this.h, (d) => {
      this.d = d;
      if (!this.c) return;
      this.b = this.bundle();
      this.render();
    });
  }
  async load(force = false) {
    if (this.loading || !this.h || !this.c || !WLED_HD.REG?.load) return;
    this.loading = true;
    try {
      this.d = this.d || (await WLED_HD.REG.load(this.h, force));
      this.b = this.bundle();
      this.render();
    } finally {
      this.loading = false;
    }
  }
  bundle() {
    const all = this.d?.entities || [],
      entry = all.find((e) => e.entity_id === this.c.entity),
      deviceId = this.c.device_id || entry?.device_id,
      siblings = (deviceId ? this.d?.byDevice?.get(deviceId) : []) || [],
      rows = siblings.filter(
        (e) =>
          e?.platform === "wled" &&
          !e.disabled_by &&
          this.h.states[e.entity_id],
      ),
      lightRows = rows.filter((e) => WLED_DOMAIN(e.entity_id) === "light"),
      main =
        lightRows.find((e) => e.entity_id === this.c.entity) ||
        lightRows.find((e) => WLED_NAME(e) === "main") ||
        lightRows[0],
      effectRows = lightRows.filter((e) =>
        Array.isArray(this.h.states[e.entity_id]?.attributes?.effect_list),
      ),
      selectRows = rows.filter((e) => WLED_DOMAIN(e.entity_id) === "select"),
      numberRows = rows.filter((e) => WLED_DOMAIN(e.entity_id) === "number"),
      match = (e, re) =>
        re.test(`${e.entity_id} ${e.original_name || ""} ${e.name || ""}`),
      preset = selectRows.find((e) => match(e, /\bpreset\b/i)),
      palettes = selectRows.filter((e) =>
        match(e, /color.?palette|colour.?palette/i),
      ),
      speeds = numberRows.filter((e) => match(e, /\bspeed\b/i)),
      intensities = numberRows.filter((e) => match(e, /\bintensity\b/i)),
      dev = this.d?.devices?.find((x) => x.id === deviceId),
      deviceName =
        dev?.name_by_user ||
        dev?.name ||
        this.h.states[main?.entity_id]?.attributes?.friendly_name ||
        "WLED";
    return {
      deviceId,
      deviceName,
      main: main?.entity_id || this.c.entity,
      effectLights: effectRows.map((e) => e.entity_id),
      preset: preset?.entity_id || null,
      palettes: palettes.map((e) => e.entity_id),
      speeds: speeds.map((e) => e.entity_id),
      intensities: intensities.map((e) => e.entity_id),
    };
  }
  pct(v) {
    const n = Number(v);
    return Number.isFinite(n) ? `${Math.round((n / 255) * 100)}%` : "—";
  }
  async togglePower() {
    const id = this.b?.main,
      state = id ? this.h?.states?.[id] : null;
    if (!id || !state) return;
    const wasOn = state.state === "on";
    await this.h.callService("light", "toggle", { entity_id: id });
    await waitForEntityState(
      () => this.h,
      id,
      (value) => value === (wasOn ? "off" : "on"),
      { timeout: 9000 },
    );
  }
  brightnessCoalescer() {
    if (this._brightnessCoalescer) return this._brightnessCoalescer;
    this._brightnessCoalescer = createRequestCoalescer(
      async (value) => {
        const id = this.b?.main;
        if (!id) return;
        if (value <= 0)
          await this.h.callService("light", "turn_off", { entity_id: id });
        else
          await this.h.callService("light", "turn_on", {
            entity_id: id,
            brightness: value,
          });
        await waitForEntityState(
          () => this.h,
          id,
          (state, obj) =>
            value <= 0
              ? state === "off"
              : state === "on" &&
                Math.abs(Number(obj?.attributes?.brightness ?? -999) - value) <=
                  2,
          { timeout: 7000 },
        );
      },
      {
        onSuccess: (value) => {
          if (this._brightnessIntent === value) this._brightnessIntent = null;
          this.render();
        },
        onError: () => {
          this._brightnessIntent = null;
          this.render();
        },
      },
    );
    return this._brightnessCoalescer;
  }
  same(ids, read) {
    const vals = ids
      .map((id) => read(this.h.states[id]))
      .filter(
        (v) =>
          v !== undefined &&
          v !== null &&
          !WLED_INVALID.has(String(v).toLowerCase()),
      );
    if (!vals.length) return null;
    return vals.every((v) => String(v) === String(vals[0])) ? vals[0] : "Mixed";
  }
  setOptions(el, options, current, emptyLabel) {
    const opts = Array.isArray(options) ? options : [],
      valid =
        current != null &&
        current !== "Mixed" &&
        opts.includes(String(current));
    el.replaceChildren();
    if (!valid) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = current === "Mixed" ? "Mixed" : emptyLabel;
      o.selected = true;
      el.append(o);
    }
    for (const v of opts) {
      const o = document.createElement("option");
      o.value = String(v);
      o.textContent = String(v);
      o.selected = valid && String(v) === String(current);
      el.append(o);
    }
    el.disabled = !opts.length;
  }
  renderPresets(options, current) {
    for (const button of this.presetGrid?.querySelectorAll?.(".preset-btn") ||
      []) {
      button._interaction?.destroy?.();
      button._interaction = null;
    }
    this.presetGrid.replaceChildren();
    if (!options.length) {
      const x = document.createElement("span");
      x.className = "label";
      x.textContent = "No presets configured";
      this.presetGrid.append(x);
      return;
    }
    for (const value of options) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `preset-btn ${String(current) === String(value) ? "active" : ""}`;
      b.textContent = String(value);
      b.title = String(value);
      b._interaction = interaction(b, {
        primary: async () => {
          await this.call(
            "select",
            "select_option",
            this.b?.preset ? [this.b.preset] : [],
            { option: value },
          );
          this.dialog.close();
        },
        optimistic: "selection",
        feedback: true,
      });
      this.presetGrid.append(b);
    }
  }
  render() {
    if (!this.h || !this.b) return;
    const main = this.h.states[this.b.main];
    const state = String(main?.state || "unavailable").toLowerCase();
    const on = state === "on";
    const controllable = state === "on" || state === "off";
    const reportedBrightness = on
      ? Number(main?.attributes?.brightness ?? 0)
      : 0;
    const brightness = this._brightnessIntent ?? reportedBrightness;
    const effect = this.same(this.b.effectLights, (s) => s?.attributes?.effect);
    const palette = this.same(this.b.palettes, (s) => s?.state);
    const speed = this.same(this.b.speeds, (s) => s?.state);
    const intensity = this.same(this.b.intensities, (s) => s?.state);
    const presetState = this.b.preset ? this.h.states[this.b.preset] : null;
    const presetOptions = presetState?.attributes?.options || [];
    const body = this.shadowRoot?.querySelector(".body");

    this.head.classList.toggle("on", on);
    this.nameEl.textContent = this.b.deviceName;
    const status = on
      ? [
          this.pct(brightness),
          effect && effect !== "Mixed" ? effect : null,
          palette && palette !== "Mixed" ? palette : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : state === "unavailable"
        ? "Unavailable"
        : state === "unknown"
          ? "Unknown"
          : "Off";
    this.statusEl.textContent = status;
    this.sheetName.textContent = this.b.deviceName;
    this.sheetState.textContent = status;
    if (body) body.style.display = on ? "grid" : "none";
    this.brightness.disabled = !main;
    this.brightness.value = String(
      Math.max(0, Math.min(255, Number.isFinite(brightness) ? brightness : 0)),
    );
    this.brightnessValue.textContent = this.pct(this.brightness.value);
    this.power.disabled = !controllable;
    this.power.setAttribute("aria-pressed", String(on));

    const usable = (id) => {
      const value = this.h.states[id];
      return Boolean(
        value && !WLED_INVALID.has(String(value.state).toLowerCase()),
      );
    };
    const presetOk = Boolean(this.b.preset && usable(this.b.preset));
    const effectOk = this.b.effectLights.some(usable);
    const paletteOk = this.b.palettes.some(usable);
    const speedOk = this.b.speeds.some(usable);
    const intensityOk = this.b.intensities.some(usable);
    this.presetsBtn.disabled = !on || !presetOk;
    this.colour.disabled = !on || !effectOk;
    this.nativeColour.disabled = !on || !effectOk;
    this.effect.disabled = !on || !effectOk;
    this.palette.disabled = !on || !paletteOk;
    this.speed.disabled = !on || !speedOk;
    this.intensity.disabled = !on || !intensityOk;
    this.advanced.disabled =
      !on || !(presetOk || effectOk || paletteOk || speedOk || intensityOk);
    if (!on && this.dialog?.open) this.dialog.close();
    if (!this.dialog.open) {
      this.sheetSignature = "";
      return;
    }
    const fxState = this.b.effectLights
      .map((id) => this.h.states[id])
      .find(Boolean);
    const fxOptions = fxState?.attributes?.effect_list || [];
    const paletteState = this.b.palettes
      .map((id) => this.h.states[id])
      .find(Boolean);
    const paletteOptions = paletteState?.attributes?.options || [];
    const sheetSignature = JSON.stringify([
      this.b.main,
      this.b.preset,
      this.b.effectLights,
      this.b.palettes,
      this.b.speeds,
      this.b.intensities,
      main,
      presetState,
      fxState,
      paletteState,
      ...this.b.speeds.map((id) => this.h.states[id]),
      ...this.b.intensities.map((id) => this.h.states[id]),
    ]);
    if (sheetSignature === this.sheetSignature) return;
    this.sheetSignature = sheetSignature;
    this.renderPresets(presetOptions, presetState?.state);
    this.setOptions(this.effect, fxOptions, effect, "Choose effect");
    this.setOptions(this.palette, paletteOptions, palette, "Choose palette");
    this.setRange(this.speed, this.speedValue, this.b.speeds, speed);
    this.setRange(
      this.intensity,
      this.intensityValue,
      this.b.intensities,
      intensity,
    );
    this.presetsBtn.disabled = !on || !presetOk;
    this.colour.disabled = !on || !effectOk;
    this.nativeColour.disabled = !on || !effectOk;
    this.effect.disabled = !on || !effectOk;
    this.palette.disabled = !on || !paletteOk;
    this.speed.disabled = !on || !speedOk;
    this.intensity.disabled = !on || !intensityOk;
    this.advanced.disabled =
      !on || !(presetOk || effectOk || paletteOk || speedOk || intensityOk);
  }
  setRange(input, output, ids, value) {
    const s = ids.map((id) => this.h.states[id]).find(Boolean),
      a = s?.attributes || {};
    input.min = String(a.min ?? 0);
    input.max = String(a.max ?? 255);
    input.step = String(a.step ?? 1);
    const n = value === "Mixed" ? Number(s?.state) : Number(value);
    input.value = String(Number.isFinite(n) ? n : Number(input.min));
    input.disabled = !ids.length;
    output.textContent =
      value === "Mixed"
        ? "Mixed"
        : ids.length
          ? String(Math.round(Number(input.value)))
          : "—";
  }
  openAdvanced(presets = false) {
    if (
      !this.dialog ||
      !this.b ||
      String(
        this.h?.states?.[this.b.main]?.state || "unavailable",
      ).toLowerCase() !== "on"
    )
      return;
    if (!this.dialog.open) {
      this.dialog.showModal();
      this.render();
    }
    queueMicrotask(() => {
      if (presets) this.presetsSection?.scrollIntoView({ block: "start" });
      else this.shadowRoot.querySelector(".close")?.focus();
    });
  }
  async call(domain, service, ids, data = {}) {
    const targets = [...new Set((ids || []).filter(Boolean))];
    if (!this.h || !targets.length) return;
    await Promise.all(
      targets.map((entity_id) =>
        this.h.callService(domain, service, { entity_id, ...data }),
      ),
    );
  }
  moreInfo(entityId) {
    openMoreInfo(this, entityId);
  }
}
registerCard({
  type: "component-wled-controller-v1",
  element: ComponentWledControllerV1,
  name: "WLED Controller V1",
  description: "Minimal WLED control with advanced settings sheet.",
});
