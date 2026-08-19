"use client";

/**
 * Pay — the fee, why it is owed, who may pay it, and a sandbox gateway. A signatory pays
 * (with a confirmation before money would move); anyone else on the case prepares the
 * payment and marks it ready. Success closes the task by event with a receipt; a pending
 * gateway parks it in Waiting; a failure keeps the task where it was, with the cue, and
 * the person stays on the page with the notice focused.
 */

import * as React from "react";
import { CircleCheckIcon } from "lucide-react";

import { dateTime, longDate, rupees } from "@/lib/tasks/format";
import { signatoriesOf, TERMINAL } from "@/lib/tasks/permissions";
import { confirmPayment, recordPayment } from "@/lib/tasks/transitions";
import type { PaymentResult } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionNotice } from "@/components/shell/notices";
import { PANEL_CLASS } from "@/components/shell/panel";
import { useTaskActions } from "@/components/tasks/use-task-actions";
import {
  ActColumns,
  ActFrame,
  type ActContext,
  closedTitle,
  PrepareCard,
  PreparedNote,
  RailCard,
  RecordCard,
  signatoryLine,
  useActContext,
} from "@/components/tasks/act/shared";

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <DescriptionRow className="border-hairline">
      <DescriptionTerm className="text-body-compact">{label}</DescriptionTerm>
      <DescriptionDetails className={cn("text-body-compact", mono && "font-mono tabular-nums")}>
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

const OUTCOMES: { value: PaymentResult; label: string; hint: string }[] = [
  { value: "success", label: "Success", hint: "Receipt issued, task closes" },
  { value: "pending", label: "Confirming", hint: "Gateway still confirming — task waits" },
  { value: "failed", label: "Failed", hint: "Nothing paid — task stays where it is" },
];

