import Link from "next/link";
import type { ReactNode } from "react";

import { AddWitnessDialog } from "@/components/cases/add-witness-form";
import { RestingCard } from "@/components/cases/case-overview-card";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ADDED_BY_LABEL,
  PARTY_INLINE_LABEL,
  PARTY_ROLE_LABEL,
  participantHref,
  witnessesForLitigant,
  type CaseWitness,
  type Litigant,
  type ParticipantsFile,
} from "@/lib/cases/parties";
import { cn } from "@/lib/utils";

/**
 * Everyone on the case: one grouped list, and a pane for whoever is open.
 *
 * **Rows are links, so selection is not state.** Each row is an anchor to
 * `?selected=`, which buys four things a click handler would have to re-earn:
 * a participant is deep-linkable, a refresh lands on the same person, the
 * server renders the pane the URL asked for, and keyboard operation is the
 * browser's own Tab-and-Enter rather than a hand-rolled roving tabindex. This
 * is navigation between views, not a form control, so it is a `nav` of links
 * with `aria-current` (ACCESSIBILITY: prefer native semantics). It also means
 * the whole section is a server component — no `use client`, no router, no
 * hydration cost.
 *
 * **Layering (ui-craft §4).** Page → this one panel → wells inside it. The
 * master list sits on the card fill; the detail pane's fact rows are the only
 * wells. Selection is a single quiet cue — `accent-strong`, the DS's
 * documented selected fill — never fill *and* border *and* bar stacked.
 *
 * **No categorical colour** (ds-requests #1, open and blocking): side chips
 * and witness-number chips render neutral.
 *
 * ## Three things the mockup drew that are not here
 *
 * Each would have had the screen assert something the product cannot.
 *
 * **"BAR REGISTERED" tag on every advocate.** No bar-registration field exists
 * anywhere in the model and no product doc records one. The tag is a
 * *verification*: rendering it would tell a court user the registry has
 * confirmed something it has never been asked. Omitted outright rather than
 * stubbed — a stubbed verification is worse than none.
 *
 * **"Edit party" button.** The product treats a change to litigant details as
 * an application to the magistrate, so the button would have to open the Raise
 * application flow. `application-type-guide.ts` ships eight types —
 * advancement/reschedule, bail, condonation of delay, production of documents,
 * settlement, transfer, withdrawal, others — and none is an
 * edit-litigant-details type. "Others" is a free-text catch-all; routing a
 * specific action into it would be inventing the product's mapping rather than
 * reading it. Omitted, because the alternatives were a dead button or an
 * invented flow.
 *
 * **"Case timeline associations" tiles.** "Appeared on <date>" is not
 * derivable: `hearings-dummy.json` records attendance as opaque
 * `participantIds` (`PARTY-C-001`, `PARTY-A-001`) with no registry mapping
 * them to parties — and one `PARTY-A-001` covers all three accused on c-1001,
 * so no per-party appearance date exists to show. "Represented by" restated
 * the Representation section directly above it, and named one advocate where
 * two are assigned. The section became **Linked witnesses**, derived from data
 * that does exist and shown nowhere else on the pane.
 *
 * Absent by omission rather than error: `supportPeople` stays in the model.
 * This mockup has no surface for juniors and clerks; the data and its
 * derivation are intact for the next one that does.
 */
const HEADING_ID = "parties-heading";

