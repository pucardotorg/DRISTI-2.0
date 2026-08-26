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
  /** Whether this account holds an advocate profile at all. A base litigant does NOT —
   *  the switcher offers no Advocate option until they elevate (Settings → request). */
  advocateProfileAvailable: boolean;
  switchProfile: () => void;
  /** Grant the advocate profile — the elevation-approved path (from Settings). */
  enableAdvocateProfile: () => void;
};

const ProfileContext = React.createContext<ProfileValue | null>(null);

/** Session-lite keys: sign-in stashes these so the shell opens as the account you are. */
export const PROFILE_ROLE_KEY = "dristi-demo-profile-role";
export const ADVOCATE_AVAILABLE_KEY = "dristi-demo-advocate-available";

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
  const [advocateAvailable, setAdvocateAvailable] = React.useState(
    advocateProfileAvailable,
  );

  // Session-lite: read the role + advocate-availability the sign-in stashed, after mount
  // (avoids a hydration mismatch). A base litigant has no advocate profile until elevated.
  React.useEffect(() => {
    const storedRole = window.localStorage.getItem(PROFILE_ROLE_KEY);
    if (storedRole === "litigant" || storedRole === "advocate") {
      setProfileRole(storedRole);
    }
    const storedAvail = window.localStorage.getItem(ADVOCATE_AVAILABLE_KEY);
    if (storedAvail === "true" || storedAvail === "false") {
      setAdvocateAvailable(storedAvail === "true");
    }
  }, []);

  const switchProfile = React.useCallback(() => {
    setProfileRole((r) => {
      const next = r === "advocate" ? "litigant" : "advocate";
      window.localStorage.setItem(PROFILE_ROLE_KEY, next);
      return next;
    });
  }, []);

  const enableAdvocateProfile = React.useCallback(() => {
    setAdvocateAvailable(true);
    window.localStorage.setItem(ADVOCATE_AVAILABLE_KEY, "true");
  }, []);

  const value = React.useMemo<ProfileValue>(
    () => ({
      profileRole,
      advocateProfileAvailable: advocateAvailable,
      switchProfile,
      enableAdvocateProfile,
    }),
    [profileRole, advocateAvailable, switchProfile, enableAdvocateProfile],
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
