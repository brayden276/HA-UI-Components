import { execFileSync } from "node:child_process";
import { access, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = resolve(root, "package.json");
const distPath = resolve(root, "dist/ha-component-library.js");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bumpKinds = args.filter((arg) => !arg.startsWith("--"));
const bumpKind = bumpKinds[0] || "patch";

if (bumpKinds.length > 1 || !["major", "minor", "patch"].includes(bumpKind)) {
  console.error(
    "Usage: npm run release [-- major|minor|patch] [--dry-run]",
  );
  process.exit(1);
}

const run = (label, command, commandArgs) => {
  console.log(`\n== ${label} ==`);
  execFileSync(command, commandArgs, { cwd: root, stdio: "inherit" });
};

const runCapture = (command, commandArgs) =>
  execFileSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const bumpVersion = (version, kind) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(
      `package.json version must be major.minor.patch, received ${version}`,
    );
  }
  let [major, minor, patch] = match.slice(1).map(Number);
  if (kind === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (kind === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
};

const status = () => {
  try {
    return runCapture("git", ["status", "--porcelain=v1"]).trim();
  } catch {
    return "(git status unavailable)";
  }
};

const assertRequiredFiles = async () => {
  for (const file of [
    "package.json",
    "hacs.json",
    "src/bundle-manifest.json",
    "scripts/assemble.mjs",
    "scripts/check-all.mjs",
  ]) {
    await access(resolve(root, file));
  }
};

const packageJson = await readJson(packagePath);
const nextVersion = bumpVersion(packageJson.version, bumpKind);
await assertRequiredFiles();

run("Pre-release whitespace and merge-state check", "git", ["diff", "--check"]);
const statusBefore = status();
if (/^(AA|AU|DD|DU|UA|UD|UU) /m.test(statusBefore)) {
  throw new Error("unresolved merge conflicts are present; resolve them before releasing");
}

console.log(`Release target: ${packageJson.version} -> ${nextVersion} (${bumpKind})`);
if (statusBefore) {
  console.log("Existing working-tree changes will be preserved; this command does not stage or commit files.");
}

if (dryRun) {
  console.log("Dry run complete. No files were changed and no bundle was generated.");
  process.exit(0);
}

const originalPackage = await readFile(packagePath);
let originalDist = null;
try {
  originalDist = await readFile(distPath);
} catch {
  // The build will create it; a failed build simply leaves no generated file to restore.
}

await writeFile(
  packagePath,
  `${JSON.stringify({ ...packageJson, version: nextVersion }, null, 2)}\n`,
  "utf8",
);

try {
  run("Assemble HACS bundle", process.execPath, ["scripts/assemble.mjs"]);
  run("Run repository validation", process.execPath, ["scripts/check-all.mjs"]);
  run("Final whitespace check", "git", ["diff", "--check"]);

  const finalStatus = status();
  console.log(`\nRelease preparation complete for v${nextVersion}.`);
  console.log("Review the diff, commit/tag it, and push it when ready.");
  console.log("No git commit, tag or push was performed.");
  if (finalStatus) console.log(`\nWorking tree:\n${finalStatus}`);
} catch (error) {
  await writeFile(packagePath, originalPackage);
  if (originalDist) await writeFile(distPath, originalDist);
  else await rm(distPath, { force: true });
  console.error("\nRelease preparation failed; package.json and the generated bundle were restored.");
  throw error;
}
