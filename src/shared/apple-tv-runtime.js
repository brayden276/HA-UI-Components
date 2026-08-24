/** Pure capability and presentation model for Apple TV components. */
const appleShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const APPLE_TV_INVALID_STATES = new Set(["unknown", "unavailable", "none", ""]);
const APPLE_TV_FEATURES = Object.freeze({
  PAUSE: 1,
  MUTE: 8,
  PREVIOUS: 16,
  NEXT: 32,
  PLAY: 512,
  STEP_VOLUME: 1024,
  SOURCE: 2048,
  STOP: 4096,
});
const APPLE_TV_NAV = Object.freeze([
  ["up", "Up", "mdi:chevron-up"],
  ["left", "Left", "mdi:chevron-left"],
  ["select", "Select", "mdi:circle-outline"],
  ["right", "Right", "mdi:chevron-right"],
  ["down", "Down", "mdi:chevron-down"],
  ["menu", "Menu", "mdi:keyboard-return"],
  ["home", "Home", "mdi:home-variant-outline"],
  ["top_menu", "Top menu", "mdi:format-list-bulleted"],
]);
const APPLE_TV_APP_ICONS = Object.freeze([
  [/netflix/i, "mdi:netflix"],
  [/youtube/i, "mdi:youtube"],
  [/spotify/i, "mdi:spotify"],
  [/prime video|amazon/i, "mdi:amazon"],
  [/plex/i, "mdi:plex"],
  [/twitch/i, "mdi:twitch"],
  [/vlc/i, "mdi:vlc"],
  [/apple tv|apple music|music/i, "mdi:apple"],
  [/disney/i, "mdi:castle"],
  [/kayo|sport/i, "mdi:soccer"],
  [/binge|stan|paramount|movie/i, "mdi:movie-open-play-outline"],
]);

const appleTvLabel = (value) => String(value || "")
  .replaceAll("_", " ")
  .replace(/^./, (letter) => letter.toUpperCase());
const appleTvDomain = (entityId) => String(entityId || "").split(".")[0];
const appleTvValid = (state) => Boolean(
  state && !APPLE_TV_INVALID_STATES.has(String(state.state).toLowerCase()),
);
const appleTvSupported = (state, feature) => Boolean(
  (Number(state?.attributes?.supported_features) || 0) & feature,
);
const appleTvAppIcon = (source, configured = {}) => {
  const override = configured?.[source];
  if (typeof override === "string" && override.trim()) return override.trim();
  return APPLE_TV_APP_ICONS.find(([pattern]) => pattern.test(source))?.[1] || "mdi:application-outline";
};

const appleTvDemoState = (entityId) => {
  if (entityId === "remote.demo_apple_tv") {
    return {
      state: "on",
      attributes: {
        supported_commands: APPLE_TV_NAV.map(([command]) => command).concat(["wakeup", "suspend"]),
      },
    };
  }
  if (entityId === "binary_sensor.demo_apple_tv_keyboard_focus") return { state: "off", attributes: {} };
  return {
    state: "playing",
    attributes: {
      friendly_name: "Apple TV 4K",
      source: "Netflix",
      source_list: ["Netflix", "YouTube", "Apple TV", "Disney+", "Prime Video", "Spotify"],
      volume_level: 0.42,
      supported_features: APPLE_TV_FEATURES.PAUSE |
        APPLE_TV_FEATURES.PLAY |
        APPLE_TV_FEATURES.MUTE |
        APPLE_TV_FEATURES.STEP_VOLUME |
        APPLE_TV_FEATURES.SOURCE |
        APPLE_TV_FEATURES.PREVIOUS |
        APPLE_TV_FEATURES.NEXT |
        APPLE_TV_FEATURES.STOP,
    },
  };
};

const appleTvDiscovery = (config, registry, hass) => {
  if (config?.demo) {
    return {
      media: config.entity,
      remote: "remote.demo_apple_tv",
      keyboard: "binary_sensor.demo_apple_tv_keyboard_focus",
      configEntryId: "demo",
    };
  }
  const shared = globalThis.__homeDashboardV2?.appleTvRegistry?.(
    config?.entity, registry, hass, { deviceId: config?.device_id },
  );
  if (shared) {
    return {
      media: config?.entity,
      remote: shared.remoteEntityId,
      keyboard: shared.keyboardEntityId,
      configEntryId: shared.configEntryId,
    };
  }
  const all = registry?.entities || [];
  const mediaEntry = all.find((entry) => entry.entity_id === config?.entity);
  const siblings = mediaEntry?.device_id ? registry?.byDevice?.get(mediaEntry.device_id) || [] : [];
  const usable = (entry) => entry && !entry.disabled_by && !entry.hidden_by &&
    (entry.platform === "apple_tv" || entry.config_entry_id === mediaEntry?.config_entry_id);
  const remote = siblings.find((entry) => usable(entry) && appleTvDomain(entry.entity_id) === "remote");
  const keyboard = siblings.find((entry) => usable(entry) &&
    appleTvDomain(entry.entity_id) === "binary_sensor" &&
    /keyboard.*focus|focus.*keyboard/i.test(`${entry.entity_id} ${entry.name || ""} ${entry.original_name || ""}`));
  return {
    media: config?.entity,
    remote: remote?.entity_id || null,
    keyboard: keyboard?.entity_id || null,
    configEntryId: mediaEntry?.config_entry_id || remote?.config_entry_id || keyboard?.config_entry_id || null,
  };
};

