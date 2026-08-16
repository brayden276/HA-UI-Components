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
