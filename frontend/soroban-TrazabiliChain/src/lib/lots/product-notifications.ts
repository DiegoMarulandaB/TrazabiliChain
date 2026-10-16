import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const notificationProducts = [
  "Café orgánico",
  "Cacao orgánico",
  "Algodón orgánico",
] as const;

export type NotificationProduct = (typeof notificationProducts)[number];

export type ProductNotification = {
  id: string;
  lot_id: string;
  product: NotificationProduct;
  summary: string;
  created_at: string;
  read_at: string | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNotificationProduct(value: unknown): value is NotificationProduct {
  return typeof value === "string" && notificationProducts.includes(value as NotificationProduct);
}

function normalizeNotification(value: unknown): ProductNotification | null {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.lot_id !== "string" ||
    !isNotificationProduct(value.product) ||
    typeof value.summary !== "string" ||
    typeof value.created_at !== "string" ||
    (value.read_at !== null && typeof value.read_at !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    lot_id: value.lot_id,
    product: value.product,
    summary: value.summary,
    created_at: value.created_at,
    read_at: value.read_at,
  };
}

export async function saveProductNotificationPreference(product: string) {
  if (!isNotificationProduct(product)) {
    return false;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || data.user.is_anonymous) {
      return false;
    }

    const { error: saveError } = await supabase
      .from("product_notification_subscriptions")
      .upsert(
        { user_id: data.user.id, product, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    return !saveError;
  } catch {
    return false;
  }
}

export async function loadProductNotificationInbox(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { success: false, product: null, notifications: [] as ProductNotification[] };
  }

  try {
    const { data: preference, error: preferenceError } = await supabase
      .from("product_notification_subscriptions")
      .select("product")
      .eq("user_id", userId)
      .maybeSingle();
    if (preferenceError) {
      return { success: false, product: null, notifications: [] as ProductNotification[] };
    }

    const product =
      isObject(preference) && isNotificationProduct(preference.product) ? preference.product : null;
    if (!product) return { success: true, product: null, notifications: [] };

    const { data, error } = await supabase
      .from("product_notifications")
      .select("id,lot_id,product,summary,created_at,read_at")
      .eq("recipient_id", userId)
      .eq("product", product)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      return { success: false, product: null, notifications: [] as ProductNotification[] };
    }

    const rows: unknown[] = Array.isArray(data) ? data : [];
    return {
      success: true,
      product,
      notifications: rows
        .map(normalizeNotification)
        .filter((notification): notification is ProductNotification => notification !== null),
    };
  } catch {
    return { success: false, product: null, notifications: [] as ProductNotification[] };
  }
}

export async function setAllProductNotificationsRead(userId: string, product: NotificationProduct) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("product_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("product", product)
      .is("read_at", null);
    return !error;
  } catch {
    return false;
  }
}
