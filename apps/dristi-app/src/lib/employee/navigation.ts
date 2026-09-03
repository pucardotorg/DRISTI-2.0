import {
  CalendarDaysIcon,
  FileSearchIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SignatureIcon,
  type LucideIcon,
} from "lucide-react";

import { DELAY_CONDONATION_QUEUE_COUNT } from "./delay-condonation";
import { TODAYS_HEARING_COUNT } from "./hearings";
import { OTHER_APPLICATIONS_QUEUE_COUNT } from "./other-applications";
import { REGISTER_QUEUE_COUNT } from "./register-cases";
import { RESCHEDULING_QUEUE_COUNT } from "./rescheduling-request";
import { SCHEDULING_QUEUE_COUNT } from "./schedule";
import { A_DIARY_PENDING_COUNT } from "./sign-a-diary";
import { SIGN_BAIL_BOND_QUEUE_COUNT } from "./sign-bail-bonds";
import { SIGN_EVIDENCE_QUEUE_COUNT } from "./sign-evidence";
import { SIGN_FORM_QUEUE_COUNT } from "./sign-forms";
import { SIGN_ORDER_PENDING_COUNT } from "./sign-orders";
import { WITNESS_DEPOSITION_QUEUE_COUNT } from "./sign-witness-deposition";

/**
 * What the bench navigates between, as data.
 *
 * The shape of the court-side rail — two standalone links, then four groups of work —
 * is transcribed from the magistrate's reference screens. It is deliberately data and
 * not markup: the rail renders whatever is here, so a row's destination, its count or
 * its position is a change to this file rather than to a component.
 *
 * **Most of it is not wired yet.** The three Hearings rows, Register cases, all three
 * Review applications rows — Rescheduling request, Delay condonation and Others — and
 * six of the Sign rows — Sign forms, Sign orders, Sign bail bonds, Sign witness
 * deposition, Sign evidence and Sign A-Diary — have
 * an `href`, and they point at the court-side routes that exist. Every other row is a real, focusable control that
 * says plainly it goes nowhere — no stub routes, no hrefs that 404. Giving a row its
 * destination later is the one `href` line below.
 *
 * **The counts are demo data, with a few exceptions.** They are the reference's numbers,
 * kept so the rail can be judged at the widths it will really see (`1312` is the one that
 * decides how a row truncates). None of these labels describes an action this build
 * performs. The exceptions are the built rows whose counts are derived from the lists
 * they lead to (`lib/employee/hearings.ts`, `lib/employee/schedule.ts`,
 * `lib/employee/register-cases.ts`, `lib/employee/rescheduling-request.ts`,
 * `lib/employee/delay-condonation.ts`, `lib/employee/other-applications.ts`,
 * `lib/employee/sign-forms.ts`, `lib/employee/sign-orders.ts`,
 * `lib/employee/sign-bail-bonds.ts`,
 * `lib/employee/sign-witness-deposition.ts`, `lib/employee/sign-evidence.ts`,
 * `lib/employee/sign-a-diary.ts`) — still demo data
 * underneath, but a real count of it, so the rail cannot claim a different number from
 * the screen it opens. Sign orders counts only what is still pending, because that
 * screen also holds the orders this bench has signed.
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
      {
        id: "register-cases",
        label: "Register cases",
        href: "/employee/register-cases",
        count: REGISTER_QUEUE_COUNT,
      },
      { id: "approve-copy", label: "Approve copy application", count: 0 },
    ],
  },
  {
    id: "review-applications",
    label: "Review applications",
    icon: FileSearchIcon,
    items: [
      {
        id: "rescheduling-request",
        label: "Rescheduling request",
        href: "/employee/rescheduling-request",
        count: RESCHEDULING_QUEUE_COUNT,
      },
      {
        id: "delay-condonation",
        label: "Delay condonation",
        href: "/employee/delay-condonation",
        count: DELAY_CONDONATION_QUEUE_COUNT,
      },
      {
        id: "other-applications",
        label: "Others",
        href: "/employee/other-applications",
        count: OTHER_APPLICATIONS_QUEUE_COUNT,
      },
    ],
  },
  {
    id: "sign",
    label: "Sign",
    icon: SignatureIcon,
    items: [
      {
        id: "sign-forms",
        label: "Sign forms",
        href: "/employee/sign-forms",
        count: SIGN_FORM_QUEUE_COUNT,
      },
      {
        id: "sign-orders",
        label: "Sign orders",
        href: "/employee/sign-orders",
        /* The pending rows, not the whole queue: the screen also holds the orders
           this bench has already signed, and a badge that counted those would send
           the magistrate to less work than the number promised. */
        count: SIGN_ORDER_PENDING_COUNT,
      },
      { id: "sign-process", label: "Sign process", count: 1312 },
      {
        id: "sign-bail-bonds",
        label: "Sign bail bonds",
        href: "/employee/sign-bail-bonds",
        count: SIGN_BAIL_BOND_QUEUE_COUNT,
      },
      {
        id: "sign-deposition",
        label: "Sign witness deposition",
        href: "/employee/sign-witness-deposition",
        count: WITNESS_DEPOSITION_QUEUE_COUNT,
      },
      {
        id: "sign-evidence",
        label: "Sign evidence",
        href: "/employee/sign-evidence",
        count: SIGN_EVIDENCE_QUEUE_COUNT,
      },
      {
        // The A-Diary is the court's own register — a proper name, so it keeps its case.
        id: "sign-a-diary",
        label: "Sign A-Diary",
        href: "/employee/sign-a-diary",
        /* The whole unsigned register, every day of it, not just the day the screen
           opens on: a bench a day behind should be able to see that from the rail. The
           page's own count line is the one that agrees with this number. */
        count: A_DIARY_PENDING_COUNT,
      },
    ],
  },
];
