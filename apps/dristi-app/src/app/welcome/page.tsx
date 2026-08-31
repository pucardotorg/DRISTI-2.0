import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, GavelIcon, UsersIcon } from "lucide-react";

import { BrandLockup } from "@/components/brand-lockup";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Welcome" };

/**
 * The role chooser — the one screen that knows about both areas.
 *
 * DRISTI is split by URL: `/employee/*` is the court's own staff, `/citizen/*` is everyone
 * outside it. The two never share a screen, so somebody has to ask the question once, and
 * this is where it is asked.
 *
 * Two doors, deliberately equal: no primary action and no recommended path, because
 * neither answer is the common one — the court has a handful of staff and the country has
 * everyone else, and weighting the page towards either is guessing on someone's behalf.
 *
 * The root URL still opens the citizen sign-in directly; this screen does not replace it
 * yet. It becomes the front door when the citizen screens actually move under `/citizen`.
 */
const CHOICES = [
  {
    href: "/employee",
    icon: GavelIcon,
    title: "Court staff",
    who: "Magistrate, bench clerk or scrutiny officer.",
  },
  {
    href: "/citizen",
    icon: UsersIcon,
    title: "Advocate, litigant or clerk",
    who: "Anyone filing or following a case, including a party in person or a PoA-holder.",
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center px-6 py-4">
        <BrandLockup className="h-8" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-title text-balance font-semibold sm:text-title-l">
              How do you come to the court?
            </h1>
            <p className="text-body text-muted-foreground">
              The court&apos;s side and everyone else&apos;s are separate. Pick the one
              you belong to.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CHOICES.map((choice) => {
              const Icon = choice.icon;
              return (
                <Link
                  key={choice.href}
                  href={choice.href}
                  className="group/choice rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
                >
                  {/* The lifted panel does the separating; the hover fill is the DS's own
                      `accent`, so the whole card reads as the target rather than a title
                      inside it. */}
                  <Card className="h-full gap-4 border-hairline shadow-raised transition-colors group-hover/choice:bg-accent">
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground">
                          <Icon aria-hidden className="size-5" />
                        </span>
                        <ArrowRightIcon
                          aria-hidden
                          className="mt-3 size-4 shrink-0 text-muted-foreground transition-transform group-hover/choice:translate-x-0.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-body font-semibold">
                          {choice.title}
                        </span>
                        <span className="text-body-compact text-muted-foreground">
                          {choice.who}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
