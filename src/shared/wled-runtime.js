/** Shared WLED registry helpers used by the controller and dashboard integration. */
const componentLibraryWledShared =
  globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

globalThis.__homeDashboardV2 ??= {};
const WLED_HD = globalThis.__homeDashboardV2;
const WLED_DOMAIN = (entityId) => String(entityId || "").split(".")[0];
const WLED_INVALID = new Set(["unknown", "unavailable", "none", ""]);
const WLED_NAME = (entry) =>
  String(entry?.original_name || entry?.name || entry?.entity_id || "").toLowerCase();

Object.assign(componentLibraryWledShared, {
  WLED_HD,
  WLED_DOMAIN,
  WLED_INVALID,
  WLED_NAME,
});

// WLED is a physical device bundle. Only its canonical light belongs in
// dashboard discovery; the remaining WLED entities are control details.
if (!WLED_HD.__wledDashboardIntegrationV1) {
  WLED_HD.__wledDashboardIntegrationV1 = true;

  WLED_HD.registerEntryFilter?.((entry) => {
    if (entry?.platform !== "wled") return true;
    if (WLED_DOMAIN(entry.entity_id) !== "light") return false;
    const name = WLED_NAME(entry);
    return name === "main" || !/_\d+$/.test(String(entry.unique_id || ""));
  });

  WLED_HD.registerControlResolver?.((entry) => {
    if (entry?.platform !== "wled" || WLED_DOMAIN(entry.entity_id) !== "light") return null;
    return {
      type: "custom:component-wled-controller-v1",
      entity: entry.entity_id,
      device_id: entry.device_id,
    };
  });

  WLED_HD.REG?.refresh?.();
}
