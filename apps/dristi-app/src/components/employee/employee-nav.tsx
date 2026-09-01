"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SettingsIcon } from "lucide-react";

import { CURRENT_STAFF, greetingFor } from "@/lib/employee/content";
import { cn } from "@/lib/utils";
import { useCourtNavLayout, type CourtNavLayout } from "@/lib/employee/nav-layout";
import {
  courtNavWork,
  COURT_NAV_VIEWS,
  type CourtNavItem,
} from "@/lib/employee/navigation";
import { BrandLockup } from "@/components/brand-lockup";
import {
  ChromeRail,
  RAIL_BRAND_ROW,
  RAIL_MUTED,
  RAIL_ROW,
  railRowNote,
} from "@/components/chrome/app-chrome";
import { CHARCOAL_PLATE } from "@/components/chrome/rail-plate";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * only what is the bench's — who is greeted, what the main rows of work are (see
 * `lib/employee/navigation.ts` for the shape and its history), and which of them the
 * court can actually reach yet.
 *
 * The plate is charcoal, always. A magistrate's rail is institutional chrome; it does not
 * read a preference store and it offers no picker.
 */

/** What the row says out loud past its label. The count is a mark; the words go here. */
function spokenNote(item: CourtNavItem): string {
  return railRowNote([
    item.count !== undefined &&
      (item.count === 0
        ? "nothing waiting"
        : `${item.count.toLocaleString("en-IN")} waiting`),
    item.external && "opens outside DRISTI",
    !item.href && "not available yet",
  ]);
}

/**
 * What a row is made of, in both the link and the not-yet-a-link case.
 *
 * The label truncates and the count does not: a count is the whole point of the row, and
 * a count losing a digit would be a lie where a clipped label is only an inconvenience.
 *
 * A zero count renders no mark at all. The count exists to say how much is waiting, and
 * an empty queue has nothing to say — a spark against a nought would report an obligation
 * that is not there. The row stays and the absence is the answer; a screen reader is told
 * "nothing waiting" outright rather than left with silence.
 */
