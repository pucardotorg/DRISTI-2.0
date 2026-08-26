"use client";

import * as React from "react";

/**
 * Which profile the person is currently acting as.
 *
 * This is not the same question as *who is signed in*. One account can hold both a
 * litigant profile and an advocate profile — the same human, filing their own cheque
 * case on Monday and appearing for a client on Tuesday — and the rail's foot is where
 * they move between the two. Accounts are not shared between people, so this is
 * deliberately not a list of teammates; the sandbox's "viewing as" control in the top
 * bar is a separate thing that answers a separate question (what does the permission
 * model show someone else?).
 *
 * The state is held here rather than in the tasks store because it outranks any one
 * area: switching profile re-frames the whole product, not just the task list. Nothing
 * persists it yet — there is no session to persist it into — so a reload returns to the
 * advocate profile, which is the one the built screens serve.
 */
export type ProfileRole = "litigant" | "advocate";

export type ProfileValue = {
  profileRole: ProfileRole;
  /** Whether this account holds an advocate profile at all. A litigant-only account
   *  keeps the switcher's position in the rail but has nothing to switch to. */
  advocateProfileAvailable: boolean;
  switchProfile: () => void;
};

const ProfileContext = React.createContext<ProfileValue | null>(null);

/** Where sign-in stashes the role, so the shell opens in the profile you signed in as. */
export const PROFILE_ROLE_KEY = "dristi-demo-profile-role";

export function ProfileProvider({
  children,
  advocateProfileAvailable = true,
  initialRole = "advocate",
}: {
  children: React.ReactNode;
  advocateProfileAvailable?: boolean;
  initialRole?: ProfileRole;
}) {
  const [profileRole, setProfileRole] =
    React.useState<ProfileRole>(initialRole);

  // Session-lite: sign-in stashes the role the number registered under (see the
  // join flow), so the shell opens in the profile you signed in as rather than a
  // fixed default. Read after mount to avoid a hydration mismatch.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(PROFILE_ROLE_KEY);
    if (stored === "litigant" || stored === "advocate") setProfileRole(stored);
  }, []);

  const switchProfile = React.useCallback(() => {
    setProfileRole((r) => {
      const next = r === "advocate" ? "litigant" : "advocate";
      window.localStorage.setItem(PROFILE_ROLE_KEY, next);
      return next;
    });
  }, []);

  const value = React.useMemo<ProfileValue>(
    () => ({ profileRole, advocateProfileAvailable, switchProfile }),
    [profileRole, advocateProfileAvailable, switchProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileValue {
  const value = React.useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider");
  return value;
}
