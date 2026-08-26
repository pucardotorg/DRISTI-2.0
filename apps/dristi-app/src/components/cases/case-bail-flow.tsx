"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BailApplicationDialog } from "@/components/filing/bail-application-dialog";
import {
  BailBondDialog,
  type BondMode,
} from "@/components/filing/bail-bond-dialog";
import {
  BailBondStatusDialog,
  buildBondSigners,
} from "@/components/filing/bail-bond-status-dialog";
import { useLocale } from "@/components/shell/locale";
import { useProfile } from "@/components/shell/profile";
import type { AccessCase } from "@/lib/access/content";
import {
  BOND_ID,
  BOND_LITIGANT,
  BOND_SURETIES,
  BOND_TASK_DUE,
  BOND_THIRD_SURETY,
  bondCopy,
  fillCopy,
} from "@/lib/filing/content";
import { pick } from "@/lib/onboarding/content";

/**
 * The whole bail lifecycle on a case, held in one place so the header's "Make filings"
 * entries and the in-page lifecycle card share the same state (Mohit's original flow):
 *
 *   raise bail application → magistrate approves with terms → a "task" to raise the bond
 *   with those terms FROZEN → generate the bond → out for signatures → status.
 *
 * "Generate bail bond" from Make filings is the direct entry (nothing frozen). Sureties
 * sign the bond itself from the /bond link.
 */
type BondPhase = "none" | "task" | "signing" | "review";

type CaseBailValue = {
  bondPhase: BondPhase;
  openApplication: () => void;
  openBondDirect: () => void;
  openBondTask: () => void;
  openStatus: () => void;
};

const CaseBailContext = React.createContext<CaseBailValue | null>(null);

export function useCaseBail(): CaseBailValue {
  const value = React.useContext(CaseBailContext);
  if (!value) throw new Error("useCaseBail must be used inside <CaseBailProvider>");
  return value;
}

export function CaseBailProvider({
  accessCase,
  initialBondPhase = "task",
  children,
}: {
  accessCase: AccessCase;
  /** Seeded to "task" for the demo: the magistrate has already approved a bail
   *  application on this case and asked for a bond. */
  initialBondPhase?: BondPhase;
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  const { accountName } = useProfile();
  const [bailOpen, setBailOpen] = React.useState(false);
  const [bondOpen, setBondOpen] = React.useState(false);
  const [bondMode, setBondMode] = React.useState<BondMode>("direct");
  const [bondStatusOpen, setBondStatusOpen] = React.useState(false);
  const [bondMethod, setBondMethod] = React.useState<"esign" | "upload">("esign");
  const [bondPhase, setBondPhase] = React.useState<BondPhase>(initialBondPhase);

  const suretyNames = [...BOND_SURETIES, BOND_THIRD_SURETY].map((s) => s.name);

  const value = React.useMemo<CaseBailValue>(
    () => ({
      bondPhase,
      // Submitting a bail application sends it to the magistrate; the approval comes
      // back as a bond task with the terms set.
      openApplication: () => setBailOpen(true),
      openBondDirect: () => {
        setBondMode("direct");
        setBondOpen(true);
      },
      openBondTask: () => {
        setBondMode("task");
        setBondOpen(true);
      },
      openStatus: () => setBondStatusOpen(true),
    }),
    [bondPhase],
  );

  return (
    <CaseBailContext.Provider value={value}>
      {children}

      <BailApplicationDialog
        open={bailOpen}
        onOpenChange={setBailOpen}
        accessCase={accessCase}
        locale={locale}
        onSubmitted={() => setBondPhase("task")}
      />

      {/* Remount per mode so each entry (task = frozen terms, direct = editable,
          edit = correct a submitted bond) starts from its own clean state. */}
      <BailBondDialog
        key={bondMode}
        open={bondOpen}
        onOpenChange={setBondOpen}
        accessCase={accessCase}
        locale={locale}
        mode={bondMode}
        onSubmitted={(result) => {
          setBondMethod(result.method);
          setBondPhase(result.method === "esign" ? "signing" : "review");
        }}
      />

      <BailBondStatusDialog
        open={bondStatusOpen}
        onOpenChange={setBondStatusOpen}
        accessCase={accessCase}
        locale={locale}
        signers={buildBondSigners({
          advocateName: accountName,
          litigantName: BOND_LITIGANT.name,
          suretyNames,
          locale,
          advocateSigned: true,
          allSigned: bondMethod === "upload",
        })}
        suretyNames={suretyNames}
        onEdit={() => {
          setBondStatusOpen(false);
          setBondMode("edit");
          setBondOpen(true);
        }}
      />
    </CaseBailContext.Provider>
  );
}

/**
 * The lifecycle surface on the case page: the pending bond task the magistrate's approval
 * created, and — once a bond exists — its signing/review status. Sits above the case tabs.
 */
export function BondLifecycleCard() {
  const { locale } = useLocale();
  const { bondPhase, openBondTask, openStatus } = useCaseBail();

  if (bondPhase === "none") return null;

  if (bondPhase === "task") {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <p className="text-body-compact font-semibold">
            {pick(bondCopy.pendingTitle, locale)}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={openBondTask}
            >
              {pick(bondCopy.taskRaiseBond, locale)}
            </Button>
            <span className="text-caption text-muted-foreground tabular-nums">
              {fillCopy(bondCopy.taskDue, locale, { date: BOND_TASK_DUE })}
            </span>
          </div>
          <p className="text-caption text-pretty text-muted-foreground">
            {pick(bondCopy.taskNote, locale)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <p className="text-body-compact font-semibold">
          {pick(bondCopy.bondsTitle, locale)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-body-compact font-medium">
              {pick(bondCopy.bondTypeSurety, locale)}
            </p>
            <p className="font-mono text-caption text-muted-foreground">{BOND_ID}</p>
          </div>
          <Badge variant="warning">
            {pick(
              bondPhase === "signing"
                ? bondCopy.statusPendingSign
                : bondCopy.statusPendingReview,
              locale,
            )}
          </Badge>
          <Button type="button" variant="ghost" size="sm" onClick={openStatus}>
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
