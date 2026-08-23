# Component catalogue

This catalogue covers all 38 public custom cards in the library. Configuration examples use placeholder entity IDs and paths; replace them with values from the target Home Assistant instance.

The interaction rules described here are the actual source behaviour. Components that have no meaningful action render non-interactive semantics rather than inert button affordances. Shared tap/hold/repeat semantics are documented in `docs/INTERACTION_MODEL.md`.

## Context and metrics

### `component-context-strip-v3`

```yaml
type: custom:component-context-strip-v3
left_text: Left context
center_1_label: Primary metric
center_1_value: 00%
center_2_label: Secondary metric
center_2_value: 00%
center_3_label: Tertiary metric
center_3_value: 00%
right_text: Right context
# entity: sensor.example
# navigation_path: /lovelace/details
```

Interaction: informational by default. If `navigation_path` is configured, tap navigates. Otherwise an optional `entity` makes the strip tap into native more-info. With neither option it is not exposed as a button.

### `metric-pair-card-v3`

```yaml
type: custom:metric-pair-card-v3
left_value: Primary value
left_label: Primary label
right_value: Secondary value
right_label: Secondary label
right_primary: Supporting value
right_secondary: Supporting label
# left_more_info_entity: sensor.example_left
# right_more_info_entity: sensor.example_right
```

Interaction: each side is independently tappable only when its existing value configuration or explicit more-info option resolves an entity. Tap opens that entity's native details. `day_channel` can link the card to `component-energy-day-selector-v1` for selected-day statistics.

### `component-single-kpi-v2`

```yaml
type: custom:component-single-kpi-v2
value: Primary value
label: Primary metric
support_value: Secondary value
support_label: Supporting context
# entity: sensor.example
# navigation_path: /lovelace/details
```

Interaction: informational unless an entity/navigation target is configured. No target means no button semantics.

### `component-three-stat-v2`

```yaml
type: custom:component-three-stat-v2
metric_1_value: Metric 1
metric_1_label: First label
metric_1_entity: sensor.metric_1
metric_2_value: Metric 2
metric_2_label: Second label
metric_3_value: Metric 3
metric_3_label: Third label
```

Interaction: each metric may independently declare an entity or configured action target. Metrics without an action remain static; tapping an entity-backed metric opens more-info.

### `component-status-row-v2`

```yaml
type: custom:component-status-row-v2
title: Status title
description: Supporting description
status_value: Active
status_label: Current state
icon: mdi:information-outline
# entity: binary_sensor.example
```

Interaction: optional entity drill-down. Without `entity`, the status row is informational.

### `component-progress-v2`

```yaml
type: custom:component-progress-v2
value: 68%
label: Progress metric
progress: 68
target_value: 100%
target_label: Target
# entity: sensor.example
```

Interaction: informational by default. Optional entity/path drill-down applies to the card; the progress bar itself is never a separate control.

## Charts and date selection

### `component-energy-day-selector-v1`

```yaml
type: custom:component-energy-day-selector-v1
channel: energy-dashboard
```

Interaction: previous/next update the selected local date immediately. Holding either step button repeats after 350 ms and accelerates; movement into a scroll cancels the press. Today/date input remain directly accessible. Cards on the same channel receive `energy-day-selector-change`.

### `component-history-graph-v2`

```yaml
type: custom:component-history-graph-v2
meta_text: Aggregation label
series_1_label: Primary series
series_2_label: Secondary series
series_3_label: Supporting series
positive_label: Positive
negative_label: Negative
```

Interaction: drag/pointer movement scrubs the graph. A tap pins the tooltip; a second tap or outside interaction releases it. Legend buttons toggle their series and expose `aria-pressed` state.

## Solar dashboard

### `solar-daylight-card-v7`

```yaml
type: custom:solar-daylight-card-v7
sun_entity: sun.sun
weather_entity: weather.forecast_home
```

The card shows sun phase/elevation, next sunrise/sunset and current/+4h/+8h cloud coverage using guarded hourly forecast requests.

Interaction: tap opens Sun details. Hold opens Weather details. The hold is a shortcut only; the primary Sun action remains available on tap.