/** The signatory's pay rail: pick the sandbox outcome, confirm, pay. */
function PayCard({ ctx }: { ctx: ActContext }) {
  const { task, kase, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [outcome, setOutcome] = React.useState<PaymentResult>("success");
  const [confirm, setConfirm] = React.useState(false);
  // Set when the attempt just made failed: the notice announces and takes focus, and the
  // person stays here with the Pay button — a failure is not a reason to leave.
  const [justFailed, setJustFailed] = React.useState(false);
  const failedRef = React.useRef<HTMLDivElement>(null);
  const amount = task.amountPaise !== undefined ? rupees(task.amountPaise) : "the fee";

  const pay = async () => {
    setConfirm(false);
    const t = await act(task.id, (x, c) => recordPayment(x, c, outcome));
    if (!t) return;
    if (outcome === "failed") {
      setJustFailed(true);
      return;
    }
    finish(
      outcome === "success"
        ? `Paid ${amount} — receipt ${t.completion?.receipt ?? ""}`
        : "Payment made — the gateway is confirming"
    );
  };

  React.useEffect(() => {
    if (!justFailed) return;
    const id = window.requestAnimationFrame(() => failedRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [justFailed, task.lastPayment?.at]);

  return (
    <RailCard title="Pay" description={signatoryLine(ctx, "Paying")}>
      <PreparedNote ctx={ctx} />
      {task.lastPayment?.result === "failed" ? (
        <div ref={failedRef} tabIndex={-1} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <SectionNotice
            variant="destructive"
            announce={justFailed ? "assertive" : "none"}
            title="Last attempt failed"
          >
            Ref {task.lastPayment.ref} on {dateTime(task.lastPayment.at)}. Nothing was paid; try again.
          </SectionNotice>
        </div>
      ) : null}
      <Field>
        <FieldLabel>Sandbox gateway result</FieldLabel>
        <RadioGroup value={outcome} onValueChange={(v) => setOutcome(v as PaymentResult)} className="gap-1">
          {OUTCOMES.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent has-data-checked:bg-surface-sunken"
            >
              <RadioGroupItem value={o.value} id={`outcome-${o.value}`} className="mt-0.5" />
              <span className="flex flex-col">
                <span className="text-body-compact font-medium">{o.label}</span>
                <span className="text-caption text-muted-foreground">{o.hint}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </Field>
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          disabled={!online || !!busy || task.amountPaise === undefined}
          onClick={() => setConfirm(true)}
        >
          Pay{task.amountPaise !== undefined ? ` ${rupees(task.amountPaise)}` : ""}
        </Button>
        <p className="text-caption text-muted-foreground">
          {task.amountPaise === undefined
            ? "Amount to be fetched — the fee is not on the task yet."
            : "Sandbox payment — no money moves."}
        </p>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay {amount}?</AlertDialogTitle>
            <AlertDialogDescription>
              {task.feeHead ?? "Court fee"} · {kase.parties}
              {kase.stNumber ? ` · ${kase.stNumber}` : ""}. In the live service this goes to the payment
              gateway now and cannot be recalled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void pay()}>Pay {amount}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RailCard>
  );
}

function ConfirmingCard({ ctx }: { ctx: ActContext }) {
  const { task, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  return (
    <RailCard
      title="Payment confirming"
      description={`Paid ${task.lastPayment ? `on ${dateTime(task.lastPayment.at)}` : ""} — the gateway has not confirmed yet. Ref ${task.lastPayment?.ref ?? "—"}.`}
    >
      <Button
        variant="outline"
        disabled={!online || !!busy}
        onClick={async () => {
          const t = await act(task.id, confirmPayment);
          if (t) finish(`Payment confirmed — receipt ${t.completion?.receipt ?? ""}`);
        }}
      >
        Gateway: confirm
      </Button>
      <p className="text-caption text-muted-foreground">Sandbox — stands in for the gateway&apos;s callback.</p>
    </RailCard>
  );
}

export function PayPage() {
  const ctx = useActContext();
  return (
    <ActFrame ctx={ctx} action="Pay" sandbox="No money moves here. The gateway's answer is whatever you pick below, and the receipt is generated locally.">
      {(c) => {
        const { task, kase, people, signatory } = c;
        const payers = signatoriesOf(kase, people);

        let rail: React.ReactNode;
        if (TERMINAL.has(task.status)) rail = <RecordCard ctx={c} title={closedTitle(task, "Paid")} />;
        else if (task.status === "payment-confirming") rail = <ConfirmingCard ctx={c} />;
        else if (signatory) rail = <PayCard ctx={c} />;
        else rail = <PrepareCard ctx={c} what="pay" />;

        return (
          <ActColumns
            main={
              <Card className={cn(PANEL_CLASS, "gap-4")}>
                <CardHeader>
                  <CardTitle className="text-body font-semibold">What is owed</CardTitle>
                </CardHeader>
                <CardContent>
                  <DescriptionList>
                    <Row label="Amount">
                      <span className="text-title-s font-semibold tabular-nums">
                        {task.amountPaise !== undefined ? rupees(task.amountPaise) : "To be fetched"}
                      </span>
                    </Row>
                    <Row label="Fee head">{task.feeHead ?? "—"}</Row>
                    <Row label="For">{task.whatToDo}</Row>
                    <Row label="Why">
                      {task.why.event}
                      {/dated|on \d/.test(task.why.event) ? null : (
                        <span className="text-muted-foreground"> · {longDate(task.why.at)}</span>
                      )}
                    </Row>
                    <Row label="Deadline">
                      {task.dueAt ? longDate(task.dueAt) : "No date set"}
                      {task.deadlineNote ? (
                        <span className="block text-caption text-muted-foreground">{task.deadlineNote}</span>
                      ) : null}
                    </Row>
                    <Row label="Payer">
                      {payers.map((p) => p.name).join(" or ") || "A signatory"}
                      {signatory ? <span className="text-muted-foreground"> · you</span> : null}
                    </Row>
                    <Row label="Case">
                      {kase.parties}
                      <span className="block text-caption text-muted-foreground">
                        {kase.stNumber || "Not yet numbered"}
                        {kase.cnr ? ` · ${kase.cnr}` : ""} · {kase.court}
                      </span>
                    </Row>
                    {task.completion?.receipt ? (
                      <Row label="Receipt" mono>
                        <span className="inline-flex items-center gap-1.5">
                          <CircleCheckIcon aria-hidden className="size-4 text-success-ink" />
                          {task.completion.receipt}
                        </span>
                      </Row>
                    ) : null}
                  </DescriptionList>
                </CardContent>
              </Card>
            }
            rail={rail}
          />
        );
      }}
    </ActFrame>
  );
}
