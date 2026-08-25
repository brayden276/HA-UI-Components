import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeBundleFromSource } from "./bundle-composition.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = resolve(root, "dist/ha-component-library.js");
try {
  await access(bundlePath);
} catch {
  throw new Error("Generated bundle freshness cannot be checked because dist/ha-component-library.js is absent. Run the explicit bundle command only at the release boundary.");
}
const expected = await composeBundleFromSource(root);
const actual = await readFile(bundlePath, "utf8");
if (actual !== expected) throw new Error("Generated bundle is stale: dist/ha-component-library.js does not exactly match the ordered current source composition");
console.log("Generated bundle freshness check passed: distributable exactly matches current source composition");
