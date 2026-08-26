import { Skeleton } from "@/components/ui/skeleton";

/**
 * Chrome stays, rows are placeholders — the page must not jump when data
 * lands. The default landing is the case list, so that is what this mirrors.
 */
export function CasesSkeleton() {
  return (
    <main className="flex flex-col gap-8 p-6 md:p-8" aria-busy>
      <span className="sr-only" role="status">
        Loading cases
      </span>

      <header className="flex flex-col gap-2">
        <h1 className="text-title-l font-semibold">Cases</h1>
        <Skeleton className="h-5 w-full max-w-xl" />
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="flex w-full min-w-0 max-w-md flex-col gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full max-w-xl lg:w-96 lg:max-w-none" />
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-28" />
            <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
              <Skeleton className="h-10 w-40 rounded-lg" />
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
                <Skeleton className="h-10 w-20 shrink-0 rounded-lg" />
                <Skeleton className="h-10 w-28 shrink-0 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border-b border-border py-3 last:border-b-0"
              >
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="hidden h-5 w-1/4 md:block" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="ml-auto h-5 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
