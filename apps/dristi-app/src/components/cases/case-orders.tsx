"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  CircleAlertIcon,
  FileSearchIcon,
  FileTextIcon,
} from "lucide-react";

import { OrderRecordDialog } from "@/components/cases/order-record-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ORDERS_PAGE_SIZE,
  ORDERS_PAGE_SIZES,
  ORDER_KIND_DEFAULT,
  ORDER_KIND_FILTERS,
  isOrderKindFilter,
  isOrdersPageSize,
  orderPageWindow,
  ordersFile,
  selectOrders,
  type OrderKindFilter,
  type OrderRecord,
  type OrdersFile,
  type OrdersPageSize,
} from "@/lib/cases/orders";
import { formatCaseDate, type CaseRecord } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

const headClass =
  "h-10 border-b border-border px-4 py-3 text-caption font-medium text-muted-foreground";
const cellClass =
  "border-b border-border px-4 py-3 align-middle text-left text-body-compact";
/**
 * Issued orders and notifications for one case — one paged table, filtered
 * by kind. Make filings in the header stays the teal action (Laws).
 */
export function CaseOrders({ record }: { record: CaseRecord }) {
  const file = useMemo(() => {
    try {
      return ordersFile(record);
    } catch {
      return null;
    }
  }, [record]);

  if (!file) return <OrdersError />;
  return <OrdersReady file={file} />;
}

export function OrdersLoading() {
  return (
    // The action stands in for the two-item kind switch.
    <OrdersPanel busy action={<Skeleton className="h-10 w-52 max-w-full" />}>
      <span className="sr-only" role="status">
        Loading orders and notifications
      </span>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </OrdersPanel>
  );
}

function OrdersError() {
  return (
    <OrdersPanel>
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden />
        <AlertTitle className="text-body">
          Orders and Notifications could not be loaded
        </AlertTitle>
        <AlertDescription className="text-body">
          Refresh the page to try again.
        </AlertDescription>
      </Alert>
    </OrdersPanel>
  );
}

