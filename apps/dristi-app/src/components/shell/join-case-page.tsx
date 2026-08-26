"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, UserPlusIcon } from "lucide-react";

import { advJoinPage } from "@/lib/advocate/content";
import { pick } from "@/lib/onboarding/content";
import { AdvocateJoinCaseDialog } from "@/components/advocate/join-case-dialog";
import { useProfile } from "@/components/shell/profile";
import { PANEL_CLASS } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The Join-a-case landing, in the shared shell.
 *
 * The journey has a page before it has a modal — the case-access design's own shape:
 * arriving from the rail you land somewhere that says what joining is and what to have
 * ready (the six-digit code), and the dialog starts from the page's CTA, not from the
 * navigation. A nav click that instantly raised a modal made the rail act on the
 * person's behalf; the rail navigates, the page acts.
 *
 * Copy comes verbatim from the case-access work (`advJoinPage`) so the two surfaces
 * cannot drift apart. English for now — the shared shell has no language control yet;
 * the strings themselves are already bilingual.
 */
export function JoinCasePage() {
  const { profileRole, switchProfile } = useProfile();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // This landing is the advocate join journey. A litigant joins from their own home,
  // so send them there rather than showing the advocate flow.
  React.useEffect(() => {
    if (profileRole === "litigant") router.replace("/home?join=manual");
  }, [profileRole, router]);

  if (profileRole === "litigant") return null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-title font-semibold text-balance sm:text-title-l">
        {pick(advJoinPage.title, "en")}
      </h1>

      <Card size="sm" className={PANEL_CLASS}>
        <CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand-muted-foreground"
          >
            <UserPlusIcon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-body font-semibold">
              {pick(advJoinPage.title, "en")}
            </p>
            <p className="text-body text-muted-foreground">
              {pick(advJoinPage.body, "en")}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            {pick(advJoinPage.cta, "en")}
            <ArrowRightIcon aria-hidden />
          </Button>
        </CardContent>
      </Card>

      {/* The journey itself — lookup → details → code → role → vakalatnama → done —
          self-contained from the case-access work. Discovering mid-journey that you are
          a party rather than a representative hands off to the same profile switch the
          rail's foot offers. */}
      <AdvocateJoinCaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="manual"
        locale="en"
        onJoined={() => {
          /* The dialog's done-stage reports the outcome (joined, or waiting on an
             approver). A joined case will surface in Your Cases once that screen is
             built on this shell. */
        }}
        onJoinAsLitigant={() => {
          setDialogOpen(false);
          // Become the litigant and continue the join from the litigant home's own
          // flow. Navigating away also unmounts this advocate dialog, so its transient
          // "switching…" state cannot linger and loop on the next open.
          if (profileRole === "advocate") switchProfile();
          router.push("/home?join=manual");
        }}
      />
    </main>
  );
}
