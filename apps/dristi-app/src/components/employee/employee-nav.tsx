"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";

import {
  COURT_NAV_GROUPS,
  COURT_NAV_LINKS,
  type CourtNavGroup,
  type CourtNavItem,
} from "@/lib/employee/navigation";
import { BrandLockup } from "@/components/brand-lockup";
import {
  ChromeRail,
  RAIL_BRAND_ROW,
  RAIL_GROUP_LABEL,
  RAIL_MUTED,
  RAIL_ROW,
  railRowNote,
} from "@/components/chrome/app-chrome";
import { CHARCOAL_PLATE } from "@/components/chrome/rail-plate";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * The court-side navigation rail — the magistrate's own, not the advocate's.
 *
 * Everything about how it looks comes from the shared chrome frame: the plate, the row
 * and section metrics, the seam, the off-canvas behaviour below `md`. What lives here is
 * only what is the bench's — the four groups of work, and which of them the court can
 * actually reach yet.
 *
 * The plate is charcoal, always. A magistrate's rail is institutional chrome; it does not
 * read a preference store and it offers no picker.
 */

/** What the row says out loud past its label. The count is a mark; the words go here. */
function spokenNote(item: CourtNavItem): string {
  return railRowNote([
    item.count !== undefined &&
      (item.count === 0 ? "nothing waiting" : `${item.count} waiting`),
    item.external && "opens outside DRISTI",
    !item.href && "not available yet",
  ]);
}

/**
 * What a row is made of, in both the link and the not-yet-a-link case.
 *
 * The label truncates and the count does not: a count is the whole point of the row, and
 * `1312` losing a digit would be a lie where a clipped label is only an inconvenience.
 *
 * A zero count renders no mark at all. The count exists to say how much is waiting, and
 * an empty queue has nothing to say — a spark against a nought would report an obligation
 * that is not there. The row stays and the absence is the answer; a screen reader is told
 * "nothing waiting" outright rather than left with silence.
 */
function RowContents({ item }: { item: CourtNavItem }) {
  const Icon = item.icon;
  const note = spokenNote(item);
  return (
    <>
      {/* The glyph column is reserved on every row, not just the rows that fill it, so
          all 17 labels in the rail start at the same x. Only the two standalone links
          carry a mark; a group's rows hold the space and show nothing. Without the
          placeholder the two marked rows indent past the fifteen unmarked ones, which is
          the misalignment this rail was pulled up on. `size-4` matches the icon box above, so the two branches are the same width by construction. */}
      {Icon ? (
        /* Matched to the group headers' mark, not to this row's text: the same 16px box
           the DS gives a `SidebarGroupLabel` glyph, and the same `--rail-muted` ink.
           `RAIL_ROW` sizes row glyphs at 20px for a rail whose every row is marked; here
           only two rows are, and at 20px in full-strength ink they read as a louder
           species of icon than the four section marks they sit above. Muted also keeps
           the mark under its own label, which stays at the row's ink. */
        <Icon aria-hidden className="size-4! text-(--rail-muted)" />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {note ? <span className="sr-only">, {note}</span> : null}
      {item.count !== undefined && item.count > 0 ? (
        /* How much is waiting: a quiet numeral with a small spark beside it.
           This is the advocate rail's `TasksCount` treatment, adopted rather than
           re-derived. That rail was deliberately pulled back from a full red pill —
           it "read as an alarm bolted to the nav" — and this rail had twelve of them at
           rest, since every group opens by default. The red also claimed the wrong thing:
           `--rail-badge` resolves to `--destructive-solid`, and the DS reserves that
           family for irreversible or dangerous actions. A signing queue is workload.
           The red survives as the 6px spark — enough to say "live obligation" without
           shouting a number that is already legible as text.

           The ink has to change with the row's ground. Idle, the numeral sits on the
           charcoal plate at `--rail-muted` (6.28:1). Selected, the row inverts to the
           white card and the same ink would fall to 2.08:1 — so it switches to the
           plate's `--rail-card-muted` (5.70:1), which `CARD` names for exactly this.
           `text-caption` carries the DS's 500 weight floor, so the numeral also stays
           at one weight while the selected row's label goes to 600. */
        <span
          aria-hidden
          className={[
            "flex shrink-0 items-center gap-1.5",
            "text-caption tabular-nums",
            RAIL_MUTED,
            "group-data-[active=true]/menu-button:text-(--rail-card-muted)",
          ].join(" ")}
        >
          <span className="size-1.5 rounded-full bg-(--rail-badge)" />
          {item.count}
        </span>
      ) : null}
    </>
  );
}

/**
 * A row is current when its href is this page. Today's hearings also owns the
 * order composer nested under it (`/employee/hearings/<id>/order`) — that is
 * still the day's list, not a new destination. `startsWith` on `/employee/hearings`
 * would steal schedule and bulk reschedule, which are siblings, not children.
 */
function isCourtNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/employee/hearings") {
    return /^\/employee\/hearings\/[^/]+\/order\/?$/.test(pathname);
  }
  return false;
}

