# Design proposals

Design briefs written by the `ux-designer` subagent (`.claude/agents/ux-designer.md`)
before a screen or flow gets built. Each brief names the job the screen does (grounded
in [docs/product/](../../product/)), the layout/hierarchy/spacing decisions, and which
real DS component covers each region.

A brief is a **plan**, not a spec that overrides the design system — where a brief and
the DS disagree once building starts, the DS wins. `ui-designer` builds from these;
`ui-reviewer` still audits the built result against the DS gate, not against the brief.

Status per file: `draft` → `building` → `reviewed`. Stale drafts for screens that never
got built can be deleted.
