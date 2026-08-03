#!/usr/bin/env node
/**
 * Fail if any apps/dristi-app UI primitive drifts from pucar-design-system.
 * Hand-written or half-edited copies are invent-risk — re-sync from DS.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { APP_ROOT, resolveDsRoot } from "./resolve-ds.mjs";

const ds = resolveDsRoot();
if (!ds) {
  console.error(
    "Could not find pucar-design-system. Set PUCAR_DS_ROOT or clone it next to this repo."
  );
  process.exit(1);
}

const appUi = join(APP_ROOT, "src/components/ui");
const dsUi = join(ds, "src/components/ui");

if (!existsSync(appUi)) {
  console.log("No src/components/ui yet — ui sync check skipped.");
  process.exit(0);
}

const files = readdirSync(appUi).filter((f) => f.endsWith(".tsx"));
let failed = false;

for (const file of files) {
  const appPath = join(appUi, file);
  const dsPath = join(dsUi, file);
  if (!existsSync(dsPath)) {
    console.error(
      `${relative(APP_ROOT, appPath)}  not in DS — remove or promote into pucar-design-system first`
    );
    failed = true;
    continue;
  }
  const app = readFileSync(appPath, "utf8");
  const source = readFileSync(dsPath, "utf8");
  if (app !== source) {
    console.error(
      `${relative(APP_ROOT, appPath)}  drifts from DS ${basename(file)} — run: npm run sync:ui -w @pucar/dristi-app -- ${basename(file, ".tsx")}`
    );
    failed = true;
  }
}

const appTokens = join(APP_ROOT, "src/app/globals.css");
const dsTokens = join(ds, "src/app/globals.css");
if (existsSync(appTokens) && existsSync(dsTokens)) {
  if (readFileSync(appTokens, "utf8") !== readFileSync(dsTokens, "utf8")) {
    console.error(
      "src/app/globals.css  drifts from DS — run: npm run sync:ui -w @pucar/dristi-app -- --tokens-only"
    );
    failed = true;
  }
}

if (failed) {
  console.error("\nUI sync check failed. Copy from DS; do not hand-edit primitives.");
  process.exit(1);
}
console.log(`UI sync check passed (${files.length} components + tokens). DS: ${ds}`);