/**
 * One row: a link when it has somewhere to go, and an explained dead control when it does
 * not. The dead one is still a button and still takes focus — a control that can be
 * reached and asked why it does nothing is worth more than one that cannot be reached.
 */
function CourtNavRow({ item }: { item: CourtNavItem }) {
  const pathname = usePathname();

  if (item.href) {
    const isActive = isCourtNavActive(pathname, item.href);
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} className={RAIL_ROW}>
          <Link href={item.href} aria-current={isActive ? "page" : undefined}>
            <RowContents item={item} />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton type="button" aria-disabled className={RAIL_ROW}>
            <RowContents item={item} />
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.external
            ? "Opens outside DRISTI — not part of this build"
            : "Not part of this build"}
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

/**
 * A group of rows behind its own disclosure. Open by default; the whole header toggles.
 *
 * No nested `SidebarGroup`: each one carries `p-2`, and stacking a group per section
 * doubled the air between "All cases" and "Hearings" (and between every closed
 * disclosure) while the rows inside a menu only had `gap-1`. The outer group owns the
 * inset; this section is just another beat in that same `gap-1` column.
 *
 * The toggle is a plus when the group is shut and a minus when it is open — the sign
 * names what pressing it does, which a chevron only implies. It is decorative on purpose:
 * `aria-expanded` on the header already carries the state, and announcing the glyph too
 * would say the same thing twice and disagree with it half the time.
 */
function CourtNavGroupSection({ group }: { group: CourtNavGroup }) {
  const Icon = group.icon;
  return (
    <Collapsible defaultOpen className="group/court-group flex flex-col gap-1">
      <SidebarGroupLabel asChild className={RAIL_GROUP_LABEL}>
        <CollapsibleTrigger>
          <Icon aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">
            {group.label}
          </span>
          {/* Both signs are rendered and one is hidden, so the toggle's width never
              changes as it flips and the label's truncation point holds still. */}
          <PlusIcon
            aria-hidden
            className="hidden group-data-[state=closed]/court-group:block"
          />
          <MinusIcon
            aria-hidden
            className="group-data-[state=closed]/court-group:hidden"
          />
        </CollapsibleTrigger>
      </SidebarGroupLabel>
      <CollapsibleContent>
        <SidebarMenu className="gap-1">
          {group.items.map((item) => (
            <CourtNavRow key={item.id} item={item} />
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * The rail's head: the mark at the page origin.
 *
 * The brand row is the bar's own height and carries the plate's seam, so on phone widths
 * the rule under it and the rule under the top bar are one continuous line. `onDark`
 * follows the plate, not the app's mode — charcoal stays charcoal at night.
 */
function CourtRailHeader() {
  return (
    <div className={RAIL_BRAND_ROW}>
      <BrandLockup className="h-8 shrink-0" onDark={CHARCOAL_PLATE.darkPlate} />
    </div>
  );
}

export function EmployeeNav() {
  return (
    /* Rows that go nowhere explain themselves on hover and on focus; at the DS default of
       0ms that turns a sweep down the rail into a strobe. */
    <TooltipProvider delayDuration={500}>
      <ChromeRail
        plate={CHARCOAL_PLATE}
        navLabel="Court navigation"
        sheetTitle="Court navigation"
        sheetDescription="Hearings, actions, applications and signing for this court."
        header={<CourtRailHeader />}
      >
        {/* One group, one inset, one gap: standalone links and disclosures share the
            same vertical rhythm instead of each section padding itself. */}
        <SidebarGroup className="gap-1">
          <SidebarMenu className="gap-1">
            {COURT_NAV_LINKS.map((item) => (
              <CourtNavRow key={item.id} item={item} />
            ))}
          </SidebarMenu>
          {COURT_NAV_GROUPS.map((group) => (
            <CourtNavGroupSection key={group.id} group={group} />
          ))}
        </SidebarGroup>
      </ChromeRail>
    </TooltipProvider>
  );
}
