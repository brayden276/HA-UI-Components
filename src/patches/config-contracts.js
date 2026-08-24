/** Install editor/stub support on legacy cards that predate registerCard. */
(() => {
  const install = globalThis.__HA_COMPONENT_LIBRARY_SHARED__?.installConfigContract;
  if (!install) return;
  for (const card of window.customCards || []) {
    const type = String(card?.type || "");
    if (!type) continue;
    const element = customElements.get(type);
    if (element) install(type, element);
  }
})();
