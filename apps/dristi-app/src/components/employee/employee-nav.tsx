"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MinusIcon, PlusIcon, SettingsIcon } from "lucide-react";

import { COURT_ROLE_LABEL, CURRENT_STAFF } from "@/lib/employee/content";
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
  RAIL_ICON_BUTTON,
  RAIL_MUTED,
  RAIL_ROW,
  RAIL_SEAM,
  railRowNote,
  useRailCollapsed,
} from "@/components/chrome/app-chrome";
import { CHARCOAL_PLATE } from "@/components/chrome/rail-plate";
import { Button } from "@/components/ui/button";
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
  SidebarTrigger,
  useSidebar,
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
 * and section metrics, the seam, the fold to a 4rem strip, the off-canvas behaviour below
 * `md`. What lives here is only what is the bench's — the four groups of work, which of
 * them the court can actually reach yet, and who is sitting.
 *
 * The plate is charcoal, always. A magistrate's rail is institutional chrome; it does not
 * read a preference store and it offers no picker.
 */

/**
 * A menu column in this rail.
 *
 * `items-center` is what keeps the 40px square honest once the rail is a strip: the rail
 * carries a hairline on its trailing edge, so centring by padding leaves 8px on one side
 * and 7px on the other. Centring by flex is immune to the border.
 */
