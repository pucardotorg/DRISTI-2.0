"use client";

import * as React from "react";
import { ChevronRightIcon, PlusIcon, SearchIcon, UsersIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initials } from "@/components/access/access-list";
import { AddPeopleDialog } from "@/components/directory/add-people-dialog";
import { directoryCopy as copy } from "@/components/directory/copy";
import { GroupPickerDialog } from "@/components/directory/group-picker-dialog";
import { GroupPanel, GroupsList } from "@/components/directory/groups-screen";
import { ImportWizard } from "@/components/directory/import-wizard";
import { PersonPanel } from "@/components/directory/person-panel";
import { displayName, effectiveGrants, formatPhone, groupsOf, isAdvocate } from "@/lib/directory/derive";
import { useDirectory } from "@/lib/directory/store";
import type { Person } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The People page as the firm directory: everyone in the office, whether or
 * not they hold case access, split into advocates and office staff (the Bar
 * ID is the only signal). Rows open the person's panel; checkboxes select
 * for grouping, the one bulk act this tab offers. The Groups tab is the
 * other half: the bulk levers.
 */

type Tab = "people" | "groups";

const TAB_CLASS =
  "-mb-px flex-none items-end gap-1.5 rounded-none px-0 pb-2.5 text-body-compact group-data-horizontal/tabs:h-10 group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:after:bg-brand-accent";

const GRID = "grid-cols-[1.25rem_minmax(0,1fr)_5rem_1.5rem] sm:grid-cols-[1.25rem_minmax(0,3fr)_2fr_2fr_1.5rem]";

