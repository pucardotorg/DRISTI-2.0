#!/usr/bin/env node
/**
 * Copy UI primitives / tokens from the local pucar-design-system into Dristi App.
 *
 * Usage:
 *   node scripts/sync-ui-from-ds.mjs button input
 *   node scripts/sync-ui-from-ds.mjs --tokens
 *   node scripts/sync-ui-from-ds.mjs --tokens button
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { APP_ROOT, dsResolveHint, resolveDsRoot } from "./resolve-ds.mjs";

const args = process.argv.slice(2);
const wantTokens = args.includes("--tokens") || args.includes("--tokens-only");
const tokensOnly = args.includes("--tokens-only");
const names = args.filter((a) => !a.startsWith("--"));

const ds = resolveDsRoot();
if (!ds) {
  console.error(dsResolveHint());
  process.exit(1);
}

const dsUi = join(ds, "src/components/ui");
const appUi = join(APP_ROOT, "src/components/ui");
mkdirSync(appUi, { recursive: true });

function copyOne(slug) {
  const src = join(dsUi, `${slug}.tsx`);
  if (!existsSync(src)) {
    console.error(`Missing in DS: src/components/ui/${slug}.tsx`);
    process.exitCode = 1;
    return;
  }
  const dest = join(appUi, `${slug}.tsx`);
  copyFileSync(src, dest);
  console.log(`synced  ${slug}.tsx`);

  const text = readFileSync(src, "utf8");
  const deps = [
    ...text.matchAll(/from\s+["']@\/components\/ui\/([^"']+)["']/g),
  ].map((m) => m[1].replace(/\.tsx$/, ""));
  const missing = [...new Set(deps)].filter(
    (d) => d !== slug && !existsSync(join(appUi, `${d}.tsx`))
  );
  if (missing.length) {
    console.warn(
      `  note: ${slug} imports ${missing.join(", ")} — sync those too if you use them`
    );
  }
}

if (wantTokens || tokensOnly) {
  const src = join(ds, "src/app/globals.css");
  const dest = join(APP_ROOT, "src/app/globals.css");
  copyFileSync(src, dest);
  console.log("synced  globals.css (tokens)");
}

if (!tokensOnly) {
  const toSync =
    names.length > 0
      ? names
      : readdirSync(appUi)
          .filter((f) => f.endsWith(".tsx"))
          .map((f) => basename(f, ".tsx"));

  if (toSync.length === 0) {
    console.error("No components to sync. Pass names, e.g. `button input`.");
    process.exit(1);
  }

  for (const slug of toSync) copyOne(slug);
}

if (process.exitCode) {
  console.error("\nSync finished with errors.");
  process.exit(process.exitCode);
}
console.log(`DS root: ${ds}`);
