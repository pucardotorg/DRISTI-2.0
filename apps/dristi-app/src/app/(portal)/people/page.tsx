"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { UsersIcon } from "lucide-react";

import { PeopleScreen } from "@/components/directory/people-screen";
import { ProfileScopedEmpty } from "@/components/shell/profile-scoped-empty";

/** People — the access-management page. Opening a case jumps to Your Cases with it open. */
export default function Page() {
  const router = useRouter();
  return (
    <ProfileScopedEmpty
      title="No one has access yet"
      description="People you share your cases with — advocates and office staff — appear here."
      icon={<UsersIcon aria-hidden />}
    >
      {/* Bulk People & Access concept (Sept 2026): the People page is the
          firm directory, with groups as the bulk lever. The earlier flat
          access list lives on in components/access/people-page.tsx. */}
      <PeopleScreen
        onOpenCase={(caseId) => router.push(`/cases?case=${encodeURIComponent(caseId)}`)}
      />
    </ProfileScopedEmpty>
  );
}
