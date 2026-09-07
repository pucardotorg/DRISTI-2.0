"use client";

import * as React from "react";
import { FileCheckIcon } from "lucide-react";

import { CHECKS } from "@/lib/employee/scrutiny/sections";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * The officer's standing checks. Visible in the case bar, never hover-gated, with
 * progress on the button itself — this is the paper notepad the interface has to
 * replace, so it cannot be hidden behind a menu.
 */
export function ChecksPopover() {
  const [checked, setChecked] = React.useState<Set<number>>(() => new Set());

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <FileCheckIcon />
          {checked.size
            ? `What to check · ${checked.size}/${CHECKS.length}`
            : "What to check"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <FieldGroup data-slot="checkbox-group" className="gap-2.5">
          {CHECKS.map((check, i) => (
            <Field key={check} orientation="horizontal">
              <Checkbox
                id={`check-${i}`}
                checked={checked.has(i)}
                onCheckedChange={() => toggle(i)}
              />
              <FieldLabel htmlFor={`check-${i}`} className="font-normal">
                {check}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}
