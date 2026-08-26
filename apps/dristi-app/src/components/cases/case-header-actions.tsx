"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon, DownloadIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useLocale } from "@/components/shell/locale";
import type { AccessCase } from "@/lib/access/content";

/**
 * Header is its own visual region (Laws: one teal). Make filings is that primary.
 * Direct-view case utilities precede it as icon buttons.
 *
 * Integration seam (Phase 7): the Share button opens the access share flow scoped to
 * this one case, and "Generate bail bond" opens the bail application flow — both take
 * the same `AccessCase` the case-file builds from its record.
 */
export function CaseHeaderActions({ accessCase }: { accessCase: AccessCase }) {
  const { locale } = useLocale();
  const [shareOpen, setShareOpen] = React.useState(false);
  const [bailOpen, setBailOpen] = React.useState(false);
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
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setBailOpen(true);
              }}
            >
              Generate bail bond
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cases={[accessCase]}
        locale={locale}
      />
      <BailApplicationDialog
        open={bailOpen}
        onOpenChange={setBailOpen}
        accessCase={accessCase}
        locale={locale}
      />
    </TooltipProvider>
  );
}
