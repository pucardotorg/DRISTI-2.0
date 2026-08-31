import {
  CalendarDaysIcon,
  FileSearchIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SignatureIcon,
  type LucideIcon,
} from "lucide-react";

import { TODAYS_HEARING_COUNT } from "./hearings";
import { SCHEDULING_QUEUE_COUNT } from "./schedule";

/**
 * What the bench navigates between, as data.
 *
 * The shape of the court-side rail — two standalone links, then four groups of work —
 * is transcribed from the magistrate's reference screens. It is deliberately data and
 * not markup: the rail renders whatever is here, so a row's destination, its count or
 * its position is a change to this file rather than to a component.
 *
 * **Most of it is not wired yet.** Only the three Hearings rows have an `href`, and they
 * point at the three court-side routes that exist. Every other row is a
 * real, focusable control that says plainly it goes nowhere — no stub routes, no hrefs
 * that 404. Giving a row its destination later is the one `href` line below.
 *
 * **The counts are demo data, with two exceptions.** They are the reference's numbers,
 * kept so the rail can be judged at the widths it will really see (`1312` is the one that
 * decides how a row truncates). None of these labels describes an action this build
 * performs. The exceptions are the two built rows, whose counts are derived from the lists
 * they lead to (`lib/employee/hearings.ts`, `lib/employee/schedule.ts`) — still demo data
 * underneath, but a real count of it, so the rail cannot claim a different number from the
 * screen it opens.
 *
 * The vocabulary is the court's, taken from the reference — a copy application, a delay
 * condonation, the A-Diary. `docs/product/` does not yet define these for §138, so this
 * module names them and claims nothing more about what they do.
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
  /**
   * A leading mark. Only the two standalone links above the groups carry one — they are
   * destinations in their own right, not items in a list of work.
   */
  icon?: LucideIcon;
  /** The destination lives outside DRISTI. Spoken, not marked — see `RowContents`. */
  external?: boolean;
  /** How much of this kind of work is waiting on the bench. Demo data; see above. */
  count?: number;
};

export type CourtNavGroup = {
  id: string;
  label: string;
  /**
   * The section's mark, beside its label in the disclosure header.
   *
   * An addition to the reference, which left the headers bare — asked for so the four
   * kinds of work are findable without reading.
   *
   * The rows inside a group stay unmarked: giving every row a glyph would flatten the
   * header back into the list. The two standalone links above the groups are the
   * exception — they are destinations, not work items.
   */
  icon: LucideIcon;
  items: CourtNavItem[];
};

/** The two rows that stand on their own, above the grouped work. Both leave the app. */
export const COURT_NAV_LINKS: CourtNavItem[] = [
  {
    id: "dashboards",
    label: "Dashboards",
    icon: LayoutDashboardIcon,
    external: true,
  },
  {
    id: "all-cases",
    label: "All cases",
    icon: FolderIcon,
    external: true,
  },
];

/** The bench's work, in the four groups the reference names. All open by default. */
export const COURT_NAV_GROUPS: CourtNavGroup[] = [
  {
    id: "hearings",
    label: "Hearings",
    icon: CalendarDaysIcon,
    items: [
      /* The built destinations on the court side. Where a row carries a count it is one
         of the only numbers in this rail that is not demo data: it is the length of the
         list behind it, so the rail and the screen cannot disagree about the size of the
         work. Bulk reschedule carries none — what it opens on is a range the bench
         chooses, not a queue with a size. */
      {
        id: "todays-hearings",
        label: "Today's hearings",
        href: "/employee/hearings",
        count: TODAYS_HEARING_COUNT,
      },
      {
        id: "schedule-hearing",
        label: "Schedule hearing",
        href: "/employee/hearings/schedule",
        count: SCHEDULING_QUEUE_COUNT,
      },
      {
        id: "bulk-reschedule",
        label: "Bulk reschedule hearings",
        href: "/employee/hearings/bulk-reschedule",
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    icon: ListChecksIcon,
    items: [
      { id: "register-cases", label: "Register cases", count: 4 },
      { id: "approve-copy", label: "Approve copy application", count: 0 },
    ],
  },
  {
    id: "review-applications",
    label: "Review applications",
    icon: FileSearchIcon,
    items: [
      { id: "rescheduling-request", label: "Rescheduling request", count: 20 },
      { id: "delay-condonation", label: "Delay condonation", count: 146 },
      { id: "other-applications", label: "Others", count: 325 },
    ],
  },
  {
    id: "sign",
    label: "Sign",
    icon: SignatureIcon,
    items: [
      { id: "sign-forms", label: "Sign forms", count: 45 },
      { id: "sign-orders", label: "Sign orders", count: 18 },
      { id: "sign-process", label: "Sign process", count: 1312 },
      { id: "sign-bail-bonds", label: "Sign bail bonds", count: 68 },
      { id: "sign-deposition", label: "Sign witness deposition", count: 92 },
      { id: "sign-evidence", label: "Sign evidence", count: 25 },
      // The A-Diary is the court's own register — a proper name, so it keeps its case.
      { id: "sign-a-diary", label: "Sign A-Diary", count: 4 },
    ],
  },
];
