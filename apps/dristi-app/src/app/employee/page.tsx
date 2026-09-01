"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useCourtNavLayout } from "@/lib/employee/nav-layout";

/**
 * The court-staff landing. Where it goes follows the rail layout the reader chose
 * (owner, 2026-09-01): the combined layout lands on the day's schedule, the split
 * layout on the day's cause list — the same row each layout puts first. A client
 * component because the choice lives in this browser's storage, which no server
 * redirect can read. The earlier "Court home" placeholder lived here; when a
 * court-side dashboard is built, it takes this route back.
 */
export default function EmployeeHomePage() {
  const router = useRouter();
  const [layout] = useCourtNavLayout();

  React.useEffect(() => {
    router.replace(
      layout === "split" ? "/employee/hearings" : "/employee/todays-schedule",
    );
  }, [layout, router]);

  return null;
}
