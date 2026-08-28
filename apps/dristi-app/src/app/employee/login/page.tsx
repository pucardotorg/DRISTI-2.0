"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * `/employee/login` — sign-in for court staff.
 *
 * Deliberately blank scaffolding. There is no real authentication here yet: submitting
 * just crosses into the employee home (`/employee`). Wire the actual sign-in — who the
 * staff member is, which court, which role (magistrate / bench clerk / scrutiny
 * officer) — into `onSubmit`, then keep sending them to `/employee` (or a role home).
 *
 * Uses only design-system primitives, so it already passes the token/typography gates.
 * Style it out from here; do not hand-roll new colours or type sizes.
 */
export default function EmployeeLoginPage() {
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO(backend): authenticate the court-staff member here, then route to their home.
    router.push("/employee");
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLockup className="h-7" />
          <p className="text-body-compact text-muted-foreground">
            Court staff sign-in
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-title-s font-semibold">Sign in</CardTitle>
            <CardDescription className="text-body-compact">
              For magistrates, bench clerks and scrutiny officers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
              <Field>
                <FieldLabel htmlFor="employee-id">Staff ID</FieldLabel>
                <Input
                  id="employee-id"
                  name="employee-id"
                  autoComplete="username"
                  placeholder="Enter your staff ID"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="employee-password">Password</FieldLabel>
                <Input
                  id="employee-password"
                  name="employee-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </Field>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
