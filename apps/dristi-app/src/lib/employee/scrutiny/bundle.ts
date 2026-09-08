import type { BundleDoc } from "@/lib/employee/scrutiny/types"

/**
 * The case bundle, in the same order as the generated complaint PDF — which is
 * how the advocate downloads, prints, signs, scans and re-uploads it, and
 * therefore the only order the officer can scroll without losing their place.
 *
 * Scans are files under /public/bundle, not inline base64: keeping them out of
 * source is what stops this module being a megabyte long.
 */
export const BUNDLE: BundleDoc[] = [
  { id: "synopsis", name: "Synopsis", kind: "generated", no: 1 },
  { id: "complaint", name: "Complaint — filed details", kind: "generated", no: 2 },
  {
    id: "affidavit",
    name: "Affidavit (scanned & signed)",
    kind: "scan",
    no: 3,
    poorScan: true,
  },
  { id: "cheque", name: "Cheque (front)", kind: "image", src: "/employee/bundle/cheque.jpg", no: 4 },
  { id: "memo", name: "Cheque return memo", kind: "image", src: "/employee/bundle/memo.jpg", no: 5 },
  { id: "notice", name: "Legal demand notice", kind: "image", src: "/employee/bundle/notice.jpg", no: 6 },
  {
    id: "aadhaar",
    name: "Aadhaar — Complainant",
    kind: "image",
    src: "/employee/bundle/aadhaar.jpg",
    no: 7,
  },
]

export const DOC_BY_ID: Record<string, BundleDoc> = Object.fromEntries(
  BUNDLE.map((d) => [d.id, d])
)

/** bundle doc id → the row that represents it in Evidence › Documents. */
export const DOC_ROW: Record<string, string> = {
  affidavit: "d-affidavit",
  cheque: "d-cheque",
  memo: "d-memo",
  notice: "d-notice",
  aadhaar: "d-aadhaar",
}

/** The parenthetical duplicates the Poor scan badge and the page itself. */
export function shortDocName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+—.*$/, "")
    .trim()
}
