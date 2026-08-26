"use client";

/**
 * The current person, as this flow needs to know them.
 *
 * DRISTI's session lives in the larger product; this flow only needs a name, mobile,
 * email and bar number to greet the person, mark "you" among the signatories, and prefill
 * the advocate card. Until the real session is wired in, the profile is stored locally
 * and edited from the header avatar. `useProfile()` is the single read point — swap its
 * source for the product session and nothing else changes.
 */

import * as React from "react";

import { getRepository } from "./data";
import type { UserProfile } from "./types";

export const EMPTY_PROFILE: UserProfile = { name: "", mobile: "", email: "", barNumber: "" };

type ProfileContextValue = {
  /** `null` until read from storage. */
  profile: UserProfile | null;
  ready: boolean;
  save: (next: UserProfile) => Promise<void>;
};

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getRepository()
      .getProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p ?? EMPTY_PROFILE);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(EMPTY_PROFILE);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = React.useCallback(async (next: UserProfile) => {
    setProfile(next);
    await getRepository().putProfile(next);
  }, []);

  const value = React.useMemo(() => ({ profile, ready, save }), [profile, ready, save]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}

/** "AB" for the avatar; "?" until a name is known. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** First name for greetings; empty when unknown. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
