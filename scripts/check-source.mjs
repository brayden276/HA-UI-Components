import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readBundleInputs } from "./bundle-composition.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (label, file, args = []) => {
  console.log(`Source validation: ${label}`);
  execFileSync(process.execPath, [file, ...args], { cwd: root, stdio: "inherit" });
};

const { modules } = await readBundleInputs(root);
for (const { file } of modules) run(`syntax ${file}`, "--check", [file]);

const categories = [
  ["manifest/source inventory", "scripts/check-inventory.mjs"],
  ["maintainability rules", "scripts/check-maintainability.mjs"],
  ["interaction policies", "scripts/check-interactions.mjs"],
  ["shared interaction runtime", "scripts/check-interaction-runtime.mjs"],
  ["shared async runtime", "scripts/check-async-broker.mjs"],
  ["shared backend preferences", "scripts/check-backend-preferences.mjs"],
  ["shared dashboard discovery", "scripts/check-dashboard-discovery.mjs"],
  ["shared component models", "scripts/check-component-models.mjs"],
  ["shared component harness", "scripts/check-component-harness.mjs"],
  ["component contracts", "scripts/check-components.mjs"],
  ["shared lifecycle and reconnect contracts", "scripts/check-runtime-contracts.mjs"],
  ["style provenance", "scripts/check-style-preservation.mjs"],
  ["presentation compatibility", "scripts/check-polish-contracts.mjs"],
  ["in-memory bundle/load order", "scripts/check-load-order.mjs"],
];
for (const [label, file, args] of categories) run(label, file, args);

console.log(`Source validation passed: ${modules.length} source modules and stable component contracts; no generated artefact was read or written`);
