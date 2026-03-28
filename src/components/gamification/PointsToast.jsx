import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { BADGES } from "./useGamification";

export default function PointsToast({ event, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, []);

  if (!event) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.8 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <Star className="w-5 h-5 text-yellow-300" />
          <div>
            <p className="font-semibold text-sm">+{event.points} points!</p>
            {event.newBadges?.length > 0 && (
              <p className="text-xs text-indigo-200">
                {event.newBadges.map(b => {
                  const badge = BADGES.find(bd => bd.id === b.id);
                  return badge ? `${badge.icon} ${badge.name}` : '';
                }).join(', ')} unlocked!
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}