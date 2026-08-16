import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentDirectory = resolve(root, "src/components");
const componentFiles = (await readdir(componentDirectory))
  .filter((file) => file.endsWith(".js"))
  .sort();

if (componentFiles.length !== 28) {
  throw new Error(`Expected 28 public component files; found ${componentFiles.length}`);
}

const forbiddenComponentImplementations = [
  ["hass-more-info", "openMoreInfo"],
  ["history.pushState", "navigateTo"],
  ["replace(/[&<>\"']", "escapeHtml"],
];

for (const file of componentFiles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.js$/.test(file)) {
    throw new Error(`Component filename is not descriptive kebab-case: ${file}`);
  }

  const source = await readFile(resolve(componentDirectory, file), "utf8");
  for (const [implementation, helper] of forbiddenComponentImplementations) {
    if (source.includes(implementation)) {
      throw new Error(
        `${file} implements shared behaviour directly; use ${helper} instead`,
      );
    }
  }
}

const dashboardRuntime = await readFile(
  resolve(root, "src/shared/dashboard-runtime.js"),
  "utf8",
);
if (dashboardRuntime.includes("replace(/[&<>\"']")) {
  throw new Error("dashboard-runtime.js must use the shared escapeHtml helper");
}

const core = await readFile(resolve(root, "src/shared/core.js"), "utf8");
for (const helper of ["escapeHtml", "navigateTo", "openMoreInfo", "registerCard"]) {
  if (!core.includes(`${helper},`)) {
    throw new Error(`Shared core does not export ${helper}`);
  }
}

console.log(
  `Maintainability check passed: ${componentFiles.length} descriptively named component modules use shared helpers`,
);
