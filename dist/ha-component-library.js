/**
 * HA Component Library v10.0.5
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
  let backdropPointerStarted = false;
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
  const onPointerDown = (event) => {
    backdropPointerStarted = event.target === overlay;
  };
  const onPointerCancel = () => {
    backdropPointerStarted = false;
  };
  const onClick = (event) => {
    const shouldClose = backdropPointerStarted && event.target === overlay && options.clickOutside !== false;
    backdropPointerStarted = false;
    if (shouldClose) requestClose("outside");
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
  overlay.addEventListener("pointerdown", onPointerDown);
  overlay.addEventListener("pointercancel", onPointerCancel);
  overlay.addEventListener("click", onClick);
  host.shadowRoot?.addEventListener("keydown", onKeyDown);
  return Object.freeze({
    close,
    destroy() {
      close(false);
      overlay.removeEventListener("pointerdown", onPointerDown);
      overlay.removeEventListener("pointercancel", onPointerCancel);
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
HD2.entryFilters ??= [];
HD2.registerEntryFilter ??= (filter) => {
  if (typeof filter !== "function") throw new TypeError("Dashboard entry filters must be functions");
  HD2.entryFilters.push(filter);
  return () => {
    const index = HD2.entryFilters.indexOf(filter);
    if (index >= 0) HD2.entryFilters.splice(index, 1);
  };
};
HD2.uiEntry = (entry) =>
  Boolean(
    entry?.entity_id &&
      !entry.disabled_by &&
      !entry.hidden_by &&
      !["diagnostic", "config"].includes(entry.entity_category) &&
      HD2.entryFilters.every((filter) => filter(entry)),
  );
HD2.card=async(h,c)=>{const helpers=await window.loadCardHelpers();const x=helpers.createCardElement(c);x.hass=h;return x};
HD2.controlDomains=new Set(['light','fan','switch','input_boolean','media_player','climate','cover','lock','vacuum','button','select','number']);
HD2.isPotential=(e,s)=>HD2.uiEntry(e)&&(HD2.controlDomains.has(HD2.domain(e.entity_id))||(HD2.domain(e.entity_id)==='binary_sensor'&&s?.attributes?.device_class==='garage_door'));
HD2.isActive=(e,s)=>{if(!HD2.uiEntry(e)||!s)return false;const d=HD2.domain(e.entity_id),st=s.state,a=s.attributes||{};if(['light','fan','switch','input_boolean'].includes(d))return st==='on';if(d==='media_player'){if(['playing','paused','buffering','on'].includes(st))return true;if(st==='idle'){const v=String(a.media_title||a.app_name||'');return Boolean(v&&!/^(idle|home(?: screen)?|default media receiver)$/i.test(v))}return false}if(d==='climate')return /^(heat|cool|heat_cool|auto|dry|fan_only)$/.test(st);if(d==='cover')return /^(open|opening|closing)$/.test(st);if(d==='lock')return st==='unlocked';if(d==='vacuum')return /^(cleaning|returning)$/.test(st);if(d==='binary_sensor')return st==='on'&&/^(door|window|garage_door|smoke|moisture|gas)$/.test(a.device_class||'');return false};
const garageOperatorIdentity = (entry) =>
  `${entry?.entity_id || ""} ${entry?.name || ""} ${entry?.original_name || ""}`
    .toLowerCase()
    .replace(/[_./-]+/g, " ");

HD2.garageControl = (entry, registry, hass) => {
  if (!entry?.device_id) return null;
  const buttons = (registry?.byDevice?.get(entry.device_id) || []).filter(
    (candidate) =>
      HD2.domain(candidate?.entity_id) === "button" &&
      HD2.uiEntry(candidate) &&
      hass?.states?.[candidate.entity_id] &&
      String(hass.states[candidate.entity_id].state).toLowerCase() !== "unavailable",
  );
  const explicit = buttons.filter((candidate) =>
    /\bgarage\s+door\b.*\b(trigger|operate|operator)\b|\b(trigger|operate|operator)\b.*\bgarage\s+door\b/.test(
      garageOperatorIdentity(candidate),
    ),
  );
  return explicit.length === 1 ? explicit[0].entity_id : null;
};

const splitIdentity = (entry, hass) => `${entry?.entity_id || ""} ${entry?.name || ""} ${entry?.original_name || ""} ${hass?.states?.[entry?.entity_id]?.attributes?.friendly_name || ""}`.toLowerCase();
HD2.nativeClimateControlConfig = (entry, state, registry, hass) => {
  if (HD2.domain(entry?.entity_id) !== "climate") return null;
  const areaId = HD2.areaOf(entry, registry);
  const sameDevice = entry.device_id ? registry?.byDevice?.get(entry.device_id) || [] : [];
  const sameArea = areaId ? (registry?.entities || []).filter((candidate) => HD2.areaOf(candidate, registry) === areaId) : [];
  const helpers = (registry?.entities || []).filter((candidate) => ["timer", "script", "scene"].includes(HD2.domain(candidate?.entity_id)));
  const candidates = [...new Map([...sameDevice, ...sameArea, ...helpers].map((candidate) => [candidate.entity_id, candidate])).values()]
    .filter((candidate) => hass?.states?.[candidate.entity_id]);
  const climateName = splitIdentity(entry, hass).replace(/climate\.|split|system|climate|air conditioner|aircon|hvac/g, " ").trim().split(/\s+/).filter((part) => part.length > 2);
  const related = (candidate) => {
    const identity = splitIdentity(candidate, hass);
    return Boolean(entry.device_id && candidate.device_id === entry.device_id) || climateName.some((part) => identity.includes(part));
  };
  const select = (axis) => {
    const matches = candidates.filter((candidate) => HD2.domain(candidate.entity_id) === "select" && splitIdentity(candidate, hass).includes(axis) && /(vane|swing)/.test(splitIdentity(candidate, hass)) && related(candidate));
    return matches.length === 1 ? matches[0].entity_id : null;
  };
  const timer = candidates.find((candidate) => HD2.domain(candidate.entity_id) === "timer" && related(candidate) && /(split|climate|air.?con|hvac|timer)/.test(splitIdentity(candidate, hass)))?.entity_id || null;
  const profiles = candidates.filter((candidate) => ["script", "scene"].includes(HD2.domain(candidate.entity_id)) && related(candidate) && /(split|climate|air.?con|hvac)/.test(splitIdentity(candidate, hass))).map((candidate) => ({ entity: candidate.entity_id, name: HD2.stateName(hass, candidate, hass.states[candidate.entity_id]) }));
  return {
    type: "custom:component-split-controller-v4",
    entity: entry.entity_id,
    title: HD2.stateName(hass, entry, state),
    vertical_vane_entity: select("vertical"),
    horizontal_vane_entity: select("horizontal"),
    timer_entity: timer,
    profile_entities: profiles,
  };
};

// Apple TV controls intentionally do not discover sibling entities. The Split
// wrapper resolves only native HA entities that belong to the same device/area.
HD2.appleTvBundle=(e,s,_d,h)=>HD2.domain(e?.entity_id)==='media_player'&&e?.platform==='apple_tv'?{type:'custom:component-apple-tv-controller-v1',entity:e.entity_id,title:HD2.stateName(h,e,s),icon:'mdi:apple'}:null;
HD2.controlConfig=(e,s,d,h)=>{const id=e.entity_id,dom=HD2.domain(id);if(dom==='binary_sensor'&&s?.attributes?.device_class==='garage_door'){const b=HD2.garageControl(e,d,h);return b?{type:'custom:component-garage-door-controller-v1',title:HD2.stateName(h,e,s).replace(/ Garage Door Status$/i,''),entity:id,control_entity:b}:{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true}}if(['light','fan','number'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'slider',entity:id,show_state:true,tap_action:{action:'more-info'}};if(['switch','input_boolean'].includes(dom))return{type:'custom:bubble-card',card_type:'button',button_type:'switch',entity:id,show_state:true,button_action:{tap_action:{action:'toggle'}},tap_action:{action:'more-info'}};if(dom==='media_player')return HD2.appleTvBundle(e,s,d,h)||{type:'custom:bubble-card',card_type:'media-player',entity:id,show_state:true,tap_action:{action:'more-info'}};if(dom==='climate')return HD2.nativeClimateControlConfig(e,s,d,h);if(dom==='cover')return{type:'custom:bubble-card',card_type:'cover',entity:id,show_state:true};if(dom==='lock')return{type:'custom:mushroom-lock-card',entity:id};if(dom==='vacuum')return{type:'custom:mushroom-vacuum-card',entity:id};if(dom==='select')return{type:'custom:mushroom-select-card',entity:id};if(dom==='button')return{type:'custom:mushroom-entity-card',entity:id,tap_action:{action:'perform-action',perform_action:'button.press',target:{entity_id:id},confirmation:{text:'Run this control?'}},hold_action:{action:'more-info'}};if(dom==='binary_sensor')return{type:'custom:bubble-card',card_type:'button',button_type:'state',entity:id,show_state:true,show_last_changed:false};return null};

HD2.controlResolvers ??= [];
HD2.registerControlResolver ??= (resolver) => {
  if (typeof resolver !== "function") throw new TypeError("Dashboard control resolvers must be functions");
  HD2.controlResolvers.push(resolver);
  return () => {
    const index = HD2.controlResolvers.indexOf(resolver);
    if (index >= 0) HD2.controlResolvers.splice(index, 1);
  };
};

const defaultControlConfig = HD2.controlConfig;
HD2.controlConfig = (entry, state, registry, hass) => {
  for (const resolveControl of HD2.controlResolvers) {
    const configuration = resolveControl(entry, state, registry, hass);
    if (configuration) return configuration;
  }
  return defaultControlConfig(entry, state, registry, hass);
};

HD2.preferenceEditor ??= async () => {
  await customElements.whenDefined("dashboard-preference-editor-v3");
  const editor = globalThis.__homeDashboardEditorV3 ??= document.createElement("dashboard-preference-editor-v3");
  if (editor.parentNode !== document.body) {
    editor.remove?.();
    document.body.append(editor);
  }
  return editor;
};
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
}

// Module: src/shared/update-styles.js
{
/** Shared Update card presentation styles, preserved verbatim. */
const UPDATE_CARD_STYLES = ":host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}*{box-sizing:border-box}button{font:inherit;color:inherit}";
Object.assign(globalThis.__HA_COMPONENT_LIBRARY_SHARED__, { UPDATE_CARD_STYLES });
}

// Module: src/support/device-aware-auto-entities.js
{
/**
 * Presentation wrapper for Auto-Entities collections.
 *
 * Split systems are now normal, explicitly configured climate cards. This
 * wrapper leaves entity selection to Auto-Entities instead of rediscovering
 * climate entities through a second registry.
 */
const DEVICE_AWARE_INNER_TYPE = "custom:auto-entities";
const deviceAwareClone = (value) => JSON.parse(JSON.stringify(value));

class ComponentDeviceAwareAutoEntitiesV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._card = null;
    this._generation = 0;
    this._retryTimer = null;
    this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}.head{min-height:44px;display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px;color:var(--primary-text-color)}.head[hidden]{display:none}.head ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.head h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.body{min-width:0}</style><div class="head" hidden><ha-icon></ha-icon><h2></h2></div><div class="body"></div>`;
    this.$ = {
      head: this.shadowRoot.querySelector(".head"),
      body: this.shadowRoot.querySelector(".body"),
    };
  }

  setConfig(config) {
    if (!config?.filter) throw new Error("An Auto-Entities filter is required");
    this._config = deviceAwareClone(config);
    this._renderHeader();
    this._generation += 1;
    clearTimeout(this._retryTimer);
    this._retryTimer = null;
    if (this.isConnected && this._hass) void this._buildCard();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._card) this._card.hass = hass;
    if (this.isConnected && !this._card) void this._buildCard();
  }

  connectedCallback() {
    if (this._config && this._hass) void this._buildCard();
  }

  disconnectedCallback() {
    clearTimeout(this._retryTimer);
    this._retryTimer = null;
    this._generation += 1;
  }

  getCardSize() {
    return (this._card?.getCardSize?.() ?? 1) + (this.$.head.hidden ? 0 : 1);
  }

  getLayoutOptions() {
    return this._card?.getLayoutOptions?.() ?? {};
  }

  _renderHeader() {
    const header = this._config?.header;
    const title = String(header?.title || "").trim();
    this.$.head.hidden = !title;
    if (!title) return;
    this.$.head.querySelector("ha-icon").setAttribute("icon", header.icon || "mdi:format-list-bulleted");
    this.$.head.querySelector("h2").textContent = title;
  }

  _cardConfig() {
    const config = deviceAwareClone(this._config);
    const excludeInvalid = config.exclude_invalid_states !== false;
    delete config.header;
    delete config.exclude_invalid_states;
    config.type = DEVICE_AWARE_INNER_TYPE;
    const filter = config.filter ?? {};
    filter.exclude = Array.isArray(filter.exclude) ? [...filter.exclude] : [];
    if (excludeInvalid) {
      for (const state of ["unavailable", "unknown"]) {
        if (!filter.exclude.some((rule) => rule?.state === state && Object.keys(rule).length === 1)) {
          filter.exclude.push({ state });
        }
      }
    }
    config.filter = filter;
    config.unique = true;
    return config;
  }

  async _buildCard() {
    if (!this.isConnected || !this._config || !this._hass) return;
    const loadCardHelpers = globalThis.loadCardHelpers;
    if (typeof loadCardHelpers !== "function") return;
    const generation = ++this._generation;
    try {
      const helpers = await loadCardHelpers();
      if (generation !== this._generation || !this.isConnected) return;
      const card = helpers.createCardElement(this._cardConfig());
      card.hass = this._hass;
      this._card = card;
      this.$.body.replaceChildren(card);
    } catch {
      if (generation !== this._generation) return;
      clearTimeout(this._retryTimer);
      this._retryTimer = setTimeout(() => {
        this._retryTimer = null;
        void this._buildCard();
      }, 31000);
      if (!this._card) {
        const alert = document.createElement("ha-alert");
        alert.setAttribute("alert-type", "error");
        alert.textContent = "Household controls are temporarily unavailable.";
        this.$.body.replaceChildren(alert);
      }
    }
  }
}

customElements.get("component-device-aware-auto-entities-v1") ||
  customElements.define("component-device-aware-auto-entities-v1", ComponentDeviceAwareAutoEntitiesV1);
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
class DashboardPreferenceEditorV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.hiddenIds = new Set();
  }

  open(options) {
    this.options = options;
    this.items = options.items.map((item) => ({ ...item }));
    const ids = new Set(this.items.map((item) => item.id));
    this.hiddenIds = new Set((options.hidden || []).filter((id) => ids.has(id)));
    this.build();
    this.clearSaveError();
    this.render();
    this.dialog.showModal();
    queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus());
  }

  build() {
    if (this.built) return;
    this.built = true;
    this.shadowRoot.innerHTML = `
      <style>
        *{box-sizing:border-box}
        dialog{width:min(560px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,8px);padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}
        dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}
        button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}
        .header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--divider-color);background:var(--card-background-color)}
        h2{font-size:16px;line-height:1.2;font-weight:500;margin:0}
        .close,.move,.visibility{width:44px;height:44px;border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center;color:var(--secondary-text-color)}
        .close ha-icon,.move ha-icon,.visibility ha-icon{--mdc-icon-size:17px}
        .body{padding:12px 14px 88px}.copy{font-size:12px;color:var(--secondary-text-color);line-height:1.45;margin:0 2px 10px}.rows{display:grid;gap:7px}
        .row{min-height:56px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 6px}.row.off{opacity:.52}
        .icon{width:32px;height:32px;display:grid;place-items:center;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:18px}.name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{font-size:12px;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .actions,.buttons{display:flex;gap:8px}.move[disabled]{opacity:.22}.visibility.off{color:var(--error-color)}
        .save-error{margin:0;padding:10px 14px 0;color:var(--error-color);font-size:13px;line-height:1.4}
        .footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color)}.count{font-size:12px;color:var(--secondary-text-color)}
        .cancel,.save{min-height:44px;padding:0 13px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,6px);background:transparent;font-size:13px;font-weight:500}.save{min-width:84px;background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:transparent}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      </style>
      <dialog>
        <div class="header"><h2></h2><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
        <div class="body"><div class="copy"></div><div class="rows"></div></div>
        <p class="save-error" role="alert" hidden></p>
        <div class="footer"><span class="count"></span><span class="buttons"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save</button></span></div>
      </dialog>`;
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    this.shadowRoot.querySelector(".close").onclick = () => this.dialog.close();
    this.shadowRoot.querySelector(".cancel").onclick = () => this.dialog.close();
    this.shadowRoot.querySelector(".save").onclick = () => this.save();
  }

  render() {
    this.shadowRoot.querySelector("h2").textContent = this.options.title || "Edit";
    this.shadowRoot.querySelector(".copy").textContent = this.options.description || "Reorder or hide items.";
    const rows = this.shadowRoot.querySelector(".rows");
    rows.replaceChildren();
    this.items.forEach((item, index) => {
      const row = document.createElement("div");
      const hidden = this.hiddenIds.has(item.id);
      row.className = `row ${hidden ? "off" : ""}`;
      row.innerHTML = `<span class="icon"><ha-icon icon="${item.icon || "mdi:circle-outline"}"></ha-icon></span><span><div class="name"></div><div class="meta"></div></span><span class="actions"><button class="move up" type="button" aria-label="Move earlier" ${index === 0 ? "disabled" : ""}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="move down" type="button" aria-label="Move later" ${index === this.items.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="visibility ${hidden ? "off" : ""}" type="button" aria-label="${hidden ? "Show" : "Hide"}"><ha-icon icon="mdi:${hidden ? "eye-outline" : "eye-off-outline"}"></ha-icon></button></span>`;
      row.querySelector(".name").textContent = item.name;
      row.querySelector(".meta").textContent = item.meta || "";
      row.querySelector(".up").onclick = () => this.move(index, -1);
      row.querySelector(".down").onclick = () => this.move(index, 1);
      row.querySelector(".visibility").onclick = () => {
        if (hidden) this.hiddenIds.delete(item.id);
        else this.hiddenIds.add(item.id);
        this.render();
      };
      rows.append(row);
    });
    this.shadowRoot.querySelector(".count").textContent = `${this.items.length - this.hiddenIds.size} of ${this.items.length} shown`;
  }

  move(index, direction) {
    const next = index + direction;
    if (next < 0 || next >= this.items.length) return;
    [this.items[index], this.items[next]] = [this.items[next], this.items[index]];
    this.render();
  }

  clearSaveError() {
    const error = this.shadowRoot.querySelector(".save-error");
    if (!error) return;
    error.hidden = true;
    error.textContent = "";
  }

  async save() {
    const button = this.shadowRoot.querySelector(".save");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Saving…";
    this.clearSaveError();
    try {
      await this.options.onSave?.({
        order: this.items.map((item) => item.id),
        hidden: [...this.hiddenIds],
      });
      this.dialog.close();
    } catch (error) {
      const message = this.shadowRoot.querySelector(".save-error");
      if (message) {
        message.textContent = error?.message || "Couldn’t save these changes. Your current choices are still open; try again.";
        message.hidden = false;
      }
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Save";
    }
  }
}

if (!customElements.get("dashboard-preference-editor-v3")) {
  customElements.define("dashboard-preference-editor-v3", DashboardPreferenceEditorV3);
}
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
    return { error: registry.error, cameras: [], entries: [], quickActions: [], attention: [], allClear: false };
  }
  const include = new Set(profile.include_entities || []);
  const exclude = new Set(profile.exclude_entities || []);
  const areas = new Set(profile.area_ids || []);
  // First select dashboard roots by explicit inclusion / area. Then attach
  // every live sibling from the selected root's device. Integrations such as
  // Frigate often leave image/config entities unassigned even when the camera
  // entity itself has an area, so applying the area filter to siblings loses
  // detections and controls that belong to an otherwise selected camera.
  const availableEntities = (registry?.entities || []).filter((entity) => {
    if (!entity?.entity_id || entity.disabled_by || entity.hidden_by || !hass?.states?.[entity.entity_id]) return false;
    return !exclude.has(entity.entity_id);
  });
  const candidates = availableEntities.filter((entity) => {
    if (include.has(entity.entity_id)) return true;
    return !areas.size || areas.has(securityHD.areaOf(entity, registry));
  });
  const entities = candidates.filter((entity) => securityHD?.uiEntry?.(entity));
  const eligibleOwners = new Set(candidates.map((entity) => entity.device_id || entity.entity_id));
  const byDevice = new Map();
  for (const entity of availableEntities) {
    const owner = entity.device_id || entity.entity_id;
    const siblings = byDevice.get(owner) || [];
    siblings.push(entity);
    byDevice.set(owner, siblings);
  }

  const cameras = [];
  for (const [owner, siblings] of byDevice) {
    if (!eligibleOwners.has(owner)) continue;
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
    const classifications = siblings
      .filter((item) => securityDomain(item.entity_id) === "image")
      .map((item) => {
        const label = entityLabel(hass, item);
        const deviceName = String(device.name_by_user || device.name || "").trim();
        const name = deviceName && label.toLowerCase().startsWith(`${deviceName.toLowerCase()} `)
          ? label.slice(deviceName.length).trim()
          : label;
        return { entity: item, name };
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
      classifications,
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

  const supportedQuickActions = new Map([
    ["automation", "trigger"],
    ["scene", "turn_on"],
    ["script", "turn_on"],
  ]);
  const quickActions = Object.entries(profile.mappings || {}).flatMap(([role, entityId]) => {
    if (!role.startsWith("quick_action:")) return [];
    const domain = securityDomain(entityId);
    const service = supportedQuickActions.get(domain);
    const state = hass?.states?.[entityId];
    if (!service || !state) return [];
    const entity = (registry?.entities || []).find((item) => item.entity_id === entityId) || { entity_id: entityId };
    return [{
      id: role.slice("quick_action:".length),
      entityId,
      domain,
      service,
      name: entityLabel(hass, entity),
      icon: state.attributes?.icon || (domain === "script" ? "mdi:script-text-outline" : domain === "scene" ? "mdi:palette-outline" : "mdi:robot-outline"),
      available: !badSecurityState.has(String(state.state).toLowerCase()),
    }];
  });
  quickActions.sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));

  const attention = [
    ...cameras.filter((camera) => !camera.online).map((camera) => ({ type: "camera-offline", label: `${camera.name} unavailable`, entityId: camera.entityId })),
    ...cameras.filter((camera) => camera.active).map((camera) => ({ type: "camera-activity", label: `${camera.name} activity`, entityId: camera.entityId })),
    ...entries.filter((entry) => entry.available && entry.open).map((entry) => ({ type: "entry-open", label: `${entry.name} open`, entityId: entry.entityId })),
  ];
  return {
    error: null,
    cameras,
    entries,
    quickActions,
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
      quickActions: [],
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

const SINGLE_KPI_DEFAULTS = Object.freeze({
  value: "00",
  label: "Primary metric",
  support_value: "00",
  support_label: "Supporting context",
  interactive: true,
  entity: null,
  navigation_path: null,
});

class ComponentSingleKpiV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interactionHandle = null;
  }

  get c() {
    return this.config;
  }

  set c(config) {
    this.config = config;
  }

  get h() {
    return this._hass;
  }

  set h(hass) {
    this._hass = hass;
  }

  get _interaction() {
    return this._interactionHandle;
  }

  set _interaction(handle) {
    this._interactionHandle = handle;
  }

  setConfig(config) {
    this.c = {
      ...SINGLE_KPI_DEFAULTS,
      ...config,
    };
    this.r();
  }

  set hass(hass) {
    this.h = hass;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    this._destroyInteraction();
  }

  getCardSize() {
    return 2;
  }

  action() {
    return this._primaryAction();
  }

  _primaryAction() {
    if (this.config.interactive === false) return null;
    if (this.config.navigation_path) return () => navigateTo(this.config.navigation_path);
    if (this.config.entity) return () => openMoreInfo(this, this.config.entity);
    return null;
  }

  _destroyInteraction() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  _render() {
    this._destroyInteraction();

    const action = this.action();
    const tag = action ? "button" : "div";
    const className = action ? "demo" : "demo-static";
    const attributes = action ? ' type="button"' : "";

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-height:70px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em;white-space:nowrap}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color);white-space:nowrap}.support{text-align:right;font-size:11.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap}.support b{font-weight:600;color:var(--primary-text-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.support{font-size:11px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attributes}><div class="wrap"><div><div class="value">${escapeHtml(this.config.value)}</div><div class="label">${escapeHtml(this.config.label)}</div></div><div class="support"><b>${escapeHtml(this.config.support_value)}</b> ${escapeHtml(this.config.support_label)}</div></div></${tag}></ha-card>`;

    if (action) {
      const button = this.shadowRoot.querySelector("button.demo");
      this._interaction = interaction(button, { primary: action, feedback: true });
    }
  }

  r() {
    this._render();
  }
}

registerCard({ type: "component-single-kpi-v2", element: ComponentSingleKpiV2, name: "Single KPI", description: "Reusable single KPI component." });
}

