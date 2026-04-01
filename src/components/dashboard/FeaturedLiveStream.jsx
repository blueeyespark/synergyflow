import { Radio, Eye } from "lucide-react";
import { motion } from "framer-motion";

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function FeaturedLiveStream({ stream, channel, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect?.(stream)}
      className="group cursor-pointer mb-8"
    >
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video hover:shadow-2xl transition-shadow">
        <img
          src={stream.thumbnail_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=675&fit=crop&sig=${stream.id}`}
          alt={stream.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* LIVE badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-bold">LIVE</span>
        </div>

        {/* Viewer count */}
        <div className="absolute top-4 right-4 bg-black/60 rounded-lg px-2.5 py-1 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-semibold">{formatViews(stream.viewers || 0)}</span>
        </div>

        {/* Channel info */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white">
            {channel?.channel_name?.charAt(0) || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg line-clamp-2 leading-snug">{stream.title}</h2>
            <p className="text-white/80 text-sm">{channel?.channel_name || "Streamer"} • {stream.category || "Live"}</p>
          </div>
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-5 ring-2 ring-white">
            <Radio className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}