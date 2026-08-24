/** Distinguish a genuinely empty registry from a registry request failure. */
(() => {
  const registry = globalThis.__homeDashboardV2?.REG;
  if (!registry || registry.__healthAwareV1) return;
  registry.__healthAwareV1 = true;
  const originalLoad = registry.load;
  registry.load = async function healthAwareRegistryLoad(hass, force = false) {
    const result = await originalLoad.call(this, hass, force);
    if (result?.error || result?.areas?.length || result?.devices?.length || result?.entities?.length) return result;
    const connection = hass?.connection;
    if (!connection?.sendMessagePromise) {
      return { ...result, error: { code: "connection_unavailable", message: "Home Assistant registry connection is unavailable" } };
    }
    try {
      const verification = await Promise.all([
        connection.sendMessagePromise({ type: "config/area_registry/list" }),
        connection.sendMessagePromise({ type: "config/device_registry/list" }),
        connection.sendMessagePromise({ type: "config/entity_registry/list" }),
      ]);
      if (verification.every((items) => Array.isArray(items) && items.length === 0)) return result;
      return originalLoad.call(this, hass, true);
    } catch (error) {
      const failed = { ...result, error: { code: error?.code || "registry_unavailable", message: error?.message || "Home Assistant registries are unavailable" } };
      this.data = failed;
      return failed;
    }
  };
})();
