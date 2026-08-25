import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export function composeBundle({ version, manifest, modules }) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`package.json version must be major.minor.patch, received ${version}`);
  }
  if (!Array.isArray(manifest) || !Array.isArray(modules) || manifest.length !== modules.length) {
    throw new Error("Bundle composition requires one source module for every manifest entry");
  }

  const componentCount = manifest.filter((entry) => entry.file.startsWith("src/components/")).length;
  let output = `/**\n * HA Component Library v${version}\n * Generated HACS Dashboard bundle.\n *\n * Source is organised by component under src/components. Shared logic lives\n * under src/shared. Existing component CSS and runtime behaviour are preserved.\n */\n\n`;

  for (let index = 0; index < manifest.length; index += 1) {
    const entry = manifest[index];
    const module = modules[index];
    if (entry.file !== module.file) {
      throw new Error(`Bundle composition order mismatch at index ${index}: ${entry.file} !== ${module.file}`);
    }
    output += `// Module: ${entry.file}\n{\n${module.source.trimEnd()}\n}\n\n`;
  }
  return `${output}globalThis.__HA_COMPONENT_LIBRARY__ = Object.freeze({ version: ${JSON.stringify(version)}, components: ${componentCount} });\n`;
}

export async function readBundleInputs(root) {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const manifest = JSON.parse(await readFile(resolve(root, "src/bundle-manifest.json"), "utf8"));
  const modules = await Promise.all(manifest.map(async (entry) => ({
    file: entry.file,
    source: await readFile(resolve(root, entry.file), "utf8"),
  })));
  return { version: packageJson.version, manifest, modules };
}

export async function composeBundleFromSource(root) {
  return composeBundle(await readBundleInputs(root));
}
