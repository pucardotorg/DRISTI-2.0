"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { buildCasesHref, type CasesBucket, type CasesQuery } from "@/lib/cases/query";
import { cn } from "@/lib/utils";

/**
 * Square folder tiles, not list rows. Item stays `flex` + wrap by default, so
 * the tile has to opt into a column and `flex-nowrap` or a short square clips
 * the label into a second column. `aspect-square` is the proportion; `min-h-fit`
 * lets a wrapping stage name (ACCESSIBILITY §10) grow the tile instead of
 * overflowing. `justify-between` pins the heading and count to the bottom left.
 * The stack illustration is centered in a nested `surface-sunken` well at half
 * that height — large enough to read, small enough not to dominate the tile.
 *
 * Colour is fill, not category. Product cut stage colour mapping (cases D7/D8);
 * `tag-1…5` is not in the DS yet. Status and chart tokens are the wrong role
 * here (status ≠ stage; chart is series identity). The well is the same nested
 * surface on every folder so the white stack reads in both themes.
 *
 * The PNG is used as painted in both themes. Empty folders keep the same
 * layout with muted copy — no hover, nothing to operate.
 *
 * `Item variant="outline"` rather than `Card`: this grid sits on the sunken page
 * beside the list panel, and Laws forbid a Card inside a Card.
 */
const TILE =
  "aspect-square h-full min-h-fit flex-col flex-nowrap items-stretch justify-between gap-4 p-6";

export function CasesBucketFolders({
  buckets,
  query,
}: {
  buckets: CasesBucket[];
  query: CasesQuery;
}) {
  return (
    <ItemGroup
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
      aria-label="Folders"
    >
      {buckets.map((bucket) => {
        const cases = `${bucket.count} ${bucket.count === 1 ? "case" : "cases"}`;

        /* An empty folder stays on the grid so the map holds still, but it is
           plain text — no link, no hover, nothing to operate. "0 cases" is the
           state; there is no control here to mark disabled. */
        if (bucket.count === 0) {
          return (
            <Item
              key={bucket.key}
              variant="outline"
              role="listitem"
              className={cn(TILE, "text-muted-foreground hover:bg-card")}
            >
              <FolderBody label={bucket.label} cases={cases} muted />
            </Item>
          );
        }

        return (
          <Item key={bucket.key} variant="outline" role="listitem" asChild>
            <Link
              href={buildCasesHref(query, { bucket: bucket.key })}
              className={TILE}
            >
              <FolderBody label={bucket.label} cases={cases} />
            </Link>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

function FolderBody({
  label,
  cases,
  muted = false,
}: {
  label: string;
  cases: string;
  muted?: boolean;
}) {
  return (
    <>
      <ItemMedia className="min-h-0 w-full flex-1 shrink translate-y-0 items-center justify-center self-stretch rounded-md bg-surface-sunken p-4">
        <Image
          src="/illustrations/case-document-stack.png"
          alt=""
          width={420}
          height={420}
          aria-hidden
          className="h-1/2 w-auto object-contain"
        />
      </ItemMedia>
      <ItemContent className="min-w-0 flex-none gap-1 self-start">
        {/* Stage names triple in length in some state languages, so the
            label wraps rather than truncating (ACCESSIBILITY §10). */}
        <ItemTitle
          className={cn(
            "line-clamp-none block w-auto text-body font-medium",
            !muted && "text-foreground",
          )}
        >
          {label}
        </ItemTitle>
        <ItemDescription className="text-caption">{cases}</ItemDescription>
      </ItemContent>
    </>
  );
}
