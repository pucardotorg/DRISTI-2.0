"use client";

/**
 * Draft store for vakalatnamas — the repository seam, backed by this browser's
 * localStorage so a draft survives a reload without a server. Swap this file for a real
 * API and nothing above it changes. Reads/writes go through `useSyncExternalStore`, so
 * every open screen re-renders when a draft changes.
 */

import * as React from "react";

import { blankVak } from "./data";
import type { CreatorRole, Vakalatnama } from "./types";

const KEY = "vak.store.v2";

type Db = Record<string, Vakalatnama>;

let db: Db | null = null;
let version = 0;
let listCache: Vakalatnama[] = [];
let listCacheVersion = -1;

const listeners = new Set<() => void>();
const EMPTY: Vakalatnama[] = [];

function ensure(): Db {
  if (db) return db;
  if (typeof window === "undefined") return (db = {});
  try {
    const raw = window.localStorage.getItem(KEY);
    db = raw ? (JSON.parse(raw) as Db) : {};
  } catch {
    db = {};
  }
  return db;
}

function commit() {
  version += 1;
  if (typeof window !== "undefined" && db) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      // Best-effort: a full or blocked store still works for this session.
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function listSnapshot(): Vakalatnama[] {
  if (listCacheVersion !== version) {
    listCache = Object.values(ensure()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    listCacheVersion = version;
  }
  return listCache;
}

/** All vakalatnamas in this browser, newest first. */
export function useVakList(): Vakalatnama[] {
  return React.useSyncExternalStore(subscribe, listSnapshot, () => EMPTY);
}

/** One vakalatnama by id (undefined while loading or if unknown). */
export function useVak(id: string): Vakalatnama | undefined {
  const get = React.useCallback(() => ensure()[id], [id]);
  return React.useSyncExternalStore(subscribe, get, () => undefined);
}

/** `true` once the store has been read on the client — for empty-vs-loading. */
export function useStoreReady(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => db !== null,
    () => false
  );
}

export function createVak(creatorRole: CreatorRole): string {
  const v = blankVak(creatorRole);
  ensure()[v.id] = v;
  commit();
  return v.id;
}

export function updateVak(
  id: string,
  patch: Partial<Vakalatnama> | ((prev: Vakalatnama) => Vakalatnama)
): void {
  const d = ensure();
  const prev = d[id];
  if (!prev) return;
  const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
  next.updatedAt = new Date().toISOString();
  d[id] = next;
  commit();
}

export function discardVak(id: string): void {
  const d = ensure();
  if (d[id]) {
    delete d[id];
    commit();
  }
}