### `energy-history-card-v3`

```yaml
type: custom:energy-history-card-v3
house_entity: sensor.house_consumption_power
solar_entity: sensor.total_solar_power
grid_entity: sensor.grid_power
hours: 24
bucket_minutes: 10
calendar_day: true
day_channel: energy-usage-day
```

Interaction: drag scrubs recorded data; tap pins the current tooltip until another tap/outside interaction. Legend buttons open native details for House, Solar and Grid entities. With `calendar_day: true`, the chart follows the configured Energy Day Selector channel.

## Actions, lists and notices

### `component-action-v2`

```yaml
type: custom:component-action-v2
title: Action title
description: Supporting description
action_text: Open
icon: mdi:gesture-tap-button
navigation_path: /lovelace/home
# more_info_entity: sensor.example
```

Interaction: tap performs the configured primary action. If both navigation and `more_info_entity` are configured, tap navigates and hold opens entity details. If neither is configured, the card is static.

### `component-list-v2`

```yaml
type: custom:component-list-v2
rows:
  - title: First item
    description: Supporting detail
    value: Value
    label: Label
    entity: sensor.first
  - title: Second item
    description: Static row
    value: Value
    label: Label
```

Interaction: a row becomes a target only when it declares an entity/path/action. Static rows do not have button semantics. A row with both path and entity uses tap for its primary destination and hold for details.

### `component-notice-v2`

```yaml
type: custom:component-notice-v2
title: Notice title
message: Important supporting information appears here.
tone: info
icon: mdi:information-outline
# entity: binary_sensor.warning_source
```

Interaction: informational by default. Optional `entity` opens the warning/source details. Existing tones are `info`, `warning`, `error` and `success`.

### `component-text-effect-v1`

```yaml
type: custom:component-text-effect-v1
effect: stamp
text: Processing request
description: Signature status treatment.
icon: mdi:progress-clock
speed: 1.9
```

Interaction: none. Effects (`stamp`, `typewave`, `overprint`, `signal`, `rainbow_stamp`) run for one transient cycle after render/text change and then settle. Reduced-motion users receive a non-animated settled presentation.

## Navigation and room structure

### `component-quick-nav-v2`

```yaml
type: custom:component-quick-nav-v2
left_entity: sensor.outdoor_temperature
left_text: Outside
action_1_text: Home
action_1_path: /lovelace/home
action_2_text: Settings
action_2_path: /config/dashboard
```

Interaction: entity context opens more-info; configured actions navigate. Targets use shared press/scroll/keyboard semantics and unavailable targets remain disabled.

### `component-nav-tile-v2`

```yaml
type: custom:component-nav-tile-v2
icon: mdi:door-open
title: Destination
context: Navigation context
navigation_path: /lovelace/destination
```

Interaction: tap navigates only when `navigation_path` exists. Without a path the tile is a visual preview, not a button.

### `component-room-navigation-v1`

```yaml
type: custom:component-room-navigation-v1
name: Kitchen
icon: mdi:countertop-outline
area: Kitchen
navigation_path: "#kitchen"
presence_colour_key: kitchen
```

Interaction: tap navigates to the configured room destination using scroll-cancelling shared activation. Registry-derived room state/presence behaviour is unchanged.

### `component-section-separator-v2`

```yaml
type: custom:component-section-separator-v2
icon: mdi:gesture-tap-button
title: Section label
```

Interaction: none. This is purely presentational.

### `component-room-sheet-v2`

```yaml
type: custom:component-room-sheet-v2
icon: mdi:bed-king-outline
title: Room name
```

Interaction: preview mode is deliberately non-interactive, including its close/control-looking elements. Optional `rows` may declare real `entity`, `navigation_path` or `service` actions. A configured row with both path and entity uses tap for navigation and hold for details.

## Home composition

### `component-home-overview-v4`

```yaml
type: custom:component-home-overview-v4
weather_entity: weather.forecast_home
base_path: /home-control
current_dashboard: home-control
favourites_helpers:
  - input_text.dashboard_favourite_1
  - input_text.dashboard_favourite_2
  - input_text.dashboard_favourite_3
  - input_text.dashboard_favourite_4
```

