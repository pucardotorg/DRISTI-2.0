/**
 * Copy the browser-side runtime assets that document reading needs into `public/vendor/`
 * so the app serves them itself (no CDN at runtime):
 *
 *   - pdf.js worker            → /vendor/pdf.worker.min.mjs
 *   - Tesseract worker         → /vendor/tesseract/worker.min.js
 *   - Tesseract WASM cores     → /vendor/tesseract/core/*
 *   - English language data    → /vendor/tesseract/lang/eng.traineddata.gz
 *
 * Runs before `dev` and `build`. `public/vendor/` is generated and git-ignored.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const require = createRequire(import.meta.url);

const out = join(appRoot, "public", "vendor");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "tesseract", "core"), { recursive: true });
mkdirSync(join(out, "tesseract", "lang"), { recursive: true });

function pkgDir(name) {
  return dirname(require.resolve(`${name}/package.json`));
}

// pdf.js worker
const pdfjs = pkgDir("pdfjs-dist");
cpSync(join(pdfjs, "build", "pdf.worker.min.mjs"), join(out, "pdf.worker.min.mjs"));

// Tesseract worker + cores
const tess = pkgDir("tesseract.js");
cpSync(join(tess, "dist", "worker.min.js"), join(out, "tesseract", "worker.min.js"));
const core = pkgDir("tesseract.js-core");
for (const f of readdirSync(core)) {
  if (/^tesseract-core.*\.(wasm|wasm\.js|js)$/.test(f)) {
    cpSync(join(core, f), join(out, "tesseract", "core", f));
  }
}

// English language data (LSTM "best int" — the default the worker asks for)
const eng = pkgDir("@tesseract.js-data/eng");
const langFile = join(eng, "4.0.0_best_int", "eng.traineddata.gz");
if (!existsSync(langFile)) throw new Error(`Missing ${langFile}`);
cpSync(langFile, join(out, "tesseract", "lang", "eng.traineddata.gz"));

console.log("runtime assets → public/vendor/");
