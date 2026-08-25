# Clean Architecture Refactor Report

Branch: `dev/global-refactor`

Validation boundary: source-only until the user explicitly authorises `RUN A BUILD`. The pre-existing deletion of `dist/ha-component-library.js` is preserved, so bundle-dependent checks remain unavailable.

## Migration order

| Batch | Components | Status |
| --- | --- | --- |
| Leaf presentation | Section Separator, Empty State, Navigation Tile, Single KPI, Notice, Progress, Status Row, Action, Three-stat, List, Context Strip | Accepted (source-only) |
| Local state and visualisation | Text Effect, Quick Navigation, Welcome Header, History Graph | Pending |
| Registry and shells | Household Attention, Room Navigation, Device Discovery, Room Sheet | Pending |
| Energy | Energy Day Selector, Metric Pair, Solar Daylight, Energy Summary, Energy History, Energy Dashboard | Pending |
| Conventional controllers | Media Row, Control Row, Update Summary, Update Row | Pending |
| Device controllers | Camera V1, Camera V2, WLED, Apple TV | Pending |
| Home composition | Favourites V3, Favourites Minimal, Smart Collection, Household Directory, Room Directory, Home Overview | Pending |
| Security and physical control | Security Summary, Security Camera Wall, Garage Door Controller, Security Entry Points | Pending |
| Highest-risk runtimes | Split Controller, Security Dashboard | Pending |

## Cross-component reviews

### Leaf presentation

- Scope: Eleven accepted component commits from `14110c7` through `f0068d9`, their focused checkers, the shared leaf harness, interaction lifecycle compatibility entries, aggregate registration and report entries.
- Result: Independent Sol architecture review found no material source, checker, lifecycle, public-surface or styling regressions. Differences between snapshotted and current-value actions, and between direct and retained lifecycle ownership, are documented compatibility contracts rather than safe abstraction targets.
- Cleanup: Marked the batch accepted, corrected the Three-stat retention note, and removed one unused runtime destructure plus one unused checker destructure.
- Validation: All eleven focused checks, maintainability, interaction contracts/runtime, component-model, polish and advisory style checks pass. Strict style fails only on the nine unrelated established drifts. Generated bundle, full aggregate and live HA remain unverified.

## Component entries

### `component-quick-nav-v2`

- Component: `src/components/quick-navigation.js`
- Risk: Medium; entity-state caching, formatted display text, three current-target actions and retained reconnect handles share one render path.
- Original complexity: 5,114 bytes across 120 physical lines; the Hass setter formatted a changed entity state for cache comparison, then `r()` independently resolved and formatted it again.
- Primary architectural problem: Stateful or non-deterministic formatters could make the cached text disagree with the text rendered by the same Hass update, while every changed update performed redundant formatting.
- Refactor: A changed Hass update now resolves one `{ state, stateText }` snapshot and reuses it for cache comparison and rendering; direct configuration/reconnect renders derive one snapshot, and the unchanged fast path only refreshes the retained state icon.
- Shared changes: None. The retained `_interactions` runtime entry remains intentional so reconnect destroys preserved detached handles exactly once before rebinding.
- Removed complexity: Eliminated duplicate state formatting without changing inheritance, cache timing, native partial-Hass failure timing, exact DOM/CSS, disabled controls or current-value action closures.
- Behavioural contracts verified: Metadata/editor/stub, base-class inheritance, constructor/config cache-field timing, config-before-Hass and Hass-before-config, all cache branches, formatter fallback/call count, missing/available/no-entity output, exact DOM/CSS/escaping, state-icon property refresh, disabled suppression, three exact shared interactions, current action targets and retained reconnect lifecycle.
- Tests added/changed: Added `scripts/check-quick-navigation.mjs` and wired it into `scripts/check-all.mjs`; it uses a component-specific DashboardBaseCard, state-icon and runtime-patch harness.
- Validation: Focused checker, source/checker/runner syntax, maintainability, interaction contracts, advisory style and target diff whitespace pass. Quick Navigation introduces no style drift; eight unrelated established drifts remain. Generated bundle, full aggregate and live HA remain outside the source-only boundary.
- Reviewer findings: Independent review found no production regression initially; coordinator integration then caught and restored two legacy partial-Hass/cache behaviours, which the final delta review accepted before commit.
- Status: Source refactor accepted; generated distributable and live HA remain unverified. This in-flight component was completed after the user reprioritised remaining work toward proven runtime composition.

### `component-text-effect-v1`

