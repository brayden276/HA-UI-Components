# Clean Architecture Refactor Report

Branch: `dev/global-refactor`

Validation boundary: source-only until the user explicitly authorises `RUN A BUILD`. The pre-existing deletion of `dist/ha-component-library.js` is preserved, so bundle-dependent checks remain unavailable.

## Migration order

| Batch | Components | Status |
| --- | --- | --- |
| Leaf presentation | Section Separator, Empty State, Navigation Tile, Single KPI, Notice, Progress, Status Row, Action, Three-stat, List, Context Strip | In progress |
| Local state and visualisation | Text Effect, Quick Navigation, Welcome Header, History Graph | Pending |
| Registry and shells | Household Attention, Room Navigation, Device Discovery, Room Sheet | Pending |
| Energy | Energy Day Selector, Metric Pair, Solar Daylight, Energy Summary, Energy History, Energy Dashboard | Pending |
| Conventional controllers | Media Row, Control Row, Update Summary, Update Row | Pending |
| Device controllers | Camera V1, Camera V2, WLED, Apple TV | Pending |
| Home composition | Favourites V3, Favourites Minimal, Smart Collection, Household Directory, Room Directory, Home Overview | Pending |
| Security and physical control | Security Summary, Security Camera Wall, Garage Door Controller, Security Entry Points | Pending |
| Highest-risk runtimes | Split Controller, Security Dashboard | Pending |

## Component entries

### `component-single-kpi-v2`

- Component: `src/components/single-kpi.js`
- Risk: Low; optional navigation and More Info interaction with reconnect lifecycle compatibility.
- Original complexity: 2.4 kB compressed into seven physical lines; rendering, action selection and lifecycle teardown are interleaved.
- Primary architectural problems: Opaque state/method names mixed configuration, action selection, rendering and teardown; a late patch obscured disconnect ownership.
- Refactor: Explicit frozen defaults, configuration model, primary-action derivation, deterministic render and one owned interaction handle; prior reachable instance names remain thin compatibility views.
- Shared changes: Removed only the Single KPI retained-interaction entry from `runtime-reliability.js`.
- Removed complexity: The component no longer depends on a patch to alter its disconnect lifecycle.
- Behavioural contracts verified: Metadata, defaults and override semantics, escaping, exact DOM/CSS, navigation precedence, More Info, literal `interactive: false`, static semantics, shared interaction behaviour, teardown and reconnect.
- Tests added/changed: Added `scripts/check-single-kpi.mjs` and wired it into `scripts/check-all.mjs`; it evaluates the real lifecycle patch and covers the prior instance surface.
- Validation: Focused check, syntax, maintainability, interaction contracts, interaction runtime and diff checks pass. Strict style retains the same ten unrelated baseline drifts. Bundle checks remain blocked by the build gate.
- Reviewer findings: Initial HIGH compatibility and MEDIUM test-integration findings resolved; independent Sol re-review found no remaining findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.
