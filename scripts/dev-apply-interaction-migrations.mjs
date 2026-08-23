import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const apply = async (file, transforms) => {
  const path = resolve(root, file);
  let source = await readFile(path, "utf8");
  let changed = false;
  for (const [label, from, to] of transforms) {
    if (source.includes(to)) continue;
    if (!source.includes(from)) throw new Error(`${file}: migration target not found: ${label}`);
    source = source.replace(from, to);
    changed = true;
  }
  if (changed) {
    await writeFile(path, source, "utf8");
    console.log(`Migrated ${file}`);
  } else {
    console.log(`Already migrated ${file}`);
  }
};

await apply("src/components/favourites.js", [
  [
    "shared state confirmation import",
    'const { escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
    'const { escapeHtml, interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "shared state confirmation",
    '_waitFor(t,e,i){return new Promise((s,r)=>{const a=Date.now(),o=setInterval(()=>{const n=this._hass?.states?.[t]?.state;e(n)?(clearInterval(o),s()):Date.now()-a>=i&&(clearInterval(o),r(new Error("State confirmation timed out")))},160)})}',
    '_waitFor(t,e,i){return waitForEntityState(()=>this._hass,t,e,{timeout:i})}',
  ],
]);

await apply("src/components/camera-controller.js", [
  [
    "shared interaction helpers",
    'const { openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
    'const { interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "camera interaction state",
    '    this.controlsSignature = "";\n    this.shadowRoot.innerHTML',
    '    this.controlsSignature = "";\n    this.interactionHandles = [];\n    this.controlInteractions = [];\n    this.optimisticSwitches = new Map();\n    this.shadowRoot.innerHTML',
  ],
  [
    "top-level camera bindings",
    '    this.view.onclick = () => this.openCamera();\n    this.identity = this.shadowRoot.querySelector(".identity");\n    this.identity.onclick = () => this.openCamera();\n    this.controls.onclick = () => this.openControls();\n    this.shadowRoot.querySelector(".close").onclick = () => this.dialog.close();',
    '    this.identity = this.shadowRoot.querySelector(".identity");\n    this.interactionHandles.push(\n      interaction(this.view, { primary: () => this.openCamera(), feedback: true }),\n      interaction(this.identity, { primary: () => this.openCamera(), feedback: true }),\n      interaction(this.controls, { primary: () => this.openControls(), feedback: true }),\n      interaction(this.shadowRoot.querySelector(".close"), { primary: () => this.dialog.close(), feedback: true }),\n    );',
  ],
  [
    "camera disconnect cleanup",
    '  disconnectedCallback() { this.unsubscribe?.(); this.unsubscribe = null; clearTimeout(this.confirmTimer); }',
    '  disconnectedCallback() { for (const handle of this.interactionHandles) handle.destroy(); this.interactionHandles = []; for (const handle of this.controlInteractions) handle.destroy(); this.controlInteractions = []; this.optimisticSwitches.clear(); this.unsubscribe?.(); this.unsubscribe = null; clearTimeout(this.confirmTimer); }',
  ],
  [
    "dynamic interaction cleanup",
    '  renderControls() {\n    if (!this.bundleData) return;',
    '  renderControls() {\n    for (const handle of this.controlInteractions) handle.destroy();\n    this.controlInteractions = [];\n    if (!this.bundleData) return;',
  ],
  [
    "optimistic switch signature",
    '    const signature = JSON.stringify([\n      this.confirmId,',
    '    const signature = JSON.stringify([\n      this.confirmId,\n      [...this.optimisticSwitches],',
  ],
  [
    "optimistic switch model",
    '      const state = this._hass.states[entity.entity_id], on = state?.state === "on", usable = Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())), row = document.createElement("div");',
    '      const state = this._hass.states[entity.entity_id], reportedOn = state?.state === "on", on = this.optimisticSwitches.has(entity.entity_id) ? this.optimisticSwitches.get(entity.entity_id) : reportedOn, usable = Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())), row = document.createElement("div");',
  ],
  [
    "switch accessibility and interaction",
    '      button.textContent = on ? "On" : "Off"; button.classList.toggle("on", on); button.disabled = !usable;\n      button.onclick = () => this._hass.callService("switch", "toggle", { entity_id: entity.entity_id });',
    '      button.textContent = on ? "On" : "Off"; button.classList.toggle("on", on); button.disabled = !usable; button.setAttribute("aria-pressed", String(on)); button.setAttribute("aria-label", `${on ? "Turn off" : "Turn on"} ${this.clean(entity)}`);\n      this.controlInteractions.push(interaction(button, {\n        primary: () => this.toggleSwitch(entity.entity_id, reportedOn),\n        hold: () => openMoreInfo(this, entity.entity_id),\n        optimistic: {\n          capture: () => reportedOn,\n          apply: () => { const next = !reportedOn; this.optimisticSwitches.set(entity.entity_id, next); button.textContent = next ? "On" : "Off"; button.classList.toggle("on", next); button.setAttribute("aria-pressed", String(next)); row.querySelector(".ctl-state").textContent = next ? "On" : "Off"; },\n          rollback: () => { this.optimisticSwitches.delete(entity.entity_id); this.controlsSignature = ""; if (this.dialog.open) this.renderControls(); },\n        },\n        feedback: true,\n      }));',
  ],
  [
    "maintenance shared interaction",
    '      button.onclick = () => this.press(entity.entity_id);',
    '      this.controlInteractions.push(interaction(button, { primary: () => this.press(entity.entity_id), optimistic: false, repeat: false, feedback: true }));',
  ],
  [
    "camera switch state confirmation",
    '  press(entityId) { if (this.confirmId !== entityId) {',
    '  async toggleSwitch(entityId, wasOn) {\n    await this._hass.callService("switch", "toggle", { entity_id: entityId });\n    await waitForEntityState(() => this._hass, entityId, (value) => value === (wasOn ? "off" : "on"), { timeout: 9000 });\n    this.optimisticSwitches.delete(entityId);\n    this.controlsSignature = "";\n    if (this.dialog.open) this.renderControls();\n  }\n\n  press(entityId) { if (this.confirmId !== entityId) {',
  ],
  [
    "return maintenance request",
    'clearTimeout(this.confirmTimer); this.confirmId = null; this._hass.callService("button", "press", { entity_id: entityId }); this.renderControls(); }',
    'clearTimeout(this.confirmTimer); this.confirmId = null; const request = this._hass.callService("button", "press", { entity_id: entityId }); this.renderControls(); return request; }',
  ],
]);

