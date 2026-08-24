/** Owned lifecycle and dialog primitives for retained Home Assistant cards. */
const lifecycleShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const createLifecycle = (host) => {
  let controller = null;
  let cleanups = [];

  const connect = () => {
    if (controller && !controller.signal.aborted) return controller.signal;
    controller = new AbortController();
    return controller.signal;
  };

  const cleanup = (callback) => {
    if (typeof callback !== "function") return callback;
    cleanups.push(callback);
    return callback;
  };

  const listen = (target, type, listener, options = {}) => {
    const signal = connect();
    target?.addEventListener?.(type, listener, { ...options, signal });
    return listener;
  };

  const disconnect = () => {
    controller?.abort(new Error("Component disconnected"));
    controller = null;
    const pending = cleanups;
    cleanups = [];
    for (const callback of pending.reverse()) {
      try { callback(); } catch {}
    }
  };

  return Object.freeze({
    cleanup,
    connect,
    disconnect,
    get connected() { return Boolean(controller && !controller.signal.aborted); },
    get signal() { return connect(); },
    host,
    listen,
  });
};

const createDialogController = (host, dialog, options = {}) => {
  let trigger = null;
  let busy = false;
  const focusable = () => [...dialog.querySelectorAll?.(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
  ) || []].filter((element) => !element.hidden);

  const restore = () => {
    const target = trigger;
    trigger = null;
    queueMicrotask(() => target?.isConnected && target.focus?.());
  };
  const close = (reason = "dismiss") => {
    if (busy && reason !== "complete") return false;
    if (dialog.open) dialog.close(reason);
    return true;
  };
  const open = (from) => {
    trigger = from || host.shadowRoot?.activeElement || document.activeElement;
    if (!dialog.open) dialog.showModal();
    queueMicrotask(() => (options.initialFocus?.() || focusable()[0] || dialog).focus?.());
  };
  const onCancel = (event) => {
    if (busy || options.dismissible === false) event.preventDefault();
  };
  const onClick = (event) => {
    if (event.target === dialog && options.clickOutside !== false) close("outside");
  };
  const onKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); }
  };
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("keydown", onKeyDown);
  dialog.addEventListener("close", restore);
  return Object.freeze({
    close,
    destroy() {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("keydown", onKeyDown);
      dialog.removeEventListener("close", restore);
    },
    get busy() { return busy; },
    open,
    setBusy(value) {
      busy = Boolean(value);
      dialog.toggleAttribute("aria-busy", busy);
    },
  });
};

const createOverlayController = (host, overlay, options = {}) => {
  let trigger = null;
  let locks = [];
  let opened = false;
  const focusable = () => [...overlay.querySelectorAll?.(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
  ) || []].filter((element) => !element.hidden);
  const composedParent = (node) => node?.parentElement || node?.getRootNode?.()?.host || null;
  const restore = () => {
    const target = trigger;
    trigger = null;
    queueMicrotask(() => target?.isConnected && target.focus?.());
  };
  const lockBackground = () => {
    if (locks.length) return;
    const candidates = new Set([document.documentElement, document.body]);
    let node = host;
    while ((node = composedParent(node))) {
      const style = globalThis.getComputedStyle?.(node);
      if (/auto|scroll|overlay/.test(`${style?.overflow || ""} ${style?.overflowY || ""}`)) candidates.add(node);
    }
    locks = [...candidates].filter(Boolean).map((element) => ({
      element,
      overflow: element.style.overflow,
      overflowY: element.style.overflowY,
      overscrollBehavior: element.style.overscrollBehavior,
    }));
    for (const lock of locks) {
      lock.element.style.overflow = "hidden";
      lock.element.style.overflowY = "hidden";
      lock.element.style.overscrollBehavior = "none";
    }
  };
  const unlockBackground = () => {
    for (const lock of locks) {
      lock.element.style.overflow = lock.overflow;
      lock.element.style.overflowY = lock.overflowY;
      lock.element.style.overscrollBehavior = lock.overscrollBehavior;
    }
    locks = [];
  };
  const close = (restoreFocus = true) => {
    if (!opened) return;
    opened = false;
    overlay.hidden = true;
    document.removeEventListener?.("focusin", focusGuard, true);
    unlockBackground();
    if (restoreFocus) restore();
    else trigger = null;
  };
  const requestClose = (reason) => {
    if (options.canDismiss?.(reason) === false) return;
    if (options.onDismiss) options.onDismiss(reason);
    else close(true);
  };
  const focusGuard = (event) => {
    if (!opened || event.composedPath?.().includes(host)) return;
    queueMicrotask(() => (options.initialFocus?.() || focusable()[0] || overlay).focus?.());
  };
  const onClick = (event) => {
    if (event.target === overlay && options.clickOutside !== false) requestClose("outside");
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape" && options.dismissible !== false) {
      event.preventDefault();
      requestClose("escape");
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0], last = items.at(-1), active = host.shadowRoot?.activeElement;
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  };
  overlay.addEventListener("click", onClick);
  host.shadowRoot?.addEventListener("keydown", onKeyDown);
  return Object.freeze({
    close,
    destroy() {
      close(false);
      overlay.removeEventListener("click", onClick);
      host.shadowRoot?.removeEventListener("keydown", onKeyDown);
    },
    get isOpen() { return opened; },
    open(from) {
      if (opened) return;
      trigger = from || host.shadowRoot?.activeElement || document.activeElement;
      opened = true;
      overlay.hidden = false;
      lockBackground();
      document.addEventListener?.("focusin", focusGuard, true);
      queueMicrotask(() => (options.initialFocus?.() || focusable()[0] || overlay).focus?.());
    },
  });
};

Object.assign(lifecycleShared, { createDialogController, createLifecycle, createOverlayController });
