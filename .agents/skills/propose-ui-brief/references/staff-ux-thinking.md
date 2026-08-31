> Reference for the `propose-ui-brief` skill and the ux-designer / ui-reviewer roles:
> the eight passes a staff UX audit runs. Read this file before writing or updating any
> brief or audit, and run every pass in order — findings from the passes go in the brief.

# How a staff designer actually audits a screen

## 1. The stance

A rule-checker asks "does this element violate a guideline?" A staff auditor asks "is
this screen the right rendering of the domain and this user's next hour?" — and only
then checks guidelines. The difference is direction: the rule-checker starts from the
components and looks for infractions; the staff auditor starts from the world the
screen describes (its nouns, their containment, the user's task) and treats the
current layout as a hypothesis that must survive interrogation. Everything on screen
is a claim — this structure matches how the domain nests, this filter matches how the
user names things, this emphasis matches what is rare and urgent — and the audit's
job is to falsify claims, not to certify components. Rules are the floor. The misses
that embarrass you are never rule violations; they are claims nobody tested.

## 2. The passes

### Pass 1 — Walk the Tuesday
**Question:** Can the named user get through their actual next hour using only what
the screen gives them, in the order they'd need it?
**How:** Pick one concrete persona-morning (an advocate at 9:40 with hearings in two
courts). Narrate it aloud step by step: what do they look for first, what decision
does each glance feed, what do they do when a hearing ends. At every step ask "does
the screen answer this before they have to hunt?" Log every moment the narration
stalls or the user must scan everything to find one thing. Never inspect a component
before this narration exists — the narration is what the later passes test against.
**Catches:** Screens that are complete as inventories but wrong as instruments —
every fact present, no task served. This is the pass that generates the intent all
other passes evaluate against; skipping it turns the rest into rule-checking.

### Pass 2 — Let the domain draw the layout
**Question:** Does the screen's nesting mirror the domain's own containment — or the
chrome that happened to be there before?
**How:** List the screen's nouns and their natural hierarchy (here: a day contains
courts, a court contains cases; the user narrows in that order). Then read the
layout's actual nesting from the code: what is a peer of what, what contains what.
Any place a child-level noun is promoted to top-level chrome (courts as global tabs)
or a containment is flattened is a structure defect — no styling fixes it.
**Catches:** Layouts inherited from a previous iteration's chrome rather than derived
from the domain. **Real failure #1:** courts rendered as a horizontal tab bar when
the domain says date → court → case; the fix (courts as stacked sections under a
date) falls straight out of writing down the containment.

### Pass 3 — Whose word is on the control?
**Question:** For every filter, tab, and toggle: is it sliced by the entity the user
would say aloud, or by a system concept?
**How:** For each control, complete the sentence a user would speak: "show me ___'s
cases", "only the ___ ones". If the control's options are implementation or policy
vocabulary (access rights, record states, internal flags) rather than the people,
places, and things of the user's world, the control is modeled on the database.
Check the default too: the first slice should be the user's own lens (their cases,
their court), not "all".
**Catches:** Filters that force users to translate their intent into the system's
categories. **Real failure #2:** a segmented control slicing by vakalatnama/view
access when advocates think in advocates — "show me Meera's cases today". The audit
never asked what mental model the filter served.

### Pass 4 — Break it with real weather
**Question:** What does every data-driven region do at N items, at zero, with the
longest real string, in the other language?
**How:** In the code, find every render over data (`.map(`, list components, tab
generators). For each, ask four questions mechanically: what happens at 2× and 10×
the demo count; at zero; with the longest legitimate value (full Malayalam party
names, 40-character court names); with two items fighting for the same fixed space.
Look for the tells in source: fixed widths, `nowrap`, horizontal tab bars over
unbounded sets, truncation with no overflow story. Then actually change the mock
data and look — demo data is always the flattering case.
**Catches:** Designs calibrated to the demo dataset. **Real failure #1 (the other
half):** the court tab bar works at Kerala's 4 courts and breaks at any state with
more — nobody asked "what if there are more courts?", which is the first question
real content asks of every container.

