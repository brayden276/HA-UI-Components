/** ComponentControlRowV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, createRequestCoalescer, interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentControlRowV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._hass = null;
    this.on = true;
    this.val = 68;
    this._interactions = [];
    this._coalescer = null;
  }
  setConfig(c) {
    this.c = { icon: 'mdi:lightbulb-outline', title: 'Control name', state: 'Current state', mode: 'slider', value: 68, entity: null, ...c };
    this.on = this.c.on !== false;
    this.val = Math.max(0, Math.min(100, Number(this.c.value) || 68));
    this._resetCoalescer();
    this.r();
  }
  set hass(hass) {
    this._hass = hass;
    this.r();
  }
  disconnectedCallback() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    this._resetCoalescer();
  }
  getCardSize() { return 1; }
  _state() { return this.c?.entity ? this._hass?.states?.[this.c.entity] ?? null : null; }
  _domain() { return String(this.c?.entity || '').split('.')[0]; }
  _available(state = this._state()) { return Boolean(state && !['unknown', 'unavailable'].includes(String(state.state).toLowerCase())); }
  _sliderPercent(state) {
    if (!this.c.entity || !state) return this.val;
    const domain = this._domain();
    if (domain === 'light') return state.state === 'on' ? Math.round(Number(state.attributes?.brightness ?? 255) / 255 * 100) : 0;
    if (domain === 'fan') return Math.max(0, Math.min(100, Number(state.attributes?.percentage) || 0));
    if (domain === 'number' || domain === 'input_number') {
      const min = Number(state.attributes?.min ?? 0), max = Number(state.attributes?.max ?? 100), value = Number(state.state);
      if (Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max) && max > min) return Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
    }
    const value = Number(state.state);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : this.val;
  }
  _description(state) {
    if (!this.c.entity) return this.c.state;
    if (!this._available(state)) return 'Unavailable';
    try { return this._hass?.formatEntityState?.(state) || this.c.state; }
    catch { return String(state.state || this.c.state); }
  }
  _resetCoalescer() {
    this._coalescer?.destroy();
    this._coalescer = null;
  }
  _sliderCoalescer() {
    if (this._coalescer) return this._coalescer;
    this._coalescer = createRequestCoalescer((value) => this._sendSlider(value), {
      onError: () => {
        const state = this._state();
        this.val = this._sliderPercent(state);
        this._updateSliderVisual();
      },
    });
    return this._coalescer;
  }
  async _sendSlider(percent) {
    const entity_id = this.c.entity;
    if (!entity_id || !this._hass) return;
    const custom = this.c.slider_service;
    if (custom && typeof custom === 'object' && custom.domain && custom.service) {
      const key = custom.data_key || 'value';
      return this._hass.callService(custom.domain, custom.service, { entity_id, ...(custom.data || {}), [key]: percent });
    }
    const domain = this._domain();
    if (domain === 'light') {
      return percent <= 0
        ? this._hass.callService('light', 'turn_off', { entity_id })
        : this._hass.callService('light', 'turn_on', { entity_id, brightness_pct: Math.round(percent) });
    }
    if (domain === 'fan') return this._hass.callService('fan', 'set_percentage', { entity_id, percentage: Math.round(percent) });
    if (domain === 'number' || domain === 'input_number') {
      const state = this._state(), min = Number(state?.attributes?.min ?? 0), max = Number(state?.attributes?.max ?? 100);
      const value = min + (max - min) * percent / 100;
      return this._hass.callService(domain, 'set_value', { entity_id, value });
    }
    throw new Error(`Slider mode does not support ${domain || 'this entity'} without slider_service`);
  }
  _updateSliderVisual() {
    const fill = this.shadowRoot.querySelector('.slider > span');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, this.val))}%`;
  }
  async _toggle(reportedOn) {
    await this._hass.callService('homeassistant', 'toggle', { entity_id: this.c.entity });
    await waitForEntityState(() => this._hass, this.c.entity, (value) => value === (reportedOn ? 'off' : 'on'), { timeout: 9000 });
  }
  _serviceAction() {
    const service = String(this.c.service || '');
    const [domain, name] = service.split('.');
    if (!domain || !name) return openMoreInfo(this, this.c.entity);
    return this._hass.callService(domain, name, { entity_id: this.c.entity, ...(this.c.service_data || {}) });
  }
  r() {
    if (!this.c) return;
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const m = this.c.mode;
    const live = Boolean(this.c.entity);
    const state = this._state();
    const available = live ? this._available(state) : true;
    const reportedOn = live ? state?.state === 'on' : this.on;
    this.on = reportedOn;
    if (m === 'slider' && live) this.val = this._sliderPercent(state);
    let ctl = m === 'switch'
      ? `<span class="switch ${this.on ? 'on' : ''}"><span></span></span>`
      : m === 'state'
        ? `<span class="metric">${this.escapeHtml(live ? this._description(state) : this.c.value)}</span>`
        : m === 'action'
          ? '<span class="action">Action</span>'
          : `<span class="slider"><span style="width:${this.val}%"></span>${live ? `<input class="live-slider" type="range" min="0" max="100" step="1" value="${Math.round(this.val)}" aria-label="${this.escapeHtml(this.c.title)}">` : ''}</span>`;
    const interactivePreview = !live && (m === 'switch' || m === 'slider');
    const rowInteractive = live ? m !== 'slider' : interactivePreview;
    const tag = rowInteractive ? 'button' : 'div';
    const attrs = rowInteractive ? ` type="button" ${live && !available ? 'disabled' : ''}` : '';
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.row{width:100%;text-align:left}.wrap{min-height:56px;display:grid;grid-template-columns:36px minmax(0,1fr) minmax(72px,auto);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.control{justify-self:end;min-width:72px;display:flex;justify-content:flex-end}.metric{font-size:13px;font-weight:600}.slider{width:96px;height:5px;border-radius:var(--dashboard-radius-control,8px);background:var(--divider-color);overflow:hidden}.slider span{display:block;height:100%;background:var(--primary-color);border-radius:var(--dashboard-radius-control,8px)}.switch{width:38px;height:22px;border-radius:var(--dashboard-radius-control,8px);background:var(--divider-color);padding:3px;box-sizing:border-box}.switch span{display:block;width:16px;height:16px;border-radius:50%;background:var(--secondary-text-color);transition:margin .12s,background .12s}.switch.on{background:color-mix(in srgb,var(--primary-color) 35%,var(--divider-color))}.switch.on span{margin-left:16px;background:var(--primary-color)}.action{min-height:30px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--primary-color);font-size:11.5px;font-weight:600;display:grid;place-items:center}</style><style>.slider:has(.live-slider){position:relative;overflow:visible}.live-slider{position:absolute;inset:-19px 0;width:100%;height:44px;margin:0;opacity:0;cursor:pointer}.row-static{width:100%;text-align:left}.row-static .identity{min-width:0}</style><ha-card><${tag} class="${rowInteractive ? 'i row' : 'row row-static'}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span class="identity"><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this._description(state))}</div></span><span class="control">${ctl}</span></div></${tag}></ha-card>`;
    if (live && m === 'slider') {
      const identity = this.shadowRoot.querySelector('.identity');
      identity.setAttribute('role', 'button');
      identity.setAttribute('tabindex', '0');
      identity.setAttribute('aria-label', `Open details for ${this.c.title}`);
      this._interactions.push(interaction(identity, { primary: () => openMoreInfo(this, this.c.entity), feedback: true }));
      const input = this.shadowRoot.querySelector('.live-slider');
      input.disabled = !available;
      input.oninput = () => {
        this.val = Number(input.value);
        this._updateSliderVisual();
        this._sliderCoalescer().request(this.val);
      };
      return;
    }
    const row = this.shadowRoot.querySelector(rowInteractive ? 'button.row' : '.row');
    if (!rowInteractive || !row) return;
    if (!live) {
      this._interactions.push(interaction(row, {
        primary: () => {
          if (m === 'switch') this.on = !this.on;
          else if (m === 'slider') { this.val = (this.val + 20) % 120; if (this.val > 100) this.val = 0; }
          this.r();
        },
        feedback: true,
      }));
      return;
    }
    if (m === 'switch') {
      row.setAttribute('aria-pressed', String(reportedOn));
      row.setAttribute('aria-label', `${reportedOn ? 'Turn off' : 'Turn on'} ${this.c.title}`);
      const switchEl = row.querySelector('.switch');
      this._interactions.push(interaction(row, {
        primary: () => this._toggle(reportedOn),
        hold: () => openMoreInfo(this, this.c.entity),
        optimistic: {
          capture: () => reportedOn,
          apply: () => { const next = !reportedOn; this.on = next; row.setAttribute('aria-pressed', String(next)); switchEl.classList.toggle('on', next); },
          rollback: () => { this.on = reportedOn; row.setAttribute('aria-pressed', String(reportedOn)); switchEl.classList.toggle('on', reportedOn); },
        },
        feedback: true,
      }));
      return;
    }
    row.setAttribute('aria-label', m === 'action' ? `${this.c.title} action` : `Open details for ${this.c.title}`);
    this._interactions.push(interaction(row, { primary: () => m === 'action' ? this._serviceAction() : openMoreInfo(this, this.c.entity), feedback: true }));
  }
}
registerCard({ type: "component-control-row-v2", element: ComponentControlRowV2, name: "Control Row", description: "Reusable control-row component." });
