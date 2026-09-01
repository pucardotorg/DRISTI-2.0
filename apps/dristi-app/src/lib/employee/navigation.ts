import {
  CalendarClockIcon,
  CalendarDaysIcon,
  FileSearchIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SignatureIcon,
  type LucideIcon,
} from "lucide-react";

import { TODAYS_HEARING_COUNT } from "./hearings";
import type { CourtNavLayout } from "./nav-layout";
import { SIGN_TOTAL } from "./sign";
import { ASYNC_DUE_TOTAL } from "./todays-actions";
import { SCHEDULE_TOTAL } from "./todays-schedule";

/**
 * What the bench navigates between, as data.
 *
 * The court-side rail is one flat list in two runs — the courtroom's work, then a rule,
 * then the views out of DRISTI — the shape the owner set on 2026-09-01, replacing the
 * earlier reference-transcribed disclosure groups: the grouped Actions and Review
 * applications rows folded into the Today's actions screen, signing collapsed to one
 * row, and the outside-DRISTI links became "View …" rows below the rule. The work run
 * comes in two layouts the owner keeps side by side — one combined schedule, or
 * hearings and actions apart — switched from the rail's Settings control and read from
 * `nav-layout.ts`. It is deliberately data and not markup: the rail renders whatever
 * is here, so a row's destination, its count or its position is a change to this file
 * rather than to a component.
 *
 * **Not all of it is wired.** A row without an `href` is a real, focusable control that
 * says plainly it goes nowhere — no stub routes, no hrefs that 404. Giving a row its
 * destination later is the one `href` line below.
 *
 * **Every count is derived from the list it leads to** (`lib/employee/hearings.ts`,
 * `lib/employee/todays-actions.ts`, `lib/employee/sign.ts`) — demo data underneath, but
 * a real count of it, so the rail cannot claim a different number from the screen it
 * opens. The one exception is Advance applications, whose count is stated below because
 * no screen or list exists behind it yet; when one is built, derive the count from it
 * and retire this number.
 *
 * The vocabulary is the court's. "Today's actions" is the owner's name for the async
 * cause list of the scheduling discussion — the day's paper-only actions; "Advance
 * applications" is named by the owner and not yet defined or built. `docs/product/`
 * does not define these for §138 yet, so this module names them and claims nothing
 * more about what they do.
 */

export type CourtNavItem = {
  id: string;
  /** Sentence case, per the DS Laws — the reference's Title Case does not survive them. */
  label: string;
  /**
   * Where the row goes. Absent means the destination is not built: the row still renders
   * and still takes focus, and says so rather than pretending. Wiring it is this line.
   */
  href?: string;
  /** The row's mark. Every rail row carries one — they are all destinations now. */
  icon?: LucideIcon;
  /** The destination lives outside DRISTI. Spoken, not marked — see `RowContents`. */
  external?: boolean;
  /** How much of this kind of work is waiting on the bench. Derived; see above. */
  count?: number;
  /**
   * The rail's one primary row — the day's schedule, filled the way a primary action
   * is. At most one row may carry this (the Ration Teal Law: one strong mark per view).
   */
  primary?: boolean;
};

/** The rows both layouts share, after the day's own rows. */
const COMMON_WORK: CourtNavItem[] = [
  {
    id: "bulk-reschedule",
    label: "Bulk reschedule hearings",
    icon: CalendarClockIcon,
    href: "/employee/hearings/bulk-reschedule",
  },
  {
    id: "advance-applications",
    label: "Advance applications",
    icon: FileSearchIcon,
    /* Stated, not derived — the exception documented above. The number is demo data so
       the row can be judged with the mark it will really carry. */
    count: 12,
  },
  {
    id: "sign",
    label: "Sign",
    icon: SignatureIcon,
    href: "/employee/sign",
    count: SIGN_TOTAL,
  },
];

/**
 * The combined layout: the day as one schedule — the owner's clubbing (2026-09-01) of
 * the earlier "Today's hearings" and "Today's actions" rows. The schedule is the
 * primary view: `/employee` lands there, its row carries the primary fill, and its
 * count is the whole day (hearings and actions summed). The cause list and the action
 * queues are reached through it.
 */
export const COURT_NAV_WORK_SCHEDULE: CourtNavItem[] = [
  {
    id: "todays-schedule",
    label: "Today's schedule",
    icon: CalendarDaysIcon,
    href: "/employee/todays-schedule",
    count: SCHEDULE_TOTAL,
    primary: true,
  },
  ...COMMON_WORK,
];

/**
 * The split layout: the day as two rows — the shape the rail had before the clubbing,
 * kept demonstrable behind the rail's Settings switcher. Hearings and the paper
 * actions stand apart, no row is primary, and `/employee` lands on the cause list.
 */
export const COURT_NAV_WORK_SPLIT: CourtNavItem[] = [
  {
    id: "todays-hearings",
    label: "Today's hearings",
    icon: CalendarDaysIcon,
    href: "/employee/hearings",
    count: TODAYS_HEARING_COUNT,
  },
  {
    id: "todays-actions",
    label: "Today's actions",
    icon: ListChecksIcon,
    href: "/employee/todays-actions",
    count: ASYNC_DUE_TOTAL,
  },
  ...COMMON_WORK,
];

/** The work rows for a layout — the one switch the rail renders from. */
export function courtNavWork(layout: CourtNavLayout): CourtNavItem[] {
  return layout === "split" ? COURT_NAV_WORK_SPLIT : COURT_NAV_WORK_SCHEDULE;
}

/**
 * Below the rule: the ways out of DRISTI to look at things, not courtroom work. The
 * rail draws a separator between the two runs so the boundary is visible, not just
 * implied by the labels.
 */
export const COURT_NAV_VIEWS: CourtNavItem[] = [
  {
    id: "view-all-cases",
    label: "View all cases",
    icon: FolderIcon,
    external: true,
  },
  {
    id: "view-dashboards",
    label: "View dashboards",
    icon: LayoutDashboardIcon,
    external: true,
  },
];
