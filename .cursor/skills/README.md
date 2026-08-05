# Cursor skills

On-demand workflows for Cursor live here as `skill-name/SKILL.md` folders.

Always-on policy stays in `.cursor/rules/` — do not duplicate it as a skill.

| Skill | When |
|---|---|
| [propose-ui-brief](propose-ui-brief/SKILL.md) | Deciding what a screen should be — before any code |
| [pull-ui-from-ds](pull-ui-from-ds/SKILL.md) | Building UI — read DS + sync components |
| [review-ui-ds](review-ui-ds/SKILL.md) | Reviewing UI for DS / a11y / invent-risk |

One per stage: propose → build → review. Each `SKILL.md` is mirrored byte-for-byte from
`.claude/skills/` — `npm run check:rails` fails if they drift. The role rules in
`.cursor/rules/role-*.mdc` wrap these: the skill is the workflow, the role is the judgment.
