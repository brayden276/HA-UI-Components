# HA Component Library

A HACS Dashboard repository containing every custom card used by the Home Assistant **Components** dashboard.

The library turns the dashboard's inline JavaScript resources into one reusable module: `dist/ha-component-library.js`. Card configuration stays in normal dashboard YAML/UI configuration; the JavaScript implementation is installed and updated through HACS.

## Scope

- All 38 public `custom:` card types are included: the 28 original Components cards, three specialised device controllers, five Home dashboard composition cards and two Solar dashboard cards.
- Every public card has its own descriptively named source module.
- Shared registration, escaping, navigation, registry, Update, split-system and WLED logic is centralised under `src/shared/`.
- The original component CSS and visual behaviour are preserved. No component was restyled.
- Required supporting runtime modules and the current WLED, garage-door, camera and room-navigation patches are bundled.
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

Split System Components also require the companion **HA Component Backend** integration. Install it once from HACS as an **Integration**, restart Home Assistant when prompted, then add **HA Component Backend** in **Settings → Devices & services**. The card detects `sensor.ha_component_backend` automatically; no legacy split helpers are used after the backend migration is complete.

## Use a component

After installation, add cards using their existing `custom:` type. No inline JavaScript is required:

```yaml
type: custom:component-single-kpi-v2
value: 68%
label: Solar self-sufficiency
support_value: 12.4 kWh
support_label: generated today
```

See [docs/components.md](docs/components.md) for a configured example of every card and [AUDIT.md](AUDIT.md) for the component-by-component review and validation record.

## Included cards

| Group | Card types |
| --- | --- |
| Context and metrics | `component-context-strip-v3`, `metric-pair-card-v3`, `component-single-kpi-v2`, `component-three-stat-v2`, `component-status-row-v2`, `component-progress-v2` |
| Charts and time | `component-energy-day-selector-v1`, `component-history-graph-v2`, `solar-daylight-card-v7`, `energy-history-card-v3` |
| Actions and lists | `component-action-v2`, `component-list-v2`, `component-notice-v2`, `component-text-effect-v1` |
| Home composition | `component-home-overview-v4`, `component-favourites-minimal-v1`, `component-smart-collection-v3`, `component-room-directory-v4`, `component-household-directory-v3` |
| Home navigation | `component-quick-nav-v2`, `component-nav-tile-v2`, `component-room-navigation-v1`, `component-section-separator-v2`, `component-room-sheet-v2` |
| Home controls | `component-favourites-v3`, `component-control-row-v2`, `component-split-controller-v4`, `component-media-row-v2`, `component-apple-tv-controller-v1`, `component-wled-controller-v1`, `component-garage-door-controller-v1`, `component-camera-controller-v1` |
| System state | `component-update-summary-v3`, `component-update-row-v3`, `component-empty-state-v3`, `component-device-discovery-v2`, `component-household-attention-v1`, `component-welcome-header-v1` |

## Existing inline resources

The bundle guards custom-element registration, so it can be loaded while the current inline resources still exist. To complete a later migration, verify the HACS resource first, then remove the replaced inline resources from Home Assistant yourself. This repository deliberately does not automate or perform that cutover.

## Repository structure

- `dist/ha-component-library.js` — the single file HACS installs.
- `src/components/` — one descriptively named module for each of the 38 public cards.
- `src/shared/` — shared primitives, registry caches, CSS tokens and controller runtimes.
- `src/support/` — internal elements required by the public cards, including the Home preference editor.
- `src/patches/` — the current WLED, garage-door, camera and room-navigation integration/compatibility patches.
- `src/provenance/` — style fingerprints captured before source reorganisation.
- `scripts/assemble.mjs` — deterministic bundle assembly with no third-party dependencies.
- `scripts/check-all.mjs` — syntax, inventory, advisory style-drift and isolated load-order validation.
- `scripts/check-release-contract.mjs` — verifies the versioned bundle and HACS filename contract.
- `scripts/release.mjs` — non-destructive release preparation for versioning, bundling and validation.

See [ARCHITECTURE.md](ARCHITECTURE.md) for ownership and extension rules. For maintainers, `npm run check` runs the full static suite, while `npm run bundle` regenerates the distributable from the ordered source modules. Style fingerprint drift is reported as an advisory because intentional component work can legitimately change a fingerprint; run `npm run check:style` when it must be blocking. `npm run release` bumps the patch version, assembles the bundle and runs every release check; use `npm run release -- minor` or `npm run release -- major` for a larger version change. `npm run release:dry-run` previews the target version and working-tree state without writing files. The release command never stages, commits, tags or pushes.

## Release checklist

1. Choose and add the repository licence before public release.
2. Set the GitHub repository description and topics.
3. Run `npm run release:dry-run`, then `npm run release` and review the generated diff.
4. Commit and push the version bump and generated `dist/ha-component-library.js`.
5. Confirm HACS can install the pushed release and create a GitHub release such as `vX.Y.Z` for a stable version selector.

A GitHub release is recommended but not required for a custom HACS repository; without one, HACS installs from the default branch.
