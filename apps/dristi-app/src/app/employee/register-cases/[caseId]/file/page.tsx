import { permanentRedirect } from "next/navigation";

/**
 * The route the full file used to be, kept for one release as a redirect to the query
 * form (brief D25).
 *
 * The file is no longer a page. It discloses below the report on the complaint's own
 * route, with `?file=1` holding the state — so Back closes it, a link still opens it, and
 * a magistrate is never on a second page with no way back to what he was reading. What
 * this route is for is everything already pointing at the old one: a bookmark, an open
 * tab, a link in somebody's notes. They land on the file, open, exactly as before.
 *
 * **Delete this with the release after the one that ships D25.** Nothing in the app links
 * here any more — `caseFileHref` builds the query form — so the only traffic is external,
 * and a redirect that outlives the links it was written for is a route nobody can tell is
 * dead. The crumb's `leaf` in `lib/employee/navigation.ts` went with the page itself.
 *
 * `permanentRedirect` rather than `redirect`: the move is permanent, and a 308 lets a
 * browser stop asking.
 */
export default async function EmployeeCaseFilePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  permanentRedirect(`/employee/register-cases/${caseId}?file=1`);
}
