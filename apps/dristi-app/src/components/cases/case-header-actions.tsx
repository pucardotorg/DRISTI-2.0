"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon, DownloadIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShareDialog } from "@/components/access/share-dialog";
import { BailApplicationDialog } from "@/components/filing/bail-application-dialog";
import {
  BailBondDialog,
  type BondMode,
} from "@/components/filing/bail-bond-dialog";
import {
  BailBondStatusDialog,
  buildBondSigners,
} from "@/components/filing/bail-bond-status-dialog";
import { useProfile } from "@/components/shell/profile";
import type { AccessCase } from "@/lib/access/content";
import {
  BOND_LITIGANT,
  BOND_SURETIES,
  BOND_THIRD_SURETY,
} from "@/lib/filing/content";

/**
 * Case-file header actions. Beyond Neer's own filings, this is where Mohit's Case-Access
 * integrations hang off the case (the wiring map's hub): Share access (this one case),
 * and the full bail flow — bail application → generate bail bond → bond status — that his
 * original all-cases design orchestrated. Sureties sign the bond from the /bond link.
 */
export function CaseHeaderActions({ accessCase }: { accessCase: AccessCase }) {
  const { accountName } = useProfile();
  const [shareOpen, setShareOpen] = React.useState(false);
  const [bailOpen, setBailOpen] = React.useState(false);
  const [bondOpen, setBondOpen] = React.useState(false);
  const [bondMode, setBondMode] = React.useState<BondMode>("direct");
  const [bondStatusOpen, setBondStatusOpen] = React.useState(false);
  const [bondMethod, setBondMethod] = React.useState<"esign" | "upload">("esign");
  const caseId = accessCase.id;

  const suretyNames = [...BOND_SURETIES, BOND_THIRD_SURETY].map((s) => s.name);

  return (
    <TooltipProvider>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Share access to this case"
              onClick={() => setShareOpen(true)}
            >
              <Share2Icon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share access to this case</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Download case file — not available yet"
              aria-disabled="true"
              className="cursor-not-allowed opacity-50"
              onClick={(event) => event.preventDefault()}
            >
              <DownloadIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Download case file — not available yet
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button">
              Make filings
              <ChevronDownIcon data-icon="inline-end" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/cases/${caseId}/filings/application`}>
                Raise application
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/cases/${caseId}/filings/documents`}>
                Submit documents
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setBailOpen(true);
              }}
            >
              Raise bail application
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setBondMode("direct");
                setBondOpen(true);
              }}
            >
              Generate bail bond
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setBondStatusOpen(true);
              }}
            >
              Bond status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cases={[accessCase]}
        locale="en"
      />

      <BailApplicationDialog
        open={bailOpen}
        onOpenChange={setBailOpen}
        accessCase={accessCase}
        locale="en"
      />

      {/* Remount per mode so each entry starts from its own clean state. */}
      <BailBondDialog
        key={bondMode}
        open={bondOpen}
        onOpenChange={setBondOpen}
        accessCase={accessCase}
        locale="en"
        mode={bondMode}
        onSubmitted={(result) => setBondMethod(result.method)}
      />

      <BailBondStatusDialog
        open={bondStatusOpen}
        onOpenChange={setBondStatusOpen}
        accessCase={accessCase}
        locale="en"
        signers={buildBondSigners({
          advocateName: accountName,
          litigantName: BOND_LITIGANT.name,
          suretyNames,
          locale: "en",
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
    </TooltipProvider>
  );
}
