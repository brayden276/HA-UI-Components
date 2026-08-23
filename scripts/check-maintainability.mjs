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

console.log(`Maintainability check passed: ${componentFiles.length} descriptively named component modules use shared helpers`);
