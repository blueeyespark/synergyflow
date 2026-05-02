import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Music, ChevronUp, ChevronDown, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function ShortPlayer({ video, channel, isActive, onLike, liked }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {video.video_url ? (
        <video
          ref={videoRef}
          src={video.video_url}
          loop
          playsInline
          muted={false}
          className="h-full w-full object-cover"
          poster={video.thumbnail_url}
        />
      ) : (
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1536240478700-b869ad10a2ab?w=400&h=700&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="h-full w-full object-cover"
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-center">
        <span className="text-white font-bold text-base">Shorts</span>
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white overflow-hidden">
          {channel?.avatar_url ? (
            <img src={channel.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
              {channel?.channel_name?.charAt(0) || "C"}
            </div>
          )}
        </div>

        <button onClick={() => onLike(video.id)} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-110 ${liked ? "scale-110" : ""}`}>
            <Heart className={`w-7 h-7 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
          </div>
          <span className="text-white text-xs font-semibold">{formatViews((video.like_count || 0) + (liked ? 1 : 0))}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold">{formatViews(video.comment_count || 0)}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold">Share</span>
        </button>

        <div className="w-10 h-10 rounded-full bg-black border-2 border-white animate-spin-slow flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-3 right-16">
        <p className="text-white font-semibold text-sm mb-1">@{channel?.channel_name || "creator"}</p>
        <p className="text-white/90 text-sm line-clamp-2">{video.title}</p>
        {video.tags?.length > 0 && (
          <p className="text-white/70 text-xs mt-1">{video.tags.slice(0, 3).map(t => `#${t}`).join(" ")}</p>
        )}
      </div>
    </div>
  );
}

export default function ShortsPage({ onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState({});
  const containerRef = useRef(null);
  const touchStartY = useRef(null);
  const navigate = useNavigate();

  const { data: videos = [] } = useQuery({
    queryKey: ["shorts"],
    queryFn: () => base44.entities.Video.list("-created_date", 50),
    select: (data) => data.filter(v => v.status !== "deleted" && v.duration_seconds > 0 && v.duration_seconds < 90),
    staleTime: 5 * 60 * 1000,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
  const shorts = videos;

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, shorts.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    touchStartY.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 30) goNext();
    else if (e.deltaY < -30) goPrev();
  };

  const toggleLike = (id) => setLikes(prev => ({ ...prev, [id]: !prev[id] }));

  if (shorts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-lg font-semibold mb-2">No Shorts yet</p>
          <p className="text-sm text-white/60">Upload short videos (under 90s) to see them here</p>
          {onClose && <button onClick={onClose} className="mt-4 text-white/80 underline text-sm">← Go back</button>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Back button */}
      <button onClick={() => navigate("/")} className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white transition-colors flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Close button (if onClose provided) */}
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 rounded-full p-2 text-white">
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Navigation arrows */}
      <button
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="absolute left-1/2 -translate-x-1/2 top-16 z-50 bg-black/40 rounded-full p-2 text-white disabled:opacity-20"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <button
        onClick={goNext}
        disabled={currentIndex === shorts.length - 1}
        className="absolute left-1/2 -translate-x-1/2 bottom-16 z-50 bg-black/40 rounded-full p-2 text-white disabled:opacity-20"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      {/* Progress dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1">
        {shorts.slice(Math.max(0, currentIndex - 3), Math.min(shorts.length, currentIndex + 4)).map((_, i) => {
          const absIndex = Math.max(0, currentIndex - 3) + i;
          return (
            <div key={absIndex} className={`rounded-full transition-all ${absIndex === currentIndex ? "w-1.5 h-4 bg-white" : "w-1 h-1 bg-white/40"}`} />
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full h-full"
        >
          <ShortPlayer
            video={shorts[currentIndex]}
            channel={channelMap[shorts[currentIndex].channel_id]}
            isActive={true}
            onLike={toggleLike}
            liked={likes[shorts[currentIndex].id] || false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}