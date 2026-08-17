import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
  ["--check", "dist/ha-component-library.js"],
  ["scripts/check-inventory.mjs"],
  ["scripts/check-maintainability.mjs"],
  ["scripts/check-style-preservation.mjs"],
  ["scripts/check-load-order.mjs"],
  ["scripts/check-runtime-contracts.mjs"],
];

for (const args of checks) {
  execFileSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
}
