# Architecture

The repository separates public cards, shared runtime logic and internal support elements. HACS receives one generated file, while maintainers work in small source modules.

## Layout

```text
src/
  components/   one public dashboard card per file
  shared/       reusable primitives, registries, CSS tokens and runtimes
  support/      internal custom elements used by public cards
  provenance/   style fingerprints captured before the refactor
  bundle-manifest.json
dist/
  ha-component-library.js
```

This is a HACS Dashboard repository. It does not own Home Assistant integration source; backend resources live in the separate `HA-UI-Backend` repository under `custom_components/ha_component_backend`.

## Public component contract

Every public component:

1. Lives in its own descriptively named file under `src/components/`.
2. Uses a descriptive constructor such as `ComponentSingleKpiV2`.
3. Registers through the shared `registerCard` helper.
4. Keeps its existing Home Assistant card type and configuration contract.
5. Keeps its existing CSS and visual behaviour.

The 45 public card registrations are asserted by `scripts/check-inventory.mjs`.

## Shared ownership

- `shared/core.js` owns HTML escaping, custom-card registration, navigation/more-info events, shared presentational CSS and the common base card.
- `shared/interaction.js` and `shared/lifecycle.js` own press/pending/error feedback, reconnect-safe listeners, focus restoration, overlay dismissal and scroll locking.
- `shared/async-broker.js` owns coalescing, stale-while-refresh, last-successful data and bounded retry backoff.
- `shared/localisation.js` owns Home Assistant locale, timezone, number, power, energy, date and time presentation.
- `shared/registry-cache.js` owns reusable, read-only Home Assistant area/device/entity registry loading.
- `shared/registry-health.js` distinguishes a genuine empty registry from a failed registry request.
- `shared/dashboard-style-tokens.js` owns the existing global dashboard CSS custom properties.
- `shared/apple-tv-runtime.js` owns Apple TV discovery and supported-capability modelling; the public card owns only interaction and rendering.
- `shared/security-runtime.js` owns capability-driven Security discovery shared by summary, camera wall and entry-point cards.
- `shared/split-system-registry.js` owns split-system discovery and subscriptions used by the split controller and favourites.
- `shared/dashboard-runtime.js` owns entity-aware registry discovery, including explicit entry-filter and control-resolver extension points. Shared integrations use those points instead of replacing public component prototypes or each other.
- `shared/wled-runtime.js` owns WLED names, domain checks, registry access and dashboard discovery integration.
- `shared/update-styles.js` owns the common Update-card presentation primitive.

Internal elements under `support/` are bundled before public cards. Component behaviour belongs in its component, while reusable discovery and model behaviour belongs in the relevant shared runtime. A future compatibility adaptation must be isolated, documented with an owner and removal condition, and must not replace component ownership.

## Bundle order

`src/bundle-manifest.json` is the authoritative dependency order. The pure bundle-composition helper is used both by `scripts/assemble.mjs` (the explicit writer) and source validation (in memory). `scripts/assemble.mjs` wraps each source module in its own lexical block and emits `dist/ha-component-library.js`. This preserves the isolation of the original separately registered resources without requiring a production dependency.

Do not hand-edit the generated distributable. Change source modules, update the manifest if needed, and regenerate it.

## Style preservation

This work does not redesign components. `src/provenance/style-fingerprints.json` records the accepted presentation baseline after intentional micro-polish such as 44 px targets and stable control rows. `npm run check:style` is the blocking provenance gate for unreviewed drift; normal source validation reports existing provenance drift as advisory and never regenerates the fingerprints.

## Validation boundaries

`npm run check:source` is the normal, refactor-stable engineering gate. It validates current source only: syntax and policy, manifest/inventory, automatically discovered generic component contracts and migrated black-box component specifications, shared runtime behaviour, advisory style provenance, and in-memory load order. It neither reads nor writes `dist/`. An ordinary behaviour-preserving component refactor should normally require only `src/` changes.

Component specifications are discovered from the authoritative public inventory. The runner rejects missing, orphaned, duplicate or unknown specifications and invalid contract profiles. Generic contracts cover the common public surface; migrated specialised specifications retain stable, component-specific async, lifecycle, controller and composition scenarios.

Bundle freshness is a separate release boundary. It composes the expected bundle in memory and compares it with the checked-in generated artefact byte-for-byte; it does not cause source validation to write that artefact. Only the explicit bundle/release workflow writes `dist/ha-component-library.js`.

Live Home Assistant/HACS proof is a third boundary. It verifies installation, browser/runtime integration and physical-device behaviour and cannot be inferred from source checks. Source validation uses a strict capability-based harness and never connects to or modifies Home Assistant.

## Adding a component

1. Add one file under `src/components/`.
2. Put reusable logic in `src/shared/`; do not copy registry, action or escaping helpers.
3. Register the card with `registerCard`.
4. Add the source file to `src/bundle-manifest.json` after its dependencies.
5. Add the deliberately independent public compatibility-oracle entry and an automatically discovered specialised specification only when generic contracts are insufficient.
6. Document its configuration in `docs/components.md`.
7. Run `npm run check:source`; use the explicit release workflow only when preparing a distributable.
