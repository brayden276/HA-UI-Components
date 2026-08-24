import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publicComponentFiles } from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentDirectory = resolve(root, "src/components");
const componentFiles = (await readdir(componentDirectory))
  .filter((file) => file.endsWith(".js"))
  .sort();
const expectedFiles = publicComponentFiles.map((file) => file.replace("src/components/", "")).sort();

if (JSON.stringify(componentFiles) !== JSON.stringify(expectedFiles)) {
  const missing = expectedFiles.filter((file) => !componentFiles.includes(file));
  const extra = componentFiles.filter((file) => !expectedFiles.includes(file));
  throw new Error(`Public component inventory mismatch; missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`);
}

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
if (!appleTvController.includes(":is(button,input,.identity):focus-visible")) {
  throw new Error("Apple TV identity control must retain a visible keyboard focus treatment");
}
if (!appleTvController.includes("const keyboardState = active?.classList?.contains(\"keyboard-input\")")) {
  throw new Error("Apple TV panel refresh must preserve in-progress keyboard input");
}

console.log(`Maintainability check passed: ${componentFiles.length} descriptively named component modules use shared helpers`);
