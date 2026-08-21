# HA Component Backend

The dashboard bundle is frontend JavaScript only. Durable split-system state lives in the companion **HA Component Backend** Home Assistant integration.

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

## Release dependency

When split-system backend behaviour changes, release the backend integration first, then release the dashboard bundle that consumes it. This keeps HACS installs able to call the services expected by the frontend.
