"use client";

import { BellSimple, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import {
  loadOwnLotAnchorNotifications,
  markLotAnchorNotificationRead,
  type LotAnchorNotification,
} from "@/lib/lots/anchor-notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { stellarExplorerUrl, stellarNetwork } from "@/lib/stellar/network";

export function ProducerAnchorNotifications() {
  const [notifications, setNotifications] = useState<LotAnchorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      void Promise.resolve().then(() => {
        if (isMounted) setIsLoading(false);
      });
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function refresh() {
      const result = await loadOwnLotAnchorNotifications();
      if (!isMounted) return;
      setIsLoading(false);
      if (result.success) {
        setNotifications(result.notifications);
        setMessage("");
      } else {
        setMessage("No se pudieron cargar los avisos de anclaje de esta cuenta.");
      }
    }

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted || error || !data.user || data.user.is_anonymous) return;
      channel = supabase
        .channel(`lot-anchor-notifications-${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lot_anchor_notifications",
            filter: `recipient_id=eq.${data.user.id}`,
          },
          () => void refresh(),
        )
        .subscribe();
    });
    void refresh();

    return () => {
      isMounted = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  async function openNotification(notification: LotAnchorNotification) {
    if (!notification.read_at) {
      const saved = await markLotAnchorNotificationRead(notification.id);
      if (saved) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
          ),
        );
      }
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <>
      <button
        type="button"
        aria-label={`Avisos de anclaje${unreadCount ? `, ${unreadCount} sin leer` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="relative grid size-10 shrink-0 place-items-center rounded-md text-ink hover:bg-accent-soft focus-visible:outline-offset-2"
      >
        <BellSimple size={21} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-700 px-1 text-[10px] font-semibold leading-none text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,34rem)] overflow-y-auto rounded-md border border-line bg-white p-0 text-ink shadow-[0_24px_80px_-32px_rgba(25,51,50,0.5)] backdrop:bg-ink/50"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="mb-1 font-display text-xl font-medium">
                Anclajes de tus lotes
              </h2>
              <p className="mb-0 text-sm leading-5 text-gray-700">
                Avisos privados de anclajes confirmados en Stellar {stellarNetwork.label}.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar avisos de anclaje"
              onClick={() => setIsOpen(false)}
              className="grid size-9 shrink-0 place-items-center rounded-md border border-line hover:bg-paper"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {isLoading ? (
            <p className="mt-4 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              Consultando los anclajes de tus lotes…
            </p>
          ) : message ? (
            <p className="mt-4 mb-0 text-sm text-red-800" role="alert">
              {message}
            </p>
          ) : notifications.length === 0 ? (
            <p className="mt-4 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              Cuando se confirme un anclaje de tus lotes, el aviso aparecerá aquí.
            </p>
          ) : (
            <ol className="mt-4 grid gap-2">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`min-w-0 border-l-2 px-3 py-3 ${notification.read_at ? "border-line" : "border-accent bg-accent-soft/40"}`}
                >
                  <p className="mb-1 text-sm font-semibold text-ink">
                    Huella confirmada para {notification.product.toLocaleLowerCase("es")}
                  </p>
                  <p className="mb-2 text-xs text-gray-700">
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(notification.created_at))}
                  </p>
                  <p className="mb-2 break-all font-mono text-xs text-gray-700">
                    ID del lote: {notification.lot_id}
                  </p>
                  <a
                    href={stellarExplorerUrl("tx", notification.transaction_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => void openNotification(notification)}
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-accent underline underline-offset-2"
                  >
                    Ver transacción en Stellar Expert ({stellarNetwork.label})
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      </dialog>
    </>
  );
}
