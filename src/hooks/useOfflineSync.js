import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const QUEUE_KEY = "planify_offline_queue";

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}

function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(() => getQueue().length);
  const [syncing, setSyncing] = useState(false);

  const refreshQueueSize = () => setQueueSize(getQueue().length);

  // Queue an operation for later
  const queueOperation = useCallback((entity, operation, id, data) => {
    const q = getQueue();
    q.push({ entity, operation, id, data, timestamp: Date.now() });
    saveQueue(q);
    refreshQueueSize();
  }, []);

  // Try to flush queue
  const flushQueue = useCallback(async () => {
    const q = getQueue();
    if (q.length === 0) return;
    setSyncing(true);
    const failed = [];
    for (const item of q) {
      try {
        const entityObj = base44.entities[item.entity];
        if (!entityObj) continue;
        if (item.operation === "create") await entityObj.create(item.data);
        else if (item.operation === "update") await entityObj.update(item.id, item.data);
        else if (item.operation === "delete") await entityObj.delete(item.id);
      } catch {
        failed.push(item);
      }
    }
    saveQueue(failed);
    refreshQueueSize();
    setSyncing(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); flushQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, [flushQueue]);

  return { isOnline, queueSize, syncing, queueOperation, flushQueue };
}