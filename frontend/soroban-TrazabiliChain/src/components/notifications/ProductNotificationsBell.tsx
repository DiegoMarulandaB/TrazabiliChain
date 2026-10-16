"use client";

import { BellSimple, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  loadProductNotificationInbox,
  notificationProducts,
  saveProductNotificationPreference,
  setAllProductNotificationsRead,
  type ProductNotification,
  type NotificationProduct,
} from "@/lib/lots/product-notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProductNotificationsBell() {
  const supabase = getSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [inboxUserId, setInboxUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ProductNotification[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<NotificationProduct | "">("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const activeNotifications = inboxUserId === userId ? notifications : [];
  const activeProduct = inboxUserId === userId ? selectedProduct : "";
  const unreadCount = activeNotifications.filter((notification) => !notification.read_at).length;

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setUserId(data.user && !data.user.is_anonymous ? data.user.id : null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session && !session.user.is_anonymous ? session.user.id : null);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const activeUserId = userId;

    let isMounted = true;
    async function refreshInbox() {
      setIsLoading(true);
      const inbox = await loadProductNotificationInbox(activeUserId);
      if (!isMounted) return;
      setIsLoading(false);
      if (!inbox.success) {
        setMessage("No se pudieron cargar los avisos. Comprueba la migración y tu conexión.");
        return;
      }
      setSelectedProduct(inbox.product ?? "");
      setNotifications(inbox.notifications);
      setInboxUserId(activeUserId);
      setMessage("");
    }

    void refreshInbox();
    const channel = supabase
      .channel(`product-notifications-${activeUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "product_notifications",
          filter: `recipient_id=eq.${activeUserId}`,
        },
        () => void refreshInbox(),
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  async function changeProductPreference(product: string) {
    setIsSavingPreference(true);
    setMessage("");
    const saved = await saveProductNotificationPreference(product);
    setIsSavingPreference(false);
    if (!saved) {
      setMessage("No se pudo actualizar la preferencia de notificaciones.");
      return;
    }
    setSelectedProduct(product as NotificationProduct);
    if (userId) {
      const inbox = await loadProductNotificationInbox(userId);
      if (inbox.success) {
        setNotifications(inbox.notifications);
        setInboxUserId(userId);
      }
    }
    setMessage(`Recibirás avisos de ${product.toLocaleLowerCase("es")}.`);
  }

  async function markAllAsRead() {
    if (!userId || !activeProduct || unreadCount === 0) return;
    const saved = await setAllProductNotificationsRead(userId, activeProduct);
    if (!saved) {
      setMessage("No se pudieron marcar los avisos como leídos.");
      return;
    }
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notification.product === activeProduct
          ? { ...notification, read_at: notification.read_at ?? readAt }
          : notification,
      ),
    );
    setMessage("Avisos marcados como leídos.");
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="relative grid size-10 shrink-0 place-items-center rounded-md text-ink hover:bg-accent-soft focus-visible:outline-offset-2"
      >
        <BellSimple size={21} weight="regular" aria-hidden="true" />
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
        aria-describedby={descriptionId}
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
                Notificaciones
              </h2>
              <p id={descriptionId} className="mb-0 text-sm leading-5 text-gray-700">
                Avisos de lotes publicados para el cultivo que tienes seleccionado.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar notificaciones"
              onClick={() => setIsOpen(false)}
              className="grid size-9 shrink-0 place-items-center rounded-md border border-line hover:bg-paper"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {!userId ? (
            <p className="mt-5 mb-0 text-sm text-gray-700">
              Inicia sesión para recibir avisos de productos.{" "}
              <Link
                href="/registros"
                onClick={() => setIsOpen(false)}
                className="font-semibold text-accent underline underline-offset-2"
              >
                Ir al acceso
              </Link>
            </p>
          ) : (
            <>
              <div className="mt-5 grid gap-1.5">
                <label htmlFor="notification-product" className="text-sm font-semibold">
                  Cultivo de interés
                </label>
                <select
                  id="notification-product"
                  value={activeProduct}
                  disabled={isSavingPreference}
                  onChange={(event) => void changeProductPreference(event.target.value)}
                  className="min-h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-sm disabled:opacity-60"
                >
                  <option value="">Selecciona un cultivo</option>
                  {notificationProducts.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <h3 className="mb-0 text-sm font-semibold">Avisos recientes</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    className="min-h-9 text-xs font-semibold text-accent underline underline-offset-2"
                  >
                    Marcar como leídos
                  </button>
                )}
              </div>
              {isLoading ? (
                <p className="mt-3 mb-0 text-sm text-gray-700" role="status">
                  Cargando avisos…
                </p>
              ) : activeNotifications.length > 0 ? (
                <ol className="mt-3 grid gap-2">
                  {activeNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`min-w-0 border-l-2 px-3 py-2 ${notification.read_at ? "border-line" : "border-accent bg-accent-soft/40"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="mb-1 text-sm font-semibold">
                            Nuevo lote · {notification.product}
                          </p>
                          <p className="mb-1 text-sm text-gray-700">{notification.summary}</p>
                          <time
                            className="text-xs text-gray-700"
                            dateTime={notification.created_at}
                          >
                            {new Intl.DateTimeFormat("es-CO", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(notification.created_at))}
                          </time>
                        </div>
                        {!notification.read_at && (
                          <span
                            className="mt-1 size-2 shrink-0 rounded-full bg-accent"
                            aria-label="Sin leer"
                          />
                        )}
                      </div>
                      <Link
                        href={`/lote/${encodeURIComponent(notification.lot_id)}`}
                        onClick={() => setIsOpen(false)}
                        className="mt-2 inline-block text-xs font-semibold text-accent underline underline-offset-2"
                      >
                        Abrir ficha pública
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 mb-0 text-sm text-gray-700">
                  No hay avisos para mostrar. Solo se notifican lotes públicos del cultivo
                  seleccionado.
                </p>
              )}
            </>
          )}
          {message && (
            <p className="mt-3 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
