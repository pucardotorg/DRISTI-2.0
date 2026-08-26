/**
 * Repository access for the task screens. `getRepository()` is the one place that
 * chooses the implementation — swap it for an HTTP-backed one when the backend lands.
 */

import type { StoredFileRef } from "../types";
import { IndexedDbTasksRepository } from "./indexeddb";
import type { StoredFile, TasksRepository } from "./repository";

export type { StoredFile, TasksRepository } from "./repository";

let instance: TasksRepository | null = null;

export function getRepository(): TasksRepository {
  if (typeof window === "undefined") {
    throw new Error("The tasks repository is browser-only (IndexedDB).");
  }
  if (!instance) instance = new IndexedDbTasksRepository();
  return instance;
}

/** Short, URL-safe id for files and rows. */
export function newId(prefix = ""): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw.slice(0, 12)}` : raw.slice(0, 12);
}

/** Store an upload and return the reference the task keeps. */
export async function storeUpload(file: File): Promise<StoredFileRef> {
  const ext = (file.name.split(".").pop() || "").toUpperCase().slice(0, 5) || "FILE";
  const ref: StoredFileRef = {
    id: newId("f"),
    name: file.name,
    size: file.size,
    type: file.type,
    ext,
  };
  const stored: StoredFile = { ...ref, blob: file, createdAt: new Date().toISOString() };
  await getRepository().putFile(stored);
  return ref;
}

const urls = new Map<string, string>();

/** An object URL for a stored file, or `null` if the bytes are not in this browser. */
export async function fileUrl(id: string): Promise<string | null> {
  const cached = urls.get(id);
  if (cached) return cached;
  const stored = await getRepository().getFile(id);
  if (!stored) return null;
  const url = URL.createObjectURL(stored.blob);
  urls.set(id, url);
  return url;
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
