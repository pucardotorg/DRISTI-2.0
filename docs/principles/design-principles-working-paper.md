# PUCAR design principles — foundation working paper

**Status:** Research synthesis for discussion · not an adopted principles document  
**Audience:** People shaping products, features, services, processes, rules, and technology at PUCAR  
**Prepared:** 24 August 2026

## The direct answer

PUCAR does not need a longer list of desirable qualities. It needs a small hierarchy of
convictions that resolves the recurring conflicts in justice-system design.

A useful PUCAR principle should make a reasonable alternative lose. It should tell us, for
example, what to do when court efficiency conflicts with a litigant's burden; when automation
conflicts with human judgment; when national consistency conflicts with local reality; or when
openness conflicts with privacy. If a statement cannot change a decision, expose a violation,
or make a critique more objective, it is probably a value, standard, method, or aspiration—not
one of the constitutional principles.

The current WIP contains the beginnings of a strong constitution, but it mixes four different
layers:

1. **Constitutional commitments** — what PUCAR will protect when good outcomes conflict.
2. **Practice disciplines** — how PUCAR learns and makes decisions.
3. **Standards** — mandatory, testable baselines such as accessibility, security, privacy,
   interoperability, and statutory compliance.
4. **Feature pillars** — the two or three outcomes a particular piece of work must preserve.

Separating these layers will make the constitutional principles fewer, sharper, and much more
useful in critique.

## 1. What the four founding convictions reveal

The four examples supplied for this round are not generic aspirations. Each resolves a different
kind of conflict that repeatedly appears in justice-system design. Together they suggest four
constitutional questions for every intervention:

1. **Capability:** Does the person leave better able to understand and navigate the legal process?
2. **Authority:** Does every consequential act remain with the role legally competent to perform it?
3. **Access:** Can the person facing the highest barrier still exercise the right in practice?
4. **Deliberation:** Is effort removed where it is waste, but retained where it protects agency,
   trust, legality, or fair process?

These questions are more useful than a general instruction to be user-centred because they name
what PUCAR will protect when speed, convenience, throughput, and legal legitimacy pull in
different directions.

### Leave the person more capable

The first conviction goes beyond providing correct information. It asks the product to build
**legal capability**: after a flow, a litigant should understand something they did not understand
before—what is happening, why it matters, what may happen next, and what they can do.

The trade-off is not education versus task completion. It is **dependency versus capability**.
A product can complete a transaction quickly while leaving the person unable to interpret the
result or act without assistance the next time. Equally, it can bury a person in educational
content that obstructs the task. The product should teach at the point of need and in proportion
to the decision, so understanding grows as the matter progresses.

