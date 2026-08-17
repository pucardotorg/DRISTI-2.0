"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilesIcon } from "lucide-react";

import { draftProgress } from "@/lib/filing/selectors";
import {
  FILING_STEPS,
  stepFromPathname,
  stepGroups,
  type FilingStep,
} from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  UploadedCountBadge,
  UploadedDocsDrawer,
} from "@/components/filing/uploaded-docs-drawer";

/**
 * Height of `FilingTopBar`. The rail hangs below it and the form column is sized
 * against it, so both read the same number.
 */
export const TOP_BAR_HEIGHT = "3.5rem";

/**
 * DS `SidebarMenuButton` is 32px tall (and exactly 32×32 when the rail is collapsed, forced
 * with `!`). These rows are the filing's primary navigation, so they have to meet the
 * 40×40 floor: `ACCESSIBILITY.md` §8's own remedy is to expand the hit area rather than
 * grow the control. `-inset-1` adds 4px a side → 40px; the menus below carry `gap-2` so
 * neighbouring hit areas meet without overlapping.
 */
const HIT_AREA = "relative after:absolute after:-inset-1 after:content-['']";

export function useActiveStep(): FilingStep | undefined {
  const pathname = usePathname();
  const id = stepFromPathname(pathname);
  return FILING_STEPS.find((s) => !s.placeholder && s.id === id);
}

/**
 * Sections rail for the filing form, on the DS Sidebar: progress and uploaded documents
 * in the header, then every section grouped as in the court form. Collapses to the icon
 * strip on desktop (⌘/Ctrl+B, remembered in a cookie) and becomes a sheet below `md`.
 *
 * The rail starts under the sticky product header rather than running the full viewport
 * height — `FilingTopBar` is chrome for the whole filings area, the rail only for one
 * draft. See `FilingShell` for the offset.
 */
export function FilingSidebar() {
  const active = useActiveStep();
  const { draft, hrefFor } = useFiling();
  const { isMobile, setOpenMobile } = useSidebar();
  const [docsOpen, setDocsOpen] = React.useState(false);
  const progress = draftProgress(draft);

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-hairline"
        style={{ top: TOP_BAR_HEIGHT, height: "auto" }}
      >
        <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:p-1">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
            <span className="text-body font-medium text-foreground group-data-[collapsible=icon]:hidden">
              Sections
            </span>
            {/* The DS ships this at 36px; 40 is the accessibility floor. */}
            <SidebarTrigger
              size="icon"
              aria-label="Toggle sections"
              className="text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between text-caption">
              <span className="font-medium text-foreground">Progress</span>
              <span className="tabular-nums text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} aria-label="Filing progress" className="h-1.5" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    /* Collapsed, the DS forces these to 32px with `!`; the sanctioned
                       remedy (ACCESSIBILITY.md §8) is to expand the hit area to 40px. */
                    className={HIT_AREA}
                    tooltip="View uploaded documents"
                    onClick={() => {
                      closeMobile();
                      setDocsOpen(true);
                    }}
                  >
                    <FilesIcon aria-hidden className="text-muted-foreground" />
                    <span className="min-w-0 truncate">View uploaded documents</span>
                    <span className="ml-auto">
                      <UploadedCountBadge />
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {stepGroups().map((g) => (
            <SidebarGroup key={g.group}>
              <SidebarGroupLabel className="text-muted-foreground">
                {g.group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {g.steps.map((s) => {
                    const Icon = s.icon;

                    // Listed for orientation, but there is no screen behind them yet —
                    // a label, not a disabled control, so it keeps full contrast.
                    if (s.placeholder) {
                      return (
                        <SidebarMenuItem key={s.id}>
                          <SidebarMenuButton
                            asChild
                            className="text-muted-foreground aria-disabled:opacity-100"
                          >
                            <span aria-disabled="true">
                              <Icon aria-hidden />
                              <span className="truncate">{s.title}</span>
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    const isActive = active?.id === s.id;
                    return (
                      <SidebarMenuItem key={s.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={s.title}
                          className={HIT_AREA}
                        >
                          <Link
                            href={hrefFor(s.id)}
                            onClick={closeMobile}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <Icon
                              aria-hidden
                              className={cn(
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                            <span className="truncate">{s.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <UploadedDocsDrawer open={docsOpen} onOpenChange={setDocsOpen} />
    </>
  );
}
