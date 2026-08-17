# Component audit

Audit date: 17 August 2026

Scope: all 28 public custom cards shown on the Home Assistant Components dashboard. Existing CSS and visual behaviour were treated as locked. The review covered registration, isolated loading, configuration handling, HTML escaping, Home Assistant integration points, timers, observers, disconnect/reconnect behaviour, documentation and distributable presence.

## Findings resolved

- `component-context-strip-v3` depended on the old combined-resource identifier `CtxEsc`. It now imports the shared `escapeHtml` helper and renders when bundled in an isolated module scope.
- `component-device-discovery-v2` depended on the old combined-resource identifier `B`. It now imports `PRESENTATIONAL_CARD_STYLES`. Disconnect/reconnect also restarts discovery polling correctly.
- `component-history-graph-v2` now reattaches its `ResizeObserver` and redraws after reconnecting.
- `component-update-summary-v3` now clears its delayed status-message timer when removed.
- A runtime contract check now instantiates, configures, connects and disconnects every public card from the distributable. This catches runtime scope failures that syntax-only validation cannot detect.
- The catalogue now states which components are live Home Assistant integrations and which intentionally remain reusable visual previews.

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
| `component-favourites-v3` | Passed | Registry subscriptions, stable references and helper-backed editing retained. |
| `component-control-row-v2` | Passed | Local preview controls are now explicitly documented. |
| `component-split-controller-v4` | Passed | Climate entity and associated helper discovery remain configurable. |
| `component-media-row-v2` | Passed | Local preview controls are now explicitly documented. |
| `component-wled-controller-v1` | Passed | Light entity, registry discovery, presets and effects remain configurable. |
| `component-update-summary-v3` | Fixed | Delayed message timer is cleaned up on disconnect. |
| `component-update-row-v3` | Passed | Live update entity and display-only fallback remain supported. |
| `component-empty-state-v3` | Passed | Empty-state content remains reusable and escaped. |
| `component-device-discovery-v2` | Fixed | Shared style dependency and reconnect polling corrected. |
| `component-household-attention-v1` | Passed | Live registry/state path and explicit demo mode retained. |
| `component-welcome-header-v1` | Passed | Weather entity and greeting configuration remain reusable. |

## Validation

- Full repository static check suite: inventory, module syntax, distributable presence, maintainability, preserved style fingerprints, isolated load order and runtime contracts.
- Runtime contract coverage: all 28 public component classes.
- Live Home Assistant smoke render: `component-context-strip-v3` and `component-device-discovery-v2` rendered successfully after the compatibility resource loaded.
- No build, project start or migration generation was performed.
