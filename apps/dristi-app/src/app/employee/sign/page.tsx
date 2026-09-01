import type { Metadata } from "next";

import { SignScreen } from "@/components/employee/sign-screen";

export const metadata: Metadata = { title: "Sign" };

/**
 * Everything waiting for the bench's signature — the screen the rail's single Sign row
 * leads to, and the only place the per-kind breakdown appears now that the rail carries
 * one row instead of seven.
 *
 * A server component: the screen is a report, not an interaction — nothing here signs
 * anything. `lib/employee/sign.ts` says exactly what the data is and is not.
 */
export default function EmployeeSignPage() {
  return <SignScreen />;
}
