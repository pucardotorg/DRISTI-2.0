import type { Metadata } from "next";

import { RegisterAdvocatesScreen } from "@/components/employee/register-advocates-screen";
import { APPROVE_REGISTRATIONS_TITLE } from "@/lib/employee/register-advocates";

export const metadata: Metadata = { title: APPROVE_REGISTRATIONS_TITLE };

/**
 * Every advocate and advocate-clerk registration waiting on this court's scrutiny officer
 * — the screen the rail's "Approve registrations" row leads to.
 *
 * Lives under `/employee/register-advocates` rather than nesting inside its Actions group,
 * for the reason Register cases and Approve copy application sit beside it: the group is
 * how the rail sorts the office's work, not a hierarchy the URLs owe anything to.
 *
 * There is no route per request. Deciding one happens in an overlay opened from its row —
 * the shape four other court-side review queues already use — so the officer never leaves
 * the list. The cost of that is a request cannot be deep-linked to a colleague; it is
 * accepted, and recorded in `docs/design/proposals/register-advocates.md` (D1).
 *
 * The screen is a client component throughout: the search, paging and the two decisions
 * are all interaction. There is no backend behind it —
 * `lib/employee/register-advocates.ts` says exactly what the data is and is not, and that
 * Approve and Reject perform no act.
 */
export default function EmployeeRegisterAdvocatesPage() {
  return <RegisterAdvocatesScreen />;
}
