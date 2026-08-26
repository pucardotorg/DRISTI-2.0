"use client";

import * as React from "react";

import type { SubmittedId } from "@/components/home/add-id-dialog";
import {
  ProfileSettings,
  type AdvocateRequestDetails,
} from "@/components/home/profile-settings";
import { useLocale } from "@/components/shell/locale";
import { useProfile } from "@/components/shell/profile";
import { ADVOCATE_PROFILE_NAME } from "@/lib/advocate/content";
import { DEMO_PROFILE_NAME } from "@/lib/join/content";

/**
 * Settings on the new shell. Profile role + switch come from the shell's ProfileProvider;
 * the id-upload and advocate-request (elevate) state is local demo state until a real
 * account service lands. This is where a litigant elevates to an advocate profile.
 */
export default function Page() {
  const { locale } = useLocale();
  const { profileRole, advocateProfileAvailable, switchProfile } = useProfile();

  const [idSubmitted, setIdSubmitted] = React.useState(true);
  const [submittedId, setSubmittedId] = React.useState<SubmittedId | null>(null);
  const [advocateRequest, setAdvocateRequest] =
    React.useState<AdvocateRequestDetails | null>(null);

  const profileName =
    profileRole === "advocate" ? ADVOCATE_PROFILE_NAME : DEMO_PROFILE_NAME;

  return (
    <ProfileSettings
      locale={locale}
      profileName={profileName}
      idSubmitted={idSubmitted}
      submittedId={submittedId}
      advocateRequest={advocateRequest}
      profileRole={profileRole}
      advocateProfileAvailable={advocateProfileAvailable}
      onIdSubmitted={(submission) => {
        setSubmittedId(submission);
        setIdSubmitted(true);
      }}
      onProfileCompleted={() => {}}
      onAdvocateRequest={(details) => setAdvocateRequest(details)}
      onSwitchProfile={switchProfile}
    />
  );
}
