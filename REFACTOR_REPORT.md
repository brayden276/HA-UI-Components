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

### `component-nav-tile-v2`

- Component: `src/components/navigation-tile.js`
- Risk: Low; optional navigation uses the shared interaction lifecycle.
- Original complexity: 1.4 kB compressed into seven physical lines; configuration, rendering and interaction teardown were interleaved.
- Primary architectural problems: The component source was needlessly dense and a generic runtime patch obscured its local disconnect ownership.
- Refactor: Expanded the existing direct configuration-to-render path while preserving the exact public surface, markup and navigation semantics.
- Shared changes: Removed only the Navigation Tile retained-interaction entry from `runtime-reliability.js`.
- Removed complexity: The component now owns its own interaction teardown without a runtime lifecycle override.
- Behavioural contracts verified: Metadata/editor/stub, defaults and native override semantics, legacy instance surface, exact DOM/CSS and escaping, static/button semantics, truthy captured navigation paths, shared interaction delegation, teardown and reconnect.
- Tests added/changed: Added `scripts/check-navigation-tile.mjs` and wired it into `scripts/check-all.mjs`; it evaluates the real lifecycle patch and covers the component contract.
- Validation: Focused checker; syntax for the component, runtime patch, focused checker and aggregate runner; maintainability; interaction contracts; interaction runtime; and diff whitespace checks pass. Advisory style reports the established ten unrelated baseline drifts; strict style fails only on those same unrelated fingerprints, while the focused exact-markup assertion confirms Navigation Tile CSS is unchanged. Bundle checks remain blocked by the build gate.
- Reviewer findings: Independent Sol review found no findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

### `component-notice-v2`

- Component: `src/components/notice.js`
- Risk: Low; optional navigation or More Info uses the shared interaction lifecycle.
- Original complexity: approximately 2.4 kB compressed into seven physical lines; configuration, action selection, rendering and teardown were interleaved.
- Primary architectural problems: Dense source obscured the owned interaction lifecycle, while a generic runtime retained-field patch overrode the component's local disconnect behaviour.
- Refactor: Expanded the existing direct `c` configuration-to-`r()` render path without changing the public prototype surface, defaults, DOM/CSS or action semantics.
- Shared changes: Removed only the stale Notice retained-interaction entry from `runtime-reliability.js`.
- Removed complexity: Notice now owns its interaction teardown and reconnect lifecycle directly.
- Behavioural contracts verified: Metadata/editor/stub, defaults and native spread semantics, own state descriptors, exact static/actionable DOM and escaping, supported tones, navigation precedence, current-value action closures, interaction options, teardown and reconnect.
- Tests added/changed: Added `scripts/check-notice.mjs` and wired it into `scripts/check-all.mjs`; it evaluates the real runtime patch alongside the component contract.
- Validation: Focused Notice checker, syntax for the component/runtime patch/checker/aggregate runner, maintainability, interaction contracts, interaction runtime and target diff whitespace checks pass. Advisory style reports the established ten unrelated baseline drifts; strict style fails only on those same unrelated fingerprints, while the focused exact-markup assertions confirm Notice CSS is unchanged. Bundle checks remain blocked by the build gate.
- Reviewer findings: Two LOW focused-coverage/report findings resolved; independent Sol re-review found no remaining findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

### `component-progress-v2`

- Component: `src/components/progress-target.js`
- Risk: Low; optional navigation or More Info interaction with a bounded numeric fill calculation.
- Original complexity: approximately 2.6 kB compressed into seven physical lines; configuration, calculation, action selection, rendering and teardown were interleaved.
- Primary architectural problems: Dense source obscured the owned interaction lifecycle, while a generic runtime retained-field patch overrode the component's local disconnect behaviour.
- Refactor: Expanded the existing direct `c` configuration-to-`r()` render path while retaining the exact public surface, defaults, calculation, markup and action semantics.
- Shared changes: Removed only the stale Progress retained-interaction entry from `runtime-reliability.js`.
- Removed complexity: Progress now owns its interaction teardown and reconnect lifecycle directly.
- Behavioural contracts verified: Metadata/editor/stub, prototype and own property descriptors, defaults and native spread replacement, exact DOM/CSS/whitespace/escaping/ARIA, display-versus-progress separation, finite and coercive numeric bounds, Symbol failure timing, navigation precedence, current-value action closures, interaction options, teardown and reconnect.
- Tests added/changed: Added `scripts/check-progress.mjs` and wired it into `scripts/check-all.mjs`; it evaluates the real lifecycle patch alongside the component contract.
- Validation: Focused checker; syntax for the component, runtime patch, focused checker and aggregate runner; maintainability; interaction contracts; interaction runtime; advisory style baseline; and diff whitespace checks pass. Advisory style reports the established ten unrelated baseline drifts, while the focused exact-markup assertions confirm Progress CSS is unchanged. Bundle checks and live HA remain outside the source-only boundary.
- Reviewer findings: One LOW unused checker accumulator removed during owner review; independent Sol review found no remaining findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

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

### `component-section-separator-v2`

- Component: `src/components/section-separator.js`
- Risk: Low; static presentational card with escaped configuration.
- Original complexity: 1.1 kB compressed into seven physical lines.
- Primary architectural problems: Configuration, size contract and rendering were compressed together and lacked focused regression coverage.
- Refactor: Expanded the existing direct configuration-to-render path into readable methods without adding state, lifecycle or abstraction.
- Shared changes: None.
- Removed complexity: Dense/minified control flow only; the original own `c` property and direct `r()` renderer remain canonical.
- Behavioural contracts verified: Defaults and override edge cases, immediate render, own-property semantics, `r()` dispatch, inherited `hass`, size, exact DOM/CSS, escaping, metadata and lifecycle-free reconnect.
- Tests added/changed: Added `scripts/check-section-separator.mjs` and wired it into `scripts/check-all.mjs`.
- Validation: Focused check, syntax, maintainability and diff checks pass. Style retains unrelated pre-existing drift. Bundle checks remain blocked by the build gate.
- Reviewer findings: MEDIUM own-property drift and LOW render-indirection findings resolved; independent Sol re-review found no remaining findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

### `component-empty-state-v3`

- Component: `src/components/empty-state.js`
- Risk: Low; static presentational card with shared Update styling.
- Original complexity: 1.5 kB across 30 readable lines.
- Primary architectural problems: None found; the direct source architecture already meets the required presentational-card shape.
- Refactor: No production refactor or source change.
- Shared changes: None.
- Removed complexity: None; the existing direct implementation remains canonical.
- Behavioural contracts verified: Open shadow root, configuration defaults and native spread semantics, synchronous and overridable rendering, own `c` shape, no-op `hass`, exact DOM/CSS and escaping, registration metadata, shared editor/stub contract, and lifecycle-free behaviour.
- Tests added/changed: Added `scripts/check-empty-state.mjs` and wired it into `scripts/check-all.mjs`.
- Validation: Focused source-level check, syntax checks and diff whitespace check pass. No build or generated-bundle validation was run; `dist` remains outside this source-only validation boundary.
- Reviewer findings: Two MEDIUM coverage gaps and two LOW completeness/report findings resolved; independent Sol re-review found no remaining findings.
- Status: Source coverage complete; generated distributable and live HA remain unverified.
