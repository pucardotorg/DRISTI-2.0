"use client";

import * as React from "react";
import Link from "next/link";
import { GlobeIcon, ScaleIcon, UserRoundPenIcon } from "lucide-react";

import { COURT } from "@/lib/filing/options";
import { initialsOf, useProfile } from "@/lib/filing/profile";
import { FILINGS_HOME } from "@/lib/filing/steps";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileDialog } from "@/components/filing/profile-dialog";

/**
 * Product header for the filing area: court identity on the left, language / support /
 * account on the right. Sticky so the section footer and this bar frame every screen.
 */
export function FilingTopBar() {
  const { profile, ready } = useProfile();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const name = profile?.name ?? "";
  const initials = ready ? initialsOf(name) : "";

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-card">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link
          href={FILINGS_HOME}
          className="flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <ScaleIcon className="size-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-body-compact font-semibold text-foreground">
              {COURT.brand}
            </span>
            <span className="text-caption text-muted-foreground">{COURT.place}</span>
          </span>
        </Link>

        <nav aria-label="Account" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" type="button">
            <GlobeIcon data-icon="inline-start" aria-hidden />
            EN
          </Button>
          <Button variant="ghost" type="button">
            Support
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={name ? `Account: ${name}` : "Account"}
                className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar className="size-8">
                  <AvatarFallback>{initials || "?"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-body-compact font-medium text-foreground">
                  {name || "Add your details"}
                </span>
                {profile?.barNumber ? (
                  <span className="text-caption font-normal text-muted-foreground">
                    {profile.barNumber}
                  </span>
                ) : profile?.mobile ? (
                  <span className="text-caption font-normal tabular-nums text-muted-foreground">
                    +91 {profile.mobile}
                  </span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                <UserRoundPenIcon aria-hidden />
                Your details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
