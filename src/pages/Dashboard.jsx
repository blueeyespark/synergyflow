import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Flame, Music, Gamepad2, Tv, Radio, BookOpen, Trophy,
  ChevronDown, ThumbsUp, Clock, ListVideo, Download, History,
  PlaySquare, ShoppingBag, MoreVertical, Search, X, TrendingUp,
  Users, Zap, Star, PlusCircle, Menu, BarChart2, Sparkles, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import AIContentAdvisor from "@/components/dashboard/AIContentAdvisor";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";
import FeaturedLiveStream from "@/components/dashboard/FeaturedLiveStream";
import LiveSidebar from "@/components/dashboard/LiveSidebar";
import SaveToPlaylistMenu from "@/components/dashboard/SaveToPlaylistMenu";

const CATEGORIES = ["All", "Gaming", "Music", "Live", "Clips", "Anime", "Tutorials", "Reaction", "Esports", "Mods", "Shorts"];
const MAIN_TABS = ["Home", "Following"];

const SIDEBAR_NAV = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Flame, label: "Trending", to: "/" },
  { icon: Radio, label: "Live", to: "/Live" },
  { icon: PlaySquare, label: "Clips", to: "/Shorts" },
];

const SIDEBAR_LIBRARY = [
  { icon: History, label: "History", to: "/" },
  { icon: ListVideo, label: "Playlists", to: "/" },
  { icon: Clock, label: "Watch Later", to: "/" },
  { icon: ThumbsUp, label: "Liked", to: "/" },
  { icon: Download, label: "Downloads", to: "/" },
];



