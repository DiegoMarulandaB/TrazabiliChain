"use client";

import { useSyncExternalStore } from "react";

export type LotRecord = {
  id: string;
  product: string;
  characteristics: string;
  origin: string;
  originDate: string;
  organization: string;
  createdAt: string;
  events: LotEvent[];
  certificates: LotCertificate[];
};

export const demoRoles = [
  "producer",
  "supplyActor",
  "certifier",
  "organizationAdmin",
  "b2bBuyer",
  "auditor",
  "consumer",
] as const;

export type DemoRole = (typeof demoRoles)[number];

export type LotEvent = {
  id: string;
  type: string;
  occurredAt: string;
  recordedAt: string;
  actorName: string;
  actorRole: DemoRole | null;
  organization: string;
  details: string;
  evidenceFileName?: string;
  evidenceSha256?: string;
};

export type LotCertificate = {
  id: string;
  name: string;
  issuer: string;
  certificateNumber: string;
  issuedAt: string;
  validUntil: string;
  evidenceFileName: string;
  evidenceSha256: string;
  recordedBy: string;
  recordedByRole: DemoRole | null;
  recordedByOrganization: string;
  recordedAt: string;
};

export type OrganizationMember = {
  id: string;
  name: string;
  role: DemoRole;
  organization: string;
};

const storageKey = "trazabilichain-demo-lots";
const memberStorageKey = "trazabilichain-demo-members";
const emptyRecords: LotRecord[] = [];
const emptyMembers: OrganizationMember[] = [];
const subscribers = new Set<() => void>();
let snapshot: LotRecord[] | undefined;
let memberSnapshot: OrganizationMember[] | undefined;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && demoRoles.includes(value as DemoRole);
}

function normalizeLotEvent(value: unknown): LotEvent | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    !["id", "type", "occurredAt", "recordedAt", "actorName", "organization", "details"].every(
      (field) => typeof value[field] === "string",
    ) ||
    (value.evidenceFileName !== undefined && typeof value.evidenceFileName !== "string") ||
    (value.evidenceSha256 !== undefined && typeof value.evidenceSha256 !== "string")
  ) {
    return null;
  }

  return {
    id: value.id as string,
    type: value.type as string,
    occurredAt: value.occurredAt as string,
    recordedAt: value.recordedAt as string,
    actorName: value.actorName as string,
    actorRole: isDemoRole(value.actorRole) ? value.actorRole : null,
    organization: value.organization as string,
    details: value.details as string,
    ...(typeof value.evidenceFileName === "string"
      ? { evidenceFileName: value.evidenceFileName }
      : {}),
    ...(typeof value.evidenceSha256 === "string" ? { evidenceSha256: value.evidenceSha256 } : {}),
  };
}

function normalizeLotCertificate(value: unknown): LotCertificate | null {
  if (!isObject(value)) {
    return null;
  }

  const requiredFields = [
    "id",
    "name",
    "issuer",
    "certificateNumber",
    "issuedAt",
    "validUntil",
    "evidenceFileName",
    "evidenceSha256",
    "recordedAt",
  ];
  if (!requiredFields.every((field) => typeof value[field] === "string")) {
    return null;
  }

  return {
    id: value.id as string,
    name: value.name as string,
    issuer: value.issuer as string,
    certificateNumber: value.certificateNumber as string,
    issuedAt: value.issuedAt as string,
    validUntil: value.validUntil as string,
    evidenceFileName: value.evidenceFileName as string,
    evidenceSha256: value.evidenceSha256 as string,
    recordedBy: typeof value.recordedBy === "string" ? value.recordedBy : "No registrado",
    recordedByRole: isDemoRole(value.recordedByRole) ? value.recordedByRole : null,
    recordedByOrganization:
      typeof value.recordedByOrganization === "string"
        ? value.recordedByOrganization
        : "No registrada",
    recordedAt: value.recordedAt as string,
  };
}

function normalizeLotRecord(value: unknown): LotRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const requiredFields = ["id", "product", "origin", "originDate", "organization", "createdAt"];
  if (!requiredFields.every((field) => typeof value[field] === "string")) {
    return null;
  }

  return {
    id: value.id as string,
    product: value.product as string,
    characteristics: typeof value.characteristics === "string" ? value.characteristics : "",
    origin: value.origin as string,
    originDate: value.originDate as string,
    organization: value.organization as string,
    createdAt: value.createdAt as string,
    events: Array.isArray(value.events)
      ? value.events.map(normalizeLotEvent).filter((item): item is LotEvent => item !== null)
      : [],
    certificates: Array.isArray(value.certificates)
      ? value.certificates
          .map(normalizeLotCertificate)
          .filter((item): item is LotCertificate => item !== null)
      : [],
  };
}

function isOrganizationMember(value: unknown): value is OrganizationMember {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isDemoRole(value.role) &&
    typeof value.organization === "string"
  );
}

function readRecords() {
  try {
    const rawRecords = window.localStorage.getItem(storageKey);
    if (!rawRecords) {
      return emptyRecords;
    }

    const parsedRecords: unknown = JSON.parse(rawRecords);
    return Array.isArray(parsedRecords)
      ? parsedRecords
          .map(normalizeLotRecord)
          .filter((record): record is LotRecord => record !== null)
      : emptyRecords;
  } catch {
    return emptyRecords;
  }
}

function readMembers() {
  try {
    const rawMembers = window.localStorage.getItem(memberStorageKey);
    if (!rawMembers) {
      return emptyMembers;
    }

    const parsedMembers: unknown = JSON.parse(rawMembers);
    return Array.isArray(parsedMembers) ? parsedMembers.filter(isOrganizationMember) : emptyMembers;
  } catch {
    return emptyMembers;
  }
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return emptyRecords;
  }

  snapshot ??= readRecords();
  return snapshot;
}

function getMemberSnapshot() {
  if (typeof window === "undefined") {
    return emptyMembers;
  }

  memberSnapshot ??= readMembers();
  return memberSnapshot;
}

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === storageKey || event.key === null) {
    snapshot = readRecords();
  }
  if (event.key === memberStorageKey || event.key === null) {
    memberSnapshot = readMembers();
  }
  notifySubscribers();
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

export function useOrganizationMembers() {
  return useSyncExternalStore(subscribe, getMemberSnapshot, () => emptyMembers);
}

function writeRecords(records: LotRecord[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(records));
    snapshot = records;
    notifySubscribers();
    return true;
  } catch {
    return false;
  }
}

export function saveLotRecord(record: LotRecord) {
  return writeRecords([record, ...getSnapshot()]);
}

export function updateLotRecord(id: string, update: (record: LotRecord) => LotRecord) {
  const records = getSnapshot();
  if (!records.some((record) => record.id === id)) {
    return false;
  }

  return writeRecords(records.map((record) => (record.id === id ? update(record) : record)));
}

export function addOrganizationMember(member: OrganizationMember) {
  const members = [...getMemberSnapshot(), member];
  try {
    window.localStorage.setItem(memberStorageKey, JSON.stringify(members));
    memberSnapshot = members;
    notifySubscribers();
    return true;
  } catch {
    return false;
  }
}

export function removeOrganizationMember(id: string) {
  const members = getMemberSnapshot().filter((member) => member.id !== id);
  try {
    window.localStorage.setItem(memberStorageKey, JSON.stringify(members));
    memberSnapshot = members;
    notifySubscribers();
    return true;
  } catch {
    return false;
  }
}
