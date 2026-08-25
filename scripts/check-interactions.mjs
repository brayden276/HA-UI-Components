import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  publicComponents,
  publicComponentContracts,
  supportedComponentCategories,
} from "./public-components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const allowedInteractionModes = new Set([
  "none",
  "shared",
  "shared-optional",
  "native-continuous",
  "delegated",
]);
const categorySet = new Set(supportedComponentCategories);
const failures = [];

const fail = (file, message) => failures.push(`${file}: ${message}`);

const directServiceBinding = (source) => {
  const patterns = [
    /\.onclick\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*[^;\n]{0,300}\bcallService\s*\(/g,
    /addEventListener\(\s*["']click["']\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*[^;\n]{0,300}\bcallService\s*\(/g,
  ];
  return patterns.some((pattern) => pattern.test(source));
};

const hasLiteralHoldAndRepeat = (source) => {
  const calls = source.match(/interaction\([\s\S]{0,900}?\}\s*\)/g) ?? [];
  return calls.some(
    (call) =>
      /\bhold\s*:\s*(?!(?:null|false|!1)\b)[^,\s}]/.test(call) &&
      /\brepeat\s*:\s*(?!(?:false|null|!1)\b)[^,\s}]/.test(call),
  );
};

const checkIconOnlyButtons = (file, source) => {
  for (const match of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const attrs = match[1];
    const body = match[2];
    if (!/<ha-icon\b/i.test(body)) continue;
    const literalIconOnly = /^(?:\s*<ha-icon\b[^>]*>(?:\s*<\/ha-icon>)?\s*)+$/i.test(body);
    if (!literalIconOnly) continue;
    if (/\b(?:aria-label|aria-labelledby|title)\s*=/.test(attrs)) continue;
    const className = /\bclass=["']([^"']+)/.exec(attrs)?.[1]?.split(/\s+/)[0];
    if (
      className &&
      new RegExp(
        String.raw`(?:\.${className}|\[['"]\.${className}['"]\]|\[['"]${className}['"]\])[\s\S]{0,260}?setAttribute\(\s*["']aria-label["']`,
      ).test(source)
    ) {
      continue;
    }
    fail(file, `icon-only button${className ? ` .${className}` : ""} has no accessible name`);
  }
};

for (const [file] of publicComponents) {
  const source = await readFile(resolve(root, file), "utf8");
  const contract = publicComponentContracts[file];
  if (!contract) {
    fail(file, "missing public-component interaction contract");
    continue;
  }
  if (!categorySet.has(contract.category)) {
    fail(file, `unsupported component category ${contract.category}`);
  }
  if (!allowedInteractionModes.has(contract.interaction)) {
    fail(file, `unsupported interaction mode ${contract.interaction}`);
  }

  const usesInteraction = /\binteraction\s*\(/.test(source);
  if (
    ["shared", "shared-optional", "native-continuous"].includes(contract.interaction) &&
    !usesInteraction
  ) {
    fail(file, `${contract.interaction} component does not use interaction()`);
  }
  if (contract.interaction === "none" && usesInteraction) {
    fail(file, "non-interactive component unexpectedly uses interaction()");
  }
  if (contract.interaction === "none" && /<button\b/.test(source)) {
    fail(file, "non-interactive component contains button semantics");
  }

  if (hasLiteralHoldAndRepeat(source)) {
    fail(file, "interaction() config contains simultaneous hold and repeat");
  }
  if (directServiceBinding(source)) {
    fail(file, "click handler calls Home Assistant service directly; route the control through interaction()/an action method");
  }
  if (/\bcallService\s*\(/.test(source) && !usesInteraction && contract.interaction !== "delegated") {
    fail(file, "service-calling component has no shared interaction boundary");
  }

  if (/\bsetInterval\s*\(/.test(source) && !/\bclearInterval\s*\(/.test(source)) {
    fail(file, "starts an interval without a clearInterval cleanup path");
  }
  if (/\bsetTimeout\s*\(/.test(source) && !/\bclearTimeout\s*\(/.test(source)) {
    fail(file, "starts a timeout without a clearTimeout cleanup path");
  }
  if (
    /\b(?:subscribe|subscribeEvents)\s*\(/.test(source) &&
    !/disconnectedCallback\s*\(/.test(source)
  ) {
    fail(file, "opens a subscription without disconnectedCallback cleanup");
  }
  if (
    /(?:window|globalThis)\.addEventListener\s*\(/.test(source) &&
    !/(?:window|globalThis)\.removeEventListener\s*\(/.test(source)
  ) {
    fail(file, "registers a global listener without a matching removal path");
  }

  checkIconOnlyButtons(file, source);
}

if (failures.length) {
  throw new Error(`Interaction contract failures:\n${failures.join("\n")}`);
}

console.log(
  `Interaction contract check passed: ${publicComponents.length} public components classified and validated`,
);
