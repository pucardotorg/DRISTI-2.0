"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type CounselSide } from "@/lib/employee/hearings";

/**
 * Counsel in a table cell: one name per side, the rest behind a `+N` pill.
 *
 * This is the advocate list's `CaseAdvocates` interaction, rebuilt against plain names
 * rather than a `CaseRecord` — the bench sees the same cell it would on the other side of
 * the app, down to the chip's brand tint and the hover delay. It is restated here rather
 * than imported because `/employee` does not reach into the citizen side; when the
 * advocate shell migrates onto the shared `components/chrome` frame, this and the table
 * treatment in `hearings-table.tsx` are what belong there, and `CaseAdvocates` should
 * collapse onto the same module rather than the two drifting apart.
 */

const SIDE_COPY: Record<
  CounselSide,
  { mark: string; one: string; many: string; list: string }
> = {
  complainant: {
    mark: "(C)",
    one: "complainant advocate",
    many: "complainant advocates",
    list: "Other complainant advocates",
  },
  accused: {
    mark: "(A)",
    one: "accused advocate",
    many: "accused advocates",
    list: "Other accused advocates",
  },
};

/**
 * Hover opens the `+N` list on pointer devices; click, tap and Enter keep working exactly
 * as before. Hover is strictly additive — ACCESSIBILITY §7 forbids hover being the only
 * path to information, which is why this stays a Popover rather than a HoverCard (a
 * HoverCard would show a touch user nothing). The close is delayed so the pointer can
 * travel from the chip onto the list, and a hover-open does not steal focus the way a
 * click-open should.
 */
function useHoverPopover() {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = React.useRef(false);

  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  React.useEffect(() => cancelClose, []);

  return {
    open,
    openedByHover,
    onOpenChange: (next: boolean) => {
      cancelClose();
      if (!next) openedByHover.current = false;
      setOpen(next);
    },
    hoverProps: {
      onMouseEnter: () => {
        if (!canHover()) return;
        cancelClose();
        openedByHover.current = true;
        setOpen(true);
      },
      onMouseLeave: () => {
        if (!canHover()) return;
        cancelClose();
        closeTimer.current = setTimeout(() => {
          openedByHover.current = false;
          setOpen(false);
        }, 150);
      },
    },
  };
}

/**
 * One side's line: first name, the side mark, then `+N` for whoever is left.
 *
 * The popover lists only the names that are not already on the row — repeating the
 * visible one would make the list disagree with its own count.
 */
function CounselLine({
  names,
  side,
  dense,
}: {
  names: string[];
  side: CounselSide;
  dense: boolean;
}) {
  /* Above the early return — hooks run on every render or not at all. */
  const { open, openedByHover, onOpenChange, hoverProps } = useHoverPopover();
  if (names.length === 0) return null;

  const extra = names.length - 1;
  const copy = SIDE_COPY[side];

  /* min-h-6 holds the line to the chip's own height, so a side with a +N and a side
     without one occupy the same band and the table keeps one row rhythm. */
  return (
    <div className="relative flex min-h-6 min-w-0 items-center gap-1">
      <span className="truncate text-body-compact text-foreground">
        {names[0]}
      </span>
      <span
        aria-hidden
        className="shrink-0 text-body-compact text-muted-foreground"
      >
        {copy.mark}
      </span>
      <span className="sr-only">{`, ${copy.one}`}</span>
      {extra > 0 ? (
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild {...hoverProps}>
            {/* The chip is the trigger. Wrapping a Badge in a 40px Button would make this
                cell the tallest thing in the row and set the height of the whole table;
                chip-sized, the row keeps its rhythm. The dense table opts out of the
                40×40 expansion — a 24px chip already clears WCAG 2.2's 24×24, and inset
                targets would overlap the line below. */}
            <Badge
              asChild
              variant="ghost"
              className={cn(
                "relative shrink-0 cursor-pointer bg-brand-muted text-brand-muted-foreground transition-colors hover:bg-brand-muted-hover hover:text-brand-muted-foreground",
                /* overflow-visible: the primitive clips to the pill, which would swallow
                   the `after:` target. Nothing but text is in the chip, so there is
                   nothing left to clip. */
                !dense &&
                  "overflow-visible after:absolute after:-inset-x-1.5 after:-inset-y-2",
              )}
            >
              <button
                type="button"
                aria-label={`${names[0]} and ${extra} more ${
                  extra === 1 ? copy.one : copy.many
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                +{extra}
              </button>
            </Badge>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-64 text-body-compact"
            {...hoverProps}
            onOpenAutoFocus={(event) => {
              /* A click or Enter should land focus in the list; a pointer merely passing
                 over the chip should not yank it out of the table. */
              if (openedByHover.current) event.preventDefault();
            }}
          >
            <PopoverHeader>
              <PopoverTitle className="text-body-compact font-medium">
                {copy.list}
              </PopoverTitle>
            </PopoverHeader>
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {names.slice(1).map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className="text-body-compact text-foreground"
                >
                  {name}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

/**
 * Both sides in one cell — complainant above accused, so the pair reads in the order the
 * cause title does. `(C)` / `(A)` carries the side; without it a merged column would be
 * an unattributed list of names. A side with no vakalat on record is left out rather than
 * shown empty: the mark on the surviving line already says which side is present.
 */
export function CounselCell({
  complainant,
  accused,
  dense = false,
}: {
  complainant: string[];
  accused: string[];
  /** Dense table row: chips keep their own 24px box instead of a 40×40 target. */
  dense?: boolean;
}) {
  if (complainant.length === 0 && accused.length === 0) return null;

  /* Comfortable surfaces expand each chip to a 40px-tall target, so the two lines need a
     40px pitch or the two targets overlap. min-h-6 + gap-4 is exactly that. The dense
     table's chips are their own 24px box and stay tight. */
  return (
    <div className={cn("flex flex-col", dense ? "gap-1" : "gap-4")}>
      <CounselLine names={complainant} side="complainant" dense={dense} />
      <CounselLine names={accused} side="accused" dense={dense} />
    </div>
  );
}
