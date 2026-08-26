/**
 * Cases keeps view state in the URL so a scoped list can be shared, bookmarked
 * and reloaded. Sort is a silent default by view, not a URL param.
 *
 * Two routes: `/cases` is the landing (list by default; folders are a local
 * preference); `/cases/folders/[bucket]` is the cases in that folder. Search
 * with no folder stays on `/cases`.
 */
import { CASES } from "./fixtures";
import {
  ACTIVE_STAGES,
  DISPOSED_OUTCOMES,
  allCounselNames,
  bucketLabel,
  outcomeLabel,
  partiesLabel,
  stageLabel,
  type BucketKey,
  type CaseRecord,
  type CasesView,
} from "./types";

export const PAGE_SIZES = [10, 15, 20, 25, 30] as const;
export type CasesPageSize = (typeof PAGE_SIZES)[number];
/** Default rows on a list page. Other sizes are a URL `size` param. */
export const PAGE_SIZE: CasesPageSize = 10;

export function isCasesPageSize(value: number): value is CasesPageSize {
  return (PAGE_SIZES as readonly number[]).includes(value);
}

export type FiledPeriod = "30d" | "6m" | "1y" | "older";

export const FILED_PERIODS: { value: FiledPeriod; label: string }[] = [
  { value: "30d", label: "In the last 30 days" },
  { value: "6m", label: "In the last 6 months" },
  { value: "1y", label: "In the last year" },
  { value: "older", label: "More than a year ago" },
];

/** Review-only switch for states that need a backend to occur naturally. */
export type CasesDemoState = "empty" | "error";

export type CasesQuery = {
  view: CasesView;
  /** The opened folder. `null` is the Cases landing. */
  bucket: BucketKey | null;
  search: string;
  filed: FiledPeriod | null;
  /**
   * In-list stage/outcome filter (Excel-style on the Stage column).
   * Empty is every stage. Folders already *are* that selection, so this
   * is landing-only — a folder URL drops it. Repeated `stage` params.
   */
  stage: BucketKey[];
  pageSize: CasesPageSize;
  page: number;
  demo: CasesDemoState | null;
};

const STAGE_KEYS = ACTIVE_STAGES.map((stage) => stage.value);
const OUTCOME_KEYS = DISPOSED_OUTCOMES.map((outcome) => outcome.value);

/**
 * Which folders a view folds into. Bookmarked spans both statuses, so it carries
 * the stages plus a `disposed` folder; Disposed folds by outcome because a
 * disposed case has an outcome, not a stage.
 */
export function bucketKeysFor(view: CasesView): BucketKey[] {
  if (view === "disposed") return [...OUTCOME_KEYS];
  if (view === "bookmarked") return [...STAGE_KEYS, "disposed"];
  return [...STAGE_KEYS];
}

/** Label for the "leave this folder" action. */
export function allBucketsLabel(view: CasesView): string {
  return view === "disposed" ? "All outcomes" : "All stages";
}

/**
 * Drop keys the current view does not fold into. Selecting every option
 * is the same as no filter, so that collapses to `[]`.
 */
