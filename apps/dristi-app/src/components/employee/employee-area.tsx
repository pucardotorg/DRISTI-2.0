import { ChromeShell } from "@/components/chrome/app-chrome";
import { EmployeeNav } from "@/components/employee/employee-nav";
import { EmployeeTopBar } from "@/components/employee/employee-top-bar";

/**
 * The court-staff area wrapper.
 *
 * Court staff do not get the citizen `AppShell` — the rail there is the advocate's product
 * (pending tasks, filings, join a case) and none of it is the bench's. What the two halves
 * of the app *do* share is their chrome, and that now lives in one place:
 * `components/chrome` owns the frame — rail plate, row metrics, bar height, seams — and
 * each area pours its own content into it. `/employee` consumes it here; the advocate's
 * shell migrates onto the same frame next.
 *
 * Two regions, layered the DS way: the charcoal rail down the left, and the white page
 * beside it. The mark sits at the head of the rail, where the page origin is, and the bar
 * runs across the page at every width — see `EmployeeTopBar` for what it carries and what
 * it deliberately does not.
 *
 * `main` is a flex column so a screen that wants to pin a footer (the order composer)
 * can fill the remaining height. Screens that don't opt in still start at the top.
 *
 * There is no sign-in in front of this: `/employee` is the entry point.
 */
export function EmployeeArea({ children }: { children: React.ReactNode }) {
  return (
    /* The rail folds to a 4rem strip. The prop is the shell's rather than the rail's
       because the page column's overlays measure their left edge from it too, and one of
       them is portalled out of this tree — see `ChromeShell`. */
    <ChromeShell
      rail={<EmployeeNav />}
      topBar={<EmployeeTopBar />}
      railCollapsible="icon"
    >
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
    </ChromeShell>
  );
}