// Module: src/components/three-stat-summary.js
{
/** ComponentThreeStatV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentThreeStatV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      metric_1_value: "00",
      metric_1_label: "Metric one",
      metric_2_value: "00",
      metric_2_label: "Metric two",
      metric_3_value: "00",
      metric_3_label: "Metric three",
      interactive: true,
      ...c,
    };
    this.r();
  }

  set hass(h) {
    this.h = h;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    // The interaction handles belong to the retained shadow DOM. They remain
    // valid during a transient detach and are replaced by the next render.
  }

  getCardSize() {
    return 2;
  }

  _clear() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  _action(i) {
    if (this.c.interactive === false) return null;

    const custom = this.c[`metric_${i}_action`];
    if (typeof custom === "function") return () => custom({ host: this, hass: this.h, index: i });

    const path = this.c[`metric_${i}_navigation_path`];
    if (path) return () => navigateTo(path);

    const entity = this.c[`metric_${i}_entity`];
    if (entity) return () => openMoreInfo(this, entity);

    return null;
  }

  r() {
    this._clear();

    const metrics = [1, 2, 3].map((index) => ({ index, action: this._action(index) }));
    const rows = metrics.map(({ index, action }) => {
      const tag = action ? "button" : "div";
      const attrs = action ? ' type="button"' : "";
      return `<${tag} class="stat" data-index="${index}"${attrs}><div class="value">${escapeHtml(this.c[`metric_${index}_value`])}</div><div class="label">${escapeHtml(this.c[`metric_${index}_label`])}</div></${tag}>`;
    }).join("");

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;min-height:70px;align-items:center}.stat{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;text-align:center;min-width:0;cursor:pointer}.stat:first-child{text-align:left}.stat:last-child{text-align:right}.stat:active{transform:scale(.98)}.stat:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:8px}.value{font-size:22px;line-height:1;font-weight:650;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label{margin-top:5px;font-size:10.5px;line-height:1.2;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.wrap{padding:12px;gap:8px}.value{font-size:20px}.label{font-size:10px}}</style><style>.stat:not(button){cursor:default}.stat:not(button):active{transform:none}.stat:not(button):focus-visible{outline:none}</style><ha-card><div class="wrap">${rows}</div></ha-card>`;

    for (const element of this.shadowRoot.querySelectorAll("button.stat")) {
      const metric = metrics.find(({ index }) => index === Number(element.dataset.index));
      this._interactions.push(interaction(element, { primary: metric.action, feedback: true }));
    }
  }
}

registerCard({ type: "component-three-stat-v2", element: ComponentThreeStatV2, name: "Three-stat Summary", description: "Reusable three-stat summary component." });
}

// Module: src/components/status-row.js
{
/** ComponentStatusRowV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentStatusRowV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interaction = null;
  }

  setConfig(c) {
    this.c = {
      title: "Status title",
      description: "Supporting description",
      status_value: "Active",
      status_label: "Current state",
      icon: "mdi:information-outline",
      interactive: true,
      entity: null,
      navigation_path: null,
      ...c,
    };
    this.r();
  }

  set hass(h) {
    this.h = h;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  getCardSize() {
    return 2;
  }

  action() {
    if (this.c.interactive === false) return null;
    if (this.c.navigation_path) return () => navigateTo(this.c.navigation_path);
    if (this.c.entity) return () => openMoreInfo(this, this.c.entity);
    return null;
  }

  r() {
    this._interaction?.destroy();
    this._interaction = null;

    const action = this.action();
    const tag = action ? "button" : "div";
    const className = action ? "demo" : "demo-static";
    const attrs = action ? ' type="button"' : "";

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;line-height:1.3;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status{text-align:right;white-space:nowrap}.status b{display:block;font-size:12px;font-weight:650}.status span{display:block;margin-top:3px;font-size:10.5px;color:var(--secondary-text-color)}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></div><div class="status"><b>${escapeHtml(this.c.status_value)}</b><span>${escapeHtml(this.c.status_label)}</span></div></div></${tag}></ha-card>`;

    if (action) {
      this._interaction = interaction(this.shadowRoot.querySelector("button.demo"), {
        primary: action,
        feedback: true,
      });
    }
  }
}

registerCard({ type: "component-status-row-v2", element: ComponentStatusRowV2, name: "Status Row", description: "Reusable status row component." });
}

// Module: src/components/progress-target.js
{
/** ComponentProgressV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentProgressV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interaction = null;
  }

  setConfig(c) {
    this.c = {
      value: "68%",
      label: "Progress metric",
      progress: 68,
      target_value: "100%",
      target_label: "Target",
      entity: null,
      navigation_path: null,
      ...c,
    };
    this.r();
  }

  set hass(h) {
    this.h = h;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  getCardSize() {
    return 2;
  }

  action() {
    if (this.c.navigation_path) return () => navigateTo(this.c.navigation_path);
    if (this.c.entity) return () => openMoreInfo(this, this.c.entity);
    return null;
  }

  r() {
    this._interaction?.destroy();
    this._interaction = null;

    const p = Math.min(100, Math.max(0, Number(this.c.progress) || 0));
    const action = this.action();

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;min-height:78px}.head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}.value{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.035em}.label{margin-top:4px;font-size:11px;color:var(--secondary-text-color)}.target{text-align:right;font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap}.target b{font-weight:600;color:var(--primary-text-color)}.track{height:5px;margin-top:11px;border-radius:999px;background:var(--secondary-background-color);overflow:hidden}.fill{height:100%;border-radius:inherit;background:var(--primary-color)}@media(max-width:700px){.wrap{padding:12px}.value{font-size:25px}.target{font-size:11px}}</style><style>.wrap.actionable{cursor:pointer}.wrap.actionable:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}</style><ha-card><div class="wrap ${action ? "actionable" : ""}" ${action ? 'role="button" tabindex="0"' : ""}><div class="head"><div><div class="value">${escapeHtml(this.c.value)}</div><div class="label">${escapeHtml(this.c.label)}</div></div><div class="target"><b>${escapeHtml(this.c.target_value)}</b> ${escapeHtml(this.c.target_label)}</div></div><div class="track"><div class="fill" style="width:${p}%"></div></div></div></ha-card>`;

    if (action) {
      this._interaction = interaction(this.shadowRoot.querySelector(".wrap"), {
        primary: action,
        feedback: true,
      });
    }
  }
}

registerCard({ type: "component-progress-v2", element: ComponentProgressV2, name: "Progress / Target", description: "Reusable progress and target component." });
}

// Module: src/components/action-card.js
{
/** ComponentActionV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentActionV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interaction = null;
  }

  setConfig(c) {
    this.c = { title: 'Action title', description: 'What this action will do', action_text: 'Open', icon: 'mdi:gesture-tap-button', ...c };
    this.r();
  }

  set hass(h) { this.h = h; }

  connectedCallback() { if (this.c) this.r(); }

  disconnectedCallback() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  getCardSize() { return 2; }

  actions() {
    const entity = this.c.more_info_entity || this.c.entity || null;
    const path = this.c.navigation_path || null;
    return {
      primary: path ? () => navigateTo(path) : entity ? () => openMoreInfo(this, entity) : null,
      hold: path && entity ? () => openMoreInfo(this, entity) : null,
    };
  }

  r() {
    this._interaction?.destroy();
    this._interaction = null;
    const actions = this.actions();
    const tag = actions.primary ? 'button' : 'div';
    const attrs = actions.primary ? ' type="button"' : '';
    const className = actions.primary ? 'demo' : 'demo-static';
    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:3px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action{min-height:32px;padding:0 10px;border-radius:11px;display:flex;align-items:center;background:var(--secondary-background-color);color:var(--primary-color);font-size:11.5px;font-weight:650;white-space:nowrap}@media(max-width:700px){.wrap{padding:12px}}</style><style>.demo-static{width:100%;border:0;background:transparent;text-align:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${escapeHtml(this.c.title)}</div><div class="desc">${escapeHtml(this.c.description)}</div></span><span class="action">${escapeHtml(this.c.action_text)}</span></div></${tag}></ha-card>`;
    if (actions.primary) this._interaction = interaction(this.shadowRoot.querySelector('button.demo'), { primary: actions.primary, hold: actions.hold, optimistic: false, repeat: false, feedback: true });
  }
}
registerCard({ type: "component-action-v2", element: ComponentActionV2, name: "Action Card", description: "Reusable navigation and more-info action card." });
}

// Module: src/components/list-ranking.js
{
/** ComponentListV2 — reusable Home Assistant dashboard card. */
const { PRESENTATIONAL_CARD_STYLES, escapeHtml, interaction, navigateTo, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentListV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interactions = [];
  }

  setConfig(c) {
    this.c = {
      rows: [
        { title: "First item", description: "Supporting detail", value: "00", label: "Metric" },
        { title: "Second item", description: "Supporting detail", value: "00", label: "Metric" },
        { title: "Third item", description: "Supporting detail", value: "00", label: "Metric" },
      ],
      interactive: true,
      ...c,
    };
    this.r();
  }

  set hass(h) { this.h = h; }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    // The interaction handles belong to the retained shadow DOM. They remain
    // valid during a transient detach and are replaced by the next render.
  }

  getCardSize() { return 3; }

  _clear() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  _actions(row) {
    if (this.c.interactive === false) return { primary: null, hold: null };
    const custom = typeof row.action === "function" ? () => row.action({ host: this, hass: this.h, row }) : null;
    const path = row.navigation_path || row.path || null;
    const entity = row.entity || row.more_info_entity || null;
    return {
      primary: custom || (path ? () => navigateTo(path) : entity ? () => openMoreInfo(this, entity) : null),
      hold: !custom && path && entity ? () => openMoreInfo(this, entity) : null,
    };
  }

  r() {
    this._clear();
    const rows = Array.isArray(this.c.rows) ? this.c.rows.slice(0, 6) : [];
    const records = rows.map((row, index) => {
      const actions = this._actions(row);
      const tag = actions.primary ? "button" : "div";
      const attributes = actions.primary ? ' type="button"' : "";
      return {
        actions,
        markup: `<${tag} class="row" data-index="${index}"${attributes}><span><div class="title">${escapeHtml(row.title)}</div><div class="desc">${escapeHtml(row.description)}</div></span><span class="metric"><b>${escapeHtml(row.value)}</b>${escapeHtml(row.label)}</span></${tag}>`,
      };
    });

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:2px 14px}.row{appearance:none;width:100%;border:0;border-top:1px solid var(--divider-color);background:transparent;color:inherit;font:inherit;min-height:54px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:0;text-align:left;cursor:pointer}.row:first-child{border-top:0}.row:active{background:var(--secondary-background-color)}.row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:8px}.title{font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desc{margin-top:2px;font-size:10.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric{text-align:right;white-space:nowrap;font-size:11px;color:var(--secondary-text-color)}.metric b{font-size:12px;font-weight:650;color:var(--primary-text-color);margin-right:4px}@media(max-width:700px){.wrap{padding:2px 12px}}</style><style>.row:not(button){cursor:default}.row:not(button):active{background:transparent}.row:not(button):focus-visible{outline:none}</style><ha-card><div class="wrap">${records.map((record) => record.markup).join("")}</div></ha-card>`;

    for (const element of this.shadowRoot.querySelectorAll("button.row")) {
      const record = records[Number(element.dataset.index)];
      this._interactions.push(interaction(element, { primary: record.actions.primary, hold: record.actions.hold, feedback: true }));
    }
  }
}

registerCard({ type: "component-list-v2", element: ComponentListV2, name: "List / Ranking", description: "Reusable list and ranking component." });
}

// Module: src/components/notice.js
{
/** ComponentNoticeV2 — reusable Home Assistant dashboard card. */
const {
  PRESENTATIONAL_CARD_STYLES,
  escapeHtml,
  interaction,
  navigateTo,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentNoticeV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interaction = null;
  }

  setConfig(c) {
    this.c = {
      title: "Notice title",
      message: "Important supporting information appears here.",
      tone: "info",
      icon: "mdi:information-outline",
      entity: null,
      navigation_path: null,
      ...c,
    };
    this.r();
  }

  set hass(h) {
    this.h = h;
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  getCardSize() {
    return 2;
  }

  action() {
    if (this.c.navigation_path) return () => navigateTo(this.c.navigation_path);
    if (this.c.entity) return () => openMoreInfo(this, this.c.entity);
    return null;
  }

  r() {
    this._interaction?.destroy();
    this._interaction = null;

    const tone = ["warning", "error", "success"].includes(this.c.tone) ? this.c.tone : "";
    const action = this.action();
    const actionable = action ? "actionable" : "";
    const attributes = action ? 'role="button" tabindex="0"' : "";

    this.shadowRoot.innerHTML = `<style>${PRESENTATIONAL_CARD_STYLES}.wrap{padding:12px 14px;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:10px;min-height:70px}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--secondary-background-color);color:var(--primary-color)}.warning .icon{color:var(--warning-color,var(--primary-color))}.error .icon{color:var(--error-color,var(--primary-color))}.success .icon{color:var(--success-color,var(--primary-color))}ha-icon{--mdc-icon-size:19px}.title{font-size:13px;font-weight:650}.message{margin-top:3px;font-size:10.5px;line-height:1.35;color:var(--secondary-text-color)}</style><style>.wrap.actionable{cursor:pointer}.wrap.actionable:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}</style><ha-card><div class="wrap ${tone} ${actionable}" ${attributes}><span class="icon"><ha-icon icon="${escapeHtml(this.c.icon)}"></ha-icon></span><div><div class="title">${escapeHtml(this.c.title)}</div><div class="message">${escapeHtml(this.c.message)}</div></div></div></ha-card>`;

    if (action) {
      this._interaction = interaction(this.shadowRoot.querySelector(".wrap"), {
        primary: action,
        feedback: true,
      });
    }
  }
}

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
      if (this.c?.left_entity && h && !h.states) {
        this.r();
        return;
      }
      this.r({ state, stateText });
      return;
    }

    const contextIcon = this.shadowRoot?.getElementById("context-icon");
    if (contextIcon && state) {
      contextIcon.hass = h;
      contextIcon.stateObj = state;
    }
  }

  disconnectedCallback() {
    // Reconnect renders the retained shadow DOM and replaces these handles.
    // Keeping them alive through a transient detach avoids dead controls.
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  _clearInteractions() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  getCardSize() { return 1; }

  moreInfo(entityId) { openMoreInfo(this, entityId); }

  navigate(path) { navigateTo(path); }

  formatState(state) {
    try {
      return this.h.formatEntityState(state);
    } catch {
      return String(state?.state || "");
    }
  }

  r(...snapshots) {
    if (!this.c) return;
    this._clearInteractions();
    const snapshot = snapshots[0] || (() => {
      const state = this.c.left_entity && this.h ? this.h.states[this.c.left_entity] : null;
      return { state, stateText: state ? this.formatState(state) : null };
    })();
    const { state: stateObj, stateText } = snapshot;

    const leftText = stateObj ? stateText : this.c.left_entity ? "Unavailable" : this.c.left_text;
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
      interaction(context, { primary: () => this.moreInfo(this.c.left_entity), feedback: true }),
      interaction(this.shadowRoot.getElementById("action-1"), { primary: () => this.navigate(this.c.action_1_path), feedback: true }),
      interaction(this.shadowRoot.getElementById("action-2"), { primary: () => this.navigate(this.c.action_2_path), feedback: true }),
    );
  }
}

registerCard({ type: "component-quick-nav-v2", element: ComponentQuickNavigationV2, name: "Quick Navigation", description: "Reusable quick navigation component." });
}

// Module: src/components/navigation-tile.js
{
/** ComponentNavigationTileV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, interaction, navigateTo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentNavigationTileV2 extends DashboardBaseCard {
  constructor() {
    super();
    this._interaction = null;
  }

  setConfig(c) {
    this.c = {
      icon: "mdi:door-open",
      title: "Destination",
      context: "Navigation",
      navigation_path: null,
      ...c,
    };
    this.r();
  }

  connectedCallback() {
    if (this.c) this.r();
  }

  disconnectedCallback() {
    this._interaction?.destroy();
    this._interaction = null;
  }

  getCardSize() {
    return 1;
  }

  r() {
    this._interaction?.destroy();
    this._interaction = null;
    const path = this.c.navigation_path;
    const tag = path ? "button" : "div";
    const attrs = path ? ' type="button"' : "";
    const className = path ? "i nav" : "nav nav-static";
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}.nav{width:100%;text-align:left}.wrap{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px}.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}</style><style>.nav-static{border:0;background:transparent;color:inherit;font:inherit;padding:0}</style><ha-card><${tag} class="${className}"${attrs}><div class="wrap"><span class="icon"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon></span><span><div class="title">${this.escapeHtml(this.c.title)}</div><div class="desc">${this.escapeHtml(this.c.context)}</div></span></div></${tag}></ha-card>`;
    if (path) {
      this._interaction = interaction(this.shadowRoot.querySelector("button.nav"), {
        primary: () => navigateTo(path),
        feedback: true,
      });
    }
  }
}
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
    // Local controls remain attached to the retained shadow DOM. Service
    // coalescing, unlike DOM interaction, must be released on disconnect.
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
    // The rendered media controls stay valid across a transient detach.
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
/** Thin Apple TV wrapper around native Home Assistant media controls. */
const { interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const APPLE_TV_REMOTE_COMMANDS = Object.freeze([
  ["up", "Up", "mdi:chevron-up"],
  ["left", "Left", "mdi:chevron-left"],
  ["select", "Select", "mdi:radiobox-marked"],
  ["right", "Right", "mdi:chevron-right"],
  ["down", "Down", "mdi:chevron-down"],
]);

const APPLE_TV_UTILITY_COMMANDS = Object.freeze([
  ["menu", "Menu", "mdi:menu"],
  ["home", "Home", "mdi:home-outline"],
  ["top_menu", "Top Menu", "mdi:format-list-bulleted"],
]);

const appleTvNativeTileConfig = (config) => ({
  type: "tile",
  entity: config.entity,
  ...(config.title ? { name: config.title } : {}),
  features_position: "bottom",
  features: [
    {
      type: "media-player-playback",
      controls: ["media_previous_track", "media_play_pause", "media_next_track"],
    },
    { type: "media-player-volume-buttons", show_mute_button: true },
    { type: "media-player-source" },
  ],
});

class ComponentAppleTvControllerV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._nativeCard = null;
    this._buildToken = 0;
    this._interactions = [];
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;min-width:0}*{box-sizing:border-box}.stack{display:grid;gap:8px}.remote{padding:12px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,8px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));color:var(--primary-text-color)}.remote[hidden]{display:none}.remote-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.remote-title{font-size:13px;font-weight:600}.power,.utility{display:flex;gap:6px;flex-wrap:wrap}.power button,.utility button,.dpad button,.keyboard button{appearance:none;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit;cursor:pointer}.power button,.utility button{min-height:44px;padding:0 10px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;font-size:12px}.power ha-icon,.utility ha-icon{--mdc-icon-size:17px}.dpad{width:min(230px,72vw);aspect-ratio:1;margin:8px auto 10px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:6px}.dpad button{border-radius:50%;display:grid;place-items:center}.dpad button.select{background:var(--card-background-color);color:var(--primary-color)}.dpad button.blank{visibility:hidden}.dpad ha-icon{--mdc-icon-size:26px}.utility{justify-content:center}.keyboard{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;margin-top:10px}.keyboard[hidden]{display:none}.keyboard input{min-width:0;height:44px;padding:0 10px;border:1px solid var(--divider-color);border-radius:10px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}.keyboard button{width:44px;height:44px;border-radius:10px;display:grid;place-items:center}.keyboard ha-icon{--mdc-icon-size:18px}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      </style>
      <div class="stack">
        <div class="native"></div>
        <section class="remote" hidden>
          <div class="remote-head">
            <span class="remote-title">Remote</span>
            <span class="power"></span>
          </div>
          <div class="dpad" aria-label="Apple TV directional remote"></div>
          <div class="utility"></div>
          <div class="keyboard" hidden>
            <input type="text" aria-label="Apple TV keyboard text" placeholder="Type on Apple TV" />
            <button class="keyboard-set" type="button" aria-label="Set keyboard text"><ha-icon icon="mdi:keyboard"></ha-icon></button>
            <button class="keyboard-clear" type="button" aria-label="Clear keyboard text"><ha-icon icon="mdi:backspace-outline"></ha-icon></button>
          </div>
        </section>
      </div>
    `;
    this.$ = {
      native: this.shadowRoot.querySelector(".native"),
      remote: this.shadowRoot.querySelector(".remote"),
      power: this.shadowRoot.querySelector(".power"),
      dpad: this.shadowRoot.querySelector(".dpad"),
      utility: this.shadowRoot.querySelector(".utility"),
      keyboard: this.shadowRoot.querySelector(".keyboard"),
      keyboardInput: this.shadowRoot.querySelector(".keyboard input"),
      keyboardSet: this.shadowRoot.querySelector(".keyboard-set"),
      keyboardClear: this.shadowRoot.querySelector(".keyboard-clear"),
    };
  }

  setConfig(config) {
    if (!config?.entity && !config?.demo) {
      throw new Error("An Apple TV media_player entity is required");
    }
    this._buildToken += 1;
    this._nativeCard = null;
    this.$.native.replaceChildren();
    this.config = {
      entity: config?.entity || "media_player.demo_apple_tv",
      title: config?.title || null,
      demo: Boolean(config?.demo),
      remote_entity: config?.remote_entity || null,
      keyboard_entity: config?.keyboard_entity || null,
      keyboard_config_entry_id:
        config?.keyboard_config_entry_id || config?.config_entry_id || null,
    };
    this._renderRemote();
    void this._buildNativeCard();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._nativeCard) this._nativeCard.hass = hass;
    this._renderRemoteAvailability();
  }

  connectedCallback() {
    this._renderRemote();
    void this._buildNativeCard();
  }

  disconnectedCallback() {
    this._destroyInteractions();
    this._buildToken += 1;
  }

  getCardSize() {
    return this.config?.remote_entity ? 4 : 2;
  }

  _destroyInteractions() {
    for (const handle of this._interactions) handle.destroy();
    this._interactions = [];
  }

  async _buildNativeCard() {
    if (!this.config || this._nativeCard || !this.isConnected) return;
    const loadCardHelpers = globalThis.loadCardHelpers;
    if (typeof loadCardHelpers !== "function") return;
    const token = ++this._buildToken;
    try {
      const helpers = await loadCardHelpers();
      if (token !== this._buildToken || !this.isConnected) return;
      const card = helpers.createCardElement(appleTvNativeTileConfig(this.config));
      card.hass = this._hass;
      this._nativeCard = card;
      this.$.native.replaceChildren(card);
    } catch (error) {
      console.error("Could not create native Apple TV media tile", error);
    }
  }

  _button(label, icon, action, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    const glyph = document.createElement("ha-icon");
    glyph.setAttribute("icon", icon);
    const text = document.createElement("span");
    text.textContent = label;
    if (className === "select" || className === "direction") {
      text.hidden = true;
    }
    button.append(glyph, text);
    this._interactions.push(
      interaction(button, { primary: action, feedback: true }),
    );
    return button;
  }

  _renderRemote() {
    if (!this.config) return;
    this._destroyInteractions();
    const remoteEntity = this.config.remote_entity;
    this.$.remote.hidden = !remoteEntity;
    if (!remoteEntity) {
      this.$.power.replaceChildren();
      this.$.dpad.replaceChildren();
      this.$.utility.replaceChildren();
      this.$.keyboard.hidden = true;
      return;
    }

    this.$.power.replaceChildren(
      this._button("Wake", "mdi:power-on", () => this._remoteCommand("wakeup")),
      this._button("Sleep", "mdi:power-sleep", () => this._remoteCommand("suspend")),
    );

    const byCommand = new Map(
      APPLE_TV_REMOTE_COMMANDS.map((item) => [item[0], item]),
    );
    const layout = [null, "up", null, "left", "select", "right", null, "down", null];
    this.$.dpad.replaceChildren(
      ...layout.map((command) => {
        if (!command) {
          const blank = document.createElement("button");
          blank.type = "button";
          blank.className = "blank";
          blank.tabIndex = -1;
          blank.setAttribute("aria-hidden", "true");
          return blank;
        }
        const [, label, icon] = byCommand.get(command);
        return this._button(
          label,
          icon,
          () => this._remoteCommand(command),
          command === "select" ? "select" : "direction",
        );
      }),
    );

    this.$.utility.replaceChildren(
      ...APPLE_TV_UTILITY_COMMANDS.map(([command, label, icon]) =>
        this._button(label, icon, () => this._remoteCommand(command)),
      ),
    );

    const hasKeyboard = Boolean(
      this.config.keyboard_entity && this.config.keyboard_config_entry_id,
    );
    this.$.keyboard.hidden = !hasKeyboard;
    if (hasKeyboard) {
      this._interactions.push(
        interaction(this.$.keyboardSet, {
          primary: () => this._keyboardAction("set_keyboard_text"),
          feedback: true,
        }),
        interaction(this.$.keyboardClear, {
          primary: () => this._keyboardAction("clear_keyboard_text"),
          feedback: true,
        }),
      );
    }
    this._renderRemoteAvailability();
  }

  _renderRemoteAvailability() {
    if (!this.config?.remote_entity) return;
    const remote = this._hass?.states?.[this.config.remote_entity];
    const remoteAvailable =
      this.config.demo || Boolean(remote && remote.state !== "unavailable");
    for (const button of this.$.remote.querySelectorAll("button")) {
      if (!button.classList.contains("blank")) button.disabled = !remoteAvailable;
    }
    const keyboardFocused =
      this.config.demo ||
      this._hass?.states?.[this.config.keyboard_entity]?.state === "on";
    this.$.keyboardInput.disabled = !keyboardFocused;
    this.$.keyboardSet.disabled = !keyboardFocused;
    this.$.keyboardClear.disabled = !keyboardFocused;
  }

  async _remoteCommand(command) {
    if (this.config?.demo || !this._hass || !this.config?.remote_entity) return;
    try {
      await this._hass.callService("remote", "send_command", {
        entity_id: this.config.remote_entity,
        command,
      });
    } catch (error) {
      console.error(`Apple TV remote command failed: ${command}`, error);
    }
  }

  async _keyboardAction(service) {
    if (
      this.config?.demo ||
      !this._hass ||
      !this.config?.keyboard_config_entry_id
    ) {
      return;
    }
    const data = { config_entry_id: this.config.keyboard_config_entry_id };
    if (service === "set_keyboard_text") {
      const text = this.$.keyboardInput.value;
      if (!text) return;
      data.text = text;
    }
    try {
      await this._hass.callService("apple_tv", service, data);
    } catch (error) {
      console.error(`Apple TV keyboard action failed: ${service}`, error);
    }
  }
}

registerCard({
  type: "component-apple-tv-controller-v1",
  element: ComponentAppleTvControllerV1,
  name: "Apple TV Controller",
  description:
    "Native Home Assistant media controls with an optional explicit Apple TV remote.",
});
}

// Module: src/components/section-separator.js
{
/** ComponentSectionSeparatorV2 — reusable Home Assistant dashboard card. */
const { DashboardBaseCard, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentSectionSeparatorV2 extends DashboardBaseCard {
  setConfig(config) {
    this.c = { icon: "mdi:gesture-tap-button", title: "Section label", ...config };
    this.r();
  }

  getCardSize() {
    return 1;
  }

  r() {
    this.shadowRoot.innerHTML = `<style>${this.cardStyles()}ha-card{background:transparent;border:0;box-shadow:none}.wrap{padding:7px 2px 5px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color)}.wrap ha-icon{color:var(--primary-color);--mdc-icon-size:18px}.label{font-size:12px;font-weight:600;color:var(--primary-text-color)}.line{height:1px;background:var(--divider-color);flex:1}</style><ha-card><div class="wrap"><ha-icon icon="${this.escapeHtml(this.c.icon)}"></ha-icon><span class="label">${this.escapeHtml(this.c.title)}</span><span class="line"></span></div></ha-card>`;
  }
}

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
 disconnectedCallback(){/* Retained room controls are replaced by the next render. */}
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
  disconnectedCallback(){clearTimeout(this._refreshTimer);this._refreshTimer=null;this._unsubscribe()}
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
const {
  escapeHtml,
  interaction,
  loadDashboardRegistries,
  navigateTo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
class ComponentRoomNavigationV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 6, rows: 1 };
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this._hass = null;
    this._connection = null;
    this._registries = null;
    this._registriesPromise = null;
    this._renderSignature = "";
    this._interaction = null;
  }
  setConfig(config) {
    this.c = {
      name: "Room",
      icon: "mdi:home-outline",
      area: null,
      navigation_path: null,
      ...config,
    };
    if (!this.c.area) throw new Error("area is required");
    if (!this.c.navigation_path) throw new Error("navigation_path is required");
    this._renderSignature = "";
    this._render();
  }
  set hass(hass) {
    const connection = (hass && hass.connection) || null;
    if (connection !== this._connection) {
      this._connection = connection;
      this._registries = null;
      this._registriesPromise = null;
      this._load();
    }
    this._hass = hass;
    this._render();
  }
  connectedCallback() {
    this._load();
    this._render();
  }
  disconnectedCallback() {
    // The retained tile remains interactive until reconnect renders it again.
  }
  _load() {
    const connection = this._connection;
    if (!connection || this._registries || this._registriesPromise) return;
    const request = loadDashboardRegistries(connection);
    this._registriesPromise = request;
    request
      .then((registries) => {
        if (connection !== this._connection) return;
        this._registries = registries;
        this._render();
      })
      .catch(() => {})
      .finally(() => {
        if (this._registriesPromise === request) this._registriesPromise = null;
      });
  }
  _escape(value) {
    return escapeHtml(value);
  }
  _entities() {
    if (!this._registries || !this._hass) return [];
    const areaKey = String(this.c.area).trim().toLowerCase();
    const area = this._registries.areas.find(
      (row) =>
        row.area_id === this.c.area ||
        String(row.name || "")
          .trim()
          .toLowerCase() === areaKey,
    );
    if (!area) return [];
    const deviceAreas = new Map(
      this._registries.devices.map((row) => [row.id, row.area_id]),
    );
    return this._registries.entities
      .filter(
        (row) =>
          row &&
          !row.disabled_by &&
          !row.hidden_by &&
          (row.area_id === area.area_id ||
            deviceAreas.get(row.device_id) === area.area_id),
      )
      .map((row) => this._hass.states[row.entity_id])
      .filter(Boolean);
  }
  _formatted(state) {
    try {
      return this._hass.formatEntityState(state);
    } catch (error) {
      return String((state && state.state) || "");
    }
  }
  _status() {
    const states = this._entities().filter(
      (state) => !["unknown", "unavailable"].includes(state.state),
    );
    const climate = states.find(
      (state) =>
        state.entity_id.startsWith("climate.") &&
        state.attributes &&
        !Number.isNaN(Number.parseFloat(state.attributes.current_temperature)),
    );
    const blockedTemperature =
      /(_controller_temperature|_outside_air_temperature|cpu_temperature|processor_temperature|board_temperature|chip_temperature|internal_temperature)$/;
    const byClass = (deviceClass) =>
      states.find(
        (state) =>
          state.entity_id.startsWith("sensor.") &&
          state.attributes &&
          state.attributes.device_class === deviceClass &&
          !blockedTemperature.test(state.entity_id) &&
          !Number.isNaN(Number.parseFloat(state.state)),
      );
    const temperature = byClass("temperature"),
      humidity = byClass("humidity");
    const climateTemperature = climate
      ? Number.parseFloat(climate.attributes.current_temperature)
      : null;
    const temperatureUnit =
      (climate &&
        (climate.attributes.temperature_unit ||
          (this._hass.config &&
            this._hass.config.unit_system &&
            this._hass.config.unit_system.temperature))) ||
      "°C";
    const temperatureText = climate
      ? climateTemperature.toLocaleString(
          (this._hass.locale && this._hass.locale.language) || undefined,
          { maximumFractionDigits: 1 },
        ) +
        " " +
        temperatureUnit
      : temperature
        ? this._formatted(temperature)
        : "";
    const lightsOn = states.filter(
      (state) => state.entity_id.startsWith("light.") && state.state === "on",
    ).length;
    const critical = states.some(
      (state) =>
        state.entity_id.startsWith("binary_sensor.") &&
        state.state === "on" &&
        ["smoke", "moisture", "gas"].includes(
          state.attributes && state.attributes.device_class,
        ),
    );
    const warning = states.some(
      (state) =>
        (state.entity_id.startsWith("binary_sensor.") &&
          state.state === "on" &&
          state.attributes &&
          state.attributes.device_class === "garage_door") ||
        (state.entity_id.startsWith("cover.") &&
          ["open", "opening"].includes(state.state) &&
          state.attributes &&
          state.attributes.device_class === "garage"),
    );
    const active =
      lightsOn > 0 ||
      states.some(
        (state) =>
          (state.entity_id.startsWith("climate.") &&
            ["heating", "cooling", "drying", "fan"].includes(
              state.attributes && state.attributes.hvac_action,
            )) ||
          (state.entity_id.startsWith("media_player.") &&
            state.state === "playing"),
      );
    const parts = [];
    if (critical) parts.push("Attention required");
    else if (warning) parts.push("Garage open");
    if (temperatureText) parts.push(temperatureText);
    if (humidity) parts.push(this._formatted(humidity));
    if (lightsOn)
      parts.push(lightsOn + " light" + (lightsOn === 1 ? "" : "s") + " on");
    return {
      summary: parts.slice(0, 3).join(" · "),
      severity: critical
        ? "critical"
        : warning
          ? "warning"
          : active
            ? "active"
            : "",
    };
  }
  _navigate() {
    navigateTo(this.c.navigation_path);
  }
  _presenceDetected() {
    if (this.c?.demo_presence === true) return true;
    if (this.c?.demo_presence === false) return false;
    const explicit = this.c?.presence_entity;
    if (explicit) {
      const state = this._hass?.states?.[explicit];
      return Boolean(
        state &&
          ["on", "home", "occupied", "present", "detected"].includes(
            String(state.state).toLowerCase(),
          ),
      );
    }
    return this._entities().some((state) => {
      if (
        !state?.entity_id?.startsWith("binary_sensor.") ||
        state.state !== "on"
      )
        return false;
      const deviceClass = String(
        state.attributes?.device_class || "",
      ).toLowerCase();
      const identity =
        `${state.entity_id} ${String(state.attributes?.friendly_name || "")}`.toLowerCase();
      return (
        deviceClass === "occupancy" ||
        deviceClass === "presence" ||
        identity.includes("presence") ||
        identity.includes("occupancy") ||
        identity.includes("mmwave")
      );
    });
  }
  _presenceHue() {
    const key = String(
      this.c?.presence_colour_key || this.c?.area || this.c?.name || "room",
    );
    let hash = 2166136261;
    for (let index = 0; index < key.length; index += 1) {
      hash ^= key.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (((hash >>> 0) % 360) + 360) % 360;
  }
  _render() {
    if (!this.c) return;
    const status = this._status(),
      summary = status.summary,
      presence = this._presenceDetected();
    const signature = JSON.stringify([
      this.c.name,
      this.c.icon,
      this.c.navigation_path,
      status.summary,
      status.severity,
      presence,
    ]);
    if (signature === this._renderSignature) return;
    this._renderSignature = signature;
    this._interaction?.destroy();
    this._interaction = null;
    const label = "Open " + this.c.name + (summary ? ". " + summary : "");
    this.shadowRoot.innerHTML =
      '<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));box-shadow:none;color:var(--primary-text-color)}button{appearance:none;width:100%;min-height:56px;padding:0 12px 0 10px;border:0;border-left:2px solid transparent;background:transparent;color:inherit;font:inherit;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px;cursor:pointer}.icon{width:36px;height:36px;display:grid;place-items:center;background:transparent;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:21px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}button.active{border-left-color:transparent;background:transparent}button.active .icon{color:color-mix(in srgb,var(--primary-color) 68%,var(--secondary-text-color))}button.warning{border-left-color:var(--warning-color,#f9a825);background:var(--dashboard-warning-surface,var(--card-background-color))}button.warning .icon{color:var(--warning-color,#f9a825)}button.critical{border-left-color:var(--error-color);background:var(--dashboard-critical-surface,var(--card-background-color))}button.critical .icon{color:var(--error-color)}button:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}@media(max-width:420px){button{padding-right:10px;gap:8px}}</style><ha-card><button class="' +
      this._escape(status.severity) +
      '" type="button" aria-label="' +
      this._escape(label) +
      '"><span class="icon"><ha-icon icon="' +
      this._escape(this.c.icon) +
      '"></ha-icon></span><span class="copy"><span class="name">' +
      this._escape(this.c.name) +
      "</span>" +
      (summary
        ? '<span class="summary">' + this._escape(summary) + "</span>"
        : "") +
      "</span></button></ha-card>";
    const card = this.shadowRoot.querySelector("ha-card");
    card.style.transition = "border-color 220ms ease, box-shadow 220ms ease";
    if (presence) {
      const hue = this._presenceHue();
      card.setAttribute("data-presence", "true");
      card.style.borderColor = `hsl(${hue} 82% 68% / .62)`;
      card.style.boxShadow = `0 0 0 1px hsl(${hue} 82% 68% / .18), 0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
    }
    this._interaction = interaction(this.shadowRoot.querySelector("button"), {
      primary: () => this._navigate(),
      feedback: true,
    });
  }
}
registerCard({
  type: "component-room-navigation-v1",
  element: ComponentRoomNavigationV1,
  name: "Room Navigation",
  description: "Area-aware room navigation with presence status.",
});
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
    // Legend controls are bound to retained shadow DOM and remain valid while
    // Home Assistant temporarily detaches the card.
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

