"use client";

import { DocumentPreview } from "@/components/cases/document-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  orderClassLabel,
  orderDocumentSrc,
  type OrderRecord,
} from "@/lib/cases/orders";
import { formatCaseDate } from "@/lib/cases/types";

/**
 * Read-only issued order or notification. An order is one issued document —
 * the record shows that document, not a bundle of filings around it.
 */
export function OrderRecordDialog({
  order,
  onOpenChange,
}: {
  order: OrderRecord | null;
  onOpenChange: (order: OrderRecord | null) => void;
}) {
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
    >
      {order ? <OrderBody key={order.id} order={order} /> : null}
    </Dialog>
  );
}

function OrderBody({ order }: { order: OrderRecord }) {
  const issued = order.issuedDocument;
  const issuedSrc = issued ? orderDocumentSrc(issued) : undefined;
  const heading = order.title;

  return (
    <DialogContent className="flex max-h-[90svh] flex-col gap-6 overflow-hidden sm:max-w-4xl">
      <DialogHeader className="shrink-0 pr-12">
        <DialogDescription className="text-caption font-medium text-muted-foreground">
          {orderClassLabel(order.classId)}
        </DialogDescription>
        <DialogTitle className="text-title font-semibold">
          {heading}
        </DialogTitle>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
        <div className="flex flex-col gap-6">
          {/*
            One fact, so it reads as a line — not a description list. A
            single dl row strands the value across the 10rem term column
            and drops its divider, which looks like a broken table.
          */}
          <p className="text-body text-muted-foreground">
            Date issued:{" "}
            <span className="font-medium text-foreground">
              {formatCaseDate(order.issuedOn)}
            </span>
          </p>

          {issuedSrc ? (
            <DocumentPreview
              title={issued?.label ?? "Issued order"}
              source={{ kind: "src", src: issuedSrc }}
              download={{
                href: issuedSrc,
                label: `Download order ${order.id}`,
              }}
            />
          ) : (
            <Alert>
              <AlertTitle className="text-body">
                No issued document
              </AlertTitle>
              <AlertDescription className="text-body">
                No issued document is available for this record.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
