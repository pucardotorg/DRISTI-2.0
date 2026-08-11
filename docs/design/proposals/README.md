# Design proposals

Design briefs written by the `ux-designer` subagent (`.claude/agents/ux-designer.md`)
before a feature gets built. Each brief reads as a document, not a settings file:
context and scope, the **problem** with evidence, the **objective** in observable terms,
the job the feature does (grounded in [docs/product/](../../product/)), the **decisions**
with the rule or judgment behind each, what was cut, layout/hierarchy/spacing, which real
DS component covers each region, states, risks accepted, open questions, and DS gaps.
The section template lives in the `propose-ui-brief` skill.

Briefs are **living documents during the conversation that produces them.** When a
question gets answered or direction changes, the brief is updated in the same turn — the
chat is not the deliverable, and every brief carries a decision log recording what
changed and who confirmed it.

A brief is a **plan**, not a spec that overrides the design system — where a brief and
the DS disagree once building starts, the DS wins. `ui-designer` builds from these;
`ui-reviewer` still audits the built result against the DS gate, not against the brief.

Status per file: `draft` → `building` → `reviewed`. Stale drafts for features that never
got built can be deleted.

## Scope — one brief, one feature

**One feature → one file.** Everything needed to build that feature lives in that brief:
the primary screen or flow, sub-pieces of the same feature (filters, tags, creation
sheets, empty states), and neighbour implications the work surfaced (nav labels,
ownership hand-offs). Do **not** split those into separate proposal files.

| Kind | Goes to |
|---|---|
| The feature being built (screen, flow, and its own sub-pieces) | **This brief** — one file |
| Anything the design system is missing | [../ds-requests.md](../ds-requests.md) |
| Unanswered product/domain questions with no UI consequence | [../../product/open-questions.md](../../product/open-questions.md) |

A later feature gets its own brief when that feature is the thing being built — not when
today's brief happens to mention it. Notes for a neighbour stay here as implications
until that neighbour is in scope.

The `propose-ui-brief` template's fourteen sections are what keep a brief coherent —
**Objective** states the test a decision has to pass, and **What I cut** and **Risks
accepted** give rejected ideas somewhere to live other than a second file. Don't drop a
heading; answer it in two lines if that's all it needs.
