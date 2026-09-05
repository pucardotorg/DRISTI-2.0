import {
  CalendarDaysIcon,
  FileSearchIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SignatureIcon,
  type LucideIcon,
} from "lucide-react";

import { APPROVE_COPY_QUEUE_COUNT } from "./approve-copy-application";
import { DELAY_CONDONATION_QUEUE_COUNT } from "./delay-condonation";
import { hearingById, TODAYS_HEARING_COUNT } from "./hearings";
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
 * **Most of it is not wired yet.** The three Hearings rows, both Actions rows —
 * Register cases and Approve copy application — all three Review applications rows —
 * Rescheduling request, Delay condonation and Others — and six of the Sign rows — Sign
 * forms, Sign orders, Sign bail bonds, Sign witness deposition, Sign evidence and Sign
 * A-Diary — have an `href`, and they point at the court-side routes that exist. Every
 * other row is a real, focusable control that says plainly it goes nowhere — no stub
 * routes, no hrefs that 404. Giving a row its destination later is the one `href` line
 * below.
 *
 * **The counts are demo data, with a few exceptions.** They are the reference's numbers,
 * kept so the rail can be judged at the widths it will really see (`1312` is the one that
 * decides how a row truncates). None of these labels describes an action this build
 * performs. The exceptions are the built rows whose counts are derived from the lists
 * they lead to (`lib/employee/hearings.ts`, `lib/employee/schedule.ts`,
 * `lib/employee/register-cases.ts`, `lib/employee/approve-copy-application.ts`,
 * `lib/employee/rescheduling-request.ts`,
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

/** The bench's work, in the four groups the reference names. The rail opens one. */
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
        label: "Today’s hearings",
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
      {
        id: "approve-copy",
        label: "Approve copy application",
        href: "/employee/approve-copy-application",
        count: APPROVE_COPY_QUEUE_COUNT,
      },
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

/**
 * The court's home, and the head of every trail.
 *
 * It is not a rail row and cannot be one — the two rows that stand above the groups both
 * leave DRISTI — so the top bar's trail is the only path back to it anywhere in the
 * court's chrome. `app/employee/page.tsx` takes its heading from here rather than
 * spelling it again, so a crumb and the screen it leads to cannot end up calling one
 * destination two things.
 */
export const COURT_HOME = { href: "/employee", label: "Court home" } as const;

/**
 * A row is current when its href is this page. Today's hearings also owns the two
 * routes nested under one of its listings — that listing's case overview
 * (`/employee/hearings/<id>`) and the order composer under it
 * (`/employee/hearings/<id>/order`). Both are still the day's list seen closer up,
 * not a new destination.
 *
 * The nested segment is resolved against the cause list rather than matched as a bare
 * `[^/]+`, which would steal `/employee/hearings/schedule` and
 * `/employee/hearings/bulk-reschedule` — siblings, not children. Asking `hearingById`
 * is the one test that cannot go stale on the next route: a third sibling added
 * tomorrow will not be a listing id either, so it will not be captured either, and
 * nobody has to remember to add it to a list of exceptions here. An id no cause list
 * holds gets no section, which is the truth about it and the same answer both screens
 * behind these routes give.
 *
 * It sits with the data rather than in the rail because the rail is no longer the only
 * thing that asks. The top bar's trail works out which section it is standing in from
 * the same answer, and two implementations of "which row is this page" would eventually
 * disagree — about these two routes first, since they are the ones whose answer is not
 * simply their own href.
 */
const NESTED_LISTING = /^\/employee\/hearings\/([^/]+)(?:\/order)?\/?$/;

export function isCourtNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/employee/hearings") return false;
  const nested = NESTED_LISTING.exec(pathname);
  return nested !== null && hearingById(nested[1]) !== undefined;
}

/** One step of the trail. */
export type CourtCrumb = {
  label: string;
  /**
   * Where the crumb goes. Absent on a section, which is a disclosure in the rail and not
   * a route — there is no page called "Sign".
   */
  href?: string;
};

/**
 * Where this page sits, as the steps above it — root, section, and the queue it is
 * nested under.
 *
 * **The page itself is never a step.** Every one of the thirteen queue screens already
 * opens with a heading that is its rail label word for word — "Sign orders" under Sign
 * orders — so a trail ending in the same words would restate, in the quietest type on
 * the screen and eight pixels up, what the loudest type is about to say. What the heading
 * cannot say is which of the four kinds of work this is one of, and how to get back out
 * of it. That is what is left here, and all of it is a step you can actually take.
 *
 * It reads the rail's own data, so a section renamed in `COURT_NAV_GROUPS` is renamed in
 * the trail by the same edit. Nothing below names a section.
 *
 * Three shapes come out of it:
 *
 * - `/employee` — empty. Nothing is above the court home, and the rule has no exception:
 *   a lone `Court home` crumb would restate the heading 40-odd pixels below it, which is
 *   the one thing this function exists to prevent. The bar keeps its fill and its seam
 *   and carries no trail, which is what chrome looks like at the origin.
 * - `/employee/sign-orders` — root, then `Sign`. The heading says which queue.
 * - `/employee/hearings/<id>` and `/employee/hearings/<id>/order` — root, `Hearings`,
 *   then `Today's hearings` as a link back to the day's list. Here the heading names a
 *   case rather than a queue, so the queue is genuinely above the page and genuinely
 *   somewhere to return to.
 *
 * A route this file does not know gets the root as a link and stops. That is the whole of
 * what can be said honestly about it, and it is still the way home. The two standalone
 * links are absent from every trail because both leave DRISTI; a route nested under one
 * of them would need its own step, on the day one exists.
 */
export function courtTrail(pathname: string): CourtCrumb[] {
  if (pathname === COURT_HOME.href) return [];

  const home: CourtCrumb = { label: COURT_HOME.label, href: COURT_HOME.href };

  for (const group of COURT_NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.href || !isCourtNavActive(pathname, item.href)) continue;
      const trail: CourtCrumb[] = [home, { label: group.label }];
      // The row earns a step only when it is above this page rather than being it —
      // which is exactly when the path is not the row's own href.
      if (pathname !== item.href) {
        trail.push({ label: item.label, href: item.href });
      }
      return trail;
    }
  }

  return [home];
}
