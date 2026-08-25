import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const categories = [
  ["source syntax/policy", "scripts/check-source.mjs"],
  ["component contracts", "scripts/check-components.mjs"],
  ["shared runtime contracts", "scripts/check-interaction-runtime.mjs"],
  ["shared component harness", "scripts/check-component-harness.mjs"],
  ["style/provenance", "scripts/check-style-preservation.mjs"],
  ["in-memory bundle/load-order", "scripts/check-load-order.mjs"],
  ["generated-artifact freshness/release checks", "scripts/check-bundle-freshness.mjs"],
  ["generated-artifact release contract", "scripts/check-release-contract.mjs"],
];
for (const [label, file, args = []] of categories) {
  console.log(`Validation category: ${label}`);
  execFileSync(process.execPath, [file, ...args], { cwd: root, stdio: "inherit" });
}
