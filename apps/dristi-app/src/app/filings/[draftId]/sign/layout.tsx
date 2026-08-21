import { FilingShell } from "@/components/filing/filing-shell";

/**
 * Sign keeps the Sections rail. It is a step of the filing like any other, and the screen
 * that dropped the rail was the one screen you could not navigate out of by the means the
 * rest of the flow taught you (owner, 2026-08-18).
 */
export default function FilingSignLayout({ children }: { children: React.ReactNode }) {
  return <FilingShell>{children}</FilingShell>;
}
