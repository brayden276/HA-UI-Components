/** Prevent the smart collection from showing a garage trigger beside its controller. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__garageDoorDeviceDedupV1) return;
  prototype.__garageDoorDeviceDedupV1 = true;

  const previousCandidates = prototype.candidates;
  prototype.candidates = function candidates() {
    const rows = previousCandidates.call(this);
    if (!Array.isArray(rows) || !this.d?.byDevice || !this.h) return rows;
    const garageDevices = new Set(rows.filter((entity) => {
      if (!entity?.device_id || String(entity.entity_id || "").split(".")[0] !== "binary_sensor") return false;
      return this.h.states[entity.entity_id]?.attributes?.device_class === "garage_door";
    }).map((entity) => entity.device_id));
    if (!garageDevices.size) return rows;
    return rows.filter((entity) => {
      if (!garageDevices.has(entity?.device_id)) return true;
      if (String(entity.entity_id || "").split(".")[0] !== "button") return true;
      const name = `${entity.entity_id || ""} ${entity.name || ""} ${entity.original_name || ""}`.toLowerCase();
      return !/(garage.?door|door).*(trigger|operate)|(trigger|operate).*(garage.?door|door)/.test(name);
    });
  };
  globalThis.__homeDashboardV2?.REG?.refresh?.();
});
