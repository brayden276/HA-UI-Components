/** Adds one ONVIF camera controller per device to smart collections. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const HD = globalThis.__homeDashboardV2;
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!HD || !prototype || prototype.__cameraDeviceDedupV1) return;
  prototype.__cameraDeviceDedupV1 = true;
  const oldUiEntry = HD.uiEntry;
  const oldPotential = HD.isPotential;
  const oldControl = HD.controlConfig;
  const oldIcon = HD.icon;
  const oldCandidates = prototype.candidates;
  const domain = HD.domain;
  const name = (entity) => String(entity?.name || entity?.original_name || entity?.entity_id || "");
  const isOnvif = (entity) => entity?.platform === "onvif";
  const isOwner = (entity) => isOnvif(entity) && domain(entity.entity_id) === "camera" && !/sub.?stream/i.test(`${entity.entity_id} ${name(entity)}`);
  const cameraDeviceActive = (entity, data, hass) => {
    if (!entity?.device_id) return false;
    return (data?.byDevice?.get(entity.device_id) || []).some((sibling) => {
      if (domain(sibling.entity_id) !== "binary_sensor") return false;
      const state = hass?.states?.[sibling.entity_id];
      const deviceClass = state?.attributes?.device_class || "";
      const candidateName = `${sibling.entity_id} ${name(sibling)}`;
      return state?.state === "on" && (/^(motion|occupancy|presence|sound)$/.test(deviceClass) || /motion|human|person|detect/i.test(candidateName));
    });
  };
  HD.uiEntry = (entity) => oldUiEntry?.(entity) && (!isOnvif(entity) || isOwner(entity));
  HD.isPotential = (entity, state) => isOwner(entity) || oldPotential?.(entity, state) || false;
  HD.icon = (entity, state) => isOwner(entity) ? "mdi:cctv" : oldIcon?.(entity, state) || "mdi:gesture-tap-button";
  HD.controlConfig = (entity, state, data, hass, split) => isOwner(entity) ? { type: "custom:component-camera-controller-v1", entity: entity.entity_id, device_id: entity.device_id } : oldControl?.(entity, state, data, hass, split) || null;
  prototype.candidates = function candidates() {
    const rows = oldCandidates.call(this);
    if (!Array.isArray(rows) || !this.d || !this.h) return rows;
    if (this.c?.mode === "active") {
      const ids = new Set(rows.map((entity) => entity.entity_id));
      for (const entity of this.d.entities) {
        if (!isOwner(entity) || !this.h.states[entity.entity_id] || ids.has(entity.entity_id)) continue;
        rows.push(entity);
        ids.add(entity.entity_id);
      }
    }
    return rows;
  };
  prototype.shown = function shown(rows) {
    if (this.c?.mode !== "active") return rows;
    return rows.filter((entity) => isOwner(entity) ? cameraDeviceActive(entity, this.d, this.h) : HD.isActive(entity, this.h.states[entity.entity_id]));
  };
  HD.REG?.refresh?.();
});
