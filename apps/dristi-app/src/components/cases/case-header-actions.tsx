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
import { useCaseBail } from "@/components/cases/case-bail-flow";
import type { AccessCase } from "@/lib/access/content";

/**
 * Case-file header actions. Beyond Neer's own filings, this is the case-access hub:
 * Share access (this one case) and the entries into Mohit's bail flow (application,
 * generate bond, status). The bail lifecycle + dialogs live in <CaseBailProvider>, which
 * wraps the page, so the in-page bond-task card and these entries share one state.
 */
export function CaseHeaderActions({ accessCase }: { accessCase: AccessCase }) {
  const bail = useCaseBail();
  const [shareOpen, setShareOpen] = React.useState(false);
  const caseId = accessCase.id;

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
                bail.openApplication();
              }}
            >
              Raise bail application
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                bail.openBondDirect();
              }}
            >
              Generate bail bond
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                bail.openStatus();
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
    </TooltipProvider>
  );
}
