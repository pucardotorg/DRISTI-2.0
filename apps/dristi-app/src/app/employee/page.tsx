import type { Metadata } from "next";
import { GavelIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = { title: "Court home" };

/**
 * The court-staff home — the screen everything on the court side grows from.
 *
 * It is a placeholder on purpose. The first court-side surface is the magistrate's
 * dashboard, and what belongs on a bench's home is that dashboard's decision to make; a
 * stand-in board of invented counts would be a harder thing to delete than an empty state
 * that says what is coming. The chrome around it (`EmployeeArea`) is real: it names the
 * court and the role the person signed in as.
 */
export default function EmployeeHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Court home
        </h1>
        <p className="text-body text-muted-foreground">
          Everything this court does on a cheque-dishonour case starts here.
        </p>
      </div>

      <Card className="border-hairline shadow-raised">
        <CardContent>
          <Empty className="px-0 py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GavelIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle className="text-body font-semibold">
                Nothing on the board yet
              </EmptyTitle>
              <EmptyDescription className="text-body-compact">
                This is the court-staff home. The court-side dashboard is built on
                this screen.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
