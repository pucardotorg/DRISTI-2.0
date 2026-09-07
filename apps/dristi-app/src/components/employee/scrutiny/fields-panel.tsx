"use client";

import * as React from "react";

import { GROUP_ICONS } from "@/lib/employee/scrutiny/icons";
import { FIELD_BY_ID, SECTIONS } from "@/lib/employee/scrutiny/sections";
import type { ScrutinyController } from "@/lib/employee/scrutiny/use-scrutiny-state";
import { cn } from "@/lib/utils";
import { FieldRow } from "@/components/employee/scrutiny/field-row";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";

export interface FieldsPanelHandle {
  scrollToRow: (fieldId: string) => void;
}

/**
 * Filed information: one continuous scroll through every section.
 *
 * The strip above it is an INDICATOR that follows the reading position and a way to
 * jump — not a set of panels. Clicking scrolls; scrolling moves the indicator. So it is
 * a `nav` of buttons carrying `aria-current`, not `Tabs`: Radix's `TabsTrigger` always
 * emits `aria-controls`, and there is no panel at the other end of it.
 *
 * The column is a work canvas, layered the way the bundle beside it already is: a sunken
 * ground with the group cards lifted off it. `bg-muted` measured 1.03:1 against `card` in
 * light and, in dark, sits *above* `card` — so the pane read as flat in one theme and
 * inverted in the other. `surface-sunken` is a well in both.
 */
export function FieldsPanel({
  controller,
  aiOn,
  onGoToDoc,
  onGoToItem,
  ref,
}: {
  controller: ScrutinyController;
  aiOn: boolean;
  onGoToDoc: (docId: string) => void;
  /** Selects a row and scrolls to it — how a linked pair reads in both directions. */
  onGoToItem: (fieldId: string) => void;
  ref?: React.Ref<FieldsPanelHandle>;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(SECTIONS[0].id);
  const lock = React.useRef(false);
  const lockTimer = React.useRef<number>(0);
  const frame = React.useRef<number>(0);

  /**
   * Scrollspy. The active section is the last one whose heading has passed the top of
   * the panel. `offsetTop` is measured against the scroller because that element is
   * `relative` — without it the offsets come from `<body>` and the comparison against
   * `scrollTop` is off by the height of every bar above the panel.
   *
   * The last section can be shorter than the viewport, so hitting the bottom of the
   * scroll always activates it.
   */
  const syncSpy = React.useCallback(() => {
    const sc = scrollRef.current;
    if (!sc || lock.current) return;
    if (sc.scrollTop <= 8) return setActive(SECTIONS[0].id);
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8) {
      return setActive(SECTIONS[SECTIONS.length - 1].id);
    }
    let current = SECTIONS[0].id;
    for (const section of SECTIONS) {
      const el = document.getElementById(`sec-${section.id}`);
      if (el && el.offsetTop - sc.scrollTop <= 96) current = section.id;
    }
    setActive(current);
  }, []);

  React.useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        syncSpy();
      });
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    syncSpy();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, [syncSpy]);

  /**
   * Jump to a section. Smoothness is applied per jump — `scroll-behavior: smooth` on the
   * scroller itself breaks wheel-driven scrollspy.
   */
  const jumpTo = React.useCallback(
    (id: string) => {
      const sc = scrollRef.current;
      const el = document.getElementById(`sec-${id}`);
      if (!sc || !el) return;
      setActive(id);
      lock.current = true;
      sc.scrollTo({ top: Math.max(0, el.offsetTop - 12), behavior: "smooth" });
      window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(() => {
        lock.current = false;
        syncSpy();
      }, 600);
    },
    [syncSpy],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      scrollToRow: (fieldId: string) => {
        document
          .getElementById(`row-${fieldId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    }),
    [],
  );

  return (
    <section
      /* `h-full`, like the bundle beside it: the pane is what bounds the height, and the
         scroller below only scrolls once something above it says how tall it may be. */
      className="flex h-full min-h-0 flex-col bg-surface-sunken"
      aria-label="Filed information"
    >
      {/* Chrome: white, hairline seam — never `border-border`. The line-tabs shape the
          court screens already use: the rule and the horizontal scroll sit on the band,
          and each mark hangs at `-bottom-px` so it lands ON that rule rather than
          floating above it as a second horizontal line (ui-craft §2). The old pill track
          fought the primitive for the same effect and clipped its own labels to "ails". */}
      <div className="flex h-14 shrink-0 items-stretch overflow-x-auto border-b border-hairline bg-card px-4">
        <nav aria-label="Sections" className="flex items-stretch gap-1">
          {SECTIONS.map((section) => {
            const current = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-current={current ? "true" : undefined}
                onClick={() => jumpTo(section.id)}
                className={cn(
                  "relative flex shrink-0 items-center px-3 text-body-compact font-medium whitespace-nowrap transition-colors",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-accent after:opacity-0 after:transition-opacity after:content-['']",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  current
                    ? "text-primary after:opacity-100"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section.num}. {section.title}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {SECTIONS.map((section, index) => (
          <section
            className={cn(
              "flex scroll-mt-3 flex-col gap-3",
              index > 0 && "mt-8",
            )}
            id={`sec-${section.id}`}
            key={section.id}
          >
            {/* The rule after the label is the separator; the label itself stays quiet. */}
            <h2 className="flex items-center gap-3 py-2 text-caption font-medium text-muted-foreground after:h-px after:flex-1 after:bg-hairline after:content-['']">
              <span>
                {section.num} · {section.title}
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {section.groups.map((group) => {
                const Icon = GROUP_ICONS[group.icon];
                return (
                  /* The panel recipe, on the thing that is actually a panel: a lifted
                     card on the sunken canvas, hairline-edged. `Card` already supplies
                     the border width, so only the colour and the shadow are added here
                     (ui-craft §4). */
                  <Card
                    size="sm"
                    key={group.id}
                    className="w-full border-hairline shadow-raised"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <CardTitle>{group.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <DescriptionList role="listbox" aria-label={group.title}>
                        {/*
                         * `FIELD_BY_ID` rather than re-flattening inline: the object
                         * identity has to be stable across renders.
                         */}
                        {group.fields.map((field) => (
                          <FieldRow
                            key={field.id}
                            field={FIELD_BY_ID[field.id]}
                            controller={controller}
                            aiOn={aiOn}
                            onGoToDoc={onGoToDoc}
                            onGoToItem={onGoToItem}
                          />
                        ))}
                      </DescriptionList>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
        {/*
         * Tail so the last section can reach the top of the panel and the spy can select
         * it without the scroll bottoming out first.
         */}
        <div aria-hidden="true" className="h-[40vh]" />
      </div>
    </section>
  );
}
