"use client";

import { BookmarkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function BookmarkButton({
  caseLabel,
  bookmarked,
  onToggle,
  className,
}: {
  caseLabel: string;
  bookmarked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={bookmarked}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn("relative z-10", className)}
    >
      <BookmarkIcon className={bookmarked ? "fill-current" : undefined} />
      <span className="sr-only">
        {bookmarked
          ? `Remove bookmark from ${caseLabel}`
          : `Bookmark ${caseLabel}`}
      </span>
    </Button>
  );
}