Interaction: no global card action. The header weather target opens native details through the shared interaction layer; Favourites, Active Now, Rooms and Household delegate to their canonical child components. Child components are retained across ordinary Home Assistant state refreshes.

### `component-smart-collection-v3`

```yaml
type: custom:component-smart-collection-v3
mode: all
title: Controls
editable: true
pref_key: home-control.controls.v2
```

Supported modes are `all`, `active`, `area`, `media` and `sound`.

Interaction: delegated to generated canonical/specialised controls. Smart Collection remains the registry/composition boundary and does not add a competing gesture implementation around children.

### `component-room-directory-v4`

```yaml
type: custom:component-room-directory-v4
mode: home
title: Rooms
pref_key: home-control.rooms.v2
base_path: /home-control
navigation_path: /home-control/rooms
```

Interaction: tap a room to open its sheet. Shared activation prevents a scrolling gesture from becoming an accidental room open. Per-room sheet scroll positions are retained for the dashboard session and restored when revisiting the room. Environment metrics open their source entity details.

### `component-household-directory-v3`

```yaml
type: custom:component-household-directory-v3
pref_key: home-control.household.v2
base_path: /home-control
current_dashboard: home-control
```

Interaction: delegated to the generated Bubble Card destinations/entity controls. Dashboard/media/control destinations navigate; To-do entities open their native details. Preference editing remains independent of destination actions.

### `component-favourites-minimal-v1`

```yaml
type: custom:component-favourites-minimal-v1
helpers:
  - input_text.dashboard_favourite_1
  - input_text.dashboard_favourite_2
  - input_text.dashboard_favourite_3
  - input_text.dashboard_favourite_4
max: 4
title: Favourites
```

Interaction: exactly the canonical `component-favourites-v3` behaviour. The wrapper changes Home presentation only and does not implement a second action system.

## Household controls

### `component-favourites-v3`

```yaml
type: custom:component-favourites-v3
helpers:
  - input_text.dashboard_favourite_1
  - input_text.dashboard_favourite_2
  - input_text.dashboard_favourite_3
  - input_text.dashboard_favourite_4
max: 4
```

Interaction: tap keeps the existing smart entity action. Hold any live favourite to open native entity details. Reversible light/switch/fan/input-boolean and media actions render optimistic intent, then reconcile through shared state confirmation; errors roll back. Button/input-button, automation, script and scene actions remain non-optimistic/confirmation-aware as appropriate. Static `items` preview mode no longer exposes fake live controls.

### `component-control-row-v2`

Preview:

```yaml
type: custom:component-control-row-v2
icon: mdi:lightbulb-outline
title: Slider control
state: Current state
mode: slider
value: 68
```

Live:

```yaml
type: custom:component-control-row-v2
entity: light.living_room
icon: mdi:lightbulb-outline
title: Living room
mode: slider
```

Modes are `slider`, `switch`, `state`, `action`.

Interaction: preview switch/slider remains local-only. Live switches are optimistic, state-confirmed and hold for details. Live sliders update locally on native input and coalesce backend brightness/percentage/value requests. State mode drills into details. Action mode can use a configured service; unavailable live entities cannot be acted on.

### `component-split-controller-v4`

```yaml
type: custom:component-split-controller-v4
entity: climate.living_room_split
title: Living Room Split
```

Interaction: identity opens native details. Power/mode/fan/vane/timer retain the controller's state-confirmed request model. Holding target-temperature +/- repeats after 350 ms; the existing Split local target/300 ms queue coalesces those increments and waits for reported target settlement. Hold and repeat do not compete on the same control.

