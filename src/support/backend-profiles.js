/** Validated backend profile client shared by Energy and Security dashboards. */
const profileShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};
const { createAsyncBroker } = profileShared;
const connectionIds = new WeakMap();
let nextConnectionId = 1;
const connectionId = (hass) => {
  const connection = hass?.connection;
  if (!connection) return "none";
  if (!connectionIds.has(connection)) connectionIds.set(connection, nextConnectionId++);
  return connectionIds.get(connection);
};
const profileKey = (hass, kind, profileId) => `${connectionId(hass)}|${kind}|${profileId}`;
const profileContext = new Map();
const profileSubscriptions = new WeakMap();

const attachProfileEvents = (hass) => {
  const connection = hass?.connection;
  if (!connection?.subscribeEvents || profileSubscriptions.has(connection)) return;
  const subscription = connection.subscribeEvents((event) => {
    const match = /^dashboard-profile\.(energy|security)\.([a-z0-9-]+)$/.exec(String(event?.data?.key || ""));
    if (match) {
      profileBroker.invalidate(profileKey(hass, match[1], match[2]));
      window.dispatchEvent(new CustomEvent("ha-component-profile-change", {
        detail: { kind: match[1], profileId: match[2] },
      }));
    }
  }, "ha_component_backend_preferences_updated");
  profileSubscriptions.set(connection, subscription);
  Promise.resolve(subscription).catch(() => profileSubscriptions.delete(connection));
};

const profileBroker = createAsyncBroker(async (key) => {
  const context = profileContext.get(key);
  if (!context?.hass?.callWS) throw new Error("Home Assistant WebSocket connection is unavailable");
  return context.hass.callWS({
    type: "ha_component_backend/profile/get",
    kind: context.kind,
    profile_id: context.profileId,
  });
}, { ttl: 300000, maxStale: 86400000, retryBase: 3000, retryMax: 60000 });

const dashboardProfiles = Object.freeze({
  async get(hass, kind, profileId, options = {}) {
    attachProfileEvents(hass);
    const key = profileKey(hass, kind, profileId);
    profileContext.set(key, { hass, kind, profileId });
    return profileBroker.read(key, null, options);
  },
  invalidate(hass, kind, profileId) {
    profileBroker.invalidate(profileKey(hass, kind, profileId));
  },
  peek(hass, kind, profileId) {
    return profileBroker.peek(profileKey(hass, kind, profileId));
  },
  async save(hass, kind, profileId, profile, expectedRevision) {
    const message = {
      type: "ha_component_backend/profile/update",
      kind,
      profile_id: profileId,
      profile,
    };
    if (Number.isFinite(Number(expectedRevision))) message.expected_revision = Number(expectedRevision);
    const result = await hass.callWS(message);
    profileBroker.invalidate(profileKey(hass, kind, profileId));
    return result;
  },
  subscribe(hass, kind, profileId, subscriber) {
    attachProfileEvents(hass);
    const key = profileKey(hass, kind, profileId);
    profileContext.set(key, { hass, kind, profileId });
    return profileBroker.subscribe(key, subscriber);
  },
});

Object.assign(profileShared, { connectionId, dashboardProfiles });
