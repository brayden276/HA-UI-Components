/** Capability-driven Security discovery shared by every Security component. */
const securityShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};
const securityHD = globalThis.__homeDashboardV2;
const securityDomain = (entityId) => String(entityId || "").split(".")[0];
const badSecurityState = new Set(["unknown", "unavailable"]);
const capabilityText = (entity) => [
  entity?.translation_key,
  entity?.unique_id,
  entity?.entity_id,
  entity?.platform,
].filter(Boolean).join(" ").toLowerCase();
const entityLabel = (hass, entity) => entity?.name || entity?.original_name ||
  hass?.states?.[entity?.entity_id]?.attributes?.friendly_name || entity?.entity_id || "Control";

const switchRole = (entity) => {
  const text = capabilityText(entity);
  if (/record/.test(text)) return "Recording";
  if (/detect|motion/.test(text)) return "Detection";
  if (/alert|notification/.test(text)) return "Alerts";
  if (/audio|sound/.test(text)) return "Audio";
  return null;
};
const ptzRole = (entity) => /(^|[_ :.-])(ptz|pan|tilt|zoom)([_ :.-]|$)/.test(capabilityText(entity));
const actionRole = (entity) => {
  const text = capabilityText(entity);
  if (/trigger|operate|open|close/.test(text)) return "operate";
  if (/restart|reboot/.test(text)) return "restart";
  return "action";
};