function formatViews(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function VideoCard({ video, channel, onClick, watched, isTrending, rank, user }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  return (
    <motion.div
      className="group cursor-pointer relative"
      onClick={() => onClick(video)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-[#060d18]">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Watch progress */}
        {watched && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className="h-full bg-[#1e78ff] w-1/3" />
          </div>
        )}

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-lg">
            {formatDuration(video.duration_seconds)}
          </span>
        )}

        {/* LIVE badge */}
        {video.status === "live" && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        )}

        {/* Trending rank */}
        {isTrending && rank && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-xl bg-[#1e78ff] text-white text-xs font-black flex items-center justify-center shadow-lg shadow-blue-900/50">
            #{rank}
          </div>
        )}

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[9px] border-b-[9px] border-l-[16px] border-transparent border-l-white ml-1" />
          </div>
        </div>

        {/* 3-dot menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-[#060d18] border border-blue-900/40 rounded-xl shadow-xl shadow-black/50 w-44 py-1 text-sm">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-900/20 text-blue-200 transition-colors"
                onClick={() => { setShowPlaylistMenu(true); setShowMenu(false); }}
              >
                <ListVideo className="w-4 h-4" /> Save to playlist
              </button>
            </div>
          )}
          {showPlaylistMenu && user?.email && (
            <SaveToPlaylistMenu videoId={video.id} userEmail={user.email} onClose={() => setShowPlaylistMenu(false)} />
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="flex gap-2.5 px-0.5">
        <Link to={channel ? `/Channel?id=${channel.id}` : "#"} onClick={e => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black ring-2 ring-transparent hover:ring-[#1e78ff]/60 transition-all"
            style={{ background: `linear-gradient(135deg, #1e78ff, #a855f7)` }}
          >
            {channel?.channel_name?.charAt(0) || "C"}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#e8f4ff] line-clamp-2 leading-snug mb-0.5">{video.title}</h3>
          <Link to={channel ? `/Channel?id=${channel.id}` : "#"} onClick={e => e.stopPropagation()} className="text-xs text-blue-400/60 hover:text-blue-300 truncate block transition-colors">{channel?.channel_name || "Creator"}</Link>
          <p className="text-xs text-blue-400/40 mt-0.5">{formatViews(video.view_count)} views · {timeAgo(video.published_date || video.created_date)}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ClipCard({ video, onClick }) {
  return (
    <div className="group cursor-pointer flex-shrink-0 w-36 sm:w-40" onClick={() => onClick(video)}>
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-2 bg-[#060d18]">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1536240478700-b869ad10a2ab?w=200&h=356&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <p className="absolute bottom-3 left-3 right-3 text-xs text-white font-semibold line-clamp-2 leading-tight">{video.title}</p>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[12px] border-transparent border-l-white ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-xs text-blue-400/50 px-1 truncate">{formatViews(video.view_count)} views</p>
    </div>
  );
}

function PlaylistsSidebarSection({ userEmail, btnBase, btnIdle }) {
  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists", userEmail],
    queryFn: () => base44.entities.Playlist.filter({ owner_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
  if (playlists.length === 0) return <p className="text-xs text-blue-400/30 px-3 py-1">No playlists yet</p>;
  return (
    <>
      {playlists.slice(0, 5).map(p => (
        <button key={p.id} className={`${btnBase} ${btnIdle}`}>
          <ListVideo className="w-4 h-4 flex-shrink-0 text-blue-400/50" />
          <span className="truncate text-xs">{p.name}</span>
          <span className="ml-auto text-xs text-blue-400/30">{p.video_ids?.length || 0}</span>
        </button>
      ))}
    </>
  );
}

function HubCards() {
  const cards = [
    { to: "/Live", icon: Radio, label: "Live Streams", desc: "Watch right now", gradient: "from-red-500 to-rose-600", glow: "shadow-red-900/40" },
    { to: "/Shorts", icon: Zap, label: "Clips & Shorts", desc: "Bite-sized content", gradient: "from-[#a855f7] to-[#6366f1]", glow: "shadow-purple-900/40" },
    { to: "/Channel", icon: Users, label: "My Channel", desc: "Manage your brand", gradient: "from-[#1e78ff] to-[#06b6d4]", glow: "shadow-blue-900/40" },
    { to: "/StreamerDashboard", icon: Sparkles, label: "Go Live", desc: "Start broadcasting", gradient: "from-[#f59e0b] to-[#f97316]", glow: "shadow-orange-900/40" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((c) => (
        <Link key={c.to} to={c.to}>
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer border border-white/5 bg-[#060d18] hover:border-white/10 transition-all shadow-lg ${c.glow}`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3 shadow-lg`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-sm text-[#e8f4ff]">{c.label}</p>
            <p className="text-xs text-blue-400/50 mt-0.5">{c.desc}</p>
            {/* Subtle glow in corner */}
            <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-xl`} />
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState("Home");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showMoreFollowing, setShowMoreFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchHistory, setWatchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("watchHistory") || "[]"); } catch { return []; }
  });
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 60),
    staleTime: 5 * 60 * 1000,
  });

  const { data: mySubscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ subscriber_email: user.email, status: "active" }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
  const subscribedChannelIds = new Set(mySubscriptions.map(s => s.channel_id));
  const liveStreams = channels.filter(c => c.is_live).map(c => ({ ...c, viewers: Math.floor(Math.random() * 5000) + 100 }));
  const featuredLive = liveStreams[0];

  const mainVideos = videos.filter(v => v.status !== "deleted" && v.status !== "uploading");
  const clips = mainVideos.filter(v => v.duration_seconds > 0 && v.duration_seconds < 90);
  const regularVideos = mainVideos.filter(v => !v.duration_seconds || v.duration_seconds >= 60);

  const subVideos = mainVideos
    .filter(v => subscribedChannelIds.has(v.channel_id))
    .sort((a, b) => new Date(b.published_date || b.created_date) - new Date(a.published_date || a.created_date));

  const handleOpenVideo = (video) => {
    setSelectedVideo(video);
    const newHistory = [video.id, ...watchHistory.filter(id => id !== video.id)].slice(0, 50);
    setWatchHistory(newHistory);
    localStorage.setItem("watchHistory", JSON.stringify(newHistory));
    base44.entities.Video.update(video.id, { view_count: (video.view_count || 0) + 1 }).catch(() => {});
  };

  const searchFiltered = searchQuery
    ? mainVideos.filter(v =>
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const categoryFiltered = activeCategory === "All" ? regularVideos
    : activeCategory === "Live" ? regularVideos.filter(v => v.status === "live")
    : activeCategory === "Clips" ? clips
    : regularVideos.filter(v =>
        v.category?.toLowerCase().includes(activeCategory.toLowerCase()) ||
        v.tags?.some(t => t.toLowerCase().includes(activeCategory.toLowerCase()))
      );

  const displayVideos = searchFiltered || (categoryFiltered.length > 0 ? categoryFiltered : regularVideos);
  const showClips = !searchQuery && (activeCategory === "All" || activeCategory === "Clips") && clips.length > 0;
  const trending = [...regularVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4);
  const trendingSet = new Set(trending.map(v => v.id));

  const btnBase = "flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-left transition-all duration-150";
  const btnIdle = "text-blue-400/60 hover:bg-blue-900/20 hover:text-blue-200";
  const btnActive = "bg-[#1e78ff]/15 text-[#1e78ff] border border-[#1e78ff]/25 font-semibold";

  return (
    <div className="min-h-screen bg-[#03080f] text-[#e8f4ff] flex">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`flex flex-col w-52 sm:w-56 flex-shrink-0 fixed top-16 left-0 bottom-0 overflow-y-auto py-4 px-2.5 z-40 border-r border-[#0d2040]/80 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
        style={{ background: "linear-gradient(180deg, #020b14 0%, #03080f 100%)" }}
      >
        {/* Navigation */}
        <div className="space-y-0.5 mb-1">
          {SIDEBAR_NAV.map(item => (
            <Link key={item.label} to={item.to} className={`${btnBase} ${item.label === "Home" ? btnActive : btnIdle}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.label === "Live" && liveStreams.length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Link>
          ))}
        </div>

        <div className="h-px bg-[#0d2040]/80 my-3" />

        {/* Creator Studio CTA */}
        <Link to="/CreatorStudio"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1e78ff]/15 to-[#a855f7]/10 border border-[#1e78ff]/25 text-[#1e78ff] hover:from-[#1e78ff]/25 hover:to-[#a855f7]/15 transition-all mb-1"
        >
          <div className="w-6 h-6 rounded-lg bg-[#1e78ff]/20 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold">Creator Studio</span>
        </Link>

        <div className="h-px bg-[#0d2040]/80 my-3" />

        {/* Library */}
        <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-3 mb-2">Library</p>
        <div className="space-y-0.5">
          {SIDEBAR_LIBRARY.map(item => (
            <Link key={item.label} to={item.to} className={`${btnBase} ${btnIdle}`}>
              <item.icon className="w-4 h-4 flex-shrink-0 text-blue-400/40" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>

        {user?.email && (
          <>
            <div className="h-px bg-[#0d2040]/80 my-3" />
            <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-3 mb-2">Playlists</p>
            <PlaylistsSidebarSection userEmail={user.email} btnBase={btnBase} btnIdle={btnIdle} />
          </>
        )}

        <div className="h-px bg-[#0d2040]/80 my-3" />

        {/* Following */}
        <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-3 mb-2">Following</p>
        {[...subscribedChannelIds].length === 0 ? (
          <p className="text-xs text-blue-400/30 px-3 py-1">Not following anyone yet</p>
        ) : (
          <div className="space-y-0.5">
            {[...subscribedChannelIds].slice(0, showMoreFollowing ? undefined : 5).map(cid => {
              const ch = channelMap[cid];
              if (!ch) return null;
              return (
                <Link key={cid} to={`/Channel?id=${cid}`} className={`${btnBase} ${btnIdle}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-xs font-black">
                      {ch.channel_name?.charAt(0) || "C"}
                    </div>
                    {ch.is_live && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-[#03080f]" />}
                  </div>
                  <span className="text-xs truncate">{ch.channel_name}</span>
                  {ch.is_live && <span className="ml-auto text-xs text-red-400 font-semibold">LIVE</span>}
                </Link>
              );
            })}
            {[...subscribedChannelIds].length > 5 && (
              <button onClick={() => setShowMoreFollowing(!showMoreFollowing)} className={`${btnBase} ${btnIdle} text-xs mt-0.5`}>
                <ChevronDown className={`w-4 h-4 text-blue-400/30 transition-transform ${showMoreFollowing ? "rotate-180" : ""}`} />
                {showMoreFollowing ? "Show less" : `+${[...subscribedChannelIds].length - 5} more`}
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 ml-0 sm:ml-52 md:ml-56 flex">
        <div className="flex-1 min-w-0">

          {/* Sticky top bar */}
          <div className="sticky top-16 z-30 border-b border-[#0d2040]/80 px-4 pt-3 pb-1 space-y-2"
            style={{ background: "rgba(3,8,15,0.97)", backdropFilter: "blur(20px)" }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1">
              <button className="sm:hidden p-2 hover:bg-blue-900/20 rounded-lg mr-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5 text-blue-400" />
              </button>
              {MAIN_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveMainTab(tab)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0 ${
                    activeMainTab === tab
                      ? "bg-[#1e78ff]/15 text-[#1e78ff] border border-[#1e78ff]/25"
                      : "text-blue-400/50 hover:text-blue-300 hover:bg-blue-900/10"
                  }`}
                >
                  {tab}
                  {tab === "Following" && mySubscriptions.length > 0 && (
                    <span className="ml-1.5 text-xs bg-[#1e78ff]/20 text-[#1e78ff] px-1.5 py-0.5 rounded-full">{mySubscriptions.length}</span>
                  )}
                </button>
              ))}

              {/* Search */}
              {activeMainTab === "Home" && (
                <div className={`ml-auto flex items-center gap-2 bg-[#060d18] border ${searchFocused ? "border-[#1e78ff]/50" : "border-[#0d2040]"} rounded-xl px-3 py-1.5 w-48 sm:w-64 transition-all`}>
                  <Search className="w-4 h-4 text-blue-400/40 flex-shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search..."
                    className="flex-1 text-sm text-blue-100 placeholder-blue-400/30 outline-none bg-transparent min-w-0"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-blue-400/40 hover:text-blue-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Category chips */}
            {activeMainTab === "Home" && !searchQuery && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeCategory === cat
                        ? "bg-[#1e78ff] text-white shadow-lg shadow-blue-900/50"
                        : "bg-[#060d18] text-blue-400/60 border border-[#0d2040] hover:bg-[#0d1a2e] hover:text-blue-200 hover:border-blue-800/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Page content */}
          <div className="px-4 pb-24 md:pb-8 mt-5 space-y-8">
            {/* ── HOME ── */}
            {activeMainTab === "Home" && (
              <AnimatePresence mode="wait">
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                  {!searchQuery && activeCategory === "All" && (
                    <>
                      {/* Featured live banner */}
                      {featuredLive && (
                        <FeaturedLiveStream
                          stream={featuredLive}
                          channel={channelMap[featuredLive.id]}
                          onSelect={() => setSelectedVideo(featuredLive)}
                        />
                      )}

                      {/* Quick-access hub */}
                      <HubCards />
                    </>
                  )}

                  {/* Search header */}
                  {searchQuery && (
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="w-4 h-4 text-blue-400/40" />
                      <p className="text-blue-300/80 text-sm">
                        Results for <span className="text-[#e8f4ff] font-semibold">"{searchQuery}"</span>
                        <span className="text-blue-400/40 ml-1">— {displayVideos.length} video{displayVideos.length !== 1 ? "s" : ""}</span>
                      </p>
                    </div>
                  )}

                  {/* Clips row */}
                  {showClips && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#a855f7]/20 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-[#a855f7]" />
                          </div>
                          <h2 className="text-sm font-bold text-[#e8f4ff]">Clips & Shorts</h2>
                          <span className="text-xs text-blue-400/40">{clips.length}</span>
                        </div>
                        <button onClick={() => navigate("/Shorts")} className="text-xs text-[#1e78ff] hover:text-[#00c8ff] font-semibold transition-colors">View all →</button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                        {clips.slice(0, 12).map(v => <ClipCard key={v.id} video={v} onClick={handleOpenVideo} />)}
                      </div>
                    </section>
                  )}

                  {/* Video grid */}
                  {displayVideos.length > 0 ? (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {!searchQuery && activeCategory === "All" && <TrendingUp className="w-4 h-4 text-[#1e78ff]" />}
                          <h2 className="text-sm font-bold text-[#e8f4ff]">
                            {searchQuery ? "Search Results" : activeCategory !== "All" ? activeCategory : "Recommended for You"}
                          </h2>
                          <span className="text-xs text-blue-400/30">{displayVideos.length}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {displayVideos.map((video, i) => {
                          const rank = trending.findIndex(v => v.id === video.id);
                          return (
                            <motion.div key={video.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                              <VideoCard
                                video={video}
                                channel={channelMap[video.channel_id]}
                                onClick={handleOpenVideo}
                                watched={watchHistory.includes(video.id)}
                                isTrending={trendingSet.has(video.id)}
                                rank={rank !== -1 ? rank + 1 : null}
                                user={user}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#060d18] border border-[#0d2040] flex items-center justify-center mb-4">
                        <PlaySquare className="w-7 h-7 text-blue-400/30" />
                      </div>
                      <h3 className="text-[#e8f4ff] font-bold text-lg mb-1">No videos yet</h3>
                      <p className="text-blue-400/40 text-sm mb-5">{searchQuery ? "Try a different search term" : "Be the first to upload something great"}</p>
                      {!searchQuery && (
                        <Link to="/CreatorStudio" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e78ff]/15 border border-[#1e78ff]/30 text-[#1e78ff] text-sm font-semibold hover:bg-[#1e78ff]/25 transition-colors">
                          <PlusCircle className="w-4 h-4" /> Open Creator Studio
                        </Link>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── FOLLOWING TAB ── */}
            {activeMainTab === "Following" && (
              <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {mySubscriptions.length > 0 ? (
                  <>
                    {/* Channel avatars strip */}
                    <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                      {[...subscribedChannelIds].map(cid => {
                        const ch = channelMap[cid];
                        if (!ch) return null;
                        return (
                          <Link key={cid} to={`/Channel?id=${cid}`} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-lg font-black ring-2 ring-transparent group-hover:ring-[#1e78ff]/50 transition-all overflow-hidden">
                              {ch.avatar_url ? <img src={ch.avatar_url} className="w-full h-full object-cover" alt="" /> : ch.channel_name?.charAt(0)}
                            </div>
                            <p className="text-xs text-blue-400/50 truncate max-w-[60px] text-center group-hover:text-blue-300 transition-colors">{ch.channel_name}</p>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {subVideos.map((video, i) => (
                        <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                          <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} user={user} />
                        </motion.div>
                      ))}
                    </div>
                    {subVideos.length === 0 && (
                      <div className="text-center py-16">
                        <p className="text-blue-400/40 text-sm">No new uploads from channels you follow</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#060d18] border border-[#0d2040] flex items-center justify-center mb-4">
                      <Users className="w-7 h-7 text-blue-400/30" />
                    </div>
                    <h3 className="text-[#e8f4ff] font-bold text-lg mb-1">No channels followed</h3>
                    <p className="text-blue-400/40 text-sm">Explore content and follow creators you love</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-l border-[#0d2040]/80 px-4 pb-8 overflow-y-auto space-y-5" style={{ marginTop: "5rem" }}>
          {liveStreams.length > 0 && (
            <LiveSidebar liveChannels={liveStreams} onSelectStream={ch => handleOpenVideo(ch)} />
          )}

          {/* AI advisor panel */}
          <div className="rounded-2xl bg-[#060d18] border border-[#0d2040] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#0d2040]">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#e8f4ff]">VStream AI</p>
                <p className="text-xs text-blue-400/40">Content intelligence</p>
              </div>
            </div>
            <div className="p-4">
              <AIContentAdvisor videos={displayVideos} channels={channels} user={user} />
            </div>
          </div>

          {/* Trending quick list */}
          {trending.length > 0 && (
            <div className="rounded-2xl bg-[#060d18] border border-[#0d2040] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#0d2040]">
                <Flame className="w-4 h-4 text-orange-400" />
                <p className="text-xs font-bold text-[#e8f4ff]">Trending Now</p>
              </div>
              <div className="p-3 space-y-2">
                {trending.map((v, i) => (
                  <button key={v.id} onClick={() => handleOpenVideo(v)} className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-900/15 transition-colors text-left group">
                    <span className="text-xs font-black text-[#1e78ff] w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="w-10 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-[#0a1525]">
                      <img src={v.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=80&h=45&fit=crop&sig=${v.id}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#c8dff5] truncate group-hover:text-white transition-colors">{v.title}</p>
                      <p className="text-xs text-blue-400/40 flex items-center gap-1 mt-0.5">
                        <Eye className="w-3 h-3" /> {formatViews(v.view_count)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          channel={channelMap[selectedVideo.channel_id]}
          relatedVideos={mainVideos}
          channelMap={channelMap}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={(v) => { setSelectedVideo(v); handleOpenVideo(v); }}
        />
      )}
    </div>
  );
}