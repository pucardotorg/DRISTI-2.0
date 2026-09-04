"use client";

import * as React from "react";
import { CheckCircle2Icon, ChevronDownIcon, FileTextIcon } from "lucide-react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentSlot } from "@/components/ui/document-slot";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlowStepper } from "@/components/cases/flow-stepper";
import { directoryCopy as copy } from "@/components/directory/copy";
import { displayName, displayToday } from "@/lib/directory/derive";
import {
  applyResolution,
  checkRows,
  importPlan,
  parseCsv,
  summarize,
  toPeople,
  type CheckedRow,
  type Problem,
  type Resolution,
} from "@/lib/directory/import";
import { useDirectory } from "@/lib/directory/store";
import { cn } from "@/lib/utils";

/**
 * Upload, Check, Confirm. The file carries people only; the Check step is
 * a table of just the rows that need a decision, each with its inline fix.
 * Nothing is created until every stop is cleared, and the known-already
 * people are told about, not flagged.
 */

const STEPS = copy.importSteps.map((title, i) => ({ step: i + 1, title }));

export function ImportWizard({
  open,
  onOpenChange,
  onGroup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroup: (personIds: string[]) => void;
}) {
  const { cases, people, addPeople } = useDirectory();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<CheckedRow[] | null>(null);
  const [originalCount, setOriginalCount] = React.useState(0);
  const [done, setDone] = React.useState<{ ids: string[]; invited: number; linked: number } | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  function reset() {
    setStep(1);
    setFileName(null);
    setRows(null);
    setOriginalCount(0);
    setDone(null);
  }
  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const options = React.useMemo(() => ({ cases, existing: people }), [cases, people]);

  function loadText(text: string, name: string) {
    const parsed = parseCsv(text);
    const checked = checkRows(parsed, options);
    setRows(checked);
    setOriginalCount(parsed.length);
    setFileName(name);
  }
  async function onFile(file: File) {
    loadText(await file.text(), file.name);
  }
  async function loadSample() {
    const res = await fetch("/demo/office-people.csv");
    loadText(await res.text(), "office-people.csv");
  }

  const summary = rows ? summarize(rows) : null;
  const blocking = rows?.filter((r) => r.blocking) ?? [];
  const known = rows?.filter((r) => r.problems.some((p) => p.kind === "known")) ?? [];
  const plan = rows ? importPlan(rows, originalCount) : null;

  function resolve(row: number, resolution: Resolution) {
    setRows((cur) => (cur ? applyResolution(cur, row, resolution, options) : cur));
  }

  function commit() {
    if (!rows) return;
    const fresh = toPeople(rows, displayToday());
    addPeople(fresh);
    setDone({
      ids: fresh.map((p) => p.id),
      invited: fresh.filter((p) => p.status === "invited").length,
      linked: fresh.filter((p) => p.status === "registered").length,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {done ? (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
                  <CheckCircle2Icon className="size-7" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <DialogTitle className="text-title-s font-semibold text-balance">
                    {copy.importedTitle(done.ids.length)}
                  </DialogTitle>
                  <DialogDescription className="text-pretty">{copy.importedBody(done.invited, done.linked)}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {copy.notNow}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const ids = done.ids;
                  reset();
                  onGroup(ids);
                }}
              >
                {copy.groupNow}
              </Button>
            </footer>
          </>
        ) : (
          <>
            <div className="shrink-0 border-b border-hairline px-6 pt-6 pb-4">
              <FlowStepper steps={STEPS} current={step} label="Import progress" />
            </div>
            <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
              <DialogTitle className="text-title-s font-semibold text-balance">{copy.importTitle}</DialogTitle>
              <DialogDescription className="text-pretty">
                {step === 1 ? copy.uploadBody : step === 2 ? copy.checkBody : copy.confirmBody}
              </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              {/* ------------------------------------------------ 1 upload */}
              {step === 1 ? (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onFile(file);
                      e.target.value = "";
                    }}
                  />
                  <DocumentSlot
                    label={copy.uploadSlotLabel}
                    status={fileName ? "filled" : "empty"}
                    filename={fileName ?? undefined}
                    meta={summary ? copy.peopleCount(summary.found) : undefined}
                    onChooseFile={() => fileInput.current?.click()}
                    copy={{ chooseFile: copy.chooseFile }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-caption text-pretty text-muted-foreground">{copy.uploadHelp}</p>
                    <div className="flex items-center gap-1">
                      {fileName ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                          {copy.changeFile}
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" size="sm" data-icon="inline-start" onClick={() => void loadSample()}>
                        <FileTextIcon aria-hidden />
                        {copy.useSample}
                      </Button>
                    </div>
                  </div>
                  {summary ? (
                    summary.found === 0 ? (
                      <Banner variant="warning">{copy.parseEmpty}</Banner>
                    ) : (
                      <div className="rounded-lg bg-surface-sunken px-4 py-3 text-body-compact">
                        {summary.attention
                          ? copy.parsed(summary.found, summary.advocates, summary.staff, summary.attention)
                          : copy.parsedClean(summary.found, summary.advocates, summary.staff)}
                      </div>
                    )
                  ) : null}
                </>
              ) : null}

              {/* ------------------------------------------------- 2 check */}
              {step === 2 && rows ? (
                <>
                  {blocking.length ? (
                    <section className="flex flex-col gap-1">
                      <h3 className="text-body font-semibold">{copy.decisionsHeading(blocking.length)}</h3>
                      <ol className="flex flex-col divide-y divide-hairline">
                        {blocking.map((row, index) => (
                          <ProblemRow
                            key={row.row}
                            index={index + 1}
                            row={row}
                            rows={rows}
                            onResolve={resolve}
                            caseTitle={(id) => cases.find((c) => c.id === id)?.title ?? id}
                          />
                        ))}
                      </ol>
                    </section>
                  ) : (
                    <Banner variant="success">{copy.checkClean}</Banner>
                  )}
                  {known.length ? (
                    /* Informational, so folded by default: the people DRISTI
                       already knows need no decision. */
                    <Collapsible className="group/known flex flex-col gap-2">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 rounded-lg py-1 text-left text-body-compact font-semibold hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          {copy.knownHeading(known.length)}
                          <ChevronDownIcon
                            className="size-4 text-muted-foreground transition-transform group-data-[state=open]/known:rotate-180"
                            aria-hidden
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                      <ul className="flex flex-col gap-1">
                        {known.map((row) => {
                          const k = row.problems.find((p): p is Extract<Problem, { kind: "known" }> => p.kind === "known")!;
                          return (
                            <li key={row.row} className="text-caption text-pretty text-muted-foreground">
                              {copy.known(displayName(k.name), k.reason)}
                            </li>
                          );
                        })}
                      </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}
                </>
              ) : null}

              {/* ----------------------------------------------- 3 confirm */}
              {step === 3 && plan ? (
                <ul className="flex flex-col gap-2 rounded-lg bg-surface-sunken px-4 py-3 text-body-compact">
                  <li>{copy.confirmInvite(plan.invite)}</li>
                  <li>{copy.confirmLink(plan.link)}</li>
                  {plan.dropped ? <li>{copy.confirmDropped(plan.dropped)}</li> : null}
                  <li className="text-muted-foreground">{copy.confirmNoAccess}</li>
                </ul>
              ) : null}
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                  {copy.back}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  {copy.cancel}
                </Button>
              )}
              <div className="flex items-center gap-3">
                {step === 2 && blocking.length ? (
                  <span className="text-caption text-muted-foreground">{copy.blockedNote(blocking.length)}</span>
                ) : null}
                {step < 3 ? (
                  <Button
                    type="button"
                    disabled={!rows || rows.length === 0 || (step === 2 && blocking.length > 0)}
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                  >
                    {copy.continue}
                  </Button>
                ) : (
                  <Button type="button" onClick={commit}>
                    {copy.import}
                  </Button>
                )}
              </div>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** One row that needs a decision, with its inline fix. */
function ProblemRow({
  index,
  row,
  rows,
  onResolve,
  caseTitle,
}: {
  index: number;
  row: CheckedRow;
  rows: CheckedRow[];
  onResolve: (row: number, resolution: Resolution) => void;
  caseTitle: (caseId: string) => string;
}) {
  const [text, setText] = React.useState("");
  const [keep, setKeep] = React.useState("");
  const problem = row.problems.find((p) => p.kind !== "known")!;
  const raw = [row.name || "(no name)", row.mobile || "(no number)", row.barId].filter(Boolean).join(" · ");
  const hard = problem.kind === "party";

  const duplicateOf = problem.kind === "duplicate" ? rows.find((r) => r.row === problem.withRow) : null;

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-caption font-medium text-muted-foreground tabular-nums">
          {index}. {copy.rowLabel(row.row)}
        </p>
        <p className="text-body-compact font-medium tabular-nums">{raw}</p>
        <p className={cn("text-body-compact text-pretty", hard ? "text-destructive-ink" : "text-foreground")}>
          {problem.kind === "duplicate"
            ? copy.problemDuplicate(problem.withRow)
            : problem.kind === "missing-name"
              ? copy.problemMissingName
              : problem.kind === "bad-mobile"
                ? copy.problemBadMobile
                : problem.kind === "bad-bar-id"
                  ? copy.problemBadBarId
                  : problem.kind === "party"
                    ? copy.problemParty(problem.party, caseTitle(problem.caseId))
                    : null}
        </p>
      </div>

      {problem.kind === "duplicate" && duplicateOf ? (
        <div className="flex flex-col gap-3">
          <RadioGroup value={keep} onValueChange={setKeep} className="gap-1">
            <p className="text-caption font-medium text-muted-foreground">{copy.mergeKeep}</p>
            {[duplicateOf.name, row.name].filter(Boolean).map((name) => (
              <label key={name} className="flex cursor-pointer items-center gap-2 py-1 text-body-compact">
                <RadioGroupItem value={name} />
                {name}
              </label>
            ))}
          </RadioGroup>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!keep}
              onClick={() => onResolve(row.row, { kind: "merge", intoRow: problem.withRow, name: keep })}
            >
              {copy.merge}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onResolve(row.row, { kind: "drop" })}>
              {copy.drop}
            </Button>
          </div>
        </div>
      ) : problem.kind === "party" ? (
        <div>
          <Button type="button" size="sm" variant="destructive" onClick={() => onResolve(row.row, { kind: "drop" })}>
            {copy.drop}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field className="flex-1 gap-1.5">
            <FieldLabel>
              {problem.kind === "missing-name" ? copy.fixName : problem.kind === "bad-mobile" ? copy.fixMobile : copy.fixBarId}
            </FieldLabel>
            <Input
              data-fix-row={row.row}
              className="h-9"
              inputMode={problem.kind === "bad-mobile" ? "numeric" : undefined}
              maxLength={problem.kind === "bad-mobile" ? 10 : undefined}
              placeholder={
                problem.kind === "missing-name" ? copy.namePlaceholder : problem.kind === "bad-mobile" ? copy.phonePlaceholder : copy.barIdPlaceholder
              }
              value={text}
              onChange={(e) =>
                setText(
                  problem.kind === "bad-mobile" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  e.preventDefault();
                  onResolve(row.row, fixFor(problem, text));
                }
              }}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!text.trim()} onClick={() => onResolve(row.row, fixFor(problem, text))}>
              {copy.save}
            </Button>
            {problem.kind === "bad-bar-id" ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onResolve(row.row, { kind: "fix", barId: "" })}>
                {copy.makeStaff}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" onClick={() => onResolve(row.row, { kind: "drop" })}>
              {copy.drop}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function fixFor(problem: Problem, text: string): Resolution {
  const value = text.trim();
  if (problem.kind === "missing-name") return { kind: "fix", name: value };
  if (problem.kind === "bad-mobile") return { kind: "fix", mobile: value };
  return { kind: "fix", barId: value };
}
