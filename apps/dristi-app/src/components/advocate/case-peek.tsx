"use client";

import { useEffect, type ElementType, type ReactNode } from "react";
import { CircleCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-min-width";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome } from "@/lib/advocate/content";
import type { HomeHearing } from "@/lib/advocate/home";
import { personOf, sortTasks, type World } from "@/lib/tasks/selectors";
import { dateTime } from "@/lib/tasks/format";
import {
  ACTIONABLE,
  mainAdvocateOf,
  signatoriesOf,
  verbFor,
} from "@/lib/tasks/permissions";
import { cn } from "@/lib/utils";
import { HomeTaskRow, TeamAvatar } from "@/components/advocate/home-bits";

function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    // The primitive's row rule is border-border; inside a peek these are
    // internal dividers, so they drop to the hairline role.
    <DescriptionRow className="border-hairline">
      <DescriptionTerm>{label}</DescriptionTerm>
      <DescriptionDetails>
        <span className="font-medium">{value}</span>
        {note ? (
          <span className="block text-caption text-muted-foreground">{note}</span>
        ) : null}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

function PeekBody({
  world,
  locale,
  hearing,
  onOpenTask,
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing;
  onOpenTask: (taskId: string) => void;
}) {
  const userId = typeof world.user === "string" ? world.user : world.user.id;
  const kase = hearing.kase;
  const signatories = signatoriesOf(kase, world.people);
  const others = kase.advocates
    .filter((id) => !kase.signatories.includes(id))
    .map((id) => personOf(world, id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const pending = sortTasks(
    world,
    world.tasks.filter((t) => t.caseId === kase.id && ACTIONABLE.has(t.status))
  );

  return (
    <div className="flex flex-col gap-6">
      <DescriptionList>
        <Fact label={pick(advHome.peekStage, locale)} value={kase.stage} />
        {/* The court is already in the header caption — naming it again here
            would be the same fact twice in one panel. */}
        <Fact
          label={pick(advHome.peekHearing, locale)}
          value={dateTime(hearing.at)}
        />
        <Fact
          label={pick(advHome.peekAdvocates, locale)}
          value={
            <span className="flex flex-wrap items-center gap-2">
              {signatories.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5">
                  <TeamAvatar person={p} you={p.id === userId} className="size-6" />
                  <span className="text-body-compact">{p.name}</span>
                </span>
              ))}
            </span>
          }
          note={
            others.length
              ? `${pick(advHome.peekTeam, locale)}: ${others.map((p) => p.name).join(", ")}`
              : undefined
          }
        />
      </DescriptionList>

      <section className="flex flex-col gap-3">
        <h3 className="flex items-center gap-2 text-caption font-semibold text-muted-foreground">
          {pick(advHome.peekTasks, locale)}
          {pending.length ? <Badge variant="secondary">{pending.length}</Badge> : null}
        </h3>
        {pending.length ? (
          pending.map((task) => (
            <HomeTaskRow
              key={task.id}
              task={task}
              now={world.now}
              action={verbFor(world.user, task, kase)}
              onOpen={() => onOpenTask(task.id)}
              className="bg-surface-sunken"
            />
          ))
        ) : (
          <Empty className="border border-hairline">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="bg-success-muted text-success-ink"
              >
                <CircleCheck aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{pick(advHome.peekNoTasks, locale)}</EmptyTitle>
              <EmptyDescription>
                {pick(advHome.peekNoTasksBody, locale)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}

/**
 * The peek itself, minus its container. `Title` / `Description` are element
 * types because the Sheet presentation must render Radix's own title and
 * description nodes for its ARIA wiring, while the push panel is plain markup.
 *
 * One scroll, no tabs: the world holds no hearing history yet, and a "Case
 * history" tab over invented entries would be a lie. The tab returns when the
 * data does.
 */
function Peek({
  world,
  locale,
  hearing,
  close,
  onOpenTask,
  Title = "h2",
  Description = "p",
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing;
  close: ReactNode;
  onOpenTask: (taskId: string) => void;
  Title?: ElementType;
  Description?: ElementType;
}) {
  const kase = hearing.kase;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 border-b border-hairline px-4 pt-4 pb-4 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-caption font-semibold text-muted-foreground">
            {pick(advHome.peekLabel, locale)}
          </p>
          {close}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Title className="text-title-s font-semibold text-balance">
            {kase.parties}
          </Title>
          <Description className="text-caption text-muted-foreground">
            {kase.cnr ? (
              <>
                <span className="font-mono">{kase.cnr}</span> ·{" "}
              </>
            ) : null}
            {kase.stNumber || kase.stage} · {kase.court}
          </Description>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-6">
        <PeekBody
          world={world}
          locale={locale}
          hearing={hearing}
          onOpenTask={onOpenTask}
        />
      </div>
    </div>
  );
}

/**
 * Case peek.
 *
 * From `lg` up it is an in-flow, non-modal panel that pushes the board left: no
 * scrim, no focus trap, the board stays live — clicking another hearing swaps
 * this content in place and the tasks rail can stay open beside it. Below `lg`
 * the board has no width to give and the peek falls back to the Sheet overlay.
 */
export function CasePeek({
  world,
  locale,
  hearing,
  open,
  topOffset,
  onOpenChange,
  onOpenTask,
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing | null;
  open: boolean;
  /** The shell top bar's height — the push panel hangs below it. */
  topOffset: string;
  onOpenChange: (open: boolean) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const pushes = useIsDesktop();

  // The Sheet brings its own Escape handling; the push panel is plain markup,
  // so it needs its own — closing on Escape is not optional.
  useEffect(() => {
    if (!pushes || !open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pushes, open, onOpenChange]);

  if (pushes) {
    return (
      <div
        style={{ top: topOffset, height: `calc(100svh - ${topOffset})` }}
        className={cn(
          "sticky shrink-0 self-start overflow-hidden border-l border-hairline bg-card transition-[width] duration-200 ease-out",
          open ? "w-md xl:w-lg" : "w-0"
        )}
      >
        {/* Held at the open width so the content does not reflow mid-slide. */}
        <div className="flex h-full w-md flex-col xl:w-lg">
          {hearing ? (
            <Peek
              world={world}
              locale={locale}
              hearing={hearing}
              onOpenTask={onOpenTask}
              close={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onOpenChange(false)}
                >
                  <X aria-hidden="true" />
                  {pick(advHome.peekClose, locale)}
                </Button>
              }
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {hearing ? (
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <Peek
            world={world}
            locale={locale}
            hearing={hearing}
            onOpenTask={onOpenTask}
            Title={SheetTitle}
            Description={SheetDescription}
            close={
              <SheetClose asChild>
                <Button variant="ghost" size="xs">
                  <X aria-hidden="true" />
                  {pick(advHome.peekClose, locale)}
                </Button>
              </SheetClose>
            }
          />
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
