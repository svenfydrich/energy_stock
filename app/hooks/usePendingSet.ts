"use client";

import { useState, useCallback } from "react";

export function usePendingSet() {
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const mark = useCallback((id: number, add: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (add) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const isPending = useCallback(
    (id: number) => pendingIds.has(id),
    [pendingIds]
  );

  return { pendingIds, mark, isPending };
}
