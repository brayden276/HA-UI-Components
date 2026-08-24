/** Replayable selected-day state and one shared backend Energy resource. */
const energyShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};
const { connectionId, createAsyncBroker } = energyShared;
const dayChannels = new Map();

const padDay = (value) => String(value).padStart(2, "0");
const dayKey = (date = new Date()) => `${date.getFullYear()}-${padDay(date.getMonth() + 1)}-${padDay(date.getDate())}`;
const dayKeyInZone = (hass, date = new Date()) => {
  const timeZone = hass?.config?.time_zone;
  if (!timeZone) return dayKey(date);
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-AU", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch { return dayKey(date); }
};
const validDay = (value, today = dayKey()) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (dayKey(date) !== value || value > today) return null;
  return value;
};
const channel = (name) => {
  const key = String(name || "energy-day");
  if (!dayChannels.has(key)) {
    let stored = null;
    try { stored = sessionStorage.getItem(`ha-component-library:${key}`); } catch {}
    const storedDay = validDay(stored);
    dayChannels.set(key, { value: storedDay || dayKey(), usesDefault: !storedDay, subscribers: new Set() });
  }
  return dayChannels.get(key);
};

const energyDayState = Object.freeze({
  get(name = "energy-day", hass) {
    const current = channel(name);
    if (current.usesDefault) current.value = dayKeyInZone(hass);
    return current.value;
  },
  set(name = "energy-day", value, options = {}) {
    const current = channel(name), today = dayKeyInZone(options.hass), next = validDay(value, today);
    if (!next || next === current.value) return current.value;
    current.value = next;
    current.usesDefault = false;
    try { sessionStorage.setItem(`ha-component-library:${name}`, next); } catch {}
    const detail = { channel: name, day: next, isToday: next === today };
    for (const subscriber of [...current.subscribers]) subscriber(detail);
    if (options.broadcast !== false) {
      window.dispatchEvent(new CustomEvent("energy-day-selector-change", { detail }));
    }
    return next;
  },
  subscribe(name = "energy-day", subscriber, options = {}) {
    const current = channel(name);
    if (current.usesDefault) current.value = dayKeyInZone(options.hass);
    current.subscribers.add(subscriber);
    if (options.replay !== false) subscriber({
      channel: name,
      day: current.value,
      isToday: current.value === dayKeyInZone(options.hass),
    });
    return () => current.subscribers.delete(subscriber);
  },
  today: dayKeyInZone,
});

const energyContexts = new Map();
const dataKey = (hass, profileId, day) => `${connectionId(hass)}|${profileId}|${day}`;
const energyBroker = createAsyncBroker(async (key) => {
  const context = energyContexts.get(key);
  if (!context?.hass?.callWS) throw new Error("Home Assistant WebSocket connection is unavailable");
  return context.hass.callWS({
    type: "ha_component_backend/energy/day",
    profile_id: context.profileId,
    day: context.day,
  });
}, { ttl: 120000, maxStale: 86400000, retryBase: 2500, retryMax: 60000 });

const energyDayData = Object.freeze({
  async get(hass, profileId, day, options = {}) {
    const key = dataKey(hass, profileId, day);
    energyContexts.set(key, { hass, profileId, day });
    return energyBroker.read(key, null, options);
  },
  invalidate(hass, profileId, day) { energyBroker.invalidate(dataKey(hass, profileId, day)); },
  invalidateProfile(hass, profileId) {
    const id = connectionId(hass);
    for (const [key, context] of energyContexts) {
      if (connectionId(context.hass) === id && context.profileId === profileId) energyBroker.invalidate(key);
    }
  },
  peek(hass, profileId, day) { return energyBroker.peek(dataKey(hass, profileId, day)); },
  subscribe(hass, profileId, day, subscriber) {
    const key = dataKey(hass, profileId, day);
    energyContexts.set(key, { hass, profileId, day });
    return energyBroker.subscribe(key, subscriber);
  },
});

Object.assign(energyShared, { energyDayData, energyDayState });
