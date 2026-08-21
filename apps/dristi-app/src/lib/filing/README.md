# E-filing — how the front end works, and where the backend plugs in

The S-138 e-filing flow (`/filings/**`) is a working front end with **no server**: every
draft, upload and the person's profile live in the browser (IndexedDB), document reading
runs in the browser (Tesseract.js + pdf.js), and reference lookups hit public endpoints.
It behaves like the product will — the seams below are where engineering swaps the local
implementation for DRISTI's services. Screens do not change when that happens.

## Model

`types.ts` is the contract. One `FilingDraft` per filing (`id`, `status: draft | filed`,
`lastStep`, `intake`, parties, cheques, notices, …, `sign`, timestamps). Uploads are
`StoredFileRef`s (`{ id, name, size, type, ext }`) — the bytes live in the file store.
Machine-read values are ordinary fields plus a `prefilled[key]` mark; `edited[key]`
means the person overrode it. `blank.ts` builds an empty draft; `buildDocumentGroups`
derives the "List of documents" step from the case (the store recomputes it on every
commit, so it can never disagree with the intake).

## Seams (swap these; keep the signatures)

| Seam | Today | Replace with |
| --- | --- | --- |
| `data/repository.ts` → `data/indexeddb.ts` | IndexedDB (`dristi-efiling`: `drafts`, `files`, `profile`) | HTTP repository against the case service; `getRepository()` in `data/index.ts` is the single choice point |
| `profile.tsx` — `useProfile()` | Local profile edited from the header avatar | The product session (name, mobile, email, bar number) |
| `ocr/index.ts` — `extractDocument(blob, ref, docType)` → `{ extract, poor }` | Tesseract.js in the browser; parsers in `ocr/parse-*.ts`; field keys in `ocr/fields.ts` | Server-side IDP returning the same `DocExtract` (fields + boxes). `ocr/apply.ts` (fields → draft with review markers) stays |
| `lookups.ts` — `lookupIfsc`, `lookupPin` | `ifsc.razorpay.com`, `api.postalpincode.in` | Court/registry services |
| Sign & pay (`components/filing/sections/sign-section.tsx`) | Sandbox: any OTP, simulated payment, generated `KL-nnnnnn-yyyy` case-file number, `status = filed` | eSign provider, payment gateway, registry-issued case number |
| Bar registry | none — advocate name is typed | Bar Council lookup by enrolment number |

## Store

`store.tsx` — `FilingProvider` per `/filings/[draftId]`: loads the draft, `update((d) =>
…)` clones + commits + debounced write; `saveState` is the real write state (`saving`,
`saved`, `error`). `lastStep` follows the URL so "Continue draft" resumes in place.
`files.ts` gives screens object URLs and PDF page-1 renders for any stored file.

## Runtime assets

`scripts/copy-runtime-assets.mjs` (predev/prebuild) copies the pdf.js worker and
Tesseract worker/cores/English data into `public/vendor/` (git-ignored) so nothing is
fetched from a CDN at runtime.

## Known gaps the form does not collect yet

The court document prints only what is typed. Fields the standard complaint format
expects that the form does not yet ask for: parent/spouse name of individuals ("S/o"),
the advocate's State Bar Council. Add them to the model + section when product confirms.
