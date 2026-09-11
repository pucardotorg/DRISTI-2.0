import type { Metadata } from "next";

import { RegisterCasesScreen } from "@/components/employee/register-cases-screen";

export const metadata: Metadata = { title: "Register cases v3" };

/**
 * The register queue, opening into the third build of the complaint's screen.
 *
 * The list is the first build's, unchanged — the queue stands as built and the rebuild
 * is of the complaint's own screen — so only where a row opens differs.
 */
export default function EmployeeRegisterCasesV3Page() {
  return <RegisterCasesScreen basePath="/employee/register-cases-v3" />;
}
