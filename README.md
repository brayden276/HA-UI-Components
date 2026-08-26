# HA Component Library

<img src="brand/icon.png" alt="HA Component Library icon" width="96">

A HACS Dashboard repository containing every custom card used by the Home Assistant **Components** dashboard.

The library turns the dashboard's inline JavaScript resources into one reusable module: `dist/ha-component-library.js`. Card configuration stays in normal dashboard YAML/UI configuration; the JavaScript implementation is installed and updated through HACS.

## Scope

- All 45 public `custom:` card types are included, including the backend-driven Energy composition and the rebuilt Security composition.
- Every public card has its own descriptively named source module.
- Shared registration, escaping, navigation, lifecycle ownership, request coalescing, localisation, registry health, Apple TV, Security, Update, split-system and WLED logic is centralised under `src/shared/`.
- The established component CSS and visual direction are preserved. Intentional micro-polish is limited to shared tokens, stable state feedback, focus treatment and undersized interaction targets.
- Required supporting runtime modules are bundled from their owning source modules.
- Native Home Assistant `heading` cards are not duplicated because they are built into Home Assistant and require no custom resource.
- Creating this repository did not change Home Assistant, its dashboards, entities or registered resources.

## Install through HACS

HACS custom repositories must be public GitHub repositories. To make this folder installable:

1. Publish this folder as a public GitHub repository. `ha-component-library` is the recommended repository name.
2. In HACS, open **Custom repositories**.
3. Add the GitHub repository URL and select **Dashboard** as the category.
4. Install **HA Component Library** and reload the browser when HACS prompts you.

HACS reads `hacs.json`, finds `dist/ha-component-library.js`, downloads it under `/hacsfiles/`, and normally registers the dashboard resource automatically. The repository layout follows the current [HACS Dashboard plugin requirements](https://hacs.xyz/docs/publish/plugin/).

## Split System backend

Split System, Energy and Security Components also require the companion [**HA Component Backend**](https://github.com/brayden276/HA-UI-Backend) integration. Install it once from HACS as an **Integration**, restart Home Assistant when prompted, then add **HA Component Backend** in **Settings → Devices & services**. The cards detect the backend automatically; no dashboard-specific helpers or automations are required.

## Use a component

After installation, add cards using their existing `custom:` type. No inline JavaScript is required:

```yaml
type: custom:component-single-kpi-v2
value: 68%
label: Solar self-sufficiency
support_value: 12.4 kWh
support_label: generated today
```

See [docs/components.md](docs/components.md) for a configured example of every card, [docs/backend.md](docs/backend.md) for the companion backend contract, and [AUDIT.md](AUDIT.md) for the component-by-component review and validation record.

## Included cards

| Group | Card types |
| --- | --- |
| Context and metrics | `component-context-strip-v3`, `metric-pair-card-v3`, `component-single-kpi-v2`, `component-three-stat-v2`, `component-status-row-v2`, `component-progress-v2` |
| Energy | `component-energy-dashboard-v1`, `component-energy-summary-v1`, `component-energy-day-selector-v1`, `solar-daylight-card-v7`, `energy-history-card-v3`, `component-history-graph-v2` |
| Actions and lists | `component-action-v2`, `component-list-v2`, `component-notice-v2`, `component-text-effect-v1` |
| Home composition | `component-home-overview-v4`, `component-favourites-minimal-v1`, `component-smart-collection-v3`, `component-room-directory-v4`, `component-household-directory-v3` |
| Home navigation | `component-quick-nav-v2`, `component-nav-tile-v2`, `component-room-navigation-v1`, `component-section-separator-v2`, `component-room-sheet-v2` |
| Home controls | `component-favourites-v3`, `component-control-row-v2`, `component-split-controller-v4`, `component-media-row-v2`, `component-apple-tv-controller-v1`, `component-wled-controller-v1`, `component-garage-door-controller-v1`, `component-camera-controller-v1` |
| Security | `component-security-dashboard-v1`, `component-security-summary-v1`, `component-security-camera-wall-v3`, `component-security-entry-points-v1`, `component-camera-controller-v2` |
| System state | `component-update-summary-v3`, `component-update-row-v3`, `component-empty-state-v3`, `component-device-discovery-v2`, `component-household-attention-v1`, `component-welcome-header-v1` |

## Dashboard cutover

The bundle guards custom-element registration, so it can be loaded while older inline resources still exist. Follow [docs/DASHBOARD_COMPOSITION.md](docs/DASHBOARD_COMPOSITION.md) for the dependency order, backend profiles, thin dashboard YAML and rollback-safe removal of replaced inline resources and helpers.

## Repository structure

- `dist/ha-component-library.js` — the single file HACS installs.
- `src/components/` — one descriptively named module for each of the 45 public cards.
- `src/shared/` — shared primitives, registry caches, CSS tokens and controller runtimes.
- `src/support/` — internal elements required by the public cards, including the Home preference editor.
- no active compatibility-patch layer; component and shared-runtime source own current behaviour directly.
- `src/provenance/` — style fingerprints captured before source reorganisation.
- `scripts/assemble.mjs` — deterministic bundle assembly with no third-party dependencies.
- `scripts/check-source.mjs` — the normal refactor-stable source gate: generic contracts plus migrated black-box specifications; it never reads or writes `dist/`.
- `scripts/check-components.mjs` — automatically discovers generic contracts and migrated component specifications.
- `scripts/check-all.mjs` — grouped validation categories, including the separate generated-artifact release boundary.
- `scripts/check-release-contract.mjs` — verifies the versioned bundle and HACS filename contract.
- `scripts/release.mjs` — non-destructive release preparation for versioning, bundling and validation.

This repository intentionally contains no `custom_components/` integration source. Backend runtime code belongs in the separate [**HA-UI-Backend**](https://github.com/brayden276/HA-UI-Backend) HACS Integration repository.

See [ARCHITECTURE.md](ARCHITECTURE.md) for ownership and extension rules. For day-to-day work, `npm run check:source` is the normal refactor-stable source gate: it covers generic contracts and black-box component specifications without reading or writing `dist/`; ordinary behaviour-preserving refactors should normally change only `src/`. `npm run check:style` remains the blocking style-provenance gate; normal source validation reports existing provenance drift as advisory and never regenerates fingerprints. `npm run bundle` is the explicit artefact-writing operation. Bundle freshness/release checks independently compare the checked-in bundle with the expected in-memory composition, while live Home Assistant/HACS proof remains a separate installation and runtime exercise. `npm run release` is the single release-preparation command: it bumps the patch version, assembles the bundle and runs every required release check, including strict style provenance. Use `npm run release -- minor` or `npm run release -- major` for a larger version change. `npm run release:dry-run` previews the target version and working-tree state without writing files. The release command never stages, commits, tags or pushes.

## Release checklist

1. Choose and add the repository licence before public release.
2. Set the GitHub repository description and topics.
3. Run `npm run release` (or `npm run release -- minor` / `npm run release -- major`), then review the generated diff.
4. Commit and push the version bump and generated `dist/ha-component-library.js`.
5. Confirm HACS can install the pushed release and create a GitHub release such as `vX.Y.Z` for a stable version selector.

A GitHub release is recommended but not required for a custom HACS repository; without one, HACS installs from the default branch.