class ComponentContextStripV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._interaction = null;
    this._hass = null;
  }

  setConfig(c) {
    this.c = {
      left_text: "Left context",
      center_1_label: "Primary metric",
      center_1_value: "00%",
      center_2_label: "Secondary metric",
      center_2_value: "00%",
      center_3_label: "Tertiary metric",
      center_3_value: "00%",
      right_text: "Right context",
      navigation_path: null,
      entity: null,
      ...(c || {}),
    };
    this._render();
  }

  set hass(h) { this._hass = h; }

  connectedCallback() {
    if (this.c) this._render();
  }

  disconnectedCallback() {
    // This card owns only an interaction bound to its retained shadow DOM.
    // Keep it live while Home Assistant temporarily moves the card; reconnect
    // renders a fresh view and releases the previous handle.
  }

  getCardSize() { return 1; }

  _action() {
    const path = this.c.navigation_path;
    if (path) return () => navigateTo(path);
    const entity = this.c.entity;
    if (entity) return () => openMoreInfo(this, entity);
    return null;
  }

  _render() {
    this._interaction?.destroy();
    this._interaction = null;

    const action = this._action();
    const tag = action ? "button" : "div";
    const rootClass = action ? "" : "context-static";
    const attributes = action ? ' type="button"' : "";
    const metrics = [1, 2, 3].map((index) => `<span class="item"><span class="lab">${escapeHtml(this.c[`center_${index}_label`])}</span><span class="val">${escapeHtml(this.c[`center_${index}_value`])}</span></span>`).join("");

    this.shadowRoot.innerHTML = `<style>
:host{display:block;min-width:0}ha-card{overflow:hidden;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
button{appearance:none;width:100%;min-height:44px;box-sizing:border-box;border:0;background:transparent;font:inherit;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;cursor:pointer;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;color:inherit}
button:active{transform:scale(.997)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px;border-radius:var(--ha-card-border-radius,16px)}
.phase{color:var(--primary-text-color);font-weight:600;text-align:left;justify-self:start;overflow:hidden;text-overflow:ellipsis}.event{color:var(--secondary-text-color);text-align:right;justify-self:end;overflow:hidden;text-overflow:ellipsis}
.mid{justify-self:center;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0;color:var(--secondary-text-color)}.item{display:flex;align-items:baseline;gap:4px}.lab{font-weight:500}.val{font-weight:600;color:var(--primary-text-color)}
@media(max-width:900px){button{gap:10px;padding:11px 12px;font-size:11px}.mid{gap:10px}.item{gap:3px}}
@media(max-width:650px){button{font-size:11px;gap:6px;padding:10px}.mid{gap:7px}}
</style><style>.context-static{width:100%;min-height:44px;box-sizing:border-box;padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden}@media(max-width:900px){.context-static{gap:10px;padding:11px 12px;font-size:11px}}@media(max-width:650px){.context-static{font-size:11px;gap:6px;padding:10px}}</style><ha-card><${tag} class="${rootClass}"${attributes}><span class="phase">${escapeHtml(this.c.left_text)}</span><span class="mid">${metrics}</span><span class="event">${escapeHtml(this.c.right_text)}</span></${tag}></ha-card>`;

    if (action) {
      this._interaction = interaction(this.shadowRoot.querySelector("button"), {
        primary: action,
        optimistic: false,
        repeat: false,
        feedback: true,
      });
    }
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
    // The retained action remains available until a reconnect render replaces it.
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
    // The retained detail and action controls are replaced by the next render.
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

class ComponentTextEffectV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.settleTimer = null;
  }

  setConfig(c) {
    if (!c?.text) throw new Error("text is required");
    this.c = {
      effect: "stamp",
      description: "",
      icon: null,
      speed: 2.6,
      ...c,
    };
    this.render();
  }

  set hass(h) { this.h = h; }

  connectedCallback() {
    const row = this.shadowRoot.querySelector(".row");
    if (this.c && !this.settleTimer && row && !row.classList.contains("settled")) this.render();
  }

  disconnectedCallback() {
    clearTimeout(this.settleTimer);
    this.settleTimer = null;
  }

  getCardSize() { return 1; }

  render() {
    clearTimeout(this.settleTimer);
    this.settleTimer = null;

    const c = this.c;
    const effect = ["stamp", "typewave", "overprint", "signal", "rainbow_stamp"].includes(c.effect) ? c.effect : "stamp";
    const speed = Math.max(1.6, Math.min(6, Number(c.speed) || 2.6));
    const text = escapeHtml(c.text);
    const icon = c.icon ? `<span class="icon"><ha-icon icon="${escapeHtml(c.icon)}"></ha-icon></span>` : "";

    this.shadowRoot.innerHTML = `<style>
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
</style><style>.row.settled .title:after,.row.settled .title:before,.row.settled .title{animation:none!important}.row.settled.typewave .title:after,.row.settled.overprint .title:after{display:none}.row.settled.stamp .title:after{opacity:.35;background:var(--primary-color)}.row.settled.signal .title:before{opacity:.45}.row.settled.signal .title:after{opacity:.7}</style><ha-card><div class="row ${effect}">${icon}<div class="copy"><div class="title" data-text="${text}"><span class="base">${text}</span></div>${c.description ? `<div class="desc">${escapeHtml(c.description)}</div>` : ""}</div></div></ha-card>`;

    const row = this.shadowRoot.querySelector(".row");
    this.settleTimer = setTimeout(() => {
      this.settleTimer = null;
      row?.classList.add("settled");
    }, Math.round(speed * 1000) + 80);
  }
}

registerCard({ type: "component-text-effect-v1", element: ComponentTextEffectV1, name: "Signature Text Effect", description: "Reusable transient-status effects using the existing signature motion language." });
}

// Module: src/components/split-system-controller.js
{
/** Native Home Assistant Split System controller with the established card presentation. */
const { interaction, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const unavailable = (state) => !state || ["unknown", "unavailable"].includes(state.state);
const label = (value) => String(value || "").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const degrees = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(Number(value) % 1 ? 1 : 0) + "°" : "—";

class ComponentSplitControllerV4 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._panel = null;
    this.shadowRoot.innerHTML = '<style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;background:transparent;cursor:pointer}ha-card{container-type:inline-size;overflow:hidden;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,var(--ha-card-border-radius,6px));background:var(--dashboard-card-surface,var(--ha-card-background,var(--card-background-color)));box-shadow:none;color:var(--primary-text-color)}.w{padding:12px 14px}.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;gap:12px}.hd.settings{grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px}.idn{min-width:0;min-height:44px;padding:0;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;text-align:left;border-radius:var(--dashboard-radius-control,8px)}.iw{width:40px;height:40px;border-radius:var(--dashboard-radius-icon,6px);display:grid;place-items:center;background:transparent;color:var(--primary-color)}ha-icon{--mdc-icon-size:20px}.cp{min-width:0}.nm,.st{display:block}.nm{font-size:13px;line-height:1.25;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st{margin-top:3px;font-size:13px;line-height:1.25;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw{width:44px;height:44px;padding:0;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.pw.on{color:var(--primary-color)}button[disabled],button[aria-disabled=true]{opacity:.45;cursor:default}.ct{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.cr{display:grid;grid-template-columns:minmax(120px,1fr) auto;align-items:center;gap:16px}.cr.to{grid-template-columns:auto;justify-content:end}.rv{font-size:27px;line-height:1;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.ml{display:block;margin-top:6px;color:var(--secondary-text-color);font-size:13px;line-height:1.2}.tc{min-height:48px;display:grid;grid-template-columns:44px minmax(82px,auto) 44px;align-items:center;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;overflow:hidden}.tb{width:44px;height:48px;padding:0;display:grid;place-items:center}.tp{min-width:0;padding:0 8px;text-align:center}.tv{font-size:18px;line-height:1.1;font-weight:650;font-variant-numeric:tabular-nums}.ts{margin-top:3px;color:var(--secondary-text-color);font-size:13px;line-height:1.1;white-space:nowrap}.os,.uv{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.as{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.a{min-width:0;min-height:44px;flex:1 1 118px;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:flex;align-items:center;justify-content:center;gap:7px;color:var(--secondary-text-color)}.a ha-icon{--mdc-icon-size:18px}.al{min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.a.av,.a[aria-expanded=true]{color:var(--primary-color);background:var(--dashboard-active-surface,var(--card-background-color))}.pn{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;overscroll-behavior:contain;padding:16px;background:var(--dashboard-modal-scrim,var(--ha-dialog-scrim-color,color-mix(in srgb,var(--primary-text-color) 32%,transparent)))}.pd{width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;padding:12px 14px 14px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-dialog,8px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}.ph{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px}.pt{margin:0;font-size:18px;line-height:1.2;font-weight:650}.x{width:44px;height:44px;border-radius:var(--dashboard-radius-control,8px);display:grid;place-items:center}.og+.og{margin-top:12px;padding-top:12px;border-top:1px solid var(--divider-color)}.gt{margin:0 4px 8px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.qs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.o{min-height:50px;width:100%;padding:0 10px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);display:grid;grid-template-columns:20px minmax(0,1fr) 20px;align-items:center;gap:8px;text-align:left;background:transparent;font-size:13px;font-weight:600}.oi{color:var(--secondary-text-color)}.o[aria-selected=true]{color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}.o[aria-selected=true] .oi{color:var(--primary-color)}.tpr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tpr button,.tcu button,.tac button{min-height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.tpr button{display:flex;align-items:center;justify-content:center;gap:6px}.tcu{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px;margin-top:12px}.tcu label{font-size:13px;color:var(--secondary-text-color)}.tcu input{display:block;width:100%;height:44px;margin-top:6px;padding:0 11px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,5px);background:transparent}.tcu button{padding:0 14px;color:var(--primary-color)}.tac{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.tac button:first-child{color:var(--primary-color)}.tac button:last-child{color:var(--error-color)}.fb{font-size:13px;line-height:1.35;color:var(--secondary-text-color)}.fb:not(:empty){margin-top:10px}.fb.er{color:var(--error-color)}:is(button,input):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}@container (max-width:400px){.w{padding:12px}.as .a{flex-basis:calc(50% - 4px)}}@container (max-width:340px){.cr{grid-template-columns:1fr;justify-content:stretch}.tc{width:100%}}\n      </style><ha-card><div class="w"><div class="hd"><button class="idn" type="button"><span class="iw"><ha-icon class="mi"></ha-icon></span><span class="cp"><span class="nm"></span><span class="st" role="status"></span></span></button><button class="pw sg" type="button" aria-label="Advanced settings"><ha-icon icon="mdi:cog-outline"></ha-icon></button><button class="pw" type="button" aria-label="Toggle split system power"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="ct"><div class="cr"><div class="rm"><span class="rv"></span><span class="ml">Room temperature</span></div><div class="tc"><button class="tb decrease" type="button" aria-label="Decrease target temperature"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tp"><div class="tv"></div><div class="ts"></div></div><button class="tb increase" type="button" aria-label="Increase target temperature"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="os"></div><div class="uv"></div><div class="as"><button class="a ma" type="button" data-panel="mode" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:thermostat"></ha-icon><span class="al"></span></button><button class="a fa" type="button" data-panel="fan" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:fan"></ha-icon><span class="al"></span></button><button class="a va" type="button" data-panel="vanes" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:swap-vertical"></ha-icon><span class="al"></span></button><button class="a ta" type="button" data-panel="timer" aria-controls="split-secondary" aria-expanded="false"><ha-icon icon="mdi:timer-outline"></ha-icon><span class="al"></span></button></div></div><div class="fb" role="status" aria-live="polite"></div></div></ha-card><section class="pn" id="split-secondary" role="dialog" aria-modal="true" aria-labelledby="split-pt" hidden><div class="pd"><div class="ph"><h3 class="pt" id="split-pt"></h3><button class="x" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="pb"></div></div></section>';
    this.$ = Object.fromEntries([...this.shadowRoot.querySelectorAll("[class]")].flatMap((node) => [...node.classList].map((name) => [name, node])));
    Object.assign(this.$, { identity: this.$.idn, name: this.$.nm, state: this.$.st, power: this.$.pw, settings: this.$.sg, room: this.$.rv, target: this.$.tv, minus: this.$.decrease, plus: this.$.increase, mode: this.$.ma, fan: this.$.fa, vanes: this.$.va, timer: this.$.ta, overlay: this.$.pn, close: this.$.x, panel: this.$.pb });
    const bind = (element, action) => interaction(element, { primary: action, feedback: true });
    this._handles = [bind(this.$.power, () => this._power()), bind(this.$.minus, () => this._temperature(-1)), bind(this.$.plus, () => this._temperature(1)), bind(this.$.mode, () => this._open("mode")), bind(this.$.fan, () => this._open("fan")), bind(this.$.vanes, () => this._open("vanes")), bind(this.$.timer, () => this._open("timer")), bind(this.$.settings, () => this._open("settings"))];
    this.$.close.addEventListener("click", () => this._close());
    this.$.overlay.addEventListener("click", (event) => { if (event.target === this.$.overlay) this._close(); });
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("A climate entity is required");
    this._config = { entity: config.entity, title: config.title, vertical_vane_entity: config.vertical_vane_entity || config.vertical_vane, horizontal_vane_entity: config.horizontal_vane_entity || config.horizontal_vane, timer_entity: config.timer_entity, settings_entities: config.settings_entities || [], profile_entities: config.profile_entities || [] };
    this.config = this._config;
    this._refresh();
  }
  set hass(hass) { this._hass = hass; this._refresh(); }
  _state(entity = this._config?.entity) { return this._hass?.states?.[entity]; }
  _call(domain, service, data) { return this._hass?.callService?.(domain, service, data); }
  _power() { const state = this._state(); return this._call("climate", state?.state === "off" ? "turn_on" : "turn_off", { entity_id: this._config.entity }); }
  _temperature(direction) { const attributes = this._state()?.attributes || {}, value = Number(attributes.temperature), step = Number(attributes.target_temp_step) || 0.5; if (Number.isFinite(value)) return this._call("climate", "set_temperature", { entity_id: this._config.entity, temperature: value + direction * step }); }
  _vanes() { return [["Vertical", this._config?.vertical_vane_entity], ["Horizontal", this._config?.horizontal_vane_entity]].flatMap(([axis, entity]) => { const state = this._state(entity); return entity && state && !unavailable(state) ? [{ axis, entity, state }] : []; }); }

  _refresh() {
    if (!this._config) return;
    const state = this._state(), attributes = state?.attributes || {}, on = state && !unavailable(state) && state.state !== "off", timer = this._state(this._config.timer_entity);
    this.$.name.textContent = this._config.title || attributes.friendly_name || "Split system";
    this.$.state.textContent = unavailable(state) ? "Unavailable" : on ? label(state.state) : "Off";
    this.$.room.textContent = degrees(attributes.current_temperature); this.$.target.textContent = degrees(attributes.temperature);
    this.$.power.classList.toggle("on", on); this.$.power.disabled = unavailable(state); this.$.minus.disabled = !on; this.$.plus.disabled = !on;
    this.$.mode.querySelector("span").textContent = "Mode · " + label(state?.state); this.$.fan.querySelector("span").textContent = "Fan · " + label(attributes.fan_mode);
    const vaneSummary = this._vanes().map((vane) => vane.axis.slice(0, 1) + " " + label(vane.state.state)).join(" · ");
    this.$.vanes.hidden = !vaneSummary; this.$.vanes.querySelector("span").textContent = "Vanes · " + vaneSummary;
    this.$.timer.hidden = !this._config.timer_entity; this.$.timer.classList.toggle("active", timer?.state === "active"); this.$.timer.querySelector("span").textContent = timer?.state === "active" ? "Timer · Active" : "Timer";
    this.$.settings.hidden = false;
  }
  _close() { this.$.overlay.hidden = true; }
  _open(kind) {
    this.$.overlay.hidden = false; this.$.panel.replaceChildren(); this.$.overlay.querySelector("h3").textContent = { mode: "Mode", fan: "Fan", vanes: "Vanes", timer: "Off timer", settings: "Settings" }[kind];
    if (kind === "mode") return this._choices(this._state()?.attributes?.hvac_modes || [], this._state()?.state, (value) => this._call("climate", "set_hvac_mode", { entity_id: this._config.entity, hvac_mode: value }));
    if (kind === "fan") return this._choices(this._state()?.attributes?.fan_modes || [], this._state()?.attributes?.fan_mode, (value) => this._call("climate", "set_fan_mode", { entity_id: this._config.entity, fan_mode: value }));
    if (kind === "vanes") return this._vanePanel();
    if (kind === "timer") return this._timerPanel();
    this._settingsPanel();
  }
  _choices(values, selected, choose, parent = this.$.panel) { const grid = document.createElement("div"); grid.className = "qs choices"; values.forEach((value) => { const button = document.createElement("button"); button.className = "o choice"; button.type = "button"; button.textContent = label(value); button.setAttribute("aria-selected", String(value === selected)); button.addEventListener("click", () => { choose(value); this._close(); }); grid.append(button); }); parent.append(grid); }
  _vanePanel() { this._vanes().forEach((vane) => { const group = document.createElement("section"), heading = document.createElement("p"); group.className = "group"; heading.className = "group-title"; heading.textContent = vane.axis + " vane"; group.append(heading); this._choices(vane.state.attributes.options || [], vane.state.state, (option) => this._call("select", "select_option", { entity_id: vane.entity, option }), group); this.$.panel.append(group); }); }
  _timerPanel() { const row = document.createElement("div"); row.className = "tpr timers"; [["30 min", "00:30:00"], ["1 hour", "01:00:00"], ["2 hours", "02:00:00"]].forEach(([name, duration]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = name; button.addEventListener("click", () => this._call("timer", "start", { entity_id: this._config.timer_entity, duration })); row.append(button); }); const actions = document.createElement("div"); actions.className = "tac"; const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel timer"; cancel.addEventListener("click", () => this._call("timer", "cancel", { entity_id: this._config.timer_entity })); actions.append(cancel); this.$.panel.append(row, actions); }
  _settingsPanel() { const attributes = this._state()?.attributes || {}; const summary = document.createElement("p"); summary.className = "fb"; const minimum = Number(attributes.min_temp), maximum = Number(attributes.max_temp), step = Number(attributes.target_temp_step) || 0.5; summary.textContent = `Native Home Assistant controls · ${degrees(minimum)}–${degrees(maximum)} · ${degrees(step)} steps`; this.$.panel.append(summary); const shortcuts = document.createElement("div"); shortcuts.className = "qs"; if (this._vanes().length) { const vanes = document.createElement("button"); vanes.className = "o"; vanes.type = "button"; vanes.textContent = "Vane settings"; vanes.addEventListener("click", () => this._open("vanes")); shortcuts.append(vanes); } if (this._config.timer_entity) { const timer = document.createElement("button"); timer.className = "o"; timer.type = "button"; timer.textContent = "Off timer"; timer.addEventListener("click", () => this._open("timer")); shortcuts.append(timer); } this.$.panel.append(shortcuts); [...this._config.settings_entities, ...this._config.profile_entities].forEach((entry) => { const entity = typeof entry === "string" ? entry : entry?.entity; if (!entity) return; const button = document.createElement("button"); button.className = "o setting"; button.type = "button"; button.textContent = typeof entry === "object" && entry.name ? entry.name : this._state(entity)?.attributes?.friendly_name || entity; button.addEventListener("click", () => { const [domain] = entity.split("."); this._call(domain, "turn_on", { entity_id: entity }); }); this.$.panel.append(button); }); }
}
registerCard({ type: "component-split-controller-v4", element: ComponentSplitControllerV4, name: "Split-System Controller", description: "Direct Home Assistant climate controls with the established Split System presentation." });
}

