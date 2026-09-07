"use client";

import * as React from "react";
import {
  CheckIcon,
  FileUpIcon,
  FlagIcon,
  Link2Icon,
  MicIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { DOC_BY_ID, DOC_ROW } from "@/lib/employee/scrutiny/bundle";
import { docName, unlocksSentence } from "@/lib/employee/scrutiny/field";
import { CASE } from "@/lib/employee/scrutiny/history";
import { ALL_FIELDS, FIELD_BY_ID } from "@/lib/employee/scrutiny/sections";
import type {
  Flag,
  FlagMap,
  FlatField,
} from "@/lib/employee/scrutiny/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";

export type Decision = "send-back" | "register";

interface Item {
  field: FlatField;
  flag: Flag;
  where: string;
  unlocks: string;
  /** The partner item this one was raised with, if any. */
  linked: FlatField | null;
  /**
   * A mark on an uploaded document whose own row carries no item — the one error this
   * design knows how to detect, and the last place it can still be caught.
   */
  stranded: string | null;
}

const GROUP_ORDER = [
  "Corrections — advocate confirms",
  "Flags — advocate fixes",
  "Document issues — advocate re-uploads",
] as const;

function group(flags: FlagMap): Record<string, Item[]> {
  const out: Record<string, Item[]> = Object.fromEntries(
    GROUP_ORDER.map((g) => [g, []]),
  );
  for (const field of ALL_FIELDS) {
    const flag = flags[field.id];
    if (!flag) continue;
    const partnerId = flag.linkedTo ?? flag.linkedFrom ?? null;
    const markedDoc = flag.evidence?.doc ?? null;
    const markedRow = markedDoc ? DOC_ROW[markedDoc] : null;
    const item: Item = {
      field,
      flag,
      where: `${field.group} · ${field.label}`,
      unlocks: unlocksSentence(field),
      linked: partnerId ? (FIELD_BY_ID[partnerId] ?? null) : null,
      stranded:
        !field.docrow && markedDoc && markedRow && !flags[markedRow]
          ? markedDoc
          : null,
    };
    if (field.docrow) out[GROUP_ORDER[2]].push(item);
    else if (flag.correction) out[GROUP_ORDER[0]].push(item);
    else out[GROUP_ORDER[1]].push(item);
  }
  return out;
}

/**
 * Review &amp; decide. Everything the officer did, before it leaves their hands.
 *
 * Registering with open items is allowed — never block — but it takes an explicit
 * acknowledgement, which is what gates the primary button.
 */
export function ReviewDialog({
  decision,
  flags,
  onOpenChange,
  onDone,
  onGoToItem,
}: {
  decision: Decision | null;
  flags: FlagMap;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  /** A record you can act on: closes the dialog and lands on the item. */
  onGoToItem: (fieldId: string) => void;
}) {
  const [ack, setAck] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);

  // Opening the dialog for a new decision starts from a clean slate. Adjusted during
  // render against the previous decision rather than in an effect.
  const [prevDecision, setPrevDecision] = React.useState(decision);
  if (decision !== prevDecision) {
    setPrevDecision(decision);
    if (decision) {
      setAck(false);
      setConfirmed(false);
    }
  }

  const groups = React.useMemo(() => group(flags), [flags]);
  const total = Object.values(groups).reduce((n, v) => n + v.length, 0);

  if (!decision) return null;

  const head =
    decision === "send-back"
      ? {
          title: "Send back to advocate",
          body: `Goes to ${CASE.advocate} as recorded. Corrections need confirmation; flags get fixed. Each item unlocks what you marked.`,
        }
      : {
          title: "Register case",
          body: total
            ? `The case moves to the Magistrate's list. ${total} open item${
                total > 1 ? "s travel" : " travels"
              } with it — registering does not clear ${total > 1 ? "them" : "it"}.`
            : "Every field was checked against the bundle. The case moves to the Magistrate's list for cognizance.",
        };

  const needsAck = decision === "register" && total > 0;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      {/* The house long-list overlay: a header, a body that is the only thing that
          scrolls, and a footer, each a region with a hairline seam between it and the
          next — the shell `SignOrderDialog` and `ApplicationReviewOverlay` use. The
          previous build clipped the list at a fixed `52vh` inside a padded box, which
          on a laptop cut the decision the dialog exists to take. */}
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {confirmed ? (
          <>
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
                <CheckIcon className="size-7" strokeWidth={2.2} />
              </div>
              <DialogTitle>
                {decision === "send-back"
                  ? `Sent back to ${CASE.advocate}`
                  : "Case registered"}
              </DialogTitle>
              <DialogDescription>
                {decision === "send-back"
                  ? `${total} item${
                      total > 1 ? "s" : ""
                    } sent. The file returns only if the advocate changes something you didn't raise.`
                  : `Filing ${CASE.filingNo} is on the Magistrate's list${
                      total
                        ? ` with ${total} open item${
                            total > 1 ? "s" : ""
                          } attached for reference`
                        : ""
                    }. The next file in your queue is ready.`}
              </DialogDescription>
            </div>
            <DialogFooter className="mx-0 mb-0 shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Stay here
              </Button>
              <Button onClick={onDone}>Next file</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* `pr-16` keeps the title clear of the close button the DS places
                top-right. */}
            <DialogHeader className="shrink-0 gap-2 border-b border-hairline p-6 pr-16">
              <DialogTitle className="text-title-s font-semibold">
                {head.title}
              </DialogTitle>
              <DialogDescription className="text-body-compact text-muted-foreground">
                {head.body}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {total ? (
                GROUP_ORDER.filter((g) => groups[g].length).map((g) => (
                  <div key={g} className="pt-6 first:pt-0">
                    {/* A heading, set as one: caption size but foreground ink at 600,
                        so it does not read as one more line of item metadata. */}
                    <h3 className="pb-2 text-caption font-semibold text-foreground">
                      {g.split(" — ")[0]} ({groups[g].length})
                    </h3>
                    {groups[g].map((item) => (
                      <SummaryItem
                        key={item.field.id}
                        item={item}
                        onGoToItem={(fieldId) => {
                          onOpenChange(false);
                          onGoToItem(fieldId);
                        }}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <Empty className="border-0 p-0">
                  <EmptyHeader>
                    <EmptyTitle className="text-title-s font-semibold">
                      Nothing raised
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </div>

            {/* The gate on the primary, in its own region above the footer rather than
                floating between two scrolling things. */}
            {needsAck ? (
              <div className="shrink-0 border-t border-hairline px-6 py-4">
                <Field orientation="horizontal">
                  <Checkbox
                    id="ack"
                    checked={ack}
                    onCheckedChange={(value) => setAck(value === true)}
                  />
                  <FieldLabel htmlFor="ack" className="font-normal">
                    I have seen the open flags and choose to register.
                  </FieldLabel>
                </Field>
              </div>
            ) : null}

            <DialogFooter className="mx-0 mb-0 shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Keep reviewing
              </Button>
              <Button
                disabled={needsAck && !ack}
                onClick={() => setConfirmed(true)}
              >
                {decision === "send-back" ? "Send back" : "Register case"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryItem({
  item,
  onGoToItem,
}: {
  item: Item;
  onGoToItem: (fieldId: string) => void;
}) {
  const { field, flag } = item;
  return (
    <div className="flex flex-col gap-1 border-b border-hairline py-3 last:border-0">
      <div className="text-caption text-muted-foreground">{item.where}</div>
      {flag.correction ? (
        /*
         * Old → new on their own lines: an inline strikethrough of a five-line address
         * is unreadable, and the eye can't tell where the old value stops.
         */
        <div className="grid grid-cols-[5rem_1fr] items-baseline gap-x-3 gap-y-1 rounded-md bg-surface-sunken px-3 py-2">
          <span className="text-caption text-muted-foreground">Filed</span>
          <span className="text-body-compact break-words text-muted-foreground line-through">
            {field.value}
          </span>
          <span className="text-caption text-muted-foreground">Corrected</span>
          <span className="text-body-compact font-medium break-words">
            {flag.correction}
          </span>
        </div>
      ) : null}
      {flag.reason ? (
        <div className="text-body-compact leading-snug font-semibold">
          {flag.reason}
        </div>
      ) : null}
      {flag.comment ? (
        <div className="text-body-compact leading-snug">{flag.comment}</div>
      ) : null}
      {/*
       * The last backstop. A mark on an uploaded document with no item on that
       * document's own row means the advocate gets the value unlocked and no re-upload
       * button — the exact miss this feature exists to stop, named here rather than
       * discovered on resubmission. Icon + words + colour, never colour alone.
       */}
      {item.stranded ? (
        <div className="flex flex-wrap items-center gap-2 text-caption text-warning-ink">
          <span className="inline-flex items-center gap-1">
            <TriangleAlertIcon className="size-3" />
            Marked on {docName(item.stranded)} — re-upload is not unlocked.
          </span>
          {/* An inline link inside a sentence, so it keeps the sentence's density —
              with the touch floor a tablet needs. */}
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0 [@media(pointer:coarse)]:h-10"
            onClick={() => onGoToItem(field.id)}
          >
            Open the item
          </Button>
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 text-caption text-muted-foreground",
          "[&_svg]:size-3",
        )}
      >
        {flag.voice ? (
          <span className="inline-flex items-center gap-1">
            <MicIcon /> Voice note
          </span>
        ) : null}
        {flag.evidence ? (
          <span className="inline-flex items-center gap-1">
            <FlagIcon /> Marked on doc{" "}
            <span className="tabular-nums">
              {DOC_BY_ID[flag.evidence.doc]?.no}
            </span>
          </span>
        ) : null}
        {/*
         * Two grants genuinely exist when a pair was raised, so both are counted — but
         * each says which other item it travelled with, which is what stops the "did I
         * raise this twice?" read.
         */}
        {item.linked ? (
          <span className="inline-flex items-center gap-1">
            <Link2Icon />
            {item.linked.docrow
              ? `Linked to ${docName(item.linked.docrow)} — re-upload`
              : `Linked to ${item.linked.label}`}
          </span>
        ) : null}
        {/*
         * The unlock rule, said on the item in the same sentence the composer and the
         * item's own well print: a flag is a permission grant, and it grants only what
         * it names.
         */}
        <span className="inline-flex items-center gap-1">
          <FileUpIcon /> {item.unlocks}
        </span>
      </div>
    </div>
  );
}