Room configuration/timers remain authoritative in [HA-UI-Backend](https://github.com/brayden276/HA-UI-Backend).

### `component-media-row-v2`

Preview:

```yaml
type: custom:component-media-row-v2
icon: mdi:speaker
title: Media player
state: Playing · Media title
```

Live:

```yaml
type: custom:component-media-row-v2
entity: media_player.living_room
icon: mdi:speaker
title: Media player
```

Interaction: preview play/pause is a local demonstration and preview previous/next are non-interactive. Live identity opens details, play/pause renders optimistic intent and waits for reported playback state, and previous/next are momentary actions derived from supported features.

### `component-apple-tv-controller-v1`

```yaml
type: custom:component-apple-tv-controller-v1
entity: media_player.front_living_room_apple_tv_4k
title: Apple TV 4K
icon: mdi:apple
```

Interaction: the identity row opens native Apple TV details. Remote/apps controls retain capability-derived availability. Holding volume +/- repeats with local volume feedback and a coalesced backend request queue; other remote commands remain momentary. App selections use immediate selection feedback and the existing pending/error model. `demo: true` remains available for the Components dashboard.

### `component-wled-controller-v1`

```yaml
type: custom:component-wled-controller-v1
entity: light.garage_wled_main
device_id: replace_with_device_registry_id
```

Interaction: tap identity opens advanced WLED controls; hold identity opens native more-info. Power is optimistic but remains pending until Home Assistant reports the requested on/off state. Brightness updates locally on input and coalesces state-confirmed backend requests. Presets/actions retain their existing registry-derived availability.

### `component-garage-door-controller-v1`

```yaml
type: custom:component-garage-door-controller-v1
entity: binary_sensor.garage_door_status
control_entity: button.garage_door_trigger
availability_entity: binary_sensor.garage_door_controller_status
confirm_timeout: 20000
```

`entity` is the closed-position reed state and `control_entity` is the momentary operator trigger.

Interaction: a single tap sends the operator command. The card **does not** optimistically display Open/Closed and does not require a second press. It stays pending after `button.press` until the reed sensor confirms the expected physical state or the confirmation timeout expires. The identity opens native state details. The action is deliberately non-repeatable.

### `component-camera-controller-v1`

```yaml
type: custom:component-camera-controller-v1
entity: camera.garage_main_stream
device_id: replace_with_camera_device_registry_id
```

Interaction: camera/view/control launchers use shared activation. Discovered switch controls render optimistic on/off state, hold for native details and wait for reported state confirmation; failures roll back. Maintenance buttons keep the existing two-step confirmation and never claim optimistic completion. Preferred main/sub stream selection continues to use the existing stored camera viewer preference.

## System and household state

### `component-update-summary-v3`

```yaml
type: custom:component-update-summary-v3
live_updates: true
update_all: true
confirm: true
```

Interaction: Update All uses shared press/keyboard feedback but remains deliberately non-optimistic. Existing confirmation/progress/error behaviour is retained.

### `component-update-row-v3`

```yaml
type: custom:component-update-row-v3
entity: update.example_device
icon: mdi:update
title: Update name
confirm: true
```

Interaction: details opens native more-info. Install remains non-optimistic: service request completion is separate from the update actually starting, and the existing 12-second start watchdog reports failure if Home Assistant never enters progress/clears pending state.

### `component-empty-state-v3`

```yaml
type: custom:component-empty-state-v3
icon: mdi:check-circle-outline
title: Nothing requires attention
message: Supporting empty-state message.
```

Interaction: none.

### `component-device-discovery-v2`

```yaml
type: custom:component-device-discovery-v2
refresh_seconds: 60
max_rows: 6
```

Interaction: in live/admin mode the entire discovered-device row opens Integrations; Refresh and Retry are separate shared actions. `demo: true` renders the visual demonstration without fake navigation/refresh controls.

### `component-household-attention-v1`

```yaml
type: custom:component-household-attention-v1
title: Needs attention
icon: mdi:alert-circle-outline
max_items: 6
```

Interaction: tapping a live issue opens the source entity details. The card deliberately does not add direct garage/lock actions to the attention surface. `demo: true` is display-only.

### `component-welcome-header-v1`

```yaml
type: custom:component-welcome-header-v1
weather_entity: weather.forecast_home
```

Interaction: weather opens native details using standard shared press/scroll/keyboard feedback. Time/weather presentation and minute scheduling are unchanged.
