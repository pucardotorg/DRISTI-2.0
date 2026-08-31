"use client";

import type { MouseEvent } from "react";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * The one action a register row offers: download the filed artefact.
 *
 * The legacy screens hid this behind a three-dot menu whose only item was
 * Download; a menu of one is a click tax, so the action is the button itself
 * (Aug 31 correction round). Icon-only because it repeats on every row — the
 * words ride the tooltip on hover and focus, and the full label stays on the
 * control for screen readers. Ghost, not outline: repeated rows carry at most
 * one bordered action, and here the row's own click (open the record) is the
 * primary.
 *
 * A row can exist before its artefact does — a draft, a pending signature —
 * so `href` is optional and the control disables rather than disappears,
 * keeping the column steady. Clicks stop propagating because the row behind
 * the button opens the record dialog.
 */
export function DownloadFilingButton({
  label,
  tooltip,
  href,
}: {
  /** Full accessible name, e.g. "Download filing: PW-1 deposition". */
  label: string;
  /** The short hover label — "Download filing" / "Download submission". */
  tooltip: string;
  href: string | undefined;
}) {
  const stop = (event: MouseEvent<HTMLElement>) => event.stopPropagation();

  if (!href) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Disabled buttons swallow pointer events — the span carries the hover. */}
          <span className="inline-flex" onClick={stop}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled
              aria-label={label}
            >
              <DownloadIcon aria-hidden />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-body">
          No file to download yet
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          aria-label={label}
          onClick={stop}
        >
          <a href={href} target="_blank" rel="noreferrer" download>
            <DownloadIcon aria-hidden />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-body">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
