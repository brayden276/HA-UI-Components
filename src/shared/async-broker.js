/** Shared stale-while-refresh request broker with coalescing and backoff. */
const asyncShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const createAsyncBroker = (loader, defaults = {}) => {
  if (typeof loader !== "function") throw new TypeError("createAsyncBroker requires a loader");
  const entries = new Map();
  const ttl = Math.max(0, Number(defaults.ttl) || 120000);
  const maxStale = Math.max(ttl, Number(defaults.maxStale) || 86400000);
  const retryBase = Math.max(250, Number(defaults.retryBase) || 2000);
  const retryMax = Math.max(retryBase, Number(defaults.retryMax) || 60000);

  const entryFor = (key) => {
    if (!entries.has(key)) entries.set(key, {
      value: undefined, error: null, updatedAt: 0, promise: null,
      failures: 0, nextRetryAt: 0, subscribers: new Set(), sequence: 0,
      invalidated: false, generation: 0,
    });
    return entries.get(key);
  };
  const snapshot = (key) => {
    const entry = entryFor(key), age = entry.updatedAt ? Date.now() - entry.updatedAt : Infinity;
    return Object.freeze({
      value: entry.value,
      error: entry.error,
      loading: Boolean(entry.promise),
      stale: entry.value !== undefined && (entry.invalidated || age > ttl),
      updatedAt: entry.updatedAt,
    });
  };
  const notify = (key) => {
    const current = snapshot(key);
    for (const subscriber of [...entryFor(key).subscribers]) {
      try { subscriber(current); } catch {}
    }
  };
  const refresh = (key, context, force = false) => {
    const entry = entryFor(key), now = Date.now();
    if (entry.promise) return entry.promise;
    if (!force && now < entry.nextRetryAt) {
      return entry.value !== undefined ? Promise.resolve(entry.value) : Promise.reject(entry.error);
    }
    const sequence = ++entry.sequence, generation = entry.generation;
    entry.promise = Promise.resolve()
      .then(() => loader(key, context, sequence))
      .then((value) => {
        if (sequence !== entry.sequence) return entry.value;
        entry.value = value;
        entry.error = null;
        entry.updatedAt = Date.now();
        entry.failures = 0;
        entry.nextRetryAt = 0;
        entry.invalidated = entry.generation !== generation;
        return value;
      })
      .catch((error) => {
        if (sequence !== entry.sequence) return entry.value;
        entry.error = error instanceof Error ? error : new Error(String(error));
        entry.failures += 1;
        entry.nextRetryAt = Date.now() + Math.min(retryMax, retryBase * (2 ** (entry.failures - 1)));
        if (entry.value !== undefined && Date.now() - entry.updatedAt <= maxStale) return entry.value;
        throw entry.error;
      })
      .finally(() => {
        if (sequence === entry.sequence) entry.promise = null;
        notify(key);
      });
    notify(key);
    return entry.promise;
  };

  return Object.freeze({
    clear() { entries.clear(); },
    invalidate(key) {
      const entry = entries.get(key);
      if (!entry) return;
      entry.invalidated = true;
      entry.generation += 1;
      entry.nextRetryAt = 0;
      notify(key);
    },
    peek: snapshot,
    async read(key, context, options = {}) {
      const current = snapshot(key), age = current.updatedAt ? Date.now() - current.updatedAt : Infinity;
      const entry = entryFor(key);
      if (!options.force && !entry.invalidated && current.value !== undefined && age <= ttl) return current.value;
      if (!options.force && current.value !== undefined && age <= maxStale) {
        void refresh(key, context).catch(() => {});
        return current.value;
      }
      let value;
      try {
        value = await refresh(key, context, options.force === true);
      } catch (error) {
        if (!(options.force && entryFor(key).invalidated)) throw error;
        value = await refresh(key, context, true);
      }
      if (options.force && entryFor(key).invalidated) value = await refresh(key, context, true);
      return value;
    },
    refresh: (key, context) => refresh(key, context, true),
    subscribe(key, subscriber, options = {}) {
      const entry = entryFor(key);
      entry.subscribers.add(subscriber);
      if (options.replay !== false) subscriber(snapshot(key));
      return () => entry.subscribers.delete(subscriber);
    },
  });
};

Object.assign(asyncShared, { createAsyncBroker });
