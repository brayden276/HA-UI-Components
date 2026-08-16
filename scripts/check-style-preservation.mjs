import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"),
);
const baseline = JSON.parse(
  await readFile(
    resolve(root, "src/provenance/style-fingerprints.json"),
    "utf8",
  ),
);

const sources = await Promise.all(
  manifest.map(async (entry) => ({
    file: entry.file,
    source: await readFile(resolve(root, entry.file), "utf8"),
  })),
);
const combined = sources.map(({ source }) => source).join("\n");

const normalise = (value) =>
  value
    .replaceAll("${B}", "${PRESENTATIONAL_CARD_STYLES}")
    .replaceAll("${this.b()}", "${this.cardStyles()}")
    .replaceAll("${UB}", "${UPDATE_CARD_STYLES}")
    .replaceAll("${UE(", "${escapeHtml(")
    .replaceAll("${STEsc(", "${escapeHtml(")
    .replaceAll("${X(", "${escapeHtml(");

const fragments = [];
for (const { file, source } of sources) {
  for (const match of source.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    fragments.push({
      kind: "style-tag",
      source: file,
      value: normalise(match[1]),
    });
  }
}

const namedPatterns = [
  [
    "presentational-card-styles",
    /const PRESENTATIONAL_CARD_STYLES\s*=\s*(`[\s\S]*?`);/,
  ],
  [
    "dashboard-base-card-styles",
    /cardStyles\(\)\s*\{\s*return\s*(`[\s\S]*?`);\s*\}/,
  ],
  ["update-card-styles", /const UPDATE_CARD_STYLES\s*=\s*("[\s\S]*?");/],
  [
    "dashboard-style-tokens",
    /dashboardSharedStyle\.textContent\s*=\s*("[\s\S]*?");/,
  ],
];

for (const [name, pattern] of namedPatterns) {
  const value = combined.match(pattern)?.[1];
  if (!value) throw new Error(`Missing shared style primitive: ${name}`);
  fragments.push({
    kind: "shared-style",
    source: name,
    value: normalise(value.slice(1, -1)),
  });
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

for (const expected of baseline.fingerprints) {
  const key = `${expected.kind}:${expected.hash}`;
  const actualCount = current.get(key) ?? 0;
  if (actualCount < expected.count) {
    throw new Error(
      `Style fingerprint changed: ${expected.example_source} (${actualCount}/${expected.count})`,
    );
  }
}

console.log(
  `Style preservation check passed: ${baseline.fragment_count} original fragments`,
);



