"use client";

import * as React from "react";
import { InboxIcon } from "lucide-react";

import { useProfile } from "@/components/shell/profile";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * A litigant (party-in-person) keeps every page the advocate has, but their data is
 * their own — so an advocate's populated cases / people / tasks are not theirs to see.
 * On the litigant profile this shows the page's empty state; on the advocate profile it
 * renders the real content. (Data is currently shared fixtures; this scopes the view by
 * profile until per-account data lands.)
 */
export function ProfileScopedEmpty({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { profileRole } = useProfile();
  if (profileRole !== "litigant") return <>{children}</>;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6 md:p-8">
      <Empty className="flex-1 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">{icon ?? <InboxIcon aria-hidden />}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