const securityModel = (hass, registry, profile = {}) => {
  if (registry?.error) {
    return { error: registry.error, cameras: [], entries: [], attention: [], allClear: false };
  }
  const include = new Set(profile.include_entities || []);
  const exclude = new Set(profile.exclude_entities || []);
  const areas = new Set(profile.area_ids || []);
  // Visible entities choose what becomes a dashboard card.  Capability
  // siblings are deliberately broader: camera integrations commonly classify
  // recording/detection switches as config entities even though they are safe,
  // contextual controls for an already-visible camera.
  const candidates = (registry?.entities || []).filter((entity) => {
    if (!entity?.entity_id || entity.disabled_by || entity.hidden_by || !hass?.states?.[entity.entity_id]) return false;
    if (exclude.has(entity.entity_id)) return false;
    if (include.has(entity.entity_id)) return true;
    return !areas.size || areas.has(securityHD.areaOf(entity, registry));
  });
  const entities = candidates.filter((entity) => securityHD?.uiEntry?.(entity));
  const byDevice = new Map();
  for (const entity of candidates) {
    const owner = entity.device_id || entity.entity_id;
    const siblings = byDevice.get(owner) || [];
    siblings.push(entity);
    byDevice.set(owner, siblings);
  }

  const cameras = [];
  for (const [owner, siblings] of byDevice) {
    const cameraEntities = siblings.filter((entity) =>
      securityDomain(entity.entity_id) === "camera" && securityHD?.uiEntry?.(entity),
    );
    if (!cameraEntities.length) continue;
    cameraEntities.sort((left, right) => {
      const score = (entity) => {
        const state = hass.states[entity.entity_id];
        return (include.has(entity.entity_id) ? 100 : 0) +
          (state?.attributes?.entity_picture ? 20 : 0) +
          (state?.attributes?.frontend_stream_type ? 10 : 0);
      };
      return score(right) - score(left) || String(left.unique_id || left.entity_id).localeCompare(String(right.unique_id || right.entity_id));
    });
    const entity = cameraEntities[0], state = hass.states[entity.entity_id];
    const device = (registry.devices || []).find((item) => item.id === entity.device_id) || {};
    const areaId = securityHD.areaOf(entity, registry);
    const areaName = registry.areaMap?.get(areaId)?.name || "";
    const switches = siblings
      .filter((item) => securityDomain(item.entity_id) === "switch" && switchRole(item))
      .map((item) => ({ entity: item, role: switchRole(item) }));
    const detections = siblings.filter((item) => {
      if (securityDomain(item.entity_id) !== "binary_sensor") return false;
      const deviceClass = hass.states[item.entity_id]?.attributes?.device_class || "";
      return /^(motion|occupancy|presence|sound)$/.test(deviceClass) || /detect|motion|person|human/.test(capabilityText(item));
    });
    const actions = siblings
      .filter((item) => securityDomain(item.entity_id) === "button" && actionRole(item) !== "action")
      .map((item) => ({ entity: item, role: actionRole(item) }));
    const ptz = siblings.filter((item) => ["button", "number", "select"].includes(securityDomain(item.entity_id)) && ptzRole(item));
    const mappedStream = profile.mappings?.[`camera_stream:${entity.entity_id}`] || profile.mappings?.[`camera_stream:${owner}`] || null;
    const mappedStreamState = mappedStream ? hass.states[mappedStream] : null;
    const streamEntityId = mappedStreamState && !badSecurityState.has(String(mappedStreamState.state).toLowerCase())
      ? mappedStream
      : entity.entity_id;
    const online = Boolean(state && !badSecurityState.has(String(state.state).toLowerCase()));
    const active = detections.some((item) => hass.states[item.entity_id]?.state === "on");
    cameras.push({
      id: owner,
      deviceId: entity.device_id || null,
      entityId: entity.entity_id,
      entities: cameraEntities.map((item) => item.entity_id),
      name: String(device.name_by_user || device.name || "").trim() || areaName || entityLabel(hass, entity),
      areaId,
      areaName,
      online,
      active,
      streamEntityId,
      switches,
      detections,
      actions,
      ptz,
    });
  }
  cameras.sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));

  const entries = [];
  for (const entity of entities) {
    const domain = securityDomain(entity.entity_id), state = hass.states[entity.entity_id];
    const deviceClass = state?.attributes?.device_class || "";
    const isBinaryEntry = domain === "binary_sensor" && /^(door|window|garage_door|opening)$/.test(deviceClass);
    const isEntry = isBinaryEntry || domain === "lock" || (domain === "cover" && /^(door|garage)$/.test(deviceClass));
    if (!isEntry) continue;
    const siblings = entity.device_id ? byDevice.get(entity.device_id) || [] : [];
    const mapped = profile.mappings?.[`entry_control:${entity.entity_id}`];
    const control = mapped || siblings
      .filter((item) => securityDomain(item.entity_id) === "button")
      .sort((left, right) => (actionRole(left) === "operate" ? -1 : 1) - (actionRole(right) === "operate" ? -1 : 1))[0]?.entity_id || null;
    const open = domain === "lock" ? state.state === "unlocked" : /^(on|open|opening)$/.test(state.state);
    entries.push({
      entityId: entity.entity_id,
      deviceId: entity.device_id || null,
      controlEntityId: control,
      domain,
      deviceClass,
      name: entityLabel(hass, entity),
      state: state.state,
      open,
      available: !badSecurityState.has(String(state.state).toLowerCase()),
      areaId: securityHD.areaOf(entity, registry),
    });
  }
  entries.sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));

  const attention = [
    ...cameras.filter((camera) => !camera.online).map((camera) => ({ type: "camera-offline", label: `${camera.name} unavailable`, entityId: camera.entityId })),
    ...cameras.filter((camera) => camera.active).map((camera) => ({ type: "camera-activity", label: `${camera.name} activity`, entityId: camera.entityId })),
    ...entries.filter((entry) => entry.available && entry.open).map((entry) => ({ type: "entry-open", label: `${entry.name} open`, entityId: entry.entityId })),
  ];
  return {
    error: null,
    cameras,
    entries,
    attention,
    allClear: attention.length === 0,
    onlineCameras: cameras.filter((camera) => camera.online).length,
  };
};

const loadSecurityModel = async (hass, profileId = "household-security", options = {}) => {
  const [profileResult, registry] = await Promise.all([
    securityShared.dashboardProfiles.get(hass, "security", profileId, options).catch((error) => ({ found: false, profile: null, error })),
    securityHD?.REG?.load?.(hass),
  ]);
  if (!profileResult?.found) {
    const error = profileResult?.error || new Error(`Security profile ${profileId} is not configured`);
    return {
      error,
      cameras: [],
      entries: [],
      attention: [],
      allClear: false,
      onlineCameras: 0,
      profile: null,
      profileMissing: true,
      profileError: profileResult?.error || null,
    };
  }
  const model = securityModel(hass, registry, profileResult.profile);
  return { ...model, profile: profileResult?.profile || null, profileMissing: !profileResult?.found, profileError: profileResult?.error || null };
};

Object.assign(securityShared, {
  loadSecurityModel,
  securityCapabilityText: capabilityText,
  securityEntityLabel: entityLabel,
  securityModel,
});
