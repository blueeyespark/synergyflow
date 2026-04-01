import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Home, Flame, Music, Gamepad2, Tv, Radio, BookOpen, Trophy, ChevronDown, ThumbsUp, Clock, ListVideo, Download, History, PlaySquare, ShoppingBag, Menu, Search, Bell, Upload, Mic, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import AIContentAdvisor from "@/components/dashboard/AIContentAdvisor";

const CATEGORIES = ["All", "Gaming", "Music", "Live", "Mixes", "Reaction videos", "Simulation", "Minecraft", "Anime", "Shorts", "Mods", "Tutorials"];

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Home", active: true },
  { icon: Flame, label: "Shorts" },
  { icon: PlaySquare, label: "Subscriptions" },
];

const SIDEBAR_YOU = [
  { icon: History, label: "History" },
  { icon: ListVideo, label: "Playlists" },
  { icon: Clock, label: "Watch later" },
  { icon: ThumbsUp, label: "Liked videos" },
  { icon: PlaySquare, label: "Your videos" },
  { icon: Download, label: "Downloads" },
];

const MOCK_SUBSCRIPTIONS = [
  { name: "Toptop King", avatar: "T", color: "bg-red-500" },
  { name: "Ruby Reactions", avatar: "R", color: "bg-pink-500" },
  { name: "Mykora", avatar: "M", color: "bg-purple-500" },
  { name: "HalaCG", avatar: "H", color: "bg-blue-500" },
  { name: "Markiplier", avatar: "M", color: "bg-red-600" },
  { name: "Liden XII", avatar: "L", color: "bg-green-500" },
  { name: "Steradiye", avatar: "S", color: "bg-orange-500" },
];

const EXPLORE_ITEMS = [
  { icon: Flame, label: "Trending" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Music, label: "Music" },
  { icon: Gamepad2, label: "Gaming" },
  { icon: Tv, label: "Films" },
  { icon: Radio, label: "Live" },
  { icon: BookOpen, label: "Learning" },
  { icon: Trophy, label: "Sports" },
];

function formatViews(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n;
}

function timeAgo(dateStr) {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? "s" : ""} ago`;
}

function formatDuration(secs) {
  if (!secs) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function VideoCard({ video, channel }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {video.duration_seconds > 0 && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
        {video.status === "live" && (
          <span className="absolute bottom-1.5 right-1.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">LIVE</span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
          {channel?.channel_name?.charAt(0) || "C"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-snug mb-0.5">{video.title}</h3>
          <p className="text-xs text-zinc-400 truncate">{channel?.channel_name || "Creator"}</p>
          <p className="text-xs text-zinc-400">
            {formatViews(video.view_count || 0)} views • {timeAgo(video.published_date || video.created_date)}
          </p>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white p-1 flex-shrink-0">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ShortCard({ video }) {
  return (
    <div className="group cursor-pointer flex-shrink-0 w-32 sm:w-40 md:w-44">
      <div className="relative aspect-[9/16] bg-zinc-800 rounded-xl overflow-hidden mb-2">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1536240478700-b869ad10a2ab?w=200&h=356&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium line-clamp-2 leading-tight">{video.title}</p>
      </div>
      <p className="text-xs text-zinc-400 px-1">{formatViews(video.view_count || 0)} views</p>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMoreSubs, setShowMoreSubs] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.filter({ visibility: "public" }, "-created_date", 40),
    staleTime: 5 * 60 * 1000,
  });

  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

  const mainVideos = videos.filter(v => v.status !== "deleted" && v.status !== "uploading");
  const shorts = mainVideos.filter(v => v.duration_seconds > 0 && v.duration_seconds < 90);
  const regularVideos = mainVideos.filter(v => !v.duration_seconds || v.duration_seconds >= 60);

  const filteredVideos = activeCategory === "All" ? regularVideos
    : activeCategory === "Live" ? regularVideos.filter(v => v.status === "live" || v.is_live_vod)
    : regularVideos.filter(v => v.category?.toLowerCase().includes(activeCategory.toLowerCase()) || v.tags?.some(t => t.toLowerCase().includes(activeCategory.toLowerCase())));

  const displayVideos = filteredVideos.length > 0 ? filteredVideos : regularVideos;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar — desktop only */}
      {sidebarOpen && (
        <aside className="hidden md:flex flex-col w-60 flex-shrink-0 fixed top-16 left-0 bottom-0 overflow-y-auto bg-zinc-950 py-3 px-2 z-40">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.label} className={`flex items-center gap-4 px-3 py-2 rounded-xl text-sm font-medium w-full text-left transition-colors ${item.active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          ))}

          <hr className="border-zinc-800 my-3" />

          <p className="text-sm font-semibold text-white px-3 mb-1">You</p>
          {SIDEBAR_YOU.map(item => (
            <button key={item.label} className="flex items-center gap-4 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          ))}

          <hr className="border-zinc-800 my-3" />

          <p className="text-sm font-semibold text-white px-3 mb-1">Subscriptions</p>
          {(showMoreSubs ? MOCK_SUBSCRIPTIONS : MOCK_SUBSCRIPTIONS.slice(0, 5)).map(sub => (
            <button key={sub.name} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
              <div className={`w-6 h-6 rounded-full ${sub.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {sub.avatar}
              </div>
              <span className="truncate">{sub.name}</span>
            </button>
          ))}
          <button onClick={() => setShowMoreSubs(!showMoreSubs)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
            <ChevronDown className={`w-5 h-5 transition-transform ${showMoreSubs ? "rotate-180" : ""}`} />
            {showMoreSubs ? "Show less" : "Show more"}
          </button>

          <hr className="border-zinc-800 my-3" />

          <p className="text-sm font-semibold text-white px-3 mb-1">Explore</p>
          {EXPLORE_ITEMS.map(item => (
            <button key={item.label} className="flex items-center gap-4 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </aside>
      )}

      {/* Main */}
      <main className={`flex-1 min-w-0 transition-all ${sidebarOpen ? "md:ml-60" : ""} flex`}>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Category chips */}
          <div className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 sm:px-4 pb-20 md:pb-8 space-y-6 sm:space-y-8">
            {/* Shorts Section */}
            {shorts.length > 0 && (activeCategory === "All" || activeCategory === "Shorts") && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-red-600 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-black">▶</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">Shorts</h2>
                  <MoreVertical className="w-5 h-5 text-zinc-400 ml-auto cursor-pointer hover:text-white" />
                </div>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                  {shorts.slice(0, 10).map(v => <ShortCard key={v.id} video={v} />)}
                </div>
              </section>
            )}

            {/* Main Video Grid */}
            {displayVideos.length > 0 ? (
              <section>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {displayVideos.map((video, i) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <VideoCard video={video} channel={channelMap[video.channel_id]} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <PlaySquare className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No videos yet</h3>
                <p className="text-zinc-400 text-sm max-w-xs">Upload videos from the Content Production tab to see them here</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Advisor Panel — desktop right sidebar */}
        <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 border-l border-zinc-800 px-4 pt-20 pb-8 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-black font-black text-xs">P</span>
            </div>
            <span className="text-sm font-bold text-white">Planify AI</span>
          </div>
          <AIContentAdvisor videos={displayVideos} channels={channels} user={user} />
        </aside>
      </main>
    </div>
  );
}