"use client";

/**
 * The outgoing advocate's side of removal-by-consent (scenario 3b): the
 * request lands as a row of the case Overview's Pending-tasks card — the
 * same berth the bond lifecycle uses — and the respond dialog carries the
 * grounds, the document, and the one decision.
 *
 * A single screen, no stepper: reading a request and deciding it is one
 * act. Accepting steps you off the vakalatnama (the consent IS the
 * approval); rejecting sends the requester back towards the magistrate.
 * Both endings say so in the done stage.
 *
 * Fixture-driven, like the rest of the demo world: the pack below says
 * which cases carry a live request. The fixture pass at the end of the
 * phase extends it (and mirrors the request into the requester's view).
 */

import { useState, type ReactNode } from "react";
import { CheckCircle2Icon, InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";

type RemovalConsentFixture = {
  /** The advocate who raised the request. */
  requester: string;
  /** The party whose vakalatnama the viewer would come off. */
  party: string;
  grounds: string;
  document: string;
  requestedOn: string;
};

/** Cases carrying a live removal request against the signed-in advocate. */
const REMOVAL_CONSENT_PACK: Record<string, RemovalConsentFixture> = {
  "c-1001": {
    requester: "Adv. Ramesh Menon",
    party: "Sunil Varghese",
    grounds:
      "The client has consolidated the brief with one counsel ahead of the evidence stage and has asked that co-counsel be relieved.",
    document: "Client_instruction_letter.pdf",
    requestedOn: "30 Aug 2026",
  },
};

/**
 * The Overview card's consent row, resolved as a hook so the card can size
 * its count and skip rendering once the request is decided — the same
 * contract `useBondTaskVisible` + `BondTaskRow` keep.
 */
export function useRemovalConsentTask(caseId: string): {
  visible: boolean;
  row: ReactNode;
} {
  const [resolved, setResolved] = useState(false);
  const fixture = REMOVAL_CONSENT_PACK[caseId];
  if (!fixture || resolved) return { visible: false, row: null };
  return {
    visible: true,
    row: (
      <RemovalConsentRow
        fixture={fixture}
        onResolved={() => setResolved(true)}
      />
    ),
  };
}

function RemovalConsentRow({
  fixture,
  onResolved,
}: {
  fixture: RemovalConsentFixture;
  onResolved: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Item
        role="listitem"
        size="sm"
        className="min-h-10 items-start px-0 hover:bg-transparent"
      >
        <ItemContent className="gap-2">
          <ItemTitle className="line-clamp-none min-w-0 text-body font-medium text-foreground">
            Respond to a removal request
          </ItemTitle>
          <p className="text-body text-muted-foreground">
            {fixture.requester} asks that you come off {fixture.party}&apos;s
            vakalatnama.
          </p>
        </ItemContent>
        <ItemActions className="shrink-0 max-sm:basis-full">
          <Button
            type="button"
            variant="outline"
            className="max-sm:w-full"
            onClick={() => setOpen(true)}
          >
            Respond
          </Button>
        </ItemActions>
      </Item>

      <RemovalConsentDialog
        open={open}
        onOpenChange={setOpen}
        fixture={fixture}
        onResolved={onResolved}
      />
    </>
  );
}

type Decision = "accepted" | "rejected" | null;

function RemovalConsentDialog({
  open,
  onOpenChange,
  fixture,
  onResolved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixture: RemovalConsentFixture;
  onResolved: () => void;
}) {
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<Decision>(null);

  function close() {
    const decided = decision !== null;
    setNote("");
    setDecision(null);
    onOpenChange(false);
    if (decided) onResolved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {decision ? (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex items-center gap-4">
                <span
                  className={
                    decision === "accepted"
                      ? "flex size-14 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground"
                      : "flex size-14 shrink-0 items-center justify-center rounded-full bg-info-muted text-info-muted-foreground"
                  }
                >
                  {decision === "accepted" ? (
                    <CheckCircle2Icon className="size-7" aria-hidden />
                  ) : (
                    <InfoIcon className="size-7" aria-hidden />
                  )}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <DialogTitle className="text-title-s font-semibold text-balance">
                    {decision === "accepted"
                      ? "Removal accepted"
                      : "Request rejected"}
                  </DialogTitle>
                  <DialogDescription>
                    {decision === "accepted"
                      ? `You come off ${fixture.party}'s vakalatnama and your access to this case ends.`
                      : `${fixture.requester} will be notified. They can still apply to the magistrate for an order.`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <footer className="flex shrink-0 justify-end border-t border-hairline px-6 py-4">
              <Button type="button" onClick={close}>
                Done
              </Button>
            </footer>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 gap-1.5 border-b border-hairline px-6 py-5 pr-14 text-left">
              <DialogTitle className="text-title-s font-semibold text-balance">
                Removal request
              </DialogTitle>
              <DialogDescription>
                {fixture.requester} asks that you come off the vakalatnama for{" "}
                {fixture.party}. Accepting is the approval; no order is needed.
              </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
              <DescriptionList>
                <ReviewRow term="Requested by">{fixture.requester}</ReviewRow>
                <ReviewRow term="Party">{fixture.party}</ReviewRow>
                <ReviewRow term="Requested on">
                  <span className="tabular-nums">{fixture.requestedOn}</span>
                </ReviewRow>
                <ReviewRow term="Grounds">
                  <span className="whitespace-pre-wrap">{fixture.grounds}</span>
                </ReviewRow>
                <ReviewRow term="Document">{fixture.document}</ReviewRow>
              </DescriptionList>

              <Field>
                <FieldLabel htmlFor="consent-note">
                  Add a note (optional)
                </FieldLabel>
                <Textarea
                  id="consent-note"
                  className="min-h-20"
                  maxLength={300}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDecision("rejected")}
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="destructive-solid"
                onClick={() => setDecision("accepted")}
              >
                Accept removal
              </Button>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <DescriptionRow className="grid-cols-1 sm:grid-cols-[minmax(7rem,10rem)_1fr]">
      <DescriptionTerm className="text-body-compact">{term}</DescriptionTerm>
      <DescriptionDetails className="text-body-compact">
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}
