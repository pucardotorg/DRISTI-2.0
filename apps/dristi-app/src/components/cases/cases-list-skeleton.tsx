import { Skeleton } from "@/components/ui/skeleton";

/** Folder and search list pages share this chrome while rows load. */
export function CasesListSkeleton() {
  return (
    <main className="flex flex-col gap-8 p-6 md:p-8" aria-busy>
      <span className="sr-only" role="status">
        Loading cases
      </span>

      <Skeleton className="h-10 w-36" />

      <header className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex w-full max-w-lg flex-col gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-28 shrink-0 rounded-lg" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="hidden h-5 w-1/4 md:block" />
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="ml-auto h-5 w-8" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
