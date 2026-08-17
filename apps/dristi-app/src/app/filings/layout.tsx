import type { Metadata } from "next";

import { ProfileProvider } from "@/lib/filing/profile";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FilingTopBar } from "@/components/filing/filing-top-bar";

export const metadata: Metadata = {
  title: "Filings",
};

/** Filings area: the product header on top, screens below. */
export default function FilingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <TooltipProvider>
        <div className="flex min-h-full flex-1 flex-col bg-background">
          <FilingTopBar />
          {children}
        </div>
      </TooltipProvider>
    </ProfileProvider>
  );
}
