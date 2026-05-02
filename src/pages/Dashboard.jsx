import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Flame, Music, Gamepad2, BookOpen, Trophy,
  ThumbsUp, Clock, ListVideo, Download, History,
  PlaySquare, MoreVertical, Search, X, TrendingUp,
  Users, Zap, Star, PlusCircle, BarChart2, Sparkles, Eye,
  Radio, Bookmark, Gift, Coffee, ChevronRight, Bell, Smile,
  Moon, Sun, Swords, Palette, Headphones, Laugh, Brain, Heart,
  Play, Filter, Hash, Volume2, Award, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";
import FeaturedLiveStream from "@/components/dashboard/FeaturedLiveStream";
import SaveToPlaylistMenu from "@/components/dashboard/SaveToPlaylistMenu";
import AIContentAdvisor from "@/components/dashboard/AIContentAdvisor";
import LiveSidebar from "@/components/dashboard/LiveSidebar";

// ─── Mood categories inspired by Twitch's discovery system ───────────────────
const MOODS = [
  { id: "all",       label: "All",        icon: Home },
  { id: "chill",     label: "Chill",      icon: Moon },
  { id: "hype",      label: "Hype",       icon: Zap },
  { id: "gaming",    label: "Gaming",     icon: Gamepad2 },
  { id: "music",     label: "Music",      icon: Headphones },
  { id: "learning",  label: "Learn",      icon: Brain },
  { id: "funny",     label: "Funny",      icon: Laugh },
  { id: "sports",    label: "Sports",     icon: Trophy },
  { id: "art",       label: "Creative",   icon: Palette },
  { id: "social",    label: "Social",     icon: Users },
];

const SIDEBAR_NAV = [
  { icon: Home,       label: "Home",          to: "/" },
  { icon: Flame,      label: "Trending",      to: "/?mood=hype" },
  { icon: Radio,      label: "Live",          to: "/Live" },
  { icon: PlaySquare, label: "Clips",         to: "/Shorts" },
  { icon: Clock,      label: "Watch History", to: "/" },
  { icon: Bookmark,   label: "Saved",         to: "/" },
];

