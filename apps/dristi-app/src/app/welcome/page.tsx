import Link from "next/link";
import type { Metadata } from "next";

import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Welcome",
};

/**
 * `/welcome` — the role chooser for the whole platform.
 *
 * This is where the two areas branch:
 *
 *   - **Citizen** (`/citizen`) — everyone outside the court: advocates, their clerks,
 *     litigants, party-in-person, PoA-holders.
 *   - **Employee** (`/employee`) — court staff: magistrate, bench clerk, scrutiny officer.
 *
 * NOT wired to the root URL yet, on purpose. Root (`/`) still opens the existing
 * advocate/litigant sign-in so the citizen work in flight is not disturbed. When the
 * split is enforced later — root becomes this chooser and the citizen screens move
 * under `/citizen` — that is a single deliberate change; nothing here needs to move.
 */
const DOORS = [
  {
    href: "/citizen",
    title: "Citizen",
    description:
      "Advocates, clerks, litigants — anyone filing or following a case from outside the court.",
  },
  {
    href: "/employee/login",
    title: "Court staff",
    description:
      "Magistrates, bench clerks and scrutiny officers working cases inside the court.",
  },
] as const;

export default function WelcomePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandLockup className="h-8" />
        <div className="flex flex-col gap-2">
          <h1 className="text-title-l font-semibold text-balance">
            Welcome to 24×7 ON Courts
          </h1>
          <p className="text-body text-muted-foreground text-balance">
            Choose how you are here today.
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {DOORS.map((door) => (
          <Card key={door.href} className="justify-between">
            <CardHeader>
              <CardTitle className="text-title-s font-semibold">
                {door.title}
              </CardTitle>
              <CardDescription className="text-body-compact">
                {door.description}
              </CardDescription>
            </CardHeader>
            <div className="px-6">
              <Button asChild className="w-full">
                <Link href={door.href}>Continue</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
