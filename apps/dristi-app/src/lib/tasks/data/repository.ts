/**
 * Persistence contract for pending tasks.
 *
 * Everything the screens store goes through this interface: people, cases, tasks, the
 * current person (the stand-in for the session) and uploaded files. The only
 * implementation today is IndexedDB in the browser (`./indexeddb.ts`). The backend team
 * replaces it with an HTTP implementation of the same interface; screens do not change.
 */

import type { Case, Person, PersonId, StoredFileRef, Task } from "../types";

/** A stored upload: the reference the task holds plus the bytes. */
export type StoredFile = StoredFileRef & {
  blob: Blob;
  createdAt: string;
};

export interface TasksRepository {
  /* Reference data */
  listPeople(): Promise<Person[]>;
  putPeople(people: Person[]): Promise<void>;
  listCases(): Promise<Case[]>;
  putCases(cases: Case[]): Promise<void>;

  /* Tasks */
  listTasks(): Promise<Task[]>;
  putTask(task: Task): Promise<void>;
  putTasks(tasks: Task[]): Promise<void>;

  /* The current person — per tab, so two tabs can be two people. */
  getCurrentUserId(): Promise<PersonId | null>;
  putCurrentUserId(id: PersonId): Promise<void>;

  /* Files */
  putFile(file: StoredFile): Promise<void>;
  getFile(id: string): Promise<StoredFile | null>;
  deleteFile(id: string): Promise<void>;

  /** Wipe everything so the sandbox can re-seed. */
  clear(): Promise<void>;
}