This is consistent with PUCAR's view that the court exists to serve the litigant and that a
process should be judged by what it cost the person and what it moved forward for them.
[PUCAR, “Our approach”](https://pucar.org/approach/)

### Software must follow authority, not manufacture it

The summons-status example exposes a principle missing from the current WIP. A digital workflow
must not expand a person's lawful authority merely because the interface needs someone to press
a button. If a magistrate alone can determine or formally mark a legal status, assigning that act
to a bench clerk does not become valid because the system calls it data entry.

This is more precise than role-based access control. Every consequential action should be traced
to the law, rule, order, or approved practice that gives a role authority to perform it. The
system may let one role record an observation or place evidence before the court while reserving
the legal determination for the competent authority. Where the desired workflow requires an
unauthorised act, the answer is to redesign the workflow or change the governing rule—not to
normalise the violation in software.

The underlying trade-off is **workflow convenience versus institutional legitimacy**. Protecting
the real boundary may add a hand-off or confirmation, but it preserves accountability and keeps
staff from being coerced into acts they should not own.

### No right should depend on digital fluency

The third conviction treats DRISTI as rights infrastructure, not simply a digital channel. The
meaningful test is whether a person facing the highest barrier—because of disability, literacy,
language, device, connectivity, confidence, location, or need for assistance—can still use the
service and preserve their legal position.

This is deeper than meeting an accessibility standard, though conformance remains mandatory. It
means learning directly with people with disabilities and other excluded groups; providing
accessible, assisted, offline, and representative routes as parts of the same service; and not
making the exceptional route inferior, obscure, or dependent on personal goodwill.

Core accessibility should not depend on proving a disability. Features such as readable type,
screen-reader compatibility, keyboard access, clear language, captions, and adequate time should
be available by default. Evidence may be proportionate only where a specific accommodation
changes a legal procedure or entitlement; even then, the method of establishing need must not
itself become an inaccessible barrier. This distinction should be checked with legal and
disability-rights expertise before it becomes policy.

### Deliberateness matters more than minimum effort

The fourth conviction rejects friction reduction as a universal objective. Click count is not a
measure of justice. In high-stakes contexts, a pause can make authority visible, help a person
understand a consequence, invite correction, record consent, or prevent an irreversible error.
Removing that pause may make an interface faster while making the service less trustworthy or
fair.

The administrative-burden literature remains important: learning, compliance, and psychological
costs can prevent people from accessing rights and fall hardest on people with the fewest
resources. [Herd and Moynihan, *Journal of Economic Perspectives*,
2025](https://www.aeaweb.org/articles?id=10.1257%2Fjep.20231394) The design task is therefore not
to maximise or minimise friction. It is to distinguish **protective friction**, which earns its
cost by safeguarding a person or the process, from **waste friction**, which merely exports
institutional complexity.

### The shared logic

All four convictions place something deliberately when the system is under pressure:

- knowledge should accumulate with the person, not remain monopolised by the institution;
- legal authority should remain with the role that lawfully holds it;
- the burden of inclusion should sit with the service, not the person facing exclusion; and
- effort should sit at consequential decisions, not across the whole journey by default.

That is a promising constitutional spine. The remaining principles should protect the conditions
that make it real: fair participation, visible consequences, recoverability, local truth, and
institutional continuity.

## 2. What makes a principle usable

The best external examples are useful less for their wording than for their construction.

### A principle is a bias in a real trade-off

Intercom describes product-design principles as tools for choosing between options that are
valuable along different dimensions. It also offers a useful falsification test: the opposite of
a principle should be a plausible principle; otherwise the statement is probably a truism.
[Intercom, “Foundations to build on,” 2021](https://www.intercom.com/blog/intercom-product-principles/)

“Be accessible,” “build good software,” and “make it trustworthy” fail this test because nobody
argues for their opposites. “Design first for the person most likely to be excluded, even when a
majority path becomes less elegant” creates a real bias and can change a design.

### A principle should be concise, memorable, and decisive

Ben Brignell's field guide reduces the writing criteria to those three qualities. The short line
must be repeatable in a review; the explanation can carry the nuance. A principle guides
judgment rather than trying to replace it with a rigid procedure.
[Design Principles, “Writing Design Principles”](https://principles.design/examples/writing-design-principles)

### A principle should encode PUCAR's own learning

Intercom treats principles as encoded patterns from repeated successes and mistakes and revisits
them periodically. Its top-level principles are inherited by everyone, with discipline-specific
principles below them. [Intercom, “The principles behind how we build,”
2019](https://www.intercom.com/blog/podcasts/intercom-on-product-ep04/)

The GP document reaches the same conclusion from fieldwork. Its most important move was from
a complete process document to a smaller principle artefact grounded in what the organisation
could actually carry. It found that principles needed shared language, rituals, critique, and
visible consequences—not just careful prose. See *Docbook_Abhiram*, especially pp. 99–130.

### A principle should govern a decision, not duplicate a standard

The Government of India's UX4G handbook and Digital Service Standard already provide broad,
testable expectations for accessible, usable, consistent government services. PUCAR's own
product documentation similarly separates statutory requirements from standards such as WCAG,
security, DPDP, performance, and interoperability. [UX4G Handbook](https://www.ux4g.gov.in/assets/img/pdf/UX4G-Handbook.pdf) ·
[NeGD Digital Service Standard](https://negd.gov.in/digital-service-standard/) ·
[DRISTI standards](../product/standards/adherence.md)

Those are essential gates, but repeating them as constitutional principles weakens both layers.
The principle should explain the bias that produces a higher bar—for example, designing the
primary path around exclusion rather than testing accessibility after the path is complete.

### A principle needs an observable violation

For every candidate, the team should be able to name:

- a reasonable alternative it rejects;
- a situation in which it becomes costly to uphold;
- observable signs that it has been violated; and
- evidence that would show whether it improved the outcome.

If no well-intentioned team could violate it, it will not help critique.

## 3. Lessons from established principle-led systems

### Government Digital Service: service, context, and purposeful restraint

The UK Government Design Principles are durable because they are phrased as actions and linked
to concrete consequences: start with needs, do less, do the hard work to make things simple,
understand context, build services rather than websites, and be consistent rather than uniform.
The service principle explicitly connects the digital and real-world parts of a journey.
[GOV.UK Government Design Principles](https://www.gov.uk/guidance/government-design-principles)

Transferable lesson for PUCAR: do not let a screen become the unit of design. A filing flow is
also a rule, a registry practice, a document hand-off, a deadline, an alert, an assisted channel,
and a recovery path.

### Intercom and Linear: reject plausible alternatives

Intercom's “opinionated by default, flexible under the hood” and Linear's “purpose-built” and
“say no to busy work” work because they reject reasonable product philosophies: maximum
configuration, generic flexibility, or comprehensive task capture. They therefore produce
predictable choices. [Intercom product principles](https://www.intercom.com/blog/intercom-product-principles/) ·
[Linear Method](https://linear.app/method/introduction)

Transferable lesson for PUCAR: a principle should declare a choice such as “nationally
consistent, locally truthful,” not merely “adaptable.”

### Design Justice: impact and participation over intent

The Design Justice Network centres people directly affected by a design, prioritises community
impact over designer intent, treats lived experience as expertise, and looks for what already
works locally before introducing a new solution.
[Design Justice Network Principles](https://designjustice.org/read-the-principles)

Transferable lesson for PUCAR: “evidence-based” cannot mean analytics alone or research only
with the easiest system actors to reach. It must include the people who bear the consequence,
especially those excluded by the present process.

### Digital development: participation, redress, and stewardship

The Principles for Digital Development combine co-design with feedback and redressal, inclusion,
people-first data practices, openness, harm mitigation, sustainability, and evidence for outcomes.
[Principles for Digital Development](https://digitalprinciples.org/principles/)

Transferable lesson for PUCAR: participation without a route to correction is consultation,
not shared power. Post-launch redress belongs inside the design.

### Apple: simplicity is not visual minimalism

Apple's current principles distinguish simplicity from minimalism: a design may need more
context in order to be easier to understand and safer to act on. It also frames agency as
control plus forgiveness and responsibility as anticipating misuse and real-world harm.
[Apple, “Principles of great design,” 2026](https://developer.apple.com/videos/play/wwdc2026/250/)

Transferable lesson for PUCAR: “build less” must not become “show less” when the missing
information is what lets a person understand a consequence or exercise a right.

## 4. Justice-specific foundations PUCAR should not treat as generic UX

### Rights must be strengthened by digitisation

The eCourts Phase III vision says digitisation should guard constitutional and legal rights and
increase the legal system's ability to secure them. It frames access and inclusion as founding
concerns and justice as a service across a complete lifecycle—not the digital replication of a
paper process. [e-Committee, Supreme Court of India, *Digital Courts Vision & Roadmap*,
2021 draft / 2022 final publication](https://ecommitteesci.gov.in/document/vision-document-for-phase-iii-of-ecourts-project/)

This strongly supports retaining **Rights Enhancing** as a constitutional idea, provided each
feature can say which ability became stronger: understanding, filing, participating, complying,
being heard, correcting, challenging, obtaining a remedy, or preserving a legal position.

### Fair process is an experience outcome

Court research identifies respect, voice, neutrality, and trust as core contributors to perceived
procedural fairness. Clear reasons and a genuine chance to tell one's side matter even when the
outcome is adverse. [Judicial Branch of California, Procedural Fairness](https://courts.ca.gov/programs-initiatives/court-outreach/procedural-fairness/about)

This exposes a gap in the current WIP. “Autonomy” is not only freedom to choose in an interface.
In a justice system, it includes a person's opportunity to participate, understand why something
happened, correct the record, and challenge a consequential action, while the competent human
authority remains responsible for judgment.

### Human primacy must be designed, not declared

The Supreme Court's June 2026 draft AI regulations place AI below human judgment, require
transparency, explainability, accountability, auditability, proportional safeguards, and human
review for higher-risk uses, and prohibit replacement of human decision-making. They remain a
draft, but they make the direction of travel unusually explicit.
[Supreme Court of India, Draft Regulations for Use of AI in Courts, 2026](https://cdnbbsr.s3waas.gov.in/s3ec0490f1f4972d133619a60c30f3559e/uploads/2026/06/2026060342.pdf)

PUCAR's own submission adds an important operational lesson: a principle without a qualification
threshold, accountable institution, independent standard setter, and lifecycle owner can collapse
into documentation. [PUCAR comments on the draft AI regulations](https://pucar.org/sc-ai-policy/)

### Local inclusion and common infrastructure belong together

The eCourts vision combines offline and assisted access, regional-language support, open standards,
interoperability, modularity, scalability, and resilience. It also distinguishes common standards
from forced uniformity. DRISTI's product model mirrors this: one national legal spine, configured
per state for rules, language, practice, filer mix, and volume.
[eCourts Phase III vision](https://cdnbbsr.s3waas.gov.in/s388ef51f0bf911e452e8dbb1d807a81ab/uploads/2021/04/2021040344.pdf) ·
[DRISTI national/state model](../product/national-vs-state.md)

This makes “Adaptable” too general. PUCAR has a more specific and distinctive choice to encode:
preserve a common legal and data spine while making the service locally truthful.

## 5. Diagnosis of the current WIP

| Current entry | What is strong | What should change |
|---|---|---|
| **Build less, but better** | Recognises attention and complexity as costs. | Reframe as choosing the smallest intervention that changes the outcome. Do not confuse fewer visible elements with a simpler or safer service. |
| **Rights enhancing** | Sets a threshold beyond digitising the status quo. | Express it through practical capability: name what the person will understand or be able to do that they could not before. “Rights enhancing” alone does not yet decide a design. |
| **Access enhancing** | Starts with people at the edge of access. | Merge with or replace **Accessible**. Design from the person facing the highest barrier; do not frame people as a “lowest common denominator” or treat them as a later accommodation. |
| **Citizen Centricity** | Defines the person as end and institutional convenience as means. | Prefer **litigant** or **person affected**. Preserve neutrality between parties; do not imply favouring one citizen's case outcome. |
| **Reduce Suffering** | Treats attention and stress as scarce; discourages avoidable choice. | Replace blanket friction reduction with a distinction: remove waste created by institutional complexity, while retaining proportionate friction that protects understanding, authority, consent, review, or legal position. |
| **Evidence-Based** | Requires honesty about unknowns and discourages unsupported certainty. | Move to practice disciplines. Evidence includes law, lived experience, operations, quantitative data, and domain judgment. Require counter-evidence; rights are not contingent on A/B-test performance. |
| **Accessible** | States a necessary public-service baseline. | Accessibility conformance belongs in standards. The constitutional commitment is stronger: no person's practical access to a right should depend on vision, literacy, language, connectivity, device, confidence, or unassisted use. |
| **Transparent and Trustable** | The record-integrity paragraph is specific and distinctive. | Split “nothing consequential changes silently” from generic transparency. Add notice, reason, correction, challenge, privacy boundaries, and durable export. |
| **Autonomy** | Correctly resists biased or automated consequential decisions. | Reframe around lawful authority, voice, procedural fairness, and contestability. The interface must not allocate a legal act to someone who cannot lawfully perform it; “the user decides” is not accurate for adjudication. |
| **Adaptable** | Recognises legal, procedural, and local change as normal. | Replace with the specific doctrine: one common spine, explicit state layers, and graceful change without losing provenance or continuity. |

## 6. Candidate principle territories—not final wording

These are intentionally one level before polished prose. They identify the decisions the final
principles must govern. There are still too many; they should be tested against real decisions
and collapsed before final language is written. The first ten are candidate constitutional
commitments; the last two are better treated as practice disciplines.

### 1. The litigant's outcome is the end

When institutional convenience, operator throughput, or delivery speed conflicts with a
litigant's just, timely, seamless, and predictable path, design around the litigant while
preserving neutral treatment of all parties.

**Rejects:** treating pendency, disposal, clicks, or staff convenience as sufficient evidence of
public value.

### 2. Leave people more capable

At each meaningful stage, help the person understand what is happening, why it matters, what may
happen next, and what they can do. Teach at the point of need and in proportion to the decision,
so completing the process also increases the person's legal capability.

**Rejects:** completing a transaction while leaving the person dependent, unexplained legal
jargon, generic education detached from the task, and information overload disguised as
empowerment.

### 3. Software follows authority; it does not manufacture it

Every consequential act in the product must remain with the role legally competent to perform
it. Trace that act to its source of authority; distinguish recording a fact from making a legal
determination; and redesign or formally change the workflow when the desired actor lacks
authority.

**Rejects:** treating a login or permission setting as legal competence, asking staff to own a
status or decision outside their jurisdiction, and hiding an institutional-rule change inside a
product flow.

#### First precedent: marking summons status

On the facts supplied, a bench clerk was asked to mark a summons “delivered” or “undelivered,”
although that legal determination belonged to the magistrate. The interface collapsed two
different acts: **recording the available facts or report** and **determining the summons' legal
status**. This violates the principle even if the clerk has system permission and the workflow is
faster.

A principle-aligned design would represent the acts separately: the clerk may record or attach
the information they are authorised to handle, with provenance; the magistrate makes or confirms
the determination; and the resulting status shows its responsible authority. Any additional
handoff is protective friction because it preserves jurisdiction and accountability. This
example should be validated against the governing law, rules, and court practice before it is
adopted as formal precedent.

### 4. No right depends on digital fluency

Design from the person facing the highest barrier. Accessible, assisted, offline, representative,
and language-appropriate routes are the service—not exceptions to it—and must preserve the same
legal position and dignity.

**Rejects:** majority-path optimisation followed by accommodation, inaccessible proof of need,
digital-only assumptions, and an assisted route that is slower, obscure, discretionary, or
inferior by design.

### 5. Make routine action effortless and consequential action deliberate

Remove work that adds no protective value. At actions that materially affect a right, obligation,
record, deadline, payment, disclosure, or case outcome, add only the friction needed to make the
consequence, authority, and opportunity to correct clear.

**Rejects:** click count as a universal success measure, indiscriminate confirmation screens,
warning fatigue, and speed that makes a high-stakes action easier to perform than to understand.

#### How to distinguish protective friction from waste

| Test | Protective friction | Waste friction |
|---|---|---|
| **Purpose** | Prevents a named, credible harm or protects a right, legal boundary, consent, privacy, record, or fair process. | Exists because “the process requires it,” without a defensible benefit to the person or proceeding. |
| **Stakes** | Its cost is proportionate to consequence and reversibility. | Treats every action as high-risk, or creates large burdens for negligible risk. |
| **Understanding** | Adds information, reflection, verification, or a meaningful opportunity to correct. | Adds delay, repetition, anxiety, or ceremony without improving the decision. |
| **Timing** | Appears at the decision it protects and disappears elsewhere. | Interrupts the whole journey or appears so often that people learn to dismiss it. |
| **Agency** | Allows back, edit, save, seek help, use another channel, or escalate to the proper authority. | Traps, coerces, or blocks without explanation, recovery, or an equivalent path. |
| **Equity** | Remains accessible and does not transfer disproportionate effort to the person facing the highest barrier. | Requires extra literacy, dexterity, documents, travel, connectivity, or insider knowledge from those least able to supply it. |
| **Evidence** | The team can observe both the harm prevented and the burden introduced. | It survives by habit and nobody knows whether it helps. |

Rules of thumb:

1. **Name the harm.** If the team cannot state what credible harm the friction prevents, remove it.
2. **Scale to stakes and reversibility.** Routine, reversible acts should favour sensible defaults
   and undo. Material or irreversible acts may justify review and confirmation.
3. **Add understanding, not waiting.** A useful pause changes what the person knows or can correct;
   elapsed time alone protects nothing.
4. **Put it at the decision point.** Do not spread one legitimate safeguard across the entire
   journey.
5. **Design risk out first.** Prefer safe defaults, constrained choices, previews, validation, and
   recovery over warnings that ask people to manage avoidable system risk.
6. **Verify authority as well as intent.** Confirmation cannot cure the fact that the actor lacks
   legal competence to perform the act.
7. **Preserve an accessible way through.** A safeguard that excludes or coerces is badly designed,
   even when its purpose is legitimate.
8. **Measure both sides.** Track prevented error or harm alongside time, abandonment, assistance,
   exclusion, and anxiety introduced.

A simple friction ladder can guide implementation:

1. **Effortless or undoable** for routine, low-stakes, reversible actions.
2. **Contextual cue or preview** when a person needs information but the consequence is modest.
3. **Review and explicit confirmation** for material or difficult-to-reverse actions.
4. **Reason, attestation, and competent-authority check** for acts that change legal status or
   materially affect another person.
5. **Block and route to the proper authority** when the act would be unlawful or outside the
   actor's competence.

The ladder is not a substitute for legal analysis. It prevents teams from treating all friction
as either inherently good or inherently bad.

### 6. The system carries the burden

The more power the institution has to know, coordinate, verify, or recover something, the less
of that work it should transfer to the person. Ask only for what is legally necessary or changes
an outcome; reuse what is already known; make the institution manage its own complexity.

**Rejects:** forms, choices, visits, status chasing, and document carriage that exist because
systems or departments do not coordinate.

### 7. Nothing consequential happens invisibly

Every consequential action, status change, and decision is attributable, timestamped, durable,
and visible with an intelligible reason to the people entitled to see it. The affected person can
participate, correct relevant facts, and challenge the action; corrections preserve history;
transparency never becomes indiscriminate exposure of sensitive data.

**Rejects:** silent mutations, unexplained statuses, untraceable records, and “the system did it”
as an accountability answer, nominal human approval, and efficiency that weakens fair process.

### 8. Design the service where it breaks

Design the journey across rules, people, institutions, online and offline channels, and external
systems. Assume networks, integrations, documents, and staffing will fail. Recovery must preserve
work and legal position, and assisted routes must remain real routes.

**Rejects:** happy-path screens that push failure, deadlines, or reconciliation onto the person.

### 9. One spine, locally true

Keep national law, core semantics, and shared capabilities consistent; represent state rules,
language, volume, and practice as explicit, attributable layers. Prefer consistency and
interoperability to forced uniformity.

**Rejects:** one workflow pretending local differences do not exist, and state forks that lose
the common legal and data model.

### 10. Build to be outlived

Courts, records, rights, and responsibilities must survive a vendor, technology, team, or
deployment. Use open and documented standards, portable data, replaceable components, durable
records, and clear institutional ownership.

**Rejects:** lock-in, undocumented interpretation, proprietary dead ends, and continuity that
depends on one person or provider.

### Practice discipline A. Learn with the people who bear the consequence

Combine law, lived experience, operational observation, quantitative evidence, and domain
expertise. Include the people most likely to be excluded, seek counter-evidence, state what is
unknown, and continue measuring the intended and unintended outcome after launch.

**Rejects:** “the user asked for it,” analytics alone, research only with available professionals,
and post-hoc evidence used to defend a decision already made.

### Practice discipline B. Use the smallest intervention that changes the outcome

Do not default to a feature. Choose the smallest coherent intervention across product, process,
rule, service, content, integration, or training that produces the intended change. Reuse before
building and remove work that no longer earns its place.

**Rejects:** feature accumulation, digital duplication of a broken process, and solving an
institutional problem by asking the user to do more.

## 7. The document should work like a constitution

The constitutional metaphor is useful if it creates a hierarchy, not a grand tone.

### Preamble

State what the principles are for: resolving decisions when several legitimate outcomes compete.
Say explicitly that they do not replace law, safety, rights, or adopted standards.

### Articles

Keep the constitutional set to roughly six to eight principles. Each article should contain:

1. **Memorable title** — repeatable in conversation.
2. **Decision rule** — one sentence that establishes the bias.
3. **Conviction** — why PUCAR holds it.
4. **The tension** — the reasonable alternative it rejects.
5. **In practice** — two to four implications across product, service, and policy.
6. **Violation signals** — what reviewers can observe.
7. **Evidence** — what would show the principle is being upheld.
8. **A hard example** — a case where following it costs something.

### Schedules

Keep versioned standards outside the constitutional prose: accessibility, security, privacy,
performance, legal requirements, AI qualification, interoperability, content, and design-system
conformance. These can evolve faster without rewriting PUCAR's fundamental commitments.

### Case law

Maintain a small decision-precedent log. When a principle resolves a difficult review, record the
tension, evidence, decision, dissent or exception, and outcome. Abstract language becomes usable
through precedent.

### Amendment rule

Review the document on a regular cadence, but amend a principle only when repeated decisions,
field evidence, or a contradiction shows that it produces the wrong behaviour. Avoid both
untouchable doctrine and calendar-driven churn.

## 8. How the principles should enter critique

The GP document's critique ritual is the right operational seed: **Principle → Observation →
Question**. For PUCAR, add the consequence and the affected party:

1. **Principle:** Which shared commitment is at stake?
2. **Observation:** What does the design or service actually do?
3. **Consequence:** Who gains, who carries the cost, and what right or outcome moves?
4. **Evidence:** What do we know, and what remains an assumption?
5. **Question:** What constraint or trade-off produced this choice?
6. **Decision:** If the principle is overridden, who owns the exception and where is it recorded?

This avoids “I like / I don't like,” makes hidden trade-offs legible, and prevents the principle
from becoming a slogan cited only after a decision is made.

## 9. Tests for the next drafting round

Before a candidate enters the constitution, it should pass all eight tests:

- **PUCAR-specific:** Could a competent unrelated company publish it unchanged? If yes, sharpen it.
- **Conflict-bearing:** Does it resolve a recurring tension between legitimate options?
- **Opposable:** Is its opposite a plausible design philosophy rather than obvious negligence?
- **Cross-medium:** Does it guide a feature, product, service, process, and policy decision?
- **Observable:** Can a reviewer point to a concrete violation?
- **Costly:** Is there a situation in which keeping it requires giving something up?
- **Measurable:** Can the team name evidence of behaviour and outcome without reducing the
  principle to one metric?
- **Memorable:** Can a person use the short line in a live review without opening the document?

## 10. Questions to settle before prose is polished

1. Is this constitution for PUCAR's full portfolio or specifically for DRISTI and court
   transformation? The core can be shared, but examples and some articles will differ.
2. Should the primary moral unit be named **litigant**, **person affected**, **justice seeker**, or
   something else? “Citizen” is not precise enough for every court context.
3. At each major stage of a matter, what should a litigant understand or be able to do that they
   could not before? This will make “leave people more capable” observable rather than rhetorical.
4. Which actions and statuses in DRISTI create legal consequences, and what source gives each role
   authority to perform them? The summons example should become the first precedent in an
   authority map.
5. Which accommodations should be universal and available without proof, and when—if ever—does a
   procedural accommodation lawfully require evidence of need? This needs direct participation by
   people with disabilities and legal review.
6. Which existing workflows contain deliberate friction that protects rights or trust, and which
   merely reproduce institutional burden? Test the proposed friction ladder against both kinds.
7. When the interests of complainant, accused, advocate, court staff, and the institution conflict,
   which conflicts should the principles resolve and which must remain matters of law or judicial
   discretion?
8. Which three past PUCAR decisions best represent “we were at our best,” and which three represent
   a failure or near miss the organisation must not repeat? The final principles should encode
   those cases, not only external research.
9. Who will have authority to say that a design violates a principle, and who can approve and
   record an exception?
10. Where will critique precedents live, and at which reviews must principles be used explicitly?
11. Which existing standards are sufficiently enforced that they can safely remain outside the
   constitution?

The next step should not be polishing ten principle paragraphs. It should be a case-testing round:
apply the four founding convictions and the other candidate territories to a small set of real
PUCAR decisions, including the summons-status example; observe where they resolve the decision or
collide; collapse the constitutional set to six to eight; and only then write the final language.

## Scope and limitations

- This working paper is a synthesis, not legal advice or an adopted PUCAR position.
- The external scan prioritised first-party principles, official Indian public-service and court
  sources, and original or specialist research. It was intended to find transferable construction
  patterns, not to catalogue every published design-principles set.
- The Supreme Court AI regulations cited here are still a draft. They are evidence of a proposed
  governance direction, not a binding standard.
- DRISTI's confirmed product-user personas and complete in-product scope remain open in the
  repository. Candidate language avoids filling those gaps with invented assumptions.
- The GP document was reviewed across its research logic, diagnosis, principle-artefact evolution,
  critique mechanism, validation, and conclusion; the pages most directly used here are listed in
  the sources.
- The candidate territories have not yet been tested against a representative set of PUCAR
  decisions or co-authored with the people expected to use them. That is the material next
  evidence gap.

## Sources consulted

### PUCAR and DRISTI

- [PUCAR — Our approach](https://pucar.org/approach/)
- [PUCAR — The litigant's journey](https://pucar.org/litigant-journey/)
- [PUCAR — Comments on the Supreme Court's draft AI regulations](https://pucar.org/sc-ai-policy/)
- [DRISTI product foundation](../product/product-foundation.md)
- [DRISTI national/state model](../product/national-vs-state.md)
- [DRISTI standards adherence](../product/standards/adherence.md)
- [DRISTI open product questions](../product/open-questions.md)
- *Docbook_Abhiram.pdf*, especially pp. 99–130 and 157–164
- Attached WIP, “Design Principles”

### Primary and specialist references

- [e-Committee, Supreme Court of India — Vision document for Phase III of the eCourts Project](https://ecommitteesci.gov.in/document/vision-document-for-phase-iii-of-ecourts-project/)
- [Supreme Court of India — Draft Regulations for Use of AI in Courts, 2026](https://cdnbbsr.s3waas.gov.in/s3ec0490f1f4972d133619a60c30f3559e/uploads/2026/06/2026060342.pdf)
- [Government of India — UX4G Handbook](https://www.ux4g.gov.in/assets/img/pdf/UX4G-Handbook.pdf)
- [National e-Governance Division — Digital Service Standard](https://negd.gov.in/digital-service-standard/)
- [GOV.UK Government Design Principles](https://www.gov.uk/guidance/government-design-principles)
- [Design Justice Network Principles](https://designjustice.org/read-the-principles)
- [Principles for Digital Development](https://digitalprinciples.org/principles/)
- [Judicial Branch of California — Procedural Fairness](https://courts.ca.gov/programs-initiatives/court-outreach/procedural-fairness/about)
- [Herd and Moynihan — “Administrative Burdens in the Social Safety Net,” 2025](https://www.aeaweb.org/articles?id=10.1257/jep.20231394)
- [Intercom product principles](https://www.intercom.com/blog/intercom-product-principles/)
- [Intercom — The principles behind how we build](https://www.intercom.com/blog/podcasts/intercom-on-product-ep04/)
- [Linear Method — Principles and practices](https://linear.app/method/introduction)
- [Apple — Principles of great design](https://developer.apple.com/videos/play/wwdc2026/250/)
- [Design Principles — Writing Design Principles](https://principles.design/examples/writing-design-principles)
