#!/usr/bin/env node
/**
 * Resolve the local pucar-design-system root for sync/check scripts.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(APP_ROOT, "../..");

const CANDIDATES = [
  process.env.PUCAR_DS_ROOT,
  "/Users/neerchaudhury/Documents/pucar-design-system",
  join(REPO_ROOT, "../pucar-design-system"),
  resolve(process.cwd(), "../pucar-design-system"),
].filter(Boolean);

export function resolveDsRoot() {
  for (const candidate of CANDIDATES) {
    const root = resolve(candidate);
    if (existsSync(join(root, "AGENTS.md")) && existsSync(join(root, "src/components/ui"))) {
      return root;
    }
  }
  return null;
}

export { APP_ROOT, REPO_ROOT };
