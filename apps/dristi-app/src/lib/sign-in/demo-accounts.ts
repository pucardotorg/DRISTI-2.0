/**
 * Prototype stand-in for the credentials endpoint. Delete this file when the real one
 * lands — nothing else imports it.
 *
 * Its only job is to make the role-mismatch path reviewable: a number registered under
 * one role, entered on the other role's tab, is the single dead end this screen can
 * create, and it cannot be judged from a description.
 *
 * Any number not listed here represents the unregistered-account state. Use the two
 * fixtures below to review successful and role-mismatch paths.
 */

import type { Role } from "@/lib/sign-in/content";

export const DEMO_ACCOUNTS: Record<string, Role> = {
  "7007663437": "litigant",
  "8009460966": "advocate",
};

/** The role this number is registered under, or `undefined` if it is not in the list. */
export function registeredRole(mobile: string): Role | undefined {
  return DEMO_ACCOUNTS[mobile];
}
