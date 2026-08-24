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
        return latest?.found ? rememberPreference(key, latest) : legacy;
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

// Give the existing editor explicit failure feedback without duplicating the
// editor component. The patch is intentionally behavioural; its visual system
// remains owned by dashboard-preference-editor-v3.
const PreferenceEditor = customElements.get("dashboard-preference-editor-v3");
if (PreferenceEditor && !PreferenceEditor.prototype.__backendFeedbackV1) {
  PreferenceEditor.prototype.__backendFeedbackV1 = true;
  const originalOpen = PreferenceEditor.prototype.open;
  PreferenceEditor.prototype.open = function openWithBackendFeedback(options) {
    originalOpen.call(this, options);
    const save = this.shadowRoot.querySelector(".save");
    if (save) save.style.minWidth = "84px";
    let error = this.shadowRoot.querySelector(".save-error");
    if (!error) {
      error = document.createElement("p");
      error.className = "save-error";
      error.hidden = true;
      error.setAttribute("role", "alert");
      error.style.cssText =
        "margin:0;padding:10px 14px 0;color:var(--error-color);font-size:13px;line-height:1.4";
      this.shadowRoot.querySelector(".ft")?.before(error);
    }
    error.hidden = true;
    error.textContent = "";
  };
  PreferenceEditor.prototype.save = async function saveWithBackendFeedback() {
    const button = this.shadowRoot.querySelector(".save");
    const error = this.shadowRoot.querySelector(".save-error");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Saving…";
    if (error) error.hidden = true;
    try {
      await this.o.onSave?.({
        order: this.items.map((item) => item.id),
        hidden: [...this.hiddenIds],
      });
      this.d.close();
    } catch (saveError) {
      if (error) {
        error.textContent =
          saveError?.message ||
          "Couldn’t save these changes. Your current choices are still open; try again.";
        error.hidden = false;
      }
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Save";
    }
  };
}
