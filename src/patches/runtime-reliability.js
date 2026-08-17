/** Temporary compatibility fixes for installed bundles predating the scoped-source corrections. */
(() => {
  const patch = (type, apply) => customElements.whenDefined(type).then(() => {
    const Card = customElements.get(type);
    if (Card) apply(Card.prototype);
  });

  patch("component-context-strip-v3", (prototype) => {
    const original = prototype._render;
    if (typeof original !== "function" || !String(original).includes("CtxEsc")) return;
    prototype._render = function renderWithScopedEscape() {
      const previous = globalThis.CtxEsc;
      globalThis.CtxEsc = globalThis.__HA_COMPONENT_LIBRARY_SHARED__?.escapeHtml ?? String;
      try { return original.call(this); }
      finally {
        if (previous === undefined) delete globalThis.CtxEsc;
        else globalThis.CtxEsc = previous;
      }
    };
  });

  patch("component-device-discovery-v2", (prototype) => {
    const originalStyles = prototype.styles;
    if (typeof originalStyles === "function" && String(originalStyles).includes("${B}")) {
      prototype.styles = function stylesWithScopedBase() {
        const previous = globalThis.B;
        globalThis.B = globalThis.__HA_COMPONENT_LIBRARY_SHARED__?.PRESENTATIONAL_CARD_STYLES ?? "";
        try { return originalStyles.call(this); }
        finally {
          if (previous === undefined) delete globalThis.B;
          else globalThis.B = previous;
        }
      };
    }
    const originalDisconnect = prototype.disconnectedCallback;
    if (!String(originalDisconnect).includes("started = false")) {
      prototype.disconnectedCallback = function disconnectDiscovery() {
        originalDisconnect?.call(this);
        this.timer = null;
        this.started = false;
      };
    }
  });

  patch("component-history-graph-v2", (prototype) => {
    if (prototype.connectedCallback) return;
    prototype.connectedCallback = function reconnectHistoryGraph() {
      if (this.e?.chart) this.ro?.observe(this.e.chart);
      this.draw?.();
    };
  });

  patch("component-update-summary-v3", (prototype) => {
    if (prototype.disconnectedCallback) return;
    prototype.disconnectedCallback = function disconnectUpdateSummary() {
      window.clearTimeout(this.messageTimer);
      this.messageTimer = null;
    };
  });
})();
