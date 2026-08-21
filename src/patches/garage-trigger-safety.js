/** Select only an explicit garage-door operator button; never guess. */
(() => {
  const HD2 = globalThis.__homeDashboardV2;
  if (!HD2 || HD2.__garageTriggerSafetyV1) return;
  HD2.__garageTriggerSafetyV1 = true;

  const domain = (entityId) => String(entityId || "").split(".")[0];
  const identity = (entity) =>
    `${entity?.entity_id || ""} ${entity?.name || ""} ${entity?.original_name || ""}`
      .toLowerCase()
      .replace(/[_./-]+/g, " ");

  HD2.garageControl = (entity, data, hass) => {
    if (!entity?.device_id) return null;

    const buttons = (data?.byDevice?.get(entity.device_id) || []).filter(
      (candidate) =>
        domain(candidate?.entity_id) === "button" &&
        HD2.uiEntry(candidate) &&
        hass?.states?.[candidate.entity_id] &&
        String(hass.states[candidate.entity_id].state).toLowerCase() !== "unavailable",
    );

    const explicit = buttons.filter((candidate) =>
      /\bgarage\s+door\b.*\b(trigger|operate|operator)\b|\b(trigger|operate|operator)\b.*\bgarage\s+door\b/.test(
        identity(candidate),
      ),
    );

    return explicit.length === 1 ? explicit[0].entity_id : null;
  };

  HD2.REG?.refresh?.();
})();
