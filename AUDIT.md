# Component audit

Audit date: 24 August 2026

Scope: all 45 public custom cards, the Energy and rebuilt Security compositions, specialised physical-device controllers and the current Home composition. Established visual direction was retained. The review covered registration, every interaction state, configuration handling, escaping, Home Assistant registry and Recorder integration, locale/timezone handling, async coalescing, timers, observers, reconnect behaviour, keyboard/focus behaviour, documentation and distributable presence.

## Findings resolved

- `component-context-strip-v3` depended on the old combined-resource identifier `CtxEsc`. It now imports the shared `escapeHtml` helper and renders when bundled in an isolated module scope.
- `component-device-discovery-v2` depended on the old combined-resource identifier `B`. It now imports `PRESENTATIONAL_CARD_STYLES`. Disconnect/reconnect also restarts discovery polling correctly.
- `component-history-graph-v2` now reattaches its `ResizeObserver` and redraws after reconnecting.
- `component-update-summary-v3` now clears its delayed status-message timer when removed.
- A runtime contract check now instantiates, configures, connects and disconnects every public card from the distributable. This catches runtime scope failures that syntax-only validation cannot detect.
- The catalogue now states which components are live Home Assistant integrations and which intentionally remain reusable visual previews.
- Pressed, pending and failure acknowledgement now come from one shared interaction primitive without dimension-changing borders; reduced-motion and screen-reader status are inherited.
- Selected Energy day state is replayable and session-preserved, and all Energy cards consume one coalesced backend day payload rather than issuing parallel Recorder queries.
- Locale, timezone, number, power and energy formatting now follow Home Assistant settings instead of browser-default or fixed formatting.
- Security is rebuilt as capability-driven summary, snapshot-first camera wall, real entry points and a focus-safe expanded controller. Missing devices or controls no longer produce empty fictional sections.
- Registry failures are distinguished from genuinely empty results, and last-successful async content remains visible during refresh/failure.
- Apple TV discovery/capability modelling and overlay lifecycle are separated from rendering and have model-level regression fixtures.
- Every public card now exposes a stub and configuration editor contract.

## Per-component result

| Component | Result | Review note |
| --- | --- | --- |
| `component-context-strip-v3` | Fixed | Scoped escaping dependency corrected. |
| `metric-pair-card-v3` | Passed | Static and live-statistics paths load; day-channel integration retained. |
| `component-single-kpi-v2` | Passed | Configuration rendering and escaping retained. |
| `component-three-stat-v2` | Passed | Three configured metrics render independently. |
| `component-status-row-v2` | Passed | Status and supporting text remain input-driven. |
| `component-progress-v2` | Passed | Progress value is bounded and configuration remains reusable. |
| `component-energy-day-selector-v1` | Passed | Day selection and channel event contract retained. |
| `component-history-graph-v2` | Fixed | Resize observation now resumes after reconnect; graph remains a visual preview. |
| `component-action-v2` | Passed | Navigation and more-info actions remain configurable. |
| `component-list-v2` | Passed | Configured rows, limits and escaping retained. |
| `component-notice-v2` | Passed | Supported notice tones and escaped content retained. |
| `component-text-effect-v1` | Passed | Text-effect configuration remains isolated and reusable. |
| `component-quick-nav-v2` | Passed | Entity state and configured navigation paths remain guarded. |
| `component-nav-tile-v2` | Passed | Presentational tile behaviour is now explicitly documented. |
| `component-room-navigation-v1` | Passed | Registry-backed area navigation and optional demo presence retained. |
| `component-section-separator-v2` | Passed | Separator configuration remains isolated. |
| `component-room-sheet-v2` | Passed | Presentational room-sheet behaviour is now explicitly documented. |
| `component-favourites-v3` | Fixed | Registry subscriptions and stable references retained; production Home composition now uses backend preferences exclusively after migration. |
| `component-control-row-v2` | Passed | Local preview controls are now explicitly documented. |
| `component-split-controller-v4` | Passed | Climate entity and associated helper discovery remain configurable. |
| `component-media-row-v2` | Passed | Local preview controls are now explicitly documented. |
| `component-wled-controller-v1` | Passed | Light entity, registry discovery, presets and effects remain configurable. |
| `component-garage-door-controller-v1` | Passed | A single deliberate press dispatches the momentary operator command and waits for the reed sensor to confirm physical state. Duplicate submission is blocked. |
| `component-camera-controller-v1` | Passed | Device-aware ONVIF controller selects a usable stream, exposes detection and switch state, and confirms maintenance buttons. |
| `component-camera-controller-v2` | Added | Capability-driven Security controls use explicit states, confirmation for disruptive actions, 44 px targets and focus-safe dismissal. |
| `component-security-summary-v1` | Added | Exception-first all-clear/attention state with explicit registry failure handling. |
| `component-security-camera-wall-v3` | Added | Snapshot-first tiles retain last-good images and lazy-load live streams only while requested and visible. |
| `component-security-entry-points-v1` | Added | Real entry points only; existing garage controller is reused for state-confirmed operation. |
| `component-security-dashboard-v1` | Added | Thin composition replaces repeated Security dashboard JavaScript and fictional empty sections. |
| `component-home-overview-v4` | Passed | Preserves the live Home header and assembles favourites, active controls, rooms and household sections. |
| `component-smart-collection-v3` | Passed | Registry-driven discovery, per-section preferences and specialised device-card selection are retained. |
| `component-room-directory-v4` | Passed | Area tiles, mobile room sheets, room preferences and presence-glow compatibility behaviour are retained. |
| `component-household-directory-v3` | Passed | Dashboard, control, media and todo destinations remain registry-discovered and user-orderable. |
| `component-favourites-minimal-v1` | Passed | Uses the existing persistent favourites behaviour with the Home dashboard typography treatment. |
| `component-update-summary-v3` | Fixed | Delayed message timer is cleaned up on disconnect. |
| `component-update-row-v3` | Passed | Live update entity and display-only fallback remain supported. |
| `component-empty-state-v3` | Passed | Empty-state content remains reusable and escaped. |
| `component-device-discovery-v2` | Fixed | Shared style dependency and reconnect polling corrected. |
| `component-household-attention-v1` | Passed | Live registry/state path and explicit demo mode retained. |
| `component-welcome-header-v1` | Passed | Weather entity and greeting configuration remain reusable. |
| `solar-daylight-card-v7` | Passed | Sun state, hourly weather forecast, cloud checkpoints and sun more-info action retain the live Solar dashboard behaviour. |
| `energy-history-card-v3` | Passed | Recorder statistics, ten-minute bucketing, calendar-day channel updates, signed grid strip, pointer tooltip and legend more-info actions retain the live Solar dashboard behaviour. |
| `component-energy-summary-v1` | Added | Canonical live power and selected-day totals share one backend response, retain old data while loading and expose partial/stale/error states. |
| `component-energy-dashboard-v1` | Added | Thin composition preserves the established Energy styling and shared selected-day continuity. |

## Validation

- The generated distributable covers all 45 components and all ordered support/runtime modules.
- Inventory, maintainability, interaction, async broker, model fixture, backend preference, strict style-preservation, isolated load-order/editor, reconnect runtime and release-contract checks are blocking.
- The runtime test executes real Energy selector and Metric Pair actions after disconnect/reconnect cycles, rather than checking construction alone.
- Dashboard cutover remains dependency-ordered: backend release, profile configuration, frontend release, dashboard backup/cutover, then removal of replaced resources/helpers.
