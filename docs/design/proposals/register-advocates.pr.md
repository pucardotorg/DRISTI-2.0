# Pull request description — Approve registrations (draft)

> **Status:** ready, **not raised.** Branch `feature/approve-registrations`. The owner will
> merge it into another branch in progress first and raise one pull request for both, into
> `design`. When that happens, this is the body for the registrations half — paste it,
> merge it with the other half's, and delete this file in the same pull request.
>
> Brief: [register-advocates.md](register-advocates.md) (decisions D1–D35).

---

## Approve registrations — and two conventions that become the product default

The scrutiny officer's queue for **self-registered advocates and advocate clerks**, and the
overlay where each request is verified against its ID card and approved or rejected without
leaving the list. Formerly "Register advocates"; renamed when clerks joined the queue.

This pull request also changes two defaults for everything built after it. They were
worked out on this screen across several review rounds with the design owner and are
written into the craft rules (`ui-craft`, both the Claude and Cursor copies), so the next
screen follows them without being told.

### Convention 1 — the beige canvas under white panels

**The work surface is beige, and panels are white and lifted.** This inverts the rule it
replaces.

| | Before | Now (default) |
|---|---|---|
| Work surface | White page, "always" — a tint allowed only on the e-filing form | `bg-muted dark:bg-background` — warm neutral-2, the rail's own tone |
| Panels | White on white, separated by strokes or a hover-only shadow | White `Card`, `border-hairline shadow-raised` **at rest** |
| Chrome | — | Top bar, sticky footers, a dialog's header and footer stay `bg-card` |
| Inside a modal | White dialog body | The same canvas between a white header and footer |

**Why it works where a tinted page failed before.** What was rejected in August was cool
grey under panels still separated by `border-border` strokes: a dull admin panel. This is
warm ground under panels that carry their own elevation, so the panel reads by lift and the
canvas reads as ground. Page and rail become one surface, and the white panel is the only
lifted thing on the screen.

**The one hard requirement it brings:** nothing sunken sits directly on the canvas.
`surface-sunken` on `muted` measures **1.01:1** and dissolves. The decision card's header
strip did exactly that until it was measured. Wells go inside white panels.

**Dark mode is unchanged**: `muted` sits above `card` there, so the canvas stays
`bg-background` to keep depth the right way round.

Where it lives: `ui-craft` §1.0, §2, §4 and the pre-flight checklist in §5.

### Convention 2 — a flow progresses inside one modal, never on top of it

**No step of a flow opens a dialog over the dialog.** A confirmation, a composer and an
outcome are each a *stage* of the same modal, conveyed with motion.

- **Stages are scenes, and a change of scene slides**: right when going forward, left
  when going back (300ms, with a fade).
- **An act and its outcome are one scene.** Pressing *Confirm approval* does not replace
  the screen. The card stays exactly where it is, measured at 0px movement, and resolves in
  place: its status strip turns from "You are approving" to a tinted "Account created".
  The second screen is the first one with a stamp on it.
- **A new record arrives; the modal does not re-open.** *View next application* loads the
  next request into the same window with its own motion, rising and fading over 500ms.
  The body is **not keyed on the record**. Keying it tore down `Dialog.Content` and
  replayed the primitive's open animation mid-session, which read as the window slamming
  shut.
- **Every animation respects `prefers-reduced-motion`.**
- **Focus follows the stage**: to the title when a stage changes, to the field on a
  composer, to the content when a new record arrives. It is never dropped to the body with
  a modal open.

Reference implementation: `components/employee/register-advocates-dialog.tsx`. Where it
lives: `ui-craft` §7 (new).

**Open for the owner:** the document **Full view** is still a dialog over a dialog. It is a
viewer, not a step in a flow, so it was left alone, but the rule as stated does not yet
exempt a lightbox.

---

### The screen

**Queue.** It has one search box, filtering as you type, and six columns. Account type is
the one coloured pill: Advocate in `info`, Clerk in `success`. Every other state is neutral
or plain text, so colour on the screen answers one question. Days waiting escalates in ink.
There is no bulk approve: approval grants a credential, and the ID card photograph exists so
a person looks at it.

**The overlay has five stages and three scenes**: Review → Approve or Reject → the settled
outcome, then the next application.

- **Two shapes hold every fact.** A term and its value, or a table with a column per
  source. Nothing hangs a chip, a source line or a strikethrough off a value.
- **Exceptions only.** A register check says nothing when it agrees. When it doesn't, the
  row names what is wrong ("Full name does not match") and opens the evidence in place. A
  profile update's before and after are an open section, because on that request they are
  the thing being reviewed.
- **Account type is read first**, as the first row's pill. The stage title carries it too,
  as the dialog's accessible name.
- **No exposition copy.** The screen does not explain an act to the person who performs it
  forty times a day.
- **Outcomes are headings, not sentences with a name in them.** They are green or red at
  low volume: a 16px mark on a muted strip.

**Clerks** give the same five values as advocates, read off the sign-up flow and the
handover (`REG-13a`, `REG-14a`): a clerk registration number and a clerk ID card. Nothing
looks a clerk up, since no register is named, and a clerk is never a profile update.

### Also in this branch

- **Design-mode overlay:** the panel can be dragged, and it survives the app's own modals.
- **`DocumentPreview`:** a `surface` option, including a framed well whose title strip
  holds the actions.
- **Search placeholders** across the court-side queues are sentence case.

This branch shares history with `feature/register-advocates`, which also carries the
register-cases and case-review work from a parallel stream. Those commits are described in
their own brief, [register-cases.md](register-cases.md), and belong to the other half of the
combined pull request.

### Known gaps and open questions

- **DS: no categorical tint for identity.** `chart-1…5` are data-viz solids with no muted
  pair, so the account-type pills borrow `info` and `success`. Filed in the brief, §13. It
  will matter when a third account type arrives.
- **Is there a Bar Council integration at all?** (§12.11) The screen renders nothing when
  there is no lookup, so this does not block.
- **The clerk registration number format is unknown**, as is whether any register exists
  for clerks (§12.12). The demo's `CLK/1522/2016` is a placeholder.
- **The slug still says `register-advocates`**: the route, the modules and the brief.
  Renaming them is mechanical and was left for a quiet moment.
- **Approve and Reject perform no act.** They drop the row from the demo queue, and the end
  states say so.

### Verification

- All seven gates green: `check:ds-fresh`, `check:tokens`, `check:typography`,
  `check:ui-sync`, `check:spacing`, `check:table-rows`, `check:rails`.
- 693 tests passing on this branch.
- Checked on the render at 375, 1280 and 1440, in light and dark, including the measured
  movement of the decision card and the table fit at 1280.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
