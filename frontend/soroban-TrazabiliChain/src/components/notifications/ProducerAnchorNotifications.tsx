"use client";

import { useEffect, useState } from "react";
import {
  loadOwnLotAnchorNotifications,
  markLotAnchorNotificationRead,
  type LotAnchorNotification,
} from "@/lib/lots/anchor-notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProducerAnchorNotifications() {
  const [notifications, setNotifications] = useState<LotAnchorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

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
    <section
      aria-labelledby="producer-anchor-notifications-title"
      className="my-6 border-y border-line py-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="producer-anchor-notifications-title"
          className="mb-0 font-display text-xl font-medium text-ink"
        >
          Anclajes de tus lotes
        </h2>
        {unreadCount > 0 && (
          <span
            className="text-xs font-semibold text-accent"
            aria-label={`${unreadCount} avisos nuevos`}
          >
            {unreadCount} {unreadCount === 1 ? "nuevo" : "nuevos"}
          </span>
        )}
      </div>
      {isLoading ? (
        <p className="mt-3 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
          Consultando los anclajes de tus lotes…
        </p>
      ) : message ? (
        <p className="mt-3 mb-0 text-sm text-red-800" role="alert">
          {message}
        </p>
      ) : notifications.length === 0 ? (
        <p className="mt-3 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
          Cuando se confirme un anclaje de tus lotes, el aviso aparecerá aquí.
        </p>
      ) : (
        <ol className="mt-3 grid gap-2">
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
                href={`https://stellar.expert/explorer/testnet/tx/${notification.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void openNotification(notification)}
                className="min-h-10 inline-flex items-center text-sm font-semibold text-accent underline underline-offset-2"
              >
                Ver transacción en Stellar Expert (Testnet)
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
