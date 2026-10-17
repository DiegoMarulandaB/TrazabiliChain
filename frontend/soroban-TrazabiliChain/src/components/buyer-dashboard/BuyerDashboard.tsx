"use client";

import { useMemo, useState } from "react";
import { LotCharacteristics } from "@/components/lot-characteristics/LotCharacteristics";
import { LotJourney } from "@/components/lot-journey/LotJourney";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import type { LotRecord } from "@/lib/lots/lot-storage";

export function BuyerDashboard({
  records,
  draftUserId,
  product,
}: {
  records: LotRecord[];
  draftUserId: string | null;
  product: string;
}) {
  const [query, setQuery] = useState("");
  const [declaredValidOnly, setDeclaredValidOnly] = useState(false);
  const buyerDraft = useWorkDraft({
    userId: draftUserId,
    role: "b2bBuyer",
    product,
    draftKey: "buyer-search",
    payload: { query, declaredValidOnly },
    onRestore: (draft) => {
      if (draft.query !== undefined) setQuery(draft.query);
      if (draft.declaredValidOnly !== undefined) setDeclaredValidOnly(draft.declaredValidOnly);
    },
  });
  const today = new Date().toISOString().slice(0, 10);
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    const looksLikeLotPrefix = /^[0-9a-f]{8}[0-9a-f-]{0,28}$/.test(normalizedQuery);
    return records.filter((record) => {
      const matchesId =
        looksLikeLotPrefix && record.id.toLocaleLowerCase("es").startsWith(normalizedQuery);
      const matchesText = [record.product, record.origin, record.organization].some((value) =>
        value.toLocaleLowerCase("es").includes(normalizedQuery),
      );
      const hasDeclaredCurrentCertificate = record.certificates.some(
        (certificate) =>
          certificate.issuedAt <= today &&
          (!certificate.validUntil || certificate.validUntil >= today),
      );
      return (
        (!normalizedQuery || matchesId || (!looksLikeLotPrefix && matchesText)) &&
        (!declaredValidOnly || hasDeclaredCurrentCertificate)
      );
    });
  }, [declaredValidOnly, query, records, today]);

  return (
    <section aria-labelledby="buyer-title">
      <h2 id="buyer-title" className="font-display text-2xl font-medium text-ink">
        Consulta de abastecimiento
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-700">
        Busca por los primeros 8 caracteres del ID del QR, producto, origen u organización. Solo se
        consultan los lotes permitidos para tu cuenta.
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <div className="grid min-w-60 flex-1 gap-1.5">
          <label htmlFor="buyer-search" className="text-sm font-semibold text-ink">
            Buscar ID del QR, producto, origen u organización
          </label>
          <input
            id="buyer-search"
            type="search"
            value={query}
            disabled={!buyerDraft.isReady}
            onChange={(event) => setQuery(event.target.value)}
            aria-describedby="buyer-search-help"
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <p id="buyer-search-help" className="mb-0 text-xs leading-5 text-gray-700">
            Para buscar por ID, ingresa al menos sus primeros 8 caracteres hexadecimales.
          </p>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={declaredValidOnly}
            disabled={!buyerDraft.isReady}
            onChange={(event) => setDeclaredValidOnly(event.target.checked)}
            className="size-4 accent-accent"
          />
          Solo certificados con vigencia declarada actual
        </label>
      </div>
      {!buyerDraft.isReady && (
        <p className="mt-2 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
          Restaurando tu búsqueda guardada…
        </p>
      )}
      <p className="mt-4 text-xs text-gray-700" aria-live="polite">
        {filteredRecords.length} de {records.length} lotes
      </p>
      <div className="mt-3 grid gap-3">
        {filteredRecords.map((record) => (
          <article key={record.id} className="rounded-md border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="mb-1 font-semibold text-ink">{record.product}</h3>
                <p className="mb-0 text-sm text-gray-700">
                  {record.origin} · {record.organization}
                </p>
              </div>
              <span className="text-xs text-gray-700">
                {record.certificates.length}{" "}
                {record.certificates.length === 1 ? "evidencia" : "evidencias"}
              </span>
            </div>
            {record.characteristics && (
              <div className="mt-3">
                <LotCharacteristics value={record.characteristics} />
              </div>
            )}
            <LotJourney record={record} showLocalEvidence />
            <p className="mt-3 mb-0 text-xs text-gray-700">
              Los datos y emisores son declaraciones; la vigencia no constituye una validación del
              certificado.
            </p>
          </article>
        ))}
        {filteredRecords.length === 0 && (
          <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-gray-700">
            No hay lotes que coincidan con estos filtros.
          </p>
        )}
      </div>
    </section>
  );
}
