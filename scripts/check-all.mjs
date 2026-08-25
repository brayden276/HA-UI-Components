import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
  ["--check", "dist/ha-component-library.js"],
  ["scripts/check-inventory.mjs"],
  ["scripts/check-maintainability.mjs"],
  ["scripts/check-interactions.mjs"],
  ["scripts/check-interaction-runtime.mjs"],
  ["scripts/check-single-kpi.mjs"],
  ["scripts/check-navigation-tile.mjs"],
  ["scripts/check-section-separator.mjs"],
  ["scripts/check-empty-state.mjs"],
  ["scripts/check-notice.mjs"],
  ["scripts/check-progress.mjs"],
  ["scripts/check-status-row.mjs"],
  ["scripts/check-action.mjs"],
  ["scripts/check-async-broker.mjs"],
  ["scripts/check-component-models.mjs"],
  ["scripts/check-polish-contracts.mjs"],
  ["scripts/check-backend-preferences.mjs"],
  ["scripts/check-style-preservation.mjs"],
  ["scripts/check-load-order.mjs"],
  ["scripts/check-runtime-contracts.mjs"],
  ["scripts/check-release-contract.mjs"],
];

for (const args of checks) {
  execFileSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
}
