/** ComponentSecurityCameraWallV3 — lazy snapshot-first Security camera wall. */
const { interaction, loadSecurityModel, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityCameraWallV3 extends HTMLElement {
  static stubConfig = { profile: "household-security", columns: 2 };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.tiles = new Map();
    this.sequence = 0;
    this.timer = null;
    this.visible = true;
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.visibility = () => { this.visible = document.visibilityState !== "hidden"; this.syncPlayback(); if (this.visible) this.refreshSnapshots(); };
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .wrap{padding:12px 14px 14px}.head{min-height:32px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}h2{margin:0;font-size:15px;line-height:1.2;font-weight:600}.meta{font-size:13px;color:var(--secondary-text-color)}
      .grid{display:grid;grid-template-columns:repeat(var(--security-columns,2),minmax(0,1fr));gap:8px}.empty{min-height:56px;display:grid;place-items:center;color:var(--secondary-text-color);font-size:13px}.empty[hidden]{display:none}
      .tile{min-width:0;overflow:hidden;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--secondary-background-color)}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit}.media{position:relative;display:block;width:100%;aspect-ratio:16/9;overflow:hidden;padding:0;background:var(--dashboard-media-surface,#111);cursor:pointer}.snapshot,.live{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.snapshot{opacity:0;transition:opacity var(--dashboard-transition-standard,160ms) var(--dashboard-easing-standard,ease)}.snapshot.ready{opacity:1}.live{opacity:0;transition:opacity var(--dashboard-transition-standard,180ms) var(--dashboard-easing-standard,ease);pointer-events:none}.tile.live-ready .live{opacity:1}.tile.live-ready .snapshot{opacity:0}.live-label{position:absolute;right:8px;bottom:8px;min-height:32px;padding:0 9px;border-radius:999px;display:flex;align-items:center;gap:5px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 78%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:12px;font-weight:650}.live-label[hidden],.offline .live-label{display:none}.live-label ha-icon{--mdc-icon-size:16px}.offline .media:after{content:'Camera unavailable';position:absolute;inset:0;display:grid;place-items:center;padding:12px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 74%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:13px;font-weight:600;text-align:center}
      .footer{min-height:52px;padding:4px 4px 4px 10px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:4px;background:var(--card-background-color)}.identity{min-width:0;min-height:44px;padding:4px 0;text-align:left;cursor:pointer}.name,.state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name{font-size:13px;font-weight:650}.state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.more{min-width:44px;height:44px;padding:0 10px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--secondary-text-color);cursor:pointer}.more:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.more ha-icon{--mdc-icon-size:20px}.more span{font-size:13px;font-weight:600}
      @media(max-width:700px){.wrap{padding:12px}.grid{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){.snapshot,.live{transition:none}}
    </style><ha-card><div class="wrap"><div class="head"><h2>Camera wall</h2><span class="meta">Loading…</span></div><div class="grid"></div><div class="empty" hidden></div></div></ha-card>`;
    this.grid = this.shadowRoot.querySelector(".grid");
    this.meta = this.shadowRoot.querySelector(".meta");
    this.empty = this.shadowRoot.querySelector(".empty");
  }
  setConfig(config) {
    this.config = { profile: "household-security", columns: 2, title: "Camera wall", refresh_seconds: 15, ...(config || {}) };
    this.style.setProperty("--security-columns", Math.max(1, Math.min(3, Number(this.config.columns) || 2)));
    this.shadowRoot.querySelector("h2").textContent = this.config.title;
    if (this.timer) this.schedule();
    this.refresh();
  }
  set hass(hass) {
    this._hass = hass;
    for (const tile of this.tiles.values()) this.updateTile(tile, tile.camera);
    this.refresh();
  }
  connectedCallback() {
    document.addEventListener?.("visibilitychange", this.visibility);
    window.addEventListener("ha-component-profile-change", this.profileListener);
    this.refresh();
    this.schedule();
  }
  disconnectedCallback() {
    document.removeEventListener?.("visibilitychange", this.visibility);
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    clearInterval(this.timer);
    this.timer = null;
    for (const tile of this.tiles.values()) this.destroyTile(tile);
    this.tiles.clear();
    this.grid.replaceChildren();
  }
  getCardSize() { return 6; }
  schedule() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.refreshSnapshots(), Math.max(10, Number(this.config?.refresh_seconds) || 15) * 1000);
  }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence === this.sequence) { this.model = model; this.render(); }
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error, cameras: [] }; this.render(); }
    }
  }
  render() {
    const cameras = this.model?.cameras || [], keep = new Set(cameras.map((camera) => camera.id));
    this.meta.textContent = this.model?.error ? "Unavailable" : `${cameras.filter((camera) => camera.online).length}/${cameras.length} online`;
    this.empty.hidden = cameras.length > 0;
    this.empty.textContent = this.model?.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : this.model?.error ? (this.model.error.message || "Camera discovery is unavailable") : "No cameras available";
    for (const camera of cameras) {
      let tile = this.tiles.get(camera.id);
      if (!tile) { tile = this.createTile(camera); this.tiles.set(camera.id, tile); }
      tile.camera = camera;
      this.updateTile(tile, camera);
      this.grid.append(tile.root);
    }
    for (const [id, tile] of [...this.tiles]) {
      if (keep.has(id)) continue;
      this.destroyTile(tile);
      tile.root.remove();
      this.tiles.delete(id);
    }
    this.refreshSnapshots();
  }
  createTile(camera) {
    const root = document.createElement("article");
    root.className = "tile";
    root.innerHTML = `<button class="media" type="button"><img class="snapshot" alt=""><span class="live"></span><span class="live-label"><ha-icon icon="mdi:fullscreen"></ha-icon><span>Full view</span></span></button><div class="footer"><button class="identity" type="button"><span class="name"></span><span class="state"></span></button><button class="more" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Settings</span></button></div>`;
    const snapshot = root.querySelector(".snapshot"), liveHost = root.querySelector(".live");
    const tile = { root, camera, snapshot, liveHost, visible: true, stream: null, liveTimer: null, liveRequested: false, lastUrl: null, handles: [] };
    snapshot.addEventListener("load", () => { snapshot.classList.add("ready"); tile.lastUrl = snapshot.src; this.ensureLive(tile); });
    snapshot.addEventListener("error", () => { if (tile.lastUrl && snapshot.src !== tile.lastUrl) snapshot.src = tile.lastUrl; });
    tile.handles.push(
      interaction(root.querySelector(".media"), { primary: () => this.requestViewer(tile.camera, root.querySelector(".media")), feedback: true }),
      interaction(root.querySelector(".identity"), { primary: () => this.requestViewer(tile.camera, root.querySelector(".identity")), feedback: true }),
      interaction(root.querySelector(".more"), { primary: () => this.requestControls(tile.camera, root.querySelector(".more")), feedback: true }),
    );
    if (globalThis.IntersectionObserver) {
      tile.observer = new IntersectionObserver((entries) => {
        tile.visible = entries.some((entry) => entry.isIntersecting);
        this.syncTilePlayback(tile);
        if (tile.visible) this.updateSnapshot(tile);
      }, { rootMargin: "160px" });
      tile.observer.observe(root);
    }
    return tile;
  }
  updateTile(tile, camera) {
    const state = this._hass?.states?.[camera.entityId];
    tile.root.classList.toggle("offline", !camera.online);
    tile.root.classList.toggle("activity", camera.active);
    tile.root.querySelector(".name").textContent = camera.name;
    tile.root.querySelector(".state").textContent = camera.active ? "Activity detected" : camera.online ? "Online" : "Unavailable";
    tile.root.querySelector(".identity").disabled = !camera.online;
    const media = tile.root.querySelector(".media"), snapshotOnly = this.model?.profile?.viewer?.preferred_stream === "snapshot";
    if ((snapshotOnly || !camera.online) && tile.stream) { tile.liveRequested = false; this.stopLive(tile); }
    media.disabled = !camera.online;
    tile.root.querySelector(".live-label").hidden = false;
    media.setAttribute("aria-label", `Open full live view for ${camera.name}`);
    tile.root.querySelector(".identity").setAttribute("aria-label", `Open full live view for ${camera.name}`);
    tile.root.querySelector(".more").setAttribute("aria-label", `Open settings for ${camera.name}`);
    tile.snapshot.alt = `${camera.name} camera snapshot`;
    if (tile.stream) { tile.stream.hass = this._hass; tile.stream.stateObj = state; }
    if (!snapshotOnly) this.updateLiveLabel(tile);
  }
  updateSnapshot(tile) {
    if (!this.visible || !tile.visible || !tile.camera.online) return;
    const state = this._hass?.states?.[tile.camera.entityId], picture = state?.attributes?.entity_picture;
    if (!picture) return;
    const base = this._hass?.hassUrl ? this._hass.hassUrl(picture) : picture;
    const url = `${base}${base.includes("?") ? "&" : "?"}_=${Math.floor(Date.now() / 10000)}`;
    if (url !== tile.snapshot.src) tile.snapshot.src = url;
  }
  refreshSnapshots() { for (const tile of this.tiles.values()) this.updateSnapshot(tile); }
  ensureLive(tile) {
    const preference = this.model?.profile?.viewer?.preferred_stream || "auto";
    if (preference === "live") tile.liveRequested = true;
    if (preference === "snapshot" || !tile.liveRequested || tile.stream || !tile.camera.online || !tile.visible || !this.visible) return;
    const stream = document.createElement("ha-camera-stream");
    stream.className = "live";
    stream.muted = true;
    stream.controls = false;
    stream.hass = this._hass;
    stream.stateObj = this._hass?.states?.[tile.camera.entityId];
    const ready = () => { clearTimeout(tile.liveTimer); tile.liveTimer = null; tile.root.classList.add("live-ready"); this.updateLiveLabel(tile); };
    stream.addEventListener?.("playing", ready);
    stream.addEventListener?.("canplay", ready);
    tile.liveHost.replaceChildren(stream);
    tile.stream = stream;
    tile.root.classList.add("live-requested");
    tile.liveTimer = setTimeout(ready, 1800);
    this.updateLiveLabel(tile);
  }
  toggleLive(tile) {
    if (!tile.camera.online) return;
    if (tile.liveRequested || tile.stream) {
      tile.liveRequested = false;
      this.stopLive(tile);
    } else {
      tile.liveRequested = true;
      this.ensureLive(tile);
    }
    this.updateLiveLabel(tile);
  }
  stopLive(tile) {
    clearTimeout(tile.liveTimer);
    tile.liveTimer = null;
    tile.stream?.remove?.();
    tile.stream = null;
    tile.root.classList.remove("live-requested", "live-ready");
  }
  updateLiveLabel(tile) {
    const active = Boolean(tile.stream), ready = tile.root.classList.contains("live-ready");
    const media = tile.root.querySelector(".media"), label = tile.root.querySelector(".live-label span"), icon = tile.root.querySelector(".live-label ha-icon");
    media.setAttribute("aria-label", `Open full live view for ${tile.camera.name}`);
    label.textContent = active && !ready ? "Loading…" : "Full view";
    icon.setAttribute("icon", active && !ready ? "mdi:progress-clock" : "mdi:fullscreen");
  }
  syncPlayback() { for (const tile of this.tiles.values()) this.syncTilePlayback(tile); }
  syncTilePlayback(tile) {
    if ((!this.visible || !tile.visible) && tile.stream) this.stopLive(tile);
    if (this.visible && tile.visible) this.ensureLive(tile);
  }
  requestControls(camera, trigger) {
    this.dispatchEvent(new CustomEvent("security-camera-control-request", { bubbles: true, composed: true, detail: { camera, trigger } }));
  }
  requestViewer(camera, trigger) {
    this.dispatchEvent(new CustomEvent("security-camera-view-request", { bubbles: true, composed: true, detail: { camera, trigger } }));
  }
  destroyTile(tile) {
    tile.observer?.disconnect();
    for (const handle of tile.handles) handle.destroy();
    tile.handles = [];
    this.stopLive(tile);
  }
}

registerCard({ type: "component-security-camera-wall-v3", element: ComponentSecurityCameraWallV3, name: "Security Camera Wall V3", description: "Snapshot-first, lazy live camera wall with capability-driven controls." });
