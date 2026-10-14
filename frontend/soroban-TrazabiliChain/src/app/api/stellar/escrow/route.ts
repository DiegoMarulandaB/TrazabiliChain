import { createClient } from "@supabase/supabase-js";
import {
  development,
  formatApiErrorMessage,
  TrustlessWorkApiError,
  TrustlessWorkClient,
  toTrustlessWorkError,
} from "@trustless-work/escrow-js";
import type { DeploySingleReleaseEscrowPayload } from "@trustless-work/escrow-js/types";
import { Address } from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDeployPayload(value: unknown): value is DeploySingleReleaseEscrowPayload {
  if (!isJsonRecord(value) || !isJsonRecord(value.roles) || !isJsonRecord(value.trustline)) {
    return false;
  }

  const roles = value.roles;
  const trustline = value.trustline;
  return (
    typeof value.signer === "string" &&
    typeof value.engagementId === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    typeof value.platformFee === "number" &&
    Number.isFinite(value.platformFee) &&
    Array.isArray(value.milestones) &&
    value.milestones.length > 0 &&
    typeof roles.admin === "string" &&
    typeof roles.platform === "string" &&
    typeof roles.receiver === "string" &&
    Array.isArray(roles.approvers) &&
    Array.isArray(roles.serviceProviders) &&
    Array.isArray(roles.releaseSigners) &&
    Array.isArray(roles.disputeResolvers) &&
    typeof trustline.contractId === "string" &&
    typeof trustline.symbol === "string"
  );
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const allowedEmails = (process.env.TRUSTLESS_WORK_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (allowedEmails.length === 0) {
    return NextResponse.json(
      { error: "El administrador aún no ha habilitado cuentas para crear escrows." },
      { status: 503 },
    );
  }
  if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json(
      { error: "Tu cuenta no está habilitada para crear escrows." },
      { status: 403 },
    );
  }

  const apiKey = process.env.TRUSTLESS_WORK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El servidor aún no tiene configurada la integración de escrow." },
      { status: 503 },
    );
  }

  let body: unknown;
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "No se pudo leer la solicitud." }, { status: 400 });
  }
  if (new TextEncoder().encode(rawBody).byteLength > 128_000) {
    return NextResponse.json(
      { error: "La solicitud excede el tamaño permitido." },
      { status: 413 },
    );
  }
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 });
  }

  if (!isJsonRecord(body) || (body.action !== "build" && body.action !== "submit")) {
    return NextResponse.json({ error: "La acción de escrow no es válida." }, { status: 400 });
  }

  const client = new TrustlessWorkClient({ baseURL: development, apiKey });

  try {
    if (body.action === "build") {
      if (!isDeployPayload(body.payload)) {
        return NextResponse.json(
          { error: "Los datos del escrow están incompletos." },
          { status: 400 },
        );
      }

      const addresses = [
        body.payload.signer,
        body.payload.roles.admin,
        body.payload.roles.platform,
        body.payload.roles.receiver,
        ...body.payload.roles.approvers,
        ...body.payload.roles.serviceProviders,
        ...body.payload.roles.releaseSigners,
        ...body.payload.roles.disputeResolvers,
      ];
      try {
        addresses.forEach((address) => Address.fromString(String(address)));
        Address.fromString(body.payload.trustline.contractId);
      } catch {
        return NextResponse.json(
          { error: "Una de las direcciones Stellar no es válida." },
          { status: 400 },
        );
      }

      const built = await client.rest.deployEscrow(body.payload, "single-release");
      return NextResponse.json({
        unsignedXdr: built.unsignedXdr,
        contractId: built.contractId,
        txHash: built.txHash,
      });
    }

    if (typeof body.signedXdr !== "string" || body.signedXdr.length > 100_000) {
      return NextResponse.json({ error: "La transacción firmada no es válida." }, { status: 400 });
    }

    const result = await client.rest.sendTransaction(body.signedXdr);
    return NextResponse.json({
      txHash: result.txHash,
      ledger: result.ledger,
      contractId: result.contractId,
      code: result.code,
      message: result.message,
    });
  } catch (error: unknown) {
    const normalized = toTrustlessWorkError(error);
    const message =
      normalized instanceof TrustlessWorkApiError
        ? formatApiErrorMessage(normalized)
        : "Trustless Work no pudo completar la solicitud. Inténtalo de nuevo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
