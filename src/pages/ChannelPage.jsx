import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Share2, Play, ThumbsUp, Users, Eye, MessageSquare, Edit3, Upload, X, Zap, ImageIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import CommunityPosts from "@/components/CommunityPosts";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── Create Channel Form ────────────────────────────────────────────────────────
function CreateChannelForm({ userEmail, onCreated }) {
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (file, type) => {
    if (type === "avatar") setUploadingAvatar(true);
    else setUploadingBanner(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (type === "avatar") { setAvatarUrl(file_url); setUploadingAvatar(false); }
    else { setBannerUrl(file_url); setUploadingBanner(false); }
  };

  const handleCreate = async () => {
    if (!channelName.trim()) { setError("Channel name is required."); return; }
    setCreating(true);
    setError("");
    const response = await base44.functions.invoke("createChannel", {
      channel_name: channelName.trim(),
      description,
    });
    // Update avatar/banner if provided
    const created = response.data?.channel;
    if (created) {
      const updates = {};
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (bannerUrl) updates.banner_url = bannerUrl;
      if (Object.keys(updates).length > 0) {
        await base44.entities.Channel.update(created.id, updates);
      }
    }
    setCreating(false);
    onCreated();
  };

  return (
    <div className="min-h-screen bg-[#03080f] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#060d18] border border-blue-900/40 rounded-2xl w-full max-w-lg overflow-hidden">

        {/* Banner preview */}
        <div className="relative h-32 bg-gradient-to-r from-[#1e78ff]/40 to-[#a855f7]/40 overflow-hidden">
          {bannerUrl && <img src={bannerUrl} className="w-full h-full object-cover" alt="Banner" />}
          <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors group">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], "banner")} />
            <div className="flex flex-col items-center gap-1 text-white/60 group-hover:text-white transition-colors">
              {uploadingBanner ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              <span className="text-xs font-medium">{bannerUrl ? "Change Banner" : "Add Banner (optional)"}</span>
            </div>
          </label>
        </div>

        <div className="px-6 pb-6 -mt-8">
          {/* Avatar */}
          <div className="flex items-end gap-4 mb-5">
            <label className="relative cursor-pointer group flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] border-4 border-[#060d18] flex items-center justify-center overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                  : <span className="text-white text-2xl font-black">{channelName.charAt(0) || "?"}</span>
                }
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], "avatar")} />
            </label>
            <div className="flex-1 min-w-0 pt-8">
              <p className="text-xs text-blue-400/40 mb-1">Profile picture (optional)</p>
              {avatarUrl && <button onClick={() => setAvatarUrl("")} className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Remove</button>}
            </div>
          </div>

          <h2 className="text-xl font-black text-[#e8f4ff] mb-5">Create Your Channel</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-1.5 block">Channel Name *</label>
              <input
                value={channelName}
                onChange={e => { setChannelName(e.target.value); setError(""); }}
                placeholder="e.g. NightStreamCo"
                className="w-full bg-[#0a1525] border border-blue-900/40 focus:border-[#1e78ff]/60 rounded-xl px-4 py-2.5 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none transition-colors"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell viewers what your channel is about..."
                rows={3}
                className="w-full bg-[#0a1525] border border-blue-900/40 focus:border-[#1e78ff]/60 rounded-xl px-4 py-2.5 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none transition-colors resize-none"
              />
            </div>

            <Button onClick={handleCreate} disabled={creating || !channelName.trim()} className="w-full gap-2">
              {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <><Zap className="w-4 h-4" /> Create Channel</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Channel Page ─────────────────────────────────────────────────────────
export default function ChannelPage() {
  const [user, setUser] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [notified, setNotified] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState(() => {
    try { return localStorage.getItem("activeChannelId") || null; } catch { return null; }
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get("id");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Listen for channel switches from TopNav
  useEffect(() => {
    const handler = (e) => setActiveChannelId(e.detail.channelId);
    window.addEventListener("activeChannelChanged", handler);
    return () => window.removeEventListener("activeChannelChanged", handler);
  }, []);

  const { data: channels = [], refetch: refetchChannels } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 60),
    staleTime: 5 * 60 * 1000,
  });

  const myChannels = channels.filter(c => c.creator_email === user?.email);

  // Resolve which channel to show:
  // 1) URL param ?id=... (viewing someone else's or a specific channel)
  // 2) activeChannelId from localStorage (own channel switcher)
  // 3) First own channel fallback
  const channel = channelId
    ? channels.find(c => c.id === channelId)
    : (myChannels.find(c => c.id === activeChannelId) || myChannels[0]);

  const isOwnChannel = channel && user && channel.creator_email === user.email;
  const channelVideos = videos.filter(v => v.channel_id === channel?.id && v.status !== "deleted");
  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

  // Loading state
  if (!user && !channelId) {
    return <div className="min-h-screen bg-[#03080f] flex items-center justify-center"><div className="text-blue-400/40 text-sm">Loading...</div></div>;
  }

  // No channel found — show create form if own channel, else 404
  if (!channel) {
    if (!channelId && user) {
      if (showCreateForm) {
        return (
          <CreateChannelForm
            userEmail={user.email}
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["channels-all"] });
              refetchChannels();
              setShowCreateForm(false);
            }}
          />
        );
      }
      return (
        <div className="min-h-screen bg-[#03080f] flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e78ff]/20 to-[#a855f7]/20 border border-blue-900/40 flex items-center justify-center mx-auto mb-5">
              <Users className="w-9 h-9 text-blue-400/40" />
            </div>
            <h2 className="text-2xl font-black text-[#e8f4ff] mb-2">No channel selected</h2>
            <p className="text-blue-400/50 text-sm mb-6">Create a channel or switch to one using the profile menu.</p>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2 w-full">
              <Zap className="w-4 h-4" /> Create a Channel
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#03080f] flex items-center justify-center p-4">
        <div className="text-center">
          <Users className="w-14 h-14 text-blue-400/20 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#e8f4ff] mb-2">Channel not found</h2>
          <Link to="/"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03080f] text-[#e8f4ff]">
      {/* Banner */}
      <div className="relative h-44 md:h-56 bg-gradient-to-r from-[#1e78ff]/40 to-[#a855f7]/40 overflow-hidden">
        {channel.banner_url && <img src={channel.banner_url} alt="Banner" className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] border-4 border-[#03080f] flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0 shadow-lg">
            {channel.avatar_url
              ? <img src={channel.avatar_url} alt="" className="w-full h-full object-cover" />
              : channel.channel_name?.charAt(0)
            }
          </div>

          {/* Info + Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-[#e8f4ff]">{channel.channel_name}</h1>
                {channel.is_verified && <span className="text-[#1e78ff] text-lg">✓</span>}
              </div>
              <p className="text-blue-400/50 text-sm mt-1">
                {formatCount(channel.subscriber_count)} subscribers · {channelVideos.length} videos
              </p>
              {channel.description && (
                <p className="text-blue-400/50 text-sm mt-1 max-w-xl line-clamp-2">{channel.description}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {isOwnChannel ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to="/CreatorStudio">
                    <Button className="gap-2">
                      <Zap className="w-4 h-4" /> Creator Studio
                    </Button>
                  </Link>
                  <Link to="/CreatorStudio?tab=editchannel">
                    <Button variant="outline" className="gap-2">
                      <Edit3 className="w-4 h-4" /> Edit Channel
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Button onClick={() => setSubscribed(!subscribed)} variant={subscribed ? "outline" : "default"} className="gap-2">
                    {subscribed ? "Subscribed" : "Subscribe"}
                  </Button>
                  {subscribed && (
                    <Button variant="outline" size="icon" onClick={() => setNotified(!notified)} className={notified ? "text-[#1e78ff] border-[#1e78ff]/40" : ""}>
                      <Bell className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon"><Share2 className="w-4 h-4" /></Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Eye, label: "Total Views", value: formatCount(channel.view_count || channelVideos.reduce((s, v) => s + (v.view_count || 0), 0)) },
            { icon: Users, label: "Subscribers", value: formatCount(channel.subscriber_count) },
            { icon: Play, label: "Videos", value: channelVideos.length },
          ].map((s, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-3 text-center">
              <s.icon className="w-4 h-4 text-blue-400/40 mx-auto mb-1" />
              <p className="text-xl font-black text-[#e8f4ff]">{s.value}</p>
              <p className="text-xs text-blue-400/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-900/30 mb-6">
          {[
            { id: "videos", label: "Videos", icon: Play },
            { id: "community", label: "Community", icon: MessageSquare },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-[#1e78ff] text-[#1e78ff]"
                  : "border-transparent text-blue-400/50 hover:text-blue-300"
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Videos tab */}
        {activeTab === "videos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12">
            {channelVideos.length === 0 ? (
              <div className="text-center py-16">
                <Play className="w-12 h-12 text-blue-400/20 mx-auto mb-3" />
                <p className="text-blue-400/40">No videos yet</p>
                {isOwnChannel && (
                  <Link to="/CreatorStudio"><Button className="mt-4">Upload your first video</Button></Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {channelVideos.map((video, i) => (
                  <motion.div key={video.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group cursor-pointer" onClick={() => setSelectedVideo(video)}>
                    <div className="relative aspect-video bg-[#060d18] rounded-xl overflow-hidden mb-2">
                      <img
                        src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${video.id}`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                          <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-transparent border-l-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-[#c8dff5] line-clamp-2 leading-snug">{video.title}</h3>
                    <p className="text-xs text-blue-400/40 mt-0.5">
                      {formatCount(video.view_count)} views · {timeAgo(video.published_date || video.created_date)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Community tab */}
        {activeTab === "community" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl pb-12">
            <CommunityPosts />
          </motion.div>
        )}
      </div>

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          channel={channel}
          relatedVideos={channelVideos}
          channelMap={channelMap}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={setSelectedVideo}
        />
      )}
    </div>
  );
}