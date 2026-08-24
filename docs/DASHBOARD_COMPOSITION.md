# Energy and Security dashboard composition

The dashboard YAML should describe layout and select a reusable backend profile. Entity aggregation, Recorder queries, capability discovery, caching and shared preferences belong in the component library or HA Component Backend—not in copied JavaScript, helpers or automations.

## Deployment order

1. Install or update **HA Component Backend** first and restart Home Assistant.
2. Confirm `sensor.ha_component_backend` is available.
3. Configure the Energy and Security profiles through `ha_component_backend.configure_dashboard_profile`.
4. Install the matching **HA Component Library** bundle and hard-refresh one browser.
5. Confirm both wrapper card types are registered before changing a dashboard.
6. Back up each dashboard, replace its repeated card tree with the thin configuration below, then verify desktop and mobile behaviour.
7. Remove replaced inline resources only after the HACS bundle is the sole implementation and a rollback backup exists.
8. Remove retired helpers only after the corresponding backend preference/profile has been read back successfully.

Do not reverse the backend/frontend order. The frontend deliberately reports a missing profile or unavailable backend instead of creating another local source of truth.

## Energy profile

```yaml
service: ha_component_backend.configure_dashboard_profile
data:
  kind: energy
  profile_id: household-energy
  profile:
    power:
      grid: sensor.grid_power
      solar:
        - sensor.solar_inverter_1_power
        - sensor.solar_inverter_2_power
      # house is optional; when absent, the backend derives grid + solar.
    energy:
      imported: sensor.grid_import_energy
      exported: sensor.grid_export_energy
      generated:
        - sensor.solar_inverter_1_energy
        - sensor.solar_inverter_2_energy
      # consumed is optional; when absent, the backend derives import + generation - export.
```

Unavailable values remain unavailable. The backend never converts an unavailable inverter or grid sensor to zero. It exposes canonical live power sensors and one cached daily response containing totals, coverage and aligned House/Solar/Grid series.

The whole custom Energy view can then use one card:

```yaml
type: custom:component-energy-dashboard-v1
profile: household-energy
day_channel: energy-day
weather_entity: weather.forecast_home
sun_entity: sun.sun
```

The wrapper preserves the established Energy presentation while composing the stable day selector, live/daily summary, daylight context and history chart. Day state is replayable across component load order and stored only for the current browser session.

Home Assistant's native Energy configuration should use cumulative import/export/generation sensors with correct device/state classes. Do not classify a grid meter as device consumption merely to make the chart appear populated; reconcile the native totals first, then reclassify it as grid import/export.

## Security profile

```yaml
service: ha_component_backend.configure_dashboard_profile
data:
  kind: security
  profile_id: household-security
  profile:
    area_ids:
      - front_yard
      - garage
    include_entities: []
    exclude_entities: []
    mappings: {}
    viewer:
      preferred_stream: auto
```

The profile stores scope and explicit exceptions only. Cameras, entry points, recording/detection switches, maintenance actions and PTZ controls are discovered from Home Assistant's entity/device/area registries and actual capabilities. A control is not rendered merely because its name resembles another vendor's entity naming convention.

The rebuilt Security view also uses one card:

```yaml
type: custom:component-security-dashboard-v1
profile: household-security
```

The wrapper presents exception-first household status, a snapshot-first camera wall and real entry points. Live streams start only when requested and visible. The expanded camera controller keeps destructive or disruptive controls behind confirmation and restores focus after dismissal. Empty alarm, lock, siren or PTZ sections are omitted rather than presented as false capability.

## State and failure contract

- Every actionable control acknowledges press immediately and prevents duplicate submission while pending.
- Entity changes remain authoritative; optimistic feedback never claims a physical action completed.
- Cached Energy and weather content remains visible during refresh and is marked stale after a failed update.
- Registry failures render as failures, not as a misleading empty household.
- Missing profiles and backend errors remain visible and retryable.
- Date, time, numbers and units follow Home Assistant's locale and timezone.
- Keyboard focus is visible, Escape closes dismissible overlays, and focus returns to the opener.
- Touch targets are at least 44 by 44 CSS pixels and reduced-motion preference disables non-essential transitions.

## Retiring old resources safely

Keep one HACS resource for this library plus any unrelated third-party card resources still used elsewhere. Remove an inline resource only when all of its custom-element registrations exist in the installed bundle and all affected dashboards render after a hard refresh. Never remove Mushroom, Bubble Card or Auto Entities merely because this bundle is installed; remove them only if a full dashboard search confirms there are no remaining references.

For rollback, restore the dashboard backup and re-enable the former resource. Backend profiles are additive and can remain installed during a frontend rollback.
