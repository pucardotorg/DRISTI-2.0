# Design features (as-built)

As-built notes for **shipped** (or explicitly documented) Dristi UI features. Written by
the `ux-designer` role via the `document-ui-feature` skill — **after** the feature is
complete, or when product asks to document it. Not written at feature start.

Each note records what shipped, attributed product decisions, DS components used,
hierarchy with Laws/product citations (no invented composition laws), states, risks,
open leftovers, and a decision log. The section template lives in
`document-ui-feature`.

Source of truth while building remains the DS (Figma master + code) and confirmed
product asks in conversation. `ui-reviewer` audits built UI against the DS gate, not
against these notes.

Status per file: `shipped` · `iterating`.

## Scope — one feature, one file

**One feature → one file.** Sub-pieces of the same feature stay in that note. Do not
split filters, tags, or sheets into separate feature docs.

| Kind | Goes to |
|---|---|
| Shipped feature (screen, flow, and its own sub-pieces) | **This folder** — one file |
| Anything the design system is missing | [../ds-requests.md](../ds-requests.md) |
| Unanswered product/domain questions with no UI consequence | [../../product/open-questions.md](../../product/open-questions.md) |

## Legacy

Pre-build briefs under [../proposals/](../proposals/) are **legacy**. Do not add new
ones. In-flight work may still reference an existing proposal until that feature is
documented here and the proposal retired.
