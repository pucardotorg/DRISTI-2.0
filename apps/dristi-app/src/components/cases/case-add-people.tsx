"use client";

/**
 * The universal Add-people entry on the Parties tab — the PM's call (Sept 1):
 * ONE button for every case-related addition, instead of a scattered entry
 * point per application type. What differs per kind of person is the nature
 * of the act, and each flow states its own — advocate = system action on a
 * vakalatnama, witness and PoA-holder = applications to the magistrate.
 *
 * Shaped as a menu that names the task it opens, for the same reason the old
 * single-item "Case actions" control was: a plain "Add people" button with a
 * plus promised one add and delivered a choice. The menu closes and restores
 * focus to its trigger, then the chosen dialog opens and traps focus; closing
 * the dialog hands focus back to the same trigger.
 *
 * Deliberately NOT merged with Share access: sharing grants office access
 * (instant, no legal standing); this changes who is formally on the case.
 * Two doors, each labelled, cross-referencing the other.
 */

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddAdvocateDialog } from "@/components/cases/add-advocate-dialog";
import { AddPoaDialog } from "@/components/cases/add-poa-dialog";
import { AddWitnessDialog } from "@/components/cases/add-witness-form";
import type { PartyOption } from "@/lib/cases/party-actions";

type OpenDialog = "advocate" | "witness" | "poa" | null;

export function CaseAddPeople({
  litigants,
  casePeople,
}: {
  litigants: PartyOption[];
  /** Everyone attached to the case — the PoA flow's takeover pool. */
  casePeople: { key: string; name: string; detail: string }[];
}) {
  const [dialog, setDialog] = useState<OpenDialog>(null);

  function closerFor(name: Exclude<OpenDialog, null>) {
    return (open: boolean) => setDialog(open ? name : null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" className="w-full shrink-0 sm:w-auto">
            Add people
            <ChevronDownIcon data-icon="inline-end" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        {/* Wide enough that no task name wraps — a menu item is a label,
            not a paragraph. */}
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuItem onSelect={() => setDialog("advocate")}>
            Add an advocate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("witness")}>
            Add a witness
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("poa")}>
            Add a Power of Attorney holder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddAdvocateDialog
        open={dialog === "advocate"}
        onOpenChange={closerFor("advocate")}
        litigants={litigants}
      />
      <AddWitnessDialog
        open={dialog === "witness"}
        onOpenChange={closerFor("witness")}
      />
      <AddPoaDialog
        open={dialog === "poa"}
        onOpenChange={closerFor("poa")}
        litigants={litigants}
        casePeople={casePeople}
      />
    </>
  );
}
