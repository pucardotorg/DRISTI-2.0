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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface FieldsPanelHandle {
  scrollToRow: (fieldId: string) => void;
}

/**
 * Filed information: one continuous scroll through every section.
 *
 * The tab strip above it is an INDICATOR that follows the reading position and a way to
 * jump — not a set of panels. Clicking scrolls; scrolling moves the indicator.
 *
 * The column is a scoped work canvas: `bg-muted` in light so the white group cards on it
 * read as the working surface, but `dark:bg-background`, because in dark `muted` sits
 * *above* `card` and tinting here would invert the depth.
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
      className="flex min-h-0 flex-col bg-muted dark:bg-background"
      aria-label="Filed information"
    >
      {/* Chrome: white, hairline seam — never `border-border`. */}
      <div className="flex h-14 shrink-0 items-center border-b border-hairline bg-card px-4">
        <Tabs value={active} onValueChange={jumpTo} className="w-full">
          <TabsList className="h-auto w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_[data-slot=tabs-trigger]]:py-1.5">
            {SECTIONS.map((section) => {
              return (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.num}. {section.title}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
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
                  <Card size="sm" key={group.id} className="w-full">
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
