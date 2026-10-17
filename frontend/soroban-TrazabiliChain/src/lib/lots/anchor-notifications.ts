import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type LotAnchorNotification = {
  id: string;
  lot_id: string;
  product: string;
  transaction_hash: string;
  created_at: string;
  read_at: string | null;
};

function normalizeNotification(value: unknown): LotAnchorNotification | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("lot_id" in value) ||
    typeof value.lot_id !== "string" ||
    !("product" in value) ||
    typeof value.product !== "string" ||
    !("transaction_hash" in value) ||
    typeof value.transaction_hash !== "string" ||
    !("created_at" in value) ||
    typeof value.created_at !== "string" ||
    !("read_at" in value) ||
    (value.read_at !== null && typeof value.read_at !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    lot_id: value.lot_id,
    product: value.product,
    transaction_hash: value.transaction_hash,
    created_at: value.created_at,
    read_at: value.read_at,
  };
}

export async function notifyOwnerOfLotAnchor(lotId: string, transactionHash: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("notify_lot_owner_of_anchor", {
      p_lot_id: lotId,
      p_transaction_hash: transactionHash,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function loadOwnLotAnchorNotifications() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, notifications: [] as LotAnchorNotification[] };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user || user.is_anonymous) {
      return { success: false, notifications: [] as LotAnchorNotification[] };
    }

    const { data, error } = await supabase
      .from("lot_anchor_notifications")
      .select("id,lot_id,product,transaction_hash,created_at,read_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { success: false, notifications: [] as LotAnchorNotification[] };

    return {
      success: true,
      notifications: (data ?? [])
        .map(normalizeNotification)
        .filter((item): item is LotAnchorNotification => item !== null),
    };
  } catch {
    return { success: false, notifications: [] as LotAnchorNotification[] };
  }
}

export async function markLotAnchorNotificationRead(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("lot_anchor_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
    return !error;
  } catch {
    return false;
  }
}
