/**
 * Task routes, as plain values.
 *
 * These live in a **non-client** module on purpose. `TASKS_HOME` used to be exported from
 * `components/shell/app-sidebar.tsx`, which carries `"use client"` — so when the root
 * Server Component (`app/page.tsx`) imported it to `redirect()`, React handed the server a
 * client-reference proxy rather than the string. `redirect()` wrote that into the
 * `Location` header and Next threw `ERR_INVALID_CHAR: Invalid character in header content`,
 * 500-ing the home route while every other page stayed fine.
 *
 * A route is data, not UI, so it belongs beside the other route constants
 * (`FILINGS_HOME` / `NEW_FILING` in `lib/filing/steps.ts`) where both server and client
 * components can import it safely.
 */

/** The pending-tasks list — the tasks area's root. */
export const TASKS_HOME = "/tasks";

/** The task list with one task opened in its detail panel. */
export function taskHref(taskId: string): string {
  return `${TASKS_HOME}?task=${encodeURIComponent(taskId)}`;
}

/** The scrutiny-return correction round for a returned filing. */
export function fixHref(taskId: string): string {
  return `${TASKS_HOME}/${encodeURIComponent(taskId)}/fix`;
}
