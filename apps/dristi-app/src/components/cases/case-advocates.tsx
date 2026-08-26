"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  counselFor,
  type CaseRecord,
  type CounselSide,
} from "@/lib/cases/types";

const SIDES: readonly CounselSide[] = ["complainant", "accused"];

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
 * Both sides in one cell — one name each, complainant above accused, so the
 * pair reads in the order the cause title does. `(C)` / `(A)` carries the
 * side; without it a merged column would be an unattributed list of names.
 * A side with no vakalat on record is left out rather than shown empty: the
 * mark on the surviving line already says which side is present.
 */
export function CaseAdvocatesPair({ record }: { record: CaseRecord }) {
  const sides = SIDES.filter((side) => counselFor(record, side).length > 0);
  if (sides.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {sides.map((side) => (
        <CaseAdvocates key={side} record={record} side={side} markSide />
      ))}
    </div>
  );
}

/**
 * First name on the row; remaining count as +N. The popover lists only the
 * names that are not already on the row — available without hover.
 */
export function CaseAdvocates({
  record,
  side,
  className,
  markSide = false,
}: {
  record: CaseRecord;
  side: CounselSide;
  className?: string;
  /** Append `(C)` / `(A)`. On for the merged column, off where a label names
   *  the side already (case header). */
  markSide?: boolean;
}) {
  const names = counselFor(record, side);
  if (names.length === 0) return null;

  const extra = names.length - 1;
  const copy = SIDE_COPY[side];

  /* z-10 keeps the +N trigger above the row's peek overlay. */
  return (
    <div className="relative z-10 flex min-w-0 items-center gap-1">
      <span
        className={cn("truncate text-body-compact text-foreground", className)}
      >
        {names[0]}
      </span>
      {markSide ? (
        <>
          <span
            aria-hidden
            className="shrink-0 text-body-compact text-muted-foreground"
          >
            {copy.mark}
          </span>
          <span className="sr-only">{`, ${copy.one}`}</span>
        </>
      ) : null}
      {extra > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              /* min-w-10 so the chip's hit area clears 40×40 (ACCESSIBILITY.md
                 §"Minimum interactive target"); the badge stays chip-sized. */
              className="h-10 min-w-10 shrink-0 px-1"
              aria-label={`${names[0]} and ${extra} more ${
                extra === 1 ? copy.one : copy.many
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <Badge
                variant="ghost"
                className="bg-brand-muted text-brand-muted-foreground hover:bg-brand-muted-hover hover:text-brand-muted-foreground group-hover/button:bg-brand-muted-hover"
              >
                +{extra}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 text-body-compact">
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
