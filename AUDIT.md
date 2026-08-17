# Component audit

Audit date: 17 August 2026

Scope: the 28 public custom cards shown on the Home Assistant Components dashboard, specialised physical-device controllers, and the current Home dashboard composition cards. Existing CSS and visual behaviour were treated as locked. The review covered registration, isolated loading, configuration handling, HTML escaping, Home Assistant integration points, timers, observers, disconnect/reconnect behaviour, documentation and distributable presence.

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
| `component-garage-door-controller-v1` | Passed | Reed-state controller requires a second confirmation press, dispatches the configured momentary button and waits for the requested state change. |
| `component-camera-controller-v1` | Passed | Device-aware ONVIF controller selects a usable stream, exposes detection and switch state, and confirms maintenance buttons. |
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

## Validation

- The prior distributable continues to cover the original 28 components. The seven additional public card sources, Home composition support, specialised controller patches and Split profile patches were syntax checked, and their exact live style fragments were added to the preservation baseline.
- The inventory, load-order and runtime-contract checks now cover all 35 public component classes, ready for the next authorised bundle generation.
- Live Home Assistant smoke render: `component-context-strip-v3` and `component-device-discovery-v2` rendered successfully after the compatibility resource loaded.
- No bundle generation, build, project start or migration generation was performed.