- Component: `src/components/text-effect.js`
- Risk: Medium; the component owns a one-cycle animation settlement timer whose disconnect/reconnect behaviour determines whether transient motion ever stops.
- Original complexity: 6,232 bytes across 32 physical lines; configuration validation, effect selection, exact motion CSS, rendering and timer ownership were compressed together.
- Primary architectural problem: Disconnect cleared the only settlement timer, but no reconnect callback restarted it, so a card detached before settlement could retain endlessly animating output after reconnect.
- Refactor: Expanded the component readably and added a component-local reconnect path that restarts only configured, unfinished output with no pending timer; already-settled output is retained without replay.
- Shared changes: None. Timer and reconnect ownership remain local; no runtime compatibility patch was added.
- Removed complexity: Made the single timer lifecycle explicit while preserving required-text failure timing, native numeric coercion, effect fallback and exact motion output.
- Behavioural contracts verified: Metadata/editor/stub, prototype and own fields, error-before-mutation, defaults/overrides, effect whitelist, speed coercion/clamping and failure timing, exact two-style-tag DOM/CSS/escaping, optional icon/description, timer replacement, settlement callback ordering, detach/reconnect restart, settled reconnect idempotence and Hass no-render storage.
- Tests added/changed: Added `scripts/check-text-effect.mjs` and wired it into `scripts/check-all.mjs`; it uses deterministic DOM/class-list and timer fakes for the full local lifecycle.
- Validation: Focused checker, source/checker/runner syntax and target diff whitespace pass. Advisory style recognises the preserved Text Effect fingerprint and now reports only eight unrelated established drifts. Generated bundle, full aggregate and live HA remain outside the source-only boundary.
- Reviewer findings: One MEDIUM source-fingerprint regression and two LOW timer-edge coverage gaps were resolved; independent Sol final-delta acceptance is recorded before commit.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

### `component-context-strip-v3`

- Component: `src/components/context-strip.js`
- Risk: Medium; optional navigation/More Info actions share retained disconnect/reconnect lifecycle compatibility and exact two-style-tag presentation.
- Original complexity: 3,780 bytes across 26 physical lines; configuration, action selection, rendering and interaction ownership were densely interleaved.
- Primary architectural problems: Rendered action closures re-read mutable configuration at invocation, so an existing button could be redirected after render, and runtime reliability retained a dead `CtxEsc` compatibility wrapper after the component adopted the shared `escapeHtml` helper.
- Refactor: Expanded the component readably and snapshots the selected truthy navigation path or entity once per render, preserving navigation precedence while preventing getter side effects and post-render redirection.
- Shared changes: Removed only the obsolete guarded Context Strip `CtxEsc` runtime wrapper. The retained `_interaction` disconnect entry remains intentional so reconnect destroys the preserved detached handle once before binding a fresh handle.
- Removed complexity: Eliminated mutable action-target drift and a no-op legacy escape shim without changing metadata, prototype shape, configuration defaults, DOM or CSS.
- Behavioural contracts verified: Metadata/editor/stub, constructor/prototype descriptors, falsey config fallback, immediate render, Hass storage, exact static/actionable DOM and escaping, three ordered metrics, snapshot action precedence, exact interaction options, teardown and retained reconnect behaviour.
- Tests added/changed: Added `scripts/check-context-strip.mjs` and wired it into `scripts/check-all.mjs`; it evaluates the real lifecycle patch alongside exact component output.
- Validation: Focused checker; Action, Three-stat and List leaf regressions; source/patch/checker/runner syntax; maintainability; interaction contracts; interaction runtime; advisory style; and diff whitespace checks pass. The refactor restores Context Strip's recognised style fingerprint; strict style now fails only on the nine unrelated established drifts. Generated bundle, full aggregate and live HA remain outside the source-only boundary.
- Reviewer findings: Independent Sol review found no production regression; two LOW checker/report completeness findings and two unused checker fields were resolved.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

### `component-list-v2`

- Component: `src/components/list-ranking.js`
- Risk: Medium; up to six optional row actions share captured path/entity values, current custom callbacks and retained reconnect handles.
- Original complexity: approximately 3.4 kB compressed into eight physical lines; row shaping, action selection, markup and binding were interleaved.
- Primary architectural problem: Actionable rows resolved `_actions(row)` twice, allowing getter or override side effects to make button markup and bound callbacks disagree.
- Refactor: Expanded the component readably and resolves one row/action record per visited sliced index, reusing it for exact markup and interaction binding while preserving sparse indices and `slice(0, 6)`.
- Shared changes: None; the existing List retained `_interactions` runtime compatibility entry remains intentional.
- Removed complexity: Eliminated duplicate action resolution without changing the custom/path/entity/hold matrix or exact DOM/CSS.
- Behavioural contracts verified: Default/static rows, first-six sparse indexing, literal `interactive: false`, current custom callback/current Hass, captured path/entity, hold behaviour, exact interaction options, one-resolution binding and retained reconnect teardown.
- Tests added/changed: Added `scripts/check-list.mjs` using the shared leaf harness and wired it into `scripts/check-all.mjs`.
- Validation: Focused checker; Action and Three-stat shared-harness regressions; source/checker/runner syntax; maintainability; interaction contracts; interaction runtime; and diff whitespace checks pass. Generated bundle, full aggregate and live HA remain outside the source-only boundary.
- Reviewer findings: Owner and independent Sol reviews found no material behavioural findings; two non-material unused record/checker bindings were removed.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

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

