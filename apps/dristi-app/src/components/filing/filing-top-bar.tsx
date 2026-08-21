"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRoundPenIcon } from "lucide-react";

import { CASE_TYPE } from "@/lib/filing/options";
import { initialsOf, useProfile } from "@/lib/filing/profile";
import { FILINGS_HOME, getStep, stepFromPathname } from "@/lib/filing/steps";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useFilingChrome } from "@/components/filing/chrome";
import { FilingSearch } from "@/components/filing/filing-search";
import { ProfileDialog } from "@/components/filing/profile-dialog";

const CASE_FILING_LABEL = `Case filing under ${CASE_TYPE.short}`;

/**
 * The one breadcrumb in the app. It is route-aware: Dashboard › the matter › the screen.
 * The middle crumb names the matter once the parties are typed (`draftTitle`), and falls
 * back to what the filing is until then. It is text, not a link — there is no draft
 * overview screen to send anyone to.
 */
function ChromeBreadcrumb() {
  const pathname = usePathname();
  const { draftLabel } = useFilingChrome();

  const first = pathname.replace(/^\/filings\/?/, "").split("/").filter(Boolean)[0];
  const stepId = stepFromPathname(pathname);

  let middle: string | null = null;
  let page: string | null = null;

  if (!first) {
    page = null;
  } else if (first === "new") {
    page = "New filing";
  } else if (first === "bulk") {
    page = "Bulk filing";
  } else if (stepId) {
    middle =
      draftLabel && draftLabel !== "Untitled filing" ? draftLabel : CASE_FILING_LABEL;
    page = getStep(stepId).title;
  } else {
    page = CASE_FILING_LABEL;
  }

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          {page ? (
            <BreadcrumbLink asChild>
              <Link href={FILINGS_HOME}>Dashboard</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {middle ? (
          <>
            {/* The matter is the crumb a narrow bar can afford to drop: the screen name
                is what orients you, and the rail already says which filing you are in. */}
            <BreadcrumbSeparator className="hidden md:inline-flex" />
            <BreadcrumbItem className="hidden min-w-0 md:inline-flex">
              <span className="truncate">{middle}</span>
            </BreadcrumbItem>
          </>
        ) : null}

        {page ? (
          <>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-medium">{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** The DS trigger, told to say whether the rail it controls is open. */
function NavTrigger() {
  const { open, openMobile, isMobile } = useSidebar();

  return (
    <SidebarTrigger
      size="icon"
      aria-label="Toggle main navigation"
      aria-expanded={isMobile ? openMobile : open}
      className="shrink-0 text-muted-foreground"
    />
  );
}

function AccountMenu() {
  const { profile, ready } = useProfile();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const name = profile?.name ?? "";
  const initials = ready ? initialsOf(name) : "";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={name ? `Account: ${name}` : "Account"}
            className="rounded-full"
          >
            <Avatar className="size-8">
              <AvatarFallback>{initials || "?"}</AvatarFallback>
            </Avatar>
          </Button>
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

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

/**
 * Chrome for the whole filings area: the main nav's collapse trigger, where you are,
 * search, and your account. The court identity lives in the nav rail's header instead —
 * it is the page origin, and it should not move when this bar's contents change.
 *
 * Language and support belong here too, but neither is built: they are left out rather
 * than rendered as controls that do nothing.
 */
export function FilingTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-card px-4 sm:px-6">
      {/* The DS ships this at 36px; 40 is the accessibility floor. */}
      <NavTrigger />
      <ChromeBreadcrumb />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <FilingSearch />
        <AccountMenu />
      </div>
    </header>
  );
}
