import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const designRoot = process.env.COHESION_DESIGN_ROOT || "D:\\Work\\dawi\\design";
const projectRoot = process.cwd();
const designPackagePath = join(designRoot, "package.json");
const brandPath = join(designRoot, "theme", "cohesion-theme.json");
const themeModulePath = join(designRoot, "theme", "create-theme.mjs");
const sourceTokensPath = join(designRoot, "preview", "shadcn", "tokens.css");
const outputDir = join(projectRoot, "src", "theme");

let designPackage;
let brand;
let themeModule;
let shadcnTokensCss;
try {
  [designPackage, brand, shadcnTokensCss] = await Promise.all([
    readFile(designPackagePath, "utf8").then(JSON.parse),
    readFile(brandPath, "utf8").then(JSON.parse),
    readFile(sourceTokensPath, "utf8"),
  ]);
  themeModule = await import(pathToFileURL(themeModulePath).href);
} catch (error) {
  throw new Error(
    `Unable to read the COHESION design system at ${designRoot}. Set COHESION_DESIGN_ROOT to its checkout.`,
    { cause: error },
  );
}

if (typeof themeModule.getCohesionTokens !== "function") {
  throw new Error("COHESION theme factory does not export getCohesionTokens().");
}

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, "cohesion-shadcn.css"), shadcnTokensCss, "utf8");

const modes = ["light", "dark"];
const output = [
  `/* Generated from COHESION design system ${designPackage.version}; do not edit. */`,
];

for (const mode of modes) {
  const token = themeModule.getCohesionTokens({ mode });
  const atmosphere = brand.canvasAtmosphere[mode];
  output.push(
    `:root.shadcn-scope[data-shadcn-theme="${mode}"] {`,
    `  --subtle: ${token.colorTextTertiary};`,
    `  --border-strong: ${token.colorBorder};`,
    `  --success: ${token.colorSuccessText};`,
    `  --success-solid: ${token.colorSuccess};`,
    `  --success-soft: ${token.colorSuccessBg};`,
    `  --warning: ${token.colorWarningText};`,
    `  --warning-solid: ${token.colorWarning};`,
    `  --warning-soft: ${token.colorWarningBg};`,
    `  --info: ${token.colorInfoText};`,
    `  --info-solid: ${token.colorInfo};`,
    `  --info-soft: ${token.colorInfoBg};`,
    `  --destructive-glow: ${token.colorErrorBg};`,
    `  --primary-glow: color-mix(in srgb, var(--primary) 18%, transparent);`,
    `  --primary-glow-soft: color-mix(in srgb, var(--primary) 10%, transparent);`,
    `  --warning-15: color-mix(in srgb, var(--warning) 16%, transparent);`,
    `  --surface-glass: color-mix(in srgb, var(--card) 94%, transparent);`,
    `  --canvas-grid: ${atmosphere.grid};`,
    `  --canvas-cyan: ${atmosphere.cyan};`,
    `  --canvas-lime: ${atmosphere.lime};`,
    `  --canvas-green: ${atmosphere.green};`,
    `  --font-heading-family: "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif;`,
    `  --font-body-family: "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif;`,
    `  --font-mono-family: "Cascadia Code", Consolas, "Liberation Mono", monospace;`,
    `}`,
  );
}

await writeFile(join(outputDir, "cohesion-semantic.css"), `${output.join("\n")}\n`, "utf8");
console.log(`Synchronized COHESION ${designPackage.version} shadcn tokens to ${outputDir}`);
