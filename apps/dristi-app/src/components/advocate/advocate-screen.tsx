"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClipboardListIcon,
  FilePlus2Icon,
  HouseIcon,
  ScaleIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppShell, type NavItem, type NavKey, type ShellNotification } from "@/components/home/app-shell";
import { AdvocateHome } from "@/components/advocate/advocate-home";
import {
  AdvocateJoinCaseDialog,
  type AdvocateJoinResult,
} from "@/components/advocate/join-case-dialog";
import { AccessProvider } from "@/components/access/access-state";
import { CasesWireframe } from "@/components/access/cases-wireframe";
import { PeoplePage } from "@/components/access/people-page";
import { accessShell, casesCopy, peopleCopy } from "@/lib/access/content";
import { pick, type Locale } from "@/lib/onboarding/content";
import { home, shell, type JoinCase } from "@/lib/join/content";
import {
  ADVOCATE_JOIN_CASE,
  ADVOCATE_PROFILE_NAME,
  advDialog,
  advJoinPage,
  advShell,
  fillCopy,
} from "@/lib/advocate/content";

/**
 * The signed-in advocate portal.
 *
 * Reuses the litigant app shell with the advocate side panel (home, cases, filings,
 * join, tasks, calendar, team access — per the Aug 14 wireframe). Home is a wireframe
 * of another designer's hearings dashboard; "Join a case" is a stub page whose CTA
 * starts the join dialog — its full design is also arriving separately, and the two
 * get merged later. Everything else is a prototype notice.
 *
 * A summons token arms the auto join-modal exactly as it does for litigants: the
 * scanned URL cannot tell an advocate from the accused, so the same landing resolves
 * by account role, and this screen opens the advocate flavour of the dialog.
 */

const ADVOCATE_NAV: NavItem[] = [
  { key: "home", icon: HouseIcon, label: advShell.navHome },
  { key: "cases", icon: ScaleIcon, label: advShell.navCases },
  { key: "filings", icon: FilePlus2Icon, label: advShell.navFilings },
  { key: "join", icon: UserPlusIcon, label: advShell.navJoin },
  { key: "tasks", icon: ClipboardListIcon, label: advShell.navTasks },
  { key: "calendar", icon: CalendarIcon, label: advShell.navCalendar },
  // Renamed from "Team case access" per the 17 Aug access-management decisions.
  { key: "team", icon: UsersIcon, label: accessShell.navPeople },
];

type JoinedEntry = { joinCase: JoinCase; parties: string; joined: boolean };

