"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { UsersIcon } from "lucide-react";

import { PeoplePage } from "@/components/access/people-page";
import { useLocale } from "@/components/shell/locale";
import { ProfileScopedEmpty } from "@/components/shell/profile-scoped-empty";

/** People — the access-management page. Opening a case jumps to Your Cases with it open. */
export default function Page() {
  const router = useRouter();
  const { locale } = useLocale();
  return (
    <ProfileScopedEmpty
      title="No one has access yet"
      description="People you share your cases with — advocates and office staff — appear here."
      icon={<UsersIcon aria-hidden />}
    >
      <PeoplePage
        locale={locale}
        onOpenCase={(caseId) => router.push(`/cases?case=${encodeURIComponent(caseId)}`)}
      />
    </ProfileScopedEmpty>
  );
}
