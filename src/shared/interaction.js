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
    return {
      capture: () => undefined,
      apply: optimistic,
      rollback: null,
    };
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

const interaction = (element, options = {}) => {
  if (!element?.addEventListener) {
    throw new TypeError("interaction requires an EventTarget element");
  }

  const primary = typeof options.primary === "function" ? options.primary : null;
  const hold = typeof options.hold === "function" ? options.hold : null;
  const repeat = normaliseRepeat(options.repeat);
  if (hold && repeat) {
    throw new TypeError("interaction hold and repeat are mutually exclusive");
  }
  if (!primary && (hold || repeat)) {
    throw new TypeError("interaction hold/repeat requires a primary action");
  }

  const feedback = options.feedback !== false;
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
  let pending = 0;
  let errorTimer = null;
  let destroyed = false;
  let pressedState = false;

  const disabled = () =>
    destroyed ||
    element.disabled === true ||
    element.getAttribute?.("aria-disabled") === "true";

  const setPressed = (pressed) => {
    if (pressedState === pressed) return;
    pressedState = pressed;
    if (feedback) element.toggleAttribute?.("data-interaction-pressed", pressed);
    onPressChange?.(pressed, element);
  };

  const setPending = (value) => {
    pending = Math.max(0, pending + value);
    if (!feedback) return;
    element.toggleAttribute?.("data-interaction-pending", pending > 0);
    element.setAttribute?.("aria-busy", String(pending > 0));
  };

  const setError = () => {
    if (!feedback) return;
    clearTimeout(errorTimer);
    element.setAttribute?.("data-interaction-error", "true");
    errorTimer = setTimeout(() => {
      errorTimer = null;
      element.removeAttribute?.("data-interaction-error");
    }, Math.max(250, Number(options.errorDuration) || INTERACTION_DEFAULTS.errorDuration));
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
      if (kind === "primary" && optimistic?.rollback) optimistic.rollback(previous, error, element, event);
      setError();
      element.dispatchEvent?.(new CustomEvent("ha-interaction-error", { bubbles: true, composed: true, detail: { error } }));
      return Promise.reject(error);
    }

    if (!result || typeof result.then !== "function") return Promise.resolve(result);
    setPending(1);
    return Promise.resolve(result)
      .catch((error) => {
        if (kind === "primary" && optimistic?.rollback) optimistic.rollback(previous, error, element, event);
        setError();
        element.dispatchEvent?.(new CustomEvent("ha-interaction-error", { bubbles: true, composed: true, detail: { error } }));
        throw error;
      })
      .finally(() => setPending(-1));
  };

  const clearGestureTimers = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
    clearTimeout(repeatTimer);
    repeatTimer = null;
    clearInterval(repeatInterval);
    repeatInterval = null;
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
      suppressClick = true;
      const tick = () => {
        repeatCount += 1;
        void invoke("primary", event).catch(() => {});
        if (!repeat.accelerate) return;
        const next = Math.max(
          Number(repeat.minimumInterval) || INTERACTION_DEFAULTS.repeatMinimumInterval,
          Math.round(baseInterval * Math.pow(0.93, repeatCount)),
        );
        clearInterval(repeatInterval);
        repeatInterval = setInterval(tick, next);
      };
      void invoke("primary", event).catch(() => {});
      repeatInterval = setInterval(tick, baseInterval);
    }, delay);
  };

  const onPointerDown = (event) => {
    if (!primary || disabled() || event.button > 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    suppressClick = false;
    setPressed(true);
    if (hold) {
      holdTimer = setTimeout(() => {
        holdTimer = null;
        if (!pointer) return;
        suppressClick = true;
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
    suppressClick = true;
    cancelPointer();
  };

  const onPointerUp = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const wasSuppressed = suppressClick;
    const wasRepeating = repeat && (repeatTimer === null || repeatInterval !== null);
    clearGestureTimers();
    pointer = null;
    setPressed(false);
    suppressClick = true;
    if (!wasSuppressed && !wasRepeating) void invoke("primary", event).catch(() => {});
  };

  const onPointerCancel = () => {
    suppressClick = true;
    cancelPointer();
  };

  const onClick = (event) => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation?.();
    suppressClick = false;
  };

  const onKeyDown = (event) => {
    if (!primary || disabled() || event.repeat) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setPressed(true);
  };

  const onKeyUp = (event) => {
    if (!primary || disabled()) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setPressed(false);
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
    setPressed(false);
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

  return Object.freeze({ destroy, invoke: (event) => invoke("primary", event) });
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
        options.onSuccess?.(value, current);
      } catch (error) {
        options.onError?.(error, value, current);
        if (options.stopOnError) queued = false;
      }
    }
    running = false;
    options.onIdle?.();
  };

  return Object.freeze({
    request(value) {
      if (destroyed) return;
      latest = value;
      queued = true;
      void drain();
    },
    get pending() {
      return running || queued;
    },
    destroy() {
      destroyed = true;
      queued = false;
    },
  });
};

const interactionStyles = `
@media (prefers-reduced-motion: reduce) {
  [data-interaction-pressed="true"] { transition-duration: 0s !important; }
}
`;

Object.assign(interactionShared, {
  INTERACTION_DEFAULTS,
  createRequestCoalescer,
  interaction,
  interactionStyles,
  prefersReducedMotion: reducedMotion,
});
