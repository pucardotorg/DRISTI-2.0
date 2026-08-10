#!/usr/bin/env node
/**
 * ensure-ds — fetch the authoritative design system into this repo.
 *
 * Runs on `npm install` (postinstall). Developers only need:
 *   git clone <dristi> && cd <dristi> && npm install && npm run dev
 *
 * Always installs to vendor/pucar-design-system (gitignored) so every machine
 * has the same in-repo path. Verifies org/remote; refuses wrong-org trees.
 */
import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const {
  EXPECTED_DS_REMOTE,
  VENDOR_DS_PATH,
  isAuthoritativeDs,
  looksLikeDsTree,
} = await import(
  join(dirname(fileURLToPath(import.meta.url)), "../apps/dristi-app/scripts/resolve-ds.mjs")
);

const CLONE_URL = `https://github.com/${EXPECTED_DS_REMOTE}.git`;

function vendorReady() {
  return (
    looksLikeDsTree(VENDOR_DS_PATH) && isAuthoritativeDs(VENDOR_DS_PATH)
  );
}

if (vendorReady()) {
  console.log(`DS ready: ${VENDOR_DS_PATH}`);
  process.exit(0);
}

if (process.env.PUCAR_DS_ROOT) {
  // Override is allowed for resolve-ds, but vendor is still the default install target
  // when unset. If they only use PUCAR_DS_ROOT, skip cloning.
  const root = process.env.PUCAR_DS_ROOT;
  if (looksLikeDsTree(root) && isAuthoritativeDs(root)) {
    console.log(`DS ready via PUCAR_DS_ROOT: ${root}`);
    process.exit(0);
  }
  console.error(
    `PUCAR_DS_ROOT is set to "${root}" but it is not an authoritative DS.`
  );
  console.error(
    `Fix that path (or unset it) so origin contains ${EXPECTED_DS_REMOTE}, then re-run npm install.`
  );
  process.exit(1);
}

if (existsSync(VENDOR_DS_PATH)) {
  console.error(
    `vendor/pucar-design-system exists but is not a valid ${EXPECTED_DS_REMOTE} tree.`
  );
  console.error("Remove or rename it, then re-run npm install:");
  console.error(`  mv "${VENDOR_DS_PATH}" "${VENDOR_DS_PATH}-STALE"`);
  process.exit(1);
}

mkdirSync(dirname(VENDOR_DS_PATH), { recursive: true });
console.log(`Fetching ${EXPECTED_DS_REMOTE} → vendor/pucar-design-system`);
try {
  execFileSync("git", ["clone", "--depth", "1", CLONE_URL, VENDOR_DS_PATH], {
    stdio: "inherit",
  });
} catch {
  console.error(
    "Could not fetch the design system. Check network/git access to GitHub, then re-run: npm run setup:ds"
  );
  process.exit(1);
}

if (!vendorReady()) {
  console.error("Fetch finished but vendor/pucar-design-system is not authoritative.");
  process.exit(1);
}

console.log(`DS ready: ${VENDOR_DS_PATH}`);
