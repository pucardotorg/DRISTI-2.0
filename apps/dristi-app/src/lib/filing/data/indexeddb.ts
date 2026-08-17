/**
 * IndexedDB implementation of the filing repository.
 *
 * One database, three stores: `drafts` (whole drafts, indexed by `updatedAt`), `files`
 * (upload bytes + metadata) and `profile` (a single record under the key "me"). Blobs are
 * stored as-is — IndexedDB keeps binary data natively, so uploads survive reloads and
 * are never base64-inflated.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { FilingDraft, UserProfile } from "../types";
import type { FilingRepository, StoredFile } from "./repository";

const DB_NAME = "dristi-efiling";
const DB_VERSION = 1;
const PROFILE_KEY = "me";

interface FilingDB extends DBSchema {
  drafts: {
    key: string;
    value: FilingDraft;
    indexes: { updatedAt: string };
  };
  files: {
    key: string;
    value: StoredFile;
  };
  profile: {
    key: string;
    value: UserProfile;
  };
}

let dbPromise: Promise<IDBPDatabase<FilingDB>> | null = null;

function db(): Promise<IDBPDatabase<FilingDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FilingDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const drafts = database.createObjectStore("drafts", { keyPath: "id" });
        drafts.createIndex("updatedAt", "updatedAt");
        database.createObjectStore("files", { keyPath: "id" });
        database.createObjectStore("profile");
      },
    });
  }
  return dbPromise;
}

export class IndexedDbFilingRepository implements FilingRepository {
  async listDrafts(): Promise<FilingDraft[]> {
    const all = await (await db()).getAllFromIndex("drafts", "updatedAt");
    return all.reverse(); // newest first
  }

  async getDraft(id: string): Promise<FilingDraft | null> {
    return (await (await db()).get("drafts", id)) ?? null;
  }

  async putDraft(draft: FilingDraft): Promise<void> {
    await (await db()).put("drafts", draft);
  }

  async deleteDraft(id: string): Promise<void> {
    await (await db()).delete("drafts", id);
  }

  async putFile(file: StoredFile): Promise<void> {
    await (await db()).put("files", file);
  }

  async getFile(id: string): Promise<StoredFile | null> {
    return (await (await db()).get("files", id)) ?? null;
  }

  async deleteFile(id: string): Promise<void> {
    await (await db()).delete("files", id);
  }

  async deleteFiles(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const tx = (await db()).transaction("files", "readwrite");
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
  }

  async getProfile(): Promise<UserProfile | null> {
    return (await (await db()).get("profile", PROFILE_KEY)) ?? null;
  }

  async putProfile(profile: UserProfile): Promise<void> {
    await (await db()).put("profile", profile, PROFILE_KEY);
  }
}
