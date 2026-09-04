import { ChromeShell, ChromeTopBar } from "@/components/chrome/app-chrome";
import { EmployeeNav } from "@/components/employee/employee-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
 * beside it. The mark sits at the head of the rail, where the page origin is. The bar
 * exists only below `md`, as the way back into the rail once it is off-canvas.
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

/**
 * The court's bar: the way back into the rail, and only on phone widths.
 *
 * Nothing else. The advocate's bar carries a breadcrumb, a language switch, a
 * notifications bell and a profile menu; none of those are the bench's, and the frame
 * lets an area simply not pass them rather than switch on who is rendering. On desktop
 * the rail is already on screen, so this bar hides rather than sit empty.
 */
function EmployeeTopBar() {
  return (
    <ChromeTopBar className="md:hidden">
      {/* The only way into the rail once it is off-canvas. Sized to the 40×40 touch floor. */}
      <SidebarTrigger
        aria-label="Open court navigation"
        /* The guarded selector, not the plain `[&_svg]:size-5`: `Button` declares its own
           `[&_svg:not([class*='size-'])]:size-4`, which tailwind-merge treats as a
           different key and leaves in place — and it then out-specifies the plain form
           and holds the panel icon at 16px inside a 40px square. Matching the key is what
           makes the override an override. Full reasoning at `RAIL_ICON_BUTTON`. */
        className="size-10 shrink-0 text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
      />
    </ChromeTopBar>
  );
}
