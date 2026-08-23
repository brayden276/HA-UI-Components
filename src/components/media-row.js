/** ComponentMediaRowV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const MEDIA_ROW_FEATURES = { pause: 1, previous: 16, next: 32, play: 512 };
class ComponentMediaRowV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._hass = null;
    this.playing = true;
    this._optimisticPlaying = null;
    this._busy = false;
    this._interactions = [];
  }
  setConfig(c) {
    this.c = { icon: 'mdi:speaker', title: 'Media player', state: 'Playing · Media title', entity: null, ...c };
    this.playing = true;
    this._optimisticPlaying = null;
    this._busy = false;
    this.r();
  }
  set hass(hass) {
    this._hass = hass;
    this.r();
  }
  disconnectedCallback() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    this._busy = false;
  }
  getCardSize() { return 1; }
  _liveState() { return this.c?.entity ? this._hass?.states?.[this.c.entity] ?? null : null; }
  _available(state) { return Boolean(state && !['unknown', 'unavailable'].includes(String(state.state).toLowerCase())); }
  _supported(state, feature) {
    const value = Number(state?.attributes?.supported_features);
    return !Number.isFinite(value) || Boolean(value & feature);
  }
  _description(state) {
    if (!this.c.entity) return this.c.state;
    if (!this._available(state)) return 'Unavailable';
    const status = String(state.state || '').replaceAll('_', ' ').replace(/^./, (x) => x.toUpperCase());
    return [status, state.attributes?.media_title].filter(Boolean).join(' · ');
  }
  async _playPause(wasPlaying) {
    if (this._busy) return;
    this._busy = true;
    try {
      const service = wasPlaying ? 'media_pause' : 'media_play';
      await this._hass.callService('media_player', service, { entity_id: this.c.entity });
      await waitForEntityState(
        () => this._hass,
        this.c.entity,
        (value) => wasPlaying
          ? value !== 'playing' && !['unknown', 'unavailable'].includes(String(value).toLowerCase())
          : value === 'playing',
        { timeout: 9000 },
      );
      this._optimisticPlaying = null;
      this._busy = false;
      this.r();
    } catch (error) {
      this._busy = false;
      throw error;
    }
  }
  _momentary(service) {
    return this._hass.callService('media_player', service, { entity_id: this.c.entity });
  }
  r() {
    if (!this.c) return;
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const state = this._liveState();
    const live = Boolean(this.c.entity);
    const available = live && this._available(state);
    const reportedPlaying = available ? state.state === 'playing' : this.playing;
    const playing = this._optimisticPlaying ?? reportedPlaying;
    const previousEnabled = available && this._supported(state, MEDIA_ROW_FEATURES.previous);
    const nextEnabled = available && this._supported(state, MEDIA_ROW_FEATURES.next);
    const mainEnabled = !this._busy && (!live || (available && this._supported(state, playing ? MEDIA_ROW_FEATURES.pause : MEDIA_ROW_FEATURES.play)));
    const identityAttrs = live ? ' class="identity" role="button" tabindex="0"' : '';
    const previous = live
      ? `<button class="i btn previous" type="button" aria-label="Previous" ${previousEnabled ? '' : 'disabled'}><ha-icon icon="mdi:skip-previous"></ha-icon></button>`
      : '<span class="btn" aria-hidden="true"><ha-icon icon="mdi:skip-previous"></ha-icon></span>';
    const main = `<button class="i btn main" type="button" aria-label="${playing ? 'Pause' : 'Play'}" ${mainEnabled ? '' : 'disabled'}><ha-icon icon="mdi:${playing ? 'pause' : 'play'}"></ha-icon></button>`;
    const next = live
      ? `<button class="i btn next" type="button" aria-label="Next" ${nextEnabled ? '' : 'disabled'}><ha-icon icon="mdi:skip-next"></ha-icon></button>`
      : '<span class="btn" aria-hidden="true"><ha-icon icon="mdi:skip-next"></ha-icon></span>';
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.wrap{min-height:56px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,0px);background:transparent;color:var(--primary-color)}.buttons{display:flex;gap:4px}.btn{width:30px;height:30px;border:1px solid var(--dashboard-card-border-color,var(--divider-color))!important;border-radius:var(--dashboard-radius-control,5px)!important;background:transparent!important;display:grid;place-items:center;color:var(--secondary-text-color);padding:0!important}.btn.main{color:var(--primary-color)}.btn ha-icon{--mdc-icon-size:17px}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span${identityAttrs}><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this._description(state))}</div></span><span class="buttons">${previous}${main}${next}</span></div></ha-card>`;
    if (live) {
      const identity = this.shadowRoot.querySelector('.identity');
      identity?.setAttribute('aria-label', `Open details for ${this.c.title}`);
      if (identity) this._interactions.push(interaction(identity, { primary: () => openMoreInfo(this, this.c.entity), feedback: true }));
      const previousButton = this.shadowRoot.querySelector('.previous');
      const nextButton = this.shadowRoot.querySelector('.next');
      if (previousButton) this._interactions.push(interaction(previousButton, { primary: () => this._momentary('media_previous_track'), feedback: true }));
      if (nextButton) this._interactions.push(interaction(nextButton, { primary: () => this._momentary('media_next_track'), feedback: true }));
    }
    const mainButton = this.shadowRoot.querySelector('.main');
    if (!mainButton) return;
    if (!live) {
      this._interactions.push(interaction(mainButton, { primary: () => { this.playing = !this.playing; this.r(); }, optimistic: false, feedback: true }));
      return;
    }
    this._interactions.push(interaction(mainButton, {
      primary: () => this._playPause(reportedPlaying),
      optimistic: {
        capture: () => reportedPlaying,
        apply: () => {
          this._optimisticPlaying = !reportedPlaying;
          mainButton.setAttribute('aria-label', reportedPlaying ? 'Play' : 'Pause');
          mainButton.querySelector('ha-icon')?.setAttribute('icon', `mdi:${reportedPlaying ? 'play' : 'pause'}`);
        },
        rollback: () => {
          this._optimisticPlaying = null;
          this.r();
        },
      },
      feedback: true,
    }));
  }
}
registerCard({ type: "component-media-row-v2", element: ComponentMediaRowV2, name: "Media Row", description: "Reusable media-row component." });
