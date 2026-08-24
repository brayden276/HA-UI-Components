/**
 * HA Component Library v10.0.0
 * Generated HACS Dashboard bundle.
 *
 * Source is organised by component under src/components. Shared logic lives
 * under src/shared. Existing component CSS and runtime behaviour are preserved.
 */

// Module: src/shared/core.js
{
/** Shared card primitives. CSS values are preserved from the Components dashboard. */
const componentLibraryShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const PRESENTATIONAL_CARD_STYLES = `:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}button.demo{appearance:none;width:100%;border:0;background:transparent;text-align:inherit;padding:0;cursor:pointer}button.demo:active{transform:scale(.992)}button.demo:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}`;

const toText = (value) => (value == null ? "" : String(value));
const escapeHtml = (value) =>
  toText(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const registerCard = ({ type, element, name, description, preview = true }) => {
  componentLibraryShared.installConfigContract?.(type, element);
  if (!customElements.get(type)) customElements.define(type, element);
  window.customCards ??= [];
  if (!window.customCards.some((card) => card.type === type)) {
    window.customCards.push({ type, name, description, preview });
  }
};

const openMoreInfo = (host, entityId) => {
  if (!entityId) return;
  host.dispatchEvent(
    new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }),
  );
};

const navigateTo = (path) => {
  if (!path) return;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("location-changed"));
};

class DashboardBaseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(_hass) {}

  escapeHtml(value) {
    return escapeHtml(value);
  }

  cardStyles() {
    return `:host{display:block;min-width:0}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color);box-sizing:border-box}.wrap{box-sizing:border-box;padding:12px 14px}.title{font-size:13px;line-height:1.25;font-weight:600;color:var(--primary-text-color)}.desc{margin-top:3px;font-size:11px;line-height:1.3;color:var(--secondary-text-color)}ha-icon{--mdc-icon-size:19px}button{font:inherit;color:inherit}button.i{appearance:none;border:0;background:transparent;cursor:pointer}button.i:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button.i:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:var(--dashboard-radius-control,5px)}@media(max-width:700px){.wrap{padding:12px}}`;
  }
}

Object.assign(componentLibraryShared, {
  PRESENTATIONAL_CARD_STYLES,
  DashboardBaseCard,
  escapeHtml,
  navigateTo,
  openMoreInfo,
  registerCard,
  toText,
});
}

// Module: src/shared/interaction.js
{
/** Shared interaction primitives for all HA Component Library controls. */
const interactionShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const INTERACTION_DEFAULTS = Object.freeze({
  holdDelay: 500,
  moveTolerance: 10,
  errorDuration: 1800,
  repeatDelay: 350,
  repeatInterval: 110,
  repeatMinimumInterval: 55,
});

const reducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

const normaliseRepeat = (repeat) => {
  if (!repeat) return null;
  if (repeat === true) return {};
  if (typeof repeat !== "object") {
    throw new TypeError("interaction repeat must be false, true, or an options object");
  }
  return repeat;
};

const optimisticAdapter = (optimistic, element) => {
  if (!optimistic) return null;
  if (typeof optimistic === "function") {
    return { capture: () => undefined, apply: optimistic, rollback: null };
  }
  if (typeof optimistic === "object") {
    return {
      capture: optimistic.capture || (() => undefined),
      apply: optimistic.apply || (() => {}),
      rollback: optimistic.rollback || null,
    };
  }
  if (optimistic === "toggle") {
    return {
      capture: () => element.getAttribute("aria-pressed"),
      apply: () => {
        const current = element.getAttribute("aria-pressed") === "true";
        element.setAttribute("aria-pressed", String(!current));
      },
      rollback: (previous) => {
        if (previous === null) element.removeAttribute("aria-pressed");
        else element.setAttribute("aria-pressed", previous);
      },
    };
  }
  if (optimistic === "selection") {
    return {
      capture: () => ({
        selected: element.getAttribute("aria-selected"),
        checked: element.getAttribute("aria-checked"),
      }),
      apply: () => {
        if (element.hasAttribute("aria-selected")) element.setAttribute("aria-selected", "true");
        if (element.hasAttribute("aria-checked")) element.setAttribute("aria-checked", "true");
      },
      rollback: (previous) => {
        if (previous.selected === null) element.removeAttribute("aria-selected");
        else element.setAttribute("aria-selected", previous.selected);
        if (previous.checked === null) element.removeAttribute("aria-checked");
        else element.setAttribute("aria-checked", previous.checked);
      },
    };
  }
  throw new TypeError(`Unsupported optimistic interaction mode: ${optimistic}`);
};

const ensureInteractionFeedback = (element) => {
  const root = element.getRootNode?.();
  if (!root?.append || root.__haInteractionFeedbackV2) return null;
  root.__haInteractionFeedbackV2 = true;
  const style = document.createElement("style");
  style.setAttribute("data-ha-interaction-styles", "v2");
  style.textContent = interactionStyles;
  const status = document.createElement("span");
  status.setAttribute("data-ha-interaction-status", "v2");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  root.append(style, status);
  return status;
};

const NESTED_INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "summary",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='slider']",
  "[role='switch']",
  "[tabindex]",
].join(",");

const interaction = (element, options = {}) => {
  if (!element?.addEventListener) {
    throw new TypeError("interaction requires an EventTarget element");
  }
  const feedbackStatus = ensureInteractionFeedback(element);

  const primary = typeof options.primary === "function" ? options.primary : null;
  const hold = typeof options.hold === "function" ? options.hold : null;
  const repeat = normaliseRepeat(options.repeat);
  if (hold && repeat) throw new TypeError("interaction hold and repeat are mutually exclusive");
  if (!primary && (hold || repeat)) {
    throw new TypeError("interaction hold/repeat requires a primary action");
  }

  const feedback = options.feedback !== false;
  const singleFlight = options.singleFlight === true;
  const holdDelay = Math.max(250, Number(options.holdDelay) || INTERACTION_DEFAULTS.holdDelay);
  const moveTolerance = Math.max(4, Number(options.moveTolerance) || INTERACTION_DEFAULTS.moveTolerance);
  const optimistic = optimisticAdapter(options.optimistic, element);
  const signal = options.signal;
  const onPressChange = typeof options.onPressChange === "function" ? options.onPressChange : null;
  let pointer = null;
  let holdTimer = null;
  let repeatTimer = null;
  let repeatInterval = null;
  let repeatCount = 0;
  let suppressClick = false;
  let suppressClickTimer = null;
  let gestureConsumed = false;
  let pending = 0;
  let errorTimer = null;
  let destroyed = false;
  let pressedState = false;

  const fromNestedInteractive = (event) => {
    const path = event?.composedPath?.();
    if (Array.isArray(path) && path.length) {
      for (const node of path) {
        if (node === element) return false;
        if (node?.matches?.(NESTED_INTERACTIVE_SELECTOR)) return true;
      }
    }
    const target = event?.target;
    if (!target || target === element) return false;
    const nested = target.closest?.(NESTED_INTERACTIVE_SELECTOR);
    return Boolean(nested && nested !== element && element.contains?.(nested));
  };

  const disabled = () =>
    destroyed ||
    (singleFlight && pending > 0) ||
    element.disabled === true ||
    element.getAttribute?.("aria-disabled") === "true";

  const clearClickSuppression = () => {
    clearTimeout(suppressClickTimer);
    suppressClickTimer = null;
    suppressClick = false;
  };

  const suppressNextClick = () => {
    suppressClick = true;
    clearTimeout(suppressClickTimer);
    // Native click follows pointerup/keyup in the same task. Avoid leaving a
    // stale suppression flag that could swallow a later programmatic click.
    suppressClickTimer = setTimeout(clearClickSuppression, 0);
  };

  const setPressed = (pressed) => {
    if (pressedState === pressed) return;
    pressedState = pressed;
    if (feedback) element.toggleAttribute?.("data-interaction-pressed", pressed);
    if (!destroyed) onPressChange?.(pressed, element);
  };

  const setPending = (value) => {
    pending = Math.max(0, pending + value);
    if (!feedback || destroyed) return;
    element.toggleAttribute?.("data-interaction-pending", pending > 0);
    element.setAttribute?.("aria-busy", String(pending > 0));
  };

  const setError = () => {
    if (!feedback || destroyed) return;
    clearTimeout(errorTimer);
    element.setAttribute?.("data-interaction-error", "true");
    const liveStatus = feedbackStatus || element.getRootNode?.()?.querySelector?.("[data-ha-interaction-status]");
    if (liveStatus) liveStatus.textContent = options.errorMessage || "Action failed. Try again.";
    errorTimer = setTimeout(() => {
      errorTimer = null;
      if (!destroyed) element.removeAttribute?.("data-interaction-error");
    }, Math.max(250, Number(options.errorDuration) || INTERACTION_DEFAULTS.errorDuration));
  };

  const dispatchError = (error) => {
    if (destroyed) return;
    element.dispatchEvent?.(
      new CustomEvent("ha-interaction-error", {
        bubbles: true,
        composed: true,
        detail: { error },
      }),
    );
  };

  const invoke = (kind, event) => {
    if (disabled()) return Promise.resolve(undefined);
    const action = kind === "hold" ? hold : primary;
    if (!action) return Promise.resolve(undefined);

    let previous;
    if (kind === "primary" && optimistic) {
      previous = optimistic.capture(element, event);
      optimistic.apply(element, event, previous);
    }

    let result;
    try {
      result = action(event);
    } catch (error) {
      if (!destroyed && kind === "primary" && optimistic?.rollback) {
        optimistic.rollback(previous, error, element, event);
      }
      setError();
      dispatchError(error);
      return Promise.reject(error);
    }

    if (!result || typeof result.then !== "function") return Promise.resolve(result);
    setPending(1);
    return Promise.resolve(result)
      .catch((error) => {
        if (!destroyed && kind === "primary" && optimistic?.rollback) {
          optimistic.rollback(previous, error, element, event);
        }
        setError();
        dispatchError(error);
        throw error;
      })
      .finally(() => {
        if (!destroyed) setPending(-1);
      });
  };

  const clearGestureTimers = () => {
    clearTimeout(holdTimer); holdTimer = null;
    clearTimeout(repeatTimer); repeatTimer = null;
    clearInterval(repeatInterval); repeatInterval = null;
  };

  const cancelPointer = () => {
    clearGestureTimers();
    pointer = null;
    setPressed(false);
  };

  const startRepeat = (event) => {
    if (!repeat || disabled()) return;
    const delay = Math.max(150, Number(repeat.delay) || INTERACTION_DEFAULTS.repeatDelay);
    const baseInterval = Math.max(40, Number(repeat.interval) || INTERACTION_DEFAULTS.repeatInterval);
    repeatCount = 0;
    repeatTimer = setTimeout(() => {
      repeatTimer = null;
      if (destroyed || !pointer) return;
      gestureConsumed = true;
      suppressNextClick();
      const tick = () => {
        if (destroyed || !pointer) {
          clearInterval(repeatInterval);
          repeatInterval = null;
          return;
        }
        repeatCount += 1;
        void invoke("primary", event).catch(() => {});
        if (destroyed || !pointer) return;
        if (!repeat.accelerate) return;
        const next = Math.max(
          Number(repeat.minimumInterval) || INTERACTION_DEFAULTS.repeatMinimumInterval,
          Math.round(baseInterval * Math.pow(0.93, repeatCount)),
        );
        clearInterval(repeatInterval);
        repeatInterval = setInterval(tick, next);
      };
      void invoke("primary", event).catch(() => {});
      // A synchronous primary action may destroy the interaction. Do not
      // create an orphaned interval after that teardown.
      if (!destroyed && pointer) repeatInterval = setInterval(tick, baseInterval);
    }, delay);
  };

  const onPointerDown = (event) => {
    if (!primary || disabled() || event.button > 0 || fromNestedInteractive(event)) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    gestureConsumed = false;
    clearClickSuppression();
    try { element.setPointerCapture?.(event.pointerId); } catch {}
    setPressed(true);
    if (hold) {
      holdTimer = setTimeout(() => {
        holdTimer = null;
        if (!pointer) return;
        gestureConsumed = true;
        suppressNextClick();
        setPressed(false);
        void invoke("hold", event).catch(() => {});
      }, holdDelay);
    } else if (repeat) {
      startRepeat(event);
    }
  };

  const onPointerMove = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) <= moveTolerance) return;
    gestureConsumed = true;
    suppressNextClick();
    cancelPointer();
  };

  const onPointerUp = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (fromNestedInteractive(event)) {
      gestureConsumed = true;
      suppressNextClick();
      cancelPointer();
      return;
    }
    const wasConsumed = gestureConsumed;
    const wasRepeating = repeat && (repeatTimer === null || repeatInterval !== null);
    clearGestureTimers();
    pointer = null;
    gestureConsumed = false;
    setPressed(false);
    suppressNextClick();
    if (!wasConsumed && !wasRepeating) void invoke("primary", event).catch(() => {});
  };

  const onPointerCancel = () => {
    gestureConsumed = false;
    suppressNextClick();
    cancelPointer();
  };

  const onClick = (event) => {
    if (fromNestedInteractive(event)) return;
    if (suppressClick) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      clearClickSuppression();
      return;
    }
    // Screen readers, voice control and element.click() dispatch click without
    // a preceding pointer or keyboard sequence. Treat click as a first-class
    // activation path instead of silently ignoring it.
    if (!primary || disabled()) return;
    void invoke("primary", event).catch(() => {});
  };

  const onKeyDown = (event) => {
    if (!primary || disabled() || event.repeat || fromNestedInteractive(event)) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setPressed(true);
  };

  const onKeyUp = (event) => {
    if (!primary || disabled() || fromNestedInteractive(event)) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setPressed(false);
    suppressNextClick();
    void invoke("primary", event).catch(() => {});
  };

  element.addEventListener("pointerdown", onPointerDown, { passive: true });
  element.addEventListener("pointermove", onPointerMove, { passive: true });
  element.addEventListener("pointerup", onPointerUp, { passive: true });
  element.addEventListener("pointercancel", onPointerCancel, { passive: true });
  element.addEventListener("lostpointercapture", onPointerCancel, { passive: true });
  element.addEventListener("click", onClick, true);
  element.addEventListener("keydown", onKeyDown);
  element.addEventListener("keyup", onKeyUp);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    clearGestureTimers();
    clearTimeout(errorTimer);
    clearTimeout(suppressClickTimer);
    errorTimer = null;
    suppressClickTimer = null;
    signal?.removeEventListener?.("abort", destroy);
    pressedState = false;
    pending = 0;
    if (feedback) {
      element.removeAttribute?.("data-interaction-pressed");
      element.removeAttribute?.("data-interaction-pending");
      element.removeAttribute?.("data-interaction-error");
      element.setAttribute?.("aria-busy", "false");
    }
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerCancel);
    element.removeEventListener("lostpointercapture", onPointerCancel);
    element.removeEventListener("click", onClick, true);
    element.removeEventListener("keydown", onKeyDown);
    element.removeEventListener("keyup", onKeyUp);
  };
  signal?.addEventListener?.("abort", destroy, { once: true });

  return Object.freeze({
    element,
    destroy,
    get destroyed() { return destroyed; },
    invoke: (event) => invoke("primary", event),
  });
};

const createRequestCoalescer = (request, options = {}) => {
  if (typeof request !== "function") throw new TypeError("createRequestCoalescer requires a request function");
  let running = false;
  let queued = false;
  let latest;
  let destroyed = false;
  let sequence = 0;

  const drain = async () => {
    if (running || destroyed || !queued) return;
    running = true;
    while (!destroyed && queued) {
      queued = false;
      const value = latest;
      const current = ++sequence;
      try {
        await request(value, current);
        if (!destroyed) options.onSuccess?.(value, current);
      } catch (error) {
        if (!destroyed) options.onError?.(error, value, current);
        if (options.stopOnError) queued = false;
      }
    }
    running = false;
    if (!destroyed) options.onIdle?.();
  };

  return Object.freeze({
    request(value) {
      if (destroyed) return;
      latest = value;
      queued = true;
      void drain();
    },
    get pending() { return !destroyed && (running || queued); },
    get destroyed() { return destroyed; },
    destroy() {
      destroyed = true;
      queued = false;
    },
  });
};

const waitForEntityState = (hassOrProvider, entityId, predicate, options = {}) => {
  if (!entityId || typeof predicate !== "function") {
    return Promise.reject(new TypeError("waitForEntityState requires an entity and predicate"));
  }
  const provider = typeof hassOrProvider === "function" ? hassOrProvider : () => hassOrProvider;
  const timeout = Math.max(250, Number(options.timeout) || 9000);
  const interval = Math.max(40, Number(options.interval) || 160);
  const signal = options.signal;
  return new Promise((resolve, reject) => {
    let intervalId = null;
    let timeoutId = null;
    let settled = false;
    const cleanup = () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      signal?.removeEventListener?.("abort", abort);
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const abort = () => finish(reject, signal?.reason || new Error("State confirmation aborted"));
    const check = () => {
      const state = provider()?.states?.[entityId] ?? null;
      try {
        if (predicate(state?.state, state)) finish(resolve, state);
      } catch (error) {
        finish(reject, error);
      }
    };
    if (signal?.aborted) return abort();
    signal?.addEventListener?.("abort", abort, { once: true });
    intervalId = setInterval(check, interval);
    timeoutId = setTimeout(() => finish(reject, new Error("State confirmation timed out")), timeout);
    check();
  });
};

const interactionStyles = `
[data-interaction-pressed="true"] {
  transform: scale(.985);
  filter: brightness(.96);
  transition: transform var(--dashboard-transition-fast, 80ms) var(--dashboard-easing-standard, ease-out), filter var(--dashboard-transition-fast, 80ms) var(--dashboard-easing-standard, ease-out);
}
[data-interaction-pending="true"] {
  cursor: progress !important;
  opacity: .72;
  transition: opacity var(--dashboard-transition-standard, 120ms) var(--dashboard-easing-standard, ease-out);
}
[data-interaction-error="true"] {
  outline: 2px solid var(--error-color, #db4437) !important;
  outline-offset: 2px;
}
[data-ha-interaction-status="v2"] {
  position: fixed !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
@media (prefers-reduced-motion: reduce) {
  [data-interaction-pressed="true"], [data-interaction-pending="true"] {
    transition-duration: 0s !important;
  }
}
`;

Object.assign(interactionShared, {
  INTERACTION_DEFAULTS,
  createRequestCoalescer,
  interaction,
  interactionStyles,
  prefersReducedMotion: reducedMotion,
  waitForEntityState,
});
}

// Module: src/shared/lifecycle.js
{
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
}

// Module: src/shared/async-broker.js
{
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
}

// Module: src/shared/localisation.js
{
/** Home Assistant-aware locale, timezone and unit formatting. */
const localeShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const localeOf = (hass) => {
  const locale = hass?.locale?.language || navigator.language || "en-AU";
  return locale === "en" ? "en-AU" : locale;
};
const timeZoneOf = (hass) => hass?.config?.time_zone || undefined;
const numberFormat = (hass, value, options = {}) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat(localeOf(hass), options).format(number)
    : "—";
};
const formatPower = (hass, value, options = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const absolute = options.absolute ? Math.abs(number) : number;
  if (Math.abs(absolute) >= 1000) {
    return `${numberFormat(hass, absolute / 1000, { maximumFractionDigits: 1 })} kW`;
  }
  return `${numberFormat(hass, Math.round(absolute), { maximumFractionDigits: 0 })} W`;
};
const formatEnergy = (hass, value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${numberFormat(hass, number, { maximumFractionDigits: Math.abs(number) < 1 ? 2 : 1 })} kWh`;
};
const formatDate = (hass, value, options) => new Intl.DateTimeFormat(
  localeOf(hass), { timeZone: timeZoneOf(hass), ...options },
).format(new Date(value));
const formatCalendarDay = (hass, value, options = {}) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return "—";
  return formatDate(hass, Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12), {
    timeZone: "UTC", ...options,
  });
};
const calendarDayRange = (hass, value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3]);
  const zone = timeZoneOf(hass);
  if (!zone) {
    const start = new Date(year, month, day).getTime();
    return { start, end: new Date(year, month, day + 1).getTime() };
  }
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const instantFor = (targetYear, targetMonth, targetDay) => {
    const target = Date.UTC(targetYear, targetMonth, targetDay);
    let instant = target;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
      const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
      instant += target - represented;
    }
    return instant;
  };
  return {
    start: instantFor(year, month, day),
    end: instantFor(year, month, day + 1),
  };
};
const formatTime = (hass, value, options = {}) => formatDate(hass, value, {
  hour: "numeric", minute: "2-digit", ...options,
});

Object.assign(localeShared, {
  calendarDayRange,
  formatDate,
  formatCalendarDay,
  formatEnergy,
  formatPower,
  formatTime,
  localeOf,
  numberFormat,
  timeZoneOf,
});
}

// Module: src/shared/apple-tv-runtime.js
{
/** Pure capability and presentation model for Apple TV components. */
const appleShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const APPLE_TV_INVALID_STATES = new Set(["unknown", "unavailable", "none", ""]);
const APPLE_TV_FEATURES = Object.freeze({
  PAUSE: 1,
  MUTE: 8,
  PREVIOUS: 16,
  NEXT: 32,
  PLAY: 512,
  STEP_VOLUME: 1024,
  SOURCE: 2048,
  STOP: 4096,
});
const APPLE_TV_NAV = Object.freeze([
  ["up", "Up", "mdi:chevron-up"],
  ["left", "Left", "mdi:chevron-left"],
  ["select", "Select", "mdi:circle-outline"],
  ["right", "Right", "mdi:chevron-right"],
  ["down", "Down", "mdi:chevron-down"],
  ["menu", "Menu", "mdi:keyboard-return"],
  ["home", "Home", "mdi:home-variant-outline"],
  ["top_menu", "Top menu", "mdi:format-list-bulleted"],
]);
const APPLE_TV_APP_ICONS = Object.freeze([
  [/netflix/i, "mdi:netflix"],
  [/youtube/i, "mdi:youtube"],
  [/spotify/i, "mdi:spotify"],
  [/prime video|amazon/i, "mdi:amazon"],
  [/plex/i, "mdi:plex"],
  [/twitch/i, "mdi:twitch"],
  [/vlc/i, "mdi:vlc"],
  [/apple tv|apple music|music/i, "mdi:apple"],
  [/disney/i, "mdi:castle"],
  [/kayo|sport/i, "mdi:soccer"],
  [/binge|stan|paramount|movie/i, "mdi:movie-open-play-outline"],
]);

const appleTvLabel = (value) => String(value || "")
  .replaceAll("_", " ")
  .replace(/^./, (letter) => letter.toUpperCase());
const appleTvDomain = (entityId) => String(entityId || "").split(".")[0];
const appleTvValid = (state) => Boolean(
  state && !APPLE_TV_INVALID_STATES.has(String(state.state).toLowerCase()),
);
const appleTvSupported = (state, feature) => Boolean(
  (Number(state?.attributes?.supported_features) || 0) & feature,
);
const appleTvAppIcon = (source, configured = {}) => {
  const override = configured?.[source];
  if (typeof override === "string" && override.trim()) return override.trim();
  return APPLE_TV_APP_ICONS.find(([pattern]) => pattern.test(source))?.[1] || "mdi:application-outline";
};

const appleTvDemoState = (entityId) => {
  if (entityId === "remote.demo_apple_tv") {
    return {
      state: "on",
      attributes: {
        supported_commands: APPLE_TV_NAV.map(([command]) => command).concat(["wakeup", "suspend"]),
      },
    };
  }
  if (entityId === "binary_sensor.demo_apple_tv_keyboard_focus") return { state: "off", attributes: {} };
  return {
    state: "playing",
    attributes: {
      friendly_name: "Apple TV 4K",
      source: "Netflix",
      source_list: ["Netflix", "YouTube", "Apple TV", "Disney+", "Prime Video", "Spotify"],
      volume_level: 0.42,
      supported_features: APPLE_TV_FEATURES.PAUSE |
        APPLE_TV_FEATURES.PLAY |
        APPLE_TV_FEATURES.MUTE |
        APPLE_TV_FEATURES.STEP_VOLUME |
        APPLE_TV_FEATURES.SOURCE |
        APPLE_TV_FEATURES.PREVIOUS |
        APPLE_TV_FEATURES.NEXT |
        APPLE_TV_FEATURES.STOP,
    },
  };
};

const appleTvDiscovery = (config, registry, hass) => {
  if (config?.demo) {
    return {
      media: config.entity,
      remote: "remote.demo_apple_tv",
      keyboard: "binary_sensor.demo_apple_tv_keyboard_focus",
      configEntryId: "demo",
    };
  }
  const shared = globalThis.__homeDashboardV2?.appleTvRegistry?.(
    config?.entity, registry, hass, { deviceId: config?.device_id },
  );
  if (shared) {
    return {
      media: config?.entity,
      remote: shared.remoteEntityId,
      keyboard: shared.keyboardEntityId,
      configEntryId: shared.configEntryId,
    };
  }
  const all = registry?.entities || [];
  const mediaEntry = all.find((entry) => entry.entity_id === config?.entity);
  const siblings = mediaEntry?.device_id ? registry?.byDevice?.get(mediaEntry.device_id) || [] : [];
  const usable = (entry) => entry && !entry.disabled_by && !entry.hidden_by &&
    (entry.platform === "apple_tv" || entry.config_entry_id === mediaEntry?.config_entry_id);
  const remote = siblings.find((entry) => usable(entry) && appleTvDomain(entry.entity_id) === "remote");
  const keyboard = siblings.find((entry) => usable(entry) &&
    appleTvDomain(entry.entity_id) === "binary_sensor" &&
    /keyboard.*focus|focus.*keyboard/i.test(`${entry.entity_id} ${entry.name || ""} ${entry.original_name || ""}`));
  return {
    media: config?.entity,
    remote: remote?.entity_id || null,
    keyboard: keyboard?.entity_id || null,
    configEntryId: mediaEntry?.config_entry_id || remote?.config_entry_id || keyboard?.config_entry_id || null,
  };
};

const appleTvModel = (hass, config, registry) => {
  const entities = appleTvDiscovery(config, registry, hass);
  const state = (entityId) => entityId
    ? (hass?.states?.[entityId] ?? (config?.demo ? appleTvDemoState(entityId) : null))
    : null;
  const media = state(entities.media), remote = state(entities.remote), keyboard = state(entities.keyboard);
  const raw = String(media?.state || "unknown").toLowerCase();
  const available = appleTvValid(media);
  const sleeping = available && ["off", "standby"].includes(raw);
  const awake = available && !sleeping;
  const attrs = media?.attributes || {};
  const commands = Array.isArray(remote?.attributes?.supported_commands)
    ? new Set(remote.attributes.supported_commands)
    : null;
  const remoteUsable = appleTvValid(remote);
  const remoteCan = (command) => remoteUsable && (!commands || commands.has(command));
  const level = Number(attrs.volume_level);
  const hasLevel = Number.isFinite(level) && level >= 0 && level <= 1;
  const playing = awake && raw === "playing";
  const paused = awake && raw === "paused";
  const idle = awake && ["idle", "on", "buffering"].includes(raw);
  const sources = Array.isArray(attrs.source_list)
    ? [...new Set(attrs.source_list
      .filter((source) => typeof source === "string")
      .map((source) => source.trim())
      .filter(Boolean))]
    : [];
  const keyboardFocused = awake && appleTvValid(keyboard) && String(keyboard.state).toLowerCase() === "on";

  return Object.freeze({
    entities,
    media,
    remote,
    available,
    awake,
    sleeping,
    playing,
    paused,
    idle,
    sources,
    currentSource: attrs.app_name || attrs.source || null,
    level: hasLevel ? level : null,
    muted: attrs.is_volume_muted === true,
    canWake: sleeping && remoteCan("wakeup"),
    canSleep: awake && remoteCan("suspend"),
    canNavigate: awake && remoteUsable && APPLE_TV_NAV.some(([command]) => remoteCan(command)),
    canPlay: awake && (paused || idle) && appleTvSupported(media, APPLE_TV_FEATURES.PLAY),
    canPause: playing && appleTvSupported(media, APPLE_TV_FEATURES.PAUSE),
    canStop: (playing || paused) && appleTvSupported(media, APPLE_TV_FEATURES.STOP),
    canPrevious: (playing || paused) && appleTvSupported(media, APPLE_TV_FEATURES.PREVIOUS),
    canNext: (playing || paused) && appleTvSupported(media, APPLE_TV_FEATURES.NEXT),
    canVolumeUp: awake && appleTvSupported(media, APPLE_TV_FEATURES.STEP_VOLUME),
    canVolumeDown: awake && appleTvSupported(media, APPLE_TV_FEATURES.STEP_VOLUME),
    canMute: awake && appleTvSupported(media, APPLE_TV_FEATURES.MUTE),
    canSelectSource: awake && sources.length > 0 && appleTvSupported(media, APPLE_TV_FEATURES.SOURCE),
    keyboardFocused,
    canSetKeyboardText: keyboardFocused && Boolean(entities.configEntryId),
    canAppendKeyboardText: keyboardFocused && Boolean(entities.configEntryId),
    canClearKeyboardText: keyboardFocused && Boolean(entities.configEntryId),
    status: !available
      ? raw === "unknown" ? "Status unknown" : "Apple TV unavailable"
      : [
        sleeping ? "Sleeping" : playing ? "Playing" : paused ? "Paused" : idle ? "Idle" : appleTvLabel(raw),
        attrs.app_name || attrs.source,
      ].filter(Boolean).join(" · "),
  });
};

Object.assign(appleShared, {
  APPLE_TV_FEATURES,
  APPLE_TV_NAV,
  appleTvAppIcon,
  appleTvDiscovery,
  appleTvLabel,
  appleTvModel,
  appleTvSupported,
  appleTvValid,
});
}

// Module: src/shared/registry-cache.js
{
/** Shared read-only registry cache for room-aware components. */
const DASHBOARD_REGISTRY_CACHE=new WeakMap();
const loadDashboardRegistries=connection=>{
  if(!connection||!connection.sendMessagePromise)return Promise.resolve({areas:[],devices:[],entities:[]});
  let cached=DASHBOARD_REGISTRY_CACHE.get(connection);
  if(!cached){
    cached=Promise.all([
      connection.sendMessagePromise({type:"config/area_registry/list"}),
      connection.sendMessagePromise({type:"config/device_registry/list"}),
      connection.sendMessagePromise({type:"config/entity_registry/list"})
    ]).then(values=>({
      areas:Array.isArray(values[0])?values[0]:[],
      devices:Array.isArray(values[1])?values[1]:[],
      entities:Array.isArray(values[2])?values[2]:[]
    })).catch(()=>({areas:[],devices:[],entities:[]}));
    DASHBOARD_REGISTRY_CACHE.set(connection,cached);
  }
  return cached;
};

Object.assign(globalThis.__HA_COMPONENT_LIBRARY_SHARED__, { loadDashboardRegistries });
}

// Module: src/shared/dashboard-style-tokens.js
{
/** Shared dashboard CSS custom properties, preserved verbatim. */
const DASHBOARD_SHARED_STYLE_ID="dashboard-shared-ui-tokens-v3";
let dashboardSharedStyle=document.getElementById(DASHBOARD_SHARED_STYLE_ID);
if(!dashboardSharedStyle){dashboardSharedStyle=document.createElement("style");dashboardSharedStyle.id=DASHBOARD_SHARED_STYLE_ID;document.head.append(dashboardSharedStyle)}
dashboardSharedStyle.textContent=":root{--dashboard-space-1:4px;--dashboard-space-2:8px;--dashboard-space-3:12px;--dashboard-space-4:16px;--dashboard-space-5:24px;--dashboard-control-height:44px;--dashboard-icon-size:22px;--dashboard-transition-fast:80ms;--dashboard-transition-standard:160ms;--dashboard-easing-standard:cubic-bezier(.2,0,0,1);--dashboard-focus-ring:2px solid var(--primary-color);--dashboard-focus-offset:2px;--dashboard-layer-popover:20;--dashboard-layer-overlay:1000;--dashboard-media-surface:#111;--dashboard-media-on-surface:#fff;--dashboard-radius-card:8px;--dashboard-radius-control:6px;--dashboard-radius-dialog:10px;--dashboard-radius-icon:0px;--dashboard-modal-scrim:rgba(0,0,0,.16);--dashboard-card-surface:var(--ha-card-background,var(--card-background-color));--dashboard-card-muted-surface:color-mix(in srgb,var(--primary-text-color) 3%,var(--card-background-color));--dashboard-card-border-color:color-mix(in srgb,var(--primary-text-color) 10%,transparent);--dashboard-card-border:1px solid var(--dashboard-card-border-color);--dashboard-active-surface:color-mix(in srgb,var(--primary-color) 7%,var(--card-background-color));--dashboard-warning-surface:color-mix(in srgb,var(--warning-color,#f9a825) 9%,var(--card-background-color));--dashboard-critical-surface:color-mix(in srgb,var(--error-color) 8%,var(--card-background-color));--dashboard-dialog-shadow:0 16px 48px rgba(0,0,0,.22);--ha-card-border-radius:var(--dashboard-radius-card);--ha-card-box-shadow:none;--ha-card-border-width:1px;--ha-card-border-color:var(--dashboard-card-border-color);--mush-card-border-radius:var(--dashboard-radius-card);--bubble-border-radius:var(--dashboard-radius-card);--bubble-main-background-color:var(--dashboard-card-surface);--bubble-secondary-background-color:transparent;--bubble-accent-color:var(--primary-color);--bubble-border:var(--dashboard-card-border);--bubble-icon-border-radius:var(--dashboard-radius-icon);--bubble-icon-background-color:transparent;--bubble-sub-button-border-radius:var(--dashboard-radius-control);--bubble-sub-button-background-color:transparent;--bubble-button-main-background-color:var(--dashboard-card-surface);--bubble-button-border-radius:var(--dashboard-radius-card);--bubble-button-icon-border-radius:var(--dashboard-radius-icon);--bubble-button-icon-background-color:transparent;--bubble-button-box-shadow:none;--bubble-media-player-border-radius:var(--dashboard-radius-card);--bubble-media-player-buttons-border-radius:var(--dashboard-radius-control);--bubble-media-player-buttons-background-color:transparent;--bubble-media-player-icon-border-radius:var(--dashboard-radius-icon);--bubble-media-player-icon-background-color:transparent;--bubble-cover-border-radius:var(--dashboard-radius-card);--bubble-cover-icon-border-radius:var(--dashboard-radius-icon);--bubble-cover-icon-background-color:transparent;--bubble-select-border-radius:var(--dashboard-radius-card);--bubble-select-button-border-radius:var(--dashboard-radius-control);--bubble-select-button-background-color:transparent;--bubble-select-icon-border-radius:var(--dashboard-radius-icon);--bubble-select-icon-background-color:transparent;--bubble-climate-border-radius:var(--dashboard-radius-card);--bubble-climate-icon-border-radius:var(--dashboard-radius-icon);--bubble-climate-button-background-color:transparent;--bubble-calendar-border-radius:var(--dashboard-radius-card);--bubble-pop-up-border-radius:var(--dashboard-radius-dialog);--bubble-pop-up-main-background-color:var(--card-background-color);--bubble-pop-up-box-shadow:var(--dashboard-dialog-shadow);--bubble-backdrop-background-color:var(--dashboard-modal-scrim);--ha-dialog-scrim-color:var(--dashboard-modal-scrim)}@media(max-width:700px){:root{--dashboard-radius-dialog:8px}}@media(prefers-reduced-motion:reduce){:root{--dashboard-transition-fast:0ms;--dashboard-transition-standard:0ms}}";
}

// Module: src/shared/split-system-registry.js
{
/** Shared split-system registry backed by the HA Component Backend integration. */
const SPLIT_REGISTRY_ENTITY="sensor.ha_component_backend";
const splitV4ObjectId=entityId=>String(entityId||"").split(".")[1]||"";
const splitV4RoomId=identity=>{
  const parts=identity.split("_");
  for(let index=1;index<parts.length;index++){
    const candidate=parts.slice(0,index).join("_");
    if(`${candidate}_${candidate}`===identity)return candidate;
  }
  return identity;
};
const splitV4IdentityFromClimate=entityId=>{
  const objectId=splitV4ObjectId(entityId);
  return objectId.endsWith("_split_climate")?objectId.slice(0,-"_split_climate".length):null;
};
const splitV4Room=(roomId,room)=>room&&room.climate?{
  room_id:roomId,
  registry_entity:SPLIT_REGISTRY_ENTITY,
  climate:room.climate,
  controller_entity:room.controller,
  vertical_vane_entity:room.vertical_vane,
  horizontal_vane_entity:room.horizontal_vane,
  area_id:roomId,
  minimum_target:room.minimum_target,
  maximum_target:room.maximum_target,
  fan_ceiling:room.fan_ceiling,
  last_mode:room.last_mode,
  deadline:room.deadline,
  profiles:Array.isArray(room.profiles)?room.profiles:[]
}:null;
const splitV4HardwareRoom=entityId=>{
  const identity=splitV4IdentityFromClimate(entityId);
  if(!identity)return null;
  const roomId=splitV4RoomId(identity);
  const controllerBase=`${identity}_split`;
  return{
    room_id:roomId,
    registry_entity:SPLIT_REGISTRY_ENTITY,
    climate:entityId,
    controller_entity:`binary_sensor.${controllerBase}_controller_status`,
    vertical_vane_entity:`select.${controllerBase}_vertical_vane`,
    horizontal_vane_entity:`select.${controllerBase}_horizontal_vane`,
    minimum_target:null,
    maximum_target:null,
    fan_ceiling:null,
    last_mode:null,
    deadline:null,
    profiles:[]
  };
};
const splitV4ClaimsRoomEntity=(entityId,entry)=>{
  if(String(entityId).split(".")[0]==="climate")return false;
  const objectId=splitV4ObjectId(entityId),identity=splitV4IdentityFromClimate(entry.climate);
  return[entry.room_id,identity].filter(Boolean).some(prefix=>objectId.startsWith(`${prefix}_split_`));
};
const buildSplitV4Registry=hass=>{
  const source=hass?.states?.[SPLIT_REGISTRY_ENTITY],rooms=source?.attributes?.rooms,systems=new Map,claimed=new Set;
  source?.entity_id&&claimed.add(source.entity_id);
  if(rooms&&typeof rooms==="object")for(const[roomId,room]of Object.entries(rooms)){
    const entry=splitV4Room(roomId,room);
    if(entry)systems.set(entry.climate,entry);
  }
  for(const entityId of Object.keys(hass?.states??{})){
    if(systems.has(entityId))continue;
    const entry=splitV4HardwareRoom(entityId);
    if(!entry)continue;
    systems.set(entry.climate,entry);
  }
  for(const entry of systems.values()){
    for(const entityId of[entry.climate,entry.controller_entity,entry.vertical_vane_entity,entry.horizontal_vane_entity].filter(Boolean))claimed.add(entityId);
  }
  for(const entityId of Object.keys(hass?.states??{})){
    for(const entry of systems.values())if(splitV4ClaimsRoomEntity(entityId,entry)){claimed.add(entityId);break;}
  }
  return{systems,claimed,error:null};
};
const splitV4RegistrySignature=registry=>JSON.stringify([[...registry.systems].sort(([left],[right])=>left.localeCompare(right)),[...registry.claimed].sort()]);
globalThis.__componentSplitRegistryV4??={
  result:{systems:new Map,claimed:new Set,error:null},
  subscribers:new Set,
  eventSubscription:null,
  load(hass,force=false){
    const previous=this.result,next=buildSplitV4Registry(hass);
    this.result=next;
    if(force||splitV4RegistrySignature(previous)!==splitV4RegistrySignature(next))for(const subscriber of[...this.subscribers])try{subscriber(next)}catch{}
    return Promise.resolve(next);
  },
  refresh(hass){return this.load(hass)},
  ensureEvents(hass){
    if(this.eventSubscription||!hass?.connection?.subscribeEvents)return;
    this.eventSubscription=hass.connection.subscribeEvents(event=>{
      event?.data?.entity_id===SPLIT_REGISTRY_ENTITY&&this.refresh(hass);
    },"state_changed").catch(()=>{this.eventSubscription=null});
  },
  subscribe(hass,subscriber){
    const signature=splitV4RegistrySignature(this.result);
    this.subscribers.add(subscriber),this.ensureEvents(hass),this.load(hass).then(result=>{
      this.subscribers.has(subscriber)&&signature===splitV4RegistrySignature(result)&&subscriber(result);
    });
    return()=>{this.subscribers.delete(subscriber)};
  }
};
}

// Module: src/shared/dashboard-runtime.js
{
/** Shared dashboard registry/runtime used by entity-aware controllers. */
const { escapeHtml } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
globalThis.__homeDashboardV2??={};
const HD2=globalThis.__homeDashboardV2;
HD2.esc=escapeHtml;
HD2.domain=id=>String(id||'').split('.')[0];
HD2.label=v=>String(v??'').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
HD2.stateName=(h,e,s)=>e?.name||e?.original_name||s?.attributes?.friendly_name||e?.entity_id||'Control';
HD2.icon=(e,s)=>s?.attributes?.icon||({light:'mdi:lightbulb-outline',fan:'mdi:fan',switch:'mdi:toggle-switch-outline',input_boolean:'mdi:toggle-switch-outline',media_player:'mdi:play-circle-outline',climate:'mdi:thermostat',cover:'mdi:window-shutter',lock:'mdi:lock-outline',vacuum:'mdi:robot-vacuum',button:'mdi:gesture-tap-button',select:'mdi:format-list-bulleted',number:'mdi:tune-variant',binary_sensor:'mdi:alert-circle-outline',todo:'mdi:format-list-checks'}[HD2.domain(e?.entity_id)]||'mdi:gesture-tap-button');
HD2.validState=s=>Boolean(s&&!['unknown','unavailable'].includes(String(s.state).toLowerCase()));
HD2.prefs=async(h,key)=>{if(!h||!key)return{order:[],hidden:[]};try{return(await h.callWS({type:'frontend/get_user_data',key}))?.value||{order:[],hidden:[]}}catch{return{order:[],hidden:[]}}};
HD2.savePrefs=(h,key,value)=>h.callWS({type:'frontend/set_user_data',key,value});
HD2.applyPrefs=(items,prefs)=>{const by=new Map(items.map(x=>[x.id,x])),seen=new Set,all=[];for(const id of prefs?.order||[]){const x=by.get(id);if(x){all.push(x);seen.add(id)}}for(const x of items)if(!seen.has(x.id))all.push(x);const hidden=new Set(prefs?.hidden||[]);return{all,visible:all.filter(x=>!hidden.has(x.id)),hidden}};
HD2.REG??={connection:null,hass:null,data:null,promise:null,subs:new Set,unsubs:null,retry:null,attach(h){const c=h?.connection||null;if(this.connection===c){this.hass=h;return}this.detach();this.connection=c;this.hass=h;this.listen()},detach(){const p=this.unsubs;this.unsubs=null;p&&Promise.resolve(p).then(f=>f?.()).catch(()=>{});clearTimeout(this.retry);this.retry=null;this.connection=null;this.data=null;this.promise=null},listen(){const c=this.connection;if(!c?.subscribeEvents||this.unsubs)return;const p=Promise.all(['area_registry_updated','device_registry_updated','entity_registry_updated'].map(t=>c.subscribeEvents(()=>this.refresh(),t))).then(a=>()=>a.forEach(f=>f?.()));this.unsubs=p;p.catch(()=>{if(this.unsubs===p)this.unsubs=null;if(this.connection&&!this.retry)this.retry=setTimeout(()=>{this.retry=null;this.listen()},30000)})},async load(h,force=false){this.attach(h);if(this.data&&!force)return this.data;if(this.promise)return this.promise;const c=h?.connection;if(!c?.sendMessagePromise)return{areas:[],devices:[],entities:[],dashboards:[],deviceArea:new Map,byDevice:new Map,areaMap:new Map};this.promise=Promise.all([c.sendMessagePromise({type:'config/area_registry/list'}),c.sendMessagePromise({type:'config/device_registry/list'}),c.sendMessagePromise({type:'config/entity_registry/list'}),h.callWS({type:'lovelace/dashboards/list'}).catch(()=>[])]).then(([areas,devices,entities,dashboards])=>{areas=Array.isArray(areas)?areas:[];devices=Array.isArray(devices)?devices:[];entities=Array.isArray(entities)?entities:[];dashboards=Array.isArray(dashboards)?dashboards:[];const deviceArea=new Map(devices.map(d=>[d.id,d.area_id||null])),byDevice=new Map;for(const e of entities){if(!e?.device_id)continue;const a=byDevice.get(e.device_id)||[];a.push(e);byDevice.set(e.device_id,a)}return this.data={areas,devices,entities,dashboards,deviceArea,byDevice,areaMap:new Map(areas.map(a=>[a.area_id,a]))}}).catch(()=>this.data||{areas:[],devices:[],entities:[],dashboards:[],deviceArea:new Map,byDevice:new Map,areaMap:new Map}).finally(()=>{this.promise=null});return this.promise},refresh(){if(!this.hass)return;this.data=null;this.promise=null;this.load(this.hass,true).then(d=>{for(const f of [...this.subs])try{f(d)}catch{}})},subscribe(h,fn){this.attach(h);this.subs.add(fn);this.load(h).then(fn);return()=>this.subs.delete(fn)}};
HD2.areaOf=(e,d)=>e?.area_id||(e?.device_id?d?.deviceArea?.get(e.device_id):null)||null;

// Registry updates commonly arrive as a small burst of area, device and entity events.
// Keep one refresh in flight, then run one final pass only when an event arrived during it.
const dashboardRegistry = HD2.REG;
if (dashboardRegistry && !dashboardRegistry.__refreshCoalescingV1) {
  dashboardRegistry.__refreshCoalescingV1 = true;
  dashboardRegistry.refreshPromise = null;
  dashboardRegistry.refreshQueued = false;
  const originalDetach = dashboardRegistry.detach;
  dashboardRegistry.detach = function detachDashboardRegistry() {
    this.refreshPromise = null;
    this.refreshQueued = false;
    return originalDetach.call(this);
  };
  dashboardRegistry.refresh = function refreshDashboardRegistry() {
    if (!this.hass) return Promise.resolve(this.data);
    if (this.refreshPromise) {
      this.refreshQueued = true;
      return this.refreshPromise;
    }

    const hass = this.hass;
    const loadFresh = () => {
      if (this.hass !== hass) return this.data;
      this.data = null;
      this.promise = null;
      return this.load(hass, true);
    };
    const pending = this.promise
      ? Promise.resolve(this.promise).catch(() => {}).then(loadFresh)
      : loadFresh();
    let refreshPromise;
    refreshPromise = Promise.resolve(pending)
      .then((data) => {
        if (this.hass === hass) {
          for (const subscriber of [...this.subs]) {
            try { subscriber(data); } catch {}
          }
        }
        return data;
      })
      .finally(() => {
        if (this.refreshPromise !== refreshPromise) return;
        this.refreshPromise = null;
        if (this.refreshQueued) {
          this.refreshQueued = false;
          this.refresh();
        }
      });
    this.refreshPromise = refreshPromise;
    return refreshPromise;
  };
}
HD2.uiEntry=e=>Boolean(e?.entity_id&&!e.disabled_by&&!e.hidden_by&&!['diagnostic','config'].includes(e.entity_category));
HD2.card=async(h,c)=>{const helpers=await window.loadCardHelpers();const x=helpers.createCardElement(c);x.hass=h;return x};
HD2.controlDomains=new Set(['light','fan','switch','input_boolean','media_player','climate','cover','lock','vacuum','button','select','number']);
HD2.isPotential=(e,s)=>HD2.uiEntry(e)&&(HD2.controlDomains.has(HD2.domain(e.entity_id))||(HD2.domain(e.entity_id)==='binary_sensor'&&s?.attributes?.device_class==='garage_door'));
HD2.isActive=(e,s)=>{if(!HD2.uiEntry(e)||!s)return false;const d=HD2.domain(e.entity_id),st=s.state,a=s.attributes||{};if(['light','fan','switch','input_boolean'].includes(d))return st==='on';if(d==='media_player'){if(['playing','paused','buffering','on'].includes(st))return true;if(st==='idle'){const v=String(a.media_title||a.app_name||'');return Boolean(v&&!/^(idle|home(?: screen)?|default media receiver)$/i.test(v))}return false}if(d==='climate')return /^(heat|cool|heat_cool|auto|dry|fan_only)$/.test(st);if(d==='cover')return /^(open|opening|closing)$/.test(st);if(d==='lock')return st==='unlocked';if(d==='vacuum')return /^(cleaning|returning)$/.test(st);if(d==='binary_sensor')return st==='on'&&/^(door|window|garage_door|smoke|moisture|gas)$/.test(a.device_class||'');return false};
HD2.garageControl=(e,d,h)=>{if(!e?.device_id)return null;const sib=d?.byDevice?.get(e.device_id)||[],buttons=sib.filter(x=>HD2.domain(x.entity_id)==='button'&&HD2.uiEntry(x)&&h.states[x.entity_id]);return buttons.find(x=>/trigger|operate|door/i.test(`${x.entity_id} ${x.name||''} ${x.original_name||''}`))?.entity_id||buttons[0]?.entity_id||null};
HD2.appleTvRegistry=(entityId,d,h,options={})=>{const entity=(d?.entities||[]).find(x=>x?.entity_id===entityId)||null,deviceId=entity?.device_id||options.deviceId||null,siblings=deviceId?(d?.byDevice?.get(deviceId)||[]):[],named=x=>`${x?.entity_id||''} ${x?.name||''} ${x?.original_name||''}`.toLowerCase(),isUi=x=>HD2.uiEntry(x)&&x?.entity_id&&!x.disabled_by,byDomain=domain=>siblings.filter(x=>isUi(x)&&HD2.domain(x.entity_id)===domain),mediaEntry=entity||byDomain('media_player').find(x=>x.entity_id===entityId)||null,remoteEntry=byDomain('remote').find(x=>x.platform==='apple_tv')||byDomain('remote')[0]||null,keyboardEntry=byDomain('binary_sensor').find(x=>/keyboard.*focus|focus.*keyboard/.test(named(x)))||null,configEntryId=mediaEntry?.config_entry_id||remoteEntry?.config_entry_id||keyboardEntry?.config_entry_id||entity?.config_entry_id||(Array.isArray((d?.devices||[]).find(x=>x.id===deviceId)?.config_entries)?(d.devices.find(x=>x.id===deviceId)?.config_entries||[])[0]:null)||null,signature=JSON.stringify([deviceId,configEntryId,siblings.map(x=>[x.entity_id,x.platform,x.disabled_by,x.hidden_by])]);return{entityId,deviceId,mediaEntry,remoteEntry,keyboardEntry,remoteEntityId:remoteEntry?.entity_id||null,keyboardEntityId:keyboardEntry?.entity_id||null,configEntryId,signature}};
HD2.appleTvBundle=(e,s,d,h)=>{if(HD2.domain(e?.entity_id)!=='media_player'||e?.platform!=='apple_tv')return null;const info=HD2.appleTvRegistry(e.entity_id,d,h,{deviceId:e.device_id});return{type:'custom:component-apple-tv-controller-v1',entity:e.entity_id,device_id:info?.deviceId||e.device_id||null,title:HD2.stateName(h,e,s),icon:'mdi:apple'}};
HD2.splitBundle=(e,d)=>{if(!e?.device_id||!d)return null;const siblings=d.byDevice?.get(e.device_id)||[],suffix=x=>String(x?.entity_id||'').split('.')[1]||'',find=(rows,domain,end)=>rows.find(x=>!x?.disabled_by&&HD2.domain(x.entity_id)===domain&&suffix(x).endsWith(end)),controller=find(siblings,'binary_sensor','_controller_status');if(!controller)return null;const vertical=find(siblings,'select','_vertical_vane'),horizontal=find(siblings,'select','_horizontal_vane');return{controller_entity:controller.entity_id,vertical_vane_entity:vertical?.entity_id,horizontal_vane_entity:horizontal?.entity_id,room_id:HD2.areaOf(e,d)}};HD2.splitRegistryConfig=(id,split)=>{const system=split?.systems?.get(id)||globalThis.__componentSplitRegistryV4?.result?.systems?.get(id);return system?{type:'custom:component-split-controller-v4',entity:id,room_id:system.room_id,registry_entity:system.registry_entity,controller_entity:system.controller_entity,vertical_vane_entity:system.vertical_vane_entity,horizontal_vane_entity:system.horizontal_vane_entity,minimum_target:system.minimum_target,maximum_target:system.maximum_target,fan_ceiling:system.fan_ceiling,last_mode:system.last_mode,deadline:system.deadline,profiles:system.profiles}:null};HD2.controlConfig=(e,s,d,h,split)=>{const id=e.entity_id,dom=HD2.domain(id),registry=dom==='climate'?HD2.splitRegistryConfig(id,split):null,bundle=!registry&&dom==='climate'?HD2.splitBundle(e,d):null;if(registry)return registry;if(bundle)return{type:'custom:component-split-controller-v4',entity:id,...bundle};if(dom==='binary_sensor'&&s?.attributes?.device_class==='garage_door'){const b=HD2.garageControl(e,d,h);return b?{type:'custom:component-garage-door-controller-v1',title:HD2.stateName(h,e,s).replace(/ Garage Door Status$/i,''),entity:id,control_entity:b}:{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true}}if(['light','fan','number'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'slider',entity:id,show_state:true,tap_action:{action:'more-info'}};if(['switch','input_boolean'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'switch',entity:id,show_state:true,button_action:{tap_action:{action:'toggle'}},tap_action:{action:'more-info'}};if(dom==='media_player')return HD2.appleTvBundle(e,s,d,h)||{type:'custom:bubble-card',card_type:'media-player',entity:id,show_state:true,tap_action:{action:'more-info'}};if(dom==='climate')return{type:'custom:bubble-card',card_type:'climate',entity:id,show_state:true};if(dom==='cover')return{type:'custom:bubble-card',card_type:'cover',entity:id,show_state:true};if(dom==='lock')return{type:'custom:mushroom-lock-card',entity:id};if(dom==='vacuum')return{type:'custom:mushroom-vacuum-card',entity:id};if(dom==='select')return{type:'custom:mushroom-select-card',entity:id};if(dom==='button')return{type:'custom:mushroom-entity-card',entity:id,tap_action:{action:'perform-action',perform_action:'button.press',target:{entity_id:id},confirmation:{text:'Run this control?'}},hold_action:{action:'more-info'}};if(dom==='binary_sensor')return{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true,show_last_changed:false};return null};
class DashboardPreferenceEditorV2 extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});this.built=false}open(o){this.o=o;this.items=o.items.map(x=>({...x}));const ids=new Set(this.items.map(x=>x.id));this.hidden=new Set((o.hidden||[]).filter(id=>ids.has(id)));this.build();this.render();this.d.showModal();queueMicrotask(()=>this.shadowRoot.querySelector('.x')?.focus())}build(){if(this.built)return;this.built=true;this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box}dialog{width:min(580px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 24px));border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,8px);padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.hd{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--divider-color)}h2{font-size:20px;margin:0}.x,.move,.vis{width:44px;height:44px;border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center}.x{border:1px solid var(--divider-color)}.body{padding:12px 14px 92px}.copy{font-size:13px;color:var(--secondary-text-color);line-height:1.4;margin:0 2px 10px}.rows{display:grid;gap:7px}.row{min-height:58px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 6px}.row.off{opacity:.58}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--primary-color)}.name{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{font-size:12px;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acts{display:flex}.move[disabled]{opacity:.25}.vis.off{color:var(--error-color)}.ft{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color)}.count{font-size:13px;color:var(--secondary-text-color)}.buttons{display:flex;gap:8px}.cancel,.save{min-height:44px;padding:0 13px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,6px);background:transparent;font-weight:650}.save{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:transparent}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><dialog><div class="hd"><h2></h2><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><div class="copy"></div><div class="rows"></div></div><div class="ft"><span class="count"></span><span class="buttons"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save</button></span></div></dialog>`;this.d=this.shadowRoot.querySelector('dialog');this.d.addEventListener('click',e=>{if(e.target===this.d)this.d.close()});this.shadowRoot.querySelector('.x').onclick=()=>this.d.close();this.shadowRoot.querySelector('.cancel').onclick=()=>this.d.close();this.shadowRoot.querySelector('.save').onclick=()=>this.save()}render(){this.shadowRoot.querySelector('h2').textContent=this.o.title||'Edit';this.shadowRoot.querySelector('.copy').textContent=this.o.description||'Reorder items and hide anything you do not want shown.';const rows=this.shadowRoot.querySelector('.rows');rows.replaceChildren();this.items.forEach((x,i)=>{const r=document.createElement('div'),off=this.hidden.has(x.id);r.className=`row ${off?'off':''}`;r.innerHTML=`<span class="ico"><ha-icon icon="${HD2.esc(x.icon||'mdi:circle-outline')}"></ha-icon></span><span><div class="name">${HD2.esc(x.name)}</div><div class="meta">${HD2.esc(x.meta||'')}</div></span><span class="acts"><button class="move up" type="button" aria-label="Move earlier" ${i===0?'disabled':''}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="move down" type="button" aria-label="Move later" ${i===this.items.length-1?'disabled':''}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="vis ${off?'off':''}" type="button" aria-label="${off?'Show':'Hide'} ${HD2.esc(x.name)}"><ha-icon icon="mdi:${off?'eye-outline':'eye-off-outline'}"></ha-icon></button></span>`;r.querySelector('.up').onclick=()=>this.move(i,-1);r.querySelector('.down').onclick=()=>this.move(i,1);r.querySelector('.vis').onclick=()=>{off?this.hidden.delete(x.id):this.hidden.add(x.id);this.render()};rows.append(r)});this.shadowRoot.querySelector('.count').textContent=`${this.items.length-this.hidden.size} of ${this.items.length} shown`}move(i,d){const n=i+d;if(n<0||n>=this.items.length)return;[this.items[i],this.items[n]]=[this.items[n],this.items[i]];this.render()}async save(){const b=this.shadowRoot.querySelector('.save');b.disabled=true;b.textContent='Saving…';try{await this.o.onSave?.({order:this.items.map(x=>x.id),hidden:[...this.hidden]});this.d.close()}finally{b.disabled=false;b.textContent='Save'}}}
if(!customElements.get('dashboard-preference-editor-v2'))customElements.define('dashboard-preference-editor-v2',DashboardPreferenceEditorV2);
}

// Module: src/shared/registry-health.js
{
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
}

// Module: src/shared/wled-runtime.js
{
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
}

// Module: src/shared/update-styles.js
{
/** Shared Update card presentation styles, preserved verbatim. */
const UPDATE_CARD_STYLES = ":host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}";
Object.assign(globalThis.__HA_COMPONENT_LIBRARY_SHARED__, { UPDATE_CARD_STYLES });
}

// Module: src/support/split-settings.js
{
/** Advanced registry-backed settings panel used by ComponentSplitControllerV4. */
const SPLIT_SETTINGS_INVALID=new Set(["unknown","unavailable","none",""]);
class ComponentSplitSettingsV1 extends HTMLElement{
  constructor(){super(),this.attachShadow({mode:"open"}),this.t=!1,this.i=null,this.o=!1,this.h=null,this.l=null,this.u=null,this.p=null}
  setConfig(t){if(!t?.entity)throw new Error("Split settings requires entity");if(!t?.room_id)throw new Error("Split settings requires room_id");this.config={...t},clearTimeout(this.l),this.i=null,this.o=!1,this.h=null,this.u=null,this.p=null}
  set hass(t){this.m=t,this.t||this.v(),this._(),this.o||this.h||(this.i=this.k()),this.S()}
  disconnectedCallback(){clearTimeout(this.l),this.l=null,this.i=null,this.o=!1,this.h=null,this.u=null,this.p=null}
  focusInitial(){queueMicrotask(()=>this.shadowRoot.querySelector("button:not([disabled])")?.focus())}
  v(){this.t=!0,this.shadowRoot.innerHTML='<style>\n      :host{display:block;min-width:0}*{box-sizing:border-box}button{appearance:none;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer}button[disabled],button[aria-disabled=true]{opacity:.45;cursor:default}ha-icon{--mdc-icon-size:18px}.setting{padding:12px 0;border-top:1px solid var(--divider-color)}.setting:first-of-type{border-top:0;padding-top:0}.label{display:block;font-size:13px;font-weight:650;line-height:1.25}.hint{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.stepper{display:grid;grid-template-columns:44px minmax(88px,1fr) 44px;align-items:center;margin-top:10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;overflow:hidden}.stepper button{width:44px;height:44px;display:grid;place-items:center}.value{text-align:center;font-size:17px;font-weight:650;font-variant-numeric:tabular-nums}.fan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.fan button{min-height:48px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;display:grid;grid-template-columns:20px minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;font-size:13px;font-weight:600}.fan button[aria-checked=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}.fan .check{visibility:hidden}.fan button[aria-checked=true] .check{visibility:visible}.message{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.message:not(:empty){margin-top:10px}.message.error{color:var(--error-color)}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.actions button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.actions .save{color:var(--primary-color)}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}\n    </style>\n    <div class="setting"><span class="label">Minimum target</span><span class="hint">Lower target temperatures are corrected automatically.</span><div class="stepper min"><button type="button" data-adjust="min:-1" aria-label="Decrease minimum target"><ha-icon icon="mdi:minus"></ha-icon></button><span class="value"></span><button type="button" data-adjust="min:1" aria-label="Increase minimum target"><ha-icon icon="mdi:plus"></ha-icon></button></div></div>\n    <div class="setting"><span class="label">Maximum target</span><span class="hint">Higher target temperatures are corrected automatically.</span><div class="stepper max"><button type="button" data-adjust="max:-1" aria-label="Decrease maximum target"><ha-icon icon="mdi:minus"></ha-icon></button><span class="value"></span><button type="button" data-adjust="max:1" aria-label="Increase maximum target"><ha-icon icon="mdi:plus"></ha-icon></button></div></div>\n    <div class="setting"><span class="label">Fan ceiling</span><span class="hint">Auto remains available only when the fan is unrestricted.</span><div class="fan" role="radiogroup" aria-label="Fan ceiling"></div></div>\n    <p class="message" role="status" aria-live="polite"></p>\n    <div class="actions"><button class="reset" type="button">Reset defaults</button><button class="save" type="button">Save settings</button></div>',this.$={minValue:this.shadowRoot.querySelector(".min .value"),minDown:this.shadowRoot.querySelector('[data-adjust="min:-1"]'),minUp:this.shadowRoot.querySelector('[data-adjust="min:1"]'),maxValue:this.shadowRoot.querySelector(".max .value"),maxDown:this.shadowRoot.querySelector('[data-adjust="max:-1"]'),maxUp:this.shadowRoot.querySelector('[data-adjust="max:1"]'),fan:this.shadowRoot.querySelector(".fan"),message:this.shadowRoot.querySelector(".message"),reset:this.shadowRoot.querySelector(".reset"),save:this.shadowRoot.querySelector(".save")},this.shadowRoot.querySelectorAll("[data-adjust]").forEach(t=>{t.addEventListener("click",()=>{const[i,s]=t.dataset.adjust.split(":");this.T(i,Number(s))})}),this.$.reset.addEventListener("click",()=>this.A()),this.$.save.addEventListener("click",()=>this.I())}
  M(t){return this.m?.states?.[t]??null}
  j(t){if(null==t||""===t)return null;const i=Number(t);return Number.isFinite(i)?i:null}
  D(t){return Boolean(t&&!SPLIT_SETTINGS_INVALID.has(String(t.state).toLowerCase()))}
  k(){const t=this.M(this.config.entity);if(!this.D(t))return null;const i=this.j(t.attributes?.min_temp),s=this.j(t.attributes?.max_temp),e=this.j(t.attributes?.target_temp_step),n=this.j(this.config.minimum_target),a=this.j(this.config.maximum_target),o=this.config.fan_ceiling||"Quiet",r=["Quiet","Low","Medium","High","Unrestricted"];return[i,s,e,n,a].some(t=>null===t)||e<=0||i>=s||n<i||a>s||n>=a||!r.includes(o)?null:{min:n,max:a,fan:o,deviceMin:i,deviceMax:s,step:e,fanOptions:r}}
  _(){if(!this.h)return;const t=this.k();t&&Math.abs(t.min-this.h.min)<.001&&Math.abs(t.max-this.h.max)<.001&&t.fan===this.h.fan&&(clearTimeout(this.l),this.h=null,this.o=!1,this.i=t,this.u={text:"Settings saved.",type:"info"})}
  L(t){return`${Number.isInteger(t)?t:t.toFixed(1)}°`}
  T(t,i){if(!this.i||this.h)return;const s=Math.round(10*(this.i[t]+i*this.i.step))/10;"min"===t&&(s<this.i.deviceMin||s>=this.i.max)||"max"===t&&(s>this.i.deviceMax||s<=this.i.min)||(this.i[t]=s,this.o=!0,this.u=null,this.S())}
  N(t){this.i&&!this.h&&this.i.fanOptions.includes(t)&&(this.i.fan=t,this.o=!0,this.u=null,this.S())}
  U(t){if(this.h)return;if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(t.key))return;const i=[...this.$.fan.querySelectorAll("button:not([disabled])")];if(!i.length)return;t.preventDefault();const s=Math.max(0,i.indexOf(t.currentTarget)),e=["ArrowRight","ArrowDown"].includes(t.key)?1:-1,n=i["Home"===t.key?0:"End"===t.key?i.length-1:(s+e+i.length)%i.length];this.p=n.dataset.fanValue,this.N(n.dataset.fanValue)}
  A(){this.i&&!this.h&&(this.i.min=this.i.deviceMin,this.i.max=this.i.deviceMax,this.i.fan="Quiet",this.o=!0,this.u=null,this.S())}
  async I(){if(!this.i||!this.o||this.h)return;const t={min:this.i.min,max:this.i.max,fan:this.i.fan};this.h=t,this.u={text:"Saving settings…",type:"info"},this.S(),clearTimeout(this.l),this.l=setTimeout(()=>{this.h&&(this.h=null,this.o=!1,this.i=this.k(),this.u={text:"Home Assistant did not confirm the settings.",type:"error"},this.S())},8e3);try{await this.m.callService("ha_component_backend","update_room",{room_id:this.config.room_id,minimum_target:t.min,maximum_target:t.max,fan_ceiling:t.fan}),this.config={...this.config,minimum_target:t.min,maximum_target:t.max,fan_ceiling:t.fan},this._(),this.S()}catch{clearTimeout(this.l),this.h=null,this.o=!1,this.i=this.k(),this.u={text:"Could not save settings. Current values were reloaded.",type:"error"},this.S()}}
  C(t){return{Unrestricted:"mdi:fan-auto",High:"mdi:fan-speed-3",Medium:"mdi:fan-speed-2",Low:"mdi:fan-speed-1",Quiet:"mdi:volume-low"}[t]??"mdi:fan"}
  S(){const t=this.i,i=!t,s=Boolean(this.h),e=this.p;this.p=null,this.$.minValue.textContent=t?this.L(t.min):"Unavailable",this.$.maxValue.textContent=t?this.L(t.max):"Unavailable",this.$.minDown.disabled=i||t.min<=t.deviceMin,this.$.minUp.disabled=i||t.min+t.step>=t.max,this.$.maxDown.disabled=i||t.max-t.step<=t.min,this.$.maxUp.disabled=i||t.max>=t.deviceMax;for(const t of[this.$.minDown,this.$.minUp,this.$.maxDown,this.$.maxUp])t.setAttribute("aria-disabled",String(s||t.disabled));this.$.fan.replaceChildren();for(const[i,e]of(t?.fanOptions??[]).entries()){const n=document.createElement("button");n.type="button",n.dataset.fanValue=e,n.setAttribute("role","radio"),n.setAttribute("aria-checked",String(t.fan===e)),n.tabIndex=t.fan===e||!t.fan&&0===i?0:-1,n.setAttribute("aria-disabled",String(s));const a=document.createElement("ha-icon");a.setAttribute("icon",this.C(e));const o=document.createElement("span");o.textContent=e;const r=document.createElement("ha-icon");r.className="check",r.setAttribute("icon","mdi:check"),n.append(a,o,r),n.addEventListener("click",()=>this.N(e)),n.addEventListener("focus",()=>{this.p=e}),n.addEventListener("keydown",t=>this.U(t)),this.$.fan.append(n)}e&&queueMicrotask(()=>this.$.fan.querySelector(`[data-fan-value="${CSS.escape(e)}"]`)?.focus()),this.$.reset.disabled=i,this.$.reset.setAttribute("aria-disabled",String(i||s)),this.$.save.disabled=i,this.$.save.setAttribute("aria-disabled",String(i||!this.o||s)),this.$.save.textContent=s?"Saving…":"Save settings",this.$.message.textContent=i?"Settings are temporarily unavailable.":this.u?.text??"",this.$.message.classList.toggle("error",i||"error"===this.u?.type)}
}
customElements.get("component-split-settings-v1")||customElements.define("component-split-settings-v1",ComponentSplitSettingsV1);
}

// Module: src/support/device-aware-auto-entities.js
{
/** Device-aware Auto-Entities adapter used by dynamic dashboard collections. */
const DEVICE_AWARE_V4_TYPE="custom:component-split-controller-v4",DEVICE_AWARE_INNER_TYPE="custom:auto-entities",deviceAwareClone=t=>JSON.parse(JSON.stringify(t)),deviceAwareEscape=t=>String(t).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),deviceAwarePattern=t=>t.length?`/^(${t.map(deviceAwareEscape).join("|")})$/`:null;class ComponentDeviceAwareAutoEntitiesV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){
    super();this.attachShadow({mode:"open"});this.t=null;this.i=null;this.o=null;this.l=0;this._=!1;this.h=null;this.u=null;
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}.head{min-height:44px;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px;color:var(--primary-text-color)}.head[hidden]{display:none}.head ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.body{min-width:0}</style><div class="head" hidden><ha-icon></ha-icon><h2></h2></div><div class="body"></div>';
    this.g=this.shadowRoot.querySelector(".head");this.m=this.shadowRoot.querySelector(".body");
  }
  setConfig(t){
    if(!t?.filter)throw new Error("An Auto-Entities filter is required");
    this.t=deviceAwareClone(t);this.q();this._=!1;clearTimeout(this.h);this.h=null;this.l+=1;this.isConnected&&this.i&&this.p();
  }
  set hass(t){this.i=t;this.v();this.isConnected&&this.o&&(this.o.hass=t);this.isConnected&&!this._&&this.p()}
  connectedCallback(){this.v();!this._&&this.t&&this.i&&this.p()}
  disconnectedCallback(){clearTimeout(this.h);this.h=null;this.u?.();this.u=null;this.l+=1;this._=!1}
  q(){
    const header=this.t?.header,title=String(header?.title||"").trim();
    this.g.hidden=!title;
    if(title){this.g.querySelector("ha-icon").setAttribute("icon",header?.icon||"mdi:format-list-bulleted");this.g.querySelector("h2").textContent=title}
  }
  v(){
    const registry=globalThis.__componentSplitRegistryV4;
    this.isConnected&&!this.u&&this.i&&registry?.subscribe&&(this.u=registry.subscribe(this.i,()=>{this._=!1;this.p()}));
  }
  getCardSize(){return(this.o?.getCardSize?.()??1)+(this.g?.hidden?0:1)}
  getLayoutOptions(){return this.o?.getLayoutOptions?.()??{}}
  p(){
    if(!this.isConnected||!this.t||!this.i)return;
    this._=!0;const generation=++this.l,registry=globalThis.__componentSplitRegistryV4;
    registry?.load?registry.load(this.i).then(result=>{generation===this.l&&(result.error&&this.o?this.V():(this.A(this.S(result),generation),result.error&&this.V()))}):this.A(this.S(null),generation);
  }
  V(){
    clearTimeout(this.h);this.h=setTimeout(()=>{this.h=null;this._=!1;this.isConnected&&this.p()},31e3);
  }
  S(registry){
    const config=deviceAwareClone(this.t),excludeInvalid=false!==config.exclude_invalid_states;
    delete config.header;delete config.exclude_invalid_states;config.type="custom:auto-entities";
    const filter=config.filter??={},includes=Array.isArray(filter.include)?filter.include:[],excludes=Array.isArray(filter.exclude)?filter.exclude:[],
      regular=includes.filter(rule=>rule?.options?.type!==DEVICE_AWARE_V4_TYPE),
      systems=registry?[...registry.systems.keys()].sort():[],claimed=registry?[...registry.claimed].sort():[],
      systemsPattern=deviceAwarePattern(systems),claimedPattern=deviceAwarePattern(claimed),injected=[];
    if(systemsPattern){
      for(const rule of regular.filter(rule=>rule?.domain==="climate"&&rule?.options?.type==="custom:bubble-card")){
        for(const entityId of systems){
          const split={domain:"climate",entity_id:entityId};
          if(rule.area)split.area=rule.area;
          if(rule.state)split.state=rule.state;
          if(rule.not?.state)split.not={state:rule.not.state};
          split.options={type:DEVICE_AWARE_V4_TYPE,...rule.area?{title:"Split system"}:{}};
          injected.push(split);
        }
        rule.not={...rule.not??{},entity_id:systemsPattern};
      }
    }
    const climateIndex=regular.findIndex(rule=>rule?.domain==="climate");
    filter.include=climateIndex<0?regular:[...regular.slice(0,climateIndex),...injected,...regular.slice(climateIndex)];
    filter.exclude=[...excludes];
    if(claimedPattern)filter.exclude.push({entity_id:claimedPattern});
    if(excludeInvalid)for(const state of["unavailable","unknown"])if(!filter.exclude.some(rule=>rule?.state===state&&Object.keys(rule).length===1))filter.exclude.push({state});
    config.unique=!0;return config;
  }
  async A(config,generation){
    try{
      const needsSplit=config.filter?.include?.some(rule=>rule?.options?.type===DEVICE_AWARE_V4_TYPE);
      if(needsSplit&&!customElements.get("component-split-controller-v4"))await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error("Split controller did not load")),5e3);
        customElements.whenDefined("component-split-controller-v4").then(()=>{clearTimeout(timer);resolve()});
      });
      const helpers=await window.loadCardHelpers();if(generation!==this.l)return;
      const card=helpers.createCardElement(config);card.hass=this.i;this.o=card;this.m.replaceChildren(card);
    }catch{
      if(generation===this.l&&this.V(),!this.o&&generation===this.l){
        const alert=document.createElement("ha-alert");alert.setAttribute("alert-type","error");alert.textContent="Household controls are temporarily unavailable.";this.m.replaceChildren(alert);
      }
    }
  }
}
customElements.get("component-device-aware-auto-entities-v1")||customElements.define("component-device-aware-auto-entities-v1",ComponentDeviceAwareAutoEntitiesV1);
}

// Module: src/support/empty-state-v2.js
{
/** ComponentEmptyStateV2 — reusable Home Assistant dashboard card. */

const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEmptyStateV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:check-circle-outline',title:'Nothing requires attention',message:'Supporting empty-state message.',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}ha-card{border:0;background:transparent;box-shadow:none}.wrap{min-height:40px;padding:0 2px;display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;gap:8px}.icon{width:24px;height:24px;display:grid;place-items:center;background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:18px}.desc{margin-top:1px;font-size:12px;line-height:1.3}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.message)}</div></span></div></ha-card>`}}
registerCard({ type: "component-empty-state-v2", element: ComponentEmptyStateV2, name: "Empty State V2", description: "Reusable compact empty-state component." });
}

// Module: src/support/dashboard-preference-editor.js
{
class DashboardPreferenceEditorV3 extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});this.built=false;this.hiddenIds=new Set}open(o){this.o=o;this.items=o.items.map(x=>({...x}));const ids=new Set(this.items.map(x=>x.id));this.hiddenIds=new Set((o.hidden||[]).filter(id=>ids.has(id)));this.build();this.render();this.d.showModal();queueMicrotask(()=>this.shadowRoot.querySelector('.x')?.focus())}build(){if(this.built)return;this.built=true;this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box}dialog{width:min(560px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,8px);padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.hd{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--divider-color);background:var(--card-background-color)}h2{font-size:16px;line-height:1.2;font-weight:500;margin:0}.x,.move,.vis{width:44px;height:44px;border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center;color:var(--secondary-text-color)}.x ha-icon,.move ha-icon,.vis ha-icon{--mdc-icon-size:17px}.body{padding:12px 14px 88px}.copy{font-size:12px;color:var(--secondary-text-color);line-height:1.45;margin:0 2px 10px}.rows{display:grid;gap:7px}.row{min-height:56px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 6px}.row.off{opacity:.52}.ico{width:32px;height:32px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:18px}.name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{font-size:12px;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acts{display:flex}.move[disabled]{opacity:.22}.vis.off{color:var(--error-color)}.ft{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color)}.count{font-size:12px;color:var(--secondary-text-color)}.buttons{display:flex;gap:8px}.cancel,.save{min-height:44px;padding:0 13px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,6px);background:transparent;font-size:13px;font-weight:500}.save{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:transparent}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><dialog><div class="hd"><h2></h2><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><div class="copy"></div><div class="rows"></div></div><div class="ft"><span class="count"></span><span class="buttons"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save</button></span></div></dialog>`;this.d=this.shadowRoot.querySelector('dialog');this.d.addEventListener('click',e=>{if(e.target===this.d)this.d.close()});this.shadowRoot.querySelector('.x').onclick=()=>this.d.close();this.shadowRoot.querySelector('.cancel').onclick=()=>this.d.close();this.shadowRoot.querySelector('.save').onclick=()=>this.save()}render(){this.shadowRoot.querySelector('h2').textContent=this.o.title||'Edit';this.shadowRoot.querySelector('.copy').textContent=this.o.description||'Reorder or hide items.';const rows=this.shadowRoot.querySelector('.rows');rows.replaceChildren();this.items.forEach((x,i)=>{const r=document.createElement('div'),off=this.hiddenIds.has(x.id);r.className=`row ${off?'off':''}`;r.innerHTML=`<span class="ico"><ha-icon icon="${x.icon||'mdi:circle-outline'}"></ha-icon></span><span><div class="name"></div><div class="meta"></div></span><span class="acts"><button class="move up" type="button" aria-label="Move earlier" ${i===0?'disabled':''}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="move down" type="button" aria-label="Move later" ${i===this.items.length-1?'disabled':''}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="vis ${off?'off':''}" type="button" aria-label="${off?'Show':'Hide'}"><ha-icon icon="mdi:${off?'eye-outline':'eye-off-outline'}"></ha-icon></button></span>`;r.querySelector('.name').textContent=x.name;r.querySelector('.meta').textContent=x.meta||'';r.querySelector('.up').onclick=()=>this.move(i,-1);r.querySelector('.down').onclick=()=>this.move(i,1);r.querySelector('.vis').onclick=()=>{off?this.hiddenIds.delete(x.id):this.hiddenIds.add(x.id);this.render()};rows.append(r)});this.shadowRoot.querySelector('.count').textContent=`${this.items.length-this.hiddenIds.size} of ${this.items.length} shown`}move(i,d){const n=i+d;if(n<0||n>=this.items.length)return;[this.items[i],this.items[n]]=[this.items[n],this.items[i]];this.render()}async save(){const b=this.shadowRoot.querySelector('.save');b.disabled=true;b.textContent='Saving…';try{await this.o.onSave?.({order:this.items.map(x=>x.id),hidden:[...this.hiddenIds]});this.d.close()}finally{b.disabled=false;b.textContent='Save'}}}if(!customElements.get('dashboard-preference-editor-v3'))customElements.define('dashboard-preference-editor-v3',DashboardPreferenceEditorV3);
}

// Module: src/support/config-editor.js
{
/** Generic source-preserving Lovelace editor and component config contract. */
const editorShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

class HaComponentLibraryConfigEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color)}*{box-sizing:border-box}
      label{display:grid;gap:8px;font-size:13px;font-weight:600}
      textarea{width:100%;min-height:180px;resize:vertical;padding:12px;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);color:var(--primary-text-color);font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:2}
      textarea:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .hint,.error{font-size:13px;line-height:1.35;font-weight:400}.hint{color:var(--secondary-text-color)}.error{color:var(--error-color);min-height:18px}
    </style><label><span>Card configuration</span><textarea spellcheck="false" aria-describedby="component-config-hint component-config-error"></textarea></label><div id="component-config-hint" class="hint">Edit the card object. Entity IDs and supported options are validated when Home Assistant previews the card.</div><div id="component-config-error" class="error" role="alert"></div>`;
    this.textarea = this.shadowRoot.querySelector("textarea");
    this.error = this.shadowRoot.querySelector(".error");
    this.textarea.addEventListener("input", () => this._changed());
  }
  set hass(value) { this._hass = value; }
  setConfig(config) {
    this._config = { ...(config || {}) };
    this.textarea.value = JSON.stringify(this._config, null, 2);
    this.error.textContent = "";
  }
  _changed() {
    try {
      const config = JSON.parse(this.textarea.value);
      if (!config || Array.isArray(config) || typeof config !== "object") throw new Error("Configuration must be an object");
      config.type ||= `custom:${this.cardType}`;
      this._config = config;
      this.error.textContent = "";
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config },
      }));
    } catch (error) {
      this.error.textContent = error.message;
    }
  }
}

if (!customElements.get("ha-component-library-config-editor")) {
  customElements.define("ha-component-library-config-editor", HaComponentLibraryConfigEditor);
}

const installConfigContract = (type, element) => {
  if (!type || !element) return;
  if (typeof element.getStubConfig !== "function") {
    element.getStubConfig = () => ({
      type: `custom:${type}`,
      ...(typeof element.stubConfig === "function" ? element.stubConfig() : element.stubConfig || {}),
    });
  }
  if (typeof element.getConfigElement !== "function") {
    element.getConfigElement = async () => {
      const editor = document.createElement("ha-component-library-config-editor");
      editor.cardType = type;
      return editor;
    };
  }
};

Object.assign(editorShared, { installConfigContract });
}

// Module: src/support/backend-preferences.js
{
/** Backend-first dashboard preferences with a legacy frontend fallback. */
const preferenceRuntime = globalThis.__homeDashboardV2 ??= {};
const legacyGetPreference = preferenceRuntime.prefs?.bind(preferenceRuntime);
const legacySavePreference = preferenceRuntime.savePrefs?.bind(preferenceRuntime);
const preferenceRevisions = new Map();
const backendAvailability = new WeakMap();

const preferenceErrorCode = (error) =>
  String(error?.code || error?.error?.code || error?.message || error || "").toLowerCase();

const backendIsUnavailable = (error) => {
  const code = preferenceErrorCode(error);
  return (
    code.includes("unknown_command") ||
    code.includes("unknown command") ||
    code.includes("preference_unavailable") ||
    code.includes("not configured")
  );
};

const callPreferenceBackend = (hass, message) => {
  if (typeof hass?.callWS === "function") return hass.callWS(message);
  if (typeof hass?.connection?.sendMessagePromise === "function") {
    return hass.connection.sendMessagePromise(message);
  }
  return Promise.reject(new Error("Home Assistant WebSocket connection is unavailable"));
};

const rememberPreference = (key, response) => {
  preferenceRevisions.set(key, Number(response?.revision) || 0);
  return response?.value;
};

preferenceRuntime.prefs = async (hass, key) => {
  if (!hass || !key) return { order: [], hidden: [] };
  const connection = hass.connection;
  if (connection && backendAvailability.get(connection) === false) {
    return legacyGetPreference?.(hass, key) ?? { order: [], hidden: [] };
  }
  try {
    const response = await callPreferenceBackend(hass, {
      type: "ha_component_backend/preferences/get",
      key,
    });
    if (connection) backendAvailability.set(connection, true);
    if (response?.found) return rememberPreference(key, response);
    rememberPreference(key, response);

    // Migrate the existing frontend preference once. This keeps upgrades
    // lossless while making the backend the canonical shared store afterwards.
    const legacy = await (legacyGetPreference?.(hass, key) ?? { order: [], hidden: [] });
    try {
      const migrated = await callPreferenceBackend(hass, {
        type: "ha_component_backend/preferences/update",
        key,
        value: legacy,
        expected_revision: Number(response?.revision) || 0,
      });
      rememberPreference(key, migrated);
      return legacy;
    } catch (error) {
      if (preferenceErrorCode(error).includes("preference_conflict")) {
        const latest = await callPreferenceBackend(hass, {
          type: "ha_component_backend/preferences/get",
          key,
        });
        const latestValue = rememberPreference(key, latest);
        return latest?.found ? latestValue : legacy;
      }
      throw error;
    }
  } catch (error) {
    if (!backendIsUnavailable(error)) throw error;
    if (connection) backendAvailability.set(connection, false);
    return legacyGetPreference?.(hass, key) ?? { order: [], hidden: [] };
  }
};

preferenceRuntime.savePrefs = async (hass, key, value) => {
  if (!hass || !key) throw new Error("A preference key is required");
  const connection = hass.connection;
  if (connection && backendAvailability.get(connection) === false) {
    return legacySavePreference?.(hass, key, value);
  }
  const message = {
    type: "ha_component_backend/preferences/update",
    key,
    value,
  };
  if (preferenceRevisions.has(key)) {
    message.expected_revision = preferenceRevisions.get(key);
  }
  try {
    const response = await callPreferenceBackend(hass, message);
    if (connection) backendAvailability.set(connection, true);
    rememberPreference(key, response);
    return response;
  } catch (error) {
    if (backendIsUnavailable(error)) {
      if (connection) backendAvailability.set(connection, false);
      return legacySavePreference?.(hass, key, value);
    }
    if (preferenceErrorCode(error).includes("preference_conflict")) {
      throw new Error(
        "These preferences changed on another screen. Close and reopen the editor, then try again.",
        { cause: error },
      );
    }
    throw error;
  }
};

// Give the existing editor explicit failure feedback without duplicating the
// editor component. The patch is intentionally behavioural; its visual system
// remains owned by dashboard-preference-editor-v3.
const PreferenceEditor = customElements.get("dashboard-preference-editor-v3");
if (PreferenceEditor && !PreferenceEditor.prototype.__backendFeedbackV1) {
  PreferenceEditor.prototype.__backendFeedbackV1 = true;
  const originalOpen = PreferenceEditor.prototype.open;
  PreferenceEditor.prototype.open = function openWithBackendFeedback(options) {
    originalOpen.call(this, options);
    const save = this.shadowRoot.querySelector(".save");
    if (save) save.style.minWidth = "84px";
    let error = this.shadowRoot.querySelector(".save-error");
    if (!error) {
      error = document.createElement("p");
      error.className = "save-error";
      error.hidden = true;
      error.setAttribute("role", "alert");
      error.style.cssText =
        "margin:0;padding:10px 14px 0;color:var(--error-color);font-size:13px;line-height:1.4";
      this.shadowRoot.querySelector(".ft")?.before(error);
    }
    error.hidden = true;
    error.textContent = "";
  };
  PreferenceEditor.prototype.save = async function saveWithBackendFeedback() {
    const button = this.shadowRoot.querySelector(".save");
    const error = this.shadowRoot.querySelector(".save-error");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Saving…";
    if (error) error.hidden = true;
    try {
      await this.o.onSave?.({
        order: this.items.map((item) => item.id),
        hidden: [...this.hiddenIds],
      });
      this.d.close();
    } catch (saveError) {
      if (error) {
        error.textContent =
          saveError?.message ||
          "Couldn’t save these changes. Your current choices are still open; try again.";
        error.hidden = false;
      }
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Save";
    }
  };
}
}

// Module: src/support/backend-profiles.js
{
/** Validated backend profile client shared by Energy and Security dashboards. */
const profileShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};
const { createAsyncBroker } = profileShared;
const connectionIds = new WeakMap();
let nextConnectionId = 1;
const connectionId = (hass) => {
  const connection = hass?.connection;
  if (!connection) return "none";
  if (!connectionIds.has(connection)) connectionIds.set(connection, nextConnectionId++);
  return connectionIds.get(connection);
};
const profileKey = (hass, kind, profileId) => `${connectionId(hass)}|${kind}|${profileId}`;
const profileContext = new Map();
const profileSubscriptions = new WeakMap();

const attachProfileEvents = (hass) => {
  const connection = hass?.connection;
  if (!connection?.subscribeEvents || profileSubscriptions.has(connection)) return;
  const subscription = connection.subscribeEvents((event) => {
    const match = /^dashboard-profile\.(energy|security)\.([a-z0-9-]+)$/.exec(String(event?.data?.key || ""));
    if (match) {
      profileBroker.invalidate(profileKey(hass, match[1], match[2]));
      window.dispatchEvent(new CustomEvent("ha-component-profile-change", {
        detail: { kind: match[1], profileId: match[2] },
      }));
    }
  }, "ha_component_backend_preferences_updated");
  profileSubscriptions.set(connection, subscription);
  Promise.resolve(subscription).catch(() => profileSubscriptions.delete(connection));
};

const profileBroker = createAsyncBroker(async (key) => {
  const context = profileContext.get(key);
  if (!context?.hass?.callWS) throw new Error("Home Assistant WebSocket connection is unavailable");
  return context.hass.callWS({
    type: "ha_component_backend/profile/get",
    kind: context.kind,
    profile_id: context.profileId,
  });
}, { ttl: 300000, maxStale: 86400000, retryBase: 3000, retryMax: 60000 });

const dashboardProfiles = Object.freeze({
  async get(hass, kind, profileId, options = {}) {
    attachProfileEvents(hass);
    const key = profileKey(hass, kind, profileId);
    profileContext.set(key, { hass, kind, profileId });
    return profileBroker.read(key, null, options);
  },
  invalidate(hass, kind, profileId) {
    profileBroker.invalidate(profileKey(hass, kind, profileId));
  },
  peek(hass, kind, profileId) {
    return profileBroker.peek(profileKey(hass, kind, profileId));
  },
  async save(hass, kind, profileId, profile, expectedRevision) {
    const message = {
      type: "ha_component_backend/profile/update",
      kind,
      profile_id: profileId,
      profile,
    };
    if (Number.isFinite(Number(expectedRevision))) message.expected_revision = Number(expectedRevision);
    const result = await hass.callWS(message);
    profileBroker.invalidate(profileKey(hass, kind, profileId));
    return result;
  },
  subscribe(hass, kind, profileId, subscriber) {
    attachProfileEvents(hass);
    const key = profileKey(hass, kind, profileId);
    profileContext.set(key, { hass, kind, profileId });
    return profileBroker.subscribe(key, subscriber);
  },
});

Object.assign(profileShared, { connectionId, dashboardProfiles });
}

// Module: src/support/energy-store.js
{
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
}

// Module: src/shared/security-runtime.js
{
/** Capability-driven Security discovery shared by every Security component. */
const securityShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};
const securityHD = globalThis.__homeDashboardV2;
const securityDomain = (entityId) => String(entityId || "").split(".")[0];
const badSecurityState = new Set(["unknown", "unavailable"]);
const capabilityText = (entity) => [
  entity?.translation_key,
  entity?.unique_id,
  entity?.entity_id,
  entity?.platform,
].filter(Boolean).join(" ").toLowerCase();
const entityLabel = (hass, entity) => entity?.name || entity?.original_name ||
  hass?.states?.[entity?.entity_id]?.attributes?.friendly_name || entity?.entity_id || "Control";

const switchRole = (entity) => {
  const text = capabilityText(entity);
  if (/record/.test(text)) return "Recording";
  if (/detect|motion/.test(text)) return "Detection";
  if (/alert|notification/.test(text)) return "Alerts";
  if (/audio|sound/.test(text)) return "Audio";
  return null;
};
const ptzRole = (entity) => /(^|[_ :.-])(ptz|pan|tilt|zoom)([_ :.-]|$)/.test(capabilityText(entity));
const actionRole = (entity) => {
  const text = capabilityText(entity);
  if (/trigger|operate|open|close/.test(text)) return "operate";
  if (/restart|reboot/.test(text)) return "restart";
  return "action";
};

const securityModel = (hass, registry, profile = {}) => {
  if (registry?.error) {
    return { error: registry.error, cameras: [], entries: [], attention: [], allClear: false };
  }
  const include = new Set(profile.include_entities || []);
  const exclude = new Set(profile.exclude_entities || []);
  const areas = new Set(profile.area_ids || []);
  // Visible entities choose what becomes a dashboard card.  Capability
  // siblings are deliberately broader: camera integrations commonly classify
  // recording/detection switches as config entities even though they are safe,
  // contextual controls for an already-visible camera.
  const candidates = (registry?.entities || []).filter((entity) => {
    if (!entity?.entity_id || entity.disabled_by || entity.hidden_by || !hass?.states?.[entity.entity_id]) return false;
    if (exclude.has(entity.entity_id)) return false;
    if (include.has(entity.entity_id)) return true;
    return !areas.size || areas.has(securityHD.areaOf(entity, registry));
  });
  const entities = candidates.filter((entity) => securityHD?.uiEntry?.(entity));
  const byDevice = new Map();
  for (const entity of candidates) {
    const owner = entity.device_id || entity.entity_id;
    const siblings = byDevice.get(owner) || [];
    siblings.push(entity);
    byDevice.set(owner, siblings);
  }

  const cameras = [];
  for (const [owner, siblings] of byDevice) {
    const cameraEntities = siblings.filter((entity) =>
      securityDomain(entity.entity_id) === "camera" && securityHD?.uiEntry?.(entity),
    );
    if (!cameraEntities.length) continue;
    cameraEntities.sort((left, right) => {
      const score = (entity) => {
        const state = hass.states[entity.entity_id];
        return (include.has(entity.entity_id) ? 100 : 0) +
          (state?.attributes?.entity_picture ? 20 : 0) +
          (state?.attributes?.frontend_stream_type ? 10 : 0);
      };
      return score(right) - score(left) || String(left.unique_id || left.entity_id).localeCompare(String(right.unique_id || right.entity_id));
    });
    const entity = cameraEntities[0], state = hass.states[entity.entity_id];
    const device = (registry.devices || []).find((item) => item.id === entity.device_id) || {};
    const areaId = securityHD.areaOf(entity, registry);
    const areaName = registry.areaMap?.get(areaId)?.name || "";
    const switches = siblings
      .filter((item) => securityDomain(item.entity_id) === "switch" && switchRole(item))
      .map((item) => ({ entity: item, role: switchRole(item) }));
    const detections = siblings.filter((item) => {
      if (securityDomain(item.entity_id) !== "binary_sensor") return false;
      const deviceClass = hass.states[item.entity_id]?.attributes?.device_class || "";
      return /^(motion|occupancy|presence|sound)$/.test(deviceClass) || /detect|motion|person|human/.test(capabilityText(item));
    });
    const actions = siblings
      .filter((item) => securityDomain(item.entity_id) === "button" && actionRole(item) !== "action")
      .map((item) => ({ entity: item, role: actionRole(item) }));
    const ptz = siblings.filter((item) => ["button", "number", "select"].includes(securityDomain(item.entity_id)) && ptzRole(item));
    const mappedStream = profile.mappings?.[`camera_stream:${entity.entity_id}`] || profile.mappings?.[`camera_stream:${owner}`] || null;
    const mappedStreamState = mappedStream ? hass.states[mappedStream] : null;
    const streamEntityId = mappedStreamState && !badSecurityState.has(String(mappedStreamState.state).toLowerCase())
      ? mappedStream
      : entity.entity_id;
    const online = Boolean(state && !badSecurityState.has(String(state.state).toLowerCase()));
    const active = detections.some((item) => hass.states[item.entity_id]?.state === "on");
    cameras.push({
      id: owner,
      deviceId: entity.device_id || null,
      entityId: entity.entity_id,
      entities: cameraEntities.map((item) => item.entity_id),
      name: String(device.name_by_user || device.name || "").trim() || areaName || entityLabel(hass, entity),
      areaId,
      areaName,
      online,
      active,
      streamEntityId,
      switches,
      detections,
      actions,
      ptz,
    });
  }
  cameras.sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));

  const entries = [];
  for (const entity of entities) {
    const domain = securityDomain(entity.entity_id), state = hass.states[entity.entity_id];
    const deviceClass = state?.attributes?.device_class || "";
    const isBinaryEntry = domain === "binary_sensor" && /^(door|window|garage_door|opening)$/.test(deviceClass);
    const isEntry = isBinaryEntry || domain === "lock" || (domain === "cover" && /^(door|garage)$/.test(deviceClass));
    if (!isEntry) continue;
    const siblings = entity.device_id ? byDevice.get(entity.device_id) || [] : [];
    const mapped = profile.mappings?.[`entry_control:${entity.entity_id}`];
    const control = mapped || siblings
      .filter((item) => securityDomain(item.entity_id) === "button")
      .sort((left, right) => (actionRole(left) === "operate" ? -1 : 1) - (actionRole(right) === "operate" ? -1 : 1))[0]?.entity_id || null;
    const open = domain === "lock" ? state.state === "unlocked" : /^(on|open|opening)$/.test(state.state);
    entries.push({
      entityId: entity.entity_id,
      deviceId: entity.device_id || null,
      controlEntityId: control,
      domain,
      deviceClass,
      name: entityLabel(hass, entity),
      state: state.state,
      open,
      available: !badSecurityState.has(String(state.state).toLowerCase()),
      areaId: securityHD.areaOf(entity, registry),
    });
  }
  entries.sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));

  const attention = [
    ...cameras.filter((camera) => !camera.online).map((camera) => ({ type: "camera-offline", label: `${camera.name} unavailable`, entityId: camera.entityId })),
    ...cameras.filter((camera) => camera.active).map((camera) => ({ type: "camera-activity", label: `${camera.name} activity`, entityId: camera.entityId })),
    ...entries.filter((entry) => entry.available && entry.open).map((entry) => ({ type: "entry-open", label: `${entry.name} open`, entityId: entry.entityId })),
  ];
  return {
    error: null,
    cameras,
    entries,
    attention,
    allClear: attention.length === 0,
    onlineCameras: cameras.filter((camera) => camera.online).length,
  };
};

const loadSecurityModel = async (hass, profileId = "household-security", options = {}) => {
  const [profileResult, registry] = await Promise.all([
    securityShared.dashboardProfiles.get(hass, "security", profileId, options).catch((error) => ({ found: false, profile: null, error })),
    securityHD?.REG?.load?.(hass),
  ]);
  if (!profileResult?.found) {
    const error = profileResult?.error || new Error(`Security profile ${profileId} is not configured`);
    return {
      error,
      cameras: [],
      entries: [],
      attention: [],
      allClear: false,
      onlineCameras: 0,
      profile: null,
      profileMissing: true,
      profileError: profileResult?.error || null,
    };
  }
  const model = securityModel(hass, registry, profileResult.profile);
  return { ...model, profile: profileResult?.profile || null, profileMissing: !profileResult?.found, profileError: profileResult?.error || null };
};

Object.assign(securityShared, {
  loadSecurityModel,
  securityCapabilityText: capabilityText,
  securityEntityLabel: entityLabel,
  securityModel,
});
}

// Module: src/components/single-kpi.js
{
/** ComponentSingleKpiV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentSingleKpiV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interaction=null} setConfig(c){this.c={value:'00',label:'Primary metric',support_value:'00',support_label:'Supporting context',interactive:true,entity:null,navigation_path:null,...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._interaction?.destroy();this._interaction=null} getCardSize(){return 2}
 action(){if(this.c.interactive===false)return null;if(this.c.navigation_path)return()=>navigateTo(this.c.navigation_path);if(this.c.entity)return()=>openMoreInfo(this,this.c.entity);return null}
 r(){this._interaction?.destroy();this._interaction=null;const action=this.action(),tag=action?'button':'div',className=action?'demo':'demo-static',attrs=action?' type="button"':'';this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-height:70px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em;white-space:nowrap}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color);white-space:nowrap}.support{text-align:right;font-size:11.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap}.support b{font-weight:600;color:var(--primary-text-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.support{font-size:11px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><div><div class="value">${escapeHtml(this.c.value)}</div><div class="label">${escapeHtml(this.c.label)}</div></div><div class="support"><b>${escapeHtml(this.c.support_value)}</b> ${escapeHtml(this.c.support_label)}</div></div></${tag}></ha-card>`;if(action)this._interaction=interaction(this.shadowRoot.querySelector('button.demo'),{primary:action,feedback:true})}}
registerCard({ type: "component-single-kpi-v2", element: ComponentSingleKpiV2, name: "Single KPI", description: "Reusable single KPI component." });
}

// Module: src/components/three-stat-summary.js
{
/** ComponentThreeStatV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentThreeStatV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interactions=[]} setConfig(c){this.c={metric_1_value:'00',metric_1_label:'Metric one',metric_2_value:'00',metric_2_label:'Metric two',metric_3_value:'00',metric_3_label:'Metric three',interactive:true,...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._clear()} getCardSize(){return 2}
 _clear(){for(const handle of this._interactions)handle.destroy();this._interactions=[]}
 _action(i){if(this.c.interactive===false)return null;const custom=this.c[`metric_${i}_action`];if(typeof custom==='function')return()=>custom({host:this,hass:this.h,index:i});const path=this.c[`metric_${i}_navigation_path`];if(path)return()=>navigateTo(path);const entity=this.c[`metric_${i}_entity`];if(entity)return()=>openMoreInfo(this,entity);return null}
 r(){this._clear();const rows=[1,2,3].map(i=>{const action=this._action(i),tag=action?'button':'div',attrs=action?' type="button"':'';return`<${tag} class="stat" data-index="${i}"${attrs}><div class="value">${escapeHtml(this.c[`metric_${i}_value`])}</div><div class="label">${escapeHtml(this.c[`metric_${i}_label`])}</div></${tag}>`}).join('');this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;min-height:70px;align-items:center}.stat{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;text-align:center;min-width:0;cursor:pointer}.stat:first-child{text-align:left}.stat:last-child{text-align:right}.stat:active{transform:scale(.98)}.stat:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:8px}.value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:5px;font-size:10.5px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;gap:8px}.value{font-size:20px}.label{font-size:10px}}</style><style>.stat:not(button){cursor:default}.stat:not(button):active{transform:none}.stat:not(button):focus-visible{outline:none}</style><ha-card><div class="wrap">${rows}</div></ha-card>`;for(const el of this.shadowRoot.querySelectorAll('button.stat')){const i=Number(el.dataset.index),action=this._action(i);this._interactions.push(interaction(el,{primary:action,feedback:true}))}}}
registerCard({ type: "component-three-stat-v2", element: ComponentThreeStatV2, name: "Three-stat Summary", description: "Reusable three-stat summary component." });
}

// Module: src/components/status-row.js
{
/** ComponentStatusRowV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentStatusRowV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interaction=null} setConfig(c){this.c={title:'Status title',description:'Supporting description',status_value:'Active',status_label:'Current state',icon:'mdi:information-outline',interactive:true,entity:null,navigation_path:null,...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._interaction?.destroy();this._interaction=null} getCardSize(){return 2}
 action(){if(this.c.interactive===false)return null;if(this.c.navigation_path)return()=>navigateTo(this.c.navigation_path);if(this.c.entity)return()=>openMoreInfo(this,this.c.entity);return null}
 r(){this._interaction?.destroy();this._interaction=null;const action=this.action(),tag=action?'button':'div',className=action?'demo':'demo-static',attrs=action?' type="button"':'';this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status{text-align:right;white-space:nowrap}.status b{display:block;font-size:12px;font-weight:650}.status span{display:block;margin-top:3px;font-size:10.5px;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></div><div class="status"><b>${escapeHtml(this.c.status_value)}</b><span>${escapeHtml(this.c.status_label)}</span></div></div></${tag}></ha-card>`;if(action)this._interaction=interaction(this.shadowRoot.querySelector('button.demo'),{primary:action,feedback:true})}}
registerCard({ type: "component-status-row-v2", element: ComponentStatusRowV2, name: "Status Row", description: "Reusable status row component." });
}

// Module: src/components/progress-target.js
{
/** ComponentProgressV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentProgressV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interaction=null} setConfig(c){this.c={value:'68%',label:'Progress metric',progress:68,target_value:'100%',target_label:'Target',entity:null,navigation_path:null,...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._interaction?.destroy();this._interaction=null} getCardSize(){return 2}
 action(){if(this.c.navigation_path)return()=>navigateTo(this.c.navigation_path);if(this.c.entity)return()=>openMoreInfo(this,this.c.entity);return null}
 r(){this._interaction?.destroy();this._interaction=null;let p=Math.min(100,Math.max(0,Number(this.c.progress)||0));const action=this.action();this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;min-height:78px}.head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color)}.target{text-align:right;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap}.target b{font-weight:600;color:var(--primary-text-color)}.track{height:5px;margin-top:11px;border-radius:999px;background:var(--secondary-background-color);overflow:hidden}.fill{height:100%;border-radius:inherit;background:var(--primary-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.target{font-size:11px}}</style><style>.wrap.actionable{cursor:pointer}.wrap.actionable:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}</style><ha-card><div class="wrap ${action?'actionable':''}" ${action?'role="button" tabindex="0"':''}><div class="head"><div><div class="value">${escapeHtml(this.c.value)}</div><div class="label">${escapeHtml(this.c.label)}</div></div><div class="target"><b>${escapeHtml(this.c.target_value)}</b> ${escapeHtml(this.c.target_label)}</div></div><div class="track"><div class="fill" style="width:${p}%"></div></div></div></ha-card>`;if(action)this._interaction=interaction(this.shadowRoot.querySelector('.wrap'),{primary:action,feedback:true})}}
registerCard({ type: "component-progress-v2", element: ComponentProgressV2, name: "Progress / Target", description: "Reusable progress and target component." });
}

// Module: src/components/action-card.js
{
/** ComponentActionV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentActionV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interaction=null} setConfig(c){this.c={title:'Action title',description:'What this action will do',action_text:'Open',icon:'mdi:gesture-tap-button',...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._interaction?.destroy();this._interaction=null} getCardSize(){return 2}
 actions(){const entity=this.c.more_info_entity||this.c.entity||null,path=this.c.navigation_path||null;return{primary:path?()=>navigateTo(path):entity?()=>openMoreInfo(this,entity):null,hold:path&&entity?()=>openMoreInfo(this,entity):null}}
 r(){this._interaction?.destroy();this._interaction=null;const actions=this.actions(),tag=actions.primary?'button':'div',attrs=actions.primary?' type="button"':'',className=actions.primary?'demo':'demo-static';this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action{min-height:32px;padding:0 10px;border-radius:11px;display:flex;align-items:center;background:var(--secondary-background-color);color:var(--primary-color);font-size:11.5px;font-weight:650;white-space:nowrap}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></span><span class="action">${escapeHtml(this.c.action_text)}</span></div></${tag}></ha-card>`;if(actions.primary)this._interaction=interaction(this.shadowRoot.querySelector('button.demo'),{primary:actions.primary,hold:actions.hold,optimistic:false,repeat:false,feedback:true})}}
registerCard({ type: "component-action-v2", element: ComponentActionV2, name: "Action Card", description: "Reusable navigation and more-info action card." });
}

// Module: src/components/list-ranking.js
{
/** ComponentListV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentListV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interactions=[]} setConfig(c){this.c={rows:[{title:'First item',description:'Supporting detail',value:'00',label:'Metric'},{title:'Second item',description:'Supporting detail',value:'00',label:'Metric'},{title:'Third item',description:'Supporting detail',value:'00',label:'Metric'}],interactive:true,...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._clear()} getCardSize(){return 3}
 _clear(){for(const handle of this._interactions)handle.destroy();this._interactions=[]}
 _actions(row){if(this.c.interactive===false)return{primary:null,hold:null};const custom=typeof row.action==='function'?()=>row.action({host:this,hass:this.h,row}):null,path=row.navigation_path||row.path||null,entity=row.entity||row.more_info_entity||null;return{primary:custom||(path?()=>navigateTo(path):entity?()=>openMoreInfo(this,entity):null),hold:!custom&&path&&entity?()=>openMoreInfo(this,entity):null}}
 r(){this._clear();let rows=Array.isArray(this.c.rows)?this.c.rows.slice(0,6):[];const markup=rows.map((row,index)=>{const actions=this._actions(row),tag=actions.primary?'button':'div',attrs=actions.primary?' type="button"':'';return`<${tag} class="row" data-index="${index}"${attrs}><span><div class="title">${escapeHtml(row.title)}</div><div class="desc">${escapeHtml(row.description)}</div></span><span class="metric"><b>${escapeHtml(row.value)}</b>${escapeHtml(row.label)}</span></${tag}>`}).join('');this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:2px 14px}.row{appearance:none;width:100%;border:0;border-top:1px solid var(--divider-color);background:transparent;color:inherit;font:inherit;min-height:54px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:0;text-align:left;cursor:pointer}.row:first-child{border-top:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}.title{font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:2px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric{text-align:right;white-space:nowrap;font-size:11px;color:var(--secondary-text-color)}.metric b{font-size:12px;font-weight:650;color:var(--primary-text-color);margin-right:4px}@media(max-width:700px){.wrap{padding:2px 12px}}</style><style>.row:not(button){cursor:default}.row:not(button):active{background:transparent}.row:not(button):focus-visible{outline:none}</style><ha-card><div class="wrap">${markup}</div></ha-card>`;for(const element of this.shadowRoot.querySelectorAll('button.row')){const row=rows[Number(element.dataset.index)],actions=this._actions(row);this._interactions.push(interaction(element,{primary:actions.primary,hold:actions.hold,feedback:true}))}}}
registerCard({ type: "component-list-v2", element: ComponentListV2, name: "List / Ranking", description: "Reusable list and ranking component." });
}

// Module: src/components/notice.js
{
/** ComponentNoticeV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentNoticeV2 extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._interaction=null} setConfig(c){this.c={title:'Notice title',message:'Important supporting information appears here.',tone:'info',icon:'mdi:information-outline',entity:null,navigation_path:null,...c};this.r()} set hass(h){this.h=h} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._interaction?.destroy();this._interaction=null} getCardSize(){return 2}
 action(){if(this.c.navigation_path)return()=>navigateTo(this.c.navigation_path);if(this.c.entity)return()=>openMoreInfo(this,this.c.entity);return null}
 r(){this._interaction?.destroy();this._interaction=null;let tone=['warning','error','success'].includes(this.c.tone)?this.c.tone:'';const action=this.action();this.shadowRoot.innerHTML=`<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}.warning .icon{color:var(--warning-color,var(--primary-color))}.error .icon{color:var(--error-color,var(--primary-color))}.success .icon{color:var(--success-color,var(--primary-color))}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650}.message{margin-top:3px;font-size:10.5px;line-height:1.35;color:var(--secondary-text-color)}</style><style>.wrap.actionable{cursor:pointer}.wrap.actionable:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}</style><ha-card><div class="wrap ${tone} ${action?'actionable':''}" ${action?'role="button" tabindex="0"':''}><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(this.c.title)}</div><div class="message">${escapeHtml(this.c.message)}</div></div></div></ha-card>`;if(action)this._interaction=interaction(this.shadowRoot.querySelector('.wrap'),{primary:action,feedback:true})}}
registerCard({ type: "component-notice-v2", element: ComponentNoticeV2, name: "Alert / Notice", description: "Reusable alert and notice component." });
}

// Module: src/components/device-discovery.js
{
/** ComponentDeviceDiscoveryV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentDeviceDiscoveryV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._loadPromise = null;
    this._loadGeneration = 0;
    this._accessState = null;
    this._interactions = [];
  }

  setConfig(config) {
    const wasDemo = Boolean(this.c?.demo);
    this.c = {
      demo: false,
      refresh_seconds: 60,
      max_rows: 6,
      ...config,
    };

    if (this.c.demo) {
      this._accessState = null;
      if (!wasDemo || this.started) {
        clearInterval(this.timer);
        this.timer = null;
        this.started = false;
        this._loadGeneration += 1;
        this._loadPromise = null;
      }
      this.render(this.demoRows());
      return;
    }

    if (wasDemo) this._start();
  }

  set hass(hass) {
    this.h = hass;
    if (this.c?.demo) {
      this.render(this.demoRows());
      return;
    }
    this._start();
  }

  connectedCallback() {
    this._start();
  }

  disconnectedCallback() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    clearInterval(this.timer);
    this.timer = null;
    this.started = false;
    this._loadGeneration += 1;
    this._loadPromise = null;
  }

  _start() {
    if (!this.isConnected || !this.h || this.c?.demo) return;
    if (!this._isAdmin()) {
      clearInterval(this.timer);
      this.timer = null;
      const active = this.started || this._loadPromise;
      this.started = false;
      if (active) {
        this._loadGeneration += 1;
        this._loadPromise = null;
      }
      this._showAdmin();
      return;
    }
    this._accessState = null;
    if (this.started) return;
    this.started = true;
    this.load();
    const seconds = Math.max(30, Number(this.c?.refresh_seconds) || 60);
    this.timer = setInterval(() => this.load(true), seconds * 1000);
  }

  _isAdmin() {
    return !this.h?.user || this.h.user.is_admin;
  }

  _showAdmin() {
    if (this._accessState === "admin") return;
    this._accessState = "admin";
    this.renderState("admin");
  }

  getCardSize() {
    return 3;
  }

  escape(value) {
    return escapeHtml(value);
  }

  name(flow) {
    const placeholders = flow?.context?.title_placeholders || {};
    return (
      placeholders.name ||
      placeholders.device ||
      placeholders.host ||
      flow.handler ||
      "Discovered device"
    );
  }

  source(value) {
    return (
      {
        bluetooth: "Bluetooth",
        dhcp: "DHCP",
        discovery: "Discovery",
        esphome: "ESPHome",
        hardware: "Hardware",
        hassio: "Home Assistant",
        homekit: "HomeKit",
        integration_discovery: "Discovery",
        mqtt: "MQTT",
        ssdp: "SSDP",
        usb: "USB",
        zeroconf: "mDNS",
      }[value] ||
      value ||
      "Discovery"
    );
  }

  pending(flows) {
    const sources = new Set([
      "bluetooth",
      "dhcp",
      "discovery",
      "esphome",
      "hardware",
      "hassio",
      "homekit",
      "integration_discovery",
      "mqtt",
      "ssdp",
      "usb",
      "zeroconf",
    ]);
    return (flows || [])
      .filter((flow) => sources.has(flow?.context?.source))
      .sort((a, b) => this.name(a).localeCompare(this.name(b)));
  }

  demoRows() {
    return [
      {
        handler: "example_integration",
        context: {
          source: "zeroconf",
          title_placeholders: { name: "Discovered device" },
        },
      },
      {
        handler: "example_bridge",
        context: {
          source: "dhcp",
          title_placeholders: { name: "Discovered bridge" },
        },
      },
    ];
  }

  navigate() {
    navigateTo("/config/integrations/dashboard");
  }

  async load(silent = false) {
    if (!this.h || this.c?.demo) return;
    if (this._loadPromise) return this._loadPromise;
    if (!silent) this.renderState("loading");
    if (!this._isAdmin()) {
      this._showAdmin();
      return;
    }

    const generation = this._loadGeneration;
    const hass = this.h;
    const request = Promise.resolve()
      .then(() => hass.callWS({ type: "config_entries/flow/progress" }))
      .then((flows) => {
        if (generation === this._loadGeneration && !this.c?.demo) {
          this.render(this.pending(flows));
        }
      })
      .catch(() => {
        if (generation === this._loadGeneration && !this.c?.demo) {
          this.renderState("error");
        }
      })
      .finally(() => {
        if (this._loadPromise === request) this._loadPromise = null;
      });
    this._loadPromise = request;
    return request;
  }

  styles() {
    return `${PRESENTATIONAL_CARD_STYLES}
      .card { padding: 4px 14px; }
      .summary,
      .state {
        min-height: 64px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
      }
      .state { padding: 8px 0; }
      .icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
      }
      ha-icon { --mdc-icon-size: 20px; }
      .title {
        font-size: 13px;
        line-height: 1.25;
        font-weight: 650;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .description {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.35;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .refresh,
      .review,
      .retry {
        appearance: none;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
        font: inherit;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
      }
      .refresh {
        width: 44px;
        padding: 0;
        display: grid;
        place-items: center;
      }
      .review,
      .retry { padding: 0 12px; }
      .refresh:active,
      .review:active,
      .retry:active { transform: scale(.98); }
      .refresh:focus-visible,
      .review:focus-visible,
      .retry:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .row {
        min-height: 64px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border-top: 1px solid var(--divider-color);
      }
      .row .icon { background: var(--secondary-background-color); }
      button.row{appearance:none;width:100%;border-right:0;border-bottom:0;border-left:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
      button.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}
      .more {
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--divider-color);
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      .error .icon { color: var(--error-color, var(--primary-color)); }
      .success .icon { color: var(--success-color, var(--primary-color)); }
      @media (max-width: 700px) {
        .card { padding: 4px 12px; }
        .summary,
        .state,
        .row { gap: 10px; }
      }
    `;
  }

  renderState(kind) {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const content = {
      loading: {
        className: "",
        icon: "mdi:progress-clock",
        title: "Checking for devices",
        description: "Reading Home Assistant discovery suggestions.",
      },
      admin: {
        className: "error",
        icon: "mdi:shield-lock-outline",
        title: "Administrator access required",
        description: "Device discovery is available to administrators only.",
      },
      error: {
        className: "error",
        icon: "mdi:alert-circle-outline",
        title: "Discovery could not be loaded",
        description: "Retry the Home Assistant discovery check.",
      },
    }[kind];

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="state ${content.className}">
            <span class="icon"><ha-icon icon="${content.icon}"></ha-icon></span>
            <span>
              <div class="title">${content.title}</div>
              <div class="description">${content.description}</div>
            </span>
            ${
              kind === "error"
                ? '<button class="retry" type="button">Retry</button>'
                : ""
            }
          </div>
        </div>
      </ha-card>`;

    const retry = this.shadowRoot.querySelector(".retry");
    if (retry) {
      this._interactions.push(
        interaction(retry, { primary: () => this.load(), feedback: true }),
      );
    }
  }

  row(flow) {
    const name = this.escape(this.name(flow));
    const description = this.escape(
      `${this.source(flow.context?.source)} · ${flow.handler}`,
    );
    const body = `<span class="icon"><ha-icon icon="mdi:plus-circle-outline"></ha-icon></span>
      <span><div class="title">${name}</div><div class="description">${description}</div></span>
      <span class="review" aria-hidden="true">Review</span>`;
    return this.c?.demo
      ? `<div class="row">${body}</div>`
      : `<button class="row" type="button" aria-label="Review ${name}">${body}</button>`;
  }

  render(flows) {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const limit = Math.max(1, Number(this.c?.max_rows) || 6);
    const shown = flows.slice(0, limit);
    const remaining = Math.max(0, flows.length - shown.length);
    const empty = flows.length === 0;
    const title = empty
      ? "No devices waiting"
      : `${flows.length} ${flows.length === 1 ? "device" : "devices"} found`;
    const description = empty
      ? "Home Assistant has no new setup suggestions."
      : "Home Assistant has setup suggestions ready to review.";
    const rows = shown.map((flow) => this.row(flow)).join("");
    const refresh = this.c?.demo
      ? '<span class="refresh" aria-hidden="true"><ha-icon icon="mdi:refresh"></ha-icon></span>'
      : '<button class="refresh" type="button" aria-label="Refresh discovery"><ha-icon icon="mdi:refresh"></ha-icon></button>';

    this.shadowRoot.innerHTML = `<style>${this.styles()}</style>
      <ha-card>
        <div class="card">
          <div class="summary ${empty ? "success" : ""}">
            <span class="icon"><ha-icon icon="${empty ? "mdi:check-circle-outline" : "mdi:radar"}"></ha-icon></span>
            <span>
              <div class="title">${title}</div>
              <div class="description">${description}</div>
            </span>
            ${refresh}
          </div>
          ${rows}
          ${
            remaining
              ? `<div class="more">${remaining} more ${remaining === 1 ? "suggestion" : "suggestions"} available in Integrations</div>`
              : ""
          }
        </div>
      </ha-card>`;

    const refreshButton = this.shadowRoot.querySelector("button.refresh");
    if (refreshButton) {
      this._interactions.push(
        interaction(refreshButton, { primary: () => this.load(), feedback: true }),
      );
    }
    for (const row of this.shadowRoot.querySelectorAll("button.row")) {
      this._interactions.push(
        interaction(row, { primary: () => this.navigate(), feedback: true }),
      );
    }
  }
}
registerCard({ type: "component-device-discovery-v2", element: ComponentDeviceDiscoveryV2, name: "Device Discovery", description: "Reusable device-discovery status component." });
}

// Module: src/components/quick-navigation.js
{
/** ComponentQuickNavigationV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentQuickNavigationV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      left_icon: "mdi:weather-partly-cloudy",
      left_text: "Context",
      left_entity: null,
      action_1_icon: "mdi:view-dashboard-outline",
      action_1_text: "Destination",
      action_1_path: null,
      action_2_icon: "mdi:cog-outline",
      action_2_text: "Settings",
      action_2_path: null,
      ...c,
    };
    this._hasHass = false;
    this._leftState = undefined;
    this._leftStateText = undefined;
    this.r();
  }

  set hass(h) {
    this.h = h;
    const state = this.c?.left_entity ? h?.states?.[this.c.left_entity] : null;
    const stateText = state ? this.formatState(state) : null;
    if (!this._hasHass || state !== this._leftState || stateText !== this._leftStateText) {
      this._hasHass = true;
      this._leftState = state;
      this._leftStateText = stateText;
      this.r();
    } else {
      const contextIcon = this.shadowRoot?.getElementById("context-icon");
      if (contextIcon && state) {
        contextIcon.hass = h;
        contextIcon.stateObj = state;
      }
    }
  }

  disconnectedCallback() {
    this._clearInteractions();
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  _clearInteractions() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  getCardSize() {
    return 1;
  }

  moreInfo(entityId) {
    openMoreInfo(this, entityId);
  }

  navigate(path) {
    navigateTo(path);
  }

  formatState(state) {
    try {
      return this.h.formatEntityState(state);
    } catch {
      return String(state?.state || "");
    }
  }

  r() {
    if (!this.c) return;
    this._clearInteractions();
    const stateObj =
      this.c.left_entity && this.h
        ? this.h.states[this.c.left_entity]
        : null;
    const leftText = stateObj
      ? this.formatState(stateObj)
      : this.c.left_entity
        ? "Unavailable"
        : this.c.left_text;
    const leftIcon = stateObj
      ? '<ha-state-icon id="context-icon"></ha-state-icon>'
      : `<ha-icon icon="${this.escapeHtml(this.c.left_icon)}"></ha-icon>`;
    const disabled1 = this.c.action_1_path ? "" : "disabled";
    const disabled2 = this.c.action_2_path ? "" : "disabled";
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.wrap{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px}.group{display:flex;align-items:center;gap:8px}.chip{min-height:44px;border:1px solid var(--divider-color)!important;border-radius:var(--dashboard-radius-control,8px);padding:0 13px!important;display:flex;align-items:center;gap:7px;color:var(--primary-text-color);font-size:13px;font-weight:600;white-space:nowrap}.chip ha-icon,.chip ha-state-icon{color:var(--primary-color);--mdc-icon-size:19px}.chip:disabled{cursor:default;opacity:1}@media(max-width:520px){.chip{width:44px;padding:0!important;justify-content:center}.chip span{display:none}.context{width:auto;padding:0 12px!important}.context span{display:inline}}</style><ha-card><div class="wrap"><button class="i chip context" id="context" type="button" aria-label="${this.escapeHtml(this.c.left_text)}">${leftIcon}<span>${this.escapeHtml(leftText)}</span></button><div class="group"><button class="i chip" id="action-1" type="button" aria-label="${this.escapeHtml(this.c.action_1_text)}" ${disabled1}><ha-icon icon="${this.escapeHtml(this.c.action_1_icon)}"></ha-icon><span>${this.escapeHtml(this.c.action_1_text)}</span></button><button class="i chip" id="action-2" type="button" aria-label="${this.escapeHtml(this.c.action_2_text)}" ${disabled2}><ha-icon icon="${this.escapeHtml(this.c.action_2_icon)}"></ha-icon><span>${this.escapeHtml(this.c.action_2_text)}</span></button></div></div></ha-card>`;
    const contextIcon = this.shadowRoot.getElementById("context-icon");
    if (contextIcon && stateObj) {
      contextIcon.hass = this.h;
      contextIcon.stateObj = stateObj;
    }
    const context = this.shadowRoot.getElementById("context");
    context.disabled = !this.c.left_entity;
    this._interactions.push(
      interaction(context, {
        primary: () => this.moreInfo(this.c.left_entity),
        feedback: true,
      }),
      interaction(this.shadowRoot.getElementById("action-1"), {
        primary: () => this.navigate(this.c.action_1_path),
        feedback: true,
      }),
      interaction(this.shadowRoot.getElementById("action-2"), {
        primary: () => this.navigate(this.c.action_2_path),
        feedback: true,
      }),
    );
  }
}
registerCard({ type: "component-quick-nav-v2", element: ComponentQuickNavigationV2, name: "Quick Navigation", description: "Reusable quick navigation component." });
}

// Module: src/components/navigation-tile.js
{
/** ComponentNavigationTileV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, navigateTo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentNavigationTileV2 extends DashboardBaseCard{
 constructor(){super();this._interaction=null} setConfig(c){this.c={icon:'mdi:door-open',title:'Destination',context:'Navigation',navigation_path:null,...c};this.r()} connectedCallback(){if(this.c)this.r()} disconnectedCallback(){this._interaction?.destroy();this._interaction=null} getCardSize(){return 1}
 r(){this._interaction?.destroy();this._interaction=null;const path=this.c.navigation_path,tag=path?'button':'div',attrs=path?' type="button"':'',className=path?'i nav':'nav nav-static';this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.nav{width:100%;text-align:left}.wrap{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}</style><style>.nav-static{border:0;background:transparent;color:inherit;font:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.context)}</div></span></div></${tag}></ha-card>`;if(path)this._interaction=interaction(this.shadowRoot.querySelector('button.nav'),{primary:()=>navigateTo(path),feedback:true})}}
registerCard({ type: "component-nav-tile-v2", element: ComponentNavigationTileV2, name: "Navigation Tile", description: "Reusable navigation tile component." });
}

// Module: src/components/control-row.js
{
/** ComponentControlRowV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, createRequestCoalescer, interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentControlRowV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._hass = null;
    this.on = true;
    this.val = 68;
    this._interactions = [];
    this._coalescer = null;
  }
  setConfig(c) {
    this.c = { icon: 'mdi:lightbulb-outline', title: 'Control name', state: 'Current state', mode: 'slider', value: 68, entity: null, ...c };
    this.on = this.c.on !== false;
    this.val = Math.max(0, Math.min(100, Number(this.c.value) || 68));
    this._resetCoalescer();
    this.r();
  }
  set hass(hass) {
    this._hass = hass;
    this.r();
  }
  connectedCallback() {
    if (this.c) this.r();
  }
  disconnectedCallback() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    this._resetCoalescer();
  }
  getCardSize() { return 1; }
  _state() { return this.c?.entity ? this._hass?.states?.[this.c.entity] ?? null : null; }
  _domain() { return String(this.c?.entity || '').split('.')[0]; }
  _available(state = this._state()) { return Boolean(state && !['unknown', 'unavailable'].includes(String(state.state).toLowerCase())); }
  _sliderPercent(state) {
    if (!this.c.entity || !state) return this.val;
    const domain = this._domain();
    if (domain === 'light') return state.state === 'on' ? Math.round(Number(state.attributes?.brightness ?? 255) / 255 * 100) : 0;
    if (domain === 'fan') return Math.max(0, Math.min(100, Number(state.attributes?.percentage) || 0));
    if (domain === 'number' || domain === 'input_number') {
      const min = Number(state.attributes?.min ?? 0), max = Number(state.attributes?.max ?? 100), value = Number(state.state);
      if (Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max) && max > min) return Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
    }
    const value = Number(state.state);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : this.val;
  }
  _description(state) {
    if (!this.c.entity) return this.c.state;
    if (!this._available(state)) return 'Unavailable';
    try { return this._hass?.formatEntityState?.(state) || this.c.state; }
    catch { return String(state.state || this.c.state); }
  }
  _resetCoalescer() {
    this._coalescer?.destroy();
    this._coalescer = null;
  }
  _sliderCoalescer() {
    if (this._coalescer) return this._coalescer;
    this._coalescer = createRequestCoalescer((value) => this._sendSlider(value), {
      onError: () => {
        const state = this._state();
        this.val = this._sliderPercent(state);
        this._updateSliderVisual();
      },
    });
    return this._coalescer;
  }
  async _sendSlider(percent) {
    const entity_id = this.c.entity;
    if (!entity_id || !this._hass) return;
    const custom = this.c.slider_service;
    if (custom && typeof custom === 'object' && custom.domain && custom.service) {
      const key = custom.data_key || 'value';
      return this._hass.callService(custom.domain, custom.service, { entity_id, ...(custom.data || {}), [key]: percent });
    }
    const domain = this._domain();
    if (domain === 'light') {
      return percent <= 0
        ? this._hass.callService('light', 'turn_off', { entity_id })
        : this._hass.callService('light', 'turn_on', { entity_id, brightness_pct: Math.round(percent) });
    }
    if (domain === 'fan') return this._hass.callService('fan', 'set_percentage', { entity_id, percentage: Math.round(percent) });
    if (domain === 'number' || domain === 'input_number') {
      const state = this._state(), min = Number(state?.attributes?.min ?? 0), max = Number(state?.attributes?.max ?? 100);
      const value = min + (max - min) * percent / 100;
      return this._hass.callService(domain, 'set_value', { entity_id, value });
    }
    throw new Error(`Slider mode does not support ${domain || 'this entity'} without slider_service`);
  }
  _updateSliderVisual() {
    const fill = this.shadowRoot.querySelector('.slider > span');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, this.val))}%`;
  }
  async _toggle(reportedOn) {
    await this._hass.callService('homeassistant', 'toggle', { entity_id: this.c.entity });
    await waitForEntityState(() => this._hass, this.c.entity, (value) => value === (reportedOn ? 'off' : 'on'), { timeout: 9000 });
  }
  _serviceAction() {
    const service = String(this.c.service || '');
    const [domain, name] = service.split('.');
    if (!domain || !name) return openMoreInfo(this, this.c.entity);
    return this._hass.callService(domain, name, { entity_id: this.c.entity, ...(this.c.service_data || {}) });
  }
  r() {
    if (!this.c) return;
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const m = this.c.mode;
    const live = Boolean(this.c.entity);
    const state = this._state();
    const available = live ? this._available(state) : true;
    const reportedOn = live ? state?.state === 'on' : this.on;
    this.on = reportedOn;
    if (m === 'slider' && live) this.val = this._sliderPercent(state);
    let ctl = m === 'switch'
      ? `<span class="switch ${this.on ? 'on' : ''}"><span></span></span>`
      : m === 'state'
        ? `<span class="metric">${this.escapeHtml(live ? this._description(state) : this.c.value)}</span>`
        : m === 'action'
          ? '<span class="action">Action</span>'
          : `<span class="slider"><span style="width:${this.val}%"></span>${live ? `<input class="live-slider" type="range" min="0" max="100" step="1" value="${Math.round(this.val)}" aria-label="${this.escapeHtml(this.c.title)}">` : ''}</span>`;
    const interactivePreview = !live && (m === 'switch' || m === 'slider');
    const rowInteractive = live ? m !== 'slider' : interactivePreview;
    const tag = rowInteractive ? 'button' : 'div';
    const attrs = rowInteractive ? ` type="button" ${live && !available ? 'disabled' : ''}` : '';
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.row{width:100%;text-align:left}.wrap{min-height:56px;display:grid;grid-template-columns:36px minmax(0,1fr) minmax(72px,auto);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.control{justify-self:end;min-width:72px;display:flex;justify-content:flex-end}.metric{font-size:13px;font-weight:600}.slider{width:96px;height:5px;border-radius:var(--dashboard-radius-control,8px);background:var(--divider-color);overflow:hidden}.slider span{display:block;height:100%;background:var(--primary-color);border-radius:var(--dashboard-radius-control,8px)}.switch{width:38px;height:22px;border-radius:var(--dashboard-radius-control,8px);background:var(--divider-color);padding:3px;box-sizing:border-box}.switch span{display:block;width:16px;height:16px;border-radius:50%;background:var(--secondary-text-color);transition:margin .12s,background .12s}.switch.on{background:color-mix(in srgb,var(--primary-color) 35%,var(--divider-color))}.switch.on span{margin-left:16px;background:var(--primary-color)}.action{min-height:30px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--primary-color);font-size:11.5px;font-weight:600;display:grid;place-items:center}</style><style>.slider:has(.live-slider){position:relative;overflow:visible}.live-slider{position:absolute;inset:-19px 0;width:100%;height:44px;margin:0;opacity:0;cursor:pointer}.row-static{width:100%;text-align:left}.row-static .identity{min-width:0}</style><ha-card><${tag} class="${rowInteractive ? 'i row' : 'row row-static'}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span class="identity"><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this._description(state))}</div></span><span class="control">${ctl}</span></div></${tag}></ha-card>`;
    if (live && m === 'slider') {
      const identity = this.shadowRoot.querySelector('.identity');
      identity.setAttribute('role', 'button');
      identity.setAttribute('tabindex', '0');
      identity.setAttribute('aria-label', `Open details for ${this.c.title}`);
      this._interactions.push(interaction(identity, { primary: () => openMoreInfo(this, this.c.entity), feedback: true }));
      const input = this.shadowRoot.querySelector('.live-slider');
      input.disabled = !available;
      input.oninput = () => {
        this.val = Number(input.value);
        this._updateSliderVisual();
        this._sliderCoalescer().request(this.val);
      };
      return;
    }
    const row = this.shadowRoot.querySelector(rowInteractive ? 'button.row' : '.row');
    if (!rowInteractive || !row) return;
    if (!live) {
      this._interactions.push(interaction(row, {
        primary: () => {
          if (m === 'switch') this.on = !this.on;
          else if (m === 'slider') { this.val = (this.val + 20) % 120; if (this.val > 100) this.val = 0; }
          this.r();
        },
        feedback: true,
      }));
      return;
    }
    if (m === 'switch') {
      row.setAttribute('aria-pressed', String(reportedOn));
      row.setAttribute('aria-label', `${reportedOn ? 'Turn off' : 'Turn on'} ${this.c.title}`);
      const switchEl = row.querySelector('.switch');
      this._interactions.push(interaction(row, {
        primary: () => this._toggle(reportedOn),
        hold: () => openMoreInfo(this, this.c.entity),
        optimistic: {
          capture: () => reportedOn,
          apply: () => { const next = !reportedOn; this.on = next; row.setAttribute('aria-pressed', String(next)); switchEl.classList.toggle('on', next); },
          rollback: () => { this.on = reportedOn; row.setAttribute('aria-pressed', String(reportedOn)); switchEl.classList.toggle('on', reportedOn); },
        },
        feedback: true,
      }));
      return;
    }
    row.setAttribute('aria-label', m === 'action' ? `${this.c.title} action` : `Open details for ${this.c.title}`);
    this._interactions.push(interaction(row, { primary: () => m === 'action' ? this._serviceAction() : openMoreInfo(this, this.c.entity), feedback: true }));
  }
}
registerCard({ type: "component-control-row-v2", element: ComponentControlRowV2, name: "Control Row", description: "Reusable control-row component." });
}

// Module: src/components/media-row.js
{
/** ComponentMediaRowV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const MEDIA_ROW_FEATURES = { pause: 1, previous: 16, next: 32, play: 512 };
class ComponentMediaRowV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._hass = null;
    this.playing = true;
    this._optimisticPlaying = null;
    this._busy = false;
    this._interactions = [];
  }
  setConfig(c) {
    this.c = { icon: 'mdi:speaker', title: 'Media player', state: 'Playing · Media title', entity: null, ...c };
    this.playing = true;
    this._optimisticPlaying = null;
    this._busy = false;
    this.r();
  }
  set hass(hass) {
    this._hass = hass;
    this.r();
  }
  connectedCallback() {
    if (this.c) this.r();
  }
  disconnectedCallback() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    this._busy = false;
  }
  getCardSize() { return 1; }
  _liveState() { return this.c?.entity ? this._hass?.states?.[this.c.entity] ?? null : null; }
  _available(state) { return Boolean(state && !['unknown', 'unavailable'].includes(String(state.state).toLowerCase())); }
  _supported(state, feature) {
    const value = Number(state?.attributes?.supported_features);
    return !Number.isFinite(value) || Boolean(value & feature);
  }
  _description(state) {
    if (!this.c.entity) return this.c.state;
    if (!this._available(state)) return 'Unavailable';
    const status = String(state.state || '').replaceAll('_', ' ').replace(/^./, (x) => x.toUpperCase());
    return [status, state.attributes?.media_title].filter(Boolean).join(' · ');
  }
  async _playPause(wasPlaying) {
    if (this._busy) return;
    this._busy = true;
    try {
      const service = wasPlaying ? 'media_pause' : 'media_play';
      await this._hass.callService('media_player', service, { entity_id: this.c.entity });
      await waitForEntityState(
        () => this._hass,
        this.c.entity,
        (value) => wasPlaying
          ? value !== 'playing' && !['unknown', 'unavailable'].includes(String(value).toLowerCase())
          : value === 'playing',
        { timeout: 9000 },
      );
      this._optimisticPlaying = null;
      this._busy = false;
      this.r();
    } catch (error) {
      this._busy = false;
      throw error;
    }
  }
  _momentary(service) {
    return this._hass.callService('media_player', service, { entity_id: this.c.entity });
  }
  r() {
    if (!this.c) return;
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const state = this._liveState();
    const live = Boolean(this.c.entity);
    const available = live && this._available(state);
    const reportedPlaying = available ? state.state === 'playing' : this.playing;
    const playing = this._optimisticPlaying ?? reportedPlaying;
    const previousEnabled = available && this._supported(state, MEDIA_ROW_FEATURES.previous);
    const nextEnabled = available && this._supported(state, MEDIA_ROW_FEATURES.next);
    const mainEnabled = !this._busy && (!live || (available && this._supported(state, playing ? MEDIA_ROW_FEATURES.pause : MEDIA_ROW_FEATURES.play)));
    const identityAttrs = live ? ' class="identity" role="button" tabindex="0"' : '';
    const previous = live
      ? `<button class="i btn previous" type="button" aria-label="Previous" ${previousEnabled ? '' : 'disabled'}><ha-icon icon="mdi:skip-previous"></ha-icon></button>`
      : '<span class="btn" aria-hidden="true"><ha-icon icon="mdi:skip-previous"></ha-icon></span>';
    const main = `<button class="i btn main" type="button" aria-label="${playing ? 'Pause' : 'Play'}" ${mainEnabled ? '' : 'disabled'}><ha-icon icon="mdi:${playing ? 'pause' : 'play'}"></ha-icon></button>`;
    const next = live
      ? `<button class="i btn next" type="button" aria-label="Next" ${nextEnabled ? '' : 'disabled'}><ha-icon icon="mdi:skip-next"></ha-icon></button>`
      : '<span class="btn" aria-hidden="true"><ha-icon icon="mdi:skip-next"></ha-icon></span>';
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.wrap{min-height:56px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,0px);background:transparent;color:var(--primary-color)}.buttons{display:flex;gap:4px}.btn{position:relative;width:44px;height:44px;border:0!important;border-radius:var(--dashboard-radius-control,5px)!important;background:transparent!important;display:grid;place-items:center;color:var(--secondary-text-color);padding:0!important}.btn:before{content:'';position:absolute;width:30px;height:30px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px)}.btn.main{color:var(--primary-color)}.btn ha-icon{position:relative;--mdc-icon-size:17px}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span${identityAttrs}><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this._description(state))}</div></span><span class="buttons">${previous}${main}${next}</span></div></ha-card>`;
    if (live) {
      const identity = this.shadowRoot.querySelector('.identity');
      identity?.setAttribute('aria-label', `Open details for ${this.c.title}`);
      if (identity) this._interactions.push(interaction(identity, { primary: () => openMoreInfo(this, this.c.entity), feedback: true }));
      const previousButton = this.shadowRoot.querySelector('.previous');
      const nextButton = this.shadowRoot.querySelector('.next');
      if (previousButton) this._interactions.push(interaction(previousButton, { primary: () => this._momentary('media_previous_track'), feedback: true }));
      if (nextButton) this._interactions.push(interaction(nextButton, { primary: () => this._momentary('media_next_track'), feedback: true }));
    }
    const mainButton = this.shadowRoot.querySelector('.main');
    if (!mainButton) return;
    if (!live) {
      this._interactions.push(interaction(mainButton, { primary: () => { this.playing = !this.playing; this.r(); }, optimistic: false, feedback: true }));
      return;
    }
    this._interactions.push(interaction(mainButton, {
      primary: () => this._playPause(reportedPlaying),
      optimistic: {
        capture: () => reportedPlaying,
        apply: () => {
          this._optimisticPlaying = !reportedPlaying;
          mainButton.setAttribute('aria-label', reportedPlaying ? 'Play' : 'Pause');
          mainButton.querySelector('ha-icon')?.setAttribute('icon', `mdi:${reportedPlaying ? 'play' : 'pause'}`);
        },
        rollback: () => {
          this._optimisticPlaying = null;
          this.r();
        },
      },
      feedback: true,
    }));
  }
}
registerCard({ type: "component-media-row-v2", element: ComponentMediaRowV2, name: "Media Row", description: "Reusable media-row component." });
}

// Module: src/components/component-apple-tv-controller-v1.js
{
/** Live, registry-aware Apple TV controller. */
const {
  APPLE_TV_NAV: NAV,
  appleTvAppIcon,
  appleTvModel,
  createOverlayController,
  createRequestCoalescer,
  interaction,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentAppleTvControllerV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.pending = new Set();
    this.panelMode = null;
    this.panelController = null;
    this.registry = null;
    this.unsubscribe = null;
    this.message = "";
    this.messageType = "info";
    this.messageTimer = null;
    this.interactionHandles = [];
    this.dynamicInteractions = [];
    this.volumeCoalescer = null;
    this.volumeGestureActive = false;
    this.optimisticVolume = null;
  }

  setConfig(config) {
    if (!config?.entity && !config?.demo) {
      throw new Error("An Apple TV media-player entity is required");
    }
    this.config = {
      icon: "mdi:apple",
      ...config,
      entity: config?.entity || "media_player.demo_apple_tv",
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.subscribe();
    this.render();
  }

  connectedCallback() {
    this.subscribe();
    this.render();
  }

  disconnectedCallback() {
    for (const handle of this.interactionHandles) handle.destroy();
    this.interactionHandles = [];
    for (const handle of this.dynamicInteractions) handle.destroy();
    this.dynamicInteractions = [];
    this.volumeCoalescer?.destroy();
    this.volumeCoalescer = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    clearTimeout(this.messageTimer);
    this.panelMode = null;
    this.volumeGestureActive = false;
    this.optimisticVolume = null;
    this.panelController?.close(false);
  }

  getCardSize() {
    return 2;
  }

  subscribe() {
    const registry = globalThis.__homeDashboardV2?.REG;
    if (
      !registry ||
      !this._hass ||
      this.config?.demo ||
      this.unsubscribe
    ) {
      return;
    }
    this.unsubscribe = registry.subscribe(this._hass, (data) => {
      this.registry = data;
      this.render();
    });
  }

  model() {
    return appleTvModel(this._hass, this.config, this.registry);
  }

  name(model) {
    return (
      this.config?.title ||
      model.media?.attributes?.friendly_name ||
      "Apple TV"
    );
  }

  canRemote(model) {
    return Boolean(
      model.canWake ||
        model.canSleep ||
        model.canNavigate ||
        model.canPlay ||
        model.canPause ||
        model.canStop ||
        model.canPrevious ||
        model.canNext ||
        model.canVolumeDown ||
        model.canVolumeUp ||
        model.canMute ||
        model.canSetKeyboardText,
    );
  }

  busy(action) {
    return this.pending.has(action);
  }

  build() {
    if (this.el) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;min-width:0}
        *{box-sizing:border-box}
        button,input{font:inherit;color:inherit}
        button{appearance:none;border:0;background:transparent;cursor:pointer}
        button:disabled{opacity:.42;cursor:default}
        ha-card{display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,8px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}
        .wrap{padding:14px}
        .identity{min-height:44px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:center}
        .ico{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--secondary-text-color)}
        .ico.on{color:var(--primary-color)}
        .name,.status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .name{font-size:14px;font-weight:650}
        .status{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}
        .launchers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
        .launcher{min-height:66px;padding:10px 12px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:14px;display:grid;grid-template-columns:38px minmax(0,1fr) 20px;gap:10px;align-items:center;text-align:left;background:color-mix(in srgb,var(--secondary-background-color) 45%,transparent)}
        .launcher .launch-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:var(--card-background-color);color:var(--primary-color)}
        .launch-copy{min-width:0}
        .launch-title,.launch-meta{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .launch-title{font-size:13px;font-weight:700}
        .launch-meta{margin-top:2px;font-size:11px;color:var(--secondary-text-color)}
        .launcher>ha-icon:last-child{color:var(--secondary-text-color);--mdc-icon-size:18px}
        .notice{margin:0;font-size:12px;color:var(--secondary-text-color)}
        .notice:not(:empty){margin-top:12px;padding-top:10px;border-top:1px solid var(--divider-color)}
        .error{color:var(--error-color)}
        .panel{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,rgba(0,0,0,.28)));overscroll-behavior:contain;touch-action:pan-y}
        .panel[hidden]{display:none!important}
        .sheet{width:min(430px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--divider-color);border-radius:24px;background:var(--card-background-color);box-shadow:0 18px 54px rgba(0,0,0,.24)}
        .head{min-height:62px;padding:9px 10px 9px 18px;display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;border-bottom:1px solid var(--divider-color)}
        .sheet-name{display:block;font-size:15px;font-weight:700}
        .sheet-state{display:block;margin-top:2px;font-size:12px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .close{width:44px;height:44px;border-radius:50%;display:grid;place-items:center}
        .body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:16px 18px max(18px,env(safe-area-inset-bottom));display:grid;gap:16px;scrollbar-gutter:stable}
        .section{display:grid;gap:10px}
        .section-title{font-size:12px;font-weight:700;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.04em}
        .remote-shell{display:grid;gap:16px}
        .remote-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .remote-pill,.transport,.utility,.volume-button{min-height:44px;border:1px solid var(--divider-color);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;gap:7px;color:var(--primary-text-color);background:var(--secondary-background-color)}
        .remote-pill{padding:0 14px;font-size:12px;font-weight:650}
        .remote-pill.power{margin-left:auto}
        .dpad{width:min(286px,78vw);aspect-ratio:1;margin:0 auto;padding:14px;border:1px solid var(--divider-color);border-radius:50%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:5px;background:color-mix(in srgb,var(--secondary-background-color) 72%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
        .remote{min-width:0;min-height:0;border-radius:50%;display:grid;place-items:center;color:var(--secondary-text-color)}
        .remote ha-icon{--mdc-icon-size:30px}
        .remote.select{border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-color);box-shadow:0 3px 14px rgba(0,0,0,.12)}
        .blank{visibility:hidden}
        .utility-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .utility{width:100%;padding:0 12px;font-size:12px;font-weight:650}
        .transport-row{display:flex;justify-content:center;gap:12px}
        .transport{width:52px;height:52px;padding:0;border-radius:50%}
        .transport span{display:none}
        .volume-control{min-height:54px;display:grid;grid-template-columns:52px minmax(92px,1fr) 52px;align-items:center;border:1px solid var(--divider-color);border-radius:18px;background:var(--secondary-background-color);overflow:hidden}
        .volume-button{width:52px;height:54px;min-height:54px;border:0;border-radius:0;background:transparent}
        .volume-button span{display:none}
        .volume-readout{min-width:0;padding:0 10px;text-align:center}
        .volume-value{display:block;font-size:18px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
        .volume-status{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:11px;line-height:1.1;white-space:nowrap}
        .keyboard{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px}
        .keyboard-input{width:100%;min-height:44px;padding:0 11px;border:1px solid var(--divider-color);border-radius:12px;background:transparent}
        .keyboard .utility{width:44px;padding:0}
        .keyboard .utility span{display:none}
        .apps-summary{font-size:12px;color:var(--secondary-text-color)}
        .apps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:12px}
        .app{min-width:0;aspect-ratio:1;padding:10px;border:1px solid var(--divider-color);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;background:color-mix(in srgb,var(--secondary-background-color) 58%,transparent);text-align:center}
        .app[aria-selected=true]{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}
        .app-logo{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 2px 9px rgba(0,0,0,.1)}
        .app-logo ha-icon{--mdc-icon-size:29px}
        .app-name{width:100%;font-size:11px;font-weight:650;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .panel-notice{padding:0 18px max(16px,env(safe-area-inset-bottom));margin:0;font-size:12px;color:var(--secondary-text-color)}
        .panel-notice:not(:empty){padding-top:10px;border-top:1px solid var(--divider-color)}
        :is(button,input,.identity):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
        @media(max-width:420px){.panel{padding:8px}.sheet{width:calc(100vw - 16px);max-height:calc(100dvh - 16px);border-radius:20px}.wrap{padding:12px}.body{padding:14px}.dpad{width:min(270px,78vw)}.apps-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.app{border-radius:16px}.app-logo{width:44px;height:44px}}
      </style>
      <ha-card>
        <div class="wrap">
          <div class="identity" role="button" tabindex="0">
            <span class="ico"><ha-icon></ha-icon></span>
            <span>
              <span class="name"></span>
              <span class="status" role="status"></span>
            </span>
          </div>
          <div class="launchers">
            <button class="launcher remote-launch" type="button" aria-controls="apple-tv-panel">
              <span class="launch-icon"><ha-icon icon="mdi:remote"></ha-icon></span>
              <span class="launch-copy"><span class="launch-title">Remote</span><span class="launch-meta">Navigation & controls</span></span>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
            <button class="launcher apps-launch" type="button" aria-controls="apple-tv-panel">
              <span class="launch-icon"><ha-icon icon="mdi:apps"></ha-icon></span>
              <span class="launch-copy"><span class="launch-title">Apps</span><span class="launch-meta"></span></span>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
          </div>
          <p class="notice" role="status" aria-live="polite"></p>
        </div>
      </ha-card>
      <section class="panel" id="apple-tv-panel" role="dialog" aria-modal="true" aria-labelledby="apple-tv-panel-title" hidden>
        <div class="sheet">
          <header class="head">
            <span>
              <span class="sheet-name" id="apple-tv-panel-title"></span>
              <span class="sheet-state"></span>
            </span>
            <button class="close" type="button" aria-label="Close Apple TV panel"><ha-icon icon="mdi:close"></ha-icon></button>
          </header>
          <div class="body"></div>
          <p class="panel-notice" role="status" aria-live="polite"></p>
        </div>
      </section>
    `;

    const q = (selector) => this.shadowRoot.querySelector(selector);
    this.el = {
      identity: q(".identity"),
      icon: q(".identity ha-icon"),
      iconWrap: q(".ico"),
      name: q(".name"),
      status: q(".status"),
      remoteLaunch: q(".remote-launch"),
      appsLaunch: q(".apps-launch"),
      appsMeta: q(".apps-launch .launch-meta"),
      notice: q(".notice"),
      panel: q(".panel"),
      close: q(".close"),
      body: q(".body"),
      sheetName: q(".sheet-name"),
      sheetState: q(".sheet-state"),
      panelNotice: q(".panel-notice"),
    };

    this.panelController = createOverlayController(this, this.el.panel, {
      initialFocus: () => this.el.close,
      onDismiss: () => this.closePanel(true),
    });
    this.bindInteractions();
    this.el.panel.addEventListener("wheel", (event) => event.stopPropagation(), {
      passive: true,
    });
    this.el.panel.addEventListener(
      "touchmove",
      (event) => event.stopPropagation(),
      { passive: true },
    );
  }

  bindInteractions() {
    if (!this.el || this.interactionHandles.length) return;
    this.interactionHandles.push(
      interaction(this.el.identity, { primary: () => openMoreInfo(this, this.config.entity), feedback: true }),
      interaction(this.el.remoteLaunch, { primary: () => this.openPanel("remote", this.el.remoteLaunch), feedback: true }),
      interaction(this.el.appsLaunch, { primary: () => this.openPanel("apps", this.el.appsLaunch), feedback: true }),
      interaction(this.el.close, { primary: () => this.closePanel(true), feedback: true }),
    );
  }

  icon(name) {
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", name);
    return icon;
  }

  button(
    className,
    label,
    icon,
    click,
    disabled = false,
    pending = false,
    interactionOptions = {},
  ) {
    const button = document.createElement("button");
    const text = document.createElement("span");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-busy", String(pending));
    button.disabled = disabled;
    text.textContent = label;
    button.append(this.icon(icon), text);
    this.dynamicInteractions.push(interaction(button, { primary: click, feedback: true, ...interactionOptions }));
    return button;
  }

  section(title) {
    const section = document.createElement("section");
    const heading = document.createElement("div");
    section.className = "section";
    heading.className = "section-title";
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  render() {
    if (!this.config) return;
    this.build();
    this.bindInteractions();
    const model = this.model();
    this.el.name.textContent = this.name(model);
    this.el.status.textContent = model.status;
    this.el.identity.setAttribute("aria-label", `Open details for ${this.name(model)}`);
    this.el.icon.setAttribute("icon", this.config.icon);
    this.el.iconWrap.classList.toggle("on", model.awake);
    this.el.remoteLaunch.disabled = !this.canRemote(model);
    this.el.remoteLaunch.setAttribute(
      "aria-expanded",
      String(this.panelMode === "remote"),
    );
    this.el.appsLaunch.disabled = !model.canSelectSource;
    this.el.appsLaunch.setAttribute(
      "aria-expanded",
      String(this.panelMode === "apps"),
    );
    this.el.appsMeta.textContent = model.sources.length
      ? `${model.sources.length} installed`
      : "No installed apps";
    this.el.notice.textContent = this.message;
    this.el.notice.classList.toggle("error", this.messageType === "error");
    if (this.panelMode) {
      if (this.volumeGestureActive) this.updateVolumeReadout(model);
      else this.renderPanel(model);
    }
  }

  renderPanel(model) {
    const active = this.shadowRoot.activeElement;
    const keyboardState = active?.classList?.contains("keyboard-input")
      ? {
          value: active.value,
          start: active.selectionStart,
          end: active.selectionEnd,
          direction: active.selectionDirection,
        }
      : null;
    for (const handle of this.dynamicInteractions) handle.destroy();
    this.dynamicInteractions = [];
    const scrollTop = this.el.body.scrollTop;
    this.el.body.replaceChildren();
    this.el.sheetName.textContent =
      this.panelMode === "apps" ? "Installed Apps" : "Apple TV Remote";
    this.el.sheetState.textContent =
      this.panelMode === "apps"
        ? `${this.name(model)} · ${model.sources.length} apps`
        : `${this.name(model)} · ${model.status}`;

    if (this.panelMode === "apps") this.renderApps(model);
    else this.renderRemote(model);

    this.el.panelNotice.textContent = this.message;
    this.el.panelNotice.classList.toggle(
      "error",
      this.messageType === "error",
    );
    this.el.body.scrollTop = scrollTop;
    if (keyboardState) {
      const input = this.el.body.querySelector(".keyboard-input");
      if (input) {
        input.value = keyboardState.value;
        const setButton = input.parentElement?.querySelector(".utility");
        if (setButton) setButton.disabled = !input.value;
        input.focus({ preventScroll: true });
        input.setSelectionRange?.(
          keyboardState.start,
          keyboardState.end,
          keyboardState.direction,
        );
      }
    }
  }

  renderRemote(model) {
    const shell = document.createElement("div");
    shell.className = "remote-shell";

    const toolbar = document.createElement("div");
    toolbar.className = "remote-toolbar";
    if (model.canMute) {
      toolbar.append(
        this.button(
          "remote-pill",
          model.muted ? "Unmute" : "Mute",
          model.muted ? "mdi:volume-high" : "mdi:volume-mute",
          () => this.mute(model),
          this.busy("mute"),
          this.busy("mute"),
        ),
      );
    }
    if (model.canWake || model.canSleep) {
      const wake = model.canWake;
      const action = wake ? "wake" : "sleep";
      toolbar.append(
        this.button(
          "remote-pill power",
          wake ? "Wake" : "Sleep",
          wake ? "mdi:power" : "mdi:power-sleep",
          () => this.remoteCommand(wake ? "wakeup" : "suspend", action),
          this.busy(action),
          this.busy(action),
        ),
      );
    }
    if (toolbar.childElementCount) shell.append(toolbar);

    const navigation = this.navigation(model);
    if (navigation) shell.append(navigation);

    const utility = this.remoteUtility(model);
    if (utility) shell.append(utility);

    const playback = this.playback(model);
    if (playback) shell.append(playback);

    if (model.canVolumeDown || model.canVolumeUp) {
      const volume = this.section("Volume");
      volume.append(this.volumeControl(model));
      shell.append(volume);
    }

    const keyboard = this.keyboard(model);
    if (keyboard) shell.append(keyboard);

    if (!shell.childElementCount) {
      const empty = document.createElement("div");
      empty.className = "apps-summary";
      empty.textContent = "No remote controls are currently available.";
      shell.append(empty);
    }

    this.el.body.append(shell);
  }

  navigation(model) {
    if (!model.canNavigate) return null;
    const commands = new Set(
      Array.isArray(model.remote?.attributes?.supported_commands)
        ? model.remote.attributes.supported_commands
        : NAV.map(([command]) => command),
    );
    const grid = document.createElement("div");
    grid.className = "dpad";

    for (const command of [
      null,
      "up",
      null,
      "left",
      "select",
      "right",
      null,
      "down",
      null,
    ]) {
      if (!command || !commands.has(command)) {
        const blank = document.createElement("span");
        blank.className = "blank";
        grid.append(blank);
        continue;
      }
      const [, label, icon] = NAV.find(([name]) => name === command);
      const action = `remote-${command}`;
      grid.append(
        this.button(
          `remote ${command === "select" ? "select" : ""}`,
          label,
          icon,
          () => this.remoteCommand(command, action),
          this.busy(action),
          this.busy(action),
        ),
      );
    }
    return grid;
  }

  remoteUtility(model) {
    if (!model.canNavigate) return null;
    const commands = new Set(
      Array.isArray(model.remote?.attributes?.supported_commands)
        ? model.remote.attributes.supported_commands
        : NAV.map(([command]) => command),
    );
    const items = NAV.filter(
      ([command]) =>
        !["up", "down", "left", "right", "select"].includes(command) &&
        commands.has(command),
    );
    if (!items.length) return null;

    const grid = document.createElement("div");
    grid.className = "utility-grid";
    for (const [command, label, icon] of items) {
      const action = `remote-${command}`;
      grid.append(
        this.button(
          "utility",
          label,
          icon,
          () => this.remoteCommand(command, action),
          this.busy(action),
          this.busy(action),
        ),
      );
    }
    return grid;
  }

  playback(model) {
    const actions = [
      [model.canPrevious, "media_previous_track", "Previous", "mdi:skip-previous"],
      [model.canPlay, "media_play", "Play", "mdi:play"],
      [model.canPause, "media_pause", "Pause", "mdi:pause"],
      [model.canNext, "media_next_track", "Next", "mdi:skip-next"],
      [model.canStop, "media_stop", "Stop", "mdi:stop"],
    ].filter(([available]) => available);
    if (!actions.length) return null;

    const section = this.section("Playback");
    const row = document.createElement("div");
    row.className = "transport-row";
    for (const [, service, label, icon] of actions) {
      row.append(
        this.button(
          "transport",
          label,
          icon,
          () => this.mediaAction(service),
          this.busy(service),
          this.busy(service),
        ),
      );
    }
    section.append(row);
    return section;
  }

  volumeControl(model) {
    const control = document.createElement("div");
    const readout = document.createElement("span");
    const value = document.createElement("span");
    const status = document.createElement("span");
    control.className = "volume-control";
    readout.className = "volume-readout";
    value.className = "volume-value";
    status.className = "volume-status";
    value.textContent =
      (this.optimisticVolume ?? model.level) === null ? "—" : `${Math.round((this.optimisticVolume ?? model.level) * 100)}%`;
    status.textContent = model.muted
      ? "Muted"
      : this.busy("volume-down") || this.busy("volume-up")
        ? "Adjusting"
        : "Volume";
    readout.append(value, status);
    control.append(
      this.button(
        "volume-button",
        "Volume down",
        "mdi:volume-minus",
        () => this.queueVolume("down"),
        !model.canVolumeDown,
        false,
        { repeat: { delay: 350, interval: 120, coalesce: true }, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) },
      ),
      readout,
      this.button(
        "volume-button",
        "Volume up",
        "mdi:volume-plus",
        () => this.queueVolume("up"),
        !model.canVolumeUp,
        false,
        { repeat: { delay: 350, interval: 120, coalesce: true }, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) },
      ),
    );
    return control;
  }

  keyboard(model) {
    if (!model.canSetKeyboardText) return null;
    const section = this.section("Keyboard");
    const row = document.createElement("div");
    const input = document.createElement("input");
    input.className = "keyboard-input";
    input.type = "text";
    input.placeholder = "Type on Apple TV";
    input.setAttribute("aria-label", "Apple TV keyboard text");
    const set = this.button(
      "utility",
      "Set text",
      "mdi:keyboard",
      () => this.keyboardAction("set_keyboard_text", input.value, "keyboard-set"),
      true,
    );
    const clear = this.button(
      "utility",
      "Clear text",
      "mdi:backspace-outline",
      () => this.keyboardAction("clear_keyboard_text", null, "keyboard-clear"),
      this.busy("keyboard-clear"),
      this.busy("keyboard-clear"),
    );
    input.oninput = () => {
      set.disabled = !input.value;
    };
    row.className = "keyboard";
    row.append(input, set, clear);
    section.append(row);
    return section;
  }

  renderApps(model) {
    const summary = document.createElement("div");
    summary.className = "apps-summary";
    summary.textContent = model.sources.length
      ? "Apps reported as installed by this Apple TV."
      : "No installed apps are currently reported.";
    this.el.body.append(summary);

    if (!model.sources.length) return;
    const grid = document.createElement("div");
    grid.className = "apps-grid";
    grid.setAttribute("role", "listbox");
    grid.setAttribute("aria-label", "Installed Apple TV apps");

    for (const source of model.sources) {
      const action = `source-${source}`;
      const button = document.createElement("button");
      const logo = document.createElement("span");
      const name = document.createElement("span");
      button.type = "button";
      button.className = "app";
      button.setAttribute("role", "option");
      button.setAttribute("aria-label", `Open ${source}`);
      button.setAttribute(
        "aria-selected",
        String(source === model.currentSource),
      );
      button.disabled = !model.canSelectSource || this.busy(action);
      logo.className = "app-logo";
      logo.append(this.icon(this.appIcon(source)));
      name.className = "app-name";
      name.textContent = source;
      button.append(logo, name);
      this.dynamicInteractions.push(interaction(button, { primary: () => this.selectSource(source), optimistic: "selection", feedback: true }));
      grid.append(button);
    }
    this.el.body.append(grid);
  }

  appIcon(source) {
    return appleTvAppIcon(source, this.config?.app_icons);
  }

  async invoke(action, request, success) {
    if (this.busy(action)) return;
    this.pending.add(action);
    this.setMessage("Sending command…");
    try {
      if (!this.config.demo) await request();
      this.setMessage(success);
    } catch {
      this.setMessage("Apple TV did not respond", "error", 4000);
    } finally {
      this.pending.delete(action);
      this.render();
    }
  }

  remoteCommand(command, action) {
    const model = this.model();
    if (
      command === "wakeup"
        ? !model.canWake
        : command === "suspend"
          ? !model.canSleep
          : !model.canNavigate
    ) {
      return;
    }
    return this.invoke(
      action,
      () =>
        this._hass.callService("remote", "send_command", {
          entity_id: model.entities.remote,
          command,
        }),
      "Command sent",
    );
  }

  mediaAction(service) {
    const model = this.model();
    return this.invoke(
      service,
      () =>
        this._hass.callService("media_player", service, {
          entity_id: model.entities.media,
        }),
      "Command sent",
    );
  }

  ensureVolumeCoalescer() {
    if (this.volumeCoalescer) return this.volumeCoalescer;
    this.volumeCoalescer = createRequestCoalescer(async (direction) => {
      const model = this.model();
      if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;
      if (!this.config.demo) await this._hass.callService("media_player", `volume_${direction}`, { entity_id: model.entities.media });
    }, { onError: () => this.setMessage("Apple TV did not respond", "error", 4000) });
    return this.volumeCoalescer;
  }

  updateVolumeReadout(model = this.model()) {
    const value = this.shadowRoot.querySelector(".volume-value");
    const status = this.shadowRoot.querySelector(".volume-status");
    const level = this.optimisticVolume ?? model.level;
    if (value) value.textContent = level === null ? "—" : `${Math.round(level * 100)}%`;
    if (status) status.textContent = model.muted ? "Muted" : this.volumeGestureActive ? "Adjusting" : "Volume";
  }

  setVolumeGesture(pressed, model) {
    this.volumeGestureActive = pressed;
    if (pressed && this.optimisticVolume === null) this.optimisticVolume = model.level;
    if (!pressed) { this.optimisticVolume = null; this.render(); }
  }

  queueVolume(direction) {
    const model = this.model();
    if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;
    const base = this.optimisticVolume ?? model.level;
    if (base !== null) {
      const step = Math.max(0.01, Math.min(0.25, Number(this.config?.volume_step) || 0.05));
      this.optimisticVolume = Math.max(0, Math.min(1, base + (direction === "up" ? step : -step)));
      this.updateVolumeReadout(model);
    }
    this.ensureVolumeCoalescer().request(direction);
  }

  adjustVolume(direction) {
    const model = this.model();
    if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) {
      return;
    }
    const action = `volume-${direction}`;
    return this.invoke(
      action,
      () =>
        this._hass.callService("media_player", `volume_${direction}`, {
          entity_id: model.entities.media,
        }),
      "Volume changed",
    );
  }

  mute(model) {
    return this.invoke(
      "mute",
      () =>
        this._hass.callService("media_player", "volume_mute", {
          entity_id: model.entities.media,
          is_volume_muted: !model.muted,
        }),
      "Audio changed",
    );
  }

  selectSource(source) {
    const model = this.model();
    if (!model.canSelectSource || !model.sources.includes(source)) return;
    const action = `source-${source}`;
    return this.invoke(
      action,
      () =>
        this._hass.callService("media_player", "select_source", {
          entity_id: model.entities.media,
          source,
        }),
      `Opening ${source}`,
    );
  }

  keyboardAction(service, text, action) {
    const model = this.model();
    if (!model.keyboardFocused || !model.entities.configEntryId) return;
    const data = { config_entry_id: model.entities.configEntryId };
    if (text !== null) data.text = text;
    return this.invoke(
      action,
      () => this._hass.callService("apple_tv", service, data),
      "Keyboard updated",
    );
  }

  setMessage(message, type = "info", timeout = 1800) {
    clearTimeout(this.messageTimer);
    this.message = message;
    this.messageType = type;
    this.render();
    if (timeout) {
      this.messageTimer = setTimeout(() => {
        this.message = "";
        this.messageType = "info";
        this.render();
      }, timeout);
    }
  }

  openPanel(mode, trigger) {
    const model = this.model();
    if (mode === "remote" ? !this.canRemote(model) : !model.canSelectSource) {
      return;
    }
    this.panelMode = mode;
    this.panelController.open(trigger);
    this.render();
  }

  closePanel(restore) {
    this.volumeGestureActive = false;
    this.optimisticVolume = null;
    this.panelMode = null;
    this.panelController.close(restore);
    this.render();
  }
}

registerCard({
  type: "component-apple-tv-controller-v1",
  element: ComponentAppleTvControllerV1,
  name: "Apple TV Controller",
  description:
    "Apple TV remote and installed-app launcher generated from live Home Assistant capabilities.",
});
}

// Module: src/components/section-separator.js
{
/** ComponentSectionSeparatorV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentSectionSeparatorV2 extends DashboardBaseCard{
 setConfig(c){this.c={icon:'mdi:gesture-tap-button',title:'Section label',...c};this.r()} getCardSize(){return 1}
 r(){this.shadowRoot.innerHTML=`<style>${this.cardStyles()}ha-card{background:transparent;border:0;box-shadow:none}.wrap{padding:7px 2px 5px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color)}.wrap ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.label{font-size:12px;font-weight:600;color:var(--primary-text-color)}.line{height:1px;background:var(--divider-color);flex:1}</style><ha-card><div class="wrap"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="label">${this.escapeHtml(this.c.title)}</span><span class="line"></span></div></ha-card>`}}
registerCard({ type: "component-section-separator-v2", element: ComponentSectionSeparatorV2, name: "Section Separator", description: "Reusable section separator component." });
}

// Module: src/components/room-sheet.js
{
/** ComponentRoomSheetV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomSheetV2 extends DashboardBaseCard{
 constructor(){super();this._hass=null;this._interactions=[]}
 setConfig(c){this.c={icon:'mdi:bed-king-outline',title:'Room name',rows:null,...c};this.r()}
 set hass(h){this._hass=h;this.r()}
 connectedCallback(){if(this.c)this.r()}
 disconnectedCallback(){for(const handle of this._interactions)handle.destroy();this._interactions=[]}
 getCardSize(){return 5}
 _defaults(){return[
  {section:'Room state',icon:'mdi:thermometer',name:'Status metric',state:'Supporting context',value:'Value'},
  {section:'Controls',icon:'mdi:lightbulb-outline',name:'Control name',state:'Current state',value:'Value'},
  {section:'Controls',icon:'mdi:thermostat',name:'Control name',state:'Current state',value:'Value'},
 ]}
 _action(row){
  if(row.navigation_path)return()=>navigateTo(row.navigation_path);
  if(row.service&&this._hass){const [domain,service]=String(row.service).split('.');if(domain&&service)return()=>this._hass.callService(domain,service,{...(row.service_data||{}),...(row.entity?{entity_id:row.entity}:{})})}
  if(row.entity)return()=>openMoreInfo(this,row.entity);
  return null
 }
 r(){
  if(!this.c)return;
  for(const handle of this._interactions)handle.destroy();this._interactions=[];
  const rows=Array.isArray(this.c.rows)&&this.c.rows.length?this.c.rows.slice(0,8):this._defaults();
  let section=null,body='';
  rows.forEach((row,index)=>{const next=row.section||'Controls';if(next!==section){section=next;body+=`<div class="sep">${this.escapeHtml(section)}</div>`}const action=this._action(row),tag=action?'button':'div',attrs=action?' type="button"':'';body+=`<${tag} class="row${action?' actionable':''}" data-row="${index}"${attrs}><ha-icon icon="${this.escapeHtml(row.icon||'mdi:circle-outline')}"></ha-icon><span><div class="rname">${this.escapeHtml(row.name||'Control name')}</div><div class="rstate">${this.escapeHtml(row.state||'')}</div></span><span class="rvalue">${this.escapeHtml(row.value||'')}</span></${tag}>`});
  this.shadowRoot.innerHTML=`<style>${this.cardStyles()}.wrap{padding:0}.head{padding:13px 14px 11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--divider-color)}.head-left{display:flex;align-items:center;gap:9px}.head-left ha-icon{color:var(--primary-color)}.close{width:32px;height:32px;border:1px solid var(--dashboard-card-border-color,var(--divider-color))!important;border-radius:var(--dashboard-radius-control,5px)!important;color:var(--secondary-text-color);padding:0!important}.body{padding:8px 14px 12px}.sep{display:flex;align-items:center;gap:7px;margin:8px 0 6px;font-size:11px;font-weight:600;color:var(--secondary-text-color)}.sep:after{content:'';height:1px;background:var(--divider-color);flex:1}.row{appearance:none;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;min-height:46px;display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:8px;border-radius:var(--dashboard-radius-control,8px);cursor:pointer;padding:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.row ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.rname{font-size:12px;font-weight:600}.rstate,.rvalue{font-size:10.5px;color:var(--secondary-text-color)}.rvalue{font-weight:600;color:var(--primary-text-color)}</style><style>.row:not(.actionable){cursor:default}.row:not(.actionable):active{background:transparent}.close.preview-only{display:grid;place-items:center}</style><ha-card><div class="wrap"><div class="head"><span class="head-left"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="title">${this.escapeHtml(this.c.title)}</span></span><span class="i close preview-only" aria-hidden="true"><ha-icon icon="mdi:close"></ha-icon></span></div><div class="body">${body}</div></div></ha-card>`;
  rows.forEach((row,index)=>{const action=this._action(row);if(!action)return;const el=this.shadowRoot.querySelector(`[data-row="${index}"]`);if(!el)return;el.setAttribute('aria-label',row.aria_label||`${row.name||'Room control'}`);this._interactions.push(interaction(el,{primary:action,hold:row.entity&&row.navigation_path?()=>openMoreInfo(this,row.entity):null,optimistic:false,repeat:false,feedback:true}))})
 }
}
registerCard({ type: "component-room-sheet-v2", element: ComponentRoomSheetV2, name: "Room Sheet", description: "Reusable room-sheet component." });
}

// Module: src/components/household-attention.js
{
/** ComponentHouseholdAttentionV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentHouseholdAttentionV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){
    super();this.attachShadow({mode:"open"});this.c=null;this._hass=null;this._connection=null;
    this._registry=null;this._loading=null;this._registrySubscription=null;this._refreshTimer=null;this._renderSignature=null;this._interactionHandles=[];
  }
  setConfig(c){this.c={title:"Needs attention",icon:"mdi:alert-circle-outline",max_items:6,demo:false,...c};this._renderSignature=null;this._render()}
  set hass(h){
    const connection=h?.connection||null;
    if(this._connection!==connection){this._unsubscribe();this._connection=connection;this._registry=null;this._loading=null}
    this._hass=h;this._subscribe();this._load();this._render();
  }
  connectedCallback(){this._subscribe();this._load();this._renderSignature=null;this._render()}
  disconnectedCallback(){for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];clearTimeout(this._refreshTimer);this._refreshTimer=null;this._unsubscribe()}
  getCardSize(){return this.c?.demo?2:1}
  _subscribe(){
    if(!this.isConnected||this._registrySubscription||!this._connection?.subscribeEvents)return;
    const pending=Promise.resolve(this._connection.subscribeEvents(()=>this._queueRefresh(),"entity_registry_updated"));
    this._registrySubscription=pending;
    pending.catch(()=>{if(this._registrySubscription===pending)this._registrySubscription=null});
  }
  _unsubscribe(){
    clearTimeout(this._refreshTimer);this._refreshTimer=null;
    const pending=this._registrySubscription;this._registrySubscription=null;
    if(pending)Promise.resolve(pending).then(fn=>fn?.()).catch(()=>{});
  }
  _queueRefresh(){
    clearTimeout(this._refreshTimer);
    this._refreshTimer=setTimeout(()=>{this._refreshTimer=null;this._registry=null;this._loading=null;this._load(true)},180);
  }
  _load(force=false){
    if(this.c?.demo||!this._connection?.sendMessagePromise)return Promise.resolve(null);
    if(this._registry&&!force)return Promise.resolve(this._registry);
    if(this._loading)return this._loading;
    const connection=this._connection;
    this._loading=connection.sendMessagePromise({type:"config/entity_registry/list"})
      .then(rows=>{
        if(connection!==this._connection)return null;
        this._registry=Array.isArray(rows)?rows:[];this._loading=null;this._render();return this._registry;
      })
      .catch(()=>{if(connection===this._connection){this._loading=null;this._registry=[];this._render()}return null});
    return this._loading;
  }
  _escape(value){return escapeHtml(value)}
  _issues(){
    if(this.c?.demo)return[
      {entity_id:"binary_sensor.demo_garage",name:"Garage door",status:"Open",severity:"warning",severity_text:"Check",icon:"mdi:garage-open"},
      {entity_id:"binary_sensor.demo_leak",name:"Laundry leak sensor",status:"Detected",severity:"critical",severity_text:"Critical",icon:"mdi:water-alert"}
    ];
    if(!this._hass||!this._registry)return[];
    const issues=[];
    for(const entry of this._registry){
      if(!entry?.entity_id||entry.disabled_by||entry.hidden_by||["diagnostic","config"].includes(entry.entity_category))continue;
      const state=this._hass.states?.[entry.entity_id];if(!state)continue;
      const domain=entry.entity_id.split(".")[0],deviceClass=entry.device_class||state.attributes?.device_class||"";
      let issue=null;
      if(entry.entity_id.endsWith("_controller_status")&&state.state==="off"){
        issue={status:"Controller offline",severity:"critical",severity_text:"Critical",icon:"mdi:access-point-network-off"};
      }else if(domain==="binary_sensor"&&state.state==="on"&&["smoke","moisture","gas"].includes(deviceClass)){
        issue={status:"Detected",severity:"critical",severity_text:"Critical",icon:deviceClass==="smoke"?"mdi:smoke-detector-alert":deviceClass==="gas"?"mdi:gas-cylinder":"mdi:water-alert"};
      }else if(domain==="binary_sensor"&&state.state==="on"&&["door","window","garage_door"].includes(deviceClass)){
        issue={status:"Open",severity:"warning",severity_text:"Check",icon:deviceClass==="window"?"mdi:window-open-variant":deviceClass==="garage_door"?"mdi:garage-open":"mdi:door-open"};
      }else if(domain==="lock"&&state.state==="unlocked"){
        issue={status:"Unlocked",severity:"warning",severity_text:"Check",icon:"mdi:lock-open-variant-outline"};
      }
      if(issue)issues.push({entity_id:entry.entity_id,name:entry.name||entry.original_name||state.attributes?.friendly_name||entry.entity_id,...issue});
    }
    return issues.sort((a,b)=>(a.severity==="critical"?0:1)-(b.severity==="critical"?0:1)||a.name.localeCompare(b.name,undefined,{sensitivity:"base"})).slice(0,Math.max(1,Number(this.c?.max_items)||6));
  }
  _open(entityId){
    if(this.c?.demo)return;
    openMoreInfo(this,entityId);
  }
  _render(){
    if(!this.c)return;
    const issues=this._issues(),visible=issues.length>0;
    const signature=JSON.stringify([this.c.title,this.c.icon,issues]);
    if(signature===this._renderSignature)return;
    this._renderSignature=signature;
    for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];
    this.style.display=visible?"block":"none";this.toggleAttribute("aria-hidden",!visible);
    if(!visible){if(this.shadowRoot.childNodes.length)this.shadowRoot.replaceChildren();return}
    const rows=issues.map(issue=>'<button class="issue '+this._escape(issue.severity)+'" type="button" data-entity="'+this._escape(issue.entity_id)+'" aria-label="'+this._escape(issue.name+", "+issue.status+". Open details.")+'"><span class="issue-icon"><ha-icon icon="'+this._escape(issue.icon)+'"></ha-icon></span><span class="copy"><span class="name">'+this._escape(issue.name)+'</span><span class="state">'+this._escape(issue.status)+'</span></span><span class="severity">'+this._escape(issue.severity_text)+'</span></button>').join("");
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}ha-card{border:0;box-shadow:none;background:transparent;color:var(--primary-text-color)}.head{min-height:36px;display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:0 2px}.head ha-icon{color:var(--error-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.issue{appearance:none;width:100%;min-height:52px;padding:6px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-left:3px solid var(--warning-color,#f9a825);border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-warning-surface,var(--card-background-color));display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:8px;text-align:left;cursor:pointer}.issue.critical{border-left-color:var(--error-color)}.issue:hover,.issue:focus-visible{background:var(--dashboard-card-muted-surface,var(--card-background-color));outline:2px solid var(--primary-color);outline-offset:1px}.issue-icon{width:36px;height:36px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;color:var(--warning-color,#f9a825);background:transparent}.critical .issue-icon{color:var(--error-color)}.issue-icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0;display:flex;flex-direction:column;gap:2px}.name{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.state{font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.severity{font-size:12px;font-weight:650;color:var(--warning-color,#f9a825)}.critical .severity{color:var(--error-color)}@media(max-width:700px){.grid{grid-template-columns:1fr}.issue{min-height:56px}}</style><ha-card><div class="head"><ha-icon icon="'+this._escape(this.c.icon)+'"></ha-icon><h2>'+this._escape(this.c.title)+'</h2></div><div class="grid">'+rows+'</div></ha-card>';
    for(const button of this.shadowRoot.querySelectorAll(".issue"))this._interactionHandles.push(interaction(button,{primary:()=>this._open(button.dataset.entity),optimistic:false,repeat:false,feedback:true}));
  }
}
registerCard({ type: "component-household-attention-v1", element: ComponentHouseholdAttentionV1, name: "Household Attention", description: "Registry-aware household attention component." });
}

// Module: src/components/room-navigation.js
{
/** ComponentRoomNavigationV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, loadDashboardRegistries, navigateTo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomNavigationV1 extends HTMLElement{
  static getGridOptions(){return{columns:6,rows:1}}
  constructor(){super();this.attachShadow({mode:"open"});this.c=null;this._hass=null;this._connection=null;this._registries=null;this._registriesPromise=null;this._renderSignature="";this._interaction=null}
  setConfig(config){
    this.c={name:"Room",icon:"mdi:home-outline",area:null,navigation_path:null,...config};
    if(!this.c.area)throw new Error("area is required");
    if(!this.c.navigation_path)throw new Error("navigation_path is required");
    this._renderSignature="";this._render();
  }
  set hass(hass){
    const connection=hass&&hass.connection||null;
    if(connection!==this._connection){this._connection=connection;this._registries=null;this._registriesPromise=null;this._load()}
    this._hass=hass;this._render();
  }
  connectedCallback(){this._load();this._render()}
  disconnectedCallback(){this._interaction?.destroy();this._interaction=null}
  _load(){
    const connection=this._connection;
    if(!connection||this._registries||this._registriesPromise)return;
    const request=loadDashboardRegistries(connection);
    this._registriesPromise=request;
    request.then(registries=>{
      if(connection!==this._connection)return;
      this._registries=registries;this._render();
    }).catch(()=>{}).finally(()=>{if(this._registriesPromise===request)this._registriesPromise=null});
  }
  _escape(value){return escapeHtml(value)}
  _entities(){
    if(!this._registries||!this._hass)return[];
    const areaKey=String(this.c.area).trim().toLowerCase();
    const area=this._registries.areas.find(row=>row.area_id===this.c.area||String(row.name||"").trim().toLowerCase()===areaKey);
    if(!area)return[];
    const deviceAreas=new Map(this._registries.devices.map(row=>[row.id,row.area_id]));
    return this._registries.entities
      .filter(row=>row&&!row.disabled_by&&!row.hidden_by&&(row.area_id===area.area_id||deviceAreas.get(row.device_id)===area.area_id))
      .map(row=>this._hass.states[row.entity_id])
      .filter(Boolean);
  }
  _formatted(state){
    try{return this._hass.formatEntityState(state)}
    catch(error){return String(state&&state.state||"")}
  }
  _status(){
    const states=this._entities().filter(state=>!["unknown","unavailable"].includes(state.state));
    const climate=states.find(state=>state.entity_id.startsWith("climate.")&&state.attributes&&!Number.isNaN(Number.parseFloat(state.attributes.current_temperature)));
    const blockedTemperature=/(_controller_temperature|_outside_air_temperature|cpu_temperature|processor_temperature|board_temperature|chip_temperature|internal_temperature)$/;
    const byClass=deviceClass=>states.find(state=>state.entity_id.startsWith("sensor.")&&state.attributes&&state.attributes.device_class===deviceClass&&!blockedTemperature.test(state.entity_id)&&!Number.isNaN(Number.parseFloat(state.state)));
    const temperature=byClass("temperature"),humidity=byClass("humidity");
    const climateTemperature=climate?Number.parseFloat(climate.attributes.current_temperature):null;
    const temperatureUnit=climate&&(climate.attributes.temperature_unit||(this._hass.config&&this._hass.config.unit_system&&this._hass.config.unit_system.temperature))||"°C";
    const temperatureText=climate?climateTemperature.toLocaleString(this._hass.locale&&this._hass.locale.language||undefined,{maximumFractionDigits:1})+" "+temperatureUnit:temperature?this._formatted(temperature):"";
    const lightsOn=states.filter(state=>state.entity_id.startsWith("light.")&&state.state==="on").length;
    const critical=states.some(state=>state.entity_id.startsWith("binary_sensor.")&&state.state==="on"&&["smoke","moisture","gas"].includes(state.attributes&&state.attributes.device_class));
    const warning=states.some(state=>(state.entity_id.startsWith("binary_sensor.")&&state.state==="on"&&state.attributes&&state.attributes.device_class==="garage_door")||(state.entity_id.startsWith("cover.")&&["open","opening"].includes(state.state)&&state.attributes&&state.attributes.device_class==="garage"));
    const active=lightsOn>0||states.some(state=>(state.entity_id.startsWith("climate.")&&["heating","cooling","drying","fan"].includes(state.attributes&&state.attributes.hvac_action))||(state.entity_id.startsWith("media_player.")&&state.state==="playing"));
    const parts=[];
    if(critical)parts.push("Attention required");
    else if(warning)parts.push("Garage open");
    if(temperatureText)parts.push(temperatureText);
    if(humidity)parts.push(this._formatted(humidity));
    if(lightsOn)parts.push(lightsOn+" light"+(lightsOn===1?"":"s")+" on");
    return{summary:parts.slice(0,3).join(" · "),severity:critical?"critical":warning?"warning":active?"active":""};
  }
  _navigate(){
    navigateTo(this.c.navigation_path);
  }
  _render(){
    if(!this.c)return;
    const status=this._status(),summary=status.summary;
    const signature=JSON.stringify([this.c.name,this.c.icon,this.c.navigation_path,status.summary,status.severity]);
    if(signature===this._renderSignature)return;
    this._renderSignature=signature;
    this._interaction?.destroy();this._interaction=null;
    const label="Open "+this.c.name+(summary?". "+summary:"");
    this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}button{appearance:none;width:100%;min-height:56px;padding:0 12px 0 10px;border:0;border-left:2px solid transparent;background:transparent;color:inherit;font:inherit;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px;cursor:pointer}.icon{width:36px;height:36px;display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:21px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}button.active{border-left-color:transparent;background:transparent}button.active .icon{color:color-mix(in srgb,var(--primary-color) 68%,var(--secondary-text-color))}button.warning{border-left-color:var(--warning-color,#f9a825);background:var(--dashboard-warning-surface,var(--card-background-color))}button.warning .icon{color:var(--warning-color,#f9a825)}button.critical{border-left-color:var(--error-color);background:var(--dashboard-critical-surface,var(--card-background-color))}button.critical .icon{color:var(--error-color)}button:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}@media(max-width:420px){button{padding-right:10px;gap:8px}}</style><ha-card><button class="'+this._escape(status.severity)+'" type="button" aria-label="'+this._escape(label)+'"><span class="icon"><ha-icon icon="'+this._escape(this.c.icon)+'"></ha-icon></span><span class="copy"><span class="name">'+this._escape(this.c.name)+'</span>'+(summary?'<span class="summary">'+this._escape(summary)+'</span>':"")+'</span></button></ha-card>';
    this._interaction=interaction(this.shadowRoot.querySelector("button"),{primary:()=>this._navigate(),feedback:true});
  }
}
registerCard({ type: "component-room-navigation-v1", element: ComponentRoomNavigationV1, name: "Room Navigation", description: "Area-aware room navigation with presence status." });
}

// Module: src/components/history-graph.js
{
/** ComponentHistoryGraphV2 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentHistoryGraphV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.ro = null;
    this.timer = null;
    this.hiddenSeries = new Set();
    this.pinned = false;
    this.pointerState = null;
    this.interactions = [];
    this.outside = (event) => {
      if (!this.pinned || event.composedPath?.().includes(this)) return;
      this.pinned = false;
      this.hide();
    };
  }
  setConfig(c) {
    this.c = { meta_text: 'Aggregation label', series_1_label: 'Primary series', series_2_label: 'Secondary series', series_3_label: 'Supporting series', positive_label: 'Positive', negative_label: 'Negative', ...c };
    if (!this.b) this.build();
    this.draw();
  }
  set hass(h) {}
  connectedCallback() {
    this.e?.chart && this.ro?.observe(this.e.chart);
    window.addEventListener('pointerdown', this.outside, true);
    this.draw();
  }
  disconnectedCallback() {
    this.ro?.disconnect();
    clearTimeout(this.timer);
    this.timer = null;
    window.removeEventListener('pointerdown', this.outside, true);
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
  }
  getCardSize() { return 7; }
  build() {
    this.b = 1;
    this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:4px 5px 5px}.top{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 5px}.meta{font-size:11.5px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.legend{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}.legend button{appearance:none;min-height:44px;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:12px;font-weight:600;padding:3px 0;display:flex;align-items:center;gap:6px;cursor:pointer}.legend button:active{transform:scale(.97)}.legend button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:5px}.sw{width:17px;height:3px;border-radius:999px}.s1{background:var(--primary-color)}.s2{background:var(--warning-color,#f5b942)}.s3{background:var(--secondary-text-color)}.chart{position:relative;width:100%;height:clamp(400px,48vw,520px)}svg{display:block;width:100%;height:100%;overflow:hidden;touch-action:none}.axis{fill:var(--secondary-text-color);font-size:11px;font-weight:500;font-family:inherit}.small{fill:var(--secondary-text-color);font-size:10px;font-weight:600;font-family:inherit}.grid{stroke:var(--divider-color);stroke-width:1;opacity:.58}.zero{stroke:var(--divider-color);stroke-width:1.35;opacity:.95}.l1{fill:none;stroke:var(--primary-color);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.l2{fill:none;stroke:var(--warning-color,#f5b942);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.f2{fill:color-mix(in srgb,var(--warning-color,#f5b942) 12%,transparent)}.l3{fill:none;stroke:var(--secondary-text-color);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.cursor{stroke:var(--secondary-text-color);stroke-width:1;stroke-dasharray:3 3;opacity:0}.tip{position:absolute;min-width:145px;padding:9px 10px;border-radius:11px;background:var(--card-background-color);border:1px solid var(--divider-color);box-shadow:0 7px 22px rgba(0,0,0,.2);pointer-events:none;opacity:0;transform:translate(-50%,-100%);font-size:11.5px;line-height:1.45}.tip.show{opacity:1}.tip b{color:var(--primary-text-color);font-weight:650}.tr{display:flex;justify-content:space-between;gap:14px;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:3px}.legend{gap:9px}.legend button,.meta{font-size:10.5px}.chart{height:400px}.axis{font-size:10px}.small{font-size:9.5px}}</style><ha-card><div class="wrap"><div class="top"><div class="meta"></div><div class="legend">${[1, 2, 3].map((i) => `<button type="button" data-series="${i}" aria-pressed="true"><span class="sw s${i}"></span><span class="k${i}"></span></button>`).join('')}</div></div><div class="chart"><svg role="img" aria-label="Interactive reusable graph example"></svg><div class="tip"></div></div></div></ha-card>`;
    this.e = { m: this.shadowRoot.querySelector('.meta'), svg: this.shadowRoot.querySelector('svg'), tip: this.shadowRoot.querySelector('.tip'), chart: this.shadowRoot.querySelector('.chart'), ks: [1, 2, 3].map((i) => this.shadowRoot.querySelector(`.k${i}`)) };
    this.e.svg.addEventListener('pointerdown', (event) => this.pointerDown(event));
    this.e.svg.addEventListener('pointermove', (event) => this.pointerMove(event));
    this.e.svg.addEventListener('pointerup', (event) => this.pointerUp(event));
    this.e.svg.addEventListener('pointercancel', () => { this.pointerState = null; });
    this.e.svg.addEventListener('pointerleave', () => { if (!this.pinned && !this.pointerState) this.hide(); });
    for (const button of this.shadowRoot.querySelectorAll('.legend button')) {
      const index = Number(button.dataset.series);
      this.interactions.push(interaction(button, { primary: () => this.toggleSeries(index, button), optimistic: 'selection', feedback: true }));
    }
    this.ro = new ResizeObserver(() => { clearTimeout(this.timer); this.timer = setTimeout(() => this.draw(), 40); });
    this.ro.observe(this.e.chart);
  }
  toggleSeries(index, button) {
    if (this.hiddenSeries.has(index)) this.hiddenSeries.delete(index);
    else this.hiddenSeries.add(index);
    button.setAttribute('aria-pressed', String(!this.hiddenSeries.has(index)));
    this.draw();
  }
  draw() {
    if (!this.e || !this.c) return;
    this.e.m.textContent = this.c.meta_text;
    this.e.ks.forEach((x, i) => x.textContent = this.c[`series_${i + 1}_label`]);
    const r = this.e.chart.getBoundingClientRect(), W = Math.max(320, Math.round(r.width || 800)), H = Math.max(340, Math.round(r.height || 420));
    this.e.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const L = W < 520 ? 48 : 58, R = 8, T = 6, B = Math.round(H * .70), AY = B + 20, GT = AY + 18, GB = H - 18, x0 = L, x1 = W - R, w = x1 - x0, h = B - T, z = (GT + GB) / 2;
    const p = (rx, ry) => `${(x0 + w * rx).toFixed(1)},${(T + h * ry).toFixed(1)}`, g = (rx, ry) => `${(x0 + w * rx).toFixed(1)},${(z + (GB - GT) * .32 * ry).toFixed(1)}`;
    const d1 = `M${p(0, .68)} L${p(.08, .61)} L${p(.17, .70)} L${p(.26, .38)} L${p(.35, .52)} L${p(.44, .24)} L${p(.53, .43)} L${p(.62, .35)} L${p(.72, .63)} L${p(.82, .48)} L${p(.91, .59)} L${p(1, .44)}`;
    const d2 = `M${p(0, .86)} L${p(.12, .75)} L${p(.24, .52)} L${p(.36, .42)} L${p(.48, .55)} L${p(.60, .72)} L${p(.72, .82)} L${p(.84, .91)} L${p(1, .94)}`;
    const d3 = `M${g(0, .08)} L${g(.1, -.10)} L${g(.2, .12)} L${g(.3, -.20)} L${g(.4, .02)} L${g(.5, -.35)} L${g(.6, .16)} L${g(.7, .28)} L${g(.8, -.12)} L${g(.9, .05)} L${g(1, -.08)}`;
    const fill = `${d2} L${x1},${B} L${x0},${B} Z`;
    let q = '';
    ['Max', '75%', '50%', '25%', '0'].forEach((t, i) => { const y = T + h * i / 4; q += `<line class="grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"></line><text class="axis" x="${x0 - 8}" y="${y + 4}" text-anchor="end">${t}</text>`; });
    ['Start', '¼', '½', '¾', 'End'].forEach((t, i) => { const x = x0 + w * i / 4; q += `<text class="axis" x="${x}" y="${AY}" text-anchor="${i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}">${t}</text>`; });
    q += `<line class="zero" x1="${x0}" y1="${z}" x2="${x1}" y2="${z}"></line><text class="small" x="${x1 - 2}" y="${GT + 10}" text-anchor="end">${escapeHtml(this.c.positive_label)}</text><text class="small" x="${x1 - 2}" y="${GB - 3}" text-anchor="end">${escapeHtml(this.c.negative_label)}</text>${this.hiddenSeries.has(2) ? '' : `<path class="f2" d="${fill}"></path><path class="l2" d="${d2}"></path>`}${this.hiddenSeries.has(1) ? '' : `<path class="l1" d="${d1}"></path>`}${this.hiddenSeries.has(3) ? '' : `<path class="l3" d="${d3}"></path>`}<line class="cursor" x1="0" y1="${T}" x2="0" y2="${GB}"></line>`;
    this.e.svg.innerHTML = q;
    this.geo = { W, H, x0, x1, T, GB };
    if (!this.pinned) this.hide();
  }
  pointerDown(event) {
    this.pointerState = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    this.pointer(event);
  }
  pointerMove(event) {
    if (this.pointerState?.id === event.pointerId) {
      if (Math.hypot(event.clientX - this.pointerState.x, event.clientY - this.pointerState.y) > 6) this.pointerState.moved = true;
      this.pointer(event);
      return;
    }
    if (!this.pinned && event.pointerType !== 'touch') this.pointer(event);
  }
  pointerUp(event) {
    const state = this.pointerState;
    if (!state || state.id !== event.pointerId) return;
    this.pointerState = null;
    if (!state.moved) {
      if (this.pinned) { this.pinned = false; this.hide(); }
      else { this.pointer(event); this.pinned = true; }
    } else {
      this.pinned = false;
      if (event.pointerType === 'touch') this.hide();
    }
  }
  pointer(ev) {
    const g = this.geo;
    if (!g) return;
    const r = this.e.svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (g.W / r.width), x = Math.max(g.x0, Math.min(g.x1, px)), ratio = (x - g.x0) / (g.x1 - g.x0), pct = Math.round(ratio * 100), c = this.e.svg.querySelector('.cursor');
    c.setAttribute('x1', x); c.setAttribute('x2', x); c.style.opacity = '1';
    const rows = [
      [1, this.c.series_1_label, Math.round(20 + ratio * 80)],
      [2, this.c.series_2_label, Math.round(75 - ratio * 45)],
      [3, this.c.series_3_label, Math.round((ratio - .5) * 40)],
    ].filter(([index]) => !this.hiddenSeries.has(index));
    this.e.tip.innerHTML = `<div style="font-weight:650;margin-bottom:4px">${pct}% through range</div>${rows.map(([, label, value]) => `<div class="tr"><span>${escapeHtml(label)}</span><b>${value}</b></div>`).join('')}`;
    this.e.tip.style.left = `${(x / g.W) * r.width}px`; this.e.tip.style.top = `${Math.max(70, r.height * .42)}px`; this.e.tip.classList.add('show');
  }
  hide() { this.e.tip.classList.remove('show'); const c = this.e.svg.querySelector('.cursor'); if (c) c.style.opacity = '0'; }
}
registerCard({ type: "component-history-graph-v2", element: ComponentHistoryGraphV2, name: "History Graph", description: "Reusable interactive history graph component." });
}

// Module: src/components/context-strip.js
{
/** ComponentContextStripV3 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentContextStripV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._interaction=null;this._hass=null}
  setConfig(c){this.c={left_text:'Left context',center_1_label:'Primary metric',center_1_value:'00%',center_2_label:'Secondary metric',center_2_value:'00%',center_3_label:'Tertiary metric',center_3_value:'00%',right_text:'Right context',navigation_path:null,entity:null,...(c||{})};this._render()}
  set hass(h){this._hass=h}
  connectedCallback(){if(this.c)this._render()}
  disconnectedCallback(){this._interaction?.destroy();this._interaction=null}
  getCardSize(){return 1}
  _action(){if(this.c.navigation_path)return()=>navigateTo(this.c.navigation_path);if(this.c.entity)return()=>openMoreInfo(this,this.c.entity);return null}
  _render(){
    this._interaction?.destroy();this._interaction=null;
    const action=this._action(),tag=action?'button':'div',rootClass=action?'':'context-static',attrs=action?' type="button"':'';
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;color:inherit}
button:active{transform:scale(.997)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.mid{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.item{display:flex;align-items:baseline;gap:4px}.lab{font-weight:500}.val{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.mid{gap:10px}.item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.mid{gap:7px}}
</style><style>.context-static{width:100%;min-height:44px;box-sizing:border-box;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden}@media(max-width:900px){.context-static{gap:10px;padding:11px 12px;font-size:11px}}@media(max-width:650px){.context-static{font-size:11px;gap:6px;padding:10px}}</style><ha-card><${tag} class="${rootClass}"${attrs}><span class="phase">${escapeHtml(this.c.left_text)}</span><span class="mid">${[1,2,3].map(i=>`<span class="item"><span class="lab">${escapeHtml(this.c[`center_${i}_label`])}</span><span class="val">${escapeHtml(this.c[`center_${i}_value`])}</span></span>`).join('')}</span><span class="event">${escapeHtml(this.c.right_text)}</span></${tag}></ha-card>`;
    if(action)this._interaction=interaction(this.shadowRoot.querySelector('button'),{primary:action,optimistic:false,repeat:false,feedback:true});
  }
}
registerCard({ type: "component-context-strip-v3", element: ComponentContextStripV3, name: "Context Strip", description: "Reusable context and metric strip component." });
}

// Module: src/components/metric-pair.js
{
/** ComponentMetricPairCardV3 — reusable Home Assistant dashboard card. */
const { formatEnergy, formatPower, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentMetricPairCardV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._selectedDay=this._dayKey(new Date());this._stats={};this._loading=false;this._error='';this._lastKey=null;this._interactions=[];this._dayListener=e=>this._onDayChange(e)}
  setConfig(c){this.c={left_value:'Primary value',left_label:'Primary label',right_value:'Secondary value',right_label:'Secondary label',right_primary:'Primary text',right_secondary:'Secondary text',deadband:15,day_channel:null,...(c||{})};if(this._built){this._render();this._scheduleStats()}}
  set hass(h){this.h=h;if(!this._built)this._build();this._render();this._scheduleStats()}
  connectedCallback(){window.addEventListener('energy-day-selector-change',this._dayListener);if(!this._selectedDay)this._selectedDay=this._dayKey(new Date());this._bindInteractions();this._scheduleStats()}
  disconnectedCallback(){window.removeEventListener('energy-day-selector-change',this._dayListener);for(const handle of this._interactions)handle.destroy();this._interactions=[]}
  getCardSize(){return 2}
  _build(){this._built=true;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:12px 14px;display:grid;grid-template-columns:minmax(82px,auto) minmax(0,1fr);gap:16px;align-items:stretch}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;min-width:0;min-height:44px}button:not(:disabled){cursor:pointer}button:disabled{opacity:1}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:4px;border-radius:8px}.left{text-align:left;display:flex;flex-direction:column;align-items:flex-start;padding-top:1px}.right{text-align:right;display:flex;flex-direction:column;justify-content:center;align-items:flex-end}.left-value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em;color:var(--primary-text-color);white-space:nowrap;font-variant-numeric:tabular-nums}.left-label{margin-top:4px;font-size:13px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap}.right-top,.right-bottom{width:100%;display:flex;align-items:center;justify-content:flex-end;gap:5px;max-width:100%;font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.right-bottom{margin-top:4px}.right-value,.right-primary{font-weight:600;color:var(--primary-text-color);flex:0 0 auto;font-variant-numeric:tabular-nums}.right-label,.right-secondary{font-weight:500;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;grid-template-columns:minmax(76px,auto) minmax(0,1fr);gap:12px}.left-value{font-size:25px}.right-top,.right-bottom{font-size:13px}}</style><ha-card><div class="wrap"><button class="left" type="button"><div class="left-value"></div><div class="left-label"></div></button><button class="right" type="button"><div class="right-top"><span class="right-value"></span><span class="right-label"></span></div><div class="right-bottom"><span class="right-primary"></span><span class="right-secondary"></span></div></button></div></ha-card>`;this.e={left:this.shadowRoot.querySelector('.left'),right:this.shadowRoot.querySelector('.right'),leftValue:this.shadowRoot.querySelector('.left-value'),leftLabel:this.shadowRoot.querySelector('.left-label'),rightValue:this.shadowRoot.querySelector('.right-value'),rightLabel:this.shadowRoot.querySelector('.right-label'),rightPrimary:this.shadowRoot.querySelector('.right-primary'),rightSecondary:this.shadowRoot.querySelector('.right-secondary')};this._bindInteractions()}
  _bindInteractions(){if(!this.e||this._interactions.length)return;this._interactions.push(interaction(this.e.left,{primary:()=>this._more(this._clickEntity('left')),feedback:true}),interaction(this.e.right,{primary:()=>this._more(this._clickEntity('right')),feedback:true}))}
  _entity(v){if(!v||typeof v!=='object')return null;if(typeof v.entity==='string')return v.entity;if(Array.isArray(v.entities))return v.entities.find(x=>typeof x==='string')||null;if(Array.isArray(v.terms)){const t=v.terms.find(x=>x&&typeof x.entity==='string');return t?.entity||null}return null}
  _clickEntity(side){if(side==='left')return this.c.left_more_info_entity||this._entity(this.c.left_value)||this._entity(this.c.left_label);return this.c.right_more_info_entity||this._entity(this.c.right_value)||this._entity(this.c.right_label)||this._entity(this.c.right_primary)||this._entity(this.c.right_secondary)}
  _more(entityId){openMoreInfo(this,entityId)}
  _dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  _dayStart(day){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day||''));if(!m)return null;const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));if(d.getFullYear()!==Number(m[1])||d.getMonth()!==Number(m[2])-1||d.getDate()!==Number(m[3]))return null;d.setHours(0,0,0,0);return d}
  _isToday(){return this._selectedDay===this._dayKey(new Date())}
  _range(){const start=this._dayStart(this._selectedDay)||this._dayStart(this._dayKey(new Date()));const end=new Date(start);end.setDate(end.getDate()+1);return{start:start.getTime(),end:end.getTime()}}
  _formatNeeds(v){if(!v||typeof v!=='object')return null;return String(v.format||'').startsWith('energy_kwh_day')?'change':null}
  _statEntities(){const change=new Set(),vals=[this.c?.left_value,this.c?.left_label,this.c?.right_value,this.c?.right_label,this.c?.right_primary,this.c?.right_secondary];for(const v of vals){if(this._formatNeeds(v)!=='change')continue;if(typeof v.entity==='string')change.add(v.entity);for(const id of v.entities||[])if(typeof id==='string')change.add(id);for(const term of v.terms||[])if(typeof term?.entity==='string')change.add(term.entity)}return{change:[...change].sort()}}
  _currentKey(){const ids=this._statEntities(),refresh=this._isToday()?Math.floor(Date.now()/300000):'fixed';return`${this._selectedDay}|${refresh}|c:${ids.change.join(',')}`}
  _onDayChange(event){if(!this.c?.day_channel||event?.detail?.channel!==this.c.day_channel)return;const day=String(event.detail.day||''),start=this._dayStart(day),today=this._dayStart(this._dayKey(new Date()));if(!start||start>today||day===this._selectedDay)return;this._selectedDay=day;this._error='';this._lastKey=null;this._retryAt=0;this._render();this._scheduleStats()}
  _scheduleStats(){if(!this.h||!this.c?.day_channel||Date.now()<(this._retryAt||0))return;const ids=this._statEntities();if(!ids.change.length)return;const key=this._currentKey();if(this._loading||key===this._lastKey)return;this._fetchStats(this._range(),ids,key)}
  async _fetchStats(range,ids,key){this._loading=true;this._error='';this._render();try{const result=await this.h.callWS({type:'recorder/statistics_during_period',start_time:new Date(range.start).toISOString(),end_time:new Date(range.end).toISOString(),statistic_ids:ids.change,period:'5minute',types:['change']});if(key!==this._currentKey())return;const stats={};for(const entity of ids.change){const rows=(result?.[entity]||[]).filter(row=>{const s=typeof row.start==='number'?row.start:Date.parse(row.start);return Number.isFinite(s)&&s>=range.start&&s<range.end});const changes=rows.map(r=>Number(r.change)).filter(Number.isFinite);stats[entity]={change:changes.length?changes.reduce((a,b)=>a+b,0):null}}this._stats=stats;this._lastKey=key;this._retryAt=0}catch(_){if(key===this._currentKey()){this._error='Data unavailable';this._retryAt=Date.now()+30000}}finally{this._loading=false;this._render();if(key!==this._currentKey())this._scheduleStats()}}
  _number(entity,type){const v=this._stats?.[entity]?.[type];return Number.isFinite(v)?v:null}
  _liveNumber(entity){const s=this.h?.states?.[entity];if(!s||['unknown','unavailable'].includes(s.state))return null;const n=Number(s.state);return Number.isFinite(n)?n:null}
  _status(){if(this._loading)return'Loading…';if(this._error)return this._error;return null}
  _energy(v){return formatEnergy(this.h,v)}
  _watts(v,abs=false){return formatPower(this.h,v,{absolute:abs})}
  _resolve(v){if(v===null||v===undefined)return'';if(typeof v!=='object')return String(v);if(v.text!==undefined)return String(v.text);const f=String(v.format||''),status=this._formatNeeds(v)?this._status():null;if(status)return status;if(f==='energy_kwh_day')return this._energy(this._number(v.entity,'change'));if(f==='energy_kwh_day_sum'){if(!Array.isArray(v.entities)||!v.entities.length)return'—';let total=0;for(const id of v.entities){const n=this._number(id,'change');if(n===null)return'—';total+=n}return this._energy(total)}if(f==='energy_kwh_day_formula'){if(!Array.isArray(v.terms)||!v.terms.length)return'—';let total=0;for(const term of v.terms){const n=this._number(term?.entity,'change');if(n===null)return'—';total+=n*(Number.isFinite(Number(term.factor))?Number(term.factor):1)}return this._energy(total)}if(['watts','watts_abs'].includes(f))return this._watts(this._liveNumber(v.entity),f==='watts_abs');if(f==='grid_import_watts'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'—';return`${Math.round(n>=d?n:0)} W`}if(f==='grid_export_watts'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'—';return`${Math.round(n<=-d?Math.abs(n):0)} W`}if(f==='grid_label'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'Live grid';return n>=d?'Live grid import':n<=-d?'Live grid export':'Live grid flow'}if(f==='grid_direction'){const n=this._liveNumber(v.entity),d=Math.max(0,Number(v.deadband??this.c.deadband)||15);if(n===null)return'Unavailable';return n>=d?'Importing now':n<=-d?'Exporting now':'Balanced now'}if(!v.entity)return'';const s=this.h?.states?.[v.entity];return s?(this.h?.formatEntityState?this.h.formatEntityState(s):String(s.state)):(v.unavailable||'Unavailable')}
  _render(){if(!this.e||!this.c)return;this.e.leftValue.textContent=this._resolve(this.c.left_value);this.e.leftLabel.textContent=this._resolve(this.c.left_label);this.e.rightValue.textContent=this._resolve(this.c.right_value);this.e.rightLabel.textContent=this._resolve(this.c.right_label);this.e.rightPrimary.textContent=this._resolve(this.c.right_primary);this.e.rightSecondary.textContent=this._resolve(this.c.right_secondary);const l=this._clickEntity('left'),r=this._clickEntity('right');this.e.left.disabled=!l;this.e.right.disabled=!r;this.e.left.setAttribute('aria-label',`${this.e.leftValue.textContent} ${this.e.leftLabel.textContent}${l?'. Open details.':''}`.trim());this.e.right.setAttribute('aria-label',`${this.e.rightValue.textContent} ${this.e.rightLabel.textContent}, ${this.e.rightPrimary.textContent} ${this.e.rightSecondary.textContent}${r?'. Open details.':''}`.trim());this.e.right.setAttribute('aria-busy',String(this._loading))}
}
registerCard({ type: "metric-pair-card-v3", element: ComponentMetricPairCardV3, name: "Metric Pair", description: "Live power metrics with selected-day energy totals." });
}

// Module: src/components/energy-summary.js
{
/** ComponentEnergySummaryV1 — one backend-driven Energy summary surface. */
const {
  createLifecycle,
  energyDayData,
  energyDayState,
  formatCalendarDay,
  formatEnergy,
  formatPower,
  interaction,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentEnergySummaryV1 extends HTMLElement {
  static stubConfig = { profile: "household-energy", day_channel: "energy-day" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lifecycle = createLifecycle(this);
    this.data = null;
    this.error = null;
    this.loading = false;
    this.sequence = 0;
    this.dayUnsub = null;
    this.profileListener = (event) => {
      if (event.detail?.kind !== "energy" || event.detail?.profileId !== this.config?.profile) return;
      energyDayData.invalidateProfile(this._hass, this.config.profile);
      this.load(true);
    };
    this.interactions = [];
  }

  setConfig(config) {
    this.config = { profile: "household-energy", day_channel: "energy-day", title: "Energy", ...(config || {}) };
    this.day = energyDayState.get(this.config.day_channel);
    if (!this.built) this.build();
    this.render();
    this.load();
  }
  set hass(hass) {
    this._hass = hass;
    this.day = energyDayState.get(this.config?.day_channel, hass);
    this.render();
    this.load();
  }
  connectedCallback() {
    this.lifecycle.connect();
    window.addEventListener("ha-component-profile-change", this.profileListener);
    this.bindInteractions();
    this.dayUnsub ||= energyDayState.subscribe(this.config?.day_channel, (detail) => {
      if (detail.day === this.day) return;
      this.day = detail.day;
      this.render();
      this.load();
    }, { hass: this._hass });
    this.load();
  }
  disconnectedCallback() {
    this.lifecycle.disconnect();
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    this.dayUnsub?.();
    this.dayUnsub = null;
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
  }
  getCardSize() { return 3; }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}
      ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .wrap{padding:12px 14px 14px}.head{min-height:32px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
      h2{margin:0;font-size:15px;line-height:1.2;font-weight:600}.context{display:flex;align-items:center;gap:7px;min-width:0;color:var(--secondary-text-color);font-size:13px}.day{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.state{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:var(--secondary-background-color);font-weight:600}.state.now{color:var(--primary-color)}
      .live{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:8px}.daily{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .metric{appearance:none;min-width:0;min-height:68px;padding:10px 11px;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:transparent;color:inherit;font:inherit;text-align:left;display:flex;flex-direction:column;justify-content:center;cursor:pointer}.metric:disabled{cursor:default;opacity:1}.metric:not(:disabled):hover{background:var(--secondary-background-color)}.metric:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:6px;font-size:13px;line-height:1.2;font-weight:500;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.daily .value{font-size:18px}.daily .metric{min-height:62px}
      .feedback{min-height:18px;margin-top:8px;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.feedback.error{color:var(--error-color)}
      :host([data-loading]) .wrap{cursor:progress}:host([data-loading]) .state{opacity:.75}
      @media(max-width:700px){.wrap{padding:12px}.daily{grid-template-columns:repeat(2,minmax(0,1fr))}.value{font-size:20px}}
      @media(max-width:420px){.live{grid-template-columns:1fr}.metric{min-height:58px}.live .metric{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center}.live .label{grid-column:1;grid-row:1;margin:0}.live .value{grid-column:2;grid-row:1}.head{align-items:flex-start}.context{justify-content:flex-end}}
    </style><ha-card><div class="wrap"><div class="head"><h2></h2><div class="context"><span class="day"></span><span class="state"></span></div></div><div class="live">
      <button class="metric house" type="button"><span class="value">—</span><span class="label">House now</span></button>
      <button class="metric solar" type="button"><span class="value">—</span><span class="label">Solar now</span></button>
      <button class="metric grid" type="button"><span class="value">—</span><span class="label">Grid now</span></button>
    </div><div class="daily">
      <button class="metric consumed" type="button" disabled><span class="value">—</span><span class="label">Consumed</span></button>
      <button class="metric generated" type="button" disabled><span class="value">—</span><span class="label">Generated</span></button>
      <button class="metric imported" type="button" disabled><span class="value">—</span><span class="label">Imported</span></button>
      <button class="metric exported" type="button" disabled><span class="value">—</span><span class="label">Exported</span></button>
    </div><div class="feedback" role="status"></div></div></ha-card>`;
    this.elements = {
      title: this.shadowRoot.querySelector("h2"), day: this.shadowRoot.querySelector(".day"), state: this.shadowRoot.querySelector(".state"), feedback: this.shadowRoot.querySelector(".feedback"),
      house: this.shadowRoot.querySelector(".house .value"), solar: this.shadowRoot.querySelector(".solar .value"), grid: this.shadowRoot.querySelector(".grid .value"),
      consumed: this.shadowRoot.querySelector(".consumed .value"), generated: this.shadowRoot.querySelector(".generated .value"), imported: this.shadowRoot.querySelector(".imported .value"), exported: this.shadowRoot.querySelector(".exported .value"),
    };
    this.bindInteractions();
  }

  bindInteractions() {
    if (!this.built || this.interactions.length) return;
    const targets = [
      [".house", "sensor.ha_component_house_power"],
      [".solar", "sensor.ha_component_solar_power"],
      [".grid", "sensor.ha_component_grid_power"],
    ];
    for (const [selector, entityId] of targets) {
      this.interactions.push(interaction(this.shadowRoot.querySelector(selector), {
        primary: () => openMoreInfo(this, entityId), feedback: true,
      }));
    }
  }

  async load(force = false) {
    if (!this._hass || !this.config || !this.day) return;
    if (this.loading) { this.reloadAfterLoad ||= force; return; }
    const sequence = ++this.sequence;
    this.loading = true;
    this.error = null;
    this.toggleAttribute("data-loading", true);
    this.render();
    try {
      const data = await energyDayData.get(this._hass, this.config.profile, this.day, { force });
      if (sequence === this.sequence) this.data = data;
    } catch (error) {
      if (sequence === this.sequence) this.error = error;
    } finally {
      if (sequence === this.sequence) {
        this.loading = false;
        this.toggleAttribute("data-loading", false);
        this.render();
        if (this.reloadAfterLoad) { this.reloadAfterLoad = false; this.load(true); }
      }
    }
  }

  render() {
    if (!this.elements || !this.config) return;
    const data = this.data, isToday = this.day === energyDayState.today(this._hass);
    this.elements.title.textContent = this.config.title;
    this.elements.day.textContent = isToday ? "Today" : formatCalendarDay(this._hass, this.day, { weekday: "short", day: "numeric", month: "short" });
    this.elements.state.textContent = isToday ? "Now" : "Historical";
    this.elements.state.classList.toggle("now", isToday);
    this.elements.house.textContent = formatPower(this._hass, data?.house_w);
    this.elements.solar.textContent = formatPower(this._hass, data?.solar_w);
    const grid = data?.grid_w == null ? Number.NaN : Number(data.grid_w);
    this.elements.grid.textContent = formatPower(this._hass, data?.grid_w, { absolute: true });
    this.shadowRoot.querySelector(".grid .label").textContent = Number.isFinite(grid) ? grid > 15 ? "Importing now" : grid < -15 ? "Exporting now" : "Grid balanced" : "Grid unavailable";
    this.elements.consumed.textContent = formatEnergy(this._hass, data?.consumed_kwh);
    this.elements.generated.textContent = formatEnergy(this._hass, data?.generated_kwh);
    this.elements.imported.textContent = formatEnergy(this._hass, data?.imported_kwh);
    this.elements.exported.textContent = formatEnergy(this._hass, data?.exported_kwh);
    const coverage = Number(data?.coverage);
    const feedback = this.error ? (/unknown energy profile/i.test(this.error.message || "")
      ? `Configure ${this.config.profile} in HA Component Backend`
      : (this.error.message || "Energy data is unavailable")) :
      this.loading ? (this.data ? "Updating…" : "Loading Energy data…") :
      data?.stale ? "Showing the last successful update" :
      Number.isFinite(coverage) && coverage < 1 ? `${Math.round(coverage * 100)}% of source data available` : "";
    this.elements.feedback.textContent = feedback;
    this.elements.feedback.classList.toggle("error", Boolean(this.error));
  }
}

registerCard({ type: "component-energy-summary-v1", element: ComponentEnergySummaryV1, name: "Energy Summary V1", description: "Stable backend-driven live power and selected-day Energy totals." });
}

// Module: src/components/update-summary.js
{
/** ComponentUpdateSummaryV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentUpdateSummaryV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.busy = false;
    this.error = "";
    this.messageTimer = null;
    this._renderSignature = null;
    this._interaction = null;
  }

  setConfig(c) {
    this.c = {
      count: "3",
      title: "updates available",
      message: "Review the items below before installing.",
      live_updates: false,
      update_all: false,
      confirm: true,
      ...c,
    };
    this._render();
  }

  set hass(h) {
    this.h = h;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    this._renderSignature = null;
    this._render();
  }

  disconnectedCallback() {
    window.clearTimeout(this.messageTimer);
    this.messageTimer = null;
    this._interaction?.destroy();
    this._interaction = null;
  }

  _all() {
    if (!this.h) return [];
    const ids = Array.isArray(this.c.entities)
      ? new Set(this.c.entities)
      : null;
    return Object.values(this.h.states).filter(
      (state) =>
        state.entity_id.startsWith("update.") &&
        (!ids || ids.has(state.entity_id)),
    );
  }

  _progress(attributes) {
    const raw = attributes?.in_progress;
    return !(
      raw === false ||
      raw === null ||
      raw === undefined
    );
  }

  _pending() {
    return this._all().filter((state) => state.state === "on");
  }

  _live() {
    if (!this.c.live_updates || !this.h) return null;
    const pending = this._pending().length;
    return {
      count: String(pending),
      title: pending === 1 ? "update available" : "updates available",
      message: pending
        ? "Review the items below before installing."
        : "Everything is current.",
    };
  }

  _setError(message) {
    this.error = message;
    window.clearTimeout(this.messageTimer);
    if (message) {
      this.messageTimer = window.setTimeout(() => {
        this.error = "";
        this._render();
      }, 5000);
    }
  }

  async _installAll() {
    if (!this.h || this.busy) return;
    const pending = this._pending().filter(
      (state) => !this._progress(state.attributes),
    );
    if (!pending.length) return;

    const count = pending.length;
    if (
      this.c.confirm !== false &&
      !window.confirm(
        `Install ${count} available ${count === 1 ? "update" : "updates"}? Home Assistant may restart if Core, Supervisor or the operating system is included.`,
      )
    ) {
      return;
    }

    this._setError("");
    this.busy = true;
    this._render();

    const priority = [
      "update.home_assistant_supervisor_update",
      "update.home_assistant_operating_system_update",
      "update.home_assistant_core_update",
    ];
    const normal = pending
      .map((state) => state.entity_id)
      .filter((id) => !priority.includes(id));

    try {
      if (normal.length) {
        await this.h.callService("update", "install", {
          entity_id: normal,
        });
      }
      for (const id of priority) {
        if (pending.some((state) => state.entity_id === id)) {
          await this.h.callService("update", "install", {
            entity_id: id,
          });
        }
      }
    } catch (_) {
      this._setError("One or more updates could not be started.");
    } finally {
      this.busy = false;
      this._render();
    }
  }

  _render() {
    if (!this.c) return;
    const data = this._live() || this.c;
    const showButton = Boolean(this.c.update_all);
    const pending = this.h
      ? this.c.live_updates
        ? Number(data.count)
        : showButton
          ? this._pending().length
          : 0
      : Number(data.count) || 0;
    const signature = JSON.stringify([
      this.c,
      data,
      showButton ? pending : null,
      this.busy,
      this.error,
    ]);
    if (signature === this._renderSignature) return;
    this._renderSignature = signature;
    this._interaction?.destroy();
    this._interaction = null;
    const message = this.error
      ? this.error
      : this.busy
        ? "Starting available updates…"
        : data.message;
    const progress = this.busy
      ? '<span class="progress indeterminate" role="progressbar" aria-label="Starting available updates"></span>'
      : "";

    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}ha-card{position:relative}.wrap{padding:12px 14px;min-height:72px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px}.count{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.headline{font-size:13px;font-weight:600}.desc{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color)}.desc.error{color:var(--error-color)}.all{appearance:none;border:0;min-height:44px;padding:0 14px;border-radius:11px;background:var(--primary-color);color:var(--text-primary-color);font-size:13px;font-weight:650;cursor:pointer;white-space:nowrap}.all:active{transform:scale(.98)}.all:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.all:disabled{cursor:default;background:var(--secondary-background-color);color:var(--secondary-text-color)}.progress{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0;background:var(--primary-color);pointer-events:none}.progress.indeterminate{width:34%;animation:update-slide 1.15s ease-in-out infinite}@keyframes update-slide{0%{transform:translateX(-105%)}50%{transform:translateX(150%)}100%{transform:translateX(305%)}}@media(prefers-reduced-motion:reduce){.progress.indeterminate{animation:none;width:100%;opacity:.55}}@media(max-width:700px){.wrap{padding:12px;gap:10px}.count{font-size:25px}.all{padding:0 12px}}</style><ha-card><div class="wrap"><span class="count">${escapeHtml(data.count)}</span><span><div class="headline">${escapeHtml(data.title)}</div><div class="desc ${this.error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(message)}</div></span>${showButton ? `<button class="all" type="button" ${this.busy || pending === 0 ? "disabled" : ""}>${escapeHtml(this.busy ? "Starting…" : "Update all")}</button>` : "<span></span>"}</div>${progress}</ha-card>`;

    const button = this.shadowRoot.querySelector(".all");
    if (button) {
      this._interaction = interaction(button, {
        primary: () => this._installAll(),
        optimistic: false,
        repeat: false,
        feedback: true,
      });
    }
  }
}
registerCard({ type: "component-update-summary-v3", element: ComponentUpdateSummaryV3, name: "Update Summary", description: "Reusable update summary with live update support." });
}

// Module: src/components/update-row.js
{
/** ComponentUpdateRowV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentUpdateRowV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.busy = false;
    this.requested = false;
    this.error = "";
    this.startTimer = null;
    this.errorTimer = null;
    this._renderSignature = null;
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      icon: "mdi:update",
      title: "Update name",
      current: "Current 1.0",
      available: "Available 1.1",
      action: "Update",
      confirm: true,
      ...c,
    };
    this._render();
  }

  set hass(h) {
    this.h = h;
    const data = this._data();
    if (
      this.requested &&
      (data.progress.active || !data.pending)
    ) {
      this.requested = false;
      window.clearTimeout(this.startTimer);
    }
    this._render();
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    this._renderSignature = null;
    this._render();
  }

  disconnectedCallback() {
    window.clearTimeout(this.startTimer);
    window.clearTimeout(this.errorTimer);
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  _state() {
    return (
      (this.c.entity && this.h?.states?.[this.c.entity]) || null
    );
  }

  _name(state) {
    if (this.c.name) return this.c.name;
    if (!state) return this.c.title;
    const name =
      state.attributes?.title ||
      state.attributes?.friendly_name ||
      this.c.entity;
    return String(name).replace(/ Update$/, "");
  }

  _progress(attributes) {
    const raw = attributes?.in_progress;
    if (
      raw === false ||
      raw === null ||
      raw === undefined
    ) {
      return { active: false, determinate: false, value: 0 };
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return {
        active: true,
        determinate: true,
        value: Math.max(0, Math.min(100, raw)),
      };
    }
    if (
      typeof raw === "string" &&
      raw.trim() !== "" &&
      Number.isFinite(Number(raw))
    ) {
      return {
        active: true,
        determinate: true,
        value: Math.max(0, Math.min(100, Number(raw))),
      };
    }
    return {
      active: Boolean(raw),
      determinate: false,
      value: 0,
    };
  }

  _data() {
    const state = this._state();
    if (!state) {
      const configured = Boolean(this.c.entity);
      return {
        live: false,
        missing: configured,
        unavailable: configured,
        title: this.c.title,
        current: configured
          ? "Update entity unavailable"
          : this.c.current,
        available: configured ? "" : this.c.available,
        action: configured ? "Unavailable" : this.c.action,
        pending: !configured,
        progress: {
          active: false,
          determinate: false,
          value: 0,
        },
      };
    }

    const attributes = state.attributes || {};
    const unavailable = ["unavailable", "unknown"].includes(
      state.state,
    );
    const pending = state.state === "on";
    const progress = this._progress(attributes);
    return {
      live: true,
      missing: false,
      unavailable,
      title: this._name(state),
      current: attributes.installed_version
        ? `Current ${attributes.installed_version}`
        : "Current version unavailable",
      available: attributes.latest_version
        ? `Available ${attributes.latest_version}`
        : "Latest version unavailable",
      action: unavailable
        ? "Unavailable"
        : progress.active
          ? "Updating…"
          : pending
            ? "Update"
            : "Current",
      pending,
      progress,
    };
  }

  _more() {
    if (!this._state()) return;
    openMoreInfo(this, this.c.entity);
  }

  _setError(message) {
    this.error = message;
    window.clearTimeout(this.errorTimer);
    if (message) {
      this.errorTimer = window.setTimeout(() => {
        this.error = "";
        this._render();
      }, 5000);
    }
  }

  _watchForStart() {
    window.clearTimeout(this.startTimer);
    this.startTimer = window.setTimeout(() => {
      if (!this.requested) return;
      this.requested = false;
      this._setError("The update did not start.");
      this._render();
    }, 12000);
  }

  async _install(data) {
    if (
      !data.live ||
      data.unavailable ||
      !data.pending ||
      data.progress.active ||
      this.busy ||
      this.requested ||
      !this.h
    ) {
      return;
    }

    const state = this._state();
    const name = this._name(state);
    const latest =
      state?.attributes?.latest_version || "the latest version";
    if (
      this.c.confirm !== false &&
      !window.confirm(`Install ${latest} for ${name}?`)
    ) {
      return;
    }

    this._setError("");
    this.busy = true;
    this.requested = true;
    this._render();

    try {
      await this.h.callService("update", "install", {
        entity_id: this.c.entity,
      });
      this._watchForStart();
    } catch (_) {
      this.requested = false;
      window.clearTimeout(this.startTimer);
      this._setError("The update could not be started.");
    } finally {
      this.busy = false;
      this._render();
    }
  }

  _render() {
    if (!this.c) return;
    const data = this._data();
    const signature = JSON.stringify([
      this.c,
      data,
      this.busy,
      this.requested,
      this.error,
    ]);
    if (signature === this._renderSignature) return;
    this._renderSignature = signature;
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
    const active =
      data.progress.active || this.busy || this.requested;
    const disabled =
      data.missing ||
      data.unavailable ||
      !data.pending ||
      active;
    const action = this.error
      ? "Retry"
      : this.busy || this.requested
        ? "Starting…"
        : data.action;
    const status = this.error
      ? this.error
      : `${data.current}${data.available ? ` · ${data.available}` : ""}`;
    const progress = active
      ? data.progress.determinate
        ? `<span class="progress determinate" role="progressbar" aria-label="Updating ${escapeHtml(data.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${data.progress.value}" style="--progress:${data.progress.value}%"></span>`
        : `<span class="progress indeterminate" role="progressbar" aria-label="${this.busy || this.requested ? "Starting" : "Updating"} ${escapeHtml(data.title)}"></span>`
      : "";

    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}ha-card{position:relative}.wrap{min-height:68px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:0 14px}.details{appearance:none;border:0;background:transparent;text-align:left;min-width:0;padding:10px 0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:10px;cursor:${this._state() ? "pointer" : "default"}}.details:active{transform:scale(.995)}.details:focus-visible,.action:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:10px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{font-size:13px;line-height:1.25;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.versions{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.versions.error{color:var(--error-color)}.versions b{font-weight:600;color:var(--primary-text-color)}.action{appearance:none;border:0;min-height:44px;padding:0 13px;border-radius:11px;background:var(--primary-color);color:var(--text-primary-color);font-size:13px;font-weight:600;cursor:pointer}.action:disabled{cursor:default;background:var(--secondary-background-color);color:var(--secondary-text-color);opacity:1}.progress{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0;background:var(--primary-color);pointer-events:none}.progress.determinate{width:var(--progress);transition:width .25s ease}.progress.indeterminate{width:34%;animation:update-slide 1.15s ease-in-out infinite}@keyframes update-slide{0%{transform:translateX(-105%)}50%{transform:translateX(150%)}100%{transform:translateX(305%)}}@media(prefers-reduced-motion:reduce){.progress.indeterminate{animation:none;width:100%;opacity:.55}.progress.determinate{transition:none}}@media(max-width:700px){.wrap{padding:0 12px}}</style><ha-card><div class="wrap"><button class="details" type="button" ${this._state() ? "" : "disabled"}><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span class="copy"><div class="title">${escapeHtml(data.title)}</div><div class="versions ${this.error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(status)}</div></span></button><button class="action" type="button" aria-label="${escapeHtml(action)} ${escapeHtml(data.title)}" ${disabled ? "disabled" : ""}>${escapeHtml(action)}</button></div>${progress}</ha-card>`;

    const details = this.shadowRoot.querySelector(".details");
    const actionButton = this.shadowRoot.querySelector(".action");
    if (details && this._state()) {
      details.setAttribute("aria-label", `Open details for ${data.title}`);
      this._interactions.push(interaction(details, {
        primary: () => this._more(),
        optimistic: false,
        repeat: false,
        feedback: true,
      }));
    }
    if (actionButton) {
      this._interactions.push(interaction(actionButton, {
        primary: () => this._install(data),
        optimistic: false,
        repeat: false,
        feedback: true,
      }));
    }
  }
}
registerCard({ type: "component-update-row-v3", element: ComponentUpdateRowV3, name: "Update Row", description: "Reusable update row with live update support." });
}

// Module: src/components/empty-state.js
{
/** ComponentEmptyStateV3 — reusable Home Assistant dashboard card. */
const { UPDATE_CARD_STYLES, escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentEmptyStateV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(c) {
    this.c = {
      icon: "mdi:check-circle-outline",
      title: "Nothing requires attention",
      message: "Supporting empty-state message.",
      ...c,
    };
    this._render();
  }

  set hass(h) {}

  getCardSize() {
    return 1;
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${UPDATE_CARD_STYLES}.wrap{padding:12px 14px;min-height:72px;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.title{font-size:13px;line-height:1.25;font-weight:600}.desc{margin-top:3px;font-size:13px;line-height:1.3;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}</style><ha-card><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.message)}</div></span></div></ha-card>`;
  }
}
registerCard({ type: "component-empty-state-v3", element: ComponentEmptyStateV3, name: "Empty State", description: "Reusable empty-state component." });
}

// Module: src/components/energy-day-selector.js
{
/** ComponentEnergyDaySelectorV1 — stable, replayable selected-day control. */
const { energyDayState, formatCalendarDay, interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentEnergyDaySelectorV1 extends HTMLElement {
  static stubConfig = { channel: "energy-day" };
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.interactions = [];
    this.unsubscribe = null;
  }
  setConfig(config) {
    this.config = { channel: "energy-day", title: "Energy day", ...(config || {}) };
    this.selected = energyDayState.get(this.config.channel);
    if (!this.built) this.build();
    this.update();
  }
  set hass(hass) {
    this._hass = hass;
    this.selected = energyDayState.get(this.config?.channel, hass);
    this.update();
  }
  connectedCallback() {
    this.bindInteractions();
    this.unsubscribe ||= energyDayState.subscribe(this.config?.channel, (detail) => {
      this.selected = detail.day;
      this.update();
    }, { hass: this._hass });
  }
  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
  }
  getCardSize() { return 1; }

  parse(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return this.key(date) === value ? date : null;
  }
  key(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  isToday() { return this.selected === energyDayState.today(this._hass); }
  setDay(value) {
    this.selected = energyDayState.set(this.config.channel, value, { hass: this._hass });
    this.update();
  }
  shift(days) {
    const date = this.parse(this.selected) || new Date();
    date.setDate(date.getDate() + days);
    this.setDay(this.key(date));
  }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .row{min-height:56px;padding:6px 8px;display:grid;grid-template-columns:44px minmax(0,1fr) 44px auto;align-items:center;gap:8px}
      button{appearance:none;min-width:44px;min-height:44px;border:0;border-radius:12px;background:transparent;color:inherit;font:inherit;cursor:pointer}button:focus-visible,.date:focus-within{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{color:var(--disabled-text-color,var(--secondary-text-color));cursor:default;opacity:.45}.step{display:grid;place-items:center}ha-icon{--mdc-icon-size:22px}
      .date{position:relative;min-width:0;min-height:44px;padding:4px 8px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:var(--secondary-background-color);overflow:hidden}.label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:650}.state{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:var(--card-background-color);color:var(--secondary-text-color);font-size:13px;font-weight:600}.state.historical{color:var(--primary-color)}
      input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.today{padding:0 12px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--primary-color);background:var(--secondary-background-color);font-size:13px;font-weight:650}.today:disabled{opacity:.55}
      @media(max-width:420px){.row{grid-template-columns:44px minmax(0,1fr) 44px 44px;gap:4px;padding:6px}.today{width:44px;padding:0}.today span{display:none}}
    </style><ha-card><div class="row"><button class="step previous" type="button" aria-label="Previous day"><ha-icon icon="mdi:chevron-left"></ha-icon></button><label class="date"><span class="label"></span><span class="state" role="status"></span><input type="date" aria-label="Select Energy day"></label><button class="step next" type="button" aria-label="Next day"><ha-icon icon="mdi:chevron-right"></ha-icon></button><button class="today" type="button" aria-label="Return to today"><ha-icon icon="mdi:calendar-today-outline"></ha-icon><span>Today</span></button></div></ha-card>`;
    this.elements = {
      label: this.shadowRoot.querySelector(".label"), state: this.shadowRoot.querySelector(".state"), input: this.shadowRoot.querySelector("input"), next: this.shadowRoot.querySelector(".next"), today: this.shadowRoot.querySelector(".today"),
    };
    this.elements.input.addEventListener("change", (event) => this.setDay(event.target.value));
    this.bindInteractions();
  }
  bindInteractions() {
    if (!this.built || this.interactions.length) return;
    const repeat = { delay: 350, interval: 110, accelerate: true };
    this.interactions.push(
      interaction(this.shadowRoot.querySelector(".previous"), { primary: () => this.shift(-1), repeat, feedback: true }),
      interaction(this.elements.next, { primary: () => this.shift(1), repeat, feedback: true }),
      interaction(this.elements.today, { primary: () => this.setDay(energyDayState.today(this._hass)), feedback: true }),
    );
  }
  update() {
    if (!this.elements || !this.selected) return;
    const today = this.isToday();
    this.elements.label.textContent = formatCalendarDay(this._hass, this.selected, { weekday: "short", day: "numeric", month: "short", ...(this.selected.slice(0, 4) === energyDayState.today(this._hass).slice(0, 4) ? {} : { year: "numeric" }) });
    this.elements.state.textContent = today ? "Today" : "Historical";
    this.elements.state.classList.toggle("historical", !today);
    this.elements.input.value = this.selected;
    this.elements.input.max = energyDayState.today(this._hass);
    this.elements.next.disabled = today;
    this.elements.today.disabled = today;
  }
}

registerCard({ type: "component-energy-day-selector-v1", element: ComponentEnergyDaySelectorV1, name: "Energy Day Selector", description: "Stable selected-day control shared by every Energy card." });
}

// Module: src/components/text-effect.js
{
/** ComponentTextEffectV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentTextEffectV1 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this.settleTimer=null}
  setConfig(c){if(!c?.text)throw new Error('text is required');this.c={effect:'stamp',description:'',icon:null,speed:2.6,...c};this.render()}
  set hass(h){this.h=h}
  disconnectedCallback(){clearTimeout(this.settleTimer);this.settleTimer=null}
  getCardSize(){return 1}
  render(){
    clearTimeout(this.settleTimer);this.settleTimer=null;
    const c=this.c;
    const effect=['stamp','typewave','overprint','signal','rainbow_stamp'].includes(c.effect)?c.effect:'stamp';
    const speed=Math.max(1.6,Math.min(6,Number(c.speed)||2.6));
    const text=escapeHtml(c.text);
    const icon=c.icon?`<span class="icon"><ha-icon icon="${escapeHtml(c.icon)}"></ha-icon></span>`:'';
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
.row{min-height:70px;padding:12px 14px;display:grid;grid-template-columns:${c.icon?'40px ':''}minmax(0,1fr);align-items:center;gap:12px}.icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.title{position:relative;display:inline-block;max-width:100%;font-size:13px;line-height:1.25;font-weight:650;letter-spacing:-.005em;white-space:nowrap;color:var(--primary-text-color)}.base{position:relative;z-index:2}.desc{margin-top:4px;font-size:13px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stamp .title{padding-bottom:4px}.stamp .title:after{content:'';position:absolute;z-index:1;left:0;bottom:0;width:100%;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent 0%,var(--primary-color) 42%,var(--primary-color) 58%,transparent 100%);background-size:220% 100%;opacity:.72;animation:stampSweep ${speed}s cubic-bezier(.4,0,.2,1) infinite}
.typewave .title:after{content:attr(data-text);position:absolute;z-index:3;inset:0;color:var(--primary-color);clip-path:inset(0 100% 0 0);animation:textSweep ${speed}s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
.overprint .title:after{content:attr(data-text);position:absolute;z-index:1;inset:0;color:var(--primary-color);opacity:0;filter:blur(.15px);animation:softPrint ${speed}s ease-in-out infinite;pointer-events:none}
.signal .title{padding-left:16px}.signal .title:before{content:'';position:absolute;left:1px;top:50%;width:7px;height:7px;margin-top:-3.5px;border:1.5px solid var(--primary-color);border-radius:2px;transform:rotate(45deg);opacity:.45;animation:signalPulse ${speed}s cubic-bezier(.4,0,.2,1) infinite}.signal .title:after{content:'';position:absolute;left:3px;top:50%;width:3px;height:3px;margin-top:-1.5px;border-radius:50%;background:var(--primary-color);animation:signalDot ${speed}s cubic-bezier(.4,0,.2,1) infinite}
.rainbow_stamp .title{padding-bottom:4px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2,#ff375f);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:rainbow ${speed}s linear infinite}.rainbow_stamp .title:after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:999px;background:linear-gradient(90deg,#ff375f,#ff9f0a,#ffd60a,#30d158,#64d2ff,#0a84ff,#bf5af2);background-size:240% 100%;opacity:.55;animation:rainbow ${speed}s linear infinite}
@keyframes stampSweep{0%{background-position:210% 0;opacity:0}15%{opacity:.28}42%{opacity:.78}70%{opacity:.28}100%{background-position:-110% 0;opacity:0}}@keyframes textSweep{0%,8%{clip-path:inset(0 100% 0 0);opacity:0}22%{opacity:.75}52%{clip-path:inset(0 0 0 0);opacity:.75}72%{clip-path:inset(0 0 0 100%);opacity:.2}100%{clip-path:inset(0 0 0 100%);opacity:0}}@keyframes softPrint{0%,48%,100%{opacity:0;transform:translateX(0)}60%{opacity:.22;transform:translateX(.6px)}70%{opacity:.1;transform:translateX(0)}}@keyframes signalPulse{0%,100%{opacity:.25;transform:rotate(45deg) scale(.88)}48%{opacity:.7;transform:rotate(45deg) scale(1.06)}70%{opacity:.35;transform:rotate(45deg) scale(.96)}}@keyframes signalDot{0%,100%{opacity:.35;transform:scale(.7)}48%{opacity:1;transform:scale(1)}70%{opacity:.5;transform:scale(.8)}}@keyframes rainbow{to{background-position:260% 50%}}
@media(prefers-reduced-motion:reduce){.stamp .title:after,.typewave .title:after,.overprint .title:after,.signal .title:before,.signal .title:after,.rainbow_stamp .title,.rainbow_stamp .title:after{animation:none!important}.stamp .title:after{opacity:.35;background:var(--primary-color)}.typewave .title:after,.overprint .title:after{display:none}.signal .title:before{opacity:.45}.signal .title:after{opacity:.7}}
@media(max-width:700px){.row{padding:12px}.desc{font-size:12px}}
</style><style>.row.settled .title:after,.row.settled .title:before,.row.settled .title{animation:none!important}.row.settled.typewave .title:after,.row.settled.overprint .title:after{display:none}.row.settled.stamp .title:after{opacity:.35;background:var(--primary-color)}.row.settled.signal .title:before{opacity:.45}.row.settled.signal .title:after{opacity:.7}</style><ha-card><div class="row ${effect}">${icon}<div class="copy"><div class="title" data-text="${text}"><span class="base">${text}</span></div>${c.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}</div></div></ha-card>`;
    const row=this.shadowRoot.querySelector('.row');
    this.settleTimer=setTimeout(()=>{this.settleTimer=null;row?.classList.add('settled')},Math.round(speed*1000)+80)
  }
}
registerCard({ type: "component-text-effect-v1", element: ComponentTextEffectV1, name: "Signature Text Effect", description: "Reusable transient-status effects using the existing signature motion language." });
}

// Module: src/components/split-system-controller.js
{
/** ComponentSplitControllerV4 — reusable Home Assistant dashboard card. */
const { interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const SPLIT_INVALID=new Set(["unknown","unavailable","none",""]),SPLIT_LABELS={fan_only:"Fan only"};class ComponentSplitControllerV4 extends HTMLElement{static getGridOptions(){return{columns:12,rows:"auto"}}constructor(){super(),this.attachShadow({mode:"open"}),this.t=!1,this.i="",this.o=null,this.l="",this.h=null,this.u=null,this.p=new Map,this.m=0,this.v=null,this._=null,this.k=null,this.T=null,this.S=null,this.A=null,this.C=null,this.q=null,this.L=null,this._interactionHandles=[]}setConfig(t){if(!t?.entity)throw new Error("A climate entity is required");clearTimeout(this._),this._=null;for(const t of this.p.values())this.I(t);this.p.clear(),this.v=null,this.T=null,this.t&&(this.M(!1),this.$.pb.replaceChildren()),this.S={...t},this.config={...this.S},this.A=null,this.C=null,clearTimeout(this.q),this.q=null,this.i=""}set hass(t){this.P=t,this.N(),this.O(),this.t||this.R(),this.D();const i=this.V();i!==this.i?(this.i=i,this.H()):this.F(),this.j()}O(){const t=this.S?.entity;if(!t||!this.P||this.A===t||this.C===t)return;const i=globalThis.__componentSplitRegistryV4;i?.load&&(this.C=t,i.load(this.P).then(s=>{if(this.S?.entity!==t)return;if(this.C=null,s.error){if(!this.isConnected)return;return clearTimeout(this.q),void(this.q=setTimeout(()=>{this.q=null,this.O()},31e3))}clearTimeout(this.q),this.q=null;const e=s.systems.get(t);this.config={...this.S,...e?{room_id:e.room_id,registry_entity:e.registry_entity,controller_entity:e.controller_entity,vertical_vane_entity:e.vertical_vane_entity,horizontal_vane_entity:e.horizontal_vane_entity,minimum_target:e.minimum_target,maximum_target:e.maximum_target,fan_ceiling:e.fan_ceiling,last_mode:e.last_mode,deadline:e.deadline,profiles:e.profiles}:{}},this.A=t,this.i="",this.t&&this.isConnected&&(this.H(),this.j())}))}connectedCallback(){this.N(),this.O(),this.t&&this.j()}N(){const t=globalThis.__componentSplitRegistryV4;this.isConnected&&!this.L&&this.P&&t?.subscribe&&(this.L=t.subscribe(this.P,()=>{this.A=null,this.i="",this.O()}))}disconnectedCallback(){for(const t of this._interactionHandles)t.destroy();this._interactionHandles=[];clearTimeout(this._),this._=null,clearInterval(this.k),this.k=null,clearTimeout(this.q),this.q=null,this.L?.(),this.L=null;for(const t of this.p.values())clearTimeout(t.timeoutTimer),clearTimeout(t.settleTimer);this.p.clear(),this.v=null,this.T=null,this.t&&this.M(!1)}R(){this.t=!0,this.shadowRoot.innerHTML='<style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;background:transparent;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px}.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;gap:12px}.hd.settings{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}.idn{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.iw{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.cp{min-width:0}.nm,.st{display:block}.nm{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw{width:44px;height:44px;padding:0;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.pw.on{color:var(--primary-color)}button[disabled],button[aria-disabled=true]{opacity:.45;cursor:default}.ct{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.cr{display:grid;grid-template-columns:minmax(120px,1fr) auto;align-items:center;gap:16px}.cr.to{grid-template-columns:auto;justify-content:end}.rv{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.ml{display:block;margin-top:6px;color:var(--secondary-text-color);font-size:13px;line-height:1.2}.tc{min-height:48px;display:grid;grid-template-columns:44px minmax(82px,auto) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;overflow:hidden}.tb{width:44px;height:48px;padding:0;display:grid;place-items:center}.tp{min-width:0;padding:0 8px;text-align:center}.tv{font-size:18px;line-height:1.1;font-weight:650;font-variant-numeric:tabular-nums}.ts{margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.1;white-space:nowrap}.os,.uv{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.as{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.a{min-width:0;min-height:44px;flex:1 1 118px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:7px;color:var(--secondary-text-color)}.a ha-icon{--mdc-icon-size:18px}.al{min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.a.av,.a[aria-expanded=true]{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.pn{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;overscroll-behavior:contain;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,color-mix(in srgb,var(--primary-text-color) 32%,transparent)))}.pd{width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;padding:12px 14px 14px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,8px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}.ph{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px}.pt{margin:0;font-size:18px;line-height:1.2;font-weight:650}.x{width:44px;height:44px;border-radius:var(--dashboard-radius-control,8px);display:grid;place-items:center}.og+.og{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.gt{margin:0 4px 8px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.qs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.o{min-height:50px;width:100%;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:20px minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;background:transparent;font-size:13px;font-weight:600}.oi{color:var(--secondary-text-color)}.o[aria-selected=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}.o[aria-selected=true] .oi{color:var(--primary-color)}.tpr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tpr button,.tcu button,.tac button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.tpr button{display:flex;align-items:center;justify-content:center;gap:6px}.tcu{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px;margin-top:12px}.tcu label{font-size:13px;color:var(--secondary-text-color)}.tcu input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,5px);background:transparent}.tcu button{padding:0 14px;color:var(--primary-color)}.tac{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.tac button:first-child{color:var(--primary-color)}.tac button:last-child{color:var(--error-color)}.fb{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.fb:not(:empty){margin-top:10px}.fb.er{color:var(--error-color)}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:400px){.w{padding:12px}.as .a{flex-basis:calc(50% - 4px)}}@container (max-width:340px){.cr{grid-template-columns:1fr;justify-content:stretch}.tc{width:100%}}\n      </style><ha-card><div class="w"><div class="hd"><button class="idn" type="button"><span class="iw"><ha-icon class="mi"></ha-icon></span><span class="cp"><span class="nm"></span><span class="st" role="status"></span></span></button><button class="pw" type="button"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="ct"><div class="cr"><div class="rm"><span class="rv"></span><span class="ml">Room temperature</span></div><div class="tc"><button class="tb decrease" type="button" aria-label="Decrease target temperature"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tp"><div class="tv"></div><div class="ts"></div></div><button class="tb increase" type="button" aria-label="Increase target temperature"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="os"></div><div class="uv"></div><div class="as"><button class="a ma" type="button" data-panel="mode" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:thermostat"></ha-icon><span class="al"></span></button><button class="a fa" type="button" data-panel="fan" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:fan"></ha-icon><span class="al"></span></button><button class="a va" type="button" data-panel="vanes" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:swap-vertical"></ha-icon><span class="al"></span></button><button class="a ta" type="button" data-panel="timer" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:timer-outline"></ha-icon><span class="al"></span></button></div></div><div class="fb" role="status" aria-live="polite"></div></div></ha-card><section class="pn" id="split-secondary" role="dialog" aria-modal="true" aria-labelledby="split-pt" hidden><div class="pd"><div class="ph"><h3 class="pt" id="split-pt"></h3><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="pb"></div></div></section>';const t=document.createElement("button");t.className="pw sg",t.type="button",t.dataset.panel="settings",t.setAttribute("aria-controls","split-secondary"),t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label","Advanced settings");const i=document.createElement("ha-icon");i.setAttribute("icon","mdi:cog-outline"),t.append(i),this.shadowRoot.querySelector(".pw").before(t),this.$=Object.fromEntries([...this.shadowRoot.querySelectorAll("[class]")].flatMap(t=>[...t.classList].map(i=>[i,t]))),this._interactionHandles.push(interaction(this.$.idn,{primary:()=>this.B(),feedback:!0}),interaction(this.$.pw,{primary:()=>this.G(),optimistic:!1,feedback:!0}),interaction(this.$.decrease,{primary:()=>this.W(-1),repeat:{delay:350,interval:120,coalesce:!0},feedback:!0}),interaction(this.$.increase,{primary:()=>this.W(1),repeat:{delay:350,interval:120,coalesce:!0},feedback:!0})),this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>this._interactionHandles.push(interaction(t,{primary:()=>this.U(t.dataset.panel,t),feedback:!0}))),this.$.x.addEventListener("click",()=>this.M(!0)),this.$.pn.addEventListener("click",t=>{t.target===this.$.pn&&this.M(!0)}),this.shadowRoot.addEventListener("keydown",t=>{"Escape"===t.key&&this.o?(t.preventDefault(),this.M(!0)):"Tab"===t.key&&this.o&&this.J(t)})}V(){const t=[this.config.entity,this.config.vertical_vane_entity,this.config.horizontal_vane_entity,this.config.controller_entity,this.config.registry_entity||"sensor.ha_component_backend"].filter(Boolean),i=t.map(t=>{const i=this.P?.states?.[t];return[t,i?.state,i?.attributes]}),s={room_id:this.config.room_id,minimum_target:this.config.minimum_target,maximum_target:this.config.maximum_target,fan_ceiling:this.config.fan_ceiling,last_mode:this.config.last_mode,deadline:this.config.deadline,profiles:this.config.profiles};return JSON.stringify([i,s])}K(t){if(null==t||""===t)return null;const i=Number(t);return Number.isFinite(i)?i:null}X(t){return t?this.P?.states?.[t]??null:null}Y(t){return Boolean(t&&!SPLIT_INVALID.has(String(t.state).toLowerCase()))}Z(){const t=this.X(this.config.entity),i=this.X(this.config.controller_entity),s=!this.Y(t)||this.config.controller_entity&&(!i||"on"!==i.state);return{state:t,attributes:t?.attributes??{},uv:s}}tt(t){const i=String(t??"").toLowerCase();return SPLIT_LABELS[i]??i.replaceAll("_"," ").replace(/^./,t=>t.toUpperCase())}it(t){const i=this.K(t);return null===i?null:`${Number.isInteger(i)?i:i.toFixed(1)}°`}et(t,i){return"heating"===i||"heat"===t?"mdi:fire":"cooling"===i||"cool"===t?"mdi:snowflake":"auto"===t?"mdi:thermostat-auto":"dry"===t?"mdi:water-percent":"fan_only"===t?"mdi:fan":"mdi:heat-pump"}nt(t){if(t.uv)return"Controller unavailable";const{state:i,attributes:s}=t,e=i.state,n=s.hvac_action,o=this.it(s.temperature),r=this.K(s.current_temperature),a=this.K(s.temperature),l=this.K(s.target_temp_step),h=null!==r&&null!==a&&null!==l&&l>0&&Math.abs(r-a)<=l;return"off"===e?"Off":"heating"===n?o?`Heating to ${o}`:"Heating":"cooling"===n?o?`Cooling to ${o}`:"Cooling":"heat"===e?h?"Heat · At target":o?`Heat · Target ${o}`:"Heat":"cool"===e?h?"Cool · At target":o?`Cool · Target ${o}`:"Cool":"auto"===e?o?`Auto · Target ${o}`:"Auto":"dry"===e?"drying"===n?"Drying":"Dry":"fan_only"===e?"Fan only"+(this.ot(s.fan_mode)?` · ${this.tt(s.fan_mode)}`:""):this.tt(e)}ot(t){return null!=t&&!SPLIT_INVALID.has(String(t).toLowerCase())}rt(t){const i=[this.p.get("hvac"),this.p.get("temperature"),this.p.get("fan"),[...this.p].find(([t])=>t.startsWith("vane:"))?.[1],this.p.get("timer")];for(const s of i){if(!s)continue;const i=s.queued?.label??s.label;return`${this.nt(t)} · Requesting ${i}`}return this.nt(t)}H(){const t=this.Z(),{state:i,attributes:s,uv:e}=t,n=!e&&"off"!==i.state,o=this.config.title||s.friendly_name||"Split system";this.$.nm.textContent=o,this.$.st.textContent=this.rt(t),this.$.mi.setAttribute("icon",e?"mdi:heat-pump":this.et(i.state,s.hvac_action)),this.$.idn.setAttribute("aria-label",`Open details for ${o}`),this.$.pw.classList.toggle("on",n),this.$.pw.disabled=e,this.$.pw.setAttribute("aria-label",e?`${o} unavailable`:`Turn ${n?"off":"on"} ${o}`),this.$.pw.setAttribute("aria-pressed",String(n));const r=this.lt();if(this.$.sg.hidden=!r,this.$.hd.classList.toggle("settings",r),this.$.ct.hidden=!1,this.$.uv.hidden=!e,this.$.uv.textContent=e?"Controls return when the controller reconnects.":"",e)return this.$.cr.hidden=!0,this.$.os.hidden=!0,this.$.as.hidden=!0,this.M(!0),void this.ht();const a=this.K(s.current_temperature),l=this.K(s.temperature),h=this.K(s.target_temp_step),{minimum:c,maximum:d}=this.dt(),u=n&&["heat","cool","auto"].includes(i.state)&&null!==l&&null!==h&&h>0;this.$.cr.hidden=!n||null===a&&!u,this.$.cr.classList.toggle("to",null===a&&u),this.$.rm.hidden=null===a,this.$.rv.textContent=this.it(a)??"",this.$.tc.hidden=!u;const p=this.v??l;if(this.$.tv.textContent=this.it(p)??"",this.$.ts.textContent=this.ut(l),this.$.decrease.disabled=!u||null!==c&&p<=c,this.$.increase.disabled=!u||null!==d&&p>=d,this.$.os.hidden=n,!n){const t=[];null!==a&&t.push(`Room ${this.it(a)}`);const i=this.gt();i&&t.push(`Resume ${this.tt(i)}`),this.$.os.textContent=t.join(" · ")||"Ready when needed"}const m=this.ft(),g=this.bt(),f=this.vt(),b=this.xt();this.$.as.hidden=!n,this.$.ma.hidden=!n||m.length<2,this.$.fa.hidden=!n||g.length<2,this.$.va.hidden=!n||0===f.length,this.$.ta.hidden=!n||!b,this.$.ma.querySelector(".al").textContent=`Mode · ${this.tt(i.state)}`,this.$.fa.querySelector(".al").textContent=`Fan · ${this.tt(s.fan_mode)}`,this.$.va.querySelector(".al").textContent=this.yt(f),this.$.ta.querySelector(".al").textContent=this.wt(),this.$.ta.classList.toggle("av",this._t().av),this.o&&!this.kt()?(this.Tt("That control is no longer available.","error"),this.M(!0)):this.o&&this.St(),this.ht()}F(){if(!this.t||!this.P)return;const t=this.Z();this.$.st.textContent=this.rt(t),this.ht(),this.o&&this.St()}ut(t){if(this.p.get("temperature")||this._){const i=this.it(t);return i?`Requesting · Current ${i}`:"Requesting"}return"Target"}ft(){const t=this.Z().attributes.hvac_modes;return Array.isArray(t)?t.filter(t=>"off"!==t&&this.ot(t)):[]}bt(){const{attributes:t}=this.Z(),i=Array.isArray(t.fan_modes)&&this.ot(t.fan_mode)?t.fan_modes.filter(t=>this.ot(t)):[],s=this.config.fan_ceiling;if(!s||"unrestricted"===String(s).toLowerCase())return i;const e={quiet:0,low:1,medium:2,high:3},n=e[String(s).toLowerCase()];return void 0===n?i:i.filter(t=>void 0!==e[String(t).toLowerCase()]&&e[String(t).toLowerCase()]<=n)}lt(){const t=this.Z(),i=this.K(t.attributes.min_temp),s=this.K(t.attributes.max_temp),e=this.K(t.attributes.target_temp_step),n=this.K(this.config.minimum_target),o=this.K(this.config.maximum_target),r=["Quiet","Low","Medium","High","Unrestricted"];return!t.uv&&this.config.room_id&&null!==i&&null!==s&&i<s&&null!==e&&e>0&&null!==n&&null!==o&&n>=i&&o<=s&&n<o&&r.includes(this.config.fan_ceiling)}dt(){const t=this.Z().attributes,i=this.K(t.min_temp),s=this.K(t.max_temp),e=this.K(this.config.minimum_target),n=this.K(this.config.maximum_target),o=null!==e&&null!==n&&e<n&&(null===i||e>=i)&&(null===s||n<=s);return{minimum:o&&null!==i?Math.max(i,e):i,maximum:o&&null!==s?Math.min(s,n):s}}gt(){const t=this.config.last_mode;return this.ft().includes(t)?t:null}vt(){return[["vertical","Vertical vane",this.config.vertical_vane_entity],["horizontal","Horizontal vane",this.config.horizontal_vane_entity]].flatMap(([t,i,s])=>{const e=this.X(s),n=Array.isArray(e?.attributes?.options)?e.attributes.options.filter(t=>this.ot(t)):[];return s&&e&&"unavailable"!==String(e.state).toLowerCase()&&n.length?[{axis:t,title:i,entityId:s,state:e.state,qs:n}]:[]})}$t(t,i){return("vertical"===i?{AUTO:"Auto","↑↑":"Highest","↑":"High","—":"Centre","↓":"Low","↓↓":"Lowest",SWING:"Swing"}:{"←←":"Far left","←":"Left","|":"Centre","→":"Right","→→":"Far right","←→":"Wide",SWING:"Swing","AIRFLOW CONTROL":"Airflow control"})[t]??this.tt(t)}At(t,i){return"mode"===t.key?this.et(i):"fan"===t.key?{auto:"mdi:fan-auto",quiet:"mdi:volume-low",low:"mdi:fan-speed-1",medium:"mdi:fan-speed-2",high:"mdi:fan-speed-3"}[String(i).toLowerCase()]??"mdi:fan":"vertical"===t.axis?{AUTO:"mdi:autorenew","↑↑":"mdi:arrow-up-bold","↑":"mdi:arrow-up","—":"mdi:minus","↓":"mdi:arrow-down","↓↓":"mdi:arrow-down-bold",SWING:"mdi:swap-vertical"}[i]??"mdi:swap-vertical":"mdi:swap-horizontal"}yt(t){return 1===t.length?`Vanes · ${this.$t(t[0].state,t[0].axis)}`:t.length>1?`Vanes · V ${this.$t(t[0].state,"vertical")} · H ${this.$t(t[1].state,"horizontal")}`:"Vanes"}xt(){return Boolean(this.config.room_id&&this.config.entity)}_t(){const t=this.config.deadline?Date.parse(String(this.config.deadline)):NaN;return Number.isFinite(t)?{av:t>Date.now(),deadline:t}:{av:!1,deadline:null}}wt(){const t=this._t();if(!t.av)return"Timer";const i=Math.max(0,Math.ceil((t.deadline-Date.now())/6e4));return i>=60&&i%60==0?`Timer · ${i/60} hr`:`Timer · ${i} min`}j(){const t=this._t().av;t&&!this.k?this.k=setInterval(()=>{this.$.ta?.querySelector(".al")?.replaceChildren(this.wt()),"timer"===this.o&&this.St()},3e4):!t&&this.k&&(clearInterval(this.k),this.k=null)}U(t,i){this.o!==t?(this.o=t,this.h=i,this.l="",this.u=null,this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>t.setAttribute("aria-expanded",String(t===i))),this.$.pn.hidden=!1,this.St(!0)):this.M(!0)}M(t){if(!this.t)return;const i=Boolean(this.o),s=this.h;this.o=null,this.h=null,this.l="",this.u=null,this.$.pn.hidden=!0,this.shadowRoot.querySelectorAll("[data-panel]").forEach(t=>t.setAttribute("aria-expanded","false")),t&&i&&(!s?.isConnected||s.hidden||s.disabled?this.$.idn.focus():s.focus())}J(t){const i="settings"===this.o?this.$.pb.querySelector("component-split-settings-v1"):null,s=i?.shadowRoot?[this.$.x,...i.shadowRoot.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled])')]:[...this.$.pn.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled])')];if(!s.length)return;const e=s[0],n=s.at(-1),o=this.shadowRoot.activeElement,r=i&&o===i?i.shadowRoot.activeElement:o;!t.shiftKey||r!==e&&s.includes(r)?t.shiftKey||r!==n||(t.preventDefault(),e.focus()):(t.preventDefault(),n.focus())}kt(){return"settings"===this.o?this.lt():"mode"===this.o?this.ft().length>0:"fan"===this.o?this.bt().length>0:"vanes"===this.o?this.vt().length>0:"timer"===this.o&&this.xt()}St(t=!1){if(!this.o||!this.kt())return;if("settings"===this.o){if(this.$.pt.textContent="Advanced settings",!customElements.get("component-split-settings-v1"))return this.$.pb.textContent="Loading settings…",void customElements.whenDefined("component-split-settings-v1").then(()=>{"settings"===this.o&&this.St(!0)});let i=this.$.pb.querySelector("component-split-settings-v1");return i||(i=document.createElement("component-split-settings-v1"),i.setConfig({entity:this.config.entity,room_id:this.config.room_id,minimum_target:this.config.minimum_target,maximum_target:this.config.maximum_target,fan_ceiling:this.config.fan_ceiling}),this.$.pb.replaceChildren(i)),i.hass=this.P,void(t&&i.focusInitial())}const i=this.u,s=this.$.pb,e=s.querySelector('input[type="number"]')?.value,n=this.Ct(),o=JSON.stringify(n);if(o===this.l)return;if(this.l=o,this.$.pt.textContent=n.title,s.replaceChildren(),"timer"===this.o)this.qt(s,e);else for(const t of n.groups)s.append(this.Lt(t));const r=i?s.querySelector(`[data-focus-key="${CSS.escape(i)}"]`):s.querySelector('[aria-selected="true"]')??s.querySelector("button");(i||t)&&queueMicrotask(()=>r?.focus())}zt(t){const i=this.p.get(t);return i?.queued?.requested??i?.requested??null}It(t,i){t.dataset.focusKey=i,t.addEventListener("focus",()=>{this.u=i})}Ct(){const t=this.Z();if("mode"===this.o)return{title:"Mode",groups:[{title:null,key:"mode",current:t.state.state,pending:this.zt("hvac"),qs:this.ft().map(t=>({value:t,label:this.tt(t)}))}]};if("fan"===this.o)return{title:"Fan",groups:[{title:null,key:"fan",current:t.attributes.fan_mode,pending:this.zt("fan"),qs:this.bt().map(t=>({value:t,label:this.tt(t)}))}]};if("vanes"===this.o)return{title:"Vanes",groups:this.vt().map(t=>({title:t.title,key:t.entityId,current:t.state,pending:this.zt(`vane:${t.entityId}`),axis:t.axis,qs:t.qs.map(i=>({value:i,label:this.$t(i,t.axis)}))}))};const i=this._t();return{title:"Off timer",active:i.av,deadline:i.deadline,pending:this.p.has("timer")}}Lt(t){const i=document.createElement("div");if(i.className="og",t.title){const s=document.createElement("div");s.className="gt",s.textContent=t.title,i.append(s)}const s=document.createElement("div");s.className="qs",s.setAttribute("role","listbox"),s.setAttribute("aria-label",t.title||this.tt(t.key));const e=t.pending,n=t.qs.some(i=>i.value===t.current);for(const[i,o]of t.qs.entries()){const r=document.createElement("button");r.type="button",r.className="o",r.dataset.key=`${t.key}|${o.value}`,this.It(r,r.dataset.key),r.setAttribute("role","option"),r.setAttribute("aria-selected",String(t.current===o.value)),r.setAttribute("aria-disabled",String(e===o.value)),r.tabIndex=t.current===o.value||!n&&0===i?0:-1;const a=document.createElement("ha-icon");if(a.className="oi",a.setAttribute("icon",this.At(t,o.value)),r.append(a,o.label),e===o.value){const t=document.createElement("ha-icon");t.setAttribute("icon","mdi:progress-clock"),r.append(t)}else if(t.current===o.value){const t=document.createElement("ha-icon");t.setAttribute("icon","mdi:check"),r.append(t)}r.addEventListener("click",()=>this.Mt(t,o)),r.addEventListener("keydown",t=>this.Pt(t,s)),s.append(r)}return i.append(s),i}Pt(t,i){if(!["ArrowDown","ArrowRight","ArrowUp","ArrowLeft","Home","End"].includes(t.key))return;t.preventDefault();const s=[...i.querySelectorAll("button:not([disabled])")];if(!s.length)return;const e=s.indexOf(t.currentTarget),n="Home"===t.key?0:"End"===t.key?s.length-1:(e+(["ArrowDown","ArrowRight"].includes(t.key)?1:-1)+s.length)%s.length;s.forEach((t,i)=>{t.tabIndex=i===n?0:-1}),s[n].focus()}Mt(t,i){t.current!==i.value&&t.pending!==i.value&&("mode"===t.key?this.Nt("hvac",{requested:i.value,label:i.label,call:()=>this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:i.value}),matches:()=>this.X(this.config.entity)?.state===i.value,closePanel:!0}):"fan"===t.key?this.Nt("fan",{requested:i.value,label:i.label,call:()=>this.P.callService("climate","set_fan_mode",{entity_id:this.config.entity,fan_mode:i.value}),matches:()=>this.X(this.config.entity)?.attributes?.fan_mode===i.value,closePanel:!0}):this.Nt(`vane:${t.key}`,{requested:i.value,label:i.label,call:()=>this.P.callService("select","select_option",{entity_id:t.key,option:i.value}),matches:()=>this.X(t.key)?.state===i.value,closePanel:!1}))}qt(t,i){const s=this.p.has("timer"),e=document.createElement("div");e.className="tpr";for(const[t,i]of[[30,"30 min"],[60,"1 hr"],[120,"2 hr"]]){const n=document.createElement("button");n.type="button";const o=document.createElement("ha-icon");o.setAttribute("icon","mdi:clock-outline"),n.append(o,i),this.It(n,`timer-preset-${t}`),n.setAttribute("aria-disabled",String(s)),n.addEventListener("click",()=>{s||this.Ot("set",t,i)}),e.append(n)}const n=document.createElement("div");n.className="tcu";const o=document.createElement("label");o.textContent="Custom minutes";const r=document.createElement("input");r.type="number",r.min="1",r.max="720",r.step="1",r.value=i||"90",this.It(r,"timer-custom-input"),o.append(r);const a=document.createElement("button");if(a.type="button",a.textContent="Start",a.setAttribute("aria-disabled",String(s)),this.It(a,"timer-custom-start"),a.addEventListener("click",()=>{if(s)return;const t=Number(r.value);if(!Number.isInteger(t)||t<1||t>720)return this.Tt("Enter a timer between 1 and 720 minutes.","error"),void r.focus();this.Ot("set",t,`${t} min`)}),n.append(o,a),t.append(e,n),this._t().av){const i=document.createElement("div");i.className="tac";const e=document.createElement("button");e.type="button",e.textContent="+30 min",e.setAttribute("aria-disabled",String(s)),this.It(e,"timer-extend"),e.addEventListener("click",()=>{s||this.Ot("extend",30,"30 more minutes")});const n=document.createElement("button");n.type="button",n.textContent="Cancel timer",n.setAttribute("aria-disabled",String(s)),this.It(n,"timer-cancel"),n.addEventListener("click",()=>{s||this.Ot("cancel",0,"timer cancellation")}),i.append(e,n),t.append(i)}}Ot(t,i,s){const e=this._t(),n="extend"===t&&null!==e.deadline?e.deadline+6e4*i:null;this.Nt("timer",{requested:t,label:s,call:()=>this.P.callService("ha_component_backend","set_timer",{room_id:this.config.room_id,operation:t,minutes:i||void 0}),matches:()=>{const i=this._t();return"cancel"===t?!i.av:"extend"===t?i.av&&null!==n&&i.deadline>=n-5e3:i.av&&i.deadline!==e.deadline},closePanel:!0,timeout:1e4})}G(){const t=this.Z();if(t.uv)return;if("off"!==t.state.state)return void this.Rt("hvac",{requested:"off",label:"Off",call:()=>this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:"off"}),matches:()=>"off"===this.X(this.config.entity)?.state,closePanel:!0,timeout:1e4},!0);const i=this.gt();i?this.Rt("hvac",{requested:i,label:this.tt(i),call:()=>this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:i}),matches:()=>this.X(this.config.entity)?.state===i,closePanel:!1,timeout:1e4},!0):this.U("mode",this.$.pw)}Dt(t,i,s){const e=s??0,n=Math.max(0,String(i).split(".")[1]?.length??0);return Number((e+Math.round((t-e)/i)*i).toFixed(n))}Et(t){const i=this.K(t);if(null===i)return null;const{minimum:s,maximum:e}=this.dt();return Math.min(e??i,Math.max(s??i,i))}W(t){const i=this.Z().attributes,s=this.K(i.temperature),e=this.K(i.target_temp_step);if(null===s||null===e||e<=0)return;const{minimum:n}=this.dt(),o=this.v??s,r=this.Dt(o+t*e,e,n??s);this.v=this.Et(r),this.T=null,clearTimeout(this._),this.p.has("temperature")||(this._=setTimeout(()=>{this._=null,this.Vt()},300)),this.H()}Vt(){const t=this.Et(this.v);null!==t&&(this.v=t,this.Rt("temperature",{requested:t,label:this.it(t),call:()=>this.P.callService("climate","set_temperature",{entity_id:this.config.entity,temperature:t}),matches:()=>{const i=this.Et(t),s=this.K(this.X(this.config.entity)?.attributes?.temperature);return null!==i&&null!==s&&Math.abs(s-i)<.001},closePanel:!1,timeout:1e4}))}Nt(t,i){this.T=null;const s=this.p.get(t);if(s)return s.queued=i,void this.H();this.Rt(t,i)}Rt(t,i,s=!1){this.T=null;const e=this.p.get(t);if(e&&!s)return e.queued=i,void this.H();e&&this.I(e);const n=++this.m,o=Date.now(),r={...i,id:n,settleAfter:o+1800,queued:null};this.p.set(t,r),r.timeoutTimer=setTimeout(()=>this.Ht(t,n,`No confirmation for ${r.label}.`),i.timeout??8e3),r.settleTimer=setTimeout(()=>this.D(),1820),this.H(),Promise.resolve().then(()=>r.call()).then(()=>{const i=this.p.get(t);i&&i.id===n&&this.D()}).catch(()=>this.Ht(t,n,`Could not request ${r.label}.`))}D(){const t=this.Z();if(this.p.size&&t.uv){for(const t of this.p.values())this.I(t);return this.p.clear(),clearTimeout(this._),this._=null,this.v=null,void(this.T={text:"Controller disconnected before the request was confirmed.",type:"error"})}if("off"===t.state?.state){for(const[t,i]of[...this.p])("temperature"===t||"fan"===t||"timer"===t||t.startsWith("vane:"))&&(this.I(i),this.p.delete(t));clearTimeout(this._),this._=null,this.v=null}const i=Date.now();for(const[t,s]of[...this.p])i>=s.settleAfter&&s.matches()&&this.Ft(t,s.id)}Ft(t,i){const s=this.p.get(t);if(!s||s.id!==i)return;this.I(s),this.p.delete(t);const e=s.queued;if("temperature"===t){const t=this.K(this.X(this.config.entity)?.attributes?.temperature),i=this.Et(s.requested);this.v=this.Et(this.v),null!==i&&null!==this.v&&Math.abs(this.v-i)>.001?queueMicrotask(()=>this.Vt()):null!==i&&null!==t&&Math.abs(t-i)<.001&&(this.v=null)}e?queueMicrotask(()=>this.Rt(t,e)):s.closePanel&&this.o&&this.M(!0),this.i="",this.H()}Ht(t,i,s){const e=this.p.get(t);e&&e.id===i&&(this.I(e),this.p.delete(t),"temperature"===t&&(this.v=null),this.Tt(s,"error"),e.queued&&queueMicrotask(()=>this.Rt(t,e.queued)),this.i="",this.H())}I(t){clearTimeout(t.timeoutTimer),clearTimeout(t.settleTimer)}Tt(t,i="info"){this.T={text:t,type:i},this.ht()}ht(){this.t&&(this.$.fb.textContent=this.T?.text??"",this.$.fb.classList.toggle("er","error"===this.T?.type))}B(){this.dispatchEvent(new CustomEvent("hass-action",{bubbles:!0,composed:!0,detail:{config:{entity:this.config.entity,tap_action:{action:"more-info"}},action:"tap"}}))}}
registerCard({ type: "component-split-controller-v4", element: ComponentSplitControllerV4, name: "Split-System Controller", description: "Registry-aware split-system controller with settings and timer support." });
}

// Module: src/components/favourites.js
{
/** ComponentFavouritesV3 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const FAVOURITES_V3_DOMAINS=new Set(["automation","button","climate","cover","fan","humidifier","input_boolean","input_button","light","lock","media_player","scene","script","select","switch","vacuum","water_heater"]),FAVOURITES_V3_INVALID=new Set(["unavailable","unknown"]);class ComponentFavouritesV3 extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._registry=null,this._registryPromise=null,this._selected=[],this._draft=[],this._originalDraft="",this._pending=new Map,this._flash=new Map,this._flashTimers=new Map,this._lastStorageSignature="",this._noticeTimer=null,this._registrySubscription=null,this._registryRefreshTimer=null,this._renderSignature="",this._editorStorageSignature="",this._connection=null,this._interactionHandles=[],this._optimistic=new Map}setConfig(t){const e=Array.isArray(t?.helpers)?t.helpers.filter(t=>"string"==typeof t):[],i=Array.isArray(t?.items)?t.items.slice(0,4):[];if(!e.length&&!i.length)throw new Error("helpers or items is required");this.config={title:"Favourites",max:4,show_header:e.length>0,...t,helpers:e.slice(0,4),items:i},this._build(),this._syncStored(),this._renderGrid()}set hass(t){const e=this._connection;this._hass=t,this._connection=t?.connection||null,this._built||this._build(),e!==this._connection&&(this._unsubscribeRegistryEvents(),this._subscribeRegistryEvents()),this._syncStored(),this._ensureRegistry();const i=this._gridSignature();i!==this._renderSignature&&(this._renderSignature=i,this._renderGrid()),this.$?.editor?.open&&this._updateEditorState(),this._controllerCard&&(this._controllerCard.hass=t)}getCardSize(){return 2}connectedCallback(){this._connection=this._hass?.connection||null,this._subscribeRegistryEvents(),this._ensureRegistry()}disconnectedCallback(){for(const t of this._interactionHandles)t.destroy();this._interactionHandles=[];this._optimistic.clear();clearTimeout(this._noticeTimer),clearTimeout(this._registryRefreshTimer),this._registryRefreshTimer=null,this._unsubscribeRegistryEvents();for(const t of this._flashTimers.values())clearTimeout(t);this._flashTimers.clear()}_subscribeRegistryEvents(){if(!this.isConnected||this._registrySubscription||!this._connection?.subscribeEvents)return;const t=Promise.all(["entity_registry_updated","device_registry_updated","area_registry_updated"].map(e=>this._connection.subscribeEvents(()=>this._queueRegistryRefresh(),e))).then(t=>()=>{for(const e of t)e?.()});this._registrySubscription=t,t.catch(()=>{this._registrySubscription===t&&(this._registrySubscription=null)})}_unsubscribeRegistryEvents(){const t=this._registrySubscription;this._registrySubscription=null,t&&Promise.resolve(t).then(t=>t?.()).catch(()=>{})}_queueRegistryRefresh(){clearTimeout(this._registryRefreshTimer),this._registryRefreshTimer=setTimeout(()=>{this._registryRefreshTimer=null,this._registry=null,this._registryPromise=null,this._registryError=null,this._renderSignature="",this.isConnected&&this._ensureRegistry()},180)}_storageSignature(){return JSON.stringify((this.config?.helpers||[]).map(t=>this._hass?.states?.[t]?.state))}_gridSignature(){if(!this.config)return"";return JSON.stringify([this._storageSignature(),this._selected.map((t,s)=>{const e=this._record(t),i=this._companion(e);return[this._refKey(t),this._name(e),this._icon(e),e.state?.state,this._stateLabel(e),this._isActive(e),i?.state?.state,this._pending.get(s)?.label||"",this._flash.get(s)?.kind||"",this._flash.get(s)?.label||""]})])}_build(){if(this.config&&!this._built){this._built=!0,this.shadowRoot.innerHTML='\n      <style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;cursor:pointer}ha-card{border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.wrap{padding:0}.head{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.heading{display:flex;align-items:center;gap:8px;min-width:0}.heading ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.heading h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.edit{min-width:44px;min-height:44px;padding:0 10px;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-color);display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:600}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.edit ha-icon{--mdc-icon-size:18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:448px}.item{position:relative;min-width:0;min-height:52px;display:grid;grid-template-columns:minmax(0,1fr) auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));overflow:hidden}.main{min-width:0;min-height:52px;padding:6px 8px;text-align:left;background:transparent;display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:8px}.item.has-quick .main{padding-right:4px}.main:active,.quick:active{background:color-mix(in srgb,var(--primary-color) 10%,transparent)}.main:focus-visible,.quick:focus-visible,.edit:focus-visible,.dialog-button:focus-visible,.choice:focus-visible,.order:focus-visible,.remove:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.icon{width:32px;height:32px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:650}.state{margin-top:2px;font-size:13px;color:var(--secondary-text-color)}.item.active{background:var(--dashboard-active-surface,var(--card-background-color));box-shadow:inset 2px 0 0 var(--primary-color)}.item.active .icon{background:transparent;color:var(--primary-color)}.item.active .state{color:var(--primary-color);font-weight:600}.item.unavailable{opacity:.55}.quick{width:44px;min-height:52px;padding:0;border-left:1px solid var(--dashboard-card-border-color,var(--divider-color));background:transparent;color:var(--primary-color);display:grid;place-items:center}.quick ha-icon{--mdc-icon-size:21px}.item:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;opacity:0;transform-origin:left}.item.pending:after{opacity:1;background:linear-gradient(90deg,transparent,var(--primary-color),transparent);animation:favourite-progress 1.05s linear infinite}.item.success:after{opacity:1;background:var(--success-color,#43a047)}.item.error:after{opacity:1;background:var(--error-color)}@keyframes favourite-progress{from{transform:translateX(-100%)}to{transform:translateX(100%)}}.empty,.load-error{grid-column:1/-1;min-height:44px;padding:9px 11px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:transparent;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.notice{min-height:0;margin-top:0;font-size:13px;color:var(--secondary-text-color)}.notice:not(:empty){margin-top:7px}.notice.error{color:var(--error-color)}dialog{box-sizing:border-box;border:var(--dashboard-card-border,1px solid var(--divider-color));padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}.editor{width:min(580px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 24px));border-radius:var(--dashboard-radius-dialog,8px)}.dialog-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:transparent;border-bottom:1px solid var(--divider-color)}.dialog-title{font-size:20px;font-weight:650}.close{width:44px;height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.editor-body{padding:14px 16px 96px}.editor-copy{font-size:13px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:12px}.subheading{margin:14px 0 7px;font-size:13px;font-weight:650;color:var(--primary-text-color)}.selected{display:grid;gap:7px}.selected-row{min-height:62px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px;padding:6px 7px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color))}.selected-row .icon{background:transparent}.selected-copy{min-width:0}.selected-meta{font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.alias{width:100%;height:44px;margin-top:3px;padding:0 8px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;font-size:13px;outline:none}.alias:focus{border-color:var(--primary-color)}.selected-actions{display:flex;align-items:center;gap:2px}.order,.remove{width:44px;height:44px;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.order[disabled]{opacity:.3;cursor:default}.remove{color:var(--error-color)}.order ha-icon,.remove ha-icon{--mdc-icon-size:18px}.search{width:100%;min-height:46px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;outline:none}.search:focus{border-color:var(--primary-color)}.available{margin-top:8px}.group-title{padding:10px 4px 5px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.choice{width:100%;min-height:58px;padding:6px 7px;border-radius:var(--dashboard-radius-control,8px);background:transparent;text-align:left;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px}.choice:hover{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.choice-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.choice-meta{margin-top:2px;font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.add{color:var(--primary-color);font-size:13px;font-weight:650;padding-right:4px}.available-empty{padding:10px 7px;color:var(--secondary-text-color);font-size:13px}.editor-actions{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;background:transparent;border-top:1px solid var(--divider-color)}.count{font-size:13px;color:var(--secondary-text-color)}.action-buttons{display:flex;gap:8px}.dialog-button{min-height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.dialog-button.primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}.dialog-button[disabled]{opacity:.45;cursor:default}.editor-error{min-height:0;margin-top:8px;color:var(--error-color);font-size:13px}.confirm{width:min(430px,calc(100vw - 28px));border-radius:var(--dashboard-radius-dialog,8px)}.confirm-body{padding:18px}.confirm-title{font-size:18px;font-weight:650}.confirm-message{margin-top:7px;font-size:13px;line-height:1.45;color:var(--secondary-text-color)}.confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.controller{width:min(620px,calc(100vw - 20px));max-height:calc(100vh - 20px);border-radius:var(--dashboard-radius-dialog,8px);overflow:auto}.controller-body{padding:12px}.controller-body>*{display:block}.controller .dialog-head{border-bottom:0}@media(max-width:420px){.head{margin-bottom:6px}.edit span{display:none}.edit{padding:0}.grid{gap:8px}.main{padding:6px}.editor-body{padding:12px 12px 94px}.dialog-head{padding:12px}.editor-actions{padding:11px 12px}.selected-row{grid-template-columns:30px minmax(0,1fr) auto;gap:7px;padding:5px}.selected-actions{gap:0}.order,.remove{width:44px}.choice{padding:5px}}\n      </style>\n      <ha-card>\n        <div class="wrap">\n          <div class="head">\n            <div class="heading"><ha-icon icon="mdi:star-outline"></ha-icon><h2></h2></div>\n            <button class="edit" type="button"><ha-icon icon="mdi:pencil-outline"></ha-icon><span>Edit</span></button>\n          </div>\n          <div class="grid"></div>\n          <div class="notice" role="status" aria-live="polite"></div>\n        </div>\n      </ha-card>\n      <dialog class="editor" aria-labelledby="favourites-editor-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-editor-title">Edit favourites</div><button class="close editor-close" type="button" aria-label="Close editor"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="editor-body">\n          <div class="editor-copy">Choose up to four household controls. Their order here is their order on Home.</div>\n          <div class="subheading">Selected</div>\n          <div class="selected"></div>\n          <div class="subheading">Available controls</div>\n          <input class="search" type="search" placeholder="Search by name, room or entity" aria-label="Search available controls">\n          <div class="available"></div>\n          <div class="editor-error" role="alert"></div>\n        </div>\n        <div class="editor-actions"><div class="count"></div><div class="action-buttons"><button class="dialog-button cancel" type="button">Cancel</button><button class="dialog-button primary save" type="button">Save</button></div></div>\n      </dialog>\n      <dialog class="confirm" aria-labelledby="favourites-confirm-title">\n        <div class="confirm-body"><div class="confirm-title" id="favourites-confirm-title"></div><div class="confirm-message"></div><div class="confirm-actions"><button class="dialog-button confirm-cancel" type="button">Cancel</button><button class="dialog-button primary confirm-run" type="button">Run</button></div></div>\n      </dialog>\n      <dialog class="controller" aria-labelledby="favourites-controller-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-controller-title">Climate</div><button class="close controller-close" type="button" aria-label="Close climate controller"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="controller-body"></div>\n      </dialog>\n    ',this.$=Object.fromEntries([...this.shadowRoot.querySelectorAll("[class]")].flatMap(t=>[...t.classList].map(e=>[e,t]))),Object.assign(this.$,{editorClose:this.shadowRoot.querySelector(".editor-close"),confirmCancel:this.shadowRoot.querySelector(".confirm-cancel"),confirmRun:this.shadowRoot.querySelector(".confirm-run"),confirmTitle:this.shadowRoot.querySelector(".confirm-title"),confirmMessage:this.shadowRoot.querySelector(".confirm-message"),controllerClose:this.shadowRoot.querySelector(".controller-close"),controllerTitle:this.shadowRoot.querySelector("#favourites-controller-title"),controllerBody:this.shadowRoot.querySelector(".controller-body"),editorError:this.shadowRoot.querySelector(".editor-error")}),this.shadowRoot.querySelector("h2").textContent=this.config.title,this.$.head.hidden=!1===this.config.show_header,this.$.edit.hidden=!this.config.helpers.length,this.$.edit.addEventListener("click",()=>this._openEditor()),this.$.editorClose.addEventListener("click",()=>this.$.editor.close()),this.$.cancel.addEventListener("click",()=>this.$.editor.close()),this.$.search.addEventListener("input",()=>this._renderAvailable()),this.$.save.addEventListener("click",()=>this._save()),this.$.confirmCancel.addEventListener("click",()=>this.$.confirm.close()),this.$.controllerClose.addEventListener("click",()=>this.$.controller.close());for(const t of[this.$.editor,this.$.confirm,this.$.controller])t.addEventListener("click",e=>{e.target===t&&t.close()})}}_escape(t){return escapeHtml(t)}_domain(t){return String(t||"").split(".")[0]}_normaliseRef(t){return t&&"object"==typeof t&&[t.d,t.p,t.u].every(t=>"string"==typeof t&&t)?{v:1,d:t.d,p:t.p,u:t.u,n:"string"==typeof t.n?t.n.slice(0,64):""}:null}_parseSlot(t){if(!t||FAVOURITES_V3_INVALID.has(String(t).toLowerCase()))return null;try{return this._normaliseRef(JSON.parse(t))}catch(t){return null}}_syncStored(){if(!this.config||!this._hass||!this.config.helpers.length)return;const t=JSON.stringify(this.config.helpers.map(t=>this._hass.states?.[t]?.state));t!==this._lastStorageSignature&&(this._lastStorageSignature=t,this._selected=this.config.helpers.map(t=>this._parseSlot(this._hass.states?.[t]?.state)).filter(Boolean).slice(0,this.config.max))}async _ensureRegistry(){return this._registry||this._registryPromise||!this._hass?.connection?.sendMessagePromise||(this._registryPromise=Promise.all([this._hass.connection.sendMessagePromise({type:"config/entity_registry/list"}),this._hass.connection.sendMessagePromise({type:"config/device_registry/list"}),this._hass.connection.sendMessagePromise({type:"config/area_registry/list"})]).then(async([t,e,i])=>{const s=Array.isArray(t)?t:[],r=Array.isArray(e)?e:[],a=Array.isArray(i)?i:[],o=new Map,n=new Map;for(const t of s){const e=this._entryKey(t);e&&o.set(e,t),t.device_id&&(n.has(t.device_id)||n.set(t.device_id,[]),n.get(t.device_id).push(t))}return this._registry={entities:s,devices:new Map(r.map(t=>[t.id,t])),areas:new Map(a.map(t=>[t.area_id,t.name])),byKey:o,byDevice:n,claimed:new Set,splitSystems:new Map},await this._refreshSplitRegistry(),this._renderSignature="",this._renderGrid(),this.$?.editor?.open&&this._renderEditor(),this._registry}).catch(t=>(this._registryError=t,this._registryPromise=null,this._renderGrid(),null))),this._registryPromise}async _refreshSplitRegistry(){const t=globalThis.__componentSplitRegistryV4;if(this._registry&&t?.load&&this._hass)try{const e=await t.load(this._hass);this._registry.claimed=e?.claimed||new Set,this._registry.splitSystems=e?.systems||new Map}catch(t){this._registry.claimed=new Set,this._registry.splitSystems=new Map}}_entryKey(t){return t?.entity_id&&t.platform&&t.unique_id?`${this._domain(t.entity_id)}|${t.platform}|${t.unique_id}`:null}_refKey(t){return t?`${t.d}|${t.p}|${t.u}`:""}_refForEntry(t,e=""){return{v:1,d:this._domain(t.entity_id),p:t.platform,u:t.unique_id,n:e}}_record(t){const e=this._registry?.byKey.get(this._refKey(t))||null;return{ref:t,entry:e,state:e&&this._hass?.states?.[e.entity_id]||null}}_name(t){return t.ref?.n?.trim()||t.entry?.name||t.entry?.original_name||t.state?.attributes?.friendly_name||t.entry?.entity_id||"Favourite not found"}_icon(t){if(t.state?.attributes?.icon)return t.state.attributes.icon;return{automation:"mdi:robot-outline",button:"mdi:gesture-tap-button",climate:"mdi:thermostat",cover:"mdi:window-shutter",fan:"mdi:fan",humidifier:"mdi:air-humidifier",input_boolean:"mdi:toggle-switch-outline",input_button:"mdi:gesture-tap-button",light:"mdi:lightbulb-outline",lock:"mdi:lock-outline",media_player:"mdi:play-circle-outline",scene:"mdi:palette-outline",script:"mdi:script-text-outline",select:"mdi:format-list-bulleted",switch:"mdi:toggle-switch-outline",vacuum:"mdi:robot-vacuum",water_heater:"mdi:water-boiler"}[t.entry?this._domain(t.entry.entity_id):t.ref?.d]||"mdi:star-outline"}_companion(t){if(!t.entry?.device_id||!this._registry)return null;const e=(this._registry.byDevice.get(t.entry.device_id)||[]).filter(t=>"binary_sensor"===this._domain(t.entity_id)).map(t=>({entry:t,state:this._hass?.states?.[t.entity_id]})).filter(({state:t})=>["garage_door","door","opening"].includes(t?.attributes?.device_class));return e.find(({state:t})=>"garage_door"===t?.attributes?.device_class)||e[0]||null}_companionLabel(t){return t?.state?"on"===t.state.state?"Open":"off"===t.state.state?"Closed":"unavailable"===t.state.state?"Status unavailable":"Status unknown":null}_stateLabel(t){if(!t.entry||!t.state)return"Not found";if("unavailable"===t.state.state)return"Unavailable";if("unknown"===t.state.state)return"Status unknown";const e=this._domain(t.entry.entity_id),i=this._companion(t);if(["button","input_button"].includes(e)){const t=this._companionLabel(i);return t?`${t} · Tap to operate`:"Tap to run"}if(["automation","script"].includes(e))return"Tap to start";if("scene"===e)return"Tap to activate";if("media_player"===e){const e=t.state.attributes?.media_title,i=this._label(t.state.state);return e?`${i} · ${e}`:i}if("climate"===e){const e=t.state.attributes?.hvac_action;return this._label(e&&"idle"!==e?e:t.state.state)}return this._label(t.state.state)}_label(t){return String(t??"").replaceAll("_"," ").replace(/^./,t=>t.toUpperCase())}_isActive(t){if(!t.state||FAVOURITES_V3_INVALID.has(String(t.state.state).toLowerCase()))return!1;const e=this._domain(t.entry?.entity_id);return["light","switch","fan","input_boolean"].includes(e)?"on"===t.state.state:"media_player"===e?["playing","paused","buffering","on"].includes(t.state.state):"climate"===e?"off"!==t.state.state:"cover"===e?"closed"!==t.state.state:"lock"===e&&"unlocked"===t.state.state}_hasMediaQuick(t){return"media_player"===this._domain(t.entry?.entity_id)&&["playing","paused"].includes(t.state?.state)}_actionLabel(t){const e=this._domain(t.entry?.entity_id);return["light","switch","fan","input_boolean"].includes(e)?"on"===t.state?.state?"turn off":"turn on":["button","input_button"].includes(e)?"run":["automation","script"].includes(e)?"start":"scene"===e?"activate":"climate"===e?"open climate controls":"open details"}_renderGrid(){for(const t of this._interactionHandles)t.destroy();this._interactionHandles=[];if(!this.$?.grid||!this.config)return;if(this.config.items.length&&!this.config.helpers.length)return void this._renderDemo();this.$.grid.replaceChildren();this.config.helpers.some(t=>{const e=this._hass?.states?.[t];return this._hass&&(!e||FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase()))})?this.$.grid.innerHTML='<div class="load-error">Favourites storage is unavailable.</div>':this._registry?this._selected.length?this._selected.forEach((t,e)=>{const i=this._record(t),s=this._name(i),r=this._stateLabel(i),a=this._pending.get(e),o=this._flash.get(e),n=a?.label||o?.label||r,l=this._hasMediaQuick(i),u=!i.state||FAVOURITES_V3_INVALID.has(String(i.state.state).toLowerCase()),c=document.createElement("div");c.className=["item",l?"has-quick":"",(this._optimistic.has(e)?this._optimistic.get(e):this._isActive(i))?"active":"",u?"unavailable":"",a?"pending":"",o?.kind||""].filter(Boolean).join(" ");const d=document.createElement("button");d.type="button",d.className="main",d.setAttribute("aria-label",`${s}, ${r}, ${this._actionLabel(i)}`),u&&(d.disabled=!0,d.setAttribute("aria-disabled","true"));const h=this._domain(i.entry?.entity_id);if(["light","switch","fan","input_boolean"].includes(h)&&d.setAttribute("aria-pressed",String(this._optimistic.has(e)?this._optimistic.get(e):"on"===i.state?.state)),d.innerHTML=`<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="copy"><div class="name">${this._escape(s)}</div><div class="state">${this._escape(n)}</div></span>`,this._interactionHandles.push(interaction(d,{primary:()=>this._activate(e),hold:()=>this._moreInfo(i.entry?.entity_id),optimistic:!1,repeat:!1,feedback:!0})),c.append(d),l){const t=document.createElement("button");t.type="button",t.className="quick";const r="playing"===i.state.state;t.setAttribute("aria-label",`${r?"Pause":"Play"} ${s}`),t.innerHTML=`<ha-icon icon="mdi:${r?"pause":"play"}"></ha-icon>`,this._interactionHandles.push(interaction(t,{primary:()=>this._mediaAction(e),optimistic:!1,repeat:!1,feedback:!0})),c.append(t)}this.$.grid.append(c)}):this.$.grid.innerHTML='<div class="empty">Add up to four everyday controls here.</div>':this.$.grid.innerHTML=`<div class="${this._registryError?"load-error":"empty"}">${this._registryError?"Favourites could not load the entity registry.":"Loading favourites…"}</div>`}_renderDemo(){this.$.grid.replaceChildren(),this.config.items.slice(0,4).forEach(t=>{const e=document.createElement("div");e.className="item",e.innerHTML=`<div class="main"><span class="icon"><ha-icon icon="${this._escape(t.icon||"mdi:star-outline")}"></ha-icon></span><span class="copy"><div class="name">${this._escape(t.title||"Favourite")}</div><div class="state">${this._escape(t.state||"Supporting state")}</div></span></div>`,this.$.grid.append(e)})}async _activate(t){if(this._pending.has(t))return;const e=this._record(this._selected[t]);if(!e.entry||!e.state)return void this._openEditor();const i=e.entry.entity_id,s=this._domain(i);if(!FAVOURITES_V3_INVALID.has(String(e.state.state).toLowerCase()))if(["button","input_button"].includes(s))this._confirmButton(t,e);else{if(["light","switch","fan","input_boolean"].includes(s)){const s=e.state.state;this._optimistic.set(t,"on"!==s),this._setPending(t,"on"===s?"Turning off…":"Turning on…");try{await this._hass.callService("homeassistant","toggle",{entity_id:i}),await this._waitFor(i,t=>t!==s,9e3),this._setFlash(t,"success","on"===s?"Off":"On")}catch(e){this._setFlash(t,"error","Could not update")}return}if(["automation","script","scene"].includes(s)){const e="automation"===s?"trigger":"turn_on",r="scene"===s?"Activating…":"Starting…",a="scene"===s?"Activated":"Started";this._setPending(t,r);try{await this._hass.callService(s,e,{entity_id:i}),this._setFlash(t,"success",a)}catch(e){this._setFlash(t,"error","Could not start")}return}"climate"===s&&this._registry?.splitSystems?.has(i)?this._openSplit(e):this._moreInfo(i)}else this._moreInfo(i)}async _mediaAction(t){if(this._pending.has(t))return;const e=this._record(this._selected[t]);if(!e.entry||!e.state)return;const i=e.entry.entity_id,s="playing"===e.state.state,r=s?"media_pause":"media_play";this._optimistic.set(t,!s),this._setPending(t,s?"Pausing…":"Playing…");try{await this._hass.callService("media_player",r,{entity_id:i}),await this._waitFor(i,t=>s?"playing"!==t:"playing"===t,9e3),this._setFlash(t,"success",s?"Paused":"Playing")}catch(e){this._setFlash(t,"error","Could not update")}}_confirmButton(t,e){const i=this._name(e),s=this._companion(e),r=this._companionLabel(s);this.$.confirmTitle.textContent=r?`Operate ${i}?`:`Run ${i}?`,this.$.confirmMessage.textContent=r?`The current reported state is ${r.toLowerCase()}.`:"This action runs immediately and cannot be reversed from this button.",this.$.confirmRun.textContent=r?"Operate":"Run",this.$.confirmRun.onclick=()=>{this.$.confirm.close(),this._runButton(t,e)},this.$.confirm.showModal(),this.$.confirmCancel.focus()}async _runButton(t,e){const i=e.entry.entity_id,s=this._domain(i);this._setPending(t,"Sending command…");try{await this._hass.callService(s,"press",{entity_id:i}),this._setFlash(t,"success","Command sent")}catch(e){this._setFlash(t,"error","Command failed")}}_setPending(t,e){this._pending.set(t,{label:e}),this._flash.delete(t),this._renderGrid()}_setFlash(t,e,i){this._optimistic.delete(t),this._pending.delete(t),this._flash.set(t,{kind:e,label:i}),clearTimeout(this._flashTimers.get(t)),this._flashTimers.set(t,setTimeout(()=>{this._flash.delete(t),this._flashTimers.delete(t),this._renderGrid()},3200)),this._renderGrid()}_waitFor(t,e,i){return waitForEntityState(()=>this._hass,t,e,{timeout:i})}_moreInfo(t){openMoreInfo(this,t)}_openSplit(t){const e="component-split-controller-v4";if(!customElements.get(e))return void this._moreInfo(t.entry.entity_id);this.$.controllerTitle.textContent=this._name(t),this.$.controllerBody.replaceChildren();const i=document.createElement(e);i.setConfig({entity:t.entry.entity_id}),i.hass=this._hass,this._controllerCard=i,this.$.controllerBody.append(i),this.$.controller.showModal(),this.$.controllerClose.focus()}async _openEditor(){await this._ensureRegistry(),await this._refreshSplitRegistry(),this._editorStorageSignature=this._storageSignature(),this._draft=this._selected.map(t=>({...t})),this._originalDraft=JSON.stringify(this._draft),this.$.search.value="",this.$.editorError.textContent="",this._renderEditor(),this.$.editor.showModal(),setTimeout(()=>this.$.search.focus(),30)}_renderEditor(){this._renderSelected(),this._renderAvailable(),this._updateEditorState()}_renderSelected(){this.$.selected.replaceChildren(),this._draft.length?this._draft.forEach((t,e)=>{const i=this._record(t),s=document.createElement("div");s.className="selected-row",s.innerHTML=`<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="selected-copy"><div class="selected-meta">${this._escape(this._name({...i,ref:{...t,n:""}}))}</div><input class="alias" type="text" maxlength="64" value="${this._escape(t.n)}" placeholder="Optional shorter label" aria-label="Custom label for ${this._escape(this._name(i))}"></span><span class="selected-actions"><button class="order up" type="button" aria-label="Move ${this._escape(this._name(i))} earlier" ${0===e?"disabled":""}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="order down" type="button" aria-label="Move ${this._escape(this._name(i))} later" ${e===this._draft.length-1?"disabled":""}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="remove" type="button" aria-label="Remove ${this._escape(this._name(i))}"><ha-icon icon="mdi:close"></ha-icon></button></span>`,s.querySelector(".alias").addEventListener("input",t=>{this._draft[e].n=t.target.value.slice(0,64),this._updateEditorState()}),s.querySelector(".up").addEventListener("click",()=>this._move(e,-1)),s.querySelector(".down").addEventListener("click",()=>this._move(e,1)),s.querySelector(".remove").addEventListener("click",()=>{this._draft.splice(e,1),this._renderEditor()}),this.$.selected.append(s)}):this.$.selected.innerHTML='<div class="available-empty">No favourites selected.</div>'}_move(t,e){const i=t+e;i<0||i>=this._draft.length||([this._draft[t],this._draft[i]]=[this._draft[i],this._draft[t]],this._renderEditor())}_eligibleEntries(){if(!this._registry||!this._hass)return[];const t=new Set(this._draft.map(t=>this._refKey(t))),e=new Set(this.config.helpers);return this._registry.entities.filter(i=>{const s=this._domain(i.entity_id);return FAVOURITES_V3_DOMAINS.has(s)&&i.unique_id&&i.platform&&!i.disabled_by&&!i.hidden_by&&!i.entity_category&&this._hass.states?.[i.entity_id]&&!e.has(i.entity_id)&&!this._registry.claimed.has(i.entity_id)&&!t.has(this._entryKey(i))})}_areaName(t){if(!t)return"Missing";const e=t.device_id?this._registry?.devices.get(t.device_id):null,i=t.area_id||e?.area_id;return i&&this._registry?.areas.has(i)?this._registry.areas.get(i):["automation","scene","script"].includes(this._domain(t.entity_id))?"Routines":"Household"}_renderAvailable(){if(!this.$?.available)return;if(this.$.available.replaceChildren(),!this._registry)return void(this.$.available.innerHTML='<div class="available-empty">Loading household controls…</div>');const t=this.$.search.value.trim().toLowerCase(),e=this._eligibleEntries().map(t=>{const e=this._record(this._refForEntry(t));return{entry:t,record:e,name:this._name(e),area:this._areaName(t)}}).filter(({entry:e,name:i,area:s})=>`${i} ${s} ${e.entity_id} ${this._domain(e.entity_id)}`.toLowerCase().includes(t)).sort((t,e)=>`${t.area}\0${t.name}`.localeCompare(`${e.area}\0${e.name}`,void 0,{sensitivity:"base"}));if(!e.length)return void(this.$.available.innerHTML=`<div class="available-empty">${this._draft.length>=this.config.max?"Four favourites selected. Remove one to choose another.":"No matching household controls."}</div>`);let i="";for(const t of e){if(t.area!==i){i=t.area;const e=document.createElement("div");e.className="group-title",e.textContent=i,this.$.available.append(e)}const e=document.createElement("button");e.type="button",e.className="choice",e.disabled=this._draft.length>=this.config.max,e.innerHTML=`<span class="icon"><ha-icon icon="${this._escape(this._icon(t.record))}"></ha-icon></span><span><div class="choice-name">${this._escape(t.name)}</div><div class="choice-meta">${this._escape(`${this._label(this._domain(t.entry.entity_id))} · ${this._stateLabel(t.record)}`)}</div></span><span class="add">Add</span>`,e.addEventListener("click",()=>{this._draft.length>=this.config.max||(this._draft.push(this._refForEntry(t.entry)),this._renderEditor())}),this.$.available.append(e)}}_slotValue(t){return t?JSON.stringify(this._normaliseRef(t)):""} _updateEditorState(){const t=this.config.helpers.map((t,e)=>this._slotValue(this._draft[e]||null)).every((t,e)=>{const i=Number(this._hass?.states?.[this.config.helpers[e]]?.attributes?.max||255);return t.length<=i}),e=this.config.helpers.every(t=>{const e=this._hass?.states?.[t];return e&&!FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase())}),i=JSON.stringify(this._draft)!==this._originalDraft,s=Boolean(this.$?.editor?.open&&this._editorStorageSignature&&this._editorStorageSignature!==this._storageSignature());this.$.count.textContent=`${this._draft.length} of ${this.config.max} selected`,this.$.save.disabled=!i||!t||!e||s,this.$.editorError.textContent=s?"Favourites changed on another dashboard. Close and reopen the editor before trying again.":e?t?"":"A stored favourite is too long. Shorten its custom label.":"Favourites storage is unavailable."}async _save(){if(this.$.save.disabled)return;if(this._editorStorageSignature!==this._storageSignature())return void(this._updateEditorState());const t=this.config.helpers.map(t=>this._hass.states?.[t]?.state||""),e=this.config.helpers.map((t,e)=>this._slotValue(this._draft[e]||null));this.$.save.disabled=!0,this.$.save.textContent="Saving…",this.$.editorError.textContent="";try{for(let t=0;t<this.config.helpers.length;t+=1)await this._hass.callService("input_text","set_value",{entity_id:this.config.helpers[t],value:e[t]});this._selected=this._draft.map(t=>({...t})),this._lastStorageSignature="",this._renderSignature="",this._editorStorageSignature=this._storageSignature(),this.$.editor.close(),this._renderGrid(),this._notice("Favourites saved.")}catch(e){let i=!0;for(let e=0;e<this.config.helpers.length;e+=1)try{await this._hass.callService("input_text","set_value",{entity_id:this.config.helpers[e],value:t[e]})}catch(t){i=!1}this.$.editorError.textContent=i?"Favourites could not be saved. No changes were kept.":"Favourites could not be saved, and some stored slots may have changed. Close and reopen the editor before trying again."}finally{const t=this.$.editorError.textContent;this.$.save.textContent="Save",this._updateEditorState(),t&&(this.$.editorError.textContent=t)}}_notice(t,e=!1){clearTimeout(this._noticeTimer),this.$.notice.textContent=t,this.$.notice.classList.toggle("error",e),this._noticeTimer=setTimeout(()=>{this.$.notice.textContent="",this.$.notice.classList.remove("error")},3600)}}
registerCard({ type: "component-favourites-v3", element: ComponentFavouritesV3, name: "Favourites", description: "Registry-aware persistent household favourites with safe actions." });
}

// Module: src/components/welcome-header.js
{
/** ComponentWelcomeHeaderV1 — reusable Home Assistant dashboard card. */
const { escapeHtml, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentWelcomeHeaderV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:"auto"}}
  constructor(){super();this.attachShadow({mode:"open"});this.config=null;this._hass=null;this._timer=null;this._signature="";this._interaction=null}
  setConfig(config){
    this.config={weather_entity:"weather.forecast_home",...config};
    if(!this.config.weather_entity)throw new Error("weather_entity is required");
    this._signature="";this._render();
  }
  set hass(hass){this._hass=hass;this._render()}
  connectedCallback(){this._schedule();this._render()}
  disconnectedCallback(){clearTimeout(this._timer);this._timer=null;this._interaction?.destroy();this._interaction=null}
  getCardSize(){return 1}
  _schedule(){
    clearTimeout(this._timer);
    const delay=60000-Date.now()%60000+100;
    this._timer=setTimeout(()=>{this._signature="";this._render();this._schedule()},delay);
  }
  _escape(value){return escapeHtml(value)}
  _locale(){const locale=this._hass?.locale?.language||navigator.language||"en-AU";return locale==="en"?"en-AU":locale}
  _timeZone(){return this._hass?.config?.time_zone||undefined}
  _number(value,digits=0){
    const n=Number(value);if(!Number.isFinite(n))return null;
    return new Intl.NumberFormat(this._locale(),{maximumFractionDigits:digits,minimumFractionDigits:Number.isInteger(n)?0:Math.min(1,digits)}).format(n);
  }
  _openWeather(){
    openMoreInfo(this,this.config.weather_entity);
  }
  _render(){
    if(!this.config)return;
    const now=new Date(),state=this._hass?.states?.[this.config.weather_entity],attrs=state?.attributes||{},zone=this._timeZone();
    const temperature=this._number(attrs.temperature,1),cloud=this._number(attrs.cloud_coverage,0);
    const temperatureText=temperature===null?"—":temperature+(attrs.temperature_unit||"°C");
    const cloudText=cloud===null?"Cloud —":"Cloud "+cloud+"%";
    const time=new Intl.DateTimeFormat(this._locale(),{hour:"numeric",minute:"2-digit",timeZone:zone}).format(now);
    const signature=JSON.stringify([Math.floor(now.getTime()/60000),state?.state,attrs.temperature,attrs.temperature_unit,attrs.cloud_coverage,zone]);
    if(signature===this._signature)return;this._signature=signature;
    this._interaction?.destroy();this._interaction=null;
    this.shadowRoot.innerHTML="<style>:host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit}ha-card{border:0;box-shadow:none;background:transparent;color:var(--primary-text-color)}.row{min-height:44px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}.time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}.weather{appearance:none;border:0;min-height:44px;padding:0;background:transparent;color:var(--secondary-text-color);font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer;text-align:right}.weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}@media(max-width:520px){.row{gap:8px}.time{font-size:13px}.weather{font-size:12px}}@media(max-width:350px){.row{gap:6px}.time{font-size:12px}.weather{font-size:11px}}</style><ha-card><div class=\"row\"><span class=\"time\">"+this._escape(time)+"</span><button class=\"weather\" type=\"button\" aria-label=\"Outside "+this._escape(temperatureText)+", "+this._escape(cloudText)+". Open weather details.\">"+this._escape(temperatureText+" · "+cloudText)+"</button></div></ha-card>";
    this._interaction=interaction(this.shadowRoot.querySelector(".weather"),{primary:()=>this._openWeather(),feedback:true});
  }
}
registerCard({ type: "component-welcome-header-v1", element: ComponentWelcomeHeaderV1, name: "Welcome Header", description: "Compact live weather and home-time header." });
}

// Module: src/components/wled-controller.js
{
/** ComponentWledControllerV1 — reusable Home Assistant dashboard card. */
const {
  createRequestCoalescer,
  interaction,
  openMoreInfo,
  registerCard,
  waitForEntityState,
  WLED_HD,
  WLED_DOMAIN,
  WLED_INVALID,
  WLED_NAME,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentWledControllerV1 extends HTMLElement{
  static getGridOptions(){return{columns:12,rows:'auto'}}
  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this.c=null;this.h=null;this.d=null;this.b=null;this.unsub=null;this.loading=false;this.sheetSignature='';this._interactionHandles=[];this._brightnessCoalescer=null;this._brightnessIntent=null;
    this.shadowRoot.innerHTML=`<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button,select,input{font:inherit;color:inherit}
      ha-card{display:block;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}
      .head{min-height:58px;padding:8px 8px 7px 10px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}
      .ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:20px}.on .ico{color:var(--primary-color)}
      .identity{appearance:none;border:0;background:transparent;min-width:0;padding:0;text-align:left;cursor:pointer}.name,.status{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.status{margin-top:3px;font-size:12px;line-height:1.25;color:var(--secondary-text-color)}
      .power,.action,.close{appearance:none;border:1px solid var(--divider-color);background:transparent;border-radius:var(--dashboard-radius-control,8px);cursor:pointer}.power{width:44px;height:44px;display:grid;place-items:center;color:var(--secondary-text-color)}.power ha-icon{--mdc-icon-size:18px}.on .power{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 8%,transparent)}
      .body{padding:0 10px 10px;display:grid;gap:8px}.slider-row{display:grid;grid-template-columns:74px minmax(0,1fr) 38px;align-items:center;gap:8px}.label{font-size:11px;color:var(--secondary-text-color)}.value{font-size:11px;text-align:right;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
      input[type=range]{width:100%;min-width:0;accent-color:var(--primary-color)}
      .actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}.action{min-height:44px;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--secondary-text-color)}.action ha-icon{--mdc-icon-size:15px}.action:hover,.action:focus-visible{color:var(--primary-text-color);background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}
      dialog{width:min(620px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));padding:0;margin:auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}
      .sheet{display:flex;flex-direction:column;max-height:min(760px,calc(100dvh - 24px))}.sheet-head{min-height:54px;padding:5px 7px 5px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.sheet-head ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}.sheet-title{min-width:0;flex:1}.sheet-name{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sheet-state{margin-top:2px;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.close{width:44px;height:44px;display:grid;place-items:center;color:var(--secondary-text-color);border-color:transparent}.close ha-icon{--mdc-icon-size:18px}
      .sheet-body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom));display:grid;gap:16px}.section{display:grid;gap:8px}.section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--secondary-text-color)}.section-title:after{content:'';height:1px;background:var(--divider-color);flex:1}
      .preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.preset-btn{appearance:none;min-height:44px;padding:6px 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-text-color);text-align:left;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preset-btn:hover,.preset-btn:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.preset-btn.active{border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,transparent);color:var(--primary-color)}
      .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.field{display:grid;gap:4px;min-width:0}.field>span{font-size:11px;color:var(--secondary-text-color);padding-left:2px}select{width:100%;height:44px;min-width:0;padding:0 28px 0 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:var(--card-background-color);font-size:12px;outline:none}
      .fine{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fine-card{min-width:0;padding:8px 9px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px)}.fine-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px}.fine-head span,.fine-head output{font-size:11px;color:var(--secondary-text-color)}.fine-head output{font-variant-numeric:tabular-nums}
      .native{display:flex;justify-content:flex-end}
      :is(button,select,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled,select:disabled,input:disabled{opacity:.45;cursor:default}
      @media(max-width:520px){dialog{width:100vw;max-width:100vw;height:88dvh;max-height:88dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:var(--dashboard-radius-dialog,8px) var(--dashboard-radius-dialog,8px) 0 0}.sheet{height:88dvh;max-height:88dvh}.sheet-body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}.preset-grid{grid-template-columns:1fr}.fields,.fine{grid-template-columns:1fr}.body{padding-left:9px;padding-right:9px}.head{padding-left:8px}.slider-row{grid-template-columns:68px minmax(0,1fr) 36px}.actions{justify-content:stretch}.actions .action{flex:1;justify-content:center}}
    </style><ha-card><div class="head"><span class="ico"><ha-icon icon="mdi:led-strip-variant"></ha-icon></span><button class="identity" type="button"><span class="name">WLED</span><span class="status">Loading…</span></button><button class="power" type="button" aria-label="Toggle WLED"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="body"><div class="slider-row"><span class="label">Brightness</span><input class="brightness" type="range" min="0" max="255" step="1"><output class="brightness-value value">—</output></div><div class="actions"><button class="action presets" type="button"><ha-icon icon="mdi:bookmark-multiple-outline"></ha-icon><span>Presets</span></button><button class="action colour" type="button"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Colour</span></button><button class="action advanced" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Advanced</span></button></div></div></ha-card><dialog><div class="sheet"><div class="sheet-head"><ha-icon icon="mdi:led-strip-variant"></ha-icon><span class="sheet-title"><div class="sheet-name">WLED</div><div class="sheet-state"></div></span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="sheet-body"><section class="section presets-section"><div class="section-title">Presets</div><div class="preset-grid"></div></section><section class="section"><div class="section-title">Effect</div><div class="fields"><label class="field"><span>Effect</span><select class="effect"></select></label><label class="field"><span>Palette</span><select class="palette"></select></label></div></section><section class="section"><div class="section-title">Animation</div><div class="fine"><label class="fine-card"><span class="fine-head"><span>Speed</span><output class="speed-value">—</output></span><input class="speed" type="range" min="0" max="255" step="1"></label><label class="fine-card"><span class="fine-head"><span>Intensity</span><output class="intensity-value">—</output></span><input class="intensity" type="range" min="0" max="255" step="1"></label></div></section><div class="native"><button class="action native-colour" type="button"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Colour & white controls</span></button></div></div></div></dialog>`;
    this.head=this.shadowRoot.querySelector('.head');this.nameEl=this.shadowRoot.querySelector('.name');this.statusEl=this.shadowRoot.querySelector('.status');this.sheetName=this.shadowRoot.querySelector('.sheet-name');this.sheetState=this.shadowRoot.querySelector('.sheet-state');
    this.power=this.shadowRoot.querySelector('.power');this.identity=this.shadowRoot.querySelector('.identity');this.brightness=this.shadowRoot.querySelector('.brightness');this.brightnessValue=this.shadowRoot.querySelector('.brightness-value');this.presetsBtn=this.shadowRoot.querySelector('.presets');this.colour=this.shadowRoot.querySelector('.colour');this.advanced=this.shadowRoot.querySelector('.advanced');this.dialog=this.shadowRoot.querySelector('dialog');this.presetGrid=this.shadowRoot.querySelector('.preset-grid');this.presetsSection=this.shadowRoot.querySelector('.presets-section');this.effect=this.shadowRoot.querySelector('.effect');this.palette=this.shadowRoot.querySelector('.palette');this.speed=this.shadowRoot.querySelector('.speed');this.speedValue=this.shadowRoot.querySelector('.speed-value');this.intensity=this.shadowRoot.querySelector('.intensity');this.intensityValue=this.shadowRoot.querySelector('.intensity-value');this.nativeColour=this.shadowRoot.querySelector('.native-colour');
    this._interactionHandles.push(
      interaction(this.power,{primary:()=>this.togglePower(),optimistic:{capture:()=>this.head.classList.contains('on'),apply:()=>{const next=!this.head.classList.contains('on');this.head.classList.toggle('on',next);this.power.setAttribute('aria-pressed',String(next));this.statusEl.textContent=next?'Turning on…':'Turning off…'},rollback:previous=>{this.head.classList.toggle('on',previous);this.power.setAttribute('aria-pressed',String(previous));this.render()}},feedback:true}),
      interaction(this.identity,{primary:()=>this.openAdvanced(false),hold:()=>this.moreInfo(this.b?.main),feedback:true}),
      interaction(this.presetsBtn,{primary:()=>this.openAdvanced(true),feedback:true}),
      interaction(this.advanced,{primary:()=>this.openAdvanced(false),feedback:true}),
      interaction(this.colour,{primary:()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main),feedback:true}),
      interaction(this.nativeColour,{primary:()=>this.moreInfo(this.b?.effectLights?.[0]||this.b?.main),feedback:true}),
      interaction(this.shadowRoot.querySelector('.close'),{primary:()=>this.dialog.close(),feedback:true}),
    );
    this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.dialog.close()});
    this.brightness.oninput=()=>{const v=Number(this.brightness.value);this._brightnessIntent=v;this.brightnessValue.textContent=this.pct(v);this.brightnessCoalescer().request(v)};
    this.brightness.onchange=()=>{};
    this.effect.onchange=()=>this.effect.value&&this.call('light','turn_on',this.b?.effectLights||[],{effect:this.effect.value});
    this.palette.onchange=()=>this.palette.value&&this.call('select','select_option',this.b?.palettes||[],{option:this.palette.value});
    this.speed.oninput=()=>this.speedValue.textContent=this.speed.value;this.speed.onchange=()=>this.call('number','set_value',this.b?.speeds||[],{value:Number(this.speed.value)});
    this.intensity.oninput=()=>this.intensityValue.textContent=this.intensity.value;this.intensity.onchange=()=>this.call('number','set_value',this.b?.intensities||[],{value:Number(this.intensity.value)});
  }
  setConfig(c){if(!c?.entity)throw new Error('WLED controller requires entity');this.c={...c};this.d=null;this.b=null;this.load()}
  set hass(h){this.h=h;this.unsub||this.subscribe();if(this.d){this.b=this.bundle();this.render()}else this.load()}
  connectedCallback(){this.subscribe();this.load()}
  disconnectedCallback(){for(const handle of this._interactionHandles)handle.destroy();this._interactionHandles=[];this._brightnessCoalescer?.destroy();this._brightnessCoalescer=null;this._brightnessIntent=null;this.unsub?.();this.unsub=null}
  getCardSize(){return 2}
  subscribe(){if(this.unsub||!this.h||!WLED_HD.REG?.subscribe)return;this.unsub=WLED_HD.REG.subscribe(this.h,d=>{this.d=d;if(!this.c)return;this.b=this.bundle();this.render()})}
  async load(force=false){if(this.loading||!this.h||!this.c||!WLED_HD.REG?.load)return;this.loading=true;try{this.d=this.d||await WLED_HD.REG.load(this.h,force);this.b=this.bundle();this.render()}finally{this.loading=false}}
  bundle(){const all=this.d?.entities||[],entry=all.find(e=>e.entity_id===this.c.entity),deviceId=this.c.device_id||entry?.device_id,siblings=(deviceId?this.d?.byDevice?.get(deviceId):[])||[],rows=siblings.filter(e=>e?.platform==='wled'&&!e.disabled_by&&this.h.states[e.entity_id]),lightRows=rows.filter(e=>WLED_DOMAIN(e.entity_id)==='light'),main=lightRows.find(e=>e.entity_id===this.c.entity)||lightRows.find(e=>WLED_NAME(e)==='main')||lightRows[0],effectRows=lightRows.filter(e=>Array.isArray(this.h.states[e.entity_id]?.attributes?.effect_list)),selectRows=rows.filter(e=>WLED_DOMAIN(e.entity_id)==='select'),numberRows=rows.filter(e=>WLED_DOMAIN(e.entity_id)==='number'),match=(e,re)=>re.test(`${e.entity_id} ${e.original_name||''} ${e.name||''}`),preset=selectRows.find(e=>match(e,/\bpreset\b/i)),palettes=selectRows.filter(e=>match(e,/color.?palette|colour.?palette/i)),speeds=numberRows.filter(e=>match(e,/\bspeed\b/i)),intensities=numberRows.filter(e=>match(e,/\bintensity\b/i)),dev=this.d?.devices?.find(x=>x.id===deviceId),deviceName=dev?.name_by_user||dev?.name||this.h.states[main?.entity_id]?.attributes?.friendly_name||'WLED';return{deviceId,deviceName,main:main?.entity_id||this.c.entity,effectLights:effectRows.map(e=>e.entity_id),preset:preset?.entity_id||null,palettes:palettes.map(e=>e.entity_id),speeds:speeds.map(e=>e.entity_id),intensities:intensities.map(e=>e.entity_id)}}
  pct(v){const n=Number(v);return Number.isFinite(n)?`${Math.round(n/255*100)}%`:'—'}
  async togglePower(){const id=this.b?.main,state=id?this.h?.states?.[id]:null;if(!id||!state)return;const wasOn=state.state==='on';await this.h.callService('light','toggle',{entity_id:id});await waitForEntityState(()=>this.h,id,value=>value===(wasOn?'off':'on'),{timeout:9000})}
  brightnessCoalescer(){if(this._brightnessCoalescer)return this._brightnessCoalescer;this._brightnessCoalescer=createRequestCoalescer(async value=>{const id=this.b?.main;if(!id)return;if(value<=0)await this.h.callService('light','turn_off',{entity_id:id});else await this.h.callService('light','turn_on',{entity_id:id,brightness:value});await waitForEntityState(()=>this.h,id,(state,obj)=>value<=0?state==='off':state==='on'&&Math.abs(Number(obj?.attributes?.brightness??-999)-value)<=2,{timeout:7000})},{onSuccess:value=>{if(this._brightnessIntent===value)this._brightnessIntent=null;this.render()},onError:()=>{this._brightnessIntent=null;this.render()}});return this._brightnessCoalescer}
  same(ids,read){const vals=ids.map(id=>read(this.h.states[id])).filter(v=>v!==undefined&&v!==null&&!WLED_INVALID.has(String(v).toLowerCase()));if(!vals.length)return null;return vals.every(v=>String(v)===String(vals[0]))?vals[0]:'Mixed'}
  setOptions(el,options,current,emptyLabel){const opts=Array.isArray(options)?options:[],valid=current!=null&&current!=='Mixed'&&opts.includes(String(current));el.replaceChildren();if(!valid){const o=document.createElement('option');o.value='';o.textContent=current==='Mixed'?'Mixed':emptyLabel;o.selected=true;el.append(o)}for(const v of opts){const o=document.createElement('option');o.value=String(v);o.textContent=String(v);o.selected=valid&&String(v)===String(current);el.append(o)}el.disabled=!opts.length}
  renderPresets(options,current){this.presetGrid.replaceChildren();if(!options.length){const x=document.createElement('span');x.className='label';x.textContent='No presets configured';this.presetGrid.append(x);return}for(const value of options){const b=document.createElement('button');b.type='button';b.className=`preset-btn ${String(current)===String(value)?'active':''}`;b.textContent=String(value);b.title=String(value);b._interaction=interaction(b,{primary:async()=>{await this.call('select','select_option',this.b?.preset?[this.b.preset]:[],{option:value});this.dialog.close()},optimistic:'selection',feedback:true});this.presetGrid.append(b)}}
  render(){if(!this.h||!this.b)return;const main=this.h.states[this.b.main],on=main?.state==='on',reportedBrightness=on?Number(main?.attributes?.brightness??0):0,brightness=this._brightnessIntent??reportedBrightness,effect=this.same(this.b.effectLights,s=>s?.attributes?.effect),palette=this.same(this.b.palettes,s=>s?.state),speed=this.same(this.b.speeds,s=>s?.state),intensity=this.same(this.b.intensities,s=>s?.state),presetState=this.b.preset?this.h.states[this.b.preset]:null,presetOptions=presetState?.attributes?.options||[];this.head.classList.toggle('on',on);this.nameEl.textContent=this.b.deviceName;const status=on?[this.pct(brightness),effect&&effect!=='Mixed'?effect:null,palette&&palette!=='Mixed'?palette:null].filter(Boolean).join(' · '):'Off';this.statusEl.textContent=status;this.sheetName.textContent=this.b.deviceName;this.sheetState.textContent=status;this.brightness.disabled=!main;this.brightness.value=String(Math.max(0,Math.min(255,Number.isFinite(brightness)?brightness:0)));this.brightnessValue.textContent=this.pct(this.brightness.value);this.power.disabled=!main;this.power.setAttribute('aria-pressed',String(on));this.presetsBtn.disabled=!presetOptions.length;this.colour.disabled=!this.b.effectLights.length;this.nativeColour.disabled=!this.b.effectLights.length;if(!this.dialog.open){this.sheetSignature='';return}const fxState=this.b.effectLights.map(id=>this.h.states[id]).find(Boolean),fxOptions=fxState?.attributes?.effect_list||[],paletteState=this.b.palettes.map(id=>this.h.states[id]).find(Boolean),paletteOptions=paletteState?.attributes?.options||[],sheetSignature=JSON.stringify([this.b.main,this.b.preset,this.b.effectLights,this.b.palettes,this.b.speeds,this.b.intensities,main,presetState,fxState,paletteState,...this.b.speeds.map(id=>this.h.states[id]),...this.b.intensities.map(id=>this.h.states[id])]);if(sheetSignature===this.sheetSignature)return;this.sheetSignature=sheetSignature;this.renderPresets(presetOptions,presetState?.state);this.setOptions(this.effect,fxOptions,effect,'Choose effect');this.setOptions(this.palette,paletteOptions,palette,'Choose palette');this.setRange(this.speed,this.speedValue,this.b.speeds,speed);this.setRange(this.intensity,this.intensityValue,this.b.intensities,intensity)}
  setRange(input,output,ids,value){const s=ids.map(id=>this.h.states[id]).find(Boolean),a=s?.attributes||{};input.min=String(a.min??0);input.max=String(a.max??255);input.step=String(a.step??1);const n=value==='Mixed'?Number(s?.state):Number(value);input.value=String(Number.isFinite(n)?n:Number(input.min));input.disabled=!ids.length;output.textContent=value==='Mixed'?'Mixed':ids.length?String(Math.round(Number(input.value))):'—'}
  openAdvanced(presets=false){if(!this.dialog||!this.b)return;if(!this.dialog.open){this.dialog.showModal();this.render()}queueMicrotask(()=>{if(presets)this.presetsSection?.scrollIntoView({block:'start'});else this.shadowRoot.querySelector('.close')?.focus()})}
  async call(domain,service,ids,data={}){const targets=[...new Set((ids||[]).filter(Boolean))];if(!this.h||!targets.length)return;await Promise.all(targets.map(entity_id=>this.h.callService(domain,service,{entity_id,...data}))) }
  moreInfo(entityId){openMoreInfo(this,entityId)}
}
registerCard({ type: "component-wled-controller-v1", element: ComponentWledControllerV1, name: "WLED Controller V1", description: "Minimal WLED control with advanced settings sheet." });
}

// Module: src/components/garage-door-controller.js
{
/** ComponentGarageDoorControllerV1 — momentary garage-door operator card. */
const { interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentGarageDoorControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.signature = "";
    this.busy = false;
    this.pendingLabel = "";
    this.message = "";
    this.messageType = "info";
    this.messageTimer = null;
    this.confirmation = null;
    this.interactions = [];
    this.requestGeneration = 0;
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("A garage-door state entity is required");
    if (!config?.control_entity) throw new Error("A garage-door control entity is required");
    clearTimeout(this.messageTimer);
    this.messageTimer = null;
    this.requestGeneration += 1;
    this.cancelConfirmation(new Error("Garage configuration changed"));
    this.busy = false;
    this.pendingLabel = "";
    this.message = "";
    this.messageType = "info";
    const configuredTimeout = config.confirmation_timeout ?? config.confirm_timeout;
    this.config = {
      ...config,
      confirmation_timeout: Math.max(3000, Number(configuredTimeout) || 20000),
    };
    this.signature = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    this.checkConfirmation();
    const signature = this.stateSignature();
    if (signature !== this.signature) {
      this.signature = signature;
      this.render();
    }
  }

  connectedCallback() {
    if (!this.config) return;
    // Lovelace may retain the element while disconnecting it. Recreate the
    // fixed button bindings instead of showing a visually intact dead card.
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this.built = false;
    this.build();
    this.signature = "";
    this.render();
  }

  disconnectedCallback() {
    clearTimeout(this.messageTimer);
    this.messageTimer = null;
    this.requestGeneration += 1;
    this.cancelConfirmation(new Error("Garage controller disconnected"));
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this.busy = false;
    this.pendingLabel = "";
    this.message = "";
    this.messageType = "info";
  }

  build() {
    this.built = true;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{appearance:none;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px;border-left:2px solid transparent}.w:has(.well.not-closed){border-left-color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)));background:var(--dashboard-warning-surface,var(--card-background-color))}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.identity{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.well{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.well.not-closed{color:var(--warning-color,var(--state-cover-open-color,var(--primary-color)))}ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:650}.state{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color)}.action{min-width:104px;height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--primary-color);font-size:13px;font-weight:650}.action.pending{color:var(--secondary-text-color)}button[disabled],button[aria-disabled=true]{opacity:.5;cursor:default}.feedback{min-height:0;margin:0;font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.feedback:not(:empty){margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color)}.feedback.error{color:var(--error-color)}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:340px){.row{grid-template-columns:1fr}.action{width:100%}}
    </style><ha-card><div class="w"><div class="row"><button class="identity" type="button"><span class="well"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="state" role="status" aria-live="polite"></span></span></button><button class="action" type="button"><ha-icon></ha-icon><span></span></button></div><p class="feedback" role="status" aria-live="polite"></p></div></ha-card>`;
    this.elements = {
      identity: this.shadowRoot.querySelector(".identity"),
      well: this.shadowRoot.querySelector(".well"),
      doorIcon: this.shadowRoot.querySelector(".well ha-icon"),
      name: this.shadowRoot.querySelector(".name"),
      state: this.shadowRoot.querySelector(".state"),
      action: this.shadowRoot.querySelector(".action"),
      actionIcon: this.shadowRoot.querySelector(".action ha-icon"),
      actionLabel: this.shadowRoot.querySelector(".action span"),
      feedback: this.shadowRoot.querySelector(".feedback"),
    };
    this.interactions.push(
      interaction(this.elements.identity, { primary: () => this.openDetails(), optimistic: false, repeat: false, feedback: true }),
      interaction(this.elements.action, { primary: () => this.requestAction(), optimistic: false, repeat: false, feedback: true }),
    );
  }

  entityState(entityId) { return entityId ? this._hass?.states?.[entityId] ?? null : null; }

  stateSignature() {
    return JSON.stringify(
      [this.config.entity, this.config.control_entity, this.config.availability_entity]
        .filter(Boolean)
        .map((entityId) => {
          const state = this.entityState(entityId);
          return [entityId, state?.state, state?.attributes];
        }),
    );
  }

  status() {
    const state = this.entityState(this.config.entity);
    const control = this.entityState(this.config.control_entity);
    const availability = this.entityState(this.config.availability_entity);
    const controllerUnavailable =
      (this.config.availability_entity && (!availability || availability.state !== "on")) ||
      !control || String(control.state).toLowerCase() === "unavailable";
    const reed = String(state?.state || "unknown").toLowerCase();
    const known = reed === "on" || reed === "off";
    const closed = known && reed === "off";
    const notClosed = known && reed === "on";
    const stateUnavailable = !state || reed === "unavailable";
    return { state, control, controllerUnavailable, stateUnavailable, known, closed, notClosed, reed };
  }

  render() {
    const status = this.status();
    const name = this.config.title || status.state?.attributes?.friendly_name?.replace(/ Garage Door Status$/, "") || "Garage door";
    const displayState = status.controllerUnavailable ? "Controller unavailable" : status.closed ? "Closed" : status.notClosed ? "Not closed" : status.stateUnavailable ? "Door state unavailable" : "Door state unknown";
    const action = status.closed ? "Open" : "Trigger";
    const disabled = status.controllerUnavailable || this.busy;
    this.elements.name.textContent = name;
    this.elements.identity.setAttribute("aria-label", `Open details for ${name}`);
    this.elements.well.classList.toggle("not-closed", status.notClosed);
    this.elements.doorIcon.setAttribute("icon", status.controllerUnavailable || !status.known ? "mdi:garage-alert" : status.notClosed ? "mdi:garage-open" : "mdi:garage");
    this.elements.state.textContent = displayState;
    this.elements.action.disabled = disabled;
    this.elements.action.setAttribute("aria-disabled", String(disabled));
    this.elements.action.classList.toggle("pending", this.busy);
    this.elements.actionIcon.setAttribute("icon", this.busy ? "mdi:progress-clock" : status.closed ? "mdi:garage-open" : "mdi:gesture-tap-button");
    this.elements.actionLabel.textContent = this.busy ? this.pendingLabel || "Waiting" : action;
    this.elements.action.setAttribute("aria-label", status.controllerUnavailable ? "Garage door controller unavailable" : this.busy ? `${this.pendingLabel || "Waiting for"} garage door state confirmation` : status.closed ? "Open garage door" : "Trigger garage door operator");
    this.elements.feedback.textContent = this.message;
    this.elements.feedback.classList.toggle("error", this.messageType === "error");
  }

  setMessage(message, type = "info", timeout = 2600) {
    clearTimeout(this.messageTimer);
    this.message = message;
    this.messageType = type;
    this.render();
    if (!timeout) return;
    this.messageTimer = setTimeout(() => {
      this.messageTimer = null;
      this.message = "";
      this.messageType = "info";
      if (this.isConnected) this.render();
    }, timeout);
  }

  waitForConfirmation(expected) {
    this.cancelConfirmation(new Error("Garage confirmation superseded"));
    const timeout = this.config.confirmation_timeout;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.confirmation?.timer !== timer) return;
        this.confirmation = null;
        reject(new Error("Garage state confirmation timed out"));
      }, timeout);
      this.confirmation = { expected, resolve, reject, timer };
      this.checkConfirmation();
    });
  }

  checkConfirmation() {
    const pending = this.confirmation;
    if (!pending) return;
    const reed = String(this.entityState(this.config.entity)?.state || "unknown").toLowerCase();
    const confirmed = pending.expected ? reed === pending.expected : reed === "on" || reed === "off";
    if (!confirmed) return;
    clearTimeout(pending.timer);
    this.confirmation = null;
    pending.resolve(reed);
  }

  cancelConfirmation(error) {
    const pending = this.confirmation;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.confirmation = null;
    pending.reject(error);
  }

  async requestAction() {
    const status = this.status();
    if (status.controllerUnavailable || this.busy) return;
    const expected = status.closed ? "on" : status.notClosed ? "off" : null;
    const generation = this.requestGeneration;
    this.busy = true;
    this.pendingLabel = "Sending";
    this.message = "";
    this.messageType = "info";
    this.render();

    let confirmation;
    try {
      confirmation = this.waitForConfirmation(expected);
      void confirmation.catch(() => {});
      await this._hass.callService("button", "press", { entity_id: this.config.control_entity });
      if (generation !== this.requestGeneration) return;
      this.pendingLabel = expected === "on" ? "Opening" : expected === "off" ? "Closing" : "Waiting";
      this.render();
      const confirmed = await confirmation;
      if (generation !== this.requestGeneration) return;
      this.setMessage(confirmed === "off" ? "Closed confirmed." : confirmed === "on" ? "Door movement confirmed." : "Garage state confirmed.");
    } catch (error) {
      if (generation !== this.requestGeneration) return;
      this.cancelConfirmation(error instanceof Error ? error : new Error("Garage command failed"));
      const message = String(error?.message || "");
      if (this.isConnected) this.setMessage(message.includes("timed out") ? "The command was sent, but the door state was not confirmed." : "The garage-door command failed.", "error", 5000);
    } finally {
      if (generation === this.requestGeneration) {
        this.busy = false;
        this.pendingLabel = "";
        if (this.isConnected) this.render();
      }
    }
  }

  openDetails() { openMoreInfo(this, this.config.entity); }
  getCardSize() { return 1; }
}

registerCard({ type: "component-garage-door-controller-v1", element: ComponentGarageDoorControllerV1, name: "Garage Door Controller", description: "A garage-door controller for a closed-position reed sensor and momentary operator trigger." });
}

// Module: src/components/camera-controller.js
{
/** ComponentCameraControllerV1 — device-aware ONVIF camera controller. */
const { interaction, openMoreInfo, registerCard, waitForEntityState } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const CAM_HD = globalThis.__homeDashboardV2;
const CAM_DOM = (id) => String(id || "").split(".")[0];
const CAM_NAME = (entity) => String(entity?.name || entity?.original_name || entity?.entity_id || "");
const CAM_BAD = new Set(["unknown", "unavailable"]);

class ComponentCameraControllerV1 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.config = null;
    this._hass = null;
    this.data = null;
    this.bundleData = null;
    this.unsubscribe = null;
    this.loading = false;
    this.confirmId = null;
    this.confirmTimer = null;
    this.controlsSignature = "";
    this.interactionHandles = [];
    this.controlInteractions = [];
    this.optimisticSwitches = new Map();
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}
      ha-card{display:block;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color);overflow:hidden}
      .row{min-height:62px;padding:8px 9px 8px 10px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:20px}.activity .ico{color:var(--primary-color)}.offline .ico{color:var(--disabled-text-color,var(--secondary-text-color))}
      .identity{appearance:none;border:0;background:transparent;padding:0;min-width:0;text-align:left;cursor:pointer}.name,.state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:500;line-height:1.25}.state{margin-top:3px;font-size:12px;color:var(--secondary-text-color);line-height:1.25}
      .actions{display:flex;gap:6px}.action,.close,.switchbtn,.maint{appearance:none;border:1px solid var(--divider-color);background:transparent;border-radius:var(--dashboard-radius-control,8px);cursor:pointer}.action{min-height:44px;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--secondary-text-color)}.action ha-icon{--mdc-icon-size:16px}.action:hover,.action:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}button:disabled{opacity:.4;cursor:default}
      dialog{width:min(560px,calc(100vw - 24px));max-height:min(720px,calc(100dvh - 24px));padding:0;margin:auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}
      .sheet{display:flex;flex-direction:column;max-height:min(720px,calc(100dvh - 24px))}.head{min-height:54px;padding:5px 7px 5px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--divider-color)}.head>ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}.title{min-width:0;flex:1}.sheet-name,.sheet-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sheet-name{font-size:14px;font-weight:500}.sheet-state{margin-top:2px;font-size:11.5px;color:var(--secondary-text-color)}.close{width:44px;height:44px;border-color:transparent;display:grid;place-items:center;color:var(--secondary-text-color)}.close ha-icon{--mdc-icon-size:18px}
      .body{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom));display:grid;gap:16px}.section{display:grid;gap:7px}.section[hidden]{display:none}.section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--secondary-text-color)}.section-title:after{content:'';height:1px;background:var(--divider-color);flex:1}
      .control,.detect,.maintenance{min-height:46px;padding:5px 6px 5px 10px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.copy{min-width:0}.ctl-name,.ctl-state{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ctl-name{font-size:12.5px}.ctl-state{margin-top:2px;font-size:11px;color:var(--secondary-text-color)}.detect.on{border-color:color-mix(in srgb,var(--primary-color) 42%,var(--divider-color))}.detect .dot{width:8px;height:8px;border-radius:50%;background:var(--divider-color)}.detect.on .dot{background:var(--primary-color)}
      .switchbtn{min-width:58px;height:44px;padding:0 9px;font-size:11px;color:var(--secondary-text-color)}.switchbtn.on{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 7%,transparent)}.maint{grid-template-columns:minmax(0,1fr) auto}.maint button{min-width:78px;height:44px;padding:0 9px}.maint button.confirm{border-color:var(--warning-color,var(--primary-color));color:var(--warning-color,var(--primary-color))}
      :is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      @media(max-width:520px){.row{grid-template-columns:34px minmax(0,1fr) auto;padding-left:8px}.actions .action span{display:none}.action{width:44px;padding:0;justify-content:center}dialog{width:100vw;max-width:100vw;height:88dvh;max-height:88dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:8px 8px 0 0}.sheet{height:88dvh;max-height:88dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}}
    </style><ha-card><div class="row"><span class="ico"><ha-icon icon="mdi:cctv"></ha-icon></span><button class="identity" type="button"><span class="name">Camera</span><span class="state">Loading…</span></button><span class="actions"><button class="action view" type="button"><ha-icon icon="mdi:eye-outline"></ha-icon><span>View</span></button><button class="action controls" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Controls</span></button></span></div></ha-card><dialog><div class="sheet"><div class="head"><ha-icon icon="mdi:cctv"></ha-icon><span class="title"><span class="sheet-name"></span><span class="sheet-state"></span></span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"><section class="section detections"><div class="section-title">Detection</div><div class="detection-list"></div></section><section class="section device-controls"><div class="section-title">Camera controls</div><div class="control-list"></div></section><section class="section maintenance-section"><div class="section-title">Maintenance</div><div class="maintenance-list"></div></section></div></div></dialog>`;
    this.row = this.shadowRoot.querySelector(".row");
    this.nameEl = this.shadowRoot.querySelector(".name");
    this.stateEl = this.shadowRoot.querySelector(".state");
    this.sheetName = this.shadowRoot.querySelector(".sheet-name");
    this.sheetState = this.shadowRoot.querySelector(".sheet-state");
    this.view = this.shadowRoot.querySelector(".view");
    this.controls = this.shadowRoot.querySelector(".controls");
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.identity = this.shadowRoot.querySelector(".identity");
    this.bindInteractions();
    this.dialog.onclick = (event) => { if (event.target === this.dialog) this.dialog.close(); };
  }

  bindInteractions() {
    if (this.interactionHandles.length) return;
    this.interactionHandles.push(
      interaction(this.view, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.identity, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.controls, { primary: () => this.openControls(), feedback: true }),
      interaction(this.shadowRoot.querySelector(".close"), { primary: () => this.dialog.close(), feedback: true }),
    );
  }

  setConfig(config) { if (!config?.entity) throw new Error("Camera controller requires entity"); this.config = { ...config }; this.data = null; this.bundleData = null; this.controlsSignature = ""; this.load(); }
  set hass(hass) {
    this._hass = hass;
    this.unsubscribe || this.subscribe();
    if (this.data) {
      this.bundleData = this.bundle();
      this.render();
    } else {
      this.load();
    }
  }
  connectedCallback() { this.bindInteractions(); this.subscribe(); this.load(); }
  disconnectedCallback() { for (const handle of this.interactionHandles) handle.destroy(); this.interactionHandles = []; for (const handle of this.controlInteractions) handle.destroy(); this.controlInteractions = []; this.optimisticSwitches.clear(); this.unsubscribe?.(); this.unsubscribe = null; clearTimeout(this.confirmTimer); }
  getCardSize() { return 1; }
  subscribe() {
    if (this.unsubscribe || !this._hass || !CAM_HD?.REG?.subscribe) return;
    this.unsubscribe = CAM_HD.REG.subscribe(this._hass, (data) => {
      this.data = data;
      if (!this.config) return;
      this.bundleData = this.bundle();
      this.render();
    });
  }
  async load(force = false) { if (this.loading || !this._hass || !this.config || !CAM_HD?.REG?.load) return; this.loading = true; try { this.data = this.data || await CAM_HD.REG.load(this._hass, force); this.bundleData = this.bundle(); this.render(); } finally { this.loading = false; } }
  good(id) { const state = id ? this._hass?.states?.[id] : null; return Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())); }

  bundle() {
    const all = this.data?.entities || [];
    const entry = all.find((entity) => entity.entity_id === this.config.entity);
    const deviceId = this.config.device_id || entry?.device_id;
    const siblings = (deviceId ? this.data?.byDevice?.get(deviceId) : []) || [];
    const enabled = siblings.filter((entity) => !entity.disabled_by && this._hass.states[entity.entity_id]);
    const cameras = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "camera");
    const main = cameras.find((entity) => /main.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) || cameras[0];
    const sub = cameras.find((entity) => /sub.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) || null;
    const switches = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "switch");
    const detections = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "binary_sensor" && (/^(motion|occupancy|presence|sound)$/.test(this._hass.states[entity.entity_id]?.attributes?.device_class || "") || /motion|human|person|detect/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)));
    const buttons = enabled.filter((entity) => CAM_DOM(entity.entity_id) === "button");
    const device = this.data?.devices?.find((item) => item.id === deviceId) || {};
    const areaId = CAM_HD.areaOf(main || entry, this.data);
    const area = this.data?.areaMap?.get(areaId)?.name || "";
    const custom = String(device.name_by_user || "").trim();
    const model = String(device.model || device.name || "Camera").trim();
    const generic = !custom || /^H80$|^camera$/i.test(custom);
    const owners = all.filter((entity) => entity.platform === "onvif" && CAM_DOM(entity.entity_id) === "camera" && /main.?stream/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`) && CAM_HD.areaOf(entity, this.data) === areaId).sort((a, b) => String(a.unique_id || a.entity_id).localeCompare(String(b.unique_id || b.entity_id)));
    const index = Math.max(0, owners.findIndex((entity) => entity.device_id === deviceId));
    const name = !generic ? custom : area ? owners.length > 1 ? `${area} · Camera ${index + 1}` : area : owners.length > 1 ? `${model} · Camera ${index + 1}` : model;
    return { deviceId, name, model, main: main?.entity_id || this.config.entity, sub: sub?.entity_id || null, switches, detections, buttons };
  }

  status() {
    if (!this.bundleData) return { online: false, active: false, text: "Unavailable" };
    const online = this.good(this.bundleData.main) || this.good(this.bundleData.sub);
    const activeRows = this.bundleData.detections.filter((entity) => this._hass.states[entity.entity_id]?.state === "on");
    const active = activeRows.length > 0;
    const text = activeRows.find((entity) => /human|person/i.test(`${entity.entity_id} ${CAM_NAME(entity)}`)) ? "Person detected" : active ? "Motion detected" : online ? "Online" : "Unavailable";
    return { online, active, text };
  }
  clean(entity) { return CAM_NAME(entity).replace(/^H80\s*/i, "").replace(/^(Main|Sub)Stream$/i, "Camera").trim() || "Control"; }

  render() {
    if (!this._hass || !this.bundleData) return;
    const status = this.status();
    this.nameEl.textContent = this.bundleData.name;
    this.stateEl.textContent = status.text;
    this.sheetName.textContent = this.bundleData.name;
    this.sheetState.textContent = status.text;
    this.row.classList.toggle("activity", status.active);
    this.row.classList.toggle("offline", !status.online);
    this.view.disabled = !status.online;
    const hasControls = this.bundleData.switches.length || this.bundleData.detections.length || this.bundleData.buttons.length;
    this.controls.hidden = !hasControls;
    // The sheet is populated when opened. Rebuilding it while hidden creates
    // controls and listeners for every Home Assistant state update.
    if (this.dialog.open) this.renderControls();
    else this.controlsSignature = "";
    if (this.dialog.open && !hasControls) this.dialog.close();
  }

  renderControls() {
    if (!this.bundleData) {
      for (const handle of this.controlInteractions) handle.destroy();
      this.controlInteractions = [];
      this.controlsSignature = "";
      return;
    }
    const signature = JSON.stringify([
      this.confirmId,
      [...this.optimisticSwitches],
      ...this.bundleData.detections.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
      ...this.bundleData.switches.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
      ...this.bundleData.buttons.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
    ]);
    if (signature === this.controlsSignature) return;
    for (const handle of this.controlInteractions) handle.destroy();
    this.controlInteractions = [];
    this.controlsSignature = signature;
    const detections = this.shadowRoot.querySelector(".detection-list");
    const controls = this.shadowRoot.querySelector(".control-list");
    const maintenance = this.shadowRoot.querySelector(".maintenance-list");
    detections.replaceChildren(); controls.replaceChildren(); maintenance.replaceChildren();
    for (const entity of this.bundleData.detections) {
      const state = this._hass.states[entity.entity_id], on = state?.state === "on", row = document.createElement("div");
      row.className = `detect ${on ? "on" : ""}`;
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><span class="dot"></span>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = !state || state.state === "unavailable" ? "Unavailable" : on ? "Detected" : "Clear";
      detections.append(row);
    }
    for (const entity of this.bundleData.switches) {
      const state = this._hass.states[entity.entity_id], reportedOn = state?.state === "on", on = this.optimisticSwitches.has(entity.entity_id) ? this.optimisticSwitches.get(entity.entity_id) : reportedOn, usable = Boolean(state && !CAM_BAD.has(String(state.state).toLowerCase())), row = document.createElement("div");
      row.className = "control";
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><button class="switchbtn" type="button"></button>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = usable ? on ? "On" : "Off" : "Unavailable";
      const button = row.querySelector("button");
      button.textContent = on ? "On" : "Off"; button.classList.toggle("on", on); button.disabled = !usable; button.setAttribute("aria-pressed", String(on)); button.setAttribute("aria-label", `${on ? "Turn off" : "Turn on"} ${this.clean(entity)}`);
      this.controlInteractions.push(interaction(button, {
        primary: () => this.toggleSwitch(entity.entity_id, reportedOn),
        hold: () => openMoreInfo(this, entity.entity_id),
        optimistic: {
          capture: () => reportedOn,
          apply: () => { const next = !reportedOn; this.optimisticSwitches.set(entity.entity_id, next); button.textContent = next ? "On" : "Off"; button.classList.toggle("on", next); button.setAttribute("aria-pressed", String(next)); row.querySelector(".ctl-state").textContent = next ? "On" : "Off"; },
          rollback: () => { this.optimisticSwitches.delete(entity.entity_id); this.controlsSignature = ""; if (this.dialog.open) this.renderControls(); },
        },
        singleFlight: true,
        feedback: true,
      }));
      controls.append(row);
    }
    for (const entity of this.bundleData.buttons) {
      const state = this._hass.states[entity.entity_id], usable = Boolean(state && String(state.state).toLowerCase() !== "unavailable"), row = document.createElement("div");
      row.className = "maintenance";
      row.innerHTML = '<span class="copy"><span class="ctl-name"></span><span class="ctl-state"></span></span><button class="maint" type="button">Run</button>';
      row.querySelector(".ctl-name").textContent = this.clean(entity);
      row.querySelector(".ctl-state").textContent = usable ? "Available" : "Unavailable";
      const button = row.querySelector("button");
      button.disabled = !usable; button.classList.toggle("confirm", this.confirmId === entity.entity_id); button.textContent = this.confirmId === entity.entity_id ? "Confirm" : "Run";
      this.controlInteractions.push(interaction(button, { primary: () => this.press(entity.entity_id), optimistic: false, repeat: false, singleFlight: true, feedback: true }));
      maintenance.append(row);
    }
    this.shadowRoot.querySelector(".detections").hidden = !this.bundleData.detections.length;
    this.shadowRoot.querySelector(".device-controls").hidden = !this.bundleData.switches.length;
    this.shadowRoot.querySelector(".maintenance-section").hidden = !this.bundleData.buttons.length;
  }

  openControls() { if (!this.dialog || !this.bundleData) return; this.confirmId = null; this.renderControls(); if (!this.dialog.open) this.dialog.showModal(); queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus()); }
  async openCamera() {
    const hass = this._hass, bundle = this.bundleData;
    if (!hass || !bundle) return;
    const preference = await CAM_HD.prefs?.(hass, "security-dashboard.camera.viewer.v1").catch?.(() => null);
    if (hass !== this._hass || bundle !== this.bundleData) return;
    const hd = Boolean(preference?.hd);
    const entityId = hd && this.good(bundle.main) ? bundle.main : this.good(bundle.sub) ? bundle.sub : this.good(bundle.main) ? bundle.main : null;
    if (entityId) openMoreInfo(this, entityId);
  }
  async toggleSwitch(entityId, wasOn) {
    await this._hass.callService("switch", "toggle", { entity_id: entityId });
    await waitForEntityState(() => this._hass, entityId, (value) => value === (wasOn ? "off" : "on"), { timeout: 9000 });
    this.optimisticSwitches.delete(entityId);
    this.controlsSignature = "";
    if (this.dialog.open) this.renderControls();
  }

  press(entityId) { if (this.confirmId !== entityId) { this.confirmId = entityId; clearTimeout(this.confirmTimer); this.confirmTimer = setTimeout(() => { this.confirmId = null; if (this.dialog.open) this.renderControls(); }, 5000); this.renderControls(); return; } clearTimeout(this.confirmTimer); this.confirmId = null; const request = this._hass.callService("button", "press", { entity_id: entityId }); this.renderControls(); return request; }
}

registerCard({ type: "component-camera-controller-v1", element: ComponentCameraControllerV1, name: "Camera Controller V1", description: "One device-aware controller for each physical ONVIF camera." });
}

// Module: src/components/camera-controller-v2.js
{
/** ComponentCameraControllerV2 — platform-adapted camera controls. */
const {
  createDialogController,
  interaction,
  loadSecurityModel,
  openMoreInfo,
  registerCard,
  waitForEntityState,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentCameraControllerV2 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.sequence = 0;
    this.fixedInteractions = [];
    this.controlInteractions = [];
    this.confirmId = null;
    this.confirmTimer = null;
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.build();
  }
  setConfig(config) {
    this.config = { profile: "household-security", expanded: false, ...(config || {}) };
    this.render();
    this.refresh();
  }
  set hass(hass) { this._hass = hass; this.refresh(); }
  connectedCallback() { window.addEventListener("ha-component-profile-change", this.profileListener); this.bindFixed(); this.refresh(); }
  disconnectedCallback() {
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    for (const handle of [...this.fixedInteractions, ...this.controlInteractions]) handle.destroy();
    this.fixedInteractions = [];
    this.controlInteractions = [];
    clearTimeout(this.confirmTimer);
    if (this.dialog.open) this.dialog.close();
  }
  getCardSize() { return this.config?.expanded ? 5 : 1; }

  build() {
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}button{font:inherit;color:inherit}
      ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.row{min-height:62px;padding:8px 9px 8px 12px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:9px}.icon{width:36px;height:36px;display:grid;place-items:center;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:21px}.identity{appearance:none;border:0;background:transparent;min-width:0;min-height:44px;padding:4px 0;text-align:left;cursor:pointer}.name,.state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name{font-size:13px;font-weight:650}.state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.actions{display:flex;gap:4px}.action,.close{appearance:none;min-width:44px;height:44px;padding:0 10px;border:0;border-radius:10px;background:transparent;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;color:var(--secondary-text-color)}.action:hover,.close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.action ha-icon,.close ha-icon{--mdc-icon-size:19px}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{cursor:default;opacity:.45}
      dialog{width:min(560px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:0;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,16px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.24));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.32));backdrop-filter:blur(3px)}.sheet{display:flex;flex-direction:column;max-height:calc(100dvh - 24px)}.head{min-height:56px;padding:6px 7px 6px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--divider-color)}.sheet-title{min-width:0;flex:1;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.body,.inline{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}.inline{border-top:1px solid var(--divider-color)}.inline[hidden]{display:none}.groups{display:grid;gap:16px}.group{display:grid;gap:7px}.group[hidden]{display:none}.group-list{display:grid;gap:6px}.group-title{display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:13px;font-weight:600}.group-title:after{content:'';height:1px;background:var(--divider-color);flex:1}.control{min-height:52px;padding:5px 5px 5px 10px;border:1px solid var(--divider-color);border-radius:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.copy{min-width:0}.control-name,.control-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.control-name{font-size:13px;font-weight:600}.control-state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.control button{appearance:none;width:96px;min-height:44px;padding:0 10px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer}.control button.on{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,transparent)}.control button.confirm{color:var(--warning-color,var(--error-color));border-color:currentColor}.detection.on{border-color:color-mix(in srgb,var(--primary-color) 40%,var(--divider-color))}.feedback{min-height:18px;margin-top:8px;color:var(--secondary-text-color);font-size:13px}.feedback.error{color:var(--error-color)}
      @media(max-width:520px){.action span{display:none}.action{padding:0}dialog{width:100vw;max-width:100vw;max-height:90dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.sheet{max-height:90dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}}
    </style><ha-card><div class="row"><span class="icon"><ha-icon icon="mdi:cctv"></ha-icon></span><button class="identity" type="button"><span class="name">Camera</span><span class="state">Loading…</span></button><span class="actions"><button class="action view" type="button"><ha-icon icon="mdi:eye-outline"></ha-icon><span>View</span></button><button class="action open-controls" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Controls</span></button></span></div><div class="inline" hidden></div></ha-card><dialog><div class="sheet"><div class="head"><span class="sheet-title">Camera controls</span><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"></div></div></dialog>`;
    this.elements = { name: this.shadowRoot.querySelector(".name"), state: this.shadowRoot.querySelector(".state"), identity: this.shadowRoot.querySelector(".identity"), view: this.shadowRoot.querySelector(".view"), open: this.shadowRoot.querySelector(".open-controls"), inline: this.shadowRoot.querySelector(".inline"), body: this.shadowRoot.querySelector(".body"), sheetTitle: this.shadowRoot.querySelector(".sheet-title") };
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.dialogController = createDialogController(this, this.dialog, { initialFocus: () => this.shadowRoot.querySelector(".close") });
    this.bindFixed();
  }
  bindFixed() {
    if (this.fixedInteractions.length) return;
    this.fixedInteractions.push(
      interaction(this.elements.identity, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.elements.view, { primary: () => this.openCamera(), feedback: true }),
      interaction(this.elements.open, { primary: (event) => this.openControls(event.currentTarget), feedback: true }),
      interaction(this.shadowRoot.querySelector(".close"), { primary: () => this.dialogController.close(), feedback: true }),
    );
  }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence !== this.sequence) return;
      this.model = model;
      this.camera = model.cameras.find((camera) => camera.entityId === this.config.entity || camera.deviceId === this.config.device_id) || model.cameras[0] || null;
      this.render();
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error }; this.camera = null; this.render(); }
    }
  }
  render() {
    if (!this.config) return;
    const camera = this.camera, error = this.model?.error || this.model?.profileError;
    this.elements.name.textContent = camera?.name || this.config.title || "Camera";
    this.elements.state.textContent = this.model?.profileMissing
      ? `Configure ${this.config.profile}`
      : error ? "Controls unavailable" : camera?.active ? "Activity detected" : camera?.online ? "Online" : "Unavailable";
    this.elements.identity.disabled = !camera?.online;
    this.elements.view.disabled = !camera?.online;
    const hasControls = Boolean(camera && (camera.switches.length || camera.detections.length || camera.actions.length || camera.ptz.length));
    this.elements.open.hidden = this.config.expanded || !hasControls;
    this.elements.inline.hidden = !this.config.expanded;
    this.elements.sheetTitle.textContent = `${camera?.name || "Camera"} controls`;
    if (this.config.expanded || this.dialog.open) this.renderControls();
  }
  openCamera() {
    if (!this.camera?.online) return;
    this.dispatchEvent(new CustomEvent("security-camera-view-request", {
      bubbles: true,
      composed: true,
      detail: { camera: this.camera, trigger: this.elements.view },
    }));
  }
  openControls(trigger) {
    if (!this.camera) return;
    this.renderControls();
    this.dialogController.open(trigger);
  }
  renderControls() {
    const host = this.config.expanded ? this.elements.inline : this.elements.body;
    const camera = this.camera;
    for (const handle of this.controlInteractions) handle.destroy();
    this.controlInteractions = [];
    host.replaceChildren();
    if (!camera) { host.textContent = "Camera controls are unavailable"; return; }
    const groups = document.createElement("div"); groups.className = "groups";
    const group = (title) => { const section = document.createElement("section"); section.className = "group"; section.innerHTML = '<div class="group-title"></div><div class="group-list"></div>'; section.querySelector(".group-title").textContent = title; groups.append(section); return section.querySelector(".group-list"); };
    if (camera.detections.length) {
      const list = group("Detection status");
      for (const entity of camera.detections) {
        const state = this._hass.states[entity.entity_id], available = Boolean(state && !["unknown", "unavailable"].includes(state.state)), on = available && state.state === "on", row = document.createElement("div");
        row.className = `control detection ${on ? "on" : ""}`;
        row.innerHTML = '<span class="copy"><span class="control-name"></span><span class="control-state"></span></span>';
        row.querySelector(".control-name").textContent = entity.name || entity.original_name || "Detection";
        row.querySelector(".control-state").textContent = !available ? "Unavailable" : on ? "Detected" : "Clear";
        list.append(row);
      }
    }
    if (camera.switches.length) {
      const list = group("Camera controls");
      for (const capability of camera.switches) {
        const entityId = capability.entity.entity_id, state = this._hass.states[entityId], on = state?.state === "on", usable = Boolean(state && !["unknown", "unavailable"].includes(state.state)), row = document.createElement("div");
        row.className = "control";
        row.innerHTML = '<span class="copy"><span class="control-name"></span><span class="control-state"></span></span><button type="button"></button>';
        row.querySelector(".control-name").textContent = capability.role;
        row.querySelector(".control-state").textContent = usable ? on ? "On" : "Off" : "Unavailable";
        const button = row.querySelector("button"), confirmation = this.confirmId === entityId;
        button.textContent = confirmation ? "Confirm off" : on ? "On" : "Off";
        button.classList.toggle("on", on); button.classList.toggle("confirm", confirmation); button.disabled = !usable; button.setAttribute("aria-pressed", String(on));
        button.setAttribute("aria-label", confirmation ? `Confirm turning off ${capability.role}` : `${on ? "Turn off" : "Turn on"} ${capability.role}`);
        this.controlInteractions.push(interaction(button, { primary: () => this.toggle(capability, on), hold: () => openMoreInfo(this, entityId), singleFlight: true, feedback: true }));
        list.append(row);
      }
    }
    if (camera.ptz.length) {
      const list = group("Pan, tilt and zoom");
      for (const entity of camera.ptz) this.actionRow(list, entity, "Open", () => openMoreInfo(this, entity.entity_id));
    }
    if (camera.actions.length) {
      const list = group("Maintenance");
      for (const capability of camera.actions) this.actionRow(list, capability.entity, this.confirmId === capability.entity.entity_id ? "Confirm" : "Run", () => this.press(capability.entity.entity_id), this.confirmId === capability.entity.entity_id);
    }
    const feedback = document.createElement("div"); feedback.className = `feedback ${this.error ? "error" : ""}`; feedback.setAttribute("role", "status"); feedback.textContent = this.error || ""; groups.append(feedback);
    host.append(groups);
  }
  actionRow(list, entity, label, action, confirm = false) {
    const state = this._hass.states[entity.entity_id], usable = Boolean(state && state.state !== "unavailable"), row = document.createElement("div");
    row.className = "control"; row.innerHTML = '<span class="copy"><span class="control-name"></span><span class="control-state"></span></span><button type="button"></button>';
    row.querySelector(".control-name").textContent = entity.name || entity.original_name || "Camera action";
    row.querySelector(".control-state").textContent = usable ? "Available" : "Unavailable";
    const button = row.querySelector("button"); button.textContent = label; button.disabled = !usable; button.classList.toggle("confirm", confirm);
    this.controlInteractions.push(interaction(button, { primary: action, singleFlight: true, feedback: true }));
    list.append(row);
  }
  askConfirmation(entityId) {
    this.confirmId = entityId;
    clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => { this.confirmId = null; this.renderControls(); }, 5000);
    this.renderControls();
  }
  async toggle(capability, wasOn) {
    const entityId = capability.entity.entity_id, destructiveOff = wasOn && /^(Recording|Detection|Alerts)$/i.test(capability.role);
    if (destructiveOff && this.confirmId !== entityId) return this.askConfirmation(entityId);
    this.confirmId = null; clearTimeout(this.confirmTimer); this.error = ""; this.dialogController.setBusy(true);
    try {
      await this._hass.callService("switch", wasOn ? "turn_off" : "turn_on", { entity_id: entityId });
      await waitForEntityState(() => this._hass, entityId, (value) => value === (wasOn ? "off" : "on"), { timeout: 9000 });
    } catch (error) {
      this.error = error?.message || "Camera did not confirm the change";
      throw error;
    } finally {
      this.dialogController.setBusy(false); this.renderControls();
    }
  }
  async press(entityId) {
    if (this.confirmId !== entityId) return this.askConfirmation(entityId);
    this.confirmId = null; clearTimeout(this.confirmTimer); this.error = ""; this.dialogController.setBusy(true);
    try { await this._hass.callService("button", "press", { entity_id: entityId }); }
    catch (error) { this.error = error?.message || "Camera action failed"; throw error; }
    finally { this.dialogController.setBusy(false); this.renderControls(); }
  }
}

registerCard({ type: "component-camera-controller-v2", element: ComponentCameraControllerV2, name: "Camera Controller V2", description: "Platform-adapted camera controls with explicit state and protected destructive changes." });
}

// Module: src/components/security-summary.js
{
/** ComponentSecuritySummaryV1 — exception-first household Security status. */
const { interaction, loadSecurityModel, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecuritySummaryV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.sequence = 0;
    this.interactions = [];
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .wrap{padding:12px 14px}.top{min-height:44px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px}.icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--secondary-background-color);color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:22px}.ok .icon{color:var(--primary-color)}
      .copy{min-width:0}.title,.detail{display:block}.title{font-size:15px;line-height:1.2;font-weight:650}.detail{margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.3}.count{font-size:13px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.attention{display:grid;gap:6px;margin-top:8px}.attention:empty{display:none}.attention button{appearance:none;width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:12px;background:transparent;color:inherit;font:inherit;text-align:left;display:flex;align-items:center;gap:8px;cursor:pointer}.attention button:hover{background:var(--secondary-background-color)}.attention button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.attention ha-icon{--mdc-icon-size:18px;color:var(--warning-color,var(--primary-color))}.attention span{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .error{color:var(--error-color)}@media(max-width:420px){.wrap{padding:12px}.count{display:none}}
    </style><ha-card><div class="wrap"><div class="top"><span class="icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><span class="copy"><span class="title">Security</span><span class="detail">Loading household status…</span></span><span class="count"></span></div><div class="attention"></div></div></ha-card>`;
    this.elements = { wrap: this.shadowRoot.querySelector(".wrap"), icon: this.shadowRoot.querySelector(".icon ha-icon"), title: this.shadowRoot.querySelector(".title"), detail: this.shadowRoot.querySelector(".detail"), count: this.shadowRoot.querySelector(".count"), attention: this.shadowRoot.querySelector(".attention") };
  }
  setConfig(config) { this.config = { profile: "household-security", title: "Security", ...(config || {}) }; this.refresh(); }
  set hass(hass) { this._hass = hass; this.refresh(); }
  connectedCallback() { window.addEventListener("ha-component-profile-change", this.profileListener); this.refresh(); }
  disconnectedCallback() { window.removeEventListener("ha-component-profile-change", this.profileListener); for (const handle of this.interactions) handle.destroy(); this.interactions = []; }
  getCardSize() { return 2; }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence === this.sequence) { this.model = model; this.render(); }
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error, cameras: [], entries: [], attention: [] }; this.render(); }
    }
  }
  render() {
    if (!this.model || !this.elements) return;
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    const model = this.model, error = model.error || model.profileError;
    this.elements.title.textContent = this.config.title;
    this.elements.wrap.classList.toggle("ok", !error && model.allClear);
    this.elements.detail.classList.toggle("error", Boolean(error));
    this.elements.icon.setAttribute("icon", error ? "mdi:shield-alert-outline" : model.allClear ? "mdi:shield-check-outline" : "mdi:shield-alert-outline");
    this.elements.detail.textContent = model.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : error ? (error.message || "Security status is unavailable")
        : model.allClear ? "All clear" : `${model.attention.length} item${model.attention.length === 1 ? "" : "s"} need attention`;
    this.elements.count.textContent = error ? "Unavailable" : `${model.onlineCameras || 0}/${model.cameras.length} cameras online`;
    this.elements.attention.replaceChildren();
    for (const item of (model.attention || []).slice(0, 4)) {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = '<ha-icon icon="mdi:alert-circle-outline"></ha-icon><span></span>';
      button.querySelector("span").textContent = item.label;
      button.setAttribute("aria-label", `${item.label}. Open details.`);
      this.interactions.push(interaction(button, { primary: () => openMoreInfo(this, item.entityId), feedback: true }));
      this.elements.attention.append(button);
    }
  }
}

registerCard({ type: "component-security-summary-v1", element: ComponentSecuritySummaryV1, name: "Security Summary V1", description: "Exception-first all-clear and attention summary discovered from Home Assistant capabilities." });
}

// Module: src/components/security-camera-wall.js
{
/** ComponentSecurityCameraWallV3 — lazy snapshot-first Security camera wall. */
const { interaction, loadSecurityModel, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityCameraWallV3 extends HTMLElement {
  static stubConfig = { profile: "household-security", columns: 2 };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.tiles = new Map();
    this.sequence = 0;
    this.timer = null;
    this.visible = true;
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.visibility = () => { this.visible = document.visibilityState !== "hidden"; this.syncPlayback(); if (this.visible) this.refreshSnapshots(); };
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
      .wrap{padding:12px 14px 14px}.head{min-height:32px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}h2{margin:0;font-size:15px;line-height:1.2;font-weight:600}.meta{font-size:13px;color:var(--secondary-text-color)}
      .grid{display:grid;grid-template-columns:repeat(var(--security-columns,2),minmax(0,1fr));gap:8px}.empty{min-height:56px;display:grid;place-items:center;color:var(--secondary-text-color);font-size:13px}.empty[hidden]{display:none}
      .tile{min-width:0;overflow:hidden;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--secondary-background-color)}button{appearance:none;border:0;background:transparent;color:inherit;font:inherit}.media{position:relative;display:block;width:100%;aspect-ratio:16/9;overflow:hidden;padding:0;background:var(--dashboard-media-surface,#111);cursor:pointer}.snapshot,.live{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.snapshot{opacity:0;transition:opacity var(--dashboard-transition-standard,160ms) var(--dashboard-easing-standard,ease)}.snapshot.ready{opacity:1}.live{opacity:0;transition:opacity var(--dashboard-transition-standard,180ms) var(--dashboard-easing-standard,ease);pointer-events:none}.tile.live-ready .live{opacity:1}.tile.live-ready .snapshot{opacity:0}.live-label{position:absolute;right:8px;bottom:8px;min-height:32px;padding:0 9px;border-radius:999px;display:flex;align-items:center;gap:5px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 78%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:12px;font-weight:650}.live-label[hidden],.offline .live-label{display:none}.live-label ha-icon{--mdc-icon-size:16px}.offline .media:after{content:'Camera unavailable';position:absolute;inset:0;display:grid;place-items:center;padding:12px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 74%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:13px;font-weight:600;text-align:center}
      .footer{min-height:52px;padding:4px 4px 4px 10px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:4px;background:var(--card-background-color)}.identity{min-width:0;min-height:44px;padding:4px 0;text-align:left;cursor:pointer}.name,.state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name{font-size:13px;font-weight:650}.state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.more{min-width:44px;height:44px;padding:0 10px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--secondary-text-color);cursor:pointer}.more:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.more ha-icon{--mdc-icon-size:20px}.more span{font-size:13px;font-weight:600}
      @media(max-width:700px){.wrap{padding:12px}.grid{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){.snapshot,.live{transition:none}}
    </style><ha-card><div class="wrap"><div class="head"><h2>Camera wall</h2><span class="meta">Loading…</span></div><div class="grid"></div><div class="empty" hidden></div></div></ha-card>`;
    this.grid = this.shadowRoot.querySelector(".grid");
    this.meta = this.shadowRoot.querySelector(".meta");
    this.empty = this.shadowRoot.querySelector(".empty");
  }
  setConfig(config) {
    this.config = { profile: "household-security", columns: 2, title: "Camera wall", refresh_seconds: 15, ...(config || {}) };
    this.style.setProperty("--security-columns", Math.max(1, Math.min(3, Number(this.config.columns) || 2)));
    this.shadowRoot.querySelector("h2").textContent = this.config.title;
    if (this.timer) this.schedule();
    this.refresh();
  }
  set hass(hass) {
    this._hass = hass;
    for (const tile of this.tiles.values()) this.updateTile(tile, tile.camera);
    this.refresh();
  }
  connectedCallback() {
    document.addEventListener?.("visibilitychange", this.visibility);
    window.addEventListener("ha-component-profile-change", this.profileListener);
    this.refresh();
    this.schedule();
  }
  disconnectedCallback() {
    document.removeEventListener?.("visibilitychange", this.visibility);
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    clearInterval(this.timer);
    this.timer = null;
    for (const tile of this.tiles.values()) this.destroyTile(tile);
    this.tiles.clear();
    this.grid.replaceChildren();
  }
  getCardSize() { return 6; }
  schedule() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.refreshSnapshots(), Math.max(10, Number(this.config?.refresh_seconds) || 15) * 1000);
  }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence === this.sequence) { this.model = model; this.render(); }
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error, cameras: [] }; this.render(); }
    }
  }
  render() {
    const cameras = this.model?.cameras || [], keep = new Set(cameras.map((camera) => camera.id));
    this.meta.textContent = this.model?.error ? "Unavailable" : `${cameras.filter((camera) => camera.online).length}/${cameras.length} online`;
    this.empty.hidden = cameras.length > 0;
    this.empty.textContent = this.model?.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : this.model?.error ? (this.model.error.message || "Camera discovery is unavailable") : "No cameras available";
    for (const camera of cameras) {
      let tile = this.tiles.get(camera.id);
      if (!tile) { tile = this.createTile(camera); this.tiles.set(camera.id, tile); }
      tile.camera = camera;
      this.updateTile(tile, camera);
      this.grid.append(tile.root);
    }
    for (const [id, tile] of [...this.tiles]) {
      if (keep.has(id)) continue;
      this.destroyTile(tile);
      tile.root.remove();
      this.tiles.delete(id);
    }
    this.refreshSnapshots();
  }
  createTile(camera) {
    const root = document.createElement("article");
    root.className = "tile";
    root.innerHTML = `<button class="media" type="button"><img class="snapshot" alt=""><span class="live"></span><span class="live-label"><ha-icon icon="mdi:fullscreen"></ha-icon><span>Full view</span></span></button><div class="footer"><button class="identity" type="button"><span class="name"></span><span class="state"></span></button><button class="more" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Settings</span></button></div>`;
    const snapshot = root.querySelector(".snapshot"), liveHost = root.querySelector(".live");
    const tile = { root, camera, snapshot, liveHost, visible: true, stream: null, liveTimer: null, liveRequested: false, lastUrl: null, handles: [] };
    snapshot.addEventListener("load", () => { snapshot.classList.add("ready"); tile.lastUrl = snapshot.src; this.ensureLive(tile); });
    snapshot.addEventListener("error", () => { if (tile.lastUrl && snapshot.src !== tile.lastUrl) snapshot.src = tile.lastUrl; });
    tile.handles.push(
      interaction(root.querySelector(".media"), { primary: () => this.requestViewer(tile.camera, root.querySelector(".media")), feedback: true }),
      interaction(root.querySelector(".identity"), { primary: () => this.requestViewer(tile.camera, root.querySelector(".identity")), feedback: true }),
      interaction(root.querySelector(".more"), { primary: () => this.requestControls(tile.camera, root.querySelector(".more")), feedback: true }),
    );
    if (globalThis.IntersectionObserver) {
      tile.observer = new IntersectionObserver((entries) => {
        tile.visible = entries.some((entry) => entry.isIntersecting);
        this.syncTilePlayback(tile);
        if (tile.visible) this.updateSnapshot(tile);
      }, { rootMargin: "160px" });
      tile.observer.observe(root);
    }
    return tile;
  }
  updateTile(tile, camera) {
    const state = this._hass?.states?.[camera.entityId];
    tile.root.classList.toggle("offline", !camera.online);
    tile.root.classList.toggle("activity", camera.active);
    tile.root.querySelector(".name").textContent = camera.name;
    tile.root.querySelector(".state").textContent = camera.active ? "Activity detected" : camera.online ? "Online" : "Unavailable";
    tile.root.querySelector(".identity").disabled = !camera.online;
    const media = tile.root.querySelector(".media"), snapshotOnly = this.model?.profile?.viewer?.preferred_stream === "snapshot";
    if ((snapshotOnly || !camera.online) && tile.stream) { tile.liveRequested = false; this.stopLive(tile); }
    media.disabled = !camera.online;
    tile.root.querySelector(".live-label").hidden = false;
    media.setAttribute("aria-label", `Open full live view for ${camera.name}`);
    tile.root.querySelector(".identity").setAttribute("aria-label", `Open full live view for ${camera.name}`);
    tile.root.querySelector(".more").setAttribute("aria-label", `Open settings for ${camera.name}`);
    tile.snapshot.alt = `${camera.name} camera snapshot`;
    if (tile.stream) { tile.stream.hass = this._hass; tile.stream.stateObj = state; }
    if (!snapshotOnly) this.updateLiveLabel(tile);
  }
  updateSnapshot(tile) {
    if (!this.visible || !tile.visible || !tile.camera.online) return;
    const state = this._hass?.states?.[tile.camera.entityId], picture = state?.attributes?.entity_picture;
    if (!picture) return;
    const base = this._hass?.hassUrl ? this._hass.hassUrl(picture) : picture;
    const url = `${base}${base.includes("?") ? "&" : "?"}_=${Math.floor(Date.now() / 10000)}`;
    if (url !== tile.snapshot.src) tile.snapshot.src = url;
  }
  refreshSnapshots() { for (const tile of this.tiles.values()) this.updateSnapshot(tile); }
  ensureLive(tile) {
    const preference = this.model?.profile?.viewer?.preferred_stream || "auto";
    if (preference === "live") tile.liveRequested = true;
    if (preference === "snapshot" || !tile.liveRequested || tile.stream || !tile.camera.online || !tile.visible || !this.visible) return;
    const stream = document.createElement("ha-camera-stream");
    stream.className = "live";
    stream.muted = true;
    stream.controls = false;
    stream.hass = this._hass;
    stream.stateObj = this._hass?.states?.[tile.camera.entityId];
    const ready = () => { clearTimeout(tile.liveTimer); tile.liveTimer = null; tile.root.classList.add("live-ready"); this.updateLiveLabel(tile); };
    stream.addEventListener?.("playing", ready);
    stream.addEventListener?.("canplay", ready);
    tile.liveHost.replaceChildren(stream);
    tile.stream = stream;
    tile.root.classList.add("live-requested");
    tile.liveTimer = setTimeout(ready, 1800);
    this.updateLiveLabel(tile);
  }
  toggleLive(tile) {
    if (!tile.camera.online) return;
    if (tile.liveRequested || tile.stream) {
      tile.liveRequested = false;
      this.stopLive(tile);
    } else {
      tile.liveRequested = true;
      this.ensureLive(tile);
    }
    this.updateLiveLabel(tile);
  }
  stopLive(tile) {
    clearTimeout(tile.liveTimer);
    tile.liveTimer = null;
    tile.stream?.remove?.();
    tile.stream = null;
    tile.root.classList.remove("live-requested", "live-ready");
  }
  updateLiveLabel(tile) {
    const active = Boolean(tile.stream), ready = tile.root.classList.contains("live-ready");
    const media = tile.root.querySelector(".media"), label = tile.root.querySelector(".live-label span"), icon = tile.root.querySelector(".live-label ha-icon");
    media.setAttribute("aria-label", `Open full live view for ${tile.camera.name}`);
    label.textContent = active && !ready ? "Loading…" : "Full view";
    icon.setAttribute("icon", active && !ready ? "mdi:progress-clock" : "mdi:fullscreen");
  }
  syncPlayback() { for (const tile of this.tiles.values()) this.syncTilePlayback(tile); }
  syncTilePlayback(tile) {
    if ((!this.visible || !tile.visible) && tile.stream) this.stopLive(tile);
    if (this.visible && tile.visible) this.ensureLive(tile);
  }
  requestControls(camera, trigger) {
    this.dispatchEvent(new CustomEvent("security-camera-control-request", { bubbles: true, composed: true, detail: { camera, trigger } }));
  }
  requestViewer(camera, trigger) {
    this.dispatchEvent(new CustomEvent("security-camera-view-request", { bubbles: true, composed: true, detail: { camera, trigger } }));
  }
  destroyTile(tile) {
    tile.observer?.disconnect();
    for (const handle of tile.handles) handle.destroy();
    tile.handles = [];
    this.stopLive(tile);
  }
}

registerCard({ type: "component-security-camera-wall-v3", element: ComponentSecurityCameraWallV3, name: "Security Camera Wall V3", description: "Snapshot-first, lazy live camera wall with capability-driven controls." });
}

// Module: src/components/security-entry-points.js
{
/** ComponentSecurityEntryPointsV1 — capability-driven doors, garage and locks. */
const { interaction, loadSecurityModel, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityEntryPointsV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.sequence = 0;
    this.interactions = [];
    // `children` is a read-only HTMLElement API. Only nested custom cards
    // need to be retained here, so use a private collection.
    this._children = [];
    this.profileListener = (event) => {
      if (event.detail?.kind === "security" && event.detail?.profileId === this.config?.profile) this.refresh(true);
    };
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}.head{min-height:32px;padding:0 2px;display:flex;align-items:center;margin-bottom:8px}h2{margin:0;font-size:15px;line-height:1.2;font-weight:600}.list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.entry{appearance:none;min-width:0;min-height:60px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.entry:hover{background:var(--secondary-background-color)}.entry:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.icon{width:36px;height:36px;display:grid;place-items:center;color:var(--secondary-text-color)}.open .icon{color:var(--warning-color,var(--primary-color))}.icon ha-icon{--mdc-icon-size:21px}.copy{min-width:0}.name,.state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name{font-size:13px;font-weight:650}.state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}@media(max-width:700px){.list{grid-template-columns:1fr}}
    </style><div class="head"><h2>Entry points</h2></div><div class="list"></div>`;
    this.list = this.shadowRoot.querySelector(".list");
  }
  setConfig(config) { this.config = { profile: "household-security", title: "Entry points", ...(config || {}) }; this.shadowRoot.querySelector("h2").textContent = this.config.title; this.refresh(); }
  set hass(hass) { this._hass = hass; for (const child of this._children) child.hass = hass; this.refresh(); }
  connectedCallback() { window.addEventListener("ha-component-profile-change", this.profileListener); this.refresh(); }
  disconnectedCallback() { window.removeEventListener("ha-component-profile-change", this.profileListener); this.clear(); }
  getCardSize() { return this.hidden ? 0 : 3; }
  clear() {
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this._children = [];
    this.list.replaceChildren();
  }
  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence === this.sequence) { this.model = model; this.render(); }
    } catch (error) {
      if (sequence === this.sequence) { this.model = { error, entries: [] }; this.render(); }
    }
  }
  render() {
    this.clear();
    const entries = this.model?.entries || [];
    this.hidden = entries.length === 0;
    for (const entry of entries) {
      if (entry.deviceClass === "garage_door" && entry.controlEntityId) {
        const controller = document.createElement("component-garage-door-controller-v1");
        controller.setConfig({ entity: entry.entityId, control_entity: entry.controlEntityId, title: entry.name });
        controller.hass = this._hass;
        this._children.push(controller);
        this.list.append(controller);
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = `entry ${entry.open ? "open" : ""}`;
      const icon = entry.domain === "lock" ? (entry.open ? "mdi:lock-open-outline" : "mdi:lock-outline") : entry.deviceClass === "window" ? "mdi:window-closed-variant" : "mdi:door-closed";
      button.innerHTML = `<span class="icon"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="state"></span></span>`;
      button.querySelector("ha-icon").setAttribute("icon", icon);
      button.querySelector(".name").textContent = entry.name;
      button.querySelector(".state").textContent = !entry.available ? "Unavailable" : entry.domain === "lock" ? entry.open ? "Unlocked" : "Locked" : entry.open ? "Open" : "Closed";
      button.setAttribute("aria-label", `${entry.name}, ${button.querySelector(".state").textContent}. Open details.`);
      button.disabled = !entry.available;
      this.interactions.push(interaction(button, { primary: () => openMoreInfo(this, entry.entityId), feedback: true }));
      this.list.append(button);
    }
  }
}

registerCard({ type: "component-security-entry-points-v1", element: ComponentSecurityEntryPointsV1, name: "Security Entry Points V1", description: "Capability-driven garage, door, window and lock status using the shared garage controller where available." });
}

// Module: src/components/security-dashboard.js
{
/** ComponentSecurityDashboardV1 — thin Security composition wrapper. */
const {
  createOverlayController,
  interaction,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-security" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._children = new Map();
    this.interactions = [];
    this.viewerStream = null;
    this.viewerEntityId = null;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}.layout{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.entries:has(> [hidden]){display:none}
      .overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:12px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,rgba(0,0,0,.42)));overscroll-behavior:contain}.sheet{width:min(600px,calc(100vw - 24px));max-height:calc(100dvh - 24px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,var(--ha-card-border-radius,16px));background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.24))}.head{flex:0 0 auto;min-height:56px;padding:6px 7px 6px 14px;border-bottom:1px solid var(--divider-color);display:flex;align-items:center;gap:8px}.title{min-width:0;flex:1;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.head-action,.close{appearance:none;min-width:44px;height:44px;padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color);display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}.head-action:hover,.close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.head-action:focus-visible,.close:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.head-action ha-icon,.close ha-icon{--mdc-icon-size:20px}.head-action span{font-size:13px;font-weight:600}.body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}
      .viewer-overlay{background:color-mix(in srgb,var(--dashboard-media-surface,#111) 84%,transparent)}.viewer-sheet{width:min(1120px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}.viewer-body{position:relative;min-height:0;aspect-ratio:16/9;display:grid;place-items:center;overflow:hidden;background:var(--dashboard-media-surface,#111)}.viewer-stream{display:block;width:100%;height:100%;min-height:0;color:var(--dashboard-media-on-surface,#fff)}
      @media(max-width:700px){.overlay{padding:0}.sheet{width:100vw;max-width:100vw;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.viewer-sheet{height:100dvh;max-height:100dvh;margin:0;border-width:0;border-radius:0}.viewer-body{flex:1 1 auto;aspect-ratio:auto}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}.head-action span{display:none}.head-action{padding:0}}
    </style><div class="layout"><div class="summary"></div><div class="wall"></div><div class="entries"></div></div>
    <section class="overlay controls-overlay" role="dialog" aria-modal="true" aria-labelledby="security-controls-title" hidden><div class="sheet controls-sheet"><div class="head"><span class="title controls-title" id="security-controls-title">Camera settings</span><button class="close controls-close" type="button" aria-label="Close camera settings"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body controls-body"></div></div></section>
    <section class="overlay viewer-overlay" role="dialog" aria-modal="true" aria-labelledby="security-viewer-title" hidden><div class="sheet viewer-sheet"><div class="head"><span class="title viewer-title" id="security-viewer-title">Camera</span><button class="head-action viewer-details" type="button"><ha-icon icon="mdi:information-outline"></ha-icon><span>Details</span></button><button class="close viewer-close" type="button" aria-label="Close camera viewer"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="viewer-body"></div></div></section>`;
    this.controlsOverlay = this.shadowRoot.querySelector(".controls-overlay");
    this.viewerOverlay = this.shadowRoot.querySelector(".viewer-overlay");
    this.controlsController = createOverlayController(this, this.controlsOverlay, {
      initialFocus: () => this.shadowRoot.querySelector(".controls-close"),
      onDismiss: () => this.closeCameraControls(),
    });
    this.viewerController = createOverlayController(this, this.viewerOverlay, {
      initialFocus: () => this.shadowRoot.querySelector(".viewer-close"),
      onDismiss: () => this.closeCameraViewer(),
    });
  }

  setConfig(config) {
    this.config = { profile: "household-security", camera_columns: 2, ...(config || {}) };
    this.ensure();
  }

  set hass(hass) {
    this._hass = hass;
    for (const child of this._children.values()) child.hass = hass;
    if (this.viewerStream && this.viewerEntityId) {
      this.viewerStream.hass = hass;
      this.viewerStream.stateObj = hass?.states?.[this.viewerEntityId];
    }
  }

  connectedCallback() { this.bind(); this.ensure(); }

  disconnectedCallback() {
    for (const handle of this.interactions) handle.destroy();
    this.interactions = [];
    this.closeCameraControls(false);
    this.closeCameraViewer(false);
  }

  getCardSize() { return 12; }

  bind() {
    if (this.interactions.length) return;
    this.interactions.push(
      interaction(this.shadowRoot.querySelector(".controls-close"), { primary: () => this.closeCameraControls(), feedback: true }),
      interaction(this.shadowRoot.querySelector(".viewer-close"), { primary: () => this.closeCameraViewer(), feedback: true }),
      interaction(this.shadowRoot.querySelector(".viewer-details"), { primary: () => openMoreInfo(this, this.viewerEntityId), feedback: true }),
    );
  }

  ensure() {
    if (!this.config) return;
    let summary = this._children.get("summary");
    if (!summary) {
      summary = document.createElement("component-security-summary-v1");
      this.shadowRoot.querySelector(".summary").append(summary);
      this._children.set("summary", summary);
    }
    summary.setConfig({ profile: this.config.profile });

    let wall = this._children.get("wall");
    if (!wall) {
      wall = document.createElement("component-security-camera-wall-v3");
      wall.addEventListener("security-camera-view-request", (event) => this.openCameraViewer(event.detail));
      wall.addEventListener("security-camera-control-request", (event) => this.openCameraControls(event.detail));
      this.shadowRoot.querySelector(".wall").append(wall);
      this._children.set("wall", wall);
    }
    wall.setConfig({ profile: this.config.profile, columns: this.config.camera_columns });

    let entries = this._children.get("entries");
    if (!entries) {
      entries = document.createElement("component-security-entry-points-v1");
      this.shadowRoot.querySelector(".entries").append(entries);
      this._children.set("entries", entries);
    }
    entries.setConfig({ profile: this.config.profile });
    for (const child of [summary, wall, entries]) if (this._hass) child.hass = this._hass;
  }

  openCameraControls(detail) {
    const camera = detail?.camera;
    if (!camera) return;
    this.closeCameraViewer(false);
    let controller = this._children.get("camera-controller");
    if (!controller) {
      controller = document.createElement("component-camera-controller-v2");
      controller.addEventListener("security-camera-view-request", (event) => this.openCameraViewer(event.detail));
      this._children.set("camera-controller", controller);
      this.shadowRoot.querySelector(".controls-body").append(controller);
    }
    controller.setConfig({
      profile: this.config.profile,
      entity: camera.entityId,
      device_id: camera.deviceId,
      expanded: true,
      title: camera.name,
    });
    if (this._hass) controller.hass = this._hass;
    this.shadowRoot.querySelector(".controls-title").textContent = `${camera.name} settings`;
    this.controlsController.open(detail.trigger);
  }

  closeCameraControls(restoreFocus = true) {
    this.controlsController.close(restoreFocus);
  }

  openCameraViewer(detail) {
    const camera = detail?.camera;
    if (!camera || !this._hass) return;
    this.closeCameraControls(false);
    this.stopViewer();
    const requestedEntityId = camera.streamEntityId || camera.entityId;
    const requestedState = this._hass.states?.[requestedEntityId];
    const fallbackState = this._hass.states?.[camera.entityId];
    const stateObj = requestedState && !["unknown", "unavailable"].includes(String(requestedState.state).toLowerCase())
      ? requestedState
      : fallbackState;
    if (!stateObj) return openMoreInfo(this, camera.entityId);
    const stream = document.createElement("ha-camera-stream");
    stream.className = "viewer-stream";
    stream.hass = this._hass;
    stream.stateObj = stateObj;
    stream.controls = true;
    stream.muted = true;
    this.viewerStream = stream;
    this.viewerEntityId = stateObj.entity_id || camera.entityId;
    this.shadowRoot.querySelector(".viewer-title").textContent = `${camera.name} live`;
    this.shadowRoot.querySelector(".viewer-details").setAttribute("aria-label", `Open details for ${camera.name}`);
    this.shadowRoot.querySelector(".viewer-body").replaceChildren(stream);
    this.viewerController.open(detail.trigger);
  }

  closeCameraViewer(restoreFocus = true) {
    this.viewerController.close(restoreFocus);
    this.stopViewer();
  }

  stopViewer() {
    this.viewerStream?.remove?.();
    this.viewerStream = null;
    this.viewerEntityId = null;
    this.shadowRoot.querySelector(".viewer-body")?.replaceChildren();
  }
}

registerCard({ type: "component-security-dashboard-v1", element: ComponentSecurityDashboardV1, name: "Security Dashboard V1", description: "Single-card capability-driven Security dashboard composition." });
}

// Module: src/components/smart-collection.js
{
(()=>{
globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2;class ComponentSmartCollectionV3 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.d=null;this.split=null;this.prefs={order:[],hidden:[]};this.prefsLoaded=false;this.unsub=null;this.gen=0;this.structureSig='';this.cards=new Map;this.editor=document.createElement('dashboard-preference-editor-v3');this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.heading{display:flex;align-items:center;gap:7px;min-width:0}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.head.sep{min-height:30px;margin:2px 0 6px}.head.sep .heading{flex:1}.head.sep .heading h2{font-size:12px;font-weight:500;color:var(--secondary-text-color)}.head.sep .heading ha-icon{display:none}.head.sep .heading:after{content:'';height:1px;background:var(--divider-color);flex:1}.body{display:grid;gap:8px;min-width:0}.empty{min-height:44px;padding:8px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);color:var(--secondary-text-color);font-size:12px;display:flex;align-items:center;gap:8px}.empty ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}</style><ha-card><div class="head"><span class="heading"><ha-icon></ha-icon><h2></h2></span><button class="edit" type="button" aria-label="Edit"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="body"></div></ha-card>`;this.head=this.shadowRoot.querySelector('.head');this.body=this.shadowRoot.querySelector('.body');this.shadowRoot.append(this.editor);this.edit=this.shadowRoot.querySelector('.edit');this.edit.onclick=()=>this.openEditor()}setConfig(c){this.c={mode:'all',title:'Controls',icon:'mdi:tune-variant',pref_key:null,show_header:true,header_style:'title',editable:false,exclude_device_names:[],...c};this.head.hidden=!this.c.show_header;this.head.classList.toggle('sep',this.c.header_style==='separator');this.head.querySelector('h2').textContent=this.c.title;this.head.querySelector('.heading ha-icon').setAttribute('icon',this.c.icon);this.edit.hidden=!this.c.editable;this.structureSig='';this.loadPrefs();this.schedule()}set hass(h){this.h=h;for(const x of this.cards.values())x.el.hass=h;this.unsub||this.subscribe();if(!this.prefsLoaded)this.loadPrefs();if(!this.d||this.c?.mode==='active')this.schedule()}connectedCallback(){this.subscribe();this.schedule()}disconnectedCallback(){this.unsub?.();this.unsub=null;this.gen++}getCardSize(){return 2}subscribe(){if(this.unsub||!this.h||!HD2.REG?.subscribe)return;this.unsub=HD2.REG.subscribe(this.h,d=>{this.d=d;this.structureSig='';this.schedule()})}async loadPrefs(){if(!this.h||!this.c?.pref_key||!HD2.prefs)return;this.prefs=await HD2.prefs(this.h,this.c.pref_key);this.prefsLoaded=true;this.structureSig='';this.schedule()}candidates(){if(!this.d||!this.h)return[];const media=this.d.entities.filter(e=>HD2.uiEntry(e)&&HD2.domain(e.entity_id)==='media_player'&&this.h.states[e.entity_id]),mediaDevices=new Set(media.map(e=>e.device_id).filter(Boolean)),mediaNames=media.map(e=>HD2.stateName(this.h,e,this.h.states[e.entity_id]).trim().toLowerCase()).filter(Boolean),excluded=new Set(this.c.exclude_device_names||[]),deviceNames=new Map(this.d.devices.map(x=>[x.id,x.name_by_user||x.name||'']));return this.d.entities.filter(e=>{const s=this.h.states[e.entity_id],eligible=this.c.mode==='sound'?Boolean(e?.entity_id&&!e.disabled_by):HD2.uiEntry(e);if(!eligible||!s||excluded.has(deviceNames.get(e.device_id)))return false;const dom=HD2.domain(e.entity_id),area=HD2.areaOf(e,this.d),controlName=HD2.stateName(this.h,e,s).trim().toLowerCase();if(this.c.mode==='active'&&dom==='camera')return false;if(this.c.mode==='area')return area===this.c.area_id&&HD2.isPotential(e,s);if(this.c.mode==='media')return dom==='media_player';if(this.c.mode==='sound')return['switch','number','select'].includes(dom)&&(mediaDevices.has(e.device_id)||mediaNames.some(n=>controlName.startsWith(n+' ')));if(this.c.mode==='active'||this.c.mode==='all')return HD2.isPotential(e,s)||(this.c.mode==='active'&&dom==='binary_sensor'&&/^(door|window|smoke|moisture|gas)$/.test(s.attributes?.device_class||''));return false}).filter(e=>!this.split||!this.split.claimed?.has(e.entity_id)||this.split.systems?.has(e.entity_id))}shown(c){return this.c.mode==='active'?c.filter(e=>HD2.isActive(e,this.h.states[e.entity_id])):c}meta(e){const area=HD2.areaOf(e,this.d),a=this.d.areaMap?.get(area)?.name||'Household';return`${a} · ${HD2.label(HD2.domain(e.entity_id))}`}schedule(){if(!this.h||!this.c||!HD2.REG?.load)return;const g=++this.gen;queueMicrotask(()=>this.sync(g))}tune(card){if(card?.localName!=='component-split-controller-v4'||!card.shadowRoot||card.shadowRoot.querySelector('style[data-home-minimal]'))return;const s=document.createElement('style');s.dataset.homeMinimal='';s.textContent='.nm{font-weight:500!important}.iw{color:var(--secondary-text-color)!important}.rv{font-size:22px!important;font-weight:500!important}.tv{font-size:16px!important;font-weight:500!important}.al,.pt,.gt,.o,.tpr button,.tcu button,.tac button{font-weight:500!important}.pt{font-size:16px!important}.a ha-icon{--mdc-icon-size:17px!important}';card.shadowRoot.append(s)}async sync(g){this.d=this.d||await HD2.REG.load(this.h);if(g!==this.gen)return;const reg=globalThis.__componentSplitRegistryV4;this.split=reg?.load?await reg.load(this.h):null;if(g!==this.gen)return;const candidates=this.candidates().sort((a,b)=>HD2.stateName(this.h,a,this.h.states[a.entity_id]).localeCompare(HD2.stateName(this.h,b,this.h.states[b.entity_id]),undefined,{sensitivity:'base'})),pref=HD2.applyPrefs(candidates.map(e=>({id:e.entity_id,entry:e})),this.prefs),show=this.shown(pref.visible.map(x=>x.entry)),rows=[];for(const e of show){const cfg=HD2.controlConfig(e,this.h.states[e.entity_id],this.d,this.h,this.split);if(cfg)rows.push({e,cfg,sig:JSON.stringify(cfg)})}const sig=JSON.stringify(rows.map(x=>[x.e.entity_id,x.sig]));if(sig===this.structureSig){for(const x of this.cards.values())x.el.hass=this.h;return}this.structureSig=sig;const keep=new Set(rows.map(x=>x.e.entity_id));for(const[id,x]of[...this.cards])if(!keep.has(id)){x.el.remove();this.cards.delete(id)}if(!rows.length){if(!this.empty){this.empty=document.createElement('div');this.empty.className='empty';this.empty.innerHTML='<ha-icon></ha-icon><span></span>'}this.empty.querySelector('ha-icon').setAttribute('icon',this.c.mode==='active'?'mdi:check-circle-outline':'mdi:gesture-tap');this.empty.querySelector('span').textContent=this.c.mode==='active'?'Everything is quiet':'No controls available';if(!this.empty.isConnected)this.body.append(this.empty);return}this.empty?.remove();for(const x of rows){let rec=this.cards.get(x.e.entity_id);if(!rec||rec.sig!==x.sig){rec?.el.remove();try{const el=await HD2.card(this.h,x.cfg);if(g!==this.gen)return;this.tune(el);rec={el,sig:x.sig};this.cards.set(x.e.entity_id,rec)}catch{continue}}rec.el.hass=this.h;if(this.body.lastElementChild!==rec.el)this.body.append(rec.el)}}async openEditor(){if(!this.h||!this.c?.pref_key||!HD2.REG?.load)return;await customElements.whenDefined('dashboard-preference-editor-v3');this.d=this.d||await HD2.REG.load(this.h);const reg=globalThis.__componentSplitRegistryV4;this.split=reg?.load?await reg.load(this.h):null;const c=this.candidates().map(e=>({id:e.entity_id,name:HD2.stateName(this.h,e,this.h.states[e.entity_id]),meta:this.meta(e),icon:HD2.icon(e,this.h.states[e.entity_id])})),p=HD2.applyPrefs(c,this.prefs);this.editor.open({title:`Edit ${this.c.title.toLowerCase()}`,description:'Reorder discovered controls or hide controls you do not want shown.',items:p.all,hidden:[...p.hidden],onSave:async v=>{this.prefs=v;await HD2.savePrefs(this.h,this.c.pref_key,v);this.structureSig='';this.schedule()}})}}if(!customElements.get('component-smart-collection-v3'))customElements.define('component-smart-collection-v3',ComponentSmartCollectionV3);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-smart-collection-v3'))window.customCards.push({type:'component-smart-collection-v3',name:'Smart Control Collection V3',description:'Stable registry-driven household controls without refresh teardown.'});
})();
}

// Module: src/components/household-directory.js
{
(()=>{
globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2;class ComponentHouseholdDirectoryV3 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.d=null;this.prefs={order:[],hidden:[]};this.prefsLoaded=false;this.unsub=null;this.gen=0;this.cards=new Map;this.structureSig='';this.editor=document.createElement('dashboard-preference-editor-v3');this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.heading{display:flex;align-items:center;gap:7px}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}</style><ha-card><div class="head"><span class="heading"><ha-icon icon="mdi:home-heart"></ha-icon><h2>Household</h2></span><button class="edit" type="button" aria-label="Edit household"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div></ha-card>`;this.grid=this.shadowRoot.querySelector('.grid');this.shadowRoot.append(this.editor);this.shadowRoot.querySelector('.edit').onclick=()=>this.openEditor()}setConfig(c){this.c={pref_key:'home-control.household.v2',base_path:'/home-control',current_dashboard:'home-control',...c};this.loadPrefs();this.schedule()}set hass(h){this.h=h;for(const x of this.cards.values())x.hass=h;this.unsub||this.subscribe();if(!this.prefsLoaded)this.loadPrefs();if(!this.d)this.schedule()}connectedCallback(){this.subscribe();this.schedule()}disconnectedCallback(){this.unsub?.();this.unsub=null;this.gen++}getCardSize(){return 2}subscribe(){if(this.unsub||!this.h||!HD2.REG?.subscribe)return;this.unsub=HD2.REG.subscribe(this.h,d=>{this.d=d;this.structureSig='';this.schedule()})}async loadPrefs(){if(!this.h||!this.c?.pref_key||!HD2.prefs)return;this.prefs=await HD2.prefs(this.h,this.c.pref_key);this.prefsLoaded=true;this.structureSig='';this.schedule()}items(){if(!this.d||!this.h)return[];const out=[],hasMedia=this.d.entities.some(e=>HD2.uiEntry(e)&&HD2.domain(e.entity_id)==='media_player'&&this.h.states[e.entity_id]),hasControls=this.d.entities.some(e=>HD2.uiEntry(e)&&HD2.controlDomains.has(HD2.domain(e.entity_id))&&this.h.states[e.entity_id]);if(hasMedia)out.push({id:'view:media',name:'Media',icon:'mdi:speaker-multiple',kind:'nav',path:`${this.c.base_path}/media`,meta:'Dashboard view'});if(hasControls)out.push({id:'view:all-controls',name:'Controls',icon:'mdi:tune-variant',kind:'nav',path:`${this.c.base_path}/all-controls`,meta:'Dashboard view'});for(const d of this.d.dashboards||[]){const path=d.url_path;if(!path||path===this.c.current_dashboard||path==='home-control-fix'||d.require_admin===true||d.show_in_sidebar===false)continue;out.push({id:`dashboard:${path}`,name:d.title||HD2.label(path),icon:d.icon||'mdi:view-dashboard-outline',kind:'nav',path:`/${path}`,meta:'Dashboard'})}for(const e of this.d.entities.filter(e=>HD2.uiEntry(e)&&HD2.domain(e.entity_id)==='todo'&&this.h.states[e.entity_id]))out.push({id:`entity:${e.entity_id}`,name:HD2.stateName(this.h,e,this.h.states[e.entity_id]).replace(/ List$/i,''),icon:'mdi:cart-outline',kind:'entity',entity:e.entity_id,meta:'List'});const seen=new Set;return out.filter(x=>!seen.has(x.id)&&seen.add(x.id))}schedule(){if(!this.h||!this.c||!HD2.REG?.load)return;const g=++this.gen;queueMicrotask(()=>this.sync(g))}async sync(g){this.d=this.d||await HD2.REG.load(this.h);if(g!==this.gen)return;const p=HD2.applyPrefs(this.items(),this.prefs),sig=JSON.stringify(p.visible.map(x=>[x.id,x.name,x.icon,x.path,x.entity]));if(sig===this.structureSig){for(const x of this.cards.values())x.hass=this.h;return}this.structureSig=sig;const keep=new Set(p.visible.map(x=>x.id));for(const[id,el]of[...this.cards])if(!keep.has(id)){el.remove();this.cards.delete(id)}for(const x of p.visible){let el=this.cards.get(x.id);if(!el){const cfg=x.kind==='entity'?{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:x.entity,name:x.name,icon:x.icon,show_state:true,button_action:{tap_action:{action:'more-info'}},scrolling_effect:false}:{type:'custom:bubble-card',card_type:'button',button_type:'name',name:x.name,icon:x.icon,show_icon:true,button_action:{tap_action:{action:'navigate',navigation_path:x.path}},scrolling_effect:false};try{el=await HD2.card(this.h,cfg);if(g!==this.gen)return;this.cards.set(x.id,el)}catch{continue}}el.hass=this.h;if(this.grid.lastElementChild!==el)this.grid.append(el)}}async openEditor(){if(!this.h||!HD2.REG?.load)return;await customElements.whenDefined('dashboard-preference-editor-v3');this.d=this.d||await HD2.REG.load(this.h);const p=HD2.applyPrefs(this.items(),this.prefs);this.editor.open({title:'Edit household',description:'Reorder or hide discovered destinations without changing the underlying dashboard or entity.',items:p.all,hidden:[...p.hidden],onSave:async v=>{this.prefs=v;await HD2.savePrefs(this.h,this.c.pref_key,v);this.structureSig='';this.schedule()}})}}if(!customElements.get('component-household-directory-v3'))customElements.define('component-household-directory-v3',ComponentHouseholdDirectoryV3);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-household-directory-v3'))window.customCards.push({type:'component-household-directory-v3',name:'Household Directory V3',description:'Stable auto-discovered household destinations.'});
})();
}

// Module: src/components/favourites-minimal.js
{
class ComponentFavouritesMinimalV1 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.child=null;this.ready=false}setConfig(c){this.c=c;this.ensure()}set hass(h){this.h=h;if(this.child)this.child.hass=h;else this.ensure()}connectedCallback(){this.ensure()}getCardSize(){return 2}async ensure(){if(this.ready||!this.c)return;this.ready=true;await customElements.whenDefined('component-favourites-v3');const x=document.createElement('component-favourites-v3');x.setConfig(this.c);if(this.h)x.hass=this.h;this.child=x;this.shadowRoot.replaceChildren(x);queueMicrotask(()=>this.tune())}tune(){const r=this.child?.shadowRoot;if(!r)return;r.querySelector('.edit ha-icon')?.setAttribute('icon','mdi:dots-horizontal');if(r.querySelector('style[data-home-minimal]'))return;const s=document.createElement('style');s.dataset.homeMinimal='';s.textContent='.heading h2{font-size:15px!important;font-weight:500!important}.heading ha-icon{color:var(--secondary-text-color)!important;--mdc-icon-size:17px!important}.edit{min-width:44px!important;min-height:44px!important;padding:0!important;color:var(--secondary-text-color)!important;font-weight:400!important}.edit ha-icon{--mdc-icon-size:16px!important}.edit span{display:none!important}.icon{color:var(--secondary-text-color)!important}.name{font-weight:500!important}.state{font-size:12px!important}.dialog-title,.confirm-title{font-size:16px!important;font-weight:500!important}.subheading,.group-title,.choice-name,.dialog-button{font-weight:500!important}.selected-meta,.choice-meta,.editor-copy{font-size:12px!important}';r.append(s)}}if(!customElements.get('component-favourites-minimal-v1'))customElements.define('component-favourites-minimal-v1',ComponentFavouritesMinimalV1);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-favourites-minimal-v1'))window.customCards.push({type:'component-favourites-minimal-v1',name:'Favourites Minimal',description:'Existing favourites behaviour with restrained Home typography.'});
}

// Module: src/support/backend-favourites.js
{
/** Backend preference storage adapter for the existing Favourites component. */
const backendFavouritesRuntime = globalThis.__homeDashboardV2;
const BackendFavourites = customElements.get("component-favourites-v3");

if (backendFavouritesRuntime && BackendFavourites && !BackendFavourites.prototype.__backendStorageV1) {
  const prototype = BackendFavourites.prototype;
  prototype.__backendStorageV1 = true;
  const originalSetConfig = prototype.setConfig;
  const originalSyncStored = prototype._syncStored;
  const originalStorageSignature = prototype._storageSignature;
  const originalRenderGrid = prototype._renderGrid;
  const originalSave = prototype._save;
  const originalSubscribe = prototype._subscribeRegistryEvents;
  const originalUnsubscribe = prototype._unsubscribeRegistryEvents;

  prototype.setConfig = function setBackendFavouritesConfig(config) {
    const preferenceKey = String(config?.preference_key || "").trim();
    const demoItems = Array.isArray(config?.items) ? config.items : [];
    if (!preferenceKey || demoItems.length) {
      originalSetConfig.call(this, config);
      return;
    }
    const legacyHelpers = Array.isArray(config?.helpers)
      ? config.helpers.filter((entityId) => typeof entityId === "string")
      : [];
    this._backendPreferenceInitialising = true;
    originalSetConfig.call(this, {
      ...config,
      helpers: legacyHelpers.length ? legacyHelpers : ["__backend_preference__"],
    });
    this._legacyFavouriteHelpers = legacyHelpers.slice(0, 4);
    this.config.helpers = [];
    this.config.preference_key = preferenceKey;
    this._preferenceLoaded = false;
    this._preferenceError = null;
    this._backendPreferenceInitialising = false;
    if (this.$?.edit) {
      this.$.edit.hidden = false;
      this.$.edit.disabled = true;
      this.$.edit.setAttribute("aria-busy", "true");
    }
    this._syncStored();
    this._renderGrid();
  };

  prototype._syncStored = function syncBackendFavourites() {
    if (!this.config?.preference_key) {
      originalSyncStored.call(this);
      return;
    }
    if (this._backendPreferenceInitialising || !this._hass) return;
    void this._loadBackendFavourites();
  };

  prototype._loadBackendFavourites = async function loadBackendFavourites(force = false) {
    if (!this._hass || !this.config?.preference_key) return;
    const hass = this._hass;
    const key = this.config.preference_key;
    if (this._preferencePromise) {
      if (
        force ||
        this._preferenceRequestHass !== hass ||
        this._preferenceRequestKey !== key
      ) {
        this._preferenceReloadPending = true;
      }
      return this._preferencePromise;
    }
    if (this._preferenceLoaded && !force) return;
    this._preferenceRequestHass = hass;
    this._preferenceRequestKey = key;
    this._preferencePromise = backendFavouritesRuntime
      .prefs(hass, key)
      .then(async (stored) => {
        if (hass !== this._hass || key !== this.config?.preference_key) return;
        let selected = Array.isArray(stored)
          ? stored.map((item) => this._normaliseRef(item)).filter(Boolean).slice(0, this.config.max)
          : [];
        if (!Array.isArray(stored) && this._legacyFavouriteHelpers?.length) {
          selected = this._legacyFavouriteHelpers
            .map((entityId) => this._parseSlot(hass.states?.[entityId]?.state))
            .filter(Boolean)
            .slice(0, this.config.max);
          if (selected.length) {
            await backendFavouritesRuntime.savePrefs(hass, key, selected);
          }
        }
        this._selected = selected;
        this._preferenceLoaded = true;
        this._preferenceError = null;
        if (this.$?.edit) {
          this.$.edit.disabled = false;
          this.$.edit.removeAttribute("aria-busy");
        }
        this._lastStorageSignature = this._storageSignature();
        this._renderSignature = "";
        this._renderGrid();
        if (this.$?.editor?.open) this._updateEditorState();
      })
      .catch((error) => {
        if (hass !== this._hass) return;
        this._preferenceError = error;
        this._renderGrid();
      })
      .finally(() => {
        this._preferencePromise = null;
        this._preferenceRequestHass = null;
        this._preferenceRequestKey = null;
        if (this._preferenceReloadPending) {
          this._preferenceReloadPending = false;
          if (this._hass && this.config?.preference_key) {
            void this._loadBackendFavourites(true);
          }
        }
      });
    return this._preferencePromise;
  };

  prototype._storageSignature = function backendFavouriteSignature() {
    if (!this.config?.preference_key) return originalStorageSignature.call(this);
    return JSON.stringify(this._selected);
  };

  prototype._renderGrid = function renderBackendFavourites() {
    originalRenderGrid.call(this);
    if (!this.config?.preference_key || !this.$?.grid) return;
    if (this._preferenceError) {
      this.$.edit.disabled = true;
      this.$.edit.removeAttribute("aria-busy");
      this.$.grid.innerHTML =
        '<div class="load-error">Favourites storage could not be loaded. Try again shortly.</div>';
    } else if (!this._preferenceLoaded) {
      this.$.edit.disabled = true;
      this.$.edit.setAttribute("aria-busy", "true");
      this.$.grid.innerHTML = '<div class="empty">Loading favourites…</div>';
    } else {
      this.$.edit.disabled = false;
      this.$.edit.removeAttribute("aria-busy");
    }
  };

  prototype._save = async function saveBackendFavourites() {
    if (!this.config?.preference_key) {
      return originalSave.call(this);
    }
    if (this.$.save.disabled) return;
    if (this._editorStorageSignature !== this._storageSignature()) {
      this._updateEditorState();
      return;
    }
    const selected = this._draft
      .map((item) => this._normaliseRef(item))
      .filter(Boolean)
      .slice(0, this.config.max);
    this.$.save.disabled = true;
    this.$.save.setAttribute("aria-busy", "true");
    this.$.save.style.minWidth = "84px";
    this.$.save.textContent = "Saving…";
    this.$.editorError.textContent = "";
    try {
      await backendFavouritesRuntime.savePrefs(
        this._hass,
        this.config.preference_key,
        selected,
      );
      this._selected = selected.map((item) => ({ ...item }));
      this._preferenceLoaded = true;
      this._preferenceError = null;
      this._lastStorageSignature = this._storageSignature();
      this._renderSignature = "";
      this._editorStorageSignature = this._storageSignature();
      this.$.editor.close();
      this._renderGrid();
      this._notice("Favourites saved.");
    } catch (error) {
      this.$.editorError.textContent =
        error?.message ||
        "Favourites could not be saved. Your current choices are still open; try again.";
    } finally {
      const error = this.$.editorError.textContent;
      this.$.save.removeAttribute("aria-busy");
      this.$.save.textContent = "Save";
      this._updateEditorState();
      if (error) this.$.editorError.textContent = error;
    }
  };

  prototype._subscribeRegistryEvents = function subscribeBackendFavourites() {
    originalSubscribe.call(this);
    if (
      !this.isConnected ||
      this._preferenceSubscription ||
      !this.config?.preference_key ||
      !this._connection?.subscribeEvents
    ) {
      return;
    }
    const subscription = this._connection
      .subscribeEvents((event) => {
        if (event?.data?.key === this.config?.preference_key) {
          void this._loadBackendFavourites(true);
        }
      }, "ha_component_backend_preferences_updated")
      .then((unsubscribe) => unsubscribe);
    this._preferenceSubscription = subscription;
    subscription.catch(() => {
      if (this._preferenceSubscription === subscription) {
        this._preferenceSubscription = null;
      }
    });
  };

  prototype._unsubscribeRegistryEvents = function unsubscribeBackendFavourites() {
    originalUnsubscribe.call(this);
    const subscription = this._preferenceSubscription;
    this._preferenceSubscription = null;
    if (subscription) Promise.resolve(subscription).then((unsubscribe) => unsubscribe?.()).catch(() => {});
  };
}

const MinimalFavourites = customElements.get("component-favourites-minimal-v1");
if (MinimalFavourites && !MinimalFavourites.prototype.__backendStorageV1) {
  MinimalFavourites.prototype.__backendStorageV1 = true;
  const originalMinimalSetConfig = MinimalFavourites.prototype.setConfig;
  MinimalFavourites.prototype.setConfig = function setMinimalBackendFavourites(config) {
    originalMinimalSetConfig.call(this, {
      preference_key: "home-control.favourites.v1",
      ...config,
    });
  };
}
}

// Module: src/components/room-directory.js
{
(()=>{
globalThis.__homeDashboardV2??={};const HD2=globalThis.__homeDashboardV2,{interaction,navigateTo,openMoreInfo}=globalThis.__HA_COMPONENT_LIBRARY_SHARED__;class ComponentRoomDirectoryV4 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this.d=null;this.prefs={order:[],hidden:[]};this.prefsLoaded=false;this.unsub=null;this.currentAreaId=null;this.controlCard=null;this.tiles=new Map;this.editor=document.createElement('dashboard-preference-editor-v3');this._location=()=>this.syncHash();this._touch=null;this._interactionHandles=[];this._scrollPositions=new Map;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}button{font:inherit;color:inherit}.head{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.open-view{appearance:none;border:0;background:transparent;display:flex;align-items:center;gap:7px;min-height:44px;padding:0;cursor:pointer}.open-view ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.open-view h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit,.room-edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon,.room-edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible,.room-edit:hover,.room-edit:focus-visible,.open-view:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.group{grid-column:1/-1;min-height:28px;padding:3px 2px 1px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:12px;font-weight:500}.group:after{content:'';height:1px;background:var(--divider-color);flex:1}.room{appearance:none;min-width:0;min-height:56px;padding:0 12px 0 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));text-align:left;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.room:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.room:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:19px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}.room.active .ico{color:color-mix(in srgb,var(--primary-color) 55%,var(--secondary-text-color))}.room.warning{border-left-color:var(--warning-color,#f9a825)}.room.warning .ico{color:var(--warning-color,#f9a825)}.room.critical{border-left-color:var(--error-color)}.room.critical .ico{color:var(--error-color)}dialog{width:min(720px,calc(100vw - 24px));height:min(760px,calc(100dvh - 32px));min-height:min(560px,calc(100dvh - 32px));margin:auto;padding:0;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}.sheet{height:100%;display:flex;flex-direction:column;will-change:transform;transition:transform .18s ease}.sheet.dragging{transition:none}.sheet-head{flex:0 0 auto;min-height:54px;padding:5px 6px 5px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--divider-color);touch-action:pan-y}.identity{min-width:0;display:flex;align-items:center;gap:8px}.identity ha-icon{color:var(--secondary-text-color);--mdc-icon-size:18px}.sheet-name{font-size:14px;line-height:1.2;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.environment{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0;color:var(--secondary-text-color)}.metric{appearance:none;border:0;background:transparent;min-height:44px;padding:0;display:flex;align-items:center;gap:3px;white-space:nowrap;cursor:pointer;color:inherit;font-size:12px}.metric ha-icon{--mdc-icon-size:15px;color:var(--secondary-text-color)}.dot{font-size:11px;color:var(--disabled-text-color,var(--secondary-text-color))}.close{appearance:none;width:44px;height:44px;padding:0;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer;flex:0 0 auto}.close ha-icon{--mdc-icon-size:18px}.sheet-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:10px 14px max(14px,env(safe-area-inset-bottom));touch-action:pan-y}@media(max-width:700px){dialog{width:100vw;max-width:100vw;height:92dvh;min-height:92dvh;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:var(--dashboard-radius-dialog,8px) var(--dashboard-radius-dialog,8px) 0 0}.sheet-head{padding-left:12px}.sheet-body{padding:8px 12px max(18px,env(safe-area-inset-bottom))}}@media(max-width:520px){.identity ha-icon{display:none}.sheet-head{gap:5px}.environment{gap:4px}.metric{font-size:11.5px}.room-edit,.close{width:44px;height:44px}}</style><style>@media(prefers-reduced-motion:reduce){.sheet{transition:none}}</style><ha-card><div class="head"><button class="open-view" type="button"><ha-icon></ha-icon><h2></h2></button><button class="edit" type="button" aria-label="Edit rooms"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div></ha-card><dialog><div class="sheet"><div class="sheet-head"><span class="identity"><ha-icon class="sheet-icon"></ha-icon><span class="sheet-name"></span></span><span class="environment"></span><button class="room-edit" type="button" aria-label="Edit room controls"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button><button class="close" type="button" aria-label="Close room"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="sheet-body"></div></div></dialog>`;this.grid=this.shadowRoot.querySelector('.grid');this.dialog=this.shadowRoot.querySelector('dialog');this.sheet=this.shadowRoot.querySelector('.sheet');this.sheetBody=this.shadowRoot.querySelector('.sheet-body');this.environment=this.shadowRoot.querySelector('.environment');this.shadowRoot.append(this.editor);this.shadowRoot.querySelector('.edit').onclick=()=>this.openEditor();this._interactionHandles.push(interaction(this.shadowRoot.querySelector('.open-view'),{primary:()=>this.openView(),feedback:true}));this.shadowRoot.querySelector('.room-edit').onclick=()=>this.controlCard?.openEditor?.();this.shadowRoot.querySelector('.close').onclick=()=>this.closeRoom();this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.closeRoom()});this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.closeRoom()});this.bindSwipe()}setConfig(c){this.c={title:'Rooms',icon:'mdi:floor-plan',mode:'home',pref_key:'home-control.rooms.v2',navigation_path:null,base_path:'/home-control',...c};this.shadowRoot.querySelector('h2').textContent=this.c.title;this.shadowRoot.querySelector('.open-view ha-icon').setAttribute('icon',this.c.icon);this.shadowRoot.querySelector('.open-view').disabled=!this.c.navigation_path;this.loadPrefs();this.rebuild()}set hass(h){this.h=h;if(this.controlCard)this.controlCard.hass=h;this.unsub||this.subscribe();if(!this.prefsLoaded)this.loadPrefs();this.refreshTiles();this.refreshOpenRoom()}connectedCallback(){this.subscribe();window.addEventListener('hashchange',this._location);window.addEventListener('location-changed',this._location);this.rebuild();this.syncHash()}disconnectedCallback(){for(const h of this._interactionHandles)h.destroy();this._interactionHandles=[];for(const b of this.tiles.values())b._interaction?.destroy?.();this.unsub?.();this.unsub=null;window.removeEventListener('hashchange',this._location);window.removeEventListener('location-changed',this._location)}getCardSize(){return 4}subscribe(){if(this.unsub||!this.h||!HD2.REG?.subscribe)return;this.unsub=HD2.REG.subscribe(this.h,d=>{this.d=d;this.rebuild();this.syncHash()})}async loadPrefs(){if(!this.h||!this.c?.pref_key||!HD2.prefs)return;this.prefs=await HD2.prefs(this.h,this.c.pref_key);this.prefsLoaded=true;this.rebuild()}openView(){if(!this.c.navigation_path)return;navigateTo(this.c.navigation_path)}entries(areaId){if(!this.d||!this.h)return[];return this.d.entities.filter(e=>HD2.uiEntry(e)&&HD2.areaOf(e,this.d)===areaId).map(e=>({e,s:this.h.states[e.entity_id]})).filter(x=>x.s)}air(x){const id=`${x.e.entity_id} ${x.s.attributes?.friendly_name||''}`.toLowerCase();return id.includes('air_quality')||id.includes('air quality')||id.includes('air_monitor')||id.includes('air monitor')}metric(items,cls,monitor=false){const blocked=/(_controller_temperature|_outside_air_temperature|cpu_temperature|processor_temperature|board_temperature|chip_temperature|internal_temperature)$/;return items.find(x=>HD2.domain(x.e.entity_id)==='sensor'&&x.s.attributes?.device_class===cls&&HD2.validState(x.s)&&Number.isFinite(Number.parseFloat(x.s.state))&&!(cls==='temperature'&&blocked.test(x.e.entity_id))&&(!monitor||this.air(x)))||null}fmt(s){try{return this.h.formatEntityState(s)}catch{return String(s?.state||'')}}status(area){const x=this.entries(area.area_id).filter(y=>HD2.validState(y.s)),mt=this.metric(x,'temperature',true),mh=this.metric(x,'humidity',true),cl=x.find(y=>HD2.domain(y.e.entity_id)==='climate'&&Number.isFinite(Number.parseFloat(y.s.attributes?.current_temperature))),ft=this.metric(x,'temperature'),fh=this.metric(x,'humidity');let temp='';if(mt)temp=this.fmt(mt.s);else if(cl){const n=Number.parseFloat(cl.s.attributes.current_temperature),u=cl.s.attributes.temperature_unit||this.h.config?.unit_system?.temperature||'°C';temp=n.toLocaleString(this.h.locale?.language||undefined,{maximumFractionDigits:1})+' '+u}else if(ft)temp=this.fmt(ft.s);const hum=mh||fh,lights=x.filter(y=>HD2.domain(y.e.entity_id)==='light'&&y.s.state==='on').length,critical=x.some(y=>HD2.domain(y.e.entity_id)==='binary_sensor'&&y.s.state==='on'&&/^(smoke|moisture|gas)$/.test(y.s.attributes?.device_class||'')),warning=x.some(y=>(HD2.domain(y.e.entity_id)==='binary_sensor'&&y.s.state==='on'&&y.s.attributes?.device_class==='garage_door')||(HD2.domain(y.e.entity_id)==='cover'&&/^(open|opening)$/.test(y.s.state)&&y.s.attributes?.device_class==='garage')),active=lights>0||x.some(y=>(HD2.domain(y.e.entity_id)==='climate'&&/^(heating|cooling|drying|fan)$/.test(y.s.attributes?.hvac_action||''))||(HD2.domain(y.e.entity_id)==='media_player'&&y.s.state==='playing'));const p=[];if(critical)p.push('Attention required');else if(warning)p.push('Garage open');if(temp)p.push(temp);if(hum)p.push(this.fmt(hum.s));if(lights)p.push(`${lights} light${lights===1?'':'s'} on`);return{summary:p.slice(0,3).join(' · '),severity:critical?'critical':warning?'warning':active?'active':'',tempState:mt?.s||cl?.s||ft?.s||null,humState:hum?.s||null}}isOutdoor(a){return/(yard|garage|garden|patio|deck|outdoor|shed|carport)/i.test(`${a.area_id} ${a.name}`)}async rebuild(){if(!this.h||!this.c||!HD2.REG?.load)return;this.d=this.d||await HD2.REG.load(this.h);if(!this.d)return;const areas=this.d.areas.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),undefined,{sensitivity:'base'})),visible=HD2.applyPrefs(areas.map(a=>({id:a.area_id,area:a})),this.prefs).visible.map(x=>x.area);this.grid.replaceChildren();const add=(title,list)=>{if(this.c.mode==='full'){const g=document.createElement('div');g.className='group';g.textContent=title;this.grid.append(g)}for(const a of list){let b=this.tiles.get(a.area_id);if(!b){b=this.makeTile(a);this.tiles.set(a.area_id,b)}this.updateTile(b,a);this.grid.append(b)}};if(this.c.mode==='full'){add('Indoor',visible.filter(a=>!this.isOutdoor(a)));add('Outdoor & utility',visible.filter(a=>this.isOutdoor(a)))}else add('',visible);const keep=new Set(visible.map(a=>a.area_id));for(const[id,b]of[...this.tiles])if(!keep.has(id)){b._interaction?.destroy?.();b.remove();this.tiles.delete(id)}}makeTile(a){const b=document.createElement('button');b.type='button';b.className='room';b.innerHTML='<span class="ico"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="summary"></span></span>';b._interaction=interaction(b,{primary:()=>{const x=this.d?.areaMap?.get(a.area_id)||a;return this.openRoom(x,true)},feedback:true});return b}updateTile(b,a){if(!this.h)return;const st=this.status(a);b.className=`room ${st.severity}`;b.setAttribute('aria-label',`Open ${a.name}${st.summary?'. '+st.summary:''}`);b.querySelector('ha-icon').setAttribute('icon',a.icon||'mdi:home-outline');b.querySelector('.name').textContent=a.name;const s=b.querySelector('.summary');s.textContent=st.summary||'';s.hidden=!st.summary}refreshTiles(){if(!this.d||!this.h)return;for(const[id,b]of this.tiles){const a=this.d.areaMap?.get(id);if(a)this.updateTile(b,a)}}areaFromHash(){const slug=location.hash.replace(/^#/,'');if(!slug||!this.d)return null;return this.d.areas.find(a=>a.area_id.replaceAll('_','-')===slug)||null}syncHash(){if(!this.d||!this.h)return;const a=this.areaFromHash();if(a){if(this.currentAreaId!==a.area_id||!this.dialog.open)this.openRoom(a,false)}else if(this.dialog.open)this.closeRoom(false)}async openRoom(a,writeHash=true){if(!a||!this.h)return;if(this.dialog.open&&this.currentAreaId)this._scrollPositions.set(this.currentAreaId,this.sheetBody.scrollTop);this.currentAreaId=a.area_id;if(writeHash){const hash='#'+a.area_id.replaceAll('_','-');if(location.hash!==hash){history.pushState(null,'',location.pathname+location.search+hash);window.dispatchEvent(new Event('location-changed'))}}this.renderSheetHeader(a);await customElements.whenDefined('component-smart-collection-v3');this.sheetBody.replaceChildren();const controls=document.createElement('component-smart-collection-v3');controls.setConfig({mode:'area',area_id:a.area_id,title:'Controls',icon:'mdi:gesture-tap-button',header_style:'separator',editable:false,pref_key:`home-control.area.${a.area_id}.v2`});controls.hass=this.h;this.controlCard=controls;this.sheetBody.append(controls);if(!this.dialog.open)this.dialog.showModal();this.sheetBody.scrollTop=this._scrollPositions.get(a.area_id)||0;this.sheet.style.transform='';queueMicrotask(()=>this.shadowRoot.querySelector('.close')?.focus())}refreshOpenRoom(){const a=this.d?.areaMap?.get(this.currentAreaId);if(a&&this.dialog.open)this.renderSheetHeader(a)}renderSheetHeader(a){const st=this.status(a);this.shadowRoot.querySelector('.sheet-icon').setAttribute('icon',a.icon||'mdi:home-outline');this.shadowRoot.querySelector('.sheet-name').textContent=a.name;this.environment.replaceChildren();const add=(s,icon,label)=>{if(!s)return;if(this.environment.childElementCount){const dot=document.createElement('span');dot.className='dot';dot.textContent='•';this.environment.append(dot)}const b=document.createElement('button');b.type='button';b.className='metric';b.innerHTML=`<ha-icon icon="${icon}"></ha-icon><span></span>`;b.querySelector('span').textContent=label;this._interactionHandles.push(interaction(b,{primary:()=>openMoreInfo(this,s.entity_id),feedback:true}));this.environment.append(b)};add(st.tempState,'mdi:thermometer',st.tempState?this.tempText(st.tempState):'');add(st.humState,'mdi:water-percent',st.humState?this.fmt(st.humState):'')}tempText(s){if(HD2.domain(s.entity_id)==='climate'){const n=Number.parseFloat(s.attributes?.current_temperature);if(Number.isFinite(n)){const u=s.attributes?.temperature_unit||this.h.config?.unit_system?.temperature||'°C';return n.toLocaleString(this.h.locale?.language||undefined,{maximumFractionDigits:1})+' '+u}}return this.fmt(s)}closeRoom(clearHash=true){if(this.currentAreaId)this._scrollPositions.set(this.currentAreaId,this.sheetBody.scrollTop);if(this.dialog.open)this.dialog.close();this.currentAreaId=null;this.controlCard=null;this.sheetBody.replaceChildren();this.sheet.style.transform='';if(clearHash&&location.hash){history.replaceState(null,'',location.pathname+location.search);window.dispatchEvent(new Event('location-changed'))}}bindSwipe(){const interactive=e=>e.composedPath().some(n=>n?.matches?.('button,input,select,textarea,[role="slider"],a'));const start=e=>{if(e.touches?.length!==1||interactive(e))return;const fromHeader=e.composedPath().some(n=>n?.classList?.contains('sheet-head'));if(!fromHeader&&this.sheetBody.scrollTop>0)return;const t=e.touches[0];this._touch={x:t.clientX,y:t.clientY,dy:0,fromHeader};this.sheet.classList.add('dragging')},move=e=>{if(!this._touch||e.touches?.length!==1)return;if(!this._touch.fromHeader&&this.sheetBody.scrollTop>0){this.cancelSwipe();return}const t=e.touches[0],dy=t.clientY-this._touch.y,dx=t.clientX-this._touch.x;if(dy<=0||Math.abs(dx)>dy){this.sheet.style.transform='';return}this._touch.dy=dy;this.sheet.style.transform=`translateY(${Math.min(dy,240)}px)`;if(dy>8)e.preventDefault()},end=()=>{if(!this._touch)return;const close=this._touch.dy>96;this.cancelSwipe();if(close)this.closeRoom()};this.sheet.addEventListener('touchstart',start,{passive:true});this.sheet.addEventListener('touchmove',move,{passive:false});this.sheet.addEventListener('touchend',end,{passive:true});this.sheet.addEventListener('touchcancel',end,{passive:true})}cancelSwipe(){this._touch=null;this.sheet.classList.remove('dragging');this.sheet.style.transform=''}async openEditor(){if(!this.h||!HD2.REG?.load)return;await customElements.whenDefined('dashboard-preference-editor-v3');this.d=this.d||await HD2.REG.load(this.h);const areas=this.d.areas.map(a=>({id:a.area_id,name:a.name,meta:this.isOutdoor(a)?'Outdoor & utility':'Indoor',icon:a.icon||'mdi:home-outline'})),p=HD2.applyPrefs(areas,this.prefs);this.editor.open({title:'Edit rooms',description:'Rooms are discovered from Home Assistant Areas. Reorder them or hide rooms without changing the Area itself.',items:p.all,hidden:[...p.hidden],onSave:async v=>{this.prefs=v;await HD2.savePrefs(this.h,this.c.pref_key,v);this.rebuild()}})}}if(!customElements.get('component-room-directory-v4'))customElements.define('component-room-directory-v4',ComponentRoomDirectoryV4);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-room-directory-v4'))window.customCards.push({type:'component-room-directory-v4',name:'Room Directory V4',description:'Stable registry-driven rooms with full-height swipeable room sheets.'});
})();
}

// Module: src/components/home-overview.js
{
const {interaction,openMoreInfo}=globalThis.__HA_COMPONENT_LIBRARY_SHARED__;class ComponentHomeOverviewV4 extends HTMLElement{static getGridOptions(){return{columns:12,rows:'auto'}}constructor(){super();this.attachShadow({mode:'open'});this.c=null;this.h=null;this._children=new Map;this.built=false;this.building=false;this.timer=null;this._weatherInteraction=null;this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.top{min-height:44px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}.time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}.weather{appearance:none;border:0;min-height:44px;padding:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer}.weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}.sections{margin-top:8px}.section+.section{margin-top:16px}@media(max-width:520px){.time{font-size:13px}.weather{font-size:12px}}@media(max-width:350px){.time{font-size:12px}.weather{font-size:11px}}</style><ha-card><div class="top"><span class="time"></span><button class="weather" type="button"></button></div><div class="sections"></div></ha-card>`;this.sections=this.shadowRoot.querySelector('.sections');this._bindWeather()}setConfig(c){this.c={weather_entity:'weather.forecast_home',base_path:'/home-control',current_dashboard:'home-control',favourites_helpers:['input_text.dashboard_favourite_1','input_text.dashboard_favourite_2','input_text.dashboard_favourite_3','input_text.dashboard_favourite_4'],...c};this.renderHeader();this.ensure();this.tick()}set hass(h){this.h=h;for(const x of this._children.values())x.hass=h;this.renderHeader();if(!this.built)this.ensure()}connectedCallback(){this._bindWeather();this.tick();this.ensure()}disconnectedCallback(){this._weatherInteraction?.destroy();this._weatherInteraction=null;clearTimeout(this.timer)}getCardSize(){return 12}_bindWeather(){if(this._weatherInteraction)return;this._weatherInteraction=interaction(this.shadowRoot.querySelector('.weather'),{primary:()=>this.moreWeather(),feedback:true})}tick(){clearTimeout(this.timer);this.renderHeader();this.timer=setTimeout(()=>this.tick(),60000-Date.now()%60000+100)}renderHeader(){if(!this.c)return;const now=new Date(),zone=this.h?.config?.time_zone,loc=this.h?.locale?.language||navigator.language||'en-AU',locale=loc==='en'?'en-AU':loc;this.shadowRoot.querySelector('.time').textContent=new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',timeZone:zone}).format(now);const s=this.h?.states?.[this.c.weather_entity],a=s?.attributes||{},n=v=>Number.isFinite(Number(v))?new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(Number(v)):'—',temp=n(a.temperature)+(a.temperature_unit||'°C'),cloud=Number.isFinite(Number(a.cloud_coverage))?`Cloud ${Math.round(Number(a.cloud_coverage))}%`:'Cloud —',w=this.shadowRoot.querySelector('.weather');w.textContent=`${temp} · ${cloud}`;w.setAttribute('aria-label',`Outside ${temp}, ${cloud}. Open weather details.`)}moreWeather(){if(this.c?.weather_entity)openMoreInfo(this,this.c.weather_entity)}async ensure(){if(this.built||this.building||!this.c||!this.h)return;this.building=true;await Promise.all(['component-favourites-minimal-v1','component-smart-collection-v3','component-room-directory-v4','component-household-directory-v3'].map(x=>customElements.whenDefined(x)));if(!this.isConnected){this.building=false;return}const defs=[['favourites',()=>{const x=document.createElement('component-favourites-minimal-v1');x.setConfig({helpers:this.c.favourites_helpers,max:4,title:'Favourites'});return x}],['active',()=>{const x=document.createElement('component-smart-collection-v3');x.setConfig({mode:'active',title:'Active now',icon:'mdi:motion-play-outline',editable:false,pref_key:null});return x}],['rooms',()=>{const x=document.createElement('component-room-directory-v4');x.setConfig({mode:'home',title:'Rooms',icon:'mdi:floor-plan',pref_key:'home-control.rooms.v2',base_path:this.c.base_path,navigation_path:`${this.c.base_path}/rooms`});return x}],['household',()=>{const x=document.createElement('component-household-directory-v3');x.setConfig({pref_key:'home-control.household.v2',base_path:this.c.base_path,current_dashboard:this.c.current_dashboard});return x}]];for(const[id,make]of defs){const x=make();x.classList.add('section');x.hass=this.h;this._children.set(id,x);this.sections.append(x)}this.built=true;this.building=false}}if(!customElements.get('component-home-overview-v4'))customElements.define('component-home-overview-v4',ComponentHomeOverviewV4);window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type==='component-home-overview-v4'))window.customCards.push({type:'component-home-overview-v4',name:'Home Overview V4',description:'Stable minimal Home overview without state-refresh teardown.'});
}

// Module: src/components/solar-daylight-card.js
{
/** SolarDaylightCardV7 — reusable Solar dashboard daylight context card. */
const { formatTime, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class SolarDaylightCardV7 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._forecast=[];this._lastFetch=0;this._pending=false;this._updateSignature='';this._interaction=null}
  setConfig(c){const weather=(c||{}).weather_entity||'weather.forecast_home';this.c=c||{};this.sun=this.c.sun_entity||'sun.sun';if(weather!==this.weather){this._forecast=[];this._lastFetch=0}this.weather=weather;this._updateSignature=''}
  set hass(h){this.h=h;if(!this._built)this._build();this._update();this._fetch()}
  connectedCallback(){this._bindInteraction();this._fetch()}
  disconnectedCallback(){this._interaction?.destroy();this._interaction=null}
  getCardSize(){return 1}
  _build(){
    this._built=true;
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden}
button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.clouds{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.cloud-item{display:flex;align-items:baseline;gap:4px}.cloud-label{font-weight:500}.cloud-value{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.clouds{gap:10px}.cloud-item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.clouds{gap:7px}}
</style><ha-card><button type="button"><span class="phase"></span><span class="clouds"><span class="cloud-item"><span class="cloud-label">Cloud Coverage</span><span class="cloud-value now">—</span></span><span class="cloud-item"><span class="cloud-label">+4 Hours</span><span class="cloud-value plus4">—</span></span><span class="cloud-item"><span class="cloud-label">+8 Hours</span><span class="cloud-value plus8">—</span></span></span><span class="event"></span></button></ha-card>`;
    this.b=this.shadowRoot.querySelector('button');this.p=this.shadowRoot.querySelector('.phase');this.ev=this.shadowRoot.querySelector('.event');this.nowEl=this.shadowRoot.querySelector('.now');this.p4=this.shadowRoot.querySelector('.plus4');this.p8=this.shadowRoot.querySelector('.plus8');this._bindInteraction()
  }
  _bindInteraction(){if(!this.b||this._interaction)return;this._interaction=interaction(this.b,{primary:()=>this._more(this.sun),hold:()=>this._more(this.weather),optimistic:false,repeat:false,feedback:true})}
  _more(entityId){openMoreInfo(this,entityId)}
  _num(v,f=null){if(v===null||v===undefined||v==='')return f;const n=Number(v);return Number.isFinite(n)?n:f}
  _time(v){if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':formatTime(this.h,d)}
  _cloud(v){const n=this._num(v);return n===null?'—':`${Math.round(Math.min(100,Math.max(0,n)))}%`}
  _at(hours){if(!this._forecast.length)return null;const target=Date.now()+hours*3600000;let best=null,dist=Infinity;for(const x of this._forecast){const t=new Date(x.datetime||0).getTime(),v=this._num(x.cloud_coverage);if(!Number.isFinite(t)||v===null)continue;const d=Math.abs(t-target);if(d<dist){dist=d;best=v}}return dist<=90*60000?best:null}
  _forecastPayload(r){return r?.response?.[this.weather]||r?.service_response?.[this.weather]||r?.[this.weather]||r?.response?.service_response?.[this.weather]||null}
  _update(){
    if(!this.h||!this.b)return;
    const s=this.h.states[this.sun],w=this.h.states[this.weather],valid=s&&['above_horizon','below_horizon'].includes(s.state);
    let phase,event;
    if(!valid){phase='Sun state unavailable';event=''}else if(s.state==='above_horizon'){const elevation=this._num(s.attributes?.elevation,0),sunset=this._time(s.attributes?.next_setting);phase=`Sun ${Math.round(elevation)}°`;event=sunset?`Sunset ${sunset}`:'Daylight'}else{const sunrise=this._time(s.attributes?.next_rising);phase='Night';event=sunrise?`Sunrise ${sunrise}`:'Before sunrise'}
    const now=this._num(w?.attributes?.cloud_coverage),c4=this._at(4),c8=this._at(8);
    const nowText=this._cloud(now),plus4=this._cloud(c4),plus8=this._cloud(c8),signature=JSON.stringify([phase,event,nowText,plus4,plus8]);
    if(signature===this._updateSignature)return;this._updateSignature=signature;
    this.p.textContent=phase;this.ev.textContent=event;this.nowEl.textContent=nowText;this.p4.textContent=plus4;this.p8.textContent=plus8;
    this.b.setAttribute('aria-label',`${phase}, cloud coverage ${nowText}, plus 4 hours ${plus4}, plus 8 hours ${plus8}, ${event}. Tap for sun details; hold for weather details.`)
  }
  async _fetch(){
    if(!this.h||this._pending)return;const now=Date.now();if(now<(this._retryAt||0)||this._lastFetch&&now-this._lastFetch<30*60*1000)return;this._pending=true;
    const weather=this.weather;
    try{
      const r=await this.h.callWS({type:'call_service',domain:'weather',service:'get_forecasts',service_data:{type:'hourly'},target:{entity_id:this.weather},return_response:true});
      const x=this._forecastPayload(r);
      if(weather===this.weather){this._forecast=Array.isArray(x?.forecast)?x.forecast.slice(0,24):[];this._lastFetch=Date.now();this._failures=0;this._retryAt=0}
    }catch(_){if(weather===this.weather){this._failures=(this._failures||0)+1;this._retryAt=Date.now()+Math.min(5*60*1000,15000*2**(this._failures-1))}}
    this._pending=false;
    if(weather===this.weather)this._update();else this._fetch()
  }
}
registerCard({ type: "solar-daylight-card-v7", element: SolarDaylightCardV7, name: "Solar Daylight Context", description: "Full-width sun context with centred current and forecast cloud coverage." });
}

// Module: src/components/energy-history-card.js
{
/** EnergyHistoryCardV3 — reusable Solar dashboard history card. */
const { calendarDayRange, energyDayData, energyDayState, formatCalendarDay, formatPower, formatTime, interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class EnergyHistoryCardV3 extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._series={};this._loading=false;this._lastEnd=0;this._resizeObserver=null;this._resizeTimer=null;this._selectedDay=null;this._dayUnsubscribe=null;this._forceRefresh=false;this._pinned=false;this._pointerState=null;this._interactionHandles=[];this._retryAt=0;this._retryDelay=30000;this._retryTimer=null;this._profileListener=e=>{if(e.detail?.kind==='energy'&&e.detail?.profileId===this.c?.profile){energyDayData.invalidateProfile(this.h,this.c.profile);this._forceRefresh=true;this._lastRangeKey=null;this._scheduleFetch()}};this._outside=e=>{if(this._pinned&&!e.composedPath?.().includes(this)){this._pinned=false;this._hideTip()}}}
  setConfig(c){
    const next={profile:null,house_entity:'sensor.house_consumption_power',solar_entity:'sensor.total_solar_power',grid_entity:'sensor.refoss_smart_energy_monitor_em_channel_3_power',hours:24,bucket_minutes:10,calendar_day:false,day_channel:null,...(c||{})};
    if(next.profile)next.calendar_day=true;
    const changed=this.c&&['profile','house_entity','solar_entity','grid_entity','bucket_minutes','hours','calendar_day'].some(key=>this.c[key]!==next[key]);
    const channelChanged=this.c&&(this.c.day_channel!==next.day_channel||this.c.calendar_day!==next.calendar_day);
    this.c=next;
    if(channelChanged&&this.isConnected)this._bindDayChannel();
    if(changed){
      this._lastRangeKey=null;this._series={};this._retryAt=0;this._retryDelay=30000;clearTimeout(this._retryTimer);
      if(this._built&&this.h){this.e.status.hidden=false;this.e.status.textContent='Loading history…';this._hideTip();this._scheduleFetch()}
    }
  }
  set hass(h){this.h=h;if(this.c?.calendar_day&&this.c.day_channel)this._selectedDay=energyDayState.get(this.c.day_channel,h);if(!this._built)this._build();this._scheduleFetch()}
  connectedCallback(){window.addEventListener('pointerdown',this._outside,true);window.addEventListener('ha-component-profile-change',this._profileListener);this._bindDayChannel();this._bindInteractions();if(this.e?.chart)this._resizeObserver?.observe(this.e.chart);this._scheduleFetch()}
  disconnectedCallback(){window.removeEventListener('pointerdown',this._outside,true);window.removeEventListener('ha-component-profile-change',this._profileListener);this._dayUnsubscribe?.();this._dayUnsubscribe=null;for(const h of this._interactionHandles)h.destroy();this._interactionHandles=[];this._resizeObserver?.disconnect();clearTimeout(this._resizeTimer);clearTimeout(this._retryTimer);this._retryTimer=null;this._retryAt=0}
  getCardSize(){return 7}
  _build(){
    this._built=true;
    this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}.wrap{box-sizing:border-box;padding:4px 5px 5px}.top{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 5px;margin:0}.meta{font-size:13px;font-weight:600;color:var(--secondary-text-color);white-space:nowrap}.legend{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}.legend button{appearance:none;min-height:44px;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:12px;font-weight:600;padding:3px 0;display:flex;align-items:center;gap:6px;cursor:pointer}.legend button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:5px}.swatch{width:17px;height:3px;border-radius:999px;display:inline-block}.house-swatch{background:var(--primary-color)}.solar-swatch{background:var(--warning-color,#f5b942)}.grid-swatch{background:var(--secondary-text-color)}.chart{position:relative;width:100%;height:clamp(400px,48vw,520px)}.chart svg{display:block;width:100%;height:100%;overflow:hidden;touch-action:none}.axis{fill:var(--secondary-text-color);font-size:11px;font-weight:500;font-family:inherit}.axis-small{fill:var(--secondary-text-color);font-size:10px;font-weight:600;font-family:inherit}.gridline{stroke:var(--divider-color);stroke-width:1;opacity:.58}.zero{stroke:var(--divider-color);stroke-width:1.35;opacity:.95}.house-line{fill:none;stroke:var(--primary-color);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.solar-line{fill:none;stroke:var(--warning-color,#f5b942);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.solar-fill{fill:color-mix(in srgb,var(--warning-color,#f5b942) 12%,transparent)}.grid-line{fill:none;stroke:var(--secondary-text-color);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.cursor{stroke:var(--secondary-text-color);stroke-width:1;stroke-dasharray:3 3;opacity:0;vector-effect:non-scaling-stroke}.cursor-dot{stroke:var(--card-background-color);stroke-width:2.4;opacity:0;vector-effect:non-scaling-stroke}.cursor-dot.house{fill:var(--primary-color)}.cursor-dot.solar{fill:var(--warning-color,#f5b942)}.cursor-dot.grid{fill:var(--secondary-text-color)}.tooltip{position:absolute;z-index:2;min-width:150px;padding:10px 11px;border-radius:11px;background:var(--card-background-color);border:1px solid var(--divider-color);box-shadow:0 7px 22px rgba(0,0,0,.2);pointer-events:none;opacity:0;transform:translate(-50%,-100%);font-size:12px;line-height:1.45}.tooltip.show{opacity:1}.tooltip-time{font-size:12.5px;font-weight:650;color:var(--primary-text-color);margin-bottom:5px}.tip-row{display:flex;justify-content:space-between;gap:16px;color:var(--secondary-text-color)}.tip-row b{font-weight:650;color:var(--primary-text-color)}.status{position:absolute;inset:0;display:grid;place-items:center;color:var(--secondary-text-color);font-size:13px;pointer-events:none}.status[hidden]{display:none}@media(max-width:700px){.wrap{padding:3px}.top{padding:0 4px}.legend{gap:9px}.legend button{font-size:10.5px}.meta{font-size:13px}.chart{height:400px}.axis{font-size:10px}.axis-small{font-size:9.5px}.tooltip{font-size:11.5px;min-width:140px;padding:9px 10px}}
</style><ha-card><div class="wrap"><div class="top"><div class="meta"></div><div class="legend"><button class="house-key" type="button"><span class="swatch house-swatch"></span>House</button><button class="solar-key" type="button"><span class="swatch solar-swatch"></span>Solar</button><button class="grid-key" type="button"><span class="swatch grid-swatch"></span>Grid</button></div></div><div class="chart"><svg role="img" aria-label="Household power history"></svg><div class="tooltip"></div><div class="status">Loading history…</div></div></div></ha-card>`;
    this.e={meta:this.shadowRoot.querySelector('.meta'),svg:this.shadowRoot.querySelector('svg'),tip:this.shadowRoot.querySelector('.tooltip'),status:this.shadowRoot.querySelector('.status'),chart:this.shadowRoot.querySelector('.chart')};
    this.e.svg.setAttribute('tabindex','0');this.e.svg.addEventListener('keydown',e=>this._key(e));
    this._bindInteractions();
    this.e.svg.addEventListener('pointerdown',e=>this._pointerDown(e));
    this.e.svg.addEventListener('pointermove',e=>this._pointerMove(e));
    this.e.svg.addEventListener('pointerup',e=>this._pointerUp(e));
    this.e.svg.addEventListener('pointercancel',()=>{this._pointerState=null});
    this.e.svg.addEventListener('pointerleave',()=>{if(!this._pinned&&!this._pointerState)this._hideTip()});
    this._resizeObserver=new ResizeObserver(()=>{clearTimeout(this._resizeTimer);this._resizeTimer=setTimeout(()=>{this._hideTip();this._render()},40)});this._resizeObserver.observe(this.e.chart)
  }
  _bindInteractions(){if(!this.e||this._interactionHandles.length)return;this._interactionHandles.push(
      interaction(this.shadowRoot.querySelector('.house-key'),{primary:()=>this._more(this.c.house_entity),feedback:true}),
      interaction(this.shadowRoot.querySelector('.solar-key'),{primary:()=>this._more(this.c.solar_entity),feedback:true}),
      interaction(this.shadowRoot.querySelector('.grid-key'),{primary:()=>this._more(this.c.grid_entity),feedback:true}),
    )
  }
  _more(entityId){openMoreInfo(this,entityId)}
  _onDayChange(event){
    if(!this.c?.calendar_day||!this.c.day_channel||event?.detail?.channel!==this.c.day_channel)return;
    const day=String(event.detail.day||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||day===this._selectedDay)return;
    this._selectedDay=day;this._lastRangeKey=null;this._series={};
    if(this.e){this.e.status.hidden=false;this.e.status.textContent='Loading history…';this._hideTip()}
    this._scheduleFetch()
  }
  _bindDayChannel(){this._dayUnsubscribe?.();this._dayUnsubscribe=null;if(!this.c?.calendar_day||!this.c.day_channel)return;this._dayUnsubscribe=energyDayState.subscribe(this.c.day_channel,detail=>this._onDayChange({detail}),{hass:this.h})}
  _dayLabel(day){const today=energyDayState.today(this.h);if(day===today)return'Today';const options={weekday:'long',day:'numeric',month:'long'};if(String(day).slice(0,4)!==today.slice(0,4))options.year='numeric';return formatCalendarDay(this.h,day,options)}
  _range(){
    if(this.c.calendar_day){const today=energyDayState.today(this.h),day=this._selectedDay&&this._selectedDay<=today?this._selectedDay:today,bounds=calendarDayRange(this.h,day);return{...bounds,day,isToday:day===today}}
    const bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,end=Math.floor(Date.now()/bucket)*bucket,hours=Math.max(1,Number(this.c.hours)||24);return{start:end-hours*3600000,end,isToday:false}
  }
  _rangeKey(r){return `${r.day||''}:${r.start}:${r.end}:${r.isToday?Math.floor(Date.now()/300000):'fixed'}:${this.c.profile||''}:${this.c.house_entity}:${this.c.solar_entity}:${this.c.grid_entity}:${this.c.bucket_minutes}`}
  _scheduleFetch(){if(!this.c||Date.now()<this._retryAt)return;const r=this._range(),key=this._rangeKey(r);if(this._loading||(key===this._lastRangeKey&&!this._forceRefresh))return;this._fetch(r,key)}
  async _fetch(range,key){
    if(!this.h)return;const force=this._forceRefresh;this._forceRefresh=false;this._loading=true;this.e.status.hidden=false;this.e.status.textContent='Loading history…';
    try{
      const result=this.c.profile?await energyDayData.get(this.h,this.c.profile,range.day,{force}):await this.h.callWS({type:'recorder/statistics_during_period',start_time:new Date(range.start).toISOString(),end_time:new Date(range.end).toISOString(),statistic_ids:[this.c.house_entity,this.c.solar_entity,this.c.grid_entity],period:'5minute',types:['mean']});
      if(key!==this._rangeKey(this._range()))return;
      this._series=this.c.profile?{house:this._bucket(result?.series?.house||[]),solar:this._bucket(result?.series?.solar||[]),grid:this._bucket(result?.series?.grid||[])}:{house:this._bucket(result?.[this.c.house_entity]||[]),solar:this._bucket(result?.[this.c.solar_entity]||[]),grid:this._bucket(result?.[this.c.grid_entity]||[])};
      this._start=Number(result?.range?.start)||range.start;this._end=Number(result?.range?.end)||range.end;this._selectedRangeDay=range.day||null;this._lastRangeKey=key;this._retryAt=0;this._retryDelay=30000;clearTimeout(this._retryTimer);
      const hasData=Object.values(this._series).some(series=>series.length);
      this.e.status.hidden=hasData;
      if(!hasData)this.e.status.textContent='No recorded data for this day'
    }catch(err){
      if(key!==this._rangeKey(this._range()))return;
      this.e.status.hidden=false;this.e.status.textContent=this._series.house?.length||this._series.solar?.length||this._series.grid?.length?'History update unavailable':'History unavailable';this._retryAt=Date.now()+this._retryDelay;clearTimeout(this._retryTimer);this._retryTimer=setTimeout(()=>{this._retryAt=0;this._lastRangeKey=null;this._scheduleFetch()},this._retryDelay);this._retryDelay=Math.min(120000,this._retryDelay*2)
    }finally{
      const current=key===this._rangeKey(this._range());
      this._loading=false;if(current)this._render();this._scheduleFetch()
    }
  }
  _bucket(rows){
    const ms=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,m=new Map();
    for(const row of rows){const t=Number(row.t??row.start),v=Number(row.v??row.mean);if(!Number.isFinite(t)||!Number.isFinite(v))continue;const b=Math.floor(t/ms)*ms,x=m.get(b)||{sum:0,count:0};x.sum+=v;x.count+=1;m.set(b,x)}
    return [...m.entries()].map(([t,x])=>({t,v:x.sum/x.count})).sort((a,b)=>a.t-b.t)
  }
  _fmt(v){return formatPower(this.h,v)}
  _fmtExact(v){return formatPower(this.h,v)}
  _time(t){return formatTime(this.h,t)}
  _tickTime(t){const d=new Date(t);return d.getMinutes()===0?formatTime(this.h,t,{minute:undefined}):this._time(t)}
  _niceMax(v){if(v<=0)return1000;const mag=10**Math.floor(Math.log10(v)),n=v/mag;const nice=n<=1?1:n<=2?2:n<=5?5:10;return nice*mag}
  _seriesValue(series,t){if(!series?.length)return null;let best=null,dist=Infinity;for(const p of series){const d=Math.abs(p.t-t);if(d<dist){dist=d;best=p}}return dist<=6*60000?best.v:null}
  _paths(series,x,y,baseline=null){
    const parts=[];let fill='',last=null,segment=[];const flush=()=>{if(!segment.length)return;const d=segment.map((p,i)=>`${i?'L':'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');parts.push(d);if(baseline!==null){const first=segment[0],end=segment[segment.length-1];fill+=`${d} L${x(end.t).toFixed(1)},${baseline.toFixed(1)} L${x(first.t).toFixed(1)},${baseline.toFixed(1)} Z `}segment=[]};
    for(const p of series||[]){if(last!==null&&p.t-last>15*60000)flush();segment.push(p);last=p.t}flush();return{line:parts.join(' '),fill:fill.trim()}
  }
  _render(){
    if(!this.e||!this._end)return;
    const house=this._series.house||[],solar=this._series.solar||[],grid=this._series.grid||[];
    if(!house.length&&!solar.length&&!grid.length)return;
    const dayLabel=this.c.calendar_day?this._dayLabel(this._selectedRangeDay||this._selectedDay):null;
    this.e.meta.textContent=dayLabel?`${dayLabel} · ${this.c.bucket_minutes}-minute average`:`${this.c.bucket_minutes}-minute average`;
    this.e.svg.setAttribute('aria-label',dayLabel?`${dayLabel} household power history from midnight to midnight`:'Household power history');
    const rect=this.e.chart.getBoundingClientRect(),W=Math.max(320,Math.round(rect.width||800)),H=Math.max(340,Math.round(rect.height||420));
    this.e.svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const L=W<520?48:58,R=8,T=6,mainB=Math.round(H*.70),axisY=mainB+20,gridT=axisY+18,gridB=H-18,x0=L,x1=W-R,start=this._start,end=this._end;
    const x=t=>x0+(t-start)/(end-start)*(x1-x0);
    const mainValues=[...house,...solar].map(p=>Math.max(0,p.v)),yMax=this._niceMax(Math.max(1,...mainValues)*1.06),y=v=>mainB-(Math.max(0,v)/yMax)*(mainB-T);
    const gridAbs=Math.max(100,...grid.map(p=>Math.abs(p.v))),gridMax=this._niceMax(gridAbs*1.08),gridZero=(gridT+gridB)/2,yg=v=>gridZero-(v/gridMax)*((gridB-gridT)/2);
    const hp=this._paths(house,x,y),sp=this._paths(solar,x,y,mainB),gp=this._paths(grid,x,yg);
    let html='';
    for(let i=0;i<=4;i++){const v=yMax*(1-i/4),yy=T+(mainB-T)*(i/4);html+=`<line class="gridline" x1="${x0}" y1="${yy}" x2="${x1}" y2="${yy}"></line><text class="axis" x="${x0-8}" y="${yy+4}" text-anchor="end">${this._fmt(v)}</text>`}
    const ticks=W<520?4:W<820?6:8;
    for(let i=0;i<=ticks;i++){const t=start+(end-start)*i/ticks,xx=x(t);html+=`<text class="axis" x="${xx}" y="${axisY}" text-anchor="${i===0?'start':i===ticks?'end':'middle'}">${this._tickTime(t)}</text>`}
    html+=`<line class="zero" x1="${x0}" y1="${gridZero}" x2="${x1}" y2="${gridZero}"></line><text class="axis-small" x="${x1-2}" y="${gridT+10}" text-anchor="end">Import</text><text class="axis-small" x="${x1-2}" y="${gridB-3}" text-anchor="end">Export</text>`;
    if(sp.fill)html+=`<path class="solar-fill" d="${sp.fill}"></path>`;
    if(sp.line)html+=`<path class="solar-line" d="${sp.line}"></path>`;
    if(hp.line)html+=`<path class="house-line" d="${hp.line}"></path>`;
    if(gp.line)html+=`<path class="grid-line" d="${gp.line}"></path>`;
    html+=`<line class="cursor" x1="0" y1="${T}" x2="0" y2="${gridB}"></line><circle class="cursor-dot house" r="4.5"></circle><circle class="cursor-dot solar" r="4.5"></circle><circle class="cursor-dot grid" r="4"></circle>`;
    this.e.svg.innerHTML=html;this._geometry={W,H,L,R,T,mainB,gridT,gridB,x0,x1,start,end,x,y,yg}
  }
  _pointerDown(ev){this._pointerState={id:ev.pointerId,x:ev.clientX,y:ev.clientY,moved:false};this._pointer(ev)}
  _pointerMove(ev){if(this._pointerState?.id===ev.pointerId){if(Math.hypot(ev.clientX-this._pointerState.x,ev.clientY-this._pointerState.y)>6)this._pointerState.moved=true;this._pointer(ev);return}if(!this._pinned&&ev.pointerType!=='touch')this._pointer(ev)}
  _pointerUp(ev){const state=this._pointerState;if(!state||state.id!==ev.pointerId)return;this._pointerState=null;if(!state.moved){if(this._pinned){this._pinned=false;this._hideTip()}else{this._pointer(ev);this._pinned=true}}else{this._pinned=false;if(ev.pointerType==='touch')this._hideTip()}}
  _key(ev){if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)||!this._geometry)return;ev.preventDefault();const bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000;if(ev.key==='Home')this._keyboardTime=this._start;else if(ev.key==='End')this._keyboardTime=this._end-bucket;else this._keyboardTime=Math.max(this._start,Math.min(this._end-bucket,(this._keyboardTime??this._start)+(ev.key==='ArrowRight'?bucket:-bucket)));const rect=this.e.svg.getBoundingClientRect(),ratio=(this._keyboardTime-this._start)/(this._end-this._start);this._pointer({clientX:rect.left+ratio*rect.width});this._pinned=true}
  _pointer(ev){
    if(!this._geometry||!this._end)return;
    const rect=this.e.svg.getBoundingClientRect(),g=this._geometry,px=(ev.clientX-rect.left)*(g.W/rect.width),clamped=Math.max(g.x0,Math.min(g.x1,px)),ratio=(clamped-g.x0)/(g.x1-g.x0),rawT=g.start+ratio*(g.end-g.start),bucket=Math.max(5,Number(this.c.bucket_minutes)||10)*60000,t=Math.round(rawT/bucket)*bucket;
    const hv=this._seriesValue(this._series.house,t),sv=this._seriesValue(this._series.solar,t),gv=this._seriesValue(this._series.grid,t),xx=g.x(t),cursor=this.e.svg.querySelector('.cursor');cursor.setAttribute('x1',xx);cursor.setAttribute('x2',xx);cursor.style.opacity='1';
    const setDot=(cls,v,yy)=>{const d=this.e.svg.querySelector(`.cursor-dot.${cls}`);if(v===null){d.style.opacity='0';return}d.setAttribute('cx',xx);d.setAttribute('cy',yy(v));d.style.opacity='1'};setDot('house',hv,g.y);setDot('solar',sv,g.y);setDot('grid',gv,g.yg);
    const gridLabel=gv===null?'Grid':gv>=0?'Imported':'Exported';
    this.e.tip.innerHTML=`<div class="tooltip-time">${this._time(t)}</div><div class="tip-row"><span>House</span><b>${this._fmtExact(hv)}</b></div><div class="tip-row"><span>Solar</span><b>${this._fmtExact(sv)}</b></div><div class="tip-row"><span>${gridLabel}</span><b>${this._fmtExact(gv===null?null:Math.abs(gv))}</b></div>`;
    const localX=(xx/g.W)*rect.width,peak=Math.min(hv===null?Infinity:g.y(hv),sv===null?Infinity:g.y(sv),g.mainB),localY=(Math.max(g.T,peak-8)/g.H)*rect.height,tipHalf=Math.min(90,rect.width*.24);this.e.tip.style.left=`${Math.max(tipHalf,Math.min(rect.width-tipHalf,localX))}px`;this.e.tip.style.top=`${Math.max(66,localY)}px`;this.e.tip.classList.add('show')
  }
  _hideTip(){if(!this.e)return;this.e.tip.classList.remove('show');for(const el of this.e.svg.querySelectorAll('.cursor,.cursor-dot'))el.style.opacity='0'}
}
registerCard({ type: "energy-history-card-v3", element: EnergyHistoryCardV3, name: "Energy History", description: "Dense readable power history supporting rolling or local calendar-day ranges using completed 10-minute averages and a signed grid strip." });
}

// Module: src/components/energy-dashboard.js
{
/** ComponentEnergyDashboardV1 — thin composition wrapper preserving Energy styling. */
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentEnergyDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-energy", day_channel: "energy-day" };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // `children` is a read-only HTMLElement API. Keep composed cards in a
    // private map so construction works in every supported browser.
    this._children = new Map();
    this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}.layout{display:grid;gap:8px;grid-template-columns:minmax(0,1fr)}.context{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}@media(min-width:900px){.context{grid-template-columns:minmax(0,1fr)}}</style><div class="layout"><div class="selector"></div><div class="summary"></div><div class="context"><div class="daylight"></div></div><div class="history"></div></div>`;
  }
  setConfig(config) {
    this.config = {
      profile: "household-energy",
      day_channel: "energy-day",
      weather_entity: "weather.forecast_home",
      sun_entity: "sun.sun",
      ...config,
    };
    this.ensure();
  }
  set hass(hass) {
    this._hass = hass;
    for (const child of this._children.values()) child.hass = hass;
  }
  connectedCallback() { this.ensure(); }
  getCardSize() { return 12; }
  ensure() {
    if (!this.config) return;
    const definitions = [
      ["selector", "component-energy-day-selector-v1", { channel: this.config.day_channel }],
      ["summary", "component-energy-summary-v1", { profile: this.config.profile, day_channel: this.config.day_channel }],
      ["daylight", "solar-daylight-card-v7", { weather_entity: this.config.weather_entity, sun_entity: this.config.sun_entity }],
      ["history", "energy-history-card-v3", {
        profile: this.config.profile,
        calendar_day: true,
        day_channel: this.config.day_channel,
        bucket_minutes: 10,
        house_entity: "sensor.ha_component_house_power",
        solar_entity: "sensor.ha_component_solar_power",
        grid_entity: "sensor.ha_component_grid_power",
      }],
    ];
    for (const [slot, type, childConfig] of definitions) {
      let child = this._children.get(slot);
      if (!child) {
        child = document.createElement(type);
        this.shadowRoot.querySelector(`.${slot}`).append(child);
        this._children.set(slot, child);
      }
      child.setConfig(childConfig);
      if (this._hass) child.hass = this._hass;
    }
  }
}

registerCard({ type: "component-energy-dashboard-v1", element: ComponentEnergyDashboardV1, name: "Energy Dashboard V1", description: "Single-card Energy composition using shared day state and one backend data contract." });
}

// Module: src/patches/split-profiles-core.js
{
/** Live split-controller saved-profile core patch backed by ha_component_backend. */
(()=>{const TAG="component-split-controller-v4";const SLOT_COUNT=5;const escRoom=card=>card?.config?.room_id||card?.config?.profile_area_id||globalThis.__componentSplitRegistryV4?.result?.systems?.get(card?.config?.entity)?.room_id||null;customElements.whenDefined(TAG).then(()=>{const Card=customElements.get(TAG),P=Card?.prototype;if(!P||P.__splitProfilesCoreV2)return;P.__splitProfilesCoreV2=!0;const originalSetConfig=P.setConfig;P.setConfig=function(config){this._profileEditV1=null,this._profileBusyV1=!1,this._profileMessageV1=null,this._profileLocalProfilesV1=null;return originalSetConfig.call(this,config)};P.profileSlotsV1=function(){const roomId=escRoom(this);return roomId?Array.from({length:SLOT_COUNT},(_,index)=>`${roomId}:${index}`):[]};P.profileRowsV1=function(){const roomId=escRoom(this);if(!roomId)return[];const profiles=Array.isArray(this._profileLocalProfilesV1)?this._profileLocalProfilesV1:Array.isArray(this.config?.profiles)?this.config.profiles:[];return Array.from({length:SLOT_COUNT},(_,index)=>{const profile=profiles[index]??null;if(!profile)return{index,entityId:`${roomId}:${index}`,available:!0,raw:"",profile:null,invalid:!1};try{if(!profile||profile.v!==1||typeof profile.n!=="string"||!profile.n.trim()||typeof profile.m!=="string")throw new Error("Invalid profile");return{index,entityId:`${roomId}:${index}`,available:!0,raw:JSON.stringify(profile),profile,invalid:!1}}catch{return{index,entityId:`${roomId}:${index}`,available:!0,raw:JSON.stringify(profile),profile:null,invalid:!0}}})};P.profileReadyV1=function(){return Boolean(escRoom(this)&&Array.isArray(this.profileRowsV1())&&this.profileRowsV1().length===SLOT_COUNT)};P.profileActiveV1=function(profile){if(!profile)return!1;const state=this.Z();if(state.uv||state.state?.state==="off")return!1;if(state.state?.state!==profile.m)return!1;if(Number.isFinite(profile.t)&&["heat","cool","auto"].includes(profile.m)){const current=this.K(state.attributes?.temperature),wanted=this.Et(profile.t);if(current===null||wanted===null||Math.abs(current-wanted)>.001)return!1}if(profile.f&&state.attributes?.fan_mode!==profile.f)return!1;for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";if(profile[key]&&vane.state!==profile[key])return!1}return!0};P.profileSummaryV1=function(profile){const parts=[this.tt(profile.m)];Number.isFinite(profile.t)&&["heat","cool","auto"].includes(profile.m)&&parts.push(this.it(profile.t));profile.f&&parts.push(this.tt(profile.f));profile.vv&&parts.push(`V ${this.$t(profile.vv,"vertical")}`);profile.hv&&parts.push(`H ${this.$t(profile.hv,"horizontal")}`);return parts.filter(Boolean).join(" · ")};P.profileDraftV1=function(profile=null){const state=this.Z(),modes=this.ft(),fans=this.bt(),vanes=this.vt();let mode=profile?.m;if(!modes.includes(mode)){const current=state.state?.state;mode=modes.includes(current)&&current!=="off"&&current||this.gt()||(modes.includes("cool")?"cool":modes[0])||""}let temperature=Number.isFinite(profile?.t)?profile.t:this.K(state.attributes?.temperature);if(temperature===null||!Number.isFinite(temperature))temperature=22;temperature=this.Et(temperature)??temperature;let fan=profile?.f??null;if(fan&&!fans.includes(fan))fan=null;if(!profile&&fans.includes(state.attributes?.fan_mode))fan=state.attributes.fan_mode;const draft={n:profile?.n??"",m:mode,t:temperature,f:fan,vv:null,hv:null};for(const vane of vanes){const key=vane.axis==="vertical"?"vv":"hv",saved=profile?.[key];draft[key]=saved&&vane.qs.includes(saved)?saved:!profile&&vane.qs.includes(vane.state)?vane.state:null}return draft};P.profileNormaliseV1=function(draft){const name=String(draft?.n??"").trim(),modes=this.ft();if(!name)throw new Error("Enter a profile name.");if(name.length>24)throw new Error("Profile names can be up to 24 characters.");if(!modes.includes(draft.m))throw new Error("Choose an available mode.");const profile={v:1,n:name,m:draft.m};if(["heat","cool","auto"].includes(draft.m)){const temperature=this.Et(draft.t);if(temperature===null)throw new Error("Choose a valid target temperature.");profile.t=temperature}const fans=this.bt();draft.f&&fans.includes(draft.f)&&(profile.f=draft.f);for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";draft[key]&&vane.qs.includes(draft[key])&&(profile[key]=draft[key])}return profile};P.profileStoreV1=async function(){const roomId=escRoom(this);if(this._profileBusyV1||!this._profileEditV1||!roomId)return;const rows=this.profileRowsV1();let profile;try{profile=this.profileNormaliseV1(this._profileEditV1.draft)}catch(error){this._profileMessageV1={text:error.message,type:"error"},this.St();return}const duplicate=rows.find(row=>row.profile&&row.index!==this._profileEditV1.index&&row.profile.n.trim().toLowerCase()===profile.n.trim().toLowerCase());if(duplicate){this._profileMessageV1={text:"A profile with that name already exists.",type:"error"},this.St();return}let row=this._profileEditV1.index===null?rows.find(candidate=>candidate.available&&!candidate.profile&&!candidate.invalid):rows[this._profileEditV1.index];if(this._profileEditV1.index===null&&!row){this._profileMessageV1={text:`Maximum of ${SLOT_COUNT} profiles reached.`,type:"error"},this.St();return}this._profileBusyV1=!0,this._profileMessageV1={text:"Saving profile…",type:"info"},this.St();try{await this.P.callService("ha_component_backend","upsert_profile",{room_id:roomId,index:row.index,profile});const profiles=rows.filter(candidate=>candidate.profile).map(candidate=>candidate.profile);profiles[row.index]=profile;this._profileLocalProfilesV1=profiles.filter(Boolean),this._profileEditV1=null,this._profileMessageV1={text:`${profile.n} saved.`,type:"info"}}catch{this._profileMessageV1={text:"Could not save the profile.",type:"error"}}finally{this._profileBusyV1=!1,this.St(!0),this.H()}};P.profileDeleteV1=async function(){const roomId=escRoom(this);if(this._profileBusyV1||this._profileEditV1?.index===null||!roomId)return;const row=this.profileRowsV1()[this._profileEditV1.index];if(!row?.available)return;const name=row.profile?.n||"Profile";this._profileBusyV1=!0,this._profileMessageV1={text:"Deleting profile…",type:"info"},this.St();try{await this.P.callService("ha_component_backend","remove_profile",{room_id:roomId,index:row.index});const profiles=this.profileRowsV1().filter(candidate=>candidate.profile&&candidate.index!==row.index).map(candidate=>candidate.profile);this._profileLocalProfilesV1=profiles,this._profileEditV1=null,this._profileMessageV1={text:`${name} deleted.`,type:"info"}}catch{this._profileMessageV1={text:"Could not delete the profile.",type:"error"}}finally{this._profileBusyV1=!1,this.St(!0),this.H()}};P.profileApplyV1=async function(profile){if(this._profileBusyV1||!profile)return;const state=this.Z();if(state.uv){this._profileMessageV1={text:"The split system is currently unavailable.",type:"error"},this.St();return}const modes=this.ft();if(!modes.includes(profile.m)){this._profileMessageV1={text:`${profile.n} uses a mode that is no longer available.`,type:"error"},this.St();return}this._profileBusyV1=!0,this._profileMessageV1={text:`Applying ${profile.n}…`,type:"info"},this.St();try{if(Number.isFinite(profile.t)&&["heat","cool","auto"].includes(profile.m)){const temperature=this.Et(profile.t);if(temperature===null)throw new Error("Invalid target");await this.P.callService("climate","set_temperature",{entity_id:this.config.entity,temperature,hvac_mode:profile.m})}else await this.P.callService("climate","set_hvac_mode",{entity_id:this.config.entity,hvac_mode:profile.m});const calls=[];profile.f&&this.bt().includes(profile.f)&&calls.push(this.P.callService("climate","set_fan_mode",{entity_id:this.config.entity,fan_mode:profile.f}));for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";profile[key]&&vane.qs.includes(profile[key])&&calls.push(this.P.callService("select","select_option",{entity_id:vane.entityId,option:profile[key]}))}await Promise.all(calls),this._profileMessageV1=null,this.Tt(`${profile.n} profile requested.`),this.M(!0)}catch{this._profileMessageV1={text:`Could not apply ${profile.n}.`,type:"error"},this.St()}finally{this._profileBusyV1=!1,this.H()}}})})();
}

// Module: src/patches/split-profiles-ui.js
{
/** Live split-controller saved-profile UI patch. */
(()=>{const TAG="component-split-controller-v4";const SLOT_COUNT=5;const install=()=>customElements.whenDefined(TAG).then(()=>{const Card=customElements.get(TAG);const P=Card?.prototype;if(!P)return;if(!P.profileSlotsV1){setTimeout(install,50);return;}if(P.__splitProfilesUiV1)return;P.__splitProfilesUiV1=true;const originalRender=P.R;const originalSignature=P.V;const originalRefresh=P.H;const originalAvailable=P.kt;const originalPanelRender=P.St;const originalClose=P.M;P.profileChoiceV1=function({title,key,options,value,optional=false,label,icon,onChange,}){const group=document.createElement("div");group.className="og";if(title){const heading=document.createElement("div");heading.className="gt";heading.textContent=title;group.append(heading);}const list=document.createElement("div");list.className="qs";list.setAttribute("role","listbox");list.setAttribute("aria-label",title||key);const choices=optional?[null,...options]:options;choices.forEach((choice,index)=>{const button=document.createElement("button");button.type="button";button.className="o";button.dataset.focusKey=`profile-${key}-${choice ?? "keep"}`;this.It(button,button.dataset.focusKey);button.setAttribute("role","option");button.setAttribute("aria-selected",String(choice===value));button.disabled=this._profileBusyV1;button.tabIndex=choice===value||(!choices.includes(value)&&index===0)?0:-1;const choiceIcon=document.createElement("ha-icon");choiceIcon.className="oi";choiceIcon.setAttribute("icon",choice===null?"mdi:minus-circle-outline":icon(choice),);const text=document.createElement("span");text.textContent=choice===null?"Keep current":label(choice);button.append(choiceIcon,text);if(choice===value){const check=document.createElement("ha-icon");check.setAttribute("icon","mdi:check");button.append(check);}else{button.append(document.createElement("span"));}button.addEventListener("click",()=>{if(this._profileBusyV1||choice===value)return;onChange(choice);this.St();});button.addEventListener("keydown",(event)=>this.Pt(event,list));list.append(button);});group.append(list);return group;};P.profileRenderListV1=function(focusInitial=false){const rows=this.profileRowsV1();const saved=rows.filter((row)=>row.profile);const invalid=rows.filter((row)=>row.invalid);const body=this.$.pb;body.replaceChildren();if(!saved.length){const empty=document.createElement("div");empty.className="pempty";empty.innerHTML="<ha-icon icon=\"mdi:account-plus-outline\"></ha-icon><strong>No saved profiles</strong><span>Create one from the split system's current settings, then adjust it before saving.</span>";body.append(empty);}else{const list=document.createElement("div");list.className="plist";for(const row of saved){const profile=row.profile;const active=this.profileActiveV1(profile);const wrap=document.createElement("div");wrap.className="prow";const apply=document.createElement("button");apply.type="button";apply.className="papply";apply.dataset.focusKey=`profile-apply-${row.index}`;this.It(apply,apply.dataset.focusKey);apply.disabled=this._profileBusyV1||this.Z().uv;apply.setAttribute("aria-current",active?"true":"false");const modeIcon=document.createElement("ha-icon");modeIcon.className="pmi";modeIcon.setAttribute("icon",this.et(profile.m));const copy=document.createElement("span");copy.className="pcopy";const name=document.createElement("strong");name.textContent=profile.n;const summary=document.createElement("small");summary.textContent=this.profileSummaryV1(profile);copy.append(name,summary);const status=document.createElement("ha-icon");status.className="pstatus";status.setAttribute("icon",active?"mdi:check-circle":"mdi:chevron-right",);apply.append(modeIcon,copy,status);apply.addEventListener("click",()=>this.profileApplyV1(profile));const edit=document.createElement("button");edit.type="button";edit.className="pedit";edit.dataset.focusKey=`profile-edit-${row.index}`;this.It(edit,edit.dataset.focusKey);edit.disabled=this._profileBusyV1;edit.setAttribute("aria-label",`Edit ${profile.n}`);const editIcon=document.createElement("ha-icon");editIcon.setAttribute("icon","mdi:pencil-outline");edit.append(editIcon);edit.addEventListener("click",()=>{this._profileEditV1={index:row.index,draft:this.profileDraftV1(profile),};this._profileMessageV1=null;this.u="profile-name";this.St(true);});wrap.append(apply,edit);list.append(wrap);}body.append(list);}if(invalid.length){const warning=document.createElement("div");warning.className="pmsg error";warning.textContent="One saved profile could not be read. Delete or recreate the affected profile.";body.append(warning);}const create=document.createElement("button");create.type="button";create.className="pnew";create.dataset.focusKey="profile-new";this.It(create,create.dataset.focusKey);const emptySlot=rows.some((row)=>row.available&&!row.profile&&!row.invalid,);create.disabled=this._profileBusyV1||!emptySlot;const addIcon=document.createElement("ha-icon");addIcon.setAttribute("icon","mdi:plus");const addText=document.createElement("span");addText.textContent=emptySlot?"Create profile":`${SLOT_COUNT} profile limit reached`;create.append(addIcon,addText);create.addEventListener("click",()=>{if(!emptySlot||this._profileBusyV1)return;this._profileEditV1={index:null,draft:this.profileDraftV1(),};this._profileMessageV1=null;this.u="profile-name";this.St(true);});body.append(create);if(this._profileMessageV1){const message=document.createElement("div");message.className=`pmsg ${
          this._profileMessageV1.type === "error" ? "error" : ""
        }`;message.setAttribute("role","status");message.textContent=this._profileMessageV1.text;body.append(message);}const focusKey=this.u;if(focusKey||focusInitial){queueMicrotask(()=>{const target=focusKey?body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`,):body.querySelector("button:not([disabled])");target?.focus();});}};P.profileRenderEditorV1=function(focusInitial=false){const edit=this._profileEditV1;if(!edit)return;const draft=edit.draft;const body=this.$.pb;body.replaceChildren();const intro=document.createElement("p");intro.className="pintro";intro.textContent=edit.index===null?"Current settings are used as the starting point. Only settings saved here will change when the profile is applied.":"Adjust the saved settings below. Changes do not affect the split system until the profile is applied.";body.append(intro);const nameWrap=document.createElement("label");nameWrap.className="pname";nameWrap.textContent="Profile name";const input=document.createElement("input");input.type="text";input.maxLength=24;input.placeholder="e.g. Sleep";input.value=draft.n;input.dataset.focusKey="profile-name";this.It(input,input.dataset.focusKey);input.disabled=this._profileBusyV1;input.addEventListener("input",()=>{draft.n=input.value;this._profileMessageV1=null;});nameWrap.append(input);body.append(nameWrap);const modes=this.ft();body.append(this.profileChoiceV1({title:"Mode",key:"mode",options:modes,value:draft.m,label:(value)=>this.tt(value),icon:(value)=>this.et(value),onChange:(value)=>{draft.m=value;},}),);if(["heat","cool","auto"].includes(draft.m)){const attrs=this.Z().attributes;const step=this.K(attrs.target_temp_step)??0.5;const{minimum,maximum}=this.dt();const tempGroup=document.createElement("div");tempGroup.className="og";const heading=document.createElement("div");heading.className="gt";heading.textContent="Target temperature";const stepper=document.createElement("div");stepper.className="pstep";const down=document.createElement("button");down.type="button";down.dataset.focusKey="profile-temp-down";this.It(down,down.dataset.focusKey);down.disabled=this._profileBusyV1||(minimum!==null&&Number(draft.t)<=minimum);down.setAttribute("aria-label","Decrease profile target temperature");const downIcon=document.createElement("ha-icon");downIcon.setAttribute("icon","mdi:minus");down.append(downIcon);const value=document.createElement("strong");value.textContent=this.it(draft.t)??"—";const up=document.createElement("button");up.type="button";up.dataset.focusKey="profile-temp-up";this.It(up,up.dataset.focusKey);up.disabled=this._profileBusyV1||(maximum!==null&&Number(draft.t)>=maximum);up.setAttribute("aria-label","Increase profile target temperature");const upIcon=document.createElement("ha-icon");upIcon.setAttribute("icon","mdi:plus");up.append(upIcon);const adjust=(direction)=>{const base=Number(draft.t);if(!Number.isFinite(base))return;const next=this.Dt(base+direction*step,step,minimum??base,);draft.t=this.Et(next)??next;this.St();};down.addEventListener("click",()=>adjust(-1));up.addEventListener("click",()=>adjust(1));stepper.append(down,value,up);tempGroup.append(heading,stepper);body.append(tempGroup);}const fans=this.bt();if(fans.length){body.append(this.profileChoiceV1({title:"Fan",key:"fan",options:fans,value:draft.f,optional:true,label:(value)=>this.tt(value),icon:(value)=>({auto:"mdi:fan-auto",quiet:"mdi:volume-low",low:"mdi:fan-speed-1",medium:"mdi:fan-speed-2",high:"mdi:fan-speed-3",})[String(value).toLowerCase()]??"mdi:fan",onChange:(value)=>{draft.f=value;},}),);}for(const vane of this.vt()){const key=vane.axis==="vertical"?"vv":"hv";body.append(this.profileChoiceV1({title:vane.title,key,options:vane.qs,value:draft[key],optional:true,label:(value)=>this.$t(value,vane.axis),icon:(value)=>this.At(vane,value),onChange:(value)=>{draft[key]=value;},}),);}if(this._profileMessageV1){const message=document.createElement("div");message.className=`pmsg ${
          this._profileMessageV1.type === "error" ? "error" : ""
        }`;message.setAttribute("role","status");message.textContent=this._profileMessageV1.text;body.append(message);}const actions=document.createElement("div");actions.className=`pactions ${edit.index !== null ? "editing" : ""}`;if(edit.index!==null){const remove=document.createElement("button");remove.type="button";remove.className="pdelete";remove.dataset.focusKey="profile-delete";this.It(remove,remove.dataset.focusKey);remove.disabled=this._profileBusyV1;remove.textContent="Delete";remove.addEventListener("click",()=>this.profileDeleteV1());actions.append(remove);}const cancel=document.createElement("button");cancel.type="button";cancel.dataset.focusKey="profile-cancel";this.It(cancel,cancel.dataset.focusKey);cancel.disabled=this._profileBusyV1;cancel.textContent="Cancel";cancel.addEventListener("click",()=>{this._profileEditV1=null;this._profileMessageV1=null;this.u="profile-new";this.St(true);});const save=document.createElement("button");save.type="button";save.className="psave";save.dataset.focusKey="profile-save";this.It(save,save.dataset.focusKey);save.disabled=this._profileBusyV1||!String(draft.n??"").trim();save.textContent=this._profileBusyV1?"Saving…":"Save";save.addEventListener("click",()=>this.profileStoreV1());actions.append(cancel,save);body.append(actions);const focusKey=this.u;if(focusKey||focusInitial){queueMicrotask(()=>{const target=focusKey?body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`,):input;target?.focus();});}};P.R=function(...args){const result=originalRender.apply(this,args);if(this.$?.pr)return result;this._profileOverridesV1??=new Map();this._profileEditV1??=null;this._profileBusyV1??=false;this._profileMessageV1??=null;const profileButton=document.createElement("button");profileButton.className="pw pr";profileButton.type="button";profileButton.dataset.panel="profiles";profileButton.setAttribute("aria-controls","split-secondary");profileButton.setAttribute("aria-expanded","false");profileButton.setAttribute("aria-label","Saved profiles");const icon=document.createElement("ha-icon");icon.setAttribute("icon","mdi:account-circle-outline");profileButton.append(icon);this.$.sg?.before(profileButton);this.$.pr=profileButton;profileButton.addEventListener("click",()=>this.U("profiles",profileButton),);const style=document.createElement("style");style.textContent=`
        .hd.profiled{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}
        .hd.settings.profiled{grid-template-columns:minmax(0,1fr) 44px 44px 44px;gap:8px}
        .plist{display:grid;gap:8px}
        .prow{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:8px}
        .papply{min-height:58px;padding:8px 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:24px minmax(0,1fr) 20px;align-items:center;gap:10px;text-align:left;background:transparent}
        .papply[aria-current=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}
        .pmi{color:var(--secondary-text-color);--mdc-icon-size:20px}.papply[aria-current=true] .pmi{color:var(--primary-color)}
        .pcopy{min-width:0}.pcopy strong,.pcopy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pcopy strong{font-size:13px;line-height:1.25;font-weight:650}.pcopy small{margin-top:4px;color:var(--secondary-text-color);font-size:12px;line-height:1.2;font-weight:400}
        .pstatus{color:var(--secondary-text-color);--mdc-icon-size:18px}.papply[aria-current=true] .pstatus{color:var(--primary-color)}
        .pedit{width:44px;min-height:58px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}
        .pnew{width:100%;min-height:46px;margin-top:12px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:var(--primary-color);font-size:13px;font-weight:650}
        .pempty{min-height:126px;padding:20px 16px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--secondary-text-color)}
        .pempty ha-icon{--mdc-icon-size:28px;color:var(--primary-color)}.pempty strong{margin-top:10px;color:var(--primary-text-color);font-size:14px}.pempty span{max-width:280px;margin-top:5px;font-size:12px;line-height:1.4}
        .pintro{margin:0 0 12px;color:var(--secondary-text-color);font-size:12px;line-height:1.4}
        .pname{display:block;margin-bottom:12px;color:var(--secondary-text-color);font-size:13px;font-weight:600}.pname input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent}
        .pstep{display:grid;grid-template-columns:44px minmax(90px,1fr) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);overflow:hidden}.pstep button{width:44px;height:46px;display:grid;place-items:center}.pstep strong{text-align:center;font-size:18px;font-variant-numeric:tabular-nums}
        .pmsg{margin-top:10px;color:var(--secondary-text-color);font-size:12px;line-height:1.35}.pmsg.error{color:var(--error-color)}
        .pactions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--divider-color)}.pactions.editing{grid-template-columns:1fr 1fr 1fr}.pactions button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.pactions .psave{color:var(--primary-color)}.pactions .pdelete{color:var(--error-color)}
        @media(max-width:420px){.pactions.editing{grid-template-columns:1fr 1fr}.pactions.editing .pdelete{grid-column:1/-1;grid-row:2}}
      `;this.shadowRoot.append(style);return result;};P.V=function(){const base=originalSignature.call(this);const profiles=this.profileRowsV1().map(row=>row.raw);return`${base}|${JSON.stringify(profiles)}`;};P.kt=function(){if(this.o==="profiles")return this.profileReadyV1();return originalAvailable.call(this);};P.H=function(){const result=originalRefresh.call(this);if(!this.$?.pr)return result;const ready=this.profileReadyV1();this.$.pr.hidden=!ready;this.$.hd.classList.toggle("profiled",ready);const active=ready?this.profileRowsV1().find((row)=>row.profile&&this.profileActiveV1(row.profile),):null;this.$.pr.classList.toggle("on",Boolean(active));this.$.pr.querySelector("ha-icon")?.setAttribute("icon",active?"mdi:account-check-outline":"mdi:account-circle-outline",);this.$.pr.setAttribute("aria-label",active?`Saved profiles · ${active.profile.n} active`:"Saved profiles",);this.$.pr.setAttribute("aria-expanded",String(this.o==="profiles"),);return result;};P.St=function(focusInitial=false){if(this.o!=="profiles"){return originalPanelRender.call(this,focusInitial);}if(!this.profileReadyV1())return;this.$.pt.textContent=this._profileEditV1?.index===null?"New profile":this._profileEditV1?"Edit profile":"Saved profiles";if(this._profileEditV1){this.profileRenderEditorV1(focusInitial);}else{this.profileRenderListV1(focusInitial);}};P.M=function(restoreFocus){const wasProfiles=this.o==="profiles";const result=originalClose.call(this,restoreFocus);if(wasProfiles){this._profileEditV1=null;this._profileMessageV1=null;this.u=null;}return result;};});install();})();
}

// Module: src/patches/wled-registry-integration.js
{
/** Registers WLED as a dynamic dashboard control without changing its UI. */
const { WLED_HD, WLED_DOMAIN, WLED_NAME } =
  globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

if(!WLED_HD.__wledComponentPatchV1){
  WLED_HD.__wledComponentPatchV1=true;
  const oldUi=WLED_HD.uiEntry;
  WLED_HD.uiEntry=e=>{if(!oldUi?.(e))return false;if(e?.platform!=='wled')return true;if(WLED_DOMAIN(e.entity_id)!=='light')return false;const n=WLED_NAME(e),u=String(e.unique_id||'');return n==='main'||!/_\d+$/.test(u)};
  const oldControl=WLED_HD.controlConfig;
  WLED_HD.controlConfig=(e,s,d,h,split)=>e?.platform==='wled'&&WLED_DOMAIN(e.entity_id)==='light'?{type:'custom:component-wled-controller-v1',entity:e.entity_id,device_id:e.device_id}:oldControl?.(e,s,d,h,split)||null;
  WLED_HD.REG?.refresh?.();
}
}

// Module: src/patches/wled-controller-current-behaviour.js
{
/** Preserves the current WLED controller runtime patch from Home Assistant. */
customElements.whenDefined('component-wled-controller-v1').then(()=>{
  const C=customElements.get('component-wled-controller-v1');
  if(!C||C.prototype.__stateAwareV3)return;
  C.prototype.__stateAwareV3=true;

  const usable=(h,id)=>{
    const s=h?.states?.[id];
    return Boolean(s&&!['unknown','unavailable'].includes(String(s.state).toLowerCase()));
  };

  const originalRender=C.prototype.render;
  C.prototype.render=function(){
    originalRender?.call(this);
    if(!this.h||!this.b)return;

    const main=this.h.states[this.b.main];
    const state=String(main?.state||'unavailable').toLowerCase();
    const on=state==='on';
    const controllable=state==='on'||state==='off';
    const body=this.shadowRoot?.querySelector('.body');

    if(body)body.style.display=on?'grid':'none';
    if(this.power)this.power.disabled=!controllable;

    if(!on&&this.dialog?.open)this.dialog.close();

    if(this.statusEl){
      if(state==='unavailable')this.statusEl.textContent='Unavailable';
      else if(state==='unknown')this.statusEl.textContent='Unknown';
      else if(state==='off')this.statusEl.textContent='Off';
    }

    if(this.sheetState){
      if(state==='unavailable')this.sheetState.textContent='Unavailable';
      else if(state==='unknown')this.sheetState.textContent='Unknown';
      else if(state==='off')this.sheetState.textContent='Off';
    }

    const presetOk=Boolean(this.b.preset&&usable(this.h,this.b.preset));
    const effectOk=(this.b.effectLights||[]).some(id=>usable(this.h,id));
    const paletteOk=(this.b.palettes||[]).some(id=>usable(this.h,id));
    const speedOk=(this.b.speeds||[]).some(id=>usable(this.h,id));
    const intensityOk=(this.b.intensities||[]).some(id=>usable(this.h,id));

    if(this.presetsBtn)this.presetsBtn.disabled=!on||!presetOk;
    if(this.colour)this.colour.disabled=!on||!effectOk;
    if(this.nativeColour)this.nativeColour.disabled=!on||!effectOk;
    if(this.effect)this.effect.disabled=!on||!effectOk;
    if(this.palette)this.palette.disabled=!on||!paletteOk;
    if(this.speed)this.speed.disabled=!on||!speedOk;
    if(this.intensity)this.intensity.disabled=!on||!intensityOk;
    if(this.advanced)this.advanced.disabled=!on||!(presetOk||effectOk||paletteOk||speedOk||intensityOk);
  };

  const originalOpenAdvanced=C.prototype.openAdvanced;
  C.prototype.openAdvanced=function(presets=false){
    const state=String(this.h?.states?.[this.b?.main]?.state||'unavailable').toLowerCase();
    if(state!=='on')return;
    return originalOpenAdvanced?.call(this,presets);
  };
});
}

// Module: src/patches/room-navigation-current-behaviour.js
{
/** Preserves the current room-navigation runtime patch from Home Assistant. */
customElements.whenDefined('component-room-navigation-v1').then(()=>{
  const Card=customElements.get('component-room-navigation-v1');
  const P=Card?.prototype;
  if(!P||P.__presenceGlowV1)return;
  P.__presenceGlowV1=true;

  P._presenceDetected=function(){
    if(this.c?.demo_presence===true)return true;
    if(this.c?.demo_presence===false)return false;
    const explicit=this.c?.presence_entity;
    if(explicit){
      const state=this._hass?.states?.[explicit];
      return !!state&&['on','home','occupied','present','detected'].includes(String(state.state).toLowerCase());
    }
    const states=typeof this._entities==='function'?this._entities():[];
    return states.some(state=>{
      if(!state?.entity_id?.startsWith('binary_sensor.')||state.state!=='on')return false;
      const cls=String(state.attributes?.device_class||'').toLowerCase();
      const identity=(state.entity_id+' '+String(state.attributes?.friendly_name||'')).toLowerCase();
      return cls==='occupancy'||cls==='presence'||identity.includes('presence')||identity.includes('occupancy')||identity.includes('mmwave')||identity.includes('mmwave');
    });
  };

  P._presenceHue=function(){
    const key=String(this.c?.presence_colour_key||this.c?.area||this.c?.name||'room');
    let hash=2166136261;
    for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return ((hash>>>0)%360+360)%360;
  };

  const original=P._render;
  P._render=function(){
    original.call(this);
    const card=this.shadowRoot?.querySelector('ha-card');
    if(!card)return;
    card.style.transition='border-color 220ms ease, box-shadow 220ms ease';
    if(!this._presenceDetected()){
      card.style.removeProperty('border-color');
      card.style.removeProperty('box-shadow');
      card.removeAttribute('data-presence');
      return;
    }
    const hue=this._presenceHue();
    card.setAttribute('data-presence','true');
    card.style.borderColor=`hsl(${hue} 82% 68% / .62)`;
    card.style.boxShadow=`0 0 0 1px hsl(${hue} 82% 68% / .18), 0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
  };
});
}

// Module: src/patches/garage-trigger-safety.js
{
/** Select only an explicit garage-door operator button; never guess. */
(() => {
  const HD2 = globalThis.__homeDashboardV2;
  if (!HD2 || HD2.__garageTriggerSafetyV1) return;
  HD2.__garageTriggerSafetyV1 = true;

  const domain = (entityId) => String(entityId || "").split(".")[0];
  const identity = (entity) =>
    `${entity?.entity_id || ""} ${entity?.name || ""} ${entity?.original_name || ""}`
      .toLowerCase()
      .replace(/[_./-]+/g, " ");

  HD2.garageControl = (entity, data, hass) => {
    if (!entity?.device_id) return null;

    const buttons = (data?.byDevice?.get(entity.device_id) || []).filter(
      (candidate) =>
        domain(candidate?.entity_id) === "button" &&
        HD2.uiEntry(candidate) &&
        hass?.states?.[candidate.entity_id] &&
        String(hass.states[candidate.entity_id].state).toLowerCase() !== "unavailable",
    );

    const explicit = buttons.filter((candidate) =>
      /\bgarage\s+door\b.*\b(trigger|operate|operator)\b|\b(trigger|operate|operator)\b.*\bgarage\s+door\b/.test(
        identity(candidate),
      ),
    );

    return explicit.length === 1 ? explicit[0].entity_id : null;
  };

  HD2.REG?.refresh?.();
})();
}

// Module: src/patches/garage-door-device-dedup.js
{
/** Prevent the smart collection from showing a garage trigger beside its controller. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__garageDoorDeviceDedupV1) return;
  prototype.__garageDoorDeviceDedupV1 = true;

  const previousCandidates = prototype.candidates;
  prototype.candidates = function candidates() {
    const rows = previousCandidates.call(this);
    if (!Array.isArray(rows) || !this.d?.byDevice || !this.h) return rows;
    const garageDevices = new Set(rows.filter((entity) => {
      if (!entity?.device_id || String(entity.entity_id || "").split(".")[0] !== "binary_sensor") return false;
      return this.h.states[entity.entity_id]?.attributes?.device_class === "garage_door";
    }).map((entity) => entity.device_id));
    if (!garageDevices.size) return rows;
    return rows.filter((entity) => {
      if (!garageDevices.has(entity?.device_id)) return true;
      if (String(entity.entity_id || "").split(".")[0] !== "button") return true;
      const name = `${entity.entity_id || ""} ${entity.name || ""} ${entity.original_name || ""}`.toLowerCase();
      return !/(garage.?door|door).*(trigger|operate)|(trigger|operate).*(garage.?door|door)/.test(name);
    });
  };
  globalThis.__homeDashboardV2?.REG?.refresh?.();
});
}

// Module: src/patches/camera-controller-integration.js
{
/** Adds one ONVIF camera controller per device to smart collections. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const HD = globalThis.__homeDashboardV2;
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!HD || !prototype || prototype.__cameraDeviceDedupV1) return;
  prototype.__cameraDeviceDedupV1 = true;
  const oldUiEntry = HD.uiEntry;
  const oldPotential = HD.isPotential;
  const oldControl = HD.controlConfig;
  const oldIcon = HD.icon;
  const oldCandidates = prototype.candidates;
  const domain = HD.domain;
  const name = (entity) => String(entity?.name || entity?.original_name || entity?.entity_id || "");
  const isOnvif = (entity) => entity?.platform === "onvif";
  const isOwner = (entity) => isOnvif(entity) && domain(entity.entity_id) === "camera" && !/sub.?stream/i.test(`${entity.entity_id} ${name(entity)}`);
  const cameraDeviceActive = (entity, data, hass) => {
    if (!entity?.device_id) return false;
    return (data?.byDevice?.get(entity.device_id) || []).some((sibling) => {
      if (domain(sibling.entity_id) !== "binary_sensor") return false;
      const state = hass?.states?.[sibling.entity_id];
      const deviceClass = state?.attributes?.device_class || "";
      const candidateName = `${sibling.entity_id} ${name(sibling)}`;
      return state?.state === "on" && (/^(motion|occupancy|presence|sound)$/.test(deviceClass) || /motion|human|person|detect/i.test(candidateName));
    });
  };
  HD.uiEntry = (entity) => oldUiEntry?.(entity) && (!isOnvif(entity) || isOwner(entity));
  HD.isPotential = (entity, state) => isOwner(entity) || oldPotential?.(entity, state) || false;
  HD.icon = (entity, state) => isOwner(entity) ? "mdi:cctv" : oldIcon?.(entity, state) || "mdi:gesture-tap-button";
  HD.controlConfig = (entity, state, data, hass, split) => isOwner(entity) ? { type: "custom:component-camera-controller-v1", entity: entity.entity_id, device_id: entity.device_id } : oldControl?.(entity, state, data, hass, split) || null;
  prototype.candidates = function candidates() {
    const rows = oldCandidates.call(this);
    if (!Array.isArray(rows) || !this.d || !this.h) return rows;
    if (this.c?.mode === "active") {
      const ids = new Set(rows.map((entity) => entity.entity_id));
      for (const entity of this.d.entities) {
        if (!isOwner(entity) || !this.h.states[entity.entity_id] || ids.has(entity.entity_id)) continue;
        rows.push(entity);
        ids.add(entity.entity_id);
      }
    }
    return rows;
  };
  prototype.shown = function shown(rows) {
    if (this.c?.mode !== "active") return rows;
    return rows.filter((entity) => isOwner(entity) ? cameraDeviceActive(entity, this.d, this.h) : HD.isActive(entity, this.h.states[entity.entity_id]));
  };
  HD.REG?.refresh?.();
});
}

// Module: src/patches/camera-controller-current-behaviour.js
{
/** Preserves the current camera controller availability behaviour. */
customElements.whenDefined("component-camera-controller-v1").then(() => {
  const Card = customElements.get("component-camera-controller-v1");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__stateAwareV2) return;
  prototype.__stateAwareV2 = true;
  const oldRender = prototype.render;
  prototype.render = function render() {
    oldRender.call(this);
    if (!this._hass || !this.bundleData) return;
    const status = this.status();
    const usable = (entityId) => {
      const state = this._hass.states[entityId];
      return Boolean(state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase()));
    };
    const internalUsable = [...this.bundleData.switches, ...this.bundleData.detections, ...this.bundleData.buttons].some((entity) => usable(entity.entity_id));
    if (this.view) this.view.hidden = !status.online;
    if (this.controls) this.controls.hidden = !status.online || !internalUsable;
    if (!status.online && this.dialog?.open) this.dialog.close();
  };
  const oldOpenControls = prototype.openControls;
  prototype.openControls = function openControls() { if (!this.status()?.online) return; return oldOpenControls.call(this); };
});
}

// Module: src/patches/runtime-reliability.js
{
/** Runtime compatibility and lifecycle guards for retained component DOM. */
(() => {
  const shared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ?? {};
  const { createRequestCoalescer, interaction } = shared;

  const patch = (type, apply) => customElements.whenDefined(type).then(() => {
    const Card = customElements.get(type);
    if (Card) apply(Card.prototype);
  });

  const preserveLocalInteractionFields = (prototype, fields) => {
    const original = prototype.disconnectedCallback;
    if (typeof original !== "function" || original.__preservesRetainedInteractions) return;
    const wrapped = function disconnectWithRetainedInteractions(...args) {
      const saved = fields.map((field) => [field, this[field]]);
      for (const [field, value] of saved) this[field] = Array.isArray(value) ? [] : null;
      try {
        return original.apply(this, args);
      } finally {
        for (const [field, value] of saved) this[field] = value;
      }
    };
    wrapped.__preservesRetainedInteractions = true;
    prototype.disconnectedCallback = wrapped;
  };

  const retainedLocalFields = new Map([
    ["component-context-strip-v3", ["_interaction"]],
    ["component-history-graph-v2", ["interactions"]],
    ["component-single-kpi-v2", ["_interaction"]],
    ["component-three-stat-v2", ["_interactions"]],
    ["component-status-row-v2", ["_interaction"]],
    ["component-progress-v2", ["_interaction"]],
    ["component-action-v2", ["_interaction"]],
    ["component-list-v2", ["_interactions"]],
    ["component-notice-v2", ["_interaction"]],
    ["component-quick-nav-v2", ["_interactions"]],
    ["component-favourites-v3", ["_interactionHandles"]],
    ["component-nav-tile-v2", ["_interaction"]],
    ["component-room-navigation-v1", ["_interaction"]],
    ["component-control-row-v2", ["_interactions"]],
    ["component-split-controller-v4", ["_interactionHandles"]],
    ["component-media-row-v2", ["_interactions"]],
    ["component-room-sheet-v2", ["_interactions"]],
    ["component-update-summary-v3", ["_interaction"]],
    ["component-update-row-v3", ["_interactions"]],
    ["component-household-attention-v1", ["_interactionHandles"]],
    ["component-welcome-header-v1", ["_interaction"]],
    ["component-wled-controller-v1", ["_interactionHandles"]],
  ]);
  for (const [type, fields] of retainedLocalFields) {
    patch(type, (prototype) => preserveLocalInteractionFields(prototype, fields));
  }

  patch("component-context-strip-v3", (prototype) => {
    const original = prototype._render;
    if (typeof original !== "function" || !String(original).includes("CtxEsc")) return;
    prototype._render = function renderWithScopedEscape() {
      const previous = globalThis.CtxEsc;
      globalThis.CtxEsc = shared.escapeHtml ?? String;
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
        globalThis.B = shared.PRESENTATIONAL_CARD_STYLES ?? "";
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

  patch("energy-history-card-v3", (prototype) => {
    const originalConnected = prototype.connectedCallback;
    if (originalConnected?.__restoresResizeObserver) return;
    const wrapped = function reconnectEnergyHistory(...args) {
      const result = originalConnected?.apply(this, args);
      if (this.e?.chart) this._resizeObserver?.observe(this.e.chart);
      return result;
    };
    wrapped.__restoresResizeObserver = true;
    prototype.connectedCallback = wrapped;
  });

  patch("component-camera-controller-v1", (prototype) => {
    const original = prototype.renderControls;
    if (typeof original !== "function" || original.__preservesUnchangedControls) return;
    const wrapped = function renderControlsWithoutDroppingHandlers(...args) {
      if (this.bundleData) {
        const signature = JSON.stringify([
          this.confirmId,
          ...this.bundleData.detections.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
          ...this.bundleData.switches.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
          ...this.bundleData.buttons.map((entity) => [entity.entity_id, this.clean(entity), this._hass.states[entity.entity_id]]),
        ]);
        if (signature === this.controlsSignature) return;
      }
      return original.apply(this, args);
    };
    wrapped.__preservesUnchangedControls = true;
    prototype.renderControls = wrapped;
  });

  patch("component-apple-tv-controller-v1", (prototype) => {
    prototype.setVolumeGesture = function setVolumeGesture(pressed, model) {
      this.volumeGestureActive = pressed;
      if (pressed && this.optimisticVolume === null) this.optimisticVolume = model.level;
      this.updateVolumeReadout(model);
    };

    prototype.ensureVolumeCoalescer = function ensureVolumeCoalescer() {
      if (this.volumeCoalescer && !this.volumeCoalescer.destroyed) return this.volumeCoalescer;
      this.volumeCoalescer = createRequestCoalescer(async (direction) => {
        const model = this.model();
        if (direction === "up" ? !model.canVolumeUp : !model.canVolumeDown) return;
        if (!this.config.demo) {
          await this._hass.callService("media_player", `volume_${direction}`, { entity_id: model.entities.media });
        }
      }, {
        onError: () => this.setMessage("Apple TV did not respond", "error", 4000),
        onIdle: () => {
          if (this.volumeGestureActive) return;
          this.optimisticVolume = null;
          if (this.isConnected) this.render();
        },
      });
      return this.volumeCoalescer;
    };
  });

  patch("component-wled-controller-v1", (prototype) => {
    const original = prototype.renderPresets;
    if (typeof original !== "function" || original.__cleansPresetInteractions) return;
    const wrapped = function renderPresetsWithCleanup(...args) {
      for (const button of this.presetGrid?.querySelectorAll?.(".preset-btn") || []) {
        button._interaction?.destroy?.();
        button._interaction = null;
      }
      return original.apply(this, args);
    };
    wrapped.__cleansPresetInteractions = true;
    prototype.renderPresets = wrapped;
  });

  patch("component-room-directory-v4", (prototype) => {
    const originalHeader = prototype.renderSheetHeader;
    if (typeof originalHeader === "function" && !originalHeader.__cleansMetricInteractions) {
      const wrappedHeader = function renderSheetHeaderWithCleanup(...args) {
        if (this.environment && Array.isArray(this._interactionHandles)) {
          const retained = [];
          for (const handle of this._interactionHandles) {
            if (handle?.element && this.environment.contains(handle.element)) handle.destroy();
            else retained.push(handle);
          }
          this._interactionHandles = retained;
        }
        return originalHeader.apply(this, args);
      };
      wrappedHeader.__cleansMetricInteractions = true;
      prototype.renderSheetHeader = wrappedHeader;
    }

    const originalDisconnect = prototype.disconnectedCallback;
    if (typeof originalDisconnect === "function" && !originalDisconnect.__preservesRoomTiles) {
      const wrappedDisconnect = function disconnectRoomDirectory(...args) {
        const saved = [];
        for (const tile of this.tiles?.values?.() || []) {
          saved.push([tile, tile._interaction]);
          tile._interaction = null;
        }
        try {
          return originalDisconnect.apply(this, args);
        } finally {
          for (const [tile, handle] of saved) tile._interaction = handle;
        }
      };
      wrappedDisconnect.__preservesRoomTiles = true;
      prototype.disconnectedCallback = wrappedDisconnect;
    }
  });

  patch("component-update-summary-v3", (prototype) => {
    if (prototype.disconnectedCallback) return;
    prototype.disconnectedCallback = function disconnectUpdateSummary() {
      window.clearTimeout(this.messageTimer);
      this.messageTimer = null;
    };
  });
})();
}

// Module: src/patches/home-editor-portal.js
{
(()=>{
(()=>{const TAG='dashboard-preference-editor-v3',PATCH='__homeEditorPortalV1';async function portal(){await customElements.whenDefined(TAG);let e=globalThis.__homeDashboardEditorV3;if(!e||typeof e.open!=='function'){e=document.createElement(TAG);globalThis.__homeDashboardEditorV3=e}if(e.parentNode!==document.body){e.remove();document.body.append(e)}return e}async function patch(tag){await customElements.whenDefined(tag);const C=customElements.get(tag),p=C?.prototype;if(!p||p[PATCH]||typeof p.openEditor!=='function')return;const original=p.openEditor;p.openEditor=async function(...args){this.editor=await portal();return original.apply(this,args)};p[PATCH]=true}Promise.all(['component-room-directory-v4','component-household-directory-v3','component-smart-collection-v3'].map(patch)).catch(e=>console.error('[HOME EDITOR PORTAL]',e));})();
})();
}

// Module: src/patches/room-directory-presence-glow.js
{
(()=>{
customElements.whenDefined('component-room-directory-v4').then(()=>{
  const Card=customElements.get('component-room-directory-v4');
  const P=Card?.prototype;
  if(!P||P.__roomDirectoryGlowV2)return;
  P.__roomDirectoryGlowV2=true;

  const originalEntries=P.entries;
  P.entries=function(areaId){
    if(!this.d||!this.h)return[];
    const HD2=globalThis.__homeDashboardV2;
    if(!HD2?.uiEntry||!HD2?.areaOf)return originalEntries.call(this,areaId);
    let cache=this.__roomEntriesCache;
    if(!cache||cache.registry!==this.d){
      const byArea=new Map();
      for(const entry of this.d.entities||[]){
        if(!HD2.uiEntry(entry))continue;
        const id=HD2.areaOf(entry,this.d);
        if(!id)continue;
        const entries=byArea.get(id)||[];
        entries.push(entry);
        byArea.set(id,entries);
      }
      cache={registry:this.d,byArea};
      this.__roomEntriesCache=cache;
    }
    return (cache.byArea.get(areaId)||[]).map(e=>({e,s:this.h.states[e.entity_id]})).filter(x=>x.s);
  };

  P._roomActive=function(area){
    const HD2=globalThis.__homeDashboardV2;
    return this.entries(area.area_id).some(({e,s})=>{
      if(e?.entity_id?.startsWith('binary_sensor.')&&s?.state==='on'){
        const cls=String(s.attributes?.device_class||e.device_class||'').toLowerCase();
        const identity=(e.entity_id+' '+String(e.name||e.original_name||'')+' '+String(s.attributes?.friendly_name||'')).toLowerCase();
        if(cls==='occupancy'||cls==='presence'||identity.includes('presence')||identity.includes('occupancy')||identity.includes('mmwave'))return true;
      }
      return HD2?.isActive?.(e,s)===true;
    });
  };

  P._roomPresenceHue=function(area){
    const key=String(area?.area_id||area?.name||'room');
    let hash=2166136261;
    for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return (hash>>>0)%360;
  };

  const original=P.updateTile;
  P.updateTile=function(button,area){
    original.call(this,button,area);
    const active=button.classList.contains('active')||this._roomActive(area);
    if(button.dataset.roomGlowInitialised!=='true'){
      button.dataset.roomGlowInitialised='true';
      button.style.transition='box-shadow 180ms ease, border-color 180ms ease';
      button.style.borderLeft='var(--dashboard-card-border,1px solid var(--divider-color))';
    }
    if(!active){
      button.style.removeProperty('border-color');
      button.style.removeProperty('box-shadow');
      button.removeAttribute('data-presence');
      return;
    }
    const hue=this._roomPresenceHue(area);
    button.setAttribute('data-presence','true');
    button.style.borderColor=`hsl(${hue} 82% 68% / .72)`;
    button.style.boxShadow=`0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
  };

  const refresh=(root,seen=new Set())=>{
    if(!root||seen.has(root))return;
    seen.add(root);
    root.querySelectorAll?.('component-room-directory-v4').forEach(card=>card.refreshTiles?.());
    root.querySelectorAll?.('*').forEach(host=>refresh(host.shadowRoot,seen));
  };
  const refreshMounted=()=>refresh(document);
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(refreshMounted);
  else queueMicrotask(refreshMounted);
});
})();
}

// Module: src/patches/split-registry-discovery.js
{
/** Refresh room and active collections when shared split state changes. */
(()=>{
  customElements.whenDefined("component-smart-collection-v3").then(()=>{
    const Collection=customElements.get("component-smart-collection-v3");
    const prototype=Collection?.prototype;
    if(!prototype||prototype.__splitRegistryDiscoveryV1)return;
    prototype.__splitRegistryDiscoveryV1=true;
    const hassDescriptor=Object.getOwnPropertyDescriptor(prototype,"hass");
    const originalConnected=prototype.connectedCallback;
    const originalDisconnected=prototype.disconnectedCallback;
    prototype.subscribeSplitRegistryV1=function(){
      const registry=globalThis.__componentSplitRegistryV4;
      if(this._splitRegistryUnsubV1||!this.h||!registry?.subscribe)return;
      this._splitRegistryUnsubV1=registry.subscribe(this.h,()=>{
        this.split=null;
        this.structureSig="";
        this.schedule();
      });
    };
    Object.defineProperty(prototype,"hass",{
      ...hassDescriptor,
      set(value){
        hassDescriptor.set.call(this,value);
        this.subscribeSplitRegistryV1();
      }
    });
    prototype.connectedCallback=function(){
      originalConnected.call(this);
      this.subscribeSplitRegistryV1();
    };
    prototype.disconnectedCallback=function(){
      this._splitRegistryUnsubV1?.();
      this._splitRegistryUnsubV1=null;
      originalDisconnected.call(this);
    };
  });
})();
}

// Module: src/patches/room-directory-open-guard.js
{
/** Prevent the Room hash update from opening the same drawer twice. */
customElements.whenDefined("component-room-directory-v4").then(()=>{
  const RoomDirectory=customElements.get("component-room-directory-v4");
  const prototype=RoomDirectory?.prototype;
  if(!prototype||prototype.__roomOpenGuardV1)return;
  prototype.__roomOpenGuardV1=true;
  const originalOpenRoom=prototype.openRoom;
  prototype.openRoom=async function(area,writeHash=true){
    const areaId=area?.area_id;
    if(!areaId||this._roomOpenInFlightV1===areaId)return;
    this._roomOpenInFlightV1=areaId;
    try{return await originalOpenRoom.call(this,area,writeHash)}finally{
      if(this._roomOpenInFlightV1===areaId)this._roomOpenInFlightV1=null;
    }
  };
});
}

// Module: src/patches/split-registry-resume.js
{
/** Resume an off split from durable registry state instead of reopening mode selection. */
customElements.whenDefined("component-split-controller-v4").then(()=>{
  const Controller=customElements.get("component-split-controller-v4");
  const prototype=Controller?.prototype;
  if(!prototype||prototype.__splitRegistryResumeV1)return;
  prototype.__splitRegistryResumeV1=true;
  const originalPower=prototype.G;
  prototype.G=function(){
    const split=this.Z();
    if(split.uv||split.state?.state!=="off")return originalPower.call(this);
    const mode=this.gt();
    if(!mode||!this.config.room_id)return originalPower.call(this);
    this.Rt("hvac",{
      requested:mode,
      label:this.tt(mode),
      call:()=>this.P.callService("ha_component_backend","resume_room",{room_id:this.config.room_id}),
      matches:()=>this.X(this.config.entity)?.state===mode,
      closePanel:true,
      timeout:10000
    },true);
  };
});
}

// Module: src/patches/apple-tv-header-controls.js
{
/** Aligns Apple TV controls with the dashboard design system. */
customElements.whenDefined("component-apple-tv-controller-v1").then(() => {
  const Card = customElements.get("component-apple-tv-controller-v1");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__headerControlsV3) return;
  prototype.__headerControlsV3 = true;

  const oldRender = prototype.render;
  const oldRenderRemote = prototype.renderRemote;
  const oldRenderApps = prototype.renderApps;
  const oldOpenPanel = prototype.openPanel;
  const oldDisconnectedCallback = prototype.disconnectedCallback;

  const APP_BRAND_COLOURS = [
    [/netflix/i, "#e50914"], [/youtube/i, "#ff0000"], [/spotify/i, "#1ed760"], [/prime video|amazon/i, "#00a8e1"], [/plex/i, "#e5a00d"], [/twitch/i, "#9146ff"], [/vlc/i, "#ff8800"], [/apple tv|apple music|music/i, "var(--primary-text-color)"], [/disney/i, "#0b5bd3"], [/kayo|sport/i, "#00a651"], [/binge/i, "#8a2be2"], [/stan/i, "#00a5ff"], [/paramount/i, "#0064ff"],
  ];

  prototype.appleTvAppColour = function appleTvAppColour(source) {
    return APP_BRAND_COLOURS.find(([pattern]) => pattern.test(source))?.[1] || "var(--primary-color)";
  };

  prototype.ensureHeaderControls = function ensureHeaderControls(model) {
    if (!this.shadowRoot || !this.el) return;
    if (!this.shadowRoot.querySelector("style[data-apple-tv-header-controls]")) {
      const style = document.createElement("style");
      style.setAttribute("data-apple-tv-header-controls", "");
      style.textContent = `.card-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px}.identity{grid-template-columns:44px minmax(0,1fr)!important;gap:12px!important}.card-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-left:0}.header-action{width:44px;height:44px;min-width:44px;padding:0;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.header-action.power.on{color:var(--primary-color)}.header-action ha-icon{--mdc-icon-size:20px}.header-action span{display:none}.panel{padding:16px!important;overscroll-behavior:contain}.sheet{width:min(430px,calc(100vw - 32px))!important;max-height:calc(100dvh - 32px)!important;min-height:0;overflow:hidden!important;display:flex!important;flex-direction:column;border-radius:var(--dashboard-radius-dialog,8px)!important;box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))!important}.head{flex:0 0 auto}.body{flex:1 1 auto;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable}.panel-notice{flex:0 0 auto}.panel[data-mode="apps"] .body{max-height:calc(100dvh - 112px)}.apps-grid{align-content:start}.app-logo ha-icon{color:var(--apple-tv-app-colour,var(--primary-color))}@media(max-width:420px){.panel{padding:16px!important}.sheet{width:calc(100vw - 32px)!important;max-height:calc(100dvh - 32px)!important}.card-head{gap:8px}.card-actions{gap:8px}.header-action{width:44px;height:44px;min-width:44px}.header-action ha-icon{--mdc-icon-size:20px}}`;
      this.shadowRoot.append(style);
    }

    let cardHead = this.shadowRoot.querySelector(".card-head");
    if (!cardHead) {
      const identity = this.shadowRoot.querySelector(".identity");
      cardHead = document.createElement("div");
      cardHead.className = "card-head";
      identity?.before(cardHead);
      if (identity) cardHead.append(identity);
    }

    let actions = this.shadowRoot.querySelector(".card-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "card-actions";
      actions.setAttribute("aria-label", "Apple TV quick controls");
      cardHead.append(actions);
    }
    for (const handle of this._headerInteractions || []) handle.destroy();
    this._headerInteractions = [];

    const wake = !model.awake;
    const powerAction = wake ? "wake" : "sleep";
    const canPower = wake ? model.canWake : model.canSleep;
    const repeatVolume = { delay: 350, interval: 110, accelerate: true };
    const start = this.dynamicInteractions.length;
    const volumeDown = this.button("header-action", "Volume down", "mdi:volume-minus", () => this.queueVolume("down"), !model.canVolumeDown, false, { repeat: repeatVolume, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) });
    const volumeUp = this.button("header-action", "Volume up", "mdi:volume-plus", () => this.queueVolume("up"), !model.canVolumeUp, false, { repeat: repeatVolume, onPressChange: (pressed) => this.setVolumeGesture(pressed, model) });
    const power = this.button(`header-action power ${model.awake ? "on" : ""}`, wake ? "Turn Apple TV on" : "Turn Apple TV off", "mdi:power", () => this.remoteCommand(wake ? "wakeup" : "suspend", powerAction), !canPower || this.busy(powerAction), this.busy(powerAction));
    this._headerInteractions.push(...this.dynamicInteractions.splice(start));
    actions.replaceChildren(volumeDown, volumeUp, power);
  };

  prototype.render = function render() {
    oldRender.call(this);
    if (!this.config || !this.el) return;
    const model = this.model();
    this.el.remoteLaunch.disabled = !model.awake || !this.canRemote(model);
    this.el.appsLaunch.disabled = !model.awake || !model.canSelectSource;
    this.el.panel.dataset.mode = this.panelMode || "";
    this.ensureHeaderControls(model);
    if (this.panelMode && !model.awake) this.closePanel(false);
  };

  prototype.renderRemote = function renderRemote(model) {
    oldRenderRemote.call(this, model);
    const power = this.el?.body?.querySelector(".remote-toolbar .power");
    power?.remove();
    const toolbar = this.el?.body?.querySelector(".remote-toolbar");
    if (toolbar && !toolbar.childElementCount) toolbar.remove();
    const volume = this.el?.body?.querySelector(".volume-control");
    volume?.closest(".section")?.remove();
  };

  prototype.renderApps = function renderApps(model) {
    oldRenderApps.call(this, model);
    for (const app of this.el?.body?.querySelectorAll(".app") || []) {
      const source = app.querySelector(".app-name")?.textContent?.trim() || "";
      const logo = app.querySelector(".app-logo");
      if (logo) logo.style.setProperty("--apple-tv-app-colour", this.appleTvAppColour(source));
    }
  };

  prototype.openPanel = function openPanel(mode, trigger) {
    if (!this.model().awake) return;
    return oldOpenPanel.call(this, mode, trigger);
  };

  prototype.disconnectedCallback = function disconnectAppleTvHeaderInteractions(...args) {
    for (const handle of this._headerInteractions || []) handle.destroy();
    this._headerInteractions = [];
    return oldDisconnectedCallback?.apply(this, args);
  };
});
}

// Module: src/patches/smart-collection-live-active.js
{
/** Makes Active Now react directly to Home Assistant state changes. */
customElements.whenDefined("component-smart-collection-v3").then(() => {
  const Card = customElements.get("component-smart-collection-v3");
  const prototype = Card?.prototype;
  if (!prototype || prototype.__liveActiveStatesV1) return;
  prototype.__liveActiveStatesV1 = true;

  const hassDescriptor = Object.getOwnPropertyDescriptor(prototype, "hass");
  const baseHassSet = hassDescriptor?.set;
  const baseSetConfig = prototype.setConfig;
  const baseConnected = prototype.connectedCallback;
  const baseDisconnected = prototype.disconnectedCallback;
  const ACTIVE_DOMAINS = new Set([
    "light",
    "fan",
    "switch",
    "input_boolean",
    "media_player",
    "climate",
    "cover",
    "lock",
    "vacuum",
    "binary_sensor",
  ]);
  const ACTIVE_BINARY_CLASSES = /^(door|window|garage_door|smoke|moisture|gas)$/;

  prototype.stopActiveStateStream = function stopActiveStateStream() {
    clearTimeout(this.__activeStateRetry);
    this.__activeStateRetry = null;
    this.__activeStateToken = null;
    this.__activeStateConnection = null;

    const subscription = this.__activeStateSubscription;
    this.__activeStateSubscription = null;
    if (subscription) {
      Promise.resolve(subscription)
        .then((unsubscribe) => unsubscribe?.())
        .catch(() => {});
    }
  };

  prototype.handleActiveStateChanged = function handleActiveStateChanged(event) {
    if (this.c?.mode !== "active" || !this.h) return;

    const data = event?.data || event;
    const entityId = data?.entity_id;
    if (!entityId) return;

    const domain = globalThis.__homeDashboardV2?.domain?.(entityId);
    if (!ACTIVE_DOMAINS.has(domain)) return;

    const oldState = data?.old_state || this.h.states?.[entityId] || null;
    const newState = data?.new_state || null;
    if (domain === "binary_sensor") {
      const deviceClass =
        newState?.attributes?.device_class || oldState?.attributes?.device_class || "";
      if (!ACTIVE_BINARY_CLASSES.test(deviceClass)) return;
    }

    const HD2 = globalThis.__homeDashboardV2;
    if (!HD2?.isActive) return;

    let entry = this.d?.entities?.find((item) => item.entity_id === entityId) || null;
    if (entry && !HD2.uiEntry(entry)) return;
    entry ||= { entity_id: entityId };

    const wasActive = HD2.isActive(entry, oldState);
    const isActive = HD2.isActive(entry, newState);
    if (wasActive === isActive) return;

    const states = { ...(this.h.states || {}) };
    if (newState) states[entityId] = newState;
    else delete states[entityId];

    this.structureSig = "";
    if (baseHassSet) {
      baseHassSet.call(this, { ...this.h, states });
    } else {
      this.h = { ...this.h, states };
      this.schedule?.();
    }
  };

  prototype.startActiveStateStream = function startActiveStateStream() {
    if (this.c?.mode !== "active" || !this.isConnected) return;

    const connection = this.h?.connection;
    if (!connection?.subscribeEvents) return;
    if (
      this.__activeStateConnection === connection &&
      this.__activeStateSubscription
    ) {
      return;
    }

    this.stopActiveStateStream();
    this.__activeStateConnection = connection;
    const token = {};
    this.__activeStateToken = token;

    let subscription;
    try {
      subscription = connection.subscribeEvents(
        (event) => {
          if (this.__activeStateToken === token) {
            this.handleActiveStateChanged(event);
          }
        },
        "state_changed",
      );
    } catch {
      subscription = Promise.reject(new Error("state subscription failed"));
    }

    this.__activeStateSubscription = Promise.resolve(subscription).catch(() => {
      if (this.__activeStateToken !== token) return null;
      this.__activeStateSubscription = null;
      this.__activeStateRetry = setTimeout(() => {
        this.__activeStateRetry = null;
        this.startActiveStateStream();
      }, 10000);
      return null;
    });
  };

  Object.defineProperty(prototype, "hass", {
    configurable: true,
    get() {
      return this.h;
    },
    set(hass) {
      if (baseHassSet) baseHassSet.call(this, hass);
      else this.h = hass;
      this.startActiveStateStream();
    },
  });

  prototype.setConfig = function setConfig(config) {
    const result = baseSetConfig.call(this, config);
    if (this.c?.mode === "active") this.startActiveStateStream();
    else this.stopActiveStateStream();
    return result;
  };

  prototype.connectedCallback = function connectedCallback() {
    const result = baseConnected.call(this);
    this.startActiveStateStream();
    return result;
  };

  prototype.disconnectedCallback = function disconnectedCallback() {
    this.stopActiveStateStream();
    return baseDisconnected.call(this);
  };
});
}

// Module: src/patches/home-favourites-backend-only.js
{
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
}

// Module: src/patches/config-contracts.js
{
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
}

globalThis.__HA_COMPONENT_LIBRARY__ = Object.freeze({ version: "10.0.0", components: 45 });
