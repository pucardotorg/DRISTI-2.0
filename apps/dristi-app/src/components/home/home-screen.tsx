"use client";

import * as React from "react";
import { ArrowRightIcon, FilePlus2Icon, ScaleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppShell, type NavKey, type ShellNotification } from "@/components/home/app-shell";
import type { SubmittedId } from "@/components/home/add-id-dialog";
import { ProfileSettings, type AdvocateRequestDetails } from "@/components/home/profile-settings";
import { JoinCaseDialog, type JoinResult } from "@/components/join/join-case-dialog";
import { pick, type Locale } from "@/lib/onboarding/content";
import { DEMO_JOIN_CASE, DEMO_PROFILE_NAME, fill, home, idUpload, profileCompletion, shell, type JoinCase } from "@/lib/join/content";

type HomeCase = { joinCase: JoinCase; status: "joined" | "approval" };
type VisibleHomeCase = HomeCase | { joinCase: JoinCase; status: "summons" };

export function HomeScreen({ summoned, hasCase, idSkipped, profileIncomplete, openManualJoin = false, initialLocale }: {
  summoned: boolean;
  hasCase: boolean;
  idSkipped: boolean;
  profileIncomplete: boolean;
  openManualJoin?: boolean;
  initialLocale: Locale;
}) {
  const [locale, setLocale] = React.useState<Locale>(initialLocale);
  const [dialogOpen, setDialogOpen] = React.useState(openManualJoin);
  const [dialogMode, setDialogMode] = React.useState<"summons" | "manual">("manual");
  const [autoOpened, setAutoOpened] = React.useState(openManualJoin);
  const [cases, setCases] = React.useState<HomeCase[]>([]);
  const [notice, setNotice] = React.useState<"file" | "case" | "nav" | null>(null);
  const [view, setView] = React.useState<"home" | "settings">("home");
  const [idSubmitted, setIdSubmitted] = React.useState(!idSkipped);
  const [submittedId, setSubmittedId] = React.useState<SubmittedId | null>(null);
  const [addressSubmitted, setAddressSubmitted] = React.useState(!profileIncomplete);
  const [profileComplete, setProfileComplete] = React.useState(!profileIncomplete && !idSkipped);
  const [profileRole, setProfileRole] = React.useState<"litigant" | "advocate">("litigant");
  const [advocateProfileAvailable, setAdvocateProfileAvailable] = React.useState(false);
  const [advocateRequest, setAdvocateRequest] = React.useState<AdvocateRequestDetails | null>(null);
  const [notifications, setNotifications] = React.useState<ShellNotification[]>(() =>
    profileIncomplete || idSkipped ? [{
      id: "profile-incomplete",
      title: pick(profileCompletion.notificationTitle, initialLocale),
      body: pick(profileCompletion.notificationBody, initialLocale),
      unread: false,
      tone: "warning",
      topic: "profile",
      persistent: true,
      actionLabel: pick(profileCompletion.action, initialLocale),
      onAction: () => setView("settings"),
    }] : [],
  );

  const summonsCase = summoned && hasCase ? DEMO_JOIN_CASE : undefined;
  const hasJoinedSummons = cases.some((entry) => entry.joinCase.cnr === summonsCase?.cnr);
  const visibleCases: VisibleHomeCase[] = summonsCase && !hasJoinedSummons ? [{ joinCase: summonsCase, status: "summons" }, ...cases] : cases;

  React.useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  React.useEffect(() => {
    if (view !== "home" || !summonsCase || autoOpened || cases.length) return;
    const timer = window.setTimeout(() => { setDialogMode("summons"); setDialogOpen(true); setAutoOpened(true); }, 1200);
    return () => window.clearTimeout(timer);
  }, [view, summonsCase, autoOpened, cases.length]);
  function pushNotification(entry: Omit<ShellNotification, "id" | "unread">) {
    setNotifications((current) => [{ ...entry, id: `n-${Date.now()}`, unread: true }, ...current]);
  }

  function handleIdSubmitted(submission: SubmittedId) {
    setSubmittedId(submission);
    setIdSubmitted(true);
    if (addressSubmitted) {
      setProfileComplete(true);
      setNotifications((current) => current.filter((entry) => entry.id !== "profile-incomplete"));
    }
    pushNotification({ title: pick(idUpload.notifSubmittedTitle, locale), body: pick(idUpload.notifSubmittedBody, locale), tone: "success", topic: "id" });
  }

  function handleProfileCompleted() {
    setAddressSubmitted(true);
    if (!idSubmitted) return;
    setProfileComplete(true);
    setNotifications((current) => current.filter((entry) => entry.id !== "profile-incomplete"));
  }

  function handleJoined(result: JoinResult) {
    const status: HomeCase["status"] = result.kind === "poa" ? "approval" : "joined";
    setCases((current) => [...current.filter((entry) => entry.joinCase.cnr !== result.joinCase.cnr), { joinCase: result.joinCase, status }]);
  }

  function openJoin(mode: "summons" | "manual") { setDialogMode(mode); setDialogOpen(true); setNotice(null); }
  function handleNavigate(key: NavKey) { setView("home"); setNotice(key === "home" ? null : "nav"); }

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      profileName={DEMO_PROFILE_NAME}
      active={view === "settings" ? "settings" : "home"}
      onNavigate={handleNavigate}
      caseCount={visibleCases.length}
      notifications={notifications}
      onNotificationsRead={() => setNotifications((current) => current.map((entry) => entry.persistent ? entry : { ...entry, unread: false }))}
      onNotificationsClearAll={() => setNotifications((current) => current.filter((entry) => entry.persistent || Boolean(entry.actionLabel && entry.onAction)))}
      profileNeedsAttention={!profileComplete}
      profileRole={profileRole}
      advocateProfileAvailable={advocateProfileAvailable}
      onSwitchProfile={() => setProfileRole((current) => current === "litigant" ? "advocate" : "litigant")}
      onSettingsClick={() => setView("settings")}
      currentPageLabel={view === "settings" ? "Profile settings" : undefined}
    >
      {view === "settings" ? (
        <ProfileSettings locale={locale} profileName={DEMO_PROFILE_NAME} idSubmitted={idSubmitted} submittedId={submittedId} advocateRequest={advocateRequest} profileRole={profileRole} advocateProfileAvailable={advocateProfileAvailable} onSwitchProfile={() => setProfileRole((current) => current === "litigant" ? "advocate" : "litigant")} onIdSubmitted={handleIdSubmitted} onProfileCompleted={handleProfileCompleted} onAdvocateRequest={(details) => {
          setAdvocateRequest(details);
          pushNotification({ title: "Advocate profile request sent", body: "Your Bar Council details are being reviewed. We will notify you when you can switch profiles.", tone: "info", topic: "profile" });
          window.setTimeout(() => {
            setAdvocateProfileAvailable(true);
            pushNotification({ title: "Your advocate profile is ready", body: "You can now switch between litigant and advocate profiles from the side panel.", tone: "success", topic: "profile" });
          }, 4000);
        }} />
      ) : (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">{fill(home.welcome, locale, { name: DEMO_PROFILE_NAME })}</h1>

        <section className="flex flex-col gap-5" aria-label={pick(home.casesHeading, locale)}>
          <h2 className="text-title-s font-semibold">{pick(home.casesHeading, locale)}</h2>
          {visibleCases.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleCases.map((entry) => (
            <Card key={entry.joinCase.cnr} size="sm" className="h-full max-w-sm"><CardContent className="flex h-full flex-col gap-5">
              <div className="flex flex-col items-start gap-3"><Badge variant={entry.status === "joined" ? "success" : "warning"}>{pick(entry.status === "summons" ? home.statusSummons : entry.status === "approval" ? home.statusApproval : home.statusJoined, locale)}</Badge><p className="text-body font-semibold text-pretty">{entry.joinCase.title}</p></div>
              <div className="flex flex-col gap-2 text-caption text-muted-foreground"><p><span className="font-medium text-foreground">{pick(home.caseNumberLabel, locale)}</span><br />{entry.joinCase.caseNumber}</p><p><span className="font-medium text-foreground">{pick(home.hearingLabel, locale)}</span><br />{entry.joinCase.hearingDate}</p></div>
              <Button variant="outline" className="mt-auto w-full" onClick={() => entry.status === "summons" ? openJoin("summons") : setNotice("case")}>
                {pick(entry.status === "summons" ? home.reviewSummons : home.viewCase, locale)}<ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Button>
            </CardContent></Card>
          ))}</div> : <p className="text-body-compact text-muted-foreground">Cases you join or file will appear here.</p>}
        </section>

        <div className="flex flex-col gap-8">
          <Separator />
          <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
          <Card size="sm"><CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand-muted-foreground"><ScaleIcon className="size-5" aria-hidden /></span><div className="flex min-w-0 flex-1 flex-col gap-2"><p className="text-body-compact font-semibold">{pick(home.joinTitle, locale)}</p><p className="text-caption text-muted-foreground">{pick(home.joinBody, locale)}</p></div><Button className="shrink-0" onClick={() => openJoin("manual")}>{pick(home.joinAction, locale)}<ArrowRightIcon data-icon="inline-end" aria-hidden /></Button></CardContent></Card>
          <Card size="sm"><CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FilePlus2Icon className="size-5" aria-hidden /></span><div className="flex min-w-0 flex-1 flex-col gap-2"><p className="text-body-compact font-semibold">{pick(home.fileTitle, locale)}</p><p className="text-caption text-muted-foreground">{pick(home.fileBody, locale)}</p></div><Button variant="outline" className="shrink-0" onClick={() => setNotice("file")}>{pick(home.fileAction, locale)}<ArrowRightIcon data-icon="inline-end" aria-hidden /></Button></CardContent></Card>
          </div>
        </div>

        {notice ? <Alert variant="info"><AlertTitle>{pick(home.prototypeTitle, locale)}</AlertTitle><AlertDescription>{pick(notice === "file" ? home.prototypeFile : notice === "nav" ? shell.prototypeNav : home.prototypeCase, locale)}</AlertDescription></Alert> : null}
      </main>
      )}

      <JoinCaseDialog key={dialogMode} open={dialogOpen} onOpenChange={setDialogOpen} mode={dialogMode} summonsCase={dialogMode === "summons" ? summonsCase : undefined} locale={locale} onJoined={handleJoined} />
    </AppShell>
  );
}
