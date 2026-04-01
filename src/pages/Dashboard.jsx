import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Flame, Music, Gamepad2, Tv, Radio, BookOpen, Trophy,
  ChevronDown, ThumbsUp, Clock, ListVideo, Download, History,
  PlaySquare, ShoppingBag, MoreVertical, Search, X, TrendingUp,
  Users, Zap, Star, PlusCircle, Compass
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import AIContentAdvisor from "@/components/dashboard/AIContentAdvisor";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";
import FeaturedLiveStream from "@/components/dashboard/FeaturedLiveStream";
import ExploreCategories from "@/components/dashboard/ExploreCategories";
import LiveSidebar from "@/components/dashboard/LiveSidebar";

const CATEGORIES = ["All", "Gaming", "Music", "Live", "Mixes", "Reaction videos", "Simulation", "Minecraft", "Anime", "Shorts", "Mods", "Tutorials"];
const MAIN_TABS = ["Home", "Subscriptions", "Discover"];

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Home", active: true },
  { icon: Flame, label: "Trending" },
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
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function formatDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function VideoCard({ video, channel, onClick, watched }) {
  return (
    <div className="group cursor-pointer" onClick={() => onClick(video)}>
      <div className="relative aspect-video bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden mb-2">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {watched && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400 dark:bg-zinc-600">
            <div className="h-full bg-red-600 w-1/3" />
          </div>
        )}
        {video.duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
        {video.status === "live" && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">● LIVE</span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3">
            <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-l-[18px] border-transparent border-l-white ml-1" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link to={channel ? `/Channel?id=${channel.id}` : "#"} onClick={e => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-indigo-400 transition-all">
            {channel?.channel_name?.charAt(0) || "C"}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">{video.title}</h3>
          <Link to={channel ? `/Channel?id=${channel.id}` : "#"} onClick={e => e.stopPropagation()} className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate hover:underline block">{channel?.channel_name || "Creator"}</Link>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{formatViews(video.view_count)} views · {timeAgo(video.published_date || video.created_date)}</p>
        </div>
        <button className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white p-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ShortCard({ video, onClick }) {
  return (
    <div className="group cursor-pointer flex-shrink-0 w-32 sm:w-36 md:w-40" onClick={() => onClick(video)}>
      <div className="relative aspect-[9/16] bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden mb-2">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1536240478700-b869ad10a2ab?w=200&h=356&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium line-clamp-2 leading-tight">{video.title}</p>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 rounded-full p-2">
            <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-transparent border-l-white ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-zinc-400 px-1 truncate">{formatViews(video.view_count)} views</p>
    </div>
  );
}

function HubCards() {
  const cards = [
    { to: "/Live", icon: Radio, label: "Live", desc: "Watch live streams", color: "from-red-500 to-orange-500", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" },
    { to: "/Shorts", icon: Zap, label: "Shorts", desc: "Quick vertical videos", color: "from-pink-500 to-purple-600", bg: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900" },
    { to: "/Channel", icon: Users, label: "My Channel", desc: "Your public channel", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900" },
    { to: "/StreamerDashboard", icon: Star, label: "Go Live", desc: "Start streaming now", color: "from-purple-500 to-violet-600", bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((c) => (
        <Link key={c.to} to={c.to}>
          <motion.div whileHover={{ scale: 1.03 }} className={`rounded-2xl border p-4 cursor-pointer transition-shadow hover:shadow-md ${c.bg}`}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">{c.label}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{c.desc}</p>
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
  const [showMoreSubs, setShowMoreSubs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
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
  const shorts = mainVideos.filter(v => v.duration_seconds > 0 && v.duration_seconds < 90);
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
    : activeCategory === "Shorts" ? shorts
    : regularVideos.filter(v =>
        v.category?.toLowerCase().includes(activeCategory.toLowerCase()) ||
        v.tags?.some(t => t.toLowerCase().includes(activeCategory.toLowerCase()))
      );

  const displayVideos = searchFiltered || (categoryFiltered.length > 0 ? categoryFiltered : regularVideos);
  const showShorts = !searchQuery && (activeCategory === "All" || activeCategory === "Shorts") && shorts.length > 0;
  const trending = [...regularVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4);

  const sidebarBtnBase = "flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-left transition-colors";
  const sidebarBtnIdle = "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white";
  const sidebarBtnActive = "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white flex">
      {/* Sidebar */}
      <aside className="flex flex-col w-48 sm:w-56 flex-shrink-0 fixed top-16 left-0 bottom-0 overflow-y-auto bg-white dark:bg-zinc-950 py-3 px-2 z-40 border-r border-gray-200 dark:border-zinc-900">
        {SIDEBAR_ITEMS.map(item => (
          <button key={item.label} className={`${sidebarBtnBase} ${item.active ? sidebarBtnActive : sidebarBtnIdle}`}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </button>
        ))}
        <Link to="/Live" className={`${sidebarBtnBase} ${sidebarBtnIdle}`}>
          <Radio className="w-5 h-5 flex-shrink-0 text-red-500" /> Live
        </Link>
        <button onClick={() => navigate("/Shorts")} className={`${sidebarBtnBase} ${sidebarBtnIdle}`}>
          <PlaySquare className="w-5 h-5 flex-shrink-0" /> Shorts
        </button>
        <Link to="/Channel" className={`${sidebarBtnBase} ${sidebarBtnIdle}`}>
          <Users className="w-5 h-5 flex-shrink-0" /> My Channel
        </Link>

        <hr className="border-gray-200 dark:border-zinc-800 my-3" />
        <Link to="/CreatorStudio" className={`${sidebarBtnBase} bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:from-cyan-500/20 hover:to-blue-500/20`}>
          <PlusCircle className="w-5 h-5 flex-shrink-0" /> Creator Studio
        </Link>

        <hr className="border-gray-200 dark:border-zinc-800 my-3" />
        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-1">You</p>
        {SIDEBAR_YOU.map(item => (
          <button key={item.label} className={`${sidebarBtnBase} ${sidebarBtnIdle}`}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </button>
        ))}

        <hr className="border-gray-200 dark:border-zinc-800 my-3" />
        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-1">Subscriptions</p>
        {(showMoreSubs ? MOCK_SUBSCRIPTIONS : MOCK_SUBSCRIPTIONS.slice(0, 4)).map(sub => (
          <button key={sub.name} className={`${sidebarBtnBase} ${sidebarBtnIdle}`}>
            <div className={`w-6 h-6 rounded-full ${sub.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{sub.avatar}</div>
            <span className="truncate text-xs">{sub.name}</span>
          </button>
        ))}
        <button onClick={() => setShowMoreSubs(!showMoreSubs)} className={`${sidebarBtnBase} ${sidebarBtnIdle} text-xs`}>
          <ChevronDown className={`w-4 h-4 transition-transform ${showMoreSubs ? "rotate-180" : ""}`} />
          {showMoreSubs ? "Show less" : "Show more"}
        </button>

        <hr className="border-gray-200 dark:border-zinc-800 my-3" />
        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-1">Explore</p>
        {EXPLORE_ITEMS.map(item => (
          <button key={item.label} className={`${sidebarBtnBase} ${sidebarBtnIdle}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 ml-48 sm:ml-56 flex">
        <div className="flex-1 min-w-0">
          {/* Sticky bar */}
          <div className="sticky top-16 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-900 px-3 sm:px-4 pt-2 pb-1 space-y-2">
            {/* Main tabs */}
            <div className="flex gap-5 overflow-x-auto scrollbar-hide">
              {MAIN_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveMainTab(tab)}
                  className={`text-sm font-semibold pb-2 border-b-2 flex-shrink-0 transition-colors ${
                    activeMainTab === tab
                      ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                      : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab}
                  {tab === "Subscriptions" && mySubscriptions.length > 0 && (
                    <span className="ml-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">{mySubscriptions.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search + category chips — only on Home tab */}
            {activeMainTab === "Home" && (
              <>
                <div className={`flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 border ${searchFocused ? "border-gray-400 dark:border-zinc-500" : "border-gray-200 dark:border-zinc-800"} rounded-full px-3 py-1.5 max-w-xl transition-colors`}>
                  <Search className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search videos..."
                    className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!searchQuery && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          activeCategory === cat
                            ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-3 sm:px-4 pb-20 md:pb-8 space-y-8 mt-4">

            {/* ── HOME TAB ── */}
            {activeMainTab === "Home" && (
              <>
                {!searchQuery && activeCategory === "All" && (
                  <>
                    {featuredLive && <FeaturedLiveStream stream={featuredLive} channel={channelMap[featuredLive.id]} onSelect={() => { setSelectedStream(featuredLive); }} />}
                    <ExploreCategories onCategorySelect={cat => { setActiveCategory(cat); }} />
                    <HubCards />
                  </>
                )}

                {searchQuery && (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400 dark:text-zinc-400" />
                    <p className="text-gray-600 dark:text-zinc-300 text-sm">Results for <span className="text-gray-900 dark:text-white font-semibold">"{searchQuery}"</span> — {displayVideos.length} video{displayVideos.length !== 1 ? "s" : ""}</p>
                  </div>
                )}

                {/* Trending row */}
                {!searchQuery && activeCategory === "All" && trending.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-red-500" />
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">Trending Now</h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      {trending.map((video, i) => (
                        <div key={video.id} className="relative">
                          <span className="absolute -top-1 -left-1 z-10 w-6 h-6 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center">{i + 1}</span>
                          <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Shorts */}
                {showShorts && (
                  <section>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-red-600 rounded-sm flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-black">▶</span>
                        </div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Shorts</h2>
                      </div>
                      <Link to="/Shorts" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">See all →</Link>
                    </div>
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3">
                      {shorts.slice(0, 10).map(v => <ShortCard key={v.id} video={v} onClick={handleOpenVideo} />)}
                    </div>
                  </section>
                )}

                {/* Video grid */}
                {displayVideos.length > 0 ? (
                  <section>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      {searchQuery ? "Search Results" : activeCategory !== "All" ? activeCategory : "All Videos"}
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                      {displayVideos.map((video, i) => (
                        <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                          <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <PlaySquare className="w-12 h-12 text-gray-300 dark:text-zinc-700 mb-3" />
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No videos found</h3>
                    <p className="text-gray-500 dark:text-zinc-500 text-sm mb-4">{searchQuery ? "Try a different search" : "Be the first to upload a video!"}</p>
                    {!searchQuery && (
                      <Link to="/CreatorStudio" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                        <PlusCircle className="w-4 h-4" /> Go to Creator Studio
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── DISCOVER TAB ── */}
            {activeMainTab === "Discover" && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Compass className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discover Content</h2>
                </div>
                <ExploreCategories onCategorySelect={cat => { setActiveCategory(cat); setActiveMainTab("Home"); }} />
                {/* Popular videos grid */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trending Videos</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                    {mainVideos.slice(0, 12).map((video, i) => (
                      <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                        <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTIONS TAB ── */}
            {activeMainTab === "Subscriptions" && (
              <div>
                {mySubscriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users className="w-12 h-12 text-gray-300 dark:text-zinc-700 mb-3" />
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No subscriptions yet</h3>
                    <p className="text-gray-500 dark:text-zinc-500 text-sm mb-4">Follow channels to see their latest videos here.</p>
                    <Link to="/Channel" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">Browse channels →</Link>
                  </div>
                ) : subVideos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <PlaySquare className="w-12 h-12 text-gray-300 dark:text-zinc-700 mb-3" />
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No videos from subscriptions</h3>
                    <p className="text-gray-500 dark:text-zinc-500 text-sm">The channels you follow haven't uploaded anything yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Subscribed channels avatar row */}
                    <div className="flex gap-4 overflow-x-auto pb-3 mb-6 scrollbar-hide">
                      {[...subscribedChannelIds].map(cid => {
                        const ch = channelMap[cid];
                        if (!ch) return null;
                        return (
                          <Link key={cid} to={`/Channel?id=${cid}`} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold ring-2 ring-indigo-300 dark:ring-indigo-700 overflow-hidden">
                              {ch.avatar_url ? <img src={ch.avatar_url} className="w-full h-full object-cover" alt="" /> : ch.channel_name?.charAt(0)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 truncate max-w-[60px] text-center">{ch.channel_name}</p>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                      {subVideos.map((video, i) => (
                        <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                          <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar — Live + AI */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-72 flex-shrink-0 border-l border-gray-200 dark:border-zinc-800 px-3 xl:px-4 pb-8 overflow-y-auto space-y-4" style={{ marginTop: "5rem" }}>
          {/* Live sidebar */}
          {liveStreams.length > 0 && <LiveSidebar liveChannels={liveStreams} onSelectStream={setSelectedStream} />}
          
          {/* AI Advisor */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                <span className="text-black font-black text-xs">P</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Planify AI</span>
            </div>
            <AIContentAdvisor videos={displayVideos} channels={channels} user={user} />
          </div>
        </aside>
      </main>

      {/* Video Player Modal */}
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