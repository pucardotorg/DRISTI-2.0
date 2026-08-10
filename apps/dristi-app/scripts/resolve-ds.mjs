#!/usr/bin/env node
/**
 * Resolve the local pucar-design-system root for sync/check scripts.
 *
 * Canonical location (auto-cloned by npm install): vendor/pucar-design-system
 * Optional override: PUCAR_DS_ROOT
 * Legacy fallback: sibling ../pucar-design-system
 *
 * Never use machine-specific home paths. Reject wrong-org / unverified clones.
 */
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(APP_ROOT, "../..");

/** GitHub path that must appear in origin (or in `.pucar-ds-id`). */
export const EXPECTED_DS_REMOTE = "neer-ideasbeforenoon/pucar-design-system";

const MARKER_FILE = ".pucar-ds-id";

/** In-repo install path — populated automatically by `npm install` / ensure-ds. */
export const VENDOR_DS_PATH = resolve(REPO_ROOT, "vendor/pucar-design-system");

/** Legacy sibling path (still accepted if already present and authoritative). */
export const SIBLING_DS_PATH = resolve(REPO_ROOT, "../pucar-design-system");

const CANDIDATES = [
  process.env.PUCAR_DS_ROOT,
  VENDOR_DS_PATH,
  SIBLING_DS_PATH,
].filter(Boolean);

export function looksLikeDsTree(root) {
  return (
    existsSync(join(root, "AGENTS.md")) &&
    existsSync(join(root, "src/components/ui"))
  );
}

/**
 * True only for the authoritative Pucar DS — not divergent forks that share the name.
 */
export function isAuthoritativeDs(root) {
  const markerPath = join(root, MARKER_FILE);
  if (existsSync(markerPath)) {
    const id = readFileSync(markerPath, "utf8").trim();
    if (id.includes(EXPECTED_DS_REMOTE)) return true;
  }

  try {
    const url = execFileSync("git", ["-C", root, "remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (url.includes(EXPECTED_DS_REMOTE)) return true;
    console.error(
      `Rejected DS at ${root}: origin is "${url}" — expected ${EXPECTED_DS_REMOTE}`
    );
    return false;
  } catch {
    console.error(
      `Rejected DS at ${root}: no matching git origin and no ${MARKER_FILE} for ${EXPECTED_DS_REMOTE}`
    );
    return false;
  }
}

export function dsResolveHint() {
  return [
    `Could not resolve authoritative pucar-design-system (${EXPECTED_DS_REMOTE}).`,
    "From this repo root run:  npm install   (fetches DS into vendor/pucar-design-system)",
    "Or:  npm run setup:ds",
    `Expected path: ${VENDOR_DS_PATH}`,
  ].join("\n");
}

/**
 * @returns {string | null} Absolute path to the verified DS root, or null.
 */
export function resolveDsRoot() {
  const seen = new Set();
  for (const candidate of CANDIDATES) {
    const root = resolve(candidate);
    if (seen.has(root)) continue;
    seen.add(root);
    if (!looksLikeDsTree(root)) continue;
    if (!isAuthoritativeDs(root)) continue;
    return root;
  }
  return null;
}

export { APP_ROOT, REPO_ROOT };
