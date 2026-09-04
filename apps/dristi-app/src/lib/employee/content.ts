/**
 * Who is on the court side, and which bench they sit on.
 *
 * The employee area is deliberately self-contained: nothing under `/employee` reads from
 * the citizen side and nothing there reads from here, so the two halves of the app can be
 * built in parallel without colliding.
 *
 * The roles are the judicial and ministerial roles the domain model names for a §138 trial
 * court (`docs/product/domain/actors.md`) — the magistrate takes cognizance and delivers
 * judgment, the bench clerk keeps the daily record and exhibits, the scrutiny officer
 * checks a filed complaint for defects before cognizance. No persona is invented here; who
 * actually logs in is still an open product question (`docs/product/open-questions.md`).
 */

export type CourtRole = "magistrate" | "bench-clerk" | "scrutiny-officer";

/**
 * How a role is written where it is shown to the person holding it.
 *
 * These are shortenings, not the model's names. `docs/product/domain/actors.md` calls the
 * first one *Judicial Magistrate of the First Class* — "Magistrate" drops the class, and
 * it can, because in this rail the label sits directly above "JMFC Court 1, Kollam" and
 * the court supplies what the role leaves out. A label that repeated it would read
 * "Judicial Magistrate of the First Class / JMFC Court 1, Kollam".
 *
 * Shortened downwards only. Nothing here adds an honorific, a designation or a rank the
 * model does not carry: what a particular establishment calls the person on this bench
 * arrives with the directory that replaces `CURRENT_STAFF`, and inventing it would put a
 * title on a screen that no document, order or record backs up.
 */
export const COURT_ROLE_LABEL: Record<CourtRole, string> = {
  magistrate: "Magistrate",
  "bench-clerk": "Bench clerk",
  "scrutiny-officer": "Scrutiny officer",
};

/**
 * The identity the court side runs as.
 *
 * There is no sign-in on this branch, so the area is one fixed staff member: the JMFC
 * magistrate the court-side dashboard is being built for. Real authentication replaces
 * this constant with what the court establishment's directory returns.
 *
 * `name` is a demo given name like the court and the role beside it, not a claim about
 * who sits on this bench; the directory supplies the real one. Nothing keys off it, so
 * it is safe to be wrong.
 */
export const CURRENT_STAFF: { name: string; court: string; role: CourtRole } = {
  name: "Uddipan",
  court: "JMFC Court 1, Kollam",
  role: "magistrate",
};
