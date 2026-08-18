/**
 * IndexedDB implementation of the tasks repository.
 *
 * One database, four stores: `people`, `cases`, `tasks` and `files` (upload bytes +
 * metadata; blobs are stored as-is). The current person is *not* in the database —
 * IndexedDB is shared by every tab, and the sandbox wants two tabs to be two people, so
 * it lives in `sessionStorage`, seeded from `localStorage` for the first tab.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Case, Person, PersonId, Task } from "../types";
import type { StoredFile, TasksRepository } from "./repository";

const DB_NAME = "dristi-tasks";
const DB_VERSION = 1;
const USER_KEY = "dristi-tasks:user";

interface TasksDB extends DBSchema {
  people: { key: string; value: Person };
  cases: { key: string; value: Case };
  tasks: { key: string; value: Task };
  files: { key: string; value: StoredFile };
}

let dbPromise: Promise<IDBPDatabase<TasksDB>> | null = null;

function db(): Promise<IDBPDatabase<TasksDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TasksDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore("people", { keyPath: "id" });
        database.createObjectStore("cases", { keyPath: "id" });
        database.createObjectStore("tasks", { keyPath: "id" });
        database.createObjectStore("files", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

async function putAll<S extends "people" | "cases" | "tasks">(
  store: S,
  rows: TasksDB[S]["value"][]
): Promise<void> {
  const tx = (await db()).transaction(store, "readwrite");
  await Promise.all([...rows.map((row) => tx.store.put(row)), tx.done]);
}

export class IndexedDbTasksRepository implements TasksRepository {
  async listPeople(): Promise<Person[]> {
    return (await db()).getAll("people");
  }
  async putPeople(people: Person[]): Promise<void> {
    await putAll("people", people);
  }

  async listCases(): Promise<Case[]> {
    return (await db()).getAll("cases");
  }
  async putCases(cases: Case[]): Promise<void> {
    await putAll("cases", cases);
  }

  async listTasks(): Promise<Task[]> {
    return (await db()).getAll("tasks");
  }
  async putTask(task: Task): Promise<void> {
    await (await db()).put("tasks", task);
  }
  async putTasks(tasks: Task[]): Promise<void> {
    await putAll("tasks", tasks);
  }

  async getCurrentUserId(): Promise<PersonId | null> {
    return sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
  }
  async putCurrentUserId(id: PersonId): Promise<void> {
    sessionStorage.setItem(USER_KEY, id);
    localStorage.setItem(USER_KEY, id);
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

  async clear(): Promise<void> {
    const d = await db();
    const tx = d.transaction(["people", "cases", "tasks", "files"], "readwrite");
    await Promise.all([
      tx.objectStore("people").clear(),
      tx.objectStore("cases").clear(),
      tx.objectStore("tasks").clear(),
      tx.objectStore("files").clear(),
      tx.done,
    ]);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
