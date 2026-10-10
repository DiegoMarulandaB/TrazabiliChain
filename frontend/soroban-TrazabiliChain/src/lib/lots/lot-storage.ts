"use client";

import { useSyncExternalStore } from "react";

export type LotRecord = {
  id: string;
  product: string;
  origin: string;
  originDate: string;
  organization: string;
  createdAt: string;
};

const storageKey = "trazabilichain-demo-lots";
const emptyRecords: LotRecord[] = [];
const subscribers = new Set<() => void>();
let snapshot: LotRecord[] | undefined;

function isLotRecord(value: unknown): value is LotRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ["id", "product", "origin", "originDate", "organization", "createdAt"].every(
    (field) => typeof record[field] === "string",
  );
}

function readRecords() {
  try {
    const rawRecords = window.localStorage.getItem(storageKey);
    if (!rawRecords) {
      return emptyRecords;
    }

    const parsedRecords: unknown = JSON.parse(rawRecords);
    return Array.isArray(parsedRecords) ? parsedRecords.filter(isLotRecord) : emptyRecords;
  } catch {
    return emptyRecords;
  }
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return emptyRecords;
  }

  snapshot ??= readRecords();
  return snapshot;
}

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === storageKey || event.key === null) {
    snapshot = readRecords();
    notifySubscribers();
  }
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  if (subscribers.size === 1) {
    window.addEventListener("storage", handleStorageChange);
  }

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

export function useLotRecords() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptyRecords);
}

export function saveLotRecord(record: LotRecord) {
  const updatedRecords = [record, ...getSnapshot()];

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
    snapshot = updatedRecords;
    notifySubscribers();
    return true;
  } catch {
    return false;
  }
}