export function CaseParticipants({
  file,
  caseId,
  selectedId,
}: {
  file: ParticipantsFile;
  caseId: string;
  selectedId: string | undefined;
}) {
  const litigant = file.litigants.find((row) => row.id === selectedId);
  const witness = file.witnesses.find((row) => row.id === selectedId);

  return (
    <section className="min-w-0" aria-labelledby={HEADING_ID}>
      <RestingCard className="min-w-0">
        <CardContent className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 id={HEADING_ID} className="text-title-s font-semibold">
              Parties
            </h2>
            {/* Both counts as plain muted text. The mockup put the litigant
                count in a filled chip and the witness count in plain text —
                one data type, two presentations, which is the inconsistency
                ui-craft names outright. */}
            <p className="text-body text-muted-foreground">
              <span className="tabular-nums">
                {plural(file.counts.litigants, "litigant", "litigants")}
              </span>
              {" · "}
              <span className="tabular-nums">
                {plural(file.counts.witnesses, "witness", "witnesses")}
              </span>
            </p>
          </div>
          {/* The one teal in the region (Ration teal). */}
          <AddWitnessDialog />
        </CardContent>

        <Separator />

        {/* Master and detail, divided by a rule on the card fill rather than
            boxed — a panel per pane would be the box-in-box the elevation
            foundation rules out.

            Below `lg` they stack: list first, then the pane for the open row.
            Not a drill-in with a back affordance, because there is no state to
            go back *to* — a row is a link, so the browser's own back button
            already returns the reader wherever they came from, and a stacked
            list keeps the other participants one scroll away rather than one
            navigation away (RESPONSIVE — stack before splitting). */}
        <CardContent className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,18rem)_auto_minmax(0,1fr)]">
          <MasterList file={file} caseId={caseId} selectedId={selectedId} />
          {/* self-stretch, not h-full: the grid is items-start, so an
              auto-height track would leave the rule measuring itself. */}
          <div className="flex self-stretch lg:justify-center">
            <Separator className="lg:hidden" />
            <Separator orientation="vertical" className="hidden lg:block" />
          </div>
          {litigant ? (
            <LitigantDetail file={file} litigant={litigant} caseId={caseId} />
          ) : witness ? (
            <WitnessDetail witness={witness} />
          ) : (
            <SectionNote>Select a participant to see their details.</SectionNote>
          )}
        </CardContent>
      </RestingCard>
    </section>
  );
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * A section eyebrow.
 *
 * The DS has no `overline` type role — the 11 named styles are the eight sizes
 * plus weight and mono variants — so this is `text-caption` at the weight
 * ui-craft sanctions for eyebrows, muted. Sentence case, not the mockup's
 * all-caps mono: the Laws put ALL-CAPS in the "never" list, and `font-mono` in
 * this app is reserved for identifiers the registry assigns (witness numbers),
 * not for styling a label.
 */
function Eyebrow({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-caption font-semibold text-muted-foreground">
      {children}
    </p>
  );
}

