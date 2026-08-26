import { cn } from "@/lib/utils";

/**
 * The 24×7 ON Courts brand marks.
 *
 * These are product brand assets, not design-system primitives — the SVGs live in
 * `public/brand`. Two files per mark so the artwork itself carries the right ink in
 * each theme; the wrong-theme copy stays in the DOM but is hidden with the `dark:`
 * variant (class-based dark mode), so no runtime theme read is needed.
 *
 * `BrandLockup` is the full wordmark (used wherever there is room); `BrandGlyph` is
 * the mark alone (used in the collapsed sidebar rail). Size is set by the caller via
 * height utilities so both stay crisp at any scale. `onDark` pins the light-ink
 * artwork for surfaces that stay dark in both themes (the sign-in canvas plate),
 * where the theme-driven swap would otherwise show the dark-ink copy in light mode.
 */

const LABEL = "24×7 ON Courts";

function Mark({
  base,
  onDark,
  className,
}: {
  base: string;
  onDark: boolean;
  className?: string;
}) {
  return (
    <span role="img" aria-label={LABEL} className={cn("inline-flex", className)}>
      {onDark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${base}-dark.svg`} alt="" aria-hidden className="block h-full w-auto" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${base}.svg`} alt="" aria-hidden className="block h-full w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}-dark.svg`}
            alt=""
            aria-hidden
            className="hidden h-full w-auto dark:block"
          />
        </>
      )}
    </span>
  );
}

export function BrandLockup({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return <Mark base="/brand/on-courts-logo" onDark={onDark} className={className} />;
}

export function BrandGlyph({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return <Mark base="/brand/on-courts-glyph" onDark={onDark} className={className} />;
}