// Module: src/components/favourites.js
{
/** ComponentFavouritesV3 — reusable Home Assistant dashboard card. */
const {
  escapeHtml,
  interaction,
  openMoreInfo,
  registerCard,
  waitForEntityState,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
const FAVOURITES_V3_DOMAINS = new Set([
    "automation",
    "button",
    "climate",
    "cover",
    "fan",
    "humidifier",
    "input_boolean",
    "input_button",
    "light",
    "lock",
    "media_player",
    "scene",
    "script",
    "select",
    "switch",
    "vacuum",
    "water_heater",
  ]),
  FAVOURITES_V3_INVALID = new Set(["unavailable", "unknown"]);
class ComponentFavouritesV3 extends HTMLElement {
  constructor() {
    super(),
      this.attachShadow({ mode: "open" }),
      (this._registry = null),
      (this._registryPromise = null),
      (this._selected = []),
      (this._draft = []),
      (this._originalDraft = ""),
      (this._pending = new Map()),
      (this._flash = new Map()),
      (this._flashTimers = new Map()),
      (this._lastStorageSignature = ""),
      (this._noticeTimer = null),
      (this._registrySubscription = null),
      (this._registryRefreshTimer = null),
      (this._renderSignature = ""),
      (this._editorStorageSignature = ""),
      (this._connection = null),
      (this._interactionHandles = []),
      (this._optimistic = new Map()),
      (this._preferenceLoaded = false),
      (this._preferenceError = null),
      (this._preferencePromise = null),
      (this._preferenceSubscription = null),
      (this._preferenceReloadPending = false);
  }
  setConfig(t) {
    this._unsubscribePreferenceEvents();
    const e = Array.isArray(t?.helpers)
        ? t.helpers.filter((t) => "string" == typeof t)
        : [],
      i = Array.isArray(t?.items) ? t.items.slice(0, 4) : [],
      s = String(t?.preference_key || "").trim();
    if (!e.length && !i.length && !s)
      throw new Error("helpers, items or preference_key is required");
    this._legacyFavouriteHelpers = s ? e.slice(0, 4) : [];
    this._preferenceLoaded = !s;
    this._preferenceError = null;
    this._preferencePromise = null;
    this._preferenceReloadPending = false;
    (this.config = {
      title: "Favourites",
      max: 4,
      show_header: e.length > 0 || Boolean(s),
      ...t,
      helpers: s ? [] : e.slice(0, 4),
      items: i,
      preference_key: s || null,
    }),
      this._build(),
      this._subscribePreferenceEvents(),
      this._syncStored(),
      this._renderGrid();
  }
  set hass(t) {
    const e = this._connection;
    (this._hass = t),
      (this._connection = t?.connection || null),
      this._built || this._build(),
      e !== this._connection &&
        (this._unsubscribeRegistryEvents(), this._subscribeRegistryEvents()),
      this._syncStored(),
      this._ensureRegistry();
    const i = this._gridSignature();
    i !== this._renderSignature &&
      ((this._renderSignature = i), this._renderGrid()),
      this.$?.editor?.open && this._updateEditorState(),
      this._controllerCard && (this._controllerCard.hass = t);
  }
  getCardSize() {
    return 2;
  }
  connectedCallback() {
    (this._connection = this._hass?.connection || null),
      this._subscribeRegistryEvents(),
      this._ensureRegistry();
  }
  disconnectedCallback() {
    // Controls are bound to retained shadow DOM and are replaced on render.
    this._optimistic.clear();
    clearTimeout(this._noticeTimer),
      clearTimeout(this._registryRefreshTimer),
      (this._registryRefreshTimer = null),
      this._unsubscribeRegistryEvents();
    for (const t of this._flashTimers.values()) clearTimeout(t);
    this._flashTimers.clear();
  }
  _subscribeRegistryEvents() {
    if (
      !this.isConnected ||
      this._registrySubscription ||
      !this._connection?.subscribeEvents
    )
      return;
    const t = Promise.all(
      [
        "entity_registry_updated",
        "device_registry_updated",
        "area_registry_updated",
      ].map((e) =>
        this._connection.subscribeEvents(() => this._queueRegistryRefresh(), e),
      ),
    ).then((t) => () => {
      for (const e of t) e?.();
    });
    (this._registrySubscription = t),
      t.catch(() => {
        this._registrySubscription === t && (this._registrySubscription = null);
      });
    this._subscribePreferenceEvents();
  }
  _subscribePreferenceEvents() {
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
  }
  _unsubscribeRegistryEvents() {
    const t = this._registrySubscription;
    (this._registrySubscription = null),
      t &&
        Promise.resolve(t)
          .then((t) => t?.())
          .catch(() => {});
    this._unsubscribePreferenceEvents();
  }
  _unsubscribePreferenceEvents() {
    const preferenceSubscription = this._preferenceSubscription;
    this._preferenceSubscription = null;
    preferenceSubscription &&
      Promise.resolve(preferenceSubscription)
        .then((unsubscribe) => unsubscribe?.())
        .catch(() => {});
  }
  _queueRegistryRefresh() {
    clearTimeout(this._registryRefreshTimer),
      (this._registryRefreshTimer = setTimeout(() => {
        (this._registryRefreshTimer = null),
          (this._registry = null),
          (this._registryPromise = null),
          (this._registryError = null),
          (this._renderSignature = ""),
          this.isConnected && this._ensureRegistry();
      }, 180));
  }
  _storageSignature() {
    if (this.config?.preference_key) return JSON.stringify(this._selected);
    return JSON.stringify(
      (this.config?.helpers || []).map((t) => this._hass?.states?.[t]?.state),
    );
  }
  _gridSignature() {
    if (!this.config) return "";
    return JSON.stringify([
      this._storageSignature(),
      this._selected.map((t, s) => {
        const e = this._record(t),
          i = this._companion(e);
        return [
          this._refKey(t),
          this._name(e),
          this._icon(e),
          e.state?.state,
          this._stateLabel(e),
          this._isActive(e),
          i?.state?.state,
          this._pending.get(s)?.label || "",
          this._flash.get(s)?.kind || "",
          this._flash.get(s)?.label || "",
        ];
      }),
    ]);
  }
  _build() {
    if (this.config && !this._built) {
      (this._built = !0),
        (this.shadowRoot.innerHTML =
          '\n      <style>\n        :host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button{appearance:none;border:0;cursor:pointer}ha-card{border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.wrap{padding:0}.head{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.heading{display:flex;align-items:center;gap:8px;min-width:0}.heading ha-icon{color:var(--primary-color);--mdc-icon-size:19px}.heading h2{margin:0;font-size:18px;line-height:1.2;font-weight:650}.edit{min-width:44px;min-height:44px;padding:0 10px;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--primary-color);display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:600}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.edit ha-icon{--mdc-icon-size:18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:448px}.item{position:relative;min-width:0;min-height:52px;display:grid;grid-template-columns:minmax(0,1fr) auto;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color));overflow:hidden}.main{min-width:0;min-height:52px;padding:6px 8px;text-align:left;background:transparent;display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:8px}.item.has-quick .main{padding-right:4px}.main:active,.quick:active{background:color-mix(in srgb,var(--primary-color) 10%,transparent)}.main:focus-visible,.quick:focus-visible,.edit:focus-visible,.dialog-button:focus-visible,.choice:focus-visible,.order:focus-visible,.remove:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.icon{width:32px;height:32px;display:grid;place-items:center;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--primary-color)}.icon ha-icon{--mdc-icon-size:20px}.copy{min-width:0}.name,.state{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;font-weight:650}.state{margin-top:2px;font-size:13px;color:var(--secondary-text-color)}.item.active{background:var(--dashboard-active-surface,var(--card-background-color));box-shadow:inset 2px 0 0 var(--primary-color)}.item.active .icon{background:transparent;color:var(--primary-color)}.item.active .state{color:var(--primary-color);font-weight:600}.item.unavailable{opacity:.55}.quick{width:44px;min-height:52px;padding:0;border-left:1px solid var(--dashboard-card-border-color,var(--divider-color));background:transparent;color:var(--primary-color);display:grid;place-items:center}.quick ha-icon{--mdc-icon-size:21px}.item:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;opacity:0;transform-origin:left}.item.pending:after{opacity:1;background:linear-gradient(90deg,transparent,var(--primary-color),transparent);animation:favourite-progress 1.05s linear infinite}.item.success:after{opacity:1;background:var(--success-color,#43a047)}.item.error:after{opacity:1;background:var(--error-color)}@keyframes favourite-progress{from{transform:translateX(-100%)}to{transform:translateX(100%)}}.empty,.load-error{grid-column:1/-1;min-height:44px;padding:9px 11px;border:1px dashed var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:transparent;color:var(--secondary-text-color);font-size:13px;line-height:1.35}.notice{min-height:0;margin-top:0;font-size:13px;color:var(--secondary-text-color)}.notice:not(:empty){margin-top:7px}.notice.error{color:var(--error-color)}dialog{box-sizing:border-box;border:var(--dashboard-card-border,1px solid var(--divider-color));padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}.editor{width:min(580px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 24px));border-radius:var(--dashboard-radius-dialog,8px)}.dialog-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:transparent;border-bottom:1px solid var(--divider-color)}.dialog-title{font-size:20px;font-weight:650}.close{width:44px;height:44px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.editor-body{padding:14px 16px 96px}.editor-copy{font-size:13px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:12px}.subheading{margin:14px 0 7px;font-size:13px;font-weight:650;color:var(--primary-text-color)}.selected{display:grid;gap:7px}.selected-row{min-height:62px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px;padding:6px 7px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,6px);background:var(--dashboard-card-surface,var(--card-background-color))}.selected-row .icon{background:transparent}.selected-copy{min-width:0}.selected-meta{font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.alias{width:100%;height:44px;margin-top:3px;padding:0 8px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,8px);background:transparent;font-size:13px;outline:none}.alias:focus{border-color:var(--primary-color)}.selected-actions{display:flex;align-items:center;gap:2px}.order,.remove{width:44px;height:44px;border-radius:var(--dashboard-radius-icon,6px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center}.order[disabled]{opacity:.3;cursor:default}.remove{color:var(--error-color)}.order ha-icon,.remove ha-icon{--mdc-icon-size:18px}.search{width:100%;min-height:46px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;outline:none}.search:focus{border-color:var(--primary-color)}.available{margin-top:8px}.group-title{padding:10px 4px 5px;font-size:13px;font-weight:650;color:var(--secondary-text-color)}.choice{width:100%;min-height:58px;padding:6px 7px;border-radius:var(--dashboard-radius-control,8px);background:transparent;text-align:left;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px}.choice:hover{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.choice-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.choice-meta{margin-top:2px;font-size:13px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.add{color:var(--primary-color);font-size:13px;font-weight:650;padding-right:4px}.available-empty{padding:10px 7px;color:var(--secondary-text-color);font-size:13px}.editor-actions{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;background:transparent;border-top:1px solid var(--divider-color)}.count{font-size:13px;color:var(--secondary-text-color)}.action-buttons{display:flex;gap:8px}.dialog-button{min-height:44px;padding:0 13px;border:1px solid var(--dashboard-card-border-color,var(--divider-color));border-radius:var(--dashboard-radius-control,5px);background:transparent;font-size:13px;font-weight:650}.dialog-button.primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}.dialog-button[disabled]{opacity:.45;cursor:default}.editor-error{min-height:0;margin-top:8px;color:var(--error-color);font-size:13px}.confirm{width:min(430px,calc(100vw - 28px));border-radius:var(--dashboard-radius-dialog,8px)}.confirm-body{padding:18px}.confirm-title{font-size:18px;font-weight:650}.confirm-message{margin-top:7px;font-size:13px;line-height:1.45;color:var(--secondary-text-color)}.confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.controller{width:min(620px,calc(100vw - 20px));max-height:calc(100vh - 20px);border-radius:var(--dashboard-radius-dialog,8px);overflow:auto}.controller-body{padding:12px}.controller-body>*{display:block}.controller .dialog-head{border-bottom:0}@media(max-width:420px){.head{margin-bottom:6px}.edit span{display:none}.edit{padding:0}.grid{gap:8px}.main{padding:6px}.editor-body{padding:12px 12px 94px}.dialog-head{padding:12px}.editor-actions{padding:11px 12px}.selected-row{grid-template-columns:30px minmax(0,1fr) auto;gap:7px;padding:5px}.selected-actions{gap:0}.order,.remove{width:44px}.choice{padding:5px}}\n      </style>\n      <ha-card>\n        <div class="wrap">\n          <div class="head">\n            <div class="heading"><ha-icon icon="mdi:star-outline"></ha-icon><h2></h2></div>\n            <button class="edit" type="button"><ha-icon icon="mdi:pencil-outline"></ha-icon><span>Edit</span></button>\n          </div>\n          <div class="grid"></div>\n          <div class="notice" role="status" aria-live="polite"></div>\n        </div>\n      </ha-card>\n      <dialog class="editor" aria-labelledby="favourites-editor-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-editor-title">Edit favourites</div><button class="close editor-close" type="button" aria-label="Close editor"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="editor-body">\n          <div class="editor-copy">Choose up to four household controls. Their order here is their order on Home.</div>\n          <div class="subheading">Selected</div>\n          <div class="selected"></div>\n          <div class="subheading">Available controls</div>\n          <input class="search" type="search" placeholder="Search by name, room or entity" aria-label="Search available controls">\n          <div class="available"></div>\n          <div class="editor-error" role="alert"></div>\n        </div>\n        <div class="editor-actions"><div class="count"></div><div class="action-buttons"><button class="dialog-button cancel" type="button">Cancel</button><button class="dialog-button primary save" type="button">Save</button></div></div>\n      </dialog>\n      <dialog class="confirm" aria-labelledby="favourites-confirm-title">\n        <div class="confirm-body"><div class="confirm-title" id="favourites-confirm-title"></div><div class="confirm-message"></div><div class="confirm-actions"><button class="dialog-button confirm-cancel" type="button">Cancel</button><button class="dialog-button primary confirm-run" type="button">Run</button></div></div>\n      </dialog>\n      <dialog class="controller" aria-labelledby="favourites-controller-title">\n        <div class="dialog-head"><div class="dialog-title" id="favourites-controller-title">Climate</div><button class="close controller-close" type="button" aria-label="Close climate controller"><ha-icon icon="mdi:close"></ha-icon></button></div>\n        <div class="controller-body"></div>\n      </dialog>\n    '),
        (this.$ = Object.fromEntries(
          [...this.shadowRoot.querySelectorAll("[class]")].flatMap((t) =>
            [...t.classList].map((e) => [e, t]),
          ),
        )),
        Object.assign(this.$, {
          editorClose: this.shadowRoot.querySelector(".editor-close"),
          confirmCancel: this.shadowRoot.querySelector(".confirm-cancel"),
          confirmRun: this.shadowRoot.querySelector(".confirm-run"),
          confirmTitle: this.shadowRoot.querySelector(".confirm-title"),
          confirmMessage: this.shadowRoot.querySelector(".confirm-message"),
          controllerClose: this.shadowRoot.querySelector(".controller-close"),
          controllerTitle: this.shadowRoot.querySelector(
            "#favourites-controller-title",
          ),
          controllerBody: this.shadowRoot.querySelector(".controller-body"),
          editorError: this.shadowRoot.querySelector(".editor-error"),
        }),
        (this.shadowRoot.querySelector("h2").textContent = this.config.title),
        (this.$.head.hidden = !1 === this.config.show_header),
        (this.$.edit.hidden =
          !this.config.helpers.length && !this.config.preference_key),
        this.$.edit.addEventListener("click", () => this._openEditor()),
        this.$.editorClose.addEventListener("click", () =>
          this.$.editor.close(),
        ),
        this.$.cancel.addEventListener("click", () => this.$.editor.close()),
        this.$.search.addEventListener("input", () => this._renderAvailable()),
        this.$.save.addEventListener("click", () => this._save()),
        this.$.confirmCancel.addEventListener("click", () =>
          this.$.confirm.close(),
        ),
        this.$.controllerClose.addEventListener("click", () =>
          this.$.controller.close(),
        );
      for (const t of [this.$.editor, this.$.confirm, this.$.controller])
        t.addEventListener("click", (e) => {
          e.target === t && t.close();
        });
    }
  }
  _escape(t) {
    return escapeHtml(t);
  }
  _domain(t) {
    return String(t || "").split(".")[0];
  }
  _normaliseRef(t) {
    return t &&
      "object" == typeof t &&
      [t.d, t.p, t.u].every((t) => "string" == typeof t && t)
      ? {
          v: 1,
          d: t.d,
          p: t.p,
          u: t.u,
          n: "string" == typeof t.n ? t.n.slice(0, 64) : "",
        }
      : null;
  }
  _parseSlot(t) {
    if (!t || FAVOURITES_V3_INVALID.has(String(t).toLowerCase())) return null;
    try {
      return this._normaliseRef(JSON.parse(t));
    } catch (t) {
      return null;
    }
  }
  _syncStored() {
    if (this.config?.preference_key) {
      if (!this._hass) return;
      void this._loadBackendFavourites();
      return;
    }
    if (!this.config || !this._hass || !this.config.helpers.length) return;
    const t = JSON.stringify(
      this.config.helpers.map((t) => this._hass.states?.[t]?.state),
    );
    t !== this._lastStorageSignature &&
      ((this._lastStorageSignature = t),
      (this._selected = this.config.helpers
        .map((t) => this._parseSlot(this._hass.states?.[t]?.state))
        .filter(Boolean)
        .slice(0, this.config.max)));
  }
  async _loadBackendFavourites(force = false) {
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
    const request = globalThis.__homeDashboardV2
      .prefs(hass, key)
      .then(async (stored) => {
        if (hass !== this._hass || key !== this.config?.preference_key) return;
        let selected = Array.isArray(stored)
          ? stored
              .map((item) => this._normaliseRef(item))
              .filter(Boolean)
              .slice(0, this.config.max)
          : [];
        if (!Array.isArray(stored) && this._legacyFavouriteHelpers.length) {
          selected = this._legacyFavouriteHelpers
            .map((entityId) => this._parseSlot(hass.states?.[entityId]?.state))
            .filter(Boolean)
            .slice(0, this.config.max);
          if (selected.length) {
            await globalThis.__homeDashboardV2.savePrefs(hass, key, selected);
          }
        }
        this._selected = selected;
        this._preferenceLoaded = true;
        this._preferenceError = null;
        this._lastStorageSignature = this._storageSignature();
        this._renderSignature = "";
        this._renderGrid();
        if (this.$?.editor?.open) this._updateEditorState();
      })
      .catch((error) => {
        if (hass !== this._hass || key !== this.config?.preference_key) return;
        this._preferenceError = error;
        this._renderGrid();
      })
      .finally(() => {
        if (this._preferencePromise === request) {
          this._preferencePromise = null;
          this._preferenceRequestHass = null;
          this._preferenceRequestKey = null;
        }
        if (this._preferenceReloadPending) {
          this._preferenceReloadPending = false;
          if (this._hass && this.config?.preference_key) {
            void this._loadBackendFavourites(true);
          }
        }
      });
    this._preferencePromise = request;
    return request;
  }
  async _ensureRegistry() {
    return (
      this._registry ||
        this._registryPromise ||
        !this._hass?.connection?.sendMessagePromise ||
        (this._registryPromise = Promise.all([
          this._hass.connection.sendMessagePromise({
            type: "config/entity_registry/list",
          }),
          this._hass.connection.sendMessagePromise({
            type: "config/device_registry/list",
          }),
          this._hass.connection.sendMessagePromise({
            type: "config/area_registry/list",
          }),
        ])
          .then(async ([t, e, i]) => {
            const s = Array.isArray(t) ? t : [],
              r = Array.isArray(e) ? e : [],
              a = Array.isArray(i) ? i : [],
              o = new Map(),
              n = new Map();
            for (const t of s) {
              const e = this._entryKey(t);
              e && o.set(e, t),
                t.device_id &&
                  (n.has(t.device_id) || n.set(t.device_id, []),
                  n.get(t.device_id).push(t));
            }
            return (
              (this._registry = {
                entities: s,
                devices: new Map(r.map((t) => [t.id, t])),
                areas: new Map(a.map((t) => [t.area_id, t.name])),
                byKey: o,
                byDevice: n,
              }),
              (this._renderSignature = ""),
              this._renderGrid(),
              this.$?.editor?.open && this._renderEditor(),
              this._registry
            );
          })
          .catch(
            (t) => (
              (this._registryError = t),
              (this._registryPromise = null),
              this._renderGrid(),
              null
            ),
          )),
      this._registryPromise
    );
  }
  _entryKey(t) {
    return t?.entity_id && t.platform && t.unique_id
      ? `${this._domain(t.entity_id)}|${t.platform}|${t.unique_id}`
      : null;
  }
  _refKey(t) {
    return t ? `${t.d}|${t.p}|${t.u}` : "";
  }
  _refForEntry(t, e = "") {
    return {
      v: 1,
      d: this._domain(t.entity_id),
      p: t.platform,
      u: t.unique_id,
      n: e,
    };
  }
  _record(t) {
    const e = this._registry?.byKey.get(this._refKey(t)) || null;
    return {
      ref: t,
      entry: e,
      state: (e && this._hass?.states?.[e.entity_id]) || null,
    };
  }
  _name(t) {
    return (
      t.ref?.n?.trim() ||
      t.entry?.name ||
      t.entry?.original_name ||
      t.state?.attributes?.friendly_name ||
      t.entry?.entity_id ||
      "Favourite not found"
    );
  }
  _icon(t) {
    if (t.state?.attributes?.icon) return t.state.attributes.icon;
    return (
      {
        automation: "mdi:robot-outline",
        button: "mdi:gesture-tap-button",
        climate: "mdi:thermostat",
        cover: "mdi:window-shutter",
        fan: "mdi:fan",
        humidifier: "mdi:air-humidifier",
        input_boolean: "mdi:toggle-switch-outline",
        input_button: "mdi:gesture-tap-button",
        light: "mdi:lightbulb-outline",
        lock: "mdi:lock-outline",
        media_player: "mdi:play-circle-outline",
        scene: "mdi:palette-outline",
        script: "mdi:script-text-outline",
        select: "mdi:format-list-bulleted",
        switch: "mdi:toggle-switch-outline",
        vacuum: "mdi:robot-vacuum",
        water_heater: "mdi:water-boiler",
      }[t.entry ? this._domain(t.entry.entity_id) : t.ref?.d] ||
      "mdi:star-outline"
    );
  }
  _companion(t) {
    if (!t.entry?.device_id || !this._registry) return null;
    const e = (this._registry.byDevice.get(t.entry.device_id) || [])
      .filter((t) => "binary_sensor" === this._domain(t.entity_id))
      .map((t) => ({ entry: t, state: this._hass?.states?.[t.entity_id] }))
      .filter(({ state: t }) =>
        ["garage_door", "door", "opening"].includes(
          t?.attributes?.device_class,
        ),
      );
    return (
      e.find(({ state: t }) => "garage_door" === t?.attributes?.device_class) ||
      e[0] ||
      null
    );
  }
  _companionLabel(t) {
    return t?.state
      ? "on" === t.state.state
        ? "Open"
        : "off" === t.state.state
          ? "Closed"
          : "unavailable" === t.state.state
            ? "Status unavailable"
            : "Status unknown"
      : null;
  }
  _stateLabel(t) {
    if (!t.entry || !t.state) return "Not found";
    if ("unavailable" === t.state.state) return "Unavailable";
    if ("unknown" === t.state.state) return "Status unknown";
    const e = this._domain(t.entry.entity_id),
      i = this._companion(t);
    if (["button", "input_button"].includes(e)) {
      const t = this._companionLabel(i);
      return t ? `${t} · Tap to operate` : "Tap to run";
    }
    if (["automation", "script"].includes(e)) return "Tap to start";
    if ("scene" === e) return "Tap to activate";
    if ("media_player" === e) {
      const e = t.state.attributes?.media_title,
        i = this._label(t.state.state);
      return e ? `${i} · ${e}` : i;
    }
    if ("climate" === e) {
      const e = t.state.attributes?.hvac_action;
      return this._label(e && "idle" !== e ? e : t.state.state);
    }
    return this._label(t.state.state);
  }
  _label(t) {
    return String(t ?? "")
      .replaceAll("_", " ")
      .replace(/^./, (t) => t.toUpperCase());
  }
  _isActive(t) {
    if (
      !t.state ||
      FAVOURITES_V3_INVALID.has(String(t.state.state).toLowerCase())
    )
      return !1;
    const e = this._domain(t.entry?.entity_id);
    return ["light", "switch", "fan", "input_boolean"].includes(e)
      ? "on" === t.state.state
      : "media_player" === e
        ? ["playing", "paused", "buffering", "on"].includes(t.state.state)
        : "climate" === e
          ? "off" !== t.state.state
          : "cover" === e
            ? "closed" !== t.state.state
            : "lock" === e && "unlocked" === t.state.state;
  }
  _hasMediaQuick(t) {
    return (
      "media_player" === this._domain(t.entry?.entity_id) &&
      ["playing", "paused"].includes(t.state?.state)
    );
  }
  _actionLabel(t) {
    const e = this._domain(t.entry?.entity_id);
    return ["light", "switch", "fan", "input_boolean"].includes(e)
      ? "on" === t.state?.state
        ? "turn off"
        : "turn on"
      : ["button", "input_button"].includes(e)
        ? "run"
        : ["automation", "script"].includes(e)
          ? "start"
          : "scene" === e
            ? "activate"
            : "climate" === e
              ? "open climate controls"
              : "open details";
  }
  _renderGrid() {
    for (const t of this._interactionHandles) t.destroy();
    this._interactionHandles = [];
    if (!this.$?.grid || !this.config) return;
    if (this.config.preference_key) {
      if (this._preferenceError) {
        this.$.edit.disabled = true;
        this.$.edit.removeAttribute("aria-busy");
        this.$.grid.innerHTML =
          '<div class="load-error">Favourites storage could not be loaded. Try again shortly.</div>';
        return;
      }
      if (!this._preferenceLoaded) {
        this.$.edit.disabled = true;
        this.$.edit.setAttribute("aria-busy", "true");
        this.$.grid.innerHTML = '<div class="empty">Loading favourites…</div>';
        return;
      }
      this.$.edit.disabled = false;
      this.$.edit.removeAttribute("aria-busy");
    }
    if (this.config.items.length && !this.config.helpers.length)
      return void this._renderDemo();
    this.$.grid.replaceChildren();
    this.config.helpers.some((t) => {
      const e = this._hass?.states?.[t];
      return (
        this._hass &&
        (!e || FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase()))
      );
    })
      ? (this.$.grid.innerHTML =
          '<div class="load-error">Favourites storage is unavailable.</div>')
      : this._registry
        ? this._selected.length
          ? this._selected.forEach((t, e) => {
              const i = this._record(t),
                s = this._name(i),
                r = this._stateLabel(i),
                a = this._pending.get(e),
                o = this._flash.get(e),
                n = a?.label || o?.label || r,
                l = this._hasMediaQuick(i),
                u =
                  !i.state ||
                  FAVOURITES_V3_INVALID.has(
                    String(i.state.state).toLowerCase(),
                  ),
                c = document.createElement("div");
              c.className = [
                "item",
                l ? "has-quick" : "",
                (
                  this._optimistic.has(e)
                    ? this._optimistic.get(e)
                    : this._isActive(i)
                )
                  ? "active"
                  : "",
                u ? "unavailable" : "",
                a ? "pending" : "",
                o?.kind || "",
              ]
                .filter(Boolean)
                .join(" ");
              const d = document.createElement("button");
              (d.type = "button"),
                (d.className = "main"),
                d.setAttribute(
                  "aria-label",
                  `${s}, ${r}, ${this._actionLabel(i)}`,
                ),
                u &&
                  ((d.disabled = !0), d.setAttribute("aria-disabled", "true"));
              const h = this._domain(i.entry?.entity_id);
              if (
                (["light", "switch", "fan", "input_boolean"].includes(h) &&
                  d.setAttribute(
                    "aria-pressed",
                    String(
                      this._optimistic.has(e)
                        ? this._optimistic.get(e)
                        : "on" === i.state?.state,
                    ),
                  ),
                (d.innerHTML = `<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="copy"><div class="name">${this._escape(s)}</div><div class="state">${this._escape(n)}</div></span>`),
                this._interactionHandles.push(
                  interaction(d, {
                    primary: () => this._activate(e),
                    hold: () => this._moreInfo(i.entry?.entity_id),
                    optimistic: !1,
                    repeat: !1,
                    feedback: !0,
                  }),
                ),
                c.append(d),
                l)
              ) {
                const t = document.createElement("button");
                (t.type = "button"), (t.className = "quick");
                const r = "playing" === i.state.state;
                t.setAttribute("aria-label", `${r ? "Pause" : "Play"} ${s}`),
                  (t.innerHTML = `<ha-icon icon="mdi:${r ? "pause" : "play"}"></ha-icon>`),
                  this._interactionHandles.push(
                    interaction(t, {
                      primary: () => this._mediaAction(e),
                      optimistic: !1,
                      repeat: !1,
                      feedback: !0,
                    }),
                  ),
                  c.append(t);
              }
              this.$.grid.append(c);
            })
          : (this.$.grid.innerHTML =
              '<div class="empty">Add up to four everyday controls here.</div>')
        : (this.$.grid.innerHTML = `<div class="${this._registryError ? "load-error" : "empty"}">${this._registryError ? "Favourites could not load the entity registry." : "Loading favourites…"}</div>`);
  }
  _renderDemo() {
    this.$.grid.replaceChildren(),
      this.config.items.slice(0, 4).forEach((t) => {
        const e = document.createElement("div");
        (e.className = "item"),
          (e.innerHTML = `<div class="main"><span class="icon"><ha-icon icon="${this._escape(t.icon || "mdi:star-outline")}"></ha-icon></span><span class="copy"><div class="name">${this._escape(t.title || "Favourite")}</div><div class="state">${this._escape(t.state || "Supporting state")}</div></span></div>`),
          this.$.grid.append(e);
      });
  }
  async _activate(t) {
    if (this._pending.has(t)) return;
    const e = this._record(this._selected[t]);
    if (!e.entry || !e.state) return void this._openEditor();
    const i = e.entry.entity_id,
      s = this._domain(i);
    if (!FAVOURITES_V3_INVALID.has(String(e.state.state).toLowerCase()))
      if (["button", "input_button"].includes(s)) this._confirmButton(t, e);
      else {
        if (["light", "switch", "fan", "input_boolean"].includes(s)) {
          const s = e.state.state;
          this._optimistic.set(t, "on" !== s),
            this._setPending(t, "on" === s ? "Turning off…" : "Turning on…");
          try {
            await this._hass.callService("homeassistant", "toggle", {
              entity_id: i,
            }),
              await this._waitFor(i, (t) => t !== s, 9e3),
              this._setFlash(t, "success", "on" === s ? "Off" : "On");
          } catch (e) {
            this._setFlash(t, "error", "Could not update");
          }
          return;
        }
        if (["automation", "script", "scene"].includes(s)) {
          const e = "automation" === s ? "trigger" : "turn_on",
            r = "scene" === s ? "Activating…" : "Starting…",
            a = "scene" === s ? "Activated" : "Started";
          this._setPending(t, r);
          try {
            await this._hass.callService(s, e, { entity_id: i }),
              this._setFlash(t, "success", a);
          } catch (e) {
            this._setFlash(t, "error", "Could not start");
          }
          return;
        }
        this._moreInfo(i);
      }
    else this._moreInfo(i);
  }
  async _mediaAction(t) {
    if (this._pending.has(t)) return;
    const e = this._record(this._selected[t]);
    if (!e.entry || !e.state) return;
    const i = e.entry.entity_id,
      s = "playing" === e.state.state,
      r = s ? "media_pause" : "media_play";
    this._optimistic.set(t, !s),
      this._setPending(t, s ? "Pausing…" : "Playing…");
    try {
      await this._hass.callService("media_player", r, { entity_id: i }),
        await this._waitFor(
          i,
          (t) => (s ? "playing" !== t : "playing" === t),
          9e3,
        ),
        this._setFlash(t, "success", s ? "Paused" : "Playing");
    } catch (e) {
      this._setFlash(t, "error", "Could not update");
    }
  }
  _confirmButton(t, e) {
    const i = this._name(e),
      s = this._companion(e),
      r = this._companionLabel(s);
    (this.$.confirmTitle.textContent = r ? `Operate ${i}?` : `Run ${i}?`),
      (this.$.confirmMessage.textContent = r
        ? `The current reported state is ${r.toLowerCase()}.`
        : "This action runs immediately and cannot be reversed from this button."),
      (this.$.confirmRun.textContent = r ? "Operate" : "Run"),
      (this.$.confirmRun.onclick = () => {
        this.$.confirm.close(), this._runButton(t, e);
      }),
      this.$.confirm.showModal(),
      this.$.confirmCancel.focus();
  }
  async _runButton(t, e) {
    const i = e.entry.entity_id,
      s = this._domain(i);
    this._setPending(t, "Sending command…");
    try {
      await this._hass.callService(s, "press", { entity_id: i }),
        this._setFlash(t, "success", "Command sent");
    } catch (e) {
      this._setFlash(t, "error", "Command failed");
    }
  }
  _setPending(t, e) {
    this._pending.set(t, { label: e }),
      this._flash.delete(t),
      this._renderGrid();
  }
  _setFlash(t, e, i) {
    this._optimistic.delete(t),
      this._pending.delete(t),
      this._flash.set(t, { kind: e, label: i }),
      clearTimeout(this._flashTimers.get(t)),
      this._flashTimers.set(
        t,
        setTimeout(() => {
          this._flash.delete(t),
            this._flashTimers.delete(t),
            this._renderGrid();
        }, 3200),
      ),
      this._renderGrid();
  }
  _waitFor(t, e, i) {
    return waitForEntityState(() => this._hass, t, e, { timeout: i });
  }
  _moreInfo(t) {
    openMoreInfo(this, t);
  }
  async _openEditor() {
    await this._ensureRegistry(),
      (this._editorStorageSignature = this._storageSignature()),
      (this._draft = this._selected.map((t) => ({ ...t }))),
      (this._originalDraft = JSON.stringify(this._draft)),
      (this.$.search.value = ""),
      (this.$.editorError.textContent = ""),
      this._renderEditor(),
      this.$.editor.showModal(),
      setTimeout(() => this.$.search.focus(), 30);
  }
  _renderEditor() {
    this._renderSelected(), this._renderAvailable(), this._updateEditorState();
  }
  _renderSelected() {
    this.$.selected.replaceChildren(),
      this._draft.length
        ? this._draft.forEach((t, e) => {
            const i = this._record(t),
              s = document.createElement("div");
            (s.className = "selected-row"),
              (s.innerHTML = `<span class="icon"><ha-icon icon="${this._escape(this._icon(i))}"></ha-icon></span><span class="selected-copy"><div class="selected-meta">${this._escape(this._name({ ...i, ref: { ...t, n: "" } }))}</div><input class="alias" type="text" maxlength="64" value="${this._escape(t.n)}" placeholder="Optional shorter label" aria-label="Custom label for ${this._escape(this._name(i))}"></span><span class="selected-actions"><button class="order up" type="button" aria-label="Move ${this._escape(this._name(i))} earlier" ${0 === e ? "disabled" : ""}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="order down" type="button" aria-label="Move ${this._escape(this._name(i))} later" ${e === this._draft.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="remove" type="button" aria-label="Remove ${this._escape(this._name(i))}"><ha-icon icon="mdi:close"></ha-icon></button></span>`),
              s.querySelector(".alias").addEventListener("input", (t) => {
                (this._draft[e].n = t.target.value.slice(0, 64)),
                  this._updateEditorState();
              }),
              s
                .querySelector(".up")
                .addEventListener("click", () => this._move(e, -1)),
              s
                .querySelector(".down")
                .addEventListener("click", () => this._move(e, 1)),
              s.querySelector(".remove").addEventListener("click", () => {
                this._draft.splice(e, 1), this._renderEditor();
              }),
              this.$.selected.append(s);
          })
        : (this.$.selected.innerHTML =
            '<div class="available-empty">No favourites selected.</div>');
  }
  _move(t, e) {
    const i = t + e;
    i < 0 ||
      i >= this._draft.length ||
      (([this._draft[t], this._draft[i]] = [this._draft[i], this._draft[t]]),
      this._renderEditor());
  }
  _eligibleEntries() {
    if (!this._registry || !this._hass) return [];
    const t = new Set(this._draft.map((t) => this._refKey(t))),
      e = new Set(this.config.helpers);
    return this._registry.entities.filter((i) => {
      const s = this._domain(i.entity_id);
      return (
        FAVOURITES_V3_DOMAINS.has(s) &&
        i.unique_id &&
        i.platform &&
        !i.disabled_by &&
        !i.hidden_by &&
        !i.entity_category &&
        this._hass.states?.[i.entity_id] &&
        !e.has(i.entity_id) &&
        !t.has(this._entryKey(i))
      );
    });
  }
  _areaName(t) {
    if (!t) return "Missing";
    const e = t.device_id ? this._registry?.devices.get(t.device_id) : null,
      i = t.area_id || e?.area_id;
    return i && this._registry?.areas.has(i)
      ? this._registry.areas.get(i)
      : ["automation", "scene", "script"].includes(this._domain(t.entity_id))
        ? "Routines"
        : "Household";
  }
  _renderAvailable() {
    if (!this.$?.available) return;
    if ((this.$.available.replaceChildren(), !this._registry))
      return void (this.$.available.innerHTML =
        '<div class="available-empty">Loading household controls…</div>');
    const t = this.$.search.value.trim().toLowerCase(),
      e = this._eligibleEntries()
        .map((t) => {
          const e = this._record(this._refForEntry(t));
          return {
            entry: t,
            record: e,
            name: this._name(e),
            area: this._areaName(t),
          };
        })
        .filter(({ entry: e, name: i, area: s }) =>
          `${i} ${s} ${e.entity_id} ${this._domain(e.entity_id)}`
            .toLowerCase()
            .includes(t),
        )
        .sort((t, e) =>
          `${t.area}\0${t.name}`.localeCompare(`${e.area}\0${e.name}`, void 0, {
            sensitivity: "base",
          }),
        );
    if (!e.length)
      return void (this.$.available.innerHTML = `<div class="available-empty">${this._draft.length >= this.config.max ? "Four favourites selected. Remove one to choose another." : "No matching household controls."}</div>`);
    let i = "";
    for (const t of e) {
      if (t.area !== i) {
        i = t.area;
        const e = document.createElement("div");
        (e.className = "group-title"),
          (e.textContent = i),
          this.$.available.append(e);
      }
      const e = document.createElement("button");
      (e.type = "button"),
        (e.className = "choice"),
        (e.disabled = this._draft.length >= this.config.max),
        (e.innerHTML = `<span class="icon"><ha-icon icon="${this._escape(this._icon(t.record))}"></ha-icon></span><span><div class="choice-name">${this._escape(t.name)}</div><div class="choice-meta">${this._escape(`${this._label(this._domain(t.entry.entity_id))} · ${this._stateLabel(t.record)}`)}</div></span><span class="add">Add</span>`),
        e.addEventListener("click", () => {
          this._draft.length >= this.config.max ||
            (this._draft.push(this._refForEntry(t.entry)),
            this._renderEditor());
        }),
        this.$.available.append(e);
    }
  }
  _slotValue(t) {
    return t ? JSON.stringify(this._normaliseRef(t)) : "";
  }
  _updateEditorState() {
    const t = this.config.helpers
        .map((t, e) => this._slotValue(this._draft[e] || null))
        .every((t, e) => {
          const i = Number(
            this._hass?.states?.[this.config.helpers[e]]?.attributes?.max ||
              255,
          );
          return t.length <= i;
        }),
      e = this.config.helpers.every((t) => {
        const e = this._hass?.states?.[t];
        return e && !FAVOURITES_V3_INVALID.has(String(e.state).toLowerCase());
      }),
      i = JSON.stringify(this._draft) !== this._originalDraft,
      s = Boolean(
        this.$?.editor?.open &&
          this._editorStorageSignature &&
          this._editorStorageSignature !== this._storageSignature(),
      );
    (this.$.count.textContent = `${this._draft.length} of ${this.config.max} selected`),
      (this.$.save.disabled = !i || !t || !e || s),
      (this.$.editorError.textContent = s
        ? "Favourites changed on another dashboard. Close and reopen the editor before trying again."
        : e
          ? t
            ? ""
            : "A stored favourite is too long. Shorten its custom label."
          : "Favourites storage is unavailable.");
  }
  async _save() {
    if (this.config.preference_key) {
      await this._saveBackendFavourites();
      return;
    }
    if (this.$.save.disabled) return;
    if (this._editorStorageSignature !== this._storageSignature())
      return void this._updateEditorState();
    const t = this.config.helpers.map(
        (t) => this._hass.states?.[t]?.state || "",
      ),
      e = this.config.helpers.map((t, e) =>
        this._slotValue(this._draft[e] || null),
      );
    (this.$.save.disabled = !0),
      (this.$.save.textContent = "Saving…"),
      (this.$.editorError.textContent = "");
    try {
      for (let t = 0; t < this.config.helpers.length; t += 1)
        await this._hass.callService("input_text", "set_value", {
          entity_id: this.config.helpers[t],
          value: e[t],
        });
      (this._selected = this._draft.map((t) => ({ ...t }))),
        (this._lastStorageSignature = ""),
        (this._renderSignature = ""),
        (this._editorStorageSignature = this._storageSignature()),
        this.$.editor.close(),
        this._renderGrid(),
        this._notice("Favourites saved.");
    } catch (e) {
      let i = !0;
      for (let e = 0; e < this.config.helpers.length; e += 1)
        try {
          await this._hass.callService("input_text", "set_value", {
            entity_id: this.config.helpers[e],
            value: t[e],
          });
        } catch (t) {
          i = !1;
        }
      this.$.editorError.textContent = i
        ? "Favourites could not be saved. No changes were kept."
        : "Favourites could not be saved, and some stored slots may have changed. Close and reopen the editor before trying again.";
    } finally {
      const t = this.$.editorError.textContent;
      (this.$.save.textContent = "Save"),
        this._updateEditorState(),
        t && (this.$.editorError.textContent = t);
    }
  }
  async _saveBackendFavourites() {
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
      await globalThis.__homeDashboardV2.savePrefs(
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
  }
  _notice(t, e = !1) {
    clearTimeout(this._noticeTimer),
      (this.$.notice.textContent = t),
      this.$.notice.classList.toggle("error", e),
      (this._noticeTimer = setTimeout(() => {
        (this.$.notice.textContent = ""),
          this.$.notice.classList.remove("error");
      }, 3600));
  }
}
registerCard({
  type: "component-favourites-v3",
  element: ComponentFavouritesV3,
  name: "Favourites",
  description:
    "Registry-aware persistent household favourites with safe actions.",
});
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
  disconnectedCallback(){clearTimeout(this._timer);this._timer=null}
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

class ComponentWledControllerV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this.h = null;
    this.d = null;
    this.b = null;
    this.unsub = null;
    this.loading = false;
    this.sheetSignature = "";
    this._interactionHandles = [];
    this._brightnessCoalescer = null;
    this._brightnessIntent = null;
    this.shadowRoot.innerHTML = `<style>
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
    this.head = this.shadowRoot.querySelector(".head");
    this.nameEl = this.shadowRoot.querySelector(".name");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.sheetName = this.shadowRoot.querySelector(".sheet-name");
    this.sheetState = this.shadowRoot.querySelector(".sheet-state");
    this.power = this.shadowRoot.querySelector(".power");
    this.identity = this.shadowRoot.querySelector(".identity");
    this.brightness = this.shadowRoot.querySelector(".brightness");
    this.brightnessValue = this.shadowRoot.querySelector(".brightness-value");
    this.presetsBtn = this.shadowRoot.querySelector(".presets");
    this.colour = this.shadowRoot.querySelector(".colour");
    this.advanced = this.shadowRoot.querySelector(".advanced");
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.presetGrid = this.shadowRoot.querySelector(".preset-grid");
    this.presetsSection = this.shadowRoot.querySelector(".presets-section");
    this.effect = this.shadowRoot.querySelector(".effect");
    this.palette = this.shadowRoot.querySelector(".palette");
    this.speed = this.shadowRoot.querySelector(".speed");
    this.speedValue = this.shadowRoot.querySelector(".speed-value");
    this.intensity = this.shadowRoot.querySelector(".intensity");
    this.intensityValue = this.shadowRoot.querySelector(".intensity-value");
    this.nativeColour = this.shadowRoot.querySelector(".native-colour");
    this._interactionHandles.push(
      interaction(this.power, {
        primary: () => this.togglePower(),
        optimistic: {
          capture: () => this.head.classList.contains("on"),
          apply: () => {
            const next = !this.head.classList.contains("on");
            this.head.classList.toggle("on", next);
            this.power.setAttribute("aria-pressed", String(next));
            this.statusEl.textContent = next ? "Turning on…" : "Turning off…";
          },
          rollback: (previous) => {
            this.head.classList.toggle("on", previous);
            this.power.setAttribute("aria-pressed", String(previous));
            this.render();
          },
        },
        feedback: true,
      }),
      interaction(this.identity, {
        primary: () => this.openAdvanced(false),
        hold: () => this.moreInfo(this.b?.main),
        feedback: true,
      }),
      interaction(this.presetsBtn, {
        primary: () => this.openAdvanced(true),
        feedback: true,
      }),
      interaction(this.advanced, {
        primary: () => this.openAdvanced(false),
        feedback: true,
      }),
      interaction(this.colour, {
        primary: () => this.moreInfo(this.b?.effectLights?.[0] || this.b?.main),
        feedback: true,
      }),
      interaction(this.nativeColour, {
        primary: () => this.moreInfo(this.b?.effectLights?.[0] || this.b?.main),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".close"), {
        primary: () => this.dialog.close(),
        feedback: true,
      }),
    );
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog) this.dialog.close();
    });
    this.brightness.oninput = () => {
      const v = Number(this.brightness.value);
      this._brightnessIntent = v;
      this.brightnessValue.textContent = this.pct(v);
      this.brightnessCoalescer().request(v);
    };
    this.brightness.onchange = () => {};
    this.effect.onchange = () =>
      this.effect.value &&
      this.call("light", "turn_on", this.b?.effectLights || [], {
        effect: this.effect.value,
      });
    this.palette.onchange = () =>
      this.palette.value &&
      this.call("select", "select_option", this.b?.palettes || [], {
        option: this.palette.value,
      });
    this.speed.oninput = () => (this.speedValue.textContent = this.speed.value);
    this.speed.onchange = () =>
      this.call("number", "set_value", this.b?.speeds || [], {
        value: Number(this.speed.value),
      });
    this.intensity.oninput = () =>
      (this.intensityValue.textContent = this.intensity.value);
    this.intensity.onchange = () =>
      this.call("number", "set_value", this.b?.intensities || [], {
        value: Number(this.intensity.value),
      });
  }
  setConfig(c) {
    if (!c?.entity) throw new Error("WLED controller requires entity");
    this.c = { ...c };
    this.d = null;
    this.b = null;
    this.load();
  }
  set hass(h) {
    this.h = h;
    this.unsub || this.subscribe();
    if (this.d) {
      this.b = this.bundle();
      this.render();
    } else this.load();
  }
  connectedCallback() {
    this.subscribe();
    this.load();
  }
  disconnectedCallback() {
    // Retained controls stay live through a transient Home Assistant detach.
    this._brightnessCoalescer?.destroy();
    this._brightnessCoalescer = null;
    this._brightnessIntent = null;
    this.unsub?.();
    this.unsub = null;
  }
  getCardSize() {
    return 2;
  }
  subscribe() {
    if (this.unsub || !this.h || !WLED_HD.REG?.subscribe) return;
    this.unsub = WLED_HD.REG.subscribe(this.h, (d) => {
      this.d = d;
      if (!this.c) return;
      this.b = this.bundle();
      this.render();
    });
  }
  async load(force = false) {
    if (this.loading || !this.h || !this.c || !WLED_HD.REG?.load) return;
    this.loading = true;
    try {
      this.d = this.d || (await WLED_HD.REG.load(this.h, force));
      this.b = this.bundle();
      this.render();
    } finally {
      this.loading = false;
    }
  }
  bundle() {
    const all = this.d?.entities || [],
      entry = all.find((e) => e.entity_id === this.c.entity),
      deviceId = this.c.device_id || entry?.device_id,
      siblings = (deviceId ? this.d?.byDevice?.get(deviceId) : []) || [],
      rows = siblings.filter(
        (e) =>
          e?.platform === "wled" &&
          !e.disabled_by &&
          this.h.states[e.entity_id],
      ),
      lightRows = rows.filter((e) => WLED_DOMAIN(e.entity_id) === "light"),
      main =
        lightRows.find((e) => e.entity_id === this.c.entity) ||
        lightRows.find((e) => WLED_NAME(e) === "main") ||
        lightRows[0],
      effectRows = lightRows.filter((e) =>
        Array.isArray(this.h.states[e.entity_id]?.attributes?.effect_list),
      ),
      selectRows = rows.filter((e) => WLED_DOMAIN(e.entity_id) === "select"),
      numberRows = rows.filter((e) => WLED_DOMAIN(e.entity_id) === "number"),
      match = (e, re) =>
        re.test(`${e.entity_id} ${e.original_name || ""} ${e.name || ""}`),
      preset = selectRows.find((e) => match(e, /\bpreset\b/i)),
      palettes = selectRows.filter((e) =>
        match(e, /color.?palette|colour.?palette/i),
      ),
      speeds = numberRows.filter((e) => match(e, /\bspeed\b/i)),
      intensities = numberRows.filter((e) => match(e, /\bintensity\b/i)),
      dev = this.d?.devices?.find((x) => x.id === deviceId),
      deviceName =
        dev?.name_by_user ||
        dev?.name ||
        this.h.states[main?.entity_id]?.attributes?.friendly_name ||
        "WLED";
    return {
      deviceId,
      deviceName,
      main: main?.entity_id || this.c.entity,
      effectLights: effectRows.map((e) => e.entity_id),
      preset: preset?.entity_id || null,
      palettes: palettes.map((e) => e.entity_id),
      speeds: speeds.map((e) => e.entity_id),
      intensities: intensities.map((e) => e.entity_id),
    };
  }
  pct(v) {
    const n = Number(v);
    return Number.isFinite(n) ? `${Math.round((n / 255) * 100)}%` : "—";
  }
  async togglePower() {
    const id = this.b?.main,
      state = id ? this.h?.states?.[id] : null;
    if (!id || !state) return;
    const wasOn = state.state === "on";
    await this.h.callService("light", "toggle", { entity_id: id });
    await waitForEntityState(
      () => this.h,
      id,
      (value) => value === (wasOn ? "off" : "on"),
      { timeout: 9000 },
    );
  }
  brightnessCoalescer() {
    if (this._brightnessCoalescer) return this._brightnessCoalescer;
    this._brightnessCoalescer = createRequestCoalescer(
      async (value) => {
        const id = this.b?.main;
        if (!id) return;
        if (value <= 0)
          await this.h.callService("light", "turn_off", { entity_id: id });
        else
          await this.h.callService("light", "turn_on", {
            entity_id: id,
            brightness: value,
          });
        await waitForEntityState(
          () => this.h,
          id,
          (state, obj) =>
            value <= 0
              ? state === "off"
              : state === "on" &&
                Math.abs(Number(obj?.attributes?.brightness ?? -999) - value) <=
                  2,
          { timeout: 7000 },
        );
      },
      {
        onSuccess: (value) => {
          if (this._brightnessIntent === value) this._brightnessIntent = null;
          this.render();
        },
        onError: () => {
          this._brightnessIntent = null;
          this.render();
        },
      },
    );
    return this._brightnessCoalescer;
  }
  same(ids, read) {
    const vals = ids
      .map((id) => read(this.h.states[id]))
      .filter(
        (v) =>
          v !== undefined &&
          v !== null &&
          !WLED_INVALID.has(String(v).toLowerCase()),
      );
    if (!vals.length) return null;
    return vals.every((v) => String(v) === String(vals[0])) ? vals[0] : "Mixed";
  }
  setOptions(el, options, current, emptyLabel) {
    const opts = Array.isArray(options) ? options : [],
      valid =
        current != null &&
        current !== "Mixed" &&
        opts.includes(String(current));
    el.replaceChildren();
    if (!valid) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = current === "Mixed" ? "Mixed" : emptyLabel;
      o.selected = true;
      el.append(o);
    }
    for (const v of opts) {
      const o = document.createElement("option");
      o.value = String(v);
      o.textContent = String(v);
      o.selected = valid && String(v) === String(current);
      el.append(o);
    }
    el.disabled = !opts.length;
  }
  renderPresets(options, current) {
    for (const button of this.presetGrid?.querySelectorAll?.(".preset-btn") ||
      []) {
      button._interaction?.destroy?.();
      button._interaction = null;
    }
    this.presetGrid.replaceChildren();
    if (!options.length) {
      const x = document.createElement("span");
      x.className = "label";
      x.textContent = "No presets configured";
      this.presetGrid.append(x);
      return;
    }
    for (const value of options) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `preset-btn ${String(current) === String(value) ? "active" : ""}`;
      b.textContent = String(value);
      b.title = String(value);
      b._interaction = interaction(b, {
        primary: async () => {
          await this.call(
            "select",
            "select_option",
            this.b?.preset ? [this.b.preset] : [],
            { option: value },
          );
          this.dialog.close();
        },
        optimistic: "selection",
        feedback: true,
      });
      this.presetGrid.append(b);
    }
  }
  render() {
    if (!this.h || !this.b) return;
    const main = this.h.states[this.b.main];
    const state = String(main?.state || "unavailable").toLowerCase();
    const on = state === "on";
    const controllable = state === "on" || state === "off";
    const reportedBrightness = on
      ? Number(main?.attributes?.brightness ?? 0)
      : 0;
    const brightness = this._brightnessIntent ?? reportedBrightness;
    const effect = this.same(this.b.effectLights, (s) => s?.attributes?.effect);
    const palette = this.same(this.b.palettes, (s) => s?.state);
    const speed = this.same(this.b.speeds, (s) => s?.state);
    const intensity = this.same(this.b.intensities, (s) => s?.state);
    const presetState = this.b.preset ? this.h.states[this.b.preset] : null;
    const presetOptions = presetState?.attributes?.options || [];
    const body = this.shadowRoot?.querySelector(".body");

    this.head.classList.toggle("on", on);
    this.nameEl.textContent = this.b.deviceName;
    const status = on
      ? [
          this.pct(brightness),
          effect && effect !== "Mixed" ? effect : null,
          palette && palette !== "Mixed" ? palette : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : state === "unavailable"
        ? "Unavailable"
        : state === "unknown"
          ? "Unknown"
          : "Off";
    this.statusEl.textContent = status;
    this.sheetName.textContent = this.b.deviceName;
    this.sheetState.textContent = status;
    if (body) body.style.display = on ? "grid" : "none";
    this.brightness.disabled = !main;
    this.brightness.value = String(
      Math.max(0, Math.min(255, Number.isFinite(brightness) ? brightness : 0)),
    );
    this.brightnessValue.textContent = this.pct(this.brightness.value);
    this.power.disabled = !controllable;
    this.power.setAttribute("aria-pressed", String(on));

    const usable = (id) => {
      const value = this.h.states[id];
      return Boolean(
        value && !WLED_INVALID.has(String(value.state).toLowerCase()),
      );
    };
    const presetOk = Boolean(this.b.preset && usable(this.b.preset));
    const effectOk = this.b.effectLights.some(usable);
    const paletteOk = this.b.palettes.some(usable);
    const speedOk = this.b.speeds.some(usable);
    const intensityOk = this.b.intensities.some(usable);
    this.presetsBtn.disabled = !on || !presetOk;
    this.colour.disabled = !on || !effectOk;
    this.nativeColour.disabled = !on || !effectOk;
    this.effect.disabled = !on || !effectOk;
    this.palette.disabled = !on || !paletteOk;
    this.speed.disabled = !on || !speedOk;
    this.intensity.disabled = !on || !intensityOk;
    this.advanced.disabled =
      !on || !(presetOk || effectOk || paletteOk || speedOk || intensityOk);
    if (!on && this.dialog?.open) this.dialog.close();
    if (!this.dialog.open) {
      this.sheetSignature = "";
      return;
    }
    const fxState = this.b.effectLights
      .map((id) => this.h.states[id])
      .find(Boolean);
    const fxOptions = fxState?.attributes?.effect_list || [];
    const paletteState = this.b.palettes
      .map((id) => this.h.states[id])
      .find(Boolean);
    const paletteOptions = paletteState?.attributes?.options || [];
    const sheetSignature = JSON.stringify([
      this.b.main,
      this.b.preset,
      this.b.effectLights,
      this.b.palettes,
      this.b.speeds,
      this.b.intensities,
      main,
      presetState,
      fxState,
      paletteState,
      ...this.b.speeds.map((id) => this.h.states[id]),
      ...this.b.intensities.map((id) => this.h.states[id]),
    ]);
    if (sheetSignature === this.sheetSignature) return;
    this.sheetSignature = sheetSignature;
    this.renderPresets(presetOptions, presetState?.state);
    this.setOptions(this.effect, fxOptions, effect, "Choose effect");
    this.setOptions(this.palette, paletteOptions, palette, "Choose palette");
    this.setRange(this.speed, this.speedValue, this.b.speeds, speed);
    this.setRange(
      this.intensity,
      this.intensityValue,
      this.b.intensities,
      intensity,
    );
    this.presetsBtn.disabled = !on || !presetOk;
    this.colour.disabled = !on || !effectOk;
    this.nativeColour.disabled = !on || !effectOk;
    this.effect.disabled = !on || !effectOk;
    this.palette.disabled = !on || !paletteOk;
    this.speed.disabled = !on || !speedOk;
    this.intensity.disabled = !on || !intensityOk;
    this.advanced.disabled =
      !on || !(presetOk || effectOk || paletteOk || speedOk || intensityOk);
  }
  setRange(input, output, ids, value) {
    const s = ids.map((id) => this.h.states[id]).find(Boolean),
      a = s?.attributes || {};
    input.min = String(a.min ?? 0);
    input.max = String(a.max ?? 255);
    input.step = String(a.step ?? 1);
    const n = value === "Mixed" ? Number(s?.state) : Number(value);
    input.value = String(Number.isFinite(n) ? n : Number(input.min));
    input.disabled = !ids.length;
    output.textContent =
      value === "Mixed"
        ? "Mixed"
        : ids.length
          ? String(Math.round(Number(input.value)))
          : "—";
  }
  openAdvanced(presets = false) {
    if (
      !this.dialog ||
      !this.b ||
      String(
        this.h?.states?.[this.b.main]?.state || "unavailable",
      ).toLowerCase() !== "on"
    )
      return;
    if (!this.dialog.open) {
      this.dialog.showModal();
      this.render();
    }
    queueMicrotask(() => {
      if (presets) this.presetsSection?.scrollIntoView({ block: "start" });
      else this.shadowRoot.querySelector(".close")?.focus();
    });
  }
  async call(domain, service, ids, data = {}) {
    const targets = [...new Set((ids || []).filter(Boolean))];
    if (!this.h || !targets.length) return;
    await Promise.all(
      targets.map((entity_id) =>
        this.h.callService(domain, service, { entity_id, ...data }),
      ),
    );
  }
  moreInfo(entityId) {
    openMoreInfo(this, entityId);
  }
}
registerCard({
  type: "component-wled-controller-v1",
  element: ComponentWledControllerV1,
  name: "WLED Controller V1",
  description: "Minimal WLED control with advanced settings sheet.",
});
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

  controlEntityId() {
    const entityId = String(this.config?.control_entity || "");
    return entityId.startsWith("button.") ? entityId : null;
  }

  stateSignature() {
    return JSON.stringify(
      [this.config.entity, this.controlEntityId(), this.config.availability_entity]
        .filter(Boolean)
        .map((entityId) => {
          const state = this.entityState(entityId);
          return [entityId, state?.state, state?.attributes];
        }),
    );
  }

  status() {
    const state = this.entityState(this.config.entity);
    const control = this.entityState(this.controlEntityId());
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
      await this._hass.callService("button", "press", { entity_id: this.controlEntityId() });
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
    const internalUsable = [...this.bundleData.switches, ...this.bundleData.detections, ...this.bundleData.buttons]
      .some((entity) => this.good(entity.entity_id));
    this.view.hidden = !status.online;
    this.controls.hidden = !status.online || !internalUsable;
    // The sheet is populated when opened. Rebuilding it while hidden creates
    // controls and listeners for every Home Assistant state update.
    if (this.dialog.open) this.renderControls();
    else this.controlsSignature = "";
    if (this.dialog.open && (!hasControls || !status.online)) this.dialog.close();
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

  openControls() { if (!this.dialog || !this.bundleData || !this.status().online) return; this.confirmId = null; this.renderControls(); if (!this.dialog.open) this.dialog.showModal(); queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus()); }
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
  formatDate,
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
      dialog{width:min(560px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:0;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,16px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.24));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.32));backdrop-filter:blur(3px)}.sheet{display:flex;flex-direction:column;max-height:calc(100dvh - 24px)}.head{min-height:56px;padding:6px 7px 6px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--divider-color)}.sheet-title{min-width:0;flex:1;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.body,.inline{overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}.inline{border-top:1px solid var(--divider-color)}.inline[hidden]{display:none}.groups{display:grid;gap:16px}.group{display:grid;gap:7px}.group-list{display:grid;gap:6px}.group-title{display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:13px;font-weight:600}.group-title:after{content:'';height:1px;background:var(--divider-color);flex:1}.classification-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.classification{appearance:none;min-width:0;padding:0;overflow:hidden;border:1px solid var(--divider-color);border-radius:12px;background:var(--secondary-background-color);color:inherit;text-align:left;cursor:pointer}.classification-image{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--dashboard-media-surface,#111)}.classification-copy{display:block;min-height:52px;padding:8px 10px}.classification-name,.classification-time{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.classification-name{font-size:13px;font-weight:650}.classification-time{margin-top:3px;color:var(--secondary-text-color);font-size:13px}.classification:hover{border-color:color-mix(in srgb,var(--primary-color) 36%,var(--divider-color))}.classification:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.control{min-height:52px;padding:5px 5px 5px 10px;border:1px solid var(--divider-color);border-radius:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.copy{min-width:0}.control-name,.control-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.control-name{font-size:13px;font-weight:600}.control-state{margin-top:3px;font-size:13px;color:var(--secondary-text-color)}.control button{appearance:none;width:96px;min-height:44px;padding:0 10px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer}.control button.on{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 45%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,transparent)}.control button.confirm{color:var(--warning-color,var(--error-color));border-color:currentColor}.detection.on{border-color:color-mix(in srgb,var(--primary-color) 40%,var(--divider-color))}.feedback{min-height:18px;margin-top:8px;color:var(--secondary-text-color);font-size:13px}.feedback.error{color:var(--error-color)}
      @media(max-width:520px){.action span{display:none}.action{padding:0}dialog{width:100vw;max-width:100vw;max-height:90dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.sheet{max-height:90dvh}.body{padding:10px 12px max(18px,env(safe-area-inset-bottom))}.classification-list{grid-template-columns:minmax(0,1fr)}}
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
    if (camera.classifications?.length) {
      const list = group("Last detections");
      list.classList.add("classification-list");
      for (const classification of camera.classifications) {
        const entityId = classification.entity.entity_id;
        const state = this._hass.states[entityId];
        const picture = state?.attributes?.entity_picture;
        const updated = state?.last_updated;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "classification";
        button.setAttribute("aria-label", `Open latest ${classification.name} detection`);
        const image = document.createElement("img");
        image.className = "classification-image";
        image.alt = `Latest ${classification.name} detection`;
        image.loading = "lazy";
        if (picture) image.src = this._hass.hassUrl?.(picture) || picture;
        const copy = document.createElement("span");
        copy.className = "classification-copy";
        const name = document.createElement("span");
        name.className = "classification-name";
        name.textContent = classification.name;
        const time = document.createElement("span");
        time.className = "classification-time";
        const timestamp = updated && new Date(updated);
        time.textContent = timestamp && Number.isFinite(timestamp.getTime())
          ? formatDate(this._hass, timestamp, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
          : "No detection available";
        copy.append(name, time);
        button.append(image, copy);
        this.controlInteractions.push(interaction(button, { primary: () => openMoreInfo(this, entityId), feedback: true }));
        list.append(button);
      }
    }
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
/** ComponentSecurityDashboardV1 — retained, single-owner Security dashboard. */
const {
  createDialogController,
  formatDate,
  interaction,
  loadSecurityModel,
  openMoreInfo,
  registerCard,
} = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentSecurityDashboardV1 extends HTMLElement {
  static stubConfig = { profile: "household-security", camera_columns: 2 };
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = null;
    this.sequence = 0;
    this._children = new Map();
    this.viewerEntityId = null;
    this.refreshTimer = null;
    this.snapshotTimer = null;
    this.quickResetTimers = new Set();
    this.entryConfirmTimer = null;
    this.entryConfirmId = null;
    this.surfaceInteractions = [];
    this.dialogInteractions = [];
    this.staticInteractions = [];
    this.cameraTiles = new Map();
    this.viewerCameraId = null;
    this.viewerStream = null;
    this.settingsCameraId = null;

    this.profileListener = (event) => {
      if (
        event.detail?.kind === "security" &&
        event.detail?.profileId === this.config?.profile
      ) {
        this.refresh(true);
      }
    };
    this.visibilityListener = () => {
      if (document.visibilityState !== "hidden") this.refreshSnapshots(true);
    };

    this.build();
    this.bindStatic();
  }

  setConfig(config) {
    this.config = {
      profile: "household-security",
      camera_columns: 2,
      refresh_seconds: 15,
      title: "Security",
      ...(config || {}),
    };
    this.style.setProperty(
      "--security-columns",
      Math.max(1, Math.min(3, Number(this.config.camera_columns) || 2)),
    );
    this.shadowRoot.querySelector(".page-title").textContent = this.config.title;
    const summary = this._children.get("summary");
    if (summary) summary.config = { profile: this.config.profile };
    const wall = this._children.get("wall");
    wall?.setConfig?.({ profile: this.config.profile, columns: this.config.camera_columns });
    this.scheduleSnapshots();
    this.refresh(true);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.model) {
      this.refresh();
      return;
    }
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      this.refresh();
    }, 40);
  }

  connectedCallback() {
    window.addEventListener("ha-component-profile-change", this.profileListener);
    document.addEventListener("visibilitychange", this.visibilityListener);
    this.bindStatic();
    this.scheduleSnapshots();
    this.refresh();
  }

  disconnectedCallback() {
    window.removeEventListener("ha-component-profile-change", this.profileListener);
    document.removeEventListener("visibilitychange", this.visibilityListener);
    clearTimeout(this.refreshTimer);
    clearInterval(this.snapshotTimer);
    clearTimeout(this.entryConfirmTimer);
    this.refreshTimer = null;
    this.snapshotTimer = null;
    this.entryConfirmTimer = null;
    for (const timer of this.quickResetTimers) clearTimeout(timer);
    this.quickResetTimers.clear();
    this.destroyInteractions(this.surfaceInteractions);
    this.destroyInteractions(this.dialogInteractions);
    this.destroyInteractions(this.staticInteractions);
    for (const tile of this.cameraTiles.values()) this.destroyCameraTile(tile);
    this.cameraTiles.clear();
    this.stopViewer();
    if (this.viewerDialog.open) this.viewerDialog.close();
    if (this.settingsDialog.open) this.settingsDialog.close();
  }

  getCardSize() { return 12; }

  build() {
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0;--security-gap:10px}*{box-sizing:border-box}button{font:inherit;color:inherit}
      .page{display:grid;gap:var(--security-gap)}.panel{border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,16px);background:var(--card-background-color);color:var(--primary-text-color);overflow:hidden}
      .hero{min-height:88px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px}.hero-main{min-width:0;display:grid;grid-template-columns:44px minmax(0,1fr);align-items:center;gap:11px}.hero-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 10%,transparent);color:var(--primary-color)}.hero-icon.attention{background:color-mix(in srgb,var(--warning-color,var(--error-color)) 12%,transparent);color:var(--warning-color,var(--error-color))}.hero-icon ha-icon{--mdc-icon-size:24px}.page-title{margin:0;font-size:18px;line-height:1.15;font-weight:700}.status-copy{margin-top:4px;font-size:13px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.metrics{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.metric{min-height:34px;padding:0 10px;border-radius:999px;background:var(--secondary-background-color);display:flex;align-items:center;gap:6px;font-size:12px;font-weight:650;white-space:nowrap}.metric ha-icon{--mdc-icon-size:17px;color:var(--secondary-text-color)}.metric.attention{color:var(--warning-color,var(--error-color))}
      .section{padding:13px 14px 14px}.section[hidden]{display:none}.section-head{min-height:34px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.section-title{margin:0;font-size:15px;line-height:1.2;font-weight:650}.section-meta{font-size:12px;color:var(--secondary-text-color);white-space:nowrap}
      .quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.quick-action{appearance:none;min-width:0;min-height:58px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:12px;background:transparent;text-align:left;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.quick-action:hover{background:var(--secondary-background-color)}.quick-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 9%,transparent);color:var(--primary-color)}.quick-icon ha-icon{--mdc-icon-size:20px}.quick-name,.quick-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quick-name{font-size:13px;font-weight:650}.quick-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}
      .camera-grid{display:grid;grid-template-columns:repeat(var(--security-columns,2),minmax(0,1fr));gap:8px}.camera{min-width:0;border:1px solid var(--divider-color);border-radius:14px;overflow:hidden;background:var(--card-background-color)}.camera-media{position:relative;display:block;width:100%;aspect-ratio:16/9;padding:0;border:0;background:var(--dashboard-media-surface,#111);cursor:pointer;overflow:hidden}.camera-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.camera-media.offline:after{content:"Camera unavailable";position:absolute;inset:0;display:grid;place-items:center;padding:12px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 72%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:13px;font-weight:650}.camera-badge{position:absolute;top:9px;left:9px;min-height:28px;padding:0 8px;border-radius:999px;display:flex;align-items:center;gap:5px;background:color-mix(in srgb,var(--dashboard-media-surface,#111) 78%,transparent);color:var(--dashboard-media-on-surface,#fff);font-size:11px;font-weight:700}.camera-badge.activity{background:color-mix(in srgb,var(--warning-color,#f4a100) 88%,transparent)}.camera-badge ha-icon{--mdc-icon-size:14px}.camera-copy{padding:10px 11px 8px}.camera-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.camera-name{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.camera-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.classification-summary{margin-top:6px;font-size:12px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.camera-actions{padding:0 7px 7px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.camera-action{appearance:none;min-width:0;min-height:42px;padding:0 7px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;font-size:12px;font-weight:650}.camera-action.primary{background:color-mix(in srgb,var(--primary-color) 9%,transparent);border-color:color-mix(in srgb,var(--primary-color) 28%,var(--divider-color));color:var(--primary-color)}.camera-action:hover{background:var(--secondary-background-color)}.camera-action ha-icon{--mdc-icon-size:17px}
      .entries{display:grid;gap:7px}.entry{min-height:64px;padding:7px 7px 7px 11px;border:1px solid var(--divider-color);border-radius:12px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px}.entry-icon{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.entry-icon.attention{color:var(--warning-color,var(--error-color))}.entry-icon ha-icon{--mdc-icon-size:20px}.entry-name,.entry-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.entry-name{font-size:13px;font-weight:650}.entry-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.entry-actions{display:flex;gap:4px}.entry-detail,.entry-operate{appearance:none;min-height:44px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer}.entry-detail{width:44px;padding:0;display:grid;place-items:center;color:var(--secondary-text-color)}.entry-operate{min-width:92px;padding:0 10px;color:var(--primary-color);font-size:12px;font-weight:700}.entry-operate.confirm{color:var(--warning-color,var(--error-color));border-color:currentColor}.entry-detail ha-icon{--mdc-icon-size:18px}
      .empty{min-height:78px;display:grid;place-items:center;text-align:center;color:var(--secondary-text-color);font-size:13px;padding:12px}
      dialog{padding:0;border:1px solid var(--divider-color);border-radius:16px;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 18px 56px rgba(0,0,0,.28));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.46));backdrop-filter:blur(2px)}.dialog-shell{display:flex;flex-direction:column;max-height:calc(100dvh - 24px)}.dialog-head{min-height:58px;padding:6px 7px 6px 14px;border-bottom:1px solid var(--divider-color);display:flex;align-items:center;gap:7px}.dialog-title{min-width:0;flex:1;font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dialog-button{appearance:none;min-width:44px;height:44px;padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color);display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer}.dialog-button:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.dialog-button ha-icon{--mdc-icon-size:19px}.dialog-button span{font-size:12px;font-weight:650}.dialog-body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 14px max(14px,env(safe-area-inset-bottom))}
      .viewer-dialog{width:min(1120px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px))}.viewer-shell{height:100%}.viewer-body{position:relative;min-height:0;flex:1;display:grid;place-items:center;background:var(--dashboard-media-surface,#111);overflow:hidden}.viewer-stream{display:block;width:100%;height:100%;min-height:0;color:var(--dashboard-media-on-surface,#fff)}.viewer-message{position:absolute;inset:auto 12px 12px;pointer-events:none;text-align:center;color:var(--dashboard-media-on-surface,#fff);font-size:12px}
      .settings-dialog{width:min(680px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}.settings-groups{display:grid;gap:18px}.settings-group{display:grid;gap:8px}.settings-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.04em}.settings-title:after{content:"";height:1px;background:var(--divider-color);flex:1}.detections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detection{appearance:none;min-width:0;padding:0;border:1px solid var(--divider-color);border-radius:12px;background:var(--secondary-background-color);overflow:hidden;text-align:left;cursor:pointer}.detection img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--dashboard-media-surface,#111)}.detection-copy{display:block;padding:8px 10px}.detection-name,.detection-time{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.detection-name{font-size:13px;font-weight:700}.detection-time{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.status-list,.control-list{display:grid;gap:6px}.status-row,.control-row{min-height:54px;padding:5px 5px 5px 10px;border:1px solid var(--divider-color);border-radius:11px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.control-name,.control-state{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.control-name{font-size:13px;font-weight:650}.control-state{margin-top:3px;font-size:12px;color:var(--secondary-text-color)}.control-value{min-width:74px;text-align:right;font-size:12px;font-weight:700}.control-value.on{color:var(--warning-color,var(--primary-color))}.control-toggle{appearance:none;min-width:88px;min-height:42px;padding:0 9px;border:1px solid var(--divider-color);border-radius:9px;background:transparent;cursor:pointer;font-size:12px;font-weight:700}.control-toggle.on{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 8%,transparent);border-color:color-mix(in srgb,var(--primary-color) 30%,var(--divider-color))}.settings-footer{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.footer-action{appearance:none;min-height:46px;border:1px solid var(--divider-color);border-radius:10px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:700}.footer-action ha-icon{--mdc-icon-size:18px}
      button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{cursor:default;opacity:.45}
      @media(max-width:700px){:host{--security-gap:8px}.hero{grid-template-columns:1fr;padding:12px}.metrics{justify-content:flex-start}.section{padding:12px}.camera-grid,.quick-grid{grid-template-columns:1fr}.camera-actions{grid-template-columns:repeat(3,minmax(0,1fr))}.dialog-button span{display:none}.dialog-button{padding:0}.viewer-dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-width:0;border-radius:0}.settings-dialog{width:100vw;max-width:100vw;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:16px 16px 0 0}.detections{grid-template-columns:1fr}.entry{grid-template-columns:34px minmax(0,1fr)}.entry-actions{grid-column:2;justify-content:flex-start}.entry-operate{flex:1}.settings-footer{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
    </style>
    <div class="page">
      <section class="panel hero">
        <div class="hero-main">
          <span class="hero-icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span>
          <div><h1 class="page-title">Security</h1><div class="status-copy">Loading security state…</div></div>
        </div>
        <div class="metrics"></div>
      </section>
      <section class="panel section quick-section" hidden>
        <div class="section-head"><h2 class="section-title">Quick actions</h2><span class="section-meta quick-meta"></span></div>
        <div class="quick-grid"></div>
      </section>
      <section class="panel section camera-section">
        <div class="section-head"><h2 class="section-title">Cameras</h2><span class="section-meta camera-meta">Loading…</span></div>
        <div class="camera-grid"></div>
        <div class="empty camera-empty" hidden></div>
      </section>
      <section class="panel section entry-section" hidden>
        <div class="section-head"><h2 class="section-title">Entry points</h2><span class="section-meta entry-meta"></span></div>
        <div class="entries"></div>
      </section>
    </div>
    <dialog class="viewer-dialog">
      <div class="dialog-shell viewer-shell">
        <div class="dialog-head">
          <span class="dialog-title viewer-title">Camera</span>
          <button class="dialog-button viewer-settings" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Settings</span></button>
          <button class="dialog-button viewer-details" type="button"><ha-icon icon="mdi:information-outline"></ha-icon><span>Details</span></button>
          <button class="dialog-button viewer-close" type="button" aria-label="Close live camera"><ha-icon icon="mdi:close"></ha-icon></button>
        </div>
        <div class="viewer-body"><div class="viewer-message">Connecting…</div></div>
      </div>
    </dialog>
    <dialog class="settings-dialog">
      <div class="dialog-shell">
        <div class="dialog-head">
          <span class="dialog-title settings-dialog-title">Camera settings</span>
          <button class="dialog-button settings-live" type="button"><ha-icon icon="mdi:play-circle-outline"></ha-icon><span>Live</span></button>
          <button class="dialog-button settings-close" type="button" aria-label="Close camera settings"><ha-icon icon="mdi:close"></ha-icon></button>
        </div>
        <div class="dialog-body settings-body"></div>
      </div>
    </dialog>`;

    this.elements = {
      heroIcon: this.shadowRoot.querySelector(".hero-icon"),
      heroIconGlyph: this.shadowRoot.querySelector(".hero-icon ha-icon"),
      status: this.shadowRoot.querySelector(".status-copy"),
      metrics: this.shadowRoot.querySelector(".metrics"),
      quickSection: this.shadowRoot.querySelector(".quick-section"),
      quickGrid: this.shadowRoot.querySelector(".quick-grid"),
      quickMeta: this.shadowRoot.querySelector(".quick-meta"),
      cameraGrid: this.shadowRoot.querySelector(".camera-grid"),
      cameraMeta: this.shadowRoot.querySelector(".camera-meta"),
      cameraEmpty: this.shadowRoot.querySelector(".camera-empty"),
      entrySection: this.shadowRoot.querySelector(".entry-section"),
      entries: this.shadowRoot.querySelector(".entries"),
      entryMeta: this.shadowRoot.querySelector(".entry-meta"),
      viewerBody: this.shadowRoot.querySelector(".viewer-body"),
      viewerTitle: this.shadowRoot.querySelector(".viewer-title"),
      settingsTitle: this.shadowRoot.querySelector(".settings-dialog-title"),
      settingsBody: this.shadowRoot.querySelector(".settings-body"),
    };
    this.viewerDialog = this.shadowRoot.querySelector(".viewer-dialog");
    this.settingsDialog = this.shadowRoot.querySelector(".settings-dialog");
    const viewerDialogController = createDialogController(this, this.viewerDialog, {
      initialFocus: () => this.shadowRoot.querySelector(".viewer-close"),
    });
    const settingsDialogController = createDialogController(this, this.settingsDialog, {
      initialFocus: () => this.shadowRoot.querySelector(".settings-close"),
    });
    const self = this;
    this.viewerController = Object.freeze({
      open(from) { return viewerDialogController.open(from); },
      close(reason) { return viewerDialogController.close(reason); },
      get isOpen() { return self.viewerDialog.open === true; },
    });
    this.settingsController = Object.freeze({
      open(from) { return settingsDialogController.open(from); },
      close(reason) { return settingsDialogController.close(reason); },
      get isOpen() { return self.settingsDialog.open === true; },
    });
    this.controlsController = this.settingsController;
    this.viewerDialog.addEventListener("close", () => this.stopViewer());
    this.installCompatibilitySurface();
  }

  installCompatibilitySurface() {
    const summary = { config: {} };
    const wall = document.createElement("component-security-camera-wall-v3");
    wall.addEventListener("security-camera-control-request", (event) => {
      const camera = event.detail?.camera;
      if (!camera) return;
      this._children.set("camera-controller", {
        config: {
          profile: this.config?.profile,
          entity: camera.entityId,
          device_id: camera.deviceId,
          expanded: true,
          title: camera.name,
        },
      });
      this.openSettings(camera, event.detail?.trigger, "controls");
    });
    wall.addEventListener("security-camera-view-request", (event) => {
      const camera = event.detail?.camera;
      if (camera) this.openViewer(camera, event.detail?.trigger);
    });
    this._children.set("summary", summary);
    this._children.set("wall", wall);
  }

  bindStatic() {
    if (this.staticInteractions.length) return;
    this.staticInteractions.push(
      interaction(this.shadowRoot.querySelector(".viewer-close"), {
        primary: () => this.viewerController.close(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".viewer-settings"), {
        primary: () => this.switchViewerToSettings(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".viewer-details"), {
        primary: () => this.openViewerDetails(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".settings-close"), {
        primary: () => this.settingsController.close(),
        feedback: true,
      }),
      interaction(this.shadowRoot.querySelector(".settings-live"), {
        primary: () => this.switchSettingsToViewer(),
        feedback: true,
      }),
    );
  }

  destroyInteractions(collection) {
    for (const handle of collection.splice(0)) handle.destroy();
  }

  scheduleSnapshots() {
    clearInterval(this.snapshotTimer);
    this.snapshotTimer = null;
    if (!this.config || !this.isConnected) return;
    this.snapshotTimer = setInterval(
      () => this.refreshSnapshots(),
      Math.max(10, Number(this.config.refresh_seconds) || 15) * 1000,
    );
  }

  async refresh(force = false) {
    if (!this._hass || !this.config) return;
    const sequence = ++this.sequence;
    try {
      const model = await loadSecurityModel(this._hass, this.config.profile, { force });
      if (sequence !== this.sequence || !this.isConnected) return;
      this.model = model;
      this.render();
    } catch (error) {
      if (sequence !== this.sequence || !this.isConnected) return;
      this.model = {
        error,
        cameras: [],
        entries: [],
        quickActions: [],
        attention: [],
        allClear: false,
        onlineCameras: 0,
      };
      this.render();
    }
  }

  render() {
    const model = this.model || {};
    const cameras = model.cameras || [];
    const entries = model.entries || [];
    const quickActions = model.quickActions || [];
    const activeDetections = cameras.reduce(
      (count, camera) =>
        count +
        (camera.detections || []).filter(
          (entity) => this._hass?.states?.[entity.entity_id]?.state === "on",
        ).length,
      0,
    );
    const openEntries = entries.filter((entry) => entry.available && entry.open).length;
    const attentionCount = (model.attention || []).length;
    const hasError = Boolean(model.error || model.profileError || model.profileMissing);

    this.elements.heroIcon.classList.toggle("attention", attentionCount > 0 || hasError);
    this.elements.heroIconGlyph.setAttribute(
      "icon",
      hasError
        ? "mdi:shield-alert-outline"
        : attentionCount > 0
          ? "mdi:shield-alert-outline"
          : "mdi:shield-check-outline",
    );
    this.elements.status.textContent = model.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : model.error || model.profileError
        ? "Security status is temporarily unavailable"
        : attentionCount > 0
          ? `${attentionCount} ${attentionCount === 1 ? "item needs" : "items need"} attention`
          : "All clear";

    const metrics = [
      {
        icon: "mdi:cctv",
        text: `${model.onlineCameras || 0}/${cameras.length} cameras`,
        attention: cameras.length > 0 && (model.onlineCameras || 0) < cameras.length,
      },
      {
        icon: "mdi:motion-sensor",
        text: `${activeDetections} active`,
        attention: activeDetections > 0,
      },
      {
        icon: "mdi:door",
        text: `${openEntries} open`,
        attention: openEntries > 0,
      },
    ];
    this.elements.metrics.replaceChildren(
      ...metrics.map((metric) => {
        const node = document.createElement("span");
        node.className = `metric ${metric.attention ? "attention" : ""}`;
        node.innerHTML = `<ha-icon></ha-icon><span></span>`;
        node.querySelector("ha-icon").setAttribute("icon", metric.icon);
        node.querySelector("span").textContent = metric.text;
        return node;
      }),
    );

    this.renderQuickActions(quickActions);
    this.renderCameras(cameras);
    this.renderEntries(entries);

    if (this.viewerDialog.open && this.viewerCameraId) {
      const current = cameras.find((camera) => camera.id === this.viewerCameraId);
      if (current) this.updateViewer(current);
      else this.viewerController.close();
    }
    if (this.settingsDialog.open && this.settingsCameraId) {
      const current = cameras.find((camera) => camera.id === this.settingsCameraId);
      if (current) this.renderSettings(current);
      else this.settingsController.close();
    }
  }

  renderQuickActions(actions) {
    this.destroyInteractions(this.surfaceInteractions);
    this.elements.quickGrid.replaceChildren();
    this.elements.quickSection.hidden = actions.length === 0;
    this.elements.quickMeta.textContent = actions.length
      ? `${actions.length} ${actions.length === 1 ? "action" : "actions"}`
      : "";

    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-action";
      button.disabled = !action.available;
      button.innerHTML =
        '<span class="quick-icon"><ha-icon></ha-icon></span><span><span class="quick-name"></span><span class="quick-state" role="status" aria-live="polite"></span></span>';
      button.querySelector("ha-icon").setAttribute("icon", action.icon);
      button.querySelector(".quick-name").textContent = action.name;
      button.querySelector(".quick-state").textContent = action.available ? "Run" : "Unavailable";
      button.setAttribute(
        "aria-label",
        `${action.name}. ${action.available ? "Run quick action" : "Unavailable"}.`,
      );
      this.surfaceInteractions.push(
        interaction(button, {
          primary: () => this.runQuickAction(action, button),
          singleFlight: true,
          feedback: true,
        }),
      );
      this.elements.quickGrid.append(button);
    }
  }

  async runQuickAction(action, button) {
    const state = button.querySelector(".quick-state");
    state.textContent = "Running…";
    try {
      await this._hass.callService(action.domain, action.service, {
        entity_id: action.entityId,
      });
      state.textContent = "Started";
    } catch (error) {
      state.textContent = error?.message || "Could not start";
      throw error;
    } finally {
      const timer = setTimeout(() => {
        this.quickResetTimers.delete(timer);
        if (button.isConnected) state.textContent = action.available ? "Run" : "Unavailable";
      }, 2600);
      this.quickResetTimers.add(timer);
    }
  }

  renderCameras(cameras) {
    const keep = new Set(cameras.map((camera) => camera.id));
    this.elements.cameraMeta.textContent = this.model?.error
      ? "Unavailable"
      : `${cameras.filter((camera) => camera.online).length}/${cameras.length} online`;
    this.elements.cameraEmpty.hidden = cameras.length > 0;
    // `.camera-empty` is a grid container by design, so make the hidden state
    // explicit when live cameras exist rather than relying on browser defaults.
    this.elements.cameraEmpty.style.display = cameras.length ? "none" : "";
    this.elements.cameraEmpty.textContent = this.model?.profileMissing
      ? `Configure ${this.config.profile} in HA Component Backend`
      : this.model?.error
        ? this.model.error.message || "Camera discovery is unavailable"
        : "No security cameras are configured";

    for (const camera of cameras) {
      let tile = this.cameraTiles.get(camera.id);
      if (!tile) {
        tile = this.createCameraTile(camera);
        this.cameraTiles.set(camera.id, tile);
      }
      tile.camera = camera;
      this.updateCameraTile(tile, camera);
      this.elements.cameraGrid.append(tile.root);
    }

    for (const [id, tile] of [...this.cameraTiles]) {
      if (keep.has(id)) continue;
      this.destroyCameraTile(tile);
      tile.root.remove();
      this.cameraTiles.delete(id);
    }
    this.refreshSnapshots();
  }

  createCameraTile(camera) {
    const root = document.createElement("article");
    root.className = "camera";
    root.innerHTML = `<button class="camera-media" type="button">
      <img alt="">
      <span class="camera-badge"><ha-icon icon="mdi:cctv"></ha-icon><span></span></span>
    </button>
    <div class="camera-copy">
      <div class="camera-title-row"><span class="camera-name"></span></div>
      <div class="camera-state"></div>
      <div class="classification-summary"></div>
    </div>
    <div class="camera-actions">
      <button class="camera-action primary live-action" type="button"><ha-icon icon="mdi:play-circle-outline"></ha-icon><span>Live</span></button>
      <button class="camera-action detections-action" type="button"><ha-icon icon="mdi:motion-sensor"></ha-icon><span>Detections</span></button>
      <button class="camera-action settings-action" type="button"><ha-icon icon="mdi:tune-variant"></ha-icon><span>Settings</span></button>
    </div>`;
    const tile = {
      root,
      camera,
      image: root.querySelector("img"),
      interactions: [],
      lastSnapshotUrl: null,
    };
    tile.interactions.push(
      interaction(root.querySelector(".camera-media"), {
        primary: (event) => this.openViewer(tile.camera, event.currentTarget),
        feedback: true,
      }),
      interaction(root.querySelector(".live-action"), {
        primary: (event) => this.openViewer(tile.camera, event.currentTarget),
        feedback: true,
      }),
      interaction(root.querySelector(".detections-action"), {
        primary: (event) => this.openSettings(tile.camera, event.currentTarget, "detections"),
        feedback: true,
      }),
      interaction(root.querySelector(".settings-action"), {
        primary: (event) => this.openSettings(tile.camera, event.currentTarget, "controls"),
        feedback: true,
      }),
    );
    tile.image.addEventListener("error", () => {
      if (tile.lastSnapshotUrl && tile.image.src !== tile.lastSnapshotUrl) {
        tile.image.src = tile.lastSnapshotUrl;
      }
    });
    return tile;
  }

  updateCameraTile(tile, camera) {
    const media = tile.root.querySelector(".camera-media");
    const badge = tile.root.querySelector(".camera-badge");
    const classifications = camera.classifications || [];
    const capabilityCount =
      (camera.switches?.length || 0) +
      (camera.actions?.length || 0) +
      (camera.ptz?.length || 0);

    media.disabled = !camera.online;
    media.classList.toggle("offline", !camera.online);
    media.setAttribute("aria-label", `Open live view for ${camera.name}`);
    tile.root.querySelector(".camera-name").textContent = camera.name;
    tile.root.querySelector(".camera-state").textContent = camera.active
      ? "Activity detected"
      : camera.online
        ? "Online"
        : "Unavailable";
    tile.root.querySelector(".classification-summary").textContent = classifications.length
      ? `Recent: ${classifications.map((item) => item.name).join(" · ")}`
      : "No detection image entities";
    badge.classList.toggle("activity", camera.active);
    badge.querySelector("ha-icon").setAttribute(
      "icon",
      camera.active ? "mdi:motion-sensor" : "mdi:cctv",
    );
    badge.querySelector("span").textContent = camera.active
      ? "Activity"
      : camera.online
        ? "Live available"
        : "Offline";

    const live = tile.root.querySelector(".live-action");
    live.disabled = !camera.online;
    const detections = tile.root.querySelector(".detections-action");
    detections.disabled = !(classifications.length || camera.detections?.length);
    detections.setAttribute(
      "aria-label",
      `Open recent detections for ${camera.name}`,
    );
    const settings = tile.root.querySelector(".settings-action");
    settings.disabled = !camera.online && !capabilityCount;
    settings.setAttribute("aria-label", `Open settings for ${camera.name}`);
    tile.image.alt = `${camera.name} camera snapshot`;
  }

  destroyCameraTile(tile) {
    for (const handle of tile.interactions) handle.destroy();
    tile.interactions = [];
  }

  refreshSnapshots(force = false) {
    if (!this._hass || document.visibilityState === "hidden") return;
    for (const tile of this.cameraTiles.values()) {
      const camera = tile.camera;
      if (!camera?.online) continue;
      const state = this._hass.states?.[camera.entityId];
      const picture = state?.attributes?.entity_picture;
      if (!picture) continue;
      const base = this._hass.hassUrl ? this._hass.hassUrl(picture) : picture;
      const stamp = Math.floor(Date.now() / 10000);
      const url = `${base}${base.includes("?") ? "&" : "?"}_=${stamp}`;
      if (!force && tile.image.src === url) continue;
      tile.lastSnapshotUrl = tile.image.src || tile.lastSnapshotUrl;
      tile.image.src = url;
    }
  }

  renderEntries(entries) {
    this.elements.entrySection.hidden = entries.length === 0;
    this.elements.entryMeta.textContent = entries.length
      ? `${entries.filter((entry) => entry.available && entry.open).length} open`
      : "";
    this.elements.entries.replaceChildren();

    for (const entry of entries) {
      const row = document.createElement("article");
      row.className = "entry";
      const icon = this.entryIcon(entry);
      const actionLabel = this.entryActionLabel(entry);
      row.innerHTML = `<span class="entry-icon"><ha-icon></ha-icon></span>
        <span><span class="entry-name"></span><span class="entry-state"></span></span>
        <span class="entry-actions">
          <button class="entry-detail" type="button" aria-label="Open entity details"><ha-icon icon="mdi:information-outline"></ha-icon></button>
          <button class="entry-operate" type="button"></button>
        </span>`;
      row.querySelector(".entry-icon ha-icon").setAttribute("icon", icon);
      row.querySelector(".entry-icon").classList.toggle("attention", entry.open);
      row.querySelector(".entry-name").textContent = entry.name;
      row.querySelector(".entry-state").textContent = entry.available
        ? this.entryStateLabel(entry)
        : "Unavailable";
      const operate = row.querySelector(".entry-operate");
      operate.textContent = actionLabel;
      operate.disabled = !entry.available || !this.canOperateEntry(entry);
      operate.setAttribute("aria-label", `${actionLabel} ${entry.name}`);
      this.surfaceInteractions.push(
        interaction(row.querySelector(".entry-detail"), {
          primary: () => openMoreInfo(this, entry.entityId),
          feedback: true,
        }),
        interaction(operate, {
          primary: () => this.requestEntryOperation(entry, operate),
          singleFlight: true,
          feedback: true,
        }),
      );
      this.elements.entries.append(row);
    }
  }

  entryIcon(entry) {
    if (entry.domain === "lock") return entry.open ? "mdi:lock-open-outline" : "mdi:lock-outline";
    if (entry.deviceClass === "garage_door") return entry.open ? "mdi:garage-open" : "mdi:garage";
    if (entry.deviceClass === "window") return entry.open ? "mdi:window-open-variant" : "mdi:window-closed-variant";
    return entry.open ? "mdi:door-open" : "mdi:door-closed";
  }

  entryStateLabel(entry) {
    if (entry.domain === "lock") return entry.open ? "Unlocked" : "Locked";
    return entry.open ? "Open" : "Closed";
  }

  entryActionLabel(entry) {
    if (entry.domain === "lock") return entry.open ? "Lock" : "Unlock";
    return entry.open ? "Close" : "Open";
  }

  canOperateEntry(entry) {
    if (entry.controlEntityId && this._hass?.states?.[entry.controlEntityId]) return true;
    return ["lock", "cover"].includes(entry.domain);
  }

  async requestEntryOperation(entry, button) {
    if (this.entryConfirmId !== entry.entityId) {
      this.entryConfirmId = entry.entityId;
      button.textContent = "Confirm";
      button.classList.add("confirm");
      clearTimeout(this.entryConfirmTimer);
      this.entryConfirmTimer = setTimeout(() => {
        this.entryConfirmTimer = null;
        if (this.entryConfirmId === entry.entityId) this.entryConfirmId = null;
        if (button.isConnected) {
          button.textContent = this.entryActionLabel(entry);
          button.classList.remove("confirm");
        }
      }, 3000);
      return;
    }

    this.entryConfirmId = null;
    clearTimeout(this.entryConfirmTimer);
    this.entryConfirmTimer = null;
    button.classList.remove("confirm");
    button.textContent = "Working…";
    await this.runEntryOperation(entry);
    if (button.isConnected) button.textContent = "Done";
  }

  async runEntryOperation(entry) {
    if (entry.controlEntityId) {
      const domain = entry.controlEntityId.split(".")[0];
      if (domain === "button") {
        await this._hass.callService("button", "press", {
          entity_id: entry.controlEntityId,
        });
        return;
      }
      if (domain === "cover") {
        await this._hass.callService(
          "cover",
          entry.open ? "close_cover" : "open_cover",
          { entity_id: entry.controlEntityId },
        );
        return;
      }
      if (domain === "lock") {
        await this._hass.callService(
          "lock",
          entry.open ? "lock" : "unlock",
          { entity_id: entry.controlEntityId },
        );
        return;
      }
      await this._hass.callService("homeassistant", "toggle", {
        entity_id: entry.controlEntityId,
      });
      return;
    }
    if (entry.domain === "lock") {
      await this._hass.callService("lock", entry.open ? "lock" : "unlock", {
        entity_id: entry.entityId,
      });
    } else if (entry.domain === "cover") {
      await this._hass.callService(
        "cover",
        entry.open ? "close_cover" : "open_cover",
        { entity_id: entry.entityId },
      );
    }
  }

  openViewer(camera, trigger) {
    if (!camera?.online || !this._hass) return;
    this.viewerCameraId = camera.id;
    this.startViewer(camera);
    this.viewerController.open(trigger);
  }

  startViewer(camera) {
    this.stopViewer(false);
    const requestedEntityId = camera.streamEntityId || camera.entityId;
    const requestedState = this._hass.states?.[requestedEntityId];
    const fallbackState = this._hass.states?.[camera.entityId];
    const valid = (state) =>
      state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase());
    const stateObj = valid(requestedState) ? requestedState : fallbackState;
    this.elements.viewerTitle.textContent = `${camera.name} live`;
    this.elements.viewerBody.replaceChildren();
    if (!stateObj) {
      const message = document.createElement("div");
      message.className = "viewer-message";
      message.textContent = "Live stream is unavailable";
      this.elements.viewerBody.append(message);
      return;
    }

    const stream = document.createElement("ha-camera-stream");
    stream.className = "viewer-stream";
    stream.hass = this._hass;
    stream.stateObj = stateObj;
    stream.controls = true;
    stream.muted = true;
    this.viewerStream = stream;
    this.viewerEntityId = stateObj.entity_id || camera.entityId;
    const message = document.createElement("div");
    message.className = "viewer-message";
    message.textContent =
      requestedEntityId !== camera.entityId
        ? "Using configured high-resolution stream"
        : "Live";
    this.elements.viewerBody.append(stream, message);
  }

  updateViewer(camera) {
    this.elements.viewerTitle.textContent = `${camera.name} live`;
    if (!this.viewerStream) return;
    const entityId = camera.streamEntityId || camera.entityId;
    const stateObj = this._hass?.states?.[entityId] || this._hass?.states?.[camera.entityId];
    if (stateObj) {
      this.viewerStream.hass = this._hass;
      this.viewerStream.stateObj = stateObj;
    }
  }

  stopViewer(clearId = true) {
    this.viewerStream?.remove?.();
    this.viewerStream = null;
    this.viewerEntityId = null;
    this.elements?.viewerBody?.replaceChildren();
    if (clearId) this.viewerCameraId = null;
  }

  openViewerDetails() {
    const camera = this.findCamera(this.viewerCameraId);
    if (!camera) return;
    this.viewerController.close();
    queueMicrotask(() => openMoreInfo(this, camera.entityId));
  }

  switchViewerToSettings() {
    const camera = this.findCamera(this.viewerCameraId);
    if (!camera) return;
    const trigger = this.shadowRoot.querySelector(".viewer-settings");
    this.viewerController.close();
    queueMicrotask(() => this.openSettings(camera, trigger, "controls"));
  }

  openSettings(camera, trigger, focus = "controls") {
    if (!camera) return;
    this.settingsCameraId = camera.id;
    this.renderSettings(camera);
    this.settingsController.open(trigger);
    if (focus === "detections") {
      queueMicrotask(() =>
        this.elements.settingsBody.querySelector(".settings-group")?.scrollIntoView?.({
          block: "start",
        }),
      );
    }
  }

  switchSettingsToViewer() {
    const camera = this.findCamera(this.settingsCameraId);
    if (!camera?.online) return;
    const trigger = this.shadowRoot.querySelector(".settings-live");
    this.settingsController.close();
    queueMicrotask(() => this.openViewer(camera, trigger));
  }

  findCamera(id) {
    return (this.model?.cameras || []).find((camera) => camera.id === id) || null;
  }

  renderSettings(camera) {
    this.destroyInteractions(this.dialogInteractions);
    this.elements.settingsTitle.textContent = camera.name;
    this.elements.settingsBody.replaceChildren();
    const groups = document.createElement("div");
    groups.className = "settings-groups";
    this.elements.settingsBody.append(groups);

    const addGroup = (title, className = "") => {
      const section = document.createElement("section");
      section.className = "settings-group";
      const heading = document.createElement("div");
      heading.className = "settings-title";
      heading.textContent = title;
      const body = document.createElement("div");
      if (className) body.className = className;
      section.append(heading, body);
      groups.append(section);
      return body;
    };

    const classifications = camera.classifications || [];
    if (classifications.length) {
      const list = addGroup("Recent detections", "detections");
      for (const classification of classifications) {
        const entityId = classification.entity.entity_id;
        const state = this._hass.states?.[entityId];
        const picture = state?.attributes?.entity_picture;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "detection";
        button.setAttribute("aria-label", `Open latest ${classification.name} detection`);
        const image = document.createElement("img");
        image.alt = `Latest ${classification.name} detection`;
        image.loading = "lazy";
        if (picture) image.src = this._hass.hassUrl?.(picture) || picture;
        const copy = document.createElement("span");
        copy.className = "detection-copy";
        const name = document.createElement("span");
        name.className = "detection-name";
        name.textContent = classification.name;
        const time = document.createElement("span");
        time.className = "detection-time";
        const timestamp = state?.last_updated ? new Date(state.last_updated) : null;
        time.textContent =
          timestamp && Number.isFinite(timestamp.getTime())
            ? formatDate(this._hass, timestamp, {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : "No detection available";
        copy.append(name, time);
        button.append(image, copy);
        this.dialogInteractions.push(
          interaction(button, {
            primary: () => {
              this.settingsController.close();
              queueMicrotask(() => openMoreInfo(this, entityId));
            },
            feedback: true,
          }),
        );
        list.append(button);
      }
    }

    const detections = camera.detections || [];
    if (detections.length) {
      const list = addGroup("Detection status", "status-list");
      for (const entity of detections) {
        const state = this._hass.states?.[entity.entity_id];
        const available =
          state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase());
        const row = document.createElement("div");
        row.className = "status-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><span class="control-value"></span>';
        row.querySelector(".control-name").textContent =
          entity.name || entity.original_name || state?.attributes?.friendly_name || "Detection";
        row.querySelector(".control-state").textContent = available
          ? state.state === "on"
            ? "Detected"
            : "Clear"
          : "Unavailable";
        const value = row.querySelector(".control-value");
        value.textContent = available && state.state === "on" ? "Active" : available ? "Clear" : "—";
        value.classList.toggle("on", available && state.state === "on");
        list.append(row);
      }
    }

    const switches = camera.switches || [];
    if (switches.length) {
      const list = addGroup("Camera controls", "control-list");
      for (const capability of switches) {
        const entityId = capability.entity.entity_id;
        const state = this._hass.states?.[entityId];
        const available =
          state && !["unknown", "unavailable"].includes(String(state.state).toLowerCase());
        const on = available && state.state === "on";
        const row = document.createElement("div");
        row.className = "control-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><button class="control-toggle" type="button"></button>';
        row.querySelector(".control-name").textContent = capability.role;
        row.querySelector(".control-state").textContent = available
          ? on
            ? "On"
            : "Off"
          : "Unavailable";
        const button = row.querySelector("button");
        button.textContent = on ? "Turn off" : "Turn on";
        button.disabled = !available;
        button.classList.toggle("on", on);
        button.setAttribute("aria-pressed", String(on));
        button.setAttribute(
          "aria-label",
          `${on ? "Turn off" : "Turn on"} ${capability.role}`,
        );
        this.dialogInteractions.push(
          interaction(button, {
            primary: () => this.toggleCameraSwitch(entityId, on),
            hold: () => {
              this.settingsController.close();
              queueMicrotask(() => openMoreInfo(this, entityId));
            },
            singleFlight: true,
            feedback: true,
          }),
        );
        list.append(row);
      }
    }

    const actions = camera.actions || [];
    const ptz = camera.ptz || [];
    if (actions.length || ptz.length) {
      const list = addGroup("Advanced controls", "control-list");
      for (const action of actions) {
        const entityId = action.entity.entity_id;
        const row = document.createElement("div");
        row.className = "control-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><button class="control-toggle" type="button">Run</button>';
        row.querySelector(".control-name").textContent =
          action.entity.name || action.entity.original_name || action.role;
        row.querySelector(".control-state").textContent = "Action";
        this.dialogInteractions.push(
          interaction(row.querySelector("button"), {
            primary: () =>
              this._hass.callService("button", "press", { entity_id: entityId }),
            hold: () => openMoreInfo(this, entityId),
            singleFlight: true,
            feedback: true,
          }),
        );
        list.append(row);
      }
      for (const entity of ptz) {
        const row = document.createElement("div");
        row.className = "control-row";
        row.innerHTML =
          '<span><span class="control-name"></span><span class="control-state"></span></span><button class="control-toggle" type="button">Open</button>';
        row.querySelector(".control-name").textContent =
          entity.name || entity.original_name || "PTZ";
        row.querySelector(".control-state").textContent =
          this._hass.states?.[entity.entity_id]?.state || "Control";
        this.dialogInteractions.push(
          interaction(row.querySelector("button"), {
            primary: () => {
              this.settingsController.close();
              queueMicrotask(() => openMoreInfo(this, entity.entity_id));
            },
            feedback: true,
          }),
        );
        list.append(row);
      }
    }

    const footer = addGroup("Camera", "settings-footer");
    const details = document.createElement("button");
    details.type = "button";
    details.className = "footer-action";
    details.innerHTML = '<ha-icon icon="mdi:information-outline"></ha-icon><span>Home Assistant details</span>';
    const live = document.createElement("button");
    live.type = "button";
    live.className = "footer-action";
    live.disabled = !camera.online;
    live.innerHTML = '<ha-icon icon="mdi:play-circle-outline"></ha-icon><span>Open live view</span>';
    this.dialogInteractions.push(
      interaction(details, {
        primary: () => {
          this.settingsController.close();
          queueMicrotask(() => openMoreInfo(this, camera.entityId));
        },
        feedback: true,
      }),
      interaction(live, {
        primary: () => this.switchSettingsToViewer(),
        feedback: true,
      }),
    );
    footer.append(details, live);
  }

  async toggleCameraSwitch(entityId, currentlyOn) {
    await this._hass.callService("switch", currentlyOn ? "turn_off" : "turn_on", {
      entity_id: entityId,
    });
    await this.refresh();
  }
}

registerCard({
  type: "component-security-dashboard-v1",
  element: ComponentSecurityDashboardV1,
  name: "Security Dashboard V1",
  description: "Single-owner Security dashboard with on-demand live video, detections, controls, quick actions and entry points.",
});
}

// Module: src/components/smart-collection.js
{
(() => {
  globalThis.__homeDashboardV2 ??= {};
  const HD2 = globalThis.__homeDashboardV2;
  const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

  class ComponentSmartCollectionV3 extends HTMLElement {
    static getGridOptions() {
      return { columns: 12, rows: "auto" };
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.c = null;
      this.h = null;
      this.d = null;
      this.prefs = { order: [], hidden: [] };
      this.prefsLoaded = false;
      this.unsub = null;
      this.activeStateSubscription = null;
      this.activeStateToken = null;
      this.activeStateConnection = null;
      this.activeStateRetry = null;
      this.gen = 0;
      this.structureSig = "";
      this.reconcileIncomplete = false;
      this.cards = new Map();
      this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}*{box-sizing:border-box}[hidden]{display:none!important}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}.head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.heading{display:flex;align-items:center;gap:7px;min-width:0}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.head.sep{min-height:30px;margin:2px 0 6px}.head.sep .heading{flex:1}.head.sep .heading h2{font-size:12px;font-weight:500;color:var(--secondary-text-color)}.head.sep .heading ha-icon{display:none}.head.sep .heading:after{content:'';height:1px;background:var(--divider-color);flex:1}.body{display:grid;gap:8px;min-width:0}.empty{min-height:44px;padding:8px 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);color:var(--secondary-text-color);font-size:12px;display:flex;align-items:center;gap:8px}.empty ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}</style><ha-card><div class="head"><span class="heading"><ha-icon></ha-icon><h2></h2></span><button class="edit" type="button" aria-label="Edit"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="body"></div></ha-card>`;
      this.head = this.shadowRoot.querySelector(".head");
      this.body = this.shadowRoot.querySelector(".body");
      this.edit = this.shadowRoot.querySelector(".edit");
      this.edit.onclick = () => this.openEditor();
    }

    setConfig(config) {
      this.c = {
        mode: "all",
        title: "Controls",
        icon: "mdi:tune-variant",
        pref_key: null,
        show_header: true,
        header_style: "title",
        editable: false,
        exclude_device_names: [],
        ...config,
      };
      this.head.hidden = !this.c.show_header;
      this.head.classList.toggle("sep", this.c.header_style === "separator");
      this.head.querySelector("h2").textContent = this.c.title;
      this.head.querySelector(".heading ha-icon").setAttribute("icon", this.c.icon);
      this.edit.hidden = !this.c.editable;
      this.structureSig = "";
      this.loadPrefs();
      this.schedule();
      if (this.c.mode === "active") this.startActiveStateStream();
      else this.stopActiveStateStream();
    }

    set hass(hass) {
      this.h = hass;
      for (const record of this.cards.values()) record.el.hass = hass;
      this.unsub || this.subscribe();
      if (!this.prefsLoaded) this.loadPrefs();
      if (!this.d || this.c?.mode === "active" || this.reconcileIncomplete) this.schedule();
      this.startActiveStateStream();
    }

    connectedCallback() {
      this.subscribe();
      this.schedule();
      this.startActiveStateStream();
    }

    disconnectedCallback() {
      this.unsub?.();
      this.unsub = null;
      this.stopActiveStateStream();
      this.gen++;
    }

    getCardSize() {
      return 2;
    }

    subscribe() {
      if (this.unsub || !this.h || !HD2.REG?.subscribe) return;
      this.unsub = HD2.REG.subscribe(this.h, (data) => {
        this.d = data;
        this.structureSig = "";
        this.schedule();
      });
    }

    isCameraOwner(entry) {
      if (entry?.platform !== "onvif" || HD2.domain(entry.entity_id) !== "camera") return false;
      const identity = `${entry.entity_id} ${entry.name || entry.original_name || ""}`;
      return !/sub.?stream/i.test(identity);
    }

    isCameraDeviceActive(entry) {
      if (!entry?.device_id) return false;
      return (this.d?.byDevice?.get(entry.device_id) || []).some((sibling) => {
        if (HD2.domain(sibling.entity_id) !== "binary_sensor") return false;
        const state = this.h?.states?.[sibling.entity_id];
        const deviceClass = state?.attributes?.device_class || "";
        const identity = `${sibling.entity_id} ${sibling.name || sibling.original_name || ""}`;
        return state?.state === "on" &&
          (/^(motion|occupancy|presence|sound)$/.test(deviceClass) || /motion|human|person|detect/i.test(identity));
      });
    }

    isGarageTrigger(entry, garageDevices) {
      if (!garageDevices.has(entry?.device_id) || HD2.domain(entry.entity_id) !== "button") return false;
      const identity = `${entry.entity_id || ""} ${entry.name || ""} ${entry.original_name || ""}`.toLowerCase();
      return /(garage.?door|door).*(trigger|operate)|(trigger|operate).*(garage.?door|door)/.test(identity);
    }

    async loadPrefs() {
      if (!this.h || !this.c?.pref_key || !HD2.prefs) return;
      this.prefs = await HD2.prefs(this.h, this.c.pref_key);
      this.prefsLoaded = true;
      this.structureSig = "";
      this.schedule();
    }

    candidates() {
      if (!this.d || !this.h) return [];
      const media = this.d.entities.filter((entry) =>
        HD2.uiEntry(entry) &&
        HD2.domain(entry.entity_id) === "media_player" &&
        this.h.states[entry.entity_id],
      );
      const mediaDevices = new Set(media.map((entry) => entry.device_id).filter(Boolean));
      const mediaNames = media
        .map((entry) => HD2.stateName(this.h, entry, this.h.states[entry.entity_id]).trim().toLowerCase())
        .filter(Boolean);
      const excluded = new Set(this.c.exclude_device_names || []);
      const deviceNames = new Map(this.d.devices.map((device) => [device.id, device.name_by_user || device.name || ""]));

      const candidates = this.d.entities
        .filter((entry) => {
          const state = this.h.states[entry.entity_id];
          const cameraOwner = this.isCameraOwner(entry);
          const eligible = this.c.mode === "sound"
            ? Boolean(entry?.entity_id && !entry.disabled_by)
            : HD2.uiEntry(entry) && (entry.platform !== "onvif" || cameraOwner);
          if (!eligible || !state || excluded.has(deviceNames.get(entry.device_id))) return false;

          const domain = HD2.domain(entry.entity_id);
          const area = HD2.areaOf(entry, this.d);
          const controlName = HD2.stateName(this.h, entry, state).trim().toLowerCase();
          if (this.c.mode === "area") return area === this.c.area_id && (HD2.isPotential(entry, state) || cameraOwner);
          if (this.c.mode === "media") return domain === "media_player";
          if (this.c.mode === "sound") {
            return ["switch", "number", "select"].includes(domain) &&
              (mediaDevices.has(entry.device_id) || mediaNames.some((name) => controlName.startsWith(`${name} `)));
          }
          if (this.c.mode === "active" || this.c.mode === "all") {
            return cameraOwner || HD2.isPotential(entry, state) ||
              (this.c.mode === "active" && domain === "binary_sensor" && /^(door|window|smoke|moisture|gas)$/.test(state.attributes?.device_class || ""));
          }
          return false;
        });
      const garageDevices = new Set(candidates
        .filter((entry) => HD2.domain(entry.entity_id) === "binary_sensor" && this.h.states[entry.entity_id]?.attributes?.device_class === "garage_door")
        .map((entry) => entry.device_id)
        .filter(Boolean));
      const splitOwned = new Set();
      for (const climate of candidates.filter((entry) => HD2.domain(entry.entity_id) === "climate")) {
        const config = HD2.nativeClimateControlConfig?.(climate, this.h.states[climate.entity_id], this.d, this.h);
        for (const entityId of [config?.vertical_vane_entity, config?.horizontal_vane_entity, config?.timer_entity].filter(Boolean)) splitOwned.add(entityId);
        for (const profile of config?.profile_entities || []) if (profile?.entity) splitOwned.add(profile.entity);
      }
      return candidates.filter((entry) => !this.isGarageTrigger(entry, garageDevices) && !splitOwned.has(entry.entity_id));
    }

    shown(entries) {
      return this.c.mode === "active"
        ? entries.filter((entry) => this.isCameraOwner(entry)
          ? this.isCameraDeviceActive(entry)
          : HD2.isActive(entry, this.h.states[entry.entity_id]))
        : entries;
    }

    meta(entry) {
      const area = HD2.areaOf(entry, this.d);
      const name = this.d.areaMap?.get(area)?.name || "Household";
      return `${name} · ${HD2.label(HD2.domain(entry.entity_id))}`;
    }

    schedule() {
      if (!this.h || !this.c || !HD2.REG?.load) return;
      const generation = ++this.gen;
      queueMicrotask(() => this.sync(generation));
    }

    stopActiveStateStream() {
      clearTimeout(this.activeStateRetry);
      this.activeStateRetry = null;
      this.activeStateToken = null;
      this.activeStateConnection = null;
      const subscription = this.activeStateSubscription;
      this.activeStateSubscription = null;
      if (subscription) Promise.resolve(subscription).then((unsubscribe) => unsubscribe?.()).catch(() => {});
    }

    handleActiveStateChanged(event) {
      if (this.c?.mode !== "active" || !this.h) return;
      const data = event?.data || event;
      const entityId = data?.entity_id;
      if (!entityId) return;
      const domain = HD2.domain?.(entityId);
      if (!new Set(["light", "fan", "switch", "input_boolean", "media_player", "climate", "cover", "lock", "vacuum", "binary_sensor"]).has(domain)) return;
      const oldState = data.old_state || this.h.states?.[entityId] || null;
      const newState = data.new_state || null;
      if (domain === "binary_sensor" && !/^(door|window|garage_door|smoke|moisture|gas)$/.test(newState?.attributes?.device_class || oldState?.attributes?.device_class || "")) return;
      let entry = this.d?.entities?.find((item) => item.entity_id === entityId) || null;
      if (entry && !HD2.uiEntry(entry)) return;
      entry ||= { entity_id: entityId };
      if (HD2.isActive(entry, oldState) === HD2.isActive(entry, newState)) return;
      const states = { ...(this.h.states || {}) };
      if (newState) states[entityId] = newState;
      else delete states[entityId];
      this.structureSig = "";
      this.hass = { ...this.h, states };
    }

    startActiveStateStream() {
      if (this.c?.mode !== "active" || !this.isConnected) return;
      const connection = this.h?.connection;
      if (!connection?.subscribeEvents || (this.activeStateConnection === connection && this.activeStateSubscription)) return;
      this.stopActiveStateStream();
      this.activeStateConnection = connection;
      const token = {};
      this.activeStateToken = token;
      let subscription;
      try {
        subscription = connection.subscribeEvents((event) => {
          if (this.activeStateToken === token) this.handleActiveStateChanged(event);
        }, "state_changed");
      } catch {
        subscription = Promise.reject(new Error("state subscription failed"));
      }
      this.activeStateSubscription = Promise.resolve(subscription).catch(() => {
        if (this.activeStateToken !== token) return null;
        this.activeStateSubscription = null;
        this.activeStateRetry = setTimeout(() => {
          this.activeStateRetry = null;
          this.startActiveStateStream();
        }, 10000);
        return null;
      });
    }

    tune(card) {
      if (card?.localName !== "component-split-controller-v4" || !card.shadowRoot || card.shadowRoot.querySelector("style[data-home-minimal]")) return;
      const style = document.createElement("style");
      style.dataset.homeMinimal = "";
      style.textContent = ".nm{font-weight:500!important}.iw{color:var(--secondary-text-color)!important}.rv{font-size:22px!important;font-weight:500!important}.tv{font-size:16px!important;font-weight:500!important}.al,.pt,.gt,.o,.tpr button,.tcu button,.tac button{font-weight:500!important}.pt{font-size:16px!important}.a ha-icon{--mdc-icon-size:17px!important}";
      card.shadowRoot.append(style);
    }

    async sync(generation) {
      const data = this.d || await HD2.REG.load(this.h);
      if (generation !== this.gen) return;
      this.d ||= data;

      const candidates = this.candidates().sort((left, right) =>
        HD2.stateName(this.h, left, this.h.states[left.entity_id]).localeCompare(
          HD2.stateName(this.h, right, this.h.states[right.entity_id]),
          undefined,
          { sensitivity: "base" },
        ),
      );
      const preferences = HD2.applyPrefs(candidates.map((entry) => ({ id: entry.entity_id, entry })), this.prefs);
      const visible = this.shown(preferences.visible.map((item) => item.entry));
      const rows = [];
      for (const entry of visible) {
        const config = this.isCameraOwner(entry)
          ? { type: "custom:component-camera-controller-v1", entity: entry.entity_id, device_id: entry.device_id }
          : HD2.controlConfig(entry, this.h.states[entry.entity_id], this.d, this.h);
        if (config) rows.push({ entry, config, signature: JSON.stringify(config) });
      }

      const structureSignature = JSON.stringify(rows.map(({ entry, signature }) => [entry.entity_id, signature]));
      if (structureSignature === this.structureSig) {
        for (const record of this.cards.values()) record.el.hass = this.h;
        return;
      }

      const staged = new Map();
      for (const row of rows) {
        const current = this.cards.get(row.entry.entity_id);
        if (current?.sig === row.signature) {
          staged.set(row.entry.entity_id, current);
          continue;
        }
        try {
          const element = await HD2.card(this.h, row.config);
          if (generation !== this.gen) return;
          this.tune(element);
          staged.set(row.entry.entity_id, { el: element, sig: row.signature });
        } catch {
          // Leave the committed rows and signature intact so the next sync retries.
        }
      }
      if (generation !== this.gen) return;
      if (staged.size !== rows.length) {
        this.reconcileIncomplete = true;
        return;
      }

      const retained = new Set(staged.values());
      for (const record of this.cards.values()) {
        if (!retained.has(record)) record.el.remove();
      }
      this.cards.clear();
      for (const [entityId, record] of staged) this.cards.set(entityId, record);

      if (!rows.length) {
        if (!this.empty) {
          this.empty = document.createElement("div");
          this.empty.className = "empty";
          this.empty.innerHTML = "<ha-icon></ha-icon><span></span>";
        }
        this.empty.querySelector("ha-icon").setAttribute("icon", this.c.mode === "active" ? "mdi:check-circle-outline" : "mdi:gesture-tap");
        this.empty.querySelector("span").textContent = this.c.mode === "active" ? "Everything is quiet" : "No controls available";
        if (!this.empty.isConnected) this.body.append(this.empty);
      } else {
        this.empty?.remove();
        for (const { entry } of rows) {
          const record = this.cards.get(entry.entity_id);
          record.el.hass = this.h;
          if (this.body.lastElementChild !== record.el) this.body.append(record.el);
        }
      }
      this.structureSig = structureSignature;
      this.reconcileIncomplete = false;
    }

    async openEditor() {
      if (!this.h || !this.c?.pref_key || !HD2.REG?.load) return;
      const editor = await HD2.preferenceEditor();
      this.d = this.d || await HD2.REG.load(this.h);
      const items = this.candidates().map((entry) => ({
        id: entry.entity_id,
        name: HD2.stateName(this.h, entry, this.h.states[entry.entity_id]),
        meta: this.meta(entry),
        icon: this.isCameraOwner(entry) ? "mdi:cctv" : HD2.icon(entry, this.h.states[entry.entity_id]),
      }));
      const preferences = HD2.applyPrefs(items, this.prefs);
      editor.open({
        title: `Edit ${this.c.title.toLowerCase()}`,
        description: "Reorder discovered controls or hide controls you do not want shown.",
        items: preferences.all,
        hidden: [...preferences.hidden],
        onSave: async (value) => {
          this.prefs = value;
          await HD2.savePrefs(this.h, this.c.pref_key, value);
          this.structureSig = "";
          this.schedule();
        },
      });
    }
  }

  registerCard({
    type: "component-smart-collection-v3",
    element: ComponentSmartCollectionV3,
    name: "Smart Control Collection V3",
    description: "Stable registry-driven household controls without refresh teardown.",
  });
})();
}

// Module: src/components/household-directory.js
{
(() => {
  globalThis.__homeDashboardV2 ??= {};
  const HD2 = globalThis.__homeDashboardV2;
  const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
  const ACTION_SERVICES = new Map([
    ["automation", "trigger"],
    ["scene", "turn_on"],
    ["script", "turn_on"],
    ["button", "press"],
    ["input_button", "press"],
  ]);

  class ComponentHouseholdDirectoryV3 extends HTMLElement {
    static getGridOptions() { return { columns: 12, rows: "auto" }; }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.c = null;
      this.h = null;
      this.d = null;
      this.prefs = { order: [], hidden: [] };
      this.prefsLoaded = false;
      this.unsub = null;
      this.gen = 0;
      this.cards = new Map();
      this.structureSig = "";
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;min-width:0}*{box-sizing:border-box}
        ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}
        .head{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}
        .heading{display:flex;align-items:center;gap:7px}.heading ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}
        .heading h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}
        .edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}
        .edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .empty{display:none;margin:0;padding:9px 2px;color:var(--secondary-text-color);font-size:13px;line-height:1.35}
        @media(max-width:340px){.grid{grid-template-columns:minmax(0,1fr)}}
      </style><ha-card><div class="head"><span class="heading"><ha-icon></ha-icon><h2></h2></span><button class="edit" type="button"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div><p class="empty">No quick actions available</p></ha-card>`;
      this.grid = this.shadowRoot.querySelector(".grid");
      this.empty = this.shadowRoot.querySelector(".empty");
      this.shadowRoot.querySelector(".edit").onclick = () => this.openEditor();
    }

    setConfig(c) {
      this.c = {
        pref_key: "home-control.household.v2",
        base_path: "/home-control",
        current_dashboard: "home-control",
        title: "Quick actions",
        icon: "mdi:gesture-tap-button",
        quick_action_label: "dashboard_quick_action",
        ...c,
      };
      this.shadowRoot.querySelector(".heading h2").textContent = this.c.title;
      this.shadowRoot.querySelector(".heading ha-icon").setAttribute("icon", this.c.icon);
      this.shadowRoot.querySelector(".edit").setAttribute("aria-label", `Edit ${this.c.title.toLowerCase()}`);
      this.loadPrefs();
      this.schedule();
    }

    set hass(h) {
      this.h = h;
      for (const record of this.cards.values()) record.element.hass = h;
      this.unsub || this.subscribe();
      if (!this.prefsLoaded) this.loadPrefs();
      if (!this.d) this.schedule();
    }

    connectedCallback() { this.subscribe(); this.schedule(); }
    disconnectedCallback() {
      this.unsub?.();
      this.unsub = null;
      this.gen++;
    }
    getCardSize() { return 2; }

    subscribe() {
      if (this.unsub || !this.h || !HD2.REG?.subscribe) return;
      this.unsub = HD2.REG.subscribe(this.h, (d) => {
        this.d = d;
        this.structureSig = "";
        this.schedule();
      });
    }

    async loadPrefs() {
      if (!this.h || !this.c?.pref_key || !HD2.prefs) return;
      this.prefs = await HD2.prefs(this.h, this.c.pref_key);
      this.prefsLoaded = true;
      this.structureSig = "";
      this.schedule();
    }

    items() {
      if (!this.d || !this.h) return [];
      const out = [];
      const hasMedia = this.d.entities.some((e) => HD2.uiEntry(e) && HD2.domain(e.entity_id) === "media_player" && this.h.states[e.entity_id]);
      const hasControls = this.d.entities.some((e) => HD2.uiEntry(e) && HD2.controlDomains.has(HD2.domain(e.entity_id)) && this.h.states[e.entity_id]);
      if (hasMedia) out.push({ id: "view:media", name: "Media", icon: "mdi:speaker-multiple", kind: "nav", path: `${this.c.base_path}/media`, meta: "Dashboard view" });
      if (hasControls) out.push({ id: "view:all-controls", name: "Controls", icon: "mdi:tune-variant", kind: "nav", path: `${this.c.base_path}/all-controls`, meta: "Dashboard view" });

      for (const dashboard of this.d.dashboards || []) {
        const path = dashboard.url_path;
        if (!path || path === this.c.current_dashboard || path === "home-control-fix" || dashboard.require_admin === true || dashboard.show_in_sidebar === false) continue;
        out.push({ id: `dashboard:${path}`, name: dashboard.title || HD2.label(path), icon: dashboard.icon || "mdi:view-dashboard-outline", kind: "nav", path: `/${path}`, meta: "Dashboard" });
      }

      for (const entry of this.d.entities) {
        if (!HD2.uiEntry(entry) || !this.h.states[entry.entity_id]) continue;
        const domain = HD2.domain(entry.entity_id);
        const labels = Array.isArray(entry.labels) ? entry.labels : [];
        if (ACTION_SERVICES.has(domain) && labels.includes(this.c.quick_action_label)) {
          out.push({
            id: `action:${entry.entity_id}`,
            name: HD2.stateName(this.h, entry, this.h.states[entry.entity_id]),
            icon: this.h.states[entry.entity_id].attributes?.icon || entry.icon || "mdi:gesture-tap-button",
            kind: "action",
            entity: entry.entity_id,
            domain,
            service: ACTION_SERVICES.get(domain),
            meta: "Quick action",
          });
        }
        if (domain === "todo") {
          out.push({ id: `entity:${entry.entity_id}`, name: HD2.stateName(this.h, entry, this.h.states[entry.entity_id]).replace(/ List$/i, ""), icon: "mdi:cart-outline", kind: "entity", entity: entry.entity_id, meta: "List" });
        }
      }

      const seen = new Set();
      return out.filter((item) => !seen.has(item.id) && seen.add(item.id));
    }

    cardConfig(item) {
      if (item.kind === "entity") {
        return { type: "custom:bubble-card", card_type: "button", button_type: "state", entity: item.entity, name: item.name, icon: item.icon, show_state: true, button_action: { tap_action: { action: "more-info" } }, scrolling_effect: false };
      }
      if (item.kind === "action") {
        const tapAction = { action: "perform-action", perform_action: `${item.domain}.${item.service}`, target: { entity_id: item.entity } };
        if (item.domain === "button" || item.domain === "input_button") tapAction.confirmation = { text: `Run ${item.name}?` };
        return { type: "custom:bubble-card", card_type: "button", button_type: "name", name: item.name, icon: item.icon, show_icon: true, button_action: { tap_action: tapAction }, scrolling_effect: false };
      }
      return { type: "custom:bubble-card", card_type: "button", button_type: "name", name: item.name, icon: item.icon, show_icon: true, button_action: { tap_action: { action: "navigate", navigation_path: item.path } }, scrolling_effect: false };
    }

    schedule() {
      if (!this.h || !this.c || !HD2.REG?.load) return;
      const generation = ++this.gen;
      queueMicrotask(() => this.sync(generation));
    }

    async sync(generation) {
      const data = this.d || await HD2.REG.load(this.h);
      if (generation !== this.gen) return;
      this.d ||= data;

      const presentation = HD2.applyPrefs(this.items(), this.prefs);
      const rows = presentation.visible.map((item) => {
        const config = this.cardConfig(item);
        return { item, config, configSignature: JSON.stringify(config) };
      });
      const signature = JSON.stringify(rows.map((row) => [row.item.id, row.configSignature]));
      const complete = rows.length === this.cards.size && rows.every((row, index) =>
        this.cards.get(row.item.id)?.configSignature === row.configSignature &&
        this.grid.children[index] === this.cards.get(row.item.id)?.element,
      );
      if (complete) {
        this.empty.style.display = rows.length ? "none" : "block";
        for (const record of this.cards.values()) record.element.hass = this.h;
        this.structureSig = signature;
        return;
      }

      const staged = new Map();
      for (const row of rows) {
        const current = this.cards.get(row.item.id);
        if (current?.configSignature === row.configSignature) {
          staged.set(row.item.id, current);
          continue;
        }
        try {
          const element = await HD2.card(this.h, row.config);
          if (generation !== this.gen) return;
          staged.set(row.item.id, { element, configSignature: row.configSignature });
        } catch {
          // Retain the committed child and leave the signature stale for retry.
        }
      }
      if (generation !== this.gen || staged.size !== rows.length) return;

      const retained = new Set(staged.values());
      for (const record of this.cards.values()) {
        if (!retained.has(record)) record.element.remove();
      }
      this.cards.clear();
      for (const [id, record] of staged) this.cards.set(id, record);

      this.empty.style.display = rows.length ? "none" : "block";
      for (const row of rows) {
        const record = this.cards.get(row.item.id);
        record.element.hass = this.h;
        if (this.grid.lastElementChild !== record.element) this.grid.append(record.element);
      }
      this.structureSig = signature;
    }

    async openEditor() {
      if (!this.h || !HD2.REG?.load) return;
      const editor = await HD2.preferenceEditor();
      this.d = this.d || await HD2.REG.load(this.h);
      const presentation = HD2.applyPrefs(this.items(), this.prefs);
      editor.open({
        title: `Edit ${this.c.title.toLowerCase()}`,
        description: "Reorder or hide discovered actions and destinations without changing their Home Assistant configuration.",
        items: presentation.all,
        hidden: [...presentation.hidden],
        onSave: async (value) => {
          this.prefs = value;
          await HD2.savePrefs(this.h, this.c.pref_key, value);
          this.structureSig = "";
          this.schedule();
        },
      });
    }
  }

  registerCard({ type: "component-household-directory-v3", element: ComponentHouseholdDirectoryV3, name: "Quick Actions Directory V3", description: "Stable auto-discovered labelled actions and household destinations." });
})();
}

