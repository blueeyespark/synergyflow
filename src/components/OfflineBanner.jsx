import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function OfflineBanner() {
  const { isOnline, queueSize, syncing, flushQueue } = useOfflineSync();

  return (
    <AnimatePresence>
      {(!isOnline || queueSize > 0) && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className={`fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium ${
            !isOnline ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
          }`}
        >
          {!isOnline ? (
            <><WifiOff className="w-4 h-4" /> You're offline — changes will sync when reconnected</>
          ) : (
            <>
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {syncing ? "Syncing..." : `${queueSize} pending change${queueSize > 1 ? 's' : ''}`}
              {!syncing && <button onClick={flushQueue} className="underline ml-1">Sync now</button>}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}