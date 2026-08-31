---
name: propose-ui-brief
description: >-
  Write or update a design brief for a Dristi feature — context, problem,
  objective, job, decisions, layout, DS components, states, open questions.
  Use when starting a new feature, redesigning a flow, deciding how a feature
  composes from the design system, or when asked for a component that may not
  need to exist. Also use when an answer, decision, or change of direction means
  an existing brief must be brought up to date. When the user only asks to
  understand an existing decision or how to solve a named problem, answer that
  ask from context — do not invent, do not spawn a new brief, do not pile on
  unrelated clarifying questions. Produces and maintains one file per feature at
  docs/design/proposals/<slug>.md when a brief is actually required.
---

# Propose a UI brief

Propose what a **feature** should be **before** anyone writes it — but **never invent
the feature's Job** to make the brief look finished. This is the planning leg that
precedes `pull-ui-from-ds` (build) and `review-ui-ds` (audit).

**Answer the ask first.** Use the context the user already shared (screenshot, prior
direction, existing brief, product facts) to say what to do to solve **that** problem.
Do not invent Jobs or product facts. Do not create a new brief, new section, or side
file when the user only wants an explanation of an existing decision. Ask a clarifying
question only when it blocks answering this turn — park everything else in the brief's
*Open questions*, not in the reply.

**One feature → one brief file.** Do not split a feature into separate proposals for its
screen, a sub-piece (tags, filters, sheets), or neighbour/IA notes the work surfaced.
Those belong in the same file. DS gaps go to `docs/design/ds-requests.md`; product
questions with no UI consequence go to `docs/product/open-questions.md`.

Do not write application code while running this. When a brief is required, the only
file output is that brief. When the ask is understanding only, the only output is the
reply.

## 1. Ground in the product first

Read `docs/product/README.md`, then whichever of `overview.md`, `domain/journey.md`,
`domain/actors.md`, `domain/practice-notes.md`, `national-vs-state.md`,
`terminology.md` bear on the screen. Cite them in the brief.

**Who logs into DRISTI is an open question, not a known fact.**
`docs/product/open-questions.md` lists as unanswered whether primary users are
advocates, court staff, institutional filers, litigants, or a mix — and contrasts Kerala
(individual, low volume) with Gujarat (bulk institutional). `domain/actors.md` names
*domain* actors, i.e. legal roles, which is not the same as product users.

So **do not invent who this screen serves; do not resolve it yourself.** When designing
and the answer changes the recommendation, record it in *Open questions for product* and
proceed conditionally — do not block a narrow explanatory ask with that question. Do not
invent personas, device profiles, literacy levels, or research (`AGENTS.md` forbids it).
"The docs don't say" belongs in *Open questions for product*.

**The screen's Job is the same class of fact — confirm it, do not invent it.** Who the
screen serves and what it is *for* in the case flow must come from product docs or from
the user in this conversation, in their words (or a close paraphrase you attribute).
Diagnosing what is wrong with today's UI is not a license to mint the purpose. Do not
coin neat dual-noun jobs (`retrieval and posture`, `list and triage`, and the like)
unless product used those words. If the Job is unset: write **`Job: unconfirmed`**, list
at most two *candidate* framings labeled as hypotheses, put "What is this screen's job?"
in *Open questions for product*, and **do not treat any candidate as settled**.

You may rely on what comes from the statute rather than from assumed users: §138 runs on
hard clocks, so deadline pressure and the cost of a missed window are real — cite the
domain doc. Where the user is unknown, design for the more constrained case and **say
that you did**, so the assumption stays visible and reversible.

## 2. Run the staff passes

Before writing or updating any brief or audit, read `references/staff-ux-thinking.md`
in this skill's folder and run its eight passes in order — Walk the Tuesday, domain
layout, control vocabulary, real weather, exception vs. norm, pattern census, sibling
sweep, render judgment. The passes interrogate the screen as it is **before** the DS
tells you what it may become; their findings go in the brief (*Problem*, *Decisions*,
*States*), and the brief says which passes ran. Skipping the walk turns every later
pass into rule-checking.

## 3. Read the design system

DS root: `vendor/pucar-design-system` (from `npm install`), or `PUCAR_DS_ROOT` if set.
Verify origin contains `neer-ideasbeforenoon/pucar-design-system` (or `.pucar-ds-id`).
If none resolve or wrong org, stop — do not propose UI blind. Never search Desktop/home
for other clones.

- `{DS}/AGENTS.md`, `{DS}/ACCESSIBILITY.md`, `{DS}/RESPONSIVE.md`
- Foundations at `{DS}/src/app/(docs)/foundations/<name>/page.tsx` — `laws` always;
  then `typography`, `spacing`, and `colors` / `elevation` / `radius` / `icons` /
  `accessibility` whenever the brief takes a position they govern
- Glob `{DS}/src/components/ui/` — know the real vocabulary before proposing anything
  that sounds new

Then skim `apps/dristi-app/src/app` and `.../components`. If Dristi already solves this
shape of problem, propose that way or argue explicitly why it should change. Never
quietly introduce a second way.

## 4. Decide, with restraint

New component, step, or field must prove the existing one is **insufficient** — not
merely that the new one is nicer. Cite the DS file behind each call, or label it as
judgment. Name the tradeoff and recommend; don't hand over a menu.

