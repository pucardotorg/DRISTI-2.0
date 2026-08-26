---
name: document-ui-feature
description: >-
  Write an as-built feature document after a Dristi UI feature is complete — or
  when the user explicitly asks to document it. Captures what shipped, product
  decisions, DS components used, risks, and open leftovers. Use only after ship
  or on explicit ask — never at feature start, never as a pre-build brief. Do
  not invent composition laws beyond the DS or confirmed product facts.
---

# Document a UI feature (as-built)

Capture what a **feature actually is** after it ships — not a speculative plan before
anyone builds. Pre-build briefs invent hierarchy essays that agents obey harder than
Figma/DS; that skew is the failure mode this skill exists to prevent.

**Default during design/build:** answer in chat; cite DS Laws and product docs; hand
off to `pull-ui-from-ds` / `ui-designer`. Do **not** create a document.

**When to write a file:** the feature is complete, or the user explicitly asks to
document it. Then write one as-built file.

Do not write application code while running this. When documenting, the only file
output is that as-built note (plus `docs/design/ds-requests.md` / product open
questions if a real gap surfaces). When the ask is understanding only, the only
output is the reply.

## Hard rules

1. **No pre-build briefs.** Do not write `docs/design/proposals/` for new work. That
   folder is legacy.
2. **No speculative composition laws.** Do not invent rules like “no teal on this
   view” unless they are in the DS Laws / component docs or confirmed by product in
   this conversation. Label judgment as *judgment*. Prefer DS (“one primary per
   visual region”) over Dristi-invented hierarchy fiction.
3. **DS wins.** The as-built note records what shipped; it does not override the DS.
   `review-ui-ds` audits against the DS, not against this file.

## 1. Ground in what exists

Read the shipped screen under `apps/dristi-app/` and the product docs that apply
(`docs/product/`). Cite them.

Confirm Job only from product docs or the user’s words — never invent it. Who logs
into DRISTI remains an open question (`docs/product/open-questions.md`).

## 2. Read the design system (for accurate attribution)

DS root: `vendor/pucar-design-system` (from `npm install`), or `PUCAR_DS_ROOT` if set.
Verify origin contains `neer-ideasbeforenoon/pucar-design-system` (or `.pucar-ds-id`).

Read enough to attribute correctly: `{DS}/AGENTS.md`, Laws, and the primitives actually
used on the screen. Do not invent component names or token roles.

## 3. Write the as-built file

Write `docs/design/features/<kebab-feature-name>.md` — one file for the whole feature:

```markdown
# <Feature name>

Status: shipped            <!-- shipped | iterating -->
Updated: <YYYY-MM-DD>
Source: <docs/product/... paths + apps/dristi-app paths this note covers>
DS used: <DS files / components actually used>

## 1. What it is
## 2. Job (confirmed or unconfirmed)
## 3. What shipped
## 4. Product decisions (attributed)
## 5. Components (DS name → region)
## 6. Hierarchy & primary actions (cite Laws / product — no invented rationing)
## 7. States covered
## 8. Risks accepted
## 9. Open leftovers
## 10. Gaps in the DS (if any)
## 11. Decision log
```

- **What it is** — one short paragraph: the screen/flow and its neighbours.
- **Job** — attributed product/user wording, or `Job: unconfirmed`.
- **What shipped** — observable behaviour and layout regions as built.
- **Product decisions** — only what product or the user confirmed; attribute each.
- **Components** — real DS names per region.
- **Hierarchy** — which actions are primary and why, citing Laws (“one primary per
  visual region”) or product — never Dristi-only fiction.
- **Decision log** — dated table of what changed and who confirmed it.

Sections are mandatory but elastic. Never delete a heading to avoid answering it.

DS gaps go to `docs/design/ds-requests.md`; product questions with no UI consequence go
to `docs/product/open-questions.md`.

## Done means

- File lives under `docs/design/features/`, not `proposals/`
- Every hierarchy claim cites DS or attributed product — or is labelled *judgment*
- Job is confirmed or explicitly unconfirmed
- No speculative “how we should build” essay that contradicts what shipped
- Reply summarizes what the note captures; do not paste the whole file
