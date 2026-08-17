import { FilingShell } from "@/components/filing/filing-shell";

/** Form sections share the Sections rail. */
export default function FilingFormLayout({ children }: { children: React.ReactNode }) {
  return <FilingShell>{children}</FilingShell>;
}
