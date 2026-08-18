import { DraftFrame } from "@/components/filing/draft-frame";

/**
 * Width of the docked source rail (≥ xl). The rail absorbs spare width on wide screens
 * (min 20rem, max 40rem) so the form column — capped at `max-w-4xl` — never leaves dead
 * space beside it. Nav icon rail 3rem + sections rail 18rem + form 56rem + gutters 3rem
 * = 80rem is the width the rail starts growing from.
 */
const PANEL_WIDTH = "clamp(20rem, calc(100vw - 80rem), 40rem)";

/** One draft lives here: every step under /filings/<draftId> shares its store. */
export default async function DraftLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  return (
    // A row, not a column: the sections rail, the screen and the source rail are
    // siblings in it.
    <div
      className="flex min-w-0 flex-1"
      style={{ ["--source-panel-w" as string]: PANEL_WIDTH }}
    >
      <DraftFrame draftId={draftId}>{children}</DraftFrame>
    </div>
  );
}