### `component-three-stat-v2`

- Component: `src/components/three-stat-summary.js`
- Risk: Low; three optional metric actions use shared interactions and the retained-interaction runtime compatibility wrapper.
- Original complexity: 2,919 bytes (about 2.9 kB) compressed into eight physical lines; configuration, per-metric action selection, rendering and teardown were interleaved.
- Primary architectural problem: `r()` resolved each metric action twice, allowing getter side effects or overridden selection to make button markup and bound closures disagree.
- Refactor: Expanded the existing `c` configuration, action, render and lifecycle paths while preserving the exact prototype surface, defaults, rendered string/CSS and action precedence. Each render now resolves one `{ index, action }` record per metric and reuses it for matching markup and interaction binding.
- Shared changes: The `component-three-stat-v2` retained `_interactions` entry in `runtime-reliability.js` is intentionally unchanged after component and batch review; its disconnect wrapper retains handles, then reconnect clears each old handle once and binds fresh ones.
- Tests added/changed: Added `scripts/check-three-stat.mjs`, registered it in `scripts/check-all.mjs`, and minimally extended the leaf harness with metric `dataset` and `querySelectorAll` support.
- Validation: Focused checker; source/checker syntax; and target diff whitespace checks pass. No build, generated bundle, full aggregate check or live HA validation was run: the source-only boundary remains in force and the pre-existing deleted `dist/ha-component-library.js` keeps bundle-dependent checks unavailable.
- Reviewer findings: Owner and independent Sol reviews found no remaining material findings.
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

### `component-status-row-v2`

- Component: `src/components/status-row.js`
- Risk: Low; configured status display with optional navigation or More Info.
- Original complexity: 2,743 bytes (about 2.7 kB) compressed into seven physical lines; configuration, action selection, rendering and interaction teardown were interleaved.
- Primary architectural problems: Dense source obscured the owned interaction lifecycle, while a generic runtime retained-field patch overrode the component's local disconnect behaviour.
- Refactor: Expanded the existing direct `c` configuration-to-`r()` render path without changing the public prototype surface, default order, DOM/CSS/whitespace or action semantics.
- Shared changes: Removed only the stale Status Row retained-interaction entry from `runtime-reliability.js`.
- Removed complexity: Status Row now owns its interaction teardown and reconnect lifecycle directly.
- Behavioural contracts verified: Metadata/editor/stub, prototype and own-property descriptors, native spread replacement, direct escaped display fields without HA-derived status/tone/active state, literal `interactive: false`, exact static/button DOM, navigation precedence, current-value closures, interaction options, error teardown timing and reconnect.
- Tests added/changed: Added `scripts/check-status-row.mjs` and wired it into `scripts/check-all.mjs`; it evaluates the real runtime patch alongside the component contract.
- Validation: Focused checker; syntax for the component, runtime patch, focused checker and aggregate runner; maintainability; interaction contracts; interaction runtime; and diff whitespace checks pass. Strict style retains the same ten unrelated baseline drifts, while the focused exact-markup assertion confirms Status Row CSS is unchanged. No build, generated-bundle or live HA validation was run.
- Reviewer findings: One MEDIUM and two LOW checker-coverage findings resolved; independent Sol review found no remaining findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.

### `component-action-v2`

- Component: `src/components/action-card.js`
- Risk: Low; optional navigation and More Info interaction with a single owned handle.
- Original complexity: approximately 2.7 kB compressed into seven physical lines; configuration, action selection, rendering and teardown were interleaved.
- Primary architectural problems: Dense source obscured local interaction ownership, while the generic retained-field patch obscured the component's actual disconnect lifecycle.
- Refactor: Readably expanded the existing direct `c` configuration-to-`r()` path without changing the public surface, defaults, markup/CSS, escaping, action matrix or interaction option order.
- Shared changes: Removed only the Action retained-field entry from `runtime-reliability.js`; added a generic test-only shared leaf-card VM/mock harness; corrected the interaction checker false-positive matcher so literal `repeat: false` is not treated as enabled.
- Removed complexity: Action owns teardown and reconnect directly; no runtime lifecycle override is required.
- Behavioural contracts verified: Exact static/actionable template and escaping, `more_info_entity || entity || null` and `navigation_path || null` local snapshots, primary/hold matrix, exact shared interaction options, teardown and reconnect ownership.
- Tests added/changed: Added `scripts/check-action.mjs` and wired it into `scripts/check-all.mjs`; it uses `scripts/fixtures/leaf-card-harness.mjs` for common runtime scaffolding.
- Validation: Focused Action checker, syntax, maintainability, interaction contracts, interaction runtime and diff whitespace checks pass. No build, generated bundle or live HA validation was run; that remains outside the source-only boundary.
- Reviewer findings: One MEDIUM action-matrix coverage finding resolved; independent Sol review found no remaining material findings.
- Status: Source refactor accepted; generated distributable and live HA remain unverified.