export function AdvocateScreen({ summoned, hasCase, initialLocale }: {
  summoned: boolean;
  hasCase: boolean;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [locale, setLocale] = React.useState<Locale>(initialLocale);
  const [view, setView] = React.useState<"home" | "join" | "cases" | "team">("home");
  // Lifted so the People page can deep-link into a case file on the cases view.
  const [openCaseId, setOpenCaseId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"summons" | "manual">("manual");
  const [autoOpened, setAutoOpened] = React.useState(false);
  const [entries, setEntries] = React.useState<JoinedEntry[]>([]);
  const [notice, setNotice] = React.useState(false);
  const [notifications, setNotifications] = React.useState<ShellNotification[]>([]);

  const summonsCase = summoned && hasCase ? ADVOCATE_JOIN_CASE : undefined;
  const hasJoinedSummons = entries.some((entry) => entry.joinCase.cnr === summonsCase?.cnr);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  React.useEffect(() => {
    if (!summonsCase || autoOpened || hasJoinedSummons) return;
    const timer = window.setTimeout(() => {
      setDialogMode("summons");
      setDialogOpen(true);
      setAutoOpened(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [summonsCase, autoOpened, hasJoinedSummons]);

  function handleJoined(result: AdvocateJoinResult) {
    const parties = result.parties.map((party) => party.name).join(", ");
    setEntries((current) => [
      ...current.filter((entry) => entry.joinCase.cnr !== result.joinCase.cnr),
      { joinCase: result.joinCase, parties, joined: result.joined },
    ]);
    setNotifications((current) => [
      {
        id: `n-${Date.now()}`,
        title: fillCopy(
          result.joined ? advDialog.notifJoinedTitle : advDialog.notifRequestTitle,
          locale,
          { caseNumber: result.joinCase.caseNumber },
        ),
        body: result.joined
          ? fillCopy(advDialog.notifJoinedBody, locale, { names: parties })
          : pick(advDialog.notifRequestBody, locale),
        unread: true,
        tone: result.joined ? ("success" as const) : ("info" as const),
      },
      ...current,
    ]);
  }

  function handleNavigate(key: NavKey) {
    if (key === "home" || key === "join" || key === "cases" || key === "team") {
      setView(key);
      setNotice(false);
      return;
    }
    setNotice(true);
  }

  const firstName = ADVOCATE_PROFILE_NAME.replace(/^Adv\.\s*/, "").split(" ")[0];

  return (
    // One access state for the whole portal — a removal made on the case file
    // is instantly reflected on the People page and in the share dialog.
    <AccessProvider>
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      profileName={ADVOCATE_PROFILE_NAME}
      items={ADVOCATE_NAV}
      active={view}
      onNavigate={handleNavigate}
      caseCount={entries.length}
      notifications={notifications}
      onNotificationsRead={() =>
        setNotifications((current) => current.map((entry) => ({ ...entry, unread: false })))
      }
      onNotificationsClearAll={() => setNotifications([])}
      profileRole="advocate"
      advocateProfileAvailable
      onSwitchProfile={() => router.push("/home")}
      currentPageLabel={
        view === "join"
          ? pick(advJoinPage.title, locale)
          : view === "cases"
            ? pick(casesCopy.title, locale)
            : view === "team"
              ? pick(peopleCopy.title, locale)
              : pick(advShell.navHome, locale)
      }
    >
      {view === "join" ? (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            {pick(advJoinPage.title, locale)}
          </h1>

          {/* Stub — the full Join-a-case page is another designer's screen; this CTA
              is the one contract both designs share, and it starts the dialog flow. */}
          <Card size="sm">
            <CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand-muted-foreground">
                <UserPlusIcon className="size-5" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-body-compact font-semibold">
                  {pick(advJoinPage.title, locale)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {pick(advJoinPage.body, locale)}
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={() => {
                  setDialogMode("manual");
                  setDialogOpen(true);
                }}
              >
                {pick(advJoinPage.cta, locale)}
                <ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Button>
            </CardContent>
          </Card>

          {entries.length ? (
            <section className="flex flex-col gap-4" aria-label={pick(advJoinPage.recentHeading, locale)}>
              <h2 className="text-title-s font-semibold">{pick(advJoinPage.recentHeading, locale)}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {entries.map((entry) => (
                  <Card key={entry.joinCase.cnr} size="sm">
                    <CardContent className="flex h-full flex-col gap-4">
                      <div className="flex flex-col items-start gap-3">
                        <Badge variant={entry.joined ? "success" : "warning"}>
                          {pick(
                            entry.joined ? advJoinPage.statusJoined : advJoinPage.statusPending,
                            locale,
                          )}
                        </Badge>
                        <p className="text-body font-semibold text-pretty">
                          {entry.joinCase.title}
                        </p>
                      </div>
                      <p className="text-caption text-muted-foreground">
                        {entry.joinCase.caseNumber} · {entry.parties}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      ) : view === "cases" ? (
        <CasesWireframe locale={locale} openCaseId={openCaseId} onOpenCase={setOpenCaseId} />
      ) : view === "team" ? (
        <PeoplePage
          locale={locale}
          onOpenCase={(caseId) => {
            setOpenCaseId(caseId);
            setView("cases");
          }}
        />
      ) : (
        <AdvocateHome locale={locale} profileFirstName={firstName} />
      )}

      {notice ? (
        <div className="mx-auto w-full max-w-5xl px-4 pb-8 md:px-6">
          <Alert variant="info">
            <AlertTitle>{pick(home.prototypeTitle, locale)}</AlertTitle>
            <AlertDescription>{pick(shell.prototypeNav, locale)}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <AdvocateJoinCaseDialog
        key={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        summonsCase={dialogMode === "summons" ? summonsCase : undefined}
        locale={locale}
        onJoined={handleJoined}
        onJoinAsLitigant={() => {
          const params = new URLSearchParams();
          if (summoned) params.set("token", "summons");
          else params.set("join", "manual");
          if (locale === "ml") params.set("lang", "ml");
          router.push(`/home?${params.toString()}`);
        }}
      />
    </AppShell>
    </AccessProvider>
  );
}
