import type { Metadata } from "next";

import { RegisterCasesScreen } from "@/components/employee/register-cases-screen";

export const metadata: Metadata = { title: "Register cases v2" };

/**
 * The register queue, opening into the rebuilt complaint screen.
 *
 * The list is the first build's list unchanged — the queue stands as built (brief §5.1)
 * and the rebuild is of the complaint's own screen. Only where a row opens differs, so
 * this route is the same screen with its rows pointed one route over.
 */
export default function EmployeeRegisterCasesV2Page() {
  return <RegisterCasesScreen basePath="/employee/register-cases-v2" />;
}