await apply("src/components/component-apple-tv-controller-v1.js", [
  [
    "shared Apple TV interaction helpers",
    'const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
    'const { createRequestCoalescer, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;',
  ],
  [
    "Apple TV interaction state",
    '    this.scrollLocks = [];\n    this.focusGuard =',
    '    this.scrollLocks = [];\n    this.interactionHandles = [];\n    this.dynamicInteractions = [];\n    this.volumeCoalescer = null;\n    this.volumeGestureActive = false;\n    this.optimisticVolume = null;\n    this.focusGuard =',
  ],
  [
    "Apple TV disconnect cleanup",
    '  disconnectedCallback() {\n    this.unsubscribe?.();',
    '  disconnectedCallback() {\n    for (const handle of this.interactionHandles) handle.destroy();\n    this.interactionHandles = [];\n    for (const handle of this.dynamicInteractions) handle.destroy();\n    this.dynamicInteractions = [];\n    this.volumeCoalescer?.destroy();\n    this.volumeCoalescer = null;\n    this.unsubscribe?.();',
  ],
  [
    "Apple TV identity semantics",
    '          <div class="identity">\n            <span class="ico">',
    '          <div class="identity" role="button" tabindex="0">\n            <span class="ico">',
  ],
  [
    "Apple TV identity reference",
    '    this.el = {\n      icon: q(".identity ha-icon"),',
    '    this.el = {\n      identity: q(".identity"),\n      icon: q(".identity ha-icon"),',
  ],
  [
    "Apple TV top-level interactions",
    '    this.el.remoteLaunch.onclick = () =>\n      this.openPanel("remote", this.el.remoteLaunch);\n    this.el.appsLaunch.onclick = () =>\n      this.openPanel("apps", this.el.appsLaunch);\n    this.el.close.onclick = () => this.closePanel(true);',
    '    this.interactionHandles.push(\n      interaction(this.el.identity, { primary: () => openMoreInfo(this, this.config.entity), feedback: true }),\n      interaction(this.el.remoteLaunch, { primary: () => this.openPanel("remote", this.el.remoteLaunch), feedback: true }),\n      interaction(this.el.appsLaunch, { primary: () => this.openPanel("apps", this.el.appsLaunch), feedback: true }),\n      interaction(this.el.close, { primary: () => this.closePanel(true), feedback: true }),\n    );',
  ],
  [
    "Apple TV button options",
    '    pending = false,\n  ) {',
    '    pending = false,\n    interactionOptions = {},\n  ) {',
  ],
  [
    "Apple TV shared button interaction",
    '    button.onclick = click;\n    return button;',
    '    this.dynamicInteractions.push(interaction(button, { primary: click, feedback: true, ...interactionOptions }));\n    return button;',
  ],
  [
    "dynamic interaction cleanup before panel render",
    '  renderPanel(model) {\n    const scrollTop = this.el.body.scrollTop;',
    '  renderPanel(model) {\n    for (const handle of this.dynamicInteractions) handle.destroy();\n    this.dynamicInteractions = [];\n    const scrollTop = this.el.body.scrollTop;',
  ],
  [
    "preserve held volume control",
    '    if (this.panelMode) this.renderPanel(model);',
    '    if (this.panelMode) {\n      if (this.volumeGestureActive) this.updateVolumeReadout(model);\n      else this.renderPanel(model);\n    }',
  ],
  [
    "Apple TV identity accessible name",
    '    this.el.name.textContent = this.name(model);\n    this.el.status.textContent = model.status;',
    '    this.el.name.textContent = this.name(model);\n    this.el.status.textContent = model.status;\n    this.el.identity.setAttribute("aria-label", `Open details for ${this.name(model)}`);',
  ],
  [
    "optimistic volume readout",
    '      model.level === null ? "—" : `${Math.round(model.level * 100)}%`;',
    '      (this.optimisticVolume ?? model.level) === null ? "—" : `${Math.round((this.optimisticVolume ?? model.level) * 100)}%`;',
  ],
  [
    "volume down repeat",
    '        () => this.adjustVolume("down"),\n        !model.canVolumeDown || this.busy("volume-down"),\n        this.busy("volume-down"),\n      ),',
    '        () => this.queueVolume("down"),\n        !model.canVolumeDown,\n        false,\n        { repeat: { delay: 350, interval: 120, coalesce: true }, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) },\n      ),',
  ],
  [
    "volume up repeat",
    '        () => this.adjustVolume("up"),\n        !model.canVolumeUp || this.busy("volume-up"),\n        this.busy("volume-up"),\n      ),',
    '        () => this.queueVolume("up"),\n        !model.canVolumeUp,\n        false,\n        { repeat: { delay: 350, interval: 120, coalesce: true }, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) },\n      ),',
  ],
  [
    "Apple TV app interaction",
    '      button.onclick = () => this.selectSource(source);\n      grid.append(button);',
    '      this.dynamicInteractions.push(interaction(button, { primary: () => this.selectSource(source), optimistic: "selection", feedback: true }));\n      grid.append(button);',
  ],
  [
    "coalesced Apple TV volume",
    '  adjustVolume(direction) {\n    const model = this.model();',
    '  ensureVolumeCoalescer() {\n    if (this.volumeCoalescer) return this.volumeCoalescer;\n    this.volumeCoalescer = createRequestCoalescer(async (direction) => {\n      const model = this.model();\n      if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;\n      if (!this.config.demo) await this._hass.callService("media_player", `volume_${direction}`, { entity_id: model.entities.media });\n    }, { onError: () => this.setMessage("Apple TV did not respond", "error", 4000) });\n    return this.volumeCoalescer;\n  }\n\n  updateVolumeReadout(model = this.model()) {\n    const value = this.shadowRoot.querySelector(".volume-value");\n    const status = this.shadowRoot.querySelector(".volume-status");\n    const level = this.optimisticVolume ?? model.level;\n    if (value) value.textContent = level === null ? "—" : `${Math.round(level * 100)}%`;\n    if (status) status.textContent = model.muted ? "Muted" : this.volumeGestureActive ? "Adjusting" : "Volume";\n  }\n\n  setVolumeGesture(pressed, model) {\n    this.volumeGestureActive = pressed;\n    if (pressed && this.optimisticVolume === null) this.optimisticVolume = model.level;\n    if (!pressed) { this.optimisticVolume = null; this.render(); }\n  }\n\n  queueVolume(direction) {\n    const model = this.model();\n    if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;\n    const base = this.optimisticVolume ?? model.level;\n    if (base !== null) {\n      const step = Math.max(0.01, Math.min(0.25, Number(this.config?.volume_step) || 0.05));\n      this.optimisticVolume = Math.max(0, Math.min(1, base + (direction === "up" ? step : -step)));\n      this.updateVolumeReadout(model);\n    }\n    this.ensureVolumeCoalescer().request(direction);\n  }\n\n  adjustVolume(direction) {\n    const model = this.model();',
  ],
  [
    "reset volume gesture on close",
    '  closePanel(restore) {\n    this.panelMode = null;',
    '  closePanel(restore) {\n    this.volumeGestureActive = false;\n    this.optimisticVolume = null;\n    this.panelMode = null;',
  ],
]);

console.log("Remaining one-shot interaction migrations complete.");