If the request itself is wrong — a screen that shouldn't exist, a step that should be
automatic — say that first.

## 5. Write it as a document, not a checklist

A brief is read by someone who wasn't in the room, weeks later, deciding whether to
build what it says. It has to carry the reasoning, not just the outcome: **what is wrong
today, what better means, what you decided, and what you gave up.** A list of layout
values with no problem statement is a spec, and a spec no one can argue with is a spec
no one can improve.

Write `docs/design/proposals/<kebab-feature-name>.md` — one file for the whole feature:

```markdown
# <Feature name>

Status: draft            <!-- draft → building → reviewed -->
Updated: <YYYY-MM-DD>
Source: <docs/product/... paths this brief is grounded in>
DS read: <the DS files this brief actually opened>

## 1. Context
## 2. Problem
## 3. Objective
## 4. Job
## 5. Decisions
## 6. What I cut (and why)
## 7. Layout & hierarchy
## 8. Components (DS name → region)
## 9. Spacing
## 10. States (empty / loading / error / partial / long-label)
## 11. Risks accepted
## 12. Open questions for product
## 13. Gaps in the DS (if any)
## 14. Decision log
```

What each of the first five is for — the last nine are the same as they always were:

- **Context** — where this sits: the nav / IA neighbours, which section owns the
  adjacent responsibility, what is in and out of scope for **this feature**. Sub-pieces
  of the same feature (creation flows, tags, sheets) stay in this brief — do not file
  them elsewhere. Facts confirmed with product go here, attributed, so a reader can tell
  a given constraint from your inference.
- **Problem** — what is wrong today, with evidence: the screen's own counts, the columns
  that are constant or empty, the tab labels that mix axes. **Numbered**, so decisions
  and reviewers can cite "problem 3" instead of re-describing it. No problem statement
  means no way to tell later whether the redesign worked.
- **Objective** — what better means here, in terms someone could observe. Two or three
  lines. "Cleaner" and "more modern" are not objectives. An Objective that only makes
  sense given an unconfirmed Job is itself provisional — say so, or keep it as a
  candidate tied to the open Job question.
- **Job** — who it serves and what it does in the real case flow. **Elicit or confirm;
  never invent.** Prefer product / user wording only, attributed
  ("confirmed with product: …" / "user said: …") with a `docs/product/` citation when
  one exists. Where who-logs-in is unresolved, say so, design for the more constrained
  case, and say that you did — that rule does **not** extend to inventing the Job
  itself. Unconfirmed Job → `Job: unconfirmed` + open question (see §1).
- **Decisions** — the recommendations, each with the rule or doc it traces to (or the
  word *judgment*), the alternative rejected, and what you gave up. If you are pushing
  back on the request, that is decision one. Any decision that only makes sense *given*
  a Job (row model, default sort, "this screen is not X") is **provisional** while Job
  is unconfirmed — label it, or leave it in *Open questions* instead of Decisions.

**Risks accepted** is where a consequence you chose to live with gets written down — an
unowned risk is a defect with a delay fuse. **Decision log** is a dated table of what
changed and who confirmed it.

Sections are mandatory but elastic: a small screen may answer *Objective* in two lines
and *Risks accepted* with "none". Never delete a heading to avoid answering it — an
absent section reads as an unasked question.

"What I cut" is not optional — it is the clearest signal of judgment in the brief.
Cover the long-label / long-language case: one core deploys per state with local
languages over identical national law.

## 6. Keep it current — the file is the record, not the chat

Briefs get written across a conversation, and the conversation is not the deliverable.
Someone builds from the file later with no transcript, so **when a decision lands, the
brief changes in the same turn as your reply.**

- The user answering an open question, supplying a fact, or changing direction is an
  edit to the brief — not just a reply. Make it before you finish the turn.
- **Never silently delete an answered question.** Move it into *Context* or *Decisions*
  with attribution ("confirmed with product: …") and add a *Decision log* row. A
  question that simply vanishes reads as one nobody ever asked.
- **A resolved problem stays in the record**, marked resolved and by what. Deleting it
  hides the reason the design looks the way it does.
- When a new fact invalidates an earlier decision, change the decision *and* log it.
  Never leave two paragraphs of the same brief disagreeing — a self-contradicting brief
  is worse than a stale one.
- Re-read the brief before appending to it. The failure mode is turn ten quietly
  contradicting turn one.
- Bump `Updated`. In your reply, restate only what changed and why — not the whole file.

## Done means

- Every recommendation traces to a DS file or product doc, or is labelled judgment
- The eight passes of `references/staff-ux-thinking.md` ran, and the brief says so
- Problem is evidenced and numbered; Objective is observable (and provisional if Job is)
- **Job is either (a) quoted/attributed to product or the user, or (b) explicitly
  `unconfirmed` with an open question — never a coined purpose presented as fact**
- Decisions that depend on an unconfirmed Job are marked provisional or absent
- States beyond the happy path are specified
- Gaps are framed as DS-repo requests, never as license to invent inside Dristi
- Everything decided in conversation is in the file, and nothing in the file contradicts
  anything else in it
- The decision and its main tradeoff are summarized in the reply, not just the file

Hand to `pull-ui-from-ds` to build. `review-ui-ds` audits the result against the DS —
not against this brief. A brief is a plan; the DS stays the source of truth.