const appleTvModel = (hass, config, registry) => {
  const entities = appleTvDiscovery(config, registry, hass);
  const state = (entityId) => entityId
    ? (hass?.states?.[entityId] ?? (config?.demo ? appleTvDemoState(entityId) : null))
    : null;
  const media = state(entities.media), remote = state(entities.remote), keyboard = state(entities.keyboard);
  const raw = String(media?.state || "unknown").toLowerCase();
  const available = appleTvValid(media);
  const sleeping = available && ["off", "standby"].includes(raw);
  const awake = available && !sleeping;
  const attrs = media?.attributes || {};
  const commands = Array.isArray(remote?.attributes?.supported_commands)
    ? new Set(remote.attributes.supported_commands)
    : null;
  const remoteUsable = appleTvValid(remote);
  const remoteCan = (command) => remoteUsable && (!commands || commands.has(command));
  const level = Number(attrs.volume_level);
  const hasLevel = Number.isFinite(level) && level >= 0 && level <= 1;
  const playing = awake && raw === "playing";
  const paused = awake && raw === "paused";
  const idle = awake && ["idle", "on", "buffering"].includes(raw);
  const sources = Array.isArray(attrs.source_list)
    ? [...new Set(attrs.source_list
      .filter((source) => typeof source === "string")
      .map((source) => source.trim())
      .filter(Boolean))]
    : [];
  const keyboardFocused = awake && appleTvValid(keyboard) && String(keyboard.state).toLowerCase() === "on";

  return Object.freeze({
    entities,
    media,
    remote,
    available,
    awake,
    sleeping,
    playing,
    paused,
    idle,
    sources,
    currentSource: attrs.app_name || attrs.source || null,
    level: hasLevel ? level : null,
    muted: attrs.is_volume_muted === true,
    canWake: sleeping && remoteCan("wakeup"),
    canSleep: awake && remoteCan("suspend"),
    canNavigate: awake && remoteUsable && APPLE_TV_NAV.some(([command]) => remoteCan(command)),
    canPlay: awake && (paused || idle) && appleTvSupported(media, APPLE_TV_FEATURES.PLAY),
    canPause: playing && appleTvSupported(media, APPLE_TV_FEATURES.PAUSE),
    canStop: (playing || paused) && appleTvSupported(media, APPLE_TV_FEATURES.STOP),
    canPrevious: (playing || paused) && appleTvSupported(media, APPLE_TV_FEATURES.PREVIOUS),
    canNext: (playing || paused) && appleTvSupported(media, APPLE_TV_FEATURES.NEXT),
    canVolumeUp: awake && appleTvSupported(media, APPLE_TV_FEATURES.STEP_VOLUME),
    canVolumeDown: awake && appleTvSupported(media, APPLE_TV_FEATURES.STEP_VOLUME),
    canMute: awake && appleTvSupported(media, APPLE_TV_FEATURES.MUTE),
    canSelectSource: awake && sources.length > 0 && appleTvSupported(media, APPLE_TV_FEATURES.SOURCE),
    keyboardFocused,
    canSetKeyboardText: keyboardFocused && Boolean(entities.configEntryId),
    canAppendKeyboardText: keyboardFocused && Boolean(entities.configEntryId),
    canClearKeyboardText: keyboardFocused && Boolean(entities.configEntryId),
    status: !available
      ? raw === "unknown" ? "Status unknown" : "Apple TV unavailable"
      : [
        sleeping ? "Sleeping" : playing ? "Playing" : paused ? "Paused" : idle ? "Idle" : appleTvLabel(raw),
        attrs.app_name || attrs.source,
      ].filter(Boolean).join(" · "),
  });
};

Object.assign(appleShared, {
  APPLE_TV_FEATURES,
  APPLE_TV_NAV,
  appleTvAppIcon,
  appleTvDiscovery,
  appleTvLabel,
  appleTvModel,
  appleTvSupported,
  appleTvValid,
});
