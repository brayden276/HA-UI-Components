/** Backend-first dashboard preferences with a legacy frontend fallback. */
const preferenceRuntime = globalThis.__homeDashboardV2 ??= {};
const legacyGetPreference = preferenceRuntime.prefs?.bind(preferenceRuntime);
const legacySavePreference = preferenceRuntime.savePrefs?.bind(preferenceRuntime);
const preferenceRevisions = new Map();
const backendAvailability = new WeakMap();

const preferenceErrorCode = (error) =>
  String(error?.code || error?.error?.code || error?.message || error || "").toLowerCase();

const backendIsUnavailable = (error) => {
  const code = preferenceErrorCode(error);
  return (
    code.includes("unknown_command") ||
    code.includes("unknown command") ||
    code.includes("preference_unavailable") ||
    code.includes("not configured")
  );
};
const callPreferenceBackend = (hass, message) => {
  if (typeof hass?.callWS === "function") return hass.callWS(message);
  if (typeof hass?.connection?.sendMessagePromise === "function") {
    return hass.connection.sendMessagePromise(message);
  }
  return Promise.reject(new Error("Home Assistant WebSocket connection is unavailable"));
};

const rememberPreference = (key, response) => {
  preferenceRevisions.set(key, Number(response?.revision) || 0);
  return response?.value;
};

preferenceRuntime.prefs = async (hass, key) => {
  if (!hass || !key) return { order: [], hidden: [] };
  const connection = hass.connection;
  if (connection && backendAvailability.get(connection) === false) {
    return legacyGetPreference?.(hass, key) ?? { order: [], hidden: [] };
  }
  try {
    const response = await callPreferenceBackend(hass, {
      type: "ha_component_backend/preferences/get",
      key,
    });
    if (connection) backendAvailability.set(connection, true);
    if (response?.found) return rememberPreference(key, response);
    rememberPreference(key, response);

    // Migrate the existing frontend preference once. This keeps upgrades
    // lossless while making the backend the canonical shared store afterwards.
    const legacy = await (legacyGetPreference?.(hass, key) ?? { order: [], hidden: [] });
    try {
      const migrated = await callPreferenceBackend(hass, {
        type: "ha_component_backend/preferences/update",
        key,
        value: legacy,
        expected_revision: Number(response?.revision) || 0,
      });
      rememberPreference(key, migrated);
      return legacy;
    } catch (error) {
      if (preferenceErrorCode(error).includes("preference_conflict")) {
        const latest = await callPreferenceBackend(hass, {
          type: "ha_component_backend/preferences/get",
          key,
        });
        const latestValue = rememberPreference(key, latest);
        return latest?.found ? latestValue : legacy;
      }
      throw error;
    }
  } catch (error) {
    if (!backendIsUnavailable(error)) throw error;
    if (connection) backendAvailability.set(connection, false);
    return legacyGetPreference?.(hass, key) ?? { order: [], hidden: [] };
  }
};

preferenceRuntime.savePrefs = async (hass, key, value) => {
  if (!hass || !key) throw new Error("A preference key is required");
  const connection = hass.connection;
  if (connection && backendAvailability.get(connection) === false) {
    return legacySavePreference?.(hass, key, value);
  }
  const message = {
    type: "ha_component_backend/preferences/update",
    key,
    value,
  };
  if (preferenceRevisions.has(key)) {
    message.expected_revision = preferenceRevisions.get(key);
  }
  try {
    const response = await callPreferenceBackend(hass, message);
    if (connection) backendAvailability.set(connection, true);
    rememberPreference(key, response);
    return response;
  } catch (error) {
    if (backendIsUnavailable(error)) {
      if (connection) backendAvailability.set(connection, false);
      return legacySavePreference?.(hass, key, value);
    }
    if (preferenceErrorCode(error).includes("preference_conflict")) {
      throw new Error(
        "These preferences changed on another screen. Close and reopen the editor, then try again.",
        { cause: error },
      );
    }
    throw error;
  }
};
