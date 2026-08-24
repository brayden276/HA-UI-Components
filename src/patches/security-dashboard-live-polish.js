/** Live-render polish for the rebuilt Security dashboard. */
const SecurityDashboardLivePolish = customElements.get("component-security-dashboard-v1");
if (SecurityDashboardLivePolish) {
  const originalRenderCameras = SecurityDashboardLivePolish.prototype.renderCameras;
  SecurityDashboardLivePolish.prototype.renderCameras = function renderCamerasWithStableEmptyState(cameras) {
    originalRenderCameras.call(this, cameras);
    if (this.elements?.cameraEmpty) {
      // Author-level `.empty { display:grid }` otherwise overrides the browser's
      // hidden presentation, leaving a contradictory empty-state under live cameras.
      this.elements.cameraEmpty.style.display = cameras.length ? "none" : "";
    }
  };
}
