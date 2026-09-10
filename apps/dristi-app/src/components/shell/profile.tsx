"use client";

import * as React from "react";

import {
  useLocalStorageValue,
  writeLocalStorageValue,
} from "@/hooks/use-local-storage-value";

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
  /** The person signed in. FIXED per account — switching profile changes the role, not
   *  the name (the same human is advocate on one profile and litigant on the other). */
  accountName: string;
  switchProfile: () => void;
  /** Grant the advocate profile — the elevation-approved path (from Settings). */
  enableAdvocateProfile: () => void;
};

const ProfileContext = React.createContext<ProfileValue | null>(null);

/** Session-lite keys: sign-in stashes these so the shell opens as the account you are. */
export const PROFILE_ROLE_KEY = "dristi-demo-profile-role";
export const ADVOCATE_AVAILABLE_KEY = "dristi-demo-advocate-available";
export const ACCOUNT_NAME_KEY = "dristi-demo-account-name";

export function ProfileProvider({
  children,
  advocateProfileAvailable = true,
  initialRole = "advocate",
}: {
  children: React.ReactNode;
  advocateProfileAvailable?: boolean;
  initialRole?: ProfileRole;
}) {
  // Session-lite: the role + advocate-availability + name the sign-in stashed.
  // Read via `useSyncExternalStore`, so SSR and the hydration render agree on the
  // defaults and the stored value takes over right after — no effect, no second
  // setState pass. A base litigant has no advocate profile until elevated.
  const storedRole = useLocalStorageValue(PROFILE_ROLE_KEY);
  const profileRole: ProfileRole =
    storedRole === "litigant" || storedRole === "advocate"
      ? storedRole
      : initialRole;

  const storedAvail = useLocalStorageValue(ADVOCATE_AVAILABLE_KEY);
  const advocateAvailable =
    storedAvail === "true" || storedAvail === "false"
      ? storedAvail === "true"
      : advocateProfileAvailable;

  const accountName = useLocalStorageValue(ACCOUNT_NAME_KEY) || "Anjali Nair";

  const switchProfile = React.useCallback(() => {
    writeLocalStorageValue(
      PROFILE_ROLE_KEY,
      profileRole === "advocate" ? "litigant" : "advocate",
    );
  }, [profileRole]);

  const enableAdvocateProfile = React.useCallback(() => {
    writeLocalStorageValue(ADVOCATE_AVAILABLE_KEY, "true");
  }, []);

  const value = React.useMemo<ProfileValue>(
    () => ({
      profileRole,
      advocateProfileAvailable: advocateAvailable,
      accountName,
      switchProfile,
      enableAdvocateProfile,
    }),
    [profileRole, advocateAvailable, accountName, switchProfile, enableAdvocateProfile],
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
