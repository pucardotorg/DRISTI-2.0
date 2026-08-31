import { ChromeShell, ChromeTopBar } from "@/components/chrome/app-chrome";
import { EmployeeNav } from "@/components/employee/employee-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CURRENT_STAFF, roleLabel } from "@/lib/employee/content";

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
 * Three regions, layered the DS way: the charcoal rail down the left, a `bg-card` bar
 * across the column beside it, and the white page under both. The mark sits at the head
 * of the rail, where the page origin is, rather than in the bar — which is why the bar
 * carries only what the rail cannot: which bench you are sitting on.
 *
 * There is no sign-in in front of this: `/employee` is the entry point, and the identity
 * comes from `CURRENT_STAFF` until authentication lands.
 */
export function EmployeeArea({ children }: { children: React.ReactNode }) {
  return (
    <ChromeShell rail={<EmployeeNav />} topBar={<EmployeeTopBar />}>
      <main className="min-w-0 flex-1">{children}</main>
    </ChromeShell>
  );
}

/**
 * The court's bar: the way back into the rail, and the bench you are sitting on.
 *
 * Nothing else. The advocate's bar carries a breadcrumb, a language switch, a
 * notifications bell and a profile menu; none of those are the bench's, and the frame
 * lets an area simply not pass them rather than switch on who is rendering.
 */
function EmployeeTopBar() {
  return (
    <ChromeTopBar
      leading={
        // The only way into the rail once it is off-canvas, so it leads the bar rather
        // than hiding at the far end. Sized to the 40×40 touch floor.
        <SidebarTrigger
          aria-label="Open court navigation"
          className="size-10 shrink-0 text-muted-foreground md:hidden [&_svg]:size-5"
        />
      }
    >
      <Separator
        orientation="vertical"
        className="h-5! shrink-0 self-center! bg-hairline md:hidden"
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body-compact font-medium">
          {CURRENT_STAFF.court}
        </span>
        <span className="truncate text-caption text-muted-foreground">
          {roleLabel(CURRENT_STAFF.role)}
        </span>
      </div>
    </ChromeTopBar>
  );
}
