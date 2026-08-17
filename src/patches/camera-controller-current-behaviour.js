/** Preserves the current camera controller availability behaviour. */
customElements.whenDefined("component-camera-controller-v1").then(() => {
  const Card = customElements.get("component-camera-controller-v1");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__stateAwareV2) return;
  prototype.__stateAwareV2 = true;
  const oldRender = prototype.render;
  prototype.render = function render() {
    oldRender.call(this);
    if (!this._hass || !this.bundleData) return;
    const status = this.status();
    const usable = (entityId) => {
      const state = this._hass.states[entityId];
      return Boolean(state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase()));
    };
    const internalUsable = [...this.bundleData.switches, ...this.bundleData.detections, ...this.bundleData.buttons].some((entity) => usable(entity.entity_id));
    if (this.view) this.view.hidden = !status.online;
    if (this.controls) this.controls.hidden = !status.online || !internalUsable;
    if (!status.online && this.dialog?.open) this.dialog.close();
  };
  const oldOpenControls = prototype.openControls;
  prototype.openControls = function openControls() { if (!this.status()?.online) return; return oldOpenControls.call(this); };
});