export function PeopleScreen({ onOpenCase }: { onOpenCase: (caseId: string) => void }) {
  const directory = useDirectory();
  const { people, groups, ready } = directory;
  const [tab, setTab] = React.useState<Tab>("people");
  const [kind, setKind] = React.useState<"advocates" | "clerks">("advocates");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [openPersonId, setOpenPersonId] = React.useState<string | null>(null);
  const [openGroupId, setOpenGroupId] = React.useState<string | null>(null);
  const [addMode, setAddMode] = React.useState<"closed" | "choose" | "import">("closed");
  const [groupFor, setGroupFor] = React.useState<string[] | null>(null);

  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const matches = people
    .filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (digits.length > 0 && p.phone.includes(digits)) ||
        p.barId?.toLowerCase().includes(q),
    )
    .sort((a, b) => displayName(a.name).localeCompare(displayName(b.name)));
  const advocates = matches.filter(isAdvocate);
  const staff = matches.filter((p) => !isAdvocate(p));
  const shown = kind === "advocates" ? advocates : staff;

  const openPerson = people.find((p) => p.id === openPersonId) ?? null;
  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;
  const panelOpen = tab === "people" ? Boolean(openPerson) : Boolean(openGroup);

  function openGroupTab(groupId: string) {
    setTab("groups");
    setOpenGroupId(groupId);
    setOpenPersonId(null);
  }
  function openPersonTab(personId: string) {
    setTab("people");
    setOpenPersonId(personId);
  }

  function toggle(id: string, value: boolean) {
    setSelected((cur) => (value ? [...new Set([...cur, id])] : cur.filter((x) => x !== id)));
  }
  function toggleSection(ids: string[], value: boolean) {
    setSelected((cur) => (value ? [...new Set([...cur, ...ids])] : cur.filter((x) => !ids.includes(x))));
  }

  return (
    <div className="flex h-[calc(100svh---spacing(14))] min-h-0 w-full flex-1 items-stretch overflow-hidden">
      <ResizablePanelGroup key={panelOpen ? "open" : "closed"} orientation="horizontal">
        <ResizablePanel defaultSize={panelOpen ? "48%" : "100%"} minSize={panelOpen ? "35%" : "100%"}>
          <main
            className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden px-4 py-8 md:px-8 md:py-10"
            onPointerDown={(event) => {
              // Clicking anywhere outside the table clears a selection, the
              // same way the older People page did.
              if (!selected.length) return;
              const target = event.target as HTMLElement;
              if (!target.closest("[data-preserve-selection]")) setSelected([]);
            }}
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-col gap-2">
                <h1 className="text-title text-balance font-semibold sm:text-title-l">{copy.title}</h1>
                <p className="max-w-prose text-body-compact text-pretty text-muted-foreground">{copy.subtitle}</p>
              </div>
              {people.length ? (
                <Button type="button" data-icon="inline-start" className="shrink-0" onClick={() => setAddMode("choose")}>
                  <PlusIcon aria-hidden />
                  {copy.addPeople}
                </Button>
              ) : null}
            </header>

            {!ready ? null : people.length === 0 ? (
              <Empty className="flex-1 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle className="text-body font-semibold">{copy.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{copy.emptyBody}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" data-icon="inline-start" onClick={() => setAddMode("choose")}>
                    <PlusIcon aria-hidden />
                    {copy.emptyCta}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <Tabs
                  value={tab}
                  onValueChange={(value) => {
                    setTab(value as Tab);
                    setSelected([]);
                  }}
                >
                  <div className="border-b border-hairline">
                    <TabsList variant="line" className="justify-start gap-6 p-0 pb-0 group-data-horizontal/tabs:h-auto">
                      <TabsTrigger value="people" className={TAB_CLASS}>
                        {copy.tabPeople}
                        <Badge
                          variant="secondary"
                          className={cn("tabular-nums", tab === "people" && "bg-brand-muted text-brand-muted-foreground")}
                        >
                          {people.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="groups" className={TAB_CLASS}>
                        {copy.tabGroups}
                        <Badge
                          variant="secondary"
                          className={cn("tabular-nums", tab === "groups" && "bg-brand-muted text-brand-muted-foreground")}
                        >
                          {groups.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>

                {tab === "people" ? (
                  <>
                    <Field>
                      <FieldLabel>{copy.search}</FieldLabel>
                      <div className="relative">
                        <SearchIcon
                          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <Input
                          type="search"
                          className="pl-9"
                          placeholder={copy.searchPlaceholder}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                    </Field>

                    <SegmentedControl
                      type="single"
                      value={kind}
                      onValueChange={(value) => {
                        if (value) setKind(value as "advocates" | "clerks");
                      }}
                      aria-label="Advocates or clerks"
                      className="self-start"
                    >
                      <SegmentedControlItem value="advocates">
                        {copy.sectionAdvocates}{" "}
                        <span className="text-muted-foreground tabular-nums">{advocates.length}</span>
                      </SegmentedControlItem>
                      <SegmentedControlItem value="clerks">
                        {copy.sectionStaff}{" "}
                        <span className="text-muted-foreground tabular-nums">{staff.length}</span>
                      </SegmentedControlItem>
                    </SegmentedControl>

                    {shown.length === 0 ? (
                      <p className="py-8 text-center text-body-compact text-muted-foreground">{copy.noMatches}</p>
                    ) : (
                      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" data-preserve-selection>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                          <PeopleSection
                            people={shown}
                            selected={selected}
                            openId={openPersonId}
                            onToggle={toggle}
                            onToggleAll={(value) => toggleSection(shown.map((p) => p.id), value)}
                            onOpen={openPersonTab}
                          />
                          {/* Room so the last row clears the floating bar. */}
                          {selected.length ? <div aria-hidden className="h-16" /> : null}
                        </div>

                        {selected.length ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
                            <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-2 shadow-raised">
                              <span className="text-body-compact font-medium tabular-nums">{copy.selected(selected.length)}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                                {copy.clearSelection}
                              </Button>
                              <Button type="button" size="sm" data-icon="inline-start" onClick={() => setGroupFor(selected)}>
                                <PlusIcon aria-hidden />
                                {copy.addToGroup}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  <GroupsList openGroupId={openGroupId} onOpenGroup={setOpenGroupId} />
                )}
              </>
            )}
          </main>
        </ResizablePanel>

        {panelOpen ? (
          <>
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel defaultSize="52%" minSize="30%" maxSize="65%">
              {tab === "people" && openPerson ? (
                <PersonPanel
                  key={openPerson.id}
                  person={openPerson}
                  onClose={() => setOpenPersonId(null)}
                  onOpenCase={onOpenCase}
                  onOpenGroup={openGroupTab}
                />
              ) : openGroup ? (
                <GroupPanel
                  key={openGroup.id}
                  group={openGroup}
                  onClose={() => setOpenGroupId(null)}
                  onOpenPerson={openPersonTab}
                  onOpenCase={onOpenCase}
                />
              ) : null}
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>

      <AddPeopleDialog
        open={addMode === "choose"}
        onOpenChange={(next) => setAddMode(next ? "choose" : "closed")}
        onUpload={() => setAddMode("import")}
        onGroup={(ids) => {
          setAddMode("closed");
          setGroupFor(ids);
        }}
      />
      <ImportWizard
        open={addMode === "import"}
        onOpenChange={(next) => setAddMode(next ? "import" : "closed")}
        onGroup={(ids) => {
          setAddMode("closed");
          setGroupFor(ids);
        }}
      />
      {groupFor ? (
        <GroupPickerDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setGroupFor(null);
              setSelected([]);
            }
          }}
          personIds={groupFor}
          onOpenGroup={openGroupTab}
        />
      ) : null}
    </div>
  );
}

function PeopleSection({
  people,
  selected,
  openId,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  people: Person[];
  selected: string[];
  openId: string | null;
  onToggle: (id: string, value: boolean) => void;
  onToggleAll: (value: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const directory = useDirectory();
  const allSelected = people.every((p) => selected.includes(p.id));
  const someSelected = !allSelected && people.some((p) => selected.includes(p.id));
  return (
    <section className="flex flex-col gap-2">
      <div className={cn("sticky top-0 z-10 grid items-center gap-3 border-b border-hairline bg-background px-2 pb-2", GRID)}>
        <Checkbox
          aria-label={copy.selectAll}
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(value) => onToggleAll(value === true)}
        />
        <span className="text-caption font-medium text-muted-foreground">{copy.columnPerson}</span>
        <span className="hidden text-caption font-medium text-muted-foreground sm:block">{copy.columnGroups}</span>
        <span className="text-caption font-medium text-muted-foreground">{copy.columnCases}</span>
        <span />
      </div>
      <div className="flex flex-col divide-y divide-hairline">
        {people.map((p) => {
          const checked = selected.includes(p.id);
          const caseCount = effectiveGrants(p, directory).length;
          const groupCount = groupsOf(p.id, directory.groups).length;
          const active = p.id === openId;
          return (
            <div
              key={p.id}
              className={cn(
                "grid items-center gap-3 rounded-lg px-2 transition-colors hover:bg-accent",
                GRID,
                active && "bg-accent-strong",
              )}
            >
              <Checkbox
                aria-label={copy.selectPerson(displayName(p.name))}
                checked={checked}
                onCheckedChange={(value) => onToggle(p.id, value === true)}
              />
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                aria-current={active || undefined}
                className="col-span-3 grid grid-cols-subgrid items-center gap-3 py-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:col-span-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="text-caption font-medium">{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-body-compact font-medium">{displayName(p.name)}</span>
                    {/* Right after an import almost everyone is yet to join, so
                        the status rides the caption line as text; a badge on
                        forty rows would be alarm fatigue. The panel header
                        carries the badge. */}
                    <span className="truncate text-caption text-muted-foreground tabular-nums">
                      {formatPhone(p.phone)}
                      {p.barId ? ` · ${copy.barId} ${p.barId}` : null}
                      {p.status === "invited" ? ` · ${copy.yetToJoin}` : null}
                    </span>
                  </span>
                </span>
                <span className="hidden text-body-compact text-muted-foreground tabular-nums sm:block">
                  {groupCount ? copy.groupCount(groupCount) : "·"}
                </span>
                <span className="text-body-compact text-muted-foreground tabular-nums">
                  {caseCount ? copy.caseCount(caseCount) : "·"}
                </span>
                <ChevronRightIcon className="size-4 justify-self-end text-muted-foreground" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
