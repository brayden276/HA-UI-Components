import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publicComponentFiles } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentDirectory = resolve(root, "src/components");
const componentFiles = publicComponentFiles.map((file) => file.replace("src/components/", ""));

const forbiddenComponentImplementations = [
  ["hass-more-info", "openMoreInfo"],
  ["history.pushState", "navigateTo"],
  ["replace(/[&<>\"']", "escapeHtml"],
];
const exactLiveCompositionModules = new Set(["home-overview.js", "room-directory.js"]);

for (const file of componentFiles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.js$/.test(file)) {
    throw new Error(`Component filename is not descriptive kebab-case: ${file}`);
  }
  const source = await readFile(resolve(componentDirectory, file), "utf8");
  if (/set\s+hass\s*\([^)]*\)\s*\{\s*this\.hass\s*=/.test(source)) {
    throw new Error(`${file} recursively assigns through its own hass setter`);
  }
  for (const [implementation, helper] of forbiddenComponentImplementations) {
    if (source.includes(implementation) && !exactLiveCompositionModules.has(file)) {
      throw new Error(`${file} implements shared behaviour directly; use ${helper} instead`);
    }
  }
}

const dashboardRuntime = await readFile(resolve(root, "src/shared/dashboard-runtime.js"), "utf8");
if (dashboardRuntime.includes("replace(/[&<>\"']")) {
  throw new Error("dashboard-runtime.js must use the shared escapeHtml helper");
}
for (const retiredDiscovery of ["appleTvRegistry", "splitBundle", "splitRegistryConfig"]) {
  if (dashboardRuntime.includes(retiredDiscovery)) {
    throw new Error(`dashboard-runtime.js must not reintroduce ${retiredDiscovery}`);
  }
}

const core = await readFile(resolve(root, "src/shared/core.js"), "utf8");
for (const helper of ["escapeHtml", "navigateTo", "openMoreInfo", "registerCard"]) {
  if (!core.includes(`${helper},`)) throw new Error(`Shared core does not export ${helper}`);
}
const interactions = await readFile(resolve(root, "src/shared/interaction.js"), "utf8");
for (const helper of ["interaction", "createRequestCoalescer"]) {
  if (!interactions.includes(`${helper},`)) throw new Error(`Shared interaction runtime does not export ${helper}`);
}

const cameraController = await readFile(resolve(componentDirectory, "camera-controller.js"), "utf8");
const cameraRenderControls = cameraController.slice(cameraController.indexOf("renderControls()"));
const signatureGuard = cameraRenderControls.indexOf("if (signature === this.controlsSignature) return;");
const dynamicTeardown = cameraRenderControls.indexOf("for (const handle of this.controlInteractions) handle.destroy();", signatureGuard);
if (signatureGuard < 0 || dynamicTeardown < signatureGuard) {
  throw new Error("camera-controller.js must retain live control interactions when its render signature is unchanged");
}

const appleTvController = await readFile(resolve(componentDirectory, "component-apple-tv-controller-v1.js"), "utf8");
for (const nativeFeature of ["media-player-playback", "media-player-volume-buttons", "media-player-source"]) {
  if (!appleTvController.includes(nativeFeature)) {
    throw new Error(`Apple TV controller must delegate ${nativeFeature} to a native Home Assistant tile`);
  }
}
for (const retiredAppleRuntime of ["appleTvModel", "createRequestCoalescer", "supported_features", "optimisticVolume"]) {
  if (appleTvController.includes(retiredAppleRuntime)) {
    throw new Error(`Apple TV controller must not reintroduce ${retiredAppleRuntime}`);
  }
}
if (!appleTvController.includes("remote_entity") || !appleTvController.includes('command:')) {
  throw new Error("Apple TV remote navigation must target an explicit Remote entity");
}

const splitController = await readFile(resolve(componentDirectory, "split-system-controller.js"), "utf8");
for (const nativeFeature of ["target-temperature", "climate-hvac-modes", "climate-fan-modes", "select-options"]) {
  if (!splitController.includes(nativeFeature)) {
    throw new Error(`Split controller must delegate ${nativeFeature} to native Home Assistant cards`);
  }
}
for (const retiredSplitRuntime of ["ha_component_backend", "minimum_target", "maximum_target", "fan_ceiling", "set_temperature", "set_timer"]) {
  if (splitController.includes(retiredSplitRuntime)) {
    throw new Error(`Split controller must not reintroduce ${retiredSplitRuntime}`);
  }
}

console.log(`Maintainability check passed: ${componentFiles.length} public component modules use shared/native helpers`);
