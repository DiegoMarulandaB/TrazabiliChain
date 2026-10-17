"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteWorkDraft,
  loadWorkDraft,
  saveWorkDraft,
  type DemoRole,
} from "@/lib/lots/lot-storage";

export function useWorkDraft<T extends Record<string, unknown>>({
  userId,
  role,
  product,
  draftKey,
  payload,
  onRestore,
  enabled = true,
}: {
  userId: string | null;
  role: DemoRole;
  product: string;
  draftKey: string;
  payload: T;
  onRestore: (draft: Partial<T>) => void;
  enabled?: boolean;
}) {
  const identity = `${userId ?? ""}:${role}:${product}:${draftKey}`;
  const restoreRef = useRef(onRestore);
  const serializedPayload = JSON.stringify(payload);
  const [hydratedIdentity, setHydratedIdentity] = useState<string | null>(null);
  const isReady = !userId || !enabled || hydratedIdentity === identity;

  useEffect(() => {
    restoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    let isMounted = true;
    if (!userId || !enabled) return;

    void loadWorkDraft<T>({ userId, role, product, draftKey }).then((draft) => {
      if (!isMounted) return;
      if (draft) restoreRef.current(draft);
      setHydratedIdentity(identity);
    });

    return () => {
      isMounted = false;
    };
  }, [draftKey, enabled, identity, product, role, userId]);

  useEffect(() => {
    if (!userId || !enabled || !isReady) return;

    const timer = window.setTimeout(() => {
      try {
        const draft = JSON.parse(serializedPayload) as T;
        void saveWorkDraft({ userId, role, product, draftKey }, draft);
      } catch {
        // Ignore non-serializable draft values; form controls remain usable.
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [draftKey, enabled, isReady, product, role, serializedPayload, userId]);

  async function clearDraft() {
    if (!userId) return;
    await deleteWorkDraft({ userId, role, product, draftKey });
  }

  return { isReady, clearDraft };
}
