"use client";

import { useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type LotRecord = {
  id: string;
  product: string;
  characteristics: string;
  origin: string;
  originDate: string;
  organization: string;
  createdBy: string;
  createdByRole: DemoRole | null;
  isPublic: boolean;
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
let snapshot: LotRecord[] = emptyRecords;
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
    evidenceFileName: typeof value.evidenceFileName === "string" ? value.evidenceFileName : "",
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
    createdBy: typeof value.createdBy === "string" ? value.createdBy : "No registrado",
    createdByRole: isDemoRole(value.createdByRole) ? value.createdByRole : null,
    isPublic: typeof value.isPublic === "boolean" ? value.isPublic : false,
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

function readLegacyRecords() {
  try {
    const rawRecords = window.localStorage.getItem(storageKey);
    const parsedRecords: unknown = rawRecords ? JSON.parse(rawRecords) : [];
    return Array.isArray(parsedRecords)
      ? parsedRecords
          .map(normalizeLotRecord)
          .filter((record): record is LotRecord => record !== null)
      : [];
  } catch {
    return [];
  }
}

export async function loadLotRecords() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { success: false, message: "Configura Supabase para cargar los registros." };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || userData.user.is_anonymous) {
      return { success: false, message: "Inicia sesión para consultar tus registros." };
    }

    const { data, error } = await supabase
      .from("traceability_lots")
      .select("record")
      .order("created_at", { ascending: false });
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return {
          success: false,
          message:
            "Falta aplicar la migración de Supabase para habilitar el almacenamiento de lotes.",
        };
      }
      return { success: false, message: "No se pudieron cargar los registros desde Supabase." };
    }

    const remoteRecords = data
      .map((row) => normalizeLotRecord(row.record))
      .filter((record): record is LotRecord => record !== null);
    const remoteIds = new Set(remoteRecords.map((record) => record.id));
    const allLegacyRecords = readLegacyRecords();
    const legacyRecords = allLegacyRecords.filter((record) => !remoteIds.has(record.id));
    const migratedRecords: LotRecord[] = [];

    for (const record of legacyRecords) {
      const { error: migrationError } = await supabase.from("traceability_lots").insert({
        id: record.id,
        owner_id: userData.user.id,
        record,
        is_public: record.isPublic,
      });
      if (!migrationError) {
        migratedRecords.push(record);
      }
    }

    const records = [...migratedRecords, ...remoteRecords].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );
    if (migratedRecords.length === legacyRecords.length) {
      window.localStorage.removeItem(storageKey);
    }
    snapshot = records;
    notifySubscribers();
    return { success: true, message: "Registros cargados.", migratedCount: migratedRecords.length };
  } catch {
    return { success: false, message: "No se pudo conectar con Supabase para cargar registros." };
  }
}

export async function getPublicLotRecord(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("public_traceability_lots")
      .select("public_record")
      .eq("id", id)
      .maybeSingle();
    return error || !data ? null : normalizeLotRecord(data.public_record);
  } catch {
    return null;
  }
}

export async function saveLotRecord(record: LotRecord) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || userData.user.is_anonymous) {
    return false;
  }

  const { error } = await supabase.from("traceability_lots").insert({
    id: record.id,
    owner_id: userData.user.id,
    record,
    is_public: record.isPublic,
  });
  if (error) {
    return false;
  }

  snapshot = [record, ...getSnapshot()];
  notifySubscribers();
  return true;
}

export async function updateLotRecord(id: string, update: (record: LotRecord) => LotRecord) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  try {
    const { data, error: readError } = await supabase
      .from("traceability_lots")
      .select("record")
      .eq("id", id)
      .maybeSingle();
    const currentRecord = data ? normalizeLotRecord(data.record) : null;
    if (readError || !currentRecord) {
      return false;
    }

    const updatedRecord = update(currentRecord);
    const { error } = await supabase
      .from("traceability_lots")
      .update({
        record: updatedRecord,
        is_public: updatedRecord.isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      return false;
    }

    snapshot = snapshot.map((record) => (record.id === id ? updatedRecord : record));
    notifySubscribers();
    return true;
  } catch {
    return false;
  }
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