function RowContents({
  item,
  primary = false,
}: {
  item: CourtNavItem;
  /** The row is sitting on the primary fill — inks switch to its foreground pair. */
  primary?: boolean;
}) {
  const Icon = item.icon;
  const note = spokenNote(item);
  return (
    <>
      {/* Every rail row carries a mark now that every row is a destination; the
          placeholder branch keeps the labels aligned if a markless row ever returns.
          16px in muted ink — the same box and ink the group-label glyphs used — so the
          marks read as wayfinding, not as a louder species of icon than the labels.
          On the primary fill the mark takes the fill's own foreground, never grey on
          colour. */}
      {Icon ? (
        <Icon
          aria-hidden
          className={cn(
            "size-4!",
            primary ? "text-primary-foreground" : "text-(--rail-muted)",
          )}
        />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {note ? <span className="sr-only">, {note}</span> : null}
      {primary && item.count !== undefined && item.count > 0 ? (
        /* On the primary fill the numeral rides the fill's own foreground and the red
           spark stays home: the fill already says "this is the one", and a destructive-
           family dot on the teal would be a second, wrong claim. */
        <span
          aria-hidden
          className="shrink-0 text-caption tabular-nums text-primary-foreground"
        >
          {item.count.toLocaleString("en-IN")}
        </span>
      ) : item.count !== undefined && item.count > 0 ? (
        /* How much is waiting: a quiet numeral with a small spark beside it.
           This is the advocate rail's `TasksCount` treatment, adopted rather than
           re-derived. That rail was deliberately pulled back from a full red pill —
           it "read as an alarm bolted to the nav". The red also claimed the wrong thing:
           `--rail-badge` resolves to `--destructive-solid`, and the DS reserves that
           family for irreversible or dangerous actions. A queue is workload. The red
           survives as the 6px spark — enough to say "live obligation" without shouting
           a number that is already legible as text.

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
          {/* Grouped the way the screens write the same number — two surfaces should
              not spell one count two ways. */}
          {item.count.toLocaleString("en-IN")}
        </span>
      ) : null}
    </>
  );
}

/**
 * One row: a link when it has somewhere to go, and an explained dead control when it does
 * not. The dead one is still a button and still takes focus — a control that can be
 * reached and asked why it does nothing is worth more than one that cannot be reached.
 */
function CourtNavRow({ item }: { item: CourtNavItem }) {
  const pathname = usePathname();

  if (item.href) {
    const isActive = pathname === item.href;
    /* The primary fill sits on the row at rest; the standard white-card inversion
       still says "you are here" when the row is the open page, so the two states
       never fight — primary is what the row is, active is where the reader is. The
       `!` marks beat the plate's own row inks, which are var-driven and would
       otherwise win the cascade. */
    const primaryAtRest = !!item.primary && !isActive;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            RAIL_ROW,
            primaryAtRest &&
              "bg-primary! text-primary-foreground! hover:bg-primary-hover!",
          )}
        >
          <Link href={item.href} aria-current={isActive ? "page" : undefined}>
            <RowContents item={item} primary={primaryAtRest} />
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

/** The greeting is time-of-day, so it is a snapshot of an external clock, not state. */
const NEVER_CHANGES = () => () => {};
const readGreeting = () => greetingFor(new Date());

/**
 * Who is at the bench, in the rail's own voice.
 *
 * Two lines on purpose rather than a sentence left to wrap where it lands: the greeting
 * carries the ink and the name carries the muted ink, and splitting them keeps that
 * reading intact whether the name is "Uddipan" or four words long. The block is body
 * copy, not a title — the rail should not out-shout the page it sits beside.
 *
 * The hour that matters is the reader's, not the server's, so the greeting is read
 * through `useSyncExternalStore`: the server renders its own guess, the browser replaces
 * it on hydration, and there is no mismatch to suppress and no blank first paint. It does
 * not re-subscribe to the clock — a rail that has been open since 16:59 is not worth a
 * timer, and the next navigation settles it.
 */
function CourtGreeting() {
  const greeting = React.useSyncExternalStore(
    NEVER_CHANGES,
    readGreeting,
    readGreeting,
  );

  return (
    <div className="p-4">
      <p className="text-body font-semibold wrap-break-word">
        <span className="block">{greeting},</span>
        <span className={`block font-normal ${RAIL_MUTED}`}>
          {CURRENT_STAFF.name}
        </span>
      </p>
    </div>
  );
}

/**
 * The rail's head: the mark at the page origin, then who is at the bench.
 *
 * The brand row is the bar's own height and carries the plate's seam, so the rule under
 * it and the rule under the top bar are one continuous line across the whole chrome.
 * `onDark` follows the plate, not the app's mode — charcoal stays charcoal at night.
 */
function CourtRailHeader() {
  return (
    <>
      <div className={RAIL_BRAND_ROW}>
        <BrandLockup className="h-8 shrink-0" onDark={CHARCOAL_PLATE.darkPlate} />
      </div>
      <CourtGreeting />
    </>
  );
}

/**
 * The rail's settings — one control at the foot of the plate, and inside it the one
 * setting there is: which shape the day's navigation takes. Both layouts are the
 * owner's, kept side by side on purpose; the radio wording names what each one shows
 * rather than a version number. The choice is this browser's only — it lives in
 * `nav-layout.ts`, not in any court record.
 */
function RailSettings({
  layout,
  onLayoutChange,
}: {
  layout: CourtNavLayout;
  onLayoutChange: (layout: CourtNavLayout) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton type="button" className={RAIL_ROW}>
                  <SettingsIcon aria-hidden className="size-4! text-(--rail-muted)" />
                  <span className="min-w-0 flex-1 truncate">Settings</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {/* Opens upward off the rail's foot so it never runs off-screen. */}
              <DropdownMenuContent side="top" align="start" className="w-64">
                <DropdownMenuLabel>Day navigation</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={layout}
                  onValueChange={(value) =>
                    onLayoutChange(value as CourtNavLayout)
                  }
                >
                  <DropdownMenuRadioItem value="schedule">
                    One combined schedule
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="split">
                    Hearings and actions apart
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function EmployeeNav() {
  const [layout, setLayout] = useCourtNavLayout();

  return (
    /* Rows that go nowhere explain themselves on hover and on focus; at the DS default of
       0ms that turns a sweep down the rail into a strobe. */
    <TooltipProvider delayDuration={500}>
      <ChromeRail
        plate={CHARCOAL_PLATE}
        navLabel="Court navigation"
        sheetTitle="Court navigation"
        sheetDescription="Hearings, today's actions, applications and signing for this court."
        header={<CourtRailHeader />}
        footer={<RailSettings layout={layout} onLayoutChange={setLayout} />}
      >
        {/* Two flat runs with one rule between them: the courtroom's work above, the
            views out of DRISTI below. The work run follows the layout the Settings
            control holds; the rows themselves live in `lib/employee/navigation.ts`. */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {courtNavWork(layout).map((item) => (
                <CourtNavRow key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {COURT_NAV_VIEWS.map((item) => (
                <CourtNavRow key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </ChromeRail>
    </TooltipProvider>
  );
}