// Module: src/components/favourites-minimal.js
{
const { registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentFavouritesMinimalV1 extends HTMLElement {
  static getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this.h = null;
    this.child = null;
    this.buildPromise = null;
  }

  setConfig(config) {
    this.c = { preference_key: "home-control.favourites.v1", ...config };
    if (this.child) this.child.setConfig(this.c);
    else this.ensure();
  }

  set hass(hass) {
    this.h = hass;
    if (this.child) this.child.hass = hass;
    else this.ensure();
  }

  connectedCallback() {
    this.ensure();
  }

  getCardSize() {
    return 2;
  }

  async ensure() {
    if (this.child || !this.c) return;
    if (this.buildPromise) return this.buildPromise;

    const build = (async () => {
      await customElements.whenDefined("component-favourites-v3");
      if (this.child || !this.c) return;

      const child = document.createElement("component-favourites-v3");
      child.setConfig(this.c);
      if (this.h) child.hass = this.h;
      this.child = child;
      this.shadowRoot.replaceChildren(child);
      queueMicrotask(() => this.tune());
    })();
    this.buildPromise = build;
    try {
      await build;
    } finally {
      if (this.buildPromise === build) this.buildPromise = null;
    }
  }

  tune() {
    const root = this.child?.shadowRoot;
    if (!root) return;

    root.querySelector(".edit ha-icon")?.setAttribute("icon", "mdi:dots-horizontal");
    if (root.querySelector("style[data-home-minimal]")) return;

    const style = document.createElement("style");
    style.dataset.homeMinimal = "";
    style.textContent = `.heading h2{font-size:15px!important;font-weight:500!important}.heading ha-icon{color:var(--secondary-text-color)!important;--mdc-icon-size:17px!important}.edit{min-width:44px!important;min-height:44px!important;padding:0!important;color:var(--secondary-text-color)!important;font-weight:400!important}.edit ha-icon{--mdc-icon-size:16px!important}.edit span{display:none!important}.icon{color:var(--secondary-text-color)!important}.name{font-weight:500!important}.state{font-size:12px!important}.dialog-title,.confirm-title{font-size:16px!important;font-weight:500!important}.subheading,.group-title,.choice-name,.dialog-button{font-weight:500!important}.selected-meta,.choice-meta,.editor-copy{font-size:12px!important}`;
    root.append(style);
  }
}

registerCard({
  type: "component-favourites-minimal-v1",
  element: ComponentFavouritesMinimalV1,
  name: "Favourites Minimal",
  description: "Existing favourites behaviour with restrained Home typography.",
});
}

