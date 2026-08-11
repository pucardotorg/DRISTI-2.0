# Design-system requests

Open requests against
[neer-ideasbeforenoon/pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system),
raised while designing Dristi screens.

**This file is a queue, not a licence.** Nothing here may be worked around locally: an
invented token, a hand-written primitive, or a per-screen override is a defect under the
DS gate (`.cursor/rules/pucar-design-system.mdc`), whatever the deadline. A request that
blocks a feature blocks the feature.

Each entry says what is missing, why the product hit it, and what would close it.

| # | Request | Raised by | Status |
|---|---|---|---|
| 1 | Token family for user-assigned categorical marks | [cases.md](proposals/cases.md) | open — **blocking** |
| 2 | `Badge` cannot hold a long localized label | [cases.md](proposals/cases.md) | open |
| 3 | Five shipped components have no registry guidance | [cases.md](proposals/cases.md) | open |
| 4 | No sanctioned sticky table header or row-density guidance | [cases.md](proposals/cases.md) | open |

---

## 1. No token family for user-assigned categorical marks — blocking

A confirmed product requirement, not a speculative one: users create their own case tags
and choose a colour from provided defaults ([cases.md](proposals/cases.md)).

Tags are **categorical, not status**. Status is closed at exactly three treatments per
family (`AGENTS.md` rule 6), and `chart-1…5` is documented as "series identity only —
never status" and scoped to data visualisation. So there is no sanctioned home for a
user-chosen mark.

**Request:** a **`tag-1…5`** family aliasing the chart ramp — contrast-checked ≥3:1 as
non-text marks, defined in both `:root` and `.dark`, documented as "never status, never a
row fill, always paired with a name."

System-level rather than a one-off: any future case type or workspace feature will need
user labels.

**Until it exists, tags cannot ship.** A local hex, or a colour picker that emits one, is
a defect under rules 1 (never hardcode a colour), 4 (must exist in light and dark), and 9
(every pair computed, never asserted).

## 2. `Badge` cannot hold a long localized label

`badge.tsx` is `h-6` with `whitespace-nowrap`. One core deploys per state with local
languages over identical national law, and court languages make three-word §138 stage
names much longer — "Bail & recording of plea", "Proclamation & attachment" — with taller
glyphs (`foundations/typography`, `ACCESSIBILITY.md` §13). A non-wrapping fixed-height
chip overflows its cell, and truncating a critical label with no alternative is itself a
defect (a11y §10).

**Request:** either a wrapping / multi-line badge variant, or explicit guidance that long
localized status values render as text. Without one of the two, every screen invents its
own override — [cases.md](proposals/cases.md) D3 avoided that by rendering stage
as plain text.

## 3. Five shipped components have no registry guidance

`item`, `description-list`, `toggle-group`, `input-group`, and `marker` exist in
`src/components/ui/` but have no `componentRegistry` entry, so they carry no `whenToUse`,
usage notes, or do/don't — while [cases.md](proposals/cases.md) depends on all
five.

Per `AGENTS.md`'s own standard, "a component with no reviewed guidance is a component the
system has not actually decided on."

**Request:** registry entries for at least these five.

## 4. No sanctioned sticky table header or row-density guidance

`RESPONSIVE.md` calls a sticky header "optional in product layouts", which means every
product hand-rolls it. A 55-row docket wants one, and if users turn out to be professional
repeat users, it wants a density answer too.

**Request:** a documented `Table` behaviour for sticky headers, with a row-density note,
rather than five screens inventing five versions.

---

↑ Design guidance: [design-system.md](design-system.md) · Briefs:
[proposals/](proposals/)
