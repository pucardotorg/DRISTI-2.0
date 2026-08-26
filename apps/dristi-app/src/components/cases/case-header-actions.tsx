"use client";

import Link from "next/link";
import { ChevronDownIcon, DownloadIcon } from "lucide-react";

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

/**
 * Header is its own visual region (Laws: one teal). Make filings is that
 * primary. Direct-view case utilities precede it as icon buttons. Each filing
 * option stays distinct. Bail bond generation stays unavailable until its
 * eligibility and legal template are supplied by the product/backend contract.
 */
export function CaseHeaderActions({ caseId }: { caseId: string }) {
  return (
    <TooltipProvider>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            <DropdownMenuItem disabled>Generate bail bond</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
