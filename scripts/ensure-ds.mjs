#!/usr/bin/env node
/**
 * ensure-ds — fetch the authoritative design system into this repo.
 *
 * Runs on `npm install` (postinstall). Developers only need:
 *   git clone <dristi> && cd <dristi> && npm install && npm run dev
 *
 * Always installs to vendor/pucar-design-system (gitignored) so every machine
 * has the same in-repo path. Verifies org/remote; refuses wrong-org trees.
 *
 * An existing clone is brought up to date, not left alone. Cloning once and never
 * fetching again is how a checkout silently drifts: between 3 and 13 August 2026 this
 * repo synced primitives from a ten-day-old DS, so every `sync:ui` copied stale files
 * and the gate still passed. Staleness has to be impossible, not merely unlikely.
 *
 * Updating is deliberately conservative — it fast-forwards `main` and stops at anything
 * that could lose work: a feature branch, local commits, or a dirty tree. Someone
 * working *on* the DS from this clone keeps their work and gets told what to do.
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

/** Run git in the vendor clone, returning trimmed stdout ("" on failure). */
function git(...args) {
  try {
    return execFileSync("git", ["-C", VENDOR_DS_PATH, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Fast-forward an existing clone to origin/main. Never discards anything: a dirty tree,
 * local commits, or a non-main branch each stop the update with a message naming the
 * exact command to run once the work is parked.
 */
function updateVendor() {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const dirty = git("status", "--porcelain");

  if (dirty) {
    console.log(
      `DS ready: ${VENDOR_DS_PATH} (left as is — uncommitted changes in the clone)`
    );
    return;
  }
  if (branch !== "main") {
    console.log(
      `DS ready: ${VENDOR_DS_PATH} (left as is — clone is on "${branch}", not main)`
    );
    return;
  }

  // `--depth 1` clones carry no history to merge onto, so deepen before fetching.
  if (git("rev-parse", "--is-shallow-repository") === "true") {
    git("fetch", "--unshallow", "origin", "main");
  } else {
    git("fetch", "origin", "main");
  }

  const local = git("rev-parse", "HEAD");
  const remote = git("rev-parse", "origin/main");
  if (!local || !remote || local === remote) {
    console.log(`DS ready: ${VENDOR_DS_PATH}`);
    return;
  }

  const behind = git("rev-list", "--count", "HEAD..origin/main");
  const ahead = git("rev-list", "--count", "origin/main..HEAD");
  if (ahead !== "0") {
    console.log(
      `DS ready: ${VENDOR_DS_PATH} (left as is — ${ahead} local commit(s) not on origin/main)`
    );
    return;
  }

  git("merge", "--ff-only", "origin/main");
  if (git("rev-parse", "HEAD") === remote) {
    console.log(
      `DS updated: ${VENDOR_DS_PATH} — fast-forwarded ${behind} commit(s) to origin/main`
    );
  } else {
    console.log(`DS ready: ${VENDOR_DS_PATH} (could not fast-forward; left as is)`);
  }
}

if (vendorReady()) {
  updateVendor();
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