const RAIL_MENU = "gap-1 group-data-[collapsible=icon]:items-center";

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
           the mark under its own label, which stays at the row's ink.

           Folded, that reasoning inverts exactly. The labels are gone, every square left
           in the strip is a mark, and a 16px glyph in a 40px square is the lost mark
           `RAIL_ROW` sizes against in the first place — so it returns to 20px and hands
           its ink back to the row, which is what lets the selected card's teal keep
           winning over it. */
        <Icon
          aria-hidden
          className={[
            "size-4! text-(--rail-muted)",
            "group-data-[collapsible=icon]:size-5!",
            "group-data-[collapsible=icon]:text-current",
          ].join(" ")}
        />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      {/* The label leaves the layout rather than being clipped by the strip's overflow: a
          flex child of zero visible width is still a flex child, and it holds a centred
          glyph hard against the leading edge. */}
      <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
        {item.label}
      </span>
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
           at one weight while the selected row's label goes to 600.

           There is no folded register for it, because no folded row carries one: the only
           rows the strip renders are the two standalone links, and neither has a count.
           Where a count goes in a folded rail is answered in `CourtNavGroupMark` —
           nowhere, and for a reason. This hides it rather than trusting that, so a row
           that gains a count tomorrow cannot quietly squeeze four digits into 40px. */
        <span
          aria-hidden
          className={[
            "flex shrink-0 items-center gap-1.5",
            "group-data-[collapsible=icon]:hidden",
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
 * What the tooltip on a row that goes nowhere says.
 *
 * Folded there is no label left on the row to explain, so the note names it first — the
 * same string the DS's own `tooltip` prop puts on a live row, with the reason after it.
 */
function deadRowNote(item: CourtNavItem, collapsed: boolean): string {
  if (item.external) {
    return collapsed
      ? `${item.label} — opens outside DRISTI, not part of this build`
      : "Opens outside DRISTI — not part of this build";
  }
  return collapsed
    ? `${item.label} — not part of this build`
    : "Not part of this build";
}

/**
 * One row: a link when it has somewhere to go, and an explained dead control when it does
 * not. The dead one is still a button and still takes focus — a control that can be
 * reached and asked why it does nothing is worth more than one that cannot be reached.
 *
 * A live row hands its label to the DS's `tooltip`, which shows only while the rail is
 * folded. None of the built rows stands outside a disclosure today, so none of them is on
 * screen in that state — but where a row sits is `navigation.ts`'s decision to change,
 * and a row promoted out of a group should not also have to remember to bring its folded
 * name with it.
 */
function CourtNavRow({ item }: { item: CourtNavItem }) {
  const pathname = usePathname();
  const collapsed = useRailCollapsed();

  if (item.href) {
    const isActive = isCourtNavActive(pathname, item.href);
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.label}
          className={RAIL_ROW}
        >
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
          {deadRowNote(item, collapsed)}
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

/** A group is current when the page open is one of its rows. */
function isCourtNavGroupActive(
  pathname: string,
  group: CourtNavGroup,
): boolean {
  return group.items.some(
    (item) => item.href !== undefined && isCourtNavActive(pathname, item.href),
  );
}

/**
 * The group, folded: its mark alone, as a peer of the two standalone links.
 *
 * This is what a folded court rail *is*, and the data decided it rather than taste.
 * Fifteen of the seventeen rows carry no icon — deliberately, so the four section marks
 * do not flatten into their own contents — so there is no version of this strip that
 * shows the rows at all. Four marks and two links is the whole of what 4rem can hold, and
 * it turns out to be the right thing to say: which kind of work you are in, and how to
 * get back to the rest of it.
 *
 * So the mark answers "where am I" by taking the selected card whenever the page open is
 * one of its rows, and pressing it opens the rail on that section rather than toggling a
 * disclosure the strip has no room to show. A flyout listing the rows beside the strip
 * would say more, but it invents an interaction this product has nowhere else — and the
 * rail is already the disclosure, so it is one press either way.
 *
 * It is a button standing on its own, not a one-item list. A section header is not a list
 * item in the open rail either — it is a `SidebarGroupLabel`, a `div` — and wrapping each
 * of the four in its own `ul` to reuse the row primitives would have a screen reader
 * announce "list, 1 item" four times down a strip of six squares.
 *
 * **No count marks here.** The open rail annotates a *queue* with its length; a section
 * stands for three to six of them, and their sum is a figure this product states nowhere
 * — Sign alone runs to four digits on a 20px glyph. The alternative, a bare dot for "work
 * is waiting", is worse than nothing: all four sections have work waiting and always do,
 * so four red dots on six squares would discriminate between exactly nothing while
 * spending the rail's whole budget for alarm. Workload is what the magistrate opens the
 * rail to read; folded, it carries where-you-are and the way back.
 */
function CourtNavGroupMark({
  group,
  isActive,
  onPress,
}: {
  group: CourtNavGroup;
  isActive: boolean;
  onPress: () => void;
}) {
  const Icon = group.icon;
  return (
    <SidebarMenuButton
      type="button"
      isActive={isActive}
      /* Not `page`: this is not the page's own link, it is the section the page sits in —
         the generic value, for the current item in a set of six. Without it the white card
         says "you are here" to everyone who can see the strip and to nobody who cannot. */
      aria-current={isActive ? true : undefined}
      tooltip={group.label}
      className={RAIL_ROW}
      onClick={onPress}
    >
      <Icon aria-hidden className="size-5!" />
      {/* The glyph is decorative, so the button needs words of its own — and they say more
          than the tooltip beside it does. The tooltip names the section for someone who
          can see the strip; this names it and its consequence for someone who cannot. */}
      <span className="sr-only">{group.label}, expands the navigation</span>
    </SidebarMenuButton>
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
 *
 * The disclosure is controlled rather than `defaultOpen` so that folding the rail is not
 * an opinion about it: the strip forces every section shut, and what each one returns to
 * is the state the magistrate last left it in. Radix unmounts a closed section's rows, so
 * the folded strip holds no invisible links for the keyboard to walk into — which is also
 * why the header swaps component rather than hides. Hiding it would have left
 * `aria-expanded="true"` on a trigger whose panel is not in the document.
 */
function CourtNavGroupSection({ group }: { group: CourtNavGroup }) {
  const Icon = group.icon;
  const pathname = usePathname();
  const collapsed = useRailCollapsed();
  const { setOpen: setRailOpen } = useSidebar();
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible
      open={open && !collapsed}
      onOpenChange={setOpen}
      /* The section's own column carries the folded centring that `RAIL_MENU` gives the
         lists, because folded the header stands in this column directly rather than
         inside one. */
      className="group/court-group flex flex-col gap-1 group-data-[collapsible=icon]:items-center"
    >
      {collapsed ? (
        <CourtNavGroupMark
          group={group}
          isActive={isCourtNavGroupActive(pathname, group)}
          onPress={() => {
            setOpen(true);
            setRailOpen(true);
          }}
        />
      ) : (
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
      )}
      <CollapsibleContent>
        <SidebarMenu className={RAIL_MENU}>
          {group.items.map((item) => (
            <CourtNavRow key={item.id} item={item} />
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * The rail's head: the mark at the page origin, and the control that folds the rail.
 *
 * The brand row is the bar's own height and carries the plate's seam, so on phone widths
 * the rule under it and the rule under the top bar are one continuous line. `onDark`
 * follows the plate, not the app's mode — charcoal stays charcoal at night.
 *
 * Mark left, control right, as on the advocate's rail. Folded, the mark goes and the
 * control stays — the opposite of the advocate's choice, and forced by a real difference
 * between the two areas. The advocate's top bar brings a trigger back whenever its rail is
 * a strip; the court's bar is `md:hidden` on purpose, because the bench fills none of its
 * three regions on a desktop. Making a 56px bar appear only while the rail is folded would
 * drop every court screen 56px each time the magistrate reached for more table width. So
 * the one square 4rem has room for is the one that gets you back out of the state, and the
 * mark returns with the rail.
 *
 * In the sheet there is no trigger at all: the sheet appends its own close control at the
 * top right, and a second one 40px from it in the same row would overlap it and mean the
 * same thing.
 */
function CourtRailHeader() {
  const { isMobile } = useSidebar();
  const collapsed = useRailCollapsed();
  return (
    <div className={RAIL_BRAND_ROW}>
      <BrandLockup
        className="h-8 shrink-0 group-data-[collapsible=icon]:hidden"
        onDark={CHARCOAL_PLATE.darkPlate}
      />
      {isMobile ? null : (
        <SidebarTrigger
          aria-label={
            collapsed ? "Expand court navigation" : "Collapse court navigation"
          }
          className={RAIL_ICON_BUTTON}
        />
      )}
    </div>
  );
}

/**
 * The monogram.
 *
 * One initial for a single name, two for a compound one. The advocate rail's
 * first-and-last rule reads "Uddipan" as "UU", which is not a pair of initials, it is a
 * stutter — and the court side runs as one staff member whose name is one word, so the
 * case that rail never meets is the only case this one has.
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/**
 * Settings — a real control that says outright that it goes nowhere.
 *
 * There is no court settings route, and the one `/settings` this app has belongs to the
 * citizen half: it renders inside the advocate's shell and its content is a litigant
 * elevating to an advocate profile. Sending a magistrate there would be worse than the
 * missing screen, and a stub route would be a promise this branch cannot keep. So the
 * control is the same explained dead control the rail's unwired rows already are —
 * focusable, hoverable, at full contrast, and honest about why nothing happens. `disabled`
 * would take it out of the tab order and leave the magistrate no way to ask.
 *
 * It leaves with the labels when the rail folds. A strip has room for one mark at its
 * foot, and that mark is the person rather than a control that does nothing yet.
 */
function CourtSettingsControl() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-disabled
          aria-label="Court settings"
          className={`${RAIL_ICON_BUTTON} group-data-[collapsible=icon]:hidden`}
        >
          <SettingsIcon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Court settings — not part of this build
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The rail's foot: who is sitting, and on which bench.
 *
 * A block, not a menu. The advocate's footer is a popover because an advocate's account
 * has things to switch between — a litigant profile, a sandbox user, a rail plate. None
 * of those exist here: the court side runs as one staff member with no sign-in, and the
 * plate is charcoal by decision rather than by preference (`rail-plate.ts`). A trigger
 * that opens a menu with nothing actionable in it is worse than the plain fact it hides,
 * so the fact is what this renders.
 *
 * Three lines rather than the advocate's two. Which bench a magistrate is sitting on is
 * part of who they are on this screen — every order and form the sign queues produce is
 * headed with that court — and the chrome says it nowhere else, because the mark at the
 * head of the rail is the product's and not the court's.
 *
 * The name is `CURRENT_STAFF`'s demo given name; no honorific and no designation are
 * added to it here.
 *
 * Folded, the text goes `sr-only` rather than `hidden`. The disc keeps the initial, and
 * the identity stays in the accessibility tree in both states — which is what a static
 * block can offer in place of the tooltip a control would get, and it beats hanging a
 * person's name off a hover the keyboard cannot reach.
 */
function CourtIdentityFooter() {
  const { name, court, role } = CURRENT_STAFF;
  return (
    <div
      className={`flex items-center gap-3 border-t ${RAIL_SEAM} p-3 group-data-[collapsible=icon]:justify-center`}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--rail-avatar) text-caption font-semibold text-(--rail-avatar-ink)"
      >
        {initialsOf(name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:sr-only">
        <span className="truncate text-body-compact font-medium">{name}</span>
        {/* One weight down the whole block, so a long court name never starts competing
            with the person's; the step between them is size and ink. */}
        <span className={`truncate text-caption font-medium ${RAIL_MUTED}`}>
          {COURT_ROLE_LABEL[role]}
        </span>
        <span className={`truncate text-caption font-medium ${RAIL_MUTED}`}>
          {court}
        </span>
      </div>
      <CourtSettingsControl />
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
        collapsible="icon"
        navLabel="Court navigation"
        sheetTitle="Court navigation"
        sheetDescription="Hearings, actions, applications and signing for this court."
        header={<CourtRailHeader />}
        footer={<CourtIdentityFooter />}
      >
        {/* One group, one inset, one gap: standalone links and disclosures share the
            same vertical rhythm instead of each section padding itself. */}
        <SidebarGroup className="gap-1">
          <SidebarMenu className={RAIL_MENU}>
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