### Pass 5 — Mark the exception, mute the norm
**Question:** Does every badge, tag, and highlight mark a deviation — or the default?
**How:** For each marker on screen, count how many sibling items would carry it under
real data. If most items carry it, it labels the norm and is noise — invert it: say
nothing for the expected case, mark only the departure (view-only, overdue, adjourned).
Then check the reverse: is any exception the user must not miss currently unmarked
because the norm got the ink? Signal is deviation; the default should be silent.
**Catches:** Screens where emphasis is spent restating what the user already assumes,
so real anomalies have nothing left to stand out with. **Real failure #3:** cards
announced "my vakalatnama" — the default condition — instead of quietly flagging the
rare one, the case where the viewer holds no vakalat.

### Pass 6 — Census the patterns
**Question:** What interaction patterns has this screen established, and which
element breaks its own screen's rules?
**How:** Enumerate every interactive affordance and group by mechanism: what reveals
on hover, what is persistent, what is click-through, what confirms. Each group should
have one membership rule ("repeated cards resolve their action on hover"). Any
element outside its group's rule is a finding unless it can name a real difference in
urgency or importance that earns the exception — "it's the top card" is not a reason.
Do this as an explicit written census; a pattern inventory held in your head is a vibe.
**Catches:** Local decisions that quietly fork the screen's own interaction grammar.
**Real failure #6:** every card revealed "View case" on hover except the Now card,
which kept a persistent button — no inventory was ever taken, so the fork went unseen.

### Pass 7 — Sweep the siblings
**Question:** For every pair of sibling surfaces: is the same fact rendered the same
way, and are the frames themselves consistent?
**How:** This is Nielsen's "consistency and standards" run as an actual sweep, not a
feeling. List sibling sets (cards within a panel, panels within a rail, the same card
across views). For each pair, diff two things: frame properties (alignment, padding,
corner treatment) and fact rendering — build a small table of shared data types
(time, status, overdue-ness, person) versus how each sibling shows them. Any fact
with two treatments across siblings is a defect; pick one. Do it pairwise and
exhaustively; consistency failures live precisely in the pairs you didn't compare.
**Catches:** Drift between things built at different times that now sit side by side.
**Real failure #4:** two adjacent task cards showed overdue-ness as a red pill on one
and red ink on the next, and the two rail panels were aligned differently — both
visible in one glance, both invisible to an audit that inspected each card alone.

### Pass 8 — Judge it on the render
**Question:** Have you looked at the actual pixels — at real size, on the real
surface, with real overlaps — or only at the source?
**How:** Screenshot the running screen, not the component in isolation. Zoom into
every place two fills meet: overlapping elements, tinted surfaces under light
foregrounds, thin rings doing separation work. Sample and compute contrast where it
looks marginal — the code says `ring-white`, only the render says whether a white
ring separates two beige-on-beige discs. Check alignment by measuring, not by
squinting. Source review proves legality; only the render proves legibility.
**Catches:** Everything that is correct in tokens and wrong in light. **Real failure
#5:** avatar discs on sunken beige cards separated only by a faint white ring — a
combination no token audit flags, because every individual token was legal.

## 3. Ordering

Run them in the order above. Walk the Tuesday first, because it produces the intent
every later judgment is measured against — a pattern census without a task narration
just enforces consistency of possibly-wrong choices. Then structure (domain layout,
control vocabulary) before behavior, because a screen with the wrong hierarchy makes
polishing its cards a waste. Then stress and defaults, which test the structure's
honesty against real data. Systems sweeps (pattern census, sibling sweep) next, once
you know what the patterns should be. Render judgment last — it is the only pass that
can veto a sign-off all by itself, so it must see the post-fix screen, not the draft.

## 4. The tells of a shallow audit

You're rule-checking, not thinking, when: every finding cites a guideline and none
cites a user consequence; you never changed the mock data; you accepted the existing
layout as the frame and only judged what's inside it; you inspected each element once
and never compared two elements to each other; your findings are phrased in component
names ("the SegmentedControl…") instead of domain names ("the advocate…"); you signed
off without a screenshot; zero findings surprised you; and the report has no finding
that would require restructuring — real screens almost always have at least one. Any
of these mid-audit: stop, go back to Pass 1, and re-enter with the narration running.
