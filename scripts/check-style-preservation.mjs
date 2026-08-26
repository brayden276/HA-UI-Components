import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const manifest = JSON.parse(await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"));
const baseline = JSON.parse(await readFile(resolve(root, "src/provenance/style-fingerprints.json"), "utf8"));

const sources = await Promise.all(
  manifest.map(async (entry) => ({
    file: entry.file,
    source: await readFile(resolve(root, entry.file), "utf8"),
  })),
);
const combined = sources.map(({ source }) => source).join("\n");

const normalise = (value) =>
  value
    .replaceAll("\r\n", "\n")
    .replaceAll("${B}", "${PRESENTATIONAL_CARD_STYLES}")
    .replaceAll("${this.b()}", "${this.cardStyles()}")
    .replaceAll("${UB}", "${UPDATE_CARD_STYLES}")
    .replaceAll("${UE(", "${escapeHtml(")
    .replaceAll("${STEsc(", "${escapeHtml(")
    .replaceAll("${X(", "${escapeHtml(");

const fragments = [];
for (const { file, source } of sources) {
  for (const match of source.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    fragments.push({ kind: "style-tag", source: file, value: normalise(match[1]) });
  }
  for (const match of source.matchAll(/style\.textContent\s*=\s*`([\s\S]*?)`;/g)) {
    fragments.push({ kind: "runtime-style", source: file, value: normalise(match[1]) });
  }
  for (const match of source.matchAll(/s\.textContent='([\s\S]*?)';r\.append\(s\)/g)) {
    fragments.push({ kind: "runtime-style", source: file, value: normalise(match[1]) });
  }
}

const namedPatterns = [
  ["presentational-card-styles", /const PRESENTATIONAL_CARD_STYLES\s*=\s*(`[^]*?`);/],
  ["dashboard-base-card-styles", /cardStyles\(\)\s*\{\s*return\s*(`[^]*?`);\s*\}/],
  ["update-card-styles", /const UPDATE_CARD_STYLES\s*=\s*("[^]*?");/],
  ["dashboard-style-tokens", /dashboardSharedStyle\.textContent\s*=\s*("[^]*?");/],
];

for (const [name, pattern] of namedPatterns) {
  const value = combined.match(pattern)?.[1];
  if (!value) throw new Error(`Missing shared style primitive: ${name}`);
  fragments.push({ kind: "shared-style", source: name, value: normalise(value.slice(1, -1)) });
}

const fnv1a64 = (value) => {
  let hash = 14695981039346656037n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, "0");
};

const current = new Map();
for (const fragment of fragments) {
  const key = `${fragment.kind}:${fnv1a64(fragment.value)}`;
  current.set(key, (current.get(key) ?? 0) + 1);
}

// These fragments belonged only to the retired Split settings/profile/controller UI.
const retiredFingerprints = new Set([
  "style-tag:c1c20682b0902410",
  "style-tag:ef155a077154f88a",
  "runtime-style:199b56fdeed1bbd1",
]);

const drift = [];
for (const expected of baseline.fingerprints) {
  const key = `${expected.kind}:${expected.hash}`;
  if (retiredFingerprints.has(key)) continue;
  const actualCount = current.get(key) ?? 0;
  if (actualCount < expected.count) {
    drift.push(`${expected.example_source} (${actualCount}/${expected.count}; ${key})`);
  }
}

if (drift.length) {
  const message = `Style fingerprint drift: ${drift.join(", ")}`;
  if (strict) throw new Error(message);
  console.warn(`${message}. Advisory only; run with --strict to make it blocking.`);
} else {
  console.log("Style preservation check passed: non-retired accepted fragments are unchanged");
}
