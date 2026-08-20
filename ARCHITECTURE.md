# Architecture

The repository separates public cards, shared runtime logic, internal support elements and compatibility patches. HACS receives one generated file, while maintainers work in small source modules.

## Layout

```text
src/
  components/   one public dashboard card per file
  shared/       reusable primitives, registries, CSS tokens and runtimes
  support/      internal custom elements used by public cards
  patches/      isolated compatibility patches retained from the live cards
  provenance/   style fingerprints captured before the refactor
  bundle-manifest.json
dist/
  ha-component-library.js
```

## Public component contract

Every public component:

1. Lives in its own descriptively named file under `src/components/`.
2. Uses a descriptive constructor such as `ComponentSingleKpiV2`.
3. Registers through the shared `registerCard` helper.
4. Keeps its existing Home Assistant card type and configuration contract.
5. Keeps its existing CSS and visual behaviour.

The 37 public card registrations are asserted by `scripts/check-inventory.mjs`.

## Shared ownership

- `shared/core.js` owns HTML escaping, custom-card registration, navigation/more-info events, shared presentational CSS and the common base card.
- `shared/registry-cache.js` owns reusable, read-only Home Assistant area/device/entity registry loading.
- `shared/dashboard-style-tokens.js` owns the existing global dashboard CSS custom properties.
- `shared/split-system-registry.js` owns split-system discovery and subscriptions used by the split controller and favourites.
- `shared/dashboard-runtime.js` owns the existing entity-aware dashboard registry runtime used by split-system, garage-door, WLED and camera collection integration.
- `shared/wled-runtime.js` owns WLED names, domain checks and registry access used by both the card and its integration patch.
- `shared/update-styles.js` owns the common Update-card presentation primitive.

Internal elements under `support/` are bundled before public cards. Compatibility patches are bundled last so they can safely wait for or patch registered elements.

## Bundle order

`src/bundle-manifest.json` is the authoritative dependency order. `scripts/assemble.mjs` wraps each source module in its own lexical block and emits `dist/ha-component-library.js`. This preserves the isolation of the original separately registered resources without requiring a production dependency.

Do not hand-edit the generated distributable. Change source modules, update the manifest if needed, and regenerate it.

## Style invariance

This migration intentionally does not restyle components. `src/provenance/style-fingerprints.json` contains fingerprints of every original style fragment. `scripts/check-style-preservation.mjs` verifies those fragments remain present after source reorganisation.

## Validation

`npm run check` performs the source, runtime and release-contract checks:

- JavaScript syntax for the distributable.
- Exactly one descriptively named registration for each of the 37 public card types.
- Preservation of all original style fingerprints.
- Isolated bundle loading with mocked browser/Home Assistant primitives, including dependency and patch order.
- Bundle version, public component count, manifest coverage and HACS filename validation.

The isolated loader does not connect to or modify Home Assistant.

## Adding a component

1. Add one file under `src/components/`.
2. Put reusable logic in `src/shared/`; do not copy registry, action or escaping helpers.
3. Register the card with `registerCard`.
4. Add the source file to `src/bundle-manifest.json` after its dependencies.
5. Add the card type and constructor to `scripts/check-inventory.mjs` and `scripts/check-load-order.mjs`.
6. Document its configuration in `docs/components.md`.
7. Run `npm run release:dry-run`, then `npm run release` to bump the version, regenerate the distributable and run the complete validation suite.
