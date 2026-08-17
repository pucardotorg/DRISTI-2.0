import { DraftFrame } from "@/components/filing/draft-frame";

/**
 * Width of the docked source-document panel (≥ xl). The panel absorbs spare width on
 * wide screens (min 20rem, max 40rem) so the form column — capped at `max-w-4xl` — never
 * leaves dead space beside it. Rail 18rem + form 56rem + gutters 6rem = 80rem is the
 * width the panel starts growing from.
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
    <div
      className="flex flex-1 flex-col"
      style={{ ["--source-panel-w" as string]: PANEL_WIDTH }}
    >
      <DraftFrame draftId={draftId}>{children}</DraftFrame>
    </div>
  );
}