export function normalizeStageFilter(
  view: CasesView,
  stages: readonly string[]
): BucketKey[] {
  const allowed = bucketKeysFor(view);
  const unique: BucketKey[] = [];
  for (const stage of stages) {
    if (
      allowed.includes(stage as BucketKey) &&
      !unique.includes(stage as BucketKey)
    ) {
      unique.push(stage as BucketKey);
    }
  }
  if (unique.length === allowed.length) return [];
  return unique;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Repeated params, not a comma-joined string: a stage key never carries a
 * comma of its own, but splitting a free-text value on one would shred it.
 */
function multi(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map((entry) => entry?.trim() ?? "").filter(Boolean);
}

export function parseCasesQuery(
  params: RawParams,
  path?: { bucket?: string }
): CasesQuery {
  const raw = first(params.view);
  const view: CasesView =
    raw === "long-pending" || raw === "disposed" || raw === "bookmarked"
      ? raw
      : "ongoing";

  /** A bucket is only valid for the view that folds into it — an outcome key
   *  under Ongoing is a stale or hand-edited URL, so fall back to the grid.
   *  Path wins over a leftover `?bucket=` from older links. */
  const candidate = (path?.bucket ?? first(params.bucket)) as BucketKey;
  const bucket = bucketKeysFor(view).includes(candidate) ? candidate : null;

  const page = Number.parseInt(first(params.page), 10);
  const size = Number.parseInt(first(params.size), 10);
  const filed = first(params.filed) as FiledPeriod;
  const demo = first(params.demo) as CasesDemoState;

  return {
    view,
    bucket,
    search: first(params.q),
    filed: FILED_PERIODS.some((period) => period.value === filed) ? filed : null,
    /** A folder *is* the stage selection — don't stack a second one. */
    stage: bucket ? [] : normalizeStageFilter(view, multi(params.stage)),
    pageSize: isCasesPageSize(size) ? size : PAGE_SIZE,
    page: Number.isFinite(page) && page > 1 ? page : 1,
    demo: demo === "empty" || demo === "error" ? demo : null,
  };
}

/**
 * Serialise a query back to a URL, dropping defaults so the landing stays a
 * plain `/cases`. Any patch other than `page` sends the reader back to page 1.
 */
export function buildCasesHref(
  query: CasesQuery,
  patch: Partial<CasesQuery> = {}
): string {
  const next: CasesQuery = { ...query, ...patch };
  if (!("page" in patch)) next.page = 1;

  /** Switching view returns to that view's landing — a stage carried over
   *  from Ongoing means nothing under Disposed. */
  if (patch.view && patch.view !== query.view) {
    next.page = 1;
    if (!("bucket" in patch)) next.bucket = null;
  }
  if (next.bucket && !bucketKeysFor(next.view).includes(next.bucket)) {
    next.bucket = null;
  }
  if (next.bucket) next.stage = [];
  next.stage = normalizeStageFilter(next.view, next.stage);

  const params = new URLSearchParams();
  if (next.view !== "ongoing") params.set("view", next.view);
  if (next.search) params.set("q", next.search);
  if (next.filed) params.set("filed", next.filed);
  for (const stage of next.stage) params.append("stage", stage);
  if (next.pageSize !== PAGE_SIZE) params.set("size", String(next.pageSize));
  if (next.page > 1) params.set("page", String(next.page));
  if (next.demo) params.set("demo", next.demo);

  const search = params.toString();
  const qs = search ? `?${search}` : "";

  if (next.bucket) return `/cases/folders/${next.bucket}${qs}`;
  return `/cases${qs}`;
}

function matchesSearch(record: CaseRecord, search: string): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  const haystack = [
    record.caseNumber,
    partiesLabel(record),
    allCounselNames(record),
    record.court,
    record.disposal ? outcomeLabel(record.disposal.outcome) : stageLabel(record.stage),
    record.substage ?? "",
    record.nextHearing?.purpose ?? "",
    record.latestUpdate,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function matchesFiled(record: CaseRecord, filed: FiledPeriod | null, now: number) {
  if (!filed) return true;
  const day = 24 * 60 * 60 * 1000;
  const age = now - new Date(record.filedOn).getTime();
  if (filed === "30d") return age <= 30 * day;
  if (filed === "6m") return age <= 183 * day;
  if (filed === "1y") return age <= 365 * day;
  return age > 365 * day;
}

/** Leftover `filed` URL param — also scopes folders. */
export function applySheetFilters(
  source: CaseRecord[],
  query: Pick<CasesQuery, "filed">,
  now: number
): CaseRecord[] {
  return source.filter((record) => {
    if (!matchesFiled(record, query.filed, now)) return false;
    return true;
  });
}

/** The set a view describes, before any folder, filter or search narrows it. */
function inView(
  record: CaseRecord,
  view: CasesView,
  bookmarks: ReadonlySet<string>
): boolean {
  if (view === "disposed") return Boolean(record.disposal);
  if (view === "long-pending") return !record.disposal && record.longPending;
  /** A bookmark outlives disposal, so this view alone spans both statuses. */
  if (view === "bookmarked") return bookmarks.has(record.id);
  return !record.disposal && !record.longPending;
}

/** True when a record belongs in the opened folder. */
function inBucket(record: CaseRecord, bucket: BucketKey): boolean {
  if (bucket === "disposed") return Boolean(record.disposal);
  if (record.disposal) return record.disposal.outcome === bucket;
  return record.stage === bucket;
}

/**
 * Silent default order — recently disposed first for a closed case, recently
 * updated first for a live one. Bookmarked mixes both, so the test is per record
 * rather than per view.
 */
function compare(a: CaseRecord, b: CaseRecord): number {
  if (a.disposal && b.disposal) {
    return b.disposal.on.localeCompare(a.disposal.on);
  }
  if (a.disposal) return 1;
  if (b.disposal) return -1;
  return b.updatedOn.localeCompare(a.updatedOn);
}

export type CasesSelection = {
  /** Rows for the current page. */
  rows: CaseRecord[];
  total: number;
  page: number;
  pageCount: number;
  from: number;
  to: number;
};

export function selectCases(options: {
  query: CasesQuery;
  bookmarks: ReadonlySet<string>;
  now: number;
  source?: CaseRecord[];
}): CasesSelection {
  const { query, bookmarks, now } = options;
  const source = options.source ?? CASES;

  const matched = source.filter((record) => {
    if (!inView(record, query.view, bookmarks)) return false;
    if (query.bucket && !inBucket(record, query.bucket)) return false;
    if (!matchesSearch(record, query.search)) return false;
    if (!matchesFiled(record, query.filed, now)) return false;
    if (
      query.stage.length > 0 &&
      !query.stage.some((key) => inBucket(record, key))
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...matched].sort(compare);
  const pageSize = query.pageSize;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  return {
    rows,
    total: sorted.length,
    page,
    pageCount,
    from: sorted.length === 0 ? 0 : start + 1,
    to: start + rows.length,
  };
}

export type CasesBucket = {
  key: BucketKey;
  label: string;
  count: number;
};

/**
 * The folder grid. Every bucket the view folds into is returned, including
 * empty ones — a stable spatial map is worth more than a tidy grid, and it
 * stops folders moving under the reader as counts change or a state deployment
 * runs a different mix of stages.
 */
export function summariseBuckets(
  view: CasesView,
  source: CaseRecord[] = CASES,
  bookmarks: ReadonlySet<string> = new Set(initialBookmarks(source))
): CasesBucket[] {
  const scoped = source.filter((record) => inView(record, view, bookmarks));

  return bucketKeysFor(view).map((key) => ({
    key,
    label: bucketLabel(key),
    count: scoped.filter((record) => inBucket(record, key)).length,
  }));
}

/** Tab counts — the whole book per view, not the filtered page. */
export function summariseCases(
  source: CaseRecord[] = CASES,
  bookmarks: ReadonlySet<string> = new Set(initialBookmarks(source))
): Record<CasesView, number> {
  return {
    ongoing: source.filter((record) => inView(record, "ongoing", bookmarks)).length,
    "long-pending": source.filter((record) =>
      inView(record, "long-pending", bookmarks)
    ).length,
    disposed: source.filter((record) => inView(record, "disposed", bookmarks))
      .length,
    bookmarked: source.filter((record) =>
      inView(record, "bookmarked", bookmarks)
    ).length,
  };
}

export function initialBookmarks(source: CaseRecord[] = CASES): string[] {
  return source.filter((record) => record.bookmarked).map((record) => record.id);
}
