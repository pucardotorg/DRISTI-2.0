/**
 * Inventory of everything in this app that the design system does not own, measured
 * against `vendor/pucar-design-system` on the merge of scrutiny + case-access-management.
 *
 * This is a decision surface, not product UI: the owner reads it, picks what gets
 * promoted upstream, and the page is deleted once the DS push lands.
 */

export type Verdict = "promote" | "merge" | "delete" | "decide";

export type OrphanPrimitive = {
  file: string;
  origin: string;
  usedBy: string[];
  why: string;
  verdict: Verdict;
};

export type DivergedPrimitive = {
  file: string;
  diffLines: number;
  extraProps: string[];
  origin: string;
  usedBy: string[];
  why: string;
  verdict: Verdict;
};

export type DuplicatePair = {
  id: string;
  role: string;
  a: { file: string; lines: number; origin: string };
  b: { file: string; lines: number; origin: string };
  diffLines: number;
  note: string;
  verdict: Verdict;
  liveAt?: string;
};

/** Primitives in `components/ui/` with no counterpart in the DS registry. */
export const ORPHANS: OrphanPrimitive[] = [
  {
    file: "ui/compact-segmented-control.tsx",
    origin: "case-access-management",
    usedBy: ["sign-in-block.tsx", "home/app-shell.tsx"],
    why:
      "Solves a real accessibility problem the DS ToggleGroup does not: `size=\"sm\"` exposes a 28px target, below the 40px touch floor. This keeps every Radix item 40px tall while the visible well is 32px and the pill 26px.",
    verdict: "promote",
  },
  {
    file: "ui/vertical-stepper.tsx",
    origin: "case-access-management",
    usedBy: [],
    why:
      "Nothing imports it. Written alongside the registration flow, then superseded by the horizontal DS Stepper.",
    verdict: "delete",
  },
];

/** Primitives that exist in the DS but were edited in-app, so `check:ui-sync` fails. */
export const DIVERGED: DivergedPrimitive[] = [
  {
    file: "ui/document-slot.tsx",
    diffLines: 48,
    extraProps: ["copy", "disabled", "quality"],
    origin: "case-access-management",
    usedBy: [
      "registration/registration-flow.tsx",
      "home/add-id-dialog.tsx",
      "home/profile-settings.tsx",
      "join/join-case-dialog.tsx",
      "advocate/join-case-dialog.tsx",
    ],
    why:
      "`copy` overrides the slot's built-in strings per context; `quality` surfaces an OCR legibility verdict; `disabled` locks the slot while a scan runs. Five call sites depend on all three.",
    verdict: "promote",
  },
  {
    file: "ui/stepper.tsx",
    diffLines: 108,
    extraProps: ["onActivate", "activateLabel"],
    origin: "case-access-management",
    usedBy: ["registration/registration-flow.tsx", "onboarding/onboarding-modal.tsx"],
    why:
      "Makes a completed step clickable so the user can go back. The DS Stepper is display-only, so today's registration flow cannot offer back-navigation without this fork.",
    verdict: "decide",
  },
];

/**
 * The same job implemented more than once. `diffLines` counts changed lines between the
 * two files — 0 means byte-identical.
 */
