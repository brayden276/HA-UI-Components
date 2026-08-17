# Component catalogue

These examples cover all 28 custom card types found on the Components dashboard. They use the existing configuration API and do not require inline JavaScript.

Values such as entity IDs, device IDs and navigation paths are examples; replace them with IDs from the target Home Assistant instance.

## Capability model

The catalogue contains both live Home Assistant integrations and reusable visual primitives:

- Entity- or registry-aware cards document an `entity`, helper, area, device or navigation option below and react to Home Assistant state.
- Input-driven cards render the configured labels, values and rows exactly as supplied. They are suitable for dashboards that calculate or inject those values elsewhere.
- `component-history-graph-v2`, `component-nav-tile-v2`, `component-control-row-v2`, `component-media-row-v2` and `component-room-sheet-v2` preserve the Components dashboard's preview behaviour. Their apparent controls are local demonstrations rather than Home Assistant service calls.
- Options named `demo` or `demo_presence` are intended for the Components dashboard only. Omit them for normal live use.

This distinction prevents a preview component from being mistaken for a live control when it is reused on another dashboard.

## Context and metrics

### Context strip

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
```

### Metric pair

```yaml
type: custom:metric-pair-card-v3
left_value: Primary value
left_label: Primary label
right_value: Secondary value
right_label: Secondary label
right_primary: Supporting value
right_secondary: Supporting label
```

`day_channel` can link this card to `component-energy-day-selector-v1`. The existing live-statistics options remain available in the preserved component implementation.

### Single KPI

```yaml
type: custom:component-single-kpi-v2
value: Primary value
label: Primary metric
support_value: Secondary value
support_label: Supporting context
```

### Three-stat summary

```yaml
type: custom:component-three-stat-v2
metric_1_value: Metric 1
metric_1_label: First label
metric_2_value: Metric 2
metric_2_label: Second label
metric_3_value: Metric 3
metric_3_label: Third label
```

### Status row

```yaml
type: custom:component-status-row-v2
title: Status title
description: Supporting description
status_value: Status value
status_label: Status label
icon: mdi:information-outline
```

### Progress / target

```yaml
type: custom:component-progress-v2
value: 68%
label: Progress metric
progress: 68
target_value: 100%
target_label: Target
```

## Charts and date selection

### Energy day selector

```yaml
type: custom:component-energy-day-selector-v1
channel: energy-dashboard
```

Cards listening on the same channel receive the selected local date through the component's existing browser event.

### History graph

```yaml
type: custom:component-history-graph-v2
meta_text: Aggregation label
series_1_label: Primary series
series_2_label: Secondary series
series_3_label: Supporting series
positive_label: Positive
negative_label: Negative
```

This preserves the current component-library graph behaviour and data treatment.

## Actions, lists and notices

### Action card

```yaml
type: custom:component-action-v2
title: Action title
description: Supporting description of the action
action_text: Open
icon: mdi:gesture-tap-button
navigation_path: /lovelace/home
```

Use `navigation_path` for navigation or `more_info_entity` to open an entity's more-info dialog.

### List / ranking

```yaml
type: custom:component-list-v2
rows:
  - title: First item
    description: Supporting detail
    value: Value
    label: Label
  - title: Second item
    description: Supporting detail
    value: Value
    label: Label
```

### Alert / notice

```yaml
type: custom:component-notice-v2
title: Notice title
message: Important supporting information appears here.
tone: info
icon: mdi:information-outline
```

Supported existing tones are `info`, `warning`, `error` and `success`.

### Signature text effect

```yaml
type: custom:component-text-effect-v1
effect: stamp
text: Processing request
description: Signature status treatment.
icon: mdi:progress-clock
speed: 1.9
```

Existing effects: `stamp`, `typewave`, `overprint`, `signal`, `rainbow_stamp`.

## Navigation and room structure

### Quick navigation

```yaml
type: custom:component-quick-nav-v2
left_icon: mdi:weather-partly-cloudy
left_text: Context
left_entity: sensor.outdoor_temperature
action_1_icon: mdi:view-dashboard-outline
action_1_text: Home
action_1_path: /lovelace/home
action_2_icon: mdi:cog-outline
action_2_text: Settings
action_2_path: /config/dashboard
```

### Navigation tile

```yaml
type: custom:component-nav-tile-v2
icon: mdi:door-open
title: Destination
context: Navigation context
```

### Room navigation with presence glow

```yaml
type: custom:component-room-navigation-v1
name: Kitchen
icon: mdi:countertop-outline
area: Kitchen
navigation_path: "#kitchen"
presence_colour_key: kitchen
```

The component resolves the configured area through Home Assistant's registries. `demo_presence: true` keeps the component-library demonstration state.

### Section separator

```yaml
type: custom:component-section-separator-v2
icon: mdi:gesture-tap-button
title: Section label
```

### Room sheet

```yaml
type: custom:component-room-sheet-v2
icon: mdi:bed-king-outline
title: Room name
```

This preserves the current room-sheet preview component exactly.

## Household controls

### Favourites

Static configuration:

```yaml
type: custom:component-favourites-v3
items:
  - icon: mdi:lightbulb-outline
    title: Favourite one
    state: Supporting state
  - icon: mdi:thermostat
    title: Favourite two
    state: Supporting state
```

The existing editable mode also accepts up to four `input_text` helper entity IDs in `helpers`. It stores stable registry references, keeps the existing confirmation behaviour, and can open the bundled split-system controller.

### Control row

```yaml
type: custom:component-control-row-v2
icon: mdi:lightbulb-outline
title: Slider control
state: Current state
mode: slider
value: 68
```

Existing modes: `slider`, `switch`, `state`, `action`.

### Split-system controller

```yaml
type: custom:component-split-controller-v4
entity: climate.living_room_split
title: Living Room Split
```

The bundled registry runtime preserves automatic discovery of associated vane, limit, last-mode and timer helpers using the existing naming and area conventions. The card also accepts the existing explicit entity override keys.

### Media row

```yaml
type: custom:component-media-row-v2
icon: mdi:speaker
title: Media player
state: Playing · Media title
```

This preserves the current component-library media-row behaviour.

### WLED controller

```yaml
type: custom:component-wled-controller-v1
entity: light.garage_wled_main
device_id: replace_with_device_registry_id
```

The shared registry runtime and current WLED patch are bundled, including WLED entity discovery, presets/effects and the current control behaviour.

## System and household state

### Update summary

```yaml
type: custom:component-update-summary-v3
live_updates: true
title: updates available
message: Review the items below before installing.
confirm: true
```

Use `entities` to limit the update entities considered. `update_all: true` enables the existing update-all action.

### Update row

```yaml
type: custom:component-update-row-v3
entity: update.example_device
icon: mdi:update
title: Update name
action: Update
confirm: true
```

Without an entity, the configured `current` and `available` display values are used.

### Empty state

```yaml
type: custom:component-empty-state-v3
icon: mdi:check-circle-outline
title: Nothing requires attention
message: Supporting empty-state message.
```

### Device discovery

```yaml
type: custom:component-device-discovery-v2
refresh_seconds: 60
max_rows: 6
```

Set `demo: true` to render the component-library demonstration instead of live discovery state.

### Household attention

```yaml
type: custom:component-household-attention-v1
title: Needs attention
icon: mdi:alert-circle-outline
max_items: 6
```

Set `demo: true` for the dashboard's demonstration data. Live mode reads the Home Assistant registries and current states through the existing card logic.

### Welcome header

```yaml
type: custom:component-welcome-header-v1
weather_entity: weather.forecast_home
```

The greeting, clock and weather presentation remain unchanged.