// Module: src/components/room-directory.js
{
(() => {
  globalThis.__homeDashboardV2 ??= {};
  const HD2 = globalThis.__homeDashboardV2,
    { interaction, navigateTo, openMoreInfo, registerCard } =
      globalThis.__HA_COMPONENT_LIBRARY_SHARED__;
  class ComponentRoomDirectoryV4 extends HTMLElement {
    static getGridOptions() {
      return { columns: 12, rows: "auto" };
    }
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.c = null;
      this.h = null;
      this.d = null;
      this.prefs = { order: [], hidden: [] };
      this.prefsLoaded = false;
      this.unsub = null;
      this.currentAreaId = null;
      this.controlCard = null;
      this.tiles = new Map();
      this._location = () => this.syncHash();
      this._touch = null;
      this._interactionHandles = [];
      this._scrollPositions = new Map();
      this.openingAreaId = null;
      this.roomEntriesCache = null;
      this.shadowRoot.innerHTML = `<style>:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}button{font:inherit;color:inherit}.head{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;padding:0 2px}.open-view{appearance:none;border:0;background:transparent;display:flex;align-items:center;gap:7px;min-height:44px;padding:0;cursor:pointer}.open-view ha-icon{color:var(--secondary-text-color);--mdc-icon-size:17px}.open-view h2{margin:0;font-size:15px;line-height:1.2;font-weight:500}.edit,.room-edit{appearance:none;width:44px;height:44px;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer}.edit ha-icon,.room-edit ha-icon{--mdc-icon-size:16px}.edit:hover,.edit:focus-visible,.room-edit:hover,.room-edit:focus-visible,.open-view:focus-visible{background:var(--dashboard-card-muted-surface,var(--secondary-background-color));color:var(--primary-text-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.group{grid-column:1/-1;min-height:28px;padding:3px 2px 1px;display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:12px;font-weight:500}.group:after{content:'';height:1px;background:var(--divider-color);flex:1}.room{appearance:none;min-width:0;min-height:56px;padding:0 12px 0 10px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);background:var(--dashboard-card-surface,var(--card-background-color));text-align:left;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.room:active{background:var(--dashboard-card-muted-surface,var(--secondary-background-color))}.room:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}.ico{width:34px;height:34px;display:grid;place-items:center;color:var(--secondary-text-color)}.ico ha-icon{--mdc-icon-size:19px}.copy{min-width:0}.name,.summary{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.name{font-size:13px;line-height:1.25;font-weight:500}.summary{margin-top:3px;font-size:12px;line-height:1.25;font-weight:400;color:var(--secondary-text-color)}.room.active .ico{color:color-mix(in srgb,var(--primary-color) 55%,var(--secondary-text-color))}.room.warning{border-left-color:var(--warning-color,#f9a825)}.room.warning .ico{color:var(--warning-color,#f9a825)}.room.critical{border-left-color:var(--error-color)}.room.critical .ico{color:var(--error-color)}dialog{width:min(720px,calc(100vw - 24px));height:min(760px,calc(100dvh - 32px));min-height:min(560px,calc(100dvh - 32px));margin:auto;padding:0;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,10px);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22));overflow:hidden}dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.16));backdrop-filter:blur(3px)}.sheet{height:100%;display:flex;flex-direction:column;will-change:transform;transition:transform .18s ease}.sheet.dragging{transition:none}.sheet-head{flex:0 0 auto;min-height:54px;padding:5px 6px 5px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--divider-color);touch-action:pan-y}.identity{min-width:0;display:flex;align-items:center;gap:8px}.identity ha-icon{color:var(--secondary-text-color);--mdc-icon-size:18px}.sheet-name{font-size:14px;line-height:1.2;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.environment{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0;color:var(--secondary-text-color)}.metric{appearance:none;border:0;background:transparent;min-height:44px;padding:0;display:flex;align-items:center;gap:3px;white-space:nowrap;cursor:pointer;color:inherit;font-size:12px}.metric ha-icon{--mdc-icon-size:15px;color:var(--secondary-text-color)}.dot{font-size:11px;color:var(--disabled-text-color,var(--secondary-text-color))}.close{appearance:none;width:44px;height:44px;padding:0;border:0;border-radius:var(--dashboard-radius-control,8px);background:transparent;color:var(--secondary-text-color);display:grid;place-items:center;cursor:pointer;flex:0 0 auto}.close ha-icon{--mdc-icon-size:18px}.sheet-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:10px 14px max(14px,env(safe-area-inset-bottom));touch-action:pan-y}@media(max-width:700px){dialog{width:100vw;max-width:100vw;height:92dvh;min-height:92dvh;max-height:92dvh;margin:auto 0 0;border-width:1px 0 0;border-radius:var(--dashboard-radius-dialog,8px) var(--dashboard-radius-dialog,8px) 0 0}.sheet-head{padding-left:12px}.sheet-body{padding:8px 12px max(18px,env(safe-area-inset-bottom))}}@media(max-width:520px){.identity ha-icon{display:none}.sheet-head{gap:5px}.environment{gap:4px}.metric{font-size:11.5px}.room-edit,.close{width:44px;height:44px}}</style><style>@media(prefers-reduced-motion:reduce){.sheet{transition:none}}</style><ha-card><div class="head"><button class="open-view" type="button"><ha-icon></ha-icon><h2></h2></button><button class="edit" type="button" aria-label="Edit rooms"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="grid"></div></ha-card><dialog><div class="sheet"><div class="sheet-head"><span class="identity"><ha-icon class="sheet-icon"></ha-icon><span class="sheet-name"></span></span><span class="environment"></span><button class="room-edit" type="button" aria-label="Edit room controls"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button><button class="close" type="button" aria-label="Close room"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="sheet-body"></div></div></dialog>`;
      this.grid = this.shadowRoot.querySelector(".grid");
      this.dialog = this.shadowRoot.querySelector("dialog");
      this.sheet = this.shadowRoot.querySelector(".sheet");
      this.sheetBody = this.shadowRoot.querySelector(".sheet-body");
      this.environment = this.shadowRoot.querySelector(".environment");
      this.shadowRoot.querySelector(".edit").onclick = () => this.openEditor();
      this._interactionHandles.push(
        interaction(this.shadowRoot.querySelector(".open-view"), {
          primary: () => this.openView(),
          feedback: true,
        }),
      );
      this.shadowRoot.querySelector(".room-edit").onclick = () =>
        this.controlCard?.openEditor?.();
      this.shadowRoot.querySelector(".close").onclick = () => this.closeRoom();
      this.dialog.addEventListener("click", (e) => {
        if (e.target === this.dialog) this.closeRoom();
      });
      this.dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
        this.closeRoom();
      });
      this.bindSwipe();
    }
    setConfig(c) {
      this.c = {
        title: "Rooms",
        icon: "mdi:floor-plan",
        mode: "home",
        pref_key: "home-control.rooms.v2",
        navigation_path: null,
        base_path: "/home-control",
        ...c,
      };
      this.shadowRoot.querySelector("h2").textContent = this.c.title;
      this.shadowRoot
        .querySelector(".open-view ha-icon")
        .setAttribute("icon", this.c.icon);
      this.shadowRoot.querySelector(".open-view").disabled =
        !this.c.navigation_path;
      this.loadPrefs();
      this.rebuild();
    }
    set hass(h) {
      this.h = h;
      if (this.controlCard) this.controlCard.hass = h;
      this.unsub || this.subscribe();
      if (!this.prefsLoaded) this.loadPrefs();
      this.refreshTiles();
      this.refreshOpenRoom();
    }
    connectedCallback() {
      this.subscribe();
      window.addEventListener("hashchange", this._location);
      window.addEventListener("location-changed", this._location);
      this.rebuild();
      this.syncHash();
    }
    disconnectedCallback() {
      this.unsub?.();
      this.unsub = null;
      window.removeEventListener("hashchange", this._location);
      window.removeEventListener("location-changed", this._location);
    }
    getCardSize() {
      return 4;
    }
    subscribe() {
      if (this.unsub || !this.h || !HD2.REG?.subscribe) return;
      this.unsub = HD2.REG.subscribe(this.h, (d) => {
        this.d = d;
        this.rebuild();
        this.syncHash();
      });
    }
    async loadPrefs() {
      if (!this.h || !this.c?.pref_key || !HD2.prefs) return;
      this.prefs = await HD2.prefs(this.h, this.c.pref_key);
      this.prefsLoaded = true;
      this.rebuild();
    }
    openView() {
      if (!this.c.navigation_path) return;
      navigateTo(this.c.navigation_path);
    }
    entries(areaId) {
      if (!this.d || !this.h) return [];
      let cache = this.roomEntriesCache;
      if (!cache || cache.registry !== this.d) {
        const byArea = new Map();
        for (const entry of this.d.entities || []) {
          if (!HD2.uiEntry(entry)) continue;
          const id = HD2.areaOf(entry, this.d);
          if (!id) continue;
          const items = byArea.get(id) || [];
          items.push(entry);
          byArea.set(id, items);
        }
        cache = { registry: this.d, byArea };
        this.roomEntriesCache = cache;
      }
      return (cache.byArea.get(areaId) || [])
        .map((e) => ({ e, s: this.h.states[e.entity_id] }))
        .filter((x) => x.s);
    }
    roomIsActive(area) {
      return this.entries(area.area_id).some(({ e, s }) => {
        if (e?.entity_id?.startsWith("binary_sensor.") && s?.state === "on") {
          const deviceClass = String(
              s.attributes?.device_class || e.device_class || "",
            ).toLowerCase(),
            identity = (
              e.entity_id +
              " " +
              String(e.name || e.original_name || "") +
              " " +
              String(s.attributes?.friendly_name || "")
            ).toLowerCase();
          if (
            deviceClass === "occupancy" ||
            deviceClass === "presence" ||
            identity.includes("presence") ||
            identity.includes("occupancy") ||
            identity.includes("mmwave")
          )
            return true;
        }
        return HD2.isActive?.(e, s) === true;
      });
    }
    roomPresenceHue(area) {
      const key = String(area?.area_id || area?.name || "room");
      let hash = 2166136261;
      for (let i = 0; i < key.length; i++) {
        hash ^= key.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0) % 360;
    }
    air(x) {
      const id =
        `${x.e.entity_id} ${x.s.attributes?.friendly_name || ""}`.toLowerCase();
      return (
        id.includes("air_quality") ||
        id.includes("air quality") ||
        id.includes("air_monitor") ||
        id.includes("air monitor")
      );
    }
    metric(items, cls, monitor = false) {
      const blocked =
        /(_controller_temperature|_outside_air_temperature|cpu_temperature|processor_temperature|board_temperature|chip_temperature|internal_temperature)$/;
      return (
        items.find(
          (x) =>
            HD2.domain(x.e.entity_id) === "sensor" &&
            x.s.attributes?.device_class === cls &&
            HD2.validState(x.s) &&
            Number.isFinite(Number.parseFloat(x.s.state)) &&
            !(cls === "temperature" && blocked.test(x.e.entity_id)) &&
            (!monitor || this.air(x)),
        ) || null
      );
    }
    fmt(s) {
      try {
        return this.h.formatEntityState(s);
      } catch {
        return String(s?.state || "");
      }
    }
    status(area) {
      const x = this.entries(area.area_id).filter((y) => HD2.validState(y.s)),
        mt = this.metric(x, "temperature", true),
        mh = this.metric(x, "humidity", true),
        cl = x.find(
          (y) =>
            HD2.domain(y.e.entity_id) === "climate" &&
            Number.isFinite(
              Number.parseFloat(y.s.attributes?.current_temperature),
            ),
        ),
        ft = this.metric(x, "temperature"),
        fh = this.metric(x, "humidity");
      let temp = "";
      if (mt) temp = this.fmt(mt.s);
      else if (cl) {
        const n = Number.parseFloat(cl.s.attributes.current_temperature),
          u =
            cl.s.attributes.temperature_unit ||
            this.h.config?.unit_system?.temperature ||
            "°C";
        temp =
          n.toLocaleString(this.h.locale?.language || undefined, {
            maximumFractionDigits: 1,
          }) +
          " " +
          u;
      } else if (ft) temp = this.fmt(ft.s);
      const hum = mh || fh,
        lights = x.filter(
          (y) => HD2.domain(y.e.entity_id) === "light" && y.s.state === "on",
        ).length,
        critical = x.some(
          (y) =>
            HD2.domain(y.e.entity_id) === "binary_sensor" &&
            y.s.state === "on" &&
            /^(smoke|moisture|gas)$/.test(y.s.attributes?.device_class || ""),
        ),
        warning = x.some(
          (y) =>
            (HD2.domain(y.e.entity_id) === "binary_sensor" &&
              y.s.state === "on" &&
              y.s.attributes?.device_class === "garage_door") ||
            (HD2.domain(y.e.entity_id) === "cover" &&
              /^(open|opening)$/.test(y.s.state) &&
              y.s.attributes?.device_class === "garage"),
        ),
        active =
          lights > 0 ||
          x.some(
            (y) =>
              (HD2.domain(y.e.entity_id) === "climate" &&
                /^(heating|cooling|drying|fan)$/.test(
                  y.s.attributes?.hvac_action || "",
                )) ||
              (HD2.domain(y.e.entity_id) === "media_player" &&
                y.s.state === "playing"),
          );
      const p = [];
      if (critical) p.push("Attention required");
      else if (warning) p.push("Garage open");
      if (temp) p.push(temp);
      if (hum) p.push(this.fmt(hum.s));
      if (lights) p.push(`${lights} light${lights === 1 ? "" : "s"} on`);
      return {
        summary: p.slice(0, 3).join(" · "),
        severity: critical
          ? "critical"
          : warning
            ? "warning"
            : active
              ? "active"
              : "",
        tempState: mt?.s || cl?.s || ft?.s || null,
        humState: hum?.s || null,
      };
    }
    isOutdoor(a) {
      return /(yard|garage|garden|patio|deck|outdoor|shed|carport)/i.test(
        `${a.area_id} ${a.name}`,
      );
    }
    async rebuild() {
      if (!this.h || !this.c || !HD2.REG?.load) return;
      this.d = this.d || (await HD2.REG.load(this.h));
      if (!this.d) return;
      const areas = this.d.areas
          .slice()
          .sort((a, b) =>
            String(a.name).localeCompare(String(b.name), undefined, {
              sensitivity: "base",
            }),
          ),
        visible = HD2.applyPrefs(
          areas.map((a) => ({ id: a.area_id, area: a })),
          this.prefs,
        ).visible.map((x) => x.area);
      this.grid.replaceChildren();
      const add = (title, list) => {
        if (this.c.mode === "full") {
          const g = document.createElement("div");
          g.className = "group";
          g.textContent = title;
          this.grid.append(g);
        }
        for (const a of list) {
          let b = this.tiles.get(a.area_id);
          if (!b) {
            b = this.makeTile(a);
            this.tiles.set(a.area_id, b);
          }
          this.updateTile(b, a);
          this.grid.append(b);
        }
      };
      if (this.c.mode === "full") {
        add(
          "Indoor",
          visible.filter((a) => !this.isOutdoor(a)),
        );
        add(
          "Outdoor & utility",
          visible.filter((a) => this.isOutdoor(a)),
        );
      } else add("", visible);
      const keep = new Set(visible.map((a) => a.area_id));
      for (const [id, b] of [...this.tiles])
        if (!keep.has(id)) {
          b._interaction?.destroy?.();
          b.remove();
          this.tiles.delete(id);
        }
    }
    makeTile(a) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "room";
      b.innerHTML =
        '<span class="ico"><ha-icon></ha-icon></span><span class="copy"><span class="name"></span><span class="summary"></span></span>';
      b._interaction = interaction(b, {
        primary: () => {
          const x = this.d?.areaMap?.get(a.area_id) || a;
          return this.openRoom(x, true);
        },
        feedback: true,
      });
      return b;
    }
    updateTile(b, a) {
      if (!this.h) return;
      const st = this.status(a);
      b.className = `room ${st.severity}`;
      b.setAttribute(
        "aria-label",
        `Open ${a.name}${st.summary ? ". " + st.summary : ""}`,
      );
      b.querySelector("ha-icon").setAttribute(
        "icon",
        a.icon || "mdi:home-outline",
      );
      b.querySelector(".name").textContent = a.name;
      const s = b.querySelector(".summary");
      s.textContent = st.summary || "";
      s.hidden = !st.summary;
      const active = b.classList.contains("active") || this.roomIsActive(a);
      if (b.dataset.roomGlowInitialised !== "true") {
        b.dataset.roomGlowInitialised = "true";
        b.style.transition = "box-shadow 180ms ease, border-color 180ms ease";
        b.style.borderLeft =
          "var(--dashboard-card-border,1px solid var(--divider-color))";
      }
      if (!active) {
        b.style.removeProperty("border-color");
        b.style.removeProperty("box-shadow");
        b.removeAttribute("data-presence");
        return;
      }
      const hue = this.roomPresenceHue(a);
      b.setAttribute("data-presence", "true");
      b.style.borderColor = `hsl(${hue} 82% 68% / .72)`;
      b.style.boxShadow = `0 0 14px 2px hsl(${hue} 82% 64% / .14)`;
    }
    refreshTiles() {
      if (!this.d || !this.h) return;
      for (const [id, b] of this.tiles) {
        const a = this.d.areaMap?.get(id);
        if (a) this.updateTile(b, a);
      }
    }
    areaFromHash() {
      const slug = location.hash.replace(/^#/, "");
      if (!slug || !this.d) return null;
      return (
        this.d.areas.find((a) => a.area_id.replaceAll("_", "-") === slug) ||
        null
      );
    }
    syncHash() {
      if (!this.d || !this.h) return;
      const a = this.areaFromHash();
      if (a) {
        if (this.currentAreaId !== a.area_id || !this.dialog.open)
          this.openRoom(a, false);
      } else if (this.dialog.open) this.closeRoom(false);
    }
    async openRoom(a, writeHash = true) {
      if (!a || !this.h) return;
      const areaId = a.area_id;
      if (!areaId || this.openingAreaId === areaId) return;
      this.openingAreaId = areaId;
      try {
        if (this.dialog.open && this.currentAreaId)
          this._scrollPositions.set(
            this.currentAreaId,
            this.sheetBody.scrollTop,
          );
        this.currentAreaId = a.area_id;
        if (writeHash) {
          const hash = "#" + a.area_id.replaceAll("_", "-");
          if (location.hash !== hash) {
            history.pushState(
              null,
              "",
              location.pathname + location.search + hash,
            );
            window.dispatchEvent(new Event("location-changed"));
          }
        }
        this.renderSheetHeader(a);
        await customElements.whenDefined("component-smart-collection-v3");
        this.sheetBody.replaceChildren();
        const controls = document.createElement(
          "component-smart-collection-v3",
        );
        controls.setConfig({
          mode: "area",
          area_id: a.area_id,
          title: "Controls",
          icon: "mdi:gesture-tap-button",
          header_style: "separator",
          editable: false,
          pref_key: `home-control.area.${a.area_id}.v2`,
        });
        controls.hass = this.h;
        this.controlCard = controls;
        this.sheetBody.append(controls);
        if (!this.dialog.open) this.dialog.showModal();
        this.sheetBody.scrollTop = this._scrollPositions.get(a.area_id) || 0;
        this.sheet.style.transform = "";
        queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus());
      } finally {
        if (this.openingAreaId === areaId) this.openingAreaId = null;
      }
    }
    refreshOpenRoom() {
      const a = this.d?.areaMap?.get(this.currentAreaId);
      if (a && this.dialog.open) this.renderSheetHeader(a);
    }
    renderSheetHeader(a) {
      const st = this.status(a);
      this.shadowRoot
        .querySelector(".sheet-icon")
        .setAttribute("icon", a.icon || "mdi:home-outline");
      this.shadowRoot.querySelector(".sheet-name").textContent = a.name;
      this._interactionHandles = this._interactionHandles.filter((handle) => {
        if (handle?.element?.parentNode === this.environment) {
          handle.destroy();
          return false;
        }
        return true;
      });
      this.environment.replaceChildren();
      const add = (s, icon, label) => {
        if (!s) return;
        if (this.environment.childElementCount) {
          const dot = document.createElement("span");
          dot.className = "dot";
          dot.textContent = "•";
          this.environment.append(dot);
        }
        const b = document.createElement("button");
        b.type = "button";
        b.className = "metric";
        b.innerHTML = `<ha-icon icon="${icon}"></ha-icon><span></span>`;
        b.querySelector("span").textContent = label;
        this._interactionHandles.push(
          interaction(b, {
            primary: () => openMoreInfo(this, s.entity_id),
            feedback: true,
          }),
        );
        this.environment.append(b);
      };
      add(
        st.tempState,
        "mdi:thermometer",
        st.tempState ? this.tempText(st.tempState) : "",
      );
      add(
        st.humState,
        "mdi:water-percent",
        st.humState ? this.fmt(st.humState) : "",
      );
    }
    tempText(s) {
      if (HD2.domain(s.entity_id) === "climate") {
        const n = Number.parseFloat(s.attributes?.current_temperature);
        if (Number.isFinite(n)) {
          const u =
            s.attributes?.temperature_unit ||
            this.h.config?.unit_system?.temperature ||
            "°C";
          return (
            n.toLocaleString(this.h.locale?.language || undefined, {
              maximumFractionDigits: 1,
            }) +
            " " +
            u
          );
        }
      }
      return this.fmt(s);
    }
    closeRoom(clearHash = true) {
      if (this.currentAreaId)
        this._scrollPositions.set(this.currentAreaId, this.sheetBody.scrollTop);
      if (this.dialog.open) this.dialog.close();
      this.currentAreaId = null;
      this.controlCard = null;
      this.sheetBody.replaceChildren();
      this.sheet.style.transform = "";
      if (clearHash && location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
        window.dispatchEvent(new Event("location-changed"));
      }
    }
    bindSwipe() {
      const interactive = (e) =>
        e
          .composedPath()
          .some((n) =>
            n?.matches?.('button,input,select,textarea,[role="slider"],a'),
          );
      const start = (e) => {
          if (e.touches?.length !== 1 || interactive(e)) return;
          const fromHeader = e
            .composedPath()
            .some((n) => n?.classList?.contains("sheet-head"));
          if (!fromHeader && this.sheetBody.scrollTop > 0) return;
          const t = e.touches[0];
          this._touch = { x: t.clientX, y: t.clientY, dy: 0, fromHeader };
          this.sheet.classList.add("dragging");
        },
        move = (e) => {
          if (!this._touch || e.touches?.length !== 1) return;
          if (!this._touch.fromHeader && this.sheetBody.scrollTop > 0) {
            this.cancelSwipe();
            return;
          }
          const t = e.touches[0],
            dy = t.clientY - this._touch.y,
            dx = t.clientX - this._touch.x;
          if (dy <= 0 || Math.abs(dx) > dy) {
            this.sheet.style.transform = "";
            return;
          }
          this._touch.dy = dy;
          this.sheet.style.transform = `translateY(${Math.min(dy, 240)}px)`;
          if (dy > 8) e.preventDefault();
        },
        end = () => {
          if (!this._touch) return;
          const close = this._touch.dy > 96;
          this.cancelSwipe();
          if (close) this.closeRoom();
        };
      this.sheet.addEventListener("touchstart", start, { passive: true });
      this.sheet.addEventListener("touchmove", move, { passive: false });
      this.sheet.addEventListener("touchend", end, { passive: true });
      this.sheet.addEventListener("touchcancel", end, { passive: true });
    }
    cancelSwipe() {
      this._touch = null;
      this.sheet.classList.remove("dragging");
      this.sheet.style.transform = "";
    }
    async openEditor() {
      if (!this.h || !HD2.REG?.load) return;
      const editor = await HD2.preferenceEditor();
      this.d = this.d || (await HD2.REG.load(this.h));
      const areas = this.d.areas.map((a) => ({
          id: a.area_id,
          name: a.name,
          meta: this.isOutdoor(a) ? "Outdoor & utility" : "Indoor",
          icon: a.icon || "mdi:home-outline",
        })),
        p = HD2.applyPrefs(areas, this.prefs);
      editor.open({
        title: "Edit rooms",
        description:
          "Rooms are discovered from Home Assistant Areas. Reorder them or hide rooms without changing the Area itself.",
        items: p.all,
        hidden: [...p.hidden],
        onSave: async (v) => {
          this.prefs = v;
          await HD2.savePrefs(this.h, this.c.pref_key, v);
          this.rebuild();
        },
      });
    }
  }
  registerCard({
    type: "component-room-directory-v4",
    element: ComponentRoomDirectoryV4,
    name: "Room Directory V4",
    description: "Stable registry-driven rooms with full-height swipeable room sheets.",
  });
})();
}

