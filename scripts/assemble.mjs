import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeBundle, readBundleInputs } from "./bundle-composition.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inputs = await readBundleInputs(root);
const output = composeBundle(inputs);

const destination = resolve(root, "dist/ha-component-library.js");
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, output, "utf8");
console.log(`Wrote ${destination}`);
