# Interaction model

`src/shared/interaction.js` is the canonical interaction layer for user-facing controls in this repository. Components declare what an interaction means; they do not implement their own tap/hold/repeat gesture recognisers.

The visual design of a component remains owned by the component. The interaction layer standardises activation semantics, touch/scroll behaviour, keyboard activation, transient press/pending/error state, optimistic rollback, repeat-on-hold and request coalescing.

## API

```js
const { interaction } = globalThis.__HA_COMPONENT_LIBRARY_SHARED__;

const handle = interaction(element, {
  primary: () => action(),
  hold: () => moreInfo(),
  optimistic: false,
  repeat: false,
  singleFlight: false,
  feedback: true,
});
```

`interaction()` returns a handle:

```js
handle.destroy();
handle.invoke();
```

Destroy the handle when the bound element is removed permanently or when the component disconnects. When a component re-renders and replaces bound DOM, destroy the old handles before binding the new DOM.

## Options

### `primary`

Function executed for the normal activation. Pointer tap/click and keyboard Enter/Space use the same action path.

The primary action must be the obvious, essential action. Essential functionality must never exist only behind hold.

### `hold`

Optional long-press shortcut. The default hold delay is 500 ms.

Use hold primarily for native Home Assistant entity details when tap already performs a direct action or navigation:

```js
interaction(button, {
  primary: () => toggleLight(),
  hold: () => openMoreInfo(this, entityId),
});
```

Do not combine `hold` and `repeat` on one control. `interaction()` rejects that configuration at runtime and `scripts/check-interactions.mjs` rejects literal invalid configurations during validation.

### `repeat`

`false`, `true`, or a configuration object. Repeat begins after the configured delay and calls the primary action while the pointer remains held.

```js
interaction(increaseButton, {
  primary: () => shiftTarget(1),
  repeat: {
    delay: 350,
    interval: 120,
    accelerate: true,
    minimumInterval: 60,
    coalesce: true,
  },
});
```

`coalesce` documents the intended request model. Actual backend request coalescing is implemented with `createRequestCoalescer()` or a component's existing state-aware queue. Split target-temperature controls use their existing target queue; Apple TV and WLED continuous controls use the shared coalescer.

Do not use repeat for garage doors, update installation, maintenance commands, scripts, scenes or other momentary/slow actions.

### `optimistic`

Supported forms:

```js
optimistic: false
optimistic: "toggle"
optimistic: "selection"
optimistic: ({ ... }) => { ... }
optimistic: {
  capture: () => previousState,
  apply: () => showIntendedState(),
  rollback: (previousState, error) => restore(previousState),
}
```

Use optimistic state only when the action is reversible and the local intent can be represented truthfully while Home Assistant catches up. Current examples include lights, switches, media play/pause, brightness and temperature.

Do not optimistically claim successful physical/system state for garage doors, update installation, scripts, maintenance operations or similar actions. Those controls remain pending until their relevant state or progress confirms the result.

An optimistic action that returns a rejected promise automatically invokes its configured rollback and exposes transient error feedback.

### `feedback`

Defaults to `true`.

The helper exposes semantic state without defining a second visual system:

- `data-interaction-pressed`
- `data-interaction-pending`
- `data-interaction-error`
- `aria-busy`

Components may use existing styles for those states where useful. The shared runtime itself does not change card colours, geometry, spacing or typography.

### `singleFlight`

Defaults to `false`. Set it to `true` for submit-like or slow actions that must
not run twice while the returned promise is pending:

```js
interaction(runButton, {
  primary: () => runMaintenanceAction(),
  singleFlight: true,
});
```

Do not enable it on repeat or continuously adjustable controls. The option is
an interaction guard, not a replacement for idempotency in the Home Assistant
service or backend handler.

### `onPressChange`

Optional press lifecycle callback for continuous controls that must preserve a live DOM control while held:

```js
interaction(volumeUp, {
  primary: () => queueVolume("up"),
  repeat: { delay: 350, interval: 120, coalesce: true },
  onPressChange: (pressed) => {
    this.volumeGestureActive = pressed;
  },
});
```

Use this only for interaction state; do not recreate pointer/hold detection in the component.

### `signal`

An optional `AbortSignal`. Aborting it destroys the binding.

## Touch and scrolling

