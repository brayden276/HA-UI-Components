# HA Component Backend

The dashboard bundle is frontend JavaScript only. Durable split-system state and
shared dashboard preferences live in the companion **HA Component Backend** Home
Assistant integration.

## HACS repositories

- **HA-UI-Components** is a HACS **Dashboard** repository. It ships `dist/ha-component-library.js`.
- **HA-UI-Backend** is a HACS **Integration** repository. It ships `custom_components/ha_component_backend`.

Keep these as separate HACS custom repositories. The dashboard repo must not contain Home Assistant integration source, and the backend repo must not contain dashboard bundle source.

## Runtime contract

The frontend discovers backend state from:

```text
sensor.ha_component_backend
```

The backend stores room records under `attributes.rooms` and exposes these actions:

```text
ha_component_backend.configure_room
ha_component_backend.update_room
ha_component_backend.set_timer
ha_component_backend.resume_room
ha_component_backend.upsert_profile
ha_component_backend.remove_profile
ha_component_backend.remove_room
```

The split-system components should not read or write retired `input_text`, `input_number`, `input_select`, `input_boolean`, timer-script, or room-specific helper state.

Energy and Security dashboard profiles use:

```text
ha_component_backend.configure_dashboard_profile
ha_component_backend.remove_dashboard_profile
ha_component_backend/profile/get
ha_component_backend/profile/update
ha_component_backend/profile/remove
ha_component_backend/energy/day
```

The Energy endpoint is the sole source for selected-day totals and chart series;
parallel cards do not issue independent Recorder queries. Canonical live sensors
are `sensor.ha_component_house_power`, `sensor.ha_component_solar_power` and
`sensor.ha_component_grid_power`. Security profiles store scope and exceptions,
while the frontend discovers actual device capabilities from Home Assistant's
registries.

Shared room/directory preferences use the backend WebSocket contract:

```text
ha_component_backend/preferences/get
ha_component_backend/preferences/update
ha_component_backend/preferences/remove
```

The bundle automatically migrates an existing `frontend/get_user_data` value on
first read. It falls back to that frontend API only when the backend commands are
not installed or the integration has not been configured. Other backend errors
remain visible; they must not silently create a second source of truth.

Preference writes include the last acknowledged per-key revision. A conflict
keeps the editor open and asks the user to reopen it, while other save failures
keep the unsaved ordering/visibility choices in place for retry. Missing-key
revision tombstones are retained so a delete/recreate cycle cannot make a stale
editor revision valid again.

Home Favourites use `home-control.favourites.v1`. On the first backend-backed
load, `component-favourites-v3` converts the existing helper slots into its
stable registry-reference array and saves that array as one atomic preference.
The production Home composition then uses the backend preference exclusively
and never reads or writes those four `input_text` helpers. Keep them during
rollout for rollback, then remove them only after the backend preference has
been verified on the target instance.
Overlapping loads are coalesced and the latest key or backend event is always
re-read after an in-flight request settles.

## Release dependency

When split-system backend behaviour changes, release the backend integration first, then release the dashboard bundle that consumes it. This keeps HACS installs able to call the services expected by the frontend.
