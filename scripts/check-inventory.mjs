import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await readFile(
  resolve(root, "dist/ha-component-library.js"),
  "utf8",
);
const manifest = JSON.parse(
  await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"),
);

const expected = [
  ["component-context-strip-v3", "ComponentContextStripV3"],
  ["component-energy-day-selector-v1", "ComponentEnergyDaySelectorV1"],
  ["metric-pair-card-v3", "ComponentMetricPairCardV3"],
  ["component-history-graph-v2", "ComponentHistoryGraphV2"],
  ["component-single-kpi-v2", "ComponentSingleKpiV2"],
  ["component-three-stat-v2", "ComponentThreeStatV2"],
  ["component-status-row-v2", "ComponentStatusRowV2"],
  ["component-progress-v2", "ComponentProgressV2"],
  ["component-action-v2", "ComponentActionV2"],
  ["component-list-v2", "ComponentListV2"],
  ["component-notice-v2", "ComponentNoticeV2"],
  ["component-quick-nav-v2", "ComponentQuickNavigationV2"],
  ["component-favourites-v3", "ComponentFavouritesV3"],
  ["component-nav-tile-v2", "ComponentNavigationTileV2"],
  ["component-room-navigation-v1", "ComponentRoomNavigationV1"],
  ["component-control-row-v2", "ComponentControlRowV2"],
  ["component-split-controller-v4", "ComponentSplitControllerV4"],
  ["component-media-row-v2", "ComponentMediaRowV2"],
  ["component-section-separator-v2", "ComponentSectionSeparatorV2"],
  ["component-room-sheet-v2", "ComponentRoomSheetV2"],
  ["component-update-summary-v3", "ComponentUpdateSummaryV3"],
  ["component-update-row-v3", "ComponentUpdateRowV3"],
  ["component-empty-state-v3", "ComponentEmptyStateV3"],
  ["component-device-discovery-v2", "ComponentDeviceDiscoveryV2"],
  ["component-text-effect-v1", "ComponentTextEffectV1"],
  ["component-household-attention-v1", "ComponentHouseholdAttentionV1"],
  ["component-welcome-header-v1", "ComponentWelcomeHeaderV1"],
  ["component-wled-controller-v1", "ComponentWledControllerV1"],
  ["component-garage-door-controller-v1", "ComponentGarageDoorControllerV1"],
  ["component-camera-controller-v1", "ComponentCameraControllerV1"],
  ["component-smart-collection-v3", "ComponentSmartCollectionV3"],
  ["component-household-directory-v3", "ComponentHouseholdDirectoryV3"],
  ["component-favourites-minimal-v1", "ComponentFavouritesMinimalV1"],
  ["component-room-directory-v4", "ComponentRoomDirectoryV4"],
  ["component-home-overview-v4", "ComponentHomeOverviewV4"],
  ["solar-daylight-card-v7", "SolarDaylightCardV7"],
  ["energy-history-card-v3", "EnergyHistoryCardV3"],
];

const componentEntries = manifest.filter((entry) =>
  entry.file.startsWith("src/components/"),
);
if (componentEntries.length !== expected.length) {
  throw new Error(
    `Expected ${expected.length} component modules, found ${componentEntries.length}`,
  );
}

const normalisedBundle = bundle.replace(/\r\n/g, "\n");
const registrations = new Map();

for (const entry of manifest) {
  const source = await readFile(resolve(root, entry.file), "utf8");
  new vm.Script(source, { filename: entry.file });

  const normalisedSource = source.replace(/\r\n/g, "\n").trimEnd();
  if (!normalisedBundle.includes(normalisedSource)) {
    throw new Error(`Bundle does not contain module source: ${entry.file}`);
  }

  for (const match of source.matchAll(
    /registerCard\(\{\s*type:\s*["']([^"']+)["'][\s\S]*?element:\s*([A-Za-z0-9_$]+)/g,
  )) {
    registrations.set(match[1], [
      ...(registrations.get(match[1]) ?? []),
      { element: match[2], file: entry.file },
    ]);
  }
  for (const match of source.matchAll(
    /if\(!customElements\.get\('([^']+)'\)\)customElements\.define\('\1',([A-Za-z0-9_$]+)\);window\.customCards=/g,
  )) {
    registrations.set(match[1], [
      ...(registrations.get(match[1]) ?? []),
      { element: match[2], file: entry.file },
    ]);
  }
}

for (const [type, element] of expected) {
  const matches = registrations.get(type) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `Expected one registration for ${type}; found ${matches.length}`,
    );
  }
  if (matches[0].element !== element) {
    throw new Error(
      `Expected ${type} to use ${element}; found ${matches[0].element}`,
    );
  }
}

const firstComponent = manifest.findIndex((entry) =>
  entry.file.startsWith("src/components/"),
);
const lastShared = manifest.findLastIndex((entry) =>
  entry.file.startsWith("src/shared/"),
);
const firstPatch = manifest.findIndex((entry) =>
  entry.file.startsWith("src/patches/"),
);
if (lastShared >= firstComponent || firstPatch <= firstComponent) {
  throw new Error("Bundle dependency order is invalid");
}

if (!bundle.includes("components: 37")) {
  throw new Error("Bundle metadata does not declare all 37 components");
}

console.log(`Inventory check passed: ${expected.length} components`);
console.log(`Module syntax and bundle-presence check passed: ${manifest.length} modules`);