// Module: src/components/home-overview.js
{
const { interaction, openMoreInfo, registerCard } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

class ComponentHomeOverviewV4 extends HTMLElement {
  static getGridOptions() { return { columns: 12, rows: "auto" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.c = null;
    this.h = null;
    this._children = new Map();
    this.built = false;
    this.building = false;
    this.timer = null;
    this._weatherInteraction = null;
    this._headerSignature = "";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;min-width:0}*{box-sizing:border-box}
      ha-card{display:block;border:0;box-shadow:none;background:transparent;overflow:visible;color:var(--primary-text-color)}
      .top{min-height:44px;padding:0 2px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .time{min-width:0;white-space:nowrap;color:var(--secondary-text-color);font-size:14px;line-height:1.2;font-weight:400}
      .weather{appearance:none;border:0;min-height:44px;padding:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:13px;line-height:1.2;font-weight:400;white-space:nowrap;cursor:pointer}
      .weather:hover{text-decoration:underline}.weather:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:6px}
      .sections{margin-top:8px}.section+.section{margin-top:16px}
      @media(max-width:520px){.time{font-size:13px}.weather{font-size:12px}}
      @media(max-width:350px){.time{font-size:12px}.weather{font-size:11px}}
    </style><ha-card><div class="top"><span class="time"></span><button class="weather" type="button"></button></div><div class="sections"></div></ha-card>`;
    this.sections = this.shadowRoot.querySelector(".sections");
    this._bindWeather();
  }

  setConfig(c) {
    this.c = {
      weather_entity: "weather.forecast_home",
      base_path: "/home-control",
      current_dashboard: "home-control",
      favourites_helpers: ["input_text.dashboard_favourite_1", "input_text.dashboard_favourite_2", "input_text.dashboard_favourite_3", "input_text.dashboard_favourite_4"],
      ...c,
      // Home Favourites is backed by the companion service. Dashboard helper
      // entities are intentionally never forwarded into the child card.
      favourites_helpers: [],
    };
    this.renderHeader();
    this.ensure();
    this.tick();
  }

  set hass(h) {
    this.h = h;
    for (const child of this._children.values()) child.hass = h;
    this.renderHeader();
    if (!this.built) this.ensure();
  }

  connectedCallback() { this._bindWeather(); this.tick(); this.ensure(); }
  disconnectedCallback() { this._weatherInteraction?.destroy(); this._weatherInteraction = null; clearTimeout(this.timer); }
  getCardSize() { return 12; }

  _bindWeather() {
    if (this._weatherInteraction) return;
    this._weatherInteraction = interaction(this.shadowRoot.querySelector(".weather"), { primary: () => this.moreWeather(), feedback: true });
  }

  tick() {
    clearTimeout(this.timer);
    this.renderHeader();
    this.timer = setTimeout(() => this.tick(), 60000 - Date.now() % 60000 + 100);
  }

  renderHeader() {
    if (!this.c) return;
    const now = new Date();
    const zone = this.h?.config?.time_zone;
    const language = this.h?.locale?.language || navigator.language || "en-AU";
    const locale = language === "en" ? "en-AU" : language;
    const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: zone }).format(now);
    const state = this.h?.states?.[this.c.weather_entity];
    const attributes = state?.attributes || {};
    const number = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value)) : "—";
    const temperature = number(attributes.temperature) + (attributes.temperature_unit || "°C");
    const cloud = Number.isFinite(Number(attributes.cloud_coverage)) ? `Cloud ${Math.round(Number(attributes.cloud_coverage))}%` : "Cloud —";
    const weatherText = `${temperature} · ${cloud}`;
    const weatherAriaLabel = `Outside ${temperature}, ${cloud}. Open weather details.`;
    const signature = JSON.stringify([time, weatherText, weatherAriaLabel]);
    if (signature === this._headerSignature) return;
    this._headerSignature = signature;
    this.shadowRoot.querySelector(".time").textContent = time;
    const weather = this.shadowRoot.querySelector(".weather");
    weather.textContent = weatherText;
    weather.setAttribute("aria-label", weatherAriaLabel);
  }

  moreWeather() { if (this.c?.weather_entity) openMoreInfo(this, this.c.weather_entity); }

  async ensure() {
    if (this.built || this.building || !this.c || !this.h) return;
    this.building = true;
    await Promise.all(["component-favourites-minimal-v1", "component-smart-collection-v3", "component-room-directory-v4", "component-household-directory-v3"].map((name) => customElements.whenDefined(name)));
    if (!this.isConnected) { this.building = false; return; }
    const definitions = [
      ["favourites", () => {
        const element = document.createElement("component-favourites-minimal-v1");
        element.setConfig({ helpers: this.c.favourites_helpers, max: 4, title: "Favourites" });
        return element;
      }],
      ["active", () => {
        const element = document.createElement("component-smart-collection-v3");
        element.setConfig({ mode: "active", title: "Active now", icon: "mdi:motion-play-outline", editable: false, pref_key: null });
        return element;
      }],
      ["household", () => {
        const element = document.createElement("component-household-directory-v3");
        element.setConfig({
          title: "Quick actions",
          icon: "mdi:gesture-tap-button",
          quick_action_label: "dashboard_quick_action",
          pref_key: "home-control.household.v2",
          base_path: this.c.base_path,
          current_dashboard: this.c.current_dashboard,
        });
        return element;
      }],
      ["rooms", () => {
        const element = document.createElement("component-room-directory-v4");
        element.setConfig({ mode: "home", title: "Rooms", icon: "mdi:floor-plan", pref_key: "home-control.rooms.v2", base_path: this.c.base_path, navigation_path: `${this.c.base_path}/rooms` });
        return element;
      }],
    ];
    for (const [id, make] of definitions) {
      const element = make();
      element.classList.add("section");
      element.hass = this.h;
      this._children.set(id, element);
      this.sections.append(element);
    }
    this.built = true;
    this.building = false;
  }
}

class ComponentHomeOverviewV5 extends ComponentHomeOverviewV4 {}

if (!customElements.get("component-home-overview-v5")) customElements.define("component-home-overview-v5", ComponentHomeOverviewV5);
registerCard({ type: "component-home-overview-v4", element: ComponentHomeOverviewV4, name: "Home Overview V4", description: "Stable minimal Home overview without state-refresh teardown." });
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

globalThis.__HA_COMPONENT_LIBRARY__ = Object.freeze({ version: "10.0.5", components: 45 });
