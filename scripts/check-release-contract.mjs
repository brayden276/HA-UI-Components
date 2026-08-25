import { access, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeBundleFromSource } from "./bundle-composition.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = resolve(root, "package.json");
const hacsPath = resolve(root, "hacs.json");
const manifestPath = resolve(root, "src/bundle-manifest.json");

const fail = (message) => {
  console.error(`Release contract failed: ${message}`);
  process.exit(1);
};

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const hacsJson = JSON.parse(await readFile(hacsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`package.json version must be major.minor.patch, received ${version}`);
}

if (typeof hacsJson.filename !== "string" || !hacsJson.filename.trim()) {
  fail("hacs.json must define a non-empty filename");
}

const bundleCandidates = [
  resolve(root, hacsJson.filename),
  resolve(root, "dist", hacsJson.filename),
];
let bundlePath = null;
for (const candidate of bundleCandidates) {
  try {
    await access(candidate);
    bundlePath = candidate;
    break;
  } catch {
    // Try the next supported HACS layout.
  }
}
if (!bundlePath) {
  fail(`generated bundle ${hacsJson.filename} was not found in the repository root or dist/`);
}

const bundle = await readFile(bundlePath, "utf8");
const expectedBundle = await composeBundleFromSource(root);
if (bundle !== expectedBundle) {
  fail("generated bundle does not exactly match the current ordered source composition");
}
const publicComponentCount = manifest.filter((entry) =>
  entry.file.startsWith("src/components/"),
).length;
const metadataMatch = bundle.match(
  /globalThis\.__HA_COMPONENT_LIBRARY__\s*=\s*Object\.freeze\(\{\s*version:\s*("(?:\\.|[^"])*"),\s*components:\s*(\d+)\s*\}\)/,
);

if (!metadataMatch) {
  fail("bundle metadata marker is missing");
}

const bundleVersion = JSON.parse(metadataMatch[1]);
const bundleComponentCount = Number(metadataMatch[2]);
if (bundleVersion !== version) {
  fail(`bundle version ${bundleVersion} does not match package.json ${version}`);
}
if (bundleComponentCount !== publicComponentCount) {
  fail(
    `bundle component count ${bundleComponentCount} does not match manifest count ${publicComponentCount}`,
  );
}
if (!bundle.includes(`HA Component Library v${version}`)) {
  fail(`bundle header does not contain version ${version}`);
}

const missingModules = manifest
  .map((entry) => entry.file)
  .filter((file) => !bundle.includes(`// Module: ${file}`));
if (missingModules.length) {
  fail(`bundle is missing manifest modules: ${missingModules.join(", ")}`);
}

console.log(
  `Release contract passed: v${version}, ${publicComponentCount} public components, ${manifest.length} modules.`,
);