A press begins on pointer down. If pointer movement exceeds the shared movement tolerance, the interaction is cancelled and the gesture is left to scrolling. This is particularly important for controls embedded in mobile dashboard grids and sheets.

Do not add component-specific long-press timers or pointer-distance calculations for ordinary controls. Chart scrubbing and native range inputs are exceptions because their continuous pointer position is the control value itself.

## Keyboard activation

Enter and Space activate `primary`. A synthetic click from assistive technology,
voice control or `element.click()` uses the same action path and is de-duplicated
from native pointer/keyboard clicks. Icon-only controls must have an accessible
name. Native range/select/input controls retain their native keyboard behaviour
and are not wrapped in `interaction()` for value movement.

## Reduced motion

Interaction behaviour must remain usable with `prefers-reduced-motion: reduce`. Do not make motion essential to understanding pending/error state. Existing animations should have a non-animated reduced-motion state.

`prefersReducedMotion()` and `interactionStyles` are available from the shared runtime when a component needs explicit behaviour beyond CSS media queries.

## Shared state confirmation

Use `waitForEntityState()` when a reversible action should remain pending until Home Assistant reports the expected state:

```js
await hass.callService("homeassistant", "toggle", { entity_id: entityId });
await waitForEntityState(
  () => this._hass,
  entityId,
  (state) => state === "on",
  { timeout: 9000 },
);
```

This consolidates the common polling/timeout/cleanup behaviour. Specialised controllers may keep a stronger existing state machine when it carries additional semantics; Split's queued target model and Update Row's start watchdog are examples.

## Request coalescing

Use `createRequestCoalescer()` for continuous controls whose UI may change faster than Home Assistant service requests complete:

```js
this.volumeRequests = createRequestCoalescer(async (volume) => {
  await hass.callService("media_player", "volume_set", {
    entity_id: entityId,
    volume_level: volume,
  });
});

slider.oninput = () => {
  const value = Number(slider.value);
  renderLocalValue(value);
  this.volumeRequests.request(value);
};
```

The UI updates immediately. While a request is running, newer values replace the queued value instead of producing an unbounded request backlog.

Destroy the coalescer in `disconnectedCallback()`.

## Usage patterns

### Navigation

```js
interaction(button, {
  primary: () => navigateTo(this.config.navigation_path),
  optimistic: false,
  repeat: false,
  feedback: true,
});
```

If no navigation target exists, render non-interactive semantics rather than a disabled-looking live button unless disabled state itself is meaningful.

### Drill-down

```js
interaction(button, {
  primary: () => openMoreInfo(this, entityId),
  feedback: true,
});
```

### Toggle

```js
interaction(button, {
  primary: async () => {
    const wasOn = state.state === "on";
    await hass.callService("homeassistant", "toggle", { entity_id: entityId });
    await waitForEntityState(
      () => this._hass,
      entityId,
      (value) => value === (wasOn ? "off" : "on"),
    );
  },
  hold: () => openMoreInfo(this, entityId),
  optimistic: {
    capture: () => currentVisualState(),
    apply: () => renderIntendedState(),
    rollback: (previous) => renderPreviousState(previous),
  },
  feedback: true,
});
```

### Momentary or slow action

```js
interaction(button, {
  primary: () => installUpdate(),
  optimistic: false,
  repeat: false,
  feedback: true,
});
```

The action implementation remains responsible for meaningful state confirmation. A resolved service call is not necessarily proof that an update, garage operation or maintenance command completed.

### Continuous control

For step controls:

```js
interaction(increase, {
  primary: () => changeLocalTarget(1),
  repeat: { delay: 350, interval: 120, coalesce: true },
  feedback: true,
});
```

For sliders, keep the native `<input type="range">` interaction and send values through the shared coalescer. Do not wrap native range movement in tap/hold semantics.

## Repository rules

- Tap performs the obvious primary action.
- Hold is normally a shortcut to entity details.
- Essential functionality is never hold-only.
- Hold and repeat never compete on one control.
- Optimism is for reversible intent, not unconfirmed physical/system outcomes.
- Continuous controls update locally first and coalesce backend work.
- Missing/unavailable entities disable direct actions and remain inspectable only where inspection is meaningful.
- A visual element that looks interactive must have a meaningful action; otherwise render non-interactive semantics.
- New direct user interactions belong in canonical component/shared source; do not introduce a compatibility layer for normal behaviour.
