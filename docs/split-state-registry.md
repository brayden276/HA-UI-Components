# Split State Registry

`custom_components/split_state_registry` is the persistent Home Assistant backend for the Split System Components. It replaces the per-room limits, last-mode, deadline and saved-profile helpers with one durable room map exposed by `sensor.split_state_registry`.

## Install and configure

1. Install this repository's `custom_components/split_state_registry` directory in Home Assistant, then restart Home Assistant.
2. Add **Split State Registry** from **Settings → Devices & services**.
3. Run `split_state_registry.configure_room` once for each split system. The service validates the room record and publishes it immediately through `sensor.split_state_registry`.

The current installation should use these stable room IDs and bindings:

| Room ID | Climate | Controller | Vertical vane | Horizontal vane |
| --- | --- | --- | --- | --- |
| `front_living_room` | `climate.front_living_room_front_living_room_split_climate` | `binary_sensor.front_living_room_front_living_room_split_controller_status` | `select.front_living_room_front_living_room_split_vertical_vane` | `select.front_living_room_front_living_room_split_horizontal_vane` |
| `back_living_room` | `climate.back_living_room_back_living_room_split_climate` | `binary_sensor.back_living_room_back_living_room_split_controller_status` | `select.back_living_room_back_living_room_split_vertical_vane` | `select.back_living_room_back_living_room_split_horizontal_vane` |
| `robbies_bedroom` | `climate.robbie_s_bedroom_robbie_s_bedroom_split_climate` | `binary_sensor.robbie_s_bedroom_robbie_s_bedroom_split_controller_status` | `select.robbie_s_bedroom_robbie_s_bedroom_split_vertical_vane` | `select.robbie_s_bedroom_robbie_s_bedroom_split_horizontal_vane` |
| `playroom` | `climate.playroom_playroom_split_climate` | `binary_sensor.playroom_playroom_split_controller_status` | `select.playroom_playroom_split_vertical_vane` | `select.playroom_playroom_split_horizontal_vane` |

Use native Home Assistant action fields rather than editing storage files. The initial policy is `minimum_target: 16`, `maximum_target: 31`, `fan_ceiling: Quiet`, and `last_mode: cool`.

## Contract

Every room record contains the climate/controller bindings, operating policy, last confirmed mode, restart-safe ISO deadline, and up to five named profiles. The integration serialises writes, persists them through Home Assistant's Store API, restores timers after restart, and corrects out-of-policy target temperatures or fan modes regardless of which Home Assistant client requested them.

The frontend reads the sensor only and writes through the integration's `update_room`, `set_timer`, `upsert_profile`, and `remove_profile` actions. It does not read or write the retired split helpers.

## Removal gate

Do not remove legacy helpers, scripts or room-specific automations until all four room records are visible in `sensor.split_state_registry` and the deployed dashboard has been refreshed from a bundle containing this source. Then test a profile save/apply, an out-of-range target correction, and a timer expiry in one room before retiring the old entities.
