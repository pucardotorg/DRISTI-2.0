/**
 * Persistence contract for the e-filing flow.
 *
 * Everything the screens store goes through this interface: drafts (the whole
 * `FilingDraft`), uploaded files (bytes + metadata), and the current person's profile.
 * The only implementation today is IndexedDB in the browser (`./indexeddb.ts`) — enough
 * for the flow to behave like a real app on one machine. The backend team replaces it
 * with an HTTP implementation of the same interface; screens do not change.
 */

import type { FilingDraft, StoredFileRef, UserProfile } from "../types";

/** A stored upload: the reference the draft holds plus the bytes. */
export type StoredFile = StoredFileRef & {
  blob: Blob;
  createdAt: string;
};

export interface FilingRepository {
  /* Drafts (and filed cases — a filed case is a draft with `status: "filed"`). */
  listDrafts(): Promise<FilingDraft[]>;
  getDraft(id: string): Promise<FilingDraft | null>;
  putDraft(draft: FilingDraft): Promise<void>;
  deleteDraft(id: string): Promise<void>;

  /* Files */
  putFile(file: StoredFile): Promise<void>;
  getFile(id: string): Promise<StoredFile | null>;
  deleteFile(id: string): Promise<void>;
  /** Drop files no draft references any more (called after a draft is deleted). */
  deleteFiles(ids: string[]): Promise<void>;

  /* Profile (the stand-in for the product session) */
  getProfile(): Promise<UserProfile | null>;
  putProfile(profile: UserProfile): Promise<void>;
}