function fmt(n) {
  if (!n) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
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
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── VideoCard ────────────────────────────────────────────────────────────────
function VideoCard({ video, channel, onClick, watched, user, compact = false }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [watchLater, setWatchLater] = useState(() => {
    try { return JSON.parse(localStorage.getItem("watchLater") || "[]").includes(video.id); } catch { return false; }
  });

  const toggleWatchLater = (e) => {
    e.stopPropagation();
    const list = JSON.parse(localStorage.getItem("watchLater") || "[]");
    const next = watchLater ? list.filter(id => id !== video.id) : [...list, video.id];
    localStorage.setItem("watchLater", JSON.stringify(next));
    setWatchLater(!watchLater);
    setShowMenu(false);
  };

  if (compact) {
    return (
      <div className="flex gap-2.5 cursor-pointer group" onClick={() => onClick(video)}>
        <div className="relative w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-[#060d18]">
          <img src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=113&fit=crop&sig=${video.id}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          {video.duration_seconds > 0 && <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded-md">{formatDuration(video.duration_seconds)}</span>}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold text-[#e8f4ff] line-clamp-2 leading-snug">{video.title}</p>
          <p className="text-xs text-blue-400/50 mt-1 truncate">{channel?.channel_name || "Creator"}</p>
          <p className="text-xs text-blue-400/30 mt-0.5">{fmt(video.view_count)} · {timeAgo(video.published_date || video.created_date)}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="group cursor-pointer relative" onClick={() => onClick(video)} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-[#060d18]">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${video.id}`}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {watched && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"><div className="h-full bg-[#1e78ff] w-1/3" /></div>}
        {video.duration_seconds > 0 && <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-lg">{formatDuration(video.duration_seconds)}</span>}
        {video.status === "live" && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE</span>}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Watch later badge */}
        {watchLater && <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-[#1e78ff]/80 flex items-center justify-center"><Clock className="w-3 h-3 text-white" /></div>}

        {/* 3-dot menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-[#060d18] border border-blue-900/40 rounded-xl shadow-xl w-48 py-1 text-sm">
              <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-900/20 text-blue-200 transition-colors" onClick={toggleWatchLater}>
                <Clock className="w-4 h-4" /> {watchLater ? "Remove from Watch Later" : "Watch Later"}
              </button>
              {user?.email && <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-900/20 text-blue-200 transition-colors" onClick={() => { setShowPlaylist(true); setShowMenu(false); }}>
                <ListVideo className="w-4 h-4" /> Save to Playlist
              </button>}
            </div>
          )}
          {showPlaylist && user?.email && <SaveToPlaylistMenu videoId={video.id} userEmail={user.email} onClose={() => setShowPlaylist(false)} />}
        </div>
      </div>

      <div className="flex gap-2.5 px-0.5">
        <Link to={channel ? `/Channel?id=${channel.id}` : "#"} onClick={e => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black ring-2 ring-transparent hover:ring-[#1e78ff]/60 transition-all" style={{ background: "linear-gradient(135deg,#1e78ff,#a855f7)" }}>
            {channel?.channel_name?.charAt(0) || "C"}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#e8f4ff] line-clamp-2 leading-snug mb-0.5">{video.title}</h3>
          <Link to={channel ? `/Channel?id=${channel.id}` : "#"} onClick={e => e.stopPropagation()} className="text-xs text-blue-400/60 hover:text-blue-300 truncate block transition-colors">{channel?.channel_name || "Creator"}</Link>
          <p className="text-xs text-blue-400/40 mt-0.5">{fmt(video.view_count)} views · {timeAgo(video.published_date || video.created_date)}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Clip / Short card ────────────────────────────────────────────────────────
function ClipCard({ video, onClick }) {
  return (
    <div className="group cursor-pointer flex-shrink-0 w-36 sm:w-40" onClick={() => onClick(video)}>
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-2 bg-[#060d18]">
        <img src={video.thumbnail_url || `https://images.unsplash.com/photo-1536240478700-b869ad10a2ab?w=200&h=356&fit=crop&sig=${video.id}`} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <p className="absolute bottom-3 left-3 right-3 text-xs text-white font-semibold line-clamp-2 leading-tight">{video.title}</p>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>
      <p className="text-xs text-blue-400/50 px-1 truncate">{fmt(video.view_count)} views</p>
    </div>
  );
}

// ─── Watch Party Banner (Twitch Squad Stream style) ───────────────────────────
function WatchPartyBanner({ onStart }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#a855f7]/15 via-[#1e78ff]/10 to-[#06b6d4]/10 border border-[#a855f7]/25 p-5 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#a855f7]/20 flex items-center justify-center flex-shrink-0 border border-[#a855f7]/30">
            <Users className="w-5 h-5 text-[#a855f7]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#e8f4ff]">Watch Party</p>
            <p className="text-xs text-blue-400/50">Watch videos together with friends in sync</p>
          </div>
        </div>
        <button onClick={onStart} className="flex items-center gap-2 bg-[#a855f7]/20 hover:bg-[#a855f7]/30 border border-[#a855f7]/40 text-[#a855f7] text-xs font-bold px-4 py-2 rounded-xl transition-all flex-shrink-0">
          <Zap className="w-3.5 h-3.5" /> Start Party
        </button>
      </div>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#a855f7]/5 blur-2xl pointer-events-none" />
    </div>
  );
}

// ─── Subscription Channel Strip ───────────────────────────────────────────────
function SubStrip({ subscriptions, channelMap, onChannelClick }) {
  if (subscriptions.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-3 mb-6 scrollbar-hide">
      {subscriptions.slice(0, 12).map(sub => {
        const ch = channelMap[sub.channel_id];
        if (!ch) return null;
        return (
          <Link key={sub.channel_id} to={`/Channel?id=${sub.channel_id}`} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-lg font-black ring-2 ring-transparent group-hover:ring-[#1e78ff]/50 transition-all overflow-hidden">
                {ch.avatar_url ? <img src={ch.avatar_url} className="w-full h-full object-cover" alt="" /> : ch.channel_name?.charAt(0)}
              </div>
              {ch.is_live && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">LIVE</span>}
            </div>
            <p className="text-xs text-blue-400/50 truncate max-w-[60px] text-center group-hover:text-blue-300 transition-colors">{ch.channel_name}</p>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Gift Drop Banner (Twitch-style drops) ────────────────────────────────────
function DropsBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("dropsBannerDismissed") === "1");
  if (dismissed) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#f59e0b]/15 to-[#f97316]/10 border border-[#f59e0b]/25 p-4 mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center flex-shrink-0">
            <Gift className="w-4.5 h-4.5 text-[#f59e0b]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#e8f4ff]">🎁 Drops Active</p>
            <p className="text-xs text-blue-400/50">Watch live streams to earn exclusive channel rewards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/Live" className="text-xs font-bold text-[#f59e0b] hover:text-[#fbbf24] transition-colors whitespace-nowrap">Watch Now →</Link>
          <button onClick={() => { setDismissed(true); localStorage.setItem("dropsBannerDismissed","1"); }} className="text-blue-400/30 hover:text-blue-300 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mood Picker Row ──────────────────────────────────────────────────────────
function MoodRow({ activeMood, setActiveMood }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
      {MOODS.map(m => {
        const Icon = m.icon;
        const active = activeMood === m.id;
        return (
          <button key={m.id} onClick={() => setActiveMood(m.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all border ${
              active ? "bg-[#1e78ff] text-white border-[#1e78ff] shadow-lg shadow-blue-900/40" : "bg-[#060d18] text-blue-400/60 border-[#0d2040] hover:bg-[#0d1a2e] hover:text-blue-200"
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home"); // home | following | watchlater
  const [activeMood, setActiveMood] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [watchHistory, setWatchHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("watchHistory") || "[]"); } catch { return []; } });
  const [watchLater, setWatchLater] = useState(() => { try { return JSON.parse(localStorage.getItem("watchLater") || "[]"); } catch { return []; } });
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Sync watchLater from localStorage on tab focus
  useEffect(() => {
    const sync = () => { try { setWatchLater(JSON.parse(localStorage.getItem("watchLater") || "[]")); } catch {} };
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 80),
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
  const liveChannels = channels.filter(c => c.is_live);
  const featuredLive = liveChannels[0];

  const mainVideos = videos.filter(v => v.status !== "deleted" && v.status !== "uploading");
  const clips = mainVideos.filter(v => v.duration_seconds > 0 && v.duration_seconds < 90);
  const regularVideos = mainVideos.filter(v => !v.duration_seconds || v.duration_seconds >= 60);

  // Mood filtering
  const moodKeywords = {
    chill: ["chill", "relax", "lofi", "calm", "sleep", "ambient", "study"],
    hype: ["hype", "epic", "insane", "crazy", "highlight", "gaming", "clutch", "wins"],
    gaming: ["gaming", "game", "gameplay", "let's play", "playthrough", "esports", "fortnite", "minecraft"],
    music: ["music", "song", "cover", "beat", "dj", "concert", "remix", "playlist"],
    learning: ["tutorial", "how to", "learn", "guide", "tips", "explained", "course", "education"],
    funny: ["funny", "meme", "comedy", "laugh", "joke", "roast", "prank", "fail"],
    sports: ["sports", "nfl", "nba", "soccer", "football", "basketball", "highlights", "match"],
    art: ["art", "drawing", "design", "animation", "creative", "painting", "digital", "vfx"],
    social: ["vlog", "irl", "reaction", "collab", "podcast", "interview", "stream"],
  };

  const filterByMood = (vids) => {
    if (activeMood === "all") return vids;
    const keywords = moodKeywords[activeMood] || [];
    return vids.filter(v =>
      keywords.some(kw =>
        v.title?.toLowerCase().includes(kw) ||
        v.description?.toLowerCase().includes(kw) ||
        v.category?.toLowerCase().includes(kw) ||
        v.tags?.some(t => t.toLowerCase().includes(kw))
      )
    );
  };

  const moodFiltered = filterByMood(regularVideos);
  const displayVideos = searchQuery
    ? mainVideos.filter(v => v.title?.toLowerCase().includes(searchQuery.toLowerCase()) || v.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : moodFiltered.length > 0 ? moodFiltered : regularVideos;

  const trending = [...regularVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6);
  const subVideos = regularVideos.filter(v => subscribedChannelIds.has(v.channel_id)).sort((a, b) => new Date(b.published_date || b.created_date) - new Date(a.published_date || a.created_date));
  const watchLaterVideos = mainVideos.filter(v => watchLater.includes(v.id));
  const continueWatching = mainVideos.filter(v => watchHistory.slice(0, 10).includes(v.id));

  const handleOpenVideo = useCallback((video) => {
    setSelectedVideo(video);
    const newHistory = [video.id, ...watchHistory.filter(id => id !== video.id)].slice(0, 50);
    setWatchHistory(newHistory);
    localStorage.setItem("watchHistory", JSON.stringify(newHistory));
    base44.entities.Video.update(video.id, { view_count: (video.view_count || 0) + 1 }).catch(() => {});
  }, [watchHistory]);

  const TABS = [
    { id: "home",      label: "Home" },
    { id: "following", label: "Following", badge: mySubscriptions.length },
    { id: "watchlater",label: "Watch Later", badge: watchLater.length },
  ];

  return (
    <div className="min-h-screen bg-[#03080f] text-[#e8f4ff] flex">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="hidden sm:flex flex-col w-52 md:w-56 flex-shrink-0 fixed top-16 left-0 bottom-0 overflow-y-auto py-4 px-2.5 z-40 border-r border-[#0d2040]/80"
        style={{ background: "linear-gradient(180deg,#020b14 0%,#03080f 100%)" }}>
        <div className="space-y-0.5 mb-3">
          {SIDEBAR_NAV.map(item => (
            <Link key={item.label} to={item.to} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-blue-400/60 hover:bg-blue-900/20 hover:text-blue-200 transition-all w-full">
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="h-px bg-[#0d2040]/80 my-3" />

        <Link to="/Channel" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1e78ff]/15 to-[#a855f7]/10 border border-[#1e78ff]/25 text-[#1e78ff] hover:from-[#1e78ff]/25 transition-all mb-3">
          <PlusCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-bold">My Channel</span>
        </Link>

        <div className="h-px bg-[#0d2040]/80 my-3" />

        {/* Following list */}
        <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-3 mb-2">Following</p>
        {[...subscribedChannelIds].length === 0 ? (
          <p className="text-xs text-blue-400/20 px-3 py-1">Not following anyone</p>
        ) : (
          <div className="space-y-0.5">
            {[...subscribedChannelIds].slice(0, 8).map(cid => {
              const ch = channelMap[cid];
              if (!ch) return null;
              return (
                <Link key={cid} to={`/Channel?id=${cid}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-400/60 hover:bg-blue-900/20 hover:text-blue-200 transition-all">
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-xs font-black">
                      {ch.channel_name?.charAt(0)}
                    </div>
                    {ch.is_live && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-[#03080f]" />}
                  </div>
                  <span className="text-xs truncate">{ch.channel_name}</span>
                  {ch.is_live && <span className="ml-auto text-xs text-red-400 font-bold">LIVE</span>}
                </Link>
              );
            })}
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="flex-1 min-w-0 sm:ml-52 md:ml-56 flex">
        <div className="flex-1 min-w-0">

          {/* Sticky top bar */}
          <div className="sticky top-16 z-30 border-b border-[#0d2040]/80 px-4 pt-3 pb-1 space-y-2"
            style={{ background: "rgba(3,8,15,0.97)", backdropFilter: "blur(20px)" }}>

            {/* Tabs + Search */}
            <div className="flex items-center gap-1 flex-wrap">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    activeTab === tab.id
                      ? "bg-[#1e78ff]/15 text-[#1e78ff] border border-[#1e78ff]/25"
                      : "text-blue-400/50 hover:text-blue-300 hover:bg-blue-900/10"
                  }`}>
                  {tab.label}
                  {tab.badge > 0 && <span className="text-xs bg-[#1e78ff]/20 text-[#1e78ff] px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
                </button>
              ))}

              <div className={`ml-auto flex items-center gap-2 bg-[#060d18] border ${searchFocused ? "border-[#1e78ff]/50" : "border-[#0d2040]"} rounded-xl px-3 py-1.5 w-48 sm:w-64 transition-all`}>
                <Search className="w-4 h-4 text-blue-400/40 flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search..." className="flex-1 text-sm text-blue-100 placeholder-blue-400/30 outline-none bg-transparent min-w-0" />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="text-blue-400/40 hover:text-blue-300"><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>

            {/* Mood row — only on Home */}
            {activeTab === "home" && !searchQuery && <MoodRow activeMood={activeMood} setActiveMood={setActiveMood} />}
          </div>

          {/* ── HOME TAB ───────────────────────────────────────── */}
          <div className="px-4 pb-24 md:pb-8 mt-5 space-y-8">
            {activeTab === "home" && (
              <AnimatePresence mode="wait">
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                  {!searchQuery && activeMood === "all" && (
                    <>
                      {/* Drops banner */}
                      <DropsBanner />

                      {/* Featured Live */}
                      {featuredLive && (
                        <FeaturedLiveStream stream={featuredLive} channel={channelMap[featuredLive.id]} onSelect={() => handleOpenVideo(featuredLive)} />
                      )}

                      {/* Watch Party CTA */}
                      <WatchPartyBanner onStart={() => setShowWatchPartyModal(true)} />

                      {/* Subscriptions strip */}
                      {mySubscriptions.length > 0 && <SubStrip subscriptions={mySubscriptions} channelMap={channelMap} />}

                      {/* Continue Watching */}
                      {continueWatching.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-3">
                            <History className="w-4 h-4 text-blue-400/60" />
                            <h2 className="text-sm font-bold text-[#e8f4ff]">Continue Watching</h2>
                          </div>
                          <div className="space-y-3">
                            {continueWatching.slice(0, 3).map(v => <VideoCard key={v.id} video={v} channel={channelMap[v.channel_id]} onClick={handleOpenVideo} watched compact user={user} />)}
                          </div>
                        </section>
                      )}
                    </>
                  )}

                  {/* Search header */}
                  {searchQuery && (
                    <p className="text-blue-300/80 text-sm mb-4">Results for <span className="text-[#e8f4ff] font-semibold">"{searchQuery}"</span> — {displayVideos.length} video{displayVideos.length !== 1 ? "s" : ""}</p>
                  )}

                  {/* Clips row */}
                  {!searchQuery && clips.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#a855f7]" />
                          <h2 className="text-sm font-bold text-[#e8f4ff]">Shorts & Clips</h2>
                          <span className="text-xs text-blue-400/40">{clips.length}</span>
                        </div>
                        <button onClick={() => navigate("/Shorts")} className="text-xs text-[#1e78ff] hover:text-[#00c8ff] font-semibold transition-colors">View all →</button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                        {clips.slice(0, 12).map(v => <ClipCard key={v.id} video={v} onClick={handleOpenVideo} />)}
                      </div>
                    </section>
                  )}

                  {/* Main video grid */}
                  {displayVideos.length > 0 ? (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        {activeMood !== "all" && !searchQuery && (
                          <span className="text-xs font-bold uppercase tracking-widest text-[#1e78ff] bg-[#1e78ff]/10 border border-[#1e78ff]/20 px-2 py-0.5 rounded-lg">
                            {MOODS.find(m => m.id === activeMood)?.label}
                          </span>
                        )}
                        <h2 className="text-sm font-bold text-[#e8f4ff]">
                          {searchQuery ? "Search Results" : activeMood !== "all" ? "Matching Videos" : "Recommended for You"}
                        </h2>
                        <span className="text-xs text-blue-400/30">{displayVideos.length}</span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {displayVideos.map((video, i) => (
                          <motion.div key={video.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                            <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} user={user} />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#060d18] border border-[#0d2040] flex items-center justify-center mb-4">
                        <PlaySquare className="w-7 h-7 text-blue-400/30" />
                      </div>
                      <h3 className="text-[#e8f4ff] font-bold text-lg mb-1">{searchQuery ? "No results found" : "No videos in this mood"}</h3>
                      <p className="text-blue-400/40 text-sm mb-5">{searchQuery ? "Try different keywords" : "Try another mood or explore all"}</p>
                      {activeMood !== "all" && <button onClick={() => setActiveMood("all")} className="text-sm text-[#1e78ff] hover:text-[#00c8ff] font-semibold">Browse all videos</button>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── FOLLOWING TAB ─────────────────────────────────── */}
            {activeTab === "following" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {mySubscriptions.length > 0 ? (
                  <>
                    <SubStrip subscriptions={mySubscriptions} channelMap={channelMap} />
                    {subVideos.length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {subVideos.map((video, i) => (
                          <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                            <VideoCard video={video} channel={channelMap[video.channel_id]} onClick={handleOpenVideo} watched={watchHistory.includes(video.id)} user={user} />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16"><p className="text-blue-400/40 text-sm">No new uploads from channels you follow</p></div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#060d18] border border-[#0d2040] flex items-center justify-center mb-4">
                      <UserPlus className="w-7 h-7 text-blue-400/30" />
                    </div>
                    <h3 className="text-[#e8f4ff] font-bold text-lg mb-1">No channels followed</h3>
                    <p className="text-blue-400/40 text-sm">Explore content and follow creators you love</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── WATCH LATER TAB ───────────────────────────────── */}
            {activeTab === "watchlater" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1e78ff]" />
                    <h2 className="text-sm font-bold text-[#e8f4ff]">Watch Later</h2>
                    <span className="text-xs text-blue-400/40">{watchLaterVideos.length} saved</span>
                  </div>
                  {watchLaterVideos.length > 0 && (
                    <button onClick={() => { localStorage.removeItem("watchLater"); setWatchLater([]); }} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Clear all</button>
                  )}
                </div>
                {watchLaterVideos.length > 0 ? (
                  <div className="space-y-4">
                    {watchLaterVideos.map(v => <VideoCard key={v.id} video={v} channel={channelMap[v.channel_id]} onClick={handleOpenVideo} compact user={user} />)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#060d18] border border-[#0d2040] flex items-center justify-center mb-4">
                      <Clock className="w-7 h-7 text-blue-400/30" />
                    </div>
                    <h3 className="text-[#e8f4ff] font-bold text-lg mb-1">Nothing saved yet</h3>
                    <p className="text-blue-400/40 text-sm">Hover a video and click ⋯ → Watch Later</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-l border-[#0d2040]/80 px-4 pb-8 overflow-y-auto space-y-5" style={{ marginTop: "5rem" }}>

          {/* Live channels */}
          {liveChannels.length > 0 && (
            <LiveSidebar liveChannels={liveChannels.map(c => ({ ...c, viewers: Math.floor(Math.random() * 5000) + 100 }))} onSelectStream={ch => handleOpenVideo(ch)} />
          )}

          {/* AI "What to Watch" */}
          <div className="rounded-2xl bg-[#060d18] border border-[#0d2040] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#0d2040]">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#1e78ff] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#e8f4ff]">What to Watch</p>
                <p className="text-xs text-blue-400/40">AI-powered picks</p>
              </div>
            </div>
            <div className="p-4">
              <AIContentAdvisor videos={displayVideos} channels={channels} user={user} />
            </div>
          </div>

          {/* Trending now quick list */}
          {trending.length > 0 && (
            <div className="rounded-2xl bg-[#060d18] border border-[#0d2040] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#0d2040]">
                <TrendingUp className="w-4 h-4 text-orange-400" />
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
                      <p className="text-xs text-blue-400/40 flex items-center gap-1 mt-0.5"><Eye className="w-3 h-3" /> {fmt(v.view_count)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="rounded-2xl bg-[#060d18] border border-[#0d2040] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#0d2040]">
              <PlaySquare className="w-4 h-4 text-[#1e78ff]" />
              <p className="text-xs font-bold text-[#e8f4ff]">Clips</p>
            </div>
            <div className="p-3 space-y-1">
              {[
                { label: "View My Channel", to: "/Channel", icon: Star, color: "text-yellow-400" },
                { label: "Browse Live", to: "/Live", icon: Radio, color: "text-red-400" },
                { label: "My Clips", to: "/Shorts", icon: BarChart2, color: "text-green-400" },
              ].map(a => (
                <Link key={a.label} to={a.to} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-blue-900/15 transition-colors group">
                  <a.icon className={`w-4 h-4 flex-shrink-0 ${a.color}`} />
                  <span className="text-xs text-blue-300/60 group-hover:text-blue-200 transition-colors">{a.label}</span>
                  <ChevronRight className="w-3 h-3 text-blue-400/20 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Watch Party Modal */}
      <AnimatePresence>
        {showWatchPartyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowWatchPartyModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 w-full max-w-sm relative">
              <button onClick={() => setShowWatchPartyModal(false)} className="absolute top-3 right-3 text-blue-400/40 hover:text-blue-300"><X className="w-4 h-4" /></button>
              <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#a855f7]" />
              </div>
              <h3 className="text-center text-lg font-black text-[#e8f4ff] mb-1">Watch Party</h3>
              <p className="text-center text-sm text-blue-400/50 mb-5">Invite friends to watch videos together in real-time sync.</p>
              <div className="bg-[#0a1525] border border-blue-900/30 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-400/40 mb-1">Party Link</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#1e78ff] font-mono flex-1 truncate">vstream.app/party/{Math.random().toString(36).slice(2,8)}</p>
                  <button className="text-xs bg-[#1e78ff]/20 text-[#1e78ff] px-2 py-1 rounded-lg hover:bg-[#1e78ff]/30 transition-colors">Copy</button>
                </div>
              </div>
              <p className="text-center text-xs text-blue-400/30">Coming soon — share the link with friends!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          channel={channelMap[selectedVideo.channel_id]}
          relatedVideos={mainVideos}
          channelMap={channelMap}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={v => { setSelectedVideo(v); handleOpenVideo(v); }}
        />
      )}
    </div>
  );
}