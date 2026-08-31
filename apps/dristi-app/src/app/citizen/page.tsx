import { redirect } from "next/navigation";

/**
 * `/citizen/*` — everyone outside the court: advocates, clerks, litigants, parties in
 * person, PoA-holders.
 *
 * The URL exists so the role split has both halves and `/welcome` has somewhere to send
 * people, but the citizen screens have not moved under it yet — that work is in flight and
 * moving it mid-flow would break it. So this forwards to the sign-in that already lives at
 * the root. When the citizen area is really built here, this file is what it replaces, and
 * nothing that links to `/citizen` has to change.
 */
export default function CitizenPage() {
  redirect("/");
}
