import { BriefcaseIcon, ClipboardListIcon } from "lucide-react";

import type { RegistrantKind } from "@/lib/employee/register-advocates";
import { cn } from "@/lib/utils";

/**
 * What an advocate's registration and a clerk's registration look like before either is
 * read — one mark, at two sizes.
 *
 * Owner, 2026-09-11: *"when I click into an item, I want a visual indicator… that I'm
 * currently looking at the advocate registration and not the clerk registration, because
 * these two are slightly different. I don't want it to be very loud, but distinct enough
 * that it catches my attention… just a small word of Advocate and Clerk does not do it."*
 *
 * A word is read; a mark is seen. So the role gets a **shape** and, for the less common of
 * the two, a **colour** — in that order of importance:
 *
 * - **Shape first.** A briefcase for an advocate — in Indian practice the brief is literally
 *   the advocate's case papers — and a clipboard for a clerk, who keeps the list: filings,
 *   dates, errands. Both glyphs were unused anywhere in the product, so neither arrives
 *   carrying another meaning. (`ScaleIcon` was the obvious advocate mark and was rejected
 *   for exactly that reason: the advocate product already uses it for *cases*.) Shape is
 *   what survives a colour-blind reader, a greyscale print and dark mode.
 * - **Colour for the exception.** Advocates are most of the queue, so their mark takes the
 *   neutral well tone and recedes; clerks take `info` — the calmest status family, and on
 *   this screen already the colour of "not the ordinary case, nothing wrong" (it is the
 *   Profile update chip). A clerk request is therefore the one that catches the eye, which
 *   is the attention the owner asked for, and an advocate request is quiet, which is what
 *   most of a day in this queue should be. A clerk is never a profile update, so no single
 *   row carries two blues.
 *
 * **Why not a colour of its own.** The DS has no categorical tint for identity: `chart-1…5`
 * are solids, scoped by AGENTS.md to data visualisation, and a pale version of one would
 * have to be faked with an opacity modifier, which rule 6 forbids. That is recorded as an
 * upstream gap in the brief (§13), not worked around here.
 *
 * The mark is always beside the word, never instead of it, and it is always `aria-hidden`:
 * the words carry the fact to a screen reader, so the mark is never colour — or shape —
 * alone (ACCESSIBILITY §3).
 */
const ROLE_GLYPH = {
  advocate: BriefcaseIcon,
  clerk: ClipboardListIcon,
} as const satisfies Record<RegistrantKind, unknown>;

/** The small form's ink: the norm recedes, the exception takes the info ink. */
const GLYPH_INK: Record<RegistrantKind, string> = {
  advocate: "text-muted-foreground",
  clerk: "text-info-ink",
};

/** The large form's fill and ink — the status family's own muted pair, never grey-on-tint. */
const TILE: Record<RegistrantKind, string> = {
  advocate: "bg-surface-sunken text-muted-foreground",
  clerk: "bg-info-muted text-info-muted-foreground",
};

/**
 * The mark at text size, for a line that already says the role in words — a table cell,
 * a caption, the identity line on the decision card. 16px by default, for body-compact
 * lines; a caption line passes `size-3.5` so the mark stays about one em (ui-craft §2).
 */
export function RoleGlyph({
  kind,
  className,
}: {
  kind: RegistrantKind;
  className?: string;
}) {
  const Icon = ROLE_GLYPH[kind];
  return (
    <Icon
      aria-hidden
      className={cn("size-4 shrink-0", GLYPH_INK[kind], className)}
    />
  );
}

/**
 * The mark as a tile, for the one place a registration is introduced: the dialog header,
 * beside the title every stage rewrites. It is there on Review, on the Approve and Reject
 * stages, and on the settled state, because the header is the one part of the overlay that
 * never leaves — so the officer is told what they are about to grant, and told again as
 * they grant it, without a second copy of the mark anywhere in the body.
 */
export function RoleMark({ kind }: { kind: RegistrantKind }) {
  const Icon = ROLE_GLYPH[kind];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        TILE[kind],
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}
