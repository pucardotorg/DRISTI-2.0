"use client";

import * as React from "react";
import { UserRoundPenIcon } from "lucide-react";

import { useOptionalProfile } from "@/lib/filing/profile";
import { Button } from "@/components/ui/button";
import { ProfileDialog } from "@/components/filing/profile-dialog";

/**
 * "Your details" — the name, mobile and Bar number a filing is drafted under.
 *
 * It used to be the only item in an account menu that the filings area kept in a top bar
 * of its own. There is one account control in this product, at the foot of the rail, so
 * this is where the item belongs — and it appears only where there is a filing profile
 * to edit, which is what `useOptionalProfile` is for.
 */
export function YourDetailsItem() {
  const profile = useOptionalProfile();
  const [open, setOpen] = React.useState(false);
  if (!profile) return null;

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start font-normal"
        onClick={() => setOpen(true)}
      >
        <UserRoundPenIcon aria-hidden />
        <span className="flex-1 text-left">Your details</span>
      </Button>
      <ProfileDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