function SectionNote({ children }: { children: ReactNode }) {
  return <p className="text-body text-muted-foreground">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Master                                                              */
/* ------------------------------------------------------------------ */

const LITIGANTS_GROUP_ID = "participants-litigants-group";
const WITNESSES_GROUP_ID = "participants-witnesses-group";

function MasterList({
  file,
  caseId,
  selectedId,
}: {
  file: ParticipantsFile;
  caseId: string;
  selectedId: string | undefined;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <nav aria-labelledby={LITIGANTS_GROUP_ID} className="flex min-w-0 flex-col gap-2">
        <Eyebrow id={LITIGANTS_GROUP_ID}>All parties</Eyebrow>
        <ul className="flex min-w-0 flex-col gap-1">
          {file.litigants.map((row) => (
            <li key={row.id}>
              <MasterRow
                href={participantHref(caseId, row.id)}
                name={row.name}
                subline={PARTY_ROLE_LABEL[row.side]}
                selected={row.id === selectedId}
              />
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-labelledby={WITNESSES_GROUP_ID} className="flex min-w-0 flex-col gap-2">
        <Eyebrow id={WITNESSES_GROUP_ID}>Witnesses</Eyebrow>
        {file.witnesses.length > 0 ? (
          <ul className="flex min-w-0 flex-col gap-1">
            {file.witnesses.map((row) => (
              <li key={row.id}>
                <MasterRow
                  href={participantHref(caseId, row.id)}
                  name={row.name}
                  subline={row.number}
                  /* A witness number is an identifier the registry assigns,
                     and this screen shows it in three places — here, the
                     detail badge, and the linked-witness rows. One data type,
                     one presentation (ui-craft). */
                  sublineMono
                  selected={row.id === selectedId}
                />
              </li>
            ))}
          </ul>
        ) : (
          /* The group keeps its heading rather than vanishing: an empty
             witness list is a fact about this case, and a heading that
             disappears makes the reader wonder whether they missed it. */
          <SectionNote>No witness has been listed yet.</SectionNote>
        )}
      </nav>
    </div>
  );
}

/**
 * One row of the master list.
 *
 * `min-h-12` rather than the 40px floor: two lines of copy do not fit a 40px
 * control, and the row is the primary target on this screen.
 *
 * Selection is *one* cue — the DS's `accent-strong` fill. The mockup drew a
 * bordered card; fill plus border plus chevron would be the stacked selection
 * costume ui-craft's loudness ladder rules out, and `border-border` is the
 * loudest non-text mark available. The chevron renders on every row so the row
 * does not change shape between states.
 */
function MasterRow({
  href,
  name,
  subline,
  sublineMono = false,
  selected,
}: {
  href: string;
  name: string;
  subline: string;
  sublineMono?: boolean;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex min-h-12 min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors",
        "focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:outline-1 focus-visible:outline-ring",
        selected ? "bg-accent-strong" : "hover:bg-accent"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-foreground">
          {name}
        </span>
        <span
          className={cn(
            "block text-body text-muted-foreground",
            sublineMono && "font-mono tabular-nums"
          )}
        >
          {subline}
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

const DETAIL_HEADING_ID = "participant-detail-heading";

function DetailHeader({
  name,
  subline,
  badge,
}: {
  name: string;
  subline: string;
  badge: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <h3
          id={DETAIL_HEADING_ID}
          className="text-title-s font-semibold text-foreground"
        >
          {name}
        </h3>
        <p className="mt-1 text-body text-muted-foreground">{subline}</p>
      </div>
      {badge}
    </div>
  );
}

/**
 * An eyebrow-labelled run of rows in the detail pane.
 *
 * A `div` with an `h4`, not a labelled `section`. As landmarks these were
 * noise — one pane emitted four regions, several of them a single row tall,
 * on top of the two master navs — while the heading outline stopped at the
 * detail `h3`, so none of them was reachable the way a reader actually moves
 * through a pane. Headings give the navigation; the landmark gave the count.
 */
function DetailSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4
        id={id}
        className="text-caption font-semibold text-muted-foreground"
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * One fact in its own well — `surface-sunken`, borderless, `rounded-md`
 * because an inset is not a control.
 */
function FactRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-md bg-surface-sunken px-3 py-2 text-body text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A litigant, and what the record attaches to them.
 *
 * Sections render only where there is something to say: a plain individual
 * complainant gets one, a partnership firm with officers and a PoA-holder gets
 * four. Padding every pane out to the same shape with "None" rows would make
 * the exceptions harder to spot, which is the opposite of the point.
 */
function LitigantDetail({
  file,
  litigant,
  caseId,
}: {
  file: ParticipantsFile;
  litigant: Litigant;
  caseId: string;
}) {
  const linkedWitnesses = witnessesForLitigant(file, litigant.id);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <DetailHeader
        name={litigant.name}
        subline={litigantSubline(litigant)}
        badge={
          <Badge variant="secondary" className="shrink-0">
            {PARTY_ROLE_LABEL[litigant.side]}
          </Badge>
        }
      />

      {/* "Representation", not the mockup's "Assigned advocates": the section
          has to head a party-in-person and a no-advocate pane too, and a
          heading naming advocates over neither is a contradiction. */}
      <DetailSection id="participant-representation" title="Representation">
        {litigant.partyInPerson ? (
          <FactRow>Party in person</FactRow>
        ) : litigant.advocates.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-2">
            {litigant.advocates.map((advocate) => (
              <FactRow key={advocate}>{advocate}</FactRow>
            ))}
          </div>
        ) : (
          <SectionNote>No advocate on record</SectionNote>
        )}
      </DetailSection>

      {litigant.powerOfAttorneyHolder ? (
        <DetailSection id="participant-poa" title="Power of attorney">
          <FactRow>{litigant.powerOfAttorneyHolder}</FactRow>
        </DetailSection>
      ) : null}

      {/* §141: the officers whose liability derives from this company. The
          subline names only the one who speaks for it, so this is the only
          place the rest of them appear on this pane. */}
      {litigant.personsInCharge.length > 0 ? (
        <DetailSection id="participant-officers" title="Persons in charge">
          <div className="flex min-w-0 flex-col gap-2">
            {litigant.personsInCharge.map((officer) => (
              <FactRow key={officer.id} className="justify-between">
                <span className="min-w-0">{officer.name}</span>
                <span className="shrink-0 text-body-compact text-muted-foreground">
                  {officer.designation ?? officer.role}
                </span>
              </FactRow>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {/* What replaced the mockup's "Case timeline associations" — see the
          honesty notes at the foot of this file. These are links, so a reader
          on a party can jump straight to the person giving evidence about
          them; it is the one cross-reference that connects the two groups of
          the master list. */}
      {linkedWitnesses.length > 0 ? (
        <DetailSection id="participant-linked-witnesses" title="Linked witnesses">
          <div className="flex min-w-0 flex-col gap-2">
            {linkedWitnesses.map((witness) => (
              <FactRow key={witness.id} className="p-0">
                <Link
                  href={participantHref(caseId, witness.id)}
                  className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:outline-1 focus-visible:outline-ring"
                >
                  <span className="min-w-0">{witness.name}</span>
                  <span className="shrink-0 font-mono text-body-compact tabular-nums text-muted-foreground">
                    {witness.number}
                  </span>
                </Link>
              </FactRow>
            ))}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

/**
 * The one line under a litigant's name.
 *
 * Derived here rather than carried on the model: a summary string on the
 * participant would be a second derivation of the same sentence, and the two
 * drifted apart within a round the last time both existed.
 *
 * A plain individual gets their standing ("Individual"), which is the honest
 * version of the mockup's "Direct litigating party in case" — that phrase
 * asserts a directness the record does not grade.
 */
function litigantSubline(litigant: Litigant): string {
  if (litigant.kind === "entity") {
    return [
      litigant.entityType,
      litigant.entityRepresentative
        ? `represented by ${litigant.entityRepresentative.name}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (litigant.represents) {
    return litigant.represents.isEntityRepresentative
      ? `Entity representative of ${litigant.represents.name}`
      : `Person in charge of ${litigant.represents.name}`;
  }
  return litigant.standing;
}

/** A witness, in the same grammar as a litigant. */
function WitnessDetail({ witness }: { witness: CaseWitness }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <DetailHeader
        name={witness.name}
        /* Never `${witness.side}`: interpolating the union reads correctly
           only because its members happen to be English words, which is the
           same casing hazard one layer down. */
        subline={
          witness.description ??
          (witness.side === "neither"
            ? "Called by neither party"
            : `Called by ${PARTY_INLINE_LABEL[witness.side]}`)
        }
        badge={
          <Badge
            variant="secondary"
            className="shrink-0 font-mono tabular-nums"
          >
            {witness.number}
          </Badge>
        }
      />

      <DetailSection id="participant-witness-record" title="On the record">
        <div className="flex min-w-0 flex-col gap-2">
          <FactRow className="justify-between">
            <span className="shrink-0 text-body text-muted-foreground">
              Side
            </span>
            <span className="min-w-0 text-right">
              {witness.side === "neither"
                ? "Neither party"
                : PARTY_ROLE_LABEL[witness.side]}
            </span>
          </FactRow>
          <FactRow className="justify-between">
            <span className="shrink-0 text-body text-muted-foreground">
              Added by
            </span>
            {/* The noun form. This is a value in a label→value row, sitting
                directly under "Side | Complainant" — the inline register
                would put two forms of one word on adjacent rows. */}
            <span className="min-w-0 text-right">
              {ADDED_BY_LABEL[witness.addedBy]}
            </span>
          </FactRow>
          <FactRow className="justify-between">
            <span className="shrink-0 text-body text-muted-foreground">
              Linked party
            </span>
            <span className="min-w-0 text-right">
              {witness.linkedParty?.name ?? (
                <span className="text-muted-foreground">None</span>
              )}
            </span>
          </FactRow>
        </div>
      </DetailSection>
    </div>
  );
}

