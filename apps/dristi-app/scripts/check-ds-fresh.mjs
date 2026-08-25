#!/usr/bin/env node
/**
 * check:ds-fresh — fail if the local design system is not the pinned one.
 *
 * Every other DS gate is *relative*: check:ui-sync diffs our primitives against whatever
 * happens to sit in vendor/pucar-design-system, so the wrong version passes green. That
 * is how four branches ended up on three different design systems with nothing
 * complaining.
 *
 * This gate answers the one question the others cannot: is this the version the repo
 * says we build against? It compares against `ds.lock.json`, so it is deterministic and
 * needs no network — the answer is the same on a plane as it is in the office.
 *
 * Pass --upstream to also ask whether a newer DS exists. That is information for
 * whoever owns the bump, never a failure: being deliberately behind is the point of a
 * pin.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  dsResolveHint,
  isLocalDsOverride,
  readDsLock,
  resolveDsRoot,
} from "./resolve-ds.mjs";

const checkUpstream = process.argv.includes("--upstream");

const ds = resolveDsRoot();
if (!ds) {
  console.error(dsResolveHint());
  process.exit(1);
}

/** Deliberate local override — building against an unreleased DS. Loud, never silent. */
if (isLocalDsOverride(ds)) {
  console.log(
    [
      `OFF PIN — using the DS at ${ds} via PUCAR_DS_ROOT, not the pinned version.`,
      "Fine while you are testing a DS change. Do not commit anything built on it,",
      "and unset PUCAR_DS_ROOT before you push.",
    ].join("\n")
  );
  process.exit(0);
}

const lock = readDsLock();
if (!lock) {
  console.error(
    "No usable ds.lock.json — this repo cannot say which DS version it builds against.\nRestore it from git, or run: npm run ds:bump"
  );
  process.exit(1);
}

if (!existsSync(join(ds, ".git"))) {
  console.log(`DS at ${ds} is not a git checkout — cannot verify the pin. Skipped.`);
  process.exit(0);
}

function git(...args) {
  return execFileSync("git", ["-C", ds, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  }).trim();
}

function tryGit(...args) {
  try {
    return git(...args);
  } catch {
    return null;
  }
}

const head = tryGit("rev-parse", "HEAD");

if (head !== lock.commit) {
  console.error(
    [
      "The local design system is not the version this repo is pinned to.",
      "",
      `  pinned  ${lock.commit.slice(0, 12)}${lock.bumpedOn ? `  (set ${lock.bumpedOn})` : ""}`,
      `  yours   ${head ? head.slice(0, 12) : "unreadable"}`,
      "",
      "Anything you build now is built against a different design system from",
      "everyone else's, and check:ui-sync will still pass because it only compares",
      "you to whatever is here.",
      "",
      "Fix:",
      "  npm install        # checks out the pinned version",
      "  npm run check:ui-sync   # then sync whatever it reports as drifting",
    ].join("\n")
  );
  process.exit(1);
}

if (tryGit("status", "--porcelain")) {
  console.error(
    [
      `The DS at ${ds} is at the pinned commit but has uncommitted edits.`,
      "Those edits are invisible to everyone else, so your build is not reproducible.",
      "",
      `Fix:  git -C "${ds}" checkout .`,
    ].join("\n")
  );
  process.exit(1);
}

console.log(`DS matches the pin (${lock.commit.slice(0, 12)}). ${ds}`);

/* Informational only: is there a newer DS worth bumping to? */
if (checkUpstream) {
  if (tryGit("fetch", "--quiet", "origin", "main") === null) {
    console.log("Could not reach the DS remote — upstream not checked.");
    process.exit(0);
  }
  const ahead = Number(tryGit("rev-list", "--count", "HEAD..origin/main") ?? "0");
  if (!ahead) {
    console.log("The pin is at the DS's latest main.");
    process.exit(0);
  }
  console.log(
    `\nA newer DS exists — ${ahead} commit${ahead === 1 ? "" : "s"} beyond the pin:\n`
  );
  for (const line of (tryGit("log", "--oneline", "HEAD..origin/main") ?? "")
    .split("\n")
    .filter(Boolean)) {
    console.log(`  ${line}`);
  }
  console.log("\nNot a failure — the pin is deliberate. To adopt it: npm run ds:bump");
}