function OrdersReady({ file }: { file: OrdersFile }) {
  const [kind, setKind] = useState<OrderKindFilter>(ORDER_KIND_DEFAULT);
  const [pageSize, setPageSize] = useState<OrdersPageSize>(ORDERS_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [recordOpen, setRecordOpen] = useState<OrderRecord | null>(null);

  const selection = selectOrders({
    orders: file.orders,
    kind,
    pageSize,
    page,
  });

  // Kind always carries a value now, so "filtered" means moved off the
  // resting view.
  const filtered = kind !== ORDER_KIND_DEFAULT;

  function resetPage() {
    setPage(1);
  }

  function changeKind(next: OrderKindFilter) {
    setKind(next);
    resetPage();
  }

  function pageLink(nextPage: number) {
    return {
      href: "#",
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setPage(nextPage);
      },
    };
  }

  const listProps = {
    rows: selection.rows,
    onOpenRecord: setRecordOpen,
  };

  if (file.orders.length === 0) {
    return (
      <OrdersPanel>
        <OrdersEmpty
          icon={FileTextIcon}
          title="No orders or notifications recorded"
          description="No orders or notifications have been recorded for this case."
        />
      </OrdersPanel>
    );
  }

  return (
    <>
      <OrdersPanel action={<KindFilter value={kind} onChange={changeKind} />}>
        {selection.total === 0 ? (
          <OrdersEmpty
            icon={FileSearchIcon}
            title="No records matching filters"
            description="No orders or notifications match the selected filters."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" aria-live="polite">
                {matchingCountLabel(selection.total, filtered)}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <div className="hidden md:block">
                <OrdersTable {...listProps} />
              </div>
              <div className="p-4 md:hidden">
                <OrdersItemList {...listProps} />
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                {selection.pageCount > 1 ? (
                  <p className="text-body-compact text-muted-foreground">
                    Showing {selection.from}–{selection.to}
                  </p>
                ) : null}
                <OrdersPageSizeSelect
                  value={pageSize}
                  onChange={(size) => {
                    setPageSize(size);
                    resetPage();
                  }}
                />
              </div>
              {selection.pageCount > 1 ? (
                <Pagination className="mx-0 w-auto justify-start md:justify-end">
                  <PaginationContent>
                    {selection.page > 1 ? (
                      <PaginationItem>
                        <PaginationPrevious {...pageLink(selection.page - 1)} />
                      </PaginationItem>
                    ) : null}
                    {orderPageWindow(selection.page, selection.pageCount).map(
                      (entry, index) => (
                        <PaginationItem key={`${entry}-${index}`}>
                          {entry === "gap" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              {...pageLink(entry)}
                              isActive={entry === selection.page}
                              aria-label={`Go to page ${entry}`}
                            >
                              {entry}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      )
                    )}
                    {selection.page < selection.pageCount ? (
                      <PaginationItem>
                        <PaginationNext {...pageLink(selection.page + 1)} />
                      </PaginationItem>
                    ) : null}
                  </PaginationContent>
                </Pagination>
              ) : null}
            </div>
          </div>
        )}
      </OrdersPanel>
      <OrderRecordDialog order={recordOpen} onOpenChange={setRecordOpen} />
    </>
  );
}

function matchingCountLabel(total: number, filtered: boolean): string {
  const noun = total === 1 ? "record" : "records";
  if (!filtered) return `${total} ${noun}`;
  return total === 1
    ? "1 record matches the filters"
    : `${total} records match the filters`;
}

/**
 * One bounded orders region. Hover fill is cancelled — this panel is
 * not the action (Laws; same resting Card as Applications).
 */
function OrdersPanel({
  children,
  action,
  busy = false,
}: {
  children: ReactNode;
  action?: ReactNode;
  busy?: boolean;
}) {
  return (
    <section className="min-w-0" aria-busy={busy || undefined}>
      <Card className="hover:bg-card">
        {/* The kind switch is the only control here, so it rides the title
            row and the header rule replaces the old filter bar. */}
        <CardHeader className="flex flex-col gap-3 border-b md:flex-row md:items-center md:justify-between">
          <h2 className="text-title-s font-semibold">
            Orders and Notifications
          </h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">{children}</CardContent>
      </Card>
    </section>
  );
}

function OrdersPageSizeSelect({
  value,
  onChange,
}: {
  value: OrdersPageSize;
  onChange: (pageSize: OrdersPageSize) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="orders-page-size"
        className="text-body-compact font-normal text-muted-foreground"
      >
        Per page
      </Label>
      <Select
        value={String(value)}
        onValueChange={(next) => {
          const size = Number.parseInt(next, 10);
          if (isOrdersPageSize(size)) onChange(size);
        }}
      >
        <SelectTrigger id="orders-page-size" className="text-body">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDERS_PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Orders are passed by the court; notifications are court communications
 * about listings. The card title says what this switches, so the group
 * carries its own name instead of a visible "Show" label.
 */
function KindFilter({
  value,
  onChange,
}: {
  value: OrderKindFilter;
  onChange: (value: OrderKindFilter) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (isOrderKindFilter(next)) onChange(next);
      }}
      className="shrink-0"
      aria-label="Show orders or notifications"
    >
      {ORDER_KIND_FILTERS.map((item) => (
        <ToggleGroupItem
          key={item.id}
          value={item.id}
          className="h-10 px-3 text-body"
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

type OrdersListProps = {
  rows: OrderRecord[];
  onOpenRecord: (order: OrderRecord) => void;
};

function OrdersTable({ rows, onOpenRecord }: OrdersListProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Orders and Notifications</TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Date
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48")}>Title</TableHead>
          <TableHead className={cn(headClass, "min-w-64")}>BoTD</TableHead>
          <TableHead className={cn(headClass, "w-32")}>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((order) => (
          <TableRow key={order.id}>
            <TableCell className={cn(cellClass, "whitespace-nowrap")}>
              {formatCaseDate(order.issuedOn)}
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-48 whitespace-normal")}>
              {order.title}
            </TableCell>
            {/*
              Business of the day is the supporting read, not the scan
              column — it wraps and clamps rather than truncating, so a long
              summary never sets the column width.
            */}
            <TableCell
              className={cn(
                cellClass,
                "min-w-64 whitespace-normal text-muted-foreground"
              )}
            >
              {order.botd ? (
                <span className="line-clamp-2">{order.botd}</span>
              ) : (
                <>
                  <span aria-hidden>—</span>
                  <span className="sr-only">No BoTD recorded</span>
                </>
              )}
            </TableCell>
            <TableCell className={cellClass}>
              <Button
                type="button"
                variant="outline"
                aria-label={`Open ${order.title}`}
                onClick={() => onOpenRecord(order)}
              >
                Open
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrdersItemList({ rows, onOpenRecord }: OrdersListProps) {
  return (
    <ItemGroup className="flex flex-col gap-3">
      {rows.map((order) => (
        <Item
          key={order.id}
          variant="outline"
          role="listitem"
          className="h-full items-start gap-3 p-4"
        >
          <ItemContent className="min-w-0 flex-1 gap-2 text-left">
            <ItemTitle className="line-clamp-none text-body font-medium text-foreground">
              {order.title}
            </ItemTitle>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-body-compact text-muted-foreground">
                {formatCaseDate(order.issuedOn)}
              </p>
            </div>
            {/*
              Stacked, the business of the day gets its own line — two lines
              of prose do not belong on the date row.
            */}
            {order.botd ? (
              <p className="line-clamp-2 text-body-compact text-muted-foreground">
                {order.botd}
              </p>
            ) : null}
          </ItemContent>
          <ItemActions>
            <Button
              type="button"
              variant="outline"
              aria-label={`Open ${order.title}`}
              onClick={() => onOpenRecord(order)}
            >
              Open
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

function OrdersEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileTextIcon;
  title: string;
  description?: string;
}) {
  return (
    <Empty className="border border-dashed border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="text-body">{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  );
}
