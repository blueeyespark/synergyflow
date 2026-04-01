import { Radio, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function LiveSidebar({ liveChannels, onSelectStream }) {
  const [scrollPos, setScrollPos] = useState(0);

  if (liveChannels.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live Now</h3>
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
            {liveChannels.length}
          </span>
        </div>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {liveChannels.map((stream, i) => (
          <motion.button
            key={stream.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectStream?.(stream)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {stream.channel_name?.charAt(0) || "C"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border border-white dark:border-zinc-900 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {stream.channel_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{stream.category || "Live"}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1 mt-0.5">
                <Radio className="w-2.5 h-2.5 text-red-500" /> {formatViews(stream.viewers || 0)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}