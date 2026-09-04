"use client";

import * as React from "react";

import { useChromePageDialog } from "@/components/chrome/app-chrome";
import { DocumentPreview } from "@/components/cases/document-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { causeTitle } from "@/lib/employee/hearings";
import {
  buildSignOrderDocument,
  downloadSignOrderDocument,
  formatSignOrderDate,
  signOrderStatusLabel,
  signOrderTypeLabel,
  type SignOrder,
  type SignOrderDocument,
} from "@/lib/employee/sign-orders";

/**
 * One order, read and then signed — the single-order path off the signing queue.
 *
 * The document *is* the task, so the dialog is the document: a `height="fill"`
 * `DocumentPreview` in a tall overlay, the same layout `SignFormDialog` and
 * `ReschedulingRequestDialog` already use to read a court paper before acting on it.
 *
 * One step rather than the two the forms queue needs. A form is signed by a *party*, so
 * that dialog has to ask how — e-sign, or upload the paper they signed. An order is
 * signed by the bench that is already logged in, and the reference asks nothing: it
 * confirms and publishes. So the act is one button under the document it acts on.
 *
 * A signed order opens here too, read-only. It is the only way to see what was signed
 * without leaving the screen, and offering it costs nothing but the button.
 *
 * Download is not repeated in the footer. `DocumentPreview` owns a sticky header with
 * Download and Full view in it, and the same control twice in one dialog is one too
 * many.
 *
 * **Signing signs nothing.** It marks the row signed in the demo queue and closes — see
 * `lib/employee/sign-orders.ts`. Nothing is written, published, sent or filed, and no
 * e-sign provider is called.
 */
export function SignOrderDialog({
  order,
  onOpenChange,
  onSign,
  onReturnFocus,
}: {
  order: SignOrder | null;
  onOpenChange: (order: SignOrder | null) => void;
  onSign: (order: SignOrder) => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
    >
      {order ? (
        /* Keyed on the order so opening a second one renders that document from the top
           rather than inheriting the last one's scroll. */
        <SignOrderBody
          key={order.id}
          order={order}
          onSign={onSign}
          onReturnFocus={onReturnFocus}
        />
      ) : null}
    </Dialog>
  );
}

function SignOrderBody({
  order,
  onSign,
  onReturnFocus,
}: {
  order: SignOrder;
  onSign: (order: SignOrder) => void;
  onReturnFocus: () => void;
}) {
  const document = React.useMemo(() => buildSignOrderDocument(order), [order]);
  const pending = order.status === "pending-signature";
  const pageDialog = useChromePageDialog();

  return (
    <DialogContent
      className={`flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl md:h-[85dvh] ${pageDialog}`}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      {/* `pr-16` keeps the title clear of the close button the DS places top-right. */}
      <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-title-s font-semibold">
            {signOrderTypeLabel(order.type)}
          </DialogTitle>
          <Badge variant={pending ? "warning" : "success"}>
            {signOrderStatusLabel(order.status)}
          </Badge>
        </div>
        <DialogDescription className="text-body-compact text-muted-foreground">
          {causeTitle(order)} · {order.caseNumber} ·{" "}
          {pending
            ? `Added ${formatSignOrderDate(order.addedOn)}`
            : `Signed ${formatSignOrderDate(order.signedOn ?? order.addedOn)}`}
        </DialogDescription>
      </DialogHeader>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <DocumentPreview
          className="min-h-96 md:min-h-0"
          height="fill"
          title={document.title}
          source={{
            kind: "composed",
            content: <OrderFacsimile document={document} />,
          }}
          download={{
            onDownload: () => downloadSignOrderDocument(order),
            label: `Download the ${document.title.toLowerCase()} order`,
          }}
        />
      </div>

      {pending ? (
        <DialogFooter className="mx-0 mb-0 shrink-0 sm:items-center">
          {/* What the act means, and what this build does not do — said at the moment of
              the act rather than left for the bench to discover. */}
          <p className="text-caption text-muted-foreground sm:mr-auto sm:text-left">
            Signing publishes this order and cannot be reversed. Not part of this
            build — nothing is signed, published or sent.
          </p>
          <Button type="button" onClick={() => onSign(order)}>
            Sign and publish
          </Button>
        </DialogFooter>
      ) : null}
    </DialogContent>
  );
}

/**
 * The order itself as paper — the same facsimile treatment the two other court-side
 * overlays use, bound to this order's own particulars.
 */
function OrderFacsimile({ document }: { document: SignOrderDocument }) {
  return (
    <article className="flex flex-col gap-6 rounded-md bg-paper p-6 text-paper-foreground">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-body font-semibold">{document.court}</p>
        <p className="text-body font-semibold">
          Case no. {document.caseNumber}
        </p>
        <p className="text-body font-semibold">{document.matter}</p>
      </header>

      <h3 className="text-center text-body font-semibold">{document.title}</h3>

      <ol className="flex list-decimal flex-col gap-3 ps-6">
        {document.paragraphs.map((paragraph, index) => (
          <li key={index} className="text-body">
            {paragraph}
          </li>
        ))}
      </ol>

      <p className="text-body">Dated this the {document.dated}.</p>

      <p className="text-body text-paper-muted-foreground">
        {document.signature}
      </p>
    </article>
  );
}
