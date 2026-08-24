/** Keep Home Favourites backend-only once the preference contract is present. */
customElements.whenDefined("component-home-overview-v4").then(() => {
  const prototype = customElements.get("component-home-overview-v4")?.prototype;
  if (!prototype || prototype.__backendOnlyFavouritesV1) return;
  prototype.__backendOnlyFavouritesV1 = true;
  const originalSetConfig = prototype.setConfig;
  prototype.setConfig = function setBackendOnlyHomeConfig(config) {
    return originalSetConfig.call(this, { ...config, favourites_helpers: [] });
  };
});