export const DUPLICATES: DuplicatePair[] = [
  {
    id: "app-shell",
    role: "App shell — sidebar + chrome + content frame",
    a: { file: "shell/app-shell.tsx", lines: 76, origin: "scrutiny" },
    b: { file: "home/app-shell.tsx", lines: 467, origin: "case-access-management" },
    diffLines: 505,
    note:
      "Three implementations, not two — `filing/app-shell.tsx` (107 L) is a third. The 467-line version carries the side nav with the Make a Filing entry point.",
    verdict: "decide",
    liveAt: "/home",
  },
  {
    id: "app-shell-filing",
    role: "App shell — the filing flow's own copy",
    a: { file: "filing/app-shell.tsx", lines: 107, origin: "scrutiny" },
    b: { file: "shell/app-shell.tsx", lines: 76, origin: "scrutiny" },
    diffLines: 89,
    note: "Both came from the same branch — this pair is self-inflicted drift, not a merge artifact.",
    verdict: "merge",
    liveAt: "/filings",
  },
  {
    id: "app-sidebar",
    role: "Sidebar navigation",
    a: { file: "filing/app-sidebar.tsx", lines: 144, origin: "scrutiny" },
    b: { file: "shell/app-sidebar.tsx", lines: 167, origin: "scrutiny" },
    diffLines: 51,
    note: "A third sidebar sits unmerged in advocate-home-v3 (`home/app-sidebar.tsx`).",
    verdict: "merge",
    liveAt: "/filings",
  },
  {
    id: "top-bar",
    role: "Top bar",
    a: { file: "filing/filing-top-bar.tsx", lines: 187, origin: "scrutiny" },
    b: { file: "shell/top-bar.tsx", lines: 188, origin: "scrutiny" },
    diffLines: 189,
    note:
      "Near-identical length, almost entirely different content — the most expensive kind of duplicate to leave alone. A third top bar (`home/top-header.tsx`) is in advocate-home-v3.",
    verdict: "decide",
    liveAt: "/tasks",
  },
  {
    id: "chrome",
    role: "Page chrome wrapper",
    a: { file: "filing/chrome.tsx", lines: 52, origin: "scrutiny" },
    b: { file: "shell/chrome.tsx", lines: 46, origin: "scrutiny" },
    diffLines: 56,
    verdict: "merge",
    note: "Same role, diverged after the filing flow forked its own copy.",
  },
  {
    id: "confirm-dialog",
    role: "Confirm dialog",
    a: { file: "filing/confirm-dialog.tsx", lines: 60, origin: "scrutiny" },
    b: { file: "shell/confirm-dialog.tsx", lines: 60, origin: "scrutiny" },
    diffLines: 0,
    note: "Byte-identical. Deleting one and re-pointing its imports is a no-risk change.",
    verdict: "merge",
  },
  {
    id: "notices",
    role: "Section notice + info well",
    a: { file: "filing/notices.tsx", lines: 149, origin: "scrutiny" },
    b: { file: "shell/notices.tsx", lines: 149, origin: "scrutiny" },
    diffLines: 2,
    note: "Two lines apart. Effectively a copy-paste that drifted.",
    verdict: "merge",
  },
  {
    id: "segmented",
    role: "Segmented control",
    a: { file: "filing/segmented.tsx", lines: 104, origin: "scrutiny" },
    b: { file: "ui/compact-segmented-control.tsx", lines: 68, origin: "case-access-management" },
    diffLines: 140,
    note:
      "Same control, two authors, two touch-target answers. Rendered live below — this is the clearest case for a single DS component with a size variant.",
    verdict: "promote",
  },
  {
    id: "join-case-dialog",
    role: "Join a case dialog",
    a: { file: "advocate/join-case-dialog.tsx", lines: 1466, origin: "case-access-management" },
    b: { file: "join/join-case-dialog.tsx", lines: 773, origin: "case-access-management" },
    diffLines: 1527,
    note:
      "Both on the same branch. 2,239 lines total for one job — the largest single block of duplication in the merged tree.",
    verdict: "decide",
    liveAt: "/join",
  },
  {
    id: "advocate-home",
    role: "Advocate home screen",
    a: { file: "advocate/advocate-home.tsx", lines: 152, origin: "case-access-management" },
    b: { file: "home/advocate-home.tsx", lines: 0, origin: "advocate-home-v3 (not merged)" },
    diffLines: 0,
    note:
      "Your v3 home is still on its own branch and is the design of record. His version occupies the /advocate route today. This is a replacement, not a merge.",
    verdict: "decide",
    liveAt: "/advocate",
  },
];

/** App-level tokens in `globals.css` that the DS does not define. */
export const TOKEN_CANDIDATES = [
  {
    name: "--brand-canvas",
    value: "#0f544c",
    note: "Deep-teal plate behind sign-in and marketing panels. Deliberately identical in dark mode.",
  },
  { name: "--brand-canvas-deep", value: "#05221f", note: "Gradient's far stop, below dark brand-1." },
  { name: "--brand-canvas-foreground", value: "#ffffff", note: "Ink on the plate." },
  {
    name: "--brand-canvas-muted-foreground",
    value: "#a7d9d0",
    note: "Support copy on the plate. The only pair that reads correctly on the tint.",
  },
];

export const VERDICT_LABEL: Record<Verdict, string> = {
  promote: "Promote to DS",
  merge: "Merge in app",
  delete: "Delete",
  decide: "Needs your call",
};
